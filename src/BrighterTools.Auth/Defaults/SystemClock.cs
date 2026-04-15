using BrighterTools.Auth.Abstractions;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides a clock implementation based on the current UTC system time.
/// </summary>
public sealed class SystemClock : IClock
{
    /// <summary>
    /// Gets the current UTC timestamp.
    /// </summary>
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}

