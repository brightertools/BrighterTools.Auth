import type { AuthApiClient } from "./createAuthApi";
import type { TokenStorage } from "./tokenStorage";
import type { AuthSession } from "../types/auth";

export function sessionExpiresAt(session: AuthSession | null): number {
  try {
    const raw = session?.accessToken?.split(".")[1];
    if (!raw) return 0;
    const payload = JSON.parse(atob(raw.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 : 0;
  } catch { return 0; }
}
const same = (a: AuthSession | null, b: AuthSession | null) => a?.accessToken === b?.accessToken && a?.refreshToken === b?.refreshToken;
export interface SessionCoordinatorOptions {
  storageKey?: string;
  refreshEarlyMs?: number;
  clockSkewMs?: number;
  refreshRetryDelaysMs?: readonly number[];
  onUnauthorized?: () => void;
}

// Framework-neutral session lifecycle shared by React and standalone application surfaces.
export function createSessionCoordinator(api: AuthApiClient, storage: TokenStorage, options: SessionCoordinatorOptions = {}) {
  const key = options.storageKey ?? "bt.auth.session";
  const retryDelays = options.refreshRetryDelaysMs ?? [1000, 5000, 15000, 30000, 60000];
  const early = (options.refreshEarlyMs ?? 60000) + (options.clockSkewMs ?? 30000);
  let snapshot = { session: storage.get(), loading: false, now: Date.now() };
  let generation = 0, retry = 0, retryAt = 0, failed = false, running = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  let inFlight: Promise<boolean> | undefined;
  const listeners = new Set<() => void>();
  const emit = () => { snapshot = { ...snapshot, now: Date.now() }; listeners.forEach(fn => fn()); };
  const clear = () => { clearTimeout(timer); clearTimeout(expiryTimer); };
  const locked = <T>(work: () => Promise<T>): Promise<T> => typeof navigator !== "undefined" && navigator.locks
    ? navigator.locks.request(`brightertools-refresh:${key}`, work) : work();
  const schedule = () => {
    clear();
    if (!running || !snapshot.session) return;
    const remaining = sessionExpiresAt(snapshot.session) - Date.now();
    timer = setTimeout(() => void refresh(), Math.min(2147483647, Math.max(5000, remaining - early)));
    if (remaining > 0) expiryTimer = setTimeout(emit, Math.min(2147483647, remaining));
  };
  const adopt = (session: AuthSession | null, write: boolean) => {
    generation++; retry = 0; failed = false;
    snapshot = { session, loading: false, now: Date.now() };
    if (write) storage.set(session);
    schedule(); emit();
  };
  const defer = (minimum = 0) => {
    failed = true;
    const delay = retryDelays[retry++];
    retryAt = Date.now() + Math.max(delay ?? 30000, minimum, 1000);
    if (running && delay !== undefined) timer = setTimeout(() => void refresh(), Math.min(2147483647, retryAt - Date.now()));
    emit();
  };
  function refresh(tenantId?: string, switchToCurrentTenant = false): Promise<boolean> {
    if (inFlight) return inFlight;
    clearTimeout(timer);
    const original = snapshot.session, revision = generation;
    const valid = () => running && revision === generation;
    const task = locked(async () => {
      if (!valid()) return false;
      const stored = storage.get();
      if (!same(stored, original)) { adopt(stored, false); return sessionExpiresAt(stored) > Date.now(); }
      if (!stored) return false;
      snapshot = { ...snapshot, loading: sessionExpiresAt(stored) <= Date.now() }; emit();
      try {
        const response = await api.refresh({ refreshToken: stored.refreshToken ?? "", tenantId, switchToCurrentTenant });
        if (!valid()) return false;
        if (!same(storage.get(), stored)) { adopt(storage.get(), false); return false; }
        if (response.success && response.data?.session && sessionExpiresAt(response.data.session) > Date.now()) {
          adopt(response.data.session, true); return true;
        }
        const transient = response.httpStatus === 0 || response.httpStatus === 408 || response.httpStatus === 429 || (response.httpStatus ?? 0) >= 500;
        if (!transient && (response.httpStatus === 401 || ["invalid_refresh_token", "refresh_token_expired", "refresh_token_revoked", "session_revoked"].includes(response.code ?? ""))) {
          adopt(null, true); options.onUnauthorized?.(); return false;
        }
        defer(response.retryAfterMs);
      } catch { if (valid()) defer(); }
      finally { if (running) { snapshot = { ...snapshot, loading: false }; emit(); } }
      return false;
    }).catch(() => { if (valid()) defer(); return false; }).finally(() => { if (inFlight === task) inFlight = undefined; });
    inFlight = task;
    return task;
  }
  const onStorage = (event: StorageEvent) => { if (event.key === key) adopt(storage.get(), false); };
  const resume = () => {
    if (!snapshot.session || document.visibilityState === "hidden") return;
    if (failed && Date.now() >= retryAt || !failed && sessionExpiresAt(snapshot.session) - Date.now() <= early) {
      retry = 0; void refresh();
    }
  };
  return {
    getSnapshot: () => snapshot,
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    setSession(session: AuthSession | null) { adopt(session, true); },
    refresh,
    async ensureSession() {
      if (!same(storage.get(), snapshot.session)) adopt(storage.get(), false);
      return sessionExpiresAt(snapshot.session) - Date.now() > early || await refresh();
    },
    async authenticate(operation: () => Promise<AuthSession>) {
      return locked(async () => {
        const revision = ++generation;
        clear();
        try {
          const session = await operation();
          if (running && revision === generation) adopt(session, true);
        } catch (error) {
          if (running && revision === generation) schedule();
          throw error;
        }
      });
    },
    async logout() {
      const old = snapshot.session;
      adopt(null, true);
      // Wait for any cross-window rotation before sending the latest HttpOnly cookie.
      await locked(async () => { try { await api.logout(old?.refreshToken ? { refreshToken: old.refreshToken } : undefined); } catch { /* Locally signed out. */ } });
    },
    start() {
      if (running) return;
      running = true; adopt(storage.get(), false);
      globalThis.addEventListener?.("storage", onStorage);
      globalThis.addEventListener?.("focus", resume);
      globalThis.addEventListener?.("online", resume);
      globalThis.document?.addEventListener("visibilitychange", resume);
      resume();
    },
    stop() {
      running = false; generation++; clear();
      globalThis.removeEventListener?.("storage", onStorage);
      globalThis.removeEventListener?.("focus", resume);
      globalThis.removeEventListener?.("online", resume);
      globalThis.document?.removeEventListener("visibilitychange", resume);
    }
  };
}
