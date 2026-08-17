import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type Toast = { id: number; text: string }
type Post = { id: string; author: string; avatar: string; verified: boolean; time: string; tag: string; text: string; image?: string; likes: number; comments: number }

type MockAppState = {
  joinedCommunityIds: Set<string>
  followedIds: Set<string>
  savedMatchIds: Set<string>
  passedMatchIds: Set<string>
  rsvpEventIds: Set<string>
  likedPostIds: Set<string>
  settings: Record<string, boolean>
  posts: Post[]
  messages: Record<string, string[]>
  toast: (text: string) => void
  toggleCommunity: (id: string) => void
  toggleFollow: (id: string) => void
  toggleSavedMatch: (id: string) => void
  passMatch: (id: string) => void
  toggleRsvp: (id: string) => void
  togglePostLike: (id: string) => void
  toggleSetting: (id: string) => void
  addPost: (post: Omit<Post, 'id' | 'time' | 'likes' | 'comments'>) => void
  addMessage: (channel: string, text: string) => void
}

const MockAppContext = createContext<MockAppState | null>(null)

export function MockAppProvider({ children }: { children: ReactNode }) {
  const [joinedCommunityIds, setJoined] = useState(() => new Set<string>())
  const [followedIds, setFollowed] = useState(() => new Set<string>())
  const [savedMatchIds, setSaved] = useState(() => new Set<string>())
  const [passedMatchIds, setPassed] = useState(() => new Set<string>())
  const [rsvpEventIds, setRsvps] = useState(() => new Set<string>())
  const [likedPostIds, setLikes] = useState(() => new Set<string>())
  const [settings, setSettings] = useState<Record<string, boolean>>({
    profileVisibility: true, cityOnly: true, onlineStatus: false,
    messages: true, connections: true, communities: true, events: true,
    digest: true, push: true, email: true,
  })
  const [posts, setPosts] = useState<Post[]>([])
  const [messages, setMessages] = useState<Record<string, string[]>>({ direct: [], community: [] })
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (text: string) => {
    const id = Date.now()
    setToasts(current => [...current, { id, text }])
    window.setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 2600)
  }
  const swap = (setter: (value: Set<string>) => void, set: Set<string>, id: string) => {
    const next = new Set(set)
    next.has(id) ? next.delete(id) : next.add(id)
    setter(next)
  }

  const value = useMemo<MockAppState>(() => ({
    joinedCommunityIds, followedIds, savedMatchIds, passedMatchIds, rsvpEventIds, likedPostIds, settings, posts, messages, toast,
    toggleCommunity: id => { swap(setJoined, joinedCommunityIds, id); toast(joinedCommunityIds.has(id) ? 'Community removed from your spaces' : 'You joined the community') },
    toggleFollow: id => { swap(setFollowed, followedIds, id); toast(followedIds.has(id) ? 'You are no longer following this member' : 'You are now following this member') },
    toggleSavedMatch: id => { swap(setSaved, savedMatchIds, id); toast(savedMatchIds.has(id) ? 'Match removed from saved' : 'Match saved for later') },
    passMatch: id => { const next = new Set(passedMatchIds); next.add(id); setPassed(next); toast('We will show fewer profiles like this') },
    toggleRsvp: id => { swap(setRsvps, rsvpEventIds, id); toast(rsvpEventIds.has(id) ? 'Your RSVP was cancelled' : "You're going — we saved your RSVP") },
    togglePostLike: id => { swap(setLikes, likedPostIds, id) },
    toggleSetting: id => setSettings(current => ({ ...current, [id]: !current[id] })),
    addPost: post => { setPosts(current => [{ ...post, id: `post-${Date.now()}`, time: 'Just now', likes: 0, comments: 0 }, ...current]); toast('Your post is now live') },
    addMessage: (channel, text) => { if (!text.trim()) return; setMessages(current => ({ ...current, [channel]: [...(current[channel] || []), text.trim()] })); toast('Message sent') },
  }), [joinedCommunityIds, followedIds, savedMatchIds, passedMatchIds, rsvpEventIds, likedPostIds, settings, posts, messages])

  return <MockAppContext.Provider value={value}>{children}<div aria-live="polite" className="fixed inset-x-4 bottom-24 z-[100] mx-auto flex max-w-sm flex-col gap-2 lg:bottom-6">{toasts.map(item => <div key={item.id} className="rounded-2xl bg-brand-ink px-4 py-3 text-sm font-semibold text-white shadow-xl">{item.text}</div>)}</div></MockAppContext.Provider>
}

export function useMockApp() {
  const context = useContext(MockAppContext)
  if (!context) throw new Error('useMockApp must be used inside MockAppProvider')
  return context
}
