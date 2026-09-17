"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Ref } from "react";
import { TechStackIcon } from "@/config/tech-stack-icons";
import { cn } from "@/lib/utils";

export type TechStackGroup = {
  value: string;
  label: string;
  items: { id: string; name: string; iconKey: string | null }[];
};

function TechnologyList({
  items,
  expanded,
}: {
  items: TechStackGroup["items"];
  expanded: boolean;
}) {
  const probeRef = useRef<HTMLUListElement>(null);
  const [firstRowCount, setFirstRowCount] = useState(items.length);

  useLayoutEffect(() => {
    const probe = probeRef.current;
    if (!probe) return;

    const measure = () => {
      const firstItem = probe.firstElementChild;
      if (!firstItem) return;

      const firstTop = firstItem.getBoundingClientRect().top;
      const count = Array.from(probe.children).findIndex(
        (item) => item.getBoundingClientRect().top > firstTop + 1,
      );
      setFirstRowCount(count === -1 ? items.length : count);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(probe);
    return () => observer.disconnect();
  }, [items.length]);

  const firstRow = items.slice(0, firstRowCount);
  const remainingRows = items.slice(firstRowCount);

  const renderItems = (
    list: TechStackGroup["items"],
    ref?: Ref<HTMLUListElement>,
  ) => (
    <ul ref={ref} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {list.map((technology) => (
        <li key={technology.id}>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-foreground">
            <TechStackIcon
              name={technology.name}
              iconKey={technology.iconKey}
            />
            {technology.name}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="invisible absolute inset-x-0 top-0 h-0 overflow-visible"
      >
        {renderItems(items, probeRef)}
      </div>
      {renderItems(firstRow)}
      <div
        className={cn(
          "grid overflow-clip transition-[grid-template-rows] duration-[360ms] ease-out motion-reduce:transition-none",
          expanded && remainingRows.length > 0
            ? "grid-rows-[1fr]"
            : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">{renderItems(remainingRows)}</div>
      </div>
    </div>
  );
}

/**
 * Every item is visible in the admin-defined order. Each category uses a
 * natural flex wrap so longer categories continue onto additional lines.
 */
export function TechStackGroups({
  groups,
  expanded,
}: {
  groups: TechStackGroup[];
  expanded: boolean;
}) {
  return (
    <ul id="tech-stack-groups" className="mt-5 space-y-3">
      {groups.map((group) => (
        <li
          key={group.value}
          className="flex items-start gap-3 text-sm leading-6"
        >
          <span className="w-[7.5rem] shrink-0 text-muted-foreground sm:w-36">
            {group.label}
          </span>
          <div className="min-w-0 flex-1 text-foreground">
            <TechnologyList items={group.items} expanded={expanded} />
          </div>
        </li>
      ))}
    </ul>
  );
}
