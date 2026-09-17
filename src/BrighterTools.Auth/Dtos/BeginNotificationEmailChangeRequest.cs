using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

public sealed class BeginNotificationEmailChangeRequest
{
    public string Email { get; init; } = string.Empty;
    /// <summary>Verify a contact address without changing the notification selection.</summary>
    public bool AddOnly { get; init; }
    public EmailChallengeDeliveryMode? DeliveryMode { get; init; }
    public string? ReturnUrl { get; init; }
}
