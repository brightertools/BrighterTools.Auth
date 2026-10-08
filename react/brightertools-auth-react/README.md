# @brightertools/auth-react

React companion components, hooks, API adapters, and localization helpers for `BrighterTools.Auth`.

```powershell
npm install @brightertools/auth-react
```

The host app owns routing, localization storage, API endpoints, token persistence policy, and provider credentials. This package owns reusable UI workflow components and typed adapter contracts.

Version 2.0.1 retains refresh credentials through transient failures while `isAuthenticated` and `user` enforce JWT expiry. Do not use a non-null `session` as an authentication guard. Upgrade the backend to BrighterTools.Auth 1.1.1 and preserve `invalid_refresh_token` failure codes. Refresh retries are bounded and honor Retry-After; `createAuthApi` defaults to a 30-second timeout. Web Locks coordinate same-origin tabs where supported. See the repository's `docs/refresh-resilience.md` for rollout details.

Build and validate:

Use Node.js 24.15 or newer on the 24.x line for the current development tools.

```powershell
npm install
npm test
npm run build
npm run pack:dry-run
```

## Contact-email rollout

Deploy the host backend before upgrading this UI. The default API adapter now calls
`POST /account/contact-email/select` and `POST /account/contact-email/remove`
(under the configured API prefix), with a JSON `{ "email": "..." }` body and
an `AccountLoginMethodsResponse` in the normal API envelope. Implement the matching
workflow methods, enforce authenticated user ownership, and support `addOnly: true`
on the notification-email challenge endpoint. The interface defaults throw
`NotSupportedException`; they preserve compilation, not working endpoint behavior.

Custom `AuthApiClient` implementations and complete `AuthApiEndpoints` objects must
also add the two new members. Deploy any host contact-email database migration first.
The library does not ship MyRipple's notification-recipient policy, Apple profile
handling, or database migration: other hosts must implement their own equivalents.

## Breaking compatibility changes in 2.0.0

Version 2.0.0 requires React Router DOM ^7.18.4 (React 18 is still supported).
Upgrade the host router before installing it; Router 6 is no longer in the peer
contract. Existing react-router-dom imports and declarative routing can remain.
Remove obsolete @types/react-router-dom v5 references; the router ships its types.

The required contact-email members in AuthApiClient/AuthApiEndpoints and the new
router requirement are breaking changes in this major npm release. Invitation text/body overrides work in all states; additional
message overrides are optional and default to product-neutral English.
