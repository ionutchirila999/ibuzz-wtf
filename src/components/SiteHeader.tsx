import { Link } from "@tanstack/react-router";
import logoWordmark from "@/assets/logo.png";
import { LOGO_NAME, SHOP_NAME } from "@/lib/shop";
import { LANGS, useT } from "@/lib/i18n";

const nav = [
  { to: "/shop", label: "nav.shop" },
  { to: "/sell", label: "nav.sell" },
  { to: "/admin", label: "nav.owner" },
] as const;

export function SiteHeader() {
  const { t, lang, setLang } = useT();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-4">
        <Link to="/" aria-label={SHOP_NAME} className="flex min-w-0 shrink-0 items-center">
          <img
            src={logoWordmark}
            alt={LOGO_NAME}
            width={1085}
            height={164}
            className="h-5 w-auto sm:h-7"
          />
        </Link>
        <nav className="flex shrink-0 gap-0 text-[11px] sm:text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-md px-1.5 py-1.5 text-muted-foreground hover:text-foreground sm:px-3 ${n.to === "/admin" ? "hidden sm:inline" : ""}`}
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
      <img src={logoWordmark} alt={LOGO_NAME} width={1085} height={164} loading="lazy" className="mx-auto mb-4 h-6 w-auto" />
      {SHOP_NAME} · {t("tagline")}
    </footer>
  );
}
