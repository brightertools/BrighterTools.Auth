using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

public sealed class BeginPasswordlessEmailLoginRequest
{
    public string Login { get; init; } = string.Empty;
    public EmailChallengeDeliveryMode? DeliveryMode { get; init; }
    public string? ReturnUrl { get; init; }
}
