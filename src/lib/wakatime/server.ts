import "server-only";

import { logServer } from "@/lib/logger";
import {
  getWakaTimeAccessToken,
  getWakaTimeConnectionVersion,
} from "@/lib/wakatime/oauth";
import {
  getSundayWeekDates,
  getWakaTimeHeartbeatDate,
  getWakaTimeTimeZone,
  inactiveWakaTimeStatus,
  isRecentWakaTimeHeartbeat,
  retainLastKnownWakaTimeStats,
  toPublicWakaTimeHistory,
  toPublicWakaTimeStatus,
  type PublicWakaTimeHistory,
  type PublicWakaTimeStatus,
  type WakaTimeHistoryMode,
} from "@/lib/wakatime/status";

const WAKATIME_API_URL = "https://wakatime.com/api/v1/users/current";
const WAKATIME_TODAY_URL = `${WAKATIME_API_URL}/status_bar/today`;
const REQUEST_TIMEOUT_MS = 8_000;
// Keep this shorter than the client poll interval so a scheduled poll does
// not routinely receive the same cached presence window twice.
const STATUS_CACHE_MS = 15_000;
const HISTORY_CACHE_MAX_ENTRIES = 64;

type CachedStatus = {
  connectionVersion: string;
  value: PublicWakaTimeStatus;
  expiresAt: number;
};
type CachedHistory = { value: PublicWakaTimeHistory; expiresAt: number };

let cachedStatus: CachedStatus | null = null;
let inFlight: {
  connectionVersion: string;
  promise: Promise<PublicWakaTimeStatus>;
} | null = null;
let activeConnectionVersion: string | null = null;
let lastCompleteStatus: CachedStatus | null = null;
let lastKnownTimeZone = "UTC";
const historyCache = new Map<string, CachedHistory>();

export function invalidateWakaTimeCaches() {
  cachedStatus = null;
  inFlight = null;
  lastCompleteStatus = null;
  activeConnectionVersion = null;
  lastKnownTimeZone = "UTC";
  historyCache.clear();
}

async function getJson(response: Response, endpoint: string) {
  if (!response.ok) {
    throw new Error(`WakaTime ${endpoint} responded ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

export async function fetchWakaTimeStatus(
  accessToken: string,
  now = new Date(),
  connectionVersion?: string,
): Promise<PublicWakaTimeStatus> {
  const authorization = `Bearer ${accessToken}`;
  const request = (url: string) =>
    fetch(url, {
      headers: { authorization, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  const userResponse = await request(WAKATIME_API_URL);
  const userPayload = await getJson(userResponse, "user endpoint");
  if (
    connectionVersion === undefined ||
    connectionVersion === activeConnectionVersion
  ) {
    lastKnownTimeZone = getWakaTimeTimeZone(userPayload);
  }
  const heartbeatDate = getWakaTimeHeartbeatDate(userPayload, now);
  const weekStartDate = getSundayWeekDates(heartbeatDate)[0] ?? heartbeatDate;
  const heartbeatsUrl = `${WAKATIME_API_URL}/heartbeats?date=${heartbeatDate}`;
  const summariesUrl = `${WAKATIME_API_URL}/summaries?start=${weekStartDate}&end=${heartbeatDate}`;
  const [todayResult, heartbeatsResult, summariesResult] = await Promise.all([
    request(WAKATIME_TODAY_URL).catch(() => null),
    request(heartbeatsUrl).catch(() => null),
    request(summariesUrl).catch(() => null),
  ]);
  const readJson = async (result: Response | null) => {
    if (!result?.ok) return null;
    return result.json().catch(() => null) as Promise<unknown>;
  };
  const [todayPayload, heartbeatsPayload, summariesPayload] = await Promise.all(
    [
      readJson(todayResult),
      readJson(heartbeatsResult),
      readJson(summariesResult),
    ],
  );

  return toPublicWakaTimeStatus(
    userPayload,
    todayPayload,
    heartbeatsPayload,
    summariesPayload,
    now,
  );
}

export async function fetchWakaTimeHistory(
  accessToken: string,
  mode: WakaTimeHistoryMode,
  startDate: string,
  endDate: string,
) {
  const authorization = `Bearer ${accessToken}`;
  const response = await fetch(
    `${WAKATIME_API_URL}/summaries?start=${startDate}&end=${endDate}`,
    {
      headers: { authorization, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
  const payload = await getJson(response, "history summaries endpoint");
  return toPublicWakaTimeHistory(payload, mode, startDate, endDate);
}

export async function getPublicWakaTimeHistory(
  mode: WakaTimeHistoryMode,
  startDate: string,
  endDate: string,
) {
  const connectionVersion = await getWakaTimeConnectionVersion();
  if (!connectionVersion) {
    throw new Error("WakaTime is not connected");
  }

  const cacheKey = `${connectionVersion}:${mode}:${startDate}:${endDate}`;
  const cached = historyCache.get(cacheKey);
  if (cached) {
    if (cached.expiresAt > Date.now()) return cached.value;
    historyCache.delete(cacheKey);
  }

  try {
    const accessToken = await getWakaTimeAccessToken();
    if (!accessToken) throw new Error("WakaTime is not connected");
    const value = await fetchWakaTimeHistory(
      accessToken,
      mode,
      startDate,
      endDate,
    );
    // The route is public and takes any anchor back to 2015, so one entry per
    // distinct range would grow for the life of the process. Map iterates in
    // insertion order, making the first key the oldest write.
    if (historyCache.size >= HISTORY_CACHE_MAX_ENTRIES) {
      const oldestKey = historyCache.keys().next().value;
      if (oldestKey !== undefined) historyCache.delete(oldestKey);
    }
    historyCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + 60 * 60 * 1_000,
    });
    return value;
  } catch (error) {
    logServer("warn", "wakatime.history_fetch_failed", {
      mode,
      startDate,
      endDate,
      error: String(error),
    });
    throw error;
  }
}

async function refreshWakaTimeStatus(connectionVersion: string) {
  const now = new Date();
  try {
    const accessToken = await getWakaTimeAccessToken();
    if (!accessToken) return inactiveWakaTimeStatus(now);
    const fresh = await fetchWakaTimeStatus(
      accessToken,
      now,
      connectionVersion,
    );
    if (connectionVersion !== activeConnectionVersion) {
      return inactiveWakaTimeStatus(now);
    }
    if (!fresh.statsStale) {
      lastCompleteStatus = {
        connectionVersion,
        value: fresh,
        expiresAt: 0,
      };
      return fresh;
    }
    return lastCompleteStatus
      ? retainLastKnownWakaTimeStats(fresh, lastCompleteStatus.value)
      : fresh;
  } catch (error) {
    logServer("warn", "wakatime.status_fetch_failed", {
      error: String(error),
    });
    if (
      connectionVersion !== activeConnectionVersion ||
      !lastCompleteStatus ||
      lastCompleteStatus.connectionVersion !== connectionVersion
    ) {
      return inactiveWakaTimeStatus(now);
    }

    const emptyCurrentStatus: PublicWakaTimeStatus = {
      ...inactiveWakaTimeStatus(now),
      isCoding: isRecentWakaTimeHeartbeat(
        lastCompleteStatus.value.lastActiveAt,
        now.getTime(),
      ),
      todayDate: getWakaTimeHeartbeatDate(
        { data: { timezone: lastKnownTimeZone } },
        now,
      ),
      lastActiveAt: lastCompleteStatus.value.lastActiveAt,
    };

    return retainLastKnownWakaTimeStats(
      emptyCurrentStatus,
      lastCompleteStatus.value,
    );
  }
}

export async function getPublicWakaTimeStatus() {
  const connectionVersion = await getWakaTimeConnectionVersion().catch(
    () => null,
  );
  if (!connectionVersion) {
    invalidateWakaTimeCaches();
    return inactiveWakaTimeStatus(new Date());
  }
  if (activeConnectionVersion !== connectionVersion) {
    invalidateWakaTimeCaches();
    activeConnectionVersion = connectionVersion;
  }
  const now = Date.now();
  if (
    cachedStatus?.connectionVersion === connectionVersion &&
    cachedStatus.expiresAt > now
  ) {
    return cachedStatus.value;
  }

  if (inFlight?.connectionVersion !== connectionVersion) {
    const promise = refreshWakaTimeStatus(connectionVersion)
      .then((value) => {
        if (activeConnectionVersion === connectionVersion) {
          cachedStatus = {
            connectionVersion,
            value,
            expiresAt: Date.now() + STATUS_CACHE_MS,
          };
        }
        return value;
      })
      .finally(() => {
        if (inFlight?.promise === promise) inFlight = null;
      });
    inFlight = { connectionVersion, promise };
  }

  return inFlight.promise;
}
