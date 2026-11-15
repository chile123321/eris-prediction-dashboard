import { createFileRoute } from "@tanstack/react-router";
import { EmployeeImportView } from "@/components/eris/EmployeePages";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { pageHead } from "@/lib/eris/head";
export const Route = createFileRoute("/preview/hr/employees/import")({ head: () => pageHead("Nhập Excel · HR xem thử", "Xem luồng kiểm tra và nhập nhân viên ERIS bằng dữ liệu mô phỏng."), component: () => <PreviewBoundary><EmployeeImportView preview /></PreviewBoundary> });
