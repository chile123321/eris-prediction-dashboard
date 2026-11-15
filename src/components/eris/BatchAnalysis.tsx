import { useRef, useState } from "react";
import { getApiErrorMessage, listAiSnapshots, predictAiBatch, type AiBatchRow, type AiEmployee, type AiSnapshot, type AiPolicyRecommendations } from "@/lib/eris/api";
import { formatDateTime, formatPercent } from "@/lib/eris/analysis";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { Empty, Loading, Notice } from "./States";

const MAX = 25;
type Pick = { snapshots: AiSnapshot[] | null; error?: string | undefined; snapshotId?: number | undefined };

export function BatchAnalysis({ employees, adapter, illustrative = false, policyLoader }: { employees: AiEmployee[]; adapter?: { listSnapshots: typeof listAiSnapshots; predictBatch: typeof predictAiBatch }; illustrative?: boolean; policyLoader?: (id: number, save: boolean) => Promise<AiPolicyRecommendations> }) {
  const api = adapter ?? { listSnapshots: listAiSnapshots, predictBatch: predictAiBatch };
  const [picked, setPicked] = useState<Record<number, Pick>>({});
  const [save, setSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<AiBatchRow[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; succeeded: number; failed: number; warning: string } | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ids = Object.keys(picked).map(Number);
  const byId = new Map(employees.map((e) => [e.id, e]));

  function toggle(id: number) {
    setPicked((p) => {
      if (p[id]) {
        const { [id]: _, ...rest } = p;
        return rest;
      }
      if (Object.keys(p).length >= MAX) return p;
      api.listSnapshots(id)
        .then((r) => {
          const ready = r.data.filter((s) => s.ready && s.snapshotId);
          setPicked((q) => (q[id] ? { ...q, [id]: { snapshots: ready, snapshotId: ready[0]?.snapshotId ?? undefined } } : q));
        })
        .catch((e) => setPicked((q) => (q[id] ? { ...q, [id]: { snapshots: [], error: getApiErrorMessage(e, "Không tải được bản dữ liệu.") } } : q)));
      return { ...p, [id]: { snapshots: null } };
    });
  }

  const runnable = ids.filter((id) => picked[id]?.snapshotId);

  async function run(only?: number[]) {
    const target = (only ?? runnable).filter((id) => picked[id]?.snapshotId);
    if (!target.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await api.predictBatch(target.map((employeeId) => ({ employeeId, snapshotId: picked[employeeId]!.snapshotId!, save })));
      const d = r.data;
      if (only && rows) {
        // Retry: replace only the retried rows; successes are kept as-is.
        const merged = rows.map((row) => d.results.find((x) => x.employeeId === row.employeeId) ?? row);
        setRows(merged);
        setSummary({ total: merged.length, succeeded: merged.filter((x) => x.success).length, failed: merged.filter((x) => !x.success).length, warning: d.warning });
      } else {
        setRows(d.results);
        setSummary(d);
        setOpenRow(null);
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "Không chạy được phân tích theo batch."));
    } finally {
      setBusy(false);
    }
  }

  const failedIds = rows?.filter((r) => !r.success).map((r) => r.employeeId) ?? [];
  const visible = employees.filter((e) => `${e.employeeCode} ${e.fullName}`.toLowerCase().includes(filter.toLowerCase()));
  const opened = rows?.find((r) => r.employeeId === openRow && r.success && r.data);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="text-base font-semibold">Chọn nhân viên</h2>
          <p className="mt-1 text-xs text-muted-foreground">Đã chọn <span className="tabular">{ids.length}</span>/{MAX}. Danh sách tải toàn bộ nhân viên đang hoạt động; lọc không bỏ chọn.</p>
          <input className="field mt-3" placeholder="Lọc theo mã hoặc tên" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Lọc nhân viên" />
          <ul className="mt-3 max-h-80 overflow-y-auto">
            {visible.map((e) => (
              <li key={e.id}>
                <label className="flex min-h-10 items-center gap-2 rounded px-2 text-sm hover:bg-muted">
                  <input type="checkbox" checked={!!picked[e.id]} disabled={!picked[e.id] && ids.length >= MAX} onChange={() => toggle(e.id)} />
                  <span className="tabular text-muted-foreground">{e.employeeCode}</span> {e.fullName}
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-4">
          <h2 className="text-base font-semibold">Xem lại trước khi chạy</h2>
          {ids.length === 0 ? (
            <div className="mt-3"><Empty>Chưa chọn nhân viên nào.</Empty></div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2 font-medium">Nhân viên</th><th className="font-medium">Bản dữ liệu sẵn sàng</th></tr></thead>
                <tbody>
                  {ids.map((id) => {
                    const p = picked[id]!;
                    return (
                      <tr key={id} className="border-b last:border-0">
                        <td className="py-2 pr-2">{byId.get(id)?.fullName}</td>
                        <td>
                          {p.snapshots === null ? <span className="text-muted-foreground">Đang tải…</span> : p.error ? <span className="text-destructive">{p.error}</span> : p.snapshots.length === 0 ? <span className="text-warning">Không có bản dữ liệu sẵn sàng</span> : (
                            <select className="field h-9" aria-label={`Bản dữ liệu cho ${byId.get(id)?.fullName}`} value={p.snapshotId ?? ""} onChange={(e) => setPicked((q) => ({ ...q, [id]: { ...q[id]!, snapshotId: Number(e.target.value) } }))}>
                              {p.snapshots.map((s) => <option key={s.snapshotId!} value={s.snapshotId!}>#{s.snapshotId} · {formatDateTime(s.snapshotDate || s.capturedAt)}</option>)}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Lưu kết quả</label>
            <button type="button" className="btn btn-primary" disabled={busy || runnable.length === 0} onClick={() => void run()}>
              {busy ? "Đang chạy…" : `Chạy dự đoán (${runnable.length})`}
            </button>
          </div>
        </div>
      </div>

      {busy && <Loading label="Đang xử lý batch qua ERIS…" />}
      {error && <Notice tone="error">{error}</Notice>}

      {rows && summary && (
        <div className="panel p-4">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-base font-semibold">Kết quả batch</h2>
            <span className="tabular text-sm">Tổng {summary.total} · Thành công {summary.succeeded} · Lỗi {summary.failed}</span>
            {failedIds.length > 0 && <button type="button" className="btn btn-secondary ml-auto" disabled={busy} onClick={() => void run(failedIds)}>Chạy lại {failedIds.length} dòng lỗi</button>}
          </div>
          {summary.warning && <div className="mt-3"><Notice tone="warning">{summary.warning}</Notice></div>}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr className="border-b"><th className="py-2 font-medium">Nhân viên</th><th className="font-medium">Bản dữ liệu</th><th className="font-medium">Trạng thái</th><th className="font-medium">Điểm</th><th className="font-medium">Lưu</th><th className="font-medium">Chi tiết</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employeeId} className="border-b last:border-0">
                    <td className="py-2 pr-2">{byId.get(r.employeeId)?.fullName ?? `#${r.employeeId}`}</td>
                    <td className="tabular">#{r.data?.preview?.snapshotId ?? picked[r.employeeId]?.snapshotId ?? "—"}</td>
                    <td className={r.success ? "text-success" : "text-destructive"}>{r.success ? "Thành công" : `Lỗi${r.status ? ` ${r.status}` : ""}`}</td>
                    <td className="tabular">{r.data ? formatPercent(r.data.model.score) : "—"}</td>
                    <td>{r.data ? (r.data.saved ? `#${r.data.predictionId}` : "Chưa lưu") : "—"}</td>
                    <td>{r.success ? <button type="button" className="text-info underline" onClick={() => { setOpenRow(r.employeeId); setTimeout(() => headingRef.current?.focus(), 0); }}>Xem</button> : <span className="text-xs text-destructive">{r.message}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {opened?.data && <EmployeeDashboard ref={headingRef} result={opened.data} illustrative={illustrative} policyLoader={policyLoader} />}
    </div>
  );
}
