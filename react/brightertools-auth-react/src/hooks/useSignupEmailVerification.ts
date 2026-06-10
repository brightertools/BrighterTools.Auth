import { useCallback, useMemo } from "react";
import { useAuth } from "./useAuth";
import type { BeginSignupEmailVerificationRequest, VerifySignupEmailVerificationCodeRequest } from "../types/api";

export const useSignupEmailVerification = () => {
  const { api } = useAuth();

  const begin = useCallback((request: BeginSignupEmailVerificationRequest) => api.beginSignupEmailVerification(request), [api]);
  const verifyCode = useCallback((request: VerifySignupEmailVerificationCodeRequest) => api.verifySignupEmailVerificationCode(request), [api]);

  return useMemo(() => ({ begin, verifyCode }), [begin, verifyCode]);
};
