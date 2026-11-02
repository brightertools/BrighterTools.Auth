import type { ComponentType } from "react";
import { InvitationManagementPanel, MemberManagementPanel, UserAdministrationPanel } from "../dist/index";
import type { InvitationManagementPanelProps, MemberManagementPanelProps, UserAdministrationPanelProps,
  InvitationServiceAdapter, MemberServiceAdapter } from "../dist/index";

const legacy: InvitationManagementPanelProps["adapter"] = {
  getInvitationList: async () => ({ success: true, data: { items: [], totalCount: 0 } }),
  inviteUser: async () => ({ success: true }),
  importInvitations: async () => ({ success: true, data: { validationSucceeded: true, queued: true, validRowCount: 1, invalidRowCount: 0, previewRows: [], invalidRows: [] } })
};
const members: MemberServiceAdapter = {
  getMemberList: async () => ({ success: true, data: { items: [], totalCount: 0 } }),
  updateMember: async (id, request) => ({ success: !!id && !!request.role }),
  removeMember: async id => ({ success: !!id })
};
const modern: InvitationManagementPanelProps["adapter"] = {
  ...legacy,
  editAndResendInvitation: async (id, request) => ({ success: !!id && !!request.email }),
  getInvitationLink: async id => ({ success: true, data: { url: id } }),
  archiveInvitation: async id => ({ success: !!id }),
  downloadInvitationTemplate: async () => {},
  previewInvitationImport: async () => ({ success: true, data: { previewId: "opaque", validationSucceeded: true, queued: false, validRowCount: 1, invalidRowCount: 0, previewRows: [], invalidRows: [] } }),
  commitInvitationImport: async (preview, file, message) => ({ success: !!file && message !== null, data: { ...preview, queued: true } })
};
const memberComponent: ComponentType<MemberManagementPanelProps> = MemberManagementPanel;
const inviteComponent: ComponentType<InvitationManagementPanelProps> = InvitationManagementPanel;
const combinedComponent: ComponentType<UserAdministrationPanelProps> = UserAdministrationPanel;
const optionalCallback: InvitationServiceAdapter["getInvitationLink"] = modern.getInvitationLink;
void memberComponent; void inviteComponent; void combinedComponent; void optionalCallback;
export const consumer = <>
  <InvitationManagementPanel adapter={legacy} />
  <MemberManagementPanel adapter={members} icons={{enabled:<span>Enabled</span>,disabled:<span>Disabled</span>}} toolbarContent={<button>Host transfer</button>}
    onTransferOwnership={async member => { void member.id; }} renderMemberActions={(member, refresh) => <button onClick={() => void refresh()}>{member.email}</button>} />
  <UserAdministrationPanel scopeKey="opaque-tenant" members={{adapter:members}} invitations={{adapter:modern,icons:{send:<span>Send</span>,formCancel:<span>Cancel</span>},view:{mode:"resend",invitationId:"opaque-invitation"}}} />
</>;

export { passwordWorkflows } from './auth-ui.consumer';
