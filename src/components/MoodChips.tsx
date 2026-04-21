import { cn } from "@/lib/utils";

export const MOODS = [
  { id: "all", label: "All", tag: null as string | null },
  { id: "cozy", label: "Cozy", tag: "cozy" },
  { id: "scenic", label: "Scenic", tag: "scenic" },
  { id: "street", label: "Street", tag: "street" },
  { id: "premium", label: "Premium", tag: "premium" },
  { id: "study", label: "Study", tag: "study" },
  { id: "rooftop", label: "Rooftop", tag: "rooftop" },
  { id: "outdoor", label: "Outdoor", tag: "outdoor" },
  { id: "local", label: "Local", tag: "local" },
];

export function MoodChips({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MOODS.map((m) => {
        const on = active === m.id;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            className={cn(
              "tap-shrink inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all",
              on
                ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
