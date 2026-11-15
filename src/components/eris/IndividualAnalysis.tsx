import { useEffect, useRef, useState } from "react";
import {
  getAiResult,
  getAiSnapshot,
  getApiErrorMessage,
  listAiSnapshots,
  predictAiEmployee,
  previewAiEmployee,
  ApiError,
  type AiEmployee,
  type AiPrediction,
  type AiSnapshot,
  type AiPolicyRecommendations,
} from "@/lib/eris/api";
import { FEATURE_CHOICES, FEATURE_UNITS, featureLabel, formatDateTime, provenanceLabel } from "@/lib/eris/analysis";
import { EmployeeDashboard } from "./EmployeeDashboard";
import { Empty, Loading, Notice } from "./States";

type Sel = { employeeId?: number | undefined; snapshotId?: number | undefined; resultId?: number | undefined };
type Props = {
  employees: AiEmployee[];
  initial: Sel;
  onSelectionChange: (s: Sel) => void;
  adapter?: {
    listSnapshots: typeof listAiSnapshots;
    getSnapshot: typeof getAiSnapshot;
    preview: typeof previewAiEmployee;
    predict: typeof predictAiEmployee;
    getResult: typeof getAiResult;
  };
  illustrative?: boolean;
  policyLoader?: (id: number, save: boolean) => Promise<AiPolicyRecommendations>;
};

export function IndividualAnalysis({ employees, initial, onSelectionChange, adapter, illustrative = false, policyLoader }: Props) {
  const api = adapter ?? { listSnapshots: listAiSnapshots, getSnapshot: getAiSnapshot, preview: previewAiEmployee, predict: predictAiEmployee, getResult: getAiResult };
  const [employeeId, setEmployeeId] = useState<number | undefined>(initial.employeeId);
  const [snapshots, setSnapshots] = useState<AiSnapshot[] | null>(null);
  const [snapshotsError, setSnapshotsError] = useState("");
  const [snapshotId, setSnapshotId] = useState<number | undefined>(initial.snapshotId);
  const [snapshot, setSnapshot] = useState<AiSnapshot | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [rate, setRate] = useState("");
  const [supplement, setSupplement] = useState<Record<string, string>>({});
  const [save, setSave] = useState(true);
  const [busy, setBusy] = useState<"" | "preview" | "predict" | "result">("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiPrediction | null>(null);
  const [resultInput, setResultInput] = useState(initial.resultId ? String(initial.resultId) : "");
  const seq = useRef(0);
  const snapSeq = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openedInitialResult = useRef(false);

  // Load snapshot list whenever the employee changes; ignore stale responses.
  useEffect(() => {
    const my = ++seq.current;
    setSnapshots(null);
    setSnapshotsError("");
    setSnapshot(null);
    setSupplement({});
    if (!employeeId) return;
    api.listSnapshots(employeeId)
      .then((r) => my === seq.current && setSnapshots(r.data))
      .catch((e) => my === seq.current && setSnapshotsError(getApiErrorMessage(e, "Không tải được danh sách bản dữ liệu.")));
  }, [employeeId]);

  // Load the selected stored snapshot (read-only GET).
  useEffect(() => {
    if (!employeeId || !snapshotId) return;
    const my = ++snapSeq.current;
    setSnapshotLoading(true);
    api.getSnapshot(employeeId, snapshotId)
      .then((r) => my === snapSeq.current && setSnapshot(r.data))
      .catch((e) => my === snapSeq.current && setError(getApiErrorMessage(e, "Không tải được bản dữ liệu.")))
      .finally(() => my === snapSeq.current && setSnapshotLoading(false));
  }, [employeeId, snapshotId]);

  // A resultId in the URL opens a saved result via GET only — never a new prediction.
  useEffect(() => {
    if (openedInitialResult.current || !initial.resultId) return;
    openedInitialResult.current = true;
    void openResult(initial.resultId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (result) {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [result]);

  function chooseEmployee(id?: number) {
    setEmployeeId(id);
    setSnapshotId(undefined);
    setResult(null);
    setError("");
    onSelectionChange({ employeeId: id });
  }
  function chooseSnapshot(id?: number) {
    setSnapshotId(id);
    setSnapshot(null);
    setResult(null);
    setError("");
    onSelectionChange({ employeeId, snapshotId: id });
  }

  async function prepare() {
    if (!employeeId || busy) return;
    const extras: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(supplement)) if (v.trim()) extras[k] = FEATURE_CHOICES[k] || k === "Hire_Date" ? v : Number(v);
    if (Object.values(extras).some((v) => typeof v === "number" && !Number.isFinite(v)) || (rate && (!Number.isFinite(Number(rate)) || Number(rate) < 1 || Number(rate) > 1_000_000))) {
      setError("Vui lòng kiểm tra các giá trị số và tỷ giá (1–1.000.000 VND/USD).");
      return;
    }
    setBusy("preview");
    setError("");
    setResult(null);
    try {
      const r = await api.preview(employeeId, {
        ...(rate ? { vndPerUsd: Number(rate) } : {}),
        ...(Object.keys(extras).length ? { supplementalFeatures: extras } : {}),
      });
      setSnapshot(r.data);
      if (r.data.snapshotId) {
        setSupplement({});
        setSnapshotId(r.data.snapshotId);
        onSelectionChange({ employeeId, snapshotId: r.data.snapshotId });
        api.listSnapshots(employeeId).then((x) => setSnapshots(x.data)).catch(() => undefined);
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "Không kiểm tra được dữ liệu."));
    } finally {
      setBusy("");
    }
  }

  async function predict() {
    if (!employeeId || !snapshot?.snapshotId || !snapshot.ready || busy) return;
    setBusy("predict");
    setError("");
    setResult(null);
    try {
      const r = await api.predict(employeeId, snapshot.snapshotId, save);
      setResult(r.data);
      if (r.data.saved && r.data.predictionId) onSelectionChange({ employeeId, snapshotId: snapshot.snapshotId, resultId: r.data.predictionId });
    } catch (e) {
      if (e instanceof ApiError && e.status === 422 && e.details) setSnapshot(e.details as AiSnapshot);
      setError(getApiErrorMessage(e, "Không chạy được mô hình AI."));
    } finally {
      setBusy("");
    }
  }

  async function openResult(id: number) {
    setBusy("result");
    setError("");
    try {
      const r = await api.getResult(id);
      setResult(r.data);
      onSelectionChange({ resultId: id });
    } catch (e) {
      setError(getApiErrorMessage(e, "Không mở được kết quả đã lưu."));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <h2 className="text-base font-semibold">Chọn nhân viên và bản dữ liệu</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Nhân viên
            <select className="field mt-1" value={employeeId ?? ""} onChange={(e) => chooseEmployee(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">Chọn nhân viên</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.employeeCode} · {e.fullName}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Bản dữ liệu đã lưu
            <select className="field mt-1" value={snapshotId ?? ""} disabled={!employeeId || !snapshots} onChange={(e) => chooseSnapshot(e.target.value ? Number(e.target.value) : undefined)}>
              <option value="">{!employeeId ? "Chọn nhân viên trước" : !snapshots ? "Đang tải…" : snapshots.length ? "Chọn bản dữ liệu" : "Chưa có bản dữ liệu"}</option>
              {snapshots?.map((s) => s.snapshotId && <option key={s.snapshotId} value={s.snapshotId}>#{s.snapshotId} · {formatDateTime(s.snapshotDate || s.capturedAt)} · {s.ready ? "Sẵn sàng" : "Chưa đủ"}</option>)}
            </select>
          </label>
        </div>
        {snapshotsError && <div className="mt-3"><Notice tone="error">{snapshotsError}</Notice></div>}

        {employeeId && (
          <div className="mt-4 border-t pt-4">
            <p className="text-sm text-muted-foreground">Tạo bản dữ liệu mới từ hồ sơ hiện tại. Thao tác này có thể lưu một bản dữ liệu mới vào hệ thống.</p>
            <label className="mt-3 block max-w-sm text-sm font-medium">
              Tỷ giá VND cho 1 USD <span className="font-normal text-muted-foreground">(chỉ dùng để quy đổi lương sang USD)</span>
              <input className="field tabular mt-1" type="number" min={1} max={1000000} value={rate} onChange={(e) => setRate(e.target.value)} />
            </label>
            {!!snapshot?.missingFeatures?.length && !snapshot.ready && (
              <div className="mt-3">
                <p className="text-sm">Bổ sung giá trị còn thiếu. Giá trị bổ sung chỉ dùng cho bản dữ liệu này, không sửa hồ sơ nhân viên, và được đánh dấu nguồn thủ công.</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {snapshot.missingFeatures.map((key) => (
                    <label key={key} className="text-sm font-medium">
                      {featureLabel(key)} {FEATURE_UNITS[key] && <span className="font-normal text-muted-foreground">({FEATURE_UNITS[key]})</span>}
                      {FEATURE_CHOICES[key] ? (
                        <select className="field mt-1" value={supplement[key] || ""} onChange={(e) => setSupplement((v) => ({ ...v, [key]: e.target.value }))}>
                          <option value="">Chọn giá trị</option>
                          {FEATURE_CHOICES[key].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <input className="field tabular mt-1" type={key === "Hire_Date" ? "date" : "number"} value={supplement[key] || ""} onChange={(e) => setSupplement((v) => ({ ...v, [key]: e.target.value }))} />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button type="button" className="btn btn-secondary mt-3" disabled={!!busy} onClick={() => void prepare()}>
              {busy === "preview" ? "Đang kiểm tra…" : "Kiểm tra và tạo bản dữ liệu"}
            </button>
          </div>
        )}
      </div>

      {snapshotLoading && <Loading label="Đang tải bản dữ liệu…" />}
      {snapshot && (
        <div className="panel p-4">
          <h2 className="text-base font-semibold">
            {snapshot.ready ? `Bản dữ liệu #${snapshot.snapshotId} sẵn sàng` : "Bản dữ liệu chưa đủ để dự đoán"}
          </h2>
          {!snapshot.ready && !!snapshot.missingFeatures?.length && <p className="mt-1 text-sm text-warning">Thiếu: {snapshot.missingFeatures.map(featureLabel).join(", ")}</p>}
          {!!snapshot.invalidFeatures?.length && <p className="mt-1 text-sm text-warning">Không hợp lệ: {snapshot.invalidFeatures.map(featureLabel).join(", ")}</p>}
          {!!snapshot.issues?.length && <ul className="mt-1 list-disc pl-5 text-sm text-warning">{snapshot.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(snapshot.features).map(([k, v]) => (
              <div key={k} className="rounded-md bg-muted p-2">
                <dt className="text-xs text-muted-foreground">{featureLabel(k)}</dt>
                <dd className="tabular text-sm font-medium">{String(v)} {FEATURE_UNITS[k] && <span className="text-xs font-normal text-muted-foreground">{FEATURE_UNITS[k]}</span>}</dd>
                <dd className="text-xs text-muted-foreground">{provenanceLabel(snapshot.provenance?.[k])}</dd>
              </div>
            ))}
          </dl>
          {snapshot.ready && (
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Lưu kết quả
              </label>
              <button type="button" className="btn btn-primary" disabled={!!busy} onClick={() => void predict()}>
                {busy === "predict" ? "Đang dự đoán…" : "Dự đoán"}
              </button>
            </div>
          )}
        </div>
      )}

      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^[1-9]\d*$/.test(resultInput)) return setError("Vui lòng nhập mã kết quả hợp lệ.");
          void openResult(Number(resultInput));
        }}
      >
        <label className="text-sm font-medium">
          Mở kết quả đã lưu
          <input className="field tabular mt-1 w-40" inputMode="numeric" placeholder="Mã kết quả" value={resultInput} onChange={(e) => setResultInput(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-secondary" disabled={!!busy}>{busy === "result" ? "Đang mở…" : "Mở"}</button>
      </form>

      {error && <Notice tone="error">{error}</Notice>}
      {busy === "predict" && <Loading label="Đang gửi yêu cầu dự đoán qua ERIS…" />}
      {result ? <EmployeeDashboard ref={headingRef} result={result} illustrative={illustrative} policyLoader={policyLoader} /> : !busy && !snapshot && <Empty>Chọn nhân viên và bản dữ liệu để chạy dự đoán.</Empty>}
    </div>
  );
}
