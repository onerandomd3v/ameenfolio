import {
  getIdentitySettings,
  getPublishedPostDiscoverySummaries,
} from "@/db/queries";
import { getServerEnv } from "@/lib/env";
import { resolveIdentity } from "@/lib/identity";
import { logServer } from "@/lib/logger";
import { toPublicArticleSummary } from "@/lib/writing/public-content";
import { buildRssFeed } from "@/lib/writing/rss";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const baseUrl = getServerEnv().CANONICAL_SITE_URL.replace(/\/$/, "");
    const [settings, posts] = await Promise.all([
      getIdentitySettings(),
      getPublishedPostDiscoverySummaries(),
    ]);
    const identity = resolveIdentity(settings);
    const feed = buildRssFeed({
      title: `${identity.name} — Writing`,
      description: `Articles and engineering notes by ${identity.name}, ${identity.role}.`,
      siteUrl: `${baseUrl}/writing`,
      feedUrl: `${baseUrl}/feed.xml`,
      articles: posts.map((post) => toPublicArticleSummary(post, baseUrl)),
    });

    return new Response(feed, {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": "application/rss+xml; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, follow",
      },
    });
  } catch (error) {
    logServer("error", "public.rss_failed", { error: String(error) });
    return new Response("Writing feed is temporarily unavailable.\n", {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "Retry-After": "60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
}
