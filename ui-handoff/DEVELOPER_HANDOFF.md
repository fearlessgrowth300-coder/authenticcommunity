# Developer Handoff

## Product principle
This is a community-first social product. Avoid dating-app framing. `Connect` is an accepted two-way relationship; `Follow` is a one-way audience relationship.

## Core 32-screen UI coverage
1. Splash
2. Login
3. Sign Up
4. Onboarding Location
5. Onboarding Interests
6. Onboarding Values
7. Onboarding Photo & Bio
8. Home Dashboard
9. Notifications Center
10. Quick Start Guide
11. Matches Feed
12. Match Profile Detail
13. Matches Filter
14. Matches Sort
15. Communities Feed
16. Community Detail
17. Create Community
18. Communities Filter
19. Messages List
20. Direct Message Chat
21. Community Chat
22. Events Feed
23. Event Detail
24. Create Event
25. My Profile
26. Edit Profile
27. My Connections
28. My Communities
29. Settings Home
30. Account Settings
31. Privacy & Safety
32. Notification Settings

## Added social-system UI
- Followers / Following / Connections
- Identity verification
- For You / Following / Communities feed
- Stories strip + story viewer
- Short video feed
- Create hub
- Create post

## Backend connection points
Replace `src/lib/data.ts` with query hooks/services. Keep page components focused on presentation.

Suggested service modules to add:
- `src/services/auth.ts`
- `src/services/profiles.ts`
- `src/services/matches.ts`
- `src/services/communities.ts`
- `src/services/events.ts`
- `src/services/messages.ts`
- `src/services/feed.ts`
- `src/services/follows.ts`
- `src/services/verification.ts`
- `src/services/notifications.ts`

## Supabase realtime
Use realtime subscriptions for:
- direct messages
- community messages
- notification inserts
- online presence

## AI boundary
Do not call OpenAI directly from the browser. Put OpenAI behind a server/edge function. UI locations already exist for AI bio assist, match explanation, conversation starters, content understanding and reply assistance.

## Verification boundary
Identity verification is not Premium. Use a dedicated verification provider and store only provider result/status and safe metadata whenever possible.

## Feed principle
For You should rank meaningful relationship actions above raw vanity engagement. Following should remain mostly chronological.
