# Refresh resilience — Auth 1.1.1 / auth-react 2.0.1

The provider no longer destroys persisted sessions on network errors, timeouts, rate limits, server errors or unclassified refresh failures. The API adapter supplies HTTP status and Retry-After metadata and applies a 30-second request timeout. Automatic refresh retries are bounded (1, 5, 15, 30 and 60 seconds); Retry-After takes precedence. Online/focus events can resume an exhausted cycle after the deferred time.

Access-token expiry is still enforced: `user` becomes null and `isAuthenticated` becomes false at JWT expiry, even though the refresh session remains stored for recovery. `AuthGuard` uses `isAuthenticated`, not the mere presence of stored credentials. Hosts must not treat `session !== null` as proof of current authentication. Valid background refresh does not set the loading flag or unmount forms.

NuGet 1.1.1 emits `AuthFailureException` with code `invalid_refresh_token` for missing, expired or revoked tokens. Hosts should preserve that code in the failed response envelope; Adfast already does. Explicit 401 rejection or recognised session-revocation codes clear the session. No refresh lifetime, rotation or database behavior is changed.

In-flight responses cannot restore sessions after logout, explicit replacement, storage changes or unmount. Concurrent requests are coalesced. Web Locks serialize rotating refresh requests across same-origin tabs where supported; otherwise the provider still checks storage before applying responses. All tabs must use the same storageKey. Unsupported Web Locks environments do not receive a cross-tab serialization guarantee.

Deploy the backend contract before the frontend. Host compatibility endpoints that issue refresh cookies must update the same secure host-only cookie used by refresh. Transient connectivity is not treated as evidence of revocation. A lost response after server-side rotation can still require login if neither cookie nor stored token received the replacement; this release does not weaken replay protection to mask that case.

No package change can diagnose or prevent the underlying IIS/network connection resets. Use application-pool and network evidence to investigate those independently.
