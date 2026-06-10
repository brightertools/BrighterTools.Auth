export type AuthProviderButtonVariant = "apple" | "email";

export interface AuthProviderButtonProps {
  variant: AuthProviderButtonVariant;
  label: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function AppleIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="1em" height="1em" viewBox="0 0 384 512" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.1 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function AtIcon() {
  return (
    <svg aria-hidden="true" focusable="false" width="1em" height="1em" viewBox="0 0 512 512" fill="currentColor">
      <path d="M256 8C119 8 8 119 8 256s111 248 248 248c48.2 0 95.3-14.1 135.4-40.2 11.1-7.2 14.2-22.1 6.9-33.2s-22.1-14.2-33.2-6.9C332.8 444.7 294.8 456 256 456 145.5 456 56 366.5 56 256S145.5 56 256 56s200 89.5 200 200v24c0 22.1-17.9 40-40 40s-40-17.9-40-40v-24c0-66.3-53.7-120-120-120s-120 53.7-120 120 53.7 120 120 120c35.8 0 67.9-15.7 89.9-40.6 18.2 20.1 44.5 32.6 74.1 32.6 48.6 0 88-39.4 88-88v-24C508 119 397 8 260 8h-4zm0 320c-39.8 0-72-32.2-72-72s32.2-72 72-72 72 32.2 72 72-32.2 72-72 72z" />
    </svg>
  );
}

export function AuthProviderButton({ variant, label, busyLabel, busy, disabled, onClick }: AuthProviderButtonProps) {
  const isApple = variant === "apple";
  const colors = isApple
    ? { background: "#050505", border: "#050505", color: "#ffffff", iconColor: "#ffffff" }
    : { background: "#e5e7eb", border: "#cbd5e1", color: "#1f2937", iconColor: "#374151" };

  return (
    <div className="bt-auth-provider-button-shell" style={{ display: "flex", justifyContent: "center", width: "100%" }}>
      <button
        type="button"
        className={`btn bt-auth-provider-button bt-auth-provider-button-${variant}`}
        disabled={disabled || busy}
        onClick={onClick}
        style={{
          width: "100%",
          maxWidth: 400,
          minHeight: 44,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          borderRadius: 4,
          fontWeight: 500,
          backgroundColor: colors.background,
          borderColor: colors.border,
          color: colors.color
        }}
      >
        <span style={{ color: colors.iconColor, display: "inline-flex", fontSize: 18, lineHeight: 1 }}>
          {isApple ? <AppleIcon /> : <AtIcon />}
        </span>
        <span>{busy && busyLabel ? busyLabel : label}</span>
      </button>
    </div>
  );
}
