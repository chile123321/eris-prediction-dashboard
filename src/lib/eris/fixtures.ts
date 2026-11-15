import type { AiEmployee, AiPrediction, AiPolicyRecommendations, AiSnapshot } from "./api";

export type PreviewRole = "admin" | "hr" | "employee";
export type PreviewViewState = "populated" | "loading" | "empty" | "error";
export type Account = { id: number; fullName: string; email: string; role: "ADMIN" | "HR" | "EMPLOYEE"; status: "ACTIVE" | "IN_PROCESS" | "INACTIVE"; hireDate: string; invitation: "SENT" | "FAILED" | null };
export type Education = { level: string; institution: string; field: string; graduationYear: number };
export type Employee = { id: number; employeeCode: string; fullName: string; email: string; phone: string; dateOfBirth: string; gender: string; departmentId: number; department: string; hireDate: string; employmentType: string; employmentStatus: "ACTIVE" | "INACTIVE"; currentSalary: number; education: Education; accountStatus: "ACTIVE" | "IN_PROCESS" | "INACTIVE" };
export type SurveyQuestion = { id: number; text: string; dimension: string };
export type SurveyAnswer = { score: number; comment: string };
export type SurveyResponse = { id: number; employeeId: number; submittedAt: string; answers: Record<number, SurveyAnswer> };
export type Survey = { id: number; title: string; description: string; startDate: string; endDate: string; status: "DRAFT" | "ACTIVE" | "CLOSED"; questions: SurveyQuestion[]; responses: SurveyResponse[] };
export type AuditEntry = { id: number; createdAt: string; actor: string; action: string; entityType: string; entityId: string; oldValue: unknown; newValue: unknown };

export const questions: SurveyQuestion[] = [
  { id: 1, text: "Tôi cảm thấy hài lòng với công việc hiện tại.", dimension: "Sự hài lòng" },
  { id: 2, text: "Quản lý trực tiếp lắng nghe và hỗ trợ tôi khi cần.", dimension: "Quản lý" },
  { id: 3, text: "Tôi có cơ hội học hỏi và phát triển chuyên môn.", dimension: "Phát triển" },
  { id: 4, text: "Khối lượng công việc của tôi ở mức phù hợp.", dimension: "Cân bằng" },
  { id: 5, text: "Tôi mong muốn gắn bó lâu dài với tổ chức.", dimension: "Gắn kết" },
];

const employees: Employee[] = [
  { id: 1, employeeCode: "ERIS001", fullName: "Nguyễn Minh Anh", email: "minhanh@example.test", phone: "0901000001", dateOfBirth: "1994-04-12", gender: "Female", departmentId: 1, department: "Engineering", hireDate: "2022-03-14", employmentType: "FULL_TIME", employmentStatus: "ACTIVE", currentSalary: 1850, education: { level: "Bachelor", institution: "Đại học Bách khoa", field: "Công nghệ thông tin", graduationYear: 2016 }, accountStatus: "ACTIVE" },
  { id: 2, employeeCode: "ERIS002", fullName: "Trần Quốc Bảo", email: "quocbao@example.test", phone: "0901000002", dateOfBirth: "1991-08-21", gender: "Male", departmentId: 2, department: "Sales", hireDate: "2021-07-05", employmentType: "FULL_TIME", employmentStatus: "ACTIVE", currentSalary: 1420, education: { level: "Bachelor", institution: "Đại học Kinh tế", field: "Quản trị kinh doanh", graduationYear: 2013 }, accountStatus: "ACTIVE" },
  { id: 3, employeeCode: "ERIS003", fullName: "Lê Thu Hà", email: "thuha@example.test", phone: "0901000003", dateOfBirth: "1996-01-09", gender: "Female", departmentId: 3, department: "Marketing", hireDate: "2023-02-20", employmentType: "FULL_TIME", employmentStatus: "ACTIVE", currentSalary: 1280, education: { level: "Master", institution: "Đại học Ngoại thương", field: "Marketing", graduationYear: 2020 }, accountStatus: "ACTIVE" },
  { id: 4, employeeCode: "ERIS004", fullName: "Phạm Hoàng Nam", email: "hoangnam@example.test", phone: "0901000004", dateOfBirth: "1998-11-17", gender: "Male", departmentId: 1, department: "Engineering", hireDate: "2025-09-01", employmentType: "PROBATION", employmentStatus: "ACTIVE", currentSalary: 980, education: { level: "Bachelor", institution: "Đại học Công nghệ", field: "Khoa học máy tính", graduationYear: 2020 }, accountStatus: "IN_PROCESS" },
  { id: 5, employeeCode: "ERIS005", fullName: "Võ Khánh Linh", email: "khanhlinh@example.test", phone: "0901000005", dateOfBirth: "1993-05-30", gender: "Female", departmentId: 4, department: "HR", hireDate: "2020-10-12", employmentType: "FULL_TIME", employmentStatus: "ACTIVE", currentSalary: 1600, education: { level: "Master", institution: "Đại học Sư phạm", field: "Tâm lý học", graduationYear: 2017 }, accountStatus: "ACTIVE" },
  { id: 6, employeeCode: "ERIS006", fullName: "Đặng Tuấn Kiệt", email: "tuankiet@example.test", phone: "0901000006", dateOfBirth: "1990-02-14", gender: "Male", departmentId: 5, department: "Finance", hireDate: "2019-06-03", employmentType: "FULL_TIME", employmentStatus: "INACTIVE", currentSalary: 1720, education: { level: "Bachelor", institution: "Đại học Kinh tế", field: "Tài chính", graduationYear: 2012 }, accountStatus: "INACTIVE" },
  { id: 7, employeeCode: "ERIS007", fullName: "Bùi Mai Phương", email: "maiphuong@example.test", phone: "0901000007", dateOfBirth: "1997-07-25", gender: "Female", departmentId: 6, department: "Customer Support", hireDate: "2024-01-15", employmentType: "FULL_TIME", employmentStatus: "ACTIVE", currentSalary: 1050, education: { level: "Bachelor", institution: "Đại học Sư phạm", field: "Ngôn ngữ Anh", graduationYear: 2019 }, accountStatus: "ACTIVE" },
];

const accounts: Account[] = [
  { id: 1, fullName: "Quản trị ERIS", email: "admin@example.test", role: "ADMIN", status: "ACTIVE", hireDate: "2020-01-01", invitation: null },
  { id: 2, fullName: "Võ Khánh Linh", email: "khanhlinh@example.test", role: "HR", status: "ACTIVE", hireDate: "2020-10-12", invitation: "SENT" },
  { id: 3, fullName: "Ngô Hải Yến", email: "haiyen@example.test", role: "HR", status: "IN_PROCESS", hireDate: "2026-11-02", invitation: "SENT" },
  { id: 4, fullName: "Hoàng Gia Huy", email: "giahuy@example.test", role: "HR", status: "INACTIVE", hireDate: "2024-05-20", invitation: "SENT" },
  { id: 5, fullName: "Phạm Hoàng Nam", email: "hoangnam@example.test", role: "EMPLOYEE", status: "IN_PROCESS", hireDate: "2025-09-01", invitation: "FAILED" },
  { id: 6, fullName: "Nguyễn Minh Anh", email: "minhanh@example.test", role: "EMPLOYEE", status: "ACTIVE", hireDate: "2022-03-14", invitation: "SENT" },
];

const surveys: Survey[] = [
  { id: 101, title: "Khảo sát gắn kết quý IV/2026", description: "Lắng nghe trải nghiệm và mức độ gắn kết của nhân viên trong quý IV.", startDate: "2026-11-01", endDate: "2026-11-30", status: "ACTIVE", questions, responses: [
    { id: 1001, employeeId: 2, submittedAt: "2026-11-08T09:30:00Z", answers: { 1: { score: 4, comment: "Công việc rõ ràng." }, 2: { score: 5, comment: "Quản lý hỗ trợ tốt." }, 3: { score: 4, comment: "" }, 4: { score: 3, comment: "Cuối quý khá bận." }, 5: { score: 4, comment: "" } } },
    { id: 1002, employeeId: 3, submittedAt: "2026-11-10T04:15:00Z", answers: { 1: { score: 5, comment: "" }, 2: { score: 4, comment: "" }, 3: { score: 5, comment: "Nhiều cơ hội học." }, 4: { score: 4, comment: "" }, 5: { score: 5, comment: "" } } },
  ] },
  { id: 102, title: "Khảo sát gắn kết quý I/2027", description: "Vòng khảo sát định kỳ tiếp theo.", startDate: "2027-01-05", endDate: "2027-01-31", status: "DRAFT", questions, responses: [] },
  { id: 103, title: "Khảo sát gắn kết quý III/2026", description: "Vòng khảo sát đã hoàn tất.", startDate: "2026-08-01", endDate: "2026-08-31", status: "CLOSED", questions, responses: [
    { id: 1003, employeeId: 1, submittedAt: "2026-08-12T08:00:00Z", answers: { 1: { score: 4, comment: "Ổn định." }, 2: { score: 4, comment: "" }, 3: { score: 3, comment: "Muốn có thêm khóa học." }, 4: { score: 4, comment: "" }, 5: { score: 4, comment: "" } } },
    { id: 1004, employeeId: 2, submittedAt: "2026-08-15T08:00:00Z", answers: { 1: { score: 3, comment: "" }, 2: { score: 4, comment: "" }, 3: { score: 4, comment: "" }, 4: { score: 2, comment: "Nhiều việc cùng lúc." }, 5: { score: 3, comment: "" } } },
  ] },
  { id: 104, title: "Khảo sát trải nghiệm nhân viên mới", description: "Vòng khảo sát đã hết hạn.", startDate: "2026-09-01", endDate: "2026-09-15", status: "CLOSED", questions, responses: [] },
];

const audit: AuditEntry[] = [
  { id: 501, createdAt: "2026-11-15T08:42:00Z", actor: "Quản trị ERIS", action: "CREATE_HR_ACCOUNT", entityType: "user", entityId: "3", oldValue: null, newValue: { email: "haiyen@example.test", role: "HR", status: "IN_PROCESS" } },
  { id: 502, createdAt: "2026-11-14T03:18:00Z", actor: "Võ Khánh Linh", action: "PUBLISH_SURVEY", entityType: "survey", entityId: "101", oldValue: { status: "DRAFT" }, newValue: { status: "ACTIVE" } },
  { id: 503, createdAt: "2026-11-12T07:05:00Z", actor: "Quản trị ERIS", action: "UPDATE_USER_STATUS", entityType: "user", entityId: "4", oldValue: { status: "ACTIVE" }, newValue: { status: "INACTIVE" } },
  { id: 504, createdAt: "2026-11-10T02:30:00Z", actor: "Võ Khánh Linh", action: "CREATE_EMPLOYEE", entityType: "employee", entityId: "7", oldValue: null, newValue: { employeeCode: "ERIS007", department: "Customer Support" } },
  { id: 505, createdAt: "2026-11-08T09:30:00Z", actor: "Trần Quốc Bảo", action: "SUBMIT_SURVEY", entityType: "survey_response", entityId: "1001", oldValue: null, newValue: { surveyId: 101, status: "SUBMITTED" } },
];

export function createInitialFixtures() {
  return { accounts: structuredClone(accounts), employees: structuredClone(employees), surveys: structuredClone(surveys), audit: structuredClone(audit) };
}

export const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Customer Support", "Operations", "IT", "Legal"];

export function fixtureAiEmployees(source: Employee[]): AiEmployee[] {
  return source.filter((e) => e.employmentStatus === "ACTIVE").map((e) => ({ id: e.id, employeeCode: e.employeeCode, fullName: e.fullName }));
}

const contributions = { Department: 0.08, Gender: 0.015, Age: -0.02, Hire_Date: 0, Years_At_Company: 0.03, Education_Level: -0.025, Monthly_Salary: 0.06, Work_Hours_Per_Week: 0.04, Overtime_Hours: 0.07, Sick_Days: 0.02, Promotions: -0.05, Employee_Satisfaction_Score: -0.1 };

export function fixtureSnapshot(employee: Employee, id = employee.id + 100): AiSnapshot {
  const ready = employee.id !== 4;
  return {
    employee: { id: employee.id, employeeCode: employee.employeeCode, fullName: employee.fullName }, snapshotId: id, snapshotCreated: id > 900,
    capturedAt: "2026-11-01T00:00:00Z", snapshotDate: "2026-11-01", ready,
    features: { Department: employee.department, Gender: employee.gender, Age: 32, Hire_Date: employee.hireDate, Years_At_Company: 4.6, Education_Level: employee.education.level, Monthly_Salary: employee.currentSalary, Work_Hours_Per_Week: 44, Overtime_Hours: 18, Sick_Days: 3, Promotions: 1, Employee_Satisfaction_Score: ready ? 3.2 : "" },
    provenance: { Department: "employee.department", Gender: "employee.gender", Age: "employee.dateOfBirth", Hire_Date: "employee.hireDate", Years_At_Company: "derived.hireDate", Education_Level: "employee_education", Monthly_Salary: "employee.currentSalary", Work_Hours_Per_Week: "work_schedule", Overtime_Hours: "attendance_summary", Sick_Days: "attendance_summary", Promotions: "job_history", Employee_Satisfaction_Score: ready ? "survey_response" : "missing" },
    missingFeatures: ready ? [] : ["Employee_Satisfaction_Score"], invalidFeatures: [], outOfDomainFeatures: [], issues: ready ? [] : ["Chưa có câu trả lời khảo sát hợp lệ cho bản dữ liệu này."],
  };
}

export function fixturePrediction(employee: Employee, snapshotId: number, save: boolean): AiPrediction {
  return {
    saved: save, ...(save ? { predictionId: 7000 + employee.id } : {}), runId: 8000 + employee.id, snapshotId, createdAt: "2026-11-15T09:00:00Z",
    preview: fixtureSnapshot(employee, snapshotId), model: { model_id: "preview-mexwell-fixture", schema_version: "preview.v1", validation_status: "PREVIEW_FIXTURE", demo_mode: true, score: 0.43, base_value: 0.31, contributions: { ...contributions }, additivity_error: 0, shap_units: "probability", explainer: "fixture", riskLevel: null, predictionLabel: null, forecastHorizon: null },
    warning: "Dữ liệu minh họa — không phải kết quả do mô hình Mexwell thật tạo ra.",
  };
}

export const fixturePolicies: AiPolicyRecommendations = {
  predictionId: 7001, warning: "Đề xuất minh họa, không phải khuyến nghị do backend tạo.", saved: false, omittedCount: 0, requiresPolicyApproval: false,
  recommendations: [
    { rank: 1, status: "SUGGESTED", reason: "Điểm hài lòng là yếu tố giảm điểm lớn nhất trong dữ liệu minh họa.", policy: { id: 1, name: "Trao đổi phát triển nghề nghiệp", description: "HR và quản lý cùng nhân viên rà soát mục tiêu phát triển và hỗ trợ phù hợp." }, policyDraft: null, signals: [{ feature: "Employee_Satisfaction_Score", value: 3.2, impactPercentagePoints: -10, source: "survey_response" }] },
    { rank: 2, status: "SUGGESTED", reason: "Số giờ tăng ca trong bản dữ liệu minh họa đang đóng góp làm tăng điểm.", policy: { id: 2, name: "Rà soát phân bổ công việc", description: "Đánh giá khối lượng và phân bổ lại công việc khi cần, không tự động thay đổi lịch làm việc." }, policyDraft: null, signals: [{ feature: "Overtime_Hours", value: 18, impactPercentagePoints: 7, source: "attendance_summary" }] },
  ],
};
