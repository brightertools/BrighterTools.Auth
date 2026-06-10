namespace BrighterTools.Auth.Dtos;

public sealed class BeginPasswordSetupResponse
{
    public bool LinkSent { get; init; }
    public DateTimeOffset? ExpiresAtUtc { get; init; }
    public string? Message { get; init; }
}
