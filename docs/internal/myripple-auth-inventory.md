# MyRipple Auth Inventory

## Backend inventory

- `C:\Development\myripple\webapi\Program.cs`
  - Registers JWT bearer auth, a policy scheme that chooses API key or JWT, token validation, tenant claim hydration on `OnTokenValidated`, CORS, rate limiting, and controller routing.
- `C:\Development\myripple\webapi\Controllers\V1\AuthController.cs`
  - Current auth API surface for password login, signup, refresh, revoke/logout, account activation, email confirmation, password reset, invitation acceptance, tenant switching, and verification-code flows.
- `C:\Development\myripple\App\Data\Access\UserService.cs`
  - Primary auth orchestration today. Owns email/password auth, refresh token rotation, email signup, invited-user creation, tenant switching, password reset, and JWT issuance.
- `C:\Development\myripple\App\Security\Auth\ClaimsService.cs`
  - Builds JWT claims with serialized `currentTenant` and `tenants` JSON payloads plus provider and host flags.
- `C:\Development\myripple\App\Security\Jwt\JwtTokens.cs`
  - Issues and validates HMAC JWTs directly from configuration.
- `C:\Development\myripple\App\Data\Access\UserRefreshTokenService.cs`
  - Generates refresh tokens with 7-day lifetime.
- `C:\Development\myripple\App\Security\MultiTenancy\TenantContext.cs`
  - Holds current tenant metadata resolved from the JWT.
- `C:\Development\myripple\App\TypeExtensions\ClaimsPrincipleExtensions.cs`
  - Materializes `AuthenticatedUser` from claims.
- `C:\Development\myripple\App\Data\Models\User.cs`
  - User aggregate with login providers, password hash, email/reset fields, tenant memberships, and refresh tokens.
- `C:\Development\myripple\App\Data\Models\Tenant.cs`
  - Tenant aggregate with `IsOnboarding`, subscription flags, and account metadata.
- `C:\Development\myripple\App\Data\Models\TenantUser.cs`
  - Membership model with `Current`, `LoginEnabled`, `EmailEnabled`, role, owner, and login timestamps.
- `C:\Development\myripple\App\Data\Models\UserRefreshToken.cs`
  - Refresh token entity with token chain fields and provider type.
- `C:\Development\myripple\App\Data\Models\JsonModels\LoginProvider.cs`
  - Per-user provider mapping stored as JSON.
- `C:\Development\myripple\App\Data\LoginProviderType.cs`
  - Current provider enum only contains `Email` and `Google`.
- `C:\Development\myripple\App\Data\Access\AccountVerificationService.cs`
  - Email/phone verification code issuance and validation.

## Frontend inventory

- `C:\Development\myripple\reactapp\src\contexts\auth.tsx`
  - Stores session in local storage, decodes JWT client-side, schedules refresh, exposes login/signup/switch-tenant actions.
- `C:\Development\myripple\reactapp\src\services\authService.ts`
  - Thin auth API client. Calls endpoints for password login, refresh, signup, invitation, password reset, tenant switch, and Google flows.
- `C:\Development\myripple\reactapp\src\components\PrivateRoute.tsx`
  - Role-based route guard using auth context state.
- `C:\Development\myripple\reactapp\src\App.tsx`
  - Adds onboarding routing guard around private routes.
- `C:\Development\myripple\reactapp\src\contexts\globalState.tsx`
  - Polls current tenant status and reacts to onboarding/subscription state.
- `C:\Development\myripple\reactapp\src\pages\home\OnBoarding.tsx`
  - Current onboarding UI keyed off tenant onboarding state.
- `C:\Development\myripple\reactapp\src\pages\home\OnboardingCompleteButton.tsx`
  - Completes onboarding by setting `Tenant.IsOnboarding = false`.
- `C:\Development\myripple\reactapp\src\hooks\useGoogleAuth.tsx`
  - Current Google OAuth auth-code client wrapper.
- `C:\Development\myripple\reactapp\src\pages\auth\Login.tsx`
  - Password login form with dormant Google login toggle.

## Current flow summary

- Password login:
  - API loads user plus tenant memberships and refresh tokens.
  - Email must be confirmed.
  - Membership must have a login-enabled tenant.
  - Password is verified with `PasswordHasher<User>`.
  - Current tenant is marked by mutating `TenantUser.Current`.
  - JWT and refresh token are issued and the refresh token is returned in an HTTP-only cookie.
- Signup:
  - Creates user, tenant, tenant membership, and company in one EF transaction.
  - Tenant starts in onboarding mode.
  - If email is not pre-verified, signup returns success without session and sends activation email.
  - If email is verified, signup also signs the user in immediately.
- Refresh:
  - Refresh token is found through the user relation.
  - Revoked ancestor reuse triggers descendant revocation.
  - A new JWT and refresh token are issued.
  - Token rotation also supports switching to the current tenant.
- Tenant handling:
  - JWT contains `currentTenant` and `tenants` claims as serialized JSON.
  - `OnTokenValidated` deserializes `currentTenant` and pushes it into `ITenantSetter`.
  - Tenant switching rewrites `TenantUser.Current` and reissues tokens.
- Onboarding:
  - Current onboarding is tenant-owned via `Tenant.IsOnboarding`.
  - React blocks private routes when tenant onboarding is active.
- External auth:
  - Google client pieces exist.
  - Backend Google validation service exists.
  - No current Google endpoints were found in the controller surface.
  - No Apple, Microsoft, MFA, recovery code, or passkey implementation was found.

## Current risks and inconsistencies

- React client calls `signupWithGoogle`, `loginWithGoogle`, and invitation-with-Google endpoints, but those endpoints were not found in `AuthController`.
- Core auth behavior is embedded in EF-specific `UserService`, which makes reuse across non-EF apps difficult.
- Password verification is hardcoded to ASP.NET Identity `PasswordHasher<User>` even though a custom hasher exists in the repo.
- JWT claims depend on app-specific JSON payload shapes and client-side parsing conventions.
- Onboarding is tenant-centric today, while future apps may need user-centric or mixed onboarding.
- Provider enablement is effectively modeled in user JSON and controller/service logic rather than through a central policy contract.
- API key auth path is scaffolded but not implemented.
