import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { ShopCard, ShopCardSkeleton } from "@/components/ShopCard";
import { MoodChips, MOODS } from "@/components/MoodChips";
import { fetchShops, type ShopWithStats } from "@/lib/queries";
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

export const Route = createFileRoute("/explore")({
  component: Explore,
  head: () => ({
    meta: [
      { title: "Explore tea shops — ChaiList" },
      { name: "description", content: "Filter and sort tea shops by vibe, price and rating." },
    ],
  }),
});

function Explore() {
  const [shops, setShops] = useState<ShopWithStats[] | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<string>("any");
  const [mood, setMood] = useState("all");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchShops().then(setShops).catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("focus")) {
      // Defer to next frame so input is mounted and visible.
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, []);

  const moodTag = useMemo(() => MOODS.find((m) => m.id === mood)?.tag ?? null, [mood]);

  const filtered = useMemo(() => {
    if (!shops) return [];
    let r = shops.filter((s) => {
      if (search && !`${s.name} ${s.location}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (minRating && s.avg_rating < minRating) return false;
      if (priceRange !== "any" && s.price_range !== priceRange) return false;
      if (moodTag && !s.tags.includes(moodTag)) return false;
      return true;
    });
    if (sort === "rating") r = [...r].sort((a, b) => b.avg_rating - a.avg_rating);
    else if (sort === "price-low") r = [...r].sort((a, b) => a.starting_price - b.starting_price);
    else if (sort === "price-high") r = [...r].sort((a, b) => b.starting_price - a.starting_price);
    else r = [...r].sort((a, b) => b.rating_count - a.rating_count);
    return r;
  }, [shops, search, sort, minRating, priceRange, moodTag]);

  return (
    <div className="mx-auto min-h-screen max-w-6xl bg-background pb-24">
      <BottomNav />
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="px-4 py-3">
          <h1 className="font-display text-lg font-extrabold">Explore</h1>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-soft)]">
            <Search className="ml-2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
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
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <label className="text-sm font-semibold">Min rating: {minRating || "any"}</label>
                    <Slider
                      value={[minRating]}
                      onValueChange={([v]) => setMinRating(v)}
                      max={5}
                      step={1}
                      className="mt-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Price range</label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {["any", "low", "medium", "high"].map((p) => (
                        <button
                          key={p}
                          onClick={() => setPriceRange(p)}
                          className={`tap-shrink rounded-xl border px-2 py-2 text-xs capitalize transition ${
                            priceRange === p
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card"
                          }`}
                        >
                          {p === "low" ? "₹" : p === "medium" ? "₹₹" : p === "high" ? "₹₹₹" : "Any"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        <div className="px-4 pb-3">
          <MoodChips active={mood} onChange={setMood} />
        </div>
      </header>

      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <p className="text-xs text-muted-foreground">
          {shops === null ? "Loading…" : `${filtered.length} shops`}
        </p>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
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

      {(minRating > 0 || priceRange !== "any") && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-2">
          {minRating > 0 && <Chip onClear={() => setMinRating(0)}>≥ {minRating}★</Chip>}
          {priceRange !== "any" && <Chip onClear={() => setPriceRange("any")}>{priceRange}</Chip>}
        </div>
      )}

      <main className="px-4 py-4">
        {shops === null ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-4xl">🔍</p>
            <h3 className="mt-2 font-display text-base font-bold">No matches</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing some filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((s, i) => (
              <ShopCard key={`${s.id}-${i}`} shop={s} index={i} />
            ))}
          </div>
        )}
      </main>

      <Hidden />
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex animate-fade-in items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
      {children}
      <button onClick={onClear} className="opacity-60 hover:opacity-100">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function Hidden() {
  // ensure Link import is referenced when needed elsewhere
  return <Link to="/" className="hidden" />;
}
