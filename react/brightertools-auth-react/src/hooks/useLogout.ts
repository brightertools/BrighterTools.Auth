import { useAuth } from "./useAuth";

export const useLogout = () => {
  const { api, setSession } = useAuth();

  return async (refreshToken?: string) => {
    const response = await api.logout(refreshToken ? { refreshToken } : undefined);
    setSession(null);
    return response;
  };
};
