import { describe, expect, it } from "vitest";
import { buildRssFeed } from "@/lib/writing/rss";

describe("RSS writing feed", () => {
  it("renders canonical article entries and escapes XML-sensitive content", () => {
    const feed = buildRssFeed({
      title: "Aliameen Kareem — Writing",
      description: "Products & engineering notes",
      siteUrl: "https://onerandomdev.cv/writing",
      feedUrl: "https://onerandomdev.cv/feed.xml",
      articles: [
        {
          title: "Building <Bippy> & MCP",
          description: 'A controlled "assistant".',
          url: "https://onerandomdev.cv/writing/building-bippy",
          publishedAt: "2026-08-13T00:00:00.000Z",
          modifiedAt: "2026-08-21T12:00:00.000Z",
        },
      ],
    });

    expect(feed).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(feed).toContain("Building &lt;Bippy&gt; &amp; MCP");
    expect(feed).toContain("Products &amp; engineering notes");
    expect(feed).toContain("A controlled &quot;assistant&quot;.");
    expect(feed).toContain(
      '<guid isPermaLink="true">https://onerandomdev.cv/writing/building-bippy</guid>',
    );
    expect(feed).toContain("Thu, 13 Aug 2026 00:00:00 GMT");
    expect(feed).toContain("Fri, 21 Aug 2026 12:00:00 GMT");
  });

  it("renders a valid empty channel without inventing a build date", () => {
    const feed = buildRssFeed({
      title: "Writing",
      description: "Published writing",
      siteUrl: "https://onerandomdev.cv/writing",
      feedUrl: "https://onerandomdev.cv/feed.xml",
      articles: [],
    });

    expect(feed).toContain("<channel>");
    expect(feed).not.toContain("<item>");
    expect(feed).not.toContain("<lastBuildDate>");
  });
});
