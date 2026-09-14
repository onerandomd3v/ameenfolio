// These are the initial categories seeded into the database. Their contents and
// future additions are managed from the admin, so category changes are content
// editing rather than deploys.
export const defaultTechStackCategories = [
  { value: "language", label: "Language" },
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "tools", label: "Infrastructure" },
  { value: "workflow", label: "Workflow" },
  { value: "design", label: "Design" },
] as const;

// Kept as a compatibility export for non-rendering integrations while the
// database-backed category list is introduced.
export const techStackGroups = defaultTechStackCategories;

export type TechStackGroupValue = string;

export function slugifyTechStackCategory(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function techStackGroupLabel(value: TechStackGroupValue | string) {
  return (
    techStackGroups.find((group) => group.value === value)?.label ??
    techStackGroups[0].label
  );
}
