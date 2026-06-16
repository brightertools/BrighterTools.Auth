using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

public sealed class AuthEmailAddressCandidate
{
    public string Email { get; init; } = string.Empty;
    public bool IsVerified { get; init; }
    public AuthProviderType? SourceProvider { get; init; }
    public string? Source { get; init; }
    public bool IsPrivateRelay { get; init; }
    public bool CanUseForNotifications { get; init; }
    public bool IsCurrentNotificationEmail { get; init; }
}
