import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/eris/WorkspaceShell";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/preview/employee")({ head: () => pageHead("Employee xem thử · ERIS", "Khảo sát và câu trả lời nhân viên bằng dữ liệu minh họa."), component: () => <WorkspaceShell role="EMPLOYEE" preview breadcrumb={["Employee"]}><Outlet /></WorkspaceShell> });
