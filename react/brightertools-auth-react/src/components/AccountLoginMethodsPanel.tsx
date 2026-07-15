import { useEffect, useMemo, useState } from "react";
import {
  defaultAccountLoginMethodsText,
  defaultEmailVerificationFieldText,
  formatAuthText,
  getAuthProviderLabel,
  resolveAuthProviderUiConfigs,
  type AuthProviderUiConfig,
  type AuthUiTextOverrides
} from "../authUi";
import { AuthProviderButton } from "./AuthProviderButton";
import { EmailVerificationField } from "./EmailVerificationField";
import { GoogleCredentialButton } from "./GoogleCredentialButton";
import { PasswordField } from "./PasswordField";
import { isPasswordValid, PasswordRulesChecklist } from "./PasswordRulesChecklist";
import type { AccountLoginMethods, AuthProviderType, EmailAddressCandidate, EmailChallengeDeliveryMode, LinkedProvider } from "../types/auth";

const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

export interface AccountLoginIdentity {
  value: string;
  type?: "username" | "email" | "unknown";
}

export interface CompletePasswordSetupInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AccountLoginMethodsPanelProps {
  className?: string;
  providerUi?: AuthProviderUiConfig[];
  textOverrides?: AuthUiTextOverrides;
  loginIdentity?: AccountLoginIdentity;
  details: AccountLoginMethods | null;
  googleClientId?: string;
  appleEnabled?: boolean;
  microsoftEnabled?: boolean;
  busyProvider?: AuthProviderType | null;
  busyAction?: string | null;
  emailChallengeId?: string | null;
  verificationCode?: string;
  notificationEmailChallengeId?: string | null;
  notificationVerificationCode?: string;
  passwordSetupEmailVerified?: boolean;
  minimumPasswordLength?: number;
  onVerificationCodeChange?: (code: string) => void;
  onClearEmailVerification?: () => void;
  onNotificationVerificationCodeChange?: (code: string) => void;
  onClearNotificationEmailVerification?: () => void;
  onRefresh?: () => Promise<void> | void;
  onRequestLoginEmailChange: (email: string, deliveryMode: EmailChallengeDeliveryMode) => Promise<void> | void;
  onVerifyLoginEmailCode: () => Promise<void> | void;
  onRequestNotificationEmailChange: (email: string, deliveryMode: EmailChallengeDeliveryMode) => Promise<void> | void;
  onVerifyNotificationEmailCode: () => Promise<void> | void;
  onRequestPasswordSetup: () => Promise<void> | void;
  onCompletePasswordSetup?: (request: CompletePasswordSetupInput) => Promise<void> | void;
  onChangePassword?: (request: ChangePasswordInput) => Promise<void> | void;
  onRemovePasswordLogin?: () => Promise<void> | void;
  onGoogleCredential?: (credential: string) => void;
  onAppleClick?: () => void;
  onMicrosoftClick?: () => void;
  onUnlinkProvider: (provider: LinkedProvider) => Promise<void> | void;
  onError?: (message: string) => void;
}

export function AccountLoginMethodsPanel({
  className,
  providerUi,
  textOverrides,
  loginIdentity,
  details,
  googleClientId,
  appleEnabled,
  microsoftEnabled,
  busyProvider,
  busyAction,
  emailChallengeId,
  verificationCode = "",
  notificationEmailChallengeId,
  notificationVerificationCode = "",
  passwordSetupEmailVerified = false,
  minimumPasswordLength = 8,
  onVerificationCodeChange,
  onClearEmailVerification,
  onNotificationVerificationCodeChange,
  onClearNotificationEmailVerification,
  onRequestLoginEmailChange,
  onVerifyLoginEmailCode,
  onRequestNotificationEmailChange,
  onVerifyNotificationEmailCode,
  onCompletePasswordSetup,
  onChangePassword,
  onRemovePasswordLogin,
  onGoogleCredential,
  onAppleClick,
  onMicrosoftClick,
  onUnlinkProvider
}: AccountLoginMethodsPanelProps) {
  const accountText = useMemo(() => ({ ...defaultAccountLoginMethodsText, ...textOverrides?.accountLoginMethods }), [textOverrides]);
  const emailVerificationText = useMemo(() => ({ ...defaultEmailVerificationFieldText, ...textOverrides?.emailVerificationField }), [textOverrides]);
  const providerLabel = (provider: string | number | null | undefined) => getAuthProviderLabel(provider, textOverrides);
  const providers = details?.providers ?? [];
  const candidates = details?.notificationEmailCandidates ?? [];
  const resolvedProviderUi = useMemo(() => resolveAuthProviderUiConfigs({
    providerUi,
    googleClientId,
    appleClientId: appleEnabled ? "enabled" : undefined,
    microsoftClientId: microsoftEnabled ? "enabled" : undefined,
    microsoftAuthority: microsoftEnabled ? "enabled" : undefined
  }), [appleEnabled, googleClientId, microsoftEnabled, providerUi]);
  const candidateLabel = (candidate: EmailAddressCandidate) => {
    const source = candidate.sourceProvider ?? candidate.source;
    return source ? `${candidate.email} (${providerLabel(source)})` : candidate.email;
  };
  const firstProviderEmail = useMemo(() => providers.find(provider => provider.email && !provider.email.endsWith("@privaterelay.appleid.com"))?.email ?? "", [providers]);
  const recommendedNotificationEmail = details?.recommendedNotificationEmail ?? candidates.find(x => x.canUseForNotifications)?.email ?? "";
  const suggestedEmail = details?.primaryEmailIsPrivateRelay ? (recommendedNotificationEmail || firstProviderEmail) : (details?.email || recommendedNotificationEmail || firstProviderEmail);
  const suggestedNotificationEmail = details?.notificationEmail || recommendedNotificationEmail || suggestedEmail;
  const [email, setEmail] = useState(suggestedEmail);
  const [notificationEmail, setNotificationEmail] = useState(suggestedNotificationEmail);
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [setupError, setSetupError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [editingLoginEmail, setEditingLoginEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRemovePasswordModal, setShowRemovePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const hasGoogle = providers.some(provider => String(provider.provider) === "Google" || String(provider.provider) === "2");
  const hasApple = providers.some(provider => String(provider.provider) === "Apple" || String(provider.provider) === "3");
  const hasMicrosoft = providers.some(provider => String(provider.provider) === "Microsoft" || String(provider.provider) === "4");
  const hasPasswordLogin = details?.hasPassword === true;
  const usableMethodCount = providers.length + (hasPasswordLogin ? 1 : 0);
  const canRemovePasswordLogin = hasPasswordLogin && providers.length > 0;
  const emailMatchesAccountLogin = !!details?.email && details.email.toLowerCase() === email.trim().toLowerCase();
  const usingPrivateRelayEmail = !!details?.primaryEmailIsPrivateRelay && emailMatchesAccountLogin;
  const passwordLoginEmailVerified = hasPasswordLogin && !editingLoginEmail && !usingPrivateRelayEmail && !!details?.emailVerified && emailMatchesAccountLogin;
  const setupEmailVerified = !hasPasswordLogin && !editingLoginEmail && !usingPrivateRelayEmail && (passwordSetupEmailVerified || (!!details?.emailVerified && emailMatchesAccountLogin));
  const notificationEmailVerified = !!details?.notificationEmailVerified && !!details.notificationEmail && details.notificationEmail.toLowerCase() === notificationEmail.trim().toLowerCase();
  const setupPasswordValid = isPasswordValid(setupPassword, setupConfirmPassword, minimumPasswordLength);
  const changePasswordValid = currentPassword.length > 0 && isPasswordValid(newPassword, confirmNewPassword, minimumPasswordLength);
  const canSavePasswordSetup = setupEmailVerified && setupPasswordValid;
  const emailChallengeActive = !!emailChallengeId;
  const notificationChallengeActive = !!notificationEmailChallengeId;
  const rawLoginIdentity = loginIdentity?.value?.trim() ?? "";
  const resolvedLoginIdentityType = loginIdentity?.type && loginIdentity.type !== "unknown"
    ? loginIdentity.type
    : (rawLoginIdentity ? (isEmail(rawLoginIdentity) ? "email" : "username") : "unknown");
  const legacyUsername = useMemo(() => {
    if (!rawLoginIdentity || resolvedLoginIdentityType !== "username" || isEmail(rawLoginIdentity)) {
      return "";
    }

    const currentLoginEmail = details?.email?.trim().toLowerCase() ?? "";
    return currentLoginEmail && rawLoginIdentity.toLowerCase() === currentLoginEmail ? "" : rawLoginIdentity;
  }, [details?.email, rawLoginIdentity, resolvedLoginIdentityType]);

  useEffect(() => {
    setEmail(suggestedEmail);
    setNotificationEmail(suggestedNotificationEmail);
    setSetupError("");
    setNotificationError("");
    setEditingLoginEmail(false);
  }, [suggestedEmail, suggestedNotificationEmail]);

  const clearEmailVerification = () => {
    setSetupError("");
    setEditingLoginEmail(true);
    onVerificationCodeChange?.("");
    onClearEmailVerification?.();
  };

  const clearNotificationEmailVerification = () => {
    setNotificationError("");
    onNotificationVerificationCodeChange?.("");
    onClearNotificationEmailVerification?.();
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

  const updateNotificationEmail = (value: string) => {
    setNotificationEmail(value);
    setNotificationError("");
    if (notificationEmailChallengeId) {
      onNotificationVerificationCodeChange?.("");
      onClearNotificationEmailVerification?.();
    }
  };

  const requestEmailVerification = async (value: string) => {
    const trimmed = value.trim();
    if (!isEmail(trimmed)) {
      setSetupError(accountText.invalidEmailMessage);
      return;
    }

    setSetupError("");
    await onRequestLoginEmailChange(trimmed, "CodeAndLink");
  };

  const requestNotificationEmailVerification = async (value: string) => {
    const trimmed = value.trim();
    if (!isEmail(trimmed)) {
      setNotificationError(accountText.invalidEmailMessage);
      return;
    }

    setNotificationError("");
    await onRequestNotificationEmailChange(trimmed, "CodeAndLink");
  };

  const savePasswordSetup = async () => {
    if (!setupEmailVerified) {
      setSetupError(accountText.verifyEmailBeforeSavingPasswordMessage);
      return;
    }

    if (!setupPasswordValid) {
      setSetupError(accountText.passwordRequirementsBeforeSavingMessage);
      return;
    }

    setSetupError("");
    await onCompletePasswordSetup?.({ email: email.trim(), password: setupPassword });
  };

  const savePasswordChange = async () => {
    if (!changePasswordValid) {
      setSetupError(accountText.passwordRequirementsBeforeChangingMessage);
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
      setSetupError(accountText.addProviderBeforePasswordRemovalMessage);
      return;
    }

    setSetupError("");
    await onRemovePasswordLogin?.();
    setShowRemovePasswordModal(false);
  };

  const showNotificationEmailSetup = !!details?.requiresNotificationEmailSetup || !!details?.notificationEmail || candidates.length > 0;

  return (
    <div className={["bt-auth-account-login-methods", className].filter(Boolean).join(" ")}>
      {showNotificationEmailSetup && (
        <section className="border rounded-3 p-3 mb-4">
          {details?.requiresNotificationEmailSetup && (
            <div className="alert alert-warning py-2">
              <strong>{accountText.notificationEmailRequiredTitle}</strong> {accountText.notificationEmailRequiredDescription}
            </div>
          )}
          {details?.notificationEmail && !details.requiresNotificationEmailSetup && (
            <div className="alert alert-success py-2 small">
              {accountText.notificationEmailValueLabel} <strong>{details.notificationEmail}</strong>
            </div>
          )}
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
            <div>
              <h2 className="h6 mb-1">{accountText.notificationEmailHeading}</h2>
              <p className="small text-muted mb-0">{accountText.notificationEmailDescription}</p>
            </div>
            {notificationEmailVerified ? <span className="badge text-bg-success align-self-start">{accountText.verifiedBadgeLabel}</span> : <span className="badge text-bg-warning align-self-start">{accountText.needsVerificationBadgeLabel}</span>}
          </div>
          {candidates.length > 0 && (
            <div className="mb-3">
              <div className="small fw-semibold mb-2">{accountText.suggestedVerifiedEmailsLabel}</div>
              <div className="d-flex flex-wrap gap-2">
                {candidates.filter(candidate => candidate.canUseForNotifications).map(candidate => (
                  <button key={candidate.email} type="button" className="btn btn-outline-secondary btn-sm" onClick={() => updateNotificationEmail(candidate.email)}>
                    {candidateLabel(candidate)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {notificationError && <div className="alert alert-danger py-2">{notificationError}</div>}
          <label className="form-label">{accountText.notificationEmailAddressLabel}</label>
          <EmailVerificationField
            email={notificationEmail}
            verified={notificationEmailVerified}
            challengeActive={notificationChallengeActive && !notificationEmailVerified}
            verificationCode={notificationVerificationCode}
            busySending={busyAction === "notification-email"}
            busyVerifying={busyAction === "verify-notification-code"}
            emailPlaceholder={emailVerificationText.emailPlaceholder}
            codePlaceholder={emailVerificationText.codePlaceholder}
            sendLabel={emailVerificationText.sendLabel}
            sendingLabel={emailVerificationText.sendingLabel}
            verifyLabel={emailVerificationText.verifyLabel}
            verifyingLabel={emailVerificationText.verifyingLabel}
            verifiedLabel={emailVerificationText.verifiedLabel}
            changeEmailAddressLabel={emailVerificationText.changeEmailAddressLabel}
            changeEmailLabel={emailVerificationText.changeEmailLabel}
            resendCodeLabel={emailVerificationText.resendCodeLabel}
            successMessage={notificationChallengeActive && !notificationEmailVerified ? accountText.enterCodeSentMessage : undefined}
            errorMessage={notificationError && !isEmail(notificationEmail) ? notificationError : undefined}
            onEmailChange={updateNotificationEmail}
            onRequestVerification={requestNotificationEmailVerification}
            onVerificationCodeChange={code => onNotificationVerificationCodeChange?.(code)}
            onVerifyCode={onVerifyNotificationEmailCode}
            onChangeEmail={clearNotificationEmailVerification}
            onResend={() => requestNotificationEmailVerification(notificationEmail)}
          />
        </section>
      )}

      {legacyUsername && (
        <section className="border rounded-3 p-3 mb-4">
          <div className="small text-muted mb-1">{accountText.legacyUsernameLabel}</div>
          <div className="fw-semibold">{legacyUsername}</div>
        </section>
      )}

      {!hasPasswordLogin && (
        <section className="border rounded-3 p-3 mb-4">
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
            <div>
              <h2 className="h6 mb-1">{accountText.setupPasswordHeading}</h2>
              <p className="small text-muted mb-0">{accountText.setupPasswordDescription}</p>
              {suggestedEmail && <p className="small text-muted mt-2 mb-0">{formatAuthText(accountText.suggestedAccountEmailMessage, { email: suggestedEmail })}</p>}
            </div>
            <span className="badge text-bg-secondary align-self-start">{accountText.notSetUpBadgeLabel}</span>
          </div>

          {setupError && <div className="alert alert-danger py-2">{setupError}</div>}
          {details?.pendingEmail && <div className="alert alert-warning py-2 small">{formatAuthText(accountText.pendingEmailVerificationLabel, { email: details.pendingEmail })}</div>}

          <label className="form-label">{accountText.emailAddressLabel}</label>
          <EmailVerificationField
            email={email}
            verified={setupEmailVerified}
            challengeActive={emailChallengeActive && !setupEmailVerified}
            verificationCode={verificationCode}
            busySending={busyAction === "email"}
            busyVerifying={busyAction === "verify-code"}
            emailPlaceholder={emailVerificationText.emailPlaceholder}
            codePlaceholder={emailVerificationText.codePlaceholder}
            sendLabel={emailVerificationText.sendLabel}
            sendingLabel={emailVerificationText.sendingLabel}
            verifyLabel={emailVerificationText.verifyLabel}
            verifyingLabel={emailVerificationText.verifyingLabel}
            verifiedLabel={emailVerificationText.verifiedLabel}
            changeEmailAddressLabel={emailVerificationText.changeEmailAddressLabel}
            changeEmailLabel={emailVerificationText.changeEmailLabel}
            resendCodeLabel={emailVerificationText.resendCodeLabel}
            successMessage={emailChallengeActive && !setupEmailVerified ? accountText.enterCodeSentMessage : undefined}
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
              {formatAuthText(accountText.useVerifiedEmailLabel, { email: details.email })}
            </button>
          )}

          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <PasswordField label={accountText.passwordLabel} value={setupPassword} autoComplete="new-password" onChange={setSetupPassword} />
            </div>
            <div className="col-md-6">
              <PasswordField label={accountText.confirmPasswordLabel} value={setupConfirmPassword} autoComplete="new-password" onChange={setSetupConfirmPassword} />
            </div>
          </div>
          <PasswordRulesChecklist password={setupPassword} confirmPassword={setupConfirmPassword} minimumLength={minimumPasswordLength} />

          <button type="button" className="btn btn-primary mt-3" disabled={busyAction === "complete-password-setup" || !canSavePasswordSetup} onClick={() => void savePasswordSetup()}>
            {busyAction === "complete-password-setup" ? accountText.savingLabel : accountText.saveEmailPasswordLoginLabel}
          </button>
        </section>
      )}

      {hasPasswordLogin && (
        <>
          <section className="border rounded-3 p-3 mb-4">
            <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
              <div>
                <h2 className="h6 mb-1">{accountText.loginEmailHeading}</h2>
                <p className="small text-muted mb-0">{accountText.loginEmailDescription}</p>
              </div>
              {usingPrivateRelayEmail ? <span className="badge text-bg-warning align-self-start">{accountText.privateRelayBadgeLabel}</span> : passwordLoginEmailVerified ? <span className="badge text-bg-success align-self-start">{accountText.verifiedBadgeLabel}</span> : <span className="badge text-bg-warning align-self-start">{accountText.needsVerificationBadgeLabel}</span>}
            </div>
            {details?.pendingEmail && <div className="alert alert-warning py-2 small">{formatAuthText(accountText.pendingEmailVerificationLabel, { email: details.pendingEmail })}</div>}
            <label className="form-label">{accountText.emailAddressLabel}</label>
            <EmailVerificationField
              email={email}
              verified={passwordLoginEmailVerified}
              challengeActive={emailChallengeActive && !passwordLoginEmailVerified}
              verificationCode={verificationCode}
              busySending={busyAction === "email"}
              busyVerifying={busyAction === "verify-code"}
              emailPlaceholder={emailVerificationText.emailPlaceholder}
              codePlaceholder={emailVerificationText.codePlaceholder}
              sendLabel={emailVerificationText.sendLabel}
              sendingLabel={emailVerificationText.sendingLabel}
              verifyLabel={emailVerificationText.verifyLabel}
              verifyingLabel={emailVerificationText.verifyingLabel}
              verifiedLabel={emailVerificationText.verifiedLabel}
              changeEmailAddressLabel={emailVerificationText.changeEmailAddressLabel}
              changeEmailLabel={emailVerificationText.changeEmailLabel}
              resendCodeLabel={emailVerificationText.resendCodeLabel}
              successMessage={emailChallengeActive && !passwordLoginEmailVerified ? accountText.enterCodeSentMessage : undefined}
              errorMessage={setupError && !isEmail(email) ? setupError : undefined}
              onEmailChange={updateEmail}
              onRequestVerification={requestEmailVerification}
              onVerificationCodeChange={code => onVerificationCodeChange?.(code)}
              onVerifyCode={onVerifyLoginEmailCode}
              onChangeEmail={clearEmailVerification}
              onResend={() => requestEmailVerification(email)}
            />
          </section>

          <section className="border rounded-3 p-3 mb-4">
            <div className="d-flex flex-wrap justify-content-between gap-2">
              <div>
                <h2 className="h6 mb-1">{accountText.passwordHeading}</h2>
                <p className="small text-muted mb-0">{accountText.passwordDescription}</p>
              </div>
              <span className="badge text-bg-success align-self-start">{accountText.enabledBadgeLabel}</span>
            </div>
            {!showChangePassword && (
              <button type="button" className="btn btn-outline-primary mt-3" disabled={!details?.email} onClick={() => setShowChangePassword(true)}>
                {accountText.changePasswordLabel}
              </button>
            )}
            {showChangePassword && (
              <div className="mt-3">
                <div className="mb-3">
                  <label className="form-label">{accountText.currentPasswordLabel}</label>
                  <input type="password" className="form-control" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <PasswordField label={accountText.newPasswordLabel} value={newPassword} autoComplete="new-password" onChange={setNewPassword} />
                  </div>
                  <div className="col-md-6">
                    <PasswordField label={accountText.confirmNewPasswordLabel} value={confirmNewPassword} autoComplete="new-password" onChange={setConfirmNewPassword} />
                  </div>
                </div>
                <PasswordRulesChecklist password={newPassword} confirmPassword={confirmNewPassword} minimumLength={minimumPasswordLength} />
                <div className="d-flex flex-wrap gap-2 mt-3">
                  <button type="button" className="btn btn-primary" disabled={busyAction === "change-password" || !changePasswordValid} onClick={() => void savePasswordChange()}>
                    {busyAction === "change-password" ? accountText.updatingLabel : accountText.updatePasswordLabel}
                  </button>
                  <button type="button" className="btn btn-outline-secondary" disabled={busyAction === "change-password"} onClick={() => setShowChangePassword(false)}>
                    {accountText.cancelLabel}
                  </button>
                </div>
              </div>
            )}
            <div className="border-top mt-4 pt-3">
              <h3 className="h6 mb-1">{accountText.removePasswordHeading}</h3>
              <p className="small text-muted mb-2">{accountText.removePasswordDescription}</p>
              {!canRemovePasswordLogin && <p className="small text-warning mb-2">{accountText.connectProviderBeforeRemovingPasswordMessage}</p>}
              <button type="button" className="btn btn-outline-danger btn-sm" disabled={busyAction === "remove-password" || !canRemovePasswordLogin} onClick={() => setShowRemovePasswordModal(true)}>
                {busyAction === "remove-password" ? accountText.removingLabel : accountText.removePasswordLoginLabel}
              </button>
            </div>
          </section>
        </>
      )}

      <h2 className="h6 mt-3">{accountText.connectedProvidersHeading}</h2>
      <div className="list-group mb-4">
        {providers.length === 0 ? (
          <div className="list-group-item text-muted small">{accountText.noConnectedProvidersMessage}</div>
        ) : providers.map(provider => (
          <div className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-2" key={`${provider.provider}-${provider.providerSubject}`}>
            <div>
              <strong>{providerLabel(provider.provider)}</strong>
              {provider.email && <div className="small text-muted">{provider.email}</div>}
              {provider.emailVerified && <div className="small text-success fw-semibold">{formatAuthText(accountText.verifiedByProviderMessage, { provider: providerLabel(provider.provider) })}</div>}
            </div>
            <button type="button" className="btn btn-outline-danger btn-sm" disabled={busyProvider === provider.provider || usableMethodCount <= 1} onClick={() => void onUnlinkProvider(provider)}>
              {accountText.removeLabel}
            </button>
          </div>
        ))}
      </div>

      <div className="row g-3">
        {resolvedProviderUi.map(config => {
          if (config.provider === "Google" && googleClientId) {
            return (
              <div className="col-md-6" key={config.provider}>
                <div className="border rounded-3 p-3 h-100">
                  <h3 className="h6">{providerLabel("Google")}</h3>
                  <p className="small text-muted">{hasGoogle ? formatAuthText(accountText.providerConnectedDescription, { provider: providerLabel("Google") }) : formatAuthText(accountText.providerConnectDescription, { provider: providerLabel("Google") })}</p>
                  {!hasGoogle && onGoogleCredential && <GoogleCredentialButton clientId={googleClientId} text={config.googleText ?? "continue_with"} onCredential={onGoogleCredential} onError={() => undefined} />}
                </div>
              </div>
            );
          }

          if (config.provider === "Apple" && appleEnabled) {
            return (
              <div className="col-md-6" key={config.provider}>
                <div className="border rounded-3 p-3 h-100">
                  <h3 className="h6">{providerLabel("Apple")}</h3>
                  <p className="small text-muted">{hasApple ? formatAuthText(accountText.providerConnectedDescription, { provider: providerLabel("Apple") }) : formatAuthText(accountText.providerConnectDescription, { provider: providerLabel("Apple") })}</p>
                  {!hasApple && onAppleClick && <AuthProviderButton variant="apple" label={config.label ?? accountText.connectAppleLabel} busyLabel={config.busyLabel ?? accountText.openingAppleLabel} busy={busyProvider === "Apple"} onClick={() => void onAppleClick()} />}
                </div>
              </div>
            );
          }

          if (config.provider === "Microsoft" && microsoftEnabled) {
            return (
              <div className="col-md-6" key={config.provider}>
                <div className="border rounded-3 p-3 h-100">
                  <h3 className="h6">{providerLabel("Microsoft")}</h3>
                  <p className="small text-muted">{hasMicrosoft ? formatAuthText(accountText.providerConnectedDescription, { provider: providerLabel("Microsoft") }) : formatAuthText(accountText.providerConnectDescription, { provider: providerLabel("Microsoft") })}</p>
                  {!hasMicrosoft && onMicrosoftClick && <AuthProviderButton variant="microsoft" label={config.label ?? accountText.connectMicrosoftLabel} busyLabel={config.busyLabel ?? accountText.openingMicrosoftLabel} busy={busyProvider === "Microsoft"} onClick={() => void onMicrosoftClick()} />}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {showRemovePasswordModal && (
        <div className="modal d-block bt-auth-modal" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="bt-auth-remove-password-title">
          <div className="modal-backdrop show" />
          <div className="modal-dialog modal-dialog-centered position-relative" style={{ zIndex: 1060 }} role="document">
            <div className="modal-content shadow-lg">
              <div className="modal-header">
                <h2 className="modal-title h5" id="bt-auth-remove-password-title">{accountText.removePasswordModalTitle}</h2>
                <button type="button" className="btn-close" aria-label="Close" disabled={busyAction === "remove-password"} onClick={() => setShowRemovePasswordModal(false)} />
              </div>
              <div className="modal-body">
                <p className="text-danger fw-semibold mb-2">{accountText.removePasswordModalWarning}</p>
                <p className="mb-2">{accountText.removePasswordModalBody}</p>
                <p className="small text-muted mb-0">{accountText.removePasswordModalFooter}</p>
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-outline-secondary" disabled={busyAction === "remove-password"} onClick={() => setShowRemovePasswordModal(false)}>{accountText.cancelLabel}</button>
                <button type="button" className="btn btn-danger" disabled={busyAction === "remove-password"} onClick={() => void removePasswordLogin()}>
                  {busyAction === "remove-password" ? accountText.removingLabel : accountText.removeEmailLoginLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

