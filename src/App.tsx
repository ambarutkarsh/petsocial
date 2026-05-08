import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { GuestPopupProvider } from "@/contexts/GuestPopupContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import Chatbot from "@/components/Chatbot";
import ProtectedRoute from "@/components/ProtectedRoute";
import RegularUserRoute from "@/components/RegularUserRoute";
import { supabase } from "@/integrations/supabase/client";

// Eager — landing/auth screens that must render instantly on session restore.
import PlayScreen from "./pages/PlayScreen";
import AuthScreen from "./pages/AuthScreen";
import NotFound from "./pages/NotFound";
import HomeLanding from "./pages/seo/HomeLanding";
import ErrorBoundary from "./components/ErrorBoundary";

import { lazy, Suspense, useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

// Public SEO pages (lazy)
const CarePage = lazy(() => import("./pages/seo/carePages"));
const SeoInfo = {
  VetNearMe: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.VetNearMeLanding }))),
  DigiLocker: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.PetDigiLockerLanding }))),
  Budget: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.BudgetLanding }))),
  Community: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.CommunityLanding }))),
  PetFacts: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.PetFactsLanding }))),
  Faq: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.FaqLanding }))),
  About: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.AboutLanding }))),
  Contact: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.ContactLanding }))),
  Privacy: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.PrivacyLanding }))),
  Terms: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.TermsLanding }))),
  Features: lazy(() => import("./pages/seo/infoPages").then(m => ({ default: m.FeaturesLanding }))),
};

// Lazy — everything else is code-split so the feed renders first.
const CareScreen = lazy(() => import("./pages/CareScreen"));
const ShopScreen = lazy(() => import("./pages/ShopScreen"));
const ShopComingSoonScreen = lazy(() => import("./pages/ShopComingSoonScreen"));
const SosScreen = lazy(() => import("./pages/SosScreen"));
const LegalScreen = lazy(() => import("./pages/LegalScreen"));
const SettingsScreen = lazy(() => import("./pages/SettingsScreen"));
const ForumScreen = lazy(() => import("./pages/ForumScreen"));
const HealthScreen = lazy(() => import("./pages/HealthScreen"));
const HealthLogScreen = lazy(() => import("./pages/HealthLogScreen"));
const LearnScreen = lazy(() => import("./pages/LearnScreen"));
const ProfileScreen = lazy(() => import("./pages/ProfileScreen"));
const PublicProfileScreen = lazy(() => import("./pages/PublicProfileScreen"));
const PostDetailScreen = lazy(() => import("./pages/PostDetailScreen"));
const NotificationsScreen = lazy(() => import("./pages/NotificationsScreen"));
const ResetPasswordScreen = lazy(() => import("./pages/ResetPasswordScreen"));
const VetNearMeScreen = lazy(() => import("./pages/VetNearMeScreen"));
const PetDigiLockerScreen = lazy(() => import("./pages/PetDigiLockerScreen"));
const BudgetCalculatorScreen = lazy(() => import("./pages/BudgetCalculatorScreen"));
const OrderNowScreen = lazy(() => import("./pages/OrderNowScreen"));
const CompleteRegistrationScreen = lazy(() => import("./pages/CompleteRegistrationScreen"));
const AdminSeedScreen = lazy(() => import("./pages/AdminSeedScreen"));
const OnboardingScreen = lazy(() => import("./pages/OnboardingScreen"));
const InsuranceScreen = lazy(() => import("./pages/hub/InsuranceScreen"));
const NgoScreen = lazy(() => import("./pages/hub/NgoScreen"));
const NearbyScreen = lazy(() => import("./pages/NearbyScreen"));
const HomeScreen = lazy(() => import("./pages/HomeScreen"));
const PickupScreen = lazy(() => import("./pages/hub/PickupScreen"));
const RecommenderScreen = lazy(() => import("./pages/hub/RecommenderScreen"));
const PetcationScreen = lazy(() => import("./pages/hub/PetcationScreen"));
const PetMovingScreen = lazy(() => import("./pages/hub/PetMovingScreen"));
const MicrochipScreen = lazy(() => import("./pages/hub/MicrochipScreen"));
const RegisterMicrochipScreen = lazy(() => import("./pages/hub/RegisterMicrochipScreen"));
const PetCareScreen = lazy(() => import("./pages/hub/PetCareScreen"));
const AdminNotificationsScreen = lazy(() => import("./pages/admin/AdminNotificationsScreen"));
const AdminCompetitionsScreen = lazy(() => import("./pages/admin/AdminCompetitionsScreen"));
const AdminVetsScreen = lazy(() => import("./pages/admin/AdminVetsScreen"));
const AdminDashboardScreen = lazy(() => import("./pages/admin/AdminDashboardScreen"));
const BulkUpload = lazy(() => import("./pages/admin/BulkUpload"));
const AdminWelcomeEmailScreen = lazy(() => import("./pages/admin/AdminWelcomeEmailScreen"));
const BookAVetScreen = lazy(() => import("./pages/hub/BookAVetScreen"));
const BookAVetComingSoon = lazy(() => import("./pages/hub/BookAVetComingSoon"));
const HubVetProfileScreen = lazy(() => import("./pages/hub/VetProfileScreen"));
const ConfirmBookingScreen = lazy(() => import("./pages/hub/ConfirmBookingScreen"));
const BookingSuccessScreen = lazy(() => import("./pages/hub/BookingSuccessScreen"));
const MyBookingsScreen = lazy(() => import("./pages/MyBookingsScreen"));
const VetDashboardLayout = lazy(() => import("./components/vet/VetDashboardLayout"));
const VetGuard = lazy(() => import("./components/vet/VetGuard"));
const VetTodayScreen = lazy(() => import("./pages/vet/VetTodayScreen"));
const VetCalendarScreen = lazy(() => import("./pages/vet/VetCalendarScreen"));
const VetRequestsScreen = lazy(() => import("./pages/vet/VetRequestsScreen"));
const VetAvailabilityScreen = lazy(() => import("./pages/vet/VetAvailabilityScreen"));
const VetDashProfileScreen = lazy(() => import("./pages/vet/VetProfileScreen"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — avoid refetch storms when user returns
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      throwOnError: false,
      retry: (failureCount, error: any) => {
        // Don't retry auth/permission errors — fail fast instead of looping
        const status = error?.status ?? error?.code;
        if (status === 401 || status === 403 || status === "PGRST301") {
          console.warn("[Query] auth failure, clearing stale session", error);
          supabase.auth.signOut({ scope: "local" }).catch(() => {});
          return false;
        }
        if (failureCount === 0) console.warn("[Query] request failed", error);
        return failureCount < 1;
      },
    },
  },
});

const PageTracker = () => {
  const location = useLocation();
  useEffect(() => { trackPageView(location.pathname); }, [location]);
  return null;
};

// Public marketing landing at "/"; the app itself lives at /feeds.
const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <UserProfileProvider>
        <BrowserRouter>
          <GuestPopupProvider>
          <ChatbotProvider>
          <PageTracker />
          <Chatbot />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route path="/" element={<RegularUserRoute><PlayScreen /></RegularUserRoute>} />
            <Route path="/welcome" element={<HomeLanding />} />
            <Route path="/dog-care" element={<CarePage slug="dog-care" />} />
            <Route path="/cat-care" element={<CarePage slug="cat-care" />} />
            <Route path="/fish-care" element={<CarePage slug="fish-care" />} />
            <Route path="/bird-care" element={<CarePage slug="bird-care" />} />
            <Route path="/reptile-care" element={<CarePage slug="reptile-care" />} />
            <Route path="/vet-near-me" element={<SeoInfo.VetNearMe />} />
            <Route path="/pet-digilocker" element={<SeoInfo.DigiLocker />} />
            <Route path="/pet-budget-calculator" element={<SeoInfo.Budget />} />
            <Route path="/community" element={<SeoInfo.Community />} />
            <Route path="/pet-facts" element={<SeoInfo.PetFacts />} />
            <Route path="/faq" element={<SeoInfo.Faq />} />
            <Route path="/about-us" element={<SeoInfo.About />} />
            <Route path="/contact-us" element={<SeoInfo.Contact />} />
            <Route path="/privacy-policy" element={<SeoInfo.Privacy />} />
            <Route path="/terms-of-service" element={<SeoInfo.Terms />} />
            <Route path="/features" element={<SeoInfo.Features />} />
            <Route path="/settings" element={<SettingsScreen />} />

            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/onboarding" element={<RegularUserRoute><OnboardingScreen /></RegularUserRoute>} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
            <Route path="/complete-registration" element={<RegularUserRoute><CompleteRegistrationScreen /></RegularUserRoute>} />

            {/* Public to guests with feature gating: Feeds, Hub, Shop. Admin is redirected to /admin. */}
            <Route path="/home" element={<RegularUserRoute><HomeScreen /></RegularUserRoute>} />
            <Route path="/feeds" element={<RegularUserRoute><PlayScreen /></RegularUserRoute>} />
            <Route path="/nearby" element={<RegularUserRoute><NearbyScreen /></RegularUserRoute>} />
            <Route path="/nearby/:category" element={<RegularUserRoute><NearbyScreen /></RegularUserRoute>} />
            <Route path="/hub" element={<RegularUserRoute><CareScreen /></RegularUserRoute>} />
            <Route path="/hub/shop" element={<RegularUserRoute><CareScreen /></RegularUserRoute>} />
            <Route path="/hub/learn" element={<RegularUserRoute><CareScreen /></RegularUserRoute>} />
            <Route path="/mypet" element={<RegularUserRoute><ProtectedRoute><ShopScreen /></ProtectedRoute></RegularUserRoute>} />
            <Route path="/shop" element={<RegularUserRoute><ShopComingSoonScreen /></RegularUserRoute>} />
            <Route path="/sos" element={<SosScreen />} />
            {/* /profile also gated so admin doesn't see consumer profile */}

            {/* Hub sub-pages — Vet Near Me & SOS are public; rest require auth */}
            <Route path="/hub/sos" element={<SosScreen />} />
            <Route path="/hub/vet-near-me" element={<VetNearMeScreen />} />
            <Route path="/hub/budget" element={<RegularUserRoute><CareScreen /></RegularUserRoute>} />
            <Route path="/hub/legal" element={<ProtectedRoute><LegalScreen /></ProtectedRoute>} />
            <Route path="/hub/license" element={<ProtectedRoute><LegalScreen /></ProtectedRoute>} />
            <Route path="/hub/rights" element={<ProtectedRoute><LegalScreen /></ProtectedRoute>} />
            <Route path="/hub/insurance" element={<ProtectedRoute><InsuranceScreen /></ProtectedRoute>} />
            <Route path="/hub/ngo" element={<ProtectedRoute><NgoScreen /></ProtectedRoute>} />
            <Route path="/hub/pickup" element={<ProtectedRoute><PickupScreen /></ProtectedRoute>} />
            <Route path="/hub/recommender" element={<RecommenderScreen />} />
            <Route path="/hub/pet-recommender" element={<Navigate to="/mypet/pet-recommender" replace />} />
            <Route path="/hub/pet-care" element={<PetCareScreen />} />
            <Route path="/hub/petcation" element={<ProtectedRoute><PetcationScreen /></ProtectedRoute>} />
            <Route path="/hub/pet-moving" element={<ProtectedRoute><PetMovingScreen /></ProtectedRoute>} />
            <Route path="/hub/microchip" element={<MicrochipScreen />} />
            <Route path="/hub/microchip/register" element={<RegisterMicrochipScreen />} />
            <Route path="/hub/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />

            {/* MyPet sub-pages */}
            <Route path="/mypet/health" element={<ProtectedRoute><HealthLogScreen /></ProtectedRoute>} />
            <Route path="/mypet/locker" element={<ProtectedRoute><PetDigiLockerScreen /></ProtectedRoute>} />
            <Route path="/mypet/book-a-vet" element={<BookAVetScreen />} />
            <Route path="/mypet/book-a-vet/coming-soon" element={<BookAVetComingSoon />} />
            <Route path="/mypet/book-a-vet/:vetId" element={<HubVetProfileScreen />} />
            <Route path="/mypet/book-a-vet/:vetId/confirm" element={<ProtectedRoute><ConfirmBookingScreen /></ProtectedRoute>} />
            <Route path="/mypet/book-a-vet/success/:bookingId" element={<ProtectedRoute><BookingSuccessScreen /></ProtectedRoute>} />
            <Route path="/mypet/pet-recommender" element={<RecommenderScreen />} />

            {/* Other screens */}
            <Route path="/profile" element={<RegularUserRoute><ProtectedRoute><ProfileScreen /></ProtectedRoute></RegularUserRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><PublicProfileScreen /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsScreen /></ProtectedRoute>} />
            <Route path="/forum" element={<ProtectedRoute><ForumScreen /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><LearnScreen /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboardScreen /></ProtectedRoute>} />
            <Route path="/admin/seed" element={<ProtectedRoute><AdminSeedScreen /></ProtectedRoute>} />
            <Route path="/admin/bulk-upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotificationsScreen /></ProtectedRoute>} />
            <Route path="/admin/competitions" element={<ProtectedRoute><AdminCompetitionsScreen /></ProtectedRoute>} />
            <Route path="/admin/vets" element={<ProtectedRoute><AdminVetsScreen /></ProtectedRoute>} />
            <Route path="/admin/welcome-email" element={<ProtectedRoute><AdminWelcomeEmailScreen /></ProtectedRoute>} />

            {/* Legacy Book a Vet → MyPet redirects */}
            <Route path="/hub/book-a-vet" element={<Navigate to="/mypet/book-a-vet" replace />} />
            <Route path="/hub/book-a-vet/coming-soon" element={<Navigate to="/mypet/book-a-vet/coming-soon" replace />} />
            <Route path="/hub/book-a-vet/:vetId" element={<Navigate to="/mypet/book-a-vet" replace />} />
            <Route path="/hub/book-a-vet/:vetId/confirm" element={<Navigate to="/mypet/book-a-vet" replace />} />
            <Route path="/hub/book-a-vet/success/:bookingId" element={<Navigate to="/mypet/book-a-vet" replace />} />
            <Route path="/mypet/bookings" element={<ProtectedRoute><MyBookingsScreen /></ProtectedRoute>} />

            {/* Vet Dashboard */}
            <Route path="/vet-dashboard" element={<ProtectedRoute><VetGuard><VetDashboardLayout title="Today"><VetTodayScreen /></VetDashboardLayout></VetGuard></ProtectedRoute>} />
            <Route path="/vet-dashboard/calendar" element={<ProtectedRoute><VetGuard><VetDashboardLayout title="Calendar"><VetCalendarScreen /></VetDashboardLayout></VetGuard></ProtectedRoute>} />
            <Route path="/vet-dashboard/requests" element={<ProtectedRoute><VetGuard><VetDashboardLayout title="Requests"><VetRequestsScreen /></VetDashboardLayout></VetGuard></ProtectedRoute>} />
            <Route path="/vet-dashboard/availability" element={<ProtectedRoute><VetGuard><VetDashboardLayout title="Availability"><VetAvailabilityScreen /></VetDashboardLayout></VetGuard></ProtectedRoute>} />
            <Route path="/vet-dashboard/profile" element={<ProtectedRoute><VetGuard><VetDashboardLayout title="Profile"><VetDashProfileScreen /></VetDashboardLayout></VetGuard></ProtectedRoute>} />

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
          </Suspense>
          </ChatbotProvider>
          </GuestPopupProvider>
        </BrowserRouter>
        </UserProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>

);

export default App;
