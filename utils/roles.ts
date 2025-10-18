import { Roles } from "@/types/globals";
import { auth } from "@clerk/nextjs";

export const checkRole = (role: Roles) => {
  const { sessionClaims } = auth();

  // Check both metadata.role and publicMetadata.role for compatibility
  return (sessionClaims?.metadata as any)?.role === role || (sessionClaims?.publicMetadata as any)?.role === role;
};
