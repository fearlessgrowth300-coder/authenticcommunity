import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, X } from 'lucide-react'
import { Avatar, Verified } from '@/components/ui/AppUi'
import { toast } from 'sonner'
import { loadActiveStories } from '@/features/communities/communityApi'

export function StoriesViewer() {
  const navigate = useNavigate()
  const [stories, setStories] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    loadActiveStories()
      .then(res => setStories(res))
      .catch(() => undefined)
  }, [])

  const defaultStories = [
    {
      id: 'demo-s1',
      authorName: 'Maya Patel',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
      authorVerified: true,
      imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=90',
      caption: 'Weekend trail crew 🌿 Anyone joining next Saturday?',
      timeAgo: '12m · Austin Hikers',
    },
    {
      id: 'demo-s2',
      authorName: 'Alex Johnson',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
      authorVerified: true,
      imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=90',
      caption: 'Coffee and founder chats before the weekly meetup ☕️',
      timeAgo: '1h · Startup Circle',
    },
  ]

  const activeStories = stories.length > 0 ? stories : defaultStories
  const current = activeStories[currentIndex] || activeStories[0]

  const handleReply = () => {
    if (!replyText.trim()) return
    toast.success('Story reply sent!')
    setReplyText('')
  }

  const handleNext = () => {
    if (currentIndex < activeStories.length - 1) {
      setCurrentIndex(c => c + 1)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1020] text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col">
        <div className="flex gap-1 p-3">
          {activeStories.map((s, i) => (
            <div key={s.id || i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className={`h-full rounded-full bg-white transition-all duration-300 ${
                  i < currentIndex ? 'w-full' : i === currentIndex ? 'w-2/3' : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 px-4 py-2">
          <Avatar
            src={current.authorAvatar || undefined}
            name={current.authorName}
          />
          <div className="flex-1">
            <div className="flex items-center gap-1 font-bold">
              {current.authorName}
              {current.authorVerified && <Verified />}
            </div>
            <div className="text-xs text-white/60">{current.timeAgo || 'Active story'}</div>
          </div>
          <button onClick={() => navigate(-1)} aria-label="Close stories">
            <X className="h-6 w-6 text-white/80" />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden cursor-pointer" onClick={handleNext}>
          <img
            src={current.imageUrl}
            className="h-full w-full object-cover select-none"
            alt="Story content"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-5 right-5" onClick={e => e.stopPropagation()}>
            <div className="text-xl font-extrabold text-white drop-shadow-md">{current.caption}</div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => toast.success("You voted: I'm in!")}
                className="rounded-xl bg-white/20 px-4 py-3 text-sm font-bold backdrop-blur hover:bg-white/30 transition"
              >
                I'm in
              </button>
              <button
                onClick={() => toast.success("You voted: Maybe")}
                className="rounded-xl bg-white/20 px-4 py-3 text-sm font-bold backdrop-blur hover:bg-white/30 transition"
              >
                Maybe
              </button>
            </div>
          </div>
        </div>

        <div className="safe-bottom flex items-center gap-2 p-4">
          <input
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleReply()}
            className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/50 text-white"
            placeholder="Reply to story..."
          />
          <button
            onClick={handleReply}
            className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-600 hover:scale-105 transition"
            aria-label="Send reply"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
