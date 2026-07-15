import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AuthProviderButton } from "./AuthProviderButton";
import { ExternalAuthButtonList } from "./ExternalAuthButtonList";
import { PasswordField } from "./PasswordField";
import { PasswordlessEmailLoginForm } from "./PasswordlessEmailLoginForm";
import {
  defaultLoginPanelText,
  defaultPasswordLoginFormText,
  defaultPasswordlessEmailLoginFormText,
  formatAuthText,
  resolveAuthProviderUiConfigs,
  resolveLoginEmailUiOptions,
  type AuthProviderUiConfig,
  type AuthUiTextOverrides,
  type LoginEmailUiOptions
} from "../authUi";
import { signInWithApple } from "../services/appleAuth";
import { signInWithMicrosoft } from "../services/microsoftAuth";
import { useAuth } from "../hooks/useAuth";
import { usePasswordlessEmailLogin } from "../hooks/usePasswordlessEmailLogin";
import type { AuthProviderType } from "../types/auth";
import { AuthApiError } from "../errors/AuthApiError";

const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
const defaultRequestErrorMessage = "There was an error processing the request.";
const invalidLoginMessage = "The email and/or password is incorrect.";

const toPasswordLoginErrorMessage = (err: unknown) => {
  if (!(err instanceof Error)) return invalidLoginMessage;
  return err.message === defaultRequestErrorMessage ? defaultRequestErrorMessage : invalidLoginMessage;
};

export interface LoginPanelProps {
  className?: string;
  providerUi?: AuthProviderUiConfig[];
  loginEmailUi?: LoginEmailUiOptions;
  textOverrides?: AuthUiTextOverrides;
  googleClientId?: string;
  appleClientId?: string;
  microsoftClientId?: string;
  microsoftAuthority?: string;
  microsoftRedirectPath?: string;
  appleRedirectPath?: string;
  appleRedirectOrigin?: string;
  passwordlessToken?: string | null;
  passwordlessReturnUrl?: string;
  passwordlessCodeReturnUrl?: string;
  tenantId?: string;
  allowUsernameOrEmail?: boolean;
  emailLoginButtonLabel?: string;
  onAuthenticated?: (returnUrl?: string) => void;
  onError?: (message: string, code?: string, provider?: AuthProviderType) => void;
  transformError?: (message: string, code?: string, provider?: AuthProviderType) => string;
}

export function LoginPanel({
  className,
  providerUi,
  loginEmailUi,
  textOverrides,
  googleClientId,
  appleClientId,
  microsoftClientId,
  microsoftAuthority,
  microsoftRedirectPath = "/login",
  appleRedirectPath = "/login",
  appleRedirectOrigin,
  passwordlessToken,
  passwordlessReturnUrl = "/dashboard",
  passwordlessCodeReturnUrl = "/dashboard",
  tenantId,
  allowUsernameOrEmail = false,
  emailLoginButtonLabel,
  onAuthenticated,
  onError,
  transformError
}: LoginPanelProps) {
  const { login, externalLogin } = useAuth();
  const passwordlessLogin = usePasswordlessEmailLogin();
  const loginText = useMemo(() => ({ ...defaultLoginPanelText, ...textOverrides?.login }), [textOverrides]);
  const passwordLoginText = useMemo(() => ({ ...defaultPasswordLoginFormText, ...textOverrides?.passwordLogin }), [textOverrides]);
  const passwordlessText = useMemo(() => ({ ...defaultPasswordlessEmailLoginFormText, ...textOverrides?.passwordlessEmailLogin }), [textOverrides]);
  const resolvedLoginEmailUi = useMemo(() => resolveLoginEmailUiOptions(loginEmailUi), [loginEmailUi]);
  const resolvedProviderUi = useMemo(() => resolveAuthProviderUiConfigs({
    providerUi,
    googleClientId,
    appleClientId,
    microsoftClientId,
    microsoftAuthority
  }), [appleClientId, googleClientId, microsoftAuthority, microsoftClientId, providerUi]);
  const defaultEmailButtonLabel = allowUsernameOrEmail ? "Username/Email Login" : loginText.emailButtonLabel;
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(resolvedLoginEmailUi.emailDisplayMode === "inline");
  const [showPasswordlessEmailForm, setShowPasswordlessEmailForm] = useState(false);
  const [busyProvider, setBusyProvider] = useState<AuthProviderType | null>(null);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordlessChallengeId, setPasswordlessChallengeId] = useState<string | null>(null);
  const [passwordlessBusy, setPasswordlessBusy] = useState(false);

  useEffect(() => {
    if (resolvedLoginEmailUi.emailDisplayMode === "inline") {
      setShowEmailForm(true);
    } else if (!showPasswordlessEmailForm) {
      setShowEmailForm(false);
    }
  }, [resolvedLoginEmailUi.emailDisplayMode, showPasswordlessEmailForm]);

  const clearStatus = useCallback(() => {
    setServerError(null);
    setServerMessage(null);
  }, []);

  const setError = useCallback((message: string, code?: string, provider?: AuthProviderType) => {
    const transformedMessage = transformError?.(message, code, provider) ?? message;
    setServerMessage(null);
    setServerError(transformedMessage);
    onError?.(transformedMessage, code, provider);
  }, [onError, transformError]);

  useEffect(() => {
    let cancelled = false;
    const token = passwordlessToken?.trim();
    if (!token) return;

    const completeTokenLogin = async () => {
      setServerError(null);
      setServerMessage(loginText.checkingSecureSignInLinkMessage);
      try {
        const response = await passwordlessLogin.complete({ token, tenantId });
        if (!response.success || !response.data) {
          throw new Error(response.message ?? loginText.invalidSecureSignInLinkMessage);
        }

        if (!cancelled) onAuthenticated?.(passwordlessReturnUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : loginText.invalidSecureSignInLinkMessage);
          setServerMessage(null);
        }
      }
    };

    void completeTokenLogin();
    return () => {
      cancelled = true;
    };
  }, [loginText, onAuthenticated, passwordlessLogin, passwordlessReturnUrl, passwordlessToken, setError, tenantId]);

  const submitPasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    clearStatus();

    if (!loginIdentifier.trim()) {
      setFormError(allowUsernameOrEmail ? loginText.emptyUsernameOrEmailMessage : loginText.emptyEmailMessage);
      return;
    }

    if (!allowUsernameOrEmail && !isEmail(loginIdentifier)) {
      setFormError(loginText.invalidEmailMessage);
      return;
    }

    if (!password) {
      setFormError(loginText.passwordRequiredMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginIdentifier.trim(), password, tenantId);
      onAuthenticated?.();
    } catch (err) {
      setError(toPasswordLoginErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const runProviderLogin = useCallback(async (provider: "Google" | "Apple" | "Microsoft", credentialFactory: () => Promise<string>) => {
    if (busyProvider) {
      return;
    }

    clearStatus();
    setBusyProvider(provider);

    try {
      const credential = await credentialFactory();
      await externalLogin(provider, credential, tenantId);
      onAuthenticated?.();
    } catch (err) {
      if (err instanceof AuthApiError) {
        setError(err.message, err.code, provider);
      } else {
        setError(
          err instanceof Error ? err.message : formatAuthText(loginText.providerLoginFailedMessage, { provider }),
          undefined,
          provider
        );
      }
    } finally {
      setBusyProvider(null);
    }
  }, [busyProvider, clearStatus, externalLogin, loginText.providerLoginFailedMessage, onAuthenticated, setError, tenantId]);

  const handleAppleLogin = async () => {
    if (!appleClientId) return;

    await runProviderLogin("Apple", () => signInWithApple(appleClientId, appleRedirectPath, appleRedirectOrigin));
  };

  const handleMicrosoftLogin = async () => {
    if (!microsoftClientId || !microsoftAuthority) return;

    await runProviderLogin("Microsoft", async () => {
      const result = await signInWithMicrosoft(microsoftClientId, microsoftAuthority, microsoftRedirectPath);
      return result.credential;
    });
  };

  const requestPasswordlessCode = async (loginValue: string) => {
    setPasswordlessBusy(true);
    clearStatus();
    try {
      const response = await passwordlessLogin.begin({ login: loginValue || "", deliveryMode: "CodeAndLink", returnUrl: passwordlessCodeReturnUrl });
      if (!response.success || !response.data) {
        throw new Error(response.message ?? loginText.passwordlessRequestFailedMessage);
      }

      setPasswordlessChallengeId(response.data.challengeId ?? null);
      setServerMessage(response.data.message ?? loginText.passwordlessRequestSuccessMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : loginText.passwordlessRequestFailedMessage);
    } finally {
      setPasswordlessBusy(false);
    }
  };

  const completePasswordlessCode = async (code: string) => {
    if (!passwordlessChallengeId) {
      setError(loginText.passwordlessRequestPromptMessage);
      return;
    }

    setPasswordlessBusy(true);
    clearStatus();
    try {
      const response = await passwordlessLogin.complete({ challengeId: passwordlessChallengeId, code, tenantId, switchToCurrentTenant: true });
      if (!response.success || !response.data) {
        throw new Error(response.message ?? loginText.passwordlessCodeInvalidMessage);
      }

      onAuthenticated?.(passwordlessCodeReturnUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : loginText.passwordlessCodeInvalidMessage);
    } finally {
      setPasswordlessBusy(false);
    }
  };

  const openEmailLogin = () => {
    clearStatus();
    setShowPasswordlessEmailForm(false);
    setShowEmailForm(true);
  };

  const emailLoginSection = (
    <div className="bt-auth-login-email-section">
      <form onSubmit={submitPasswordLogin} noValidate>
        {resolvedLoginEmailUi.emailDisplayMode === "button" && (
          <button type="button" className="btn btn-link px-0 mb-3" onClick={() => setShowEmailForm(false)}>
            {loginText.backToLoginOptionsLabel}
          </button>
        )}
        {formError && <div className="alert alert-danger py-2">{formError}</div>}
        <div className="mb-3">
          <label className="form-label">{allowUsernameOrEmail ? loginText.usernameOrEmailLabel : loginText.emailLabel}</label>
          <input
            type={allowUsernameOrEmail ? "text" : "email"}
            className="form-control"
            value={loginIdentifier}
            onChange={event => setLoginIdentifier(event.target.value)}
            autoComplete={allowUsernameOrEmail ? "username" : "email"}
          />
        </div>
        <PasswordField className="mb-3" label={passwordLoginText.passwordLabel ?? loginText.passwordLabel} value={password} autoComplete="current-password" onChange={setPassword} />
        <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
          {isSubmitting ? passwordLoginText.submittingLabel ?? loginText.signingInLabel : passwordLoginText.submitLabel ?? loginText.signInLabel}
        </button>
      </form>
      <div className="border-top mt-4 pt-4">
        <button
          type="button"
          className="btn btn-link p-0 small"
          onClick={() => {
            clearStatus();
            setShowPasswordlessEmailForm(true);
            setShowEmailForm(false);
          }}
        >
          {loginText.passwordlessModeLabel}
        </button>
      </div>
    </div>
  );

  const emailLoginTrigger = (
    <AuthProviderButton
      variant="email"
      label={emailLoginButtonLabel ?? defaultEmailButtonLabel}
      disabled={busyProvider !== null}
      onClick={openEmailLogin}
    />
  );

  const externalLoginSection = (
    <ExternalAuthButtonList
      providerUi={providerUi}
      googleClientId={googleClientId}
      appleClientId={appleClientId}
      microsoftClientId={microsoftClientId}
      microsoftAuthority={microsoftAuthority}
      googleText="continue_with"
      appleLabel={loginText.continueWithAppleLabel}
      appleBusyLabel={loginText.openingAppleLabel}
      microsoftLabel={loginText.continueWithMicrosoftLabel}
      microsoftBusyLabel={loginText.openingMicrosoftLabel}
      busyProvider={busyProvider}
      onGoogleCredential={credential => void runProviderLogin("Google", async () => credential)}
      onAppleClick={() => void handleAppleLogin()}
      onMicrosoftClick={() => void handleMicrosoftLogin()}
      onError={message => setError(message, undefined, "Google")}
      textOverrides={textOverrides}
    />
  );

  const inlineSections = resolvedLoginEmailUi.emailPlacement === "first"
    ? [emailLoginSection, externalLoginSection]
    : [externalLoginSection, emailLoginSection];

  return (
    <div className={["bt-auth-login-panel", className].filter(Boolean).join(" ")}>
      {serverError && <div className="alert alert-danger">{serverError}</div>}
      {serverMessage && <div className="alert alert-info">{serverMessage}</div>}

      {!showPasswordlessEmailForm && resolvedLoginEmailUi.emailDisplayMode === "button" && !showEmailForm && (
        <div className="d-grid gap-3 justify-items-center">
          {resolvedLoginEmailUi.emailPlacement === "first" && emailLoginTrigger}
          {externalLoginSection}
          {resolvedLoginEmailUi.emailPlacement === "last" && emailLoginTrigger}
        </div>
      )}

      {!showPasswordlessEmailForm && resolvedLoginEmailUi.emailDisplayMode === "button" && showEmailForm && emailLoginSection}

      {!showPasswordlessEmailForm && resolvedLoginEmailUi.emailDisplayMode === "inline" && (
        <div className="d-grid gap-4">
          {inlineSections[0]}
          {resolvedProviderUi.length > 0 && (
            <div className="text-center text-body-secondary small" aria-hidden="true">
              {resolvedLoginEmailUi.separatorText}
            </div>
          )}
          {inlineSections[1]}
        </div>
      )}

      {showPasswordlessEmailForm && (
        <>
          <button
            type="button"
            className="btn btn-link px-0 mb-3"
            onClick={() => {
              setShowPasswordlessEmailForm(false);
              setShowEmailForm(true);
            }}
          >
            {loginText.backToPasswordLoginLabel}
          </button>
          <h2 className="h6">{loginText.passwordlessHeading}</h2>
          <p className="small text-muted">{loginText.passwordlessDescription}</p>
          <PasswordlessEmailLoginForm
            challengeId={passwordlessChallengeId}
            busy={passwordlessBusy}
            emailLabel={passwordlessText.emailLabel}
            codeLabel={passwordlessText.codeLabel}
            requestLabel={passwordlessText.requestLabel}
            requestBusyLabel={passwordlessText.requestBusyLabel}
            completeLabel={passwordlessText.completeLabel}
            onBegin={requestPasswordlessCode}
            onComplete={completePasswordlessCode}
          />
        </>
      )}
    </div>
  );
}
