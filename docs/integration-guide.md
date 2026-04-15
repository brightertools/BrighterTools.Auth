# Integration Guide

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
