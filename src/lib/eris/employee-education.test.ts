import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmployeeEducation, searchEducationInstitutions, updateEmployeeEducation, type EmployeeEducation } from "./api";
import { buildEducationPayload, educationToDraft, validateEducationDraft } from "./employee-education";

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
});

const existing: EmployeeEducation = {
  id: 42,
  employeeId: 7,
  educationLevel: "Bachelor",
  fieldOfStudy: "Software Engineering",
  institution: "FPT University",
  graduationYear: null,
  status: "ACTIVE",
};

describe("employee education contract", () => {
  beforeEach(() => {
    sessionStorage.setItem("eris-access-token", "fixture-token");
    vi.restoreAllMocks();
  });

  it("searches the existing institution catalog with Fp and the real enum", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response({
      data: [{ id: "https://ror.org/012345678", institution: "FPT University", source: "ROR" }],
      source: "ROR",
      manualEntryAllowed: false,
    }));

    const result = await searchEducationInstitutions("Fp", "Bachelor");

    expect(result.data[0]?.institution).toBe("FPT University");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/employee-educations/institutions?name=Fp&educationLevel=Bachelor");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBeUndefined();
  });

  it("updates the selected educationId and preserves a null graduation year", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response({ message: "ok", data: existing }));
    const draft = educationToDraft(existing);
    draft.fieldOfStudy = "Information Technology";

    await updateEmployeeEducation(7, draft.id!, buildEducationPayload(draft, existing));

    expect(draft.graduationYear).toBe("");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/employees/7/educations/42");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe("PATCH");
    expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body))).toEqual({
      educationLevel: "Bachelor",
      fieldOfStudy: "Information Technology",
      graduationYear: null,
    });
  });

  it("creates education with the selected institution reference", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(response({ message: "ok", data: existing }, 201));
    const draft = educationToDraft();
    draft.institution = "FPT University";
    draft.institutionRefId = "https://ror.org/012345678";
    draft.graduationYear = "2020";
    const payload = buildEducationPayload(draft) as Parameters<typeof createEmployeeEducation>[1];

    expect(validateEducationDraft(draft, "1998-01-01", 2026)).toBeNull();
    await createEmployeeEducation(7, payload);

    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit).body))).toMatchObject({
      institution: "FPT University",
      institutionRefId: "https://ror.org/012345678",
      graduationYear: 2020,
    });
  });

  it("applies the backend graduation-year minimum for each level", () => {
    const draft = { ...educationToDraft(existing), graduationYear: "2017" };
    expect(validateEducationDraft(draft, "2000-06-01", 2026)).toBe("Năm tốt nghiệp phải từ 2021 với trình độ đã chọn.");
    draft.educationLevel = "High School";
    expect(validateEducationDraft(draft, "2000-06-01", 2026)).toBe("Năm tốt nghiệp phải từ 2018 với trình độ đã chọn.");
  });
});
