import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

/**
 * Eagerly preload the main navigation routes after the initial paint.
 * This downloads the route's JS chunk AND warms its loader cache, so the
 * first tap on Home/Explore/Profile switches pages instantly instead of
 * waiting for a network round-trip.
 */
export function RoutePrefetcher() {
  const router = useRouter();
  useEffect(() => {
    const routes: Array<Parameters<typeof router.preloadRoute>[0]> = [
      { to: "/" },
      { to: "/explore" },
      { to: "/profile" },
    ];
    const run = () => {
      routes.forEach((r) => {
        router.preloadRoute(r as any).catch(() => {});
      });
    };
    // Defer to idle so we don't compete with the initial render.
    const w = window as any;
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(run, { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(run, 250);
    return () => clearTimeout(t);
  }, [router]);
  return null;
}