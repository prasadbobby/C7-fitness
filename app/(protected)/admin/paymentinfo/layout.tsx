import { redirect } from "next/navigation";
import { checkAdminAuth } from "@/utils/adminAuth";

export const dynamic = 'force-dynamic';

export default async function PaymentInfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, role } = await checkAdminAuth();

  if (!isAdmin || role !== 'SUPER_ADMIN') {
    redirect("/dashboard");
  }

  return <>{children}</>;
}