using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Options;
using BrighterTools.Auth.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace BrighterTools.Auth.Extensions;

/// <summary>
/// Registers reCAPTCHA Enterprise verification services.
/// </summary>
public static class ReCaptchaServiceCollectionExtensions
{
    public static IServiceCollection AddBrighterToolsReCaptchaEnterprise(
        this IServiceCollection services,
        IConfiguration configuration,
        Action<ReCaptchaEnterpriseOptions>? configure = null)
    {
        var optionsBuilder = services.AddOptions<ReCaptchaEnterpriseOptions>()
            .Bind(configuration.GetSection(ReCaptchaEnterpriseOptions.SectionName));

        if (configure is not null)
        {
            services.PostConfigure(configure);
        }

        services.AddHttpClient("BrighterTools.ReCaptchaEnterprise");
        services.TryAddSingleton<IHumanVerificationService, ReCaptchaEnterpriseVerificationService>();

        return services;
    }
}
