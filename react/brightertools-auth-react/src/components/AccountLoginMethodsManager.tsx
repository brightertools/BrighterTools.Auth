import { useCallback, useEffect, useMemo, useState } from "react";
import { AccountLoginMethodsPanel, type AccountLoginIdentity } from "./AccountLoginMethodsPanel";
import {
  defaultAccountLoginMethodsText,
  formatAuthText,
  getAuthProviderLabel,
  type AuthProviderUiConfig,
  type AuthUiTextOverrides
} from "../authUi";
import { useAuth } from "../hooks/useAuth";
import { signInWithApple } from "../services/appleAuth";
import { signInWithMicrosoft } from "../services/microsoftAuth";
import { useLoginMethods } from "../hooks/useLoginMethods";
import type { AccountLoginMethods, AuthProviderType, LinkedProvider } from "../types/auth";
import type { BeginEmailChallengeResponse } from "../types/api";

export interface AccountLoginMethodsManagerProps {
  className?: string;
  providerUi?: AuthProviderUiConfig[];
  textOverrides?: AuthUiTextOverrides;
  loginIdentity?: AccountLoginIdentity;
  googleClientId?: string;
  appleClientId?: string;
  microsoftClientId?: string;
  microsoftAuthority?: string;
  microsoftRedirectPath?: string;
  appleRedirectPath?: string;
  appleRedirectOrigin?: string;
  minimumPasswordLength?: number;
  loginEmailReturnUrl?: string;
  notificationEmailReturnUrl?: string;
}

export function AccountLoginMethodsManager({
  className,
  providerUi,
  textOverrides,
  loginIdentity,
  googleClientId,
  appleClientId,
  microsoftClientId,
  microsoftAuthority,
  microsoftRedirectPath = "/account",
  appleRedirectPath = "/account",
  appleRedirectOrigin,
  minimumPasswordLength = 8,
  loginEmailReturnUrl = "/account",
  notificationEmailReturnUrl = "/account"
}: AccountLoginMethodsManagerProps) {
  const auth = useAuth();
  const loginMethods = useLoginMethods();
  const accountText = useMemo(() => ({ ...defaultAccountLoginMethodsText, ...textOverrides?.accountLoginMethods }), [textOverrides]);
  const [details, setDetails] = useState<AccountLoginMethods | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [initialLoadRequested, setInitialLoadRequested] = useState(false);
  const [initialLoadError, setInitialLoadError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [challenge, setChallenge] = useState<BeginEmailChallengeResponse | null>(null);
  const [notificationVerificationCode, setNotificationVerificationCode] = useState("");
  const [notificationChallenge, setNotificationChallenge] = useState<BeginEmailChallengeResponse | null>(null);
  const [setupEmailVerified, setSetupEmailVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busyProvider, setBusyProvider] = useState<AuthProviderType | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const providers = details?.providers ?? [];
  const usableMethodCount = providers.length + (details?.hasPassword ? 1 : 0);
  const hasLoadedDetails = details !== null;
  const showInitialLoadingState = !hasLoadedDetails && (auth.loading || !initialLoadRequested || detailsLoading || !auth.isAuthenticated);
  const showInitialErrorState = !hasLoadedDetails && !showInitialLoadingState && !!initialLoadError;

  const clearFeedback = useCallback(() => {
    setError("");
    setMessage("");
  }, []);

  const setOperationError = useCallback((value: string) => {
    setMessage("");
    setError(value);
  }, []);

  const loadDetails = useCallback(async ({ showBannerOnFailure = false }: { showBannerOnFailure?: boolean } = {}) => {
    setDetailsLoading(true);
    setInitialLoadError("");

    try {
      const response = await loginMethods.load();
      if (response.success && response.data) {
        setDetails(response.data);
        if (response.data.hasPassword) setSetupEmailVerified(false);
        setError("");
        return true;
      }

      const loadErrorMessage = response.message ?? accountText.loadErrorMessage;
      if (hasLoadedDetails && showBannerOnFailure) {
        setOperationError(loadErrorMessage);
      } else {
        setInitialLoadError(loadErrorMessage);
      }

      return false;
    } finally {
      setDetailsLoading(false);
    }
  }, [accountText.loadErrorMessage, hasLoadedDetails, loginMethods, setOperationError]);

  useEffect(() => {
    if (initialLoadRequested || auth.loading || !auth.isAuthenticated) {
      return;
    }

    setInitialLoadRequested(true);
    void loadDetails();
  }, [auth.isAuthenticated, auth.loading, initialLoadRequested, loadDetails]);

  const retryLoadDetails = () => {
    clearFeedback();
    setInitialLoadError("");
    void loadDetails();
  };

  const completeProviderLink = async (provider: "Google" | "Apple" | "Microsoft", credential: string) => {
    const response = await loginMethods.linkProvider({ provider, credential });
    if (!response.success) {
      setOperationError(response.message ?? formatAuthText(accountText.providerConnectFailedMessage, { provider: getAuthProviderLabel(provider, textOverrides) }));
      return;
    }

    const detailsReloaded = await loadDetails({ showBannerOnFailure: true });
    if (detailsReloaded) {
      setMessage(formatAuthText(accountText.providerConnectedMessage, { provider: getAuthProviderLabel(provider, textOverrides) }));
    }
  };

  const linkProvider = async (provider: "Google" | "Apple" | "Microsoft", credential: string) => {
    if (busyProvider) {
      return;
    }

    clearFeedback();
    setBusyProvider(provider);
    try {
      await completeProviderLink(provider, credential);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : formatAuthText(accountText.providerConnectFailedMessage, { provider: getAuthProviderLabel(provider, textOverrides) }));
    } finally {
      setBusyProvider(null);
    }
  };

  const unlinkProvider = async (provider: LinkedProvider) => {
    if (usableMethodCount <= 1) {
      setOperationError(accountText.addAnotherLoginMethodMessage);
      return;
    }

    setBusyProvider(provider.provider);
    clearFeedback();
    try {
      const response = await loginMethods.unlinkProvider({ provider: provider.provider, providerSubject: provider.providerSubject });
      if (!response.success) {
        setOperationError(response.message ?? formatAuthText(accountText.providerRemoveFailedMessage, { provider: getAuthProviderLabel(provider.provider, textOverrides) }));
        return;
      }

      const detailsReloaded = await loadDetails({ showBannerOnFailure: true });
      if (detailsReloaded) {
        setMessage(formatAuthText(accountText.providerRemovedMessage, { provider: getAuthProviderLabel(provider.provider, textOverrides) }));
      }
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : formatAuthText(accountText.providerRemoveFailedMessage, { provider: getAuthProviderLabel(provider.provider, textOverrides) }));
    } finally {
      setBusyProvider(null);
    }
  };

  const connectApple = async () => {
    if (!appleClientId || busyProvider) return;

    clearFeedback();
    setBusyProvider("Apple");
    try {
      const credential = await signInWithApple(appleClientId, appleRedirectPath, appleRedirectOrigin);
      await completeProviderLink("Apple", credential);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : formatAuthText(accountText.providerConnectCancelledMessage, { provider: getAuthProviderLabel("Apple", textOverrides) }));
    } finally {
      setBusyProvider(null);
    }
  };

  const connectMicrosoft = async () => {
    if (!microsoftClientId || !microsoftAuthority || busyProvider) return;

    clearFeedback();
    setBusyProvider("Microsoft");
    try {
      const result = await signInWithMicrosoft(microsoftClientId, microsoftAuthority, microsoftRedirectPath);
      await completeProviderLink("Microsoft", result.credential);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : formatAuthText(accountText.providerConnectCancelledMessage, { provider: getAuthProviderLabel("Microsoft", textOverrides) }));
    } finally {
      setBusyProvider(null);
    }
  };

  const requestEmailChange = async (email: string) => {
    setBusyAction("email");
    clearFeedback();
    try {
      const response = await loginMethods.beginLoginEmailChange({ email, deliveryMode: "CodeAndLink", returnUrl: loginEmailReturnUrl });
      if (!response.success || !response.data) {
        setOperationError(response.message ?? accountText.emailVerificationStartFailedMessage);
        return;
      }

      setChallenge(response.data);
      setSetupEmailVerified(!response.data.challengeId);
      const detailsReloaded = await loadDetails({ showBannerOnFailure: true });
      if (detailsReloaded) {
        setMessage(response.data.message ?? accountText.emailVerificationSentMessage);
      }
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : accountText.emailVerificationStartFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const verifyEmailCode = async () => {
    if (!challenge?.challengeId) {
      setOperationError(accountText.verifyCodeFirstMessage);
      return;
    }

    setBusyAction("verify-code");
    clearFeedback();
    try {
      const response = await loginMethods.verifyLoginEmailChangeCode({ challengeId: challenge.challengeId, code: verificationCode });
      if (!response.success || !response.data) {
        setOperationError(response.message ?? accountText.verifyCodeFailedMessage);
        return;
      }

      setChallenge(null);
      setVerificationCode("");
      setSetupEmailVerified(true);
      const detailsReloaded = await loadDetails({ showBannerOnFailure: true });
      if (detailsReloaded) {
        setMessage(response.data.message ?? accountText.loginEmailVerifiedMessage);
      }
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : accountText.verifyCodeFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const requestNotificationEmailChange = async (email: string) => {
    setBusyAction("notification-email");
    clearFeedback();
    try {
      const response = await loginMethods.beginNotificationEmailChange({ email, deliveryMode: "Code", returnUrl: notificationEmailReturnUrl });
      if (!response.success || !response.data) {
        setOperationError(response.message ?? accountText.notificationEmailVerificationStartFailedMessage);
        return;
      }

      setNotificationChallenge(response.data);
      const detailsReloaded = await loadDetails({ showBannerOnFailure: true });
      if (detailsReloaded) {
        setMessage(response.data.message ?? accountText.notificationEmailVerificationSentMessage);
      }
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : accountText.notificationEmailVerificationStartFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const verifyNotificationEmailCode = async () => {
    if (!notificationChallenge?.challengeId) {
      setOperationError(accountText.verifyNotificationCodeFirstMessage);
      return;
    }

    setBusyAction("verify-notification-code");
    clearFeedback();
    try {
      const response = await loginMethods.verifyNotificationEmailChangeCode({ challengeId: notificationChallenge.challengeId, code: notificationVerificationCode });
      if (!response.success || !response.data) {
        setOperationError(response.message ?? accountText.verifyCodeFailedMessage);
        return;
      }

      setNotificationChallenge(null);
      setNotificationVerificationCode("");
      const detailsReloaded = await loadDetails({ showBannerOnFailure: true });
      if (detailsReloaded) {
        setMessage(response.data.message ?? accountText.notificationEmailVerifiedMessage);
      }
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : accountText.verifyCodeFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const clearEmailVerification = () => {
    setChallenge(null);
    setVerificationCode("");
    setSetupEmailVerified(false);
    clearFeedback();
  };

  const clearNotificationEmailVerification = () => {
    setNotificationChallenge(null);
    setNotificationVerificationCode("");
    clearFeedback();
  };

  const requestPasswordSetup = async () => {
    setBusyAction("password");
    clearFeedback();
    try {
      const response = await loginMethods.beginPasswordSetup();
      if (!response.success) {
        setOperationError(response.message ?? accountText.passwordSetupEmailFailedMessage);
        return;
      }

      setMessage(response.data?.message ?? accountText.passwordSetupEmailSentMessage);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : accountText.passwordSetupEmailFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const changePassword = async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    setBusyAction("change-password");
    clearFeedback();
    try {
      const response = await loginMethods.changePassword({ currentPassword, newPassword });
      if (!response.success || !response.data?.passwordChanged) {
        setOperationError(response.message ?? accountText.changePasswordFailedMessage);
        return;
      }

      setMessage(response.data.message ?? accountText.changePasswordSuccessMessage);
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : accountText.changePasswordFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const removePasswordLogin = async () => {
    setBusyAction("remove-password");
    clearFeedback();
    try {
      const response = await loginMethods.removePasswordLogin();
      if (!response.success || !response.data?.passwordRemoved) {
        setOperationError(response.message ?? accountText.removePasswordFailedMessage);
        return;
      }

      setSetupEmailVerified(false);
      const detailsReloaded = await loadDetails({ showBannerOnFailure: true });
      if (detailsReloaded) {
        setMessage(response.data.message ?? accountText.removePasswordSuccessMessage);
      }
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : accountText.removePasswordFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  const completePasswordSetup = async ({ email, password }: { email: string; password: string }) => {
    setBusyAction("complete-password-setup");
    clearFeedback();
    try {
      const response = await loginMethods.completePasswordSetup({ email, newPassword: password });
      if (!response.success || !response.data?.hasPassword) {
        setOperationError(response.message ?? accountText.completePasswordSetupFailedMessage);
        return;
      }

      setSetupEmailVerified(false);
      setChallenge(null);
      setVerificationCode("");
      const detailsReloaded = await loadDetails({ showBannerOnFailure: true });
      if (detailsReloaded) {
        setMessage(response.data.message ?? accountText.completePasswordSetupSuccessMessage);
      }
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : accountText.completePasswordSetupFailedMessage);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className={["bt-auth-account-login-methods-manager", className].filter(Boolean).join(" ")}>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {showInitialLoadingState && (
        <section className="border rounded-3 p-3">
          <div className="d-flex align-items-center gap-2 text-muted small">
            <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            <span>{accountText.loadingMessage}</span>
          </div>
        </section>
      )}

      {showInitialErrorState && (
        <section className="border rounded-3 p-3">
          <div className="alert alert-danger py-2 mb-3">{initialLoadError}</div>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={retryLoadDetails}>
            {accountText.retryLabel}
          </button>
        </section>
      )}

      {!showInitialLoadingState && !showInitialErrorState && (
        <AccountLoginMethodsPanel
          providerUi={providerUi}
          textOverrides={textOverrides}
          loginIdentity={loginIdentity}
          details={details}
          googleClientId={googleClientId}
          appleEnabled={!!appleClientId}
          microsoftEnabled={!!microsoftClientId && !!microsoftAuthority}
          busyProvider={busyProvider}
          busyAction={busyAction}
          emailChallengeId={challenge?.challengeId}
          verificationCode={verificationCode}
          notificationEmailChallengeId={notificationChallenge?.challengeId}
          notificationVerificationCode={notificationVerificationCode}
          passwordSetupEmailVerified={setupEmailVerified}
          minimumPasswordLength={minimumPasswordLength}
          onVerificationCodeChange={setVerificationCode}
          onClearEmailVerification={clearEmailVerification}
          onNotificationVerificationCodeChange={setNotificationVerificationCode}
          onClearNotificationEmailVerification={clearNotificationEmailVerification}
          onRequestLoginEmailChange={email => requestEmailChange(email)}
          onVerifyLoginEmailCode={verifyEmailCode}
          onRequestNotificationEmailChange={email => requestNotificationEmailChange(email)}
          onVerifyNotificationEmailCode={verifyNotificationEmailCode}
          onRequestPasswordSetup={requestPasswordSetup}
          onCompletePasswordSetup={completePasswordSetup}
          onChangePassword={changePassword}
          onRemovePasswordLogin={removePasswordLogin}
          onGoogleCredential={credential => void linkProvider("Google", credential)}
          onAppleClick={() => void connectApple()}
          onMicrosoftClick={() => void connectMicrosoft()}
          onUnlinkProvider={provider => void unlinkProvider(provider)}
          onError={setOperationError}
        />
      )}
    </div>
  );
}

