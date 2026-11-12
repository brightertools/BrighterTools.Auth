import { useCallback } from "react";
import { useAuth } from "./useAuth.js";
import type { PasswordSignupRequest } from "../types/api.js";

export const usePasswordSignup = () => {
  const { api } = useAuth();
  return useCallback((request: PasswordSignupRequest) => api.signupWithPassword(request), [api]);
};
