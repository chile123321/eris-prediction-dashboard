import { createFileRoute } from "@tanstack/react-router";
import { AccountDetailView } from "@/components/eris/AdminPages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { getUserById, updateUserStatus } from "@/lib/eris/api";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
import { mapApiUser } from "./users";
export const Route = createFileRoute("/users/$id")({ head: () => pageHead("Chi tiết tài khoản · ERIS", "Thông tin và trạng thái tài khoản ERIS."), component: Page });
function Page() { return <LiveGuard role="ADMIN" breadcrumb={["Admin", "Tài khoản", "Chi tiết"]}><Content /></LiveGuard>; }
function Content() { const { id } = Route.useParams(); const accountId = Number(id); const { data, error, loading, reload } = useApiData(() => getUserById(accountId), [accountId]); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; return data ? <AccountDetailView account={mapApiUser(data)} onStatus={async (status) => { await updateUserStatus(accountId, status); reload(); }} /> : null; }
