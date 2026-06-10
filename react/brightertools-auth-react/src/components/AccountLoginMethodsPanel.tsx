import { useEffect, useMemo, useState } from "react";
import { AuthProviderButton } from "./AuthProviderButton";
import { EmailVerificationField } from "./EmailVerificationField";
import { GoogleCredentialButton } from "./GoogleCredentialButton";
import { PasswordField } from "./PasswordField";
import { isPasswordValid, PasswordRulesChecklist } from "./PasswordRulesChecklist";
import type { AccountLoginMethods, AuthProviderType, EmailChallengeDeliveryMode, LinkedProvider } from "../types/auth";

const providerLabel = (provider: AuthProviderType) => {
  if (provider === "Password") return "Email / Password";
  if (provider === "EmailOtp") return "Email code";
  return provider;
};

const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

export interface CompletePasswordSetupInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AccountLoginMethodsPanelProps {
  details: AccountLoginMethods | null;
  googleClientId?: string;
  appleEnabled?: boolean;
  busyProvider?: AuthProviderType | null;
  busyAction?: string | null;
  emailChallengeId?: string | null;
  verificationCode?: string;
  passwordSetupEmailVerified?: boolean;
  minimumPasswordLength?: number;
  onVerificationCodeChange?: (code: string) => void;
  onClearEmailVerification?: () => void;
  onRefresh?: () => Promise<void> | void;
  onRequestLoginEmailChange: (email: string, deliveryMode: EmailChallengeDeliveryMode) => Promise<void> | void;
  onVerifyLoginEmailCode: () => Promise<void> | void;
  onRequestPasswordSetup: () => Promise<void> | void;
  onCompletePasswordSetup?: (request: CompletePasswordSetupInput) => Promise<void> | void;
  onChangePassword?: (request: ChangePasswordInput) => Promise<void> | void;
  onRemovePasswordLogin?: () => Promise<void> | void;
  onGoogleCredential?: (credential: string) => void;
  onAppleClick?: () => void;
  onUnlinkProvider: (provider: LinkedProvider) => Promise<void> | void;
  onError?: (message: string) => void;
}

export function AccountLoginMethodsPanel({ details, googleClientId, appleEnabled, busyProvider, busyAction, emailChallengeId, verificationCode = "", passwordSetupEmailVerified = false, minimumPasswordLength = 8, onVerificationCodeChange, onClearEmailVerification, onRequestLoginEmailChange, onVerifyLoginEmailCode, onCompletePasswordSetup, onChangePassword, onRemovePasswordLogin, onGoogleCredential, onAppleClick, onUnlinkProvider, onError }: AccountLoginMethodsPanelProps) {
  const providers = details?.providers ?? [];
  const firstProviderEmail = useMemo(() => providers.find(provider => provider.email)?.email ?? "", [providers]);
  const suggestedEmail = details?.email || firstProviderEmail;
  const [email, setEmail] = useState(suggestedEmail);
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [setupError, setSetupError] = useState("");
  const [editingLoginEmail, setEditingLoginEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRemovePasswordModal, setShowRemovePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const hasGoogle = providers.some(provider => provider.provider === "Google");
  const hasApple = providers.some(provider => provider.provider === "Apple");
  const hasPasswordLogin = details?.hasPassword === true;
  const usableMethodCount = providers.length + (hasPasswordLogin ? 1 : 0);
  const canRemovePasswordLogin = hasPasswordLogin && providers.length > 0;
  const emailMatchesAccountLogin = !!details?.email && details.email.toLowerCase() === email.trim().toLowerCase();
  const usingPrivateRelayEmail = !!details?.primaryEmailIsPrivateRelay && emailMatchesAccountLogin;
  const passwordLoginEmailVerified = hasPasswordLogin && !editingLoginEmail && !usingPrivateRelayEmail && !!details?.emailVerified && emailMatchesAccountLogin;
  const setupEmailVerified = !hasPasswordLogin && !editingLoginEmail && !usingPrivateRelayEmail && (passwordSetupEmailVerified || (!!details?.emailVerified && emailMatchesAccountLogin));
  const setupPasswordValid = isPasswordValid(setupPassword, setupConfirmPassword, minimumPasswordLength);
  const changePasswordValid = currentPassword.length > 0 && isPasswordValid(newPassword, confirmNewPassword, minimumPasswordLength);
  const canSavePasswordSetup = setupEmailVerified && setupPasswordValid;
  const emailChallengeActive = !!emailChallengeId;

  useEffect(() => {
    setEmail(suggestedEmail);
    setSetupError("");
    setEditingLoginEmail(false);
  }, [suggestedEmail]);

  const clearEmailVerification = () => {
    setSetupError("");
    setEditingLoginEmail(true);
    onVerificationCodeChange?.("");
    onClearEmailVerification?.();
  };

  const useVerifiedLoginEmail = () => {
    setEmail(details?.email ?? suggestedEmail);
    setEditingLoginEmail(false);
    setSetupError("");
    onVerificationCodeChange?.("");
    onClearEmailVerification?.();
  };

  const updateEmail = (value: string) => {
    setEmail(value);
    setSetupError("");
    if (passwordSetupEmailVerified || emailChallengeId) {
      onVerificationCodeChange?.("");
      onClearEmailVerification?.();
    }
  };

  const requestEmailVerification = async (value: string) => {
    const trimmed = value.trim();
    if (!isEmail(trimmed)) {
      setSetupError("Please enter a valid email address.");
      return;
    }

    setSetupError("");
    await onRequestLoginEmailChange(trimmed, "CodeAndLink");
  };

  const savePasswordSetup = async () => {
    if (!setupEmailVerified) {
      setSetupError("Please verify this email before saving a password.");
      return;
    }

    if (!setupPasswordValid) {
      setSetupError("Please complete the password requirements before saving.");
      return;
    }

    setSetupError("");
    await onCompletePasswordSetup?.({ email: email.trim(), password: setupPassword });
  };

  const savePasswordChange = async () => {
    if (!changePasswordValid) {
      setSetupError("Please enter your current password and complete the new password requirements.");
      return;
    }

    setSetupError("");
    await onChangePassword?.({ currentPassword, newPassword });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowChangePassword(false);
  };

  const removePasswordLogin = async () => {
    if (!canRemovePasswordLogin) {
      setSetupError("Add Google, Apple, or another sign-in provider before removing email/password login.");
      return;
    }

    setSetupError("");
    await onRemovePasswordLogin?.();
    setShowRemovePasswordModal(false);
  };

  return (
    <div className="bt-auth-account-login-methods">
      {!hasPasswordLogin && (
        <section className="border rounded-3 p-3 mb-4">
          {details?.requiresNotificationEmailSetup && (
            <div className="alert alert-warning py-2">
              <strong>Notification email required.</strong> You chose to hide your Apple ID email address. Please verify an email address below so we can send important account notifications.
            </div>
          )}
          {details?.notificationEmail && (
            <div className="alert alert-success py-2 small">
              Notification email: <strong>{details.notificationEmail}</strong>
            </div>
          )}
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
            <div>
              <h2 className="h6 mb-1">Set up email/password login</h2>
              <p className="small text-muted mb-0">
                Verify the email you want to use for notifications. You can also choose a password to add email/password login alongside Google, Apple, or future mobile sign-in methods.
              </p>
              {suggestedEmail && <p className="small text-muted mt-2 mb-0">Suggested from your connected account: {suggestedEmail}</p>}
            </div>
            <span className="badge text-bg-secondary align-self-start">Not set up</span>
          </div>

          {setupError && <div className="alert alert-danger py-2">{setupError}</div>}
          {details?.pendingEmail && <div className="alert alert-warning py-2 small">Pending email verification: {details.pendingEmail}</div>}

          <label className="form-label">Email address</label>
          <EmailVerificationField
            email={email}
            verified={setupEmailVerified}
            challengeActive={emailChallengeActive && !setupEmailVerified}
            verificationCode={verificationCode}
            busySending={busyAction === "email"}
            busyVerifying={busyAction === "verify-code"}
            successMessage={emailChallengeActive && !setupEmailVerified ? "Enter the code we sent to this email address." : undefined}
            errorMessage={setupError && !isEmail(email) ? setupError : undefined}
            onEmailChange={updateEmail}
            onRequestVerification={requestEmailVerification}
            onVerificationCodeChange={code => onVerificationCodeChange?.(code)}
            onVerifyCode={onVerifyLoginEmailCode}
            onChangeEmail={clearEmailVerification}
            onResend={() => requestEmailVerification(email)}
          />
          {editingLoginEmail && details?.emailVerified && details.email && (
            <button type="button" className="btn btn-link btn-sm px-0 mt-1 text-decoration-none" onClick={useVerifiedLoginEmail}>
              use {details.email}
            </button>
          )}

          {setupEmailVerified && <div className="alert alert-success py-2 small mt-3">Email verified. We can use this address for important account notifications. Choose a password if you also want to enable email/password login.</div>}

          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <PasswordField label="Password" value={setupPassword} autoComplete="new-password" onChange={setSetupPassword} />
            </div>
            <div className="col-md-6">
              <PasswordField label="Confirm password" value={setupConfirmPassword} autoComplete="new-password" onChange={setSetupConfirmPassword} />
            </div>
          </div>
          <PasswordRulesChecklist password={setupPassword} confirmPassword={setupConfirmPassword} minimumLength={minimumPasswordLength} />

          <button type="button" className="btn btn-primary mt-3" disabled={busyAction === "complete-password-setup" || !canSavePasswordSetup} onClick={() => void savePasswordSetup()}>
            {busyAction === "complete-password-setup" ? "Saving..." : "Save email/password login"}
          </button>
        </section>
      )}

      {hasPasswordLogin && (
        <>
          <section className="border rounded-3 p-3 mb-4">
            {details?.requiresNotificationEmailSetup && (
              <div className="alert alert-warning py-2">
                <strong>Notification email required.</strong> You chose to hide your Apple ID email address. Please verify an email address below so we can send important account notifications.
              </div>
            )}
            {details?.notificationEmail && (
              <div className="alert alert-success py-2 small">
                Notification email: <strong>{details.notificationEmail}</strong>
              </div>
            )}
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
              <div>
                <h2 className="h6 mb-1">Login email</h2>
                <p className="small text-muted mb-0">Used for email/password login, password reset, and passwordless sign-in codes.</p>
              </div>
              {usingPrivateRelayEmail ? <span className="badge text-bg-warning align-self-start">Notification email required</span> : passwordLoginEmailVerified ? <span className="badge text-bg-success align-self-start">Verified</span> : <span className="badge text-bg-warning align-self-start">Needs verification</span>}
            </div>
            {details?.pendingEmail && <div className="alert alert-warning py-2 small">Pending email verification: {details.pendingEmail}</div>}
            <label className="form-label">Email address</label>
            <EmailVerificationField
              email={email}
              verified={passwordLoginEmailVerified}
              challengeActive={emailChallengeActive && !passwordLoginEmailVerified}
              verificationCode={verificationCode}
              busySending={busyAction === "email"}
              busyVerifying={busyAction === "verify-code"}
              successMessage={emailChallengeActive && !passwordLoginEmailVerified ? "Enter the code we sent to this email address." : undefined}
              errorMessage={setupError && !isEmail(email) ? setupError : undefined}
              onEmailChange={updateEmail}
              onRequestVerification={requestEmailVerification}
              onVerificationCodeChange={code => onVerificationCodeChange?.(code)}
              onVerifyCode={onVerifyLoginEmailCode}
              onChangeEmail={clearEmailVerification}
              onResend={() => requestEmailVerification(email)}
            />
            {editingLoginEmail && details?.emailVerified && details.email && (
              <button type="button" className="btn btn-link btn-sm px-0 mt-1 text-decoration-none" onClick={useVerifiedLoginEmail}>
                use {details.email}
              </button>
            )}
          </section>

          <section className="border rounded-3 p-3 mb-4">
            <div className="d-flex flex-wrap justify-content-between gap-2">
              <div>
                <h2 className="h6 mb-1">Password</h2>
                <p className="small text-muted mb-0">Change your email/password login password.</p>
              </div>
              <span className="badge text-bg-success align-self-start">Enabled</span>
            </div>
            {!showChangePassword && (
              <button type="button" className="btn btn-outline-primary mt-3" disabled={!details?.email} onClick={() => setShowChangePassword(true)}>
                Change password
              </button>
            )}
            {showChangePassword && (
              <div className="mt-3">
                <div className="mb-3">
                  <label className="form-label">Current password</label>
                  <input type="password" className="form-control" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <PasswordField label="New password" value={newPassword} autoComplete="new-password" onChange={setNewPassword} />
                  </div>
                  <div className="col-md-6">
                    <PasswordField label="Confirm new password" value={confirmNewPassword} autoComplete="new-password" onChange={setConfirmNewPassword} />
                  </div>
                </div>
                <PasswordRulesChecklist password={newPassword} confirmPassword={confirmNewPassword} minimumLength={minimumPasswordLength} />
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <button type="button" className="btn btn-primary" disabled={busyAction === "change-password" || !changePasswordValid} onClick={() => void savePasswordChange()}>
                    {busyAction === "change-password" ? "Updating..." : "Update password"}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" disabled={busyAction === "change-password"} onClick={() => setShowChangePassword(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="border-top mt-4 pt-3">
              <h3 className="h6 mb-1">Remove email/password login</h3>
              <p className="small text-muted mb-2">
                Your verified email remains on your account, but you will no longer be able to sign in with a password.
              </p>
              {!canRemovePasswordLogin && (
                <p className="small text-warning mb-2">Connect Google or Apple before removing your password login.</p>
              )}
              <button type="button" className="btn btn-outline-danger btn-sm" disabled={busyAction === "remove-password" || !canRemovePasswordLogin} onClick={() => setShowRemovePasswordModal(true)}>
                {busyAction === "remove-password" ? "Removing..." : "Remove email/password login"}
              </button>
            </div>
          </section>
        </>
      )}

      <h2 className="h6 mt-3">Connected providers</h2>
      <div className="list-group mb-4">
        {providers.length === 0 ? (
          <div className="list-group-item text-muted small">No external providers are connected yet.</div>
        ) : providers.map(provider => (
          <div className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-2" key={`${provider.provider}-${provider.providerSubject}`}>
            <div>
              <strong>{providerLabel(provider.provider)}</strong>
              {provider.email && <div className="small text-muted">{provider.email}</div>}
              {provider.emailVerified && <div className="small text-success fw-semibold">Verified by {providerLabel(provider.provider)}</div>}
            </div>
            <button type="button" className="btn btn-outline-danger btn-sm" disabled={busyProvider === provider.provider || usableMethodCount <= 1} onClick={() => void onUnlinkProvider(provider)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="row g-3">
        {googleClientId && (
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100">
              <h3 className="h6">Google</h3>
              <p className="small text-muted">{hasGoogle ? "Google is connected." : "Connect your Google account for quick sign-in."}</p>
              {!hasGoogle && onGoogleCredential && <GoogleCredentialButton clientId={googleClientId} text="continue_with" onCredential={onGoogleCredential} onError={onError} />}
            </div>
          </div>
        )}
        {appleEnabled && (
          <div className="col-md-6">
            <div className="border rounded-3 p-3 h-100">
              <h3 className="h6">Apple</h3>
              <p className="small text-muted">{hasApple ? "Apple is connected." : "Connect Sign in with Apple."}</p>
              {!hasApple && onAppleClick && (
                <AuthProviderButton variant="apple" label="Connect Apple" busyLabel="Opening Apple..." busy={busyProvider === "Apple"} onClick={() => void onAppleClick()} />
              )}
            </div>
          </div>
        )}
      </div>

      {showRemovePasswordModal && (
        <div className="modal d-block bt-auth-modal" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="bt-auth-remove-password-title">
          <div className="modal-backdrop show" />
          <div className="modal-dialog modal-dialog-centered position-relative" style={{ zIndex: 1060 }} role="document">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h2 className="modal-title h5" id="bt-auth-remove-password-title">Remove email login?</h2>
                <button type="button" className="btn-close" aria-label="Close" disabled={busyAction === "remove-password"} onClick={() => setShowRemovePasswordModal(false)} />
              </div>
              <div className="modal-body">
                <p className="text-danger fw-semibold mb-2">This removes email/password login from your account.</p>
                <p className="mb-2">
                  Your current session will stay active, but next time you will need to sign in with another connected provider.
                </p>
                <p className="small text-muted mb-0">
                  Your verified email address will remain on your account for notifications, passwordless email sign-in, and account records.
                </p>
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-outline-secondary" disabled={busyAction === "remove-password"} onClick={() => setShowRemovePasswordModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" disabled={busyAction === "remove-password"} onClick={() => void removePasswordLogin()}>
                  {busyAction === "remove-password" ? "Removing..." : "Remove email login"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

