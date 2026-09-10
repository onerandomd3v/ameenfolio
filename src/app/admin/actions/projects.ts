"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { projectHighlights, projects } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { assertStoredUpload, deleteObject } from "@/lib/storage/server";
import { projectSchema, type ProjectInput } from "@/lib/validation";

export async function saveProject(
  input: ProjectInput,
  id?: string,
  publish?: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  // published is not on the form. Creating from the Post button publishes;
  // saving a draft leaves it alone, which is what `publish` carries.
  const values = {
    ...parsed.data,
    githubUrl: parsed.data.githubUrl || null,
    iconKey: parsed.data.iconKey ?? null,
    iconAlt: parsed.data.iconAlt || null,
    ...(publish === undefined ? {} : { published: publish }),
  };
  try {
    if (values.iconKey) {
      await assertStoredUpload(values.iconKey, "icon");
    }
    if (id) {
      const previous = await getDb()
        .select({ iconKey: projects.iconKey })
        .from(projects)
        .where(eq(projects.id, id));
      const [row] = await getDb()
        .update(projects)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning({ id: projects.id });
      if (!row) return { ok: false, message: "Project not found." };
      if (parsed.data.highlights !== undefined) {
        const rows = parsed.data.highlights.map((highlight, index) => ({
          projectId: id,
          body: highlight.body,
          displayOrder: index,
        }));
        const highlightWrites: BatchItem<"pg">[] = [
          getDb()
            .delete(projectHighlights)
            .where(eq(projectHighlights.projectId, id)),
        ];
        if (rows.length) {
          highlightWrites.push(getDb().insert(projectHighlights).values(rows));
        }
        await getDb().batch(
          highlightWrites as [BatchItem<"pg">, ...BatchItem<"pg">[]],
        );
      }
      refreshPublicContent();
      if (previous[0]?.iconKey !== values.iconKey) {
        await deleteObject(previous[0]?.iconKey);
      }
      return { ok: true, id: row.id };
    }

    const projectId = randomUUID();
    const writes: BatchItem<"pg">[] = [
      getDb()
        .insert(projects)
        .values({ ...values, id: projectId }),
    ];
    if (parsed.data.highlights?.length) {
      writes.push(
        getDb()
          .insert(projectHighlights)
          .values(
            parsed.data.highlights.map((highlight, index) => ({
              projectId,
              body: highlight.body,
              displayOrder: index,
            })),
          ),
      );
    }
    await getDb().batch(writes as [BatchItem<"pg">, ...BatchItem<"pg">[]]);
    refreshPublicContent();
    return { ok: true, id: projectId };
  } catch (error) {
    logServer("error", "crud.project_failed", { id, error: String(error) });
    return { ok: false, message: "The project could not be saved." };
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const [deleted] = await getDb()
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ iconKey: projects.iconKey });
    if (!deleted) return { ok: false, message: "Project not found." };
    refreshPublicContent();
    await deleteObject(deleted.iconKey);
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.project_delete_failed", {
      id,
      error: String(error),
    });
    return { ok: false, message: "The project could not be deleted." };
  }
}
