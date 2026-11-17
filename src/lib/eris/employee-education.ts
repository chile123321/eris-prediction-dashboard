import type { EmployeeEducation, EmployeeEducationInput } from "./api";

export const EDUCATION_LEVELS = ["High School", "Bachelor", "Master", "PhD"] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export type EmployeeEducationDraft = {
  id?: number;
  educationLevel: string;
  fieldOfStudy: string;
  institution: string;
  institutionRefId: string;
  graduationYear: string;
};

export function educationToDraft(record?: EmployeeEducation): EmployeeEducationDraft {
  return {
    ...(record?.id ? { id: record.id } : {}),
    educationLevel: record?.educationLevel || "Bachelor",
    fieldOfStudy: record?.fieldOfStudy || "",
    institution: record?.institution || "",
    institutionRefId: "",
    graduationYear: record?.graduationYear == null ? "" : String(record.graduationYear),
  };
}

export function validateEducationDraft(draft: EmployeeEducationDraft, dateOfBirth?: string | null, currentYear = new Date().getFullYear()) {
  if (!EDUCATION_LEVELS.includes(draft.educationLevel as EducationLevel)) return "Vui lòng chọn trình độ học vấn hợp lệ.";
  const institution = draft.institution.trim();
  if (!institution) return "Vui lòng tìm và chọn trường từ danh mục gợi ý.";
  if ([...institution].length > 150) return "Tên trường không được vượt quá 150 ký tự.";
  if ([...draft.fieldOfStudy.trim()].length > 150) return "Chuyên ngành không được vượt quá 150 ký tự.";
  if (draft.institutionRefId && !/^(?:https:\/\/ror\.org\/[a-z0-9]{9}|vietmap:(?:auto|geocode):[A-Za-z0-9_-]{1,512})$/.test(draft.institutionRefId)) {
    return "Mã trường không hợp lệ. Vui lòng tìm và chọn lại trường.";
  }
  if (draft.graduationYear) {
    const graduationYear = Number(draft.graduationYear);
    if (!Number.isInteger(graduationYear) || graduationYear < 1900 || graduationYear > currentYear) {
      return `Năm tốt nghiệp phải từ 1900 đến ${currentYear}.`;
    }
    const birthYear = dateOfBirth?.slice(0, 10).match(/^(\d{4})-\d{2}-\d{2}$/)?.[1];
    if (!birthYear) return "Cần ngày sinh hợp lệ trước khi nhập năm tốt nghiệp.";
    const minimumYear = Number(birthYear) + (draft.educationLevel === "High School" ? 18 : 21);
    if (graduationYear < minimumYear) return `Năm tốt nghiệp phải từ ${minimumYear} với trình độ đã chọn.`;
  }
  return null;
}

export function institutionChanged(draft: EmployeeEducationDraft, current?: EmployeeEducation) {
  return !current || draft.institution.trim() !== (current.institution || "").trim();
}

export function buildEducationPayload(draft: EmployeeEducationDraft, current?: EmployeeEducation): Partial<EmployeeEducationInput> {
  const payload: Partial<EmployeeEducationInput> = {
    educationLevel: draft.educationLevel as EducationLevel,
    fieldOfStudy: draft.fieldOfStudy.trim() || null,
    graduationYear: draft.graduationYear ? Number(draft.graduationYear) : null,
  };
  if (institutionChanged(draft, current)) {
    payload.institution = draft.institution.trim();
    payload.institutionRefId = draft.institutionRefId;
  }
  return payload;
}

export function hasEducationChanges(draft: EmployeeEducationDraft, current?: EmployeeEducation) {
  if (!current) return true;
  return current.educationLevel !== draft.educationLevel
    || (current.fieldOfStudy || "") !== draft.fieldOfStudy.trim()
    || (current.institution || "") !== draft.institution.trim()
    || (current.graduationYear == null ? "" : String(current.graduationYear)) !== draft.graduationYear;
}
