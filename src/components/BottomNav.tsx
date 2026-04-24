import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, User as UserIcon, MapPin, Search, ShoppingBag, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo, Wordmark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

type NavItem = { to: string; label: string; icon: typeof Home; primary?: boolean };
const items: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/explore", label: "Search", icon: Search, primary: true },
  { to: "/profile", label: "Profile", icon: UserIcon },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  return (
    <>
      {/* ───── Desktop top navbar (md+) ───── */}
      <nav
        className="hidden md:block sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-5 px-6 py-3">
          <Link to="/" className="tap-shrink flex items-center gap-2">
            <Logo size={36} />
            <Wordmark />
          </Link>

          <div className="hidden lg:flex items-center gap-2 border-l border-border pl-5">
            <MapPin className="h-4 w-4 text-primary" />
            <div className="leading-tight">
              <p className="text-[11px] font-bold">Delivering near you</p>
              <p className="text-[11px] text-muted-foreground">Tap to set location ▾</p>
            </div>
          </div>

          <Link
            to="/explore"
            className="tap-shrink ml-1 flex flex-1 items-center gap-3 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary/70"
          >
            <Search className="h-4 w-4" />
            <span>Search "masala chai", shops, locations…</span>
          </Link>

          {/* Primary nav links */}
          <ul className="flex items-center gap-1">
            {items.slice(0, 2).map(({ to, label, icon: Icon }) => {
              const active = pathname === to || (to !== "/" && pathname.startsWith(to));
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={cn(
                      "tap-shrink inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      active ? "bg-secondary text-primary" : "text-foreground/80 hover:text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {user ? (
            <Link
              to="/profile"
              className={cn(
                "tap-shrink inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                pathname.startsWith("/profile")
                  ? "bg-secondary text-primary"
                  : "text-foreground/80 hover:text-primary",
              )}
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </Link>
          ) : (
            <Link
              to="/login"
              className="tap-shrink inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-foreground/80 hover:text-primary"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}

          <Link
            to="/shops/new"
            className="tap-shrink inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-90"
          >
            <ShoppingBag className="h-4 w-4" /> Add shop
          </Link>
        </div>
      </nav>

      {/* ───── Mobile bottom navbar ───── */}
      <nav
        className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border/60 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary mobile"
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
    </>
  );
}
