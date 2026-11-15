import { forwardRef, useState } from "react";
import {
  generateAiPolicyRecommendations,
  getApiErrorMessage,
  type AiPolicyRecommendations,
  type AiPrediction,
} from "@/lib/eris/api";
import {
  additivityCheck,
  featureLabel,
  FEATURE_UNITS,
  formatDateTime,
  formatFeatureValue,
  formatPercent,
  formatSignedPoints,
  isDemoModel,
  provenanceLabel,
  sortedContributions,
  toPoints,
  topFactors,
} from "@/lib/eris/analysis";
import { Empty, Notice } from "./States";

/** One dashboard for single, saved and batch-row results. Inputs come only from result.preview (the snapshot used). */
export const EmployeeDashboard = forwardRef<HTMLHeadingElement, { result: AiPrediction }>(function EmployeeDashboard({ result }, ref) {
  const { model, preview } = result;
  const demo = isDemoModel(model);
  const base = typeof model.base_value === "number" ? model.base_value : null;
  const check = additivityCheck(model);
  const contributions = sortedContributions(model.contributions || {});
  const maxAbs = Math.max(...contributions.map((c) => Math.abs(c.raw)), 1e-12);
  const factors = topFactors(model.contributions || {});
  const featureKeys = Array.from(new Set([...Object.keys(preview?.features || {}), ...Object.keys(model.contributions || {})]));
  const issuesFor = (key: string) =>
    [
      preview?.missingFeatures?.includes(key) && "Thiếu",
      preview?.invalidFeatures?.includes(key) && "Không hợp lệ",
      preview?.outOfDomainFeatures?.includes(key) && "Ngoài miền dữ liệu model",
    ].filter(Boolean) as string[];

  return (
    <section aria-labelledby="result-heading" className="space-y-4">
      {/* 1. Identity */}
      <div className="panel flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <h2 id="result-heading" ref={ref} tabIndex={-1} className="text-lg font-semibold">
          {preview?.employee?.fullName ?? "—"} <span className="text-muted-foreground">· {preview?.employee?.employeeCode}</span>
        </h2>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div><dt className="inline text-muted-foreground">Ngày dữ liệu: </dt><dd className="inline tabular">{formatDateTime(preview?.snapshotDate || preview?.capturedAt)}</dd></div>
          <div><dt className="inline text-muted-foreground">Bản dữ liệu: </dt><dd className="inline tabular">#{result.snapshotId ?? preview?.snapshotId ?? "—"}</dd></div>
          {result.createdAt && <div><dt className="inline text-muted-foreground">Thời điểm dự đoán: </dt><dd className="inline tabular">{formatDateTime(result.createdAt)}</dd></div>}
          <div>
            <dt className="sr-only">Trạng thái lưu</dt>
            <dd className={`rounded px-2 py-0.5 text-xs font-medium ${result.saved ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
              {result.saved ? `Đã lưu · Kết quả #${result.predictionId}` : "Chưa lưu"}
            </dd>
          </div>
        </dl>
      </div>

      {result.warning && <Notice tone="warning" title="Giới hạn của mô hình">{result.warning}</Notice>}

      {/* 2. Summary */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label={demo ? "Điểm thử nghiệm" : "Điểm dự đoán"} value={formatPercent(model.score)} hint="100 × score của mô hình" />
        <Summary label="Mức tham chiếu" value={base === null ? "—" : formatPercent(base)} hint="Mốc giải thích (base value) của mô hình" />
        <Summary
          label="Chênh lệch so với tham chiếu"
          value={base === null ? "—" : `${formatSignedPoints(model.score - base)} điểm %`}
          hint="score − base value, đơn vị điểm phần trăm"
        />
      </div>

      {check.checked && !check.ok && (
        <Notice tone="error" title="Dữ liệu giải thích không khớp">
          Mức tham chiếu cộng tổng đóng góp lệch điểm dự đoán {check.error.toExponential(2)}. Dữ liệu được giữ nguyên, không hiệu chỉnh.
        </Notice>
      )}

      {/* 3 + 4. Chart and factors */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-4 lg:col-span-2">
          <h3 className="text-base font-semibold">Đóng góp của từng yếu tố (SHAP)</h3>
          <p className="mt-1 text-xs text-muted-foreground">Đơn vị: điểm phần trăm. SHAP mô tả cách mô hình tính điểm, không phải bằng chứng nhân quả.</p>
          <div className="mt-2 flex gap-4 text-xs" aria-hidden>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-shap-increase" /> + Tăng điểm</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-shap-decrease" /> − Giảm điểm</span>
          </div>
          <ul className="mt-3 space-y-1.5" aria-label="Biểu đồ đóng góp, sắp xếp theo độ lớn">
            {contributions.map((c) => {
              const width = `${(Math.abs(c.raw) / maxAbs) * 50}%`;
              const title = `${featureLabel(c.key)} (${c.key}) = ${formatFeatureValue(preview, c.key)}${FEATURE_UNITS[c.key] ? " " + FEATURE_UNITS[c.key] : ""} · ${c.direction === "neutral" ? "Trung tính" : c.direction === "increase" ? "Tăng" : "Giảm"} ${toPoints(c.raw).toFixed(6)} điểm %`;
              return (
                <li key={c.key} className="grid grid-cols-[minmax(0,10rem)_1fr_4.5rem] items-center gap-2 text-sm" title={title}>
                  <span className="truncate">{featureLabel(c.key)}</span>
                  <span className="relative h-4">
                    <span className="absolute inset-y-0 left-1/2 w-px bg-border" />
                    {c.raw !== 0 && (
                      <span
                        className={`absolute inset-y-0.5 rounded-sm ${c.raw > 0 ? "left-1/2 bg-shap-increase" : "right-1/2 bg-shap-decrease"}`}
                        style={{ width }}
                      />
                    )}
                  </span>
                  <span className="tabular text-right text-xs">{c.raw === 0 ? "Trung tính" : formatSignedPoints(c.raw)}</span>
                  <span className="sr-only">{title}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="panel space-y-4 p-4">
          <FactorList title="Yếu tố làm tăng điểm" items={factors.increase} result={result} />
          <FactorList title="Yếu tố làm giảm điểm" items={factors.decrease} result={result} />
        </div>
      </div>

      {/* 5. Inputs */}
      <div className="panel p-4">
        <h3 className="text-base font-semibold">Dữ liệu đầu vào của lần dự đoán</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b"><th className="py-2 pr-3 font-medium">Yếu tố</th><th className="pr-3 font-medium">Giá trị</th><th className="pr-3 font-medium">Đơn vị</th><th className="pr-3 font-medium">Nguồn</th><th className="pr-3 font-medium">Đóng góp</th><th className="font-medium">Cảnh báo</th></tr>
            </thead>
            <tbody>
              {featureKeys.map((key) => (
                <tr key={key} className="border-b last:border-0">
                  <td className="py-2 pr-3">{featureLabel(key)} <span className="block text-xs text-muted-foreground">{key}</span></td>
                  <td className="tabular pr-3">{formatFeatureValue(preview, key)}</td>
                  <td className="pr-3 text-muted-foreground">{FEATURE_UNITS[key] || "—"}</td>
                  <td className="pr-3 text-xs">{provenanceLabel(preview?.provenance?.[key])}</td>
                  <td className="tabular pr-3">{key in (model.contributions || {}) ? formatSignedPoints(model.contributions[key]) : "—"}</td>
                  <td className="text-xs text-warning">{issuesFor(key).join(", ") || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!!preview?.issues?.length && <ul className="mt-3 list-disc pl-5 text-xs text-warning">{preview.issues.map((i) => <li key={i}>{i}</li>)}</ul>}
        {preview?.conversion && <p className="mt-2 text-xs text-muted-foreground">Quy đổi: {JSON.stringify(preview.conversion)}</p>}
      </div>

      <details className="panel p-4 text-sm">
        <summary className="cursor-pointer font-medium">Chi tiết kỹ thuật</summary>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {[["Model", model.model_id], ["Schema", model.schema_version], ["Trạng thái kiểm định", model.validation_status], ["Demo mode", String(model.demo_mode ?? "—")], ["Explainer", model.explainer], ["Đơn vị SHAP", model.shap_units], ["Sai số cộng dồn", model.additivity_error?.toExponential(2)], ["Run", result.runId]].map(([k, v]) => (
            <div key={String(k)}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="tabular break-all">{v ?? "—"}</dd></div>
          ))}
        </dl>
      </details>

      {/* 6. Policy */}
      <PolicyPanel result={result} />
    </section>
  );
});

function Summary({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="panel p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function FactorList({ title, items, result }: { title: string; items: ReturnType<typeof topFactors>["increase"]; result: AiPrediction }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Không có yếu tố nào theo hướng này.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((c) => (
            <li key={c.key} className="text-sm">
              <span className="font-medium">{featureLabel(c.key)}</span> = <span className="tabular">{formatFeatureValue(result.preview, c.key)}</span>
              <span className={`tabular ml-2 text-xs ${c.raw > 0 ? "text-warning" : "text-info"}`}>{formatSignedPoints(c.raw)} điểm %</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PolicyPanel({ result }: { result: AiPrediction }) {
  const [save, setSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AiPolicyRecommendations | null>(null);
  const id = result.saved ? result.predictionId : undefined;

  async function run() {
    if (!id || busy) return;
    setBusy(true);
    setError("");
    try {
      setData((await generateAiPolicyRecommendations(id, save)).data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Không tải được đề xuất chính sách."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-4">
      <h3 className="text-base font-semibold">Đề xuất chính sách giữ chân</h3>
      {!id ? (
        <p className="mt-2 text-sm text-muted-foreground">Kết quả này chưa lưu. Đề xuất chính sách cần mã kết quả đã lưu; hãy chạy dự đoán với tùy chọn “Lưu kết quả”.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> Lưu đề xuất vào hệ thống
            </label>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void run()}>
              {busy ? "Đang tải…" : "Xem đề xuất"}
            </button>
          </div>
          {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
          {data && (
            <div className="mt-4 space-y-3">
              {data.warning && <Notice tone="warning">{data.warning}</Notice>}
              {data.requiresPolicyApproval && <Notice tone="info">Một số đề xuất là bản nháp chính sách và cần được phê duyệt trước khi áp dụng.</Notice>}
              <p className="text-xs text-muted-foreground">{data.saved ? "Đã lưu đề xuất." : "Chưa lưu đề xuất."} {data.omittedCount ? `Bỏ qua ${data.omittedCount} đề xuất.` : ""}</p>
              {data.recommendations.length === 0 ? (
                <Empty>Không có đề xuất phù hợp cho kết quả này.</Empty>
              ) : (
                <ol className="space-y-2">
                  {data.recommendations.map((r) => {
                    const saved = data.savedRecommendations?.find((s) => s.policyId === r.policy?.id);
                    return (
                      <li key={r.rank} className="rounded-lg border p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="tabular text-xs text-muted-foreground">#{r.rank}</span>
                          <span className="font-medium">{r.policy?.name ?? r.policyDraft?.name ?? "—"}</span>
                          {!r.policy && r.policyDraft && <span className="rounded bg-warning-surface px-2 py-0.5 text-xs text-warning">Bản nháp</span>}
                          <span className="rounded bg-muted px-2 py-0.5 text-xs">{saved?.status ?? r.status}</span>
                          {r.priority && <span className="text-xs text-muted-foreground">Ưu tiên: {r.priority}</span>}
                        </div>
                        {(r.policy?.description || r.policyDraft?.description) && <p className="mt-1 text-muted-foreground">{r.policy?.description || r.policyDraft?.description}</p>}
                        <p className="mt-1">{r.reason}</p>
                        {r.signals.length > 0 && (
                          <ul className="mt-1 text-xs text-muted-foreground">
                            {r.signals.map((s) => (
                              <li key={s.feature}>{featureLabel(s.feature)} = {s.value} · <span className="tabular">{s.impactPercentagePoints > 0 ? "+" : ""}{s.impactPercentagePoints} điểm %</span> · {s.source}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
