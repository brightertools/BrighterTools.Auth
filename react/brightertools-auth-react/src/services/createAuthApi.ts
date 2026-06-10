import type {
  AccountLoginMethodsResponse,
  AuthResponse,
  BeginEmailChallengeResponse,
  BeginLoginEmailChangeRequest,
  BeginSignupEmailVerificationRequest,
  BeginSignupEmailVerificationResponse,
  BeginPasswordlessEmailLoginRequest,
  BeginPasswordSetupResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  CompletePasswordSetupRequest,
  CompletePasswordSetupResponse,
  CompleteOnboardingRequest,
  CompletePasswordlessEmailLoginRequest,
  ExternalLoginRequest,
  ExternalSignupRequest,
  LinkedProvidersResponse,
  OnboardingStatusResponse,
  PasswordLoginRequest,
  PasswordSignupResult,
  PasswordSignupRequest,
  RefreshTokenRequest,
  RemovePasswordLoginResponse,
  TenantScopedRequest,
  VerifyLoginEmailChangeCodeRequest,
  VerifyLoginEmailChangeResponse,
  VerifySignupEmailVerificationCodeRequest,
  VerifySignupEmailVerificationCodeResponse
} from "../types/api";
import type { LinkedProvider } from "../types/auth";

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthApiEndpoints {
  passwordLogin: string;
  externalLogin: string;
  passwordSignup: string;
  beginSignupEmailVerification: string;
  verifySignupEmailVerificationCode: string;
  externalSignup: string;
  refresh: string;
  logout: string;
  currentSession: string;
  onboardingStatus: string;
  completeOnboarding: string;
  linkedProviders: string;
  linkProvider: string;
  unlinkProvider: string;
  loginMethods: string;
  beginLoginEmailChange: string;
  verifyLoginEmailChangeCode: string;
  confirmLoginEmailChange: string;
  beginPasswordSetup: string;
  completePasswordSetup: string;
  changePassword: string;
  removePasswordLogin: string;
  beginPasswordReset: string;
  completePasswordReset: string;
  confirmEmailVerification: string;
  beginPasswordlessEmailLogin: string;
  completePasswordlessEmailLogin: string;
}

export interface AuthApiClient {
  loginWithPassword(request: PasswordLoginRequest): Promise<ApiEnvelope<AuthResponse>>;
  loginWithExternalProvider(request: ExternalLoginRequest): Promise<ApiEnvelope<AuthResponse>>;
  signupWithPassword(request: PasswordSignupRequest): Promise<ApiEnvelope<PasswordSignupResult>>;
  beginSignupEmailVerification(request: BeginSignupEmailVerificationRequest): Promise<ApiEnvelope<BeginSignupEmailVerificationResponse>>;
  verifySignupEmailVerificationCode(request: VerifySignupEmailVerificationCodeRequest): Promise<ApiEnvelope<VerifySignupEmailVerificationCodeResponse>>;
  signupWithExternalProvider(request: ExternalSignupRequest): Promise<ApiEnvelope<AuthResponse>>;
  refresh(request: RefreshTokenRequest): Promise<ApiEnvelope<AuthResponse>>;
  logout(request?: Partial<RefreshTokenRequest>): Promise<ApiEnvelope<boolean>>;
  currentSession(): Promise<ApiEnvelope<AuthResponse>>;
  onboardingStatus(request?: TenantScopedRequest): Promise<ApiEnvelope<OnboardingStatusResponse>>;
  completeOnboarding(request: CompleteOnboardingRequest): Promise<ApiEnvelope<OnboardingStatusResponse>>;
  linkedProviders(): Promise<ApiEnvelope<LinkedProvidersResponse>>;
  linkProvider(request: ExternalLoginRequest): Promise<ApiEnvelope<LinkedProvidersResponse>>;
  unlinkProvider(request: Pick<LinkedProvider, "provider" | "providerSubject">): Promise<ApiEnvelope<LinkedProvidersResponse>>;
  loginMethods(): Promise<ApiEnvelope<AccountLoginMethodsResponse>>;
  beginLoginEmailChange(request: BeginLoginEmailChangeRequest): Promise<ApiEnvelope<BeginEmailChallengeResponse>>;
  verifyLoginEmailChangeCode(request: VerifyLoginEmailChangeCodeRequest): Promise<ApiEnvelope<VerifyLoginEmailChangeResponse>>;
  confirmLoginEmailChange(token: string): Promise<ApiEnvelope<VerifyLoginEmailChangeResponse>>;
  beginPasswordSetup(): Promise<ApiEnvelope<BeginPasswordSetupResponse>>;
  completePasswordSetup(request: CompletePasswordSetupRequest): Promise<ApiEnvelope<CompletePasswordSetupResponse>>;
  changePassword(request: ChangePasswordRequest): Promise<ApiEnvelope<ChangePasswordResponse>>;
  removePasswordLogin(): Promise<ApiEnvelope<RemovePasswordLoginResponse>>;
  beginPasswordReset(login: string): Promise<ApiEnvelope<boolean>>;
  completePasswordReset(token: string, newPassword: string): Promise<ApiEnvelope<boolean>>;
  confirmEmailVerification(token: string): Promise<ApiEnvelope<boolean>>;
  beginPasswordlessEmailLogin(request: BeginPasswordlessEmailLoginRequest): Promise<ApiEnvelope<BeginEmailChallengeResponse>>;
  completePasswordlessEmailLogin(request: CompletePasswordlessEmailLoginRequest): Promise<ApiEnvelope<AuthResponse>>;
}

export interface CreateAuthApiOptions {
  baseUrl?: string;
  getBaseUrl?: () => string;
  apiPrefix?: string;
  endpoints?: Partial<AuthApiEndpoints>;
  fetcher?: typeof fetch;
  getAccessToken?: () => string | null | undefined;
  onUnauthorized?: () => void;
}

const defaultEndpoints = (apiPrefix: string): AuthApiEndpoints => ({
  passwordLogin: `${apiPrefix}/authentication/login/password`,
  externalLogin: `${apiPrefix}/authentication/login/external`,
  passwordSignup: `${apiPrefix}/authentication/signup/password`,
  beginSignupEmailVerification: `${apiPrefix}/authentication/signup/email-verification/begin`,
  verifySignupEmailVerificationCode: `${apiPrefix}/authentication/signup/email-verification/verify-code`,
  externalSignup: `${apiPrefix}/authentication/signup/external`,
  refresh: `${apiPrefix}/authentication/refresh`,
  logout: `${apiPrefix}/authentication/logout`,
  currentSession: `${apiPrefix}/account/session/current`,
  onboardingStatus: `${apiPrefix}/onboarding/status`,
  completeOnboarding: `${apiPrefix}/onboarding/complete`,
  linkedProviders: `${apiPrefix}/account/providers`,
  linkProvider: `${apiPrefix}/account/providers/link`,
  unlinkProvider: `${apiPrefix}/account/providers/unlink`,
  loginMethods: `${apiPrefix}/account/login-details`,
  beginLoginEmailChange: `${apiPrefix}/account/login-email/change`,
  verifyLoginEmailChangeCode: `${apiPrefix}/account/login-email/verify-code`,
  confirmLoginEmailChange: `${apiPrefix}/authentication/login-email/confirm`,
  beginPasswordSetup: `${apiPrefix}/account/password/setup`,
  completePasswordSetup: `${apiPrefix}/account/password/setup/complete`,
  changePassword: `${apiPrefix}/account/password/change`,
  removePasswordLogin: `${apiPrefix}/account/password/remove`,
  beginPasswordReset: `${apiPrefix}/authentication/password-reset/begin`,
  completePasswordReset: `${apiPrefix}/authentication/password-reset/complete`,
  confirmEmailVerification: `${apiPrefix}/authentication/email-verification/confirm`,
  beginPasswordlessEmailLogin: `${apiPrefix}/authentication/passwordless-email/begin`,
  completePasswordlessEmailLogin: `${apiPrefix}/authentication/passwordless-email/complete`
});

export const createAuthApi = (optionsOrBaseUrl: CreateAuthApiOptions | string = {}): AuthApiClient => {
  const options: CreateAuthApiOptions = typeof optionsOrBaseUrl === "string" ? { baseUrl: optionsOrBaseUrl } : optionsOrBaseUrl;
  const getBaseUrl = () => (options.getBaseUrl?.() ?? options.baseUrl ?? "").replace(/\/$/, "");
  const fetcher = options.fetcher ?? fetch;
  const endpoints = { ...defaultEndpoints(options.apiPrefix ?? "/api/v1"), ...options.endpoints };

  const post = async <TRequest, TResponse>(path: string, body: TRequest): Promise<ApiEnvelope<TResponse>> => {
    const token = options.getAccessToken?.();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetcher(`${getBaseUrl()}${path}`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body ?? {})
    });

    if (response.status === 401) {
      options.onUnauthorized?.();
    }

    const text = await response.text();
    const parsed = text ? JSON.parse(text) : undefined;

    if (!response.ok) {
      return {
        success: false,
        message: parsed?.message ?? `Auth API request failed: ${response.status}`,
        data: parsed?.data
      };
    }

    return parsed as ApiEnvelope<TResponse>;
  };

  return {
    loginWithPassword: request => post(endpoints.passwordLogin, request),
    loginWithExternalProvider: request => post(endpoints.externalLogin, request),
    signupWithPassword: request => post(endpoints.passwordSignup, request),
    beginSignupEmailVerification: request => post(endpoints.beginSignupEmailVerification, request),
    verifySignupEmailVerificationCode: request => post(endpoints.verifySignupEmailVerificationCode, request),
    signupWithExternalProvider: request => post(endpoints.externalSignup, request),
    refresh: request => post(endpoints.refresh, request),
    logout: request => post(endpoints.logout, request ?? {}),
    currentSession: () => post(endpoints.currentSession, {}),
    onboardingStatus: request => post(endpoints.onboardingStatus, request ?? {}),
    completeOnboarding: request => post(endpoints.completeOnboarding, request),
    linkedProviders: () => post(endpoints.linkedProviders, {}),
    linkProvider: request => post(endpoints.linkProvider, request),
    unlinkProvider: request => post(endpoints.unlinkProvider, request),
    loginMethods: () => post(endpoints.loginMethods, {}),
    beginLoginEmailChange: request => post(endpoints.beginLoginEmailChange, request),
    verifyLoginEmailChangeCode: request => post(endpoints.verifyLoginEmailChangeCode, request),
    confirmLoginEmailChange: token => post(endpoints.confirmLoginEmailChange, { token }),
    beginPasswordSetup: () => post(endpoints.beginPasswordSetup, {}),
    completePasswordSetup: request => post(endpoints.completePasswordSetup, request),
    changePassword: request => post(endpoints.changePassword, request),
    removePasswordLogin: () => post(endpoints.removePasswordLogin, {}),
    beginPasswordReset: login => post(endpoints.beginPasswordReset, { login }),
    completePasswordReset: (token, newPassword) => post(endpoints.completePasswordReset, { token, newPassword }),
    confirmEmailVerification: token => post(endpoints.confirmEmailVerification, { token }),
    beginPasswordlessEmailLogin: request => post(endpoints.beginPasswordlessEmailLogin, request),
    completePasswordlessEmailLogin: request => post(endpoints.completePasswordlessEmailLogin, request)
  };
};



