import { useAuth } from "./useAuth";
import type { CompleteOnboardingRequest, TenantScopedRequest } from "../types/api";

export const useOnboarding = () => {
  const { api } = useAuth();

  return {
    getStatus: (request?: TenantScopedRequest) => api.onboardingStatus(request),
    complete: (request: CompleteOnboardingRequest) => api.completeOnboarding(request)
  };
};