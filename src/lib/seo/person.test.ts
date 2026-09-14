import { describe, expect, it } from "vitest";
import {
  personJsonLd,
  publicPerson,
  publicProfileUrls,
} from "@/lib/seo/person";

describe("public person identity", () => {
  it("keeps only valid HTTPS profile URLs in stable order", () => {
    expect(
      publicProfileUrls({
        instagram: "https://instagram.com/onerandomd3v",
        github: "https://github.com/onerandomd3v",
        x: "javascript:alert(1)",
        whatsapp: "https://wa.me/2340000000000",
      }),
    ).toEqual([
      "https://github.com/onerandomd3v",
      "https://instagram.com/onerandomd3v",
    ]);
  });

  it("builds one stable Person entity for the domain and social profiles", () => {
    const person = publicPerson(
      { name: "Aliameen Kareem", role: "Full-Stack Engineer" },
      { github: "https://github.com/onerandomd3v" },
      "https://onerandomdev.cv/writing",
    );

    expect(personJsonLd(person)).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://onerandomdev.cv/#person",
      name: "Aliameen Kareem",
      alternateName: "onerandomd3v",
      url: "https://onerandomdev.cv",
      jobTitle: "Full-Stack Engineer",
      sameAs: ["https://github.com/onerandomd3v"],
    });
  });
});
