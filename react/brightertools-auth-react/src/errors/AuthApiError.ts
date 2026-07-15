export class AuthApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
  }
}

export const toAuthApiError = (message: string, code?: string) => new AuthApiError(message, code);