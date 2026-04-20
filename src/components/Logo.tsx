import { Leaf, MapPin } from "lucide-react";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
      style={{ width: size, height: size }}
      aria-label="ChaiList logo"
    >
      <Leaf style={{ width: size * 0.55, height: size * 0.55 }} />
      <span
        className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-accent text-accent-foreground ring-2 ring-background"
        style={{ width: size * 0.45, height: size * 0.45 }}
      >
        <MapPin style={{ width: size * 0.28, height: size * 0.28 }} strokeWidth={2.5} />
      </span>
    </span>
  );
}

export function Wordmark({ size = "lg" }: { size?: "sm" | "lg" }) {
  return (
    <span
      className={`font-display font-extrabold tracking-tight ${size === "lg" ? "text-xl" : "text-base"}`}
    >
      Chai<span className="text-primary">List</span>
    </span>
  );
}
