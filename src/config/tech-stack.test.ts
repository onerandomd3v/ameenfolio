import { describe, expect, it } from "vitest";
import {
  slugifyTechStackCategory,
  techStackGroupLabel,
  techStackGroups,
} from "@/config/tech-stack";
import { getTechStackIcon } from "@/config/tech-stack-icons";
import {
  techStackCategoryOrderSchema,
  techStackItemSchema,
} from "@/lib/validation";

// The item list used to live here and was asserted verbatim. It is database
// content now, so what is worth pinning is the group contract the schema, the
// database check constraint and the public grouping all share.
describe("techStackGroups", () => {
  it("exposes the supported groups", () => {
    expect(techStackGroups.map((group) => group.value)).toEqual([
      "language",
      "frontend",
      "backend",
      "tools",
      "workflow",
      "design",
    ]);
    expect(techStackGroups.map((group) => group.label)).toEqual([
      "Language",
      "Frontend",
      "Backend",
      "Infrastructure",
      "Workflow",
      "Design",
    ]);
  });

  it("derives its values list from the groups themselves", () => {
    expect(techStackGroups).toHaveLength(6);
  });

  it("falls back to the first group for an unknown value", () => {
    expect(techStackGroupLabel("tools")).toBe("Infrastructure");
    expect(techStackGroupLabel("nonsense")).toBe("Language");
  });
});

describe("tech stack categories", () => {
  it("creates a stable key from an admin-entered category name", () => {
    expect(slugifyTechStackCategory("Cloud & Infrastructure")).toBe(
      "cloud-infrastructure",
    );
  });

  it("validates a saved category order", () => {
    expect(
      techStackCategoryOrderSchema.safeParse([
        { id: "550e8400-e29b-41d4-a716-446655440000", displayOrder: 0 },
      ]).success,
    ).toBe(true);
  });
});

describe("techStackItemSchema", () => {
  const item = {
    name: "Rust",
    iconKey: null,
    groupKey: "language",
    displayOrder: 0,
    featured: true,
    visible: true,
  };

  it("accepts a technology in any supported group", () => {
    expect(techStackItemSchema.safeParse(item).success).toBe(true);
    for (const groupKey of [
      "frontend",
      "backend",
      "tools",
      "workflow",
      "design",
    ] as const) {
      expect(techStackItemSchema.safeParse({ ...item, groupKey }).success).toBe(
        true,
      );
    }
  });

  it("accepts an optional Simple Icons slug override", () => {
    expect(
      techStackItemSchema.safeParse({ ...item, iconKey: "googlecloud" })
        .success,
    ).toBe(true);
  });

  it("accepts a category key created in the admin", () => {
    expect(
      techStackItemSchema.safeParse({
        ...item,
        groupKey: "cloud-infrastructure",
      }).success,
    ).toBe(true);
  });

  it("requires a name", () => {
    expect(techStackItemSchema.safeParse({ ...item, name: "  " }).success).toBe(
      false,
    );
  });
});

describe("tech stack icon overrides", () => {
  it("uses an explicit icon slug without changing the display name", () => {
    expect(getTechStackIcon("GCP", "k6")?.slug).toBe("k6");
  });

  it("keeps automatic name matching when no override is provided", () => {
    expect(getTechStackIcon("k6")?.slug).toBe("k6");
  });
});
