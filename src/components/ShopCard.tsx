import { Link } from "@tanstack/react-router";
import { MapPin, BadgeCheck } from "lucide-react";
import { RatingBadge } from "./StarRating";
import type { ShopWithStats } from "@/lib/queries";

export function ShopCard({ shop }: { shop: ShopWithStats }) {
  return (
    <Link
      to="/shops/$shopId"
      params={{ shopId: shop.id }}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {shop.image_url ? (
          <img
            src={shop.image_url}
            alt={shop.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--gradient-warm)] text-4xl">🍵</div>
        )}
        <div className="absolute right-2 top-2">
          <RatingBadge value={shop.avg_rating} count={shop.rating_count} />
        </div>
        {shop.verified && (
          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-0.5 text-xs font-medium text-primary backdrop-blur">
            <BadgeCheck className="h-3 w-3" /> Verified
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-1 font-display text-base font-semibold">{shop.name}</h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{shop.location}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {shop.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2 text-xs">
          <span className="text-muted-foreground">Tea from</span>
          <span className="font-semibold text-foreground">₹{Number(shop.starting_price).toFixed(0)}</span>
        </div>
      </div>
    </Link>
  );
}
