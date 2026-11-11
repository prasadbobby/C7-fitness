import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";
import NutritionAdmin from "./_components/NutritionAdmin";

export const dynamic = "force-dynamic";

export default async function AdminNutritionPage() {
  const { isAdmin, userId } = await checkAdminAuth();
  if (!isAdmin || !userId) redirect("/");

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Nutrition</h1>
        <p className="text-foreground-500">
          Manage the recipe library and member nutrition goals shown in the C7 mobile app.
        </p>
      </div>
      <NutritionAdmin />
    </div>
  );
}
