"use client";

import { createElement, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Github, Globe2 } from "lucide-react";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { getProjectIcon } from "@/config/project-icons";
import type { Project, ProjectHighlight } from "@/db/schema";
import { cn } from "@/lib/utils";

type PublicProject = Project & { highlights: ProjectHighlight[] };

function ProjectMark({ project }: { project: PublicProject }) {
  if (project.iconKey) {
    return (
      <AssetIcon
        objectKey={project.iconKey}
        alt={project.iconAlt ?? ""}
        size="project"
        fallbackLabel="P"
      />
    );
  }
  const Icon = getProjectIcon(project.iconName);
  if (Icon) {
    return createElement(Icon, {
      className: "size-[18px] shrink-0 text-muted-foreground",
      "aria-hidden": true,
    });
  }
  return <AssetIcon objectKey={null} alt="" size="project" fallbackLabel="P" />;
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

export function ProjectsList({ projects }: { projects: PublicProject[] }) {
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
        const hasHighlights = project.highlights.length > 0;

        return (
          <li
            key={project.id}
            className="relative min-w-0 rounded-xl before:pointer-events-none before:absolute before:-inset-x-3 before:-inset-y-2 before:rounded-xl before:content-[''] hover:before:bg-accent/50 [&>*]:relative"
          >
            <div>
              <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-[10px]">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center self-center",
                    project.iconKey
                      ? "rounded-[5px]"
                      : "rounded-[9px] border border-border bg-accent",
                  )}
                >
                  <ProjectMark project={project} />
                </span>
                <div className="col-start-2 flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 self-center text-[15px] font-semibold text-foreground">
                    {project.title}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <ActionLink href={githubUrl} label="GitHub">
                      <Github className="size-4" aria-hidden="true" />
                    </ActionLink>
                    <ActionLink href={liveUrl} label="Live project">
                      <Globe2 className="size-4" aria-hidden="true" />
                    </ActionLink>
                    <ChevronDown
                      className={cn(
                        "ml-1 size-3.5 text-muted-foreground transition-transform duration-[225ms] motion-reduce:transition-none",
                        open && "rotate-180",
                        !hasHighlights && "invisible",
                      )}
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-muted-foreground">
                {project.shortDescription}
              </p>
              <div
                id={detailsId}
                aria-hidden={!open}
                className={cn(
                  "grid overflow-clip transition-[grid-template-rows] duration-[360ms] ease-out motion-reduce:transition-none",
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden border-t border-border/70 pt-2">
                  <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-[10px] pt-2 text-[13px] leading-6 text-muted-foreground">
                    <span aria-hidden="true" />
                    {project.highlights.length ? (
                      <ul className="list-disc space-y-1 pl-4">
                        {project.highlights.map((highlight) => (
                          <li key={highlight.id}>{highlight.body}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              </div>
              {hasHighlights ? (
                <button
                  type="button"
                  aria-controls={detailsId}
                  aria-expanded={open}
                  aria-label={`${open ? "Collapse" : "Expand"} details for ${project.title}`}
                  className="absolute -inset-x-3 -inset-y-2 z-10 cursor-pointer rounded-xl border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  onClick={() => toggle(project.id)}
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
