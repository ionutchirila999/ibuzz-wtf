import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async (u: User | null) => {
      setUser(u);
      if (!u) { setIsAdmin(false); setLoading(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
      setLoading(false);
    };
    supabase.auth.getUser().then(({ data }) => check(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") check(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, isAdmin, loading };
}
