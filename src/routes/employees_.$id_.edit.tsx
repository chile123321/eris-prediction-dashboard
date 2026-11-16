import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EmployeeFormView, profileToEmployee, type EmployeeDraft } from "@/components/eris/EmployeePages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { getEmployeeProfile, updateEmployeeProfile } from "@/lib/eris/api";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/employees_/$id_/edit")({ head: () => pageHead("Chỉnh sửa nhân viên · ERIS", "Cập nhật hồ sơ nhân viên trên ERIS."), component: Page });
function Page() { return <LiveGuard role="HR" breadcrumb={["HR", "Nhân viên", "Chỉnh sửa"]}><Content /></LiveGuard>; }
function Content() { const { id } = Route.useParams(); const employeeId = Number(id); const navigate = useNavigate(); const { data, error, loading, reload } = useApiData(() => getEmployeeProfile(employeeId), [employeeId]); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; if (!data) return null; async function save(draft: EmployeeDraft) { await updateEmployeeProfile(employeeId, { fullName: draft.fullName, phone: draft.phone, gender: draft.gender, departmentId: data?.departmentId, employmentType: draft.employmentType, currentSalary: Number(draft.currentSalary) }); await navigate({ to: "/employees/$id", params: { id: String(employeeId) } }); } return <EmployeeFormView employee={profileToEmployee(data)} onSave={save} />; }
