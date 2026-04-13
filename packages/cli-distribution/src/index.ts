export const RELEASE_SCHEMA_VERSION = 1;
export const RELEASE_CHANNEL = "stable";
export const CLI_NAME = "finta";
export const CANONICAL_HOST = "https://finta.p4cs.com.br";
export const RELEASES_PATH_PREFIX = "releases";
export const RELEASE_MANIFEST_FILENAME = "manifest.json";
export const CANONICAL_BOOTSTRAP_URL = `${CANONICAL_HOST}/install.sh`;
export const CANONICAL_MANIFEST_URL = `${CANONICAL_HOST}/${RELEASES_PATH_PREFIX}/latest/${RELEASE_MANIFEST_FILENAME}`;
export const CANONICAL_INSTALL_COMMAND = `curl -fsSL ${CANONICAL_BOOTSTRAP_URL} | bash`;
export const VERSIONED_RELEASE_CACHE_CONTROL =
  "public, max-age=31536000, immutable";
export const LATEST_RELEASE_CACHE_CONTROL = "public, max-age=300, s-maxage=300";
export const RELEASE_BINARY_CONTENT_TYPE = "application/octet-stream";
export const RELEASE_MANIFEST_CONTENT_TYPE = "application/json; charset=utf-8";

export type SupportedTargetKey =
  | "darwin-x64"
  | "darwin-arm64"
  | "linux-x64"
  | "linux-arm64";

export type SupportedTarget = {
  key: SupportedTargetKey;
  os: "darwin" | "linux";
  arch: "x64" | "arm64";
  artifactName: string;
};

export type ReleaseTargetArtifact = {
  url: string;
  sha256: string;
  size: number;
};

export type ReleaseManifest = {
  schemaVersion: number;
  channel: string;
  name: string;
  version: string;
  publishedAt: string;
  install: {
    command: string;
    bootstrapUrl: string;
    manifestUrl: string;
  };
  targets: Record<
    SupportedTargetKey,
    {
      os: SupportedTarget["os"];
      arch: SupportedTarget["arch"];
      url: string;
      sha256: string;
      size: number;
    }
  >;
};

export const RELEASE_ARTIFACT_BASE_URL = `${CANONICAL_HOST}/${RELEASES_PATH_PREFIX}`;

export const RELEASE_TARGETS: SupportedTarget[] = [
  {
    key: "darwin-x64",
    os: "darwin",
    arch: "x64",
    artifactName: "finta-darwin-x64",
  },
  {
    key: "darwin-arm64",
    os: "darwin",
    arch: "arm64",
    artifactName: "finta-darwin-arm64",
  },
  {
    key: "linux-x64",
    os: "linux",
    arch: "x64",
    artifactName: "finta-linux-x64",
  },
  {
    key: "linux-arm64",
    os: "linux",
    arch: "arm64",
    artifactName: "finta-linux-arm64",
  },
];

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getReleasePublicUrl(pathname: string, host = CANONICAL_HOST) {
  return `${trimTrailingSlash(host)}/${pathname.replace(/^\/+/, "")}`;
}

export function getVersionManifestObjectKey(version: string) {
  return `${RELEASES_PATH_PREFIX}/${version}/${RELEASE_MANIFEST_FILENAME}`;
}

export const LATEST_MANIFEST_OBJECT_KEY = `${RELEASES_PATH_PREFIX}/latest/${RELEASE_MANIFEST_FILENAME}`;

export function getVersionManifestUrl(version: string, host = CANONICAL_HOST) {
  return getReleasePublicUrl(getVersionManifestObjectKey(version), host);
}

export function getReleaseArtifactObjectKey(
  version: string,
  targetKey: SupportedTargetKey,
) {
  const target = RELEASE_TARGETS.find(
    (candidate) => candidate.key === targetKey,
  );

  if (!target) {
    throw new Error(`Unsupported release target: ${targetKey}`);
  }

  return `${RELEASES_PATH_PREFIX}/${version}/${target.artifactName}`;
}

export function getReleaseArtifactUrl(
  version: string,
  targetKey: SupportedTargetKey,
  host = CANONICAL_HOST,
) {
  return getReleasePublicUrl(
    getReleaseArtifactObjectKey(version, targetKey),
    host,
  );
}

export function createReleaseManifest(input: {
  version: string;
  publishedAt: string;
  targets: Record<SupportedTargetKey, ReleaseTargetArtifact>;
}): ReleaseManifest {
  return {
    schemaVersion: RELEASE_SCHEMA_VERSION,
    channel: RELEASE_CHANNEL,
    name: CLI_NAME,
    version: input.version,
    publishedAt: input.publishedAt,
    install: {
      command: CANONICAL_INSTALL_COMMAND,
      bootstrapUrl: CANONICAL_BOOTSTRAP_URL,
      manifestUrl: CANONICAL_MANIFEST_URL,
    },
    targets: Object.fromEntries(
      RELEASE_TARGETS.map((target) => [
        target.key,
        {
          os: target.os,
          arch: target.arch,
          url: input.targets[target.key].url,
          sha256: input.targets[target.key].sha256,
          size: input.targets[target.key].size,
        },
      ]),
    ) as ReleaseManifest["targets"],
  };
}

export function renderInstallScript() {
  return `#!/usr/bin/env sh
set -eu

BOOTSTRAP_URL="${CANONICAL_BOOTSTRAP_URL}"
DEFAULT_MANIFEST_URL="${CANONICAL_MANIFEST_URL}"
MANIFEST_URL="\${FINTA_INSTALL_MANIFEST_URL:-$DEFAULT_MANIFEST_URL}"
INSTALL_DIR="\${FINTA_INSTALL_DIR:-$HOME/.local/bin}"
INSTALL_PATH="$INSTALL_DIR/finta"
TMP_DIR=""

info() {
  printf '%s\\n' "$1"
}

error() {
  printf 'error: %s\\n' "$1" >&2
  exit 1
}

cleanup() {
  if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then
    rm -rf "$TMP_DIR"
  fi
}

trap cleanup EXIT INT TERM

fetch_text() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
    return
  fi

  error "curl or wget is required to download Finta CLI"
}

download_file() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$1" -o "$2"
    return
  fi

  if command -v wget >/dev/null 2>&1; then
    wget -qO "$2" "$1"
    return
  fi

  error "curl or wget is required to download Finta CLI"
}

compute_sha256() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
    return
  fi

  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$1" | awk '{print $1}'
    return
  fi

  if command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "$1" | awk '{print $NF}'
    return
  fi

  error "sha256sum, shasum, or openssl is required to verify downloads"
}

detect_os() {
  case "$(uname -s)" in
    Darwin) printf 'darwin' ;;
    Linux) printf 'linux' ;;
    *) error "Unsupported operating system: $(uname -s). Finta CLI currently supports macOS and Linux." ;;
  esac
}

detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) printf 'x64' ;;
    arm64|aarch64) printf 'arm64' ;;
    *) error "Unsupported architecture: $(uname -m). Finta CLI currently supports x64 and arm64." ;;
  esac
}

extract_version() {
  compact_manifest=$(printf '%s' "$1" | tr -d '\n\r\t ')
  printf '%s' "$compact_manifest" | sed -n 's/.*"version":"\\([^"]*\\)".*/\\1/p'
}

extract_target_line() {
  compact_manifest=$(printf '%s' "$1" | tr -d '\\n\\r\\t ')
  target_key=$2
  printf '%s' "$compact_manifest" | sed -n "s/.*\\"$target_key\\":{\\"os\\":\\"[^\\"]*\\",\\"arch\\":\\"[^\\"]*\\",\\"url\\":\\"\\([^\\"]*\\)\\",\\"sha256\\":\\"\\([^\\"]*\\)\\",\\"size\\":\\([0-9][0-9]*\\)}.*/\\1|\\2|\\3/p"
}

info "Finta CLI installer bootstrap"
info "Source: $BOOTSTRAP_URL"

OS=$(detect_os)
ARCH=$(detect_arch)
TARGET_KEY="$OS-$ARCH"

info "Resolving latest stable release for $TARGET_KEY"
MANIFEST_JSON=$(fetch_text "$MANIFEST_URL") || error "Unable to download release manifest from $MANIFEST_URL. Check your network connection and try again."
VERSION=$(extract_version "$MANIFEST_JSON")
[ -n "$VERSION" ] || error "Release manifest is missing the CLI version"

TARGET_LINE=$(extract_target_line "$MANIFEST_JSON" "$TARGET_KEY")
[ -n "$TARGET_LINE" ] || error "No compatible Finta CLI artifact was found for $TARGET_KEY"

ARTIFACT_URL=$(printf '%s' "$TARGET_LINE" | cut -d '|' -f 1)
EXPECTED_SHA=$(printf '%s' "$TARGET_LINE" | cut -d '|' -f 2)

[ -n "$ARTIFACT_URL" ] || error "Release manifest did not include an artifact URL for $TARGET_KEY"
[ -n "$EXPECTED_SHA" ] || error "Release manifest did not include a checksum for $TARGET_KEY"

if [ -x "$INSTALL_PATH" ]; then
  CURRENT_VERSION=$("$INSTALL_PATH" --version 2>/dev/null || true)
  if [ "$CURRENT_VERSION" = "finta $VERSION" ]; then
    info "finta $VERSION is already installed at $INSTALL_PATH"
    info ""
    info "Next steps:"
    info "  finta --help"
    info "  finta login"
    exit 0
  fi

  if [ -n "$CURRENT_VERSION" ]; then
    info "Upgrading $CURRENT_VERSION to finta $VERSION"
  fi
fi

TMP_DIR=$(mktemp -d "\${TMPDIR:-/tmp}/finta-install.XXXXXX")
ARTIFACT_PATH="$TMP_DIR/finta"

info "Downloading artifact"
download_file "$ARTIFACT_URL" "$ARTIFACT_PATH" || error "Download failed. Check your network connection and try again."

ACTUAL_SHA=$(compute_sha256 "$ARTIFACT_PATH")
[ "$ACTUAL_SHA" = "$EXPECTED_SHA" ] || error "Checksum verification failed for $ARTIFACT_URL"

mkdir -p "$INSTALL_DIR"
chmod +x "$ARTIFACT_PATH"
mv "$ARTIFACT_PATH" "$INSTALL_PATH"
chmod +x "$INSTALL_PATH"

INSTALLED_VERSION=$("$INSTALL_PATH" --version 2>/dev/null || true)
[ "$INSTALLED_VERSION" = "finta $VERSION" ] || error "Installed binary verification failed. Expected finta $VERSION but got: $INSTALLED_VERSION"

info "Installed $INSTALLED_VERSION"

case ":\${PATH:-}:" in
  *:"$INSTALL_DIR":*) ;;
  *)
    info ""
    info "Your PATH does not include $INSTALL_DIR"
    info "Add this to your shell profile:"
    info "  export PATH=\\"$INSTALL_DIR:\\$PATH\\""
    ;;
esac

info ""
info "Next steps:"
info "  finta --help"
info "  finta login"
`;
}
