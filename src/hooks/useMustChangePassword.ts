import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useMustChangePassword() {
  const { user } = useAuth();
  const [mustChange, setMustChange] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = async () => {
    if (!user) { setMustChange(false); setLoading(false); return; }
    const { data } = await supabase
      .from("profiles")
      .select("must_change_password")
      .eq("user_id", user.id)
      .maybeSingle();
    setMustChange(data?.must_change_password ?? false);
    setLoading(false);
  };

  useEffect(() => { check(); }, [user?.id]);

  return { mustChange, loading, recheck: check, clear: () => setMustChange(false) };
}
