import { TechStackIcon } from "@/config/tech-stack-icons";

export type TechStackGroup = {
  value: string;
  label: string;
  items: { id: string; name: string; iconKey: string | null }[];
};

function TechnologyList({ items }: { items: TechStackGroup["items"] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {items.map((technology) => (
        <li key={technology.id}>
          <span className="group inline-flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-foreground">
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
}

/**
 * Every item is visible in the admin-defined order. Each category uses a
 * natural flex wrap so longer categories continue onto additional lines.
 */
export function TechStackGroups({ groups }: { groups: TechStackGroup[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {groups.map((group) => (
        <li
          key={group.value}
          className="flex items-start gap-3 text-sm leading-6"
        >
          <span className="w-[7.5rem] shrink-0 sm:w-36">{group.label}</span>
          <div className="min-w-0 flex-1 text-muted-foreground">
            <TechnologyList items={group.items} />
          </div>
        </li>
      ))}
    </ul>
  );
}
