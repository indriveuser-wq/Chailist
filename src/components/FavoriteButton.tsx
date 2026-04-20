import { useEffect, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function FavoriteButton({
  shopId,
  className,
  variant = "overlay",
}: {
  shopId: string;
  className?: string;
  variant?: "overlay" | "ghost";
}) {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!user) return setFav(false);
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("shop_id", shopId)
      .maybeSingle()
      .then(({ data }) => setFav(!!data));
  }, [user, shopId]);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
        toast.info("Sign in to save favorites");
        return;
      }
      setPulse((n) => n + 1);
      if (fav) {
        setFav(false);
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("shop_id", shopId);
      } else {
        setFav(true);
        await supabase.from("favorites").insert({ user_id: user.id, shop_id: shopId });
      }
    },
    [fav, user, shopId],
  );

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "tap-shrink inline-flex h-9 w-9 items-center justify-center rounded-full transition",
        variant === "overlay" && "bg-background/85 backdrop-blur shadow-[var(--shadow-soft)] hover:bg-background",
        variant === "ghost" && "hover:bg-secondary",
        className,
      )}
    >
      <Heart
        key={pulse}
        className={cn("h-4 w-4 transition-colors", fav ? "fill-destructive text-destructive animate-heart" : "text-foreground/70")}
        strokeWidth={2.25}
      />
    </button>
  );
}
