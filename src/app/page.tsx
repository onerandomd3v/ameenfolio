import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { after } from "next/server";
import { getPinnedPosts, getPublicPortfolio } from "@/db/queries";
import { NowSection } from "@/components/portfolio/now-section";
import { StatsStrip } from "@/components/portfolio/stats-strip";
import { BippyCompanion } from "@/components/bippy/bippy-companion";
import { PortfolioNav } from "@/components/portfolio/portfolio-nav";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ProjectRow } from "@/components/portfolio/project-row";
import { ResumeDownloadButton } from "@/components/portfolio/resume-download-button";
import { SendMessageDialog } from "@/components/portfolio/send-message-dialog";
import { ProjectsEmptyState } from "@/components/portfolio/projects-empty-state";
import { GithubActivity } from "@/components/portfolio/github-activity";
import { ExperienceSection } from "@/components/portfolio/experience-section";
import { RecognitionRow } from "@/components/portfolio/recognition-row";
import { RecognitionsEmptyState } from "@/components/portfolio/recognitions-empty-state";
import { SectionHeading } from "@/components/portfolio/section-heading";
import { TechStackSection } from "@/components/portfolio/tech-stack-section";
import { WritingSection } from "@/components/portfolio/writing-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GitHubIcon,
  GlobeIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons/brand-icons";
import { MailGlyph, UserGlyph } from "@/components/icons/glyph-icons";
import { portfolioIdentity } from "@/config/portfolio";
import { instrumentSerif } from "@/app/fonts";
import { initialsOf, resolveIdentity } from "@/lib/identity";
import { splitEmphasis } from "@/lib/text-emphasis";
import { splitHomepageProjects } from "@/lib/ordering";
import { personJsonLd, publicPerson } from "@/lib/seo/person";
import {
  canFetchGithubStats,
  isSnapshotStale,
  refreshStatsSnapshot,
} from "@/lib/stats/snapshot";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPublicPortfolio();

  return {
    title: settings.seoTitle,
    description: settings.seoDescription,
    alternates: {
      canonical: "/",
      types: { "application/rss+xml": "/feed.xml" },
    },
    openGraph: {
      title: settings.seoTitle,
      description: settings.seoDescription,
      url: "/",
      type: "website",
    },
  };
}

export default async function HomePage() {
  const {
    settings,
    now,
    projects,
    experiences,
    recognitions,
    techStack,
    inProductionProjectCount,
    statsSnapshot,
  } = await getPublicPortfolio();

  const pinnedPosts = await getPinnedPosts();

  const { cards: homepageCards, rows: homepageRows } =
    splitHomepageProjects(projects);

  // Refreshed after the response is flushed rather than before it, so a slow
  // or unreachable GitHub delays nobody's page load. Whoever asks next gets
  // the newer numbers; this visitor still sees the strip immediately.
  if (
    canFetchGithubStats() &&
    (isSnapshotStale(statsSnapshot) || !statsSnapshot?.contributionDays.length)
  ) {
    after(refreshStatsSnapshot);
  }

  const profileImageBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const contactLinks = settings.contactLinks ?? {};
  const profileImageSrc = settings.profileImageKey
    ? profileImageBase
      ? `${profileImageBase}/${settings.profileImageKey}`
      : `/media/${settings.profileImageKey}`
    : undefined;
  const { name: displayName, role, introduction } = resolveIdentity(settings);
  const person = publicPerson(
    { name: displayName, role },
    contactLinks,
    process.env.CANONICAL_SITE_URL ?? "http://localhost:3000",
  );
  const initials = initialsOf(displayName);
  const contactItems = [
    {
      label: "GitHub",
      href: contactLinks.github,
      icon: GitHubIcon,
      external: true,
    },
    {
      label: "X (Twitter)",
      href: contactLinks.x,
      icon: XIcon,
      external: true,
    },
    {
      label: "Email",
      href: `mailto:${settings.email}`,
      icon: MailGlyph,
      external: false,
    },
  ];
  const footerSocialItems = [
    {
      label: "Instagram",
      href: contactLinks.instagram,
      icon: InstagramIcon,
    },
    {
      label: "LinkedIn",
      href: contactLinks.linkedin,
      icon: LinkedInIcon,
    },
    {
      label: "YouTube",
      href: contactLinks.youtube,
      icon: YouTubeIcon,
    },
    {
      label: "TikTok",
      href: contactLinks.tiktok,
      icon: TikTokIcon,
    },
  ];

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-10 pt-8 sm:px-6 sm:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd(person)).replace(/</g, "\\u003c"),
        }}
      />
      <PortfolioNav current="home" />

      <section className="mt-10 max-w-xl">
        <div className="flex items-center gap-4 sm:gap-5">
          <Avatar className="size-24 rounded-[3px] border-2 border-background ring-1 ring-foreground/20 ring-offset-2 ring-offset-background sm:size-28">
            {profileImageSrc ? (
              <AvatarImage
                src={profileImageSrc}
                alt={`${displayName} profile photo`}
                className="rounded-[3px] object-cover"
              />
            ) : null}
            <AvatarFallback className="rounded-[3px] text-base font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-center sm:min-h-28">
            <h1
              className={`${instrumentSerif.className} text-[clamp(2.25rem,8vw,3.25rem)] leading-[0.95] tracking-[-0.02em] text-foreground`}
            >
              {displayName}
            </h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
              <UserGlyph className="size-3.5 shrink-0" aria-hidden="true" />
              {role}
            </p>
          </div>
        </div>
        <p className="mt-8 max-w-xl whitespace-pre-line text-pretty text-base leading-7 text-foreground/90">
          {splitEmphasis(introduction).map((segment, index) =>
            segment.emphasized ? (
              <strong
                key={index}
                className="font-bold text-foreground underline decoration-1 underline-offset-4"
              >
                {segment.text}
              </strong>
            ) : (
              <Fragment key={index}>{segment.text}</Fragment>
            ),
          )}
        </p>
        {/* Always rendered. The layout is part of the page rather than something
            that appears once a fetch succeeds, so the strip holds its place and
            the cells fill in as their data becomes available. */}
        <StatsStrip
          snapshot={statsSnapshot}
          hackathonWins={settings.hackathonWins}
          inProductionProjectCount={inProductionProjectCount}
        />

        <section className="mt-6" aria-label="Contact links">
          <nav>
            <ul className="flex w-full flex-nowrap gap-1 sm:gap-2">
              {contactItems.map((item) => {
                const Icon = item.icon;

                return (
                  <li key={item.label} className="shrink-0">
                    {item.href ? (
                      <a
                        className="inline-flex min-h-8 items-center gap-0.5 whitespace-nowrap rounded-[3px] bg-foreground px-1 text-[11px] font-medium text-background transition-colors hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-1.5 sm:px-3 sm:text-[13px]"
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noreferrer" : undefined}
                        data-bippy-reaction={
                          item.label === "GitHub" ? "working" : "curious"
                        }
                        data-bippy-safe-zone
                      >
                        <Icon
                          className="size-3 sm:size-3.5"
                          aria-hidden="true"
                        />
                        {item.label}
                      </a>
                    ) : (
                      <span className="inline-flex min-h-8 items-center gap-0.5 whitespace-nowrap rounded-[3px] bg-foreground px-1 text-[11px] font-medium text-background sm:gap-1.5 sm:px-3 sm:text-[13px]">
                        <Icon
                          className="size-3 sm:size-3.5"
                          aria-hidden="true"
                        />
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
              <li className="shrink-0">
                <ResumeDownloadButton
                  hasResume={Boolean(settings.resumeKey)}
                  filename={settings.resumeFilename}
                  label="Resume"
                  className="min-h-8 whitespace-nowrap rounded-[3px] bg-foreground px-1 text-[11px] font-medium text-background no-underline hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3 sm:text-[13px]"
                />
              </li>
              <li className="shrink-0">
                <span className="inline-flex min-h-8 items-center gap-0.5 whitespace-nowrap rounded-[3px] bg-foreground px-1 text-[11px] font-medium text-background sm:gap-1.5 sm:px-3 sm:text-[13px]">
                  <GlobeIcon
                    className="size-3 sm:size-3.5"
                    aria-hidden="true"
                  />
                  {settings.location}
                </span>
              </li>
            </ul>
          </nav>
        </section>
      </section>

      <NowSection section={now} />

      <section className="mt-14" aria-labelledby="projects-heading">
        <SectionHeading id="projects-heading" title="Recent Projects" />
        <GithubActivity snapshot={statsSnapshot} />

        {projects.length ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {homepageCards.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            {/* Everything past the eighth continues as a divided list rather
                than more cards, so the section can hold twelve projects
                without the grid dominating the page. */}
            {homepageRows.length ? (
              <div className="mt-6 divide-y divide-solid divide-border">
                {homepageRows.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <ProjectsEmptyState description="Fresh projects will be published here soon." />
        )}
        {/* Reads as the last line of the list rather than a control beside the
            heading: the archive is where the section continues, so the
            invitation belongs at the point the visitor runs out of projects.
            Outside the branch above because the archive lists every published
            project, not just the ones flagged for the homepage — it can have
            plenty to show while this section has none. */}
        <Link
          href="/projects"
          data-bippy-reaction="curious"
          data-bippy-safe-zone
          className="mt-4 inline-block text-[13px] text-muted-foreground underline decoration-border underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground focus-visible:text-foreground"
        >
          View all projects →
        </Link>
      </section>

      <WritingSection posts={pinnedPosts} />

      <ExperienceSection items={experiences} />

      <section className="mt-24" aria-labelledby="recognitions-heading">
        <SectionHeading id="recognitions-heading" title="Recognitions" />
        {recognitions.length ? (
          <ul className="mt-5 divide-y divide-solid divide-border">
            {recognitions.map((recognition) => (
              <li key={recognition.id}>
                <RecognitionRow
                  title={recognition.title}
                  iconName={recognition.iconName}
                  verificationUrl={recognition.verificationUrl}
                  articleSlug={recognition.articleSlug}
                  images={recognition.images}
                  mediaBase={profileImageBase}
                />
              </li>
            ))}
          </ul>
        ) : (
          <RecognitionsEmptyState>
            Recognition entries will appear here once published.
          </RecognitionsEmptyState>
        )}
        {/* Outside the conditional, so it survives an empty list: the archive
            can hold plenty while nothing here is pinned. The fragment lands on
            the recognitions section of the writing page rather than its top. */}
        <Link
          href="/writing#recognitions"
          data-bippy-reaction="curious"
          data-bippy-safe-zone
          className="mt-4 inline-block text-[13px] text-muted-foreground underline decoration-border underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground focus-visible:text-foreground"
        >
          View more →
        </Link>
      </section>

      <TechStackSection items={techStack} />

      {/* The page closes on an invitation rather than trailing off after the
          tech stack, and it is one sentence rather than a heading over two
          buttons: the invitation and the two ways to accept it are the same
          thought. aria-label rather than aria-labelledby because there is no
          longer a heading to point at.

          Spaced closer than a section break on both sides. It is a closing
          line rather than another section, so a full gap above left it
          stranded between the stack and the footer instead of belonging to
          the end of the page. */}
      <section id="contact" className="mt-14" aria-label="Get in touch">
        <p className="text-sm leading-7 text-muted-foreground">
          Open to a nice conversation,{" "}
          <SendMessageDialog
            email={settings.email}
            whatsappUrl={contactLinks.whatsapp}
          />
          .
        </p>
      </section>

      {/* Mounted by the pages that want him rather than the root layout. The
          layout wraps the admin too, and on the admin host the proxy serves
          the admin's projects page at /projects — the same pathname this
          companion keys on, so he was appearing over the admin. */}
      <BippyCompanion enabled={settings.publicBippyEnabled} />

      <footer className="mt-5 flex items-center justify-between gap-4 font-mono text-xs text-muted-foreground">
        <p>
          <span aria-hidden="true">© </span>
          <span className="font-semibold">{`@${portfolioIdentity.handle}`}</span>
          <span className="sr-only">, Aliameen Kareem</span>
        </p>
        <nav aria-label="Footer social links">
          {/* Pulled left by the icon box's own padding, so the first glyph
                lines up with the text above rather than sitting inset. */}
          <ul className="-mr-2.5 flex items-center">
            {footerSocialItems.map((item) => {
              const Icon = item.icon;
              const className =
                "inline-flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-primary focus-visible:text-primary";

              return (
                <li key={item.label}>
                  {item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.label}
                      data-bippy-reaction="curious"
                      data-bippy-safe-zone
                      className={className}
                    >
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </a>
                  ) : (
                    <span
                      role="img"
                      aria-label={item.label}
                      className="inline-flex size-9 items-center justify-center text-muted-foreground opacity-50"
                    >
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </footer>
    </main>
  );
}
