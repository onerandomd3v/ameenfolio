import { describe, expect, it } from "vitest";
import { buildIndexNowPayload, INDEXNOW_KEY } from "@/lib/indexnow-payload";

describe("IndexNow payload", () => {
  it("normalizes, deduplicates and limits URLs to the canonical origin", () => {
    expect(
      buildIndexNowPayload("https://onerandomdev.cv", [
        "/writing/new-post",
        "https://onerandomdev.cv/writing/new-post#contents",
        "https://example.com/not-ours",
        "http://[",
      ]),
    ).toEqual({
      host: "onerandomdev.cv",
      key: INDEXNOW_KEY,
      keyLocation: "https://onerandomdev.cv/indexnow-key.txt",
      urlList: ["https://onerandomdev.cv/writing/new-post"],
    });
  });

  it.each([
    "http://localhost:3000",
    "http://onerandomdev.cv",
    "https://localhost",
    "https://localhost.",
    "https://preview.localhost",
    "https://preview.localhost.",
    "https://127.0.0.1",
    "https://127.0.0.2",
    "https://127.255.255.255",
    "https://127.1",
    "https://[::1]",
  ])("does not notify from local or insecure origin %s", (origin) => {
    expect(buildIndexNowPayload(origin, ["/"])).toBeNull();
  });

  it("returns null when every candidate is external", () => {
    expect(
      buildIndexNowPayload("https://onerandomdev.cv", [
        "https://example.com/article",
      ]),
    ).toBeNull();
  });
});
