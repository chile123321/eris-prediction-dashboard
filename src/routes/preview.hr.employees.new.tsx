import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EmployeeFormView, type EmployeeDraft } from "@/components/eris/EmployeePages";
import { pageHead } from "@/lib/eris/head";
import { usePreview } from "@/lib/eris/preview";
export const Route = createFileRoute("/preview/hr/employees/new")({ head: () => pageHead("Thêm nhân viên · HR xem thử", "Biểu mẫu tạo hồ sơ nhân viên ERIS minh họa."), component: Page });
function Page() { const preview = usePreview(); const navigate = useNavigate(); function save(draft: EmployeeDraft) { const id = Math.max(...preview.employees.map((e) => e.id)) + 1; preview.saveEmployee({ ...draft, id, employeeCode: `ERIS${String(id).padStart(3, "0")}`, departmentId: 1, employmentStatus: "ACTIVE", currentSalary: Number(draft.currentSalary), accountStatus: "IN_PROCESS" }, false); void navigate({ to: "/preview/hr/employees" }); } return <EmployeeFormView preview onSave={save} />; }
