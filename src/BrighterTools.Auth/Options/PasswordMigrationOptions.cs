namespace BrighterTools.Auth.Options;

/// <summary>
/// Configures optional legacy password migration behavior.
/// </summary>
public sealed class PasswordMigrationOptions
{
    /// <summary>
    /// Gets or sets a value indicating whether successful legacy password verification should transparently upgrade the stored hash.
    /// </summary>
    public bool TransparentLegacyUpgradeEnabled { get; set; } = false;
}

