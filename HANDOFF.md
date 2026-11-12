# Shared Auth release handoff — 12 November 2026

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
