import { describe, expect, it, vi } from "vitest";
import { experienceSchema, projectMcpSchema } from "@/lib/validation";
import { mcpToolCatalog } from "@/lib/mcp/tool-catalog";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createBippyMcpServer } from "@/lib/mcp/tools";

vi.mock("server-only", () => ({}));

const dbState = vi.hoisted(() => ({
  inserted: [] as unknown[],
  published: [] as unknown[],
}));

vi.mock("@/lib/auth/server", () => ({
  requireAdmin: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/app/admin/actions/shared", () => ({
  refreshPublicContent: vi.fn(),
  validationFailure: (error: unknown) => ({ ok: false, error }),
}));
vi.mock("@/lib/logger", () => ({ logServer: vi.fn() }));
vi.mock("@/lib/storage/server", () => ({
  assertStoredUpload: vi.fn().mockResolvedValue(undefined),
  deleteObject: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/db/client", () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ id: "experience-id", pinned: false }],
        }),
      }),
    }),
    insert: () => ({
      values: (values: unknown) => {
        dbState.inserted.push(values);
        return {};
      },
    }),
    delete: () => ({
      where: () => ({}),
    }),
    batch: async () => [],
    update: () => ({
      set: (values: unknown) => ({
        where: () => ({
          returning: async () => {
            dbState.published.push(values);
            return [{ id: "experience-id" }];
          },
        }),
      }),
    }),
  }),
}));

import { saveProject } from "@/app/admin/actions/projects";
import {
  saveExperience,
  setExperiencePublished,
} from "@/app/admin/actions/experiences";

const project = {
  title: "Canonical project",
  shortDescription: "A project description that is long enough for validation.",
  url: "https://example.com/project",
  githubUrl: "",
  iconName: "custom" as const,
  highlights: [
    { body: "Second", displayOrder: 20 },
    { body: "First", displayOrder: 10 },
  ],
};

const experience = {
  company: "Example Co",
  role: "Engineer",
  startDate: "2024-01-01",
  endDate: "",
  location: "Remote" as const,
  iconName: "code" as const,
  pinned: false,
  highlights: [
    { body: "Second", displayOrder: 8 },
    { body: "First", displayOrder: 3 },
  ],
};

describe("portfolio MCP content contracts", () => {
  it("catalogs every Experience tool for connected Bippy clients", () => {
    const names = new Set(mcpToolCatalog.map((tool) => tool.name));
    expect(
      [
        "read_experiences",
        "prepare_experience_draft",
        "prepare_experience_update",
        "prepare_experience_delete",
        "prepare_experience_reorder",
        "prepare_experience_publication",
      ].every((name) => names.has(name)),
    ).toBe(true);
  });

  it("registers every Experience tool on the connected MCP server", async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const server = createBippyMcpServer({
      client: { threadId: "00000000-0000-4000-8000-000000000003" } as never,
      scopes: ["portfolio:read", "portfolio:draft", "portfolio:propose"],
    });
    const client = new Client({ name: "test-client", version: "1.0.0" });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const names = new Set(
        (await client.listTools()).tools.map((tool) => tool.name),
      );
      expect(
        [
          "read_experiences",
          "prepare_experience_draft",
          "prepare_experience_update",
          "prepare_experience_delete",
          "prepare_experience_reorder",
          "prepare_experience_publication",
        ].every((name) => names.has(name)),
      ).toBe(true);
    } finally {
      await client.close();
      await server.close();
    }
  });

  it("requires canonical project highlights and rejects legacy fields", () => {
    expect(projectMcpSchema.parse(project).highlights).toEqual(
      project.highlights,
    );
    expect(() =>
      projectMcpSchema.parse({ ...project, contribution: "legacy" }),
    ).toThrow();
    expect(() =>
      projectMcpSchema.parse({ ...project, statusLabel: "legacy" }),
    ).toThrow();
  });

  it("persists project and experience highlight displayOrder values", async () => {
    expect(experienceSchema.parse(experience)).toMatchObject({
      company: "Example Co",
      role: "Engineer",
      location: "Remote",
      iconName: "code",
      pinned: false,
    });
    dbState.inserted.length = 0;
    await saveProject(project);
    await saveExperience(experience);

    expect(dbState.inserted).toContainEqual([
      { projectId: expect.any(String), body: "Second", displayOrder: 20 },
      { projectId: expect.any(String), body: "First", displayOrder: 10 },
    ]);
    expect(dbState.inserted).toContainEqual([
      { experienceId: expect.any(String), body: "Second", displayOrder: 8 },
      { experienceId: expect.any(String), body: "First", displayOrder: 3 },
    ]);
    expect(dbState.inserted).toContainEqual(
      expect.objectContaining({
        company: "Example Co",
        role: "Engineer",
        location: "Remote",
        iconName: "code",
        pinned: false,
        published: false,
      }),
    );
  });

  it("supports owner-approved Experience publication without changing draft save", async () => {
    dbState.published.length = 0;
    await saveExperience(experience);
    expect(dbState.published).toEqual([]);
    await expect(
      setExperiencePublished("experience-id", true),
    ).resolves.toEqual({ ok: true, id: "experience-id" });
    expect(dbState.published).toEqual([
      { published: true, updatedAt: expect.any(Date) },
    ]);
  });

  it("preserves Experience fields and ordered highlights on update", async () => {
    dbState.inserted.length = 0;
    dbState.published.length = 0;
    const updated = {
      ...experience,
      company: "Updated Co",
      role: "Lead Engineer",
      startDate: "2023-02-01",
      endDate: "2024-04-01",
      location: "Hybrid" as const,
      iconName: "rocket" as const,
      highlights: [{ body: "Ordered update", displayOrder: 17 }],
    };

    await saveExperience(updated, "experience-id", true);

    expect(dbState.published).toContainEqual({
      company: "Updated Co",
      role: "Lead Engineer",
      startDate: expect.any(Date),
      endDate: expect.any(Date),
      location: "Hybrid",
      iconName: "rocket",
      pinned: false,
      published: true,
      updatedAt: expect.any(Date),
    });
    expect(dbState.inserted).toContainEqual([
      {
        experienceId: "experience-id",
        body: "Ordered update",
        displayOrder: 17,
      },
    ]);
  });
});
