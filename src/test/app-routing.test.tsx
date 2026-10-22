import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  const routerFor = () => createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it("matches a page for / instead of falling back to not found", () => {
    const matches = routerFor().matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it.each([
    ["/shop", "/shop"],
    ["/checkout", "/checkout"],
    ["/auth", "/auth"],
    ["/dashboard", "/dashboard"],
    ["/ibuzz-dashboard", "/ibuzz-dashboard"],
    ["/account", "/account"],
    ["/admin", "/admin"],
  ])("matches the expected route for %s", (url, expectedRouteId) => {
    const matches = routerFor().matchRoutes(url);
    expect(matches.at(-1)?.routeId).toBe(expectedRouteId);
  });

  it("keeps customer and owner dashboards excluded from the sitemap", () => {
    const router = routerFor();
    expect(router.routesById["/dashboard"]?.options.staticData?.sitemap).toBe("exclude-subtree");
    expect(router.routesById["/ibuzz-dashboard"]?.options.staticData?.sitemap).toBe("exclude-subtree");
    expect(router.routesById["/account"]?.options.staticData?.sitemap).toBe("exclude-subtree");
    expect(router.routesById["/admin"]?.options.staticData?.sitemap).toBe("exclude-subtree");
  });
});
