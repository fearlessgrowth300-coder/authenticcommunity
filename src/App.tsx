import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BottomNav } from "@/components/BottomNav";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const MatchesFeed = lazy(() => import("./pages/MatchesFeed"));
const MatchProfile = lazy(() => import("./pages/MatchProfile"));
const CommunitiesFeed = lazy(() => import("./pages/CommunitiesFeed"));
const CommunityDetail = lazy(() => import("./pages/CommunityDetail"));
const MessagesList = lazy(() => import("./pages/MessagesList"));
const DirectMessage = lazy(() => import("./pages/DirectMessage"));
const EventsFeed = lazy(() => import("./pages/EventsFeed"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const PrivacySettings = lazy(() => import("./pages/PrivacySettings"));
const NotificationSettings = lazy(() => import("./pages/NotificationSettings"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const Subscription = lazy(() => import("./pages/Subscription"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Install = lazy(() => import("./pages/Install"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CreateStory = lazy(() => import("./pages/CreateStory"));
const StoryViewer = lazy(() => import("./pages/StoryViewer"));
const StoryReplies = lazy(() => import("./pages/StoryReplies"));
const StoryViewers = lazy(() => import("./pages/StoryViewers"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const LikedUsers = lazy(() => import("./pages/LikedUsers"));
const ProfileViewers = lazy(() => import("./pages/ProfileViewers"));
const Connections = lazy(() => import("./pages/Connections"));
const SuspendedAccount = lazy(() => import("./pages/SuspendedAccount"));
const CommunityGuidelines = lazy(() => import("./pages/CommunityGuidelines"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <ErrorBoundary><QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/community-guidelines" element={<CommunityGuidelines />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/onboarding/complete" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
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
              <Route path="/profile/liked" element={<ProtectedRoute><LikedUsers /></ProtectedRoute>} />
              <Route path="/profile/viewers" element={<ProtectedRoute><ProfileViewers /></ProtectedRoute>} />
              <Route path="/profile/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/settings/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              <Route path="/settings/privacy" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
              <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
              <Route path="/settings/help" element={<ProtectedRoute><HelpSupport /></ProtectedRoute>} />
              <Route path="/settings/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/stories/create" element={<ProtectedRoute><CreateStory /></ProtectedRoute>} />
              <Route path="/stories/:id" element={<ProtectedRoute><StoryViewer /></ProtectedRoute>} />
              <Route path="/stories/:id/replies" element={<ProtectedRoute><StoryReplies /></ProtectedRoute>} />
              <Route path="/stories/:id/viewers" element={<ProtectedRoute><StoryViewers /></ProtectedRoute>} />
              <Route path="/install" element={<Install />} />
              <Route path="/suspended" element={<ProtectedRoute><SuspendedAccount /></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider></ErrorBoundary>
);

export default App;
