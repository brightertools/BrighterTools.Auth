import type {
  AuthResponse,
  CompleteOnboardingRequest,
  ExternalLoginRequest,
  LinkedProvidersResponse,
  OnboardingStatusResponse,
  PasswordLoginRequest,
  RefreshTokenRequest,
  TenantScopedRequest
} from "../types/api";

export interface AuthApiClient {
  loginWithPassword(request: PasswordLoginRequest): Promise<AuthResponse>;
  loginWithExternalProvider(request: ExternalLoginRequest): Promise<AuthResponse>;
  refresh(request: RefreshTokenRequest): Promise<AuthResponse>;
  currentSession(): Promise<AuthResponse>;
  onboardingStatus(request?: TenantScopedRequest): Promise<OnboardingStatusResponse>;
  completeOnboarding(request: CompleteOnboardingRequest): Promise<OnboardingStatusResponse>;
  linkedProviders(): Promise<LinkedProvidersResponse>;
}

export const createAuthApi = (baseUrl: string, fetcher: typeof fetch = fetch): AuthApiClient => {
  const post = async <TRequest, TResponse>(path: string, body: TRequest): Promise<TResponse> => {
    const response = await fetcher(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Auth API request failed: ${response.status}`);
    }

    return (await response.json()) as TResponse;
  };

  return {
    loginWithPassword: (request) => post("/api/auth/login/password", request),
    loginWithExternalProvider: (request) => post(`/api/auth/login/${request.provider}`, request.credential),
    refresh: (request) => post("/api/auth/refresh", request),
    currentSession: () => post("/api/account/session/current", {}),
    onboardingStatus: (request) => post("/api/account/onboarding/status", request ?? {}),
    completeOnboarding: (request) => post("/api/account/onboarding/complete", request),
    linkedProviders: () => post("/api/account/providers", {})
  };
};