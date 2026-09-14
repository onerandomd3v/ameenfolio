"use server";

import { eq } from "drizzle-orm";
import {
  refreshPublicContent,
  validationFailure,
  type ActionResult,
} from "@/app/admin/actions/shared";
import { getDb } from "@/db/client";
import { techStackCategories, techStackItems } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/server";
import { logServer } from "@/lib/logger";
import { slugifyTechStackCategory } from "@/config/tech-stack";
import {
  techStackCategorySchema,
  type TechStackCategoryInput,
} from "@/lib/validation";
import { techStackCategoryOrderSchema } from "@/lib/validation";

export async function saveTechStackCategory(
  input: TechStackCategoryInput,
  id?: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = techStackCategorySchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const key = slugifyTechStackCategory(parsed.data.name);
  if (!key)
    return {
      ok: false,
      message: "Category name must contain a letter or number.",
    };

  try {
    if (id) {
      const current = await getDb()
        .select({ key: techStackCategories.key })
        .from(techStackCategories)
        .where(eq(techStackCategories.id, id))
        .limit(1);
      if (!current[0]) return { ok: false, message: "Category not found." };
      const db = getDb();
      const updatedAt = new Date();
      await db.batch([
        db
          .update(techStackCategories)
          .set({
            key,
            name: parsed.data.name.trim(),
            visible: parsed.data.visible,
            updatedAt,
          })
          .where(eq(techStackCategories.id, id)),
      ]);
    } else {
      await getDb()
        .insert(techStackCategories)
        .values({ ...parsed.data, key, name: parsed.data.name.trim() });
    }
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.tech_stack_category_save_failed", {
      error: String(error),
    });
    return {
      ok: false,
      message: "Category could not be saved. Its name may already exist.",
    };
  }
}

export async function deleteTechStackCategory(
  id: string,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const category = await getDb()
      .select({ key: techStackCategories.key })
      .from(techStackCategories)
      .where(eq(techStackCategories.id, id))
      .limit(1);
    if (!category[0]) return { ok: false, message: "Category not found." };
    const assigned = await getDb()
      .select({ id: techStackItems.id })
      .from(techStackItems)
      .where(eq(techStackItems.groupKey, category[0].key));
    if (assigned.length) {
      return {
        ok: false,
        message: "Move its technologies before deleting this category.",
      };
    }
    await getDb()
      .delete(techStackCategories)
      .where(eq(techStackCategories.id, id));
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.tech_stack_category_delete_failed", {
      error: String(error),
    });
    return { ok: false, message: "Category could not be deleted." };
  }
}

export async function reorderTechStackCategories(
  order: { id: string; displayOrder: number }[],
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = techStackCategoryOrderSchema.safeParse(order);
  if (!parsed.success)
    return { ok: false, message: "Could not read the category order." };
  if (!parsed.data.length) return { ok: true };

  try {
    const db = getDb();
    const updatedAt = new Date();
    const writes = parsed.data.map((row) =>
      db
        .update(techStackCategories)
        .set({ displayOrder: row.displayOrder, updatedAt })
        .where(eq(techStackCategories.id, row.id)),
    );
    await db.batch(writes as [(typeof writes)[number], ...typeof writes]);
    refreshPublicContent();
    return { ok: true };
  } catch (error) {
    logServer("error", "crud.tech_stack_category_reorder_failed", {
      error: String(error),
    });
    return { ok: false, message: "Category order could not be saved." };
  }
}
