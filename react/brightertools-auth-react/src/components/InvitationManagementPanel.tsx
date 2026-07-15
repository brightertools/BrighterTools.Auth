import { Fragment, useEffect, useMemo, useRef, useState } from "react";
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
  InvitationImportPreviewRow,
  InvitationListItem,
  InvitationManagementClassNames,
  InvitationOperationResult,
  InvitationRoleOption,
  InvitationServiceAdapter
} from "../types/invitations";

type EditMode = "list" | "invite" | "import";
type FeedbackTone = "danger" | "success" | "info" | "warning";

interface FeedbackState {
  tone: FeedbackTone;
  messages: string[];
}

export interface InvitationManagementPanelProps {
  className?: string;
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

export function InvitationManagementPanel({
  className,
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
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [items, setItems] = useState<InvitationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>("list");
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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
    setImportRows([]);
    setInvalidImportRows([]);
    setImportMessage("");
    setImportFile(null);
    setImportFileName("");
  };

  const load = async (requestedPage = page, requestedPageSize = pageSize, requestedQuery = searchQuery) => {
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

      if (!response.success || !response.data) {
        setFeedbackFromResult("danger", response, managementText.loadFailedMessage);
        return;
      }

      setItems(response.data.items ?? []);
      setTotalCount(response.data.totalCount ?? 0);
      setPage(requestedPage);
      setPageSize(requestedPageSize);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1, pageSize, "");
  }, []);

  const submitInvite = async () => {
    if (firstName.trim().length === 0 || lastName.trim().length === 0 || email.trim().length === 0) {
      setFeedback({ tone: "danger", messages: [managementText.inviteFailedMessage] });
      return;
    }

    setFeedback(null);
    const response = await adapter.inviteUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      role: role || undefined,
      message: message.trim() || undefined,
      canChangeEmailAddress
    });

    if (!response.success) {
      setFeedbackFromResult("danger", response, managementText.inviteFailedMessage);
      return;
    }

    setFeedback({ tone: "success", messages: joinResultMessages(response, managementText.inviteSuccessMessage) });
    resetInviteForm();
    setEditMode("list");
    await load(page, pageSize, searchQuery);
  };

  const toggleDetails = async (item: InvitationListItem) => {
    if (!adapter.getInvitation) {
      return;
    }
    if (expandedInvitationId === item.id) {
      setExpandedInvitationId("");
      setExpandedInvitation(null);
      return;
    }

    setExpandedInvitationId(item.id);
    setExpandedInvitation(null);

    const response = await adapter.getInvitation(item.id);
    if (!response.success || !response.data) {
      setFeedbackFromResult("warning", response, managementText.detailsLoadFailedMessage);
      return;
    }

    setExpandedInvitation(response.data);
  };

  const performAction = async (id: string, action: (() => Promise<InvitationOperationResult<void>>) | undefined, successMessage: string, failedMessage: string) => {
    if (!action) {
      return;
    }

    setActionInvitationId(id);
    setFeedback(null);
    try {
      const response = await action();
      if (!response.success) {
        setFeedbackFromResult("danger", response, failedMessage);
        return;
      }

      setFeedback({ tone: "success", messages: joinResultMessages(response, successMessage) });
      await load(page, pageSize, searchQuery);
    } finally {
      setActionInvitationId("");
    }
  };

  const copyInviteLink = async (item: InvitationListItem) => {
    const link = adapter.buildInvitationUrl?.(item) ?? "";
    if (!link) {
      setFeedback({ tone: "warning", messages: [managementText.noInvitationLinkMessage] });
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      setFeedback({ tone: "success", messages: [managementText.copiedLinkMessage] });
    } catch {
      setFeedback({ tone: "danger", messages: [managementText.copyLinkFailedMessage] });
    }
  };

  const sendImport = async () => {
    if (!importFile) {
      setFeedback({ tone: "warning", messages: [importText.chooseFileFirstMessage] });
      return;
    }

    setImporting(true);
    setFeedback(null);
    try {
      const response = await adapter.importInvitations(importFile, importMessage);
      if (!response.success || !response.data) {
        setFeedbackFromResult("danger", response, importText.importFailedMessage);
        return;
      }

      const data = response.data;
      setImportRows(data.previewRows ?? []);
      setInvalidImportRows(data.invalidRows ?? []);

      if (data.validationSucceeded && data.queued) {
        setFeedback({
          tone: "success",
          messages: [formatAuthText(importText.importSuccessMessage, { count: data.validRowCount })]
        });
        await load(page, pageSize, searchQuery);
        return;
      }

      setFeedback({
        tone: "warning",
        messages: [formatAuthText(importText.importValidationWarningMessage, { count: data.invalidRowCount })]
      });
    } finally {
      setImporting(false);
    }
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
      default:
        return managementText.unknownStatusLabel;
    }
  };

  return (
    <div className={[classNames?.container ?? "card", className].filter(Boolean).join(" ")}>
      <div className={classNames?.header ?? "card-header d-flex justify-content-between align-items-center flex-wrap gap-2"}>
        <h5 className="mb-0">{managementText.title}</h5>
        <div className="btn-group btn-group-sm">
          <button type="button" className={`btn ${editMode === "list" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setEditMode("list")}>
            {managementText.listTabLabel}
          </button>
          <button type="button" className={`btn ${editMode === "invite" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setEditMode("invite")}>
            {managementText.inviteTabLabel}
          </button>
          <button type="button" className={`btn ${editMode === "import" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => { resetImportState(); setEditMode("import"); }}>
            {managementText.importTabLabel}
          </button>
        </div>
      </div>
      <div className={classNames?.body ?? "card-body"}>
        {renderFeedback()}

        {editMode === "invite" && (
          <div className={classNames?.inviteCard ?? ""}>
            <h6>{managementText.inviteHeading}</h6>
            {inviteHelpContent}
            <div className="row g-3 mb-2">
              <div className="col-12 col-md-6">
                <label className="form-label">{managementText.firstNameLabel}</label>
                <input type="text" className="form-control" value={firstName} onChange={event => setFirstName(event.target.value)} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">{managementText.lastNameLabel}</label>
                <input type="text" className="form-control" value={lastName} onChange={event => setLastName(event.target.value)} />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">{managementText.emailAddressLabel}</label>
                <input type="email" className="form-control" value={email} onChange={event => setEmail(event.target.value)} />
              </div>
              {roleOptions.length > 0 && (
                <div className="col-12 col-md-6">
                  <label className="form-label">{managementText.roleLabel}</label>
                  <select className="form-select" value={role} onChange={event => setRole(event.target.value)}>
                    {roleOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-12">
                <label className="form-label">{managementText.optionalMessageLabel}</label>
                <textarea className="form-control" rows={3} value={message} onChange={event => setMessage(event.target.value)} />
              </div>
              {showCanChangeEmailAddress && (
                <div className="col-12">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="btInvitationCanChangeEmail"
                      checked={canChangeEmailAddress}
                      onChange={event => setCanChangeEmailAddress(event.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="btInvitationCanChangeEmail">
                      {managementText.canChangeEmailAddressLabel}
                    </label>
                  </div>
                  <div className="small text-muted mt-1">{managementText.canChangeEmailAddressDescription}</div>
                </div>
              )}
              <div className="col-12 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setEditMode("list")}>
                  {managementText.cancelLabel}
                </button>
                <button type="button" className="btn btn-primary" onClick={() => void submitInvite()}>
                  {managementText.sendInvitationLabel}
                </button>
              </div>
            </div>
          </div>
        )}

        {editMode === "import" && (
          <div className={classNames?.importCard ?? ""}>
            <h6>{importText.title}</h6>
            <div className="alert alert-info">
              {importHelpContent ?? importText.instructionsMessage}
            </div>

            <div className="mb-3">
              <label className="form-label">{importText.sharedMessageLabel}</label>
              <textarea className="form-control" rows={3} value={importMessage} onChange={event => setImportMessage(event.target.value)} />
            </div>

            <div className="mb-3">
              <input
                ref={importFileInputRef}
                type="file"
                className="d-none"
                accept=".xlsx,.xls,.csv"
                onChange={event => {
                  const file = event.target.files?.[0] ?? null;
                  setImportFile(file);
                  setImportFileName(file?.name ?? "");
                }}
              />
              <button type="button" className="btn btn-outline-primary" onClick={() => importFileInputRef.current?.click()}>
                {importText.chooseFileLabel}
              </button>
              <div className="small text-muted mt-2">{importFileName || importText.noFileChosenMessage}</div>
            </div>

            {invalidImportRows.length > 0 && (
              <div className="mb-3">
                <h6>{formatAuthText(importText.invalidRowsHeading, { count: invalidImportRows.length })}</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{importText.rowColumnLabel}</th>
                        <th>{managementText.nameColumnLabel}</th>
                        <th>{managementText.emailColumnLabel}</th>
                        <th>{importText.errorColumnLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invalidImportRows.slice(0, 25).map(row => (
                        <tr key={`invalid-${row.rowNumber}-${row.emailAddress}`}>
                          <td>{row.rowNumber}</td>
                          <td>{row.firstName} {row.lastName}</td>
                          <td>{row.emailAddress}</td>
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
                        <th>{managementText.nameColumnLabel}</th>
                        <th>{managementText.emailColumnLabel}</th>
                        <th>{managementText.roleColumnLabel}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 5).map(row => (
                        <tr key={`preview-${row.rowNumber}-${row.emailAddress}`}>
                          <td>{row.rowNumber}</td>
                          <td>{row.firstName} {row.lastName}</td>
                          <td>{row.emailAddress}</td>
                          <td>{row.roleLabel ?? row.role ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setEditMode("list")}>
                {managementText.cancelLabel}
              </button>
              <button type="button" className="btn btn-primary" disabled={importing} onClick={() => void sendImport()}>
                {importing ? importText.importingLabel : importText.importAndSendLabel}
              </button>
            </div>
          </div>
        )}

        {editMode === "list" && (
          <div className={classNames?.listCard ?? ""}>
            <div className="row g-2 mb-3">
              <div className="col-12 col-md-6">
                <input
                  type="text"
                  className="form-control"
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

            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>{managementText.nameColumnLabel}</th>
                    <th>{managementText.emailColumnLabel}</th>
                    <th>{managementText.roleColumnLabel}</th>
                    <th>{managementText.statusColumnLabel}</th>
                    <th>{managementText.invitationDateColumnLabel}</th>
                    <th>{managementText.expiryDateColumnLabel}</th>
                    <th>{managementText.actionsColumnLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7}>{managementText.loadingMessage}</td>
                    </tr>
                  )}
                  {!loading && items.length === 0 && (
                    <tr>
                      <td colSpan={7}>{managementText.noInvitationsMessage}</td>
                    </tr>
                  )}
                  {!loading && items.map(item => (
                    <Fragment key={item.id}>
                      <tr>
                        <td>{item.firstName} {item.lastName}</td>
                        <td>
                          {item.status === "accepted" && item.canChangeEmailAddress && item.acceptedEmailAddress && item.acceptedEmailAddress !== item.email ? (
                            <>
                              <div className="text-muted text-decoration-line-through">{item.email}</div>
                              <div>{item.acceptedEmailAddress}</div>
                            </>
                          ) : (
                            item.email
                          )}
                        </td>
                        <td>{item.roleLabel ?? item.role ?? ""}</td>
                        <td><span className={getStatusBadge(item.status)}>{statusLabel(item.status)}</span></td>
                        <td>{formatUtcDate(item.invitationDate)}</td>
                        <td>{formatUtcDate(item.expiryDate)}</td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group">
                            {(item.canCopyLink ?? true) && (
                              <button type="button" className="btn btn-outline-primary" onClick={() => void copyInviteLink(item)}>
                                {managementText.copyLinkLabel}
                              </button>
                            )}
                            {!!adapter.resendInvitation && (item.canResend ?? false) && (
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                disabled={actionInvitationId.length > 0}
                                onClick={() => void performAction(item.id, () => adapter.resendInvitation!(item.id), managementText.resendSuccessMessage, managementText.resendFailedMessage)}
                              >
                                {actionInvitationId === item.id ? managementText.resendingLabel : managementText.resendLabel}
                              </button>
                            )}
                            {!!adapter.cancelInvitation && (item.canCancel ?? false) && (
                              <button
                                type="button"
                                className="btn btn-outline-warning"
                                disabled={actionInvitationId.length > 0}
                                onClick={() => void performAction(item.id, () => adapter.cancelInvitation!(item.id), managementText.cancelSuccessMessage, managementText.cancelFailedMessage)}
                              >
                                {actionInvitationId === item.id ? managementText.cancellingInvitationLabel : managementText.cancelInvitationLabel}
                              </button>
                            )}
                            {!!adapter.removeInvitation && (item.canRemove ?? false) && (
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                disabled={actionInvitationId.length > 0}
                                onClick={() => void performAction(item.id, () => adapter.removeInvitation!(item.id), managementText.removeSuccessMessage, managementText.removeFailedMessage)}
                              >
                                {actionInvitationId === item.id ? managementText.removingInvitationLabel : managementText.removeInvitationLabel}
                              </button>
                            )}
                            {!!adapter.getInvitation && (item.canViewDetails ?? true) && (
                              <button type="button" className="btn btn-outline-secondary" onClick={() => void toggleDetails(item)}>
                                {expandedInvitationId === item.id ? managementText.hideDetailsLabel : managementText.detailsLabel}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedInvitationId === item.id && (
                        <tr>
                          <td colSpan={7} className="bg-body-tertiary">
                            {!expandedInvitation && <div>{managementText.detailsLoadingMessage}</div>}
                            {expandedInvitation && (
                              <div className="row">
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsGuidLabel}:</strong> {expandedInvitation.guid ?? "-"}</div>
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsInvitationKeyLabel}:</strong> {expandedInvitation.userInvitationKey ?? "-"}</div>
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsCanChangeEmailLabel}:</strong> {expandedInvitation.canChangeEmailAddress ? managementText.yesLabel : managementText.noLabel}</div>
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsAcceptedEmailLabel}:</strong> {expandedInvitation.acceptedEmailAddress ?? "-"}</div>
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsCreatedLabel}:</strong> {formatUtcDate(expandedInvitation.createdDate)}</div>
                                <div className="col-12 col-md-6 mb-1"><strong>{managementText.detailsUpdatedLabel}:</strong> {formatUtcDate(expandedInvitation.lastUpdatedDate)}</div>
                                <div className="col-12 mb-1"><strong>{managementText.detailsMessageLabel}:</strong> {expandedInvitation.message ?? "-"}</div>
                                <div className="col-12 mb-1"><strong>{managementText.detailsResponseMessageLabel}:</strong> {expandedInvitation.responseMessage ?? "-"}</div>
                                <div className="col-12 mb-1"><strong>{managementText.detailsInviteUrlLabel}:</strong> {adapter.buildInvitationUrl?.(expandedInvitation) ?? "-"}</div>
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

            <div className="d-flex justify-content-between align-items-center mt-3">
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
      </div>
    </div>
  );
}
