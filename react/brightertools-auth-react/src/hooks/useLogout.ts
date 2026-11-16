import type { ApiEnvelope } from "../services/createAuthApi.js";
import { useAuth } from "./useAuth.js";

export const useLogout = () => {
  const { logout } = useAuth();
  return async (_refreshToken?: string): Promise<ApiEnvelope<unknown>> => { await logout(); return { success: true }; };
};
