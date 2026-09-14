import { NextResponse } from "next/server";
import { getPublicWakaTimeStatus } from "@/lib/wakatime/server";

export const runtime = "nodejs";

export async function GET() {
  const status = await getPublicWakaTimeStatus();
  return NextResponse.json(status, {
    headers: {
      // Presence is time-sensitive. Browser requests already use no-store,
      // and the edge must not replay an older coding state after a tab wakes.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
