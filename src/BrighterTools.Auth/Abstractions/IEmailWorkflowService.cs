namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Delegates password reset, email verification, and account activation workflows to the host application.
/// </summary>
public interface IEmailWorkflowService
{
    /// <summary>
    /// Starts the host-managed password reset workflow for the supplied login.
    /// </summary>
    Task BeginPasswordResetAsync(string login, CancellationToken cancellationToken = default);
    /// <summary>
    /// Completes a password reset using the supplied token and new password.
    /// </summary>
    Task CompletePasswordResetAsync(string token, string newPassword, CancellationToken cancellationToken = default);
    /// <summary>
    /// Starts email verification for the specified user.
    /// </summary>
    Task BeginEmailVerificationAsync(string userId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Confirms the supplied email verification token.
    /// </summary>
    Task ConfirmEmailVerificationAsync(string token, CancellationToken cancellationToken = default);
    /// <summary>
    /// Completes the account activation workflow for the supplied activation token.
    /// </summary>
    Task ActivateAccountAsync(string token, CancellationToken cancellationToken = default);
}

