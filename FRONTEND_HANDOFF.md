# ERIS frontend handoff — AI analysis

## API base URL
- Setting: `VITE_API_BASE_URL` (build-time, browser). Default `/api` (same origin). Example: `VITE_API_BASE_URL=http://localhost:3000/api`.
- Read in `src/lib/eris/api.ts` (`getApiBaseUrl()`); every request goes `${VITE_API_BASE_URL}${path}` with `credentials: "include"` and `Authorization: Bearer <sessionStorage eris-access-token>`.
- The browser never contacts the Python/Mexwell service. `AI_SERVICE_URL`, `AI_SERVICE_KEY`, `AI_SERVICE_TIMEOUT_MS` stay in the ERIS backend `.env`.
- Unreachable API: network failure or any non-JSON reply (e.g. the preview host returning HTML for `/api/*`) raises `ApiError` code `API_UNAVAILABLE`/`NETWORK_ERROR`; pages render "Không kết nối được ERIS API".
- `VITE_ADMIN_API_BASE_URL` (dual-backend admin routing in the original client) is NOT ported — only HR/AI screens exist here.

## Source reuse
Ported from `ERIS-FE/src/services/api.ts`: `request`, `ApiError`, `getApiErrorMessage` (AI diagnostics whitelist kept), `login`, `changePassword`, `getCurrentUser`, `refreshSession`, `restoreSession`, `logout`, and all AI calls. Session keys (`eris-access-token`, `eris-api-backend`) and `eris:session-expired` event are unchanged. The original app used react-router-dom; this project uses TanStack Router, so screens were rebuilt.

## Functions → routes (`src/lib/eris/api.ts`)
| Function | Method & path | Used in |
|---|---|---|
| `login` | POST `/auth/login` `{email,password}` | `/login` |
| `changePassword` | PATCH `/auth/change-password` (Bearer passwordChangeToken) `{currentPassword,otp,newPassword}` | `/login` activation |
| `getCurrentUser` | GET `/auth/me` | session |
| `refreshSession` | POST `/auth/refresh` | session restore |
| `logout` | POST `/auth/logout` | header |
| `getAiModel` | GET `/ai/model` | `/ai-analysis` status line |
| `listAiEmployees` | GET `/ai/employees` | both tabs |
| `listAiSnapshots` | GET `/ai/employees/:employeeId/snapshots` | individual + batch review |
| `getAiSnapshot` | GET `/ai/employees/:employeeId/snapshots/:snapshotId` | individual |
| `previewAiEmployee` | POST `/ai/employees/:employeeId/preview` `{vndPerUsd?, supplementalFeatures?}` (may create a snapshot) | "Kiểm tra và tạo bản dữ liệu" |
| `predictAiEmployee` | POST `/ai/employees/:employeeId/predict` `{snapshotId, save}` | "Dự đoán" (save checkbox, default on as in original FE) |
| `predictAiBatch` | POST `/ai/predict-batch` `{employees:[{employeeId,snapshotId,save}]}` (1–25 unique) | "Theo batch" run + retry failed rows |
| `getAiResult` | GET `/ai/results/:id` | "Mở kết quả đã lưu", `?resultId=` |
| `generateAiPolicyRecommendations` | POST `/ai/results/:id/policy-recommendations` `{save, limit:3}` | dashboard policy section (saved results only) |

Dashboard binds: `model.score`, `model.base_value`, `model.contributions` (SHAP, ×100 = điểm %), `model.model_id/schema_version/validation_status/demo_mode/additivity_error`, `preview.features/provenance/missingFeatures/invalidFeatures/outOfDomainFeatures/issues`, `saved/predictionId/runId/snapshotId/createdAt`, `warning`. Additivity is re-checked with the backend tolerance 1e-8.

URL params on `/ai-analysis`: `tab=batch`, `employeeId`, `snapshotId`, `resultId` — preselect/GET only; never trigger a prediction.

## Verify locally (Codex)
1. CORS + cookies: backend must allow the FE origin with credentials for `/auth/refresh` cookie flow.
2. `/auth/login` response for IN_PROCESS accounts: confirm `passwordChangeToken` field name and that `currentPassword` = temporary password in `/auth/change-password`.
3. `GET /ai/employees/:id/snapshots` list items: confirm they include `snapshotId`, `ready`, `snapshotDate`/`capturedAt` (used for selectors and batch readiness filter).
4. `GET /ai/results/:id` payload: confirm stored `metadata` contains `preview` and `model` (with `base_value`) so saved results render identically to fresh ones.
5. Policy response: confirm `priority` per recommendation and `savedRecommendations` matching by `policyId`.
6. `preview.conversion` field name for VND→USD metadata (rendered only if present).
7. 422 from `/predict` returns `{message, details}`; details are shown as the snapshot state.
8. Role value from `/auth/me`: page requires `role`/`role.name`/`roleName` = `HR`.

## Not in this delivery
Admin `/users`, `/activity`, HR `/employees*`, `/engagement`, Employee `/my-surveys`, `/forgot-password` from the MVP spec are not built yet.
