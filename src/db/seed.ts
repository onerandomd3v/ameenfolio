import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  experienceHighlights,
  experiences,
  nowSection,
  siteSettings,
} from "@/db/schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to seed the database.");

const db = drizzle(neon(url));
const includePreviewExperiences = process.env.SEED_PREVIEW_EXPERIENCES === "1";

// Preview-only entries make the responsive experience timeline easy to review
// locally. Replace or remove these from the admin before using the seed script
// for a real portfolio database.
const previewExperiences = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    company: "Open to Work",
    role: "Available for software engineering roles",
    startDate: new Date("2026-06-26T00:00:00.000Z"),
    endDate: null,
    location: "Remote" as const,
    iconName: "briefcase" as const,
    pinned: true,
    published: true,
    displayOrder: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    company: "CodedDevs Technology",
    role: "Founding Engineer",
    startDate: new Date("2025-06-01T00:00:00.000Z"),
    endDate: null,
    location: "Hybrid" as const,
    iconName: "building" as const,
    pinned: false,
    published: true,
    displayOrder: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    company: "TWIZRR",
    role: "Co-founder and Engineer",
    startDate: new Date("2025-02-01T00:00:00.000Z"),
    endDate: null,
    location: "Remote" as const,
    iconName: "rocket" as const,
    pinned: false,
    published: true,
    displayOrder: 2,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    company: "Independent",
    role: "Full-stack Engineer",
    startDate: new Date("2022-02-01T00:00:00.000Z"),
    endDate: new Date("2025-05-31T00:00:00.000Z"),
    location: "Remote" as const,
    iconName: "code" as const,
    pinned: false,
    published: true,
    displayOrder: 3,
  },
] as const;

const previewHighlights = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    experienceId: previewExperiences[0].id,
    body: "Open to building thoughtful products with ambitious teams.",
    displayOrder: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    experienceId: previewExperiences[1].id,
    body: "Led product engineering from early idea through deployment.",
    displayOrder: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    experienceId: previewExperiences[1].id,
    body: "Built reusable systems for a growing social-commerce platform.",
    displayOrder: 1,
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    experienceId: previewExperiences[2].id,
    body: "Co-founded the product and shaped its technical direction.",
    displayOrder: 0,
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    experienceId: previewExperiences[3].id,
    body: "Delivered web and mobile experiences for independent clients.",
    displayOrder: 0,
  },
] as const;

async function main() {
  await db.batch([
    db
      .insert(siteSettings)
      .values({
        id: 1,
        email: "hello@example.com",
        contactLinks: {},
        location: "Lagos, Nigeria",
        seoTitle: "Aliameen Kareem — Full-Stack Engineer",
        seoDescription:
          "Selected projects, recognition, and the technologies behind Aliameen Kareem's work.",
      })
      .onConflictDoNothing({ target: siteSettings.id }),
    db
      .insert(nowSection)
      .values({
        id: 1,
        description: "Add a current focus update from the admin.",
        published: false,
      })
      .onConflictDoNothing({ target: nowSection.id }),
    ...(includePreviewExperiences
      ? [
          ...previewExperiences.map((experience) =>
            db
              .insert(experiences)
              .values(experience)
              .onConflictDoNothing({ target: experiences.id }),
          ),
          ...previewHighlights.map((highlight) =>
            db
              .insert(experienceHighlights)
              .values(highlight)
              .onConflictDoNothing({ target: experienceHighlights.id }),
          ),
        ]
      : []),
  ]);

  console.info(
    "Seeded the site settings, Now section, and preview experience timeline.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
