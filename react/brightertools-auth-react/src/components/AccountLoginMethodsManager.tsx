import { useCallback, useEffect, useState } from "react";
import { AccountLoginMethodsPanel } from "./AccountLoginMethodsPanel";
import { signInWithApple } from "../services/appleAuth";
import { useLoginMethods } from "../hooks/useLoginMethods";
import type { AccountLoginMethods, AuthProviderType, LinkedProvider } from "../types/auth";
import type { BeginEmailChallengeResponse } from "../types/api";

export interface AccountLoginMethodsManagerProps {
  googleClientId?: string;
  appleClientId?: string;
  appleRedirectPath?: string;
  minimumPasswordLength?: number;
  loginEmailReturnUrl?: string;
}

export function AccountLoginMethodsManager({ googleClientId, appleClientId, appleRedirectPath = "/account", minimumPasswordLength = 8, loginEmailReturnUrl = "/account" }: AccountLoginMethodsManagerProps) {
  const loginMethods = useLoginMethods();
  const [details, setDetails] = useState<AccountLoginMethods | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [challenge, setChallenge] = useState<BeginEmailChallengeResponse | null>(null);
  const [setupEmailVerified, setSetupEmailVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyProvider, setBusyProvider] = useState<AuthProviderType | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const providers = details?.providers ?? [];
  const usableMethodCount = providers.length + (details?.hasPassword ? 1 : 0);

  const loadDetails = useCallback(async () => {
    const response = await loginMethods.load();
    if (response.success && response.data) {
      setDetails(response.data);
      if (response.data.hasPassword) setSetupEmailVerified(false);
      setError("");
    } else {
      setError(response.message ?? "Could not load login methods.");
    }
  }, [loginMethods]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const linkProvider = async (provider: "Google" | "Apple", credential: string) => {
    setBusyProvider(provider);
    setError("");
    setMessage("");
    try {
      const response = await loginMethods.linkProvider({ provider, credential });
      if (!response.success) {
        setError(response.message ?? `Could not connect ${provider}.`);
        return;
      }

      await loadDetails();
      setMessage(`${provider} has been connected.`);
    } catch {
      setError(`Could not connect ${provider}.`);
    } finally {
      setBusyProvider(null);
    }
  };

  const unlinkProvider = async (provider: LinkedProvider) => {
    if (usableMethodCount <= 1) {
      setError("Add a password or another sign-in provider before removing your last login method.");
      return;
    }

    setBusyProvider(provider.provider);
    setError("");
    setMessage("");
    try {
      const response = await loginMethods.unlinkProvider({ provider: provider.provider, providerSubject: provider.providerSubject });
      if (!response.success) {
        setError(response.message ?? `Could not remove ${provider.provider}.`);
        return;
      }

      await loadDetails();
      setMessage(`${provider.provider} has been removed.`);
    } catch {
      setError(`Could not remove ${provider.provider}.`);
    } finally {
      setBusyProvider(null);
    }
  };

  const connectApple = async () => {
    if (!appleClientId) return;

    try {
      const credential = await signInWithApple(appleClientId, appleRedirectPath);
      await linkProvider("Apple", credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apple sign-in was cancelled or failed.");
    }
  };

  const requestEmailChange = async (email: string) => {
    setBusyAction("email");
    setError("");
    setMessage("");
    try {
      const response = await loginMethods.beginLoginEmailChange({ email, deliveryMode: "CodeAndLink", returnUrl: loginEmailReturnUrl });
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not start email verification.");
        return;
      }

      setChallenge(response.data);
      setSetupEmailVerified(!response.data.challengeId);
      await loadDetails();
      setMessage(response.data.message ?? "We sent a verification code and link to that email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start email verification.");
    } finally {
      setBusyAction(null);
    }
  };

  const verifyEmailCode = async () => {
    if (!challenge?.challengeId) {
      setError("Please request a verification code first.");
      return;
    }

    setBusyAction("verify-code");
    setError("");
    setMessage("");
    try {
      const response = await loginMethods.verifyLoginEmailChangeCode({ challengeId: challenge.challengeId, code: verificationCode });
      if (!response.success || !response.data) {
        setError(response.message ?? "Could not verify this code.");
        return;
      }

      setChallenge(null);
      setVerificationCode("");
      setSetupEmailVerified(true);
      await loadDetails();
      setMessage(response.data.message ?? "Your login email has been verified.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify this code.");
    } finally {
      setBusyAction(null);
    }
  };

  const clearEmailVerification = () => {
    setChallenge(null);
    setVerificationCode("");
    setSetupEmailVerified(false);
    setMessage("");
    setError("");
  };

  const requestPasswordSetup = async () => {
    setBusyAction("password");
    setError("");
    setMessage("");
    try {
      const response = await loginMethods.beginPasswordSetup();
      if (!response.success) {
        setError(response.message ?? "Could not send password setup email.");
        return;
      }

      setMessage(response.data?.message ?? "We sent a secure password setup link to your login email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send password setup email.");
    } finally {
      setBusyAction(null);
    }
  };

  const changePassword = async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    setBusyAction("change-password");
    setError("");
    setMessage("");
    try {
      const response = await loginMethods.changePassword({ currentPassword, newPassword });
      if (!response.success || !response.data?.passwordChanged) {
        setError(response.message ?? "Could not update your password.");
        return;
      }

      setMessage(response.data.message ?? "Your password has been updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password.");
    } finally {
      setBusyAction(null);
    }
  };

  const removePasswordLogin = async () => {
    setBusyAction("remove-password");
    setError("");
    setMessage("");
    try {
      const response = await loginMethods.removePasswordLogin();
      if (!response.success || !response.data?.passwordRemoved) {
        setError(response.message ?? "Could not remove email/password login.");
        return;
      }

      setSetupEmailVerified(false);
      await loadDetails();
      setMessage(response.data.message ?? "Email/password login has been removed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove email/password login.");
    } finally {
      setBusyAction(null);
    }
  };

  const completePasswordSetup = async ({ email, password }: { email: string; password: string }) => {
    setBusyAction("complete-password-setup");
    setError("");
    setMessage("");
    try {
      const response = await loginMethods.completePasswordSetup({ email, newPassword: password });
      if (!response.success || !response.data?.hasPassword) {
        setError(response.message ?? "Could not set up email/password login.");
        return;
      }

      setSetupEmailVerified(false);
      setChallenge(null);
      setVerificationCode("");
      await loadDetails();
      setMessage(response.data.message ?? "Email/password login has been set up.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set up email/password login.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="bt-auth-account-login-methods-manager">
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <AccountLoginMethodsPanel
        details={details}
        googleClientId={googleClientId}
        appleEnabled={!!appleClientId}
        busyProvider={busyProvider}
        busyAction={busyAction}
        emailChallengeId={challenge?.challengeId}
        verificationCode={verificationCode}
        passwordSetupEmailVerified={setupEmailVerified}
        minimumPasswordLength={minimumPasswordLength}
        onVerificationCodeChange={setVerificationCode}
        onClearEmailVerification={clearEmailVerification}
        onRequestLoginEmailChange={email => requestEmailChange(email)}
        onVerifyLoginEmailCode={verifyEmailCode}
        onRequestPasswordSetup={requestPasswordSetup}
        onCompletePasswordSetup={completePasswordSetup}
        onChangePassword={changePassword}
        onRemovePasswordLogin={removePasswordLogin}
        onGoogleCredential={credential => void linkProvider("Google", credential)}
        onAppleClick={() => void connectApple()}
        onUnlinkProvider={provider => void unlinkProvider(provider)}
        onError={setError}
      />
    </div>
  );
}
