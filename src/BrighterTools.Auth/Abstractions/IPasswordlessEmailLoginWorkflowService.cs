using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Host-provided workflow for passwordless email login by OTP code and/or magic link.
/// </summary>
public interface IPasswordlessEmailLoginWorkflowService
{
    Task<BeginPasswordlessEmailLoginResponse> BeginAsync(BeginPasswordlessEmailLoginRequest request, CancellationToken cancellationToken = default);
    Task<PasswordlessEmailLoginVerificationResult> CompleteAsync(CompletePasswordlessEmailLoginRequest request, CancellationToken cancellationToken = default);
}
