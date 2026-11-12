import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";
import BillingAdmin from "./BillingAdmin";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const { isAdmin, userId } = await checkAdminAuth();
  if (!isAdmin || !userId) redirect("/");
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <BillingAdmin />
    </div>
  );
}
