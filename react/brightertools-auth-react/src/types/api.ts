import type { AuthProviderType, AuthSession, EmailChallengeDeliveryMode, LinkedProvider, OnboardingState, AccountLoginMethods } from "./auth";

export interface PasswordLoginRequest {
  login: string;
  password: string;
  tenantId?: string;
}

export interface PasswordSignupRequest {
  email: string;
  password: string;
  emailVerificationChallengeId?: string;
  dateOfBirth?: string;
  minimumAgeConfirmed?: boolean;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  consentToMarketingEmails?: boolean;
  consentToHelpEmails?: boolean;
  tenantId?: string;
  fields?: Record<string, unknown>;
}

export interface PasswordSignupResult {
  userId?: string | null;
  requiresEmailVerification: boolean;
  messages?: string[] | null;
}

export interface BeginSignupEmailVerificationRequest {
  email: string;
}

export interface BeginSignupEmailVerificationResponse {
  challengeId: string;
  email: string;
  codeSent: boolean;
  expiresAtUtc: string;
  message?: string | null;
}

export interface VerifySignupEmailVerificationCodeRequest {
  challengeId: string;
  email: string;
  code: string;
}

export interface VerifySignupEmailVerificationCodeResponse {
  challengeId: string;
  email: string;
  emailVerified: boolean;
  message?: string | null;
}

export interface ExternalLoginRequest {
  provider: AuthProviderType;
  credential: string;
  tenantId?: string;
}

export interface ExternalSignupRequest extends ExternalLoginRequest {
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  dateOfBirth?: string;
  minimumAgeConfirmed?: boolean;
  consentToMarketingEmails?: boolean;
  consentToHelpEmails?: boolean;
  verifiedEmail?: string;
  emailVerificationChallengeId?: string;
  fields?: Record<string, unknown>;
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
  requiresOnboarding?: boolean;
}

export interface LinkedProvidersResponse {
  providers: LinkedProvider[];
}

export interface AccountLoginMethodsResponse extends AccountLoginMethods {}

export interface BeginLoginEmailChangeRequest {
  email: string;
  deliveryMode?: EmailChallengeDeliveryMode;
  returnUrl?: string;
}

export interface BeginEmailChallengeResponse {
  challengeId?: string | null;
  email?: string;
  pendingEmail?: string | null;
  maskedEmail?: string;
  deliveryMode: EmailChallengeDeliveryMode;
  codeSent: boolean;
  linkSent: boolean;
  expiresAtUtc: string;
  message?: string | null;
}

export interface VerifyLoginEmailChangeCodeRequest {
  challengeId: string;
  code: string;
}

export interface VerifyLoginEmailChangeResponse {
  email: string;
  emailVerified: boolean;
  message?: string | null;
}

export interface BeginNotificationEmailChangeRequest {
  email: string;
  deliveryMode?: EmailChallengeDeliveryMode;
  returnUrl?: string;
}

export interface VerifyNotificationEmailChangeCodeRequest {
  challengeId: string;
  code: string;
}

export interface VerifyNotificationEmailChangeResponse {
  email: string;
  notificationEmailVerified: boolean;
  message?: string | null;
}

export interface BeginPasswordSetupResponse {
  linkSent: boolean;
  message?: string | null;
}

export interface CompletePasswordSetupRequest {
  email: string;
  newPassword: string;
}

export interface CompletePasswordSetupResponse {
  email: string;
  hasPassword: boolean;
  message?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  passwordChanged: boolean;
  message?: string | null;
}

export interface RemovePasswordLoginResponse {
  passwordRemoved: boolean;
  message?: string | null;
}

export interface BeginPasswordlessEmailLoginRequest {
  login: string;
  deliveryMode?: EmailChallengeDeliveryMode;
  returnUrl?: string;
}

export interface CompletePasswordlessEmailLoginRequest {
  challengeId?: string;
  code?: string;
  token?: string;
  tenantId?: string;
  switchToCurrentTenant?: boolean;
}

export interface OnboardingStatusResponse {
  onboarding: OnboardingState;
}
