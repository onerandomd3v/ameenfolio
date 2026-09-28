import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  setExperiencePublished: vi.fn().mockResolvedValue({ ok: true }),
  saveExperience: vi.fn().mockResolvedValue({ ok: true }),
  claimApproval: vi.fn(),
  rejectApprovalWithPayload: vi.fn(),
  resolveApproval: vi.fn().mockResolvedValue({ status: "executed" }),
  approvalView: vi.fn((row) => row),
  getDb: vi.fn(() => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ threadId: "thread-id" }],
        }),
      }),
    }),
  })),
}));

const approvalId = "00000000-0000-4000-8000-000000000001";
const experienceId = "00000000-0000-4000-8000-000000000002";

vi.mock("@/app/admin/actions/experiences", () => ({
  deleteExperience: vi.fn(),
  reorderExperiences: vi.fn(),
  saveExperience: mocks.saveExperience,
  setExperiencePublished: mocks.setExperiencePublished,
}));
vi.mock("@/app/admin/actions/projects", () => ({
  deleteProject: vi.fn(),
  saveProject: vi.fn(),
}));
vi.mock("@/app/admin/actions/recognitions", () => ({
  deleteRecognition: vi.fn(),
  saveRecognition: vi.fn(),
}));
vi.mock("@/app/admin/actions/now", () => ({ saveNowSection: vi.fn() }));
vi.mock("@/app/admin/actions/placement", () => ({
  setPinned: vi.fn(),
  setPublished: vi.fn(),
}));
vi.mock("@/app/admin/actions/settings", () => ({
  saveProfile: vi.fn(),
  saveSeo: vi.fn(),
}));
vi.mock("@/app/admin/actions/writing", () => ({
  deletePost: vi.fn(),
  savePost: vi.fn(),
}));
vi.mock("@/app/admin/actions/tech-stack", () => ({
  deleteTechStackItem: vi.fn(),
  reorderTechStack: vi.fn(),
  saveTechStackItem: vi.fn(),
}));
vi.mock("@/lib/auth/server", () => ({
  requireAdmin: vi.fn(),
  runAsMcpMutation: (callback: () => unknown) => callback(),
}));
vi.mock("@/db/client", () => ({ getDb: mocks.getDb }));
vi.mock("@/lib/ai/repository", () => ({
  approvalView: mocks.approvalView,
  claimApproval: mocks.claimApproval,
  rejectApprovalWithPayload: mocks.rejectApprovalWithPayload,
  resolveApproval: mocks.resolveApproval,
  updateApprovedToolCallResult: vi.fn(),
}));
vi.mock("@/lib/ai/bippy-mcp", () => ({ executeBippyMcpTool: vi.fn() }));
vi.mock("@/lib/ai/memory", () => ({ deleteAssistantMemory: vi.fn() }));
vi.mock("@/db/queries", () => ({
  getAdminProject: vi.fn(),
  getAdminExperience: vi.fn(),
  getAdminRecognitions: vi.fn(),
  getAdminSettings: vi.fn(),
  getTakenSlugs: vi.fn(),
  isReferencedManagedObject: vi.fn(),
}));
vi.mock("@/lib/storage/server", () => ({ deleteObject: vi.fn() }));

import { decideMcpApproval } from "@/lib/ai/approvals";

describe("MCP Experience publication approvals", () => {
  it("approves an Experience draft without publishing it", async () => {
    const payload = {
      company: "Example Co",
      role: "Engineer",
      startDate: "2024-01-01",
      endDate: "",
      location: "Remote",
      iconName: "code",
      pinned: false,
      highlights: [{ body: "Built it", displayOrder: 4 }],
    };
    mocks.claimApproval.mockResolvedValueOnce({
      id: approvalId,
      actionType: "create_experience_draft",
      payload,
      toolCallId: "tool-call-id",
    });

    await decideMcpApproval(approvalId, "approve", "thread-id");

    expect(mocks.saveExperience).toHaveBeenCalledWith(
      payload,
      undefined,
      false,
    );
    expect(mocks.setExperiencePublished).not.toHaveBeenCalled();
  });

  it("applies publication only after explicit approval", async () => {
    mocks.setExperiencePublished.mockClear();
    mocks.claimApproval.mockResolvedValueOnce({
      id: approvalId,
      actionType: "set_experience_published",
      payload: { id: experienceId, published: true },
      toolCallId: "tool-call-id",
    });

    await decideMcpApproval(approvalId, "approve", "thread-id");

    expect(mocks.setExperiencePublished).toHaveBeenCalledWith(
      experienceId,
      true,
    );
  });

  it("rejects a publication proposal without mutating publication state", async () => {
    mocks.setExperiencePublished.mockClear();
    mocks.rejectApprovalWithPayload.mockResolvedValueOnce({
      id: approvalId,
      actionType: "set_experience_published",
      payload: { id: experienceId, published: true },
    });

    await decideMcpApproval(approvalId, "reject", "thread-id");

    expect(mocks.setExperiencePublished).not.toHaveBeenCalled();
    expect(mocks.rejectApprovalWithPayload).toHaveBeenCalledWith(approvalId);
  });
});
