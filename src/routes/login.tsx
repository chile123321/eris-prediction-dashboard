import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Notice } from "@/components/eris/States";
import { changePassword, getApiErrorMessage, getCurrentUser, isApiUnavailable, login } from "@/lib/eris/api";
import { useSession } from "@/lib/eris/session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Đăng nhập · ERIS" },
      { name: "description", content: "Đăng nhập hệ thống ERIS — Employee Retention Intelligence System." },
      { property: "og:title", content: "Đăng nhập · ERIS" },
      { property: "og:description", content: "Đăng nhập hệ thống ERIS — Employee Retention Intelligence System." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { state, setUser } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [changeToken, setChangeToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (state.status === "signedIn") void navigate({ to: "/ai-analysis" });
  }, [state, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      const r = await login(email.trim(), password);
      if (r.accessToken) setUser(r.user ?? (await getCurrentUser()));
      else if (r.passwordChangeToken) setChangeToken(r.passwordChangeToken);
    } catch (err) {
      setError(isApiUnavailable(err) ? "Không kết nối được ERIS API. Vui lòng thử lại khi backend đang chạy." : getApiErrorMessage(err, "Đăng nhập không thành công."));
    } finally {
      setBusy(false);
    }
  }

  async function activate(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !changeToken) return;
    if (next !== confirm) return setError("Mật khẩu xác nhận không khớp.");
    setBusy(true);
    setError("");
    try {
      await changePassword(changeToken, password, otp.trim(), next);
      setChangeToken(null);
      setPassword("");
      setOtp("");
      setNext("");
      setConfirm("");
      setInfo("Đã kích hoạt tài khoản. Vui lòng đăng nhập lại bằng mật khẩu mới.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Không đổi được mật khẩu."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="panel w-full max-w-[420px] p-6">
        <p className="text-sm font-semibold tracking-tight text-primary">ERIS</p>
        <h1 className="mt-1 text-2xl font-semibold">{changeToken ? "Kích hoạt tài khoản" : "Đăng nhập"}</h1>
        {state.status === "unavailable" && <div className="mt-4"><Notice tone="warning">ERIS API hiện không phản hồi. Đăng nhập cần backend ERIS đang chạy.</Notice></div>}
        {info && <div className="mt-4"><Notice tone="info">{info}</Notice></div>}
        {error && <div className="mt-4"><Notice tone="error">{error}</Notice></div>}
        {!changeToken ? (
          <form className="mt-5 space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium">Email<input className="field mt-1" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label className="block text-sm font-medium">
              Mật khẩu
              <span className="relative mt-1 block">
                <input className="field pr-11" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" className="absolute inset-y-0 right-0 w-11 text-muted-foreground" aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShow((s) => !s)}>
                  {show ? <EyeOff className="mx-auto h-4 w-4" /> : <Eye className="mx-auto h-4 w-4" />}
                </button>
              </span>
            </label>
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
          </form>
        ) : (
          <form className="mt-5 space-y-4" onSubmit={activate}>
            <p className="text-sm text-muted-foreground">Nhập mã OTP đã gửi tới email và đặt mật khẩu mới.</p>
            <label className="block text-sm font-medium">Mã OTP<input className="field tabular mt-1" inputMode="numeric" autoComplete="one-time-code" required value={otp} onChange={(e) => setOtp(e.target.value)} /></label>
            <label className="block text-sm font-medium">Mật khẩu mới<input className="field mt-1" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} /></label>
            <label className="block text-sm font-medium">Xác nhận mật khẩu<input className="field mt-1" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>{busy ? "Đang xử lý…" : "Kích hoạt"}</button>
            <button type="button" className="btn btn-secondary w-full" onClick={() => setChangeToken(null)}>Quay lại đăng nhập</button>
          </form>
        )}
      </div>
    </main>
  );
}
