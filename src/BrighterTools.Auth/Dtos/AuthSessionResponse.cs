using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents the authenticated session payload returned to the consuming application.
/// </summary>
public sealed class AuthSessionResponse
{
    /// <summary>
    /// Gets the issued access token.
    /// </summary>
    public string AccessToken { get; init; } = string.Empty;

    /// <summary>
    /// Gets the refresh token that can be used to renew the session.
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
    /// Gets the user summary projected into the session payload.
    /// </summary>
    public AuthUserSummary User { get; init; } = new();

    /// <summary>
    /// Gets the onboarding state that applies to the session.
    /// </summary>
    public OnboardingState Onboarding { get; init; } = OnboardingState.NotRequired();

    /// <summary>
    /// Gets the tenant membership resolved for the session, when one applies.
    /// </summary>
    public AuthTenantMembership? CurrentTenant { get; init; }

    /// <summary>
    /// Gets the host-defined payload values returned alongside the session.
    /// </summary>
    public IDictionary<string, object?> Payload { get; init; } = new Dictionary<string, object?>();
}

