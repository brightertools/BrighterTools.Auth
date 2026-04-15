import type { PropsWithChildren } from "react";

export interface ProviderButtonProps extends PropsWithChildren {
  onClick: () => void;
}

export const ProviderButton = ({ onClick, children }: ProviderButtonProps) => (
  <button type="button" className="btn btn-outline-secondary w-100" onClick={onClick}>
    {children}
  </button>
);
