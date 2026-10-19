import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/server";
import { adminHref } from "@/lib/admin-path";
import { logServer } from "@/lib/logger";
import {
  completeWakaTimeOAuth,
  isValidWakaTimeOAuthState,
} from "@/lib/wakatime/oauth";

export const runtime = "nodejs";

async function settingsRedirect(
  request: Request,
  status: "connected" | "error",
) {
  const path = await adminHref(`/settings?wakatime=${status}`);
  return NextResponse.redirect(new URL(path, request.url));
}

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const state = url.searchParams.get("state") ?? "";
  const stateCookie = cookieStore.get("wakatime_oauth_state")?.value ?? "";
  const response = await (async () => {
    if (
      !state ||
      !isValidWakaTimeOAuthState(state, stateCookie) ||
      url.searchParams.has("error")
    ) {
      logServer("warn", "wakatime.oauth_callback_rejected", {
        reason:
          url.searchParams.get("error") ?? "invalid_state_or_missing_state",
      });
      return settingsRedirect(request, "error");
    }

    const code = url.searchParams.get("code");
    if (!code) {
      return settingsRedirect(request, "error");
    }

    try {
      await completeWakaTimeOAuth(code);
      return settingsRedirect(request, "connected");
    } catch (error) {
      logServer("error", "wakatime.oauth_callback_failed", {
        error: String(error),
      });
      return settingsRedirect(request, "error");
    }
  })();

  response.cookies.set("wakatime_oauth_state", "", {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/api/admin/wakatime/oauth",
    maxAge: 0,
  });
  return response;
}
