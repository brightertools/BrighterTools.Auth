using System.Net.Http.Json;
using System.Text.Json.Serialization;
using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace BrighterTools.Auth.Services;

/// <summary>
/// Google reCAPTCHA Enterprise verifier.
/// </summary>
public sealed class ReCaptchaEnterpriseVerificationService : IHumanVerificationService
{
    private const string HttpClientName = "BrighterTools.ReCaptchaEnterprise";

    private readonly IOptions<ReCaptchaEnterpriseOptions> _options;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ReCaptchaEnterpriseVerificationService> _logger;

    public ReCaptchaEnterpriseVerificationService(
        IOptions<ReCaptchaEnterpriseOptions> options,
        IHttpClientFactory httpClientFactory,
        ILogger<ReCaptchaEnterpriseVerificationService> logger)
    {
        _options = options;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<bool> VerifyAsync(string? token, string action, CancellationToken cancellationToken = default)
    {
        var config = _options.Value;

        if (!config.Enabled)
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(config.ProjectId) ||
            string.IsNullOrWhiteSpace(config.SiteKey) ||
            string.IsNullOrWhiteSpace(config.ApiKey))
        {
            _logger.LogWarning("Google reCAPTCHA configuration missing ProjectId, SiteKey, or ApiKey");
            return false;
        }

        if (string.IsNullOrWhiteSpace(token))
        {
            _logger.LogWarning("Missing reCAPTCHA token for action {Action}", action);
            return false;
        }

        try
        {
            var client = _httpClientFactory.CreateClient(HttpClientName);
            var url = $"https://recaptchaenterprise.googleapis.com/v1/projects/{config.ProjectId}/assessments?key={config.ApiKey}";

            var payload = new ReCaptchaEnterpriseRequest
            {
                Event = new ReCaptchaEnterpriseEvent
                {
                    Token = token,
                    SiteKey = config.SiteKey,
                    ExpectedAction = action
                }
            };

            using var response = await client.PostAsJsonAsync(url, payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("reCAPTCHA Enterprise verification failed with HTTP status {StatusCode}", response.StatusCode);
                return false;
            }

            var verification = await response.Content.ReadFromJsonAsync<ReCaptchaEnterpriseResponse>(cancellationToken: cancellationToken);
            if (verification is null)
            {
                _logger.LogWarning("Empty or invalid reCAPTCHA Enterprise response");
                return false;
            }

            if (verification.TokenProperties?.Valid != true)
            {
                _logger.LogWarning("Invalid reCAPTCHA token: {Reason}", verification.TokenProperties?.InvalidReason ?? "Unknown");
                return false;
            }

            if (!string.Equals(verification.TokenProperties.Action, action, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Unexpected reCAPTCHA action: expected {Expected}, got {Actual}",
                    action,
                    verification.TokenProperties.Action);
                return false;
            }

            var score = verification.RiskAnalysis?.Score ?? 0.0;
            _logger.LogTrace("reCAPTCHA score: {Score}, threshold: {Threshold}", score, config.MinimumScore);

            return score >= config.MinimumScore;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying reCAPTCHA Enterprise token for action {Action}", action);
            return false;
        }
    }

    private sealed class ReCaptchaEnterpriseRequest
    {
        [JsonPropertyName("event")]
        public ReCaptchaEnterpriseEvent Event { get; set; } = new();
    }

    private sealed class ReCaptchaEnterpriseEvent
    {
        [JsonPropertyName("token")]
        public string Token { get; set; } = string.Empty;

        [JsonPropertyName("siteKey")]
        public string SiteKey { get; set; } = string.Empty;

        [JsonPropertyName("expectedAction")]
        public string ExpectedAction { get; set; } = string.Empty;
    }

    private sealed class ReCaptchaEnterpriseResponse
    {
        [JsonPropertyName("tokenProperties")]
        public ReCaptchaEnterpriseTokenProperties? TokenProperties { get; set; }

        [JsonPropertyName("riskAnalysis")]
        public ReCaptchaEnterpriseRiskAnalysis? RiskAnalysis { get; set; }
    }

    private sealed class ReCaptchaEnterpriseTokenProperties
    {
        [JsonPropertyName("valid")]
        public bool Valid { get; set; }

        [JsonPropertyName("action")]
        public string? Action { get; set; }

        [JsonPropertyName("invalidReason")]
        public string? InvalidReason { get; set; }
    }

    private sealed class ReCaptchaEnterpriseRiskAnalysis
    {
        [JsonPropertyName("score")]
        public double Score { get; set; }
    }
}
