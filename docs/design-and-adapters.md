# Design And Adapters

## Recommended Host-App Structure

Create an app-specific adapter folder, for example:
- `App.Security.BrighterToolsAuth`

Keep all host integration there:
- user lookup
- password verification
- refresh tokens
- tenant resolution
- JWT payload composition
- provider validators
- onboarding behavior

This keeps the auth library reusable and prevents app logic leaking into the shared package.

## AuthUser Mapping

Map your application user record into `AuthUser`.

Populate:
- `Id`
- `SubjectId`
- `Email`
- `UserName`
- `DisplayName`
- `EmailVerified`
- `CanSignIn`
- `PasswordHash`
- `PasswordAlgorithm`
- `EnabledProviders`
- `TenantMemberships`
- `CustomPayload`

Use `CustomPayload` for app-specific identity data such as:
- legacy numeric user id
- avatar metadata
- account status
- display handle
- app-specific booleans

## Tenant Membership Mapping

For multi-tenant apps, map memberships into `AuthTenantMembership`.

Recommended fields:
- `TenantId`
- `TenantKey`
- `TenantName`
- `Role`
- `IsCurrent`
- `LoginEnabled`
- `EmailEnabled`
- `IsOwner`
- `Metadata`

Recommended `Metadata` examples:
- internal tenant int id
- tenant logo url
- tenant account type
- role enum
- host/admin flags
- onboarding flags

## JWT Payload Builder

This is where app compatibility is preserved.

The builder should produce the claims your frontend and API already expect.

For a legacy app using JWT claims directly, encode:
- core identity claims
- current tenant JSON
- tenants JSON array
- provider info
- app-specific claims such as `isHost` or `isHostAdmin`

Important:
- keep the JWT builder app-specific
- do not try to make the shared library know your app's claim names

## Refresh Token Store

The refresh token adapter should use the app's existing refresh-token table if possible.

Recommended behavior:
- issue refresh token rows using the app's existing generator / schema
- rotate according to library settings
- support revocation
- if tenants exist, store the tenant reference
- if tenants do not exist, allow a tenantless token row or a neutral sentinel value

## Single-User / No-Tenant Design

For a non-tenant app:
- return `AuthUser.TenantMemberships = []`
- let `ITenantContextResolver` return null
- let the JWT builder omit tenant-specific claims or emit empty values compatible with the client
- let the refresh token store issue tokens without requiring tenant membership
- use the same user tables and password methods already present in the host app

This keeps the same auth pipeline while disabling tenant-specific concerns.

## MyRipple Reference Notes

MyRipple is a strong example of adapter boundaries.

Reference files:
- `C:\Development\myripple\App\Security\BrighterToolsAuth\MyRippleUserLookupService.cs`
- `C:\Development\myripple\App\Security\BrighterToolsAuth\MyRippleBrighterToolsAuthMappings.cs`
- `C:\Development\myripple\App\Security\BrighterToolsAuth\MyRippleJwtPayloadBuilder.cs`
- `C:\Development\myripple\App\Security\BrighterToolsAuth\MyRippleTenantContextResolver.cs`
- `C:\Development\myripple\App\Security\BrighterToolsAuth\MyRippleRefreshTokenStore.cs`

Important MyRipple-specific lessons:
- host/admin flags belong in adapter metadata and JWT composition, not the shared library
- tenant membership filtering should be consistent across legacy and new auth paths
- tenantless refresh tokens should still be supported by the adapter layer
