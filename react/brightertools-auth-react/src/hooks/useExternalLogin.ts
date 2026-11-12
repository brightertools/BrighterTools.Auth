import { useAuth } from "./useAuth.js";
import type { ExternalLoginRequest } from "../types/api.js";

export const useExternalLogin = () => {
  const { api, setSession } = useAuth();

  return async (request: ExternalLoginRequest) => {
    const response = await api.loginWithExternalProvider(request);
    setSession(response.data?.session ?? null);
    return response;
  };
};
