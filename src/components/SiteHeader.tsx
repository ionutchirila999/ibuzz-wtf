import { Link } from "@tanstack/react-router";
import { Cpu } from "lucide-react";

const nav = [
  { to: "/shop", label: "Shop" },
  { to: "/sell", label: "Sell to us" },
  { to: "/admin", label: "Owner" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow"><Cpu className="h-4 w-4" /></span>
          <span>TechFix<span className="text-primary">.</span></span>
        </Link>
        <nav className="flex gap-1 text-sm">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground" activeProps={{ className: "text-primary" }}>
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
      TechFix & Digital Studio · Repaired, inspected and resold with care
    </footer>
  );
}
