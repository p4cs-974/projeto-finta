# Plan: Finta CLI One-Line Installer

> Source PRD: [docs/prd-cli-install-script.md](/Users/pedro/Faculdade/topicos-avancados-eng-software/projeto-finta/docs/prd-cli-install-script.md)

## Architectural decisions

Durable decisions that apply across all phases:

- **Routes**: The canonical public bootstrap URL is `GET https://finta.p4cs.com.br/install.sh`. It must stay publicly reachable and must not be gated by the authenticated frontend experience.
- **Release contract**: The installer resolves a stable "latest stable" release through a machine-readable manifest that maps supported targets to artifact URLs and checksums.
- **Supported targets**: v1 supports macOS and Linux on `x64` and `arm64`. Windows is explicitly deferred.
- **Distribution model**: The public shell script is a thin bootstrap layer. CLI artifacts are published separately from the frontend app and consumed through the manifest.
- **Install behavior**: The installer is idempotent and user-scoped by default. Re-running it either installs, upgrades, replaces safely, or reports that the current version is already installed.
- **Authentication**: Post-install onboarding points users into the existing CLI auth flow with `finta login`. Installer access itself requires no authentication.
- **Trust model**: Downloaded artifacts must be integrity-checked before installation using published checksums.
- **Verification**: Successful installs end with executable verification and a visible version check, plus next-step guidance.

---

## Phase 1: Public Bootstrap Entry

**User stories**: 1, 12, 16

### What to build

Deliver the narrowest end-to-end slice: a stable, public installer entrypoint on the production frontend domain that serves a shell script without authentication or redirects. This slice proves the product can expose the canonical install command through the same domain users will see in docs and marketing materials.

### Acceptance criteria

- [ ] `GET /install.sh` is publicly reachable on the frontend production surface without requiring a logged-in session.
- [ ] The endpoint returns shell script content with the expected content type and does not redirect into the authenticated app flow.
- [ ] The repository has one canonical install command string that points to `https://finta.p4cs.com.br/install.sh`.
- [ ] The served script is intentionally minimal and clearly identifies itself as the Finta CLI installer bootstrap.

---

## Phase 2: Release Contract

**User stories**: 11, 14, 15, 18

### What to build

Define the public release contract that the installer consumes. This slice establishes the durable target matrix, version resolution rules, artifact naming expectations, and checksum availability so every later phase can rely on a deterministic source of truth for “what should be installed.”

### Acceptance criteria

- [ ] A machine-readable release manifest exists for the latest stable CLI release.
- [ ] The manifest enumerates each supported target using a consistent OS/architecture mapping.
- [ ] Each manifest entry includes enough information for the installer to download and verify the correct artifact.
- [ ] The release contract supports reporting the installed version back to the user after installation.
- [ ] The manifest format is documented well enough that future releases can be published without changing the installer bootstrap contract.

---

## Phase 3: CLI Packaging Pipeline

**User stories**: 2, 3, 4, 14, 18

### What to build

Create the first real shipping path for the CLI by producing self-contained release artifacts for each supported target. This slice turns the current development-oriented CLI into something end users can install without local Bun setup, and it proves the release contract can be fulfilled repeatedly.

### Acceptance criteria

- [ ] The release pipeline produces installable CLI artifacts for macOS and Linux on `x64` and `arm64`.
- [ ] The produced artifacts can run the `finta` command without requiring Bun to be preinstalled on the user machine.
- [ ] Checksums are generated for all published artifacts and align with the release manifest.
- [ ] Each published artifact reports the expected CLI version when executed.
- [ ] Packaging can be repeated for a new release without changing the public installer flow.

---

## Phase 4: Installer Happy Path

**User stories**: 1, 2, 3, 4, 5, 8, 19, 20

### What to build

Implement the full user-facing installation flow: the bootstrap script detects platform and architecture, resolves the latest compatible release, downloads the artifact, verifies integrity, installs to a user-level location, and prints polished confirmation plus next steps. This is the first slice that delivers the promised `curl | bash` experience from end to end.

### Acceptance criteria

- [ ] Running `curl -fsSL https://finta.p4cs.com.br/install.sh | bash` installs the CLI successfully on a supported target.
- [ ] The installer automatically chooses the correct artifact for the current OS and architecture.
- [ ] The installer refuses to continue if checksum verification fails.
- [ ] The default install location works without `sudo` in common user environments.
- [ ] The installer verifies that the installed command is executable and prints the installed version.
- [ ] The installer ends with clear next steps including `finta --help` and `finta login`.
- [ ] Installer output remains readable and scoped to installation work only, without surprising changes outside the CLI install surface.

---

## Phase 5: Upgrade and Recovery Path

**User stories**: 6, 7, 9, 10, 17

### What to build

Finish the installation experience by making it resilient. This slice handles reruns, upgrades, unsupported platforms, broken PATH setups, partial failures, and other recovery cases so the installer is supportable in real-world environments instead of only working on the happy path.

### Acceptance criteria

- [ ] Re-running the installer on a machine with Finta already installed results in a clear upgrade, replacement, or no-op path.
- [ ] Unsupported operating systems or architectures fail fast with a direct, actionable error message.
- [ ] Network and download failures surface clear retry guidance instead of generic shell errors.
- [ ] If the CLI is installed successfully but not discoverable on `PATH`, the installer prints exact remediation steps for the user shell environment.
- [ ] Partial install failures do not leave behind an ambiguous success state.
- [ ] The install flow is testable in CI and reproducible locally for both success and failure scenarios.
