using BrighterTools.Auth.Abstractions;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides a null-object implementation of email Workflow Service.
/// </summary>
public sealed class NullEmailWorkflowService : IEmailWorkflowService
{
    /// <summary>
    /// Performs the begin Password Reset operation.
    /// </summary>
    public Task BeginPasswordResetAsync(string login, CancellationToken cancellationToken = default)
        => Task.FromException(new NotSupportedException("Email workflows are not configured."));

    /// <summary>
    /// Performs the complete Password Reset operation.
    /// </summary>
    public Task CompletePasswordResetAsync(string token, string newPassword, CancellationToken cancellationToken = default)
        => Task.FromException(new NotSupportedException("Email workflows are not configured."));

    /// <summary>
    /// Performs the begin Email Verification operation.
    /// </summary>
    public Task BeginEmailVerificationAsync(string userId, CancellationToken cancellationToken = default)
        => Task.FromException(new NotSupportedException("Email workflows are not configured."));

    /// <summary>
    /// Performs the confirm Email Verification operation.
    /// </summary>
    public Task ConfirmEmailVerificationAsync(string token, CancellationToken cancellationToken = default)
        => Task.FromException(new NotSupportedException("Email workflows are not configured."));

    /// <summary>
    /// Performs the activate Account operation.
    /// </summary>
    public Task ActivateAccountAsync(string token, CancellationToken cancellationToken = default)
        => Task.FromException(new NotSupportedException("Email workflows are not configured."));
}

