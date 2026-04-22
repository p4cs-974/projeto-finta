#!/usr/bin/env node
import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CLI_PACKAGE_JSON = "apps/cli/package.json";

const esc = "\x1b[";
const c = {
  brand: (text) => `${esc}1;36m${text}${esc}0m`,
  heading: (text) => `${esc}1m${text}${esc}0m`,
  code: (text) => `${esc}36m${text}${esc}0m`,
  success: (text) => `${esc}32m${text}${esc}0m`,
  tip: (text) => `${esc}33m${text}${esc}0m`,
  error: (text) => `${esc}31m${text}${esc}0m`,
  dim: (text) => `${esc}2m${text}${esc}0m`,
};

function parseVersion(version) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    throw new Error(`Invalid version format: ${version}`);
  }
  return [parts[0], parts[1], parts[2]];
}

function bumpVersion(version, type) {
  const [major, minor, patch] = parseVersion(version);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

async function readCliVersion() {
  const content = await readFile(CLI_PACKAGE_JSON, "utf-8");
  const pkg = JSON.parse(content);
  if (typeof pkg.version !== "string") {
    throw new Error(`Missing version in ${CLI_PACKAGE_JSON}`);
  }
  return pkg.version;
}

async function writeCliVersion(version) {
  const content = await readFile(CLI_PACKAGE_JSON, "utf-8");
  const pkg = JSON.parse(content);
  pkg.version = version;
  await writeFile(CLI_PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n");
}

async function prompt(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function confirm(message, autoYes) {
  if (autoYes) return true;
  const answer = await prompt(`${message} ${c.dim("[y/N]")} `);
  return answer.toLowerCase() === "y";
}

async function runCommand(label, cmd, args, dryRun) {
  console.log(`\n${c.heading("▶ " + label)}`);
  if (dryRun) {
    console.log(`  ${c.dim("[DRY RUN]")} ${cmd} ${args.join(" ")}`);
    return;
  }

  const { stdout: out, stderr: err } = await execFileAsync(cmd, args, {
    cwd: process.cwd(),
    env: process.env,
  });

  if (out) process.stdout.write(out);
  if (err) process.stderr.write(err);
}

function parseArgs(argv) {
  let bumpType;
  let dryRun = false;
  let yes = false;

  for (const arg of argv) {
    if (arg === "--patch") bumpType = "patch";
    else if (arg === "--minor") bumpType = "minor";
    else if (arg === "--major") bumpType = "major";
    else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--yes" || arg === "-y") yes = true;
  }

  return { bumpType, dryRun, yes };
}

async function main() {
  const { bumpType: flagBumpType, dryRun, yes } = parseArgs(process.argv.slice(2));

  let bumpType = flagBumpType;

  if (!bumpType) {
    console.log(c.dim("No --patch / --minor / --major flag provided.\n"));
    const answer = await prompt(
      `Bump version type: ${c.code("patch")} / ${c.code("minor")} / ${c.code("major")} `,
    );
    const trimmed = answer.toLowerCase();
    if (trimmed !== "patch" && trimmed !== "minor" && trimmed !== "major") {
      console.error(c.error("✗") + ` Invalid bump type: "${answer}"`);
      console.error(`  Expected: ${c.code("patch")} | ${c.code("minor")} | ${c.code("major")}`);
      process.exit(1);
    }
    bumpType = trimmed;
  }

  const currentVersion = await readCliVersion();
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(
    `\n${c.brand("finta")} ${c.dim("CLI release")}\n  ${c.dim(currentVersion)} → ${c.code(newVersion)} (${bumpType})`,
  );

  if (dryRun) {
    console.log(`\n${c.tip("🔍 DRY RUN")} — no changes will be made\n`);
  }

  // ── Step 1: bump version ──
  if (dryRun) {
    console.log(`${c.dim("[DRY RUN]")} Would bump ${CLI_PACKAGE_JSON} to ${newVersion}`);
  } else {
    if (await confirm(`Bump ${CLI_PACKAGE_JSON} to ${newVersion}?`, yes)) {
      await writeCliVersion(newVersion);
      console.log(c.success("✓") + ` Version bumped to ${c.code(newVersion)}`);
    } else {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  // ── Step 2: build ──
  await runCommand(
    "Building release artifacts",
    "pnpm",
    ["--filter", "@finta/cli", "build:release", "--", "--version", newVersion],
    dryRun,
  );

  // ── Step 3: publish ──
  if (dryRun) {
    console.log(`${c.dim("[DRY RUN]")} Would upload ${newVersion} artifacts to R2`);
  } else {
    if (await confirm(`Upload ${newVersion} artifacts to R2?`, yes)) {
      await runCommand(
        "Publishing to R2",
        "pnpm",
        ["--filter", "@finta/cli", "publish:release", "--", "--version", newVersion],
        dryRun,
      );
    } else {
      console.log(c.tip("!" + " Publish skipped. Artifacts remain local."));
      process.exit(0);
    }
  }

  // ── Step 4: verify ──
  await runCommand(
    "Verifying published artifacts",
    "pnpm",
    ["--filter", "@finta/cli", "verify:release", "--", "--version", newVersion],
    dryRun,
  );

  // ── Step 5: promote ──
  if (dryRun) {
    console.log(`${c.dim("[DRY RUN]")} Would promote ${newVersion} to latest`);
  } else {
    if (await confirm(`Promote ${newVersion} to latest?`, yes)) {
      await runCommand(
        "Promoting to latest",
        "pnpm",
        ["--filter", "@finta/cli", "promote:release", "--", "--version", newVersion],
        dryRun,
      );
    } else {
      console.log(
        c.tip("!" + " Promotion skipped. Run manually when ready:") +
          `\n  ${c.code(`pnpm --filter @finta/cli promote:release -- --version ${newVersion}`)}`,
      );
      process.exit(0);
    }
  }

  // ── Step 6: smoke test ──
  await runCommand(
    "Running frontend smoke checks",
    "pnpm",
    ["--filter", "frontend-cloudflare", "smoke:release"],
    dryRun,
  );

  console.log(
    `\n${c.success("✓")} ${c.brand("finta")} ${c.code(newVersion)} released successfully!\n`,
  );
}

main().catch((error) => {
  console.error(
    c.error("✗") +
      " Release failed: " +
      (error instanceof Error ? error.message : String(error)),
  );
  process.exit(1);
});
