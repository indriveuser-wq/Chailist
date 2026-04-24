import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shops/$shopId/menu")({
  component: MenuEditor,
  head: () => ({ meta: [{ title: "Edit menu — ChaiList" }] }),
});

type Tea = {
  id: string;
  name: string;
  price: string;
  _dirty?: boolean;
  _saving?: boolean;
};

function MenuEditor() {
  const { shopId } = useParams({ from: "/shops/$shopId/menu" });
  const { user, loading: authLoading, isAdmin } = useAuth();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState("");
  const [teas, setTeas] = useState<Tea[]>([]);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login" });
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const { data: shop, error } = await supabase
        .from("shops")
        .select("id, name, owner_id")
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
      setShopName(shop.name);
      const { data: ts } = await supabase
        .from("tea_items")
        .select("id, name, price")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: true });
      setTeas(
        (ts ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          price: String(t.price),
        })),
      );
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, user?.id, authLoading]);

  function patchTea(id: string, patch: Partial<Tea>) {
    setTeas((s) => s.map((t) => (t.id === id ? { ...t, ...patch, _dirty: true } : t)));
  }

  async function saveTea(id: string) {
    const t = teas.find((x) => x.id === id);
    if (!t) return;
    if (!t.name.trim()) return toast.error("Name required");
    const price = Number(t.price);
    if (isNaN(price) || price < 0) return toast.error("Invalid price");
    setTeas((s) => s.map((x) => (x.id === id ? { ...x, _saving: true } : x)));
    const { error } = await supabase
      .from("tea_items")
      .update({ name: t.name.trim(), price })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      setTeas((s) => s.map((x) => (x.id === id ? { ...x, _saving: false } : x)));
      return;
    }
    toast.success("Saved");
    setTeas((s) =>
      s.map((x) => (x.id === id ? { ...x, _saving: false, _dirty: false } : x)),
    );
  }

  async function deleteTea(id: string) {
    const { error } = await supabase.from("tea_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setTeas((s) => s.filter((x) => x.id !== id));
    toast.success("Removed");
  }

  async function addTea() {
    if (!newName.trim()) return toast.error("Name required");
    const price = Number(newPrice);
    if (isNaN(price) || price < 0) return toast.error("Invalid price");
    setAdding(true);
    const { data, error } = await supabase
      .from("tea_items")
      .insert({ shop_id: shopId, name: newName.trim(), price })
      .select("id, name, price")
      .single();
    setAdding(false);
    if (error || !data) return toast.error(error?.message ?? "Failed");
    setTeas((s) => [...s, { id: data.id, name: data.name, price: String(data.price) }]);
    setNewName("");
    setNewPrice("");
    toast.success("Added");
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <BottomNav />
        <div className="mx-auto max-w-2xl space-y-3 p-6">
          <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
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
        <h1 className="mt-2 font-display text-2xl font-extrabold">Tea menu</h1>
        <p className="text-sm text-muted-foreground">
          {shopName} — add, rename, reprice or remove items.
        </p>

        {/* Add new */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-4">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Add new tea
          </Label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Masala chai"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="₹ Price"
              type="number"
              inputMode="decimal"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="sm:w-32"
            />
            <Button onClick={addTea} disabled={adding} className="gap-1">
              <Plus className="h-4 w-4" /> {adding ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>

        {/* Existing list */}
        <div className="mt-5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Menu items ({teas.length})
          </Label>
          <div className="mt-2 space-y-2">
            {teas.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No teas yet. Add your first item above.
              </p>
            )}
            {teas.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card p-2"
              >
                <Input
                  value={t.name}
                  onChange={(e) => patchTea(t.id, { name: e.target.value })}
                  className="flex-1"
                  placeholder="Tea name"
                />
                <Input
                  value={t.price}
                  onChange={(e) => patchTea(t.id, { price: e.target.value })}
                  type="number"
                  inputMode="decimal"
                  className="w-20"
                  placeholder="₹"
                />
                <Button
                  size="icon"
                  variant={t._dirty ? "default" : "ghost"}
                  onClick={() => saveTea(t.id)}
                  disabled={!t._dirty || t._saving}
                  aria-label="Save"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove "{t.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This deletes the item and all its ratings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteTea(t.id)}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
