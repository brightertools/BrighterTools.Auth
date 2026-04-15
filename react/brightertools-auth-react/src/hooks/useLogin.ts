import { useAuth } from "./useAuth";
import type { PasswordLoginRequest } from "../types/api";

export const useLogin = () => {
  const { api, setSession } = useAuth();

  return async (request: PasswordLoginRequest) => {
    const response = await api.loginWithPassword(request);
    setSession(response.session ?? null);
    return response;
  };
};
