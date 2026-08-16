-- Starter inventory for a new city launch. These are public, organizer-neutral
-- communities that can later be claimed by verified local hosts.
INSERT INTO public.communities (community_name, description, category, location_city, location_state, location_country, member_count, is_active)
VALUES
  ('New in the City', 'A welcoming place for people who have recently moved. Find a coffee buddy, ask local questions, and join newcomer-friendly events.', 'Social', 'London', 'England', 'United Kingdom', 0, true),
  ('Weekend Walk & Talk', 'Low-pressure walks for good conversation, fresh air, and meeting people at your own pace.', 'Outdoors', 'London', 'England', 'United Kingdom', 0, true),
  ('Creative Makers Circle', 'For artists, writers, designers, photographers, and curious makers who want to create alongside others.', 'Arts & Culture', 'London', 'England', 'United Kingdom', 0, true),
  ('Wellbeing Together', 'Gentle movement, mindfulness, accountability, and honest conversations about building a healthier routine.', 'Wellness', 'London', 'England', 'United Kingdom', 0, true),
  ('Builders & Learners', 'Friendly meetups for founders, students, career-switchers, and people learning new skills together.', 'Learning', 'London', 'England', 'United Kingdom', 0, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.events (name, description, event_date, start_time, end_time, location, category, max_attendees, attendee_count, is_active)
VALUES
  ('Newcomer Coffee & Conversation', 'A relaxed first meetup for people who are new to the city or simply want to meet new faces. Small tables, conversation prompts, no pressure.', '2026-09-05', '10:30', '12:00', 'South Bank, London', 'Social', 24, 0, true),
  ('Saturday Walk: Regent''s Park', 'A beginner-friendly walk with pauses for conversation. Wear comfortable shoes and bring water.', '2026-09-12', '10:00', '11:30', 'Regent''s Park, London', 'Outdoors', 30, 0, true),
  ('Creative Co-working Afternoon', 'Bring a project, sketchbook, laptop, or idea. We work quietly together, then share what we are making.', '2026-09-17', '14:00', '17:00', 'King''s Cross, London', 'Arts & Culture', 20, 0, true),
  ('Mindful Morning in the Park', 'A gentle outdoor session with breathing, light movement, and an optional tea afterwards.', '2026-09-20', '09:00', '10:15', 'Victoria Park, London', 'Wellness', 25, 0, true),
  ('Learn Together: AI for Everyday Work', 'A practical, beginner-friendly peer-learning session. No presentation pressure; bring a question you want to solve.', '2026-09-24', '18:30', '20:00', 'Shoreditch, London', 'Learning', 35, 0, true),
  ('Community Game Night', 'A welcoming evening of easy-to-learn games, snacks, and small groups. Come alone or invite a friend.', '2026-09-27', '18:00', '21:00', 'Waterloo, London', 'Social', 28, 0, true)
ON CONFLICT DO NOTHING;
