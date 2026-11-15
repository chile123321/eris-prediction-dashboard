import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PreviewAiAnalysis } from "@/components/eris/PreviewAiAnalysis";
import { pageHead } from "@/lib/eris/head";
type Search = { tab?: "batch" | undefined; employeeId?: number | undefined; snapshotId?: number | undefined; resultId?: number | undefined };
const positive = (value: unknown) => { const parsed = Number(value); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined; };
export const Route = createFileRoute("/preview/hr/ai-analysis")({ validateSearch: (input: Record<string, unknown>): Search => ({ tab: input["tab"] === "batch" ? "batch" : undefined, employeeId: positive(input["employeeId"]), snapshotId: positive(input["snapshotId"]), resultId: positive(input["resultId"]) }), head: () => pageHead("Phân tích AI · HR xem thử", "Dự đoán cá nhân, batch, biểu đồ SHAP và đề xuất ERIS bằng dữ liệu minh họa."), component: Page });
function Page() { const search = Route.useSearch(); const navigate = useNavigate({ from: "/preview/hr/ai-analysis" }); return <PreviewAiAnalysis search={search} onSearch={(next) => void navigate({ search: next, replace: true })} />; }
