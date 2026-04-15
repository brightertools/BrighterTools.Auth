export const useSignup = () => {
  return async <T>(signup: () => Promise<T>) => signup();
};
