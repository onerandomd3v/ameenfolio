"use server";

import { randomUUID } from "node:crypto";
import { eq, ne, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
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
    if (id) {
      const [existing] = await db
        .select({ id: experiences.id, pinned: experiences.pinned })
        .from(experiences)
        .where(eq(experiences.id, id))
        .limit(1);
      if (!existing) return { ok: false, message: "Experience not found." };
      if (existing.pinned && !value.pinned) {
        return {
          ok: false,
          message:
            "The current status must stay pinned. Edit it or pin another entry first.",
        };
      }
    }

    const experienceId = id ?? randomUUID();
    const experienceMutation = id
      ? db.update(experiences).set(data).where(eq(experiences.id, id))
      : db
          .insert(experiences)
          .values({ id: experienceId, ...data, displayOrder: 0 });
    const writes: BatchItem<"pg">[] = [experienceMutation];

    if (value.pinned) {
      const unpin = db
        .update(experiences)
        .set({ pinned: false, updatedAt: new Date() });
      writes.unshift(id ? unpin.where(ne(experiences.id, id)) : unpin);
    }
    if (id) {
      writes.push(
        db
          .delete(experienceHighlights)
          .where(eq(experienceHighlights.experienceId, id)),
      );
    }
    if (value.highlights.length) {
      writes.push(
        db.insert(experienceHighlights).values(
          value.highlights.map((highlight, index) => ({
            experienceId,
            body: highlight.body,
            displayOrder: index,
          })),
        ),
      );
    }

    // neon-http has no callback transaction API. Its batch endpoint executes
    // the statements atomically, matching the established writing and
    // recognition save paths in this repository.
    await db.batch(writes as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
    refreshPublicContent();
    return { ok: true, id: experienceId };
  } catch (error) {
    logServer("error", "crud.experience_failed", { id, error: String(error) });
    return { ok: false, message: "The experience could not be saved." };
  }
}

export async function deleteExperience(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const [existing] = await getDb()
      .select({ pinned: experiences.pinned })
      .from(experiences)
      .where(eq(experiences.id, id))
      .limit(1);
    if (existing?.pinned) {
      return {
        ok: false,
        message: "The current status cannot be deleted. Unpin it first.",
      };
    }
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
  if (!ids.length) return { ok: true };
  try {
    const db = getDb();
    const requestedIds = sql`ARRAY[${sql.join(
      ids.map((id) => sql`${id}::uuid`),
      sql`, `,
    )}]::uuid[]`;
    const { rows } = await db.execute(sql`
      with requested as (
        select id, position
        from unnest(${requestedIds}) with ordinality as request(id, position)
      ),
      current_set as (
        select
          array_agg(${experiences.id} order by ${experiences.id}) as ids,
          count(*)::int as count
        from ${experiences}
      ),
      requested_set as (
        select
          array_agg(id order by id) as ids,
          count(*)::int as count
        from requested
      ),
      updated as (
        update ${experiences} as experience
        set display_order = requested.position - 1,
            updated_at = now()
        from requested, current_set, requested_set
        where experience.id = requested.id
          and current_set.count = requested_set.count
          and current_set.ids = requested_set.ids
        returning experience.id
      )
      select
        (select count(*)::int from updated) = (select count(*) from requested)
          as applied
    `);
    if (!rows[0]?.applied) {
      return {
        ok: false,
        message:
          "This experience order is stale. Prepare a new reorder proposal.",
      };
    }
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.experience_reorder_failed", {
      error: String(error),
    });
    return { ok: false, message: "The experiences could not be reordered." };
  }
}
