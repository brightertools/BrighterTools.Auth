using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Executes host-owned registration and invitation acceptance workflows.
/// </summary>
public interface IRegistrationWorkflowService
{
    /// <summary>
    /// Runs the host's password-based sign-up workflow.
    /// </summary>
    Task<PasswordSignupResult> SignupWithPasswordAsync(PasswordSignupRequest request, CancellationToken cancellationToken = default);
    /// <summary>
    /// Runs the host's invitation acceptance workflow.
    /// </summary>
    Task<InvitationAcceptanceResult> AcceptInvitationWithPasswordAsync(AcceptInvitationWithPasswordRequest request, CancellationToken cancellationToken = default);
}

