using BrighterTools.Auth.Abstractions;

namespace BrighterTools.Auth.Defaults;

/// <summary>
/// Provides a no-op implementation of security Event Recorder.
/// </summary>
public sealed class NoOpSecurityEventRecorder : IUserSecurityEventRecorder
{
    /// <summary>
    /// Performs the record operation.
    /// </summary>
    public Task RecordAsync(string userId, string eventName, IDictionary<string, object?>? metadata = null, CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}

