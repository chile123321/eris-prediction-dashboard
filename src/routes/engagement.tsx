import { createFileRoute } from "@tanstack/react-router";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { SurveyManagementView } from "@/components/eris/SurveyPages";
import { Loading } from "@/components/eris/States";
import { closeSurvey, createSurvey, listSurveys, publishSurvey, updateSurvey, type SurveySummary } from "@/lib/eris/api";
import { questions, type Survey } from "@/lib/eris/fixtures";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/engagement")({ head: () => pageHead("Quản lý khảo sát · ERIS", "Tạo và theo dõi các vòng khảo sát nhân viên trên ERIS."), component: Page });
export function mapSurveySummary(survey: SurveySummary): Survey { return { id: survey.id, title: survey.title, description: survey.description || "", startDate: survey.startDate || "", endDate: survey.endDate || "", status: survey.status, questions, responses: [] }; }
function Page() { return <LiveGuard role="HR" breadcrumb={["HR", "Khảo sát"]}><Content /></LiveGuard>; }
function Content() { const { data, error, loading, reload } = useApiData(listSurveys, []); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; async function save(survey: Survey) { const input = { title: survey.title, description: survey.description, startDate: new Date(`${survey.startDate.slice(0, 10)}T00:00:00.000Z`).toISOString(), endDate: new Date(`${survey.endDate.slice(0, 10)}T00:00:00.000Z`).toISOString() }; if (data?.data.some((item) => item.id === survey.id)) await updateSurvey(survey.id, input); else await createSurvey(input); reload(); } async function status(id: number, next: Survey["status"]) { if (next === "ACTIVE") await publishSurvey(id); else if (next === "CLOSED") await closeSurvey(id); reload(); } return <SurveyManagementView surveys={(data?.data || []).map(mapSurveySummary)} onSave={save} onStatus={status} />; }
