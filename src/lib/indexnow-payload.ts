export const INDEXNOW_KEY = "4601385f8b6c4051be1fc08c153646b8";
export const INDEXNOW_KEY_PATH = "/indexnow-key.txt";

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

/**
 * Builds the public IndexNow payload and rejects URLs outside the canonical
 * origin. Keeping this pure makes the protocol boundary straightforward to
 * test without making real search-engine requests.
 */
export function buildIndexNowPayload(
  canonicalSiteUrl: string,
  urls: Iterable<string>,
): IndexNowPayload | null {
  const origin = new URL(canonicalSiteUrl);

  // Local saves and previews must never notify search engines.
  if (
    origin.protocol !== "https:" ||
    origin.hostname === "localhost" ||
    origin.hostname === "127.0.0.1"
  ) {
    return null;
  }

  const urlList = Array.from(
    new Set(
      Array.from(urls).flatMap((value) => {
        try {
          const url = new URL(value, origin);
          if (url.origin !== origin.origin) return [];
          url.hash = "";
          return [url.toString()];
        } catch {
          return [];
        }
      }),
    ),
  );

  if (!urlList.length) return null;

  return {
    host: origin.host,
    key: INDEXNOW_KEY,
    keyLocation: new URL(INDEXNOW_KEY_PATH, origin).toString(),
    urlList,
  };
}
