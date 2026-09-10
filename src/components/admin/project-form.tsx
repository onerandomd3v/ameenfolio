"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteProject, saveProject } from "@/app/admin/actions/projects";
import {
  AdminPage,
  FieldNote,
  FieldRow,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { LeaveGuard } from "@/components/admin/leave-guard";
import { LineInput, LineSelect } from "@/components/admin/line-input";
import { UploadField } from "@/components/admin/upload-field";
import { Button } from "@/components/ui/button";
import { projectIconOptions } from "@/config/project-icons";
import type { Project, ProjectHighlight } from "@/db/schema";
import { cleanupUpload } from "@/lib/storage/cleanup-upload";
import { useAdminBase } from "@/lib/use-admin-base";
import { projectSchema, type ProjectInput } from "@/lib/validation";
import { MAX_CARD_WORDS, countWords } from "@/lib/word-count";

const emptyProject: ProjectInput = {
  title: "",
  shortDescription: "",
  url: "https://",
  iconName: "custom",
  highlights: [],
};

export function ProjectForm({
  project,
  highlights = [],
}: {
  project?: Project;
  highlights?: ProjectHighlight[];
}) {
  const router = useRouter();
  const base = useAdminBase();
  const [leaving, setLeaving] = useState(false);
  const [leavingBusy, setLeavingBusy] = useState(false);
  const live = Boolean(project?.published);

  const form = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          title: project.title,
          shortDescription: project.shortDescription,
          url: project.url,
          githubUrl: project.githubUrl ?? undefined,
          iconKey: project.iconKey ?? undefined,
          iconAlt: project.iconAlt ?? undefined,
          iconName: project.iconName,
          highlights: highlights.map((item, index) => ({
            body: item.body,
            displayOrder: index,
          })),
        }
      : emptyProject,
  });
  const {
    register,
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = form;

  const iconName = useWatch({ control, name: "iconName" });
  const iconKey = useWatch({ control, name: "iconKey" });
  const description = useWatch({ control, name: "shortDescription" }) ?? "";
  const title = useWatch({ control, name: "title" }) ?? "";
  const { fields, append, remove } = useFieldArray({
    control,
    name: "highlights",
  });

  // What "unsaved work" means: anything typed. An untouched form has nothing
  // worth keeping, so leaving it needs no decision.
  const hasContent = Boolean(title.trim() || description.trim());

  async function persist(values: ProjectInput, publish: boolean) {
    const result = await saveProject(values, project?.id, publish);
    if (!result.ok) {
      if (values.iconKey && values.iconKey !== project?.iconKey) {
        await cleanupUpload(values.iconKey);
        setValue("iconKey", undefined);
      }
      Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
        setError(name as keyof ProjectInput, { message: messages[0] }),
      );
      toast.error(result.message);
      return false;
    }
    return true;
  }

  async function post(values: ProjectInput) {
    if (!(await persist(values, true))) return;
    toast.success(live ? "Project updated." : "Project posted.");
    router.push(`${base}/projects`);
    router.refresh();
  }

  function cancel() {
    // Already on the site, or nothing written: leaving needs no decision.
    if (live || !hasContent) {
      router.push(`${base}/projects`);
      return;
    }
    setLeaving(true);
  }

  // `isSubmitting` only covers handlers run through handleSubmit, and these two
  // are called straight from the leave guard. Without a flag of their own the
  // guard's buttons stay live for the whole request, and a second click starts
  // a second save — which, with no unique constraint on a project, inserts a
  // second row.
  async function saveDraft() {
    if (leavingBusy) return;
    setLeavingBusy(true);
    try {
      const values = getValues();
      if (!(await persist(values, false))) return;
      setLeaving(false);
      toast.success("Saved as a draft.");
      router.push(`${base}/projects`);
      router.refresh();
    } finally {
      setLeavingBusy(false);
    }
  }

  async function discard() {
    if (leavingBusy) return;
    setLeavingBusy(true);
    try {
      // An icon uploaded for a project that is now being thrown away would
      // otherwise sit in storage with nothing pointing at it.
      const uploaded = getValues("iconKey");
      if (uploaded && uploaded !== project?.iconKey) {
        await cleanupUpload(uploaded);
      }
      setLeaving(false);
      if (project) await deleteProject(project.id);
      router.push(`${base}/projects`);
      router.refresh();
    } finally {
      setLeavingBusy(false);
    }
  }

  const words = countWords(description);

  return (
    <AdminPage
      title={project ? "Edit project" : "New project"}
      actions={
        <>
          <Button type="button" variant="ghost" onClick={cancel}>
            Cancel
          </Button>
          <Button type="submit" form="project-form" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : null}
            Post
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit(post)}>
        <div className="max-w-[620px]">
          <SectionHeading>Project</SectionHeading>
          <FieldRow label="Title" note={errors.title ? "required" : undefined}>
            <LineInput
              placeholder="Name of the project"
              invalid={Boolean(errors.title)}
              {...register("title")}
            />
          </FieldRow>
          <FieldRow
            label="Description"
            align="start"
            note={
              <span className="font-mono tabular-nums">
                {words}/{MAX_CARD_WORDS} words
              </span>
            }
          >
            <LineInput
              as="textarea"
              rows={2}
              placeholder="What it does, in twelve words"
              invalid={Boolean(errors.shortDescription)}
              {...register("shortDescription")}
            />
          </FieldRow>
          <SectionHeading className="mt-8">Highlights</SectionHeading>
          <FieldNote>
            Optional details shown when a project is expanded.
          </FieldNote>
          {fields.map((field, index) => (
            <FieldRow
              key={field.id}
              label={`Point ${index + 1}`}
              align="start"
              note={errors.highlights?.[index]?.body ? "required" : undefined}
            >
              <div className="flex gap-2">
                <LineInput
                  as="textarea"
                  rows={2}
                  placeholder="What you built"
                  invalid={Boolean(errors.highlights?.[index]?.body)}
                  {...register(`highlights.${index}.body`)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove point"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </FieldRow>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ body: "", displayOrder: fields.length })}
          >
            <Plus data-icon="inline-start" className="size-4" /> Add point
          </Button>
          <FieldRow label="URL" note={errors.url ? "https:// only" : undefined}>
            <LineInput
              mono
              placeholder="https://"
              invalid={Boolean(errors.url)}
              {...register("url")}
            />
          </FieldRow>
          <FieldNote>
            This is the live project URL. GitHub can be added separately below.
          </FieldNote>
          <FieldRow
            label="GitHub URL"
            note={errors.githubUrl ? "https:// only" : "optional"}
          >
            <LineInput
              mono
              placeholder="https://github.com/..."
              invalid={Boolean(errors.githubUrl)}
              {...register("githubUrl")}
            />
          </FieldRow>

          <SectionHeading className="mt-8">Icon</SectionHeading>
          <FieldRow label="Source" note="for a project with no logo">
            <Controller
              control={control}
              name="iconName"
              render={({ field }) => (
                <LineSelect value={field.value} onChange={field.onChange}>
                  {projectIconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </LineSelect>
              )}
            />
          </FieldRow>
          {iconName === "custom" ? (
            <>
              <FieldRow label="Image" align="start">
                <UploadField
                  resourceType="icon"
                  value={iconKey}
                  onChange={(key) => setValue("iconKey", key)}
                  error={errors.iconKey?.message}
                />
              </FieldRow>
              <FieldRow
                label="Alt text"
                note={errors.iconAlt ? "required with an upload" : undefined}
              >
                <LineInput
                  placeholder="Describe the image"
                  invalid={Boolean(errors.iconAlt)}
                  {...register("iconAlt")}
                />
              </FieldRow>
            </>
          ) : null}

          <FieldNote>
            {live
              ? "Pin it from the projects list to show it on the homepage."
              : "Posting puts this on the site. Pin it from the projects list afterwards to show it on the homepage."}
          </FieldNote>
        </div>
      </form>

      <LeaveGuard
        open={leaving}
        noun="project"
        onOpenChange={setLeaving}
        onDiscard={discard}
        onSaveDraft={saveDraft}
        saving={leavingBusy}
      />
    </AdminPage>
  );
}
