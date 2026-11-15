import { createFileRoute } from "@tanstack/react-router";
import { AuditLogView, type AuditDisplay } from "@/components/eris/AdminPages";
import { LiveError, LiveGuard } from "@/components/eris/LiveGuard";
import { Loading } from "@/components/eris/States";
import { getAuditLog, listAuditLogs, type AuditLogEntry } from "@/lib/eris/api";
import { pageHead } from "@/lib/eris/head";
import { useApiData } from "@/lib/eris/use-api-data";
export const Route = createFileRoute("/activity")({ head: () => pageHead("Nhật ký hoạt động · ERIS", "Rà soát các sự kiện và thay đổi trong hệ thống ERIS."), component: Page });
function map(entry: AuditLogEntry): AuditDisplay { return { id: entry.id, createdAt: entry.createdAt, actor: entry.actor?.fullName || entry.actor?.email || "Hệ thống", action: entry.action || "—", entityType: entry.entityType || "—", entityId: String(entry.entityId ?? "—") }; }
function Page() { return <LiveGuard role="ADMIN" breadcrumb={["Admin", "Nhật ký"]}><Content /></LiveGuard>; }
function Content() { const { data, error, loading, reload } = useApiData(listAuditLogs, []); if (loading) return <Loading />; if (error) return <LiveError error={new Error(error)} onRetry={reload} />; return <AuditLogView entries={(data?.data || []).map(map)} loadDetail={async (id) => { const detail = (await getAuditLog(id)).data; return { ...map(detail), oldValue: detail.oldValue, newValue: detail.newValue }; }} />; }
