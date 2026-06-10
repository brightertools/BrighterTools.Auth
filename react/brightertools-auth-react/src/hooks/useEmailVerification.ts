import { useAuth } from "./useAuth";

export const useEmailVerification = () => {
  const { api } = useAuth();

  return {
    confirmEmailVerification: (token: string) => api.confirmEmailVerification(token),
    confirmLoginEmailChange: (token: string) => api.confirmLoginEmailChange(token)
  };
};
