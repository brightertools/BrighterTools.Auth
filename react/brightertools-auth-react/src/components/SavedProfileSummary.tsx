import type { ReactNode } from "react";

/** Hosts own completeness and editing policy; shared presentation avoids collecting saved identity twice. */
export function SavedProfileSummary({ children, onEdit, editLabel = "Edit profile details", className }: {
  children: ReactNode; onEdit: () => void; editLabel?: string; className?: string;
}) {
  return <div className={className}><p>{children}</p><button type="button" className="btn btn-link" onClick={onEdit}>{editLabel}</button></div>;
}
