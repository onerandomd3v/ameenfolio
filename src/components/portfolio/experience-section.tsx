"use client";

import { createElement, useState } from "react";
import { ChevronDown } from "lucide-react";
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

function displayDate(item: PublicExperience) {
  return item.pinned ? "Now" : dateRange(item);
}

function ExperienceMark({ item }: { item: PublicExperience }) {
  const Icon = getExperienceIcon(item.iconName);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-[9px] border border-border bg-accent text-muted-foreground",
        item.pinned && "border-foreground/30 text-foreground",
      )}
    >
      {createElement(Icon, { className: "size-[18px]", "aria-hidden": true })}
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
        "grid overflow-clip transition-[grid-template-rows] duration-[360ms] ease-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
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
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

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

  return (
    <section className="mt-10" aria-labelledby="experience-heading">
      <h2
        id="experience-heading"
        className="text-[16px] font-medium tracking-[-0.02em] text-foreground"
      >
        Experience
      </h2>
      <div className="mt-5">
        <ol className="space-y-5.5">
          {items.map((item) => {
            const open = openRows.has(item.id);
            const detailsId = `experience-details-${item.id}`;

            return (
              <li
                key={item.id}
                className="relative min-w-0 rounded-xl transition-colors before:pointer-events-none before:absolute before:-inset-x-3 before:-inset-y-2 before:rounded-xl before:content-[''] hover:before:bg-accent/50 [&>*]:relative"
              >
                <div>
                  <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-stretch gap-x-[10px] gap-y-2">
                    <span className="block w-fit shrink-0 self-center">
                      <ExperienceMark item={item} />
                    </span>
                    <div className="col-start-2 flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <span className="min-w-0 shrink-0">
                        <span className="flex w-fit items-center gap-1 select-none">
                          <span className="block w-fit text-sm text-foreground">
                            {item.company}
                          </span>
                        </span>
                        <span className="block text-[13px] text-muted-foreground">
                          {item.role}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-start gap-1 whitespace-nowrap pt-0.5 text-[13px] text-muted-foreground">
                        <span>{displayDate(item)}</span>
                        <ChevronDown
                          className={cn(
                            "-mr-1 size-3.5 shrink-0 transition-transform duration-[225ms] motion-reduce:transition-none",
                            open && "rotate-180",
                          )}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </div>
                  <Details item={item} id={detailsId} open={open} />
                  <button
                    type="button"
                    aria-controls={detailsId}
                    aria-expanded={open}
                    aria-label={`${open ? "Collapse" : "Expand"} details for ${item.company}`}
                    className="absolute -inset-x-3 -inset-y-2 z-10 cursor-pointer rounded-xl border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    onClick={() => toggleRow(item.id)}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
