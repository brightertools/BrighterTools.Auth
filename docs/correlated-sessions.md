# Correlated sessions (opt in)

Updated 17 November 2026 for backend 1.3.0 / React 2.2.1. See the [consumer upgrade handoff](consumer-upgrade-1.3.md) for app-specific adoption, compatibility checks and the open ancestor-replay revocation limitation. These releases are published; other applications still require individual review.

Version 1.3.0 adds `RefreshTokens.SessionMetadataEnabled`. Leave it false for existing hosts.
Opted-in hosts register `IAuthSessionTransaction`, use rotating tokens and round-trip `AuthSessionMetadata`.
The transaction must join nested calls using one scoped unit of work and roll back every failure.
It covers tenant preference changes, token rotation and session issuance. Do not retry after an ambiguous commit.
Implement the metadata overload of `IJwtPayloadBuilder` to include correlation in signed claims.
Use `HashOnlyRefreshTokenStore` with `IRefreshTokenPersistence`; atomic replacement must recheck
user, provider, family, original authentication time, profile, active state and expiry.
A fresh login creates a family; every refresh/switch gets a new session ID and preserves the family/time.
Refresh cannot change company in this mode; authenticated switching must supply the current refresh credential.
Legacy metadata-less tokens are rejected; hosts should plan a one-time fresh sign-in when opting in.
Verified password registration now returns a session through the orchestrator when this option is enabled.
No native session profile or lifetime change is implied.

React 2.2.0 exposes `transitionSession(operation, selectSession)` on the auth context.
Start the server request inside the callback, not before acquiring the lock. Return a complete session
from the selector on success, or null/undefined when the operation did not produce a session.
Failed operations preserve the current session. Logout or replacement during the operation prevents adoption.
Login, external login/signup and passwordless hooks now use the coordinator; refresh/logout hooks use its lifecycle.
`LoginPanel.showPasswordlessOption=false` hides only the entry button, retaining enabled token-link completion.
`passwordlessEnabled=false` still disables the entire provider UI. Backend eligibility remains authoritative.

React 2.2.1 also rejects queued fresh logins after logout or another session change.
Without Web Locks, operations use an in-process queue; logout clears local state immediately
but waits for an outstanding exchange before revoking the latest server cookie.
Cross-tab serialization requires browser Web Locks support.

Installing these versions does not automatically enable hash-only persistence, change another app's cookies or force its users to sign in again. Full adoption requires the host contracts above.
