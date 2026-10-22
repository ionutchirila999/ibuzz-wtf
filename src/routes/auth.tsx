import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHOP_NAME } from "@/lib/shop";
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: "exclude-subtree" },
  head: () => ({
    meta: [
      { title: `Sign in — ${SHOP_NAME}` },
      { name: "description", content: "Secure sign in." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "");
    const password = String(f.get("password") ?? "");
    setBusy(true);

    if (resetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?resetPassword=1`,
      });
      setBusy(false);
      if (error) {
        toast.error("Could not send the reset email. Please try again.");
        return;
      }
      setResetSent(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Sign-in failed. Check your details or use password reset.");
      return;
    }
    navigate({ to: "/ibuzz-dashboard" });
  }

  async function signInWithProvider(provider: "google") {
    setBusy(true);
    const lovableAuth = createLovableAuth();
    const result = await lovableAuth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin + "/ibuzz-dashboard",
    });
    if (result.redirected) return;
    if (result.error) {
      setBusy(false);
      toast.error("Could not sign in with Google. Please try again.");
      return;
    }
    const { error } = await supabase.auth.setSession(result.tokens);
    setBusy(false);
    if (error) {
      toast.error("Could not complete sign-in. Please try again.");
      return;
    }
    navigate({ to: "/ibuzz-dashboard" });
  }

  return (
    <main className="auth-page relative isolate mx-auto flex min-h-[calc(100svh-5rem)] max-w-6xl items-center justify-center overflow-hidden px-4 py-12 sm:px-6 sm:py-16">
      <div className="auth-orb auth-orb-one" aria-hidden="true" />
      <div className="auth-orb auth-orb-two" aria-hidden="true" />
      <div className="auth-panel relative z-10 w-full max-w-md rounded-3xl border p-6 sm:p-9">
        <h1 className="auth-title text-3xl font-bold tracking-tight sm:text-4xl">
          {resetMode ? "Reset your password" : "Sign in"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {resetMode ? "Request a password reset link." : "Sign in to continue."}
        </p>
        {resetSent && (
          <p role="status" className="mt-4 rounded-lg border bg-card p-3 text-sm">
            If an account exists for that email, a password reset link has been sent.
          </p>
        )}
        {!resetMode && (
          <>
            <div className="mt-7 grid grid-cols-1 gap-2">
              <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => void signInWithProvider("google")}>
                Continue with Google
              </Button>
            </div>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /><span>or use email</span><span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          {!resetMode && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
          )}
          <Button type="submit" variant="glow" className="w-full" disabled={busy}>
            {resetMode ? "Send reset link" : "Sign in"}
          </Button>
        </form>
        {!resetMode && (
          <button type="button" onClick={() => { setResetMode(true); setResetSent(false); }} className="mt-4 text-sm text-primary underline underline-offset-4">
            Forgot password?
          </button>
        )}
        {resetMode && (
          <button type="button" onClick={() => { setResetMode(false); setResetSent(false); }} className="mt-4 text-sm text-primary underline underline-offset-4">
            Back to sign in
          </button>
        )}
      </div>
    </main>
  );
}
