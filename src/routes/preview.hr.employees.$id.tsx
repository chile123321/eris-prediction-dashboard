import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetailView } from "@/components/eris/EmployeePages";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { EmptyState } from "@/components/eris/Workspace";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/hr/employees/$id")({ head: () => pageHead("Chi tiết nhân viên · HR xem thử", "Hồ sơ cá nhân, công việc và học vấn nhân viên ERIS minh họa."), component: Page });
function Page() { const { id } = Route.useParams(); const preview = usePreview(); const employee = preview.employees.find((item) => item.id === Number(id)); return <PreviewBoundary>{employee ? <EmployeeDetailView employee={employee} preview /> : <EmptyState title="Không tìm thấy nhân viên" description="Hồ sơ minh họa không tồn tại." />}</PreviewBoundary>; }
