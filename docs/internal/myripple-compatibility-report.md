# BrighterTools.Auth Compatibility Report

## Proposed reusable architecture

`BrighterTools.Auth` now scaffolds:

- persistence-agnostic auth models
- adapter interfaces for user lookup, password verification, token issuance, refresh token storage, tenant resolution, onboarding, linked providers, email workflows, MFA, and security events
- typed auth options for JWT, refresh tokens, providers, onboarding, MFA, and password migration
- default controller scaffolding for auth and account flows
- a default orchestration service that coordinates password login, external login, refresh rotation, linked providers, onboarding, and MFA without requiring EF Core
- a React package scaffold with headless hooks, API client, token storage abstraction, provider/context, guards, and Bootstrap reference UI

## Current app to reusable package comparison

### Auth endpoints

- Current app:
  - `/auth/login`
  - `/auth/signup`
  - `/auth/refreshToken`
  - `/auth/revokeToken`
  - `/auth/requestPasswordReset`
  - `/auth/updatePassword`
  - `/auth/resetPassword`
  - `/auth/activate`
  - `/auth/confirmEmailAddress`
  - `/auth/switchTenant`
- Proposed package:
  - `/api/brightertools/authentication/login/password`
  - `/api/brightertools/authentication/login/google`
  - `/api/brightertools/authentication/login/apple`
  - `/api/brightertools/authentication/login/microsoft`
  - `/api/brightertools/authentication/refresh`
  - `/api/brightertools/authentication/logout`
  - `/api/brightertools/authentication/password-reset/begin`
  - `/api/brightertools/authentication/password-reset/complete`
  - `/api/brightertools/authentication/email-verification/begin`
  - `/api/brightertools/authentication/email-verification/confirm`
  - `/api/brightertools/authentication/mfa/...`
  - `/api/brightertools/account/session/current`
  - `/api/brightertools/account/providers/...`
  - `/api/brightertools/account/onboarding/...`

Adapter need:
- A route compatibility layer or phased client migration because the package uses clearer endpoint groupings than the current app.

### JWT payload

- Current app:
  - serializes tenant metadata into string claims `currentTenant` and `tenants`
  - depends on client-side JSON parsing in React auth context
- Proposed package:
  - moves JWT construction behind `IJwtPayloadBuilder`
  - keeps the payload app-defined
  - allows apps to preserve the existing claim contract during migration

Adapter need:
- A MyRipple-specific `IJwtPayloadBuilder` that reproduces existing tenant claims until the frontend is migrated.

### Refresh tokens

- Current app:
  - EF-backed `UserRefreshTokens`
  - one active token lifecycle controlled in `UserService`
  - rotation supports tenant switching
- Proposed package:
  - `IRefreshTokenStore` contract with issue, rotate, revoke, and find methods

Adapter need:
- A store adapter over `UserRefreshToken` plus policy decisions about whether MyRipple should preserve its current single-token-per-user behavior.

### Tenant handling

- Current app:
  - `TenantUser.Current` is the source of current tenant
  - `ITenantSetter` is fed from JWT on token validation
- Proposed package:
  - `ITenantContextResolver` decides which membership becomes current for session issuance
  - tenant metadata remains app-owned

Adapter need:
- A resolver that understands `TenantUser.Current`, `LoginEnabled`, and current tenant switching semantics.

### Onboarding

- Current app:
  - tenant-owned via `Tenant.IsOnboarding`
  - React route guard uses tenant status polling
- Proposed package:
  - `IOnboardingStateEvaluator` and `IOnboardingCompletionService`
  - supports user-owned, tenant-owned, or mixed onboarding through adapters

Adapter need:
- A MyRipple onboarding adapter that maps `Tenant.IsOnboarding` into package onboarding state and completion.

### Password hashing and migration

- Current app:
  - uses `PasswordHasher<User>` directly
  - has an unused custom password hasher in the repo
- Proposed package:
  - `IPasswordVerifier`, `ILegacyPasswordVerifier`, `IPasswordHasher`, `IPasswordRehashPolicy`

Adapter need:
- A MyRipple password adapter that initially wraps current `PasswordHasher<User>`.
- If legacy/custom hashes need to be supported later, add `ILegacyPasswordVerifier`.

### Provider linking and provider policy

- Current app:
  - user `LoginProviders` JSON drives allowed methods
  - only `Email` and `Google` are modeled today
- Proposed package:
  - provider-neutral `ExternalLogin`, `IExternalLoginStore`, `IUserLoginProviderPolicy`
  - includes Apple, Microsoft, and passkey design slots

Adapter need:
- A mapper between MyRipple `LoginProviders` JSON and package `ExternalLogin`/policy evaluation.

### MFA

- Current app:
  - no MFA found
- Proposed package:
  - interfaces and endpoints for authenticator-app MFA and recovery codes

Adapter need:
- New persistence and validation implementation. This remains app-owned until adopted.

### React auth layer

- Current app:
  - monolithic auth context tightly coupled to JWT claim shape and current endpoints
- Proposed package:
  - headless-first context, hooks, API client, guards, and storage abstraction

Adapter need:
- Either keep MyRipple UI and swap its internals to package hooks gradually, or adopt the reference package incrementally by feature area.

## What should remain app-owned

- exact user and tenant entity shapes
- JWT claim contract while old clients still depend on it
- email template content and delivery integration
- refresh token persistence implementation details
- tenant switching side effects
- business onboarding fields and completion rules
- provider enablement policy per user or tenant

## Recommended integration order

1. Implement MyRipple-specific adapter classes for user lookup, password verification, JWT payloads, tenant resolution, onboarding, and refresh token storage.
2. Preserve current endpoint routes by adding thin compatibility controllers or endpoint aliases during migration.
3. Replace refresh/login/token issuance internals behind the existing app controllers first.
4. Migrate React service calls to the new auth API client while keeping current pages.
5. Move route guard and onboarding logic to package hooks/guards after payload contracts are stable.
6. Add external providers beyond Google only after the base adapter layer is proven in production.
7. Add MFA last, since it is net-new behavior for MyRipple.
