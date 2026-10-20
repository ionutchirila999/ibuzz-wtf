import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHOP_NAME } from "@/lib/shop";

export const Route = createFileRoute("/auth")({staticData: { sitemap: "exclude-subtree" },
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: `Owner sign in — ${SHOP_NAME}` },
      { name: "description", content: "Sign in to manage listings and offers." },
      { property: "og:title", content: `Owner sign in — ${SHOP_NAME}` },
      { property: "og:description", content: "Sign in to manage listings and offers." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [ownerExists, setOwnerExists] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.rpc("owner_exists").then(({ data }) => {
      const exists = data !== false;
      setOwnerExists(exists);
      if (!exists) setMode("up");
    });
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      setSentTo(email);
      setMode("in");
    }
  }

  async function signInWithProvider(provider: "google" | "apple") {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/admin` } });
    if (error) { setBusy(false); toast.error(error.message); }
  }

  const setup = ownerExists === false;

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-bold">{mode === "up" ? "Set up owner account" : "Owner sign in"}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {setup
          ? "No owner yet. The first account to confirm its email becomes the shop owner automatically."
          : "Owner area for managing listings and enquiries."}
      </p>
      {sentTo && (
        <p role="status" className="mt-4 rounded-lg border bg-card p-3 text-sm">
          Check {sentTo} and tap the confirmation link. You'll land in the owner dashboard with full access.
        </p>
      )}
      <div className="mt-6 grid grid-cols-1 gap-2">
        <Button type="button" variant="outline" className="w-full" disabled={busy || ownerExists === null} onClick={() => void signInWithProvider("google")}>Continue with Google</Button>
        <Button type="button" variant="outline" className="w-full" disabled={busy || ownerExists === null} onClick={() => void signInWithProvider("apple")}>Continue with Apple</Button>
      </div>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" /><span>or use email</span><span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
        <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} minLength={8} required /></div>
        <Button type="submit" variant="glow" className="w-full" disabled={busy || ownerExists === null}>{mode === "in" ? "Sign in" : "Create owner account"}</Button>
      </form>
      {setup && (
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 text-sm text-primary">
          {mode === "in" ? "Create the owner account" : "Already created it? Sign in"}
        </button>
      )}
    </div>
  );
}
