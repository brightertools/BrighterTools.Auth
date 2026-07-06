using BrighterTools.Auth.Dtos;
using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Coordinates authentication and account lifecycle workflows by composing host-provided services for users, tenants, tokens, onboarding, MFA, and external providers.
/// </summary>
public interface IAuthOrchestrator
{
    /// <summary>
    /// Authenticates a user using the supplied password-based login request.
    /// </summary>
    Task<AuthResponse> LoginWithPasswordAsync(PasswordLoginRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Authenticates a user using a provider-issued external credential.
    /// </summary>
    Task<AuthResponse> LoginWithExternalProviderAsync(ExternalLoginRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Creates and authenticates a user using a provider-issued external credential.
    /// </summary>
    Task<AuthResponse> SignupWithExternalProviderAsync(ExternalSignupRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Delegates password-based sign-up to the host registration workflow.
    /// </summary>
    Task<PasswordSignupResult> SignupWithPasswordAsync(PasswordSignupRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Begins email verification before password-based sign-up.
    /// </summary>
    Task<BeginSignupEmailVerificationResponse> BeginSignupEmailVerificationAsync(BeginSignupEmailVerificationRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Verifies a signup email challenge code before password-based sign-up.
    /// </summary>
    Task<VerifySignupEmailVerificationCodeResponse> VerifySignupEmailVerificationCodeAsync(VerifySignupEmailVerificationCodeRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Delegates invitation acceptance and password capture to the host registration workflow.
    /// </summary>
    Task<InvitationAcceptanceResult> AcceptInvitationWithPasswordAsync(AcceptInvitationWithPasswordRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Issues a new session for a known, already-trusted user context. Use this for server-side session handoff flows rather than credential validation.
    /// </summary>
    Task<AuthResponse> IssueSessionAsync(IssueSessionRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Persists a new active tenant for an authenticated user and issues a session for that tenant.
    /// </summary>
    Task<AuthResponse> SwitchTenantAsync(SwitchTenantRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Exchanges a refresh token for a new session according to the configured rotation rules.
    /// </summary>
    Task<AuthResponse> RefreshAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Revokes the supplied refresh token and ends the corresponding session.
    /// </summary>
    Task LogoutAsync(LogoutRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Begins the host-defined password reset workflow for the supplied login.
    /// </summary>
    Task BeginPasswordResetAsync(BeginPasswordResetRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Completes a password reset using the supplied reset token and replacement password.
    /// </summary>
    Task CompletePasswordResetAsync(CompletePasswordResetRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Starts email verification for the specified user.
    /// </summary>
    Task BeginEmailVerificationAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Confirms an email verification token.
    /// </summary>
    Task ConfirmEmailVerificationAsync(ConfirmEmailVerificationRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Activates an account using the supplied activation token.
    /// </summary>
    Task ActivateAccountAsync(AccountActivationRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Starts MFA enrollment for the specified user.
    /// </summary>
    Task<MfaEnrollmentResponse> BeginMfaEnrollmentAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Verifies an MFA enrollment code and finalizes enrollment when valid.
    /// </summary>
    Task<MfaEnrollmentResponse> VerifyMfaEnrollmentAsync(string userId, string code, CancellationToken cancellationToken = default);
    /// <summary>
    /// Validates an MFA challenge or recovery code for the specified user.
    /// </summary>
    Task<MfaChallengeResponse> ChallengeMfaAsync(string userId, string code, CancellationToken cancellationToken = default);
    /// <summary>
    /// Disables MFA for the specified user.
    /// </summary>
    Task DisableMfaAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns the external providers currently linked to the specified user.
    /// </summary>
    Task<LinkedProvidersResponse> GetLinkedProvidersAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Validates and links an external provider credential to the specified user.
    /// </summary>
    Task<LinkedProvidersResponse> LinkProviderAsync(string userId, AuthProviderType provider, string credential, CancellationToken cancellationToken = default);
    /// <summary>
    /// Removes an external provider link from the specified user.
    /// </summary>
    Task<LinkedProvidersResponse> UnlinkProviderAsync(string userId, AuthProviderType provider, string providerSubject, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns all login methods and email/password state for the supplied user.
    /// </summary>
    Task<AccountLoginMethodsResponse> GetAccountLoginMethodsAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Begins changing the user's login email using a code, link, or both depending on configuration/request.
    /// </summary>
    Task<BeginLoginEmailChangeResponse> BeginLoginEmailChangeAsync(string userId, BeginLoginEmailChangeRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Verifies a login email change using an emailed code.
    /// </summary>
    Task<VerifyLoginEmailChangeResponse> VerifyLoginEmailChangeCodeAsync(string userId, VerifyLoginEmailChangeCodeRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Verifies a login email change using an emailed link token.
    /// </summary>
    Task<VerifyLoginEmailChangeResponse> ConfirmLoginEmailChangeAsync(ConfirmLoginEmailChangeRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Begins changing the user's notification email using a code, link, or both depending on configuration/request.
    /// </summary>
    Task<BeginLoginEmailChangeResponse> BeginNotificationEmailChangeAsync(string userId, BeginNotificationEmailChangeRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Verifies a notification email change using an emailed code.
    /// </summary>
    Task<VerifyNotificationEmailChangeResponse> VerifyNotificationEmailChangeCodeAsync(string userId, VerifyNotificationEmailChangeCodeRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Verifies a notification email change using an emailed link token.
    /// </summary>
    Task<VerifyNotificationEmailChangeResponse> ConfirmNotificationEmailChangeAsync(ConfirmNotificationEmailChangeRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Begins password setup for an account that may currently rely on an external provider.
    /// </summary>
    Task<BeginPasswordSetupResponse> BeginPasswordSetupAsync(string userId, BeginPasswordSetupRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Completes inline password setup after the login email has been verified.
    /// </summary>
    Task<CompletePasswordSetupResponse> CompletePasswordSetupAsync(string userId, CompletePasswordSetupRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Changes the password for an authenticated user after verifying their current password.
    /// </summary>
    Task<ChangePasswordResponse> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Removes email/password login when another usable login provider remains.
    /// </summary>
    Task<RemovePasswordLoginResponse> RemovePasswordLoginAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Begins passwordless email login by OTP code and/or magic link.
    /// </summary>
    Task<BeginPasswordlessEmailLoginResponse> BeginPasswordlessEmailLoginAsync(BeginPasswordlessEmailLoginRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Completes passwordless email login and issues a session.
    /// </summary>
    Task<AuthResponse> CompletePasswordlessEmailLoginAsync(CompletePasswordlessEmailLoginRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns the current onboarding status for the specified user and tenant context.
    /// </summary>
    Task<OnboardingStatusResponse> GetOnboardingStatusAsync(string userId, string? tenantId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Completes onboarding for the specified user and tenant context using host-defined fields.
    /// </summary>
    Task<OnboardingStatusResponse> CompleteOnboardingAsync(string userId, string? tenantId, IDictionary<string, object?> fields, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns the current session view stored for the specified user.
    /// </summary>
    Task<CurrentSessionResponse> GetCurrentSessionAsync(string userId, CancellationToken cancellationToken = default);
}









