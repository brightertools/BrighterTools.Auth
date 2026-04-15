# BrighterTools.Auth

`BrighterTools.Auth` is an authentication composition library for ASP.NET Core applications.

It is not a security boundary and it is not a turnkey authentication system.

The host application owns:
- HTTP endpoints and principal binding
- authorization policy decisions
- user and tenant persistence
- claims sourcing and JWT signing
- refresh token persistence and revocation rules
- secret storage, encryption, and provider credentials
- business-specific onboarding and account workflows

The library provides:
- orchestration contracts
- DI registration helpers
- fail-closed defaults
- reusable auth models and options
- extension points for login, token issuance, onboarding, MFA, external providers, and sessions

## Package

```powershell
dotnet add package BrighterTools.Auth
```

See the package-level readme in [`src/BrighterTools.Auth/README.md`](src/BrighterTools.Auth/README.md) for the minimal registration and integration shape.

## Repository Layout

- `src/BrighterTools.Auth`
  - reusable backend auth composition package
- `tests/BrighterTools.Auth.Tests`
  - orchestration-focused backend tests
- `react/brightertools-auth-react`
  - companion React auth scaffold and hooks package
- `docs`
  - public architecture and integration documentation
- `docs/internal`
  - migration and compatibility notes kept out of the main public docs path

## Validation

```powershell
dotnet test .\BrighterTools.Auth.sln
```

The React companion package can be validated with:

```powershell
cd .\react\brightertools-auth-react
npm install
npm test
```

## Documentation

- [`docs/README.md`](docs/README.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/design-and-adapters.md`](docs/design-and-adapters.md)
- [`docs/integration-guide.md`](docs/integration-guide.md)