namespace BrighterTools.Auth.Abstractions;

/// <summary>
/// Records security-relevant authentication events using the host application's audit strategy.
/// </summary>
public interface IUserSecurityEventRecorder
{
    /// <summary>
    /// Records a security-relevant authentication event for the supplied user.
    /// </summary>
    Task RecordAsync(string userId, string eventName, IDictionary<string, object?>? metadata = null, CancellationToken cancellationToken = default);
}

