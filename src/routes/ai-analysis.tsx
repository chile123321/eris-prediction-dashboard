import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/eris/AppShell";
import { BatchAnalysis } from "@/components/eris/BatchAnalysis";
import { IndividualAnalysis } from "@/components/eris/IndividualAnalysis";
import { ApiUnavailable, Forbidden, Loading, Notice } from "@/components/eris/States";
import {
  ApiError,
  getAiModel,
  getApiErrorMessage,
  isApiUnavailable,
  listAiEmployees,
  userRole,
  type AiEmployee,
  type AiModelInfo,
} from "@/lib/eris/api";
import { useSession } from "@/lib/eris/session";

type Search = {
  tab?: "batch" | undefined;
  employeeId?: number | undefined;
  snapshotId?: number | undefined;
  resultId?: number | undefined;
};
const posInt = (v: unknown) => {
  const n = Number(v);
  return Number.isSafeInteger(n) && n > 0 ? n : undefined;
};

export const Route = createFileRoute("/ai-analysis")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tab: s["tab"] === "batch" ? "batch" : undefined,
    employeeId: posInt(s["employeeId"]),
    snapshotId: posInt(s["snapshotId"]),
    resultId: posInt(s["resultId"]),
  }),
  head: () => ({
    meta: [
      { title: "Phân tích AI · ERIS" },
      {
        name: "description",
        content:
          "Dự đoán nguy cơ nghỉ việc cho từng nhân viên với dữ liệu đầu vào và kết quả cạnh nhau, hoặc phân tích theo batch.",
      },
      { property: "og:title", content: "Phân tích AI · ERIS" },
      {
        property: "og:description",
        content:
          "Dự đoán nguy cơ nghỉ việc cho từng nhân viên với dữ liệu đầu vào và kết quả cạnh nhau, hoặc phân tích theo batch.",
      },
    ],
  }),
  component: AiAnalysisPage,
});

function AiAnalysisPage() {
  const { state, reload } = useSession();
  const navigate = useNavigate();
  useEffect(() => {
    if (state.status === "signedOut") void navigate({ to: "/login" });
  }, [state.status, navigate]);

  if (state.status === "loading" || state.status === "signedOut")
    return (
      <div className="p-6">
        <Loading label="Đang kiểm tra phiên đăng nhập…" />
      </div>
    );
  if (state.status === "unavailable")
    return (
      <div className="p-6">
        <ApiUnavailable onRetry={reload} />
      </div>
    );
  return (
    <AppShell breadcrumb={["HR", "Phân tích AI"]}>
      {userRole(state.user) !== "HR" ? <Forbidden /> : <Workspace />}
    </AppShell>
  );
}

function Workspace() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/ai-analysis" });
  const [employees, setEmployees] = useState<AiEmployee[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [model, setModel] = useState<AiModelInfo | null>(null);
  const [modelError, setModelError] = useState("");

  const load = useCallback(() => {
    setLoadError(null);
    setEmployees(null);
    listAiEmployees()
      .then((r) => setEmployees(r.data))
      .catch(setLoadError);
    setModelError("");
    getAiModel()
      .then((r) => setModel(r.data))
      .catch((e) => setModelError(getApiErrorMessage(e, "Không kết nối được dịch vụ AI.")));
  }, []);
  useEffect(load, [load]);

  const tab = search.tab === "batch" ? "batch" : "individual";
  const setTab = (t: "individual" | "batch") =>
    void navigate({ search: t === "batch" ? { tab: "batch" } : {}, replace: true });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Phân tích AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kết quả AI chỉ để tham khảo. HR cần xem xét trước khi đưa ra quyết định.
        </p>
      </div>
      {modelError ? (
        <Notice
          tone="error"
          title="Dịch vụ AI chưa sẵn sàng"
          action={
            <button type="button" className="btn btn-secondary h-9" onClick={load}>
              Thử lại
            </button>
          }
        >
          {modelError}
        </Notice>
      ) : model ? (
        <p className="text-xs text-muted-foreground">
          Mô hình: <span className="tabular">{model.model_id}</span>
          {model.demo_mode ? " · chế độ thử nghiệm" : ""}
        </p>
      ) : null}

      <div role="tablist" aria-label="Chế độ phân tích" className="flex gap-1 border-b">
        {(["individual", "batch"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-10 border-b-2 px-4 text-sm ${tab === t ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t === "individual" ? "Cá nhân" : "Theo batch"}
          </button>
        ))}
      </div>

      {loadError ? (
        isApiUnavailable(loadError) ? (
          <ApiUnavailable onRetry={load} />
        ) : loadError instanceof ApiError && loadError.status === 403 ? (
          <Forbidden />
        ) : (
          <Notice
            tone="error"
            action={
              <button type="button" className="btn btn-secondary h-9" onClick={load}>
                Thử lại
              </button>
            }
          >
            {getApiErrorMessage(loadError, "Không tải được danh sách nhân viên.")}
          </Notice>
        )
      ) : !employees ? (
        <Loading label="Đang tải danh sách nhân viên…" />
      ) : tab === "individual" ? (
        <IndividualAnalysis
          employees={employees}
          initial={{
            employeeId: search.employeeId,
            snapshotId: search.snapshotId,
            resultId: search.resultId,
          }}
          onSelectionChange={(s) => void navigate({ search: s, replace: true })}
        />
      ) : (
        <BatchAnalysis employees={employees} />
      )}
    </div>
  );
}
