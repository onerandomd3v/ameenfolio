import type { ComponentType, SVGProps } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Blocks,
  Bot,
  Building2,
  ChartNoAxesCombined,
  Cloud,
  Code2,
  Cpu,
  Database,
  Factory,
  Globe2,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Landmark,
  Layers3,
  Lightbulb,
  Megaphone,
  Microscope,
  Palette,
  PenTool,
  Rocket,
  Search,
  Server,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Users,
  Workflow,
  Wrench,
} from "lucide-react";

export type ExperienceIcon = ComponentType<SVGProps<SVGSVGElement>>;

export const experienceIconOptions = [
  { value: "briefcase", label: "Briefcase", icon: BriefcaseBusiness },
  { value: "badge-check", label: "Badge check", icon: BadgeCheck },
  { value: "blocks", label: "Blocks", icon: Blocks },
  { value: "bot", label: "Bot", icon: Bot },
  { value: "building", label: "Building", icon: Building2 },
  { value: "chart", label: "Analytics", icon: ChartNoAxesCombined },
  { value: "cloud", label: "Cloud", icon: Cloud },
  { value: "code", label: "Code", icon: Code2 },
  { value: "cpu", label: "CPU", icon: Cpu },
  { value: "database", label: "Database", icon: Database },
  { value: "factory", label: "Factory", icon: Factory },
  { value: "globe", label: "Globe", icon: Globe2 },
  { value: "graduation-cap", label: "Education", icon: GraduationCap },
  { value: "handshake", label: "Handshake", icon: Handshake },
  { value: "heart-handshake", label: "Partnership", icon: HeartHandshake },
  { value: "landmark", label: "Institution", icon: Landmark },
  { value: "layers", label: "Layers", icon: Layers3 },
  { value: "lightbulb", label: "Idea", icon: Lightbulb },
  { value: "megaphone", label: "Marketing", icon: Megaphone },
  { value: "microscope", label: "Research", icon: Microscope },
  { value: "palette", label: "Palette", icon: Palette },
  { value: "pen-tool", label: "Design", icon: PenTool },
  { value: "rocket", label: "Launch", icon: Rocket },
  { value: "search", label: "Search", icon: Search },
  { value: "server", label: "Server", icon: Server },
  { value: "shield-check", label: "Security", icon: ShieldCheck },
  { value: "smartphone", label: "Mobile", icon: Smartphone },
  { value: "sparkles", label: "Sparkles", icon: Sparkles },
  { value: "terminal", label: "Terminal", icon: Terminal },
  { value: "users", label: "Team", icon: Users },
  { value: "workflow", label: "Workflow", icon: Workflow },
  { value: "wrench", label: "Tools", icon: Wrench },
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
