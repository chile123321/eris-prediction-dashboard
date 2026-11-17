import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EmployeeFormView, profileToEmployee, type EmployeeDraft } from "@/components/eris/EmployeePages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { createEmployeeEducation, getApiErrorMessage, getEmployeeProfile, listDepartments, listPositions, updateEmployeeEducation, updateEmployeeProfile, type EmployeeEducationInput } from "@/lib/eris/api";
import { buildEducationPayload, hasEducationChanges, type EmployeeEducationDraft } from "@/lib/eris/employee-education";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/employees_/$id_/edit")({ head: () => pageHead("Chỉnh sửa nhân viên · ERIS", "Cập nhật hồ sơ nhân viên trên ERIS."), component: Page });
function Page() { return <LiveGuard role="HR" breadcrumb={["HR", "Nhân viên", "Chỉnh sửa"]}><Content /></LiveGuard>; }
function Content() { const { id } = Route.useParams(); const employeeId = Number(id); const navigate = useNavigate(); const { data, error, loading, reload } = useApiData(async () => { const [profile, departmentResult, positionResult] = await Promise.all([getEmployeeProfile(employeeId), listDepartments(), listPositions()]); return { profile: { ...profile, departmentName: departmentResult.data.find((item) => item.id === profile.departmentId)?.name ?? null }, departments: departmentResult.data, positions: positionResult.data }; }, [employeeId]); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; if (!data) return null; async function save(draft: EmployeeDraft, education?: EmployeeEducationDraft) {
    await updateEmployeeProfile(employeeId, { fullName: draft.fullName, phone: draft.phone, gender: draft.gender, departmentId: draft.departmentId, positionId: draft.positionId, employmentType: draft.employmentType, currentSalary: Number(draft.currentSalary) });
    try {
      if (education) {
        const current = education.id ? data?.profile.educations?.find((record) => record.id === education.id) : undefined;
        if (hasEducationChanges(education, current)) {
          const payload = buildEducationPayload(education, current);
          if (current) await updateEmployeeEducation(employeeId, current.id, payload);
          else await createEmployeeEducation(employeeId, payload as EmployeeEducationInput);
        }
      }
    } catch (reason) {
      throw new Error(`Hồ sơ nhân viên đã được lưu, nhưng học vấn chưa lưu được. ${getApiErrorMessage(reason, "Vui lòng kiểm tra dữ liệu học vấn và thử lại.")}`);
    }
    await navigate({ to: "/employees/$id", params: { id: String(employeeId) } });
  } return <EmployeeFormView employee={profileToEmployee(data.profile)} educationRecords={data.profile.educations || []} departmentOptions={data.departments} positionOptions={data.positions} onSave={save} />; }
