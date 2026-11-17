# BrighterTools.Auth handoff - 17 November 2026

## Current published state

NuGet **1.3.0** and React **2.2.1** are published and consumed by Adfast. Start with the [consumer upgrade handoff](docs/consumer-upgrade-1.3.md) when reviewing another application in its own repository.

- Backend source: `c0d7f8f886865420996710954ec5301c6af31087`; final React release source: `09d72735f90526000b9584ba81508f3ea147d058`.
- Source and handoff branch: `codex/adfast-session-replacement`. Fetch this branch explicitly on the other computer; default-branch integration is not asserted here.
- Successful releases: [backend 1.3.0 / React 2.2.0](https://github.com/brightertools/BrighterTools.Auth/actions/runs/43971697129), [React 2.2.1](https://github.com/brightertools/BrighterTools.Auth/actions/runs/43979398150).
- Verification: 67 backend and 158 React tests, builds, installed-tarball native ESM/NodeNext checks and release audits passed. The first 2.2.1 attempt failed before publication because of a hard-coded archive name; verification/publication now derive it from package metadata.
- Backend correlated sessions are opt-in. Package installation alone does not migrate another app's persistence. React coordinator changes require review of custom hooks/context mocks even with backend metadata disabled.
- Other applications are on another computer and have not been reviewed or changed during the Adfast work. Historical app-specific notes below must be reverified against those repositories.

## Next-session follow-up

Review each consumer's persistence, shared-orchestrator adoption, session validation, frontend coordination and deployment requirements using the [consumer checklist](docs/consumer-upgrade-1.3.md). Keep each app's findings in its own repository. Do not copy Adfast-specific schemas/cookies or infer that other apps have already adopted them.

An open upstream issue is documented in the guide: the hash-only lookup hides consumed records, so the orchestrator's revoked-ancestor branch is not reached. Old-token replay is rejected, but replay-triggered revocation of the active family is not implemented by that path. Explicit family logout is a separate host capability. No runtime fix or new package release is included in this documentation update.

Adfast's implementation was merged into its `develop` branch at `097e52f05`. Its recorded checks include 306 backend cases across the broad run and isolated Xero retry, 222 frontend tests, generation/builds and an EF model check. One optional native PDF fixture was skipped. Real provider and portal-hostname smoke tests remain deployment work. No live application migration, deployment or authentication email was performed by this task.

## Historical checkpoints

Everything below is dated history. Earlier “prepared”, “publish” or “not yet implemented” instructions are superseded by the current published state above; they are not instructions to republish existing versions.

# React 2.2.1 race follow-up - 16 November 2026

NuGet 1.3.0 and React 2.2.0 were published in workflow 43971697129.
React 2.2.1 adds pre-lock stale-generation/storage checks to fresh authentication and a local exchange queue when Web Locks are unavailable. A queued login cannot resurrect logout; server logout waits for pending cookie rotation.
All 158 React tests and the TypeScript build passed. The npm-only release subsequently completed; NuGet remains 1.3.0.

# Correlated sessions release - 16 November 2026

Prepared NuGet 1.3.0 and React 2.2.0 on codex/adfast-session-replacement from the exact 2.1.1 release commit.
See docs/correlated-sessions.md for host contracts. Existing host options remain unchanged.
Local tests: 67 backend and 156 React passed; installed tarball/native ESM/NodeNext checks passed; npm audit found zero vulnerabilities.
No consumer database migration or deployment was performed. Publication subsequently completed through the trusted workflow linked above.

# Shared Auth release handoff — 12 November 2026

## React 2.1.1 packaging follow-up

Branch `codex/react-esm-release-20261112` fixes extensionless relative imports in
compiled ESM and declarations. NodeNext compilation, all 153 React tests and an
installed tarball consumer (native Node plus TypeScript) passed locally.
`publish-tool.yml` now tests the archive and publishes that same archive.
Release npm only; do not republish NuGet 1.2.0 or enable new host session features.
Registry publication and consumer verification follow the release workflow.


Prepared versions: NuGet 1.2.0; @brightertools/auth-react 2.1.0. Continue on the existing codex/platform-alignment-20261018-182439 branch, incorporating Windows commit acc13c0. Publication status and validation are recorded below after the release workflow completes.

## Included changes

- Reusable invitation lifecycle decisions, safe HTTP failure mapping, input validation, visible password controls and form feedback reset. Invited users see saved profile details instead of re-entering them. Host capability flags remain authoritative.
- Disabled EmailOtp rejects both challenge creation and completion. Hosts must expose actual enabled-provider capability; rendering a component never enables a provider.
- Opt-in named native session profiles with nullable persisted SessionProfile, inherited on rotation and tenant switching. Default/unclassified sessions retain existing policy. Refresh input cannot select or upgrade a profile. Existing user/provider eligibility is rechecked; invalid sessions keep the stable invalid_refresh_token classification.

## Consumer integration

Deploy a host-owned additive nullable SessionProfile column/mapping before enabling a named profile. Persist the profile on issuance and return it on every refresh read; preserve it during atomic rotation. Implement IAuthSessionProfileContext only for trusted fresh login/signup endpoints, never from refresh request fields. Pass the current host refresh credential on tenant switching when preserving policy. Uniiite uses a rolling 90-day native profile; no other application is opted in by this package. Handoff codes stay short-lived and single-use.

Cancellation and archival remain separate host transactions: authorize the current actor/tenant, lock and reread invitation state, invalidate cancelled links, and release a reservation once. Never remove an accepted membership or refund a consumed seat during a cancellation race. Library helpers do not replace these checks.

Uniiite deployed the source integration on 9/12 November. Mosaio and MediaMarkup must retain their own policies and run compatibility suites before their next deployment. This release publishes shared libraries only; it does not deploy those applications or migrate their databases.

Use publishing.md and .github/workflows/publish-tool.yml with the production environment and existing NuGet/npm trusted publishers. No long-lived registry token is required. Publish from the exact tested commit and verify registries rather than treating an upload attempt as completion.

## Local release validation

12 November 2026: Release .NET tests 62 passed, 0 skipped; React tests 153 passed; React build and npm pack passed; npm audit reported zero vulnerabilities after compatible development dependency updates. NuGet restore audited transitive dependencies with NU1901–NU1904 as errors; NuGet pack succeeded. Existing documentation/nullability warnings remain non-blocking. npm lock includes patched Vitest 5.1.0, Vite 8.3.8, undici 8.12.4 and source-map-js 1.2.2.

Commands: `dotnet test BrighterTools.Auth.sln -c Release -m:1 -p:NuGetAuditMode=all -warnaserror:NU1901,NU1902,NU1903,NU1904`; in the React package: `npm test`, `npm run build`, `npm audit --audit-level=low`, `npm pack`. CI repeats these checks from the pushed commit before publication. This is package validation, not a new end-to-end deployment acceptance.

## Published release

The trusted-publishing workflow completed successfully on 12 November 2026.

- Published source commit: `f6de8a22415de6790cdda370a35d63cd45fd23e8`.
- Workflow: [https://github.com/brightertools/BrighterTools.Auth/actions/runs/43246271881](https://github.com/brightertools/BrighterTools.Auth/actions/runs/43246271881).
- CI repeated the required tests, audits and package validation before successful registry uploads.
- Registry availability is checked separately below; workflow success alone is not a download check.

CI package SHA-256 (before any registry repository signing):

- `brightertools-auth-react-2.1.0.tgz`: `9e1cf7c820f306ec8806185af7c4b565b7877c6e009dc665488cbadecfdc6410`.
- `BrighterTools.Auth.1.2.0.nupkg`: `3f44fd2d41801388441067dd4644d339b2cd3db5aedfdab0a8f011c90080eabf`.

For rollback, pin consumers to their prior package versions and review host migrations separately; do not delete published packages or undo additive host schema as part of package rollback. Source-reference consumers use their reviewed sibling revisions, not a substituted registry reference.

Registry availability verified at 2026-11-12T15:26:20.660764+00:00: NuGet 1.2.0 and npm 2.1.0 downloaded successfully. NuGet contents match CI excluding its repository signature; the npm archive matches CI byte-for-byte.

- Published `BrighterTools.Auth` SHA-256: `de9152635f433cec33df4f6adf94af1f3879f23a901d41b5c57fda7473539c0f`.
- Published `@brightertools/auth-react` SHA-256: `9e1cf7c820f306ec8806185af7c4b565b7877c6e009dc665488cbadecfdc6410`.
