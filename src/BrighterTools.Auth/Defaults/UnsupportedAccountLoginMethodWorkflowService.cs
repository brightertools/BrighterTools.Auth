using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Defaults;

public sealed class UnsupportedAccountLoginMethodWorkflowService : IAccountLoginMethodWorkflowService
{
    public Task<AccountLoginMethodsResponse> GetAccountLoginMethodsAsync(string userId, CancellationToken cancellationToken = default)
        => Task.FromException<AccountLoginMethodsResponse>(new NotSupportedException("Account login methods are not configured."));

    public Task<BeginLoginEmailChangeResponse> BeginLoginEmailChangeAsync(string userId, BeginLoginEmailChangeRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<BeginLoginEmailChangeResponse>(new NotSupportedException("Login email changes are not configured."));

    public Task<VerifyLoginEmailChangeResponse> VerifyLoginEmailChangeCodeAsync(string userId, VerifyLoginEmailChangeCodeRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<VerifyLoginEmailChangeResponse>(new NotSupportedException("Login email verification codes are not configured."));

    public Task<VerifyLoginEmailChangeResponse> ConfirmLoginEmailChangeAsync(ConfirmLoginEmailChangeRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<VerifyLoginEmailChangeResponse>(new NotSupportedException("Login email verification links are not configured."));

    public Task<BeginLoginEmailChangeResponse> BeginNotificationEmailChangeAsync(string userId, BeginNotificationEmailChangeRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<BeginLoginEmailChangeResponse>(new NotSupportedException("Notification email changes are not configured."));

    public Task<VerifyNotificationEmailChangeResponse> VerifyNotificationEmailChangeCodeAsync(string userId, VerifyNotificationEmailChangeCodeRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<VerifyNotificationEmailChangeResponse>(new NotSupportedException("Notification email verification codes are not configured."));

    public Task<VerifyNotificationEmailChangeResponse> ConfirmNotificationEmailChangeAsync(ConfirmNotificationEmailChangeRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<VerifyNotificationEmailChangeResponse>(new NotSupportedException("Notification email verification links are not configured."));

    public Task<BeginPasswordSetupResponse> BeginPasswordSetupAsync(string userId, BeginPasswordSetupRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<BeginPasswordSetupResponse>(new NotSupportedException("Password setup is not configured."));

    public Task<CompletePasswordSetupResponse> CompletePasswordSetupAsync(string userId, CompletePasswordSetupRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<CompletePasswordSetupResponse>(new NotSupportedException("Password setup is not configured."));

    public Task<ChangePasswordResponse> ChangePasswordAsync(string userId, ChangePasswordRequest request, CancellationToken cancellationToken = default)
        => Task.FromException<ChangePasswordResponse>(new NotSupportedException("Password changes are not configured."));

    public Task<RemovePasswordLoginResponse> RemovePasswordLoginAsync(string userId, CancellationToken cancellationToken = default)
        => Task.FromException<RemovePasswordLoginResponse>(new NotSupportedException("Password login removal is not configured."));
}
