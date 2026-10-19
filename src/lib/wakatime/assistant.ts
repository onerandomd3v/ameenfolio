import "server-only";

import { getPublicWakaTimeStatus } from "@/lib/wakatime/server";
import { isWakaTimeConnected } from "@/lib/wakatime/oauth";
import {
  currentCodingActivityView,
  weeklyCodingActivityView,
} from "@/lib/wakatime/assistant-view";

export async function getCurrentCodingActivityForBippy() {
  const configured = await isWakaTimeConnected().catch(() => false);
  return currentCodingActivityView(await getPublicWakaTimeStatus(), configured);
}

export async function getWeeklyCodingActivityForBippy() {
  const configured = await isWakaTimeConnected().catch(() => false);
  return weeklyCodingActivityView(await getPublicWakaTimeStatus(), configured);
}
