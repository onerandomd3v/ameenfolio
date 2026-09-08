import type { ComponentType, SVGProps } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Cloud,
  Code2,
  Globe2,
  Palette,
  Search,
  Terminal,
} from "lucide-react";

export type ExperienceIcon = ComponentType<SVGProps<SVGSVGElement>>;

export const experienceIconOptions = [
  { value: "briefcase", label: "Briefcase", icon: BriefcaseBusiness },
  { value: "building", label: "Building", icon: Building2 },
  { value: "cloud", label: "Cloud", icon: Cloud },
  { value: "code", label: "Code", icon: Code2 },
  { value: "globe", label: "Globe", icon: Globe2 },
  { value: "palette", label: "Palette", icon: Palette },
  { value: "search", label: "Search", icon: Search },
  { value: "terminal", label: "Terminal", icon: Terminal },
] as const satisfies readonly {
  value: string;
  label: string;
  icon: ExperienceIcon;
}[];

export const experienceIconValues = experienceIconOptions.map(
  (option) => option.value,
) as unknown as readonly [ExperienceIconName, ...ExperienceIconName[]];

export type ExperienceIconName =
  (typeof experienceIconOptions)[number]["value"];

const iconsByName = new Map<string, ExperienceIcon>(
  experienceIconOptions.map((option) => [option.value, option.icon]),
);

export function getExperienceIcon(iconName: string) {
  return iconsByName.get(iconName) ?? BriefcaseBusiness;
}
