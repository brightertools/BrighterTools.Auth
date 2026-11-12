import type { InvitationOperationResult } from './types/invitations.js';

/** Read only deliberate API error contracts; never surface exception/HTML bodies. */
export function invitationHttpFailure(error: unknown, fallback: string): InvitationOperationResult<void> {
  const response = (error as { response?: { status?: number; data?: unknown } } | null)?.response;
  const status = response?.status;
  const data = response?.data as { messages?: unknown; errors?: unknown; traceId?: unknown } | undefined;
  if (status === 401) return { success: false, messages: ['Your session has expired. Sign in again to continue.'] };
  if (status === 403) return { success: false, messages: ['You no longer have permission to manage invitations in this account.'] };
  if (status === 404) return { success: false, messages: ['This invitation is no longer available. Refresh the list.'] };
  if (status === 429) return { success: false, messages: ['Too many requests. Please wait before trying again.'] };
  if (status === 400 || status === 409 || status === 422) {
    const values = Array.isArray(data?.messages) ? data.messages
      : data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat() : [];
    const messages = values.filter((v): v is string => typeof v === 'string' && v.length > 0 && v.length <= 500).slice(0, 5);
    if (messages.length) return { success: false, messages };
  }
  const reference = typeof data?.traceId === 'string' && /^[a-zA-Z0-9:_-]{1,100}$/.test(data.traceId) ? data.traceId : undefined;
  return { success: false, messages: [fallback + (reference ? ` Reference: ${reference}` : '')] };
}
