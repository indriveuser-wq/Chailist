import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck, Star } from "lucide-react";
import type { ShopWithStats } from "@/lib/queries";
import { FavoriteButton } from "./FavoriteButton";

const PRICE_LABEL: Record<string, string> = { low: "₹", medium: "₹₹", high: "₹₹₹" };

export function ShopCard({ shop, index = 0 }: { shop: ShopWithStats; index?: number }) {
  return (
    <Link
      to="/shops/$shopId"
      params={{ shopId: shop.id }}
      className="group block animate-fade-up tap-shrink"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {shop.image_url ? (
            <img
              src={shop.image_url}
              alt={shop.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[var(--gradient-warm)] text-5xl">🍵</div>
          )}
          {/* gradient overlay */}
          <div className="absolute inset-0 bg-[var(--gradient-overlay)]" />

          {/* top row */}
          <div className="absolute inset-x-2 top-2 flex items-start justify-between">
            {shop.verified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span />
            )}
            <FavoriteButton shopId={shop.id} />
          </div>

          {/* rating badge bottom-left */}
          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground shadow-[var(--shadow-soft)]">
            <Star className="h-3 w-3 fill-current" />
            {shop.avg_rating > 0 ? shop.avg_rating.toFixed(1) : "New"}
            {shop.rating_count > 0 && (
              <span className="font-medium opacity-80">({shop.rating_count})</span>
            )}
          </div>
        </div>

        <div className="space-y-1.5 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="line-clamp-1 font-display text-base font-bold">{shop.name}</h3>
            <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-secondary-foreground">
              {PRICE_LABEL[shop.price_range] ?? "₹₹"}
            </span>
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{shop.location}</span>
          </p>
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {shop.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-secondary/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground"
              >
                {t}
              </span>
            ))}
            <span className="ml-auto text-[11px] font-semibold text-foreground/80">
              from ₹{Number(shop.starting_price).toFixed(0)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ShopCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
