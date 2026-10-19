import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { createWakaTimeAuthorizationUrl } from "@/lib/wakatime/oauth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await requireAdmin();
  const { state, url } = createWakaTimeAuthorizationUrl();
  const response = NextResponse.redirect(url);
  response.cookies.set("wakatime_oauth_state", state, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/api/admin/wakatime/oauth",
    maxAge: 10 * 60,
  });
  return response;
}
