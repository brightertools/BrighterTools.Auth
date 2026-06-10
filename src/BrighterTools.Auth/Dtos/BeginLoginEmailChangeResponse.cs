using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

public sealed class BeginLoginEmailChangeResponse
{
    public string Email { get; init; } = string.Empty;
    public string? PendingEmail { get; init; }
    public string? ChallengeId { get; init; }
    public EmailChallengeDeliveryMode DeliveryMode { get; init; }
    public bool CodeSent { get; init; }
    public bool LinkSent { get; init; }
    public DateTimeOffset ExpiresAtUtc { get; init; }
    public string? Message { get; init; }
}
