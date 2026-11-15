import { createFileRoute } from "@tanstack/react-router";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { SurveyDetailView } from "@/components/eris/SurveyPages";
import { EmptyState } from "@/components/eris/Workspace";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/hr/engagement/$id")({ head: () => pageHead("Chi tiết khảo sát · HR xem thử", "Tổng quan, người tham gia và kết quả khảo sát ERIS minh họa."), component: Page });
function Page() { const { id } = Route.useParams(); const preview = usePreview(); const survey = preview.surveys.find((item) => item.id === Number(id)); return <PreviewBoundary>{survey ? <SurveyDetailView survey={survey} employees={preview.employees} preview /> : <EmptyState title="Không tìm thấy khảo sát" description="Vòng khảo sát minh họa không tồn tại." />}</PreviewBoundary>; }
