import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  staticData: { sitemap: "exclude-subtree" },
  beforeLoad: () => {
    throw redirect({ to: "/ibuzz-dashboard", replace: true });
  },
});
