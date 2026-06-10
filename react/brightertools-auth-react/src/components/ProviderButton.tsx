import type { PropsWithChildren } from "react";
import type { AuthProviderType } from "../types/auth";

export interface ProviderButtonProps extends PropsWithChildren {
  provider?: AuthProviderType;
  variant?: string;
  disabled?: boolean;
  onClick: () => void;
}

export const ProviderButton = ({ provider, variant, disabled, onClick, children }: ProviderButtonProps) => {
  const defaultVariant = provider === "Apple" ? "dark" : "outline-secondary";

  return (
    <button type="button" className={`btn btn-${variant ?? defaultVariant} w-100`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};


