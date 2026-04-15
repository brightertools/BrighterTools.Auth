using BrighterTools.Auth.Models;

namespace BrighterTools.Auth.Options;

/// <summary>
/// Controls which login providers are enabled for the host application.
/// </summary>
public sealed class ProviderOptions
{
    /// <summary>
    /// Gets or sets the login providers that the host application enables.
    /// </summary>
    public ISet<AuthProviderType> EnabledProviders { get; set; } = new HashSet<AuthProviderType>
    {
        AuthProviderType.Password
    };
}

