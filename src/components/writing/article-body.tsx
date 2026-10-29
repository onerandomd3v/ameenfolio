"use client";

import { useEffect, useRef } from "react";

export function watchArticleImages(images: Iterable<HTMLImageElement>) {
  const cleanups = Array.from(images, (image) => {
    const markLoaded = () => image.classList.add("is-loaded");
    if (image.complete) markLoaded();
    else image.addEventListener("load", markLoaded, { once: true });
    return () => image.removeEventListener("load", markLoaded);
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

export function ArticleBody({
  html,
  className = "post-body mt-8",
}: {
  html: string;
  className?: string;
}) {
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const images = articleRef.current?.querySelectorAll("img");
    if (!images) return;
    return watchArticleImages(images);
  }, [html]);

  return (
    <article
      ref={articleRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
