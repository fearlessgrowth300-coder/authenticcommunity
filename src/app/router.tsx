import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute, OnboardingRoute } from '@/components/ProtectedRoute'

// Feature pages
import { AuthCallback, ForgotPassword, Login, ResetPassword, Signup, Splash } from '@/features/auth/AuthPage'
import { OnboardingBio, OnboardingInterests, OnboardingLocation, OnboardingValues } from '@/features/onboarding/OnboardingPage'
import { Home, Notifications, QuickStart } from '@/features/home/HomePage'
import { MatchDetail, MatchFilter, MatchSort, Matches } from '@/features/matching/MatchesPage'
import { Communities, CommunityDetail, CommunityFilter, CreateCommunity } from '@/features/communities/CommunitiesPage'
import { CreateEvent, EventDetail, Events } from '@/features/events/EventsPage'
import { CommunityChat, DirectChat, Messages } from '@/features/messaging/MessagesPage'
import { Connections, EditProfile, Followers, MyCommunities, Profile } from '@/features/profile/ProfilePages'
import { AccountSettings, NotificationSettings, PrivacySettings, SettingsHome } from '@/features/profile/SettingsPages'
import { CreateHub, CreatePost, Feed } from '@/features/feed/FeedPages'
import { Videos } from '@/features/social/VideosPage'
import { StoriesViewer } from '@/features/stories/StoriesViewerPage'
import { Verification } from '@/features/verification/VerificationPage'
import { SuspendedAccount } from '@/features/moderation/SuspendedAccountPage'

export function AppRouter() {
  return (
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
  )
}
