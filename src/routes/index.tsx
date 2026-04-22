import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ShopCard, ShopCardSkeleton } from "@/components/ShopCard";
import { MoodChips, MOODS } from "@/components/MoodChips";
import { fetchShops, type ShopWithStats } from "@/lib/queries";
import { Logo, Wordmark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { Search, ChevronRight, Sparkles, Bell, MapPin, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { HeroSlider } from "@/components/HeroSlider";
import slideStall from "@/assets/slide-stall.jpg";
import slideScenic from "@/assets/slide-scenic.jpg";
import slideCafe from "@/assets/slide-cafe.jpg";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "ChaiList — Discover & Rate Tea Shops" },
      {
        name: "description",
        content: "Find the coziest chai spots near you. Browse, save, and rate tea shops on ChaiList.",
      },
    ],
  }),
});

function Home() {
  const [shops, setShops] = useState<ShopWithStats[] | null>(null);
  const [search, setSearch] = useState("");
  const [mood, setMood] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchShops().then(setShops).catch(console.error);
  }, []);

  const moodTag = useMemo(() => MOODS.find((m) => m.id === mood)?.tag ?? null, [mood]);

  const filtered = useMemo(() => {
    if (!shops) return [];
    return shops.filter((s) => {
      if (search && !`${s.name} ${s.location}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (moodTag && !s.tags.includes(moodTag)) return false;
      return true;
    });
  }, [shops, search, moodTag]);

  const topRated = useMemo(
    () => (shops ?? []).filter((s) => s.rating_count > 0).sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 5),
    [shops],
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-background pb-24">
      {/* ────── DESKTOP TOP BAR (Blinkit-inspired) ────── */}
      <header className="hidden md:block sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={36} />
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2 border-l border-border pl-6">
            <MapPin className="h-4 w-4 text-primary" />
            <div className="leading-tight">
              <p className="text-[11px] font-bold">Delivering near you</p>
              <p className="text-xs text-muted-foreground">Tap to set location ▾</p>
            </div>
          </div>
          <Link
            to="/explore"
            className="ml-2 flex flex-1 items-center gap-3 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary/70"
          >
            <Search className="h-4 w-4" />
            <span>Search "masala chai", shops, locations…</span>
          </Link>
          {user ? (
            <Link to="/profile" className="text-sm font-semibold hover:text-primary">
              Profile
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-semibold hover:text-primary">
              Login
            </Link>
          )}
          <Link
            to="/shops/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
          >
            <ShoppingBag className="h-4 w-4" /> Add shop
          </Link>
        </div>
      </header>

      {/* ────── MOBILE TOP HEADER (existing) ────── */}
      <header className="px-4 pt-5 sm:pt-6 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={36} />
            <div className="leading-tight">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {greeting}
              </p>
              <Wordmark />
            </div>
          </div>
          <button
            className="tap-shrink relative flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-[var(--shadow-soft)]"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
          </button>
        </div>

        <h1 className="mt-4 font-display text-xl font-extrabold leading-tight sm:mt-5 sm:text-2xl">
          Find your <span className="text-primary">perfect cup</span>
          <br />
          of chai today.
        </h1>

        {/* Engaging hero slides */}
        <div className="mt-4 sm:mt-5">
          <HeroSlider />
        </div>

        {/* Search */}
        <Link
          to="/explore"
          className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-soft)] tap-shrink"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search shops, locations, vibes…</span>
        </Link>
      </header>

      {/* ────── DESKTOP HERO + PROMO TILES ────── */}
      <section className="hidden md:block px-6 pt-6">
        <div className="overflow-hidden rounded-3xl bg-[var(--gradient-hero)] shadow-[var(--shadow-elevated)]">
          <div className="grid grid-cols-2 items-center gap-6 p-8">
            <div className="text-primary-foreground">
              <h2 className="font-display text-4xl font-extrabold leading-tight lg:text-5xl">
                Stock up on the<br />coziest cups of chai
              </h2>
              <p className="mt-3 max-w-md text-base opacity-90">
                Discover farm-fresh tea, iconic street stalls and warm cafés near you — rated by real chai lovers.
              </p>
              <Link
                to="/explore"
                className="tap-shrink mt-5 inline-flex items-center gap-1.5 rounded-xl bg-background px-5 py-3 text-sm font-bold text-foreground shadow-[var(--shadow-soft)]"
              >
                Explore shops <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative h-56 lg:h-64">
              <HeroSlider />
            </div>
          </div>
        </div>

        {/* Promo tiles row (Blinkit-style) */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          {[
            {
              title: "Iconic chai stalls",
              sub: "Street favorites near you",
              cta: "Browse",
              img: slideStall,
              bg: "from-[#2F5D50] to-[#1f3f37]",
            },
            {
              title: "Cozy tea cafés",
              sub: "Warm corners to unwind",
              cta: "Visit",
              img: slideCafe,
              bg: "from-[#C89B3C] to-[#8a6a23]",
            },
            {
              title: "Tea with a view",
              sub: "Scenic escapes for tea lovers",
              cta: "Discover",
              img: slideScenic,
              bg: "from-[#6B4F3A] to-[#3f2d20]",
            },
          ].map((t) => (
            <Link
              to="/explore"
              key={t.title}
              className={`tap-shrink relative flex h-44 overflow-hidden rounded-2xl bg-gradient-to-br ${t.bg} p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]`}
            >
              <div className="relative z-10 flex max-w-[55%] flex-col text-white">
                <h3 className="font-display text-lg font-extrabold leading-tight">{t.title}</h3>
                <p className="mt-1 text-xs opacity-90">{t.sub}</p>
                <span className="mt-auto inline-flex w-fit items-center rounded-md bg-white px-3 py-1.5 text-xs font-bold text-foreground">
                  {t.cta}
                </span>
              </div>
              <img
                src={t.img}
                alt=""
                className="absolute right-0 top-0 h-full w-2/5 object-cover opacity-90"
                loading="lazy"
              />
              <div className="absolute inset-y-0 left-1/2 w-24 bg-gradient-to-r from-transparent to-black/0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Mood categories */}
      <section className="mt-6 px-4 md:px-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-lg font-bold">Tea moods</h2>
          <span className="text-xs text-muted-foreground">Pick a vibe</span>
        </div>
        <MoodChips active={mood} onChange={setMood} />
      </section>

      {/* Top rated horizontal */}
      {topRated.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between px-4 md:px-6">
            <h2 className="flex items-center gap-1.5 font-display text-lg font-bold">
              <Sparkles className="h-4 w-4 text-accent" />
              Top rated near you
            </h2>
          </div>
          <div className="no-scrollbar -mr-4 overflow-x-auto pl-4 pr-4 md:-mr-6 md:pl-6 md:pr-6">
            <div className="flex gap-3">
              {topRated.map((s, i) => (
                <Link
                  key={s.id}
                  to="/shops/$shopId"
                  params={{ shopId: s.id }}
                  className="tap-shrink relative block w-64 shrink-0 animate-fade-up overflow-hidden rounded-2xl shadow-[var(--shadow-card)]"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
                    {s.image_url && (
                      <img
                        src={s.image_url}
                        alt={s.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-[var(--gradient-overlay)]" />
                  <div className="absolute inset-x-3 bottom-3 text-primary-foreground">
                    <div className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                      ★ {s.avg_rating.toFixed(1)}
                    </div>
                    <h3 className="mt-1.5 font-display text-base font-bold leading-tight text-white drop-shadow">
                      {s.name}
                    </h3>
                    <p className="text-xs text-white/90 drop-shadow">{s.location}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All shops */}
      <section className="mt-6 px-4 md:px-6">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-lg font-bold">
            {moodTag ? `${MOODS.find((m) => m.id === mood)?.label} spots` : "All tea shops"}
          </h2>
          <Link to="/explore" className="tap-shrink inline-flex items-center text-xs font-semibold text-primary">
            See all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {shops === null ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-4xl">🍵</p>
            <h3 className="mt-2 font-display text-base font-bold">No shops match this mood</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try another vibe above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.slice(0, 8).map((s, i) => (
              <ShopCard key={s.id} shop={s} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* sign-in CTA */}
      {!user && (
        <section className="mt-8 px-4 md:px-6">
          <div className="overflow-hidden rounded-2xl bg-[var(--gradient-hero)] p-5 text-primary-foreground shadow-[var(--shadow-elevated)]">
            <h3 className="font-display text-lg font-bold">Save your favorites</h3>
            <p className="mt-1 text-sm opacity-90">Sign in to rate shops and build your tea map.</p>
            <Link
              to="/login"
              className="tap-shrink mt-3 inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground"
            >
              Get started <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      )}

      <BottomNav />
    </div>
  );
}

// Hidden Input import keeps tree-shake happy if reused elsewhere
void Input;
