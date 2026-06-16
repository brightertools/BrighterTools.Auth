using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

public sealed class BeginNotificationEmailChangeRequest
{
    public string Email { get; init; } = string.Empty;
    public EmailChallengeDeliveryMode? DeliveryMode { get; init; }
    public string? ReturnUrl { get; init; }
}
