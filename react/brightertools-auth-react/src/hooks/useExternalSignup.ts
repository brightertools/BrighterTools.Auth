import { useAuth } from "./useAuth.js";
import type { ExternalSignupRequest } from "../types/api.js";

export const useExternalSignup = () => {
  const { api, transitionSession } = useAuth();
  return (request: ExternalSignupRequest) => transitionSession(
    () => api.signupWithExternalProvider(request), response => response.success ? response.data?.session : null);
};
