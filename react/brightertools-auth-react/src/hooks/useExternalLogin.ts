import { useAuth } from "./useAuth.js";
import type { ExternalLoginRequest } from "../types/api.js";

export const useExternalLogin = () => {
  const { api, transitionSession } = useAuth();
  return (request: ExternalLoginRequest) => transitionSession(
    () => api.loginWithExternalProvider(request), response => response.success ? response.data?.session : null);
};
