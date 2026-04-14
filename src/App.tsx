import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthScreen from "./pages/AuthScreen";
import FeedScreen from "./pages/FeedScreen";
import ForumScreen from "./pages/ForumScreen";
import HealthScreen from "./pages/HealthScreen";
import HealthLogScreen from "./pages/HealthLogScreen";
import LearnScreen from "./pages/LearnScreen";
import ProfileScreen from "./pages/ProfileScreen";
import NotificationsScreen from "./pages/NotificationsScreen";
import ResetPasswordScreen from "./pages/ResetPasswordScreen";
import VetNearMeScreen from "./pages/VetNearMeScreen";
import PetDigiLockerScreen from "./pages/PetDigiLockerScreen";
import BudgetCalculatorScreen from "./pages/BudgetCalculatorScreen";
import OrderNowScreen from "./pages/OrderNowScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
            <Route path="/feed" element={<ProtectedRoute><FeedScreen /></ProtectedRoute>} />
            <Route path="/forum" element={<ProtectedRoute><ForumScreen /></ProtectedRoute>} />
            <Route path="/health" element={<ProtectedRoute><HealthScreen /></ProtectedRoute>} />
            <Route path="/health/log" element={<ProtectedRoute><HealthLogScreen /></ProtectedRoute>} />
            <Route path="/health/vet-near-me" element={<ProtectedRoute><VetNearMeScreen /></ProtectedRoute>} />
            <Route path="/health/digilocker" element={<ProtectedRoute><PetDigiLockerScreen /></ProtectedRoute>} />
            <Route path="/health/budget" element={<ProtectedRoute><BudgetCalculatorScreen /></ProtectedRoute>} />
            <Route path="/health/order" element={<ProtectedRoute><OrderNowScreen /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><LearnScreen /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsScreen /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
