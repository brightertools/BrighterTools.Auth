import type { AuthProvider, AuthSession, LinkedProvider, OnboardingState } from "./auth";

export interface PasswordLoginRequest {
  login: string;
  password: string;
  tenantId?: string;
}

export interface ExternalLoginRequest {
  provider: AuthProvider;
  credential: string;
  tenantId?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
  tenantId?: string;
  switchToCurrentTenant?: boolean;
}

export interface TenantScopedRequest {
  tenantId?: string;
}

export interface CompleteOnboardingRequest {
  tenantId?: string;
  fields: Record<string, unknown>;
}

export interface AuthResponse {
  session?: AuthSession;
  requiresOnboarding: boolean;
}

export interface LinkedProvidersResponse {
  providers: LinkedProvider[];
}

export interface OnboardingStatusResponse {
  onboarding: OnboardingState;
}