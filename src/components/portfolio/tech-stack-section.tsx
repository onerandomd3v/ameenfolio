import { SectionHeading } from "@/components/portfolio/section-heading";
import { TechStackGroups } from "@/components/portfolio/tech-stack-groups";
import type { TechStackCategory, TechStackItem } from "@/db/schema";

export function TechStackSection({
  items,
  categories,
}: {
  items: TechStackItem[];
  categories: TechStackCategory[];
}) {
  // Groups with nothing in them are dropped rather than rendered as a heading
  // over empty space, so emptying one from the admin removes it cleanly.
  const groups = categories
    .map((group) => ({
      value: group.key,
      label: group.name,
      // Keep the public stack in the admin-defined order. Every visible item is
      // rendered; the flex layout wraps naturally when a category is long.
      items: items
        .filter((item) => item.groupKey === group.key)
        .map((item) => ({
          id: item.id,
          name: item.name,
          iconKey: item.iconKey,
        })),
    }))
    .filter((group) => group.items.length > 0);

  if (!groups.length) return null;

  return (
    <section className="mt-14" aria-labelledby="stack-heading">
      <SectionHeading id="stack-heading" title="Tech Stack" />
      <TechStackGroups groups={groups} />
    </section>
  );
}
