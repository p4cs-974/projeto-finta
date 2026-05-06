# CLI Favorites Management

**Status**: Draft — needs-triage
**Scope**: `apps/cli` (TUI + headless), no backend changes

## Problem Statement

A user authenticated via the Finta CLI cannot manage their favorite assets without leaving the CLI. The TUI today supports login/logout and viewing live quote details, but there is no way to add an asset to favorites after viewing it, list current favorites, or remove items from the favorites list. The headless command surface technically routes `finta favorites <list|add|remove>`, but the handlers emit raw JSON only, do not validate the `assetType` argument (any string is forwarded to the backend), and the TUI never exposes those operations interactively. Users who want to curate their tracked assets must either use the web frontend or hand-craft API calls.

## Solution

Make favorites management a first-class flow in both surfaces of the CLI:

- **TUI**: from the authenticated home screen, the user can press a key to open a dedicated favorites screen that lists their favorited assets sorted lexicographically and lets them remove items with a confirmation. From the asset details screen, the user can toggle the current asset's favorite state with a single key.
- **Headless**: the existing `finta favorites list|add|remove` subcommands continue to print JSON, but `add` and `remove` reject invalid `assetType` values up front with a clear error message instead of forwarding garbage to the backend.

No backend, schema, or API contract changes. The feature relies entirely on the existing `/users/me/favorites` endpoints (GET/POST/DELETE) and the existing `~/.finta/config.json` session storage.

## User Stories

1. As an authenticated CLI user viewing an asset's live quote in the TUI, I want a single keystroke to add that asset to my favorites, so I do not have to leave the CLI to curate my tracked assets.
2. As an authenticated CLI user viewing an asset's live quote in the TUI, I want a single keystroke to remove that asset from my favorites if it is already favorited, so I can quickly undo a previous favorite without navigating away.
3. As an authenticated CLI user viewing an asset's live quote in the TUI, I want the keystroke hint to reflect whether the current asset is already favorited, so I know which action will happen before I press the key.
4. As an authenticated CLI user, I want a dedicated TUI screen that lists all my favorited assets, so I can see what I am currently tracking at a glance.
5. As an authenticated CLI user on the favorites screen, I want my favorites listed in lexicographic order by symbol, so the order is predictable and I can find an item without scanning the whole list.
6. As an authenticated CLI user with the same symbol favorited as both stock and crypto, I want a deterministic ordering between the two entries, so the same list always renders the same way.
7. As an authenticated CLI user on the favorites screen, I want to navigate the list with arrow keys, so I can use the same TUI conventions as the rest of the app.
8. As an authenticated CLI user on the favorites screen, I want to press a key to delete the highlighted item with a yes/no confirmation, so I cannot accidentally remove a favorite.
9. As an authenticated CLI user on the favorites screen, I want to press Esc to return to the home screen, so I can leave the screen without taking an action.
10. As an authenticated CLI user with no favorites yet, I want the favorites screen to show an explanatory empty state pointing me to the asset details screen, so I know how to start building my list.
11. As an authenticated CLI user, I want errors from the favorites endpoints (network failure, unauthorized, rate limit) to display inline on the relevant screen, so I understand why an action did not succeed.
12. As an authenticated CLI user whose API key has been revoked while using favorites, I want to be returned to the login screen with a notice, so I can re-authenticate and continue.
13. As an authenticated CLI user, I want the home screen to expose a hotkey hint that opens the favorites screen, so I can discover the feature without reading docs.
14. As an authenticated CLI user toggling a favorite in the asset details screen, I want immediate visual feedback after the request succeeds, so I do not wonder whether the action took effect.
15. As an authenticated CLI user toggling a favorite in the asset details screen, I want a clear error indicator if the request fails, with the favorited state unchanged, so I am not misled about my data.
16. As a scripting/CI user of the headless CLI, I want `finta favorites list` to print JSON to stdout, so I can pipe the output into tools like `jq`.
17. As a scripting/CI user of the headless CLI, I want `finta favorites add <symbol> <assetType>` and `finta favorites remove <symbol> <assetType>` to keep the existing positional argument shape, so my existing scripts continue to work.
18. As a scripting/CI user of the headless CLI, I want `add` and `remove` to reject any `assetType` that is not `stock` or `crypto` with a clear error and a non-zero exit code, so I catch typos before they reach the backend.
19. As a scripting/CI user of the headless CLI invoking favorites commands without being logged in, I want the CLI to fail fast with a clear message pointing to `finta login`, so I know how to recover.
20. As a developer running the headless CLI subcommands, I want errors printed to stderr and successful output printed to stdout, so I can separate them in shell pipelines.
21. As a developer maintaining the CLI, I want the asset-type validation logic shared across the headless flag parser and the headless positional parser, so a future asset type only needs to be added in one place.
22. As a developer maintaining the CLI, I want the favorites sort logic to be a pure function I can unit-test, so I can verify lexicographic order and tiebreak behavior without standing up a TUI.
23. As an operator monitoring CLI usage, I want all favorites operations to flow through the same CLI rate limiter as today, so abuse protection continues to apply uniformly.

## Implementation Decisions

### Scope and surfaces

- Operations in scope: list, add, remove. Reorder, rename, and any per-favorite metadata edits are out of scope.
- Both surfaces ship together: TUI integration and headless validation/UX polish in the same feature.
- No backend changes. No new endpoints, no schema migrations, no contract changes in the favorites domain package.

### TUI integration

- The authenticated home screen gains a hotkey that opens a new favorites view. The existing hint bar at the bottom of the home screen is updated to advertise the hotkey alongside the existing shortcuts.
- A new `AuthenticatedView` value (`"favorites"`) is added to the existing view enumeration in the auth screen module. All three authenticated views remain colocated in the same module per the team's preference for a single-file footprint in this slice.
- The favorites view fetches the current list on mount and after each successful remove. There is no shared cache; each entry into the screen issues a fresh `GET /users/me/favorites`.
- Listing is sorted client-side lexicographically by `symbol` using `String.localeCompare`, with a deterministic tiebreaker by `assetType` (so a crypto and a stock sharing the same symbol always render in the same relative order).
- Cursor navigation uses arrow keys; a delete hotkey triggers a yes/no confirmation overlay (or inline prompt consistent with the existing exit-confirmation pattern). Esc returns to home. Enter on an item is reserved (no-op for now) so future "open details" action is not pre-empted.
- Empty state text directs the user to the asset details screen as the entry point for adding favorites.
- Error states render inline in the destructive color, mirroring how authentication errors render today. A revoked-key error reuses the existing `isRevokedKeyError` propagation path so the whole app falls back to the login screen.

### Asset details (favorite toggle)

- After a quote loads, the asset details view issues an additional `GET /users/me/favorites` and computes whether the loaded asset is already in the list. The hint line shows either "favorite" or "unfavorite" wording based on that boolean.
- A single hotkey performs add or remove depending on the current boolean. On success the local boolean flips and the hint updates; no refetch. On failure an inline error renders, and the boolean does not flip.
- The favorited check uses the asset's `symbol` and the `quoteType` already tracked by the view. Symbols are normalized the same way the quote fetch normalizes them today.

### Headless surface

- The existing `finta favorites list|add|remove` subcommands keep their current shape: positional `<symbol> <assetType>` and JSON output. This is consistent with `finta keys`, `finta dashboard`, and `finta search`, all of which print JSON.
- A shared asset-type validator is introduced as a small, pure module: it takes a raw string, returns the narrow union `"stock" | "crypto"`, and on failure prints a stderr message naming the offending value and the accepted set, then exits with code 1. The existing `--type` flag parser used by `finta quote` is migrated to use the same validator, eliminating the current divergence where `favorites add` accepts any string but `quote --type` does not.
- Authentication continues to be sourced from `~/.finta/config.json` via the existing `requireApiKey` helper. No new flags or environment variables for credentials in this slice.
- The CLI rate limiter wrapping every HTTP request continues to apply unchanged.
- Routing between TUI and headless is unchanged; the existing entrypoint in the distribution module already dispatches `argv` to the headless runner when a subcommand is present and otherwise mounts the TUI.

### Module boundaries

- **Asset type validator**: pure function plus an error-printer adapter. Single source of truth for the literal pair. Used by both the headless flag parser and the headless positional parser for `favorites`.
- **Favorites sort**: pure function over `FavoriteAsset[]` returning a new array sorted by `symbol` then `assetType`. Stable, deterministic, no I/O.
- **Headless `handleFavorites`**: existing function modified to call the validator on positional `assetType` for `add` and `remove`. Keeps the JSON output path.
- **Favorites screen state**: a coherent block of state and effects inside the auth screen module covering fetch on mount, refetch on mutation, cursor index, pending-remove confirmation, and inline error. Not extracted to a separate file for this slice.
- **Favorite toggle state**: a coherent block of state and effects inside the auth screen module's quote details branch covering the post-quote favorited check, optimistic local flip on success, and inline error on failure.

### UX details

- Sort is computed on every render of the favorites view from the latest server snapshot; there is no client-maintained ordering separate from the server data.
- Add and remove operations are idempotent on the backend (verified in the user-assets favorite service); the TUI does not need to guard against double-press beyond the existing loading flag.
- All new keystrokes are documented in the hint bar at the bottom of each affected view, in the existing format.

## Testing Decisions

A good test here exercises external behavior of the unit under test: argument-parsing tests assert on what reaches the API client given an argv, sort tests assert on output ordering given an input list, HTTP client tests assert on the request shape and how response payloads are parsed, and end-to-end tests assert on the observable result through the public command surface and the database state. Tests should not pin on private function names, internal state shape, or render output of TUI components — none of which is stable infrastructure in this codebase.

Modules covered by automated tests in this PRD:

- **Asset type validator** — unit tests covering the happy path for each accepted value and the rejection path for unknown values (assert exit/error message). Pure function, fastest-feedback unit.
- **Favorites sort** — unit tests covering: lexicographic ordering of distinct symbols; tiebreak by `assetType` for colliding symbols; idempotence (sorting an already-sorted list); empty list.
- **Headless `handleFavorites` argument parsing** — unit tests covering: missing subcommand defaults to list; unknown subcommand exits non-zero; `add` with missing args exits non-zero; `add` with invalid `assetType` exits non-zero; `add`/`remove` with valid args reach the API client with the expected `(symbol, assetType)` tuple.
- **`api.favorites` HTTP client** — extend the existing client tests to cover `add` and `remove` request shapes (method, URL, body, auth header, rate-limit interaction). Mirrors the patterns already present for `auth` and `quotes` in the same test file.
- **End-to-end CLI → backend → D1** — exercise `finta favorites list|add|remove` against the in-process backend test harness. Covers: list returns favorites for the authenticated user only; add inserts a favorite; remove deletes it; add is idempotent (same call twice yields one row); list reflects mutations from prior add/remove calls. Prior art for the test harness: `apps/backend-cloudflare/src/index.test.ts` already runs the worker against an in-memory D1 and exercises the favorites endpoints — the new tests reuse that setup but invoke the CLI runner instead of crafting requests directly, so the request-construction and auth-loading paths in the CLI client are exercised end-to-end.

TUI rendering, hooks, and keystroke handling are **not** covered by automated tests because the project has no testing infrastructure for OpenTUI/React-on-OpenTUI today. Standing up that infrastructure for one feature is out of scope. Manual verification of the TUI flows is the acceptance bar for this slice.

## Out of Scope

- Reordering favorites manually. The list is always sorted lexicographically by symbol; persistent user-defined order would require a backend schema change.
- Renaming or attaching custom labels to favorites. The current contract has no editable per-user fields.
- Bulk operations (clear all, import, export).
- Auth-related flags or environment variables for the headless surface (e.g. `--api-key`, `FINTA_API_KEY`). Sessions are read from `~/.finta/config.json` only.
- Optimistic UI on the favorites screen. The screen always reflects the latest server response after a mutation.
- Pre-checking the favorited state before pressing the toggle key on the asset details screen via a separate roundtrip per keypress; the existing snapshot fetched after the quote loads is the source of truth.
- A `--json` flag specifically for `favorites`. The favorites subcommands already print JSON unconditionally, in line with the rest of the headless surface.
- Backend changes of any kind: routes, validation, schema, contracts, or repository implementations.
- Automated TUI tests. Pending project-wide investment in OpenTUI test infrastructure.
- Changes to dashboard `favoritesCount` consumers in the CLI (the CLI does not currently render this counter outside of the raw JSON `dashboard` command).

## Further Notes

- The asset-type validator is intentionally a candidate for adoption beyond the favorites subcommand — once introduced it should immediately replace the inline validation inside the existing `--type` flag parser used by `finta quote`. This eliminates the current asymmetry where one subcommand validates and another silently forwards bad input.
- The favorites screen and the asset-details toggle deliberately use a single shared API endpoint (`GET /users/me/favorites`) for state derivation. If a future feature introduces a "is this asset favorited?" point query, the toggle pre-check should migrate to it; the favorites screen should not.
- The existing CLI rate limiter applies to every request issued by the favorites flows, including the post-quote pre-check. Heavy use of the asset details screen could plausibly burn through the per-user CLI budget faster than today; if that becomes a problem, either raising the limit or caching the favorites list in memory across screens are both reasonable follow-ups, neither in scope here.
- The home screen currently routes the Enter key to logout. Adding the favorites hotkey requires picking a key that does not collide with existing bindings on the home screen (`d` for asset details, `Enter` for logout, `Ctrl+T`, `Ctrl+Q`, `Ctrl+C`). On the favorites screen, the delete and back hotkeys must not collide with arrow-key navigation or the global exit/theme bindings. Final key choices are an implementation-time decision but must be documented in the hint bar of each view.
