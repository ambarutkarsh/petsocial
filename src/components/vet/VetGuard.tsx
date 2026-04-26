import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VetGuard = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: vet, isLoading } = useQuery({
    queryKey: ["my-vet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_my_vet_profile");
      return Array.isArray(data) ? data[0] ?? null : null;
    },
  });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!isLoading && user && !vet) navigate("/hub");
  }, [user, vet, loading, isLoading, navigate]);

  if (loading || isLoading) {
    return <div className="p-6 text-sm font-body">Loading…</div>;
  }
  if (!vet) return null;

  return <>{children}</>;
};

export default VetGuard;
