# BrighterTools.Auth

Authentication composition abstractions and orchestration helpers for ASP.NET Core.

`BrighterTools.Auth` is designed to sit above host-owned persistence and policy.
It does not own controllers, signing keys, claims persistence, authorization policy, or tenant-specific business rules.

## Install

```powershell
dotnet add package BrighterTools.Auth
```

## Register

```csharp
services.AddBrighterToolsAuthCore(configuration, options =>
{
    options.Providers.EnabledProviders =
    [
        AuthProviderType.Password
    ];
});
```

Then register the host implementations for the abstractions your app owns, such as:
- `IUserLookupService`
- `IUserProvisioningService`
- `ITokenIssuer`
- `IRefreshTokenStore`
- `IAuthSessionStore`
- `ITenantContextResolver`
- `IJwtPayloadBuilder`
- `IEmailWorkflowService`

Optional features such as onboarding, MFA, and external providers stay disabled or unsupported until the host explicitly enables and implements them.

## Design Boundary

The host application owns:
- HTTP endpoints and principal binding
- claims sourcing and token signing
- refresh token persistence and revocation policy
- user and tenant persistence
- secret storage and encryption
- authorization and audit policy

The package owns:
- orchestration contracts
- reusable auth models
- explicit extension points
- fail-closed defaults

## Documentation

See the repository docs for architecture and integration details.