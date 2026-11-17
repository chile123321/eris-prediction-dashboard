import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDetailView, profileToEmployee } from "@/components/eris/EmployeePages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { getEmployeeProfile, listDepartments } from "@/lib/eris/api";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/employees_/$id")({ head: () => pageHead("Chi tiết nhân viên · ERIS", "Hồ sơ nhân viên, công việc và học vấn trên ERIS."), component: Page });
function Page() { return <LiveGuard role="HR" breadcrumb={["HR", "Nhân viên", "Chi tiết"]}><Content /></LiveGuard>; }
function Content() { const { id } = Route.useParams(); const employeeId = Number(id); const { data, error, loading, reload } = useApiData(async () => { const [profile, departmentResult] = await Promise.all([getEmployeeProfile(employeeId), listDepartments()]); return { ...profile, departmentName: departmentResult.data.find((item) => item.id === profile.departmentId)?.name ?? null }; }, [employeeId]); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; return data ? <EmployeeDetailView employee={profileToEmployee(data)} educations={data.educations || []} /> : null; }
