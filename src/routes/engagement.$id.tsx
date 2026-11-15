import { createFileRoute } from "@tanstack/react-router";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { SurveyDetailView } from "@/components/eris/SurveyPages";
import { Loading } from "@/components/eris/States";
import { getSurveyForEmployee, getSurveyParticipants, getSurveyResults } from "@/lib/eris/api";
import type { Survey } from "@/lib/eris/fixtures";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/engagement/$id")({ head: () => pageHead("Chi tiết khảo sát · ERIS", "Người tham gia và kết quả khảo sát nhân viên."), component: Page });
function Page() { return <LiveGuard role="HR" breadcrumb={["HR", "Khảo sát", "Chi tiết"]}><Content /></LiveGuard>; }
function Content() { const { id } = Route.useParams(); const surveyId = Number(id); const { data, error, loading, reload } = useApiData(async () => { const [detail, participants] = await Promise.all([getSurveyForEmployee(surveyId), getSurveyParticipants(surveyId)]); const results = await getSurveyResults(surveyId).catch(() => null); return { detail: detail.data, participants: participants.data, results: results?.data }; }, [surveyId]); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; if (!data) return null; const names: Record<number, string> = {}; const survey: Survey = { id: data.detail.id, title: data.detail.title, description: data.detail.description || "", startDate: data.detail.startDate || "", endDate: data.detail.endDate || "", status: data.detail.status, questions: data.detail.questions.map((q) => ({ id: q.id, text: q.questionText, dimension: q.dimensionCode })), responses: data.participants.participants.map((p) => { names[p.employee.id] = p.employee.fullName; return { id: p.responseId, employeeId: p.employee.id, submittedAt: p.submittedAt, answers: Object.fromEntries(p.answers.map((a) => [a.questionId, { score: a.score || 0, comment: a.comment || "" }])) }; }) }; return <SurveyDetailView survey={survey} participantNames={names} />; }
