# PRD: Finta CLI One-Line Installer

## Problem Statement

Today the Finta CLI exists in the monorepo, but it is not distributed in a way that end users can install with a single command. The current package is private, tied to the workspace, and built around a Bun-based runtime. That is acceptable for development, but it is not acceptable for a public CLI onboarding flow.

From the user's perspective, this creates several problems:

- There is no official installation entrypoint for the CLI.
- Users cannot copy a single command from the product website and get a working `finta` command.
- Users have no clear guidance on platform support, prerequisites, PATH setup, upgrades, or failure recovery.
- The CLI already supports CLI-specific authentication flows, but distribution is the missing step that prevents adoption.

The result is a broken product story: users can hear about the CLI, but they cannot install it with the expected modern developer experience of `curl -fsSL https://finta.p4cs.com.br/install.sh | bash`.

## Solution

Finta will provide a polished public installer script at `https://finta.p4cs.com.br/install.sh` that users can execute with `curl -fsSL ... | bash`. The script will act as a stable bootstrap entrypoint and install the Finta CLI in a way that is safe, friendly, and predictable.

From the user's perspective, the solution should feel like this:

- They copy one command from the website or README.
- The installer detects their operating system and CPU architecture.
- The installer downloads the correct release artifact for that platform.
- The installer verifies the artifact before installing it.
- The installer places the executable in a standard user-level location when possible.
- The installer prints clear next steps, including how to verify the installation and how to authenticate with `finta login`.

For the first production version, the installer should optimize for macOS and Linux users on `x64` and `arm64`. The bootstrap URL must stay stable even if the underlying release pipeline changes. The install experience should be idempotent, meaning rerunning the installer should either upgrade cleanly or confirm that the latest compatible version is already installed.

## User Stories

1. As a prospective Finta CLI user, I want to install the CLI with one copy-paste command, so that I can start using it without reading packaging docs.
2. As a macOS user, I want the installer to detect my platform automatically, so that I do not have to choose a download manually.
3. As a Linux user, I want the installer to detect my architecture automatically, so that I receive a compatible binary.
4. As a security-conscious developer, I want the installer to verify downloaded artifacts, so that I am not blindly executing a corrupted or tampered binary.
5. As a developer without root access, I want the installer to prefer a user-space install location, so that I can install the CLI without `sudo` in common cases.
6. As a developer whose PATH is not configured correctly, I want the installer to explain exactly what I need to add to my shell profile, so that the `finta` command works after installation.
7. As a returning user, I want rerunning the installer to upgrade or no-op safely, so that I can keep the CLI current without manual cleanup.
8. As a first-time CLI user, I want the installer to print a success message with `finta --help` and `finta login`, so that I know what to do next.
9. As a user on an unsupported platform, I want the installer to fail fast with a clear message, so that I know whether there is a workaround or I need a different setup.
10. As a user behind a flaky network, I want download failures to be explained clearly, so that I can retry without guessing what went wrong.
11. As a user who wants reproducibility, I want the installer design to support explicit version installation later, so that teams can pin CLI versions in CI or documentation.
12. As a product maintainer, I want a stable public bootstrap URL, so that marketing pages, README snippets, and support docs do not break when the release mechanism changes.
13. As a maintainer, I want the installer to be decoupled from the frontend UI, so that CLI distribution can evolve without redesigning the product website.
14. As a maintainer, I want the release flow to generate platform-specific CLI artifacts automatically, so that shipping a new version does not require manual packaging work.
15. As a maintainer, I want the installer to consume a simple release manifest, so that “latest version” resolution is deterministic and easy to debug.
16. As a maintainer, I want the install endpoint to be publicly reachable without authentication, so that logged-out users and automation can use it reliably.
17. As a maintainer, I want install failures to be easy to reproduce locally and in CI, so that support burden stays low.
18. As a CLI user, I want the installed command to match the version I was told I installed, so that troubleshooting is straightforward.
19. As a CLI user, I want installation output to be polished and readable, so that the experience feels intentional rather than like a throwaway script.
20. As a CLI user, I want the installer to avoid surprising side effects outside the CLI install scope, so that I trust running it.

## Implementation Decisions

- The public entrypoint will be a stable bootstrap script served from the production frontend domain at `/install.sh`.
- The installer must remain publicly accessible and bypass authenticated application flows. The current frontend request pattern for dot-extension assets supports this direction and should be preserved.
- The bootstrap script will be intentionally thin. Its job is to detect environment details, fetch release metadata, download the correct artifact, verify it, install it, and print next steps.
- The CLI distribution mechanism should not require users to install Bun. The release process should produce self-contained platform artifacts for supported operating systems and architectures.
- Release metadata should be exposed through a small machine-readable manifest that identifies the latest version, supported targets, download URLs, and checksums.
- The release artifact source and the bootstrap URL should be separate concerns. The script URL stays fixed at `finta.p4cs.com.br/install.sh`, while artifact hosting may live behind a release storage layer such as GitHub Releases or object storage.
- The default install target should be a user-owned binary directory when available, with a well-defined fallback strategy and clear messaging if elevation would be required.
- The installer must be idempotent. If the CLI is already installed, it should compare versions and either upgrade, replace, or no-op explicitly.
- The installer output should include concise status steps, success/failure markers, and actionable remediation guidance rather than raw shell noise.
- The installer should end with a verification step that confirms the binary is executable and prints the installed CLI version.
- The installer should direct the user into the existing CLI authentication flow by recommending `finta login` immediately after successful installation.
- The first release should explicitly support macOS and Linux on `x64` and `arm64`. Windows support should be deferred rather than partially implemented.
- The product website and developer docs should standardize on a single canonical install command to avoid fragmented onboarding.
- A release automation module is required to build, package, checksum, and publish CLI artifacts consistently for each supported target.
- A manifest-generation module is required so the installer does not hardcode per-version URLs.
- An installer endpoint module is required on the frontend deployment surface to serve the shell script with the correct content type and cache strategy.
- The CLI versioning story must become externally visible and stable. Shipping “latest” only is acceptable for v1, but the design should not prevent later support for pinned versions such as an environment variable or version flag.

## Testing Decisions

- A good test should validate external behavior only: what URL is served, what the script prints, whether the binary ends up installed correctly, whether verification failures abort the process, and whether reruns behave predictably. Tests should avoid coupling to shell implementation details that users cannot observe.
- The installer script should be tested for platform detection, unsupported-platform failures, manifest parsing, checksum enforcement, PATH guidance, upgrade/no-op behavior, and post-install verification output.
- The release manifest should have contract tests that confirm required fields exist and map correctly to supported targets.
- The release automation flow should have build verification that ensures each published artifact is executable and reports the expected version.
- The frontend endpoint should have smoke tests that confirm `/install.sh` is publicly reachable, returns the expected shell content, and is not redirected into the authenticated app experience.
- End-to-end install tests should run in CI on supported Linux environments by downloading through the public bootstrap flow and asserting that `finta --help` succeeds afterward.
- Existing repo prior art should be reused where sensible: CLI-focused tests already exist around API client behavior and rate limiting, while frontend and backend layers already use route- and adapter-level tests for externally visible behavior.

## Out of Scope

- Native Windows installation in the first release.
- Package-manager-specific distribution for Homebrew, npm, apt, or other ecosystems in the first release.
- Rich installer analytics, telemetry dashboards, or conversion tracking.
- Automatic shell profile editing beyond a conservative, explicit opt-in path.
- Multi-version install management beyond “install latest stable” for v1.
- In-product GUI onboarding for the CLI beyond linking to the install command.
- Refactoring core CLI features unrelated to distribution and installation.

## Further Notes

- The current CLI and backend are already moving toward a CLI-native authentication model with API keys, which makes installer onboarding more valuable now than later.
- The installer should feel polished, but “fancy” should not mean opaque. Clear output, explicit verification, and predictable file placement matter more than visual theatrics.
- The highest-risk implementation area is not the shell script itself; it is release packaging and artifact lifecycle management. That should be treated as a first-class deliverable, not an afterthought.
- This document is intentionally issue-ready, but it has not been submitted as a GitHub issue automatically in this pass.
