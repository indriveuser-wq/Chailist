import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";
import { fetchShops, type ShopWithStats } from "@/lib/queries";
import { ShopCard } from "@/components/ShopCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [shops, setShops] = useState<ShopWithStats[] | null>(null);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  useEffect(() => {
    if (user) fetchShops({ ownerId: user.id }).then(setShops);
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold">My shops</h1>
            <p className="text-sm text-muted-foreground">Manage your tea shop listings.</p>
          </div>
          <Button asChild className="gap-1.5">
            <Link to="/shops/new">
              <PlusCircle className="h-4 w-4" /> Add shop
            </Link>
          </Button>
        </div>

        <div className="mt-6">
          {shops === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : shops.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <p className="text-4xl">🍵</p>
              <h3 className="mt-2 font-display text-lg font-semibold">No shops yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first tea shop to get started.
              </p>
              <Button asChild className="mt-4">
                <Link to="/shops/new">Add a shop</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((s) => (
                <ShopCard key={s.id} shop={s} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
