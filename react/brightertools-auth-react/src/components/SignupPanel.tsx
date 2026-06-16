import { useState } from "react";
import type { FormEvent } from "react";
import { AuthProviderButton } from "./AuthProviderButton";
import { EmailVerificationField } from "./EmailVerificationField";
import { GoogleCredentialButton } from "./GoogleCredentialButton";
import { LegalConsentCheckbox } from "./SignupForm";
import { PasswordField } from "./PasswordField";
import { isPasswordValid, PasswordRulesChecklist } from "./PasswordRulesChecklist";
import { signInWithApple } from "../services/appleAuth";
import { useAuth } from "../hooks/useAuth";
import { usePasswordSignup } from "../hooks/usePasswordSignup";
import { useSignupEmailVerification } from "../hooks/useSignupEmailVerification";
import type { AuthProviderType } from "../types/auth";

export interface SignupPanelProps {
  appName?: string;
  termsUrl?: string;
  privacyUrl?: string;
  googleClientId?: string;
  appleClientId?: string;
  appleRedirectPath?: string;
  minimumPasswordLength?: number;
  tenantId?: string;
  consentToMarketingEmails?: boolean;
  consentToHelpEmails?: boolean;
  fields?: Record<string, unknown>;
  onAuthenticated?: () => void;
  onAccountCreatedRequiresEmailVerification?: () => void;
  onError?: (message: string) => void;
}

export function SignupPanel({ appName = "the app", termsUrl = "/terms", privacyUrl = "/privacy", googleClientId, appleClientId, appleRedirectPath = "/register", minimumPasswordLength = 8, tenantId, consentToMarketingEmails = false, consentToHelpEmails = false, fields = {}, onAuthenticated, onAccountCreatedRequiresEmailVerification, onError }: SignupPanelProps) {
  const { login, externalSignup } = useAuth();
  const signupWithPassword = usePasswordSignup();
  const signupEmailVerification = useSignupEmailVerification();
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
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

  const passwordRulesValid = isPasswordValid(password, confirmPassword, minimumPasswordLength);

  const setError = (message: string) => {
    setServerError(message);
    onError?.(message);
  };

  const validateConsent = () => {
    if (!legalConsentAccepted) {
      setLegalConsentTouched(true);
      setError("Please accept the terms and privacy policy before creating an account.");
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

  const beginSignupEmailVerification = async (email: string) => {
    setBusyAction("signup-email");
    setServerError("");
    setSuccessMessage("");
    try {
      const response = await signupEmailVerification.begin({ email });
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not send a verification code.");
        return;
      }

      setSignupEmail(response.data.email);
      setSignupChallengeId(response.data.challengeId);
      setSignupEmailVerified(false);
      setSignupVerificationCode("");
      setSuccessMessage(response.data.message ?? "A verification code has been sent to your email address.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a verification code.");
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
      setError("Please request a verification code first.");
      return;
    }

    setBusyAction("signup-email-code");
    setServerError("");
    setSuccessMessage("");
    try {
      const response = await signupEmailVerification.verifyCode({ challengeId: signupChallengeId, email: signupEmail, code: signupVerificationCode });
      if (!response.success || !response.data?.emailVerified) {
        setError(response.message ?? "Could not verify this code.");
        return;
      }

      setSignupEmail(response.data.email);
      setSignupEmailVerified(true);
      setSuccessMessage(response.data.message ?? "Email verified. You can now create your account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify this code.");
    } finally {
      setBusyAction(null);
    }
  };

  const submitPasswordSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setServerError("");
    setSuccessMessage("");

    if (!validateConsent()) return;
    if (!passwordRulesValid) {
      setFormError("Please complete the password requirements before creating your account.");
      return;
    }
    if (!signupEmailVerified || !signupChallengeId) {
      setFormError("Please verify your email address before creating your account.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await signupWithPassword({
        email: signupEmail,
        password,
        emailVerificationChallengeId: signupChallengeId,
        termsAccepted: legalConsentAccepted,
        privacyPolicyAccepted: legalConsentAccepted,
        consentToMarketingEmails,
        consentToHelpEmails,
        tenantId,
        fields
      });

      if (!response.success) {
        setError(response.message ?? "Registration failed.");
        return;
      }

      if (response.data?.requiresEmailVerification) {
        setSuccessMessage("Your account has been created. Please verify your email address before signing in.");
        onAccountCreatedRequiresEmailVerification?.();
        return;
      }

      await login(signupEmail, password, tenantId);
      onAuthenticated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExternalSignup = async (provider: "Google" | "Apple", credential: string) => {
    if (!validateConsent()) return;

    setServerError("");
    setSuccessMessage("");
    setBusyProvider(provider);
    try {
      await externalSignup({
        provider,
        credential,
        tenantId,
        termsAccepted: legalConsentAccepted,
        privacyPolicyAccepted: legalConsentAccepted,
        consentToMarketingEmails,
        consentToHelpEmails,
        fields
      });
      onAuthenticated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} signup failed. Please try again.`);
    } finally {
      setBusyProvider(null);
    }
  };

  const handleAppleSignup = async () => {
    if (!appleClientId || !validateConsent()) return;

    try {
      const credential = await signInWithApple(appleClientId, appleRedirectPath);
      await handleExternalSignup("Apple", credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apple sign-up was cancelled or failed.");
    }
  };

  return (
    <div className="bt-auth-signup-panel">
      {serverError && <div className="alert alert-danger py-2">{serverError}</div>}
      {successMessage && <div className="alert alert-info py-2 small mb-3" role="alert">{successMessage}</div>}

      <div className="mx-auto w-100 mb-3" style={{ maxWidth: 400 }}>
        <LegalConsentCheckbox
          checked={legalConsentAccepted}
          termsUrl={termsUrl}
          privacyUrl={privacyUrl}
          appName={appName}
          error={legalConsentTouched && !legalConsentAccepted ? "Terms and privacy acceptance is required." : null}
          onChange={checked => {
            setLegalConsentAccepted(checked);
            if (checked) {
              setLegalConsentTouched(false);
              setServerError("");
            }
          }}
        />
      </div>

      {!showEmailForm && (
        <div className="d-grid gap-3 justify-items-center">
          {googleClientId && (
            <div className="auth-provider-consent-gate position-relative w-100" style={{ maxWidth: 400, marginInline: "auto" }}>
              <GoogleCredentialButton clientId={googleClientId} text="signup_with" onCredential={credential => void handleExternalSignup("Google", credential)} onError={setError} />
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
          )}
          {appleClientId && (
            <AuthProviderButton variant="apple" label="Sign up with Apple" busyLabel="Opening Apple..." busy={busyProvider === "Apple"} onClick={() => void handleAppleSignup()} />
          )}
          <AuthProviderButton variant="email" label="Sign up with Email" onClick={() => setShowEmailForm(true)} />
        </div>
      )}

      {showEmailForm && (
        <form onSubmit={submitPasswordSignup} noValidate>
          <button type="button" className="btn btn-link px-0 mb-3 text-primary text-decoration-none fw-semibold" onClick={() => setShowEmailForm(false)}>
            Back to signup options
          </button>

          {formError && <div className="alert alert-danger py-2">{formError}</div>}

          <div className="mb-3">
            <label className="form-label">Email address</label>
            <EmailVerificationField
              email={signupEmail}
              verified={signupEmailVerified}
              challengeActive={!!signupChallengeId && !signupEmailVerified}
              verificationCode={signupVerificationCode}
              busySending={busyAction === "signup-email"}
              busyVerifying={busyAction === "signup-email-code"}
              successMessage={signupChallengeId && !signupEmailVerified ? "Enter the code we sent to this email address." : undefined}
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

          <PasswordField className="mb-3" label="Password" value={password} autoComplete="new-password" onChange={setPassword} />

          <div className="mb-4">
            <PasswordField label="Confirm password" value={confirmPassword} autoComplete="new-password" onChange={setConfirmPassword} />
            <PasswordRulesChecklist password={password} confirmPassword={confirmPassword} minimumLength={minimumPasswordLength} />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting || !passwordRulesValid || !signupEmailVerified}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      )}
    </div>
  );
}





