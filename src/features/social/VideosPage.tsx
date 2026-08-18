import { Play } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar, Button, Card, Verified } from '@/components/ui/AppUi'
import { toast } from 'sonner'
import { loadVideoPosts } from '@/features/communities/communityApi'

export function Videos() {
  const navigate = useNavigate()
  const [remoteVideos, setRemoteVideos] = useState<any[]>([])
  const [, setLoading] = useState(true)

  useEffect(() => {
    loadVideoPosts()
      .then(res => setRemoteVideos(res))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const defaultVideoItems = [
    {
      id: 'v1',
      author: 'Maya Patel',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
      community: 'Austin Hikers',
      text: 'Morning sunrise trail with the crew 🌿 Come join next weekend!',
      image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=90',
      likes: 142,
      comments: 28,
      verified: true,
    },
    {
      id: 'v2',
      author: 'Alex Johnson',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85',
      community: 'Startup Circle',
      text: 'Coffee and candid founder conversations. Building local community step by step.',
      image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=90',
      likes: 96,
      comments: 14,
      verified: true,
    },
  ]

  const videoItems = remoteVideos.length > 0 ? remoteVideos : defaultVideoItems

  return (
    <AppShell title="Videos" subtitle="Short-form discovery with a path to real connections">
      <div className="mx-auto max-w-xl space-y-6">
        {videoItems.map(p => (
          <Card key={p.id} className="relative aspect-[9/16] max-h-[78vh] overflow-hidden bg-black">
            <img src={p.image} className="h-full w-full object-cover opacity-85" alt={p.text} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10" />
            <button
              onClick={() => toast.success('Video playback started')}
              className="absolute inset-0 grid place-items-center"
            >
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-white backdrop-blur hover:scale-105 transition-transform">
                <Play className="h-8 w-8 fill-white" />
              </div>
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <div className="flex items-center gap-2">
                <Avatar src={p.avatar} name={p.author} />
                <div>
                  <div className="flex items-center gap-1 font-bold">
                    {p.author}
                    {p.verified && <Verified />}
                  </div>
                  <div className="text-xs text-white/70">{p.community}</div>
                </div>
                <Button className="ml-auto py-2" onClick={() => navigate('/matches')}>Connect</Button>
              </div>
              <p className="mt-4 text-sm">{p.text}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-white/90">
                <span>♡ {p.likes}</span>
                <span>💬 {p.comments}</span>
                <span>↗ Share</span>
              </div>
              <Button
                variant="secondary"
                className="mt-4 bg-white/95 text-brand-ink"
                onClick={() => navigate('/communities')}
              >
                View Community
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
