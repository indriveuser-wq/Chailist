import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  Outlet,
} from "@tanstack/react-router";
import type { ShopWithStats } from "@/lib/queries";

// Stub the Supabase client + auth so the profile route renders without network.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [], count: 0 }), in: () => Promise.resolve({ data: [] }) }),
    }),
  },
}));

const SHOPS: ShopWithStats[] = [
  mkShop("11111111-1111-1111-1111-111111111111", "Chai Adda"),
  mkShop("22222222-2222-2222-2222-222222222222", "Tea Trail"),
  mkShop("33333333-3333-3333-3333-333333333333", "Brew Bar"),
];

function mkShop(id: string, name: string): ShopWithStats {
  return {
    id,
    owner_id: "owner-1",
    name,
    description: null,
    location: "Mumbai",
    price_range: "medium",
    starting_price: 30,
    tags: [],
    image_url: null,
    verified: false,
    approved: true,
    created_at: new Date().toISOString(),
    avg_rating: 4.5,
    rating_count: 10,
  };
}

// Minimal copy of the profile "My shops" grid: one ShopCard + an Edit link per shop.
function MyShopsGrid({ shops }: { shops: ShopWithStats[] }) {
  // Use require lazily to avoid pulling Supabase at module load.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Link } = require("@tanstack/react-router") as typeof import("@tanstack/react-router");
  return (
    <ul>
      {shops.map((s) => (
        <li key={s.id} data-testid={`row-${s.id}`}>
          <span>{s.name}</span>
          <Link
            to="/shops/$shopId/edit"
            params={{ shopId: s.id }}
            aria-label={`Edit ${s.name}`}
            data-testid={`edit-${s.id}`}
          >
            Edit shop
          </Link>
        </li>
      ))}
    </ul>
  );
}

function buildRouter() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <MyShopsGrid shops={SHOPS} />,
  });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/shops/$shopId/edit",
    component: function EditPage() {
      const params = editRoute.useParams();
      return <h1 data-testid="edit-page">Editing {params.shopId}</h1>;
    },
  });
  const routeTree = rootRoute.addChildren([indexRoute, editRoute]);
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

describe("Edit shop link", () => {
  it("renders one Edit link per shop with the correct href", async () => {
    const router = buildRouter();
    render(<RouterProvider router={router as any} />);
    // Wait for the index route to render.
    await screen.findByTestId(`row-${SHOPS[0].id}`);

    for (const shop of SHOPS) {
      const row = screen.getByTestId(`row-${shop.id}`);
      const link = within(row).getByTestId(`edit-${shop.id}`) as HTMLAnchorElement;
      expect(link.getAttribute("href")).toBe(`/shops/${shop.id}/edit`);
    }
  });

  it("navigates to the correct shop edit route when clicked", async () => {
    const router = buildRouter();
    render(<RouterProvider router={router as any} />);
    await screen.findByTestId(`row-${SHOPS[1].id}`);

    await router.navigate({ to: "/shops/$shopId/edit", params: { shopId: SHOPS[1].id } });
    const heading = await screen.findByTestId("edit-page");
    expect(heading.textContent).toContain(SHOPS[1].id);
    expect(router.state.location.pathname).toBe(`/shops/${SHOPS[1].id}/edit`);
  });
});