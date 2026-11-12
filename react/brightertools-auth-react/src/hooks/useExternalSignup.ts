import { useAuth } from "./useAuth.js";
import type { ExternalSignupRequest } from "../types/api.js";

export const useExternalSignup = () => {
  const { api, setSession } = useAuth();

  return async (request: ExternalSignupRequest) => {
    const response = await api.signupWithExternalProvider(request);
    setSession(response.data?.session ?? null);
    return response;
  };
};
