import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  defaultInvitationImportText,
  defaultInvitationManagementText,
  formatAuthText,
  getAuthProviderLabel,
  type AuthUiTextOverrides
} from "../authUi";
import type {
  InvitationImportInvalidRow,
  InvitationImportPreview,
  InvitationManagementView,
  InvitationImportPreviewRow,
  InvitationListItem,
  InvitationManagementClassNames,
  InvitationOperationResult,
  InvitationRoleOption,
  InvitationServiceAdapter
} from "../types/invitations";

import { AdministrationConfirmation } from "./AdministrationConfirmation";

type EditMode = "list" | "invite" | "import" | "resend";
type FeedbackTone = "danger" | "success" | "info" | "warning";

interface FeedbackState {
  tone: FeedbackTone;
  messages: string[];
}

export type InvitationManagementAction = "invite" | "import" | "downloadTemplate" | "copyLink" | "resend" | "cancel" | "remove" | "archive" | "details" | "showLink" | "flexibleEmail" | "send" | "formCancel";

export interface InvitationManagementPanelProps {
  icons?: Partial<Record<InvitationManagementAction, ReactNode>>;
  className?: string;
  scopeKey?: string;
  view?: InvitationManagementView;
  onViewChange?: (view: InvitationManagementView) => void;
  expiryHelpContent?: ReactNode;
  importAccept?: string;
  /** Opt-in focused list/form presentation; existing tabbed consumers are unchanged. */
  presentation?: "tabs" | "workspace";
  sectionLabel?: ReactNode;
  roleHelpContent?: ReactNode;
  showImport?: boolean;
  showMessage?: boolean;
  showInvitationDate?: boolean;
  adapter: Pick<
    InvitationServiceAdapter,
    | "getInvitationList"
    | "inviteUser"
    | "importInvitations"
    | "getInvitation"
    | "resendInvitation"
    | "cancelInvitation"
    | "removeInvitation"
    | "buildInvitationUrl"
    | "editAndResendInvitation"
    | "getInvitationLink"
    | "archiveInvitation"
    | "downloadInvitationTemplate"
    | "previewInvitationImport"
    | "commitInvitationImport"
  >;
  textOverrides?: AuthUiTextOverrides;
  roleOptions?: InvitationRoleOption[];
  defaultRole?: string;
  classNames?: InvitationManagementClassNames;
  pageSizeOptions?: number[];
  showCanChangeEmailAddress?: boolean;
  defaultCanChangeEmailAddress?: boolean;
  inviteHelpContent?: ReactNode;
  importHelpContent?: ReactNode;
}

const joinResultMessages = (result?: Pick<InvitationOperationResult<unknown>, "messages" | "message"> | null, fallback?: string) => {
  const messages = result?.messages?.filter(Boolean) ?? [];
  if (messages.length > 0) {
    return messages;
  }

  if (result?.message) {
    return [result.message];
  }

  return fallback ? [fallback] : [];
};

const formatUtcDate = (dateText?: string | null): string => {
  if (!dateText) {
    return "-";
  }

  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) {
    return dateText;
  }

  return parsed.toLocaleString();
};

const getStatusBadge = (status: InvitationListItem["status"]) => {
  switch (status) {
    case "pending":
      return "badge text-bg-primary";
    case "accepted":
      return "badge text-bg-success";
    case "declined":
      return "badge text-bg-secondary";
    case "expired":
      return "badge text-bg-danger";
    default:
      return "badge text-bg-dark";
  }
};

export function InvitationManagementPanel(props: InvitationManagementPanelProps) {
  return <InvitationManagementContent key={props.scopeKey} {...props} />;
}

function InvitationManagementContent({
  icons, view, onViewChange, expiryHelpContent, importAccept = ".xlsx,.xls,.csv",
  className,
  presentation = "tabs",
  sectionLabel,
  roleHelpContent,
  showImport = true,
  showMessage = true,
  showInvitationDate = true,
  adapter,
  textOverrides,
  roleOptions = [],
  defaultRole,
  classNames,
  pageSizeOptions = [10, 25, 50, 100],
  showCanChangeEmailAddress = true,
  defaultCanChangeEmailAddress = true,
  inviteHelpContent,
  importHelpContent
}: InvitationManagementPanelProps) {
  const managementText = useMemo(
    () => ({
      ...defaultInvitationManagementText,
      ...textOverrides?.invitationManagement
    }),
    [textOverrides]
  );
  const importText = useMemo(
    () => ({
      ...defaultInvitationImportText,
      ...textOverrides?.invitationImport
    }),
    [textOverrides]
  );
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const firstNameInput = useRef<HTMLInputElement>(null);
  const inviteButton = useRef<HTMLButtonElement>(null);
  const previousMode = useRef<EditMode>("list");
  const canChangeEmailId = useId();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [items, setItems] = useState<InvitationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditModeState] = useState<EditMode>("list");
  const [editingInvitation, setEditingInvitation] = useState<InvitationListItem | null>(null);
  const [confirmation, setConfirmation] = useState<{ message: string; run: () => void } | null>(null);
  const [protectedLink, setProtectedLink] = useState<{ id: string; url: string } | null>(null);
  const [importPreview, setImportPreview] = useState<InvitationImportPreview | null>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [importCompleted, setImportCompleted] = useState(false);
  const actionRef = useRef(false);
  const importingRef = useRef(false);
  const alive = useRef(true);
  const loadSequence = useRef(0);
  const detailSequence = useRef(0);
  const twoStageImport = !!adapter.previewInvitationImport && !!adapter.commitInvitationImport;
  const incompleteImportAdapter = !!adapter.previewInvitationImport !== !!adapter.commitInvitationImport;
  const setEditMode = (mode: "list" | "invite" | "import") => {
    detailSequence.current++;
    setEditingInvitation(null); setProtectedLink(null); setConfirmation(null);
    setEditModeState(mode); onViewChange?.({ mode });
  };
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; loadSequence.current++; detailSequence.current++; };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[1] ?? pageSizeOptions[0] ?? 25);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedInvitationId, setExpandedInvitationId] = useState("");
  const [expandedInvitation, setExpandedInvitation] = useState<InvitationListItem | null>(null);
  const [actionInvitationId, setActionInvitationId] = useState("");
  const [importing, setImporting] = useState(false);
  const [importRows, setImportRows] = useState<InvitationImportPreviewRow[]>([]);
  const [invalidImportRows, setInvalidImportRows] = useState<InvitationImportInvalidRow[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRole ?? roleOptions[0]?.value ?? "");
  const [message, setMessage] = useState("");
  const [canChangeEmailAddress, setCanChangeEmailAddress] = useState(defaultCanChangeEmailAddress);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const inviteFirstNameId = useId();
  const inviteLastNameId = useId();
  const inviteEmailId = useId();
  const inviteRoleId = useId();
  const inviteMessageId = useId();
  const importMessageId = useId();

  useEffect(() => {
    if (presentation === "workspace") {
      if (editMode === "invite" || editMode === "resend") firstNameInput.current?.focus();
      else if (editMode === "import") importFileInputRef.current?.focus();
      else if (previousMode.current !== "list") inviteButton.current?.focus();
    }
    previousMode.current = editMode;
  }, [editMode, presentation]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const icon = (action: InvitationManagementAction) => icons?.[action] ? <span aria-hidden="true" className="me-1">{icons[action]}</span> : null;

  const setFeedbackFromResult = (tone: FeedbackTone, result: InvitationOperationResult<unknown>, fallback: string) => {
    setFeedback({ tone, messages: joinResultMessages(result, fallback) });
  };

  const resetInviteForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setMessage("");
    setRole(defaultRole ?? roleOptions[0]?.value ?? "");
    setCanChangeEmailAddress(defaultCanChangeEmailAddress);
  };

  const resetImportState = () => {
    setImportPreview(null); setImportJobId(null); setImportCompleted(false);
    setImportRows([]);
    setInvalidImportRows([]);
    setImportMessage("");
    setImportFile(null);
    setImportFileName("");
  };

  const load = async (requestedPage = page, requestedPageSize = pageSize, requestedQuery = searchQuery) => {
    const request = ++loadSequence.current;
    detailSequence.current++; setExpandedInvitationId(""); setExpandedInvitation(null);
    setProtectedLink(null);
    setLoading(true);
    setFeedback(null);
    try {
      const response = await adapter.getInvitationList({
        query: requestedQuery,
        page: requestedPage,
        pageSize: requestedPageSize,
        sortBy: "InvitationDate",
        sortDescending: true
      });

      if (!alive.current || request !== loadSequence.current) return false;
      if (!response.success || !response.data) {
        setFeedbackFromResult("danger", response, managementText.loadFailedMessage);
        return false;
      }

      setItems(response.data.items ?? []);
      setTotalCount(response.data.totalCount ?? 0);
      setPage(requestedPage);
      setPageSize(requestedPageSize);
      return true;
    } catch {
      if (alive.current && request === loadSequence.current) setFeedback({ tone: "danger", messages: [managementText.loadFailedMessage] });
      return false;
    } finally {
      if (alive.current && request === loadSequence.current) setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, pageSize, "");
  }, []);

  const submitInvite = async (confirmed = false) => {
    if (sendingRef.current) return;
    if (firstName.trim().length === 0 || lastName.trim().length === 0 || email.trim().length === 0 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || (roleOptions.length > 0 && !roleOptions.some(option => option.value === role))) {
      setFeedback({ tone: "danger", messages: [managementText.inviteFailedMessage] });
      return;
    }
    if (editingInvitation && !confirmed) {
      setConfirmation({ message: managementText.resendConfirmationMessage, run: () => void submitInvite(true) });
      return;
    }
    sendingRef.current = true;
    setSending(true);
    setFeedback(null);
    try {
      const request = {
        firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(),
        role: role || undefined, message: message.trim() || undefined, canChangeEmailAddress
      };
      const response = editingInvitation
        ? await adapter.editAndResendInvitation!(editingInvitation.id, request)
        : await adapter.inviteUser(request);
      if (!alive.current) return;
      if (!response.success) {
        setFeedbackFromResult("danger", response, editingInvitation ? managementText.resendFailedMessage : managementText.inviteFailedMessage);
        return;
      }
      resetInviteForm();
      setEditMode("list");
      if (await load(page, pageSize, searchQuery)) {
        setFeedback({ tone: "success", messages: joinResultMessages(response, editingInvitation ? managementText.resendSuccessMessage : managementText.inviteSuccessMessage) });
      }
    } catch {
      if (alive.current) setFeedback({ tone: "danger", messages: [editingInvitation ? managementText.resendFailedMessage : managementText.inviteFailedMessage] });
    } finally {
      sendingRef.current = false;
      if (alive.current) setSending(false);
    }
  };
  const openResend = async (item: InvitationListItem | string, notify = true) => {
    if (actionRef.current || !adapter.editAndResendInvitation) return;
    const request = ++detailSequence.current;
    setEditingInvitation(null); setEditModeState("list");
    setActionInvitationId(typeof item === "string" ? item : item.id); setFeedback(null);
    try {
      const response = adapter.getInvitation ? await adapter.getInvitation(typeof item === "string" ? item : item.id)
        : { success: typeof item !== "string", data: typeof item === "string" ? undefined : item };
      if (!alive.current || request !== detailSequence.current) return;
      if (!response.success || !response.data || !response.data.canResend) {
        setFeedbackFromResult("danger", response, managementText.detailsLoadFailedMessage); return;
      }
      const data = response.data;
      setEditingInvitation(data); setFirstName(data.firstName); setLastName(data.lastName); setEmail(data.email);
      setRole(data.role ?? defaultRole ?? roleOptions[0]?.value ?? ""); setMessage(data.message ?? "");
      setCanChangeEmailAddress(data.canChangeEmailAddress ?? defaultCanChangeEmailAddress);
      setProtectedLink(null); setEditModeState("resend");
      if (notify) onViewChange?.({ mode: "resend", invitationId: data.id });
    } catch { if (alive.current && request === detailSequence.current) setFeedback({ tone: "danger", messages: [managementText.detailsLoadFailedMessage] }); }
    finally { if (alive.current && request === detailSequence.current) setActionInvitationId(""); }
  };
  const externalId = view?.mode === "resend" ? view.invitationId : undefined;
  useEffect(() => {
    if (!view) return;
    if (view.mode === "resend") { if (editingInvitation?.id !== view.invitationId) void openResend(view.invitationId, false); }
    else {
      detailSequence.current++; setActionInvitationId(""); setEditingInvitation(null); setConfirmation(null); setProtectedLink(null);
      if (view.mode === "invite") resetInviteForm();
      if (view.mode === "import") resetImportState();
      setEditModeState(view.mode);
    }
  }, [view?.mode, externalId]);

  const toggleDetails = async (item: InvitationListItem) => {
    if (!adapter.getInvitation) return;
    const request = ++detailSequence.current;
    if (expandedInvitationId === item.id) { setExpandedInvitationId(""); setExpandedInvitation(null); return; }
    setExpandedInvitationId(item.id); setExpandedInvitation(null);
    try {
      const response = await adapter.getInvitation(item.id);
      if (!alive.current || request !== detailSequence.current) return;
      if (!response.success || !response.data) {
        setExpandedInvitationId(""); setFeedbackFromResult("warning", response, managementText.detailsLoadFailedMessage); return;
      }
      setExpandedInvitation(response.data);
    } catch { if (alive.current && request === detailSequence.current) {
      setExpandedInvitationId(""); setFeedback({ tone: "danger", messages: [managementText.detailsLoadFailedMessage] });
    } }
  };

  const performAction = async (id: string, action: (() => Promise<InvitationOperationResult<void>>) | undefined, successMessage: string, failedMessage: string) => {
    if (!action || actionRef.current) return;
    actionRef.current = true; setActionInvitationId(id); setFeedback(null);
    try {
      const response = await action();
      if (!alive.current) return;
      if (!response.success) { setFeedbackFromResult("danger", response, failedMessage); return; }
      setConfirmation(null); setProtectedLink(null); setExpandedInvitation(null); setExpandedInvitationId("");
      if (await load(page, pageSize, searchQuery)) setFeedback({ tone: "success", messages: joinResultMessages(response, successMessage) });
    } catch { if (alive.current) setFeedback({ tone: "danger", messages: [failedMessage] }); }
    finally { actionRef.current = false; if (alive.current) setActionInvitationId(""); }
  };
  const confirmAction = (message: string, run: () => void, always = false) => {
    if (presentation === "workspace" || always) setConfirmation({ message, run }); else run();
  };
  const canRetrieveLink = (item: InvitationListItem) => !adapter.getInvitationLink ||
    (item.status === "pending" && (!item.expiryDate || Date.parse(item.expiryDate) > Date.now()));
  const copyInviteLink = async (item: InvitationListItem, copy = true) => {
    if (actionRef.current || !canRetrieveLink(item)) return;
    const request = ++detailSequence.current;
    actionRef.current = true; setActionInvitationId(item.id); setFeedback(null); setProtectedLink(null);
    try {
      let link: string;
      if (adapter.getInvitationLink) {
        const response = await adapter.getInvitationLink(item.id);
        if (!alive.current || request !== detailSequence.current) return;
        if (!response.success || !response.data?.url) { setFeedbackFromResult("warning", response, managementText.noInvitationLinkMessage); return; }
        link = response.data.url;
      } else link = adapter.buildInvitationUrl?.(item) ?? "";
      if (!link) { setFeedback({ tone: "warning", messages: [managementText.noInvitationLinkMessage] }); return; }
      setProtectedLink({ id: item.id, url: link });
      if (copy) {
        await navigator.clipboard.writeText(link);
        if (alive.current) setFeedback({ tone: "success", messages: [managementText.copiedLinkMessage] });
      }
    } catch { if (alive.current) setFeedback({ tone: "danger", messages: [managementText.copyLinkFailedMessage] }); }
    finally { actionRef.current = false; if (alive.current) setActionInvitationId(""); }
  };

  const invalidatePreview = () => {
    setImportPreview(null); setImportRows([]); setInvalidImportRows([]); setImportJobId(null); setImportCompleted(false); setFeedback(null);
  };
  const sendImport = async () => {
    if (importingRef.current || importCompleted || incompleteImportAdapter) return;
    if (twoStageImport && importPreview && (!importPreview.validationSucceeded || importPreview.invalidRowCount > 0 || importPreview.validRowCount === 0)) return;
    if (!importFile) { setFeedback({ tone: "warning", messages: [importText.chooseFileFirstMessage] }); return; }
    importingRef.current = true; setImporting(true); setFeedback(null);
    const isPreview = twoStageImport && !importPreview;
    try {
      const response = twoStageImport
        ? importPreview ? await adapter.commitInvitationImport!(importPreview, importFile, importMessage)
          : await adapter.previewInvitationImport!(importFile, importMessage)
        : await adapter.importInvitations(importFile, importMessage);
      if (!alive.current) return;
      if (!response.success || !response.data) { setFeedbackFromResult("danger", response, importText.importFailedMessage); return; }
      const data = response.data;
      setImportRows(data.previewRows ?? []); setInvalidImportRows(data.invalidRows ?? []);
      if (isPreview) {
        if (data.queued) { setImportCompleted(true); setFeedback({ tone: "danger", messages: [importText.previewContractErrorMessage] }); return; }
        setImportPreview(data);
        setFeedback({ tone: data.validationSucceeded && !data.invalidRowCount ? "info" : "warning",
          messages: [data.validationSucceeded && !data.invalidRowCount ? importText.previewReadyMessage
            : formatAuthText(importText.importValidationWarningMessage, { count: data.invalidRowCount })] });
        return;
      }
      if (data.validationSucceeded && data.queued) {
        setImportCompleted(true); setImportPreview(null); setImportJobId(data.jobId ?? null);
        if (await load(page, pageSize, searchQuery)) setFeedback({ tone: "success", messages: [formatAuthText(importText.importSuccessMessage, { count: data.validRowCount })] });
        return;
      }
      setImportPreview(null);
      setFeedback({ tone: "warning", messages: response.messages?.length ? response.messages : [formatAuthText(importText.importValidationWarningMessage, { count: data.invalidRowCount })] });
    } catch { if (alive.current) setFeedback({ tone: "danger", messages: [importText.importFailedMessage] }); }
    finally { importingRef.current = false; if (alive.current) setImporting(false); }
  };
  const downloadTemplate = async () => {
    if (!adapter.downloadInvitationTemplate || importingRef.current) return;
    importingRef.current = true; setImporting(true);
    try { await adapter.downloadInvitationTemplate(); }
    catch { if (alive.current) setFeedback({ tone: "danger", messages: [importText.downloadFailedMessage] }); }
    finally { importingRef.current = false; if (alive.current) setImporting(false); }
  };

  const renderFeedback = () => {
    if (!feedback || feedback.messages.length === 0) {
      return null;
    }

    return (
      <div className={`alert alert-${feedback.tone}`} role="alert">
        {feedback.messages.map((message, index) => (
          <div key={index}>{message}</div>
        ))}
      </div>
    );
  };

  const statusLabel = (status: InvitationListItem["status"]) => {
    switch (status) {
      case "pending":
        return managementText.pendingStatusLabel;
      case "accepted":
        return managementText.acceptedStatusLabel;
      case "declined":
        return managementText.declinedStatusLabel;
      case "expired":
        return managementText.expiredStatusLabel;
      case "revoked":
        return managementText.revokedStatusLabel;
      case "cancelled":
        return managementText.cancelledStatusLabel;
      default:
        return managementText.unknownStatusLabel;
    }
  };

  return (
    <div className={[classNames?.container ?? "card", "bt-invitation-management", className].filter(Boolean).join(" ")} data-presentation={presentation} data-view={editMode}>
      <div className={classNames?.header ?? (presentation === "workspace" ? "card-header bt-invitation-header" : "card-header d-flex justify-content-between align-items-center flex-wrap gap-2")}>
        {presentation === "workspace" ? <div>
          {sectionLabel && <div className="bt-invitation-kicker">{sectionLabel}</div>}
          <h2 className="bt-invitation-title">{editMode === "resend" ? managementText.editAndResendHeading : editMode === "invite" ? managementText.inviteHeading : editMode === "import" ? managementText.importTabLabel : managementText.title}
            {editMode === "list" && <span className="bt-invitation-count"> ({totalCount})</span>}
          </h2>
        </div> : <h5 className="mb-0">{managementText.title}</h5>}
        <div className="btn-group btn-group-sm flex-wrap gap-2">
          {editMode === "list" && adapter.downloadInvitationTemplate && <button type="button" className="btn btn-outline-secondary" disabled={sending || importing || actionInvitationId.length > 0 || !!confirmation} onClick={() => void downloadTemplate()}>{icon("downloadTemplate")}{importText.downloadTemplateLabel}</button>}
          {presentation === "tabs" && <button type="button" disabled={sending || importing || actionInvitationId.length > 0} className={editMode === "list" ? "btn btn-primary" : "btn btn-outline-primary"} onClick={() => setEditMode("list")}>
            {managementText.listTabLabel}
          </button>}
          {(presentation === "tabs" || editMode === "list") && <button ref={inviteButton} type="button" className={presentation === "workspace" || editMode === "invite" ? "btn btn-primary" : "btn btn-outline-primary"} disabled={sending || importing || actionInvitationId.length > 0} onClick={() => { resetInviteForm(); setEditMode("invite"); }}>
            {icon("invite")}{managementText.inviteTabLabel}
          </button>}
          {showImport && (presentation === "tabs" || editMode === "list") && <button disabled={sending || importing || actionInvitationId.length > 0} type="button" className={editMode === "import" ? "btn btn-primary" : "btn btn-outline-primary"} onClick={() => { resetImportState(); setEditMode("import"); }}>
            {icon("import")}{managementText.importTabLabel}
          </button>}
        </div>
      </div>
      <div className={classNames?.body ?? (presentation === "workspace" ? "card-body bt-invitation-body" : "card-body")}>
        {renderFeedback()}
        {confirmation && <AdministrationConfirmation message={confirmation.message} confirmLabel={managementText.confirmLabel}
          cancelLabel={managementText.cancelLabel} busy={sending || importing || actionInvitationId.length > 0}
          onConfirm={confirmation.run} onCancel={() => setConfirmation(null)} />}
        <fieldset className="border-0 p-0 m-0 w-100" disabled={!!confirmation || sending || importing}>

        {(editMode === "invite" || editMode === "resend") && (
          <div className={classNames?.inviteCard ?? "bt-invitation-form"}>
            {presentation === "tabs" && <h6>{editingInvitation ? managementText.editAndResendHeading : managementText.inviteHeading}</h6>}
            <div className="bt-invitation-intro">{inviteHelpContent}{expiryHelpContent}</div>
            <div className="row g-3 mb-2 bt-invitation-fields">
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor={inviteFirstNameId}>{managementText.firstNameLabel}</label>
                <input ref={firstNameInput} id={inviteFirstNameId} type="text" className="form-control" value={firstName} onChange={event => setFirstName(event.target.value)} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor={inviteLastNameId}>{managementText.lastNameLabel}</label>
                <input id={inviteLastNameId} type="text" className="form-control" value={lastName} onChange={event => setLastName(event.target.value)} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label" htmlFor={inviteEmailId}>{managementText.emailAddressLabel}</label>
                <input id={inviteEmailId} type="email" className="form-control" value={email} onChange={event => setEmail(event.target.value)} />
              </div>
              {roleOptions.length > 0 && (
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor={inviteRoleId}>{managementText.roleLabel}</label>
                  <select id={inviteRoleId} className="form-select" value={role} onChange={event => setRole(event.target.value)}>
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}
              {(roleHelpContent || (presentation === "workspace" && roleOptions.some(option => option.description))) && <div className="col-12 bt-invitation-role-help">
                {roleOptions.some(option => option.description) && <div className="bt-invitation-role-descriptions">
                  {roleOptions.filter(option => option.description).map(option => <div key={option.value}>
                    <strong>{option.label}</strong><p>{option.description}</p>
                  </div>)}
                </div>}
                {roleHelpContent && <div className="bt-invitation-policy">{roleHelpContent}</div>}
              </div>}
              {showMessage && <div className="col-12">
                <label className="form-label" htmlFor={inviteMessageId}>{managementText.optionalMessageLabel}</label>
                <textarea id={inviteMessageId} className="form-control" rows={3} value={message} onChange={event => setMessage(event.target.value)} />
              </div>}
              {showCanChangeEmailAddress && (
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={canChangeEmailId}
                      checked={canChangeEmailAddress}
                      onChange={event => setCanChangeEmailAddress(event.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={canChangeEmailId}>
                      {managementText.canChangeEmailAddressLabel}
                    </label>
                  </div>
                  <div className="small text-muted mt-1">{managementText.canChangeEmailAddressDescription}</div>
                </div>
              )}
              <div className={presentation === "workspace" ? "col-12 d-flex justify-content-between gap-2 bt-invitation-form-actions" : "col-12 d-flex justify-content-end gap-2"}>
                <button type="button" className="btn btn-outline-secondary" disabled={sending || importing || actionInvitationId.length > 0} onClick={() => setEditMode("list")}>
                  {icon("formCancel")}{managementText.cancelLabel}
                </button>
                <button type="button" className="btn btn-primary" disabled={sending || importing || actionInvitationId.length > 0} aria-busy={sending} onClick={() => void submitInvite()}>
                  {icon("send")}{sending ? managementText.sendingInvitationLabel : editingInvitation ? managementText.editAndResendLabel : managementText.sendInvitationLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {editMode === "import" && (
          <div className={classNames?.importCard ?? ""}>
            <h6>{importText.title}</h6>
            {incompleteImportAdapter && <div role="alert" className="alert alert-danger">{importText.adapterConfigurationMessage}</div>}
            <div className="alert alert-info">
              {importHelpContent ?? importText.instructionsMessage}
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor={importMessageId}>{importText.sharedMessageLabel}</label>
              <textarea id={importMessageId} className="form-control" rows={3} value={importMessage} onChange={event => { setImportMessage(event.target.value); invalidatePreview(); }} />
            </div>

            {adapter.downloadInvitationTemplate && <button type="button" className="btn btn-outline-secondary mb-3" disabled={importing} onClick={() => void downloadTemplate()}>{importText.downloadTemplateLabel}</button>}
            {importJobId && <p role="status">{formatAuthText(importText.jobStatusLabel, { jobId: importJobId })}</p>}
            <div className="mb-3">
              <input
                ref={importFileInputRef}
                type="file"
                className="visually-hidden"
                aria-label={importText.chooseFileLabel}
                accept={importAccept}
                onChange={event => {
                  invalidatePreview();
                  const file = event.target.files?.[0] ?? null;
                  setImportFile(file);
                  setImportFileName(file?.name ?? "");
                  event.target.value = "";
                }}
              />
              <button type="button" className="btn btn-outline-primary" onClick={() => importFileInputRef.current?.click()}>
                {importText.chooseFileLabel}
              </button>
              <div className="small text-muted mt-2">{importFileName || importText.noFileChosenMessage}</div>
            </div>

            {invalidImportRows.length > 0 && (
              <div className="mb-3">
                <div className="alert alert-warning">
                  <h6>{importText.validationErrorsHeading}</h6>
                  <ul className="mb-0">{invalidImportRows.map((row, index) => <li key={index}>{formatAuthText(importText.validationErrorLabel, { row: row.rowNumber, error: row.error })}</li>)}</ul>
                </div>
                <h6>{formatAuthText(importText.invalidRowsHeading, { count: invalidImportRows.length })}</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{importText.rowColumnLabel}</th>
                        <th>{managementText.firstNameLabel}</th>
                        <th>{managementText.lastNameLabel}</th>
                        <th>{managementText.emailColumnLabel}</th>
                        <th>{managementText.roleColumnLabel}</th>
                        <th>{importText.allowAnyEmailColumnLabel}</th>
                        <th>{importText.errorColumnLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invalidImportRows.slice(0, 5).map(row => (
                        <tr key={`invalid-${row.rowNumber}-${row.emailAddress}`}>
                          <td>{row.rowNumber}</td>
                          <td>{row.firstName}</td>
                          <td>{row.lastName}</td>
                          <td>{row.emailAddress}</td>
                          <td>{row.roleLabel ?? row.role ?? "-"}</td>
                          <td>{row.allowAnyEmail === undefined ? "-" : row.allowAnyEmail ? managementText.yesLabel : managementText.noLabel}</td>
                          <td>{row.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importRows.length > 0 && (
              <div className="mb-3">
                <h6>{formatAuthText(importText.previewRowsHeading, { count: Math.min(importRows.length, 5) })}</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{importText.rowColumnLabel}</th>
                        <th>{managementText.firstNameLabel}</th>
                        <th>{managementText.lastNameLabel}</th>
                        <th>{managementText.emailColumnLabel}</th>
                        <th>{managementText.roleColumnLabel}</th>
                        <th>{importText.allowAnyEmailColumnLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 5).map(row => (
                        <tr key={`preview-${row.rowNumber}-${row.emailAddress}`}>
                          <td>{row.rowNumber}</td>
                          <td>{row.firstName}</td>
                          <td>{row.lastName}</td>
                          <td>{row.emailAddress}</td>
                          <td>{row.roleLabel ?? row.role ?? ""}</td>
                          <td>{row.allowAnyEmail === undefined ? "-" : row.allowAnyEmail ? managementText.yesLabel : managementText.noLabel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" disabled={sending || importing || actionInvitationId.length > 0} onClick={() => setEditMode("list")}>
                {icon("formCancel")}{managementText.cancelLabel}
              </button>
              <button type="button" className="btn btn-primary" disabled={importing || importCompleted || incompleteImportAdapter || !!(twoStageImport && importPreview && (!importPreview.validationSucceeded || importPreview.invalidRowCount > 0 || importPreview.validRowCount === 0))} onClick={() => void sendImport()}>
                {(!twoStageImport || importPreview) && icon("send")}{importing ? importText.importingLabel : twoStageImport ? importPreview ? importText.commitImportLabel : importText.previewImportLabel : importText.importAndSendLabel}
              </button>
            </div>
          </div>
        )}

        {editMode === "list" && (
          <div className={classNames?.listCard ?? ""}>
            <div className="row g-2 mb-3 bt-invitation-toolbar">
              <div className="col-12 col-md-6">
                <input
                  type="text"
                  className="form-control"
                  aria-label={managementText.searchLabel}
                  placeholder={managementText.searchPlaceholder}
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void load(1, pageSize, searchQuery);
                    }
                  }}
                />
              </div>
              <div className="col-6 col-md-2">
                <button type="button" className="btn btn-outline-primary w-100" disabled={loading} onClick={() => void load(1, pageSize, searchQuery)}>
                  {managementText.searchLabel}
                </button>
              </div>
              <div className="col-6 col-md-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  disabled={loading}
                  onClick={() => {
                    setSearchQuery("");
                    void load(1, pageSize, "");
                  }}
                >
                  {managementText.clearLabel}
                </button>
              </div>
              <div className="col-12 col-md-2">
                <select
                  className="form-select"
                  aria-label={managementText.pageSizeLabel}
                  value={pageSize}
                  disabled={loading}
                  onChange={event => {
                    const nextPageSize = Number.parseInt(event.target.value, 10);
                    void load(1, nextPageSize, searchQuery);
                  }}
                >
                  {pageSizeOptions.map(option => (
                    <option key={option} value={option}>{option} / page</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive" role="region" aria-label={managementText.title} tabIndex={0}>
              <table className={presentation === "workspace" ? "table align-middle bt-invitation-table" : "table table-sm align-middle"}>
                <thead>
                  <tr>
                    <th>{managementText.nameColumnLabel}</th>
                    <th>{managementText.emailColumnLabel}</th>
                    <th>{managementText.roleColumnLabel}</th>
                    <th>{managementText.statusColumnLabel}</th>
                    {showInvitationDate && <th>{managementText.invitationDateColumnLabel}</th>}
                    <th>{managementText.expiryDateColumnLabel}</th>
                    <th>{managementText.actionsColumnLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={showInvitationDate ? 7 : 6}>{managementText.loadingMessage}</td>
                    </tr>
                  )}
                  {!loading && items.length === 0 && (
                    <tr>
                      <td colSpan={showInvitationDate ? 7 : 6}>{managementText.noInvitationsMessage}</td>
                    </tr>
                  )}
                  {!loading && items.map(item => (
                    <Fragment key={item.id}>
                      <tr>
                        <td>{item.firstName} {item.lastName}</td>
                        <td>
                          {item.status === "accepted" && item.acceptedEmailAddress && item.acceptedEmailAddress !== item.email ? (
                            <>
                              <div className="text-muted text-decoration-line-through">{item.email}</div>
                              <div>{item.acceptedEmailAddress}</div>
                            </>
                          ) : (
                            item.email
                          )}
                          {(item.canChangeEmailAddress || (item.acceptedEmailAddress && item.acceptedEmailAddress !== item.email)) && <span className="badge text-bg-secondary ms-2" title={managementText.flexibleEmailDescription}>{icon("flexibleEmail")}{managementText.flexibleEmailLabel}</span>}
                        </td>
                        <td>{item.roleLabel ?? item.role ?? ""}</td>
                        <td><span className={getStatusBadge(item.status === "pending" && !!item.expiryDate && Date.parse(item.expiryDate) <= Date.now() ? "expired" : item.status)}>{statusLabel(item.status === "pending" && !!item.expiryDate && Date.parse(item.expiryDate) <= Date.now() ? "expired" : item.status)}</span></td>
                        {showInvitationDate && <td>{formatUtcDate(item.invitationDate)}</td>}
                        <td>{item.status === "pending" || item.status === "expired" ? formatUtcDate(item.expiryDate) : "-"}</td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            {(item.canCopyLink ?? !adapter.getInvitationLink) && canRetrieveLink(item) && (
                              <button type="button" className="btn btn-outline-primary" disabled={actionInvitationId.length > 0} onClick={() => void copyInviteLink(item)}>
                                {icon("copyLink")}{managementText.copyLinkLabel}
                              </button>
                            )}
                            {!!(adapter.resendInvitation || adapter.editAndResendInvitation) && (item.canResend ?? false) && (
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                disabled={actionInvitationId.length > 0}
                                onClick={() => adapter.editAndResendInvitation ? void openResend(item) : confirmAction(managementText.resendConfirmationMessage, () => void performAction(item.id, () => adapter.resendInvitation!(item.id), managementText.resendSuccessMessage, managementText.resendFailedMessage))}
                              >
                                {icon("resend")}{actionInvitationId === item.id ? managementText.resendingLabel : managementText.resendLabel}
                              </button>
                            )}
                            {!!adapter.cancelInvitation && (item.canCancel ?? false) && (
                              <button
                                type="button"
                                className="btn btn-outline-warning"
                                disabled={actionInvitationId.length > 0}
                                onClick={() => confirmAction(managementText.revokeConfirmationMessage, () => void performAction(item.id, () => adapter.cancelInvitation!(item.id), managementText.cancelSuccessMessage, managementText.cancelFailedMessage))}
                              >
                                {icon("cancel")}{actionInvitationId === item.id ? managementText.cancellingInvitationLabel : managementText.cancelInvitationLabel}
                              </button>
                            )}
                            {!!adapter.removeInvitation && (item.canRemove ?? false) && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                disabled={actionInvitationId.length > 0}
                                onClick={() => confirmAction(managementText.archiveConfirmationMessage, () => void performAction(item.id, () => adapter.removeInvitation!(item.id), managementText.removeSuccessMessage, managementText.removeFailedMessage))}
                              >
                                {icon("remove")}{actionInvitationId === item.id ? managementText.removingInvitationLabel : managementText.removeInvitationLabel}
                              </button>
                            )}
                            {!!adapter.archiveInvitation && item.canArchive && item.status !== "pending" && item.status !== "unknown" && <button type="button" className="btn btn-outline-danger" disabled={actionInvitationId.length > 0}
                              onClick={() => confirmAction(managementText.archiveConfirmationMessage, () => void performAction(item.id, () => adapter.archiveInvitation!(item.id), managementText.removeSuccessMessage, managementText.removeFailedMessage), true)}>{icon("archive")}{managementText.archiveLabel}</button>}
                            {!!adapter.getInvitationLink && item.canCopyLink && canRetrieveLink(item) && <button type="button" className="btn btn-outline-secondary" disabled={actionInvitationId.length > 0} onClick={() => void copyInviteLink(item, false)}>{icon("showLink")}{managementText.showLinkLabel}</button>}
                            {!!adapter.getInvitation && (item.canViewDetails ?? true) && (
                              <button type="button" className="btn btn-outline-secondary" disabled={actionInvitationId.length > 0} onClick={() => void toggleDetails(item)}>
                                {icon("details")}{expandedInvitationId === item.id ? managementText.hideDetailsLabel : managementText.detailsLabel}
                              </button>
                            )}
                          </div>
                          {item.canCopyLink === false && item.linkUnavailableMessage && <p className="small text-body-secondary mt-2 mb-0">{item.linkUnavailableMessage}</p>}
                          {protectedLink?.id === item.id && <div className="mt-2"><label className="d-block">{managementText.detailsInviteUrlLabel}<input className="form-control" readOnly value={protectedLink.url} onFocus={event => event.target.select()} /></label>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setProtectedLink(null)}>{managementText.hideDetailsLabel}</button></div>}
                        </td>
                      </tr>
                      {!adapter.getInvitationLink && adapter.buildInvitationUrl && item.canCopyLink !== false && item.status === "pending" && (!item.expiryDate || Date.parse(item.expiryDate) > Date.now()) && adapter.buildInvitationUrl(item) && <tr>
                        <td colSpan={showInvitationDate ? 7 : 6} className="pt-0"><div className="small text-body-secondary">{managementText.detailsInviteUrlLabel}</div><div className="text-break user-select-all">{adapter.buildInvitationUrl(item)}</div></td>
                      </tr>}
                      {item.status === "declined" && item.responseMessage?.trim() && <tr>
                        <td colSpan={showInvitationDate ? 7 : 6} className="pt-0"><strong>{managementText.detailsResponseMessageLabel}</strong><p className="text-break mb-0" style={{whiteSpace:"pre-wrap"}}>{item.responseMessage}</p></td>
                      </tr>}
                      {expandedInvitationId === item.id && (
                        <tr>
                          <td colSpan={showInvitationDate ? 7 : 6} className="bg-body-tertiary">
                            {!expandedInvitation && <div>{managementText.detailsLoadingMessage}</div>}
                            {expandedInvitation && (
                              <div className="row">
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsGuidLabel}:</strong> {expandedInvitation.guid ?? "-"}</div>
                                {!adapter.getInvitationLink && <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsInvitationKeyLabel}:</strong> {expandedInvitation.userInvitationKey ?? "-"}</div>}
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsCanChangeEmailLabel}:</strong> {expandedInvitation.canChangeEmailAddress ? managementText.yesLabel : managementText.noLabel}</div>
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsAcceptedEmailLabel}:</strong> {expandedInvitation.acceptedEmailAddress ?? "-"}</div>
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsCreatedLabel}:</strong> {formatUtcDate(expandedInvitation.createdDate)}</div>
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsUpdatedLabel}:</strong> {formatUtcDate(expandedInvitation.lastUpdatedDate)}</div>
                                <div className="col-12 mb-1"><strong>{managementText.detailsMessageLabel}:</strong> {expandedInvitation.message ?? "-"}</div>
                                <div className="col-12 mb-1"><strong>{managementText.detailsResponseMessageLabel}:</strong> {expandedInvitation.responseMessage ?? "-"}</div>
                                <div className="col-12 mb-1"><strong>{managementText.detailsInviteUrlLabel}:</strong> {adapter.getInvitationLink ? "-" : adapter.buildInvitationUrl?.(expandedInvitation) ?? "-"}</div>
                                {expandedInvitation.acceptedLoginProvider != null && (
                                  <div className="col-12 mb-1">
                                    <strong>{formatAuthText(managementText.detailsVerifiedByLabel, { provider: getAuthProviderLabel(expandedInvitation.acceptedLoginProvider, textOverrides) })}</strong>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 bt-invitation-pagination">
              <div>{formatAuthText(managementText.pageSummaryLabel, { page, totalPages, totalCount })}</div>
              <div className="btn-group">
                <button type="button" className="btn btn-outline-secondary" disabled={loading || page <= 1} onClick={() => void load(page - 1, pageSize, searchQuery)}>
                  {managementText.previousLabel}
                </button>
                <button type="button" className="btn btn-outline-secondary" disabled={loading || page >= totalPages} onClick={() => void load(page + 1, pageSize, searchQuery)}>
                  {managementText.nextLabel}
                </button>
              </div>
            </div>
          </div>
        )}
        </fieldset>
      </div>
    </div>
  );
}
