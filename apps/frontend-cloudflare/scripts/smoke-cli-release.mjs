const publicHost = (
  process.env.FINTA_PUBLIC_HOST ?? "https://finta.p4cs.com.br"
).replace(/\/+$/, "");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, description) {
  const maxAttempts = 8;
  let lastResponse;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url);
    lastResponse = response;

    if (response.ok) {
      return response;
    }

    if (attempt < maxAttempts && (response.status === 503 || response.status >= 500)) {
      await wait(1000 * attempt + Math.floor(Math.random() * 250));
      continue;
    }

    break;
  }

  throw new Error(
    `${description} failed with status ${lastResponse?.status ?? "unknown"}: ${url}`,
  );
}

async function assertOk(url, description, predicate) {
  const response = await fetchWithRetry(url, description);
  await predicate(response);
}

await assertOk(
  `${publicHost}/install.sh`,
  "CLI installer smoke check",
  async (response) => {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/x-shellscript")) {
      throw new Error(`Unexpected install.sh content type: ${contentType}`);
    }

    const body = await response.text();
    if (!body.includes("Finta CLI installer bootstrap")) {
      throw new Error(
        "install.sh did not contain the expected bootstrap banner",
      );
    }
  },
);

await assertOk(
  `${publicHost}/releases/latest/manifest.json`,
  "CLI latest manifest smoke check",
  async (response) => {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(
        `Unexpected latest manifest content type: ${contentType}`,
      );
    }

    const manifest = await response.json();
    if (
      manifest?.install?.bootstrapUrl !== `${publicHost}/install.sh` ||
      manifest?.install?.manifestUrl !==
        `${publicHost}/releases/latest/manifest.json`
    ) {
      throw new Error("Latest manifest returned unexpected install URLs");
    }

    await assertOk(
      `${publicHost}/releases/${manifest.version}/manifest.json`,
      "CLI versioned manifest smoke check",
      async (versionResponse) => {
        const versionManifest = await versionResponse.json();
        if (versionManifest?.version !== manifest.version) {
          throw new Error(
            `Versioned manifest returned ${versionManifest?.version}, expected ${manifest.version}`,
          );
        }
      },
    );

    const nativeTarget = `${process.platform}-${process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : ""}`;
    const fallbackTarget = "darwin-arm64";
    const artifactTarget =
      manifest?.targets?.[nativeTarget] != null ? nativeTarget : fallbackTarget;
    const artifactUrl = manifest?.targets?.[artifactTarget]?.url;

    if (typeof artifactUrl !== "string" || artifactUrl.length === 0) {
      throw new Error(`Latest manifest did not include artifact ${artifactTarget}`);
    }

    await assertOk(
      artifactUrl,
      `CLI artifact smoke check (${artifactTarget})`,
      async () => {},
    );
  },
);

process.stdout.write(`CLI release smoke checks passed for ${publicHost}\n`);
