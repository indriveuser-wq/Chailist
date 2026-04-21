import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { fetchShop, fetchShopImages, fetchTeasWithStats, type ShopWithStats, type TeaWithStats } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, BadgeCheck, ArrowLeft, Star, MessageSquare, Pencil } from "lucide-react";
import { toast } from "sonner";
import { FavoriteButton } from "@/components/FavoriteButton";
import { BottomNav } from "@/components/BottomNav";
import { TeaRow } from "@/components/TeaRatingPopover";

export const Route = createFileRoute("/shops/$shopId")({
  component: ShopDetail,
});

type Review = {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_id: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
};

const PRICE_LABEL: Record<string, string> = { low: "₹", medium: "₹₹", high: "₹₹₹" };

function ShopDetail() {
  const { shopId } = useParams({ from: "/shops/$shopId" });
  const { user } = useAuth();
  const [shop, setShop] = useState<ShopWithStats | null>(null);
  const [teas, setTeas] = useState<TeaWithStats[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState<number>(0);
  const [myText, setMyText] = useState("");
  const [existing, setExisting] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  async function reload() {
    const s = await fetchShop(shopId);
    setShop(s);
    const [t, imgs] = await Promise.all([
      fetchTeasWithStats(shopId),
      fetchShopImages(shopId),
    ]);
    setTeas(t);
    // Combine main image with gallery, dedupe.
    const combined = [s?.image_url, ...imgs].filter(Boolean) as string[];
    setGallery(Array.from(new Set(combined)));
    const { data: r } = await supabase
      .from("ratings")
      .select("id, rating, review_text, created_at, user_id, profiles(display_name, avatar_url)")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    setReviews((r ?? []) as any);
    if (user) {
      const mine = (r ?? []).find((x: any) => x.user_id === user.id);
      if (mine) {
        setExisting(mine as any);
        setMyRating(mine.rating);
        setMyText(mine.review_text ?? "");
      } else {
        setExisting(null);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, user?.id]);

  useEffect(() => {
    const onScroll = () => {
      setScrollY(window.scrollY);
      setScrolled(window.scrollY > 220);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function submitRating() {
    if (!user) return;
    if (!myRating) return toast.error("Pick a star rating");
    const { error } = await supabase
      .from("ratings")
      .upsert(
        { user_id: user.id, shop_id: shopId, rating: myRating, review_text: myText.trim() || null },
        { onConflict: "user_id,shop_id" },
      );
    if (error) return toast.error(error.message);
    toast.success(existing ? "Review updated" : "Thanks for rating!");
    reload();
  }

  if (loading)
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="aspect-[4/3] animate-pulse bg-muted" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
        <BottomNav />
      </div>
    );
  if (!shop)
    return (
      <div className="p-10 text-center text-muted-foreground">
        Shop not found.{" "}
        <Link to="/" className="text-primary underline">
          Go home
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky compact header */}
      <header
        className={`fixed inset-x-0 top-0 z-30 transition-all duration-300 ${
          scrolled ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="glass border-b border-border/60">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Link
              to="/"
              className="tap-shrink flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-[var(--shadow-soft)]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-sm font-bold">{shop.name}</h2>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Star className="h-3 w-3 fill-accent text-accent" />
                {shop.avg_rating > 0 ? shop.avg_rating.toFixed(1) : "New"} · {shop.location}
              </p>
            </div>
            <FavoriteButton shopId={shop.id} variant="ghost" />
          </div>
        </div>
      </header>

      {/* Hero with parallax */}
      <div ref={heroRef} className="relative h-[55vh] min-h-[320px] overflow-hidden">
        {gallery[activeImg] ? (
          <img
            src={gallery[activeImg]}
            alt={shop.name}
            className="h-[120%] w-full object-cover"
            style={{ transform: `translateY(${Math.min(scrollY * 0.35, 120)}px) scale(1.05)` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--gradient-warm)] text-7xl">🍵</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />

        {/* Top controls */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-4">
          <Link
            to="/"
            className="tap-shrink flex h-10 w-10 items-center justify-center rounded-full bg-background/85 backdrop-blur shadow-[var(--shadow-soft)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            {user && shop.owner_id === user.id && (
              <Link
                to="/shops/$shopId/edit"
                params={{ shopId: shop.id }}
                className="tap-shrink flex h-10 w-10 items-center justify-center rounded-full bg-background/85 backdrop-blur shadow-[var(--shadow-soft)]"
                aria-label="Edit shop"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            )}
            <FavoriteButton shopId={shop.id} className="h-10 w-10" />
          </div>
        </div>

        {/* Image dots */}
        {gallery.length > 1 && (
          <div className="absolute inset-x-0 bottom-28 z-10 flex justify-center gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={() => setActiveImg(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeImg ? "w-6 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Floating title card */}
        <div className="absolute inset-x-4 bottom-6 animate-fade-up rounded-2xl bg-card/95 p-4 shadow-[var(--shadow-elevated)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-extrabold leading-tight">
                {shop.name}
                {shop.verified && <BadgeCheck className="ml-1 inline h-5 w-5 text-primary" />}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> {shop.location}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-sm font-bold text-accent-foreground">
                <Star className="h-3 w-3 fill-current" />
                {shop.avg_rating > 0 ? shop.avg_rating.toFixed(1) : "New"}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">{shop.rating_count} reviews</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
              {PRICE_LABEL[shop.price_range]} from ₹{Number(shop.starting_price).toFixed(0)}
            </span>
            {shop.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 pt-2">
        {/* About */}
        {shop.description && (
          <section className="animate-fade-up">
            <h2 className="mb-2 font-display text-base font-bold">About</h2>
            <p className="text-sm leading-relaxed text-foreground/85">{shop.description}</p>
          </section>
        )}

        {/* Tea menu */}
        <section className="mt-6 animate-fade-up">
          <h2 className="mb-2 font-display text-base font-bold">Tea menu</h2>
          {teas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Menu coming soon.</p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
              {teas.map((t) => (
                <TeaRow
                  key={t.id}
                  teaId={t.id}
                  name={t.name}
                  price={t.price}
                  avg={t.avg_rating}
                  count={t.rating_count}
                  onRated={reload}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Rate */}
        <section className="mt-6 animate-fade-up">
          <h2 className="mb-2 font-display text-base font-bold">
            {existing ? "Your rating" : "Rate this shop"}
          </h2>
          {!user ? (
            <div className="rounded-2xl border border-dashed border-border p-5 text-center text-sm">
              <p>
                <Link to="/login" className="font-semibold text-primary underline">
                  Sign in
                </Link>{" "}
                to leave a rating.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
              <div className="flex justify-center py-2">
                <StarRating value={myRating} onChange={setMyRating} size={36} />
              </div>
              <Textarea
                value={myText}
                onChange={(e) => setMyText(e.target.value)}
                placeholder="Share what you loved (optional)"
                className="mt-3 rounded-xl"
                maxLength={1000}
                rows={3}
              />
              <Button onClick={submitRating} className="mt-3 w-full rounded-xl">
                {existing ? "Update review" : "Submit review"}
              </Button>
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="mt-6 animate-fade-up pb-10">
          <h2 className="mb-2 flex items-center gap-1.5 font-display text-base font-bold">
            <MessageSquare className="h-4 w-4" /> Reviews ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">Be the first to review!</p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r, i) => {
                const initial = (r.profiles?.display_name ?? "A").slice(0, 1).toUpperCase();
                return (
                  <li
                    key={r.id}
                    className="animate-fade-up rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]"
                    style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {r.profiles?.avatar_url ? (
                          <img
                            src={r.profiles.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                            {initial}
                          </div>
                        )}
                        <span className="text-sm font-semibold">
                          {r.profiles?.display_name ?? "Anonymous"}
                        </span>
                      </div>
                      <StarRating value={r.rating} readOnly size={14} />
                    </div>
                    {r.review_text && (
                      <p className="mt-2 text-sm leading-relaxed text-foreground/85">{r.review_text}</p>
                    )}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
