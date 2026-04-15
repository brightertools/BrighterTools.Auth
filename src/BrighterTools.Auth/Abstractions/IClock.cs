namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Provides the current UTC time for authentication workflows and deterministic tests.
/// </summary>
public interface IClock
{
    /// <summary>
    /// Gets the current UTC timestamp.
    /// </summary>
    DateTimeOffset UtcNow { get; }
}

