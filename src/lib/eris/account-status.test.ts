import { describe, expect, it } from "vitest";
import { profileToEmployee } from "@/components/eris/EmployeePages";
import { accountStatusLabel } from "@/components/eris/Workspace";
import type { EmployeeProfile } from "./api";

const profile = (account: EmployeeProfile["account"]): EmployeeProfile => ({
  id: 1,
  employeeCode: "EMP001",
  fullName: "Fixture",
  email: "fixture@example.test",
  phone: null,
  dateOfBirth: null,
  gender: null,
  departmentId: 1,
  positionId: 1,
  hireDate: "2026-01-01",
  employmentType: "FULL_TIME",
  employmentStatus: "ACTIVE",
  currentSalary: 1000,
  ...(account === undefined ? {} : { account }),
});

describe("account status mapping", () => {
  it.each([
    [{ status: "IN_PROCESS" }, "IN_PROCESS", "Chờ kích hoạt"],
    [{ status: "ACTIVE" }, "ACTIVE", "Đã kích hoạt"],
    [null, "NO_ACCOUNT", "Chưa có tài khoản"],
    [undefined, "UNKNOWN", "Chưa xác định"],
    [{ status: "UNRECOGNIZED" }, "UNKNOWN", "Chưa xác định"],
    [{ status: "INACTIVE" }, "INACTIVE", "Đã khóa"],
  ] as const)("maps API account %j", (account, expectedStatus, expectedLabel) => {
    const status = profileToEmployee(profile(account)).accountStatus;
    expect(status).toBe(expectedStatus);
    expect(accountStatusLabel(status)).toBe(expectedLabel);
  });
});
