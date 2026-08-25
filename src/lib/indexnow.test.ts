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

  it("does not notify from local or insecure environments", () => {
    expect(buildIndexNowPayload("http://localhost:3000", ["/"])).toBeNull();
    expect(buildIndexNowPayload("http://onerandomdev.cv", ["/"])).toBeNull();
  });

  it("returns null when every candidate is external", () => {
    expect(
      buildIndexNowPayload("https://onerandomdev.cv", [
        "https://example.com/article",
      ]),
    ).toBeNull();
  });
});
