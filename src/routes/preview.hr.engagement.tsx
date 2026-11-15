import { createFileRoute } from "@tanstack/react-router";
import { PreviewBoundary } from "@/components/eris/PreviewBoundary";
import { SurveyManagementView } from "@/components/eris/SurveyPages";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/hr/engagement")({ head: () => pageHead("Khảo sát · HR xem thử", "Tạo, phát hành và theo dõi khảo sát ERIS minh họa."), component: Page });
function Page() { const preview = usePreview(); return <PreviewBoundary><SurveyManagementView surveys={preview.surveys} preview onSave={preview.saveSurvey} onStatus={preview.setSurveyStatus} /></PreviewBoundary>; }
