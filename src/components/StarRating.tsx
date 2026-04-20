import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = display >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => !readOnly && onChange?.(n)}
            className={cn(
              "transition-transform",
              !readOnly && "hover:scale-110 cursor-pointer",
              readOnly && "cursor-default",
            )}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                "transition-colors",
                filled ? "fill-[var(--rating)] text-[var(--rating)]" : "fill-transparent text-muted-foreground/40",
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
    <div className="inline-flex items-center gap-1 rounded-md bg-success px-1.5 py-0.5 text-xs font-semibold text-success-foreground">
      <Star className="h-3 w-3 fill-current" />
      {value > 0 ? value.toFixed(1) : "New"}
      {count !== undefined && value > 0 && (
        <span className="ml-0.5 font-normal opacity-90">({count})</span>
      )}
    </div>
  );
}
