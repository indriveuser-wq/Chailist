import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shops_/$shopId/edit")({
  component: EditShop,
});

const TAGS = ["cozy", "scenic", "local", "rooftop", "study", "outdoor", "premium", "street"];

type Tea = { id?: string; name: string; price: string; _new?: boolean };
type GalleryImg = { id?: string; url: string; _new?: File };

function EditShop() {
  const { shopId } = useParams({ from: "/shops/$shopId/edit" });
  const { user, loading: authLoading, isAdmin } = useAuth();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [priceRange, setPriceRange] = useState<"low" | "medium" | "high">("medium");
  const [tags, setTags] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [gallery, setGallery] = useState<GalleryImg[]>([]);
  const [teas, setTeas] = useState<Tea[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [removedTeaIds, setRemovedTeaIds] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data: shop, error } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .maybeSingle();
      if (error || !shop) {
        toast.error("Shop not found");
        nav({ to: "/" });
        return;
      }
      if (shop.owner_id !== user.id && !isAdmin) {
        toast.error("Not your shop");
        nav({ to: "/shops/$shopId", params: { shopId } });
        return;
      }
      setName(shop.name);
      setLocation(shop.location);
      setDescription(shop.description ?? "");
      setStartingPrice(String(shop.starting_price));
      setPriceRange(shop.price_range as any);
      setTags(shop.tags ?? []);
      setMainImage(shop.image_url);
      const [{ data: imgs }, { data: ts }] = await Promise.all([
        supabase.from("shop_images").select("id, url").eq("shop_id", shopId).order("sort_order"),
        supabase.from("tea_items").select("id, name, price").eq("shop_id", shopId).order("created_at"),
      ]);
      setGallery((imgs ?? []).map((i: any) => ({ id: i.id, url: i.url })));
      setTeas((ts ?? []).map((t: any) => ({ id: t.id, name: t.name, price: String(t.price) })));
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, user?.id, authLoading]);

  function onPickMain(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setMainImageFile(f);
    setMainImage(URL.createObjectURL(f));
  }

  function onPickGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
    if (valid.length !== files.length) toast.error("Some images skipped (>5MB)");
    setGallery((g) => [...g, ...valid.map((f) => ({ url: URL.createObjectURL(f), _new: f }))]);
    e.target.value = "";
  }

  function removeGalleryItem(idx: number) {
    setGallery((g) => {
      const item = g[idx];
      if (item.id) setRemovedImageIds((r) => [...r, item.id!]);
      return g.filter((_, i) => i !== idx);
    });
  }

  function removeTea(idx: number) {
    setTeas((s) => {
      const item = s[idx];
      if (item.id) setRemovedTeaIds((r) => [...r, item.id!]);
      return s.filter((_, i) => i !== idx);
    });
  }

  async function uploadOne(f: File): Promise<string | null> {
    if (!user) return null;
    const ext = f.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("shop-images").upload(path, f);
    if (error) {
      toast.error(error.message);
      return null;
    }
    return supabase.storage.from("shop-images").getPublicUrl(path).data.publicUrl;
  }

  async function save() {
    if (!user) return;
    setSubmitting(true);
    try {
      let image_url = mainImage;
      if (mainImageFile) {
        const u = await uploadOne(mainImageFile);
        if (u) image_url = u;
      }

      const { error: upErr } = await supabase
        .from("shops")
        .update({
          name: name.trim(),
          location: location.trim(),
          description: description.trim() || null,
          starting_price: Number(startingPrice || 0),
          price_range: priceRange,
          tags,
          image_url,
        })
        .eq("id", shopId);
      if (upErr) throw upErr;

      // Gallery: delete removed
      if (removedImageIds.length) {
        await supabase.from("shop_images").delete().in("id", removedImageIds);
      }
      // Upload + insert new gallery
      const newImgs = gallery.filter((g) => g._new);
      for (let i = 0; i < newImgs.length; i++) {
        const url = await uploadOne(newImgs[i]._new!);
        if (url) {
          await supabase
            .from("shop_images")
            .insert({ shop_id: shopId, url, sort_order: gallery.indexOf(newImgs[i]) });
        }
      }

      // Teas: delete removed
      if (removedTeaIds.length) {
        await supabase.from("tea_items").delete().in("id", removedTeaIds);
      }
      // Upsert remaining
      for (const t of teas) {
        if (!t.name.trim() || !t.price.trim()) continue;
        if (t.id) {
          await supabase
            .from("tea_items")
            .update({ name: t.name.trim(), price: Number(t.price) })
            .eq("id", t.id);
        } else {
          await supabase
            .from("tea_items")
            .insert({ shop_id: shopId, name: t.name.trim(), price: Number(t.price) });
        }
      }

      toast.success("Shop updated");
      nav({ to: "/shops/$shopId", params: { shopId } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteShop() {
    setSubmitting(true);
    const { error } = await supabase.from("shops").delete().eq("id", shopId);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Shop deleted");
    nav({ to: "/profile" });
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <BottomNav />
        <div className="mx-auto max-w-2xl space-y-3 p-6">
          <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
          <div className="aspect-[16/9] animate-pulse rounded-xl bg-muted" />
          <div className="h-10 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <BottomNav />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link
          to="/shops/$shopId"
          params={{ shopId }}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to shop
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold">Edit shop</h1>
        <p className="text-sm text-muted-foreground">Update details, photos and menu.</p>

        <div className="mt-5 space-y-5">
          {/* Main image */}
          <div>
            <Label>Cover image</Label>
            <label className="mt-1 flex aspect-[16/9] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40 transition hover:border-primary">
              {mainImage ? (
                <img src={mainImage} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImagePlus className="mx-auto h-8 w-8" />
                  <p className="mt-1 text-sm">Tap to upload</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={onPickMain} />
            </label>
          </div>

          {/* Gallery */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Gallery</Label>
              <label className="cursor-pointer text-xs font-semibold text-primary">
                + Add photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onPickGallery}
                />
              </label>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {gallery.map((g, i) => (
                <div key={g.id ?? i} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                  <img src={g.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(i)}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 transition group-hover:opacity-100"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {gallery.length === 0 && (
                <p className="col-span-3 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No extra photos yet.
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="loc">Location</Label>
            <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={800}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Starting (₹)</Label>
              <Input
                id="price"
                type="number"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
              />
            </div>
            <div>
              <Label>Price range</Label>
              <Select value={priceRange} onValueChange={(v: any) => setPriceRange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">₹ Budget</SelectItem>
                  <SelectItem value="medium">₹₹ Medium</SelectItem>
                  <SelectItem value="high">₹₹₹ Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Vibe tags</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TAGS.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() =>
                      setTags((s) => (on ? s.filter((x) => x !== t) : [...s, t]))
                    }
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tea menu */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Tea menu</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="gap-1"
                onClick={() => setTeas((s) => [...s, { name: "", price: "", _new: true }])}
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {teas.map((t, i) => (
                <div key={t.id ?? `n-${i}`} className="flex items-center gap-2">
                  <Input
                    placeholder="Masala chai"
                    value={t.name}
                    onChange={(e) =>
                      setTeas((s) => s.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
                    }
                  />
                  <Input
                    placeholder="₹"
                    type="number"
                    className="w-24"
                    value={t.price}
                    onChange={(e) =>
                      setTeas((s) =>
                        s.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeTea(i)}
                    aria-label="Remove tea"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {teas.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  No teas yet.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={save} disabled={submitting} className="w-full">
              {submitting ? "Saving…" : "Save changes"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2" disabled={submitting}>
                  <Trash2 className="h-4 w-4" /> Delete shop
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this shop?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the shop, its menu, photos and reviews.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteShop} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>
    </div>
  );
}