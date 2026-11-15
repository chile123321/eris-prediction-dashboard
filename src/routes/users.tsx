import { createFileRoute } from "@tanstack/react-router";
import { AccountsView } from "@/components/eris/AdminPages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { createHrAccount, listUsers, userRole, type ApiUser } from "@/lib/eris/api";
import type { Account } from "@/lib/eris/fixtures";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/users")({ head: () => pageHead("Quản lý tài khoản · ERIS", "Quản lý tài khoản và trạng thái truy cập ERIS."), component: Page });
export function mapApiUser(user: ApiUser): Account { return { id: user.id ?? 0, fullName: user.fullName || user.email || "—", email: user.email || "—", role: userRole(user) === "ADMIN" ? "ADMIN" : userRole(user) === "EMPLOYEE" ? "EMPLOYEE" : "HR", status: user.status === "ACTIVE" ? "ACTIVE" : user.status === "INACTIVE" ? "INACTIVE" : "IN_PROCESS", hireDate: "", invitation: null }; }
function Page() { return <LiveGuard role="ADMIN" breadcrumb={["Admin", "Tài khoản"]}><Content /></LiveGuard>; }
function Content() { const { data, error, loading, reload } = useApiData(() => listUsers({ limit: 100 }), []); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; return <AccountsView accounts={(data?.data || []).map(mapApiUser)} onCreate={async (input) => { await createHrAccount(input); reload(); }} />; }
