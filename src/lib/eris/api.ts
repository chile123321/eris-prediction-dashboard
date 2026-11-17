/**
 * ERIS API client — ported from ERIS-FE src/services/api.ts (request, session, auth and AI sections).
 * Token lifecycle, headers, credentials and payload shapes are unchanged. All AI calls go to the
 * ERIS backend; the backend alone holds AI_SERVICE_KEY and talks to the Mexwell model service.
 * Browser-only: call from event handlers/effects, never during SSR.
 */
const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] || "/api").replace(/\/$/, "");
export const SESSION_EXPIRED_EVENT = "eris:session-expired";
let lastExpiredAccessToken: string | null = null;

export function getApiBaseUrl() {
  return API_BASE_URL;
}

function notifySessionExpired(accessToken: string) {
  if (lastExpiredAccessToken === accessToken) return;
  lastExpiredAccessToken = accessToken;
  try {
    sessionStorage.removeItem("eris-user");
    sessionStorage.removeItem("eris-access-token");
  } catch {
    // Session cleanup must never replace the original API error.
  }
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export interface ApiUser {
  id?: number;
  email?: string;
  fullName?: string | null;
  status?: string;
  role?: string | { id?: number; name: string };
  roleName?: string;
  roleId?: number;
}

interface LoginResponse {
  accessToken?: string;
  user?: ApiUser;
  message?: string;
  kind?: string;
  passwordChangeToken?: string;
}

export class ApiError extends Error {
  code?: string | undefined;
  status: number;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** True when the ERIS backend itself could not be reached (network failure or no API at this base URL). */
export function isApiUnavailable(error: unknown) {
  return error instanceof ApiError && (error.code === "NETWORK_ERROR" || error.code === "API_UNAVAILABLE");
}

const AI_DIAGNOSTICS = [
  "Chưa cấu hình AI_SERVICE_KEY (ít nhất 24 ký tự).",
  "AI service chưa nạp model hoặc chưa sẵn sàng.",
  "Model đang chạy không khớp phiên bản được tích hợp.",
  "AI service từ chối yêu cầu; kiểm tra key và hợp đồng dữ liệu.",
  "Không kết nối được AI service hoặc đã quá thời gian chờ.",
  "Kết quả AI không khớp nhân viên, model hoặc kiểm tra tổng SHAP.",
  "AI service trả JSON không hợp lệ.",
];

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  const messages = {
    LOGIN_FAILED: "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.",
    INACTIVE_USER: "Tài khoản đang bị khóa hoặc chưa sẵn sàng sử dụng. Vui lòng liên hệ quản trị viên.",
    INVALID_SESSION: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    INVALID_OTP: "Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra email và nhập mã mới.",
    RATE_LIMITED: "Bạn thao tác quá nhiều lần. Vui lòng chờ một lát rồi thử lại.",
    NETWORK_ERROR: "Không thể kết nối đến máy chủ ERIS. Vui lòng kiểm tra kết nối và thử lại.",
    API_UNAVAILABLE: "Không kết nối được API ERIS tại địa chỉ đã cấu hình.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  } as const;
  const known = (messages as Record<string, string>)[error.code || ""];
  if (known) return known;
  if (AI_DIAGNOSTICS.includes(error.message)) return error.message;
  // Keep the error screen usable even when an upstream/non-ERIS response supplied
  // a malformed message. The HTTP status remains available for the fallback below.
  const technical = typeof error.message === "string" ? error.message.toLowerCase() : "";
  if (error.status === 401 && /invalid email or password/.test(technical)) return messages.LOGIN_FAILED;
  if ((error.status === 400 || error.status === 409 || error.status === 422) && /[\u00c0-\u1ef9]/.test(error.message)) return error.message;
  const byStatus: Record<number, string> = {
    400: "Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.",
    401: messages.INVALID_SESSION,
    403: messages.FORBIDDEN,
    404: "Không tìm thấy dữ liệu yêu cầu hoặc bạn không có quyền xem.",
    422: "Dữ liệu chưa hợp lệ để xử lý.",
    429: messages.RATE_LIMITED,
    500: "Hệ thống đang gặp sự cố khi xử lý yêu cầu. Vui lòng thử lại sau.",
    502: "Máy chủ đang tạm thời không phản hồi. Vui lòng thử lại sau ít phút.",
    503: "Dịch vụ hiện tạm thời không khả dụng. Vui lòng thử lại sau.",
    504: "Yêu cầu mất quá nhiều thời gian để xử lý. Vui lòng thử lại.",
  };
  return byStatus[error.status] ?? fallback;
}

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const token = path === "/auth/login" ? null : sessionStorage.getItem("eris-access-token");
  const headers = new Headers(init?.headers);
  if (!(init?.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: "include" });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new ApiError("Không thể kết nối đến máy chủ.", 0, "NETWORK_ERROR");
  }

  const isJson = (response.headers.get("content-type") || "").includes("application/json");
  const body = (isJson ? await response.json().catch(() => null) : null) as
    | { message?: string; code?: string; details?: unknown; error?: { code?: string; message?: string } }
    | null;
  // A non-JSON reply means no ERIS API answered at this base URL (e.g. the preview host's HTML page).
  if (!isJson || body === null) {
    throw new ApiError("ERIS API không phản hồi tại địa chỉ đã cấu hình.", response.status, "API_UNAVAILABLE");
  }
  if (!response.ok) {
    if (response.status === 401 && token && (!path.startsWith("/auth/") || path === "/auth/me")) {
      if (!retried && !init?.headers) {
        try { await refreshSession(); }
        catch (error) { if (error instanceof ApiError && [401, 403].includes(error.status)) notifySessionExpired(token); throw error; }
        return request<T>(path, init, true);
      }
      notifySessionExpired(token);
    }
    throw new ApiError(
      body.message || body.error?.message || `Request failed with status ${response.status}.`,
      response.status,
      body.code || body.error?.code,
      body.details,
    );
  }
  return body as T;
}

/* ---------- Auth & session (unchanged contract) ---------- */

export async function login(email: string, password: string) {
  sessionStorage.setItem("eris-api-backend", "primary");
  const result = await request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (!result.accessToken && !result.passwordChangeToken) {
    throw new ApiError(result.message || "Tài khoản cần hoàn tất đổi mật khẩu trước khi đăng nhập.", 400);
  }
  if (result.accessToken) {
    lastExpiredAccessToken = null;
    sessionStorage.setItem("eris-access-token", result.accessToken);
  }
  return result;
}

export function changePassword(passwordChangeToken: string, currentPassword: string, otp: string, newPassword: string) {
  return request<{ message: string }>("/auth/change-password", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${passwordChangeToken}` },
    body: JSON.stringify({ currentPassword, otp, newPassword }),
  });
}

export function getCurrentUser(signal?: AbortSignal) {
  return request<ApiUser>("/auth/me", { ...(signal ? { signal } : {}), cache: "no-store" });
}

let refreshPending: Promise<{ accessToken: string }> | null = null;
export function refreshSession() {
  if (!refreshPending) refreshPending = request<{ accessToken: string }>("/auth/refresh", { method: "POST" })
    .then((result) => { sessionStorage.setItem("eris-access-token", result.accessToken); lastExpiredAccessToken = null; return result; })
    .finally(() => { refreshPending = null; });
  return refreshPending;
}

export async function restoreSession() {
  if (!sessionStorage.getItem("eris-access-token")) {
    await refreshSession();
    return getCurrentUser();
  }
  return getCurrentUser();
}

export async function logout() {
  try {
    await request<{ message: string }>("/auth/logout", { method: "POST" });
  } finally {
    sessionStorage.removeItem("eris-access-token");
    sessionStorage.removeItem("eris-user");
    sessionStorage.removeItem("eris-api-backend");
  }
}

export function userRole(user?: ApiUser | null) {
  const role = (typeof user?.role === "string" ? user.role : user?.role?.name) || user?.roleName;
  return role?.trim().toUpperCase() || null;
}

/* ---------- AI (routes from BE src/modules/ai/ai.routes.js) ---------- */

export type AiEmployee = { id: number; employeeCode: string; fullName: string };
export type AiSnapshot = {
  employee: AiEmployee;
  snapshotId: number | null;
  snapshotCreated?: boolean;
  capturedAt: string;
  snapshotDate?: string;
  features: Record<string, string | number>;
  provenance: Record<string, string>;
  missingFeatures: string[];
  invalidFeatures?: string[];
  outOfDomainFeatures?: string[];
  issues: string[];
  ready: boolean;
  conversion?: Record<string, unknown>;
  warning?: string;
  [key: string]: unknown;
};
export type AiModelOutput = {
  model_id: string;
  schema_version?: string;
  validation_status?: string;
  demo_mode?: boolean;
  score: number;
  base_value?: number;
  contributions: Record<string, number>;
  additivity_error?: number;
  shap_units?: string;
  explainer?: string;
  riskLevel?: string | null;
  /** The local API may return the same field in snake_case. */
  risk_level?: string | null;
  predictionLabel?: string | null;
  forecastHorizon?: string | null;
};
export type AiPrediction = {
  saved: boolean;
  predictionId?: number;
  runId?: number;
  snapshotId?: number;
  createdAt?: string;
  preview: AiSnapshot;
  model: AiModelOutput;
  warning: string;
};
export type AiModelInfo = { model_id: string; schema_version?: string; validation_status?: string; demo_mode?: boolean; warning: string };
export type AiBatchRow = { employeeId: number; success: boolean; data?: AiPrediction; status?: number; message?: string; details?: unknown };
export type AiBatchResult = { total: number; succeeded: number; failed: number; warning: string; results: AiBatchRow[] };
export type AiBatchItem = { employeeId: number; snapshotId: number; save: boolean };

export interface AiPolicyRecommendations {
  predictionId: number;
  warning: string;
  saved: boolean;
  omittedCount: number;
  recommendations: Array<{
    rank: number;
    status: string;
    reason: string;
    priority?: string;
    policy: { id: number; name: string; description: string | null } | null;
    policyDraft: { name: string; description: string } | null;
    signals: Array<{ feature: string; value: number; impactPercentagePoints: number; source: string }>;
  }>;
  savedRecommendations?: Array<{ id: number; policyId: number; status: string; created: boolean }>;
  requiresPolicyApproval?: boolean;
}

export const getAiModel = () => request<{ data: AiModelInfo }>("/ai/model");
export const listAiEmployees = () => request<{ data: AiEmployee[] }>("/ai/employees");
export const listAiSnapshots = (employeeId: number) => request<{ data: AiSnapshot[] }>(`/ai/employees/${employeeId}/snapshots`);
export const getAiSnapshot = (employeeId: number, snapshotId: number) =>
  request<{ data: AiSnapshot }>(`/ai/employees/${employeeId}/snapshots/${snapshotId}`);
export const previewAiEmployee = (employeeId: number, body: { supplementalFeatures?: Record<string, string | number> }) =>
  request<{ data: AiSnapshot }>(`/ai/employees/${employeeId}/preview`, { method: "POST", body: JSON.stringify(body) });
/** Body is exactly { snapshotId, save } — the backend rejects any other key. */
export const predictAiEmployee = (employeeId: number, snapshotId: number, save: boolean) =>
  request<{ data: AiPrediction }>(`/ai/employees/${employeeId}/predict`, { method: "POST", body: JSON.stringify({ snapshotId, save }) });
/** Body is exactly { employees: [{ employeeId, snapshotId, save }] }, 1–25 unique employees. */
export const predictAiBatch = (employees: AiBatchItem[]) =>
  request<{ data: AiBatchResult }>("/ai/predict-batch", { method: "POST", body: JSON.stringify({ employees }) });
export const getAiResult = (resultId: number) => request<{ data: AiPrediction }>(`/ai/results/${resultId}`);
export const generateAiPolicyRecommendations = (resultId: number, save: boolean, limit = 3) =>
  request<{ data: AiPolicyRecommendations }>(`/ai/results/${resultId}/policy-recommendations`, {
    method: "POST",
    body: JSON.stringify({ save, limit }),
  });

/* ---------- Verified auth, directory, audit and survey contracts ---------- */
export function requestPasswordReset(email: string) {
  return request<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
}
export function resetPassword(email: string, otp: string, newPassword: string) {
  return request<{ message: string }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ email, otp, newPassword }) });
}
export function createHrAccount(input: { email: string; fullName: string; hireDate: string }) {
  return request<{ data?: ApiUser & { emailDelivery?: string; warning?: string }; emailDelivery?: string; warning?: string } & ApiUser>("/auth/user_register", {
    method: "POST", body: JSON.stringify({ email: input.email, full_name: input.fullName.trim(), hireDate: input.hireDate }),
  });
}
export function listUsers(params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const query = new URLSearchParams({ page: String(params.page ?? 1), limit: String(params.limit ?? 100) });
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  return request<{ data: ApiUser[]; pagination?: { page: number; limit: number; total: number; hasMore: boolean } }>(`/users?${query}`, { cache: "no-store" });
}
export async function getUserById(id: number) {
  const result = await request<ApiUser | { data: ApiUser }>(`/users/${id}`, { cache: "no-store" });
  return "data" in result ? result.data : result;
}
export async function updateUserStatus(id: number, status: "ACTIVE" | "INACTIVE") {
  const result = await request<ApiUser | { data: ApiUser }>(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  return "data" in result ? result.data : result;
}
export type AuditLogEntry = { id: number; userId: number | null; entityType: string | null; entityId: number | string | null; action: string | null; createdAt: string; actor: { id: number; email: string; fullName: string | null } | null };
export type AuditLogDetail = AuditLogEntry & { oldValue: unknown; newValue: unknown };
export const listAuditLogs = () => request<{ data: AuditLogEntry[] }>("/audit-logs", { cache: "no-store" });
export const getAuditLog = (id: number) => request<{ data: AuditLogDetail }>(`/audit-logs/${id}`, { cache: "no-store" });

export type EmployeeEducation = { id: number; employeeId?: number; educationLevel: string | null; fieldOfStudy: string | null; institution: string | null; graduationYear: number | null; status?: string; createdAt?: string; updatedAt?: string };
export type EducationInstitution = { id: string; institution: string; country?: string | null; display?: string; address?: string | null; website?: string | null; source: "ROR" | "VIETMAP"; levelFit?: string; levelWarning?: string | null };
export type EmployeeEducationInput = { educationLevel: "High School" | "Bachelor" | "Master" | "PhD"; fieldOfStudy: string | null; institution: string; institutionRefId: string; graduationYear: number | null };
export type EmployeeProfile = { id: number; employeeCode: string; fullName: string; email: string; phone: string | null; dateOfBirth: string | null; gender: string | null; departmentId: number; departmentName?: string | null; positionId: number; hireDate: string; employmentType: string | null; employmentStatus: string; currentSalary: string | number | null; educations?: EmployeeEducation[]; account?: { email?: string; status?: string } | null };
export type DepartmentOption = { id: number; name: string; status: string };
export type PositionOption = { id: number; name: string; departmentId: number; status: string };
export const listDepartments = () => request<{ data: DepartmentOption[] }>("/departments", { cache: "no-store" });
export const listPositions = () => request<{ data: PositionOption[] }>("/positions", { cache: "no-store" });
export function listEmployeeProfiles(options: { page?: number; limit?: number; search?: string; departmentId?: number; employmentStatus?: string } = {}) {
  const query = new URLSearchParams();
  if (options.page !== undefined) query.set("page", String(options.page));
  if (options.limit !== undefined) query.set("limit", String(options.limit));
  if (options.search) query.set("q", options.search);
  if (options.departmentId) query.set("departmentId", String(options.departmentId));
  if (options.employmentStatus) query.set("employmentStatus", options.employmentStatus);
  const suffix = query.size ? `?${query}` : "";
  return request<{ data: EmployeeProfile[] }>(`/employees${suffix}`, { cache: "no-store" });
}
export async function getEmployeeProfile(id: number) {
  const profile = await request<EmployeeProfile>(`/employees/${id}`, { cache: "no-store" });
  if (profile.employmentStatus === "ACTIVE") {
    const educations = await listEmployeeEducations(id);
    return { ...profile, educations: educations.data };
  }
  return profile;
}
export const listEmployeeEducations = (id: number) => request<{ data: EmployeeEducation[] }>(`/employees/${id}/educations`, { cache: "no-store" });
export function updateEmployeeProfile(id: number, changes: Record<string, unknown>) { return request<{ data: EmployeeProfile }>(`/employees/${id}`, { method: "PATCH", body: JSON.stringify(changes) }); }
export function searchEducationInstitutions(name: string, educationLevel?: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ name });
  if (educationLevel) query.set("educationLevel", educationLevel);
  return request<{ data: EducationInstitution[]; source: string; manualEntryAllowed: boolean }>(`/employee-educations/institutions?${query}`, { ...(signal ? { signal } : {}), cache: "no-store" });
}
export function createEmployeeEducation(employeeId: number, input: EmployeeEducationInput) {
  return request<{ message: string; data: EmployeeEducation; warning?: string | null }>(`/employees/${employeeId}/educations`, { method: "POST", body: JSON.stringify(input) });
}
export function updateEmployeeEducation(employeeId: number, educationId: number, input: Partial<EmployeeEducationInput>) {
  return request<{ message: string; data: EmployeeEducation; warning?: string | null }>(`/employees/${employeeId}/educations/${educationId}`, { method: "PATCH", body: JSON.stringify(input) });
}
export type EmployeeImportResult = { row: number; status: "CREATED" | "FAILED"; statusCode?: number; message?: string; data?: EmployeeProfile };
export type EmployeeImportResponse = { total: number; created: number; failed: number; results: EmployeeImportResult[] };
export function importEmployees(file: File) { const body = new FormData(); body.append("file", file); return request<EmployeeImportResponse>("/employees/import", { method: "POST", body }); }

export type SurveySummary = { id: number; title: string; description: string | null; startDate: string | null; endDate: string | null; status: "DRAFT" | "ACTIVE" | "CLOSED"; questionCount?: number; responseCount?: number; createdByName?: string | null };
export type SurveyQuestion = { id: number; questionText: string; dimensionCode: string; required: boolean; displayOrder: number };
export type SurveyAnswer = { questionId: number; score: number; comment?: string | null };
export const listSurveys = () => request<{ data: SurveySummary[] }>("/surveys", { cache: "no-store" });
export const listAvailableSurveys = () => request<{ data: Array<SurveySummary & { responseStatus: string }> }>("/surveys/available", { cache: "no-store" });
export const getSurveyForEmployee = (id: number) => request<{ data: SurveySummary & { questions: SurveyQuestion[] } }>(`/surveys/${id}`, { cache: "no-store" });
export const getSurveyResponse = (id: number, responseId: number) => request<{ data: { response: { responseId: number; submittedAt: string; employee: AiEmployee; answers: Array<{ questionId: number; score: number | null; comment: string | null }> } } }>(`/surveys/${id}/responses/${responseId}`, { cache: "no-store" });
export const createSurvey = (input: { title: string; description?: string | null; startDate: string; endDate: string }) => request<{ data: SurveySummary }>("/surveys", { method: "POST", body: JSON.stringify(input) });
export const updateSurvey = (id: number, input: Partial<{ title: string; description: string | null; startDate: string; endDate: string }>) => request<{ data: SurveySummary }>(`/surveys/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const publishSurvey = (id: number) => request<{ data: SurveySummary }>(`/surveys/${id}/publish`, { method: "POST" });
export const closeSurvey = (id: number) => request<{ data: SurveySummary }>(`/surveys/${id}/close`, { method: "POST" });
export const getSurveyResults = (id: number) => request<{ data: { id: number; title: string; status: string; responseCount: number; questions: Array<SurveyQuestion & { answerCount: number; averageScore: number | null; scoreDistribution: Record<number, number> }> } }>(`/surveys/${id}/results`, { cache: "no-store" });
export const getSurveyParticipants = (id: number) => request<{ data: { responseCount: number; participants: Array<{ responseId: number; submittedAt: string; satisfactionScore: number | null; employee: AiEmployee; answers: Array<{ questionId: number; questionText: string; score: number | null; comment: string | null }> }> } }>(`/surveys/${id}/responses`, { cache: "no-store" });
export const submitSurveyResponse = (id: number, answers: SurveyAnswer[]) => request<{ data: { responseId: number; surveyId: number; submittedAt: string; satisfactionScore: number } }>(`/surveys/${id}/responses`, { method: "POST", body: JSON.stringify({ answers }) });
export const getMySurveyResponse = (id: number) => request<{ data: { survey: { id: number; title: string }; response: { id: number; status: string; submittedAt: string | null; satisfactionScore: number | null }; answers: Array<{ questionId: number; questionText: string; dimensionCode: string; score: number | null; comment: string | null }> } }>(`/surveys/${id}/my-response`, { cache: "no-store" });
