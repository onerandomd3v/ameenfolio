import "server-only";

import { getServerEnv } from "@/lib/env";
import { buildIndexNowPayload } from "@/lib/indexnow-payload";
import { logServer } from "@/lib/logger";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const REQUEST_TIMEOUT_MS = 5_000;

/**
 * IndexNow is an availability hint, never part of the content transaction.
 * Failures are logged for operations work but deliberately do not reject the
 * admin mutation that caused the notification.
 */
export async function notifyIndexNow(urls: Iterable<string>) {
  const payload = buildIndexNowPayload(
    getServerEnv().CANONICAL_SITE_URL,
    urls,
  );
  if (!payload) return;

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`IndexNow returned HTTP ${response.status}.`);
    }

    logServer("info", "indexnow.submitted", {
      count: payload.urlList.length,
      status: response.status,
    });
  } catch (error) {
    logServer("warn", "indexnow.submit_failed", {
      error: String(error),
      count: payload.urlList.length,
    });
  }
}
