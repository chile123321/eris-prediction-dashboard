import { createFileRoute } from "@tanstack/react-router";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { EmployeeSurveyDetailView } from "@/components/eris/SurveyPages";
import { EmptyState } from "@/components/eris/Workspace";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/employee/my-surveys/$id")({ head: () => pageHead("Trả lời khảo sát · Xem thử", "Biểu mẫu và câu trả lời khảo sát nhân viên ERIS minh họa."), component: Page });
function Page() { const { id } = Route.useParams(); const preview = usePreview(); const survey = preview.surveys.find((item) => item.id === Number(id)); return <PreviewBoundary>{survey ? <EmployeeSurveyDetailView survey={survey} preview onSubmit={(response) => preview.submitSurvey(survey.id, response)} /> : <EmptyState title="Không tìm thấy khảo sát" description="Vòng khảo sát minh họa không tồn tại." />}</PreviewBoundary>; }
