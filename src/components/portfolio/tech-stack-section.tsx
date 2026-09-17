"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { TechStackGroups } from "@/components/portfolio/tech-stack-groups";
import type { TechStackCategory, TechStackItem } from "@/db/schema";
import { cn } from "@/lib/utils";

export function TechStackSection({
  items,
  categories,
}: {
  items: TechStackItem[];
  categories: TechStackCategory[];
}) {
  const [expanded, setExpanded] = useState(false);
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

  function toggle() {
    setExpanded((current) => !current);
  }

  return (
    <section className="relative mt-14" aria-labelledby="stack-heading">
      <header className="flex items-center justify-between gap-4">
        <SectionHeading id="stack-heading" title="Skills" />
        <span
          aria-hidden="true"
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground"
        >
          {expanded ? "See less" : "See more"}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-[225ms] motion-reduce:transition-none",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </span>
      </header>
      <TechStackGroups groups={groups} expanded={expanded} />
      <button
        type="button"
        aria-controls="tech-stack-groups"
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} skills`}
        className="absolute -inset-x-3 -inset-y-3 z-10 cursor-pointer rounded-xl border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        onClick={toggle}
      />
    </section>
  );
}
