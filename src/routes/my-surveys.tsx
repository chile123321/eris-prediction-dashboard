import { createFileRoute } from "@tanstack/react-router";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { EmployeeSurveysView } from "@/components/eris/SurveyPages";
import { Loading } from "@/components/eris/States";
import { listAvailableSurveys } from "@/lib/eris/api";
import { mapSurveySummary } from "./engagement";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/my-surveys")({ head: () => pageHead("Khảo sát của tôi · ERIS", "Các khảo sát dành cho nhân viên trên ERIS."), component: Page });
function Page() { return <LiveGuard role="EMPLOYEE" breadcrumb={["Employee", "Khảo sát của tôi"]}><Content /></LiveGuard>; }
function Content() { const { data, error, loading, reload } = useApiData(listAvailableSurveys, []); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; return <EmployeeSurveysView surveys={(data?.data || []).map(mapSurveySummary)} employeeId={-1} />; }
