using BrighterTools.Auth.Dtos;

namespace BrighterTools.Auth.Models;

/// <summary>
/// Carries a validated external identity together with the host sign-up request that authorized provisioning.
/// </summary>
public sealed class ExternalSignupContext
{
    /// <summary>
    /// Gets the sign-up request submitted by the client.
    /// </summary>
    public ExternalSignupRequest Request { get; init; } = new();

    /// <summary>
    /// Gets the validated external identity.
    /// </summary>
    public ExternalIdentity Identity { get; init; } = new();

    /// <summary>
    /// Gets a value indicating whether the request came from an explicit sign-up flow.
    /// </summary>
    public bool IsExplicitSignup { get; init; } = true;
}
