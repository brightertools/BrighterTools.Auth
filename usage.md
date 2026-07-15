# BrighterTools.Auth Usage

Install the backend package:

```powershell
dotnet add package BrighterTools.Auth
```

Install the React companion package:

```powershell
npm install brightertools-auth-react
```

`BrighterTools.Auth` is a composition library. The host application owns endpoints, user persistence, JWT signing, refresh-token persistence, authorization policy, and provider credentials. The library owns reusable orchestration contracts, fail-closed defaults, options validation, and React workflow components.

For React localization, import the defaults/manifests from `brightertools-auth-react`, seed those keys into the host app localization store, and pass translated text through component `textOverrides` or the package localization helper. Host-provided overrides always win over defaults.

For backend usage, register the package services in DI, implement the required app-owned stores/services, then expose application endpoints that call the orchestrator APIs.
