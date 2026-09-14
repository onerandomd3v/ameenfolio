import type { SimpleIcon } from "simple-icons";
import { Server } from "lucide-react";
import * as simpleIcons from "simple-icons";

// AWS is no longer exported by the current Simple Icons release. Keep its
// official smile/arrow mark locally instead of substituting a generic glyph.
const awsIcon: SimpleIcon = {
  title: "Amazon AWS",
  slug: "amazonaws",
  svg: "",
  path: "M21.698 16.207c-2.626 1.94-6.442 2.969-9.722 2.969-4.598 0-8.74-1.7-11.87-4.526-.247-.223-.024-.527.272-.351 3.384 1.963 7.559 3.153 11.877 3.153 2.914 0 6.114-.607 9.06-1.852.439-.2.814.287.383.607zM22.792 14.961c-.336-.43-2.22-.207-3.074-.103-.255.032-.295-.192-.063-.36 1.5-1.053 3.967-.75 4.254-.399.287.36-.08 2.826-1.485 4.007-.215.184-.423.088-.327-.151.32-.79 1.03-2.57.695-2.994z",
  source: "https://aws.amazon.com/architecture/icons/",
  hex: "232F3E",
};

function normalizeIconName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Search the complete installed Simple Icons set by title and slug. This means
// adding a new technology only requires the name to match the library; aliases
// and non-Simple-Icons marks remain explicit below.
const simpleIconMap = new Map<string, SimpleIcon>();
for (const icon of Object.values(simpleIcons) as SimpleIcon[]) {
  simpleIconMap.set(normalizeIconName(icon.title), icon);
  simpleIconMap.set(normalizeIconName(icon.slug), icon);
}

const simpleIconEntries = Array.from(simpleIconMap.entries())
  .filter(
    ([key], index, entries) =>
      entries.findIndex(([entryKey]) => entryKey === key) === index,
  )
  .map(([key, icon]) => ({ key, icon }));

const explicitIcons: Record<string, SimpleIcon> = {
  aws: awsIcon,
  gcp: simpleIconMap.get("googlecloud")!,
  googlecloud: simpleIconMap.get("googlecloud")!,
};

export function getTechStackIcon(name: string, iconKey?: string | null) {
  if (iconKey?.trim()) {
    return simpleIconMap.get(normalizeIconName(iconKey)) ?? null;
  }
  const key = normalizeIconName(name);
  return explicitIcons[key] ?? simpleIconMap.get(key) ?? null;
}

export function searchTechStackIcons(query: string, limit = 24) {
  const normalizedQuery = normalizeIconName(query);
  if (!normalizedQuery) return [];

  return simpleIconEntries
    .filter(
      ({ key, icon }) =>
        key.includes(normalizedQuery) ||
        normalizeIconName(icon.title).includes(normalizedQuery),
    )
    .slice(0, limit)
    .map(({ icon }) => icon);
}

export function hasTechStackIcon(name: string) {
  return normalizeIconName(name) === "vps" || Boolean(getTechStackIcon(name));
}

export function TechStackIcon({
  name,
  iconKey,
}: {
  name: string;
  iconKey?: string | null;
}) {
  if (normalizeIconName(name) === "vps") {
    return (
      <Server
        aria-hidden="true"
        className="size-3.5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
        strokeWidth={2}
      />
    );
  }

  const icon = getTechStackIcon(name, iconKey);
  if (!icon) return null;

  return (
    <svg
      aria-hidden="true"
      className="size-3.5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
      viewBox="0 0 24 24"
      fill="currentColor"
      focusable="false"
    >
      <path d={icon.path} />
    </svg>
  );
}
