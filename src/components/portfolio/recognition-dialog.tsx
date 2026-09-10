"use client";

import { useRef, useState } from "react";
import { ArrowUpRight, Newspaper } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GenerativeImageLoader } from "@/components/ui/generative-loader";
import { recognitionImageAlt } from "@/lib/recognition";
import { cn } from "@/lib/utils";

export type RecognitionDialogImage = {
  objectKey: string;
  /** Set only when this image was described individually. */
  alt: string | null;
};

type RecognitionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  images: RecognitionDialogImage[];
  articleSlug: string | null;
  verificationUrl: string | null;
  mediaBase?: string;
};

export function RecognitionDialog({
  open,
  onOpenChange,
  title,
  images,
  articleSlug,
  verificationUrl,
  mediaBase,
}: RecognitionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The close button is positioned by DialogContent at the dialog's top
          right, which is now over the first image rather than over background.
          A dark glyph on a pale certificate would be almost invisible, so it
          gets a scrim of its own here — scoped to this dialog rather than
          changed in the shared component, where every other dialog still opens
          onto a plain background and needs nothing. */}
      <DialogContent
        showCloseButton={false}
        className={cn(
          "w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden border-0 bg-transparent p-0 shadow-none sm:w-auto sm:max-w-[min(90vw,900px)]",
          "[&_[data-slot=dialog-close]]:z-10 [&_[data-slot=dialog-close]]:rounded-full",
          "[&_[data-slot=dialog-close]]:bg-background/70 [&_[data-slot=dialog-close]]:p-1",
          "[&_[data-slot=dialog-close]]:opacity-90 [&_[data-slot=dialog-close]]:backdrop-blur-sm",
          "[&_[data-slot=dialog-close]]:hover:opacity-100",
        )}
      >
        {images.length ? (
          <Carousel images={images} title={title} mediaBase={mediaBase} />
        ) : null}

        {/* The image and carousel dots stay visually free-standing. Only the
            caption and outward actions receive a card surface. */}
        <div className="mt-3 grid gap-3 rounded-[3px] border border-border bg-card p-4">
          <DialogTitle className="text-center text-base leading-6 text-balance">
            {title}
          </DialogTitle>

          <RecognitionActions
            articleSlug={articleSlug}
            verificationUrl={verificationUrl}
            onNavigate={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A scroll-snap strip rather than a carousel library.
 *
 * Swiping, momentum, and keyboard scrolling are what the browser already does
 * with an overflow container; a library would reimplement them in JavaScript to
 * arrive at the same place. Nothing drives the strip but the reader, so the
 * scroll position is the only state and nothing can disagree with what is on
 * screen.
 *
 * There are no prev/next buttons: the dots beneath already say there is more
 * to see, and on a touch screen the gesture is the obvious one.
 */
function Carousel({
  images,
  title,
  mediaBase,
}: {
  images: RecognitionDialogImage[];
  title: string;
  mediaBase?: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(
    () => new Set(),
  );
  const single = images.length === 1;

  // Derived from the scroll offset rather than tracked separately, so the dots
  // cannot end up describing a different image than the one on screen.
  function syncIndex() {
    const track = trackRef.current;
    if (!track || !track.clientWidth) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <div className="grid w-full min-w-0 gap-3">
      <ul
        ref={trackRef}
        onScroll={syncIndex}
        // tabIndex so the strip is reachable by keyboard: an overflow
        // container scrolls with arrow keys only once it can hold focus.
        tabIndex={single ? undefined : 0}
        aria-label={single ? undefined : `${images.length} images`}
        className={cn(
          "flex w-full min-w-0 snap-x snap-mandatory overflow-x-auto",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        {images.map((image, imageIndex) => (
          <li
            key={image.objectKey}
            className="relative flex min-h-48 min-w-0 flex-[0_0_100%] snap-center items-center justify-center overflow-hidden sm:min-h-64"
          >
            {!loadedImages.has(image.objectKey) ? (
              <GenerativeImageLoader
                label={`Loading image ${imageIndex + 1}`}
              />
            ) : null}
            {/* The stored file keeps its original proportions, so let the
                browser size it naturally instead of forcing a square frame. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                mediaBase
                  ? `${mediaBase}/${image.objectKey}`
                  : `/media/${image.objectKey}`
              }
              alt={recognitionImageAlt({
                alt: image.alt,
                title,
                index,
                total: images.length,
              })}
              // Serving the prepared WebP directly avoids an optimizer request
              // that otherwise starts only after the dialog opens.
              loading={imageIndex === 0 ? "eager" : "lazy"}
              fetchPriority={imageIndex === 0 ? "high" : "auto"}
              decoding="async"
              onLoad={() =>
                setLoadedImages((current) => {
                  const next = new Set(current);
                  next.add(image.objectKey);
                  return next;
                })
              }
              className={cn(
                "h-auto max-h-[75vh] max-w-full w-auto object-contain transition-opacity duration-200 sm:max-h-[70vh]",
                loadedImages.has(image.objectKey) ? "opacity-100" : "opacity-0",
              )}
            />
          </li>
        ))}
      </ul>

      {single ? null : (
        <ul className="flex justify-center gap-1.5" aria-hidden="true">
          {images.map((image, dotIndex) => (
            <li
              key={image.objectKey}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                dotIndex === index ? "bg-foreground" : "bg-border",
              )}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Only the buttons that lead somewhere are rendered.
 *
 * The same reasoning as the contact dialog's channel list: this exists to offer
 * a choice, and a greyed-out control is not one. A disabled button also cannot
 * take focus, so it explains itself to nobody using a keyboard or a screen
 * reader — it is simply a dead patch of the interface.
 */
function RecognitionActions({
  articleSlug,
  verificationUrl,
  onNavigate,
}: {
  articleSlug: string | null;
  verificationUrl: string | null;
  onNavigate: () => void;
}) {
  const actions = [
    articleSlug
      ? {
          key: "article",
          label: "Read Post",
          href: `/writing/${articleSlug}`,
          icon: Newspaper,
          external: false,
        }
      : null,
    verificationUrl
      ? {
          key: "post",
          // The recognition has one outward link — the post announcing it, or
          // the certificate proving it. Named for the commoner case.
          label: "View Post",
          href: verificationUrl,
          icon: ArrowUpRight,
          external: true,
        }
      : null,
  ].filter((action) => action !== null);

  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        const className =
          "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[3px] border border-border px-3 text-sm text-foreground transition-colors hover:bg-accent focus-visible:bg-accent";

        return action.external ? (
          <a
            key={action.key}
            href={action.href}
            target="_blank"
            rel="noreferrer"
            onClick={onNavigate}
            className={className}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {action.label}
          </a>
        ) : (
          <Link
            key={action.key}
            href={action.href}
            onClick={onNavigate}
            className={className}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
