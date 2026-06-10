using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Defaults;

public sealed class UnsupportedPasswordlessEmailLoginWorkflowService : IPasswordlessEmailLoginWorkflowService
{
    public Task<BeginPasswordlessEmailLoginResponse> BeginAsync(BeginPasswordlessEmailLoginRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<BeginPasswordlessEmailLoginResponse>(new NotSupportedException("Passwordless email login is not configured."));

    public Task<PasswordlessEmailLoginVerificationResult> CompleteAsync(CompletePasswordlessEmailLoginRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<PasswordlessEmailLoginVerificationResult>(new NotSupportedException("Passwordless email login is not configured."));
}
