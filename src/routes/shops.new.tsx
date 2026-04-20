import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { z } from "zod";
import { ImagePlus, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/shops/new")({
  component: NewShop,
});

const TAGS = ["cozy", "scenic", "local", "rooftop", "study", "outdoor", "premium", "street"];

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(200),
  description: z.string().trim().max(800).optional(),
  starting_price: z.number().min(0).max(100000),
  price_range: z.enum(["low", "medium", "high"]),
});

type TeaInput = { name: string; price: string };

function NewShop() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [priceRange, setPriceRange] = useState<"low" | "medium" | "high">("medium");
  const [tags, setTags] = useState<string[]>([]);
  const [teas, setTeas] = useState<TeaInput[]>([{ name: "", price: "" }]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      name,
      location,
      description: description || undefined,
      starting_price: Number(startingPrice || 0),
      price_range: priceRange,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    try {
      let image_url: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("shop-images")
          .upload(path, imageFile);
        if (upErr) throw upErr;
        image_url = supabase.storage.from("shop-images").getPublicUrl(path).data.publicUrl;
      }

      // ensure shop_owner role
      await supabase.from("user_roles").insert({ user_id: user.id, role: "shop_owner" }).then();

      const { data: shop, error } = await supabase
        .from("shops")
        .insert({
          owner_id: user.id,
          name: parsed.data.name,
          location: parsed.data.location,
          description: parsed.data.description ?? null,
          starting_price: parsed.data.starting_price,
          price_range: parsed.data.price_range,
          tags,
          image_url,
          approved: true, // auto-approve for MVP
        })
        .select()
        .single();
      if (error) throw error;

      const validTeas = teas
        .filter((t) => t.name.trim() && t.price.trim())
        .map((t) => ({ shop_id: shop.id, name: t.name.trim(), price: Number(t.price) }));
      if (validTeas.length) {
        await supabase.from("tea_items").insert(validTeas);
      }
      toast.success("Shop added!");
      nav({ to: "/shops/$shopId", params: { shopId: shop.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add shop");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <h1 className="mt-1 font-display text-2xl font-extrabold">Add a tea shop</h1>
          <p className="text-sm text-muted-foreground">Share a great chai spot with the community.</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Shop image</Label>
            <label className="mt-1 flex aspect-[16/9] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40 transition hover:border-primary">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImagePlus className="mx-auto h-8 w-8" />
                  <p className="mt-1 text-sm">Tap to upload</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
            </label>
          </div>

          <div>
            <Label htmlFor="name">Shop name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="loc">Location</Label>
            <Input
              id="loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Area, City"
              required
            />
          </div>

          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the vibe? What's special?"
              maxLength={800}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price">Starting price (₹)</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                placeholder="20"
                required
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

          <div>
            <div className="flex items-center justify-between">
              <Label>Tea menu (optional)</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setTeas((s) => [...s, { name: "", price: "" }])}
                className="gap-1"
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {teas.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
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
                    onClick={() => setTeas((s) => s.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving…" : "Publish shop"}
          </Button>
        </form>
      </main>
      <BottomNav />
    </div>
  );
}
