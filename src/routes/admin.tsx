import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShieldCheck, CheckCircle2, XCircle, Pencil, Phone, MapPin, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — ChaiList" }] }),
});

type Row = {
  id: string;
  name: string;
  location: string;
  approved: boolean;
  mobile_number: string | null;
  image_url: string | null;
  owner_id: string | null;
  created_at: string;
};

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
    if (!loading && user && !isAdmin) {
      toast.error("Admin only");
      nav({ to: "/" });
    }
  }, [user, isAdmin, loading, nav]);

  async function load() {
    const { data, error } = await supabase
      .from("shops")
      .select("id, name, location, approved, mobile_number, image_url, owner_id, created_at")
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Row[]);
  }

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  async function setApproved(id: string, approved: boolean) {
    setBusy(id);
    const { error } = await supabase.from("shops").update({ approved }).eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(approved ? "Shop approved" : "Shop hidden");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this shop and its menu/photos/reviews?")) return;
    setBusy(id);
    const { error } = await supabase.from("shops").delete().eq("id", id);
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success("Shop deleted");
    load();
  }

  if (loading || !user || !isAdmin) return null;

  const filtered = (rows ?? []).filter((r) => (tab === "pending" ? !r.approved : true));
  const pendingCount = (rows ?? []).filter((r) => !r.approved).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <BottomNav />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-extrabold">Admin</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Approve, edit and manage every shop in the directory.
        </p>

        <div className="mt-4 inline-flex rounded-full border border-border bg-card p-1 text-xs font-semibold">
          <button
            onClick={() => setTab("pending")}
            className={`rounded-full px-3 py-1.5 ${
              tab === "pending" ? "bg-primary text-primary-foreground" : "text-foreground"
            }`}
          >
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            onClick={() => setTab("all")}
            className={`rounded-full px-3 py-1.5 ${
              tab === "all" ? "bg-primary text-primary-foreground" : "text-foreground"
            }`}
          >
            All shops
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {rows === null ? (
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {tab === "pending" ? "No pending shops to review." : "No shops yet."}
            </p>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {r.image_url ? (
                    <img src={r.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">🍵</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/shops/$shopId"
                      params={{ shopId: r.id }}
                      className="truncate font-display text-sm font-bold hover:underline"
                    >
                      {r.name}
                    </Link>
                    {r.approved ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        Approved
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {r.location}
                  </p>
                  {r.mobile_number && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-foreground/80">
                      <Phone className="h-3 w-3" /> {r.mobile_number}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {!r.approved ? (
                      <Button
                        size="sm"
                        className="h-7 gap-1 px-2 text-[11px]"
                        disabled={busy === r.id}
                        onClick={() => setApproved(r.id, true)}
                      >
                        <CheckCircle2 className="h-3 w-3" /> Approve
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-[11px]"
                        disabled={busy === r.id}
                        onClick={() => setApproved(r.id, false)}
                      >
                        <XCircle className="h-3 w-3" /> Hide
                      </Button>
                    )}
                    <Link
                      to="/shops/$shopId/edit"
                      params={{ shopId: r.id }}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[11px] font-semibold tap-shrink"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 gap-1 px-2 text-[11px]"
                      disabled={busy === r.id}
                      onClick={() => remove(r.id)}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}