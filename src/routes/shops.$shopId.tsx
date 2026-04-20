import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { fetchShop, type ShopWithStats } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StarRating, RatingBadge } from "@/components/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, BadgeCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shops/$shopId")({
  component: ShopDetail,
});

type Tea = { id: string; name: string; price: number };
type Review = {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_id: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
};

function ShopDetail() {
  const { shopId } = useParams({ from: "/shops/$shopId" });
  const { user } = useAuth();
  const [shop, setShop] = useState<ShopWithStats | null>(null);
  const [teas, setTeas] = useState<Tea[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myRating, setMyRating] = useState<number>(0);
  const [myText, setMyText] = useState("");
  const [existing, setExisting] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const s = await fetchShop(shopId);
    setShop(s);
    const { data: t } = await supabase.from("tea_items").select("*").eq("shop_id", shopId);
    setTeas((t ?? []) as Tea[]);
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
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, user?.id]);

  async function submitRating() {
    if (!user) return;
    if (!myRating) return toast.error("Pick a star rating");
    const payload = {
      user_id: user.id,
      shop_id: shopId,
      rating: myRating,
      review_text: myText.trim() || null,
    };
    const { error } = await supabase
      .from("ratings")
      .upsert(payload, { onConflict: "user_id,shop_id" });
    if (error) return toast.error(error.message);
    toast.success(existing ? "Review updated" : "Thanks for rating!");
    reload();
  }

  if (loading)
    return (
      <div>
        <Header />
        <div className="mx-auto max-w-3xl animate-pulse p-4">
          <div className="aspect-[16/9] rounded-xl bg-muted" />
          <div className="mt-4 h-6 w-2/3 rounded bg-muted" />
        </div>
      </div>
    );
  if (!shop)
    return (
      <div>
        <Header />
        <div className="p-10 text-center text-muted-foreground">Shop not found.</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-3xl px-0 sm:px-4">
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:mt-4 sm:rounded-2xl">
          {shop.image_url ? (
            <img src={shop.image_url} alt={shop.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--gradient-warm)] text-7xl">🍵</div>
          )}
          <Link
            to="/"
            className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div className="px-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-extrabold">
                {shop.name}
                {shop.verified && (
                  <BadgeCheck className="ml-1 inline h-5 w-5 text-primary" />
                )}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {shop.location}
              </p>
            </div>
            <RatingBadge value={shop.avg_rating} count={shop.rating_count} />
          </div>
          {shop.description && (
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{shop.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shop.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Tea menu */}
        <section className="mt-6 px-4">
          <h2 className="font-display text-lg font-bold">Tea menu</h2>
          {teas.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Menu coming soon.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-card">
              {teas.map((t) => (
                <li key={t.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <span>{t.name}</span>
                  <span className="font-semibold">₹{Number(t.price).toFixed(0)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Rate */}
        <section className="mt-6 px-4">
          <h2 className="font-display text-lg font-bold">
            {existing ? "Your rating" : "Rate this shop"}
          </h2>
          {!user ? (
            <div className="mt-2 rounded-xl border border-dashed border-border p-4 text-center text-sm">
              <Link to="/login" className="text-primary underline">
                Sign in
              </Link>{" "}
              to leave a rating.
            </div>
          ) : (
            <div className="mt-2 rounded-xl border border-border bg-card p-4">
              <StarRating value={myRating} onChange={setMyRating} size={28} />
              <Textarea
                value={myText}
                onChange={(e) => setMyText(e.target.value)}
                placeholder="Share what you loved (optional)"
                className="mt-3"
                maxLength={1000}
              />
              <Button onClick={submitRating} className="mt-3 w-full sm:w-auto">
                {existing ? "Update review" : "Submit review"}
              </Button>
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="mt-6 px-4 pb-10">
          <h2 className="font-display text-lg font-bold">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Be the first to review!</p>
          ) : (
            <ul className="mt-2 space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {r.profiles?.display_name ?? "Anonymous"}
                    </span>
                    <StarRating value={r.rating} readOnly size={14} />
                  </div>
                  {r.review_text && (
                    <p className="mt-1 text-sm text-foreground/85">{r.review_text}</p>
                  )}
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
