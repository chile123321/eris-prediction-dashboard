import { createFileRoute } from "@tanstack/react-router";
import { EmployeeDirectoryView, profileToEmployee } from "@/components/eris/EmployeePages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { listDepartments, listEmployeeProfiles } from "@/lib/eris/api";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/employees")({ head: () => pageHead("Nhân viên · ERIS", "Danh sách và hồ sơ nhân viên trong hệ thống ERIS."), component: Page });
function Page() { return <LiveGuard role="HR" breadcrumb={["HR", "Nhân viên"]}><Content /></LiveGuard>; }
function Content() { const { data, error, loading, reload } = useApiData(async () => { const [profiles, departments] = await Promise.all([listEmployeeProfiles(), listDepartments()]); const names = new Map(departments.data.map((item) => [item.id, item.name])); return profiles.data.map((profile) => profileToEmployee({ ...profile, departmentName: profile.departmentId == null ? "Chưa xác định" : names.get(profile.departmentId) || "Chưa xác định" })); }, []); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; return <EmployeeDirectoryView employees={data || []} />; }
