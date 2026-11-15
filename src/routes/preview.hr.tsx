import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/eris/WorkspaceShell";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/preview/hr")({ head: () => pageHead("HR xem thử · ERIS", "Quản lý nhân viên, phân tích AI và khảo sát bằng dữ liệu minh họa."), component: () => <WorkspaceShell role="HR" preview breadcrumb={["HR"]}><Outlet /></WorkspaceShell> });
