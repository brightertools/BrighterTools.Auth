export const useMfa = () => {
  return {
    beginEnrollment: async <T>(operation: () => Promise<T>) => operation(),
    verifyEnrollment: async <T>(operation: () => Promise<T>) => operation(),
    challenge: async <T>(operation: () => Promise<T>) => operation()
  };
};
