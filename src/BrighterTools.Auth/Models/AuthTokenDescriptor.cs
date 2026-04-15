using System.Security.Claims;

namespace BrighterTools.Auth.Models;

/// <summary>
/// Represents the auth Token Descriptor.
/// </summary>
public sealed class AuthTokenDescriptor
{
    /// <summary>
    /// Gets or sets the subject.
    /// </summary>
    public string Subject { get; init; } = string.Empty;
    /// <summary>
    /// Gets or sets the expires At Utc.
    /// </summary>
    public DateTimeOffset ExpiresAtUtc { get; init; }
    /// <summary>
    /// Gets or sets the claims.
    /// </summary>
    public IReadOnlyCollection<Claim> Claims { get; init; } = [];
    /// <summary>
    /// Gets or sets the collection of properties.
    /// </summary>
    public IDictionary<string, object?> Properties { get; init; } = new Dictionary<string, object?>();
}

