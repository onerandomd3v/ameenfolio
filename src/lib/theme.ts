import "client-only";

// The same key the inline script in layout.tsx reads before first paint.
const STORAGE_KEY = "theme";

const TRANSITION_MS = 400;

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

function clearThemeTransition(root: HTMLElement) {
  delete root.dataset.themeTransition;
  root.style.removeProperty("--theme-transition-duration");
  root.style.removeProperty("--theme-transition-clip-from");
}

/**
 * Flips the theme and remembers the choice.
 *
 * Lives here rather than inside the toggle button because two things reach for
 * it now — the button, and a double-click on Bippy. A second copy would be a
 * second place for the storage key to be spelled.
 */
export function toggleTheme(origin?: HTMLElement | null) {
  const root = document.documentElement;
  if (root.dataset.themeTransition === "active") return;
  const next = !root.classList.contains("dark");

  // Pratham's transition is a native View Transition: the new theme expands
  // from the toggle button as a circular reveal. The API is progressive, so
  // older browsers still get the existing colour cross-fade below.
  const transitionDocument = document as ViewTransitionDocument;
  if (typeof transitionDocument.startViewTransition === "function") {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const bounds = origin?.getBoundingClientRect();
    const x = bounds ? bounds.left + bounds.width / 2 : width / 2;
    const y = bounds ? bounds.top + bounds.height / 2 : height / 2;
    const xPercent = (x / width) * 100;
    const yPercent = (y / height) * 100;
    const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const maxRadius = Math.hypot(width, height) / Math.SQRT2;
    const clipFrom = `circle(0% at ${xPercent}% ${yPercent}%)`;
    const clipTo = `circle(${(radius / maxRadius) * 100}% at ${xPercent}% ${yPercent}%)`;

    root.dataset.themeTransition = "active";
    root.style.setProperty("--theme-transition-duration", `${TRANSITION_MS}ms`);
    root.style.setProperty("--theme-transition-clip-from", clipFrom);

    const transition = transitionDocument.startViewTransition(() => {
      applyTheme(root, next);
    });

    transition.ready
      .then(() => {
        root.animate({ clipPath: [clipFrom, clipTo] }, {
          duration: TRANSITION_MS,
          easing: "ease-in-out",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        } as KeyframeAnimationOptions & { pseudoElement: string });
      })
      .catch(() => undefined);
    transition.finished
      .catch(() => undefined)
      .finally(() => clearThemeTransition(root));
    return;
  }

  // Colours cross-fade only while the theme is changing. A permanent global
  // transition would also ease every hover and focus change.
  root.dataset.themeTransition = "fallback";
  window.setTimeout(() => {
    delete root.dataset.themeTransition;
  }, 240);
  applyTheme(root, next);
}

function applyTheme(root: HTMLElement, next: boolean) {
  root.classList.toggle("dark", next);
  root.style.colorScheme = next ? "dark" : "light";

  try {
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  } catch {
    // Storage throws in some privacy modes. The class is already set, so the
    // choice still holds for this page.
  }
}
