using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Host-provided workflow for managing account login methods such as login email, password setup, and external providers.
/// </summary>
public interface IAccountLoginMethodWorkflowService
{
    Task<AccountLoginMethodsResponse> GetAccountLoginMethodsAsync(string userId, CancellationToken cancellationToken = default);
    Task<BeginLoginEmailChangeResponse> BeginLoginEmailChangeAsync(string userId, BeginLoginEmailChangeRequest request, CancellationToken cancellationToken = default);
    Task<VerifyLoginEmailChangeResponse> VerifyLoginEmailChangeCodeAsync(string userId, VerifyLoginEmailChangeCodeRequest request, CancellationToken cancellationToken = default);
    Task<VerifyLoginEmailChangeResponse> ConfirmLoginEmailChangeAsync(ConfirmLoginEmailChangeRequest request, CancellationToken cancellationToken = default);
    Task<BeginPasswordSetupResponse> BeginPasswordSetupAsync(string userId, BeginPasswordSetupRequest request, CancellationToken cancellationToken = default);
    Task<CompletePasswordSetupResponse> CompletePasswordSetupAsync(string userId, CompletePasswordSetupRequest request, CancellationToken cancellationToken = default);
    Task<ChangePasswordResponse> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken cancellationToken = default);
    Task<RemovePasswordLoginResponse> RemovePasswordLoginAsync(string userId, CancellationToken cancellationToken = default);
}


