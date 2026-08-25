import "server-only";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyIndexNow } from "@/lib/indexnow";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fields?: Record<string, string[]> };

export function validationFailure(error: {
  flatten: () => { fieldErrors: Record<string, string[]> };
}): ActionResult {
  return {
    ok: false,
    message: "Please correct the highlighted fields.",
    fields: error.flatten().fieldErrors,
  };
}

// No tag invalidation: the public queries are no longer wrapped in a data
// cache, so there is no tagged entry left to expire. Clearing the route cache
// for the two public pages is what remains.
export function refreshPublicContent() {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath("/writing");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
  revalidatePath("/api/public/writing");

  // Search-engine discovery is best-effort and runs after the mutation
  // response, so an IndexNow outage can never turn a successful admin save
  // into an error. These are the stable public indexes affected by content
  // mutations across projects, writing, profile and homepage sections.
  scheduleIndexNow(["/", "/projects", "/writing"]);
}

export function scheduleIndexNow(urls: Iterable<string>) {
  const queued = Array.from(urls);
  if (!queued.length) return;
  after(() => notifyIndexNow(queued));
}
