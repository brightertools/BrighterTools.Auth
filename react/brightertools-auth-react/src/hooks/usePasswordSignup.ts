import { useCallback } from "react";
import { useAuth } from "./useAuth";
import type { PasswordSignupRequest } from "../types/api";

export const usePasswordSignup = () => {
  const { api } = useAuth();
  return useCallback((request: PasswordSignupRequest) => api.signupWithPassword(request), [api]);
};
