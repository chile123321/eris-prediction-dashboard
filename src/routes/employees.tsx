import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDirectoryView, profileToEmployee } from "@/components/eris/EmployeePages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { listEmployeeProfiles } from "@/lib/eris/api";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/employees")({ head: () => pageHead("Nhân viên · ERIS", "Danh sách và hồ sơ nhân viên trong hệ thống ERIS."), component: Page });
function Page() { return <LiveGuard role="HR" breadcrumb={["HR", "Nhân viên"]}><Content /></LiveGuard>; }
function Content() { const { data, error, loading, reload } = useApiData(() => listEmployeeProfiles({ limit: 100 }), []); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; return <EmployeeDirectoryView employees={(data?.data || []).map(profileToEmployee)} />; }
