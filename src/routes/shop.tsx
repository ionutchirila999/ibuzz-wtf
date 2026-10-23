import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/shop")({
  // Keep old bookmarks working, but use /market as the only indexed storefront.
  staticData: { sitemap: false },
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/market",
      search: (previous) => ({ ...previous, ...search }),
      replace: true,
    });
  },
});
