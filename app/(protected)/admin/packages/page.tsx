import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";
import PackagesAdmin from "./PackagesAdmin";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const { isAdmin, userId } = await checkAdminAuth();
  if (!isAdmin || !userId) redirect("/");
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PackagesAdmin />
    </div>
  );
}
