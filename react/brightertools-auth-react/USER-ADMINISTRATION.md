# Frozen shared user-administration contracts

All exports are additive at the package root. Existing invitation adapters and tabs remain valid. No host Bootstrap, icon library or authentication engine is bundled.

## Members

MemberListItem: id, firstName, lastName, email, role (strings), accessEnabled (boolean); optional roleLabel, lastLoginDate (string|null), isOwner, isSelf, canEdit, canChangeRole, canChangeAccess, canRemove, canTransferOwnership (booleans). All IDs remain opaque strings. Unknown last login stays unknown.

MemberServiceAdapter:
- getMemberList(request: InvitationListRequest): Promise<InvitationOperationResult<MemberListResult>>; MemberListResult = { items: MemberListItem[]; totalCount: number }.
- getMember?(id: string): Promise<InvitationOperationResult<MemberListItem>>.
- updateMember?(id: string, request: { role: string; accessEnabled: boolean }): Promise<InvitationOperationResult<void>>.
- removeMember?(id: string): Promise<InvitationOperationResult<void>>.

MemberManagementPanelProps: adapter (required); scopeKey?: string; roleOptions?: InvitationRoleOption[]; textOverrides?: MemberManagementTextOverrides; className?: string; sectionLabel?, helpContent?, toolbarContent?: ReactNode; pageSizeOptions?: number[]; view?: MemberManagementView; onViewChange?(view): void; onTransferOwnership?(member: MemberListItem): void | Promise<void>; renderMemberActions?(member: MemberListItem, refresh: () => Promise<void>): ReactNode.
MemberManagementView = {mode:'list'} | {mode:'edit';memberId:string}.
Owner/self edits and removal are blocked. Other edit actions require canEdit; canChangeRole/canChangeAccess may explicitly disable individual fields. Ownership transfer remains an explicit canTransferOwnership + host callback; toolbarContent/renderMemberActions allow the host's existing protected workflow.

## Invitations

InvitationServiceAdapter adds optional:
- editAndResendInvitation(id, request: InvitationInviteUserRequest): Promise<InvitationOperationResult<void>>.
- getInvitationLink(id): Promise<InvitationOperationResult<{url:string}>>. Explicit reveal/copy only, no persistence or fallback to credential regeneration.
- archiveInvitation(id): Promise<InvitationOperationResult<void>>. InvitationListItem adds canArchive?: boolean. Completed history only, membership unaffected.
- downloadInvitationTemplate(): Promise<void>. Host owns file format/name/download.
- previewInvitationImport(file: File, message?: string): Promise<InvitationOperationResult<InvitationImportPreview>>.
- commitInvitationImport(preview: InvitationImportPreview, file: File, message?: string): Promise<InvitationOperationResult<InvitationImportResult>>.
InvitationImportPreview extends InvitationImportResult with previewId?: string. Preview MUST be side-effect-free and queued:false. Both preview and commit must be supplied to enable two-stage flow. Legacy importInvitations remains supported on explicit Import and Send only; a MyRipple adapter may instead provide side-effect-free local preview and delegate combined server validation/import to commit.

InvitationManagementPanelProps additionally accepts scopeKey?: string, view?: InvitationManagementView, onViewChange?(view): void, expiryHelpContent?: ReactNode, importAccept?: string. View = {mode:'list'|'invite'|'import'} | {mode:'resend';invitationId:string}. Existing props preserved; new text keys extend invitationManagement/import text overrides.

## Composition

UserAdministrationPanelProps = { scopeKey: string; members: MemberManagementPanelProps; invitations: InvitationManagementPanelProps; className?: string; headerContent?: ReactNode; footerContent?: ReactNode }.
Shows both cards in list mode, hides the other card while a focused form is open without unmounting it. Changes to scopeKey remount both cards, clearing drafts, protected URLs and late async responses. Standalone panels also support scopeKey.

Hosts own server authorization, scopes, quota/transfer flows, expiry, link validity, import retries, endpoint translation and localization. Missing callbacks deliberately hide unsupported capabilities. Controlled views require onViewChange and getMember/getInvitation for deep-linked detail loading. Adapters should be stable per scope; list loading does not depend on adapter identity.

## Additive active/access separation (agreed with MediaMarkup adapter)

MemberListItem additionally has active?: boolean, canChangeActive?: boolean, accessHelp?: string. MemberUpdateRequest additionally has active?: boolean. A separate activation checkbox is shown only when active is supplied, disabled when canChangeActive===false. textOverrides.activeLabel labels it. accessEnabled is workspace web access, never global identity login eligibility; accessHelp carries protected invitation-activation guidance.

## Verification commands

Run npm run build and npm test for the React 18 baseline. Run node verification/check-declarations.mjs for the built public declarations under local React 18 types. Pass an installed consumer directory as its argument to check React 19 declarations. For runtime verification, set AUTH_REACT_CONSUMER_ROOT to an installed React 19 host directory, then run npm test -- --config verification/react19.config.ts. The harness only reads host dependencies; no host files or dependencies are changed. All adapters are mocked; no email, publication, imports or real invitation mutations occur.

Both import callbacks must be present together; a partial two-stage adapter fails closed rather than falling back to legacy sending. Legacy-only adapters still run their combined validation/import when the administrator explicitly selects Import and Send.

MemberManagementTextOverrides is a flat label/message map exported with defaultMemberManagementText. New invitation labels participate in existing AuthUiTextOverrides invitationManagement/invitationImport localization. Hosts still own Bootstrap and optional styles/invitations.css; Bootstrap card/table/form utility classes work without that stylesheet.

## Parity additions for host alignment

InvitationListItem.linkUnavailableMessage?: string supplies localized no-copy guidance when canCopyLink is false. Legacy buildInvitationUrl URLs render inline only for pending/unexpired eligible rows; getInvitationLink always keeps links behind explicit reveal/copy and suppresses legacy rendering. Decline responses render inline. Templates are downloadable on overview and import. Import tables include role and Allow Any Email; invalid rows have a complete error summary plus five-row table preview.

MemberListItem adds fullName?: string and emailConfirmed?: boolean (false shows localized emailUnconfirmedLabel adjacent to email). MemberManagementPanelProps.icons?: Partial<Record<MemberManagementAction, ReactNode>>, actions edit/remove/transferOwnership/save/cancel. InvitationManagementPanelProps.icons?: Partial<Record<InvitationManagementAction, ReactNode>>, actions invite/import/downloadTemplate/copyLink/resend/cancel/remove/archive/details/showLink. Icons are decorative alongside accessible text; hosts provide their own icon library.

Additional icon keys: MemberManagementAction protected/emailUnconfirmed; InvitationManagementAction flexibleEmail. Member textOverrides.protectedSelfMessage/protectedOwnerMessage explain disabled owner/self controls. Import tables retain separate First Name and Last Name columns, not a lossy combined name.

## Verified delivery (2026-10-19)

- npm run build passed; emitted declarations and dist include all exported contracts and the mobile grid fix.
- Full React 18.3.1 suite: 15 files / 107 tests passed (77 pre-existing tests retained plus 30 administration parity tests).
- Public declarations checked with skipLibCheck:false against React 18.3.1 and React 19.3.0 types.
- React 19.3.0 runtime suite: legacy invitation consumers, full parity suite and rebuilt dist consumer.
- Headless Chrome with host Bootstrap and React 19: desktop light/dark, member editor, editable-resend confirmation, mobile list/invite/import at 390px. No page-level overflow or runtime errors. Screenshot artifacts are local under node_modules/.cache/admin-visual.
- Five MyRipple candidate blockers were repaired in shared code: overview template, inline legacy pending URL, inline decline response, complete import name/role/email-policy columns, and untruncated error summary. MediaMarkup protected links still require explicit authorized retrieval.
- Host runtime integration, endpoint authorization and actual protected ownership/email/import processing remain the host agents' verification scope. Nothing was published, sent or applied to a live backend.

Browser fixture commands: set AUTH_REACT_CONSUMER_ROOT to an installed React/Bootstrap/Playwright consumer, run node node_modules/vite/bin/vite.js --config verification/preview.config.ts, then node verification/visual-check.mjs. Chrome is the default installed browser channel; AUTH_BROWSER_CHANNEL can select another installed Chromium channel. The in-app browser sandbox was unavailable; headless Chrome was used instead.

Final icon-only follow-up: InvitationManagementAction also accepts send (create/resend/commit or legacy import submission) and formCancel (focused-form cancellation); cancel remains the invitation row revoke/cancel action. Side-effect-free preview does not display the send icon. MemberManagementAction also accepts enabled and disabled for decorative access-state icons beside the existing labels. All keys remain optional.

Icon-only follow-up verified: staged build passed; 110 React 18 tests and 40 React 19 runtime checks passed; public declarations passed on both versions including the new optional keys. Only the two affected components' eight emitted files were atomically replaced; staging removed and dist stable.

Member filter reset: UserAdministrationPanel honors members.scopeKey when supplied. Changing it remounts only the member panel, resetting its pagination and discarding stale responses; invitation state is preserved. Without it, the existing outer workspace scope remains the default. Hosts own filter controls and server-side filtering through toolbarContent and their adapter.
