namespace BrighterTools.Auth.Options;

/// <summary>
/// Google reCAPTCHA Enterprise settings.
/// </summary>
public sealed class ReCaptchaEnterpriseOptions
{
    public const string SectionName = "GoogleRecaptcha";

    public bool Enabled { get; set; } = true;

    public string ProjectId { get; set; } = string.Empty;

    public string SiteKey { get; set; } = string.Empty;

    public string ApiKey { get; set; } = string.Empty;

    public double MinimumScore { get; set; } = 0.5;
}
