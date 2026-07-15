import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AuthApiError } from "../errors/AuthApiError";
import {
  defaultEmailVerificationFieldText,
  defaultSignupPanelText,
  formatAuthText,
  resolveAuthProviderUiConfigs,
  type AuthProviderUiConfig,
  type AuthUiTextOverrides
} from "../authUi";
import { AuthProviderButton } from "./AuthProviderButton";
import { EmailVerificationField } from "./EmailVerificationField";
import { GoogleCredentialButton } from "./GoogleCredentialButton";
import { LegalConsentCheckbox } from "./SignupForm";
import { PasswordField } from "./PasswordField";
import { isPasswordValid, PasswordRulesChecklist } from "./PasswordRulesChecklist";
import { signInWithApple } from "../services/appleAuth";
import { signInWithMicrosoft } from "../services/microsoftAuth";
import { useAuth } from "../hooks/useAuth";
import { usePasswordSignup } from "../hooks/usePasswordSignup";
import { useSignupEmailVerification } from "../hooks/useSignupEmailVerification";
import type { AuthProviderType } from "../types/auth";

export interface SignupPanelProps {
  className?: string;
  providerUi?: AuthProviderUiConfig[];
  textOverrides?: AuthUiTextOverrides;
  appName?: string;
  termsUrl?: string;
  privacyUrl?: string;
  googleClientId?: string;
  appleClientId?: string;
  microsoftClientId?: string;
  microsoftAuthority?: string;
  microsoftRedirectPath?: string;
  appleRedirectPath?: string;
  appleRedirectOrigin?: string;
  minimumPasswordLength?: number;
  signupAgeGateEnabled?: boolean;
  minimumSignupAge?: number;
  signupDateOfBirthRequired?: boolean;
  signupMinimumAgeConfirmationRequired?: boolean;
  tenantId?: string;
  consentToMarketingEmails?: boolean;
  consentToHelpEmails?: boolean;
  fields?: Record<string, unknown>;
  onAuthenticated?: () => void;
  onAccountCreatedRequiresEmailVerification?: () => void;
  onError?: (message: string, code?: string, provider?: AuthProviderType) => void;
}

type PendingExternalSignup = {
  provider: "Microsoft";
  credential: string;
  suggestedEmail?: string;
};

export function SignupPanel({
  className,
  providerUi,
  textOverrides,
  appName = "the app",
  termsUrl = "/terms",
  privacyUrl = "/privacy",
  googleClientId,
  appleClientId,
  microsoftClientId,
  microsoftAuthority,
  microsoftRedirectPath = "/login",
  appleRedirectPath = "/register",
  appleRedirectOrigin,
  minimumPasswordLength = 8,
  signupAgeGateEnabled = false,
  minimumSignupAge = 0,
  signupDateOfBirthRequired = false,
  signupMinimumAgeConfirmationRequired = false,
  tenantId,
  consentToMarketingEmails = false,
  consentToHelpEmails = false,
  fields = {},
  onAuthenticated,
  onAccountCreatedRequiresEmailVerification,
  onError
}: SignupPanelProps) {
  const { login, externalSignup } = useAuth();
  const signupWithPassword = usePasswordSignup();
  const signupEmailVerification = useSignupEmailVerification();
  const signupText = useMemo(() => ({ ...defaultSignupPanelText, ...textOverrides?.signup }), [textOverrides]);
  const emailVerificationText = useMemo(() => ({ ...defaultEmailVerificationFieldText, ...textOverrides?.emailVerificationField }), [textOverrides]);
  const resolvedProviderUi = useMemo(() => resolveAuthProviderUiConfigs({
    providerUi,
    googleClientId,
    appleClientId,
    microsoftClientId,
    microsoftAuthority,
    defaultGoogleText: "signup_with"
  }), [appleClientId, googleClientId, microsoftAuthority, microsoftClientId, providerUi]);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [minimumAgeConfirmed, setMinimumAgeConfirmed] = useState(false);
  const [ageGateTouched, setAgeGateTouched] = useState(false);
  const [legalConsentAccepted, setLegalConsentAccepted] = useState(false);
  const [legalConsentTouched, setLegalConsentTouched] = useState(false);
  const [busyProvider, setBusyProvider] = useState<AuthProviderType | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupEmailVerified, setSignupEmailVerified] = useState(false);
  const [signupChallengeId, setSignupChallengeId] = useState<string | null>(null);
  const [signupVerificationCode, setSignupVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingExternalSignup, setPendingExternalSignup] = useState<PendingExternalSignup | null>(null);

  const passwordRulesValid = isPasswordValid(password, confirmPassword, minimumPasswordLength);

  const clearFeedback = () => {
    setServerError("");
    setSuccessMessage("");
    setFormError("");
  };

  const setError = (message: string, code?: string, provider?: AuthProviderType) => {
    setSuccessMessage("");
    setServerError(message);
    onError?.(message, code, provider);
  };

  const getAge = (value: string) => {
    const parsedDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - parsedDate.getFullYear();
    const monthDifference = today.getMonth() - parsedDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < parsedDate.getDate())) {
      age--;
    }

    return age;
  };

  const validateAgeGate = () => {
    if (!signupAgeGateEnabled) {
      return true;
    }

    if (signupDateOfBirthRequired && dateOfBirth.trim().length === 0) {
      setAgeGateTouched(true);
      setError(signupText.missingDateOfBirthMessage);
      return false;
    }

    if (dateOfBirth.trim().length > 0) {
      const age = getAge(dateOfBirth);
      if (age === null) {
        setAgeGateTouched(true);
        setError(signupText.invalidDateOfBirthMessage);
        return false;
      }

      if (age < minimumSignupAge) {
        setAgeGateTouched(true);
        setError(formatAuthText(signupText.minimumAgeMessage, { minimumAge: minimumSignupAge }));
        return false;
      }
    }

    if (signupMinimumAgeConfirmationRequired && !minimumAgeConfirmed) {
      setAgeGateTouched(true);
      setError(formatAuthText(signupText.minimumAgeConfirmationMessage, { minimumAge: minimumSignupAge }));
      return false;
    }

    return true;
  };

  const validateConsent = () => {
    if (!validateAgeGate()) {
      return false;
    }

    if (!legalConsentAccepted) {
      setLegalConsentTouched(true);
      setError(signupText.legalConsentRequiredMessage);
      return false;
    }

    return true;
  };

  const clearSignupEmailVerification = () => {
    setSignupEmailVerified(false);
    setSignupChallengeId(null);
    setSignupVerificationCode("");
    setSuccessMessage("");
    setServerError("");
  };

  const resetPendingExternalSignup = () => {
    setPendingExternalSignup(null);
    clearSignupEmailVerification();
    setSignupEmail("");
  };

  const beginSignupEmailVerification = async (email: string) => {
    setBusyAction("signup-email");
    clearFeedback();
    try {
      const response = await signupEmailVerification.begin({ email });
      if (!response.success || !response.data) {
        setError(response.message ?? signupText.emailVerificationRequestFailedMessage);
        return;
      }

      setSignupEmail(response.data.email);
      setSignupChallengeId(response.data.challengeId);
      setSignupEmailVerified(false);
      setSignupVerificationCode("");
      setSuccessMessage(response.data.message ?? signupText.emailVerificationRequestedMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : signupText.emailVerificationRequestFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const requestSignupEmailVerification = async (email: string) => {
    if (!validateConsent()) return;
    await beginSignupEmailVerification(email);
  };

  const verifySignupEmailCode = async () => {
    if (!signupChallengeId) {
      setError(signupText.emailVerificationRequestPromptMessage);
      return;
    }

    setBusyAction("signup-email-code");
    clearFeedback();
    try {
      const response = await signupEmailVerification.verifyCode({ challengeId: signupChallengeId, email: signupEmail, code: signupVerificationCode });
      if (!response.success || !response.data?.emailVerified) {
        setError(response.message ?? signupText.emailVerificationFailedMessage);
        return;
      }

      setSignupEmail(response.data.email);
      setSignupEmailVerified(true);
      setSuccessMessage(response.data.message ?? signupText.emailVerifiedMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : signupText.emailVerificationFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const submitPasswordSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    if (!validateConsent()) return;
    if (!passwordRulesValid) {
      setFormError(signupText.passwordRequirementsMessage);
      return;
    }
    if (!signupEmailVerified || !signupChallengeId) {
      setFormError(signupText.verifyEmailBeforeSignupMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signupWithPassword({
        email: signupEmail,
        password,
        emailVerificationChallengeId: signupChallengeId,
        dateOfBirth,
        minimumAgeConfirmed,
        termsAccepted: legalConsentAccepted,
        privacyPolicyAccepted: legalConsentAccepted,
        consentToMarketingEmails,
        consentToHelpEmails,
        tenantId,
        fields
      });

      if (!response.success) {
        setError(response.message ?? signupText.registrationFailedMessage);
        return;
      }

      if (response.data?.requiresEmailVerification) {
        setSuccessMessage(signupText.registrationCreatedVerifyEmailMessage);
        onAccountCreatedRequiresEmailVerification?.();
        return;
      }

      await login(signupEmail, password, tenantId);
      onAuthenticated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : signupText.genericSignupErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitExternalSignup = async (provider: "Google" | "Apple" | "Microsoft", credential: string, verifiedEmail?: string, emailVerificationChallengeId?: string) => {
    await externalSignup({
      provider,
      credential,
      tenantId,
      dateOfBirth,
      minimumAgeConfirmed,
      termsAccepted: legalConsentAccepted,
      privacyPolicyAccepted: legalConsentAccepted,
      consentToMarketingEmails,
      consentToHelpEmails,
      verifiedEmail,
      emailVerificationChallengeId,
      fields
    });

    resetPendingExternalSignup();
    onAuthenticated?.();
  };

  const completeExternalSignup = async (provider: "Google" | "Apple" | "Microsoft", credential: string, verifiedEmail?: string, emailVerificationChallengeId?: string) => {
    if (!validateConsent() || busyProvider) return;

    clearFeedback();
    setBusyProvider(provider);
    try {
      await submitExternalSignup(provider, credential, verifiedEmail, emailVerificationChallengeId);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message, err.code, provider);
      } else {
        setError(
          err instanceof Error ? err.message : formatAuthText(signupText.providerSignupFailedMessage, { provider }),
          undefined,
          provider
        );
      }
    } finally {
      setBusyProvider(null);
    }
  };

  const handleExternalSignup = async (provider: "Google" | "Apple", credential: string) => {
    await completeExternalSignup(provider, credential);
  };

  const handleAppleSignup = async () => {
    if (!appleClientId || !validateConsent() || busyProvider) return;

    clearFeedback();
    setBusyProvider("Apple");
    try {
      const credential = await signInWithApple(appleClientId, appleRedirectPath, appleRedirectOrigin);
      await submitExternalSignup("Apple", credential);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message, err.code, "Apple");
      } else {
        setError(err instanceof Error ? err.message : signupText.appleSignupCancelledMessage, undefined, "Apple");
      }
    } finally {
      setBusyProvider(null);
    }
  };

  const handleMicrosoftSignup = async () => {
    if (!microsoftClientId || !microsoftAuthority || !validateConsent() || busyProvider) return;

    clearFeedback();
    setBusyProvider("Microsoft");
    try {
      const result = await signInWithMicrosoft(microsoftClientId, microsoftAuthority, microsoftRedirectPath);
      if (result.email?.trim()) {
        await submitExternalSignup("Microsoft", result.credential);
        return;
      }

      resetPendingExternalSignup();
      setPendingExternalSignup({
        provider: "Microsoft",
        credential: result.credential,
        suggestedEmail: result.preferredUsername?.includes("@") ? result.preferredUsername : undefined
      });
      setSignupEmail(result.preferredUsername?.includes("@") ? result.preferredUsername : "");
      setShowEmailForm(false);
      setSuccessMessage(signupText.microsoftEmailRequiredSuccessMessage);
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message, err.code, "Microsoft");
      } else {
        setError(err instanceof Error ? err.message : signupText.microsoftSignupCancelledMessage, undefined, "Microsoft");
      }
    } finally {
      setBusyProvider(null);
    }
  };

  const finishPendingMicrosoftSignup = async () => {
    if (!pendingExternalSignup || !signupEmailVerified || !signupChallengeId) {
      setFormError(signupText.verifyEmailBeforeSignupMessage);
      return;
    }

    await completeExternalSignup(
      pendingExternalSignup.provider,
      pendingExternalSignup.credential,
      signupEmail,
      signupChallengeId
    );
  };

  return (
    <div className={["bt-auth-signup-panel", className].filter(Boolean).join(" ")}>
      {serverError && <div className="alert alert-danger py-2">{serverError}</div>}
      {successMessage && <div className="alert alert-info py-2 small mb-3" role="alert">{successMessage}</div>}

      <div className="mx-auto w-100 mb-3" style={{ maxWidth: 400 }}>
        {signupAgeGateEnabled && (
          <div className="mb-3">
            <label className="form-label" htmlFor="btSignupDateOfBirth">{signupText.dateOfBirthLabel}</label>
            <input
              id="btSignupDateOfBirth"
              type="date"
              className={`form-control${ageGateTouched && signupDateOfBirthRequired && !dateOfBirth ? " is-invalid" : ""}`}
              value={dateOfBirth}
              onChange={event => {
                setDateOfBirth(event.target.value);
                setAgeGateTouched(false);
                setServerError("");
              }}
            />
          </div>
        )}
        {signupAgeGateEnabled && signupMinimumAgeConfirmationRequired && (
          <label className={`d-flex gap-2 align-items-start mb-3${ageGateTouched && !minimumAgeConfirmed ? " text-danger" : ""}`}>
            <input
              type="checkbox"
              checked={minimumAgeConfirmed}
              aria-invalid={ageGateTouched && !minimumAgeConfirmed}
              onChange={event => {
                setMinimumAgeConfirmed(event.target.checked);
                if (event.target.checked) {
                  setAgeGateTouched(false);
                  setServerError("");
                }
              }}
            />
            <span>{formatAuthText(signupText.minimumAgeCheckboxLabel, { minimumAge: minimumSignupAge })}</span>
          </label>
        )}
        <LegalConsentCheckbox
          checked={legalConsentAccepted}
          termsUrl={termsUrl}
          privacyUrl={privacyUrl}
          appName={appName}
          error={legalConsentTouched && !legalConsentAccepted ? signupText.legalConsentRequiredMessage : null}
          onChange={checked => {
            setLegalConsentAccepted(checked);
            if (checked) {
              setLegalConsentTouched(false);
              setServerError("");
            }
          }}
        />
      </div>

      {pendingExternalSignup && (
        <div className="mx-auto w-100" style={{ maxWidth: 400 }}>
          <div className="border rounded-3 p-3">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h2 className="h6 mb-1">{signupText.microsoftEmailRequiredTitle}</h2>
                <p className="small text-muted mb-0">{signupText.microsoftEmailRequiredDescription}</p>
              </div>
              <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none text-primary" onClick={resetPendingExternalSignup}>
                {signupText.cancelLabel}
              </button>
            </div>

            {formError && <div className="alert alert-danger py-2">{formError}</div>}

            <div className="mb-3">
              <label className="form-label">{signupText.emailAddressLabel}</label>
              <EmailVerificationField
                email={signupEmail}
                verified={signupEmailVerified}
                challengeActive={!!signupChallengeId && !signupEmailVerified}
                verificationCode={signupVerificationCode}
                busySending={busyAction === "signup-email"}
                busyVerifying={busyAction === "signup-email-code"}
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
                successMessage={signupChallengeId && !signupEmailVerified ? signupText.emailVerificationCodePromptMessage : undefined}
                onEmailChange={email => {
                  setSignupEmail(email);
                  if (signupEmailVerified || signupChallengeId) clearSignupEmailVerification();
                }}
                onRequestVerification={requestSignupEmailVerification}
                onVerificationCodeChange={setSignupVerificationCode}
                onVerifyCode={verifySignupEmailCode}
                onChangeEmail={clearSignupEmailVerification}
                onResend={() => requestSignupEmailVerification(signupEmail)}
              />
            </div>

            <button type="button" className="btn btn-primary w-100" disabled={busyProvider === "Microsoft" || !signupEmailVerified} onClick={() => void finishPendingMicrosoftSignup()}>
              {busyProvider === "Microsoft" ? signupText.creatingAccountWithMicrosoftLabel : signupText.createAccountWithMicrosoftLabel}
            </button>
          </div>
        </div>
      )}

      {!pendingExternalSignup && !showEmailForm && (
        <div className="d-grid gap-3 justify-items-center">
          {resolvedProviderUi.map(config => {
            if (config.provider === "Google" && googleClientId) {
              return (
                <div key={config.provider} className="auth-provider-consent-gate position-relative w-100" style={{ maxWidth: 400, marginInline: "auto" }}>
                  <div
                    role="button"
                    tabIndex={legalConsentAccepted ? -1 : 0}
                    onClick={legalConsentAccepted ? undefined : validateConsent}
                    onKeyDown={event => {
                      if ((event.key === "Enter" || event.key === " ") && !legalConsentAccepted) {
                        event.preventDefault();
                        validateConsent();
                      }
                    }}
                  >
                    <GoogleCredentialButton
                      clientId={googleClientId}
                      text={config.googleText ?? "signup_with"}
                      onCredential={credential => void handleExternalSignup("Google", credential)}
                      onError={message => setError(message, undefined, "Google")}
                    />
                  </div>
                  {!legalConsentAccepted && (
                    <button
                      type="button"
                      className="auth-provider-consent-overlay"
                      aria-label="Accept the terms and privacy policy before signing up with Google"
                      onClick={validateConsent}
                      style={{ position: "absolute", inset: 0, zIndex: 2, opacity: 0, border: 0, padding: 0, margin: 0, background: "transparent", cursor: "pointer" }}
                    />
                  )}
                </div>
              );
            }

            if (config.provider === "Apple" && appleClientId) {
              return (
                <AuthProviderButton
                  key={config.provider}
                  variant="apple"
                  label={config.label ?? signupText.signUpWithAppleLabel}
                  busyLabel={config.busyLabel ?? signupText.openingAppleLabel}
                  busy={busyProvider === "Apple"}
                  disabled={busyProvider !== null}
                  onClick={() => void handleAppleSignup()}
                />
              );
            }

            if (config.provider === "Microsoft" && microsoftClientId && microsoftAuthority) {
              return (
                <AuthProviderButton
                  key={config.provider}
                  variant="microsoft"
                  label={config.label ?? signupText.signUpWithMicrosoftLabel}
                  busyLabel={config.busyLabel ?? signupText.openingMicrosoftLabel}
                  busy={busyProvider === "Microsoft"}
                  disabled={busyProvider !== null}
                  onClick={() => void handleMicrosoftSignup()}
                />
              );
            }

            return null;
          })}
          <AuthProviderButton variant="email" label={signupText.signUpWithEmailLabel} disabled={busyProvider !== null} onClick={() => {
            clearFeedback();
            setShowEmailForm(true);
          }} />
        </div>
      )}

      {!pendingExternalSignup && showEmailForm && (
        <form onSubmit={submitPasswordSignup} noValidate>
          <button type="button" className="btn btn-link px-0 mb-3 text-primary text-decoration-none fw-semibold" onClick={() => setShowEmailForm(false)}>
            {signupText.backToSignupOptionsLabel}
          </button>

          {formError && <div className="alert alert-danger py-2">{formError}</div>}

          <div className="mb-3">
            <label className="form-label">{signupText.emailAddressLabel}</label>
            <EmailVerificationField
              email={signupEmail}
              verified={signupEmailVerified}
              challengeActive={!!signupChallengeId && !signupEmailVerified}
              verificationCode={signupVerificationCode}
              busySending={busyAction === "signup-email"}
              busyVerifying={busyAction === "signup-email-code"}
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
              successMessage={signupChallengeId && !signupEmailVerified ? signupText.emailVerificationCodePromptMessage : undefined}
              onEmailChange={email => {
                setSignupEmail(email);
                if (signupEmailVerified || signupChallengeId) clearSignupEmailVerification();
              }}
              onRequestVerification={requestSignupEmailVerification}
              onVerificationCodeChange={setSignupVerificationCode}
              onVerifyCode={verifySignupEmailCode}
              onChangeEmail={clearSignupEmailVerification}
              onResend={() => requestSignupEmailVerification(signupEmail)}
            />
          </div>

          <PasswordField className="mb-3" label={signupText.passwordLabel} value={password} autoComplete="new-password" onChange={setPassword} />

          <div className="mb-4">
            <PasswordField label={signupText.confirmPasswordLabel} value={confirmPassword} autoComplete="new-password" onChange={setConfirmPassword} />
            <PasswordRulesChecklist password={password} confirmPassword={confirmPassword} minimumLength={minimumPasswordLength} />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting || !passwordRulesValid || !signupEmailVerified}>
            {isSubmitting ? signupText.creatingAccountLabel : signupText.createAccountLabel}
          </button>
        </form>
      )}
    </div>
  );
}
