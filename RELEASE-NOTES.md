# Release 1.1.0 — 2026-09-17

This release updates the existing library; SQL Server defaults and host-owned
persistence registration remain unchanged. The proposed production SQLite
expansion is cancelled. Existing SQLite samples/tests do not establish a new
production-support commitment.

## Changes

- Update compatible stable dependencies and .NET 10 servicing packages.
- Preserve existing BrighterTools integrations except where explicitly noted below.
- Validate Release builds and packages before publication.

The React companion release is `2.0.0`. React 18 remains supported.

## Coordinated backend-first upgrade

NuGet `BrighterTools.Auth 1.1.0` adds contact-email request contracts and workflow
members. Existing hosts still compile, but the default implementations of
`SelectNotificationEmailAsync` and `RemoveContactEmailAsync` throw
`NotSupportedException` until the host implements them.

npm `@brightertools/auth-react 2.0.0` is a **breaking release**:

- Require `react-router-dom ^7.18.4`; remove obsolete Router 5 type packages.
- Add the required contact-email members to custom `AuthApiClient` and complete
  `AuthApiEndpoints` implementations.
- Implement authenticated `POST /account/contact-email/select` and
  `POST /account/contact-email/remove` under the configured API prefix.
- Support `addOnly` when verifying a notification/contact email.
- Deploy host database changes and backend endpoints before the new UI.

Invitation branding is product-neutral; localization/body classes work while
loading and loaded. Missing current-user email is unknown, not a mismatch;
server-side invitation authorization remains required. Signup consent styling
and contact-email workflows have regression coverage.

MyRipple's Apple profile handling, recipient-selection rules and database
migrations are application code, not shipped by this library. Adfast2 must
implement or adopt its own equivalents. Real Apple callbacks, native devices and
relay-email delivery remain deployment-time checks. Use an Apple-registered
HTTPS domain/return URL, not localhost.

## Publication

Use `.github/workflows/publish-tool.yml` on the release commit. The workflow
validates before publishing and uses the production environment with registry
trusted publishing. Registry policies must authorize this repository and workflow;
a locally built package is not proof of successful publication.
