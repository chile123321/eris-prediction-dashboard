import { createFileRoute } from "@tanstack/react-router";
import { AuditLogView } from "@/components/eris/AdminPages";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/admin/activity")({ head: () => pageHead("Nhật ký · Admin xem thử", "Nhật ký hoạt động và chi tiết sự kiện ERIS minh họa."), component: Page });
function Page() { const preview = usePreview(); return <PreviewBoundary><AuditLogView entries={preview.audit} /></PreviewBoundary>; }
