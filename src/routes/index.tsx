import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { ShopCard } from "@/components/ShopCard";
import { fetchShops, type ShopWithStats } from "@/lib/queries";
import heroImg from "@/assets/hero-tea.jpg";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "ChaiList — Discover & Rate Tea Shops" },
      {
        name: "description",
        content: "Find the best chai spots — filter by vibe, price, and rating. Rate your favorites.",
      },
    ],
  }),
});

const ALL_TAGS = ["cozy", "scenic", "local", "rooftop", "study", "outdoor", "premium", "street"];

function Home() {
  const [shops, setShops] = useState<ShopWithStats[] | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<string>("any");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    fetchShops().then(setShops).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (!shops) return [];
    let r = shops.filter((s) => {
      if (search && !`${s.name} ${s.location}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (minRating && s.avg_rating < minRating) return false;
      if (priceRange !== "any" && s.price_range !== priceRange) return false;
      if (selectedTags.length && !selectedTags.every((t) => s.tags.includes(t))) return false;
      return true;
    });
    if (sort === "rating") r = [...r].sort((a, b) => b.avg_rating - a.avg_rating);
    else if (sort === "price-low") r = [...r].sort((a, b) => a.starting_price - b.starting_price);
    else if (sort === "price-high") r = [...r].sort((a, b) => b.starting_price - a.starting_price);
    else r = [...r].sort((a, b) => b.rating_count - a.rating_count);
    return r;
  }, [shops, search, sort, minRating, priceRange, selectedTags]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover" width={1280} height={800} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 pb-10 pt-12 sm:pt-20">
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Find your next favorite <span className="text-primary">cup of chai</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-foreground/80 sm:text-base">
            Honest reviews of tea shops, by tea lovers like you.
          </p>
          <div className="mt-5 flex max-w-xl items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-elevated)]">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shops or locations…"
              className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Sheet>
              <SheetTrigger asChild>
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-5 py-4">
                  <div>
                    <label className="text-sm font-medium">Min rating: {minRating || "any"}</label>
                    <Slider
                      value={[minRating]}
                      onValueChange={([v]) => setMinRating(v)}
                      max={5}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Price range</label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {["any", "low", "medium", "high"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPriceRange(p)}
                          className={`rounded-md border px-2 py-1.5 text-xs capitalize transition ${
                            priceRange === p
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card"
                          }`}
                        >
                          {p === "low" ? "₹" : p === "medium" ? "₹₹" : p === "high" ? "₹₹₹" : p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vibe / tags</label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {ALL_TAGS.map((t) => {
                        const on = selectedTags.includes(t);
                        return (
                          <button
                            key={t}
                            onClick={() =>
                              setSelectedTags((s) =>
                                on ? s.filter((x) => x !== t) : [...s, t],
                              )
                            }
                            className={`rounded-full border px-3 py-1 text-xs transition ${
                              on
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      {/* Sort + chips */}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 pt-4">
        <p className="text-sm text-muted-foreground">
          {shops === null ? "Loading…" : `${filtered.length} shops`}
        </p>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most reviewed</SelectItem>
            <SelectItem value="rating">Highest rated</SelectItem>
            <SelectItem value="price-low">Price: low → high</SelectItem>
            <SelectItem value="price-high">Price: high → low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(selectedTags.length > 0 || minRating > 0 || priceRange !== "any") && (
        <div className="mx-auto flex max-w-5xl flex-wrap gap-1.5 px-4 pt-2">
          {minRating > 0 && (
            <Chip onClear={() => setMinRating(0)}>≥ {minRating}★</Chip>
          )}
          {priceRange !== "any" && (
            <Chip onClear={() => setPriceRange("any")}>{priceRange}</Chip>
          )}
          {selectedTags.map((t) => (
            <Chip key={t} onClear={() => setSelectedTags((s) => s.filter((x) => x !== t))}>
              {t}
            </Chip>
          ))}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-5">
        {shops === null ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-4xl">🍵</p>
            <h3 className="mt-2 font-display text-lg font-semibold">No shops yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Be the first to add a tea shop to ChaiList.
            </p>
            <Button asChild className="mt-4">
              <Link to="/shops/new">Add a shop</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <ShopCard key={s.id} shop={s} />
            ))}
          </div>
        )}
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Brewed with 🍵 by ChaiList
      </footer>
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
      {children}
      <button onClick={onClear} className="opacity-60 hover:opacity-100">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
