"use client";

import { createElement, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Github, Globe2 } from "lucide-react";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { getProjectIcon } from "@/config/project-icons";
import type { Project } from "@/db/schema";
import { cn } from "@/lib/utils";

function ProjectMark({ project }: { project: Project }) {
  const Icon = getProjectIcon(project.iconName);
  if (Icon) {
    return createElement(Icon, {
      className: "size-[18px] shrink-0 text-muted-foreground",
      "aria-hidden": true,
    });
  }
  return (
    <AssetIcon
      objectKey={project.iconKey}
      alt={project.iconAlt ?? ""}
      size="xs"
      fallbackLabel="P"
    />
  );
}

function isGithubUrl(url: string) {
  try {
    return new URL(url).hostname.toLowerCase() === "github.com";
  } catch {
    return false;
  }
}

function ActionLink({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: ReactNode;
}) {
  const className = cn(
    "relative z-20 grid size-7 place-items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-ring",
    href
      ? "text-muted-foreground hover:bg-accent hover:text-foreground"
      : "pointer-events-none text-muted-foreground/25",
  );
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className={className}
    >
      {children}
    </a>
  ) : (
    <span
      aria-label={`${label} unavailable`}
      aria-disabled="true"
      className={className}
    >
      {children}
    </span>
  );
}

export function ProjectsList({ projects }: { projects: Project[] }) {
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ol className="mt-8 space-y-5.5">
      {projects.map((project) => {
        const open = openRows.has(project.id);
        const githubUrl =
          project.githubUrl || (isGithubUrl(project.url) ? project.url : null);
        const liveUrl = isGithubUrl(project.url) ? null : project.url;
        const detailsId = `project-details-${project.id}`;

        return (
          <li
            key={project.id}
            className="relative min-w-0 rounded-xl before:pointer-events-none before:absolute before:-inset-x-3 before:-inset-y-2 before:rounded-xl before:content-[''] hover:before:bg-accent/50 [&>*]:relative"
          >
            <div>
              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-[10px]">
                <span className="grid size-8 shrink-0 place-items-center self-center rounded-[9px] border border-border bg-accent">
                  <ProjectMark project={project} />
                </span>
                <div className="col-start-2 flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 pt-0.5 text-sm font-semibold text-foreground">
                    {project.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    <ActionLink href={githubUrl} label="GitHub">
                      <Github className="size-4" aria-hidden="true" />
                    </ActionLink>
                    <ActionLink href={liveUrl} label="Live project">
                      <Globe2 className="size-4" aria-hidden="true" />
                    </ActionLink>
                    <ChevronDown
                      className={cn(
                        "ml-0.5 size-3.5 text-muted-foreground transition-transform duration-[225ms] motion-reduce:transition-none",
                        open && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </div>
              <div
                id={detailsId}
                aria-hidden={!open}
                className={cn(
                  "grid overflow-clip transition-[grid-template-rows] duration-[360ms] ease-out motion-reduce:transition-none",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <p className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-[10px] pt-2 text-[13px] leading-6 text-muted-foreground">
                    <span aria-hidden="true" />
                    <span>{project.shortDescription}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-controls={detailsId}
                aria-expanded={open}
                aria-label={`${open ? "Collapse" : "Expand"} details for ${project.title}`}
                className="absolute -inset-x-3 -inset-y-2 z-10 cursor-pointer rounded-xl border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                onClick={() => toggle(project.id)}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
