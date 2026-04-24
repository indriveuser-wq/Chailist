import { describe, it, expect } from "vitest";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from "@tanstack/react-router";

const SHOP_IDS = [
  "11111111-1111-1111-1111-111111111111",
  "22222222-2222-2222-2222-222222222222",
  "33333333-3333-3333-3333-333333333333",
];

function buildRouter() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/shops/$shopId/edit",
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, editRoute]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

describe("Edit shop link", () => {
  it("each shopId resolves to the correct /shops/:id/edit href", () => {
    const router = buildRouter();
    for (const shopId of SHOP_IDS) {
      const loc = router.buildLocation({
        to: "/shops/$shopId/edit",
        params: { shopId },
      });
      expect(loc.pathname).toBe(`/shops/${shopId}/edit`);
    }
  });

  it("navigating to a shopId lands on that exact edit route", async () => {
    const router = buildRouter();
    await router.load();
    for (const shopId of SHOP_IDS) {
      await router.navigate({
        to: "/shops/$shopId/edit",
        params: { shopId },
      });
      await router.invalidate();
      expect(router.state.location.pathname).toBe(`/shops/${shopId}/edit`);
    }
  });
});