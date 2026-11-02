# Hash-Only Refresh Sessions
## Stable Login Families (1 November 2026)

`AuthSessionMetadata.LoginFamilyId` is an optional additive GUID, distinct from the
rotating session-record ID. A participating host creates it on fresh sign-in and
preserves it through refresh and workspace changes, together with the original
`AuthenticatedAtUtc`. The shared store rejects family substitution or an explicitly
empty GUID. Hosts must persist and compare it atomically during replacement.
Existing consumers may retain null until they implement their own reviewed cutover.

MediaMarkup uses this family for independent viewer contexts, with live membership
and resource reauthorization. Its repository revokes the entire family on logout,
even if the supplied refresh digest belongs to an already rotated row. This is an
explicit host persistence policy, not a new implicit global revocation behavior for
all consumers. No raw refresh tokens or session responses are persisted.

The React package now exports `@brightertools/auth-react/session`: a headless entry
for `createSessionCoordinator`, API helpers and token storage, without loading React,
provider SDKs or application CSS. `AuthProvider` delegates renewal to this same
coordinator. Same-origin Web Locks serialize refresh, fresh authentication and
logout; storage events synchronize sessions. Stale responses, bounded transient
recovery and terminal expiry handling remain shared. Hosts supply their existing
API/storage contracts and secure refresh-cookie transport. This does not enable
cross-application SSO or refreshable integration/viewer-only credentials.

MediaMarkup is the runtime reference for this adoption. Other hosts need their own
migration, session-family and browser acceptance; do not infer rollout to Mosaio or
MyRipple from these additive library changes. Nothing was published.

## Coordinated Development: 19 October 2026

New local source capabilities, not a published release or completed host cutover:

- AuthSessionMetadata holds an opaque GUID correlation ID and original authenticated time. A replacement receives a new correlation ID while retaining the original time. It is not a credential or authorization decision.
- RefreshTokenIssueRequest and AuthRefreshToken have an additive Session property.
- HashOnlyRefreshTokenStore implements the existing IRefreshTokenStore contract. It generates 48 cryptographically random bytes, persists only SHA-256 digests through IRefreshTokenPersistence, rejects expiry/replay, and preserves identity/provider/original authentication time during rotation.
- IRefreshTokenPersistence is the host-owned atomic repository boundary. TryReplaceAsync must conditionally consume an active record and insert the replacement in one transaction, with exactly one winner. It must not commit a caller-owned transaction. SQL implementations must enforce this, not rely on a preflight read or an in-process lock.
- Raw tokens are returned only to the caller; no persisted session-response cache is introduced. Non-secret session lookup must use correlation and live authorization, not saved raw responses.

This store is NOT registered automatically. Existing consumers retain their current behavior until their complete adapters, schema and runtime tests are ready. DefaultAuthOrchestrator does not yet create/pass this metadata before JWT construction; that is the next integration gate, not implemented by adding the model.

## Required Host Adoption

1. Preserve host user/tenant IDs. Persist correlation, original authentication time, provider, token digest, expiry and revocation. Mark new metadata fields internal/excluded from generic mutation contracts.
2. Implement atomic persistence in repository partials using the host scoped context. MediaMarkup's UserRepository.RefreshTokenPersistence is an executable reference with disposable SQL tests.
3. Establish correlation before constructing/signing the JWT; pass that same metadata into refresh issue/rotation. Refreshed tokens must retain the original authenticated time.
4. Revalidate active user, current and target memberships and host eligibility before rotation. An explicit invalid tenant fails, never falls back silently.
5. Keep fresh-auth account operations tied to the original authentication time. Do not grant fresh authentication by merely switching a tenant or rotating a token.
6. Reject old sessions at the reviewed cutover; do not rehash/import raw historical refresh tokens or rotate signing secrets/API credentials. New metadata columns alone do not invalidate old access JWTs: each host's runtime validation and deployment order are a separate required gate.
7. Verify database races, rollback, refresh replay, logout, current-session lookup, provider flows and browser behavior before replacing the old runtime path.

MediaMarkup's storage implementation and additive migration are available; its custom Auth engine is not yet replaced. Mosaio/MyRipple still use their existing raw-token storage and need full persistence/runtime conversion. Do not describe them as hash-only or session-aligned yet.

Tests: shared protocol tests cover hash-only commands, expiry, replay, original-time preservation, attempted identity/provider changes, concurrent consumption and failure handling. The in-memory persistence double is not SQL acceptance evidence. MediaMarkup's disposable SQL tests separately prove concurrent rotation and rollback with the actual repository implementation.

No package publication, live emails, remote callbacks or production migrations are part of this checkpoint.
