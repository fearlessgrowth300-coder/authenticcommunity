import { Navigate, Route, Routes } from 'react-router-dom'
import { Login, Signup, Splash } from './pages/Auth'
import { OnboardingBio, OnboardingInterests, OnboardingLocation, OnboardingValues } from './pages/Onboarding'
import { Home, Notifications, QuickStart } from './pages/Home'
import { MatchDetail, MatchFilter, MatchSort, Matches } from './pages/Matches'
import { Communities, CommunityDetail, CommunityFilter, CreateCommunity } from './pages/Communities'
import { CreateEvent, EventDetail, Events } from './pages/Events'
import { CommunityChat, DirectChat, Messages } from './pages/Messages'
import { Connections, EditProfile, Followers, MyCommunities, Profile } from './pages/Profile'
import { AccountSettings, NotificationSettings, PrivacySettings, SettingsHome } from './pages/Settings'
import { CreateHub, CreatePost, Feed, StoriesViewer, Verification, Videos } from './pages/Social'

export default function App(){return <Routes>
  <Route path="/" element={<Splash/>}/>
  <Route path="/login" element={<Login/>}/>
  <Route path="/signup" element={<Signup/>}/>

  <Route path="/onboarding/location" element={<OnboardingLocation/>}/>
  <Route path="/onboarding/interests" element={<OnboardingInterests/>}/>
  <Route path="/onboarding/values" element={<OnboardingValues/>}/>
  <Route path="/onboarding/bio" element={<OnboardingBio/>}/>

  <Route path="/home" element={<Home/>}/>
  <Route path="/notifications" element={<Notifications/>}/>
  <Route path="/quick-start" element={<QuickStart/>}/>

  <Route path="/discover" element={<Navigate to="/matches" replace/>}/>
  <Route path="/matches" element={<Matches/>}/>
  <Route path="/matches/filter" element={<MatchFilter/>}/>
  <Route path="/matches/sort" element={<MatchSort/>}/>
  <Route path="/matches/:id" element={<MatchDetail/>}/>

  <Route path="/communities" element={<Communities/>}/>
  <Route path="/communities/create" element={<CreateCommunity/>}/>
  <Route path="/communities/filter" element={<CommunityFilter/>}/>
  <Route path="/communities/:id" element={<CommunityDetail/>}/>

  <Route path="/events" element={<Events/>}/>
  <Route path="/events/create" element={<CreateEvent/>}/>
  <Route path="/events/:id" element={<EventDetail/>}/>

  <Route path="/messages" element={<Messages/>}/>
  <Route path="/messages/direct" element={<DirectChat/>}/>
  <Route path="/messages/community" element={<CommunityChat/>}/>

  <Route path="/profile" element={<Profile/>}/>
  <Route path="/profile/edit" element={<EditProfile/>}/>
  <Route path="/profile/connections" element={<Connections/>}/>
  <Route path="/profile/communities" element={<MyCommunities/>}/>
  <Route path="/profile/followers" element={<Followers/>}/>
  <Route path="/profile/verification" element={<Verification/>}/>

  <Route path="/settings" element={<SettingsHome/>}/>
  <Route path="/settings/account" element={<AccountSettings/>}/>
  <Route path="/settings/privacy" element={<PrivacySettings/>}/>
  <Route path="/settings/notifications" element={<NotificationSettings/>}/>

  <Route path="/feed" element={<Feed/>}/>
  <Route path="/videos" element={<Videos/>}/>
  <Route path="/stories" element={<StoriesViewer/>}/>
  <Route path="/create" element={<CreateHub/>}/>
  <Route path="/create/post" element={<CreatePost/>}/>

  <Route path="*" element={<Navigate to="/home" replace/>}/>
</Routes>}
