const publicHost = (
  process.env.FINTA_PUBLIC_HOST ?? "https://finta.p4cs.com.br"
).replace(/\/+$/, "");

async function assertOk(url, description, predicate) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `${description} failed with status ${response.status}: ${url}`,
    );
  }

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
