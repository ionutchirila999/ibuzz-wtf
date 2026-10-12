import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { SHOP_NAME, SHOP_SHORT_NAME } from "@/lib/shop";
import { LANGS, useT } from "@/lib/i18n";

const nav = [
  { to: "/shop", label: "nav.shop" },
  { to: "/sell", label: "nav.sell" },
  { to: "/admin", label: "nav.owner" },
] as const;

// The second wordmark line is the rest of the name after the short form.
const brandLine2 = SHOP_NAME.slice(SHOP_SHORT_NAME.length).trim();

export function SiteHeader() {
  const { t, lang, setLang } = useT();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/" className="flex min-w-0 flex-1 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate font-display text-sm font-bold sm:text-base">{SHOP_SHORT_NAME}</span>
            <span className="mt-1 truncate text-[10px] font-medium tracking-[0.06em] text-primary sm:text-xs">
              {brandLine2}
            </span>
          </span>
        </Link>
        <nav className="flex shrink-0 gap-0 text-[11px] sm:text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-1.5 py-1.5 text-muted-foreground hover:text-foreground sm:px-3"
              activeProps={{ className: "text-primary" }}
            >
              {t(n.label)}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 overflow-hidden rounded-md border text-[10px] sm:text-xs" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)} aria-pressed={lang === l.code}
              className={`px-1.5 py-1 sm:px-2 ${lang === l.code ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="mt-20 border-t py-8 text-center text-xs text-muted-foreground">
      {SHOP_NAME} · {t("tagline")}
    </footer>
  );
}
