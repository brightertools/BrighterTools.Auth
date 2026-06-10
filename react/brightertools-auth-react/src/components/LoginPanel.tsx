import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AuthProviderButton } from "./AuthProviderButton";
import { GoogleCredentialButton } from "./GoogleCredentialButton";
import { PasswordField } from "./PasswordField";
import { PasswordlessEmailLoginForm } from "./PasswordlessEmailLoginForm";
import { signInWithApple } from "../services/appleAuth";
import { useAuth } from "../hooks/useAuth";
import { usePasswordlessEmailLogin } from "../hooks/usePasswordlessEmailLogin";
import type { AuthProviderType } from "../types/auth";

const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());

export interface LoginPanelProps {
  googleClientId?: string;
  appleClientId?: string;
  appleRedirectPath?: string;
  appleRedirectOrigin?: string;
  passwordlessToken?: string | null;
  passwordlessReturnUrl?: string;
  passwordlessCodeReturnUrl?: string;
  tenantId?: string;
  onAuthenticated?: (returnUrl?: string) => void;
  onError?: (message: string) => void;
}

export function LoginPanel({ googleClientId, appleClientId, appleRedirectPath = "/login", appleRedirectOrigin, passwordlessToken, passwordlessReturnUrl = "/dashboard", passwordlessCodeReturnUrl = "/dashboard", tenantId, onAuthenticated, onError }: LoginPanelProps) {
  const { login, externalLogin } = useAuth();
  const passwordlessLogin = usePasswordlessEmailLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [busyProvider, setBusyProvider] = useState<AuthProviderType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordlessChallengeId, setPasswordlessChallengeId] = useState<string | null>(null);
  const [passwordlessBusy, setPasswordlessBusy] = useState(false);

  const setError = useCallback((message: string) => {
    setServerError(message);
    onError?.(message);
  }, [onError]);

  useEffect(() => {
    let cancelled = false;
    const token = passwordlessToken?.trim();
    if (!token) return;

    const completeTokenLogin = async () => {
      setServerError(null);
      setServerMessage("Checking your secure sign-in link...");
      try {
        const response = await passwordlessLogin.complete({ token, tenantId });
        if (!response.success || !response.data) {
          throw new Error(response.message ?? "This sign-in link is invalid or has expired.");
        }

        if (!cancelled) onAuthenticated?.(passwordlessReturnUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "This sign-in link is invalid or has expired.");
          setServerMessage(null);
        }
      }
    };

    void completeTokenLogin();
    return () => {
      cancelled = true;
    };
  }, [onAuthenticated, passwordlessLogin, passwordlessReturnUrl, passwordlessToken, setError, tenantId]);

  const submitPasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setServerError(null);
    setServerMessage(null);

    if (!isEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (!password) {
      setFormError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password, tenantId);
      onAuthenticated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExternalLogin = useCallback(async (provider: "Google" | "Apple", credential: string) => {
    setServerError(null);
    setServerMessage(null);
    setBusyProvider(provider);
    try {
      await externalLogin(provider, credential, tenantId);
      onAuthenticated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} login failed. Please try again.`);
    } finally {
      setBusyProvider(null);
    }
  }, [externalLogin, onAuthenticated, setError, tenantId]);

  const handleAppleLogin = async () => {
    if (!appleClientId) return;

    try {
      const credential = await signInWithApple(appleClientId, appleRedirectPath, appleRedirectOrigin);
      await handleExternalLogin("Apple", credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apple sign-in was cancelled or failed.");
    }
  };

  const requestPasswordlessCode = async (loginValue: string) => {
    setPasswordlessBusy(true);
    setServerError(null);
    setServerMessage(null);
    try {
      const response = await passwordlessLogin.begin({ login: loginValue || "", deliveryMode: "CodeAndLink", returnUrl: passwordlessCodeReturnUrl });
      if (!response.success || !response.data) {
        throw new Error(response.message ?? "Could not send a sign-in code.");
      }

      setPasswordlessChallengeId(response.data.challengeId ?? null);
      setServerMessage(response.data.message ?? "If this email is verified, we sent a secure sign-in code.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a sign-in code.");
    } finally {
      setPasswordlessBusy(false);
    }
  };

  const completePasswordlessCode = async (code: string) => {
    if (!passwordlessChallengeId) {
      setError("Please request a sign-in code first.");
      return;
    }

    setPasswordlessBusy(true);
    setServerError(null);
    setServerMessage(null);
    try {
      const response = await passwordlessLogin.complete({ challengeId: passwordlessChallengeId, code, tenantId, switchToCurrentTenant: true });
      if (!response.success || !response.data) {
        throw new Error(response.message ?? "This sign-in code is invalid or has expired.");
      }

      onAuthenticated?.(passwordlessCodeReturnUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This sign-in code is invalid or has expired.");
    } finally {
      setPasswordlessBusy(false);
    }
  };

  return (
    <div className="bt-auth-login-panel">
      {serverError && <div className="alert alert-danger">{serverError}</div>}
      {serverMessage && <div className="alert alert-info">{serverMessage}</div>}

      {!showEmailForm && (
        <div className="d-grid gap-3 justify-items-center">
          {googleClientId && <GoogleCredentialButton clientId={googleClientId} text="continue_with" onCredential={credential => void handleExternalLogin("Google", credential)} onError={setError} />}
          {appleClientId && (
            <AuthProviderButton variant="apple" label="Continue with Apple" busyLabel="Opening Apple..." busy={busyProvider === "Apple"} onClick={() => void handleAppleLogin()} />
          )}
          <AuthProviderButton variant="email" label="Continue with Email" onClick={() => setShowEmailForm(true)} />
        </div>
      )}

      {showEmailForm && (
        <>
          <form onSubmit={submitPasswordLogin} noValidate>
            <button type="button" className="btn btn-link px-0 mb-3" onClick={() => setShowEmailForm(false)}>
              Back to login options
            </button>
            {formError && <div className="alert alert-danger py-2">{formError}</div>}
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" />
            </div>
            <PasswordField className="mb-3" label="Password" value={password} autoComplete="current-password" onChange={setPassword} />
            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="border-top mt-4 pt-4">
            <h2 className="h6">Sign in with an email code</h2>
            <p className="small text-muted">Useful on mobile, or if you do not want to use your password right now.</p>
            <PasswordlessEmailLoginForm challengeId={passwordlessChallengeId} busy={passwordlessBusy} onBegin={requestPasswordlessCode} onComplete={completePasswordlessCode} />
          </div>
        </>
      )}
    </div>
  );
}



