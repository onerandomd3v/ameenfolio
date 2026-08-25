export type RssArticle = {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  modifiedAt: string;
};

type RssFeedInput = {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  articles: RssArticle[];
};

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });
}

function rssDate(value: string) {
  return new Date(value).toUTCString();
}

export function buildRssFeed(input: RssFeedInput) {
  const lastModified = input.articles.reduce<string | null>(
    (latest, article) => {
      if (!latest) return article.modifiedAt;
      return Date.parse(article.modifiedAt) > Date.parse(latest)
        ? article.modifiedAt
        : latest;
    },
    null,
  );

  const items = input.articles
    .map(
      (article) => `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(article.url)}</link>
      <guid isPermaLink="true">${escapeXml(article.url)}</guid>
      <description>${escapeXml(article.description)}</description>
      <pubDate>${rssDate(article.publishedAt)}</pubDate>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(input.title)}</title>
    <link>${escapeXml(input.siteUrl)}</link>
    <description>${escapeXml(input.description)}</description>
    <language>en</language>
    <atom:link href="${escapeXml(input.feedUrl)}" rel="self" type="application/rss+xml" />${
      lastModified
        ? `\n    <lastBuildDate>${rssDate(lastModified)}</lastBuildDate>`
        : ""
    }
${items ? `${items}\n` : ""}  </channel>
</rss>
`;
}
