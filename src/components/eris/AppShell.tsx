import type { ReactNode } from "react";
import { userRole } from "@/lib/eris/api";
import { useSession } from "@/lib/eris/session";
import { WorkspaceShell } from "./WorkspaceShell";

export function AppShell({ breadcrumb, children }: { breadcrumb: string[]; children: ReactNode }) {
  const { state, signOut } = useSession();
  const user = state.status === "signedIn" ? state.user : null;
  const role = userRole(user);
  return <WorkspaceShell role={role === "ADMIN" ? "ADMIN" : role === "EMPLOYEE" ? "EMPLOYEE" : "HR"} breadcrumb={breadcrumb} userLabel={user?.fullName || user?.email} onSignOut={() => void signOut()}>{children}</WorkspaceShell>;
}
