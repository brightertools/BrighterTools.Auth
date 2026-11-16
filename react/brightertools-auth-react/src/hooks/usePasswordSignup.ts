import { useCallback } from "react";
import { useAuth } from "./useAuth.js";
import type { PasswordSignupRequest } from "../types/api.js";

export const usePasswordSignup = () => {
  const { api, transitionSession } = useAuth();
  return useCallback((request: PasswordSignupRequest) => transitionSession(() => api.signupWithPassword(request), response => response.success ? response.data?.auth?.session : null), [api, transitionSession]);
};
