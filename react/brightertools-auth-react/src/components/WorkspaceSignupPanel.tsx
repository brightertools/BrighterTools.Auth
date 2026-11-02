import { useId, useState } from "react";
import { SignupPanel, type SignupPanelProps } from "./SignupPanel";

export interface SignupDetailField {
  name: string;
  label: string;
  type?: "text" | "tel" | "checkbox";
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
}
export type SignupDetails = Record<string, string | boolean>;
export interface WorkspaceSignupPanelProps extends Omit<SignupPanelProps, "fields"> {
  detailFields: SignupDetailField[];
  initialDetails?: SignupDetails;
  continueLabel?: string;
  editDetailsLabel?: string;
  mapDetails: (details: SignupDetails) => Pick<SignupPanelProps, "fields" | "consentToHelpEmails" | "consentToMarketingEmails">;
}

/** Host configuration owns fields and policy; shared UI owns validation and progression. */
export function WorkspaceSignupPanel({
  detailFields, initialDetails = {}, mapDetails, continueLabel = "Continue",
  editDetailsLabel = "Edit account details", ...signupProps
}: WorkspaceSignupPanelProps) {
  const id = useId();
  const [details, setDetails] = useState<SignupDetails>(initialDetails);
  const [ready, setReady] = useState(false);
  return <div className="bt-auth-workspace-signup">
    {!ready ? <form onSubmit={event => {
      event.preventDefault();
      const valid = detailFields.every(field => !field.required || (field.type === "checkbox" ? details[field.name] === true : String(details[field.name] ?? "").trim().length > 0));
      if (!valid) return;
      setReady(true);
    }}>
      {detailFields.map(field => field.type === "checkbox"
        ? <div className="form-check mb-3" key={field.name}>
          <input id={`${id}-${field.name}`} type="checkbox" className="form-check-input" required={field.required} checked={details[field.name] === true}
            onChange={event => setDetails(value => ({ ...value, [field.name]: event.target.checked }))} />
          <label className="form-check-label" htmlFor={`${id}-${field.name}`}>{field.label}</label>
        </div>
        : <div className="mb-3" key={field.name}>
          <label className="form-label" htmlFor={`${id}-${field.name}`}>{field.label}</label>
          <input id={`${id}-${field.name}`} type={field.type ?? "text"} autoComplete={field.autoComplete} className="form-control" required={field.required}
            maxLength={field.maxLength} value={String(details[field.name] ?? "")} onChange={event => setDetails(value => ({ ...value, [field.name]: event.target.value }))} />
        </div>)}
      <button className="btn btn-primary" type="submit">{continueLabel}</button>
    </form> : <>
      <button className="btn btn-link px-0 mb-3" type="button" onClick={() => setReady(false)}>{editDetailsLabel}</button>
      <SignupPanel {...signupProps} {...mapDetails(details)} />
    </>}
  </div>;
}
