import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account")({
  staticData: { sitemap: "exclude-subtree" },
  beforeLoad: () => {
    throw redirect({ to: "/dashboard", replace: true });
  },
});
