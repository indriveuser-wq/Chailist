import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { ShopCard, ShopCardSkeleton } from "@/components/ShopCard";
import type { ShopWithStats } from "@/lib/queries";
import { fetchShops } from "@/lib/queries";
import { Logo, Wordmark } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Heart, LogOut, Store, Star, Plus, Pencil } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: Profile,
  head: () => ({ meta: [{ title: "Profile — ChaiList" }] }),
});

function Profile() {
  const { user, signOut, loading } = useAuth();
  const nav = useNavigate();
  const [favorites, setFavorites] = useState<ShopWithStats[] | null>(null);
  const [myShops, setMyShops] = useState<ShopWithStats[] | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: favRows } = await supabase
        .from("favorites")
        .select("shop_id")
        .eq("user_id", user.id);
      const ids = (favRows ?? []).map((r) => r.shop_id);
      if (ids.length) {
        const all = await fetchShops();
        setFavorites(all.filter((s) => ids.includes(s.id)));
      } else setFavorites([]);

      // Always check for owned shops (RLS lets owner see their own).
      fetchShops({ ownerId: user.id }).then(setMyShops).catch(() => setMyShops([]));

      const { count } = await supabase
        .from("ratings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setReviewCount(count ?? 0);

      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(prof);
    })();
  }, [user]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="px-6 pt-20 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Logo size={56} />
          </div>
          <h1 className="font-display text-2xl font-extrabold">
            Welcome to <Wordmark />
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to save favorites, write reviews and add tea shops.
          </p>
          <Button
            className="mt-6 w-full gap-2"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error(error.message);
            }}
          >
            <GoogleIcon /> Continue with Google
          </Button>
          <Link to="/" className="mt-4 inline-block text-xs text-muted-foreground hover:text-foreground">
            Maybe later
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const name = profile?.display_name || user.email?.split("@")[0] || "Tea lover";
  const initials = name.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-[var(--gradient-hero)] px-4 pb-8 pt-10 text-primary-foreground">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={name}
              className="h-16 w-16 rounded-full object-cover ring-4 ring-white/20"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground ring-4 ring-white/20">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-extrabold">{name}</h1>
            <p className="truncate text-xs opacity-80">{user.email}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="Reviews" value={reviewCount} icon={<Star className="h-4 w-4" />} />
          <Stat label="Favorites" value={favorites?.length ?? 0} icon={<Heart className="h-4 w-4" />} />
          <Stat label="My shops" value={myShops?.length ?? 0} icon={<Store className="h-4 w-4" />} />
        </div>
      </div>

      {/* Favorites */}
      <section className="mt-6 px-4">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <Heart className="h-4 w-4 text-destructive" /> Your favorites
        </h2>
        {favorites === null ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ShopCardSkeleton />
            <ShopCardSkeleton />
          </div>
        ) : favorites.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Tap the heart on any shop to save it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {favorites.map((s, i) => (
              <ShopCard key={s.id} shop={s} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* My shops */}
      {myShops && myShops.length > 0 && (
        <section className="mt-6 px-4">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Store className="h-4 w-4 text-primary" /> Your shops
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {myShops.map((s, i) => (
              <ShopCard key={s.id} shop={s} index={i} />
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 px-4">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={async () => {
            await signOut();
            nav({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[11px] uppercase opacity-80">{icon}{label}</div>
      <div className="mt-0.5 font-display text-xl font-extrabold">{value}</div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}
