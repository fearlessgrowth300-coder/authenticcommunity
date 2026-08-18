import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute, OnboardingRoute } from '@/components/ProtectedRoute'
import { Loader2 } from 'lucide-react'

// Page Loading Spinner Fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-brand-canvas flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <span className="text-xs font-semibold text-brand-muted">Loading...</span>
      </div>
    </div>
  )
}

// Lazy-loaded Feature Modules for Route-level Code Splitting
const Splash = lazy(() => import('@/features/auth/AuthPage').then(m => ({ default: m.Splash })))
const Login = lazy(() => import('@/features/auth/AuthPage').then(m => ({ default: m.Login })))
const Signup = lazy(() => import('@/features/auth/AuthPage').then(m => ({ default: m.Signup })))
const ForgotPassword = lazy(() => import('@/features/auth/AuthPage').then(m => ({ default: m.ForgotPassword })))
const ResetPassword = lazy(() => import('@/features/auth/AuthPage').then(m => ({ default: m.ResetPassword })))
const AuthCallback = lazy(() => import('@/features/auth/AuthPage').then(m => ({ default: m.AuthCallback })))

const OnboardingLocation = lazy(() => import('@/features/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingLocation })))
const OnboardingInterests = lazy(() => import('@/features/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingInterests })))
const OnboardingValues = lazy(() => import('@/features/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingValues })))
const OnboardingBio = lazy(() => import('@/features/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingBio })))

const Home = lazy(() => import('@/features/home/HomePage').then(m => ({ default: m.Home })))
const Notifications = lazy(() => import('@/features/home/HomePage').then(m => ({ default: m.Notifications })))
const QuickStart = lazy(() => import('@/features/home/HomePage').then(m => ({ default: m.QuickStart })))

const Matches = lazy(() => import('@/features/matching/MatchesPage').then(m => ({ default: m.Matches })))
const MatchDetail = lazy(() => import('@/features/matching/MatchesPage').then(m => ({ default: m.MatchDetail })))
const MatchFilter = lazy(() => import('@/features/matching/MatchesPage').then(m => ({ default: m.MatchFilter })))
const MatchSort = lazy(() => import('@/features/matching/MatchesPage').then(m => ({ default: m.MatchSort })))

const Communities = lazy(() => import('@/features/communities/CommunitiesPage').then(m => ({ default: m.Communities })))
const CommunityDetail = lazy(() => import('@/features/communities/CommunitiesPage').then(m => ({ default: m.CommunityDetail })))
const CommunityFilter = lazy(() => import('@/features/communities/CommunitiesPage').then(m => ({ default: m.CommunityFilter })))
const CreateCommunity = lazy(() => import('@/features/communities/CommunitiesPage').then(m => ({ default: m.CreateCommunity })))

const Events = lazy(() => import('@/features/events/EventsPage').then(m => ({ default: m.Events })))
const EventDetail = lazy(() => import('@/features/events/EventsPage').then(m => ({ default: m.EventDetail })))
const CreateEvent = lazy(() => import('@/features/events/EventsPage').then(m => ({ default: m.CreateEvent })))

const Messages = lazy(() => import('@/features/messaging/MessagesPage').then(m => ({ default: m.Messages })))
const DirectChat = lazy(() => import('@/features/messaging/MessagesPage').then(m => ({ default: m.DirectChat })))
const CommunityChat = lazy(() => import('@/features/messaging/MessagesPage').then(m => ({ default: m.CommunityChat })))

const Profile = lazy(() => import('@/features/profile/ProfilePages').then(m => ({ default: m.Profile })))
const EditProfile = lazy(() => import('@/features/profile/ProfilePages').then(m => ({ default: m.EditProfile })))
const Connections = lazy(() => import('@/features/profile/ProfilePages').then(m => ({ default: m.Connections })))
const Followers = lazy(() => import('@/features/profile/ProfilePages').then(m => ({ default: m.Followers })))
const MyCommunities = lazy(() => import('@/features/profile/ProfilePages').then(m => ({ default: m.MyCommunities })))

const SettingsHome = lazy(() => import('@/features/profile/SettingsPages').then(m => ({ default: m.SettingsHome })))
const AccountSettings = lazy(() => import('@/features/profile/SettingsPages').then(m => ({ default: m.AccountSettings })))
const PrivacySettings = lazy(() => import('@/features/profile/SettingsPages').then(m => ({ default: m.PrivacySettings })))
const NotificationSettings = lazy(() => import('@/features/profile/SettingsPages').then(m => ({ default: m.NotificationSettings })))

const Feed = lazy(() => import('@/features/feed/FeedPages').then(m => ({ default: m.Feed })))
const CreateHub = lazy(() => import('@/features/feed/FeedPages').then(m => ({ default: m.CreateHub })))
const CreatePost = lazy(() => import('@/features/feed/FeedPages').then(m => ({ default: m.CreatePost })))

const Videos = lazy(() => import('@/features/social/VideosPage').then(m => ({ default: m.Videos })))
const StoriesViewer = lazy(() => import('@/features/stories/StoriesViewerPage').then(m => ({ default: m.StoriesViewer })))
const Verification = lazy(() => import('@/features/verification/VerificationPage').then(m => ({ default: m.Verification })))
const SuspendedAccount = lazy(() => import('@/features/moderation/SuspendedAccountPage').then(m => ({ default: m.SuspendedAccount })))

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Splash />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPassword />
            </PublicOnlyRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Onboarding routes */}
        <Route
          path="/onboarding/location"
          element={
            <OnboardingRoute>
              <OnboardingLocation />
            </OnboardingRoute>
          }
        />
        <Route
          path="/onboarding/interests"
          element={
            <OnboardingRoute>
              <OnboardingInterests />
            </OnboardingRoute>
          }
        />
        <Route
          path="/onboarding/values"
          element={
            <OnboardingRoute>
              <OnboardingValues />
            </OnboardingRoute>
          }
        />
        <Route
          path="/onboarding/bio"
          element={
            <OnboardingRoute>
              <OnboardingBio />
            </OnboardingRoute>
          }
        />

        {/* Core Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quick-start"
          element={
            <ProtectedRoute>
              <QuickStart />
            </ProtectedRoute>
          }
        />

        {/* Discovery / Matches */}
        <Route path="/discover" element={<Navigate to="/matches" replace />} />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches/filter"
          element={
            <ProtectedRoute>
              <MatchFilter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches/sort"
          element={
            <ProtectedRoute>
              <MatchSort />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches/:id"
          element={
            <ProtectedRoute>
              <MatchDetail />
            </ProtectedRoute>
          }
        />

        {/* Communities */}
        <Route
          path="/communities"
          element={
            <ProtectedRoute>
              <Communities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/create"
          element={
            <ProtectedRoute>
              <CreateCommunity />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/filter"
          element={
            <ProtectedRoute>
              <CommunityFilter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/:id"
          element={
            <ProtectedRoute>
              <CommunityDetail />
            </ProtectedRoute>
          }
        />

        {/* Events */}
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/create"
          element={
            <ProtectedRoute>
              <CreateEvent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <EventDetail />
            </ProtectedRoute>
          }
        />

        {/* Messaging */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/direct"
          element={
            <ProtectedRoute>
              <DirectChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/direct/:id"
          element={
            <ProtectedRoute>
              <DirectChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/community"
          element={
            <ProtectedRoute>
              <CommunityChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <DirectChat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities/:id/chat"
          element={
            <ProtectedRoute>
              <CommunityChat />
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/connections"
          element={
            <ProtectedRoute>
              <Connections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/communities"
          element={
            <ProtectedRoute>
              <MyCommunities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/followers"
          element={
            <ProtectedRoute>
              <Followers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/verification"
          element={
            <ProtectedRoute>
              <Verification />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/account"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/privacy"
          element={
            <ProtectedRoute>
              <PrivacySettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/notifications"
          element={
            <ProtectedRoute>
              <NotificationSettings />
            </ProtectedRoute>
          }
        />

        {/* Social / Feed / Stories / Videos */}
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/videos"
          element={
            <ProtectedRoute>
              <Videos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories"
          element={
            <ProtectedRoute>
              <StoriesViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create/post"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />

        {/* Suspended Account */}
        <Route
          path="/suspended"
          element={
            <ProtectedRoute>
              <SuspendedAccount />
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  )
}
