export const people = [
  { id: 'maya', name: 'Maya Patel', age: 28, city: 'Austin, Texas', distance: '1.2 mi', match: 92, verified: true, role: 'Community builder · Book lover · Weekend hiker', interests: ['Hiking','Books','Community','Travel'], values: ['Kindness','Growth','Community','Learning'], image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85' },
  { id: 'alex', name: 'Alex Johnson', age: 30, city: 'Austin, Texas', distance: '2.8 mi', match: 89, verified: true, role: 'Product designer · Runner · Coffee person', interests: ['Design','Fitness','Coffee','Startups'], values: ['Growth','Honesty','Creativity'], image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85' },
  { id: 'priya', name: 'Priya Sharma', age: 27, city: 'Dallas, Texas', distance: '12 mi', match: 86, verified: true, role: 'Reader · Wellness advocate · Volunteer', interests: ['Books','Mindfulness','Travel'], values: ['Kindness','Community','Health'], image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85' },
]

export const communities = [
  { id: 'hikers', name: 'Sunrise Hikers Austin', members: '320', distance: '2.4 mi', category: 'Outdoors', description: 'Weekend hikes, trail cleanups, and adventures with welcoming local people.', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85', trusted: true },
  { id: 'books', name: 'Austin Book Circle', members: '156', distance: '3.1 mi', category: 'Learning', description: 'Thoughtful reads and friendly discussions for curious minds.', image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=85', trusted: false },
  { id: 'mindful', name: 'Mindful Living Collective', members: '278', distance: '1.7 mi', category: 'Wellness', description: 'Mindfulness, meditation and everyday wellbeing with real community.', image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85', trusted: true },
  { id: 'garden', name: 'Community Garden ATX', members: '189', distance: '2.6 mi', category: 'Community', description: 'Growing food, friendships and a stronger local community.', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1000&q=85', trusted: false },
]

export const events = [
  { id: 'yoga', title: 'Morning Yoga in the Park', host: 'Balance & Breathe', date: 'JUN 15', time: '8:00 AM', distance: '0.6 mi', attendees: 28, image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1100&q=85' },
  { id: 'market', title: 'Local Farmers Market', host: 'Greenfield Collective', date: 'JUN 15', time: '10:00 AM', distance: '1.2 mi', attendees: 18, image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1100&q=85' },
  { id: 'music', title: 'Sunset Acoustic Night', host: 'Community Vibes', date: 'JUN 16', time: '6:30 PM', distance: '2.1 mi', attendees: 44, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1100&q=85' },
]

export const feedPosts = [
  { id: 1, author: 'Maya Patel', verified: true, avatar: people[0].image, time: '2h', text: 'Perfect Saturday with the Austin Trail Crew 🌿 Great views, even better people.', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1100&q=85', likes: 128, comments: 24, tag: 'Austin Hikers' },
  { id: 2, author: 'Alex Johnson', verified: true, avatar: people[1].image, time: '5h', text: 'What started as a coffee meetup turned into three new collaborations. Local community really matters.', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1100&q=85', likes: 84, comments: 16, tag: 'Startup Circle' },
]

export const messages = [
  { name: 'Jane Doe', text: "Sounds great! I'd love to check that out this weekend.", time: '9:41 AM', unread: 2, image: people[0].image, online: true },
  { name: 'Michael Chen', text: 'That makes a lot of sense. Thanks for sharing!', time: 'Yesterday', unread: 1, image: people[1].image, online: true },
  { name: 'Austin Hikers', text: "Sarah: Don’t forget our sunrise hike this Saturday!", time: 'Yesterday', unread: 3, image: communities[0].image, online: true },
  { name: 'Priya Sharma', text: 'Let me know if you want to join the book club.', time: 'Tue', unread: 0, image: people[2].image, online: false },
]
