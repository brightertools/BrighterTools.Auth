# BrighterTools.Auth

`BrighterTools.Auth` is an authentication composition library for ASP.NET Core applications with a React companion package for reusable auth UI flows.

It is not a security boundary or turnkey authentication system. The host application owns endpoints, principal binding, authorization decisions, persistence, JWT signing, refresh-token storage, provider credentials, and business-specific account workflows.

## Packages

```powershell
dotnet add package BrighterTools.Auth
npm install @brightertools/auth-react
```

## Repository Layout

- `src/BrighterTools.Auth` - backend auth composition package
- `tests/BrighterTools.Auth.Tests` - backend orchestration tests
- `react/brightertools-auth-react` - React companion components, hooks, adapters, and localization helpers
- `docs` - architecture and integration notes

## Documentation

- [usage.md](./usage.md) for consuming application guidance
- [publishing.md](./publishing.md) for maintainer release steps
- [RELEASE_NOTES.md](./RELEASE_NOTES.md) for release history
- [src/BrighterTools.Auth/README.md](./src/BrighterTools.Auth/README.md) for package-level backend details

## Validation

```powershell
dotnet restore .\BrighterTools.Auth.sln --configfile .\NuGet.config
dotnet build .\BrighterTools.Auth.sln -c Release --no-restore
dotnet test .\BrighterTools.Auth.sln -c Release --no-build
cd .\react\brightertools-auth-react
npm install
npm test
npm run build
npm run pack:dry-run
```
