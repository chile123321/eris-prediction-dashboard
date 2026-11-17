import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { AccountsView } from "@/components/eris/AdminPages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { createHrAccount, listUsers, userRole, type ApiUser } from "@/lib/eris/api";
import type { Account } from "@/lib/eris/fixtures";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/users")({ head: () => pageHead("Quản lý tài khoản · ERIS", "Quản lý tài khoản và trạng thái truy cập ERIS."), component: Page });
export function mapApiUser(user: ApiUser): Account { return { id: user.id ?? 0, fullName: user.fullName || user.email || "—", email: user.email || "—", role: userRole(user) === "ADMIN" ? "ADMIN" : userRole(user) === "EMPLOYEE" ? "EMPLOYEE" : "HR", status: user.status === "ACTIVE" ? "ACTIVE" : user.status === "IN_PROCESS" ? "IN_PROCESS" : user.status === "INACTIVE" ? "INACTIVE" : "UNKNOWN", hireDate: "", invitation: null }; }
function Page() { return <LiveGuard role="ADMIN" breadcrumb={["Admin", "Tài khoản"]}><Content /></LiveGuard>; }
function Content() { const { data, error, loading, reload } = useApiData(() => listUsers({ limit: 100 }), []); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; return <AccountsView accounts={(data?.data || []).map(mapApiUser)} onCreate={async (input) => { const result = await createHrAccount(input); const delivery = result.data?.emailDelivery ?? result.emailDelivery; if (delivery === "FAILED") toast.warning("Đã tạo tài khoản HR. Email hướng dẫn gửi thất bại; không tạo lại tài khoản.", { duration: 12000 }); else toast.success("Đã tạo tài khoản HR; chờ người dùng hoàn tất kích hoạt."); reload(); }} />; }
