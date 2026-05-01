import { createFileRoute, Link, Outlet, useParams, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { fetchShop, fetchShopImages, fetchTeasWithStats, type ShopWithStats, type TeaWithStats } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, BadgeCheck, ArrowLeft, Star, MessageSquare, Pencil, Clock, Phone } from "lucide-react";
import { toast } from "sonner";
import { FavoriteButton } from "@/components/FavoriteButton";
import { BottomNav } from "@/components/BottomNav";
import { TeaRow } from "@/components/TeaRatingPopover";
import { ShopGallery } from "@/components/ShopGallery";
import { getOpenStatus, DAY_LABELS } from "@/lib/hours";

export const Route = createFileRoute("/shops/$shopId")({
  component: ShopDetail,
  loader: ({ params }) => fetchShop(params.shopId),
});

type Review = {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_id: string;
  profile?: { display_name: string | null; avatar_url: string | null } | null;
};

const PRICE_LABEL: Record<string, string> = { low: "₹", medium: "₹₹", high: "₹₹₹" };

function ShopDetail() {
  const { shopId } = useParams({ from: "/shops/$shopId" });
  const { pathname } = useLocation();
  const isChildRoute = /\/shops\/[^/]+\/(edit|menu)(\/|$)/.test(pathname);
  const { user, isAdmin } = useAuth();
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

  if (isChildRoute) {
    return <Outlet />;
  }

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
      .select("id, rating, review_text, created_at, user_id")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });
    const rows = (r ?? []) as Omit<Review, "profile">[];
    // No FK between ratings.user_id and profiles → fetch profiles in a 2nd query.
    let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    const userIds = Array.from(new Set(rows.map((x) => x.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);
      profileMap = new Map((profs ?? []).map((p: any) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]));
    }
    const merged: Review[] = rows.map((x) => ({ ...x, profile: profileMap.get(x.user_id) ?? null }));
    setReviews(merged);
    if (user) {
      const mine = rows.find((x) => x.user_id === user.id);
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
        <BottomNav />
        <div className="aspect-[4/3] animate-pulse bg-muted" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
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
      <BottomNav />
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
      <div ref={heroRef} className="relative h-[48vh] min-h-[300px] overflow-hidden md:h-[44vh] md:min-h-[360px]">
        <ShopGallery
          images={gallery}
          alt={shop.name}
          active={activeImg}
          onChange={setActiveImg}
          scrollY={scrollY}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background" />

        {/* Top controls */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-4">
          <Link
            to="/"
            className="tap-shrink pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-background/85 backdrop-blur shadow-[var(--shadow-soft)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="pointer-events-auto relative z-10 flex items-center gap-2">
            {user && (shop.owner_id === user.id || isAdmin) && (
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
          <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex justify-center gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={() => setActiveImg(i)}
                className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                  i === activeImg ? "w-6 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Floating title card */}
        <div className="pointer-events-none absolute inset-x-3 bottom-4 z-20 animate-fade-up rounded-2xl bg-card/95 p-3.5 shadow-[var(--shadow-elevated)] backdrop-blur sm:inset-x-4 sm:bottom-6 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg font-extrabold leading-tight sm:text-xl">
                {shop.name}
                {shop.verified && <BadgeCheck className="ml-1 inline h-4 w-4 text-primary sm:h-5 sm:w-5" />}
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

        {/* Hours & contact */}
        <section className="mt-5 animate-fade-up">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-display text-sm font-bold">Hours</span>
              </div>
              {(() => {
                const s = getOpenStatus(shop.open_time, shop.close_time, shop.open_days);
                return (
                  <p
                    className={`mt-1 text-xs font-semibold ${
                      s.isOpen ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {s.label}
                  </p>
                );
              })()}
              {shop.open_days && shop.open_days.length > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Open: {shop.open_days.map((d) => DAY_LABELS[d]).join(", ")}
                </p>
              )}
            </div>
            {shop.mobile_number && (
              <a
                href={`tel:${shop.mobile_number.replace(/\s+/g, "")}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)] tap-shrink"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-display text-sm font-bold">Call shop</span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/80">{shop.mobile_number}</p>
                </div>
                <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                  Call
                </span>
              </a>
            )}
          </div>
        </section>

        {/* Tea menu */}
        <section className="mt-6 animate-fade-up">
          <h2 className="mb-2 font-display text-base font-bold">Tea menu</h2>
          {teas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Menu coming soon.</p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
              {teas.map((t, i) => (
                <TeaRow
                  key={t.id}
                  teaId={t.id}
                  name={t.name}
                  price={t.price}
                  avg={t.avg_rating}
                  count={t.rating_count}
                  onRated={reload}
                  isLast={i === teas.length - 1}
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
                const initial = (r.profile?.display_name ?? "A").slice(0, 1).toUpperCase();
                return (
                  <li
                    key={r.id}
                    className="animate-fade-up rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]"
                    style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {r.profile?.avatar_url ? (
                          <img
                            src={r.profile.avatar_url}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                            {initial}
                          </div>
                        )}
                        <span className="text-sm font-semibold">
                          {r.profile?.display_name ?? "Anonymous"}
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
    </div>
  );
}
