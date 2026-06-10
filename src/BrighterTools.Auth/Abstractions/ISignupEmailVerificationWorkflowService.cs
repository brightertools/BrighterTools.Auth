using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Host-provided workflow for verifying email ownership before password signup.
/// </summary>
public interface ISignupEmailVerificationWorkflowService
{
    /// <summary>
    /// Begins a signup email verification challenge.
    /// </summary>
    Task<BeginSignupEmailVerificationResponse> BeginSignupEmailVerificationAsync(BeginSignupEmailVerificationRequest request, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verifies a signup email challenge code.
    /// </summary>
    Task<VerifySignupEmailVerificationCodeResponse> VerifySignupEmailVerificationCodeAsync(VerifySignupEmailVerificationCodeRequest request, CancellationToken cancellationToken = default);
}
