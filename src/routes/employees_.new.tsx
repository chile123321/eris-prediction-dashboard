import { createFileRoute } from "@tanstack/react-router";
import { EmployeeFormView } from "@/components/eris/EmployeePages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { listDepartments, listPositions } from "@/lib/eris/api";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/employees_/new")({ head: () => pageHead("Thêm nhân viên · ERIS", "Biểu mẫu tạo hồ sơ nhân viên ERIS."), component: () => <LiveGuard role="HR" breadcrumb={["HR", "Nhân viên", "Thêm mới"]}><Content /></LiveGuard> });
function Content() { const { data, error, loading, reload } = useApiData(async () => { const [departments, positions] = await Promise.all([listDepartments(), listPositions()]); return { departments: departments.data, positions: positions.data }; }, []); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; return data ? <EmployeeFormView departmentOptions={data.departments} positionOptions={data.positions} /> : null; }
