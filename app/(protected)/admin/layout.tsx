import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await checkAdminAuth();

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return children;
}