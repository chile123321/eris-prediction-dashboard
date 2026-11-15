import { Link } from "@tanstack/react-router";
import { BrainCircuit, LogOut, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useSession } from "@/lib/eris/session";

export function AppShell({ breadcrumb, children }: { breadcrumb: string[]; children: ReactNode }) {
  const { state, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const user = state.status === "signedIn" ? state.user : null;
  const nav = (
    <nav aria-label="Điều hướng chính" className="flex flex-col gap-1 p-3">
      <Link
        to="/ai-analysis"
        onClick={() => setOpen(false)}
        className="flex h-10 items-center gap-2 rounded-md px-3 text-sm text-foreground hover:bg-muted"
        activeProps={{ className: "bg-secondary font-medium text-secondary-foreground" }}
      >
        <BrainCircuit className="h-4 w-4" aria-hidden /> Phân tích AI
      </Link>
    </nav>
  );
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r bg-sidebar lg:block">
        <div className="flex h-14 items-center border-b px-5 text-base font-semibold tracking-tight">ERIS</div>
        {nav}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Đóng menu" className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 bg-sidebar">
            <div className="flex h-14 items-center justify-between border-b px-4 font-semibold">
              ERIS
              <button type="button" className="btn h-11 w-11 px-0" aria-label="Đóng menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
      <div className="lg:pl-56">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4 lg:px-6">
          <button type="button" className="btn h-11 w-11 px-0 lg:hidden" aria-label="Mở menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <ol aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
            {breadcrumb.map((b, i) => (
              <li key={b} className={i === breadcrumb.length - 1 ? "truncate font-medium text-foreground" : "truncate"}>
                {i > 0 && <span className="mr-2" aria-hidden>/</span>}
                {b}
              </li>
            ))}
          </ol>
          {user && <span className="hidden truncate text-sm text-muted-foreground sm:block">{user.fullName || user.email}</span>}
          <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
            <LogOut className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </header>
        <main className="mx-auto max-w-[1400px] p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
