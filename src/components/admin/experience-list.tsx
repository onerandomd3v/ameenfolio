import { EmptyState, ListRow } from "@/components/admin/admin-primitives";
import { EditAction } from "@/components/admin/row-actions";
import { getExperienceIcon } from "@/config/experience-icons";
import type { Experience } from "@/db/schema";

const month = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function range(item: Experience) {
  return `${month.format(item.startDate)} – ${item.endDate ? month.format(item.endDate) : "Now"}`;
}

export function AdminExperienceList({
  items,
  base,
}: {
  items: Experience[];
  base: string;
}) {
  if (!items.length)
    return (
      <EmptyState
        title="No experience yet"
        description="Add your first role to show it on the portfolio."
      />
    );
  return (
    <div className="border-t border-border/60">
      {items.map((item) => {
        const Icon = getExperienceIcon(item.iconName);
        return (
          <ListRow
            key={item.id}
            icon={<Icon className="size-4" aria-hidden="true" />}
            title={item.company}
            meta={
              <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                {item.role} · {range(item)}
                {item.location ? ` · ${item.location}` : ""}
              </p>
            }
            badge={
              <span className="font-mono text-[11px] text-muted-foreground">
                {item.pinned ? "Pinned · " : ""}
                {item.published ? "Live" : "Draft"}
              </span>
            }
            actions={
              <EditAction
                href={`${base}/experience/${item.id}/edit`}
                what={item.company}
              />
            }
          />
        );
      })}
    </div>
  );
}
