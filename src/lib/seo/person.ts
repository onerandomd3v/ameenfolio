import type { ContactLinks } from "@/db/schema";
import { portfolioIdentity } from "@/config/portfolio";

const publicProfileKeys = [
  "github",
  "x",
  "instagram",
  "linkedin",
  "youtube",
  "tiktok",
  "discord",
  "telegram",
] as const satisfies ReadonlyArray<keyof ContactLinks>;

export type PublicPerson = {
  name: string;
  role: string;
  url: string;
  sameAs: string[];
};

function canonicalOrigin(baseUrl: string) {
  return new URL(baseUrl).origin;
}

export function publicProfileUrls(contactLinks: ContactLinks) {
  return publicProfileKeys.flatMap((key) => {
    const value = contactLinks[key]?.trim();
    if (!value) return [];

    try {
      const url = new URL(value);
      return url.protocol === "https:" ? [url.toString()] : [];
    } catch {
      return [];
    }
  });
}

export function publicPerson(
  identity: { name: string; role: string },
  contactLinks: ContactLinks,
  baseUrl: string,
): PublicPerson {
  return {
    name: identity.name,
    role: identity.role,
    url: canonicalOrigin(baseUrl),
    sameAs: publicProfileUrls(contactLinks),
  };
}

export function personJsonLd(person: PublicPerson) {
  return {
    "@context": "https://schema.org",
    ...personAuthorJsonLd(person),
  };
}

export function personAuthorJsonLd(person: PublicPerson) {
  return {
    "@type": "Person",
    "@id": `${person.url}/#person`,
    name: person.name,
    alternateName: portfolioIdentity.handle,
    url: person.url,
    jobTitle: person.role,
    ...(person.sameAs.length ? { sameAs: person.sameAs } : {}),
  };
}
