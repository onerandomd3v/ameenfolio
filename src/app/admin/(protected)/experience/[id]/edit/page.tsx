import { notFound } from "next/navigation";
import { getAdminExperience } from "@/db/queries";
import { ExperienceForm } from "@/components/admin/experience-form";

export default async function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAdminExperience(id);
  if (!data) notFound();
  return (
    <ExperienceForm experience={data.experience} highlights={data.highlights} />
  );
}
