import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each([
    ["/preview/admin/users/1", "/preview/admin/users_/$id"],
    ["/preview/hr/employees/1", "/preview/hr/employees_/$id"],
    ["/preview/hr/employees/1/edit", "/preview/hr/employees_/$id_/edit"],
    ["/preview/hr/engagement/101", "/preview/hr/engagement_/$id"],
    ["/preview/employee/my-surveys/101", "/preview/employee/my-surveys_/$id"],
  ])("renders %s as an independent detail page", (pathname, routeId) => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const matches = router.matchRoutes(pathname);

    expect(matches.at(-1)?.routeId).toBe(routeId);
    expect(matches.some((match) => match.routeId === routeId.split("_/")[0])).toBe(false);
  });
});
