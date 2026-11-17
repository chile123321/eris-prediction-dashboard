import { useState, type ReactNode } from "react";
import { getApiErrorMessage } from "@/lib/eris/api";
import { AlertCircle, ArrowLeft, ArrowRight, Inbox, Loader2, RotateCcw, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground lg:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-mint text-primary border-primary/15",
  SUBMITTED: "bg-mint text-primary border-primary/15",
  CREATED: "bg-mint text-primary border-primary/15",
  IN_PROCESS: "bg-warning-surface text-warning border-warning/20",
  DRAFT: "bg-muted text-muted-foreground border-border",
  NOT_STARTED: "bg-info-surface text-info border-info/20",
  INACTIVE: "bg-error-surface text-destructive border-destructive/15",
  CLOSED: "bg-muted text-muted-foreground border-border",
  FAILED: "bg-error-surface text-destructive border-destructive/15",
  SENT: "bg-mint text-primary border-primary/15",
  NO_ACCOUNT: "bg-muted text-muted-foreground border-border",
  UNKNOWN: "bg-muted text-muted-foreground border-border",
};
export function accountStatusLabel(status: string) {
  return ({ ACTIVE: "Đã kích hoạt", IN_PROCESS: "Chờ kích hoạt", INACTIVE: "Đã khóa", NO_ACCOUNT: "Chưa có tài khoản", UNKNOWN: "Chưa xác định" } as Record<string, string>)[status] || "Chưa xác định";
}
const statusLabels: Record<string, string> = {
  ACTIVE: "Đã kích hoạt", INACTIVE: "Đã khóa", IN_PROCESS: "Chờ kích hoạt", NO_ACCOUNT: "Chưa có tài khoản", UNKNOWN: "Chưa xác định", DRAFT: "Bản nháp",
  CLOSED: "Đã đóng", SUBMITTED: "Đã gửi", NOT_STARTED: "Chưa trả lời", CREATED: "Thành công", FAILED: "Thất bại", SENT: "Đã gửi",
};
export function StatusBadge({ status, label }: { status: string; label?: string | undefined }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status] || "border-border bg-muted text-muted-foreground"}`}>{label || statusLabels[status] || status}</span>;
}

export function Pagination({ page, total, pageSize, onPage }: { page: number; total: number; pageSize: number; onPage: (page: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>Hiển thị {total ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, total)} / {total}</span>
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-secondary h-9 w-9 px-0" aria-label="Trang trước" disabled={page <= 1} onClick={() => onPage(page - 1)}><ArrowLeft className="h-4 w-4" /></button>
        <span className="min-w-20 text-center tabular">Trang {page} / {pages}</span>
        <button type="button" className="btn btn-secondary h-9 w-9 px-0" aria-label="Trang sau" disabled={page >= pages} onClick={() => onPage(page + 1)}><ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function EmptyState({ title = "Chưa có dữ liệu", description, action }: { title?: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center px-6 py-12 text-center"><span className="rounded-xl bg-mint p-3 text-primary"><Inbox className="h-6 w-6" /></span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function LoadingState({ label = "Đang tải dữ liệu minh họa…" }: { label?: string }) {
  return <div role="status" className="panel flex min-h-56 flex-col items-center justify-center p-8 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">{label}</p><div className="mt-5 w-full max-w-md space-y-2"><div className="h-3 animate-pulse rounded bg-muted" /><div className="h-3 w-4/5 animate-pulse rounded bg-muted" /></div></div>;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div role="alert" className="panel flex min-h-56 flex-col items-center justify-center p-8 text-center"><AlertCircle className="h-7 w-7 text-destructive" /><h2 className="mt-3 font-semibold">Không thể tải dữ liệu minh họa</h2><p className="mt-1 text-sm text-muted-foreground">Trạng thái lỗi để đánh giá giao diện; không có yêu cầu mạng nào được gửi.</p>{onRetry && <button type="button" className="btn btn-secondary mt-4" onClick={onRetry}><RotateCcw className="h-4 w-4" />Thử lại</button>}</div>;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Xác nhận", destructive = false, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; confirmLabel?: string; destructive?: boolean; onConfirm: () => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function confirm() { setBusy(true); setError(""); try { await onConfirm(); onOpenChange(false); } catch (reason) { setError(getApiErrorMessage(reason, "Không lưu được thay đổi. Vui lòng thử lại.")); } finally { setBusy(false); } }
  return <Dialog open={open} onOpenChange={(value) => { if (!busy) { setError(""); onOpenChange(value); } }}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription className="leading-6">{description}</DialogDescription></DialogHeader>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><button type="button" disabled={busy} className="btn btn-secondary" onClick={() => { setError(""); onOpenChange(false); }}>Hủy</button><button type="button" disabled={busy} className={`btn ${destructive ? "bg-destructive text-destructive-foreground" : "btn-primary"}`} onClick={() => void confirm()}>{busy ? "Đang lưu…" : confirmLabel}</button></DialogFooter><span className="sr-only"><X /></span></DialogContent></Dialog>;
}

export function Definition({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="mt-1 text-sm leading-6 text-foreground">{children || "—"}</dd></div>;
}
