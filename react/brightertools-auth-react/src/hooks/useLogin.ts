import { useAuth } from "./useAuth.js";
import type { PasswordLoginRequest } from "../types/api.js";

export const useLogin = () => {
  const { api, setSession } = useAuth();

  return async (request: PasswordLoginRequest) => {
    const response = await api.loginWithPassword(request);
    setSession(response.data?.session ?? null);
    return response;
  };
};
