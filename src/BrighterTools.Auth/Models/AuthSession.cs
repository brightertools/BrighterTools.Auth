namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the persisted session view stored by the host application.
/// </summary>
public sealed class AuthSession
{
    /// <summary>
    /// Gets the application-owned identifier of the user who owns the session.
    /// </summary>
    public string UserId { get; init; } = string.Empty;

    /// <summary>
    /// Gets the issued access token.
    /// </summary>
    public string AccessToken { get; init; } = string.Empty;

    /// <summary>
    /// Gets the refresh token that can renew the session.
    /// </summary>
    public string RefreshToken { get; init; } = string.Empty;

    /// <summary>
    /// Gets the UTC timestamp at which the access token expires.
    /// </summary>
    public DateTimeOffset ExpiresAtUtc { get; init; }

    /// <summary>
    /// Gets the provider that was used to establish the session.
    /// </summary>
    public AuthProviderType Provider { get; init; }

    /// <summary>
    /// Gets the tenant membership resolved for the session, when one applies.
    /// </summary>
    public AuthTenantMembership? CurrentTenant { get; init; }

    /// <summary>
    /// Gets the onboarding state stored for the session.
    /// </summary>
    public OnboardingState Onboarding { get; init; } = OnboardingState.NotRequired();

    /// <summary>
    /// Gets the host-defined payload values persisted alongside the session.
    /// </summary>
    public IDictionary<string, object?> Payload { get; init; } = new Dictionary<string, object?>();
}

