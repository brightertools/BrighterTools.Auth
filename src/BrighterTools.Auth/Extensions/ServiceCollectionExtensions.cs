using BrighterTools.Auth.Abstractions;
using BrighterTools.Auth.Defaults;
using BrighterTools.Auth.Options;
using BrighterTools.Auth.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;

namespace BrighterTools.Auth.Extensions;

/// <summary>
/// Provides extension methods for registering BrighterTools.Auth services.
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers the core BrighterTools.Auth services and fail-closed default implementations.
    /// </summary>
    public static IServiceCollection AddBrighterToolsAuthCore(this IServiceCollection services, IConfiguration? configuration = null, Action<BrighterToolsAuthOptions>? configure = null)
    {
        var optionsBuilder = services.AddOptions<BrighterToolsAuthOptions>();

        if (configuration is not null)
        {
            optionsBuilder.Bind(configuration.GetSection(BrighterToolsAuthOptions.SectionName));
        }

        if (configure is not null)
        {
            services.PostConfigure(configure);
        }

        services.TryAddEnumerable(ServiceDescriptor.Singleton<IValidateOptions<BrighterToolsAuthOptions>, BrighterToolsAuthOptionsValidator>());
        optionsBuilder.ValidateOnStart();

        services.TryAddSingleton<IClock, SystemClock>();
        services.TryAddSingleton<ILegacyPasswordVerifier, NoOpLegacyPasswordVerifier>();
        services.TryAddSingleton<IPasswordRehashPolicy, DefaultPasswordRehashPolicy>();
        services.TryAddSingleton<IUserLoginProviderPolicy, EnabledProvidersUserLoginProviderPolicy>();
        services.TryAddSingleton<IExternalUserProvisioningPolicy, DenyExternalUserProvisioningPolicy>();
        services.TryAddSingleton<IUserSecurityEventRecorder, NoOpSecurityEventRecorder>();
        services.TryAddSingleton<IAuthSessionStore, NullAuthSessionStore>();
        services.TryAddSingleton<IEmailWorkflowService, NullEmailWorkflowService>();
        services.TryAddSingleton<IRegistrationWorkflowService, UnsupportedRegistrationWorkflowService>();
        services.TryAddSingleton<IMfaSecretStore, UnsupportedMfaSecretStore>();
        services.TryAddSingleton<IMfaChallengeService, UnsupportedMfaChallengeService>();
        services.TryAddSingleton<IRecoveryCodeService, UnsupportedRecoveryCodeService>();
        services.TryAddSingleton<IOnboardingStateEvaluator, DisabledOnboardingStateEvaluator>();
        services.TryAddSingleton<IOnboardingCompletionService, UnsupportedOnboardingCompletionService>();
        services.TryAddScoped<IAuthOrchestrator, DefaultAuthOrchestrator>();

        return services;
    }
}

