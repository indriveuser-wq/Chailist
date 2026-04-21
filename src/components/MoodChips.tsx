import { cn } from "@/lib/utils";

export const MOODS = [
  { id: "all", label: "All", emoji: "🍵", tag: null as string | null },
  { id: "cozy", label: "Cozy", emoji: "☕", tag: "cozy" },
  { id: "scenic", label: "Scenic", emoji: "🌄", tag: "scenic" },
  { id: "street", label: "Street", emoji: "🛣️", tag: "street" },
  { id: "premium", label: "Premium", emoji: "✨", tag: "premium" },
  { id: "study", label: "Study", emoji: "📚", tag: "study" },
  { id: "rooftop", label: "Rooftop", emoji: "🏙️", tag: "rooftop" },
  { id: "outdoor", label: "Outdoor", emoji: "🌿", tag: "outdoor" },
  { id: "local", label: "Local", emoji: "📍", tag: "local" },
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
              "tap-shrink inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition-all",
              on
                ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            <span className="text-sm leading-none">{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
