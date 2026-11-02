import type { InvitationListRequest, InvitationOperationResult } from "./invitations";

export interface MemberListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName?: string;
  emailConfirmed?: boolean;
  role: string;
  roleLabel?: string;
  lastLoginDate?: string | null;
  accessEnabled: boolean;
  active?: boolean;
  canChangeActive?: boolean;
  accessHelp?: string;
  isOwner?: boolean;
  isSelf?: boolean;
  canEdit?: boolean;
  canChangeRole?: boolean;
  canChangeAccess?: boolean;
  canRemove?: boolean;
  canTransferOwnership?: boolean;
}
export interface MemberListResult { items: MemberListItem[]; totalCount: number; }
export interface MemberUpdateRequest { role: string; accessEnabled: boolean; active?: boolean; }
export interface MemberServiceAdapter {
  getMemberList(request: InvitationListRequest): Promise<InvitationOperationResult<MemberListResult>>;
  getMember?(id: string): Promise<InvitationOperationResult<MemberListItem>>;
  updateMember?(id: string, request: MemberUpdateRequest): Promise<InvitationOperationResult<void>>;
  removeMember?(id: string): Promise<InvitationOperationResult<void>>;
}
export type MemberManagementView = { mode: "list" } | { mode: "edit"; memberId: string };

export const defaultMemberManagementText = {
  activeLabel: "Membership active",
  emailUnconfirmedLabel: "Email requires confirmation",
  protectedSelfMessage: "You cannot edit or remove your own membership here.",
  protectedOwnerMessage: "The workspace owner cannot be edited or removed here.",
  title: "Users", nameLabel: "Name", emailLabel: "Email", lastLoginLabel: "Last login",
  unknownLoginLabel: "Unknown", roleLabel: "Role", ownerLabel: "Owner", accessLabel: "Access enabled",
  enabledLabel: "Enabled", disabledLabel: "Disabled", actionsLabel: "Actions", editLabel: "Edit",
  editHeading: "Edit member", saveLabel: "Save", cancelLabel: "Cancel", removeLabel: "Remove member",
  transferOwnershipLabel: "Transfer ownership", searchLabel: "Search", clearLabel: "Clear",
  searchPlaceholder: "Search members by name/email", pageSizeLabel: "Members per page",
  previousLabel: "Previous", nextLabel: "Next", loadingMessage: "Loading...", emptyMessage: "No members found.",
  loadFailedMessage: "Unable to load members.", updateFailedMessage: "Unable to update member.",
  removeFailedMessage: "Unable to remove member.", updatedMessage: "Member updated.", removedMessage: "Member removed.",
  identityHelp: "Personal details are managed by the member.",
  removeConfirmation: "Remove {name} from this workspace? This does not delete their global identity.",
  confirmLabel: "Confirm", pageSummary: "Page {page} of {totalPages} ({totalCount} total)",
  actionFailedMessage: "Unable to complete this action."
};
export type MemberManagementTextOverrides = Partial<typeof defaultMemberManagementText>;
