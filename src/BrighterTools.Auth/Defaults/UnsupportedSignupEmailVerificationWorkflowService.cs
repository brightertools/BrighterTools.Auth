using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Fail-closed default signup email verification workflow.
/// </summary>
public sealed class UnsupportedSignupEmailVerificationWorkflowService : ISignupEmailVerificationWorkflowService
{
    public Task<BeginSignupEmailVerificationResponse> BeginSignupEmailVerificationAsync(BeginSignupEmailVerificationRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<BeginSignupEmailVerificationResponse>(new NotSupportedException("Signup email verification is not configured."));

    public Task<VerifySignupEmailVerificationCodeResponse> VerifySignupEmailVerificationCodeAsync(VerifySignupEmailVerificationCodeRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<VerifySignupEmailVerificationCodeResponse>(new NotSupportedException("Signup email verification is not configured."));
}
