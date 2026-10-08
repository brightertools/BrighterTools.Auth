import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, type AuthContextValue } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";
import { createAuthApi, type AuthApiClient } from "../services/createAuthApi";
import type { AuthSession } from "../types/auth";

const token = (seconds = 300, name = "user") => `e30.${btoa(JSON.stringify({ exp: Date.now() / 1000 + seconds, sub: name }))}.sig`;
const session = (seconds = 300): AuthSession => ({ accessToken: token(seconds), refreshToken: "refresh", expiresAtUtc: "" });
let context: AuthContextValue;
function Probe() { context = useAuth(); return <span>{context.isAuthenticated ? "signed in" : "expired"}</span>; }
function mount(refresh = vi.fn(), initial = session()) {
  let stored: AuthSession | null = initial;
  const storage = { get: () => stored, set: vi.fn((next: AuthSession | null) => { stored = next; }) };
  const api = { refresh, logout: vi.fn(async () => ({ success: true })) } as unknown as AuthApiClient;
  const unauthorized = vi.fn();
  const view = render(<AuthProvider api={api} storage={storage} onUnauthorized={unauthorized} mapUser={() => ({ id: 1 })}><Probe /></AuthProvider>);
  return { storage, refresh, unauthorized, ...view };
}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-08T12:00:00Z")); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("refresh resilience", () => {
  it.each([0, 408, 429, 500, 502, 503, 504])("retains a valid session after HTTP %s and recovers", async httpStatus => {
    const replacement = session(900);
    const setup = mount(vi.fn().mockResolvedValueOnce({ success: false, httpStatus }).mockResolvedValue({ success: true, data: { session: replacement } }));
    await act(async () => { await context.refreshSession(); });
    expect(setup.storage.get()).not.toBeNull(); expect(context.isAuthenticated).toBe(true); expect(setup.unauthorized).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(setup.storage.get()).toEqual(replacement);
  });
  it("retains the refresh session but expires access and stops bounded retries", async () => {
    const setup = mount(vi.fn().mockRejectedValue(new TypeError("connection reset")), session(2));
    await act(async () => { await context.refreshSession(); await vi.advanceTimersByTimeAsync(180_000); });
    expect(setup.refresh).toHaveBeenCalledTimes(6);
    expect(context.isAuthenticated).toBe(false); expect(context.user).toBeNull(); expect(setup.storage.get()).not.toBeNull();
    await act(async () => { window.dispatchEvent(new Event("online")); });
    expect(setup.refresh).toHaveBeenCalledTimes(7);
  });
  it("honours Retry-After even on focus/online", async () => {
    const setup = mount(vi.fn().mockResolvedValue({ success: false, httpStatus: 429, retryAfterMs: 60_000 }));
    await act(async () => { await context.refreshSession(); await vi.advanceTimersByTimeAsync(59_000); window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("online")); });
    expect(setup.refresh).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(setup.refresh).toHaveBeenCalledTimes(2);
  });
  it.each([{ success: false, httpStatus: 401 }, { success: false, code: "invalid_refresh_token" }])("clears a definitively rejected session", async response => {
    const setup = mount(vi.fn().mockResolvedValue(response));
    await act(async () => { await context.refreshSession(); });
    expect(setup.storage.get()).toBeNull(); expect(setup.unauthorized).toHaveBeenCalledOnce();
  });
  it("does not treat generic validation or forbidden responses as a revoked refresh token", async () => {
    const setup = mount(vi.fn().mockResolvedValue({ success: false, httpStatus: 403 }));
    await act(async () => { await context.refreshSession(); });
    expect(setup.storage.get()).not.toBeNull();
  });
  it.each(["logout", "tenant", "storage", "unmount"])("ignores a late response after %s", async action => {
    let resolve!: (value: unknown) => void;
    const setup = mount(vi.fn(() => new Promise(r => { resolve = r; })));
    let task!: Promise<boolean>;
    await act(async () => { task = context.refreshSession(); await Promise.resolve(); });
    const replacement = session(800);
    await act(async () => {
      if (action === "logout") await context.logout();
      if (action === "tenant") context.setAuthenticatedSession(replacement);
      if (action === "storage") { setup.storage.set(replacement); window.dispatchEvent(new StorageEvent("storage", { key: "bt.auth.session" })); }
      if (action === "unmount") setup.unmount();
    });
    const before = setup.storage.get();
    await act(async () => { resolve({ success: true, data: { session: session(1000) } }); await task; });
    expect(setup.storage.get()).toEqual(before);
  });
  it("coalesces concurrent requests and keeps a valid form visible during refresh", async () => {
    let resolve!: (value: unknown) => void;
    const setup = mount(vi.fn(() => new Promise(r => { resolve = r; })));
    let first!: Promise<boolean>, second!: Promise<boolean>;
    await act(async () => { first = context.refreshSession(); second = context.refreshSession(); await Promise.resolve(); });
    expect(first).toBe(second); expect(setup.refresh).toHaveBeenCalledOnce(); expect(context.loading).toBe(false);
    await act(async () => { resolve({ success: true, data: { session: session(900) } }); await first; });
  });
  it("uses the session rotated by another tab while waiting for Web Locks", async () => {
    let enter!: () => Promise<boolean>;
    vi.stubGlobal("navigator", { locks: { request: vi.fn((_name, callback) => new Promise(resolve => { enter = async () => { const result = await callback(); resolve(result); return result; }; })) } });
    const setup = mount(vi.fn());
    await act(async () => { void context.refreshSession(); await Promise.resolve(); });
    const rotated = session(900); setup.storage.set(rotated);
    await act(async () => { await enter(); });
    expect(setup.refresh).not.toHaveBeenCalled(); expect(context.session).toEqual(rotated);
  });
});

describe("transport metadata", () => {
  it("preserves HTTP status and Retry-After without invoking the refresh unauthorized callback", async () => {
    const unauthorized = vi.fn();
    const api = createAuthApi({ onUnauthorized: unauthorized, fetcher: vi.fn(async () => new Response('{"success":false}', { status: 429, headers: { "Retry-After": "60" } })) });
    expect(await api.refresh({ refreshToken: "test" })).toMatchObject({ httpStatus: 429, retryAfterMs: 60_000 });
    expect(unauthorized).not.toHaveBeenCalled();
  });
  it("bounds a hung refresh and classifies timeout as transient", async () => {
    const api = createAuthApi({ requestTimeoutMs: 1000, fetcher: vi.fn((_url, options) => new Promise((_resolve, reject) => { options?.signal?.addEventListener("abort", () => reject(new Error("timeout"))); })) });
    const pending = api.refresh({ refreshToken: "test" });
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toMatchObject({ success: false, httpStatus: 0 });
  });
});
