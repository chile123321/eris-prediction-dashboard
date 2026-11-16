import { Link } from "@tanstack/react-router";
import { Activity, BrainCircuit, ClipboardList, LogOut, Menu, RotateCcw, ShieldCheck, Users, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { ErisLogo } from "./Logo";
import { usePreview } from "@/lib/eris/preview";

type Role = "ADMIN" | "HR" | "EMPLOYEE";
type Props = { role: Role; breadcrumb: string[]; children: ReactNode; preview?: boolean; userLabel?: string | undefined; onSignOut?: (() => void) | undefined };

export function WorkspaceShell({ role, breadcrumb, children, preview = false, userLabel, onSignOut }: Props) {
  const [open, setOpen] = useState(false);
  const previewApi = preview ? usePreview() : null;
  const navItems = role === "ADMIN" ? (preview ? ([
    { to: "/preview/admin/users", label: "Quản lý tài khoản", icon: Users },
    { to: "/preview/admin/activity", label: "Nhật ký hoạt động", icon: Activity },
  ] as const) : ([
    { to: "/users", label: "Quản lý tài khoản", icon: Users },
    { to: "/activity", label: "Nhật ký hoạt động", icon: Activity },
  ] as const)) : role === "HR" ? (preview ? ([
    { to: "/preview/hr/employees", label: "Nhân viên", icon: Users },
    { to: "/preview/hr/ai-analysis", label: "Phân tích AI", icon: BrainCircuit },
    { to: "/preview/hr/engagement", label: "Khảo sát", icon: ClipboardList },
  ] as const) : ([
    { to: "/employees", label: "Nhân viên", icon: Users },
    { to: "/ai-analysis", label: "Phân tích AI", icon: BrainCircuit },
    { to: "/engagement", label: "Khảo sát", icon: ClipboardList },
  ] as const)) : (preview ? ([
    { to: "/preview/employee/my-surveys", label: "Khảo sát của tôi", icon: ClipboardList },
  ] as const) : ([
    { to: "/my-surveys", label: "Khảo sát của tôi", icon: ClipboardList },
  ] as const));
  const roleLabel = role === "ADMIN" ? "Quản trị viên" : role === "HR" ? "Nhân sự" : "Nhân viên";
  const nav = (
    <nav aria-label={`Điều hướng ${roleLabel}`} className="flex flex-col gap-1 p-3">
      {navItems.map((item) => (
        <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }} activeOptions={{ exact: false }}>
          <item.icon className="h-[18px] w-[18px] text-primary" aria-hidden />{item.label}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-sidebar lg:flex lg:flex-col">
        <div className="flex h-[72px] items-center border-b px-5"><ErisLogo to={preview ? "/preview" : "/"} compact /></div>
        <div className="px-5 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Không gian {roleLabel}</div>
        {nav}
        <div className="mt-auto p-4">
          <div className="rounded-xl bg-mint p-3 text-xs leading-5 text-secondary-foreground"><ShieldCheck className="mb-2 h-4 w-4" />{preview ? "Không gian độc lập, không dùng tài khoản thật." : "Quyền truy cập được xác thực bởi tài khoản ERIS."}</div>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu điều hướng"><button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} /><aside className="relative h-full w-72 bg-sidebar shadow-lift"><div className="flex h-[72px] items-center justify-between border-b px-4"><ErisLogo to={preview ? "/preview" : "/"} compact /><button type="button" className="btn h-10 w-10 px-0" aria-label="Đóng menu" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>{nav}</aside></div>}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b bg-card/95 px-4 backdrop-blur lg:px-7">
          <button type="button" className="btn h-10 w-10 px-0 lg:hidden" aria-label="Mở menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
          <ol aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">{breadcrumb.map((item, index) => <li key={`${item}-${index}`} className={index === breadcrumb.length - 1 ? "truncate font-medium text-foreground" : "truncate"}>{index > 0 && <span className="mr-2" aria-hidden>/</span>}{item}</li>)}</ol>
          {preview ? <Link to="/preview" className="btn btn-secondary h-9 px-3 text-xs"><Users className="h-4 w-4" /><span className="hidden sm:inline">Đổi vai trò</span></Link> : <span className="hidden max-w-48 truncate text-sm text-muted-foreground md:block">{userLabel}</span>}
          {preview ? <button type="button" className="btn btn-secondary h-9 px-3 text-xs" onClick={previewApi?.reset}><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Đặt lại</span></button> : <button type="button" className="btn btn-secondary h-9" onClick={onSignOut}><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Đăng xuất</span></button>}
        </header>
        {preview && <div className="border-b bg-mint px-4 py-2.5 lg:px-7"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 text-xs text-secondary-foreground"><span className="font-semibold">Bản xem trước · Dữ liệu minh họa.</span><span className="hidden text-muted-foreground sm:inline">Mọi thay đổi chỉ tồn tại trong phiên xem này.</span><label className="ml-auto flex items-center gap-2">Trạng thái<select className="field h-8 w-auto min-w-32 py-0 text-xs" value={previewApi?.viewState} onChange={(event) => previewApi?.setViewState(event.target.value as "populated" | "loading" | "empty" | "error")}><option value="populated">Có dữ liệu</option><option value="loading">Đang tải</option><option value="empty">Trống</option><option value="error">Lỗi</option></select></label></div></div>}
        <main className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
