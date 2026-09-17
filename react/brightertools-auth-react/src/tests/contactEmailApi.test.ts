import { describe, expect, it, vi } from "vitest";
import { createAuthApi } from "../services/createAuthApi";

describe("contact-email API contract", () => {
  it.each(["selectNotificationEmail", "removeContactEmail"] as const)("posts %s with host credentials", async method => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { emails: [] } })));
    const api = createAuthApi({ baseUrl: "https://host.example/", apiPrefix: "/custom", getAccessToken: () => "token", fetcher });
    const response = await api[method]({ email: "contact@example.com" });
    expect(response.success).toBe(true);
    expect(fetcher).toHaveBeenCalledWith(
      "https://host.example/custom/account/contact-email/" + (method === "selectNotificationEmail" ? "select" : "remove"),
      expect.objectContaining({ method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
        body: JSON.stringify({ email: "contact@example.com" }) }));
  });

  it("honors custom endpoints and addOnly", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response('{"success":true}')));
    const api = createAuthApi({ fetcher, endpoints: {
      selectNotificationEmail: "/select", removeContactEmail: "/remove", beginNotificationEmailChange: "/verify"
    } });
    await api.selectNotificationEmail({ email: "a@example.com" });
    await api.removeContactEmail({ email: "a@example.com" });
    await api.beginNotificationEmailChange({ email: "a@example.com", addOnly: true });
    expect(fetcher.mock.calls.map(call => call[0])).toEqual(["/select", "/remove", "/verify"]);
    expect(JSON.parse(fetcher.mock.calls[2][1].body).addOnly).toBe(true);
  });

  it.each([401, 403, 500])("returns a failure envelope for HTTP %s", async status => {
    const onUnauthorized = vi.fn();
    const fetcher = vi.fn().mockResolvedValue(new Response('{"message":"Denied","code":"forbidden"}', { status }));
    const result = await createAuthApi({ fetcher, onUnauthorized }).removeContactEmail({ email: "a@example.com" });
    expect(result.success).toBe(false);
    expect(result.message).toBe(status === 500 ? "There was an error processing the request." : "Denied");
    expect(onUnauthorized).toHaveBeenCalledTimes(status === 401 ? 1 : 0);
  });

  it("handles network failures", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("offline"));
    expect((await createAuthApi({ fetcher }).selectNotificationEmail({ email: "a@example.com" })).success).toBe(false);
  });
});
