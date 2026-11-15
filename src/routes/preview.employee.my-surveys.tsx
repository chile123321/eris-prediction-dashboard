import { createFileRoute } from "@tanstack/react-router";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { EmployeeSurveysView } from "@/components/eris/SurveyPages";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/employee/my-surveys")({ head: () => pageHead("Khảo sát của tôi · Xem thử", "Danh sách khảo sát nhân viên ERIS minh họa."), component: Page });
function Page() { const preview = usePreview(); return <PreviewBoundary><EmployeeSurveysView surveys={preview.surveys} preview /></PreviewBoundary>; }
