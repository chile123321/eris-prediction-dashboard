import { AlertTriangle, CloudOff, Info, Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { getApiBaseUrl } from "@/lib/eris/api";

type Tone = "info" | "warning" | "error";
const toneClass: Record<Tone, string> = {
  info: "border-info/30 bg-info-surface text-info",
  warning: "border-warning/30 bg-warning-surface text-warning",
  error: "border-destructive/30 bg-error-surface text-destructive",
};

export function Notice({ tone = "info", title, children, action }: { tone?: Tone; title?: string; children?: ReactNode; action?: ReactNode }) {
  const Icon = tone === "info" ? Info : AlertTriangle;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex gap-3 rounded-lg border p-3 text-sm ${toneClass[tone]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="text-foreground/80">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Loading({ label = "Đang tải…" }: { label?: string }) {
  return (
    <p role="status" className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {label}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{children}</p>;
}

export function ApiUnavailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <div role="alert" className="panel mx-auto max-w-lg p-6 text-center">
      <CloudOff className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
      <h2 className="mt-3 text-base font-semibold">Không kết nối được ERIS API</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Máy chủ ERIS không phản hồi tại <code className="tabular rounded bg-muted px-1">{getApiBaseUrl()}</code>. Dự đoán
        và dữ liệu nhân viên chỉ hiển thị khi backend ERIS đang chạy.
      </p>
      {onRetry && (
        <button type="button" className="btn btn-secondary mt-4" onClick={onRetry}>
          Thử kết nối lại
        </button>
      )}
    </div>
  );
}

export function Forbidden() {
  return (
    <div role="alert" className="panel mx-auto max-w-lg p-6 text-center">
      <Lock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
      <h2 className="mt-3 text-base font-semibold">Không có quyền truy cập</h2>
      <p className="mt-2 text-sm text-muted-foreground">Phân tích AI chỉ dành cho tài khoản HR đang hoạt động.</p>
    </div>
  );
}
