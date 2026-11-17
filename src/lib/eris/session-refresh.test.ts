import { afterEach, expect, it, vi } from "vitest";
import { getCurrentUser, listDepartments, listPositions, login } from "./api";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });
it("refreshes concurrent expired requests once and retries using the new token", async () => {
  sessionStorage.setItem("eris-access-token", "expired-fixture");
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
    if (String(url).endsWith("/auth/refresh")) return json({ accessToken: "fresh-fixture" });
    return new Headers(init?.headers).get("Authorization") === "Bearer fresh-fixture" ? json({ data: [] }) : json({ message: "expired" }, 401);
  });
  await Promise.all([listDepartments(), listPositions()]);
  expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/auth/refresh"))).toHaveLength(1);
  expect(fetchMock.mock.calls.every(([, init]) => init?.credentials === "include")).toBe(true);
});
it("stops after one retry and clears an invalid session", async () => {
  sessionStorage.setItem("eris-access-token", "expired-fixture");
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => String(url).endsWith("/auth/refresh") ? json({ accessToken: "still-invalid" }) : json({ message: "expired" }, 401));
  await expect(getCurrentUser()).rejects.toMatchObject({ status: 401 });
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(sessionStorage.getItem("eris-access-token")).toBeNull();
});
it("does not refresh failed login or repeat credential submissions", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(json({ message: "Invalid email or password" }, 401));
  await expect(login("fixture@example.test", "fixture-only")).rejects.toMatchObject({ status: 401 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
