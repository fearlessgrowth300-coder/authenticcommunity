# Kindred Spirits

You are building a modern, authentic community connection platform called "Authentic Community Connection" - a web app that helps people find genuine connections, meaningful friendships, and authentic communities based on shared interests and values.

PROJECT OVERVIEW:

The app solves the problem of loneliness and isolation by using AI-powered matching to connect people with similar interests and values in their local area. It combines user-to-user matching with community discovery and event management.

TECH STACK:

- Frontend: React with TypeScript

- Database: Supabase (PostgreSQL)

- Maps: Mapbox

- Email: Resend

- AI: OpenAI

- Styling: TailwindCSS

- Icons: Lucide React

API INTEGRATIONS:

1. Supabase for authentication, database, and real-time subscriptions

2. Mapbox for maps, geocoding, and location services

3. Resend for email notifications

4. OpenAI for AI-powered matching algorithm

5. Stripe for payments (implement later)

CORE FEATURES:

1. User Authentication (Email/Password, Google OAuth, GitHub OAuth)

2. User Profile Creation with interests, values, and location

3. AI-Powered Match Algorithm (generates matches based on interests and values)

4. Match Discovery (swipe-like interface for viewing matches)

5. Direct Messaging (one-on-one conversations)

6. Community Discovery (find and join local communities)

7. Community Chat (group messaging)

8. Event Management (create, discover, and RSVP to events)

9. User Reviews and Ratings (authenticity ratings)

10. Real-time Notifications

11. Premium Subscriptions (freemium model)

12. User Safety Features (reporting, blocking)

APP STRUCTURE (32 Screens):

SECTION 1: AUTHENTICATION & ONBOARDING

- Splash Screen (auto-redirect to login)

- Login Screen (email/password, Google OAuth, GitHub OAuth)

- Sign Up Screen (create account)

- Profile Setup Wizard Step 1: Location (city, state, country, map)

- Profile Setup Wizard Step 2: Interests (select interests with proficiency)

- Profile Setup Wizard Step 3: Values (select core values with importance)

- Profile Setup Wizard Step 4: Photo & Bio (upload photo, write bio)

SECTION 2: HOME / DASHBOARD

- Home Dashboard (stats, featured matches, communities, events)

- Notifications Center (all notifications with filters)

- Quick Start Guide (onboarding guide)

SECTION 3: DISCOVER MATCHES

- Matches Feed (swipe-like interface with match cards)

- Match Profile Detail (full profile with reviews and conversation starters)

- Matches Filter Modal (filter by distance, age, interests, values, score)

- Matches Sort Menu (sort by newest, best match, nearest, etc)

SECTION 4: DISCOVER COMMUNITIES

- Communities Feed (discover nearby communities)

- Community Detail (full community info, members, events, chat)

- Create Community (create new community)

- Communities Filter Modal (filter by category, distance, size)

SECTION 5: MESSAGES

- Messages List (all conversations)

- Direct Message Chat (one-on-one messaging)

- Community Chat (group messaging)

SECTION 6: EVENTS

- Events Feed (discover nearby events)

- Event Detail (full event info, attendees, RSVP)

- Create Event (create new event)

SECTION 7: PROFILE

- My Profile (view profile, stats, reviews)

- Edit Profile (edit all profile information)

- My Connections (view all connections)

- My Communities (view all joined communities)

SECTION 8: SETTINGS

- Settings Home (settings menu)

- Account Settings (email, password, 2FA)

- Privacy & Safety (privacy toggles, blocked users)

- Notification Settings (notification preferences)

UI/UX REQUIREMENTS:

1. Modern, clean design with a friendly vibe

2. Use TailwindCSS for styling

3. Responsive design (mobile-first)

4. Smooth animations and transitions

5. Color scheme: Primary blue (#3b82f6), Secondary pink (#ec4899), Neutral gray

6. Icons from Lucide React

7. Cards for content organization

8. Modals for filters and forms

9. Bottom navigation for main sections

10. Real-time updates with Supabase subscriptions

SPECIFIC SCREENS TO BUILD FIRST:

1. Splash Screen - Auto-redirect to login if not authenticated

2. Login Screen - Email/password and OAuth options

3. Sign Up Screen - Create new account

4. Profile Setup Wizard (4 steps) - Complete user profile

5. Home Dashboard - Main app interface

6. Matches Feed - Swipe-like interface

7. Match Profile Detail - View match details

8. Communities Feed - Discover communities

9. Community Detail - View community

10. Messages List - View conversations

11. Direct Message Chat - Send/receive messages

12. Profile Screen - View user profile

13. Settings Screen - App settings

IMPORTANT IMPLEMENTATION DETAILS:

Authentication:

- Use Supabase Auth for email/password and OAuth

- Store user data in Supabase users table

- Implement JWT token handling

- Add logout functionality

Database:

- Use Supabase PostgreSQL database

- Create tables: users, user_interests, user_values, communities, community_members, matches, connections, messages, community_messages, events, event_attendees, reviews, notifications, subscriptions, reports, analytics

- Use UUID for primary keys

- Add proper indexes for performance

- Create views for common queries

Real-time Features:

- Use Supabase real-time subscriptions for messages

- Subscribe to notifications in real-time

- Update match feed in real-time

- Show online status for users

Maps Integration:

- Use Mapbox for displaying maps

- Show user location on map

- Show nearby communities and events

- Add geocoding for address input

- Calculate distances between users

AI Matching:

- Use OpenAI to generate match scores

- Analyze common interests and values

- Generate conversation starters

- Analyze profile authenticity

Email Notifications:

- Use Resend for sending emails

- Send welcome email on signup

- Send match notifications

- Send message notifications

- Send event reminders

- Send weekly digest

Data Validation:

- Validate email format

- Validate password strength

- Validate location data

- Validate image uploads

- Validate form inputs

Error Handling:

- Show user-friendly error messages

- Handle network errors gracefully

- Implement retry logic for failed requests

- Log errors for debugging

Performance:

- Use lazy loading for images

- Implement pagination for lists

- Cache API responses

- Optimize database queries

- Use React.memo for components

- Implement code splitting

Security:

- Use HTTPS for all requests

- Store sensitive data securely

- Implement rate limiting

- Validate user input

- Implement CSRF protection

- Use secure cookies

DESIGN SPECIFICATIONS:

- Font: Inter or similar sans-serif

- Primary Color: #3b82f6 (Blue)

- Secondary Color: #ec4899 (Pink)

- Neutral: #6b7280 (Gray)

- Background: #ffffff (White) or #f9fafb (Light Gray)

- Border Radius: 8px for cards, 4px for buttons

- Spacing: 8px base unit (8, 16, 24, 32, 40, 48, 56, 64px)

- Shadows: Subtle shadows for depth

- Typography: 

  - H1: 32px bold

  - H2: 24px bold

  - H3: 20px semibold

  - Body: 16px regular

  - Small: 14px regular

COMPONENT STRUCTURE:

- Create reusable components for:

  - Cards (user card, community card, event card)

  - Buttons (primary, secondary, tertiary)

  - Input fields (text, email, password, textarea)

  - Modals (filter, form, confirmation)

  - Navigation (bottom nav, header)

  - Lists (user list, message list, event list)

  - Maps (map display, marker)

  - Notifications (notification item, notification center)

STATE MANAGEMENT:

- Use React Context for global state

- Use useState for local component state

- Use useEffect for side effects

- Use custom hooks for API calls

ROUTING:

- Use React Router for navigation

- Create routes for each screen

- Implement protected routes for authenticated users

- Add loading states for route transitions

API INTEGRATION:

- Create API service functions for each endpoint

- Handle loading, error, and success states

- Implement error boundaries

- Add retry logic for failed requests

- Use environment variables for API keys

TESTING:

- Add basic error handling

- Test authentication flow

- Test API integrations

- Test real-time features

- Test responsive design

DEPLOYMENT:

- Deploy to Vercel or Netlify

- Set up environment variables

- Configure CORS for APIs

- Set up SSL certificate

- Configure custom domain

ADDITIONAL FEATURES TO CONSIDER:

1. User search functionality

2. Advanced filtering options

3. User recommendations

4. Community recommendations

5. Event recommendations

6. User badges and achievements

7. Leaderboards

8. Social sharing

9. Analytics dashboard

10. Admin panel

START WITH:

1. Create the basic app structure with routing

2. Implement authentication (login, signup, logout)

3. Create profile setup wizard

4. Build home dashboard

5. Implement matches feed and profile

6. Add messaging functionality

7. Add communities feature

8. Add events feature

9. Add profile and settings screens

10. Implement real-time features

11. Add email notifications

12. Optimize and polish

IMPORTANT NOTES:

- Use TypeScript for type safety

- Add proper error handling throughout

- Implement loading states for all async operations

- Use responsive design for mobile and desktop

- Add accessibility features (ARIA labels, keyboard navigation)

- Implement proper form validation

- Add confirmation dialogs for destructive actions

- Use optimistic updates for better UX

- Implement proper caching strategies

- Add analytics tracking

Let me know if you need any clarification or have questions about the implementation!

Supabase Implementation Code
// Initialize Supabase in your Lovable.dev app
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://[project-id].supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGc...'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY )

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Sign up new user
export async function signUp(email, password, firstName, lastName) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  })
  
  if (error) throw error
  
  // Create user profile
  const { error: profileError } = await supabase
    .from('users')
    .insert([
      {
        id: data.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        password_hash: 'handled_by_auth'
      }
    ])
  
  if (profileError) throw profileError
  return data
}

// Sign in user
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  })
  
  if (error) throw error
  return data
}

// Sign out user
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ============================================
// USER PROFILE FUNCTIONS
// ============================================

// Update user profile
export async function updateUserProfile(userId, profileData) {
  const { data, error } = await supabase
    .from('users')
    .update({
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      bio: profileData.bio,
      age: profileData.age,
      gender: profileData.gender,
      location_city: profileData.city,
      location_state: profileData.state,
      location_country: profileData.country,
      latitude: profileData.latitude,
      longitude: profileData.longitude,
      profile_image_url: profileData.profileImage,
      updated_at: new Date()
    })
    .eq('id', userId)
    .select()
  
  if (error) throw error
  return data
}

// Add user interests
export async function addUserInterest(userId, interestName, category, proficiency) {
  const { data, error } = await supabase
    .from('user_interests')
    .insert([
      {
        user_id: userId,
        interest_name: interestName,
        interest_category: category,
        proficiency_level: proficiency
      }
    ])
    .select()
  
  if (error) throw error
  return data
}

// Add user values
export async function addUserValue(userId, valueName, importance) {
  const { data, error } = await supabase
    .from('user_values')
    .insert([
      {
        user_id: userId,
        value_name: valueName,
        importance_level: importance
      }
    ])
    .select()
  
  if (error) throw error
  return data
}

// Get user profile with stats
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('user_profiles_with_stats')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// ============================================
// MATCHING FUNCTIONS
// ============================================

// Get nearby users for matching
export async function getNearbyUsers(latitude, longitude, radiusKm = 50) {
  const { data, error } = await supabase.rpc('nearby_users', {
    lat: latitude,
    long: longitude,
    radius_km: radiusKm
  })
  
  if (error) throw error
  return data
}

// Create match
export async function createMatch(userId1, userId2, matchScore, reason) {
  const { data, error } = await supabase
    .from('matches')
    .insert([
      {
        user_id_1: userId1 < userId2 ? userId1 : userId2,
        user_id_2: userId1 < userId2 ? userId2 : userId1,
        match_score: matchScore,
        match_reason: reason,
        status: 'pending'
      }
    ])
    .select()
  
  if (error) throw error
  return data
}

// Get user matches
export async function getUserMatches(userId) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      user_id_1: users!matches_user_id_1_fkey(first_name, last_name, profile_image_url),
      user_id_2: users!matches_user_id_2_fkey(first_name, last_name, profile_image_url)
    `)
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .eq('status', 'pending')
    .order('match_score', { ascending: false })
  
  if (error) throw error
  return data
}

// ============================================
// COMMUNITY FUNCTIONS
// ============================================

// Create community
export async function createCommunity(userId, communityData) {
  const { data, error } = await supabase
    .from('communities')
    .insert([
      {
        creator_id: userId,
        community_name: communityData.name,
        description: communityData.description,
        category: communityData.category,
        location_city: communityData.city,
        location_state: communityData.state,
        location_country: communityData.country,
        latitude: communityData.latitude,
        longitude: communityData.longitude,
        profile_image_url: communityData.image,
        community_type: communityData.type
      }
    ])
    .select()
  
  if (error) throw error
  
  // Add creator as member
  await supabase
    .from('community_members')
    .insert([
      {
        community_id: data[0].id,
        user_id: userId,
        role: 'admin'
      }
    ])
  
  return data
}

// Get nearby communities
export async function getNearByCommunities(latitude, longitude, radiusKm = 50) {
  const { data, error } = await supabase.rpc('nearby_communities', {
    lat: latitude,
    long: longitude,
    radius_km: radiusKm
  })
  
  if (error) throw error
  return data
}

// Join community
export async function joinCommunity(communityId, userId) {
  const { data, error } = await supabase
    .from('community_members')
    .insert([
      {
        community_id: communityId,
        user_id: userId,
        role: 'member'
      }
    ])
    .select()
  
  if (error) throw error
  return data
}

// ============================================
// REAL-TIME SUBSCRIPTIONS
// ============================================

// Subscribe to new messages
export function subscribeToMessages(userId, callback) {
  const subscription = supabase
    .from(`messages:recipient_id=eq.${userId}`)
    .on('INSERT', payload => {
      callback(payload.new)
    })
    .subscribe()
  
  return subscription
}

// Subscribe to community messages
export function subscribeToCommunityMessages(communityId, callback) {
  const subscription = supabase
    .from(`community_messages:community_id=eq.${communityId}`)
    .on('INSERT', payload => {
      callback(payload.new)
    })
    .subscribe()
  
  return subscription
}

// Subscribe to notifications
export function subscribeToNotifications(userId, callback) {
  const subscription = supabase
    .from(`notifications:user_id=eq.${userId}`)
    .on('INSERT', payload => {
      callback(payload.new)
    })
    .subscribe()
  
  return subscription
}


Mapbox Implementation Code
// Initialize Mapbox

import mapboxgl from 'mapbox-gl'

const MAPBOX_TOKEN = 'pk.eyJ1IjoieW91cmFjY291bnQiLCJhIjoiY...'

mapboxgl.accessToken = MAPBOX_TOKEN

// ============================================

// MAP DISPLAY FUNCTIONS

// ============================================

// Initialize map

export function initializeMap(containerId, latitude, longitude, zoom = 12) {

  const map = new mapboxgl.Map({

    container: containerId,

    style: 'mapbox://styles/mapbox/streets-v12',

    center: [longitude, latitude],

    zoom: zoom

  })

  

  return map

}

// Add marker to map

export function addMarker(map, latitude, longitude, title, type = 'user') {

  const color = type === 'user' ? '#3b82f6' : '#ef4444'

  

  const el = document.createElement('div')

  el.className = 'marker'

  el.style.backgroundColor = color

  el.style.width = '30px'

  el.style.height = '30px'

  el.style.borderRadius = '50%'

  el.style.cursor = 'pointer'

  

  const marker = new mapboxgl.Marker(el)

    .setLngLat([longitude, latitude])

    .setPopup(new mapboxgl.Popup().setHTML(`<h3>${title}</h3>`))

    .addTo(map)

  

  return marker

}

// Add multiple markers (for communities/users)

export function addMultipleMarkers(map, locations) {

  locations.forEach(location => {

    addMarker(map, location.latitude, location.longitude, location.name, location.type)

  })

}

// ============================================

// GEOCODING FUNCTIONS

// ============================================

// Get coordinates from address

export async function getCoordinatesFromAddress(address) {

  const response = await fetch(

    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address )}.json?access_token=${MAPBOX_TOKEN}`

  )

  

  const data = await response.json()

  

  if (data.features.length === 0) {

    throw new Error('Address not found')

  }

  

  const [longitude, latitude] = data.features[0].center

  return { latitude, longitude, place: data.features[0].place_name }

}

// Get address from coordinates

export async function getAddressFromCoordinates(latitude, longitude) {

  const response = await fetch(

    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`

   )

  

  const data = await response.json()

  

  if (data.features.length === 0) {

    throw new Error('Location not found')

  }

  

  return data.features[0].place_name

}

// ============================================

// DISTANCE & DIRECTIONS FUNCTIONS

// ============================================

// Calculate distance between two points

export async function calculateDistance(lat1, lon1, lat2, lon2) {

  const response = await fetch(

    `https://api.mapbox.com/directions/v5/mapbox/driving/${lon1},${lat1};${lon2},${lat2}?access_token=${MAPBOX_TOKEN}`

   )

  

  const data = await response.json()

  

  if (!data.routes || data.routes.length === 0) {

    throw new Error('Route not found')

  }

  

  const distanceKm = data.routes[0].distance / 1000

  const durationMinutes = data.routes[0].duration / 60

  

  return { distanceKm, durationMinutes }

}

// Get directions

export async function getDirections(lat1, lon1, lat2, lon2) {

  const response = await fetch(

    `https://api.mapbox.com/directions/v5/mapbox/driving/${lon1},${lat1};${lon2},${lat2}?steps=true&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`

   )

  

  const data = await response.json()

  

  if (!data.routes || data.routes.length === 0) {

    throw new Error('Route not found')

  }

  

  return data.routes[0]

}

// Draw route on map

export function drawRoute(map, route) {

  if (map.getSource('route')) {

    map.removeLayer('route')

    map.removeSource('route')

  }

  

  map.addSource('route', {

    type: 'geojson',

    data: {

      type: 'Feature',

      geometry: route.geometry

    }

  })

  

  map.addLayer({

    id: 'route',

    type: 'line',

    source: 'route',

    layout: {

      'line-join': 'round',

      'line-cap': 'round'

    },

    paint: {

      'line-color': '#3b82f6',

      'line-width': 5

    }

  })

}

// ============================================

// SEARCH FUNCTIONS

// ============================================

// Search places

export async function searchPlaces(query, latitude, longitude, radiusKm = 50) {

  const response = await fetch(

    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query )}.json?proximity=${longitude},${latitude}&access_token=${MAPBOX_TOKEN}`

  )

  

  const data = await response.json()

  return data.features

}

// Get nearby places

export async function getNearbyPlaces(latitude, longitude, placeType, radiusKm = 5) {

  const response = await fetch(

    `https://api.mapbox.com/geocoding/v5/mapbox.places/${placeType}.json?proximity=${longitude},${latitude}&access_token=${MAPBOX_TOKEN}`

   )

  

  const data = await response.json()

  return data.features

}

Resend Implementation Code
// Initialize Resend
import { Resend } from 'resend'

const RESEND_API_KEY = 're_xxxxxxxxxxxxx'
const resend = new Resend(RESEND_API_KEY)

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

// Send welcome email
export async function sendWelcomeEmail(userEmail, firstName) {
  const { data, error } = await resend.emails.send({
    from: 'noreply@communityconnection.com',
    to: userEmail,
    subject: `Welcome to Community Connection, ${firstName}!`,
    html: `
      

Welcome to Community Connection!


      

Hi ${firstName},


      

We're excited to have you join our community of authentic connections.


      

Get started by:


      


        

Completing your profile


        

Adding your interests and values


        

Finding people near you with similar interests


        

Joining or creating communities


      


      

Happy connecting!


      

The Community Connection Team


    `
  })
  
  if (error) throw error
  return data
}

// Send match notification
export async function sendMatchNotification(userEmail, matchName) {
  const { data, error } = await resend.emails.send({
    from: 'noreply@communityconnection.com',
    to: userEmail,
    subject: `You have a new match: ${matchName}!`,
    html: `
      

New Match Found!


      

Great news! We found a match for you.


      

${matchName} shares your interests and values.


      

View their profile and connect now!


      View Matches
    `
  } )
  
  if (error) throw error
  return data
}

// Send community invitation
export async function sendCommunityInvitation(userEmail, communityName, inviterName) {
  const { data, error } = await resend.emails.send({
    from: 'noreply@communityconnection.com',
    to: userEmail,
    subject: `${inviterName} invited you to join ${communityName}`,
    html: `
      

Community Invitation


      

${inviterName} invited you to join ${communityName}


      

This is a great community for people interested in similar things.


      

Accept the invitation and start connecting!


      View Communities
    `
  } )
  
  if (error) throw error
  return data
}

// Send event reminder
export async function sendEventReminder(userEmail, eventName, eventDate) {
  const { data, error } = await resend.emails.send({
    from: 'noreply@communityconnection.com',
    to: userEmail,
    subject: `Reminder: ${eventName} is coming up!`,
    html: `
      

Event Reminder


      

Don't forget about ${eventName}!


      

Date: ${eventDate}


      

See you there!


      View Events
    `
  } )
  
  if (error) throw error
  return data
}

// Send message notification
export async function sendMessageNotification(userEmail, senderName, messagePreview) {
  const { data, error } = await resend.emails.send({
    from: 'noreply@communityconnection.com',
    to: userEmail,
    subject: `New message from ${senderName}`,
    html: `
      

New Message


      

${senderName} sent you a message:


      

"${messagePreview}"


      

Reply now to continue the conversation.


      View Messages
    `
  } )
  
  if (error) throw error
  return data
}

// Send password reset email
export async function sendPasswordResetEmail(userEmail, resetLink) {
  const { data, error } = await resend.emails.send({
    from: 'noreply@communityconnection.com',
    to: userEmail,
    subject: 'Reset your Community Connection password',
    html: `
      

Password Reset


      

Click the link below to reset your password:


      Reset Password
      

This link expires in 24 hours.


      

If you didn't request this, ignore this email.


    `
  })
  
  if (error) throw error
  return data
}

// Send batch emails
export async function sendBatchEmails(recipients, subject, htmlContent) {
  const emails = recipients.map(recipient => ({
    from: 'noreply@communityconnection.com',
    to: recipient.email,
    subject: subject,
    html: htmlContent
  }))
  
  const { data, error } = await resend.batch.send(emails)
  
  if (error) throw error
  return data
}

LOGIN/SIGNUP SCREEN

├── Email/Password Authentication

├── Social Login (Google, Apple, Facebook)

├── Phone Number Verification

└── Location Permission Request

MAIN DASHBOARD

├── Header

│   ├── Logo & App Name

│   ├── Search Bar (for groups/events)

│   ├── User Profile Icon

│   └── Notifications Bell

├── Bottom Navigation (Mobile)

│   ├── Home (house icon)

│   ├── Explore (compass icon)

│   ├── Events (calendar icon)

│   ├── Messages (chat icon)

│   └── Profile (person icon)

└── Main Content Area

    ├── Personalized Greeting

    ├── Recommended Groups

    │   ├── Group Card

    │   │   ├── Group Image

    │   │   ├── Group Name

    │   │   ├── Member Count

    │   │   ├── Category Tag

    │   │   ├── Join Button

    │   │   └── View Details Button

    │   └── See All Button

    ├── Upcoming Events Near You

    │   ├── Event Card

    │   │   ├── Event Image

    │   │   ├── Event Name

    │   │   ├── Date & Time

    │   │   ├── Location

    │   │   ├── Attendee Count

    │   │   ├── RSVP Button

    │   │   └── View Details Button

    │   └── See All Button

    └── Loneliness Support Resources

        ├── Meditation links

        ├── Support hotlines

        └── Mental health resources

EXPLORE SCREEN

├── Category Filter Buttons

│   ├── Hobbies

│   ├── Sports

│   ├── Arts & Culture

│   ├── Professional

│   ├── Support Groups

│   ├── Learning

│   ├── Social

│   └── Intergenerational

├── Location Filter

│   ├── Radius Slider (1-50 miles)

│   ├── Current Location

│   └── Custom Location

├── Groups List

│   ├── Group Card (as above)

│   ├── Distance from user

│   └── Member activity status

└── Create Group Button

GROUP DETAILS SCREEN

├── Group Header

│   ├── Group Image (large)

│   ├── Group Name

│   ├── Category Tags

│   └── Edit Button (if admin)

├── Group Info

│   ├── Description

│   ├── Member Count

│   ├── Founded Date

│   ├── Meeting Frequency

│   └── Location

├── Group Admin Info

│   ├── Admin Name

│   ├── Admin Photo

│   ├── Contact Button

│   └── Admin Rating

├── Members Section

│   ├── Member List (with photos)

│   ├── Member Count

│   ├── View All Members Button

│   └── Message Member Button

├── Events Section

│   ├── Upcoming Events

│   ├── Create Event Button

│   └── View All Events Button

├── Discussion/Chat

│   ├── Recent Posts

│   ├── Post Input Box

│   └── View All Posts Button

├── Join/Leave Button

└── Share Group Button

EVENTS SCREEN

├── Calendar View

│   ├── Month/Week/Day toggle

│   ├── Event dots on dates

│   └── Click to view events

├── List View

│   ├── Event Card

│   │   ├── Event Image

│   │   ├── Event Name

│   │   ├── Date & Time

│   │   ├── Location

│   │   ├── Organizer Name

│   │   ├── Attendee Count

│   │   ├── RSVP Button

│   │   └── View Details Button

│   └── Filter Options

├── Create Event Button

└── My Events Tab

EVENT DETAILS SCREEN

├── Event Header

│   ├── Event Image

│   ├── Event Name

│   ├── Category Tag

│   └── Share Button

├── Event Info

│   ├── Date & Time

│   ├── Duration

│   ├── Location (with map)

│   ├── Address

│   └── Directions Button

├── Organizer Info

│   ├── Organizer Photo

│   ├── Organizer Name

│   ├── Organizer Rating

│   └── Message Organizer Button

├── Description

├── Attendees

│   ├── Attendee Count

│   ├── Attendee Photos

│   ├── View All Attendees Button

│   └── Message Attendee Button

├── RSVP Section

│   ├── RSVP Button

│   ├── Going/Interested/Not Going

│   └── Add to Calendar Button

├── Comments/Discussion

│   ├── Comment List

│   ├── Comment Input

│   └── Post Comment Button

└── Report Event Button

INTERGENERATIONAL MATCHING SCREEN

├── Matching Preferences

│   ├── Age Range Preference

│   ├── Interests Selection

│   ├── Goals (Mentorship, Friendship, Learning)

│   └── Save Preferences Button

├── Matched Profiles

│   ├── Profile Card

│   │   ├── Photo

│   │   ├── Name & Age

│   │   ├── Location

│   │   ├── Interests

│   │   ├── Bio

│   │   ├── Compatibility Score

│   │   ├── Connect Button

│   │   └── View Profile Button

│   └── Swipe or List View

├── My Connections

│   ├── Connected Profiles

│   ├── Message Button

│   └── View Shared Events

└── Connection Requests

    ├── Pending Requests

    ├── Accept/Decline Buttons

    └── View Profile Button

MESSAGING SCREEN

├── Conversations List

│   ├── Conversation Card

│   │   ├── User Photo

│   │   ├── User Name

│   │   ├── Last Message Preview

│   │   ├── Timestamp

│   │   └── Unread Badge

│   └── Search Conversations

├── Chat Interface

│   ├── User Info Header

│   ├── Message History

│   │   ├── Message Bubbles

│   │   ├── Timestamps

│   │   └── Read Receipts

│   ├── Message Input Box

│   ├── Emoji Picker

│   ├── Photo Upload

│   ├── Send Button

│   └── Call Button (voice/video)

└── Block/Report User Option

PROFILE SCREEN

├── Profile Header

│   ├── Profile Photo

│   ├── Name & Age

│   ├── Location

│   ├── Edit Profile Button

│   └── Share Profile Button

├── Bio Section

├── Interests/Tags

├── Verification Badge

├── Rating/Reviews

├── My Groups

│   ├── Groups List

│   └── Leave Group Button

├── My Events

│   ├── Upcoming Events

│   ├── Past Events

│   └── Create Event Button

├── My Connections

│   ├── Connection Count

│   └── View Connections Button

├── Settings

│   ├── Privacy Settings

│   ├── Notification Preferences

│   ├── Blocked Users

│   ├── Account Settings

│   └── Help & Support

└── Logout Button

LONELINESS ASSESSMENT SCREEN

├── Assessment Questions

│   ├── "How often do you feel lonely?" (Scale 1-10)

│   ├── "Do you have close friends?" (Yes/No)

│   ├── "Do you feel part of a community?" (Scale 1-10)

│   ├── "How satisfied are you with your social life?" (Scale 1-10)

│   └── "Do you have regular social activities?" (Yes/No)

├── Assessment Result

│   ├── Loneliness Score

│   ├── Interpretation

│   ├── Recommended Actions

│   └── Resources

└── Retake Assessment Button

DATABASE SCHEMA
CREATE TABLE users (

  id UUID PRIMARY KEY,

  email VARCHAR(255) UNIQUE NOT NULL,

  password_hash VARCHAR(255),

  first_name VARCHAR(100),

  last_name VARCHAR(100),

  age INT,

  gender VARCHAR(50),

  profile_photo_url TEXT,

  bio TEXT,

  location VARCHAR(255),

  latitude DECIMAL(10, 8),

  longitude DECIMAL(11, 8),

  interests TEXT[],

  verification_status VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  is_active BOOLEAN DEFAULT TRUE

);

Groups Table
CREATE TABLE groups (

  id UUID PRIMARY KEY,

  name VARCHAR(255) NOT NULL,

  description TEXT,

  category VARCHAR(100),

  admin_id UUID REFERENCES users(id),

  group_photo_url TEXT,

  location VARCHAR(255),

  latitude DECIMAL(10, 8),

  longitude DECIMAL(11, 8),

  member_count INT DEFAULT 0,

  meeting_frequency VARCHAR(100),

  founded_date DATE,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

Group Members Table
CREATE TABLE group_members (

  id UUID PRIMARY KEY,

  group_id UUID REFERENCES groups(id),

  user_id UUID REFERENCES users(id),

  role VARCHAR(50), -- 'admin', 'moderator', 'member'

  joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  is_active BOOLEAN DEFAULT TRUE

);

Events Table
CREATE TABLE events (

  id UUID PRIMARY KEY,

  name VARCHAR(255) NOT NULL,

  description TEXT,

  group_id UUID REFERENCES groups(id),

  organizer_id UUID REFERENCES users(id),

  event_date DATE,

  start_time TIME,

  end_time TIME,

  location VARCHAR(255),

  latitude DECIMAL(10, 8),

  longitude DECIMAL(11, 8),

  event_photo_url TEXT,

  category VARCHAR(100),

  max_attendees INT,

  attendee_count INT DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);


Event Attendees Table
CREATE TABLE event_attendees (

  id UUID PRIMARY KEY,

  event_id UUID REFERENCES events(id),

  user_id UUID REFERENCES users(id),

  rsvp_status VARCHAR(50), -- 'going', 'interested', 'not_going'

  joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

Intergenerational Connections Table
CREATE TABLE intergenerational_connections (

  id UUID PRIMARY KEY,

  user_id_1 UUID REFERENCES users(id),

  user_id_2 UUID REFERENCES users(id),

  connection_type VARCHAR(100), -- 'mentorship', 'friendship', 'learning'

  status VARCHAR(50), -- 'pending', 'connected', 'ended'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

Messages Table
CREATE TABLE messages (

  id UUID PRIMARY KEY,

  sender_id UUID REFERENCES users(id),

  recipient_id UUID REFERENCES users(id),

  content TEXT,

  is_read BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

Loneliness Assessment Table
CREATE TABLE loneliness_assessments (

  id UUID PRIMARY KEY,

  user_id UUID REFERENCES users(id),

  q1_score INT,

  q2_answer VARCHAR(50),

  q3_score INT,

  q4_score INT,

  q5_answer VARCHAR(50),

  total_score INT,

  assessment_date DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

REVENUE MODEL

Freemium Structure
FREE TIER:

- Browse groups and events

- Join up to 3 groups

- Attend unlimited events

- Messaging (limited)

- Loneliness assessment

PREMIUM TIER ($7.99/month):

- Unlimited groups

- Create groups

- Host events

- Unlimited messaging

- Advanced matching

- No ads

- Priority support

BUSINESS TIER ($49.99/month):

- Everything in Premium

- Advanced analytics

- Bulk invitations

- Custom branding

- API access

- Dedicated support

Additional Revenue
1. Local Business Partnerships:

   - Restaurants sponsor events

   - Venues pay for visibility

   - Commission on bookings

2. B2B Partnerships:

   - Senior living facilities

   - Community centers

   - Mental health organizations

   - Corporate wellness programs

3. Sponsored Content:

   - Featured groups

   - Promoted events

   - Sponsored activities

OpenAI Implementation Code
// Initialize OpenAI

import OpenAI from 'openai'

const OPENAI_API_KEY = 'sk-proj-xxxxxxxxxxxxx'

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// ============================================

// AI MATCHING FUNCTIONS

// ============================================

// Generate match score using AI

export async function generateMatchScore(user1, user2) {

  const prompt = `

    Analyze the compatibility between these two people for community connection:

    

    Person 1:

    - Name: ${user1.firstName}

    - Interests: ${user1.interests.join(', ')}

    - Values: ${user1.values.join(', ')}

    - Bio: ${user1.bio}

    

    Person 2:

    - Name: ${user2.firstName}

    - Interests: ${user2.interests.join(', ')}

    - Values: ${user2.values.join(', ')}

    - Bio: ${user2.bio}

    

    Provide:

    1. Match score (0-100)

    2. Common interests (list)

    3. Common values (list)

    4. Reason for match (1-2 sentences)

    5. Conversation starter (1 sentence)

    

    Format as JSON.

  `

  

  const response = await openai.chat.completions.create({

    model: 'gpt-4.1-mini',

    messages: [

      {

        role: 'user',

        content: prompt

      }

    ],

    temperature: 0.7,

    max_tokens: 500

  })

  

  const content = response.choices[0].message.content

  const jsonMatch = content.match(/\{[\s\S]*\}/)

  const result = JSON.parse(jsonMatch[0])

  

  return result

}

// Generate community recommendations

export async function generateCommunityRecommendations(userProfile, nearByCommunities) {

  const prompt = `

    Based on this user's profile, recommend the best communities for them:

    

    User Profile:

    - Interests: ${userProfile.interests.join(', ')}

    - Values: ${userProfile.values.join(', ')}

    - Bio: ${userProfile.bio}

    

    Available Communities:

    ${nearByCommunities.map(c => `- ${c.name}: ${c.description}`).join('\n')}

    

    Provide:

    1. Top 3 community recommendations

    2. Why each community is a good fit

    3. Potential friends in each community

    

    Format as JSON.

  `

  

  const response = await openai.chat.completions.create({

    model: 'gpt-4.1-mini',

    messages: [

      {

        role: 'user',

        content: prompt

      }

    ],

    temperature: 0.7,

    max_tokens: 800

  })

  

  const content = response.choices[0].message.content

  const jsonMatch = content.match(/\{[\s\S]*\}/)

  const result = JSON.parse(jsonMatch[0])

  

  return result

}

// Generate conversation starters

export async function generateConversationStarters(user1, user2) {

  const prompt = `

    Generate 5 interesting conversation starters for these two people:

    

    Person 1:

    - Interests: ${user1.interests.join(', ')}

    - Values: ${user1.values.join(', ')}

    

    Person 2:

    - Interests: ${user2.interests.join(', ')}

    - Values: ${user2.values.join(', ')}

    

    Make them authentic, genuine, and based on shared interests.

    Format as JSON array of strings.

  `

  

  const response = await openai.chat.completions.create({

    model: 'gpt-4.1-mini',

    messages: [

      {

        role: 'user',

        content: prompt

      }

    ],

    temperature: 0.8,

    max_tokens: 400

  })

  

  const content = response.choices[0].message.content

  const jsonMatch = content.match(/\[[\s\S]*\]/)

  const result = JSON.parse(jsonMatch[0])

  

  return result

}

// Analyze authenticity of profile

export async function analyzeProfileAuthenticity(userProfile) {

  const prompt = `

    Analyze the authenticity of this community profile:

    

    - Bio: ${userProfile.bio}

    - Interests: ${userProfile.interests.join(', ')}

    - Values: ${userProfile.values.join(', ')}

    - Reviews: ${userProfile.reviews}

    

    Provide:

    1. Authenticity score (0-100)

    2. Red flags (if any)

    3. Positive indicators

    4. Recommendations for improvement

    

    Format as JSON.

  `

  

  const response = await openai.chat.completions.create({

    model: 'gpt-4.1-mini',

    messages: [

      {

        role: 'user',

        content: prompt

      }

    ],

    temperature: 0.5,

    max_tokens: 500

  })

  

  const content = response.choices[0].message.content

  const jsonMatch = content.match(/\{[\s\S]*\}/)

  const result = JSON.parse(jsonMatch[0])

  

  return result

}

// Generate community event ideas

export async function generateEventIdeas(community) {

  const prompt = `

    Generate 5 event ideas for this community:

    

    Community: ${community.name}

    Category: ${community.category}

    Description: ${community.description}

    Members: ${community.memberCount}

    

    Events should be:

    - Authentic and genuine

    - Engaging for the community

    - Easy to organize

    - Suitable for the location

    

    Provide event name, description, and why it's a good fit.

    Format as JSON array.

  `

  

  const response = await openai.chat.completions.create({

    model: 'gpt-4.1-mini',

    messages: [

      {

        role: 'user',

        content: prompt

      }

    ],

    temperature: 0.8,

    max_tokens: 1000

  })

  

  const content = response.choices[0].message.content

  const jsonMatch = content.match(/\[[\s\S]*\]/)

  const result = JSON.parse(jsonMatch[0])

  

  return result

}

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://authenticcommunity.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8a0d1b6b-3bc1-4c72-ad33-c9ffc87620e1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
