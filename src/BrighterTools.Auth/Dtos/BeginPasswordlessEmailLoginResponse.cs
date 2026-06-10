using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

public sealed class BeginPasswordlessEmailLoginResponse
{
    public string? ChallengeId { get; init; }
    public string MaskedEmail { get; init; } = string.Empty;
    public EmailChallengeDeliveryMode DeliveryMode { get; init; }
    public bool CodeSent { get; init; }
    public bool LinkSent { get; init; }
    public DateTimeOffset ExpiresAtUtc { get; init; }
    public string? Message { get; init; }
}
