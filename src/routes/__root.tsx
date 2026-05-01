import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/PageTransition";
import { RoutePrefetcher } from "@/components/RoutePrefetcher";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ChaiList — Discover & Rate Tea Shops" },
      {
        name: "description",
        content:
          "Discover, review and rate the best tea shops near you. Find your next favorite chai spot on ChaiList.",
      },
      { property: "og:title", content: "ChaiList — Discover & Rate Tea Shops" },
      { property: "og:description", content: "A destination where the fragrance of tea comes alive, crafted for those who truly appreciate it, delivering a richer taste experience for everyone." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "ChaiList — Discover & Rate Tea Shops" },
      { name: "description", content: "A destination where the fragrance of tea comes alive, crafted for those who truly appreciate it, delivering a richer taste experience for everyone." },
      { name: "twitter:description", content: "A destination where the fragrance of tea comes alive, crafted for those who truly appreciate it, delivering a richer taste experience for everyone." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/a83e178a-810c-4349-ad6b-7f21cdcc45de" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/a83e178a-810c-4349-ad6b-7f21cdcc45de" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: () => (
    <AuthProvider>
      <RoutePrefetcher />
      <PageTransition>
        <Outlet />
      </PageTransition>
      <Toaster richColors position="top-center" />
    </AuthProvider>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold text-primary">404</h1>
        <p className="mt-2 text-muted-foreground">This page brewed away.</p>
        <a href="/" className="mt-4 inline-block text-primary underline">
          Back home
        </a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
