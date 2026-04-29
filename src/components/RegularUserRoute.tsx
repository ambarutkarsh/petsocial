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

  if (loading) return null;

  if (user && isAdminEmail(user.email)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default RegularUserRoute;
