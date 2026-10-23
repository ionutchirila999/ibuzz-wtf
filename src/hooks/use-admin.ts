import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let checkVersion = 0;

    const check = async (nextUser: User | null) => {
      const version = ++checkVersion;
      if (!active) return;
      setUser(nextUser);
      setLoading(true);

      if (!nextUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", nextUser.id)
          .eq("role", "admin")
          .maybeSingle();

        // Fail closed: an unreadable role table must never grant admin access.
        if (error) throw error;
        if (active && version === checkVersion) setIsAdmin(data?.role === "admin");
      } catch (error) {
        console.error("[Admin] Could not verify owner role:", error);
        if (active && version === checkVersion) setIsAdmin(false);
      } finally {
        if (active && version === checkVersion) setLoading(false);
      }
    };

    void supabase.auth.getUser()
      .then(({ data, error }) => {
        if (error) throw error;
        return check(data.user);
      })
      .catch((error) => {
        console.error("[Admin] Could not verify signed-in user:", error);
        if (active) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void check(session?.user ?? null);
      }
    });

    return () => {
      active = false;
      checkVersion += 1;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, isAdmin, loading };
}
