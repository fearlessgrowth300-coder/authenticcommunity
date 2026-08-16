# Authentic Community Connection — UI/UX Frontend

A runnable UI-only reference implementation for the **Authentic Community Connection** product.

## Stack
- React + TypeScript
- Vite
- TailwindCSS
- React Router
- Lucide React icons
- Framer Motion installed for future transitions

## Run
```bash
npm install
npm run dev
```

Production check:
```bash
npm run build
npm run preview
```

## Design tokens
- Primary: `#4F46E5`
- Primary hover: `#4338CA`
- Soft indigo: `#EEF2FF`
- Coral: `#F9736B`
- Sage: `#3BAA7A`
- Amber: `#F6B94A`
- Main text: `#172033`
- Secondary text: `#64748B`
- Background: `#F8FAFC`
- Border: `#E2E8F0`

## Main routes
### Auth & onboarding
- `/`
- `/login`
- `/signup`
- `/onboarding/location`
- `/onboarding/interests`
- `/onboarding/values`
- `/onboarding/bio`

### Product
- `/home`
- `/notifications`
- `/quick-start`
- `/matches`
- `/matches/:id`
- `/matches/filter`
- `/matches/sort`
- `/communities`
- `/communities/:id`
- `/communities/create`
- `/communities/filter`
- `/events`
- `/events/:id`
- `/events/create`
- `/messages`
- `/messages/direct`
- `/messages/community`
- `/profile`
- `/profile/edit`
- `/profile/connections`
- `/profile/communities`
- `/settings`
- `/settings/account`
- `/settings/privacy`
- `/settings/notifications`

### Social layer
- `/feed`
- `/videos`
- `/stories`
- `/profile/followers`
- `/profile/verification`
- `/create`
- `/create/post`

## Important implementation boundary
This package is deliberately **UI-only**. Mock arrays live in `src/lib/data.ts`. Replace those with Supabase queries and mutations.

Recommended integration mapping:
- Supabase Auth → Login, signup, session, OAuth, protected routes
- Supabase PostgreSQL → Profiles, follows, connections, posts, comments, communities, events, messages
- Supabase Realtime → DMs, community chat, notifications, online presence
- Mapbox → Location onboarding, event/community maps, distance UI
- OpenAI backend → Profile semantic extraction, match explanations, conversation starters, content tagging/search
- Resend → Welcome, message, match, event reminder and weekly digest emails
- Identity provider → Verification flow. Do not implement raw document verification yourself.

## Suggested product rule
Keep `Follow` and `Connect` separate:
- Follow = one-way audience relationship
- Connect = accepted two-way relationship

Keep identity verification separate from Premium.
