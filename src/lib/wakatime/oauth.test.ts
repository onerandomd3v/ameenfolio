import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createWakaTimeAuthorizationUrl,
  isValidWakaTimeOAuthState,
} from "@/lib/wakatime/oauth";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("WakaTime OAuth authorization", () => {
  it("requests only read scopes and issues a signed, short-lived state", () => {
    vi.stubEnv("WAKATIME_CLIENT_ID", "client-id");
    vi.stubEnv("WAKATIME_CLIENT_SECRET", "client-secret");
    vi.stubEnv(
      "WAKATIME_OAUTH_REDIRECT_URI",
      "https://admin.example.com/api/admin/wakatime/oauth/callback",
    );
    vi.stubEnv(
      "WAKATIME_TOKEN_ENCRYPTION_KEY",
      Buffer.alloc(32, 7).toString("base64"),
    );

    const { state, url } = createWakaTimeAuthorizationUrl();

    expect(url.origin + url.pathname).toBe(
      "https://wakatime.com/oauth/authorize",
    );
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://admin.example.com/api/admin/wakatime/oauth/callback",
    );
    expect(url.searchParams.get("scope")).toBe(
      "read_heartbeats read_summaries email",
    );
    expect(isValidWakaTimeOAuthState(state, state)).toBe(true);
    expect(isValidWakaTimeOAuthState(state, "different-cookie-value")).toBe(
      false,
    );
  });

  it("rejects expired OAuth state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-13T12:00:00.000Z"));
    vi.stubEnv("WAKATIME_CLIENT_ID", "client-id");
    vi.stubEnv("WAKATIME_CLIENT_SECRET", "client-secret");
    vi.stubEnv(
      "WAKATIME_OAUTH_REDIRECT_URI",
      "https://admin.example.com/api/admin/wakatime/oauth/callback",
    );
    vi.stubEnv(
      "WAKATIME_TOKEN_ENCRYPTION_KEY",
      Buffer.alloc(32, 7).toString("base64"),
    );

    const { state } = createWakaTimeAuthorizationUrl();
    vi.advanceTimersByTime(10 * 60 * 1_000 + 1_001);

    expect(isValidWakaTimeOAuthState(state, state)).toBe(false);
  });
});
