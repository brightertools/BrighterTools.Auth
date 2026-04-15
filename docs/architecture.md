# Architecture

## Core Idea

`BrighterTools.Auth` is a reusable backend authentication composition library.

It is not a security boundary. The host application must own endpoint authorization, principal binding, claims sourcing, signing keys, persistence, and policy decisions.

The library owns:
- authentication workflow orchestration
- external provider orchestration
- refresh token orchestration hooks
- password reset and email verification workflow hooks
- session payload composition through a pluggable JWT payload builder
- onboarding and MFA extension points
- provider linking and unlinking orchestration

The host application owns:
- HTTP routes and controller actions
- current-user binding from the authenticated principal
- user storage
- password hashing and verification strategy
- refresh token persistence and revocation storage
- tenant membership resolution, if tenants exist
- external login persistence
- onboarding semantics
- app-specific JWT claims
- provider-specific credential validation
- security event handling

## Main Components

### Orchestrator

The central service is the auth orchestrator.

It coordinates:
- user lookup
- password verification
- provider validation
- tenant resolution
- JWT payload generation
- refresh token issuance and rotation
- optional session persistence
- onboarding state evaluation

## Adapter Interfaces

These abstractions are the primary integration points:
- `IUserLookupService`
- `IPasswordVerifier`
- `IPasswordHasher`
- `ILegacyPasswordVerifier`
- `IRefreshTokenStore`
- `IJwtPayloadBuilder`
- `ITokenIssuer`
- `ITenantContextResolver`
- `IExternalLoginStore`
- `IExternalUserProvisioningPolicy`
- `IUserProvisioningService`
- `IOnboardingStateEvaluator`
- `IOnboardingCompletionService`
- `IExternalAuthProviderValidator`
- `IAuthSessionStore`
- optional MFA and recovery services

## HTTP Surface

The library does not expose controllers or routes.

Host applications should create their own endpoints and:
- validate caller identity
- translate HTTP requests into orchestrator calls
- decide which workflows are exposed
- handle cookies, headers, and response envelopes

## Session Model

A successful auth flow returns:
- access token
- refresh token
- expiry
- provider
- current tenant, if any
- onboarding state
- payload dictionary

The host controls the final JWT content through `IJwtPayloadBuilder` and `ITokenIssuer`.

## Tenant Model

The library does not require tenants.

It supports both:
- multi-tenant applications where a user can belong to many tenants
- single-user or tenantless applications where `CurrentTenant` is null

Tenant handling is delegated to:
- `AuthUser.TenantMemberships`
- `ITenantContextResolver`
- `IJwtPayloadBuilder`
- `IRefreshTokenStore`

## Design Principle

Treat tenants as optional context, not as a hard dependency.

That means:
- tenant-aware apps can fully populate memberships and switching
- tenantless apps can return no memberships and still issue valid access and refresh tokens