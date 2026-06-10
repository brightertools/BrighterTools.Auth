export type AuthProviderType = "Password" | "Google" | "Apple" | "EmailOtp" | "Microsoft" | "Passkey";
export type EmailChallengeDeliveryMode = "Code" | "Link" | "CodeAndLink";

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
  provider?: AuthProviderType;
  user?: AuthUser;
  currentTenant?: TenantMembership;
  onboarding?: OnboardingState;
  payload?: Record<string, unknown>;
}

export interface LinkedProvider {
  provider: AuthProviderType;
  providerSubject: string;
  email?: string | null;
  emailVerified?: boolean;
  linkedAtUtc: string;
}

export interface AccountLoginMethods {
  email: string;
  pendingEmail?: string | null;
  emailVerified: boolean;
  hasPassword: boolean;
  notificationEmail?: string | null;
  notificationEmailVerified?: boolean;
  primaryEmailIsPrivateRelay?: boolean;
  requiresNotificationEmailSetup?: boolean;
  providers: LinkedProvider[];
}




