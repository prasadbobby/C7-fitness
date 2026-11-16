import { Roles } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

export const checkRole = async (role: Roles) => {
  const { sessionClaims }  = await auth();

  // Check both metadata.role and publicMetadata.role for compatibility
  return (sessionClaims?.metadata as any)?.role === role || (sessionClaims?.publicMetadata as any)?.role === role;
};
