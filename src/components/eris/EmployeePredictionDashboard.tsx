import { forwardRef, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  Play,
  RefreshCw,
  Save,
} from "lucide-react";
import type { AiEmployee, AiPrediction, AiSnapshot } from "@/lib/eris/api";
import { formatDateTime, formatPercent, getPredictionRisk, toPoints } from "@/lib/eris/analysis";

export type PredictionDashboardState = "idle" | "loading" | "success" | "error";

type Props = {
  state: PredictionDashboardState;
  result?: AiPrediction | null | undefined;
  snapshot?: AiSnapshot | null | undefined;
  employee?: AiEmployee | null | undefined;
  error?: string | undefined;
  loadingLabel?: string | undefined;
  illustrative?: boolean | undefined;
  busy?: boolean | undefined;
  onRetry?: (() => void) | undefined;
  onPredict: () => void;
  onSave: () => void;
  onOpenSaved: (id: number) => void;
};

/** Basic individual prediction result only. SHAP, insights and policy recommendations belong to later modules. */
export const EmployeePredictionDashboard = forwardRef<HTMLHeadingElement, Props>(
  function EmployeePredictionDashboard(
    {
      state,
      result,
      snapshot,
      employee,
      error,
      loadingLabel,
      illustrative = false,
      busy = false,
      onRetry,
      onPredict,
      onSave,
      onOpenSaved,
    },
    ref,
  ) {
    const [lookup, setLookup] = useState("");
    const source = result?.preview ?? snapshot;
    const person = source?.employee ?? employee;
    const department = source?.features?.["Department"];
    const snapshotId = result?.snapshotId ?? source?.snapshotId;
    const risk = result ? getPredictionRisk(result.model) : null;
    const percent = result ? Math.min(100, Math.max(0, toPoints(result.model.score))) : 0;
    const validLookup = /^[1-9]\d*$/.test(lookup);

    useEffect(() => {
      if (result?.predictionId) setLookup(String(result.predictionId));
    }, [result?.predictionId]);

    return (
      <section
        aria-labelledby="prediction-result-heading"
        className="panel min-[1200px]:sticky min-[1200px]:top-24"
        aria-busy={state === "loading"}
      >
        <div className="border-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="prediction-result-heading"
              ref={ref}
              tabIndex={-1}
              className="text-base font-semibold"
            >
              Kết quả dự đoán
            </h2>
            {state === "success" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Thành công
              </span>
            )}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="min-w-0">
              <dt className="text-muted-foreground">Nhân viên</dt>
              <dd className="mt-0.5 truncate font-medium">{person?.fullName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Mã nhân viên</dt>
              <dd className="tabular mt-0.5 font-medium">{person?.employeeCode ?? "—"}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-muted-foreground">Phòng ban</dt>
              <dd className="mt-0.5 truncate font-medium">
                {department ? String(department) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Bản dữ liệu</dt>
              <dd className="tabular mt-0.5 font-medium">{snapshotId ? `#${snapshotId}` : "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="p-5">
          {state === "idle" && (
            <div className="flex min-h-72 flex-col items-center justify-center px-4 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
                <Database className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold">Chưa có kết quả dự đoán</h3>
              <p className="mt-2 max-w-64 text-sm leading-6 text-muted-foreground">
                Kiểm tra dữ liệu bên trái và chọn Dự đoán để bắt đầu.
              </p>
            </div>
          )}

          {state === "loading" && (
            <div
              role="status"
              className="flex min-h-72 flex-col items-center justify-center text-center"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              <h3 className="mt-4 text-base font-semibold">
                {loadingLabel ?? "Đang phân tích dữ liệu…"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Dữ liệu đầu vào vẫn được giữ nguyên.
              </p>
              <div className="mt-6 w-full max-w-56 space-y-2" aria-hidden>
                <div className="h-3 animate-pulse rounded bg-muted" />
                <div className="mx-auto h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          )}

          {state === "error" && (
            <div
              role="alert"
              className="flex min-h-72 flex-col items-center justify-center text-center"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-error-surface text-destructive">
                <AlertTriangle className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold">Không thể hoàn thành dự đoán</h3>
              <p className="mt-2 max-w-72 text-sm leading-6 text-muted-foreground">
                {error || "Vui lòng thử lại sau."}
              </p>
              {onRetry && (
                <button
                  type="button"
                  className="btn btn-secondary mt-5"
                  disabled={busy}
                  onClick={onRetry}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Thử lại
                </button>
              )}
            </div>
          )}

          {state === "success" && result && risk && (
            <div>
              {illustrative && (
                <p className="mb-3 rounded-lg bg-mint px-3 py-2 text-xs leading-5 text-secondary-foreground">
                  Kết quả minh họa, không phải dự đoán Mexwell thật.
                </p>
              )}
              <div className="flex flex-col items-center border-b pb-5 text-center">
                <div className={`relative h-36 w-36 ${risk.colorClass}`}>
                  <svg
                    viewBox="0 0 112 112"
                    className="h-full w-full -rotate-90"
                    role="img"
                    aria-label={`Xác suất dự đoán ${formatPercent(result.model.score)}`}
                  >
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      fill="none"
                      strokeWidth="9"
                      className="text-muted"
                      stroke="currentColor"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="46"
                      fill="none"
                      strokeWidth="9"
                      strokeLinecap="round"
                      pathLength={100}
                      strokeDasharray={`${percent} 100`}
                      stroke="currentColor"
                    />
                  </svg>
                  <div className="absolute inset-0 flex rotate-0 flex-col items-center justify-center text-foreground">
                    <span className="tabular text-3xl font-semibold tracking-tight">
                      {formatPercent(result.model.score)}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">Xác suất dự đoán</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mức cảnh báo</span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${risk.surfaceClass}`}
                  >
                    {risk.label}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <StatusItem label="Trạng thái" value="Dự đoán thành công" />
                <StatusItem
                  label="Lưu kết quả"
                  value={
                    result.saved
                      ? `Đã lưu${result.predictionId ? ` · #${result.predictionId}` : ""}`
                      : "Chưa lưu"
                  }
                />
                <StatusItem label="Thời gian dự đoán" value={formatDateTime(result.createdAt)} />
                <StatusItem
                  label="Model / schema"
                  value={
                    [result.model.model_id, result.model.schema_version]
                      .filter(Boolean)
                      .join(" · ") || "—"
                  }
                />
              </dl>
              {result.warning && !illustrative && (
                <p className="mt-3 rounded-lg bg-warning-surface px-3 py-2 text-xs leading-5 text-warning">
                  {result.warning}
                </p>
              )}

              <div className="mt-5 grid gap-2 sm:grid-cols-2 min-[1200px]:grid-cols-1">
                {!result.saved && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={onSave}
                  >
                    <Save className="h-4 w-4" aria-hidden />
                    Lưu kết quả
                  </button>
                )}
                <button
                  type="button"
                  className={`btn ${result.saved ? "btn-primary" : "btn-secondary"}`}
                  disabled={busy}
                  onClick={onPredict}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Dự đoán lại
                </button>
              </div>
              {!result.saved && (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Lưu kết quả sẽ chạy lại cùng bản dữ liệu với tùy chọn lưu của hệ thống.
                </p>
              )}
            </div>
          )}

          <details className="mt-5 border-t pt-4 text-sm">
            <summary className="cursor-pointer font-medium">Xem kết quả đã lưu</summary>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (validLookup && !busy) onOpenSaved(Number(lookup));
              }}
            >
              <label className="min-w-0 flex-1">
                <span className="sr-only">Mã kết quả đã lưu</span>
                <input
                  className="field tabular h-9"
                  inputMode="numeric"
                  placeholder="Mã kết quả"
                  value={lookup}
                  onChange={(event) => setLookup(event.target.value)}
                />
              </label>
              <button
                type="submit"
                className="btn btn-secondary h-9"
                disabled={!validLookup || busy}
              >
                <Play className="h-3.5 w-3.5" aria-hidden />
                Mở
              </button>
            </form>
          </details>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Kết quả là tín hiệu hỗ trợ HR xem xét và không phải kết luận chắc chắn về nhân viên.
          </p>
        </div>
      </section>
    );
  },
);

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-muted px-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular mt-1 break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}
