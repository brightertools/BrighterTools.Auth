using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

public sealed class AccountLoginMethodsResponse
{
    public string Email { get; init; } = string.Empty;
    public string? PendingEmail { get; init; }
    public bool EmailVerified { get; init; }
    public bool HasPassword { get; init; }
    public string? NotificationEmail { get; init; }
    public bool NotificationEmailVerified { get; init; }
    public bool PrimaryEmailIsPrivateRelay { get; init; }
    public bool RequiresNotificationEmailSetup { get; init; }
    public IReadOnlyList<ExternalLogin> Providers { get; init; } = [];
}
