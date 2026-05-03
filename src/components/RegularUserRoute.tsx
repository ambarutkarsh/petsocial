import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";

/**
 * Wraps regular-user routes. If the signed-in user is the admin
 * (petosauras@gmail.com), they are kicked over to /admin so the
 * consumer app chrome (top bar, bottom nav, feeds, etc.) is never
 * shown to them.
 *
 * Guests (not signed in) pass through — the underlying route may
 * have its own ProtectedRoute wrapper for auth gating.
 */
const RegularUserRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  // Don't block paint on auth hydration. When the user returns with a stale
  // JWT, supabase.auth.getSession() can stall on a slow token refresh. Render
  // the page immediately as a guest view; once auth resolves, the admin
  // redirect (below) and per-query gating (enabled: !!user) take over.
  if (!loading && user && isAdminEmail(user.email)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default RegularUserRoute;
