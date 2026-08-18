import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthCallback, ForgotPassword, Login, ResetPassword, Signup, Splash } from './pages/Auth'
import { OnboardingBio, OnboardingInterests, OnboardingLocation, OnboardingValues } from './pages/Onboarding'
import { Home, Notifications, QuickStart } from './pages/Home'
import { MatchDetail, MatchFilter, MatchSort, Matches } from './pages/Matches'
import { Communities, CommunityDetail, CommunityFilter, CreateCommunity } from './pages/Communities'
import { CreateEvent, EventDetail, Events } from './pages/Events'
import { CommunityChat, DirectChat, Messages } from './pages/Messages'
import { Connections, EditProfile, Followers, MyCommunities, Profile } from './pages/Profile'
import { AccountSettings, NotificationSettings, PrivacySettings, SettingsHome } from './pages/Settings'
import { CreateHub, CreatePost, Feed, StoriesViewer, Verification, Videos } from './pages/Social'
import { MockAppProvider } from './lib/mockApp'
import { ProtectedRoute, PublicOnlyRoute, OnboardingRoute } from '@/components/ProtectedRoute'
import SuspendedAccount from '@/pages/SuspendedAccount'

export default function App() {
  return (
    <MockAppProvider>
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

        {/* Protected App Routes */}
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
          path="/messages/community"
          element={
            <ProtectedRoute>
              <CommunityChat />
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

        <Route
          path="/suspended"
          element={
            <ProtectedRoute>
              <SuspendedAccount />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </MockAppProvider>
  )
}
