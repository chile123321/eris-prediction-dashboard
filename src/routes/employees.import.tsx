import { createFileRoute } from "@tanstack/react-router";
import { EmployeeImportView } from "@/components/eris/EmployeePages";
import { LiveGuard } from "@/components/eris/LiveGuard";
import { importEmployees } from "@/lib/eris/api";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/employees/import")({ head: () => pageHead("Nhập nhân viên · ERIS", "Tải tệp Excel nhân viên lên ERIS backend."), component: () => <LiveGuard role="HR" breadcrumb={["HR", "Nhân viên", "Nhập Excel"]}><EmployeeImportView onImport={importEmployees} /></LiveGuard> });
