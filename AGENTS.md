<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep homepage copy in the shared three-language dictionary and category actions on the existing shop search routes, so language switching and collection navigation stay consistent.
- Product detail photos use the shared ProductGallery with Radix focus management and react-zoom-pan-pinch for wheel, touch and drag zoom; gallery control translations stay in the shared gallery dictionary so all catalog photos behave consistently.

- Preserve legacy product category and condition columns when saving; use additive market fields for expanded catalog filters so published clients and existing rows remain compatible.
- Share public enquiry validation and forms across Repair, Digital and Sell; server handlers store requests and private images before returning success, while owner access remains role-protected.
- Keep three-division copy in the shared three-language dictionary modules so navigation and service text switch together.

- Homepage-specific multilingual copy lives in the shared home-copy dictionary; inventory previews reuse ProductCard and the public catalog, never fabricated listings.
- Brand metadata stays centralised: page titles and sharing tags come from the shared page-head helper, the tab icon is a small brand mark served from `public/`, and the social banner is referenced as an absolute URL from the site's own origin; never add a share image to the root layout, because it would override every page's own preview.
- Sitemap URLs derive from required route decisions and paginated public product reads; omit lastmod without authoritative content timestamps, so discovery stays current without exposing private data.

- Offline support uses vite-plugin-pwa (generateSW) with a precached `/offline.html` fallback and NetworkFirst navigations (never cache-first HTML, never `/~oauth`); register only via the guarded wrapper in `src/lib/pwa.ts` — never in dev, Lovable preview, iframes, or with `?sw=off`. The manifest stays `public/manifest.webmanifest` (theme-color #1F1548); don't hand-write service workers.
- Dependency safety is guarded by `src/test/dependency-guard.ts`, enforced by the `build/dependency-guard-plugin.ts` Vite plugin on every production build (so publishing stops before bundling) and by `bun run check:deps` in tests/CI: package.json must match bun.lock, and build aliases must never force one copy of a package that the lockfile installs nested for another dependant, because publishing installs fresh and bundles everything.
