"use server";

import { eq, ne } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { experienceHighlights, experiences } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { experienceSchema, type ExperienceInput } from "@/lib/validation";

export async function saveExperience(
  input: ExperienceInput,
  id?: string,
  publish = false,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const value = parsed.data;
  const db = getDb();
  try {
    const dates = {
      startDate: new Date(`${value.startDate}T00:00:00.000Z`),
      endDate: value.endDate
        ? new Date(`${value.endDate}T00:00:00.000Z`)
        : null,
    };
    const data = {
      company: value.company,
      role: value.role,
      ...dates,
      location: value.location || null,
      iconName: value.iconName,
      pinned: value.pinned,
      published: publish,
      updatedAt: new Date(),
    };
    const result = await db.transaction(async (tx) => {
      let experienceId = id;
      if (value.pinned) {
        const unpin = tx
          .update(experiences)
          .set({ pinned: false, updatedAt: new Date() });
        if (id) await unpin.where(ne(experiences.id, id));
        else await unpin;
      }
      if (id) {
        const [row] = await tx
          .update(experiences)
          .set(data)
          .where(eq(experiences.id, id))
          .returning({ id: experiences.id });
        if (!row) return null;
        await tx
          .delete(experienceHighlights)
          .where(eq(experienceHighlights.experienceId, id));
      } else {
        const [{ id: createdId }] = await tx
          .insert(experiences)
          .values({ ...data, displayOrder: 0 })
          .returning({ id: experiences.id });
        experienceId = createdId;
      }
      if (value.highlights.length) {
        await tx.insert(experienceHighlights).values(
          value.highlights.map((highlight, index) => ({
            experienceId: experienceId!,
            body: highlight.body,
            displayOrder: index,
          })),
        );
      }
      return experienceId;
    });
    if (!result) return { ok: false, message: "Experience not found." };
    refreshPublicContent();
    return { ok: true, id: result };
  } catch (error) {
    logServer("error", "crud.experience_failed", { id, error: String(error) });
    return { ok: false, message: "The experience could not be saved." };
  }
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const [row] = await getDb()
      .delete(experiences)
      .where(eq(experiences.id, id))
      .returning({ id: experiences.id });
    if (!row) return { ok: false, message: "Experience not found." };
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.experience_delete_failed", {
      id,
      error: String(error),
    });
    return { ok: false, message: "The experience could not be deleted." };
  }
}

export async function reorderExperiences(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  try {
    const db = getDb();
    await db.transaction(async (tx) => {
      for (const [index, id] of ids.entries()) {
        await tx
          .update(experiences)
          .set({ displayOrder: index, updatedAt: new Date() })
          .where(eq(experiences.id, id));
      }
    });
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.experience_reorder_failed", {
      error: String(error),
    });
    return { ok: false, message: "The experiences could not be reordered." };
  }
}
