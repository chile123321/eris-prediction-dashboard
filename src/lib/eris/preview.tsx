import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { createInitialFixtures, type Account, type AuditEntry, type Employee, type PreviewViewState, type Survey, type SurveyResponse } from "./fixtures";

type Fixtures = ReturnType<typeof createInitialFixtures>;
type PreviewContextValue = Fixtures & {
  viewState: PreviewViewState;
  setViewState: (state: PreviewViewState) => void;
  reset: () => void;
  createAccount: (input: Pick<Account, "fullName" | "email" | "hireDate">) => void;
  setAccountStatus: (id: number, status: Account["status"]) => void;
  invite: (id: number) => void;
  saveEmployee: (employee: Employee, editing: boolean) => void;
  saveSurvey: (survey: Survey) => void;
  setSurveyStatus: (id: number, status: Survey["status"]) => void;
  submitSurvey: (surveyId: number, response: SurveyResponse) => void;
  addAudit: (action: string, entityType: string, entityId: string, value: unknown) => void;
};
const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [fixtures, setFixtures] = useState(createInitialFixtures);
  const [viewState, setViewState] = useState<PreviewViewState>("populated");
  const simulated = (message = "Đã mô phỏng thao tác") => toast.success(message, { description: "Chỉ thay đổi dữ liệu trong bản xem trước." });
  const addAudit = (action: string, entityType: string, entityId: string, value: unknown) => setFixtures((current) => {
    const id = Math.max(600, ...current.audit.map((entry) => entry.id + 1));
    const entry: AuditEntry = { id, createdAt: "2026-11-15T10:00:00Z", actor: "Người xem bản xem trước", action, entityType, entityId, oldValue: null, newValue: value };
    return { ...current, audit: [entry, ...current.audit] };
  });
  const value = useMemo<PreviewContextValue>(() => ({
    ...fixtures, viewState, setViewState,
    reset: () => { setFixtures(createInitialFixtures()); setViewState("populated"); toast.success("Đã khôi phục dữ liệu minh họa ban đầu"); },
    createAccount: (input) => { setFixtures((current) => { const id = Math.max(...current.accounts.map((a) => a.id)) + 1; return { ...current, accounts: [{ ...input, id, role: "HR", status: "IN_PROCESS", invitation: "SENT" }, ...current.accounts] }; }); addAudit("CREATE_HR_ACCOUNT", "user", "new", input); toast.success("Mô phỏng gửi lời mời", { description: "Tài khoản HR minh họa ở trạng thái chờ kích hoạt." }); },
    setAccountStatus: (id, status) => { setFixtures((current) => ({ ...current, accounts: current.accounts.map((a) => a.id === id ? { ...a, status } : a) })); simulated(); },
    invite: (id) => { setFixtures((current) => ({ ...current, accounts: current.accounts.map((a) => a.id === id ? { ...a, invitation: "SENT" } : a) })); toast.success("Mô phỏng gửi lời mời", { description: "Không có email thật nào được gửi." }); },
    saveEmployee: (employee, editing) => { setFixtures((current) => ({ ...current, employees: editing ? current.employees.map((e) => e.id === employee.id ? employee : e) : [employee, ...current.employees] })); addAudit(editing ? "UPDATE_EMPLOYEE" : "CREATE_EMPLOYEE", "employee", String(employee.id), employee); simulated(); },
    saveSurvey: (survey) => { setFixtures((current) => { const saved = survey.id > 0 ? survey : { ...survey, id: Math.max(...current.surveys.map((item) => item.id)) + 1 }; return { ...current, surveys: current.surveys.some((s) => s.id === saved.id) ? current.surveys.map((s) => s.id === saved.id ? saved : s) : [saved, ...current.surveys] }; }); simulated(); },
    setSurveyStatus: (id, status) => { setFixtures((current) => ({ ...current, surveys: current.surveys.map((s) => s.id === id ? { ...s, status } : s) })); simulated(); },
    submitSurvey: (surveyId, response) => { setFixtures((current) => ({ ...current, surveys: current.surveys.map((s) => s.id === surveyId ? { ...s, responses: [...s.responses.filter((r) => r.employeeId !== 1), response] } : s) })); simulated("Đã mô phỏng thao tác gửi khảo sát"); },
    addAudit,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [fixtures, viewState]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("usePreview must be used inside PreviewProvider");
  return context;
}
