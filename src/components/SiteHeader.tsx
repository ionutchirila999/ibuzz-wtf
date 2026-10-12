import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SHOP_NAME, SHOP_SHORT_NAME, SHOP_TAGLINE } from "@/lib/shop";

const nav = [
  { to: "/shop", label: "Shop" },
  { to: "/sell", label: "Sell to us" },
  { to: "/admin", label: "Owner" },
] as const;

// The second wordmark line is the rest of the name after the short form.
const brandLine2 = SHOP_NAME.slice(SHOP_SHORT_NAME.length).replace(/^\s*and\s+/i, "");

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-base font-bold">{SHOP_SHORT_NAME}</span>
            <span className="mt-1 truncate text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
              {brandLine2}
            </span>
          </span>
        </Link>
        <nav className="flex shrink-0 gap-0.5 text-xs sm:text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground sm:px-3"
              activeProps={{ className: "text-primary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t py-8 text-center text-xs text-muted-foreground">
      {SHOP_NAME} · {SHOP_TAGLINE}
    </footer>
  );
}
