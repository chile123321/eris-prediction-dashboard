import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EmployeeFormView, type EmployeeDraft } from "@/components/eris/EmployeePages";
import { EmptyState } from "@/components/eris/Workspace";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/hr/employees/$id_/edit")({ head: () => pageHead("Sửa nhân viên · HR xem thử", "Biểu mẫu chỉnh sửa hồ sơ nhân viên ERIS minh họa."), component: Page });
function Page() { const { id } = Route.useParams(); const preview = usePreview(); const navigate = useNavigate(); const employee = preview.employees.find((item) => item.id === Number(id)); if (!employee) return <EmptyState title="Không tìm thấy nhân viên" description="Hồ sơ minh họa không tồn tại." />; function save(draft: EmployeeDraft) { if (!employee) return; preview.saveEmployee({ ...employee, ...draft, departmentId: employee.departmentId, currentSalary: Number(draft.currentSalary) }, true); void navigate({ to: "/preview/hr/employees/$id", params: { id: String(employee.id) } }); } return <EmployeeFormView employee={employee} preview onSave={save} />; }
