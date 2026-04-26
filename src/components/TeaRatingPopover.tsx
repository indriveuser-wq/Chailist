import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function TeaRatingPopover({
  teaId,
  onRated,
  onClose,
}: {
  teaId: string;
  onRated: () => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tea_ratings")
      .select("rating")
      .eq("tea_id", teaId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => data && setRating(data.rating));
  }, [teaId, user]);

  async function submit(value: number) {
    if (!user) return toast.error("Sign in to rate");
    setLoading(true);
    const { error } = await supabase
      .from("tea_ratings")
      .upsert({ user_id: user.id, tea_id: teaId, rating: value }, { onConflict: "user_id,tea_id" });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Tea rated!");
    setRating(value);
    onRated();
    setTimeout(onClose, 350);
  }

  const display = hover ?? rating;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-elevated)]"
    >
      <p className="mb-2 text-center text-xs font-semibold text-muted-foreground">Rate this tea</p>
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = display >= n;
          return (
            <button
              key={n}
              type="button"
              disabled={loading}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              onClick={() => submit(n)}
              className="tap-shrink p-0.5"
              aria-label={`${n} stars`}
            >
              <Star
                className={`h-6 w-6 transition-all ${filled ? "fill-[var(--rating)] text-[var(--rating)]" : "fill-transparent text-muted-foreground/40"}`}
              />
            </button>
          );
        })}
      </div>
      <Button type="button" variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={onClose}>
        Close
      </Button>
    </motion.div>
  );
}

export function TeaRatingTrigger({
  avg,
  count,
}: {
  avg: number;
  count: number;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">
      <Star className="h-3 w-3 fill-[var(--rating)] text-[var(--rating)]" />
      {avg > 0 ? avg.toFixed(1) : "Rate"}
      {count > 0 && <span className="font-medium opacity-70">({count})</span>}
    </span>
  );
}

export function TeaRow({
  teaId,
  name,
  price,
  avg,
  count,
  onRated,
  isLast,
}: {
  teaId: string;
  name: string;
  price: number;
  avg: number;
  count: number;
  onRated: () => void;
  isLast?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="relative flex items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/40">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary/80 px-2 py-0.5 text-[11px] font-bold text-secondary-foreground transition hover:bg-secondary"
        >
          <Star className="h-3 w-3 fill-[var(--rating)] text-[var(--rating)]" />
          {avg > 0 ? avg.toFixed(1) : "Rate"}
          {count > 0 && <span className="font-medium opacity-70">({count})</span>}
        </button>
      </div>
      <span className="font-bold text-primary">₹{price.toFixed(0)}</span>
      <AnimatePresence>
        {open && (
          <TeaRatingPopover
            teaId={teaId}
            onRated={onRated}
            onClose={() => setOpen(false)}
            placement={isLast ? "top" : "bottom"}
          />
        )}
      </AnimatePresence>
    </li>
  );
}