# Configurable Auth UI

The host owns Bootstrap/theme, public provider settings, routes, product policies and API mappings. The library owns credential forms and reusable workflow state. Do not fork panels to vary these options.

## Public additions

- LoginPanel.passwordlessEnabled: optional, defaults true. Set false when the host has no OTP endpoints; supplied OTP tokens are also ignored.
- WorkspaceSignupPanel: shared details-to-credentials journey. Configure detailFields (name, label, type, required, maxLength, autoComplete), initialDetails and mapDetails. The mapper returns SignupPanel fields and explicit help/marketing opt-ins. Existing SignupPanel consumers remain unchanged.
- ForgotPasswordPanel: optional requestReset(email) transport returning { success, message }, hideFormOnSuccess and formProps for labels. Default uses the AuthProvider API.
- ResetPasswordPanel: optional completeReset(token, password) transport and formProps (labels/passwordRules). Default uses the AuthProvider API. No consumption happens on mount.
- ChangePasswordPanel: current/new/confirmation inputs using the same shared form. Optional changePassword(currentPassword, newPassword), labels/rules and completion callback. Default uses the authenticated account API.
- VerifyEmailLinkPanel: optional verify(token, purpose) adapter for existing activation contracts, messages and actions. A mounted operation shares its request through Strict Mode effect replay. This does not make a consumed server token reusable across reloads.
- styles/auth.css: optional scoped native-reveal suppression for PasswordField. No Bootstrap compilation or product theme is included.

Adapters return false for rejected server responses; they must not silently turn warning/error envelopes into success. CAPTCHA and host-specific legacy response mapping belong in the boundary callback, not a duplicate form. Failure leaves drafts available. Password submissions are guarded against concurrent duplicate submits. A new reset token starts a new operation.

## Current consumers

MediaMarkup and Mosaio use WorkspaceSignupPanel with different configured fields. Mosaio uses LoginPanel with passwordless disabled until its backend supports it. MyRipple uses shared recovery, change-password and activation with its existing routes, CAPTCHA and legacy API mappings; charity/individual signup, native-provider policy and onboarding are retained.

Public default behavior is backward-compatible. Password rules/minimums remain host-provided, and servers remain authoritative. No backend provider, tenant, session, schema or API-key change is implied by UI adoption.

## Verification, 2026-10-20

128 shared React 18 tests; 129 full-suite React 19 consumer checks; public declaration checks on React 18 and 19. The React 19 harness resolves Router from the consumer too, preventing a second React instance. MediaMarkup 112, Mosaio 23 and MyRipple 163 frontend tests pass; three production builds pass. Mocked desktop/mobile browser checks: 2/6/2 respectively. No real email/provider or deployment checks are claimed.

Commands: npm test; npm run build; node verification/check-declarations.mjs [consumer-root]; AUTH_REACT_CONSUMER_ROOT=<installed React 19 app> with vitest run --config verification/auth-ui-react19.config.ts.
