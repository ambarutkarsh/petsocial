import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/MainLayout";
import AuthScreen from "./pages/AuthScreen";
import PlayScreen from "./pages/PlayScreen";
import CareScreen from "./pages/CareScreen";
import ShopScreen from "./pages/ShopScreen";
import ShopComingSoonScreen from "./pages/ShopComingSoonScreen";
import HubScreen from "./pages/HubScreen";
import SosScreen from "./pages/SosScreen";
import LegalScreen from "./pages/LegalScreen";
import SettingsScreen from "./pages/SettingsScreen";
import ForumScreen from "./pages/ForumScreen";
import HealthScreen from "./pages/HealthScreen";
import HealthLogScreen from "./pages/HealthLogScreen";
import LearnScreen from "./pages/LearnScreen";
import ProfileScreen from "./pages/ProfileScreen";
import PublicProfileScreen from "./pages/PublicProfileScreen";
import PostDetailScreen from "./pages/PostDetailScreen";
import NotificationsScreen from "./pages/NotificationsScreen";
import ResetPasswordScreen from "./pages/ResetPasswordScreen";
import VetNearMeScreen from "./pages/VetNearMeScreen";
import PetDigiLockerScreen from "./pages/PetDigiLockerScreen";
import BudgetCalculatorScreen from "./pages/BudgetCalculatorScreen";
import OrderNowScreen from "./pages/OrderNowScreen";
import CompleteRegistrationScreen from "./pages/CompleteRegistrationScreen";
import AdminSeedScreen from "./pages/AdminSeedScreen";
import NotFound from "./pages/NotFound";
import { ReactNode, useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

const queryClient = new QueryClient();

const PageTracker = () => {
  const location = useLocation();
  useEffect(() => { trackPageView(location.pathname); }, [location]);
  return null;
};

/** Wrap a protected page in the persistent app shell (top bar + bottom nav). */
const Shell = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <PageTracker />
          <Routes>
            <Route path="/" element={<Navigate to="/feeds" replace />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
            <Route path="/complete-registration" element={<CompleteRegistrationScreen />} />

            {/* New 5-slot bottom nav: Feeds | Hub | + | MyPet | Shop */}
            <Route path="/feeds" element={<Shell><PlayScreen /></Shell>} />
            <Route path="/hub" element={<Shell><CareScreen /></Shell>} />
            <Route path="/mypet" element={<Shell><ShopScreen /></Shell>} />
            <Route path="/shop" element={<Shell><ShopComingSoonScreen /></Shell>} />

            {/* Hub sub-pages (existing screens, now under /hub/*) */}
            <Route path="/hub/sos" element={<Shell><SosScreen /></Shell>} />
            <Route path="/hub/vet-near-me" element={<Shell><VetNearMeScreen /></Shell>} />
            <Route path="/hub/budget" element={<Shell><BudgetCalculatorScreen /></Shell>} />
            <Route path="/hub/legal" element={<Shell><LegalScreen /></Shell>} />
            <Route path="/hub/license" element={<Shell><LegalScreen /></Shell>} />
            <Route path="/hub/rights" element={<Shell><LegalScreen /></Shell>} />
            <Route path="/hub/settings" element={<Shell><SettingsScreen /></Shell>} />

            {/* MyPet sub-pages (existing screens) */}
            <Route path="/mypet/health" element={<Shell><HealthLogScreen /></Shell>} />
            <Route path="/mypet/locker" element={<Shell><PetDigiLockerScreen /></Shell>} />

            {/* Other shell-wrapped screens */}
            <Route path="/profile" element={<Shell><ProfileScreen /></Shell>} />
            <Route path="/profile/:userId" element={<Shell><PublicProfileScreen /></Shell>} />
            <Route path="/notifications" element={<Shell><NotificationsScreen /></Shell>} />
            <Route path="/forum" element={<Shell><ForumScreen /></Shell>} />
            <Route path="/learn" element={<Shell><LearnScreen /></Shell>} />
            <Route path="/admin/seed" element={<Shell><AdminSeedScreen /></Shell>} />

            {/* Public post detail keeps its own layout */}
            <Route path="/post/:postId" element={<PostDetailScreen />} />

            {/* Legacy redirects (keep all old links working) */}
            <Route path="/play" element={<Navigate to="/feeds" replace />} />
            <Route path="/feed" element={<Navigate to="/feeds" replace />} />
            <Route path="/care" element={<Navigate to="/hub" replace />} />
            <Route path="/community" element={<Navigate to="/hub" replace />} />
            <Route path="/care/sos" element={<Navigate to="/hub/sos" replace />} />
            <Route path="/care/vet" element={<Navigate to="/hub/vet-near-me" replace />} />
            <Route path="/care/tracker" element={<Navigate to="/mypet/health" replace />} />
            <Route path="/care/vaccines" element={<Navigate to="/mypet/health" replace />} />
            <Route path="/care/locker" element={<Navigate to="/mypet/locker" replace />} />
            <Route path="/care/ai" element={<Navigate to="/learn" replace />} />
            <Route path="/health" element={<Shell><HealthScreen /></Shell>} />
            <Route path="/health/log" element={<Navigate to="/mypet/health" replace />} />
            <Route path="/health/vet-near-me" element={<Navigate to="/hub/vet-near-me" replace />} />
            <Route path="/health/digilocker" element={<Navigate to="/mypet/locker" replace />} />
            <Route path="/health/budget" element={<Navigate to="/hub/budget" replace />} />
            <Route path="/health/order" element={<Shell><OrderNowScreen /></Shell>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
