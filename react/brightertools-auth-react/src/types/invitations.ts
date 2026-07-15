import type { ReactNode } from "react";

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired" | "unknown";

export interface InvitationOperationResult<T = undefined> {
  success: boolean;
  message?: string | null;
  messages?: string[] | null;
  data?: T;
}

export interface InvitationDetails {
  id?: string;
  guid?: string;
  tenantGuid?: string | null;
  userInvitationKey?: string;
  email: string;
  firstName: string;
  lastName: string;
  expiryDate?: string | null;
  invitedByUserFullName?: string | null;
  invitedByUserEmail?: string | null;
  accountName?: string | null;
  canChangeEmailAddress: boolean;
  isValid?: boolean;
  status: InvitationStatus;
}

export interface InvitationAcceptRequest {
  userInvitationKey: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  usingEmail: boolean;
  fields?: Record<string, unknown>;
}

export interface InvitationAcceptResponse {
  activated?: boolean;
  requiresEmailVerification?: boolean;
}

export interface InvitationConnectRequest {
  userInvitationKey: string;
}

export interface InvitationDeclineRequest {
  userInvitationKey: string;
  message?: string;
}

export interface InvitationListRequest {
  query: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface InvitationRoleOption {
  value: string;
  label: string;
  description?: string;
}

export interface InvitationListItem {
  id: string;
  guid?: string;
  userInvitationKey?: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  roleLabel?: string;
  message?: string | null;
  responseMessage?: string | null;
  status: InvitationStatus;
  invitationDate?: string | null;
  expiryDate?: string | null;
  createdDate?: string | null;
  lastUpdatedDate?: string | null;
  canChangeEmailAddress?: boolean;
  acceptedEmailAddress?: string | null;
  acceptedLoginProvider?: string | number | null;
  canResend?: boolean;
  canCancel?: boolean;
  canRemove?: boolean;
  canViewDetails?: boolean;
  canCopyLink?: boolean;
}

export interface InvitationListResult {
  items: InvitationListItem[];
  totalCount: number;
}

export interface InvitationInviteUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  message?: string;
  canChangeEmailAddress?: boolean;
  metadata?: Record<string, unknown>;
}

export interface InvitationImportPreviewRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  role?: string;
  roleLabel?: string;
  allowAnyEmail?: boolean;
}

export interface InvitationImportInvalidRow extends InvitationImportPreviewRow {
  error: string;
}

export interface InvitationImportResult {
  validationSucceeded: boolean;
  queued: boolean;
  jobId?: string | null;
  validRowCount: number;
  invalidRowCount: number;
  previewRows: InvitationImportPreviewRow[];
  invalidRows: InvitationImportInvalidRow[];
}

export interface InvitationServiceAdapter {
  getInvitationDetails(key: string): Promise<InvitationOperationResult<InvitationDetails>>;
  acceptInvitation(request: InvitationAcceptRequest): Promise<InvitationOperationResult<InvitationAcceptResponse>>;
  connectInvitation(request: InvitationConnectRequest): Promise<InvitationOperationResult<void>>;
  declineInvitation(request: InvitationDeclineRequest): Promise<InvitationOperationResult<void>>;
  getInvitationList(request: InvitationListRequest): Promise<InvitationOperationResult<InvitationListResult>>;
  inviteUser(request: InvitationInviteUserRequest): Promise<InvitationOperationResult<void>>;
  importInvitations(file: File, message?: string): Promise<InvitationOperationResult<InvitationImportResult>>;
  getInvitation?(id: string): Promise<InvitationOperationResult<InvitationListItem>>;
  resendInvitation?(id: string): Promise<InvitationOperationResult<void>>;
  cancelInvitation?(id: string): Promise<InvitationOperationResult<void>>;
  removeInvitation?(id: string): Promise<InvitationOperationResult<void>>;
  buildInvitationUrl?(item: InvitationListItem): string;
}

export interface InvitationAcceptanceClassNames {
  container?: string;
  card?: string;
  body?: string;
  infoAlert?: string;
  currentAccountCard?: string;
  existingAccountCard?: string;
  createAccountCard?: string;
  declineCard?: string;
}

export interface InvitationManagementClassNames {
  container?: string;
  header?: string;
  body?: string;
  listCard?: string;
  inviteCard?: string;
  importCard?: string;
}

export interface InvitationCreateAccountExtensionContext {
  email: string;
  canChangeEmailAddress: boolean;
  clearFeedback: () => void;
}

export interface InvitationCreateAccountExtensionProps {
  content?: ReactNode | ((context: InvitationCreateAccountExtensionContext) => ReactNode);
  validate?: () => string[];
  getFields?: () => Record<string, unknown>;
}
