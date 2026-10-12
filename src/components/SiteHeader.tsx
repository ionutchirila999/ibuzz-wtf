import { Link } from "@tanstack/react-router";
import logoWordmark from "@/assets/logo.png";
import { LOGO_NAME, SHOP_NAME } from "@/lib/shop";
import { LANGS, useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/shop", label: "nav.shop" },
  { to: "/sell", label: "nav.sell" },
  { to: "/admin", label: "nav.owner" },
] as const;

export function SiteHeader() {
  const { t, lang, setLang } = useT();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto grid min-h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-2 sm:flex sm:justify-between sm:py-0">
        <Link to="/" aria-label={SHOP_NAME} className="flex min-w-0 shrink-0 items-center">
          <img
            src={logoWordmark}
            alt={LOGO_NAME}
            width={1356}
            height={286}
            className="h-6 w-auto sm:h-8"
          />
        </Link>
        <nav className="col-span-2 row-start-2 flex min-w-0 justify-center gap-4 text-xs sm:order-none sm:gap-0 sm:text-sm">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`rounded-md px-1.5 py-1.5 text-muted-foreground hover:text-foreground sm:px-3 ${n.to === "/admin" ? "hidden sm:inline" : ""}`}
              activeProps={{ className: "text-primary-soft" }}
            >
              {t(n.label)}
            </Link>
          ))}
        </nav>
        <div className="col-start-2 row-start-1 flex shrink-0 overflow-hidden rounded-md border text-xs" role="group" aria-label="Language">
          {LANGS.map((l) => (
            <Button variant="ghost" size="sm" key={l.code} onClick={() => setLang(l.code)} aria-pressed={lang === l.code}
              className={`h-8 rounded-none px-2 ${lang === l.code ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground"}`}>
              {l.label}
            </Button>
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
      <img src={logoWordmark} alt={LOGO_NAME} width={1356} height={286} loading="lazy" className="mx-auto mb-3 h-8 w-auto" />
      <p className="font-display text-sm font-bold text-foreground">{SHOP_NAME}</p>
      <p className="mx-auto mt-1 max-w-md px-4">{t("tagline")}</p>
    </footer>
  );
}
