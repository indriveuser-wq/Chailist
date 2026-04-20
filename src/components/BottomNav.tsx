import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, PlusCircle, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Home; primary?: boolean };
const items: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/shops/new", label: "Add", icon: PlusCircle, primary: true },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border/60 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {items.map(({ to, label, icon: Icon, primary }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          if (primary) {
            return (
              <li key={to}>
                <Link
                  to={to}
                  className="tap-shrink -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-elevated)] ring-4 ring-background"
                  aria-label={label}
                >
                  <Icon className="h-6 w-6" strokeWidth={2.25} />
                </Link>
              </li>
            );
          }
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "tap-shrink flex flex-col items-center gap-0.5 rounded-lg px-4 py-2 transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className={cn("text-[10px] font-medium", active && "font-semibold")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
