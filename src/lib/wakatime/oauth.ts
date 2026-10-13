import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { wakatimeOAuthCredentials } from "@/db/schema";
import { getServerEnv } from "@/lib/env";

const AUTHORIZE_URL = "https://wakatime.com/oauth/authorize";
const TOKEN_URL = "https://wakatime.com/oauth/token";
const REQUIRED_SCOPES = ["read_heartbeats", "read_summaries"] as const;
const STATE_MAX_AGE_SECONDS = 10 * 60;

type OAuthTokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

function tokenKey() {
  const value = getServerEnv().WAKATIME_TOKEN_ENCRYPTION_KEY;
  if (!value) {
    throw new Error("WAKATIME_TOKEN_ENCRYPTION_KEY is not configured.");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("WAKATIME_TOKEN_ENCRYPTION_KEY must decode to 32 bytes.");
  }
  return key;
}

function encryptTokens(tokens: OAuthTokens) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(tokens), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function decryptTokens(encrypted: string): OAuthTokens {
  const [version, encodedIv, encodedTag, encodedValue] = encrypted.split(".");
  if (version !== "v1" || !encodedIv || !encodedTag || !encodedValue) {
    throw new Error("The saved WakaTime connection is invalid.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    tokenKey(),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encodedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const parsed: unknown = JSON.parse(plaintext);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("access_token" in parsed) ||
    typeof parsed.access_token !== "string" ||
    !("refresh_token" in parsed) ||
    typeof parsed.refresh_token !== "string" ||
    !("expires_at" in parsed) ||
    typeof parsed.expires_at !== "number"
  ) {
    throw new Error("The saved WakaTime connection is invalid.");
  }
  return parsed as OAuthTokens;
}

function makeState() {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(24).toString("base64url");
  const payload = `${issuedAt}.${nonce}`;
  const signature = createHmac("sha256", tokenKey())
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function isValidWakaTimeOAuthState(state: string, cookieValue: string) {
  if (state !== cookieValue) return false;
  const [issuedAt, nonce, signature, extra] = state.split(".");
  if (!issuedAt || !nonce || !signature || extra) return false;
  const issuedAtSeconds = Number(issuedAt);
  const age = Math.floor(Date.now() / 1000) - issuedAtSeconds;
  if (
    !Number.isInteger(issuedAtSeconds) ||
    age < 0 ||
    age > STATE_MAX_AGE_SECONDS
  ) {
    return false;
  }
  const expected = createHmac("sha256", tokenKey())
    .update(`${issuedAt}.${nonce}`)
    .digest();
  const received = Buffer.from(signature, "base64url");
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

function oauthConfig() {
  const env = getServerEnv();
  const clientId = env.WAKATIME_CLIENT_ID;
  const clientSecret = env.WAKATIME_CLIENT_SECRET;
  const redirectUri = env.WAKATIME_OAUTH_REDIRECT_URI;
  const encryptionKey = env.WAKATIME_TOKEN_ENCRYPTION_KEY;
  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) {
    throw new Error("WakaTime OAuth is not fully configured.");
  }
  return {
    WAKATIME_CLIENT_ID: clientId,
    WAKATIME_CLIENT_SECRET: clientSecret,
    WAKATIME_OAUTH_REDIRECT_URI: redirectUri,
    WAKATIME_TOKEN_ENCRYPTION_KEY: encryptionKey,
  };
}

export function createWakaTimeAuthorizationUrl() {
  const env = oauthConfig();
  const state = makeState();
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: env.WAKATIME_CLIENT_ID,
    response_type: "code",
    redirect_uri: env.WAKATIME_OAUTH_REDIRECT_URI,
    scope: REQUIRED_SCOPES.join(" "),
    state,
  }).toString();
  return { state, url };
}

async function exchangeToken(body: URLSearchParams): Promise<OAuthTokens> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(
      `WakaTime OAuth token exchange failed (${response.status}).`,
    );
  }
  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("access_token" in payload) ||
    typeof payload.access_token !== "string" ||
    !payload.access_token ||
    !("expires_in" in payload) ||
    typeof payload.expires_in !== "number" ||
    !Number.isFinite(payload.expires_in) ||
    payload.expires_in <= 0
  ) {
    throw new Error("WakaTime returned an invalid OAuth token response.");
  }
  const previousRefresh =
    "refresh_token" in payload && typeof payload.refresh_token === "string"
      ? payload.refresh_token
      : null;
  return {
    access_token: payload.access_token,
    refresh_token: previousRefresh ?? "",
    expires_at: Date.now() + payload.expires_in * 1_000,
  };
}

export async function completeWakaTimeOAuth(code: string) {
  const env = oauthConfig();
  const form = new URLSearchParams({
    client_id: env.WAKATIME_CLIENT_ID,
    client_secret: env.WAKATIME_CLIENT_SECRET,
    redirect_uri: env.WAKATIME_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
    code,
  });
  const tokens = await exchangeToken(form);
  if (!tokens.refresh_token) {
    throw new Error("WakaTime did not return a refresh token.");
  }
  const encryptedTokens = encryptTokens(tokens);
  await getDb()
    .insert(wakatimeOAuthCredentials)
    .values({
      id: 1,
      encryptedTokens,
      scopes: [...REQUIRED_SCOPES],
    })
    .onConflictDoUpdate({
      target: wakatimeOAuthCredentials.id,
      set: {
        encryptedTokens,
        scopes: [...REQUIRED_SCOPES],
        updatedAt: new Date(),
      },
    });
}

async function readStoredTokens() {
  const rows = await getDb()
    .select({ encryptedTokens: wakatimeOAuthCredentials.encryptedTokens })
    .from(wakatimeOAuthCredentials)
    .where(eq(wakatimeOAuthCredentials.id, 1))
    .limit(1);
  const encryptedTokens = rows[0]?.encryptedTokens;
  return encryptedTokens ? decryptTokens(encryptedTokens) : null;
}

async function saveTokens(tokens: OAuthTokens) {
  await getDb()
    .update(wakatimeOAuthCredentials)
    .set({ encryptedTokens: encryptTokens(tokens), updatedAt: new Date() })
    .where(eq(wakatimeOAuthCredentials.id, 1));
}

export async function getWakaTimeAccessToken() {
  const env = getServerEnv();
  if (
    !env.WAKATIME_CLIENT_ID ||
    !env.WAKATIME_CLIENT_SECRET ||
    !env.WAKATIME_OAUTH_REDIRECT_URI ||
    !env.WAKATIME_TOKEN_ENCRYPTION_KEY
  ) {
    return null;
  }
  const tokens = await readStoredTokens();
  if (!tokens) return null;
  if (tokens.expires_at > Date.now() + 60_000) return tokens.access_token;

  const form = new URLSearchParams({
    client_id: env.WAKATIME_CLIENT_ID,
    client_secret: env.WAKATIME_CLIENT_SECRET,
    redirect_uri: env.WAKATIME_OAUTH_REDIRECT_URI,
    grant_type: "refresh_token",
    refresh_token: tokens.refresh_token,
  });
  const refreshed = await exchangeToken(form);
  if (!refreshed.refresh_token) refreshed.refresh_token = tokens.refresh_token;
  await saveTokens(refreshed);
  return refreshed.access_token;
}

export async function isWakaTimeConnected() {
  const env = getServerEnv();
  if (
    !env.WAKATIME_CLIENT_ID ||
    !env.WAKATIME_CLIENT_SECRET ||
    !env.WAKATIME_OAUTH_REDIRECT_URI ||
    !env.WAKATIME_TOKEN_ENCRYPTION_KEY
  ) {
    return false;
  }
  return Boolean(await readStoredTokens());
}
