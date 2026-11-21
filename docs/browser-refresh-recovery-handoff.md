# Browser refresh HTTP 400 and session recovery: consumer handoff

Updated 21 November 2026. Review this in each consuming app, on either machine.
This is a host integration fix identified in Adfast, not a new shared-package release.
Other apps have not yet been reviewed or fixed by this handoff.

## Confirmed failure and scope

Adfast DEV repeatedly returned HTTP 400 from `/api/v1/authentication/refresh`
while its UI remained on “Restoring your session”. The browser intentionally keeps
its refresh credential only in an HttpOnly cookie. Its JSON refreshToken field is
empty. However, the host action bound the shared `RefreshTokenRequest`, whose
`RefreshToken` has `[Required]`. ASP.NET Core `[ApiController]` rejected the request
before the action could read the cookie. `LogoutRequest` has the same requirement.
Direct controller unit tests missed MVC binding/validation; real HTTP tests reproduced it.

This explains the confirmed 400 mismatch, not every reported unexpected logout.
Network failures and expired/revoked cookies are separate cases. Do not treat every
400 as definitive token revocation or keep retrying a binding defect indefinitely.

## Per-app backend fix

First identify each app's actual refresh/logout transport. Apply the following to
cookie-only browser endpoints; native/API clients that deliberately use body tokens
must retain their own validated contracts. Do not copy Adfast's cookie name or routes.

Use host browser DTOs without a credential field, for example:

```csharp
public sealed class BrowserRefreshRequest
{
    public string? TenantId { get; init; }
    public bool SwitchToCurrentTenant { get; init; }
}
public sealed class BrowserLogoutRequest { }
```

Bind with `[FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)]` and a nullable
browser DTO parameter. Read the refresh cookie inside the action, then construct
`RefreshTokenRequest` or `LogoutRequest` for the shared orchestrator with that cookie
value. Forward tenant options only where supported; this does not add tenant switching
or bypass correlated-session policies. Confirm the app's JSON serializer ignores
legacy body-token properties, or explicitly handles them without using them as credentials.

- Accept `{}`, a legacy empty refreshToken field and an omitted body on browser routes.
- A body token must never override the cookie or authenticate without it.
- Missing/invalid cookies retain the host's stable `invalid_refresh_token` failure
  envelope. Preserve HTTP/envelope conventions expected by its shared adapter.
- Refresh still rotates the cookie. Logout revokes using the cookie and expires it;
  absent-cookie logout can retain the existing idempotent policy.
- Never expose a refresh credential in browser response JSON. Preserve HttpOnly,
  Secure, SameSite, path/domain, CSRF/origin protections and credentialed request settings.
- Keep `[Required]` on the shared orchestrator DTOs. Do not suppress MVC validation
  globally, accept body fallback credentials, lengthen sessions, or disable revocation.

## Per-app React recovery checks

Protected layouts and role guards must distinguish startup/recovery from confirmed
session loss. Wait while the provider is loading, or while a retained session exists
but no authenticated user is available. Hide protected content/operations during
recovery; evaluate roles only once authenticated. Redirect to sign-in when the shared
coordinator definitively removes the session, retaining pathname, query and hash.

The recovery screen should:

1. Delegate retry to the existing provider/coordinator refresh method.
2. Show retry progress, disable repeated clicks while pending, and show failure feedback
   for a false result or rejected promise. Clear pending state in finally.
3. Offer “Sign in again” with the intended return URL. Navigation alone must not silently
   erase a recoverable stored session.
4. Avoid promising unlimited automatic retries; retry policy is bounded and package-owned.

Do not patch node_modules, add a second timer/refresh coordinator, or erase stored
sessions for transient network/timeout/429/5xx failures. Reusable coordinator defects
belong in this repository with their own tests; this confirmed binding fix does not
require a package release. Check current versions rather than assuming every consumer
has Adfast's NuGet 1.3.0 / React 2.2.1 pins.

## Required acceptance in each consumer

Use the actual HTTP routing, serializer, ApiController validation and response adapter
with a fake orchestrator and isolated server. Do not start a production application
that automatically migrates its database merely to test model binding.

| Check | Expected result |
| --- | --- |
| Cookie + `{}`, empty legacy field, arbitrary legacy field, omitted body | Action executes; only cookie credential reaches orchestrator |
| No cookie + body credential | Definitive invalid-refresh result; body cannot restore session |
| Invalid/revoked cookie | Stable failure code; no usable replacement session |
| Malformed JSON | Rejected by binding; never treated as a successful refresh |
| Browser logout, including omitted body | Cookie credential revoked and expired according to host policy |
| Successful refresh | Secure HttpOnly rotated cookie; no refresh secret in response JSON |
| Tenant options | Preserved only within existing authorization/session policy |
| Startup/expired access token with retained session | Recovery screen; no premature sign-in/role redirect or protected content |
| Retry pending, false result, thrown failure | Visible progress/failure, no duplicate operation, retry becomes available again |
| Confirmed revocation or session removal | Sign-in redirect retaining intended route |
| Temporary outage, idle/background, sleep/resume | Recovery without deleting valid stored state |
| Multiple tabs and logout during refresh | Shared serialization and stale-result rejection preserved |

Verify real deployment cookie delivery for each hostname and consistency of signing,
session storage and versions across hosts. Log only safe trace IDs, host, cookie
presence and failure codes; never cookies, tokens, authorization headers or full auth
responses. The existing ancestor-replay/family-revocation review in the
[1.3 consumer guide](consumer-upgrade-1.3.md#security-distinctions-and-open-follow-up)
is separate and remains open.

## Adfast reference and evidence

Source checkout: `C:/Development/adfast2` on the originating machine. These host fixes
are currently working-tree changes, not a portable committed Adfast revision. On another
machine, use this self-contained handoff and adapt to that app; do not assume pulling
Adfast HEAD contains these changes. Relevant reference paths within Adfast:

- `App/Dto/Auth/BrowserSessionRequests.cs`
- `Web/Web.Server/Controllers/V1/AuthenticationController.cs`
- `Testing/App.Tests/BrowserSessionHttpTests.cs`
- `Testing/App.Tests/SharedAuthActionCancellationTests.cs`
- `Web/web.client/src/components/SessionRecovery.tsx`
- `Web/web.client/src/components/PrivateRoute.tsx` and protected layouts
- `Web/web.client/tests/auth-recovery.test.tsx`
- `ai/modern-auth-sessions.md`

Recorded Adfast validation on 20 November: 20 backend/controller/real-HTTP tests,
13 frontend auth tests, TypeScript, production client build and web backend build
passed. Local logs: `tmp/session-cookie-refresh-*.log`. These are Adfast results,
not acceptance of another app; they were not rerun for this documentation change.

## Pull, apply and report back

The handoff is on `codex/adfast-session-replacement`, not `main`. From a clean Auth
checkout, fetch origin, switch to that branch (create a tracking branch if absent),
then `git pull --ff-only`. Preserve unrelated work; do not reset a different branch
onto this one. Read this document and the existing consumer guide before applying fixes.

In each app's own handoff, record: package versions, transport, affected endpoints,
route-guard findings, changes, tests, commit/branch, remaining hostname acceptance,
and deployment status. Mark unaffected apps explicitly with evidence. Apply only
relevant host fixes and deploy matching backend/frontend through that app's process.
No database migration is needed for the binding/recovery fix itself. Full session
storage adoption is separate and can require migrations as described in the 1.3 guide.

No runtime code, package version, schema, live sessions or deployed apps are changed
by this Auth documentation handoff. No fix has been applied to other apps yet.
