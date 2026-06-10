import { useAuth } from "./useAuth";
import type { ExternalSignupRequest } from "../types/api";

export const useExternalSignup = () => {
  const { api, setSession } = useAuth();

  return async (request: ExternalSignupRequest) => {
    const response = await api.signupWithExternalProvider(request);
    setSession(response.data?.session ?? null);
    return response;
  };
};
