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
  const technical = error.message.toLowerCase();
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
    if (response.status === 401 && token && path !== "/auth/logout") notifySessionExpired(token);
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

export async function refreshSession() {
  const result = await request<{ accessToken: string }>("/auth/refresh", { method: "POST" });
  sessionStorage.setItem("eris-access-token", result.accessToken);
  return result;
}

export async function restoreSession() {
  if (!sessionStorage.getItem("eris-access-token")) {
    await refreshSession();
    return getCurrentUser();
  }
  try {
    return await getCurrentUser();
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    await refreshSession();
    return getCurrentUser();
  }
}

export async function logout() {
  try {
    await request<{ message: string }>("/auth/logout", { method: "POST" });
  } finally {
    sessionStorage.removeItem("eris-access-token");
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
export const previewAiEmployee = (employeeId: number, body: { vndPerUsd?: number; supplementalFeatures?: Record<string, string | number> }) =>
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
