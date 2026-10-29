import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getObject: vi.fn(),
  isReferencedPublicMedia: vi.fn(),
}));

vi.mock("@/lib/storage/server", () => ({ getObject: mocks.getObject }));
vi.mock("@/db/queries", () => ({
  isReferencedPublicMedia: mocks.isReferencedPublicMedia,
}));

import { GET } from "@/app/media/[...key]/route";

const draftKey =
  "posts/2026/b7f092b0d3a494fedae8545eb4cb554fcb6cc23879d4279e.png";

afterEach(() => vi.resetAllMocks());

describe("GET /media/[...key]", () => {
  it("keeps an unpublished article image private", async () => {
    mocks.isReferencedPublicMedia.mockResolvedValue(false);

    const response = await GET(new Request("https://example.test/media/x"), {
      params: Promise.resolve({ key: draftKey.split("/") }),
    });

    expect(response.status).toBe(404);
    expect(mocks.getObject).not.toHaveBeenCalled();
  });
});
