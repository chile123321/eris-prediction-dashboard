import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ApiUnavailable, Loading } from "@/components/eris/States";
import { useSession } from "@/lib/eris/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ERIS · Employee Retention Intelligence System" },
      { name: "description", content: "Dự đoán nguy cơ nghỉ việc bằng AI và hỗ trợ quyết định nhân sự." },
      { property: "og:title", content: "ERIS · Employee Retention Intelligence System" },
      { property: "og:description", content: "Dự đoán nguy cơ nghỉ việc bằng AI và hỗ trợ quyết định nhân sự." },
    ],
  }),
  component: Index,
});

/** Redirects according to the real ERIS session. */
function Index() {
  const { state, reload } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (state.status === "signedIn") void navigate({ to: "/ai-analysis", replace: true });
    if (state.status === "signedOut") void navigate({ to: "/login", replace: true });
  }, [state.status, navigate]);
  return <div className="p-6">{state.status === "unavailable" ? <ApiUnavailable onRetry={reload} /> : <Loading label="Đang kiểm tra phiên đăng nhập…" />}</div>;
}
