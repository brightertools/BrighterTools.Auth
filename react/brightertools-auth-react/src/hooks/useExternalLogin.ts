import { useAuth } from "./useAuth";
import type { ExternalLoginRequest } from "../types/api";

export const useExternalLogin = () => {
  const { api, setSession } = useAuth();

  return async (request: ExternalLoginRequest) => {
    const response = await api.loginWithExternalProvider(request);
    setSession(response.session ?? null);
    return response;
  };
};
