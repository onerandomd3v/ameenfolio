import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getObject: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/storage/server", () => ({ getObject: mocks.getObject }));

import { GET } from "@/app/api/admin/media-preview/route";

const unpublishedImageKey =
  "posts/2026/b7f092b0d3a494fedae8545eb4cb554fcb6cc23879d4279e.png";

afterEach(() => vi.resetAllMocks());

describe("GET /api/admin/media-preview", () => {
  it("serves a managed draft image to an authenticated admin", async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]);
    mocks.requireAdmin.mockResolvedValue({ id: "admin" });
    mocks.getObject.mockResolvedValue({
      Body: { transformToWebStream: () => new Blob([bytes]).stream() },
      ContentType: "image/png",
    });

    const response = await GET(
      new Request(
        `https://admin.example.test/api/admin/media-preview?key=${encodeURIComponent(unpublishedImageKey)}`,
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, max-age=300");
    expect(await response.arrayBuffer()).toEqual(bytes.buffer);
    expect(mocks.getObject).toHaveBeenCalledWith(unpublishedImageKey);
  });

  it("requires admin authentication before retrieving media", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("redirect to sign-in"));

    await expect(
      GET(
        new Request(
          `https://admin.example.test/api/admin/media-preview?key=${encodeURIComponent(unpublishedImageKey)}`,
        ),
      ),
    ).rejects.toThrow("redirect to sign-in");
    expect(mocks.getObject).not.toHaveBeenCalled();
  });

  it("rejects unmanaged keys before retrieving media", async () => {
    mocks.requireAdmin.mockResolvedValue({ id: "admin" });

    const response = await GET(
      new Request(
        "https://admin.example.test/api/admin/media-preview?key=posts%2F2026%2F..%2Fprivate.png",
      ),
    );

    expect(response.status).toBe(400);
    expect(mocks.getObject).not.toHaveBeenCalled();
  });
});
