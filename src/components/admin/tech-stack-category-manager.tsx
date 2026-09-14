"use client";

import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteTechStackCategory,
  reorderTechStackCategories,
  saveTechStackCategory,
} from "@/app/admin/actions/tech-stack-categories";
import { Button } from "@/components/ui/button";
import { LineInput } from "@/components/admin/line-input";
import type { TechStackCategory } from "@/db/schema";
import { cn } from "@/lib/utils";

export function TechStackCategoryManager({
  categories,
}: {
  categories: TechStackCategory[];
}) {
  const [rows, setRows] = useState(categories);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TechStackCategory | null>(null);
  const [busy, startTransition] = useTransition();

  const move = (category: TechStackCategory, direction: -1 | 1) => {
    const at = rows.findIndex((row) => row.id === category.id);
    const to = at + direction;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[at], next[to]] = [next[to], next[at]];
    setRows(next);
    startTransition(async () => {
      const result = await reorderTechStackCategories(
        next.map((row, index) => ({ id: row.id, displayOrder: index })),
      );
      if (!result.ok) {
        toast.error(result.message);
        setRows(categories);
        return;
      }
      window.location.reload();
    });
  };

  const drop = (beforeId: string | null) => {
    if (!dragging || dragging === beforeId) return;
    const moving = rows.find((row) => row.id === dragging);
    if (!moving) return;
    const without = rows.filter((row) => row.id !== dragging);
    const at = beforeId
      ? without.findIndex((row) => row.id === beforeId)
      : without.length;
    const next = [...without];
    next.splice(at < 0 ? without.length : at, 0, moving);
    setDragging(null);
    setOver(null);
    setRows(next);
    startTransition(async () => {
      const result = await reorderTechStackCategories(
        next.map((row, index) => ({ id: row.id, displayOrder: index })),
      );
      if (!result.ok) {
        toast.error(result.message);
        setRows(categories);
        return;
      }
      window.location.reload();
    });
  };

  function save() {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await saveTechStackCategory(
        {
          name,
          displayOrder: editing?.displayOrder ?? categories.length,
          visible: true,
        },
        editing?.id,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(editing ? "Category updated." : "Category added.");
      setName("");
      setAdding(false);
      setEditing(null);
      setRows(categories);
      window.location.reload();
    });
  }

  function remove(category: TechStackCategory) {
    startTransition(async () => {
      const result = await deleteTechStackCategory(category.id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Category removed." : result.message,
      );
      if (result.ok) window.location.reload();
    });
  }

  return (
    <section
      className="mb-8 max-w-[720px]"
      aria-labelledby="categories-heading"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 id="categories-heading" className="text-sm font-medium">
            Categories
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {categories.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setAdding(true);
            setEditing(null);
            setName("");
          }}
        >
          <Plus data-icon="inline-start" />
          Add
        </Button>
      </div>
      <div
        className="flex flex-wrap gap-2"
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => drop(null)}
      >
        {rows.map((category, index) => (
          <span
            key={category.id}
            draggable
            onDragStart={() => setDragging(category.id)}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setOver(category.id);
            }}
            onDrop={(event) => {
              event.stopPropagation();
              drop(category.id);
            }}
            className={cn(
              "inline-flex cursor-grab items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12.5px] active:cursor-grabbing",
              dragging === category.id && "opacity-40",
              over === category.id &&
                "outline outline-1 outline-dashed outline-border",
            )}
          >
            <GripVertical
              className="size-3 text-muted-foreground"
              aria-hidden="true"
            />
            {category.name}
            <span className="inline-flex items-center gap-0.5 sm:hidden">
              <button
                type="button"
                aria-label={`Move ${category.name} up`}
                disabled={index === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => move(category, -1)}
              >
                <ChevronUp className="size-3" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Move ${category.name} down`}
                disabled={index === rows.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                onClick={() => move(category, 1)}
              >
                <ChevronDown className="size-3" aria-hidden="true" />
              </button>
            </span>
            <button
              type="button"
              aria-label={`Rename ${category.name}`}
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                setEditing(category);
                setName(category.name);
              }}
            >
              <Pencil className="size-3" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Remove ${category.name}`}
              className="text-muted-foreground hover:text-destructive"
              onClick={() => remove(category)}
            >
              <Trash2 className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      {adding || editing ? (
        <div className="mt-3 flex max-w-md items-center gap-2">
          <LineInput
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                save();
              }
            }}
            placeholder="Category name"
          />
          <Button size="sm" onClick={save} disabled={busy || !name.trim()}>
            {editing ? "Save" : "Add"}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cancel category edit"
            onClick={() => {
              setAdding(false);
              setEditing(null);
              setName("");
            }}
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </section>
  );
}
