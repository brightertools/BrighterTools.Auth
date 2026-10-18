# Integration Guide

## Cross-application handoff: 8 October 2026

### Published packages

Consume NuGet `BrighterTools.Auth 1.1.1` and npm
`@brightertools/auth-react 2.0.1` from the public registries; update host lockfiles.
Release commit: `e63f6d0504eb5c8d622ec63d78d770a8e7d8e28e`;
trusted-publishing run: `37778794376`. The original checkout contains unrelated
Microsoft-validator/account-panel changes which were excluded from this release.
Do not treat that working tree as the published package or introduce local references.

### What changed

- Transient refresh network/timeout/429/5xx and unclassified failures retain the
  refresh session instead of immediately logging out. Automatic retries are bounded
  (1, 5, 15, 30, 60 seconds), honor Retry-After, and can recover on online/focus.
- Access-token expiry still clears authenticated access. Stored session data alone
  is not proof of authentication; route guards must use `isAuthenticated`.
- Valid background refresh no longer unmounts forms. Stale responses cannot undo
  logout or replace a newer session; concurrent refreshes are coalesced.
- Web Locks serialize same-origin tab refreshes where supported. Tabs in the same
  app need the same storageKey; unrelated apps should keep storage isolated.
  Browsers without Web Locks have no cross-tab serialization guarantee.
- The backend emits stable `invalid_refresh_token` failures. Invalid/revoked
  sessions still sign out. No lifetime, rotation, replay-protection or schema change.

### Host actions required

1. Deploy the backend before the frontend. Preserve `invalid_refresh_token`,
   HTTP status and Retry-After through custom API envelopes/adapters.
2. Audit interceptors and auth wrappers: do not independently clear credentials
   or call logout for transient refresh failures. Do not add unbounded retries.
   Retain explicit invalid-session handling and enforce access-token expiry.
3. Ensure login, refresh, tenant switching, invitation acceptance and compatibility
   handoffs update the same refresh-cookie contract. Logout must delete all supported
   cookies with matching options. Preserve HttpOnly/Secure and the host's CSRF and
   SameSite design. A `__Host-` cookie requires Secure, Path=/ and no Domain.
4. Failed tenant switching must retain the existing session. Test replacement and
   logout while refresh is in flight. Adapt host routes/cookies/roles; do not copy
   Adfast-specific identifiers or tenant rules.
5. Use published packages, run host backend/client tests and production builds, and
   deploy backend first. This refresh patch requires no migration or new settings.

A response lost after server-side token rotation may still require sign-in. This
release deliberately does not weaken replay protection to mask that case.

### Notification contacts: earlier rollout prerequisites

For apps upgrading from before Auth 1.1.0 / auth-react 2.0.0, also implement
authenticated contact-email/select and contact-email/remove workflows, AddOnly
verification, ownership/expiry/single-use checks and default-contact removal
protection. Preserve notification selections through login, linking, profile and
onboarding saves. Accept verified Apple relay addresses; activation or a Microsoft
email claim alone is not proof of ownership.

Login identities, notification contacts, billing and marketing preferences remain
independent. Authentication challenges, password resets and invitations retain their
intended recipients. Host persistence/recipient rules and any migrations remain
host-owned; do not copy Adfast's IsContactRemoved migration or company model blindly.
React 2.0.x's Router 7 and custom API-client compatibility requirements from the
1.1.0/2.0.0 release still apply.

### Verification evidence and checks for other apps

Release CI passed 28 backend and 63 React tests. Adfast consumption passed 33
focused backend tests (one opt-in SQL test skipped), 35 client tests and builds.
These are previous release results, not evidence of another host's live validation.

Before rollout, test password/external login, refresh/logout, expiry during outage,
429/Retry-After, offline recovery, stale responses, multiple tabs, tenant switching,
invitations and the actual host cookie/envelope pipeline. Verify enabled contact
workflows and recipient routing. No live provider/email test or production deployment
was performed in this release. Apple relay sender registration and the host's
email-provider domain/DKIM plus real relay delivery remain separately approved checks.

### Known issues and follow-up

- IIS/TLS/network resets are independent of this patch. Adfast reported a missing
  SSL selection on one of two servers; inspect every node's bindings/certificates.
- Google /gsi/button 403 is a provider response, not an Adfast API authorization
  error. Check the exact OAuth client origin and response/GSI_LOGGER evidence.
  Do not record session cookies or tokens in diagnostics.
- A separate local fake-DOM reproduction found changing callback identities can
  rerun GoogleCredentialButton's effect and recreate its iframe during parent
  re-renders. This may explain cancelled iframe requests, not the cause of a 403.
  Stable-callback/effect repair and regression coverage are follow-up work:
  **not included in auth-react 2.0.1**.
- Adfast's Xero contact/invoice changes are app-specific and are not auth-library changes.

Adfast references (examples, not portable implementations):
`Web/Web.Server/Infrastructure/AuthRefreshCookies.cs`,
`Web/Web.Server/Controllers/V1/AuthController.cs`,
`Web/Web.Server/Controllers/V1/AuthenticationController.cs`,
`Web/web.client/src/contexts/auth.tsx` and
`ai/auth-notification-email-handoff.md`.


## Goal

Integrate `BrighterTools.Auth` into another application while:
- reusing the app's existing user tables and password logic
- preserving the app's JWT contract where needed
- supporting either multi-tenant or no-tenant operation
- allowing gradual migration alongside legacy auth if necessary

## Recommended Integration Steps

### 1. Register the core library
In the host app startup:
- add `AddBrighterToolsAuthCore(...)`
- register app adapter implementations for the required abstractions

Typical required registrations:
- `IUserLookupService`
- `IPasswordVerifier`
- `IRefreshTokenStore`
- `IJwtPayloadBuilder`
- `ITenantContextResolver`
- `IExternalLoginStore`
- `IUserProvisioningService`

Optional depending on features:
- onboarding services
- MFA services
- email verification workflow services
- provider validators
- session store

### 2. Build a user mapper
Map your app user model into `AuthUser`.

Checklist:
- use the app's real user identifier as `Id`
- use the JWT subject-compatible identifier as `SubjectId`
- map enabled external providers from existing tables
- preserve app profile fields in `CustomPayload`

### 3. Decide your tenant mode

#### Multi-tenant mode
Do this when users belong to organisations / workspaces / companies.

Implement:
- non-empty `TenantMemberships`
- `ITenantContextResolver` that chooses requested/current membership
- JWT builder that emits `currentTenant` and `tenants` claims if your frontend expects them
- refresh token store that persists tenant context

#### Single-user / no-tenant mode
Do this when the app has only user accounts and no tenant switching.

Implement:
- empty `TenantMemberships`
- `ITenantContextResolver` returns null
- JWT builder emits only user claims, or emits empty tenant placeholders if legacy clients require them
- refresh token store allows tokens with no tenant context

### 4. Keep JWT compatibility explicit
If the host app already has a frontend expecting named claims, keep them stable in `IJwtPayloadBuilder`.

Examples of compatibility claims a host app may need:
- `guid`
- `id`
- `email`
- `firstName`
- `lastName`
- `handle`
- `currentTenant`
- `tenants`
- `isHost`
- `isHostAdmin`

The library should not decide these names. The host app adapter should.

### 5. Reuse existing password and refresh token logic
Prefer adaptation over replacement.

Use the host app's:
- stored password hashes
- password verification rules
- refresh token table
- refresh token rotation semantics

This reduces migration risk.

### 6. Add controller endpoints separately during migration
If the host app already has legacy auth endpoints, expose the new endpoints alongside them first.

Pattern:
- keep legacy endpoints active for the live app
- add BrighterTools.Auth-backed endpoints separately
- test parity
- migrate frontend only after payloads and flows match

This is the pattern used in MyRipple.

## Validation Checklist

Before switching a live app to the new auth path, confirm:
- password login works
- external login works
- refresh works
- logout works
- current user / current session works
- provider linking / unlinking works if needed
- onboarding state works if used
- tenant switching works if applicable
- JWT payload contains every claim the frontend/API expects
- refresh token persistence works with and without tenant context

## Migration Advice

If another app is used as a test integration target:
- start with password login only
- keep tenant handling minimal at first
- keep JWT claims intentionally compatible with the existing app shell
- only migrate external providers after core session flows are stable

## Practical Reference

Use MyRipple as an adapter example, but not as a mandatory shape.

Key files:
- `C:\Development\myripple\App\Security\BrighterToolsAuth\MyRippleUserLookupService.cs`
- `C:\Development\myripple\App\Security\BrighterToolsAuth\MyRippleJwtPayloadBuilder.cs`
- `C:\Development\myripple\App\Security\BrighterToolsAuth\MyRippleTenantContextResolver.cs`
- `C:\Development\myripple\App\Security\BrighterToolsAuth\MyRippleRefreshTokenStore.cs`
- `C:\Development\myripple\webapi\Controllers\V1\AuthenticationController.cs`

## Important Constraint

Do not assume every app has tenants.

The library and adapters should support:
- tenant-aware apps
- tenantless apps

without requiring a second auth architecture.
