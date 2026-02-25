import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Profile from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding/:step" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/matches" element={<MatchesFeed />} />
          <Route path="/matches/:id" element={<MatchProfile />} />
          <Route path="/communities" element={<CommunitiesFeed />} />
          <Route path="/communities/:id" element={<CommunityDetail />} />
          <Route path="/messages" element={<MessagesList />} />
          <Route path="/messages/:id" element={<DirectMessage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
