import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth.js";
import type { BeginSignupEmailVerificationRequest, VerifySignupEmailVerificationCodeRequest } from "../types/api.js";

export const useSignupEmailVerification = () => {
  const { api } = useAuth();

  const begin = useCallback((request: BeginSignupEmailVerificationRequest) => api.beginSignupEmailVerification(request), [api]);
  const verifyCode = useCallback((request: VerifySignupEmailVerificationCodeRequest) => api.verifySignupEmailVerificationCode(request), [api]);

  return useMemo(() => ({ begin, verifyCode }), [begin, verifyCode]);
};
