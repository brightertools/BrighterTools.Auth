using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

public sealed class AuthEmailAddressSyncRequest
{
    public string UserId { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public bool IsVerified { get; init; }
    public AuthProviderType? SourceProvider { get; init; }
    public string Source { get; init; } = string.Empty;
    public bool UseAsDefaultNotificationEmail { get; init; }
    public bool UseAsDefaultBillingEmail { get; init; }
}
