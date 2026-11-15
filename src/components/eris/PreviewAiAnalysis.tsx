import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { BatchAnalysis } from "./BatchAnalysis";
import { IndividualAnalysis } from "./IndividualAnalysis";
import { fixtureAiEmployees, fixturePolicies, fixturePrediction, fixtureSnapshot, type Employee } from "@/lib/eris/fixtures";
import { usePreview } from "@/lib/eris/preview";
import type { AiBatchItem, AiSnapshot } from "@/lib/eris/api";

type Selection = { employeeId?: number | undefined; snapshotId?: number | undefined; resultId?: number | undefined; tab?: "batch" | undefined };
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function PreviewAiAnalysis({ search, onSearch }: { search: Selection; onSearch: (search: Selection) => void }) {
  const preview = usePreview(); const attempts = useRef<Record<number, number>>({});
  const employees = useMemo(() => fixtureAiEmployees(preview.employees), [preview.employees]);
  const employee = (id: number): Employee => { const found = preview.employees.find((item) => item.id === id); if (!found) throw new Error("Không tìm thấy nhân viên minh họa."); return found; };
  const individualAdapter = {
    listSnapshots: async (employeeId: number) => { await wait(220); const current = employee(employeeId); return { data: [fixtureSnapshot(current), ...(current.id === 1 ? [fixtureSnapshot(current, 90)] : [])] }; },
    getSnapshot: async (employeeId: number, snapshotId: number) => { await wait(180); return { data: fixtureSnapshot(employee(employeeId), snapshotId) }; },
    preview: async (employeeId: number, body: { vndPerUsd?: number; supplementalFeatures?: Record<string, string | number> }) => { await wait(450); const snapshot = fixtureSnapshot(employee(employeeId), 900 + employeeId); const supplements = body.supplementalFeatures || {}; snapshot.features = { ...snapshot.features, ...supplements }; snapshot.ready = true; snapshot.missingFeatures = []; snapshot.issues = []; snapshot.snapshotCreated = true; toast.success("Đã mô phỏng thao tác", { description: "Bản dữ liệu minh họa đã sẵn sàng." }); return { data: snapshot }; },
    predict: async (employeeId: number, snapshotId: number, save: boolean) => { await wait(650); return { data: fixturePrediction(employee(employeeId), snapshotId, save) }; },
    getResult: async (resultId: number) => { await wait(300); const employeeId = resultId >= 7001 && resultId <= 7099 ? resultId - 7000 : 1; return { data: fixturePrediction(employee(employeeId), 100 + employeeId, true) }; },
  };
  const batchAdapter = {
    listSnapshots: individualAdapter.listSnapshots,
    predictBatch: async (items: AiBatchItem[]) => { await wait(650); const results = items.map((item) => { attempts.current[item.employeeId] = (attempts.current[item.employeeId] || 0) + 1; if (item.employeeId === 3 && attempts.current[item.employeeId] === 1) return { employeeId: item.employeeId, success: false, status: 422, message: "Dữ liệu minh họa chưa hợp lệ ở lần chạy đầu." }; return { employeeId: item.employeeId, success: true, data: fixturePrediction(employee(item.employeeId), item.snapshotId, item.save) }; }); return { data: { total: results.length, succeeded: results.filter((row) => row.success).length, failed: results.filter((row) => !row.success).length, warning: "Kết quả batch minh họa; một dòng được thiết kế để xem trạng thái lỗi và thử lại.", results } }; },
  };
  const policyLoader = async (id: number, save: boolean) => { await wait(350); if (save) toast.success("Đã mô phỏng thao tác", { description: "Đề xuất chỉ được lưu trong bản xem trước." }); return { ...fixturePolicies, predictionId: id, saved: save }; };
  const tab = search.tab === "batch" ? "batch" : "individual";
  return <div className="space-y-5"><div><h1 className="text-2xl font-semibold tracking-tight lg:text-[28px]">Phân tích AI</h1><p className="mt-1.5 text-sm leading-6 text-muted-foreground">Kết quả AI chỉ để tham khảo. HR cần xem xét trước khi đưa ra quyết định.</p></div><div className="rounded-lg border border-primary/15 bg-mint px-4 py-3 text-xs leading-5 text-secondary-foreground">Bản xem trước · Dữ liệu minh họa. Mô hình, điểm và đề xuất dưới đây không phải kết quả Mexwell thật.</div><div role="tablist" aria-label="Chế độ phân tích" className="flex gap-1 border-b">{(["individual", "batch"] as const).map((item) => <button key={item} role="tab" type="button" aria-selected={tab === item} onClick={() => onSearch(item === "batch" ? { tab: "batch" } : {})} className={`h-11 border-b-2 px-5 text-sm ${tab === item ? "border-primary font-medium text-primary" : "border-transparent text-muted-foreground"}`}>{item === "individual" ? "Cá nhân" : "Theo batch"}</button>)}</div>{tab === "individual" ? <IndividualAnalysis employees={employees} initial={search} onSelectionChange={onSearch} adapter={individualAdapter} illustrative policyLoader={policyLoader} /> : <BatchAnalysis employees={employees} adapter={batchAdapter} illustrative policyLoader={policyLoader} />}</div>;
}
