"use client";

import { createElement } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronsUpDown } from "lucide-react";
import { getExperienceIcon } from "@/config/experience-icons";
import type { PublicExperience } from "@/db/queries";
import { cn } from "@/lib/utils";

const month = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

function dateRange(item: PublicExperience) {
  return `${month.format(item.startDate)} – ${item.endDate ? month.format(item.endDate) : "Now"}`;
}

function ExperienceMark({
  item,
  large = false,
}: {
  item: PublicExperience;
  large?: boolean;
}) {
  const Icon = getExperienceIcon(item.iconName);
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center border border-border bg-accent text-foreground",
        large ? "size-8 rounded-[9px]" : "size-6 rounded-[6px]",
      )}
    >
      {createElement(Icon, {
        className: large ? "size-4" : "size-3.5",
        "aria-hidden": true,
      })}
    </span>
  );
}

function Details({
  item,
  id,
  open,
}: {
  item: PublicExperience;
  id: string;
  open: boolean;
}) {
  return (
    <div
      id={id}
      aria-hidden={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-[520ms] ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-[10px] pt-2">
          <span aria-hidden="true" />
          <ul className="space-y-1 pb-1">
            {item.highlights.map((highlight) => (
              <li
                key={highlight.id}
                className="relative pl-3 text-[13px] leading-5 text-muted-foreground before:absolute before:left-0 before:top-[0.6em] before:size-1 before:rounded-full before:bg-muted-foreground"
              >
                {highlight.body}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ExperienceSection({ items }: { items: PublicExperience[] }) {
  const [expanded, setExpanded] = useState(false);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const collapsedRef = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const collapsedItemRefs = useRef(new Map<string, HTMLDivElement>());
  const expandedItemRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingRects = useRef<Map<string, DOMRect> | null>(null);
  const [contentHeight, setContentHeight] = useState<number>();
  const historyItems = useMemo(
    () => items.filter((item) => !item.pinned),
    [items],
  );

  useLayoutEffect(() => {
    const node = expanded ? expandedRef.current : collapsedRef.current;
    if (!node) return;

    const measure = () => setContentHeight(node.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [expanded, historyItems]);

  useLayoutEffect(() => {
    const sources = pendingRects.current;
    if (!sources) return;

    const targets = expanded
      ? expandedItemRefs.current
      : collapsedItemRefs.current;

    historyItems.forEach((item, index) => {
      const source = sources.get(item.id);
      const target = targets.get(item.id);
      if (!source || !target) return;

      const destination = target.getBoundingClientRect();
      target.getAnimations().forEach((animation) => animation.cancel());
      target.animate(
        [
          {
            transform: `translate3d(${source.left - destination.left}px, ${source.top - destination.top}px, 0)`,
          },
          { transform: "translate3d(0, 0, 0)" },
        ],
        {
          duration: 680,
          delay: expanded ? index * 50 : (historyItems.length - index - 1) * 50,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        },
      );
    });

    pendingRects.current = null;
  }, [expanded, historyItems]);

  if (!items.length) {
    return (
      <section className="mt-14" aria-labelledby="experience-heading">
        <h2
          id="experience-heading"
          className="text-[16px] font-medium tracking-[-0.02em] text-foreground"
        >
          Experience
        </h2>
        <p className="mt-5 text-sm text-muted-foreground">
          Experience entries will appear here once published.
        </p>
      </section>
    );
  }

  function toggleRow(id: string) {
    setOpenRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpanded() {
    const sources = expanded
      ? expandedItemRefs.current
      : collapsedItemRefs.current;
    pendingRects.current = new Map(
      historyItems.flatMap((item) => {
        const node = sources.get(item.id);
        return node ? [[item.id, node.getBoundingClientRect()]] : [];
      }),
    );
    setExpanded((value) => !value);
  }

  return (
    <section className="mt-10" aria-labelledby="experience-heading">
      <div className="flex items-center justify-between">
        <h2
          id="experience-heading"
          className="text-[16px] font-medium tracking-[-0.02em] text-foreground"
        >
          Experience
        </h2>
        <button
          type="button"
          className="hidden h-7 shrink-0 items-center gap-1 rounded-[7px] px-2.5 text-[0.8rem] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring min-[570px]:inline-flex"
          aria-controls="experience-content"
          aria-expanded={expanded}
          onClick={toggleExpanded}
        >
          {expanded ? "See less" : "See more"}
          <ChevronsUpDown className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div id="experience-content" className="mt-5">
        <div
          className="hidden overflow-hidden transition-[height] duration-[600ms] ease-out motion-reduce:transition-none min-[570px]:block"
          style={contentHeight ? { height: `${contentHeight}px` } : undefined}
        >
          <div className="relative">
            <div
              ref={collapsedRef}
              aria-hidden={expanded}
              className={cn(
                "transition-opacity duration-[1ms] motion-reduce:transition-none",
                expanded
                  ? "pointer-events-none absolute inset-0 opacity-0"
                  : "relative opacity-100",
              )}
              style={{ transitionDelay: "0ms" }}
            >
              <div className="overflow-x-auto pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="relative min-w-[620px]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {items.map((item) => (
                      <div key={item.id} className="relative">
                        <div
                          className={cn(
                            "absolute left-3 top-1 h-px w-[calc(100%+0.5rem)] -translate-y-1/2 bg-foreground/15",
                            item.pinned &&
                              "bg-[linear-gradient(to_right,var(--foreground)_0%,color-mix(in_oklch,var(--foreground)_17.5%,var(--background))_70%,color-mix(in_oklch,var(--foreground)_17.5%,var(--background))_100%)]",
                          )}
                        />
                        <div className="absolute left-0 top-0">
                          <div className="relative z-10 -mt-1 ml-1 grid size-4 place-items-center rounded-full bg-background">
                            <div
                              className={cn(
                                "relative size-2 rounded-full",
                                item.pinned
                                  ? "bg-foreground shadow-[0_0_0_4px_color-mix(in_oklch,currentColor_28%,transparent)]"
                                  : "bg-foreground/30",
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ol
                    className="relative grid gap-2"
                    style={{
                      gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {items.map((item) => (
                      <li key={item.id} className="relative min-w-0 pt-6">
                        <div
                          ref={(node) => {
                            if (node)
                              collapsedItemRefs.current.set(item.id, node);
                            else collapsedItemRefs.current.delete(item.id);
                          }}
                          className="flex min-w-0 flex-col gap-2"
                        >
                          <div className="flex min-w-0 items-center gap-x-[10px]">
                            <ExperienceMark item={item} />
                            <div className="min-w-0">
                              <span className="block truncate text-sm text-foreground">
                                {item.company}
                              </span>
                            </div>
                          </div>
                          <span className="text-[13px] text-muted-foreground">
                            {dateRange(item)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
            <div
              ref={expandedRef}
              aria-hidden={!expanded}
              className={cn(
                "transition-opacity duration-[1ms] motion-reduce:transition-none",
                expanded
                  ? "relative opacity-100"
                  : "pointer-events-none absolute inset-0 opacity-0",
              )}
              style={{ transitionDelay: "0ms" }}
            >
              <ol className="space-y-6">
                {historyItems.map((item) => (
                  <li key={item.id}>
                    <div
                      ref={(node) => {
                        if (node) expandedItemRefs.current.set(item.id, node);
                        else expandedItemRefs.current.delete(item.id);
                      }}
                      className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-[10px]"
                    >
                      <ExperienceMark item={item} large />
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1 pt-0.5">
                        <span className="min-w-0 shrink-0">
                          <span className="block text-sm text-foreground">
                            {item.company}
                          </span>
                          <span className="block text-[13px] text-muted-foreground">
                            {item.role}
                          </span>
                        </span>
                        <span className="shrink-0 whitespace-nowrap text-[13px] text-muted-foreground">
                          {dateRange(item)}
                          {item.location ? ` · ${item.location}` : ""}
                        </span>
                      </div>
                    </div>
                    <Details
                      item={item}
                      id={`experience-details-${item.id}`}
                      open={expanded}
                    />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
        <ol className="space-y-3 min-[570px]:hidden">
          {items.map((item) => {
            const open = openRows.has(item.id);
            const detailsId = `experience-mobile-details-${item.id}`;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-[10px] rounded-xl p-1 text-left transition-colors hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-ring"
                  aria-controls={detailsId}
                  aria-expanded={open}
                  aria-label={`${open ? "Collapse" : "Expand"} details for ${item.company}`}
                  onClick={() => toggleRow(item.id)}
                >
                  <ExperienceMark item={item} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground">
                      {item.company}
                    </span>
                    <span className="block text-[13px] text-muted-foreground">
                      {item.role}
                    </span>
                    <span className="block text-[12px] text-muted-foreground">
                      {dateRange(item)}
                      {item.location ? ` · ${item.location}` : ""}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                      open && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </button>
                <Details item={item} id={detailsId} open={open} />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
