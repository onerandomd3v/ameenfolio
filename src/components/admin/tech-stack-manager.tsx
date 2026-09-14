"use client";

import { useRef, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  LoaderCircle,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteTechStackItem,
  reorderTechStack,
  saveTechStackItem,
} from "@/app/admin/actions/tech-stack";
import {
  AdminPage,
  FieldNote,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { LineInput } from "@/components/admin/line-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  hasTechStackIcon,
  searchTechStackIcons,
  TechStackIcon,
} from "@/config/tech-stack-icons";
import type { TechStackCategory, TechStackItem } from "@/db/schema";
import { cn } from "@/lib/utils";

// Order is the list itself, so it is changed by moving things rather than by
// typing a number. Dragging across groups is also how a technology changes
// group — one gesture, not two fields.
export function TechStackManager({
  items,
  categories,
}: {
  items: TechStackItem[];
  categories: TechStackCategory[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [editing, setEditing] = useState<TechStackItem | null>(null);
  const [name, setName] = useState("");
  const [iconKey, setIconKey] = useState<string | null>(null);
  const [iconQuery, setIconQuery] = useState("");
  const [busy, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement | null>(null);

  // Server state wins whenever it changes underneath us — a save elsewhere, or
  // the refresh after our own write. Adjusted during render rather than in an
  // effect: an effect would paint the stale order first and then correct it.
  const [seen, setSeen] = useState(items);
  if (seen !== items) {
    setSeen(items);
    setRows(items);
  }

  function grouped(group: string) {
    return rows.filter((row) => row.groupKey === group);
  }

  function commit(next: TechStackItem[]) {
    setRows(next);
    startTransition(async () => {
      const result = await reorderTechStack(
        next.map((row, index) => ({
          id: row.id,
          groupKey: row.groupKey,
          displayOrder: index,
        })),
      );
      if (!result.ok) {
        toast.error(result.message);
        setRows(items);
        return;
      }
      router.refresh();
    });
  }

  function drop(group: string, beforeId: string | null) {
    if (!dragging) return;
    // Dropped on itself: `without` has already removed it, so looking for it
    // finds nothing and the fallback would send it to the end of the last
    // group. Releasing where you started should change nothing.
    if (beforeId === dragging) {
      setDragging(null);
      setOver(null);
      return;
    }
    const moving = rows.find((row) => row.id === dragging);
    if (!moving) return;

    const without = rows.filter((row) => row.id !== dragging);
    const moved = { ...moving, groupKey: group };
    const at = beforeId
      ? without.findIndex((row) => row.id === beforeId)
      : without.length;
    const next = [...without];
    next.splice(at === -1 ? without.length : at, 0, moved);

    setDragging(null);
    setOver(null);
    commit(next);
  }

  // Dragging is mouse-only, so the same move is reachable from the keyboard.
  function nudge(item: TechStackItem, direction: -1 | 1) {
    const siblings = grouped(item.groupKey);
    const at = siblings.indexOf(item);
    const to = at + direction;
    if (to < 0 || to >= siblings.length) return;
    const target = siblings[to];
    const without = rows.filter((row) => row.id !== item.id);
    const insertAt = without.indexOf(target) + (direction === 1 ? 1 : 0);
    const next = [...without];
    next.splice(insertAt, 0, item);
    commit(next);
  }

  function add() {
    if ((!adding && !editing) || !name.trim()) return;
    startTransition(async () => {
      const result = await saveTechStackItem(
        {
          name: name.trim(),
          iconKey,
          groupKey: editing?.groupKey ?? adding!,
          // One past the highest order in use, not the group's size. `commit`
          // numbers by position in the flat list across both groups, so a group's
          // items can hold 5, 6, 7 — and a count of 3 would sort the new item
          // before them, contradicting "It joins the end of the group".
          displayOrder:
            editing?.displayOrder ??
            rows.reduce(
              (highest, row) => Math.max(highest, row.displayOrder),
              -1,
            ) + 1,
          featured: false,
          visible: true,
        },
        editing?.id,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(editing ? "Icon updated." : "Added.");
      setAdding(null);
      setEditing(null);
      setName("");
      setIconKey(null);
      setIconQuery("");
      router.refresh();
    });
  }

  function editIcon(item: TechStackItem) {
    setEditing(item);
    setName(item.name);
    setIconKey(item.iconKey);
    setIconQuery(item.iconKey ?? item.name);
  }

  function remove(item: TechStackItem) {
    startTransition(async () => {
      const result = await deleteTechStackItem(item.id);
      toast[result.ok ? "success" : "error"](
        result.ok ? "Removed." : result.message,
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <AdminPage title="Tech Stack">
      <div className="max-w-[720px]">
        {categories.map((group, index) => (
          <div key={group.key} className={cn(index > 0 && "mt-8")}>
            <SectionHeading
              meta={
                <span className="font-mono tabular-nums">
                  {grouped(group.key).length}
                </span>
              }
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdding(group.key)}
                >
                  <Plus data-icon="inline-start" />
                  Add
                </Button>
              }
            >
              {group.name}
            </SectionHeading>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setOver(group.key);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={() => drop(group.key, null)}
              className={cn(
                "flex min-h-[46px] flex-wrap gap-2 rounded-lg py-1 transition-colors",
                over === group.key &&
                  "outline outline-1 outline-dashed outline-border",
              )}
            >
              {grouped(group.key).map((item) => (
                <span
                  key={item.id}
                  draggable
                  tabIndex={0}
                  onDragStart={() => setDragging(item.id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setOver(null);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.stopPropagation();
                    drop(group.key, item.id);
                  }}
                  onKeyDown={(event) => {
                    if (!event.altKey) return;
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      nudge(item, -1);
                    } else if (event.key === "ArrowRight") {
                      event.preventDefault();
                      nudge(item, 1);
                    }
                  }}
                  className={cn(
                    "group inline-flex cursor-grab items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12.5px] transition-colors hover:text-foreground select-none active:cursor-grabbing",
                    dragging === item.id && "opacity-40",
                  )}
                >
                  <GripVertical
                    className="size-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <TechStackIcon name={item.name} iconKey={item.iconKey} />
                  {item.name}
                  <span className="inline-flex items-center gap-0.5 sm:hidden">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        nudge(item, -1);
                      }}
                      aria-label={`Move ${item.name} up`}
                      className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                      disabled={grouped(item.groupKey)[0]?.id === item.id}
                    >
                      <ChevronUp className="size-3" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        nudge(item, 1);
                      }}
                      aria-label={`Move ${item.name} down`}
                      className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                      disabled={grouped(item.groupKey).at(-1)?.id === item.id}
                    >
                      <ChevronDown className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      editIcon(item);
                    }}
                    aria-label={`Choose icon for ${item.name}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="size-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      remove(item);
                    }}
                    aria-label={`Remove ${item.name}`}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
              {!grouped(group.key).length ? (
                <span className="py-1 text-[12.5px] text-muted-foreground">
                  Nothing here yet.
                </span>
              ) : null}
            </div>
          </div>
        ))}

        <FieldNote>
          Every technology appears on the portfolio in its category. Keyboard:
          focus a chip and hold Alt with the arrow keys to move it.
          {busy ? " Saving…" : ""}
        </FieldNote>
      </div>

      <Dialog
        open={adding !== null || editing !== null}
        onOpenChange={(next) => {
          if (!next) {
            setAdding(null);
            setEditing(null);
            setName("");
            setIconKey(null);
            setIconQuery("");
          }
        }}
      >
        <DialogContent className="admin-theme sm:max-w-md">
          <DialogHeader>
            {/* Which group is not a question — it is the button that was
                pressed. The heading says where it is going. */}
            <DialogTitle>
              Add to{" "}
              {editing
                ? `Edit ${editing.name}`
                : categories.find((group) => group.key === adding)?.name}
            </DialogTitle>
            <DialogDescription>
              It joins the end of the group. Drag it wherever you want
              afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 border-b border-border/60 py-3 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-center sm:gap-4">
            <span className="text-[13px] text-muted-foreground">Name</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/20">
                <TechStackIcon name={name} />
              </span>
              <LineInput
                ref={nameRef}
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    add();
                  }
                }}
                placeholder="e.g. Bun"
                className="min-w-0 flex-1"
              />
            </div>
          </div>
          <div className="grid gap-1.5 border-b border-border/60 py-3 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:items-start sm:gap-4">
            <span className="pt-2 text-[13px] text-muted-foreground">
              Custom icon
            </span>
            <div className="grid gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/20">
                  <TechStackIcon
                    name=""
                    iconKey={
                      iconKey ?? searchTechStackIcons(iconQuery, 1)[0]?.slug
                    }
                  />
                </span>
                <LineInput
                  value={iconQuery}
                  onChange={(event) => setIconQuery(event.target.value)}
                  placeholder="Search an icon"
                  className="min-w-0 flex-1"
                />
              </div>
              {iconKey ? (
                <button
                  type="button"
                  className="flex w-fit items-center gap-2 rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground"
                  onClick={() => setIconKey(null)}
                >
                  <TechStackIcon name="" iconKey={iconKey} />
                  {iconKey} · use automatic matching
                </button>
              ) : null}
              {iconQuery.trim() ? (
                <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                  {searchTechStackIcons(iconQuery).map((icon) => (
                    <button
                      key={icon.slug}
                      type="button"
                      title={`Use ${icon.title}`}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] transition-colors hover:border-foreground/40",
                        iconKey === icon.slug
                          ? "border-foreground/50 text-foreground"
                          : "border-border text-muted-foreground",
                      )}
                      onClick={() => setIconKey(icon.slug)}
                    >
                      <TechStackIcon name="" iconKey={icon.slug} />
                      {icon.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {name.trim() ? (
            <div
              role="status"
              className="flex items-center gap-2 py-3 text-[12.5px] text-muted-foreground"
            >
              <TechStackIcon name={name} iconKey={iconKey} />
              {iconKey || hasTechStackIcon(name)
                ? iconKey
                  ? `Using ${iconKey} — this is how it will appear on the portfolio.`
                  : "Icon matched automatically — this is how it will appear on the portfolio."
                : "No icon mapped yet — the technology name will still appear."}
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={add} disabled={busy || !name.trim()}>
              {busy ? (
                <LoaderCircle
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : null}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
