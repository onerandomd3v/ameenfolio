"use client";

import { useEffect, useRef } from "react";

export function ArticleBody({ html }: { html: string }) {
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const images = articleRef.current?.querySelectorAll("img");
    if (!images) return;

    const cleanups = Array.from(images, (image) => {
      const markLoaded = () => image.classList.add("is-loaded");
      if (image.complete) markLoaded();
      else image.addEventListener("load", markLoaded, { once: true });
      return () => image.removeEventListener("load", markLoaded);
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [html]);

  return (
    <article
      ref={articleRef}
      className="post-body mt-8"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
