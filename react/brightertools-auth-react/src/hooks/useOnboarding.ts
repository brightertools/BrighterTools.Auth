import { useAuth } from "./useAuth.js";
import type { CompleteOnboardingRequest, TenantScopedRequest } from "../types/api.js";

export const useOnboarding = () => {
  const { api } = useAuth();

  return {
    getStatus: (request?: TenantScopedRequest) => api.onboardingStatus(request),
    complete: (request: CompleteOnboardingRequest) => api.completeOnboarding(request)
  };
};

