import { createElement } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/db/schema";
import { AssetIcon } from "@/components/portfolio/asset-icon";
import { getProjectIcon } from "@/config/project-icons";

// The overflow tier of the homepage project list. Everything a card carries
// beyond the essentials — status badge, contribution line — is dropped rather
// than shrunk: the row exists to fit more projects in less height, and keeping
// a trimmed-down card would defeat that.
function ProjectRowMark({ project }: { project: Project }) {
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
  const stockIcon = getProjectIcon(project.iconName);

  // createElement for the same reason as ProjectCard: a capitalised
  // render-scoped variable trips react-hooks/static-components.
  if (stockIcon) {
    return createElement(stockIcon, {
      className: "size-4 shrink-0 text-foreground",
      "aria-hidden": true,
    });
  }

  return (
    <AssetIcon
      objectKey={project.iconKey}
      alt={project.iconAlt ?? ""}
      size="project"
      fallbackLabel="P"
    />
  );
}

export function ProjectRow({ project }: { project: Project }) {
  const destination = project.url ?? project.githubUrl;
  const content = (
    <>
      <ProjectRowMark project={project} />
      <h3 className="shrink-0 text-sm font-semibold text-foreground">
        {project.title}
      </h3>
      {/* Truncated rather than wrapped, so every row stays one line tall and
          the list reads as a column of titles with the description as support.
          min-w-0 is what lets the truncation actually happen inside flex. */}
      <p className="min-w-0 truncate text-[13px] text-muted-foreground">
        {project.shortDescription}
      </p>
      {destination ? (
        <ArrowUpRight
          className="ml-auto size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-signal group-focus-visible:text-signal"
          aria-hidden="true"
        />
      ) : null}
    </>
  );
  const className =
    "group flex items-center gap-3 rounded-md py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  return destination ? (
    <a
      href={destination}
      target="_blank"
      rel="noreferrer"
      data-bippy-reaction="curious"
      data-bippy-project
      data-bippy-safe-zone
      className={className}
    >
      {content}
    </a>
  ) : (
    <div
      data-bippy-reaction="curious"
      data-bippy-project
      data-bippy-safe-zone
      className={className}
    >
      {content}
    </div>
  );
}
