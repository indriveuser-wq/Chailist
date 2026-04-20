import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function StarRating({
  value,
  onChange,
  size = 22,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [popKey, setPopKey] = useState(0);
  const display = hover ?? value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = display >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => {
              if (readOnly) return;
              onChange?.(n);
              setPopKey((k) => k + 1);
            }}
            className={cn(
              "tap-shrink rounded-full p-0.5 transition-transform",
              !readOnly && "cursor-pointer hover:scale-110",
              readOnly && "cursor-default",
            )}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              key={filled && popKey ? `pop-${n}-${popKey}` : `${n}-${filled}`}
              style={{ width: size, height: size }}
              className={cn(
                "transition-all duration-300",
                filled
                  ? "fill-[var(--rating)] text-[var(--rating)] drop-shadow-[0_2px_4px_oklch(0.74_0.13_75/0.4)]"
                  : "fill-transparent text-muted-foreground/40",
                filled && !readOnly && "animate-bounce-pop",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function RatingBadge({ value, count }: { value: number; count?: number }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
      <Star className="h-3 w-3 fill-current" />
      {value > 0 ? value.toFixed(1) : "New"}
      {count !== undefined && value > 0 && (
        <span className="font-medium opacity-80">({count})</span>
      )}
    </div>
  );
}
