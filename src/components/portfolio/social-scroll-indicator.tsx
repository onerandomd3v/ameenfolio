"use client";

import { useEffect, useState } from "react";

export function SocialScrollIndicator({
  containerId,
}: {
  containerId: string;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const update = () => {
      const max = container.scrollWidth - container.clientWidth;
      setProgress(max > 0 ? container.scrollLeft / max : 0);
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [containerId]);

  return (
    <div
      className="mx-auto mt-3 h-0.5 w-12 overflow-hidden rounded-full bg-muted-foreground/20 sm:hidden"
      aria-hidden="true"
    >
      <span
        className="block h-full w-4 rounded-full bg-foreground/70 transition-transform duration-150"
        style={{ transform: `translateX(${progress * 32}px)` }}
      />
    </div>
  );
}
