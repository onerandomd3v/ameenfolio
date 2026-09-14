import { cn } from "@/lib/utils";

type GenerativeLoaderProps = {
  label?: string;
  className?: string;
};

/** Accessible, reduced-motion-friendly generative-style loader for async UI. */
export function GenerativeInlineLoader({
  label = "Loading",
  className,
}: GenerativeLoaderProps) {
  return (
    <span
      className={cn("generative-inline-loader", className)}
      role="status"
      aria-label={label}
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
    </span>
  );
}

export function GenerativeTextLoader({
  label = "Loading",
  className,
}: GenerativeLoaderProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <GenerativeInlineLoader label={label} />
      <span>{label}</span>
    </span>
  );
}

export function GenerativeImageLoader({
  label = "Loading image",
  className,
}: GenerativeLoaderProps) {
  return (
    <span
      className={cn("generative-image-loader", className)}
      role="status"
      aria-label={label}
    >
      <span aria-hidden="true" />
    </span>
  );
}
