# ERIS frontend handoff

## Run and configure

- Frontend: Vite + TanStack Start/React. Install with `bun install`, run with `bun run dev`.
- API setting: `VITE_API_BASE_URL` (build-time browser variable). Default: `/api` on the same origin. Local example: `VITE_API_BASE_URL=http://localhost:3000/api`.
- All live calls go through `src/lib/eris/api.ts`. Requests use `credentials: "include"` and the bearer token from `sessionStorage["eris-access-token"]`.
- The browser never contacts Mexwell directly. `AI_SERVICE_URL`, `AI_SERVICE_KEY`, and `AI_SERVICE_TIMEOUT_MS` remain server-side in the ERIS backend.
- Network failures and non-JSON API replies become `NETWORK_ERROR`/`API_UNAVAILABLE`; live pages show the unavailable state and never substitute preview fixtures.
- `VITE_ADMIN_API_BASE_URL` is not used. Admin, HR, Employee, auth, and AI share the one configured ERIS API base URL.

## Preview mode

Open `/preview`, choose Admin, HR, or Employee, and use the role navigation. Preview uses only deterministic in-memory fixtures from `src/lib/eris/fixtures.ts`; it does not restore a live session or call the API.

- The banner's **Trạng thái** selector reviews populated, loading, empty, and error states.
- **Đặt lại** restores all fixture accounts, employees, surveys, audit events, and AI results.
- Creates, edits, status changes, invitations, imports, survey submissions, predictions, and retries are explicitly simulated and only last for the current page session.
- Preview emails use `example.test`. AI scores, SHAP contributions, and policies are labelled illustrative and are not Mexwell output.

### Preview URL map

| Area | URLs |
|---|---|
| Public | `/`, `/login`, `/preview`, `/preview/recovery`, `/preview/activation` |
| Admin | `/preview/admin/users`, `/preview/admin/users/:id`, `/preview/admin/activity` |
| HR employees | `/preview/hr/employees`, `/preview/hr/employees/new`, `/preview/hr/employees/import`, `/preview/hr/employees/:id`, `/preview/hr/employees/:id/edit` |
| HR AI | `/preview/hr/ai-analysis` (`tab`, `employeeId`, `snapshotId`, `resultId` search parameters) |
| HR surveys | `/preview/hr/engagement`, `/preview/hr/engagement/:id` |
| Employee | `/preview/employee/my-surveys`, `/preview/employee/my-surveys/:id` |

## Live route and API mapping

All paths below are appended to `VITE_API_BASE_URL`. Shared views receive live data or adapters; preview adapters never appear in live routes.

| Live frontend route | API functions in `src/lib/eris/api.ts` | Backend methods and paths |
|---|---|---|
| `/login` | `login`, `changePassword` | POST `/auth/login`; PATCH `/auth/change-password` |
| `/forgot-password` | `forgotPassword`, `resetPassword` | POST `/auth/forgot-password`; POST `/auth/reset-password` |
| Session/header | `restoreSession`, `refreshSession`, `getCurrentUser`, `logout` | POST `/auth/refresh`; GET `/auth/me`; POST `/auth/logout` |
| `/users` | `listUsers`, `createHrAccount` | GET `/users`; POST `/auth/user_register` |
| `/users/:id` | `getUserById`, `updateUserStatus` | GET `/users/:id`; PATCH `/users/:id/status` |
| `/activity` | `listAuditLogs`, `getAuditLog` | GET `/audit-logs`; GET `/audit-logs/:id` |
| `/employees` | `listEmployees`, `deleteEmployee` | GET `/employees`; DELETE `/employees/:id` |
| `/employees/new` | `createEmployee` | POST `/employees` (currently blocked in UI; see contract gaps) |
| `/employees/import` | `importEmployees` | POST `/employees/import` multipart `.xlsx` |
| `/employees/:id` | `getEmployeeProfile` | GET `/employees/:id` |
| `/employees/:id/edit` | `getEmployeeProfile`, `updateEmployeeProfile` | GET `/employees/:id`; PATCH `/employees/:id` |
| `/ai-analysis` | AI functions below | HR-only live AI workspace |
| `/engagement` | `listSurveys`, `createSurvey`, `updateSurvey`, `publishSurvey`, `closeSurvey` | GET/POST `/surveys`; PATCH `/surveys/:id`; POST `/surveys/:id/publish`; POST `/surveys/:id/close` |
| `/engagement/:id` | `getSurveyForEmployee`, `getSurveyParticipants`, `getSurveyResults` | GET `/surveys/:id`; GET `/surveys/:id/participants`; GET `/surveys/:id/results` |
| `/my-surveys` | `listAvailableSurveys`, `listSurveys` | GET `/surveys/available`; GET `/surveys` |
| `/my-surveys/:id` | `getSurveyForEmployee`, `getMySurveyResponse`, `submitSurveyResponse` | GET `/surveys/:id`; GET `/surveys/:id/my-response`; POST `/surveys/:id/responses` |

### AI analysis contract

| Function | Method and verified request shape | UI use |
|---|---|---|
| `getAiModel` | GET `/ai/model` | model status |
| `listAiEmployees` | GET `/ai/employees` | individual and batch employee lists |
| `listAiSnapshots` | GET `/ai/employees/:employeeId/snapshots` | saved snapshot selectors |
| `getAiSnapshot` | GET `/ai/employees/:employeeId/snapshots/:snapshotId` | individual snapshot |
| `previewAiEmployee` | POST `/ai/employees/:employeeId/preview` `{vndPerUsd?, supplementalFeatures?}` | validate/create snapshot |
| `predictAiEmployee` | POST `/ai/employees/:employeeId/predict` with exactly `{snapshotId, save}` | individual prediction |
| `predictAiBatch` | POST `/ai/predict-batch` with exactly `{employees:[{employeeId,snapshotId,save}]}`; 1–25 unique employees | batch run and failed-row retry |
| `getAiResult` | GET `/ai/results/:resultId` | open saved result |
| `generateAiPolicyRecommendations` | POST `/ai/results/:resultId/policy-recommendations` `{save, limit}` | policy cards for saved predictions |

The dashboard binds `model.score`, `model.base_value`, signed SHAP `model.contributions`, model metadata, `preview.features/provenance`, data issues, saved identifiers, and warnings. Display math multiplies score and SHAP units by 100; additivity is checked with tolerance `1e-8`. URL search parameters preselect data or open a saved result but never trigger prediction automatically.

## Backend contract gaps and local verification

1. **Employee create/import:** the requested UI excludes address, position, and education references, but the current backend requires address, position, salary, and at least one education item with `institutionRefId`. Live create is therefore disabled with an explanatory notice rather than sending an invalid payload. Align the backend or brief before enabling it. Import is wired, but the same missing-column mismatch must be resolved.
2. **Employee edit:** the UI sends only mutable fields (`fullName`, `phone`, `gender`, `departmentId`, `employmentType`, `currentSalary`). Verify department/position validation and whether education editing is required; immutable code, email, birth date, and hire date are not sent.
3. **Accounts:** verify POST `/auth/user_register` accepts `{email, full_name, hireDate}` plus optional `roleId`, returns the expected account shape, and handles invitation-email failure after account creation. There is no invitation-resend endpoint; resend is preview-only. Live status changes send only `ACTIVE` or `INACTIVE`.
4. **Auth:** confirm CORS allows credentialed cookies from the frontend origin. Verify IN_PROCESS login returns `passwordChangeToken`, activation uses the temporary password as `currentPassword`, and OTP is six digits. Recovery sends `{email}` then `{email, otp, newPassword}`; new passwords require at least eight characters.
5. **AI snapshots/results:** confirm snapshot list items include `snapshotId`, `ready`, and `snapshotDate`/`capturedAt`. Confirm saved-result `metadata` reconstructs both `preview` and `model`, including `base_value`, exactly like a fresh prediction.
6. **AI policies:** verify `priority`, `savedRecommendations`, and `policyId` matching. Confirm prediction 422 responses expose `{message, details}` for the snapshot issue state.
7. **Surveys:** verify list/available DTOs, participant response details, own-response 404 behavior, and results authorization. Submission sends `{answers:[{questionId,score,comment}]}`, score 1–5, comment up to 1000 characters. Create/update sends `{title,description,startDate,endDate}`.
8. **Roles:** live guards accept normalized `role`, `role.name`, or `roleName` values `ADMIN`, `HR`, and `EMPLOYEE`. Verify each protected endpoint's server-side role rules; frontend guards are not a security boundary.
9. **Not established:** recurring/scheduled surveys, editable question banks, and invitation resend are simulated only or omitted. Do not infer those backend capabilities from preview mode.

## Checks performed

- `oj typecheck -b --noEmit` passed on the final route tree.
- `bunx vitest run` passed: 2 files, 11 tests, including independent detail-route regression cases.
- Playwright exercised landing/login rendering, Admin HR-account creation, audit details, individual prediction and policies, batch partial failure/retry, Employee survey submission, and 1440/1024/390-pixel layouts.
- Browser review observed no horizontal page overflow and zero `/api/` requests from preview flows.
- `/users`, `/ai-analysis`, and `/my-surveys` were checked without a backend: each showed the API-unavailable state with no preview-data fallback.
- Successful live backend requests, real authentication, and real Mexwell predictions were not exercised in this environment. Verify them locally with the backend running; preview success is not evidence of live API success.
