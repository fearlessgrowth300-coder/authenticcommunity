import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BottomNav } from "@/components/BottomNav";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import MatchesFeed from "./pages/MatchesFeed";
import MatchProfile from "./pages/MatchProfile";
import CommunitiesFeed from "./pages/CommunitiesFeed";
import CommunityDetail from "./pages/CommunityDetail";
import MessagesList from "./pages/MessagesList";
import DirectMessage from "./pages/DirectMessage";
import EventsFeed from "./pages/EventsFeed";
import EventDetail from "./pages/EventDetail";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import Install from "./pages/Install";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/onboarding/:step" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/matches" element={<ProtectedRoute><MatchesFeed /></ProtectedRoute>} />
            <Route path="/matches/:id" element={<ProtectedRoute><MatchProfile /></ProtectedRoute>} />
            <Route path="/communities" element={<ProtectedRoute><CommunitiesFeed /></ProtectedRoute>} />
            <Route path="/communities/:id" element={<ProtectedRoute><CommunityDetail /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesList /></ProtectedRoute>} />
            <Route path="/messages/:id" element={<ProtectedRoute><DirectMessage /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventsFeed /></ProtectedRoute>} />
            <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/install" element={<Install />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
