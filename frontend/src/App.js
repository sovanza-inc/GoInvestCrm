import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import AuthCallback from "@/pages/AuthCallback";
import DashboardPage from "@/pages/DashboardPage";
import LeadsPage from "@/pages/LeadsPage";
import CRMPage from "@/pages/CRMPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import TemplatesPage from "@/pages/TemplatesPage";
import SettingsPage from "@/pages/SettingsPage";
import PricingPage from "@/pages/PricingPage";
import BlogPage from "@/pages/BlogPage";
import BlogDetailPage from "@/pages/BlogDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import TeamPage from "@/pages/TeamPage";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-muted-foreground">Loading...</div></div>;

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogDetailPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/crm" element={<CRMPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/billing/success" element={<PricingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/team" element={<TeamPage />} />
      </Route>
    </Routes>
  );
}

function AppRouter() {
  const location = useLocation();
  // CRITICAL: Check for session_id synchronously during render to handle Google OAuth callback
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  return <AppRoutes />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster theme="dark" position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
