using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Dtos;

/// <summary>
/// Represents a request to unlink an external login provider from the current account.
/// </summary>
public sealed class UnlinkExternalProviderRequest
{
    /// <summary>
    /// Gets the provider to unlink.
    /// </summary>
    public AuthProviderType Provider { get; init; }

    /// <summary>
    /// Gets the provider subject identifier to unlink.
    /// </summary>
    public string ProviderSubject { get; init; } = string.Empty;
}
