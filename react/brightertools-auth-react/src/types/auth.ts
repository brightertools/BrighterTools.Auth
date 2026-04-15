export type AuthProvider = "password" | "google" | "apple" | "microsoft" | "passkey";

export interface TenantMembership {
  tenantId: string;
  tenantName: string;
  role: string;
  isCurrent: boolean;
  metadata?: Record<string, unknown>;
}

export interface OnboardingState {
  required: boolean;
  status: string;
  fields?: Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  subjectId: string;
  email?: string;
  userName?: string;
  displayName?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  provider: AuthProvider;
  user: AuthUser;
  currentTenant?: TenantMembership;
  onboarding: OnboardingState;
  payload?: Record<string, unknown>;
}

export interface LinkedProvider {
  provider: AuthProvider;
  providerSubject: string;
  email?: string;
  linkedAtUtc: string;
}
