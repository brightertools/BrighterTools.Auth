import { useId, useState } from "react";

export interface PasswordFieldProps {
  id?: string;
  label?: string;
  value: string;
  className?: string;
  inputClassName?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  if (hidden) {
    return (
      <svg aria-hidden="true" focusable="false" width="1em" height="1em" viewBox="0 0 640 512" fill="currentColor">
        <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-31.7 71.7-73.2 93.1-121.5 3.3-7.6 3.3-16.3 0-23.8C568.3 127.6 454.9 48 320 48c-52.3 0-101.8 12-145.9 33.4L38.8 5.1zM223.1 118.6C252.7 105 285.5 97.5 320 97.5c109.5 0 205 62.9 251.1 158.5-18.6 38.5-47.4 72-83.5 97.3l-48.8-38.2c5.8-18.1 5.2-38.5-2.7-57.5-13.5-32.5-44.3-53.5-77.7-56.3l-135.3-82.7zM316.7 191.7l35.9 28.1c-10.8 1.5-21.1 5.8-29.7 12.8-10.2 8.4-17.1 19.8-19.8 32.4l-35.9-28.1c2.6-12.6 9.5-24 19.8-32.4 8.7-7.1 19-11.4 29.7-12.8zM116.1 142.8C76.5 174.5 44.4 216 23 264.3c-3.3 7.6-3.3 16.3 0 23.8C73.7 401.9 187.1 481.5 322 481.5c52.3 0 101.8-12 145.9-33.4l-48.3-37.9c-29.6 13.6-62.4 21.1-97.6 21.1-109.5 0-205-62.9-251.1-158.5 18.6-38.5 47.4-72 83.5-97.3l-38.3-32.7z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" focusable="false" width="1em" height="1em" viewBox="0 0 576 512" fill="currentColor">
      <path d="M572.5 241.4C518.3 135.6 410.9 64 288 64S57.7 135.6 3.5 241.4a32.4 32.4 0 0 0 0 29.2C57.7 376.4 165.1 448 288 448s230.3-71.6 284.5-177.4a32.4 32.4 0 0 0 0-29.2zM288 400a144 144 0 1 1 0-288 144 144 0 0 1 0 288zm0-240a96 96 0 1 0 0 192 96 96 0 0 0 0-192z" />
    </svg>
  );
}

export function PasswordField({ id, label, value, className = "", inputClassName = "form-control", autoComplete, required, disabled, placeholder, onChange }: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      {label && <label className="form-label" htmlFor={inputId}>{label}</label>}
      <div className="input-group">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className={inputClassName}
          value={value}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          onChange={event => onChange(event.target.value)}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={disabled}
          onClick={() => setVisible(current => !current)}
        >
          <EyeIcon hidden={visible} />
        </button>
      </div>
    </div>
  );
}
