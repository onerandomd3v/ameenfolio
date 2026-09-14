import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminExperiences } from "@/db/queries";
import { AdminPage } from "@/components/admin/admin-primitives";
import { AdminExperienceList } from "@/components/admin/experience-list";
import { Button } from "@/components/ui/button";
import { adminBasePath } from "@/lib/admin-path";

export default async function ExperiencePage() {
  const [items, base] = await Promise.all([
    getAdminExperiences(),
    adminBasePath(),
  ]);
  return (
    <AdminPage
      title="Experience"
      actions={
        <Button asChild size="sm">
          <Link href={`${base}/experience/new`}>
            <Plus data-icon="inline-start" />{" "}
            <span className="max-sm:hidden">New experience</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      }
    >
      <AdminExperienceList items={items} base={base} />
    </AdminPage>
  );
}
