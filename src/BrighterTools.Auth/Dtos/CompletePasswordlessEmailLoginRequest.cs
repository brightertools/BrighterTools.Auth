namespace BrighterTools.Auth.Dtos;

public sealed class CompletePasswordlessEmailLoginRequest
{
    public string? ChallengeId { get; init; }
    public string? Code { get; init; }
    public string? Token { get; init; }
    public string? TenantId { get; init; }
    public bool SwitchToCurrentTenant { get; init; }
}
