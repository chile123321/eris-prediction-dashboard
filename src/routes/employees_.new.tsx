import { createFileRoute } from "@tanstack/react-router";
import { EmployeeFormView } from "@/components/eris/EmployeePages";
import { LiveGuard } from "@/components/eris/LiveGuard";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/employees_/new")({ head: () => pageHead("Thêm nhân viên · ERIS", "Biểu mẫu tạo hồ sơ nhân viên ERIS."), component: () => <LiveGuard role="HR" breadcrumb={["HR", "Nhân viên", "Thêm mới"]}><EmployeeFormView /></LiveGuard> });
