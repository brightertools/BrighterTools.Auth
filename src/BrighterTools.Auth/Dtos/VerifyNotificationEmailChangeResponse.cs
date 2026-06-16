namespace BrighterTools.Auth.Dtos;

public sealed class VerifyNotificationEmailChangeResponse
{
    public string Email { get; init; } = string.Empty;
    public bool NotificationEmailVerified { get; init; }
    public string? Message { get; init; }
}
