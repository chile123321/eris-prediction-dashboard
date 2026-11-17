# Báo cáo tích hợp local ERIS

## Rà soát tiếp nối — 17/11/2026

Phần này là trạng thái mới nhất; các phần bên dưới ghi lịch sử kiểm chứng ngày 16/11, không phải kết quả chạy lại hôm nay. Phạm vi lượt này chỉ frontend mới. Git status backend trước/sau giống nhau; những thay đổi BE được ghi ở phần lịch sử đã tồn tại trước lượt này. Không sửa BE/AI/FE cũ, không ghi DB, gửi OTP/email hoặc import thật.

### Kết quả và giới hạn

- API client tự refresh cookie khi request bảo vệ nhận 401 rồi thử lại tối đa một lần, gộp refresh đồng thời. Login/OTP/reset và token kích hoạt riêng không tự retry. Refresh 401/403 xóa phiên; lỗi mạng không giả lập dữ liệu.
- Employee xem phản hồi đã nộp bằng `my-response` trước; chỉ 404 mới tải form trả lời. Không còn mắc ở 409 của API chi tiết khảo sát sau khi nộp. HR dùng `/results` cho thống kê; nút Xem lấy `/responses/:responseId` mới nhất.
- Admin tạo HR hiển thị riêng trường hợp tài khoản đã lưu nhưng `emailDelivery=FAILED`; nút khóa/mở khóa chỉ cho HR ACTIVE/INACTIVE và chờ request hoàn tất, hiện lỗi trong dialog. Chi tiết audit có trạng thái lỗi.
- Hồ sơ ACTIVE lấy học vấn qua endpoint chuyên biệt. Hồ sơ chưa ACTIVE giữ dữ liệu nền do API hồ sơ trả; endpoint học vấn riêng yêu cầu cả hồ sơ và tài khoản ACTIVE. Nếu endpoint từ chối, màn hình báo lỗi API, không giả thành danh sách trống. Gợi ý trường xử lý loading/rỗng/lỗi và bỏ kết quả cũ khi đổi từ khóa.
- Rà `src` không có lời gọi `navigator.geolocation`, get/watchCurrentPosition, `/attendance`, `/distance`, `/work-schedules`, `/company-location`, menu hoặc màn chấm công theo vị trí. Không có phần để gỡ thêm. Các tên nguồn attendance trong fixture/provenance AI chỉ mô tả nguồn feature, không thực hiện định vị/chấm công. Preview tiếp tục dùng adapter local.
- **Blocker tạo/import nhân viên:** `EmployeesService.createEmployee` bắt buộc `resolveEmployeeDistance` trả READY và khoảng cách hợp lệ; nếu không trả 422 trước khi lưu. Validator yêu cầu address nhưng addressRefId là tùy chọn; không thể bỏ điều kiện service bằng thay đổi FE. Form tạo được khóa với lý do cụ thể. Import vẫn nối API có sẵn và chịu cùng điều kiện; không tự thêm chức năng tra khoảng cách.
- **Blocker trạng thái tài khoản hồ sơ:** API hồ sơ không đảm bảo có `account`; trường thiếu hiển thị Chưa xác định, không suy từ employmentStatus. Mapping giữ ACTIVE/IN_PROCESS/INACTIVE/null/unknown riêng.
- **Kiểm chứng live hôm nay bị chặn:** không có listener tại 3000 và 8081; GET `/health` và Swagger không kết nối được. Không coi kết quả live ngày trước là lần chạy mới, không tự tạo token/phiên giả hoặc khởi động/sửa backend trong lượt chỉ-FE này. Cần mở lại service và có phiên Admin/HR/Employee phù hợp để kiểm tra request đọc.

Kiểm chứng cuối sau toàn bộ chỉnh sửa: `npx tsc --noEmit` qua, 5 test files / 24 tests qua, production build client/SSR/Nitro qua, `git diff --check` không lỗi whitespace. Chưa thực hiện kiểm chứng browser end-to-end vì FE/BE không có listener trong lượt này.

### Ma trận endpoint

Tất cả path dưới có prefix `/api`. C = đã đối chiếu source router/service/validator và nối FE; F = có fixture test; L = chưa kiểm chứng live lượt này vì service dừng. Mỗi request đều đi qua `src/lib/eris/api.ts`; live có loading/error/retry, preview không gọi adapter live. Phân trang/lọc users và audit thực hiện trên FE vì controller BE trả toàn bộ, không áp dụng query phân trang.

| Nghiệp vụ / quyền | Route / component FE | Method/path, điều kiện | Request → response; lỗi cần xử lý | Trạng thái |
|---|---|---|---|---|
| Đăng nhập / public | /login | POST /auth/login, bấm đăng nhập | email/password → accessToken,user hoặc passwordChangeToken; 400/401/403/429 | C, L |
| Khôi phục phiên / user | SessionProvider | GET /auth/me, tải live | Bearer → user/role/status; 401 refresh, 403 | C,F,L |
| Refresh / cookie | api.ts | POST /auth/refresh, thiếu/hết token | credentials include → accessToken; cookie rotation; không lặp vô hạn | C,F,L |
| Logout / user | WorkspaceShell/session | POST /auth/logout, bấm đăng xuất | refresh cookie → message; xóa local phiên trong finally | C,L |
| Quên mật khẩu / public | /forgot-password | POST /auth/forgot-password | email → message; lỗi 400/429, không test gửi email thật | C,L |
| Reset / public | /forgot-password | POST /auth/reset-password | email/otp/newPassword → message; OTP sai/hết hạn | C,L |
| Gửi OTP đổi mật khẩu / user | Không có màn đổi mật khẩu sau đăng nhập | POST /auth/change-password/otp | Chỉ cần khi có UI tương ứng; không dựng module mới | Ngoài UI hiện có |
| Kích hoạt / IN_PROCESS | /login | PATCH /auth/change-password | Bearer passwordChangeToken + currentPassword/otp/newPassword; BE xác thực OTP và đổi status ACTIVE, thu hồi phiên | C,L; không dùng reset-password để kích hoạt |
| Tạo HR / Admin | /users, AccountsView | POST /auth/user_register | email/full_name/hireDate → data,emailDelivery,warning; 201 FAILED email vẫn là đã tạo | C,L; đã nối cảnh báo |
| Tài khoản / Admin | /users | GET /users | data[] tất cả vai trò; UI có lọc vai trò/trạng thái; 401/403 | C,L |
| Chi tiết tài khoản / Admin | /users/$id | GET /users/:id | data user; 403/404 | C,L |
| Khóa HR / Admin | AccountDetailView | PATCH /users/:id/status, xác nhận | status ACTIVE/INACTIVE; không mở khóa IN_PROCESS, không sửa role khác; reload sau thành công | C,L; đã sửa dialog await/error |
| Nhật ký / Admin | /activity | GET /audit-logs | data[]; lọc/phân trang FE; 403 | C,L |
| Chi tiết nhật ký / Admin | AuditLogView dialog | GET /audit-logs/:id, bấm Xem | data oldValue/newValue/actor; 403/404 | C,L; đã thêm lỗi |
| Danh sách nhân viên / HR | /employees | GET /employees, tải trang | không page/limit; data[]; giữ workaround lỗi 08P01 trước đây; không xác nhận lỗi còn tồn tại hôm nay | C,L |
| Tạo nhân viên / HR | /employees/new | POST /employees | fullName,email,phone,dateOfBirth,gender,address,departmentId,positionId,hireDate,employmentType,currentSalary,educations 1–20; trường/ref đúng nguồn; distance READY bắt buộc | Bị chặn bởi service distance; không gửi dữ liệu giả |
| Chi tiết nhân viên / HR | /employees/$id | GET /employees/:id | profile + background; account thiếu → Chưa xác định; 403/404 | C,L |
| Sửa nhân viên / HR | /employees/$id/edit | PATCH /employees/:id, bấm Lưu | trường mutable, departmentId+positionId; không email/DOB/hireDate; HR tự sửa chỉ phone/address; 400/403/409 | C,L; học vấn lỗi sau profile được báo riêng |
| Xóa nhân viên / HR | Không có nút xóa hiện hành | DELETE /employees/:id | Không thêm thao tác ngoài UI đã có | Ngoài UI hiện có |
| Hồ sơ cá nhân / Employee | Không có route hồ sơ cá nhân | GET /employees/me | Không dựng module mới | Ngoài UI hiện có |
| Import / HR | /employees/import | POST /employees/import, chủ động gửi | multipart file, .xlsx ≤5MB; headers theo validator, educations JSON hoặc sheets liên quan; results theo dòng CREATED/FAILED | C,L; tạo thật và distance là blocker, không import test |
| Phòng ban / HR | EmployeeFormView/directory | GET /departments | data id/name/status; ID thật và ACTIVE | C,L |
| Chức danh / HR | EmployeeFormView | GET /positions | data id/name/departmentId/status; chỉ chọn chức danh thuộc phòng ban | C,L |
| Quản trị danh mục | Không có màn | POST/PATCH/DELETE departments, POST/GET chi tiết/PATCH/DELETE positions | Không dựng thêm module | Ngoài phạm vi |
| Học vấn / HR | chi tiết/chỉnh sửa | GET /employees/:id/educations, hồ sơ ACTIVE | data[]; yêu cầu linked account ACTIVE; 409 không bị coi là rỗng | C,L; mới nối GET riêng |
| Tìm trường / HR | EmployeeFormView | GET /employee-educations/institutions, từ khóa ≥2 | name,educationLevel chuỗi; data id/institution/source; 400/403/503, loading/rỗng/lỗi | C,F,L; Fp fixture, live đã kiểm tra ngày trước |
| Thêm học vấn / HR | EmployeeFormView chọn mới | POST /employees/:id/educations | educationLevel,institution,institutionRefId,fieldOfStudy/null,graduationYear/null; 201/400/403/409/503 | C,F,L |
| Sửa học vấn / HR | EmployeeFormView chọn ID | PATCH /employees/:id/educations/:educationId | partial; đổi trường gửi cặp tên/ref; năm null giữ trống; HR không tự sửa học vấn | C,F,L |
| Xóa học vấn / HR | Không có nút xóa | DELETE /employees/:id/educations/:educationId | Không dựng thêm thao tác | Ngoài UI hiện có |
| Học vấn bản thân / Employee | Không có hồ sơ cá nhân | GET /employees/me/educations | Không dựng module mới | Ngoài UI hiện có |
| Học vấn tập trung / HR | Không có màn tập trung | GET /employee-educations; GET /employee-educations/employees | Không gọi dư | Ngoài UI hiện có |
| Khảo sát / HR | /engagement | GET /surveys | data metadata/status; 403, rỗng | C,L |
| Tạo khảo sát / HR | SurveysView dialog | POST /surveys | title ≤255, description nullable,startDate/endDate; data DRAFT | C,L; không tạo thật |
| Chi tiết khảo sát / HR, Employee | /engagement/$id; /my-surveys/$id | GET /surveys/:id | data questions; Employee chỉ ACTIVE đúng thời gian, ≥3 tháng, chưa nộp; 403/409 | C,L |
| Sửa khảo sát / HR | SurveysView | PATCH /surveys/:id | metadata partial; DRAFT; 400/409 | C,L |
| Công bố / HR | SurveysView xác nhận | POST /surveys/:id/publish | DRAFT, thời gian hợp lệ, có câu hỏi → ACTIVE; reload | C,L; không công bố thật |
| Đóng / HR | SurveysView xác nhận | POST /surveys/:id/close | ACTIVE → CLOSED; reload; 409 | C,L; không đóng thật |
| Khảo sát có thể trả lời / Employee | /my-surveys | GET /surveys/available | data[], responseStatus; account/profile ACTIVE, ≥3 tháng | C,L |
| Nộp khảo sát / Employee | EmployeeSurveyDetailView | POST /surveys/:id/responses | answers đủ câu hỏi, ID unique, score integer 1–5, comment ≤1000/null; 400/403/409 | C,L; không submit thật |
| Xem phản hồi bản thân / Employee | /my-surveys/$id | GET /surveys/:id/my-response trước detail | data survey/response/answers; 404 mới tải form; 403 phải báo lỗi | C,L; đã sửa thứ tự tải |
| Tổng hợp / HR | SurveyDetailView | GET /surveys/:id/results | responseCount, questions averageScore/answerCount/scoreDistribution → UI | C,L; đã dùng số liệu API |
| Người tham gia / HR | SurveyDetailView | GET /surveys/:id/responses | participants responseId/employee/answers; 403/404 | C,L |
| Chi tiết phản hồi / HR | dialog câu trả lời | GET /surveys/:id/responses/:responseId, bấm Xem | data.response; loading/lỗi/404 | C,L; mới nối |
| Model / HR | /ai-analysis | GET /ai/model khi tải/thử lại | data model/schema/demo/readiness; 503 hiển thị lỗi cấu hình đã nhận diện | C,L |
| Nhân viên AI / HR | /ai-analysis | GET /ai/employees | data người đủ điều kiện; không thay bằng danh sách HR | C,L |
| Snapshot / HR | Individual/BatchAnalysis | GET /ai/employees/:id/snapshots khi chọn | data[]; rỗng/loading/lỗi; URL employee không hợp lệ được bỏ | C,L |
| Chi tiết snapshot / HR | IndividualAnalysis | GET /ai/employees/:id/snapshots/:snapshotId | data features/provenance/ready/issues; ID phải thuộc nhân viên | C,L |
| Tạo snapshot / HR | nút Kiểm tra và tạo bản dữ liệu | POST /ai/employees/:id/preview | supplementalFeatures; data snapshot/missing/invalid; có thể ghi DB | C,L; không gọi tự động/test thật |
| Dự đoán / HR | IndividualAnalysis/dashboard | POST /ai/employees/:id/predict | snapshotId/save → data preview/model/saved/predictionId; 400/409/503 | C,L; không gọi thật |
| Batch / HR | BatchAnalysis | POST /ai/predict-batch | employees 1–25 unique {employeeId,snapshotId,save}; results từng dòng success/error | C,L; giữ thành công một phần |
| Xem kết quả / HR | Xem lại kết quả đã lưu | GET /ai/results/:id | data AiPrediction; 403/404; resultId không bắt buộc cho dự đoán | C,L |
| Đề xuất / HR | EmployeeDashboard | POST /ai/results/:id/policy-recommendations | save,limit → recommendations/rule signals; chỉ khi HR bấm | C,L; không gọi thật |
| Attendance/location/distance/schedules/leave | Không có route FE | Không kết nối | Không thêm module; không gọi demo prediction vào luồng thật | Ngoài phạm vi |
| Career Profile/Job Histories | Không có màn nghiệp vụ riêng | Không kết nối | Provenance AI không phải module quản trị | Ngoài phạm vi |

### Kiểm tra và file thay đổi lượt này

`api.ts`, `EmployeePages.tsx`, `AdminPages.tsx`, `SurveyPages.tsx`, `Workspace.tsx`, `IndividualAnalysis.tsx`, routes `users.tsx`, `my-surveys_.$id.tsx`, `engagement_.$id.tsx`, `employees_.$id.tsx`, `employees_.$id_.edit.tsx`, `account-status.test.ts`, test mới `session-refresh.test.ts` và báo cáo này. Các file dirty khác có từ trước. Typecheck phát hiện lỗi optional/undefined còn lại từ lượt trước và đã được sửa. Kiểm thử: 24/24 fixture tests qua; typecheck và production build qua trước thay đổi cuối về dialog chi tiết phản hồi; xem kết quả kiểm chứng cuối bổ sung bên dưới. Không có bằng chứng live đủ cả ba vai trò ở lượt này; vẫn cần kiểm tra đọc sau khi service khởi động lại và kiểm tra ghi trên môi trường thử riêng.

Ngày kiểm tra: 2026-11-16 (Asia/Bangkok). **Chưa hoàn tất tích hợp end-to-end.** Proxy FE → BE hoạt động; PostgreSQL truy vấn chỉ đọc thành công; bundle Mexwell chạy được trong kiểm tra cô lập. BE → AI và các luồng đăng nhập/nghiệp vụ chưa kiểm chứng bằng phiên người dùng.

## 1. Phạm vi và trạng thái ban đầu

| Repository | Commit | Git status ban đầu |
|---|---|---|
| `C:\Users\Chile\OneDrive\Desktop\NewCapstone\eris-prediction-dashboard` | `8ea13fd49adeaea8d7f6edf0c550fd115d8d4c53` | Modified `src/routeTree.gen.ts`; untracked `package-lock.json` |
| `C:\Users\Chile\OneDrive\Desktop\Capstone Project\ERIS-Employee-Retention-Intelligence-System-BE` | `6ed81206435b192a00b457cc7d8f2c0e0fbd5607` | Modified `package-lock.json` |
| `C:\Users\Chile\OneDrive\Desktop\Capstone Project\eris-ai-service` | `5fd1ffa81e4d593407b1a87be7d580b291bd30b6` | Clean |

Đã đọc AGENTS.md FE; không tìm thấy AGENTS.md trong BE/AI hoặc các thư mục cha đã kiểm tra. Không chỉnh frontend cũ. Đọc source FE client/session/routes/views, Vite wrapper đã cài, scripts và tests; BE config/auth/employees/users/surveys/audit/AI routes, controller, validator, mapping, service; AI API, loader, schema, README và artifact có sẵn. Không chạy test BE vì có test ghi DB/gửi email; không chạy lệnh train hoặc tạo bundle.

Runtime kiểm tra: Node v24.13.0, npm 11.6.2; FE có cả bun.lock và package-lock.json, dùng dependencies đã cài, không cài/nâng cấp. AI pyproject yêu cầu Python >=3.12,<3.14, dùng `.venv\Scripts\python.exe` có sẵn.

## 2. Service và cấu hình

| Service | Địa chỉ / trạng thái | Biến cấu hình |
|---|---|---|
| FE mới | `http://localhost:8081`, đang chạy | `.env.local`: `VITE_API_BASE_URL=/api`; Vite `server.port=8081`, `strictPort=true` |
| BE | `http://127.0.0.1:3000`, `/health` 200 | `PORT`; `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSLMODE` |
| DB trong .env BE | `10.148.0.2:15432`, SELECT thành công | Không đổi .env; SSL theo `PGSSLMODE` |
| Tunnel người dùng | `127.0.0.1:15432`, SELECT thành công | `cloudflared access tcp --hostname db.khanhng.me --url 127.0.0.1:15432` |
| AI HTTP | `http://127.0.0.1:8000`, không có listener lúc kiểm kê | BE: `AI_SERVICE_URL`, `AI_SERVICE_KEY`, `AI_SERVICE_TIMEOUT_MS` |
| AI loader | Bundle local có sẵn | `ERIS_SERVICE_KEY`, `ERIS_MEXWELL_DEMO_ENABLED`, `ERIS_MEXWELL_DEMO_BUNDLE` |
| Auth | Cookie secure=false, sameSite=lax trong .env BE | `JWT_SECRET`, `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `PASSWORD_CHANGE_TOKEN_TTL_SECONDS`, `PASSWORD_RESET_OTP_TTL_SECONDS`, `PASSWORD_RESET_OTP_MAX_ATTEMPTS`, `AUTH_COOKIE_SECURE`, `AUTH_COOKIE_SAME_SITE` |
| Redis / mail | Chưa kiểm chứng kết nối hoặc gửi mail | `REDIS_URL`; `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` |

Các nhận xét cấu hình dựa trên file local, không khẳng định process đang chạy đã nạp đúng file mới nhất. `.env` BE không có `AI_SERVICE_KEY`; AI có service key hợp lệ nhưng không bật demo/model trong .env. Không xuất giá trị key, tài khoản, mật khẩu, URL chứa credential hay dữ liệu nhân viên.

Proxy giữ nguyên `/api`: Express mount `/api/auth`, `/api/employees`, `/api/ai`, v.v. Cookie refresh có path `/api/auth`, HttpOnly; client dùng `credentials: include`, Bearer token trong sessionStorage. Same-origin proxy tránh cần thay CORS BE. Không thêm key AI/DB vào VITE_*. Cấu hình proxy chỉ dành cho dev server, không cấu hình routing production hosting.

## 3. File thay đổi

- `vite.config.ts`: thêm server 8081/strictPort và proxy `/api` → 3000 trong `defineConfig({ vite: ... })`; giữ TanStack Start/Nitro/framework plugins.
- `.env.local` (gitignored): chỉ `VITE_API_BASE_URL=/api`; không tồn tại trước lần kiểm tra.
- `src/components/eris/EmployeePages.tsx`: lương live dùng VND, preview giữ USD; lọc phòng ban theo dữ liệu nhận được; phòng ban/học vấn trong form live chỉ đọc vì adapter sửa chưa lưu chúng; chuẩn hóa giới tính MALE/FEMALE/OTHER khi hiển thị; mở nút import khi có file, khóa gửi lại khi đã hoàn thành; sửa thông báo chức danh công việc không phải vị trí địa lý.
- `src/routes/engagement_.$id.tsx`: không nuốt lỗi lấy kết quả khảo sát bằng `.catch(() => null)`; lỗi trả về LiveError.
- Báo cáo này. Build tạo output/log gitignored. Không chỉnh tay file generated hoặc lockfile, không commit/push.

## 4. Đối chiếu contract

Tất cả endpoint dưới đây có prefix `/api`. “Đã nối” nghĩa là có adapter source, không có nghĩa đã chạy thành công với tài khoản thật. Các màn hình preview tương ứng dưới `/preview/admin`, `/preview/hr`, `/preview/employee` chỉ mô phỏng.

| Chức năng | Route FE | Endpoint BE | Payload / response | Trạng thái thực tế | Việc còn lại |
|---|---|---|---|---|---|
| Login | `/login` | POST `/auth/login` | `{email,password}` → `{accessToken,user}` hoặc `{passwordChangeToken}` | Đã nối, chưa kiểm chứng login | Đăng nhập tài khoản thử; không tự thử credential |
| Session / logout | Mọi route live | GET `/auth/me`; POST `/auth/refresh`, `/auth/logout` | User object; refresh cookie → accessToken | `/me` không token qua proxy trả JSON 401 thật; refresh/logout chưa thử | Kiểm chứng cookie, hết hạn, logout bằng phiên thử |
| Kích hoạt / khôi phục | `/login`, `/forgot-password` | PATCH `/auth/change-password`; POST `/auth/forgot-password`, `/auth/reset-password` | Token đổi mật khẩu + OTP; email/OTP/newPassword | Có adapter; preview activation/recovery mô phỏng | Không gửi email/reset thật; kiểm tra luồng OTP với tài khoản thử |
| Phân quyền | `/users`, `/activity`, `/employees`, `/engagement`, `/my-surveys`, `/ai-analysis` | Auth middleware + service role checks | ADMIN / HR / EMPLOYEE | Guard FE có, chưa thử đủ vai trò | Kiểm chứng quyền BE bằng phiên người dùng |
| Admin tạo HR | `/users` | POST `/auth/user_register` | `{email,full_name,hireDate}` → `{message,data}` | Đã nối, contract tên field khớp | Không chạy vì tạo account và có thể gửi mail |
| Admin danh sách/chi tiết/trạng thái | `/users`, `/users/$id` | GET `/users`, `/users/:id`; PATCH `/:id/status` | Query page/limit/search/status; `{status:ACTIVE|INACTIVE}` | Đã nối, chưa kiểm chứng | Kiểm tra pagination và quyền Admin |
| HR danh sách/chi tiết | `/employees`, `/employees/$id` | GET `/employees`, `/employees/:id` | List `{data,...}`; detail object | Đã nối, chưa kiểm chứng | FE hiện lấy tối đa 100; chưa đảm bảo duyệt đủ tập lớn |
| HR tạo nhân viên | `/employees/new` | POST `/employees` | fullName/email/phone/dateOfBirth/gender/address/departmentId/positionId/hireDate/employmentType/currentSalary + educations hợp lệ | **Có UI và API nhưng chưa nối**; nút lưu disabled | Thiếu adapter create, danh mục department/position và học vấn/institution theo validator; không gán ID giả. Giữ luồng tạo nhân viên/account của BE |
| HR sửa | `/employees/$id/edit` | PATCH `/employees/:id` | fullName/phone/gender/departmentId/employmentType/currentSalary → `{message,data}` | Đã nối một phần; chưa thử ghi | Phòng ban/học vấn chỉ đọc; cần adapter danh mục/education riêng để sửa đầy đủ. Lương BE là VND |
| HR import | `/employees/import` | POST `/employees/import` | multipart `file` .xlsx → total/created/failed/results | Đã nối; sửa nút chọn file → gửi; chưa thử ghi | Dùng template BE, dữ liệu thử được xác nhận; address/positionId/educations vẫn bắt buộc |
| HR khảo sát | `/engagement`, `/engagement/$id` | GET/POST `/surveys`; PATCH `/:id`; POST `/:id/publish`, `/:id/close`; GET `/:id/results`, `/:id/responses` | title/description/startDate/endDate; response `{data}` | Đã nối, chưa kiểm chứng | Không tự tạo/publish khảo sát; kết quả lỗi hiện trạng thái lỗi |
| Employee khảo sát | `/my-surveys`, `/my-surveys/$id` | GET `/surveys/available`, `/:id`, `/:id/my-response`; POST `/:id/responses` | `{answers:[{questionId,score,comment}]}` → `{data}` | Đã nối, chưa kiểm chứng | Chỉ 404 my-response được xem là chưa trả lời; không submit thật |
| AI model/danh sách/snapshot | `/ai-analysis` (HR) | GET `/ai/model`, `/ai/employees`, `/ai/employees/:id/snapshots[/:snapshotId]` | `{data}` | Đã nối, BE → AI đang thiếu cấu hình | Bổ sung key chỉ ở process BE riêng; chạy AI với bundle hiện có |
| Tạo snapshot AI | `/ai-analysis` | POST `/ai/employees/:id/preview` | vndPerUsd/supplementalFeatures → snapshot | Đã nối; **endpoint có thể ghi ai_input**, dù tên preview | Không dùng làm health check; cần dữ liệu thử được xác nhận |
| Predict / dashboard / SHAP | `/ai-analysis` với employeeId/snapshotId/resultId | POST `/ai/employees/:id/predict`; GET `/ai/results/:id` | `{snapshotId,save}` → `{data:{preview,model,saved,...}}` | Đã nối, chưa chạy qua BE; dashboard nằm trong HR | Không tạo snapshot hoặc lưu prediction thật để test |
| Batch | `/ai-analysis?tab=batch` | POST `/ai/predict-batch` | `{employees:[{employeeId,snapshotId,save}]}`, 1–25 unique | Đã nối; chưa kiểm chứng | BE lặp inference đơn, 2 worker; AI `/v1/predict-batch` riêng trả 503, không đồng nghĩa batch BE không tồn tại |
| Policy | Dashboard prediction | POST `/ai/results/:id/policy-recommendations` | `{save,limit}` → `{data}` recommendations | Đã nối, chưa kiểm chứng | Policy là rule BE; không gọi lưu/duyệt policy thật |
| Hoạt động | `/activity` | GET `/audit-logs`, `/:id` | `{data}` list/detail | Đã nối, chưa kiểm chứng | Chưa đọc dữ liệu audit cá nhân |

SessionProvider bị disable ở route preview/public; PreviewProvider dùng state/fixtures local. Static review không thấy preview gọi live adapter; live failures không fallback sang fixtures. Shared views vẫn import một số kiểu/constants từ fixtures và có nhánh preview: chưa thể xóa fixtures nguyên file. Chưa đo network của toàn bộ tương tác preview trong browser.

## 5. AI contract và kết quả kiểm tra

Model identity `mexwell-rf12-demo-v1-20e0a090ced2`; schema `mexwell-12-v1`; target `Resigned=1`; `demo_mode=true`; validation `NO_QUALIFIED_MEXWELL_MODEL`. Đây là inference model demo thật, không phải dữ liệu mock, nhưng chưa đạt tiêu chí dùng thực tế. Không có horizon 90 ngày, nhãn hay ngưỡng rủi ro đã được xác lập.

| Feature | Mapping / kiểu / đơn vị |
|---|---|
| Department | departments.name; enum Customer Support, Engineering, Finance, HR, IT, Legal, Marketing, Operations, Sales |
| Gender | MALE/FEMALE/OTHER → Male/Female/Other |
| Age | Tuổi tròn từ date_of_birth, integer 18–120 ở BE |
| Hire_Date | YYYY-MM-DD, không tương lai; pipeline xử lý ngày |
| Years_At_Company | Năm hoàn thành từ hire_date, integer 0–102 |
| Education_Level | Bằng ACTIVE cao nhất; High School/Bachelor/Master/PhD |
| Monthly_Salary | current_salary VND / vndPerUsd do HR nhập; đầu vào model USD/tháng; không tự chọn tỷ giá |
| Work_Hours_Per_Week | Lịch ACTIVE, giờ/tuần, trừ break và overtime; 0–168 |
| Overtime_Hours | Phút overtime hoàn chỉnh từ đầu năm → giờ; incomplete checkout làm dữ liệu chưa sẵn sàng |
| Sick_Days | ON_LEAVE + ABSENT theo lịch từ đầu năm; rộng hơn “sick days” dataset, là hạn chế ngữ nghĩa chưa giải quyết |
| Promotions | Số lịch sử PROMOTION tới snapshot, integer không âm |
| Employee_Satisfaction_Score | Mean khảo sát đã submit gần nhất, làm tròn 2 chữ số; chuẩn BE 1–5; client có ngoại lệ demo 0–<1 cho snapshot ngoài miền |

Thiếu/không hợp lệ được trả missingFeatures/invalidFeatures, không tự bù mặc định. Supplemental chỉ bổ sung feature còn thiếu, không ghi đè nguồn DB. AI model schema strict đủ 12 field, cấm extra; enum được đối chiếu bundle. BE có giới hạn nghiệp vụ chặt hơn numeric schema AI; không coi hai validator hoàn toàn tương đương.

TreeSHAP dùng probability (0–1), base + tổng contributions = score với tolerance 1e-8; 0.01 = 1 điểm phần trăm. FE nhân 100 khi hiển thị. Không diễn giải SHAP là quan hệ nhân quả.

Kiểm tra thực hiện:

- BE `/health`: HTTP 200. BE `/api/auth/me`: 401 JSON không credential.
- FE `http://localhost:8081/api/auth/me`: cùng HTTP 401 JSON, chứng minh proxy tới auth endpoint; không chứng minh login/DB qua request đó.
- FE `/login` và `/preview`: 200 HTML.
- DB dùng .env BE và DB qua loopback tunnel: mỗi kết nối dùng `BEGIN READ ONLY; SELECT 1; ROLLBACK`, đều thành công. Không đọc bảng nhân viên. Đây là process kiểm tra dùng cấu hình BE, chưa chứng minh pool của process 3000 đã kết nối DB.
- Không có AI listener 8000 tại kiểm kê. FastAPI TestClient với cấu hình .env: `/health` 200, `/ready` 503.
- TestClient cô lập, bật demo trong tham số hàm và trỏ bundle có sẵn (không đổi file): `/v1/model-info` 200; `/v1/explain` với ID/dữ liệu tổng hợp trả 200, score trong [0,1], 12 contributions, additivity đạt. Không DB, không train, không tạo artifact.
- FE `npm test`: 2 files, 11 tests qua (routing + display math). `npx tsc --noEmit` và `npm run build` qua; xem kết quả kiểm tra cuối lượt bên dưới nếu có.
- Chưa kiểm chứng UI tương tác/browser, tài khoản, Redis, mail, BE → AI, create/update/import/survey/policy, pagination dữ liệu lớn. Build và unit tests không thay thế các kiểm tra này.

## 6. Điểm chặn và đề xuất

1. **Chặn AI end-to-end:** BE .env thiếu key; AI chưa chạy và chưa bật model. Đề xuất dùng terminal/process riêng, nạp key từ .env AI vào env process BE mà không in key, bật bundle trên process AI; không ghi đè cấu hình chung hoặc tự restart process 3000. Cần người vận hành bố trí process/port riêng nếu vẫn dùng process 3000 hiện có.
2. **Chặn create nhân viên:** thiếu form/adapter các field bắt buộc và danh mục học vấn. Không thay contract BE, không bỏ chức danh công việc. Giữ UI disabled và ghi rõ thiếu thay vì gửi placeholder.
3. **Chưa kiểm chứng phiên và nghiệp vụ:** cần người dùng đăng nhập tài khoản thử; test ghi dữ liệu chỉ sau xác nhận DB/dữ liệu thử. Không đưa credential vào báo cáo.
4. **Giới hạn tính đầy đủ:** employee edit chưa hỗ trợ thay phòng ban/học vấn; directory giới hạn 100; preview chỉ static/unit review; chưa kiểm thử toàn bộ browser network.
5. **Giới hạn model:** unqualified demo, Sick_Days khác nghĩa dataset, snapshot có thể ngoài miền; không dùng score làm kết luận nhân viên nghỉ việc.

## 7. Chạy local và thứ tự terminal

Kiểm tra listener trước; các process 8080/8081/3000/15432 hiện có phải giữ nguyên. Không chạy thêm lệnh vào port đã dùng. Những lệnh dưới là hướng dẫn cho lúc service chưa chạy hoặc một phiên do người vận hành quản lý.

```powershell
# Terminal 1: chỉ mở khi tunnel chưa chạy, giữ mở
cloudflared access tcp --hostname db.khanhng.me --url 127.0.0.1:15432

# Terminal 2: AI; dùng bundle đã có, tuyệt đối không chạy module tạo/train bundle
Set-Location 'C:\Users\Chile\OneDrive\Desktop\Capstone Project\eris-ai-service'
$env:ERIS_MEXWELL_DEMO_ENABLED = 'true'
$env:ERIS_MEXWELL_DEMO_BUNDLE = 'artifacts/mexwell_rf12_demo_v1/bundle.joblib'
.venv\Scripts\python.exe -m uvicorn eris_ai.api:app --host 127.0.0.1 --port 8000

# Terminal 3: BE (chỉ khi port được giải phóng bởi người quản lý phiên đó)
Set-Location 'C:\Users\Chile\OneDrive\Desktop\Capstone Project\ERIS-Employee-Retention-Intelligence-System-BE'
# AI_SERVICE_KEY phải được nạp kín vào env process và khớp ERIS_SERVICE_KEY.
# Không dán key vào lịch sử terminal/chat; không chỉnh .env chung trong lượt này.
$env:AI_SERVICE_URL = 'http://127.0.0.1:8000'
# Nếu muốn dùng tunnel, chỉ override process này sau khi chọn đúng môi trường:
# $env:PGHOST = '127.0.0.1'
# $env:PGPORT = '15432'
npm start

# Terminal 4: FE (hiện đã có process 8081, không chạy trùng)
Set-Location 'C:\Users\Chile\OneDrive\Desktop\NewCapstone\eris-prediction-dashboard'
npm run dev
```

Giữ các terminal phục vụ đang dùng mở; thứ tự tunnel → AI → BE → FE. Auth còn phụ thuộc Redis và mail cấu hình của môi trường; không tự mở dịch vụ giả thay thế. Không dùng `npm run ai:start` BE trong lượt kiểm tra: script có thể extract/ghi runtime, build Docker và xóa/restart container đã có.

## 8. Hoàn tác và xóa preview về sau

Chỉ hoàn tác hunk của lượt này trong vite.config.ts, EmployeePages.tsx và engagement_.$id.tsx bằng diff, không reset repository. Có thể xóa `.env.local` nếu nó vẫn chỉ chứa dòng đã tạo; nếu người dùng đã thêm config, chỉ bỏ dòng VITE_API_BASE_URL. Xóa báo cáo nếu không cần. Không đụng `package-lock.json` hoặc `src/routeTree.gen.ts` vốn đã có thay đổi trước lượt này. Vite/TanStack tự quản lý file generated khi chạy build/dev.

Khi quyết định bỏ preview: xóa `src/routes/preview*.tsx`, `src/components/eris/PreviewBoundary.tsx`, `PreviewAiAnalysis.tsx`, `src/lib/eris/preview.tsx`; bỏ link preview trong trang public/shell. Trước khi xóa `fixtures.ts`, chuyển types/shared constants còn dùng bởi live sang module riêng, bỏ dữ liệu giả và các nhánh `preview` trong shared views. Giữ AdminPages/EmployeePages/SurveyPages/Workspace, API/session/guards, IndividualAnalysis/BatchAnalysis/EmployeeDashboard và analysis math. Regenerate route tree bằng công cụ, không sửa tay. Cập nhật tests routing preview. Không có dependency package dành riêng preview đã được xác nhận: không xóa React/TanStack/Recharts/Sonner/Lucide vì live cũng dùng.

## 9. Bảo toàn

Không ghi dữ liệu nghiệp vụ DB, migration, seed, schema; chỉ transaction READ ONLY + SELECT 1 + rollback. Không gửi email/OTP, không login bằng credential đoán, không submit khảo sát. Không sửa BE/AI/frontend cũ, không đổi bundle/model hoặc config triển khai chung, không dừng process, không commit/push hoặc nâng dependency. FE dev server có thể tự reload/reload config do Vite theo dõi file thay đổi; không chủ động dừng process 8080/3000/15432.

## 10. Chẩn đoán lỗi runtime 2026-11-16

### Danh sách nhân viên

Đã tái hiện đúng request có quyền HR trên Express 3000 bằng access token ngắn hạn chỉ giữ trong bộ nhớ; không dùng hoặc in credential người dùng:

| Request | Kết quả trước thay đổi | Kết quả sau thay đổi FE |
|---|---|---|
| `GET /api/employees?page=1&limit=100` | HTTP 500, JSON `{message: "Internal server error."}` | Không còn được màn hình danh sách gọi |
| `GET /api/employees` | Chưa được màn hình gọi | HTTP 200, 19 bản ghi, không in nội dung bản ghi |

Log stack được tái hiện bằng chính `EmployeesService.listEmployees` trong process chẩn đoán chỉ đọc: PostgreSQL SQLSTATE `08P01`, `bind message supplies 2 parameters, but prepared statement "" requires 0`, tại `employees.repository.js` trong `list`. Repository dựng `LIMIT 1 OFFSET 2` (thiếu ký hiệu `$` trước placeholder) nhưng truyền `[100, 0]`. Vì vậy nguyên nhân là SQL phân trang của BE, không phải kết nối, schema hay quyền HR. Không sửa BE theo phạm vi hiện tại. FE mới được đổi để chỉ thêm `page`/`limit` khi caller thực sự truyền và màn hình `/employees` gọi không phân trang; nhánh BE này đã kiểm chứng HTTP 200.

PostgreSQL trong `.env` BE là host `10.148.0.2`, port `15432`, database/user có cấu hình và SSL disable. Listener Cloudflare tồn tại tại `127.0.0.1:15432`. Với cùng database/user/password/SSL của BE, cả host trong `.env` và loopback tunnel đều qua `BEGIN READ ONLY; SELECT 1; ROLLBACK`, cùng đi tới PostgreSQL server nội bộ `172.18.0.2:5432`. Truy vấn SELECT chính xác của danh sách cũng qua, trả 19 dòng. Bảng `employees` có đủ cột repository đọc; user DB hiện tại có quyền SELECT. Không đọc/in dữ liệu cá nhân; chỉ ghi số dòng, danh sách tên cột và số lượng NULL theo field trong log chẩn đoán.

### AI Mexwell

| Request / lớp | Kết quả |
|---|---|
| Express 3000 `GET /api/ai/model` với HR | HTTP 503: `Chưa cấu hình AI_SERVICE_KEY (ít nhất 24 ký tự).` |
| AI `.env` | Có `ERIS_SERVICE_KEY` hợp lệ; chưa bật demo/bundle qua biến `.env` |
| AI local được khởi động trong terminal tool-managed | `127.0.0.1:8000`; `/ready` = ready |
| Model info trực tiếp | `mexwell-rf12-demo-v1-20e0a090ced2`, schema `mexwell-12-v1`, `NO_QUALIFIED_MEXWELL_MODEL`, demo mode |
| Express tạm thời, cùng source/DB, nạp key kín trong process | `GET /api/ai/model` HTTP 200, model/schema khớp |

BE mặc định `AI_SERVICE_URL=http://127.0.0.1:8000`, timeout 15000 ms. Process 3000 được khởi động bằng `node --watch src/server.js` và đã nạp `.env` thiếu `AI_SERVICE_KEY`; bật AI 8000 không thay đổi env của process đang chạy. Không dừng/restart process 3000 và không ghi key vào FE, báo cáo, command line hoặc git. Muốn 3000 hết 503 cần nạp `AI_SERVICE_KEY` khớp `ERIS_SERVICE_KEY` vào môi trường local của BE rồi do người quản lý terminal restart process đó.

### `toLowerCase` tại `app.js:992`

Không có file `app.js` 992 dòng trong source/build FE mới; Vite hiện xuất chunk có hash. Không thu được stack cũ từ Chrome DevTools bằng automation, nên không khẳng định source-map tuyệt đối. Đối chiếu toàn source cho thấy ứng viên trực tiếp trong luồng response lỗi là `src/lib/eris/api.ts`: `getApiErrorMessage` gọi `error.message.toLowerCase()` vô điều kiện. Đã đổi thành kiểm tra kiểu string trước khi lowercase; status HTTP vẫn quyết định thông báo fallback, không biến lỗi live thành mock. Sau hot reload, trang HR → Nhân viên hiển thị 19 bản ghi. Build, typecheck và 11 test đều qua.

### Khởi động lại Express với Mexwell

Theo yêu cầu ngày 2026-11-16, đã sao chép `ERIS_SERVICE_KEY` từ `.env` AI sang `AI_SERVICE_KEY` trong `.env` backend bằng thao tác local che kín giá trị, đồng thời đặt `AI_SERVICE_URL=http://127.0.0.1:8000`. Chỉ ghi hai biến AI; không thay các biến DB/auth/mail/Redis và không đưa key vào frontend, command line, log hay báo cáo.

Child Express cũ trên cổng 3000 được dừng sau khi xác minh command line là `src/server.js`. Watcher cũ không tự tạo child mới sau thao tác dừng, nên watcher treo được dừng và backend được khởi động lại bằng `npm run dev`. Log `Swagger UI is available at http://localhost:3000/api-docs` là thông báo startup bình thường, không phải lỗi AI.

| Kiểm chứng sau restart | Kết quả |
|---|---|
| AI service `127.0.0.1:8000` | Listener hoạt động, model đã ready |
| Backend `127.0.0.1:3000` | Listener hoạt động, `/health` thành công |
| `GET http://localhost:8081/api/ai/model` qua proxy FE | HTTP 200, JSON, có `data` |
| Model | `mexwell-rf12-demo-v1-20e0a090ced2` |
| Schema | `mexwell-12-v1` |
| Validation | `NO_QUALIFIED_MEXWELL_MODEL`, `demo_mode=true` |
| Trang `/ai-analysis` với phiên HR hiện có | Cảnh báo thiếu key biến mất; hiển thị model và nhãn chế độ thử nghiệm |

Request xác minh dùng access token HR ngắn hạn chỉ giữ trong bộ nhớ và chỉ gọi endpoint thông tin model. Không gọi predict, explain, snapshot, batch, policy hoặc endpoint ghi dữ liệu. Hai terminal AI và backend cần tiếp tục chạy để giữ listener 8000 và 3000.

### Đồng bộ hồ sơ nhân viên và đơn vị lương

- Nguyên nhân phòng ban: phần Phân tích AI dùng enum 9 phòng ban của schema mô hình, còn form hồ sơ chỉ giữ `departmentId` và cố ý khóa select; endpoint chi tiết không trả tên phòng ban. Form nay nạp `/api/departments` và `/api/positions`, hiển thị tên thật, cho đổi phòng ban và tự giới hạn chức danh thuộc phòng ban đó. Payload cập nhật gửi đồng thời `departmentId` và `positionId` theo ràng buộc backend.
- Nguyên nhân ngày có giờ/form ngày trống: API trả timestamp nhưng UI dùng trực tiếp cho `input[type=date]` và formatter ngày-giờ. Giá trị nay được chuẩn hóa thành `YYYY-MM-DD` cho input, còn trang chi tiết hiển thị `dd/MM/yyyy` cho ngày sinh và ngày vào làm.
- Quy ước lương: `current_salary` được xác nhận là USD/tháng. Nhãn hồ sơ và chi tiết đều dùng USD. Backend AI đưa trực tiếp giá trị này vào `Monthly_Salary`; đã bỏ tham số/tác vụ quy đổi `vndPerUsd` khỏi API preview và Swagger.
- Kiểm chứng không ghi dữ liệu nhân viên: FE build thành công, 11/11 test FE qua; 10/10 test tích hợp AI backend qua (bài PostgreSQL chỉ dùng TEMP tables và rollback). Danh mục được kiểm tra đọc-only: 9 phòng ban ACTIVE và 90 chức danh ACTIVE.

### Ổn định dịch vụ AI và URL phân tích

- Cảnh báo `Không tìm thấy dữ liệu yêu cầu...` không phải model hỏng. URL giữ `employeeId=18`, trong khi API AI chỉ trả nhân viên ACTIVE có tài khoản ACTIVE; tài khoản của hồ sơ này chưa ACTIVE. Frontend nay xác thực ID theo danh sách AI, tự xóa ID/snapshot cũ không hợp lệ và không phát request 404.
- AI không còn chạy bằng terminal Python tạm. Script `npm run ai:start` nay có thể lấy source/model trực tiếp từ repo AI cùng cấp; container `eris-ai-mexwell` đang `running` với restart policy `unless-stopped`.
- Sự cố proxy `/api/auth/login` xuất hiện trong khoảng backend watch restart. Sau khôi phục: `/health` = 200; POST rỗng qua `8081/api/auth/login` = 400 (request đã tới Express, không còn proxy error); smoke test model/predict không lưu dữ liệu = PASS.
- Kiểm chứng cuối: model `mexwell-rf12-demo-v1-20e0a090ced2`, 12 SHAP, databaseWrites=0; FE 11/11 test và production build qua. Trang đăng nhập đã được tải lại và cảnh báo kết nối cũ biến mất.

### Đối soát trạng thái tài khoản DB → API → UI

#### Database và schema thực tế

Backend cổng 3000 đang kết nối database `eris`, user DB `postgres`, schema hiện hành `public`, `search_path="$user", public`. PostgreSQL báo server đích `172.18.0.2:5432`; cấu hình local/tunnel hiện có tiếp tục được tái sử dụng. Không in host trung gian, mật khẩu hoặc chuỗi kết nối có bí mật.

Các bảng liên quan trực tiếp là `public.users`, `public.employees`, `public.role`. Không có bảng OTP trong PostgreSQL; OTP được băm và lưu có TTL trong Redis tại khóa `auth:otp:<purpose>:<userId>`. `users.employee_id` là FK nullable tới `employees.id`, có UNIQUE nên một hồ sơ có tối đa một tài khoản. `users.role_id` là FK bắt buộc tới `role.id`. Enum được CHECK constraint xác nhận cho cả `users.status` và `employees.employment_status`: `ACTIVE`, `INACTIVE`, `IN_PROCESS`. Trigger duy nhất liên quan trạng thái trên hai bảng là trigger cập nhật `updated_at`; không có trigger tự kích hoạt tài khoản.

Luồng backend đã xác minh:

- Admin tạo HR: tạo đồng thời employee và user ở `IN_PROCESS`.
- HR tạo nhân viên/tài khoản mới: user và hồ sơ nền bắt đầu `IN_PROCESS`; gửi email không làm tài khoản ACTIVE.
- Đăng nhập lần đầu của user `IN_PROCESS`: chỉ phát OTP và password-change token, chưa đổi trạng thái.
- Chỉ sau khi OTP hợp lệ và đặt mật khẩu mới, `AuthRepository.updatePassword(..., 'ACTIVE')` mới chuyển `users.status` sang `ACTIVE`; cùng transaction chuyển employee `IN_PROCESS` sang `ACTIVE` và kích hoạt hồ sơ nền. Việc có password, đã gửi email hoặc employee đang làm việc không được dùng riêng để suy luận đã kích hoạt.

#### Thống kê chỉ đọc

| Vai trò | Trạng thái tài khoản | Số lượng |
|---|---:|---:|
| ADMIN | ACTIVE | 1 |
| HR | ACTIVE | 6 |
| EMPLOYEE | ACTIVE | 9 |
| EMPLOYEE | IN_PROCESS | 5 |

Employee: 14 `ACTIVE`, 5 `IN_PROCESS`. Có 0 employee không có account, 0 employee bị liên kết nhiều account, 0 FK account trỏ employee không tồn tại, 0 status null/ngoài enum và 0 cặp user/employee lệch trạng thái. Có hai user chưa liên kết employee: user ID 1 (ADMIN, hợp lệ theo vai trò) và user ID 8 (HR ACTIVE chưa có hồ sơ; backend có luồng riêng để HR khác tạo/liên kết hồ sơ nên chưa kết luận là dữ liệu sai). Năm nhóm chờ kích hoạt là user ID 16–20, liên kết employee ID 15–19; cả hai lớp đều `IN_PROCESS`. Không có bản ghi DB nào đủ bằng chứng để đề xuất UPDATE, nên không soạn/chạy SQL sửa dữ liệu trong lượt này.

#### EMP006 và nguyên nhân lệch

| Lớp | Kết quả |
|---|---|
| DB | employee ID 6 / EMP006 `ACTIVE`; user ID 7, role HR, `ACTIVE` |
| API HR `GET /api/employees/6` | HTTP 200; `employmentStatus=ACTIVE`; payload không có key `account` |
| UI trước sửa | `profile.account` thiếu bị fallback thành `IN_PROCESS`, hiển thị sai “Chờ kích hoạt” |
| UI sau sửa frontend | payload thiếu account → “Chưa xác định”; account `ACTIVE` → “Đã kích hoạt”; `IN_PROCESS` → “Chờ kích hoạt”; `INACTIVE` → “Đã khóa”; `account:null` → “Chưa có tài khoản” |

Backend tối thiểu đề xuất cho lượt được duyệt sau: tại `EmployeesRepository.findById` và truy vấn list, `LEFT JOIN users ON users.employee_id=employees.id`, trả `account: null` khi không có và `{ id, status }` khi có. Đây là thay đổi contract nên chưa áp dụng trong lượt này. Khi endpoint bổ sung trường đó, frontend hiện tại sẽ tự hiển thị EMP006 là “Đã kích hoạt” sau lần tải dữ liệu kế tiếp.

Admin → Quản lý tài khoản HR dùng `/api/users` và `/api/users/:id`, vốn đã trả `status` thật. Đã kiểm chứng read-only: cả hai endpoint HTTP 200; `/api/users/7` trả account ID 7, employeeId 6, role HR, `ACTIVE`, khớp DB của EMP006. Mapping frontend không còn ép giá trị lạ thành `IN_PROCESS`; giá trị thiếu/lạ hiển thị “Chưa xác định”. Nhãn account `ACTIVE` được đổi thành “Đã kích hoạt”, trong khi trạng thái việc làm ở HR → Nhân viên vẫn là badge riêng “Đang làm việc/Ngừng hoạt động”.

File frontend thay đổi cho lượt này: `src/lib/eris/api.ts`, `src/lib/eris/fixtures.ts`, `src/components/eris/Workspace.tsx`, `src/components/eris/EmployeePages.tsx`, `src/routes/users.tsx`, và test `src/lib/eris/account-status.test.ts`. Không sửa schema, nghiệp vụ, contract backend hoặc dữ liệu dùng chung. Kiểm chứng: 3 test files, 17/17 tests qua; production build qua; fixture bao phủ chờ kích hoạt, đã kích hoạt, chưa có tài khoản, khóa và chưa xác định.

### Danh sách nhân viên: thứ tự mã và tên phòng ban

`GET /api/employees` chỉ trả `departmentId`, không trả `departmentName`, nên mapper cũ buộc phải hiện fallback “Phòng ban #<id>”. Form chỉnh sửa hiện đúng vì route đó đã gọi thêm `/api/departments`. Route danh sách nay tải song song `/api/employees` và `/api/departments`, join read-only theo ID ở frontend và hiển thị tên danh mục thật; ID null/không tồn tại hiển thị “Chưa xác định”. Danh sách mặc định sắp xếp mã nhân viên tăng dần bằng so sánh numeric-aware (`EMP001`, `EMP002`, …), trước khi phân trang. Không thay đổi database hay contract backend. Kiểm chứng lại: 17/17 test qua và production build thành công.

### Phân tích AI: giảm nhiễu kỹ thuật cho HR

- Selector bản dữ liệu không còn dùng ID nội bộ làm nhãn chính. Mỗi bản được đánh số theo thứ tự thời gian và hiển thị theo mẫu `Bản N · dd/MM/yyyy · trạng thái`; `snapshotId` thật vẫn được dùng nguyên vẹn trong state, query string và request API.
- Mười hai đặc trưng đầu vào được gom thành ba nhóm nghiệp vụ: thông tin cơ bản, quá trình làm việc, và khối lượng/trải nghiệm. Giá trị ngày được định dạng `dd/MM/yyyy`, giới tính được bản địa hóa ở lớp hiển thị và lương tiếp tục dùng USD/tháng.
- Tên field AI và provenance không bị xóa khỏi DOM nhưng được chuyển vào mục `Chi tiết kỹ thuật` đóng mặc định. Cảnh báo chính dùng ngôn ngữ HR dễ hiểu; nội dung issue gốc vẫn nằm trong chi tiết để chẩn đoán khi cần.
- Mã model và nhãn demo không còn hiển thị trong luồng đọc chính khi dịch vụ hoạt động. Trạng thái lỗi/503 cùng nút thử lại vẫn giữ nguyên và vẫn hiển thị công khai khi AI chưa sẵn sàng.
- Thanh lưu/dự đoán và khu vực mở kết quả đã lưu được gom thành action bar rõ ràng. Không thay API, handler, điều kiện `ready`, query params hoặc nghiệp vụ lưu kết quả.

File thay đổi cho lượt này: `src/components/eris/IndividualAnalysis.tsx`, `src/routes/ai-analysis.tsx` và báo cáo này. Kiểm chứng: giao diện live qua `localhost:8081` tải đúng nhãn `Bản N`, ba nhóm dữ liệu và `Chi tiết kỹ thuật` đóng mặc định; không gọi predict hoặc endpoint ghi dữ liệu. Toàn bộ 17/17 test qua và production build thành công. ESLint chức năng trên hai file có 0 error (còn 2 cảnh báo dependency hook đã tồn tại); rule Prettier riêng vẫn báo baseline CRLF/format của các file hiện hành nên không format hàng loạt để tránh tạo diff ngoài phạm vi.

### Khôi phục chỉnh sửa học vấn

Đối chiếu frontend cũ, Swagger và code backend local xác nhận các endpoint hiện hành:

- `GET /api/employee-educations/institutions?name=<từ khóa>&educationLevel=<trình độ>` tìm trường; `name` dài 2–100 ký tự. `educationLevel` thật là một trong `High School`, `Bachelor`, `Master`, `PhD`.
- `POST /api/employees/:employeeId/educations` tạo bản ghi khi nhân viên chưa có học vấn.
- `PATCH /api/employees/:employeeId/educations/:educationId` cập nhật đúng bản ghi đã chọn. Khi đổi trường, payload phải gửi đồng thời tên `institution` và mã `institutionRefId` lấy từ gợi ý ROR/Vietmap; các trường còn lại là `educationLevel`, `fieldOfStudy` nullable và `graduationYear` nullable.
- Chỉ tài khoản HR `ACTIVE` được tìm trường và ghi học vấn; hồ sơ nhân viên phải `ACTIVE`, và HR không được tự sửa học vấn của chính mình. Không thay schema PostgreSQL hoặc nghiệp vụ quyền.

Frontend mới nay tải toàn bộ `educations` từ API. Nếu có nhiều bản ghi, selector hiển thị rõ ID, trường và năm để HR chọn đúng `educationId`; nếu chưa có thì chọn tạo mới. Khi đổi lựa chọn, form giữ đúng giá trị của bản ghi API; `graduationYear=null` hiển thị ô trống. Trang chi tiết hiển thị riêng từng bản ghi thay vì chỉ phần tử đầu tiên. Validator frontend bám validator backend: trình độ thuộc enum thật, tên trường bắt buộc và phải chọn từ gợi ý khi tạo/đổi trường, chuỗi tối đa 150 ký tự, năm 1900–năm hiện tại và tối thiểu năm sinh +18 cho High School hoặc +21 cho các trình độ khác.

Nút `Lưu thay đổi` tiếp tục lưu hồ sơ chung trước rồi mới lưu học vấn. Nếu hồ sơ đã lưu nhưng POST/PATCH học vấn lỗi, UI báo rõ trạng thái thành công một phần và không điều hướng như thể toàn bộ đã thành công. Khi cả hai bước thành công, route quay về trang chi tiết và loader đọc lại dữ liệu API.

Kiểm tra read-only trên frontend live: nhập `Fp` phát `GET` tìm trường và hiển thị gợi ý “Trường Đại học FPT”; không chọn gợi ý và không bấm lưu. Lần đầu endpoint trả mảng rỗng vì bộ lọc backend chỉ so token tuyệt đối và ROR basic query không mở rộng tiền tố. Backend được sửa tối thiểu trong API hiện có: từ khóa đơn 2–3 ký tự dùng ROR advanced prefix query và bộ lọc chấp nhận tiền tố token; Swagger được chỉnh từ enum số cũ sang enum chuỗi thật. Không có request POST/PATCH nào được gửi tới hồ sơ thật.

Luồng ghi được kiểm chứng bằng fixture/mock: tạo mới gửi POST với mã tham chiếu đã chọn; cập nhật gửi PATCH đúng `educationId`; giữ nguyên trường không gửi lại cặp trường/mã tham chiếu; năm null được giữ trống. Test backend riêng xác nhận `Fp` nhận diện FPT qua prefix search. File frontend thay đổi cho lượt này: `src/lib/eris/api.ts`, `src/lib/eris/employee-education.ts`, `src/lib/eris/employee-education.test.ts`, `src/components/eris/EmployeePages.tsx`, `src/routes/employees_.$id_.edit.tsx`, `src/routes/employees_.$id.tsx` và báo cáo này. File backend thay đổi: `src/modules/employee-education/institutions.service.js`, `src/modules/employee-education/education.swagger.js`, `test/employee-education-institution-search.test.cjs`. Kiểm chứng cuối: frontend 4 file test, 21/21 test qua; production build qua; ESLint phạm vi thay đổi có 0 error và 1 cảnh báo Fast Refresh hiện hữu; backend test prefix 1/1 qua và hai file nguồn qua kiểm tra cú pháp.
