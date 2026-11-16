import { useAuth } from "./useAuth.js";
import type { PasswordLoginRequest } from "../types/api.js";

export const useLogin = () => {
  const { api, transitionSession } = useAuth();
  return (request: PasswordLoginRequest) => transitionSession(
    () => api.loginWithPassword(request), response => response.success ? response.data?.session : null);
};
