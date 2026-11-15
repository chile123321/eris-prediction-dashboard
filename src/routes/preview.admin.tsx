import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/eris/WorkspaceShell";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/preview/admin")({ head: () => pageHead("Admin xem thử · ERIS", "Không gian quản trị tài khoản và nhật ký ERIS bằng dữ liệu minh họa."), component: () => <WorkspaceShell role="ADMIN" preview breadcrumb={["Admin"]}><Outlet /></WorkspaceShell> });
