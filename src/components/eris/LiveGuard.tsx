import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { userRole, type ApiUser } from "@/lib/eris/api";
import { useSession } from "@/lib/eris/session";
import { AppShell } from "./AppShell";
import { ApiUnavailable, Forbidden, Loading, Notice } from "./States";

export function LiveGuard({ role, breadcrumb, children }: { role: "ADMIN" | "HR" | "EMPLOYEE"; breadcrumb: string[]; children: ReactNode | ((user: ApiUser) => ReactNode) }) {
  const { state, reload } = useSession();
  const navigate = useNavigate();
  useEffect(() => { if (state.status === "signedOut") void navigate({ to: "/login" }); }, [state.status, navigate]);
  if (state.status === "loading" || state.status === "signedOut") return <div className="p-6"><Loading label="Đang kiểm tra phiên đăng nhập…" /></div>;
  return <AppShell breadcrumb={breadcrumb}>{state.status === "unavailable" ? <ApiUnavailable onRetry={reload} /> : userRole(state.user) !== role ? <Forbidden /> : typeof children === "function" ? children(state.user) : children}</AppShell>;
}

export function LiveError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return <Notice tone="error" title="Không tải được dữ liệu trực tiếp" action={<button type="button" className="btn btn-secondary h-9" onClick={onRetry}>Thử lại</button>}>{error instanceof Error ? error.message : "Vui lòng kiểm tra kết nối ERIS và thử lại."}</Notice>;
}
