import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestPopupProvider } from "@/contexts/GuestPopupContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import OnboardingScreen from "./pages/OnboardingScreen";
import InsuranceScreen from "./pages/hub/InsuranceScreen";
import NgoScreen from "./pages/hub/NgoScreen";
import PickupScreen from "./pages/hub/PickupScreen";
import RecommenderScreen from "./pages/hub/RecommenderScreen";
import PetcationScreen from "./pages/hub/PetcationScreen";
import PetMovingScreen from "./pages/hub/PetMovingScreen";
import MicrochipScreen from "./pages/hub/MicrochipScreen";
import RegisterMicrochipScreen from "./pages/hub/RegisterMicrochipScreen";
import PetCareScreen from "./pages/hub/PetCareScreen";
import AdminNotificationsScreen from "./pages/admin/AdminNotificationsScreen";
import AdminCompetitionsScreen from "./pages/admin/AdminCompetitionsScreen";
import AdminVetsScreen from "./pages/admin/AdminVetsScreen";
import BookAVetScreen from "./pages/hub/BookAVetScreen";
import BookAVetComingSoon from "./pages/hub/BookAVetComingSoon";
import HubVetProfileScreen from "./pages/hub/VetProfileScreen";
import ConfirmBookingScreen from "./pages/hub/ConfirmBookingScreen";
import BookingSuccessScreen from "./pages/hub/BookingSuccessScreen";
import MyBookingsScreen from "./pages/MyBookingsScreen";
import VetDashboardLayout from "./components/vet/VetDashboardLayout";
import VetGuard from "./components/vet/VetGuard";
import VetTodayScreen from "./pages/vet/VetTodayScreen";
import VetCalendarScreen from "./pages/vet/VetCalendarScreen";
import VetRequestsScreen from "./pages/vet/VetRequestsScreen";
import VetAvailabilityScreen from "./pages/vet/VetAvailabilityScreen";
import VetDashProfileScreen from "./pages/vet/VetProfileScreen";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

const queryClient = new QueryClient();

const PageTracker = () => {
  const location = useLocation();
  useEffect(() => { trackPageView(location.pathname); }, [location]);
  return null;
};

// Default landing is always /feeds (works for guests and logged-in users)
const RootRedirect = () => <Navigate to="/feeds" replace />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <GuestPopupProvider>
          <PageTracker />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
            <Route path="/complete-registration" element={<CompleteRegistrationScreen />} />

            {/* Public to guests with feature gating: Feeds, Hub, Shop */}
            <Route path="/feeds" element={<PlayScreen />} />
            <Route path="/hub" element={<CareScreen />} />
            <Route path="/mypet" element={<ProtectedRoute><ShopScreen /></ProtectedRoute>} />
            <Route path="/shop" element={<ShopComingSoonScreen />} />

            {/* Hub sub-pages — Vet Near Me & SOS are public; rest require auth */}
            <Route path="/hub/sos" element={<SosScreen />} />
            <Route path="/hub/vet-near-me" element={<VetNearMeScreen />} />
            <Route path="/hub/budget" element={<ProtectedRoute><BudgetCalculatorScreen /></ProtectedRoute>} />
            <Route path="/hub/legal" element={<ProtectedRoute><LegalScreen /></ProtectedRoute>} />
            <Route path="/hub/license" element={<ProtectedRoute><LegalScreen /></ProtectedRoute>} />
            <Route path="/hub/rights" element={<ProtectedRoute><LegalScreen /></ProtectedRoute>} />
            <Route path="/hub/insurance" element={<ProtectedRoute><InsuranceScreen /></ProtectedRoute>} />
            <Route path="/hub/ngo" element={<ProtectedRoute><NgoScreen /></ProtectedRoute>} />
            <Route path="/hub/pickup" element={<ProtectedRoute><PickupScreen /></ProtectedRoute>} />
            <Route path="/hub/recommender" element={<RecommenderScreen />} />
            <Route path="/hub/pet-recommender" element={<RecommenderScreen />} />
            <Route path="/hub/pet-care" element={<PetCareScreen />} />
            <Route path="/hub/petcation" element={<ProtectedRoute><PetcationScreen /></ProtectedRoute>} />
            <Route path="/hub/pet-moving" element={<ProtectedRoute><PetMovingScreen /></ProtectedRoute>} />
            <Route path="/hub/microchip" element={<MicrochipScreen />} />
            <Route path="/hub/microchip/register" element={<RegisterMicrochipScreen />} />
            <Route path="/hub/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />

            {/* MyPet sub-pages */}
            <Route path="/mypet/health" element={<ProtectedRoute><HealthLogScreen /></ProtectedRoute>} />
            <Route path="/mypet/locker" element={<ProtectedRoute><PetDigiLockerScreen /></ProtectedRoute>} />

            {/* Other screens */}
            <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><PublicProfileScreen /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsScreen /></ProtectedRoute>} />
            <Route path="/forum" element={<ProtectedRoute><ForumScreen /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><LearnScreen /></ProtectedRoute>} />
            <Route path="/admin/seed" element={<ProtectedRoute><AdminSeedScreen /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotificationsScreen /></ProtectedRoute>} />
            <Route path="/admin/competitions" element={<ProtectedRoute><AdminCompetitionsScreen /></ProtectedRoute>} />

            {/* Public post detail keeps its own layout */}
            <Route path="/post/:postId" element={<PostDetailScreen />} />

            {/* Legacy redirects */}
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
            <Route path="/health" element={<ProtectedRoute><HealthScreen /></ProtectedRoute>} />
            <Route path="/health/log" element={<Navigate to="/mypet/health" replace />} />
            <Route path="/health/vet-near-me" element={<Navigate to="/hub/vet-near-me" replace />} />
            <Route path="/health/digilocker" element={<Navigate to="/mypet/locker" replace />} />
            <Route path="/health/budget" element={<Navigate to="/hub/budget" replace />} />
            <Route path="/health/order" element={<ProtectedRoute><OrderNowScreen /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </GuestPopupProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
