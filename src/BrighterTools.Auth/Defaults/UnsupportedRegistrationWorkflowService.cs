using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides an implementation of registration Workflow Service that reports the feature as unsupported.
/// </summary>
public sealed class UnsupportedRegistrationWorkflowService : IRegistrationWorkflowService
{
    /// <summary>
    /// Performs the signup With Password operation.
    /// </summary>
    public Task<PasswordSignupResult> SignupWithPasswordAsync(PasswordSignupRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<PasswordSignupResult>(new NotSupportedException("Registration workflows are not configured."));

    /// <summary>
    /// Performs the accept Invitation With Password operation.
    /// </summary>
    public Task<InvitationAcceptanceResult> AcceptInvitationWithPasswordAsync(AcceptInvitationWithPasswordRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<InvitationAcceptanceResult>(new NotSupportedException("Registration workflows are not configured."));
}

