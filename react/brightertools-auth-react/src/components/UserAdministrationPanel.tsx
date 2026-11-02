import { useState } from "react";
import type { ReactNode } from "react";
import { MemberManagementPanel } from "./MemberManagementPanel";
import type { MemberManagementPanelProps } from "./MemberManagementPanel";
import { InvitationManagementPanel } from "./InvitationManagementPanel";
import type { InvitationManagementPanelProps } from "./InvitationManagementPanel";

export interface UserAdministrationPanelProps {
  scopeKey: string;
  members: MemberManagementPanelProps;
  invitations: InvitationManagementPanelProps;
  className?: string;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
}
export function UserAdministrationPanel(props: UserAdministrationPanelProps) {
  return <UserAdministrationContent key={props.scopeKey} {...props} />;
}
function UserAdministrationContent({ scopeKey, members, invitations, className, headerContent, footerContent }: UserAdministrationPanelProps) {
  const [memberFocused, setMemberFocused] = useState(false);
  const [invitationFocused, setInvitationFocused] = useState(false);
  const memberActive = members.view ? members.view.mode !== "list" : memberFocused;
  const invitationActive = invitations.view ? invitations.view.mode !== "list" : invitationFocused;
  return <div className={["bt-user-administration d-grid gap-4", className].filter(Boolean).join(" ")} style={{gridTemplateColumns:"minmax(0, 1fr)"}}>
    {headerContent}
    <div hidden={invitationActive} style={{minWidth:0}}><MemberManagementPanel {...members} scopeKey={members.scopeKey ?? scopeKey} onViewChange={view => {
      setMemberFocused(view.mode !== "list"); members.onViewChange?.(view);
    }} /></div>
    <div hidden={memberActive} style={{minWidth:0}}><InvitationManagementPanel presentation="workspace" {...invitations} scopeKey={scopeKey} onViewChange={view => {
      setInvitationFocused(view.mode !== "list"); invitations.onViewChange?.(view);
    }} /></div>
    {footerContent}
  </div>;
}
