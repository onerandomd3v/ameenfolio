"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Building2, LoaderCircle, MapPin, Trash2, Wifi } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  deleteExperience,
  saveExperience,
} from "@/app/admin/actions/experiences";
import {
  AdminPage,
  FieldRow,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { OptionPicker } from "@/components/admin/option-picker";
import { LineInput } from "@/components/admin/line-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { experienceIconOptions } from "@/config/experience-icons";
import type { Experience, ExperienceHighlight } from "@/db/schema";
import { useAdminBase } from "@/lib/use-admin-base";
import { experienceSchema, type ExperienceInput } from "@/lib/validation";

const empty: ExperienceInput = {
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  location: "",
  iconName: "briefcase",
  pinned: false,
  highlights: [],
};

const workModeOptions = [
  { value: "Remote", label: "Remote", icon: Wifi },
  { value: "Hybrid", label: "Hybrid", icon: Building2 },
  { value: "On-site", label: "On-site", icon: MapPin },
] as const;

function dateValue(date: Date | null) {
  return date ? new Date(date).toISOString().slice(0, 10) : "";
}

export function ExperienceForm({
  experience,
  highlights = [],
}: {
  experience?: Experience;
  highlights?: ExperienceHighlight[];
}) {
  const router = useRouter();
  const base = useAdminBase();
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const form = useForm<ExperienceInput>({
    resolver: zodResolver(experienceSchema),
    defaultValues: experience
      ? {
          company: experience.company,
          role: experience.role,
          startDate: dateValue(experience.startDate),
          endDate: dateValue(experience.endDate),
          location:
            experience.location === "Remote" ||
            experience.location === "Hybrid" ||
            experience.location === "On-site"
              ? experience.location
              : "",
          iconName: experience.iconName,
          pinned: experience.pinned,
          highlights: highlights.map((item, index) => ({
            body: item.body,
            displayOrder: index,
          })),
        }
      : empty,
  });
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = form;
  const pinned = useWatch({ control, name: "pinned" });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "highlights",
  });
  async function submit(values: ExperienceInput, publish: boolean) {
    setBusy(true);
    try {
      const result = await saveExperience(values, experience?.id, publish);
      if (!result.ok) {
        Object.entries(result.fields ?? {}).forEach(([name, messages]) =>
          setError(name as keyof ExperienceInput, { message: messages[0] }),
        );
        toast.error(result.message);
        return;
      }
      toast.success(
        publish ? "Experience posted." : "Experience saved as a draft.",
      );
      router.push(`${base}/experience`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeExperience() {
    if (!experience) return;
    setDeleteOpen(false);
    setBusy(true);
    try {
      const result = await deleteExperience(experience.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      router.push(`${base}/experience`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPage
      title={experience ? "Edit experience" : "New experience"}
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`${base}/experience`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="experience-form"
            disabled={isSubmitting || busy}
          >
            {isSubmitting || busy ? (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            ) : null}{" "}
            Post
          </Button>
        </>
      }
    >
      <form
        id="experience-form"
        onSubmit={handleSubmit((values) => submit(values, true))}
        className="max-w-[620px]"
      >
        <SectionHeading>Role</SectionHeading>
        <FieldRow
          label="Company"
          note={errors.company ? "required" : undefined}
        >
          <LineInput
            placeholder="Company or organization"
            invalid={Boolean(errors.company)}
            {...register("company")}
          />
        </FieldRow>
        <FieldRow label="Role" note={errors.role ? "required" : undefined}>
          <LineInput
            placeholder="Your role"
            invalid={Boolean(errors.role)}
            {...register("role")}
          />
        </FieldRow>
        {!pinned ? (
          <>
            <FieldRow
              label="Start date"
              note={errors.startDate ? "required" : undefined}
            >
              <LineInput
                type="date"
                invalid={Boolean(errors.startDate)}
                {...register("startDate")}
              />
            </FieldRow>
            <FieldRow label="End date" note="leave blank for current">
              <LineInput
                type="date"
                invalid={Boolean(errors.endDate)}
                {...register("endDate")}
              />
            </FieldRow>
            <FieldRow label="Work mode" note="optional">
              <Controller
                control={control}
                name="location"
                render={({ field }) => (
                  <OptionPicker
                    title="Work mode"
                    value={field.value ?? ""}
                    options={workModeOptions}
                    clearable
                    clearLabel="Not specified"
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>
          </>
        ) : null}
        <FieldRow label="Icon">
          <Controller
            control={control}
            name="iconName"
            render={({ field }) => (
              <OptionPicker
                title="Experience icon"
                value={field.value}
                options={experienceIconOptions}
                onChange={field.onChange}
              />
            )}
          />
        </FieldRow>
        <FieldRow
          label="Pinned status"
          note="this is the always-visible current status"
        >
          <Controller
            control={control}
            name="pinned"
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-label="Pin this entry as the current status"
              />
            )}
          />
        </FieldRow>

        <SectionHeading
          className="mt-8"
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ body: "", displayOrder: fields.length })}
            >
              Add
            </Button>
          }
        >
          Highlights
        </SectionHeading>
        <div className="divide-y divide-border/60">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex min-w-0 items-center gap-2 py-2.5"
            >
              <LineInput
                aria-label={`Highlight ${index + 1}`}
                className="min-w-0 flex-1"
                placeholder="What you built or improved"
                {...register(`highlights.${index}.body`)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label="Remove highlight"
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="mt-8 flex gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={!experience || busy || experience.pinned}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || busy}
            onClick={handleSubmit((values) => submit(values, false))}
          >
            Save draft
          </Button>
        </div>
      </form>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm" className="admin-theme">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this experience?</AlertDialogTitle>
            <AlertDialogDescription>
              {experience
                ? `“${experience.company}” and its highlights will be permanently removed.`
                : "This experience and its highlights will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              Keep experience
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={() => void removeExperience()}
            >
              Delete experience
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
}
