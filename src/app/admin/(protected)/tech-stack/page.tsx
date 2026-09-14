import { getAdminTechStack, getAdminTechStackCategories } from "@/db/queries";
import { TechStackCategoryManager } from "@/components/admin/tech-stack-category-manager";
import { TechStackManager } from "@/components/admin/tech-stack-manager";

export default async function AdminTechStackPage() {
  const [items, categories] = await Promise.all([
    getAdminTechStack(),
    getAdminTechStackCategories(),
  ]);
  return (
    <>
      <TechStackCategoryManager categories={categories} />
      <TechStackManager items={items} categories={categories} />
    </>
  );
}
