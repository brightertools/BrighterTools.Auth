# Consumer handoff: backend 1.3.0 / React 2.2.1

Latest consumer follow-up: [21 November browser refresh HTTP 400 and recovery handoff](browser-refresh-recovery-handoff.md). Check cookie-only endpoint binding and recovery guards in each app; no new package release.

Updated 17 November 2026. This is guidance for reviewing each consuming application in its own repository. Other applications were not inspected or changed during the Adfast integration work; older references to their implementations are historical observations, not current acceptance evidence.

## Published source and evidence

- NuGet: `BrighterTools.Auth` **1.3.0**; npm: `@brightertools/auth-react` **2.2.1**. Pin exact versions when evaluating this release.
- Backend release source: `c0d7f8f886865420996710954ec5301c6af31087`; final React release source: `09d72735f90526000b9584ba81508f3ea147d058`.
- Source/documentation branch: `codex/adfast-session-replacement`. Fetch this branch explicitly; do not assume it has been merged into the repository's default branch.
- Successful workflows: [backend release](https://github.com/brightertools/BrighterTools.Auth/actions/runs/43971697129), [React follow-up](https://github.com/brightertools/BrighterTools.Auth/actions/runs/43979398150).
- Shared validation: 67 backend tests, 158 React tests, builds, installed-tarball native ESM/NodeNext consumer checks and release audits passed. This does not establish compatibility or deployment acceptance for every consuming app.

## Choose the adoption level per application

**Package upgrade without session-storage replacement:** keep `RefreshTokens.SessionMetadataEnabled=false` (the default). Existing host persistence remains in use; installing the package does not hash historical tokens, create tables, enable family revocation, rename cookies, or force a sign-in. Review changes from the app's actual starting version and run its regression tests. React coordinator fixes affect runtime behaviour even without enabling backend session metadata.

**Full correlated-session adoption:** explicitly enable metadata only after implementing the persistence, transaction, token-validation and browser contracts below. This requires an application-specific schema and coordinated rollout. Adfast's table names, claims, routes and cookie/storage names are examples, not shared requirements or templates to copy unchanged.

## Backend integration contracts

- Use the shared orchestrator as the session issuer. It creates metadata before JWT/token issuance when opted in and preserves provider, session profile, login family and original authentication time through refresh/company changes.
- Register `HashOnlyRefreshTokenStore` with a host implementation of `IRefreshTokenPersistence`. Persist only digests and metadata, never raw refresh credentials or complete authentication responses. Existing passwords and provider identities do not need conversion.
- Register `IAuthSessionTransaction` using one scoped database unit of work. Nested calls join the caller's transaction. Company selection, invitation membership changes and token rotation commit together or roll back together. Do not automatically replay credential exchanges after an ambiguous commit.
- Make `TryReplaceAsync` an atomic conditional consume-and-insert operation with exactly one winner. Recheck user, provider, profile, family, original authentication time, active state and expiry in persistence. A prior read or process-local lock is insufficient.
- Implement the metadata overload of `IJwtPayloadBuilder`, and validate session identity, revocation and live account/company eligibility on protected requests. Normal refresh must not invalidate otherwise valid access requests already in flight. Explicit inaccessible companies must fail.
- Persist selected company per session. Opted-in refresh cannot switch companies; use authenticated company switching with the current refresh credential. Keep existing lifetimes and native-profile policy unless separately approved.
- Keep passwordless eligibility separate from whether the login entry button is displayed. Preserve each app's signup, activation, linked-provider, invitation, onboarding and notification policies through supported host interfaces.

See [correlated-session contracts](correlated-sessions.md) and [hash-only storage notes](hash-only-refresh-sessions.md).

## React integration contracts

- Use the shared provider/coordinator as the session authority. Start company-switch and invitation-connect requests inside `transitionSession(operation, selectSession)` and return a complete shared session on success. Do not construct partial sessions or start requests before acquiring the coordinator lock.
- Review custom hooks, provider wrappers and typed context mocks: `AuthContextValue` now includes `transitionSession` and `refreshSessionResult`. Session-producing hooks now use the coordinator; refresh/logout hooks follow its lifecycle. Consumers relying on old hook timing or detailed refresh failure envelopes need explicit regression checks.
- Queued or late exchanges cannot restore a logged-out/replaced session. Web Locks serialize operations across same-origin tabs where available; otherwise the queue serializes only within that coordinator instance. This is not cross-application SSO.
- `LoginPanel.showPasswordlessOption=false` hides the entry option without disabling eligible token-link completion. `passwordlessEnabled=false` remains a separate provider-UI control; backend eligibility is authoritative.
- Plan each app's browser storage/cookie transition. Adfast uses an HttpOnly refresh cookie and removes refresh credentials from JSON responses; that transport policy is host-owned, not automatically imposed on other consumers.

## Security distinctions and open follow-up

Hashing protects the database copy of a token: the shared store generates 48 cryptographically random bytes and stores a SHA-256 digest. The browser still presents the original secret. A digest read from the database cannot directly authenticate, but theft of the original cookie or compromise of the application server remains a different threat.

Rotation rejects reuse of a consumed credential. Family revocation additionally invalidates its successors and requires host persistence/validation support. Adfast implements explicit logout revocation of the family even when logout supplies an already rotated token.

**Open upstream review: automatic family revocation on ancestor replay is not established for the hash-only path.** `HashOnlyRefreshTokenStore.FindAsync` returns null for inactive/consumed records. The default orchestrator consequently returns `invalid_refresh_token` before reaching its `IsRevoked` / `RevokeOnUseOfRevokedAncestor` branch. The replayed token is rejected, but this does not automatically revoke its active successor. Do not claim that enabling that option provides replay-triggered family revocation with this store. Review the protocol and add explicit host/SQL/browser tests before changing this behaviour; legitimate concurrent requests and lost responses must be considered. This documentation update does not change the protocol.

## Per-application verification and rollout

1. Inventory package versions, every session issuer, token persistence, JWT validation, browser storage, custom hooks and provider/tenant policies. Report findings in that application's handoff before choosing its migration.
2. Verify existing passwords, linked Google/Apple/Microsoft identities, Microsoft unverified-email and Apple relay handling, passwordless, signup/activation/reset/change, account methods, notifications and onboarding.
3. Verify invitation accept/connect/expiry/decline/resend and concurrent acceptance/cancellation; failed acceptance stays a failure throughout API and UI.
4. Use actual database integration tests for concurrent rotation, rollback, logout/family revocation, consumed-token rejection, provider/company/profile/time preservation and interrupted requests. In-memory doubles alone are insufficient.
5. Exercise multiple tabs, queued login/logout, company switching, stale responses, network failures and cookie delivery on the app's real hostnames. Verify API-key and non-browser integrations remain unaffected.
6. For full adoption, deploy additive schema before matching backend/frontend, reject old sessions explicitly at the chosen cutover, and verify fresh administrator sign-in. Do not import historical plaintext tokens. Keep old storage untouched until a separate retention decision. Package-only upgrades do not inherently require this cutover.

No other app alignment, live migrations, provider sign-ins, authentication emails or deployment was performed as part of this documentation handoff.
