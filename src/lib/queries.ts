import { supabase } from "@/integrations/supabase/client";

export type Shop = {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  location: string;
  price_range: "low" | "medium" | "high";
  starting_price: number;
  tags: string[];
  image_url: string | null;
  verified: boolean;
  approved: boolean;
  created_at: string;
  open_time: string | null;
  close_time: string | null;
  open_days: number[];
  mobile_number: string | null;
};

export type ShopWithStats = Shop & { avg_rating: number; rating_count: number };

export type TeaWithStats = {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  avg_rating: number;
  rating_count: number;
};

export async function fetchTeasWithStats(shopId: string): Promise<TeaWithStats[]> {
  const { data: teas } = await supabase
    .from("tea_items")
    .select("id, shop_id, name, price")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: true });
  if (!teas || teas.length === 0) return [];
  const { data: stats } = await supabase
    .from("tea_stats")
    .select("*")
    .in("tea_id", teas.map((t) => t.id));
  const map = new Map((stats ?? []).map((s: any) => [s.tea_id, s]));
  return teas.map((t) => {
    const s: any = map.get(t.id);
    return {
      ...t,
      price: Number(t.price),
      avg_rating: Number(s?.avg_rating ?? 0),
      rating_count: Number(s?.rating_count ?? 0),
    };
  });
}

export async function fetchShopImages(shopId: string): Promise<string[]> {
  const { data } = await supabase
    .from("shop_images")
    .select("url, sort_order")
    .eq("shop_id", shopId)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((r: any) => r.url as string);
}

export async function fetchShops(opts?: {
  includeUnapproved?: boolean;
  ownerId?: string;
}): Promise<ShopWithStats[]> {
  let q = supabase.from("shops").select("*").order("created_at", { ascending: false });
  if (opts?.ownerId) q = q.eq("owner_id", opts.ownerId);
  else if (!opts?.includeUnapproved) q = q.eq("approved", true);

  const { data: shops, error } = await q;
  if (error) throw error;
  if (!shops || shops.length === 0) return [];

  const { data: stats } = await supabase
    .from("shop_stats")
    .select("*")
    .in("shop_id", shops.map((s) => s.id));

  const map = new Map((stats ?? []).map((s: any) => [s.shop_id, s]));
  return shops.map((s) => {
    const st: any = map.get(s.id);
    return {
      ...(s as Shop),
      avg_rating: Number(st?.avg_rating ?? 0),
      rating_count: Number(st?.rating_count ?? 0),
    };
  });
}

export async function fetchShop(id: string): Promise<ShopWithStats | null> {
  const { data, error } = await supabase.from("shops").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: stats } = await supabase
    .from("shop_stats")
    .select("*")
    .eq("shop_id", id)
    .maybeSingle();
  return {
    ...(data as Shop),
    avg_rating: Number((stats as any)?.avg_rating ?? 0),
    rating_count: Number((stats as any)?.rating_count ?? 0),
  };
}
