import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDirectoryView } from "@/components/eris/EmployeePages";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/hr/employees")({ head: () => pageHead("Nhân viên · HR xem thử", "Danh sách nhân viên ERIS minh họa với tìm kiếm và bộ lọc."), component: Page });
function Page() { const preview = usePreview(); return <PreviewBoundary><EmployeeDirectoryView employees={preview.employees} preview /></PreviewBoundary>; }
