import { useState, useEffect, useRef, lazy, Suspense, type ReactNode } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  Ban,
  BellOff,
  Bot,
  Camera,
  Check,
  CheckCheck,
  Flag,
  Loader2,
  Mic,
  MoreVertical,
  Palette,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Timer,
  UsersRound,
  Video,
  X,
} from 'lucide-react'
import { format, isToday, isYesterday, isSameDay } from 'date-fns'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/AppShell'
import { Avatar, Button, Card, Chip, Verified } from '@/components/ui/AppUi'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { loadCommunityMessages, sendCommunityMessage, subscribeToCommunityMessages } from '@/features/communities/communityApi'
import { cn } from '@/lib/utils'

// Chat sub-components from production messaging engine
import EmojiPicker from '@/components/chat/EmojiPicker'
import StickerPicker from '@/components/chat/StickerPicker'
import AttachmentMenu from '@/components/chat/AttachmentMenu'
import MessageContextMenu from '@/components/chat/MessageContextMenu'
import IncomingCall from '@/components/chat/IncomingCall'
import ChatStoryViewer from '@/components/chat/ChatStoryViewer'
import TypingIndicator from '@/components/chat/TypingIndicator'
import LinkPreview, { extractUrls, renderMessageWithLinks } from '@/components/chat/LinkPreview'
import MessageReactions from '@/components/chat/MessageReactions'
import VoiceMessagePlayer from '@/components/chat/VoiceMessagePlayer'
import VoiceRecorder from '@/components/chat/VoiceRecorder'
import { usePresence } from '@/hooks/usePresence'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { useAccountRestrictions } from '@/hooks/useAccountRestrictions'

// Dialog and menu primitives
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const VideoCall = lazy(() => import('@/components/chat/VideoCall'))

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
  is_read: boolean
  message_type?: string
  sticker_url?: string
  disappears_at?: string
  voice_url?: string
  voice_duration?: number
}

interface Profile {
  user_id?: string
  first_name: string | null
  last_name: string | null
  profile_image_url: string | null
  account_status?: string | null
  suspended_until?: string | null
  is_active?: boolean | null
  bio?: string | null
  location_city?: string | null
}

const fallbackAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85'

/**
 * Messages List: Displays direct message threads and joined communities
 */
export function Messages() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState<'Direct' | 'Communities'>('Direct')
  const [query, setQuery] = useState('')
  const [conversations, setConversations] = useState<any[]>([])
  const [communitiesList, setCommunitiesList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      setLoading(true)
      try {
        // 1. Fetch recent messages involving the user
        const { data: rawMsgs } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('created_at', { ascending: false })

        // 2. Fetch active connections
        const { data: rawConns } = await supabase
          .from('connections')
          .select('user_id_1, user_id_2')
          .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
          .in('status', ['active', 'accepted'])

        const otherUserIds = new Set<string>()
        const latestMsgMap = new Map<string, any>()
        const unreadCountMap = new Map<string, number>()

        ;(rawMsgs || []).forEach((m: any) => {
          const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id
          otherUserIds.add(otherId)
          if (!latestMsgMap.has(otherId)) {
            latestMsgMap.set(otherId, m)
          }
          if (m.recipient_id === user.id && !m.is_read) {
            unreadCountMap.set(otherId, (unreadCountMap.get(otherId) || 0) + 1)
          }
        })

        ;(rawConns || []).forEach((c: any) => {
          const otherId = c.user_id_1 === user.id ? c.user_id_2 : c.user_id_1
          otherUserIds.add(otherId)
        })

        if (otherUserIds.size > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, profile_image_url, location_city')
            .in('user_id', Array.from(otherUserIds))

          const list = (profiles || []).map((p: any) => {
            const lastMsg = latestMsgMap.get(p.user_id)
            const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Community Member'
            const unread = unreadCountMap.get(p.user_id) || 0
            return {
              userId: p.user_id,
              name: fullName,
              avatar: p.profile_image_url || fallbackAvatar,
              text: lastMsg ? lastMsg.content : 'Connected with you',
              time: lastMsg ? format(new Date(lastMsg.created_at), 'h:mm a') : 'Recently',
              unread,
              online: true,
            }
          })

          setConversations(list)
        } else {
          // Fallback conversations
          setConversations([
            {
              userId: 'maya',
              name: 'Maya Patel',
              avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85',
              text: 'Same here. Do you have a favorite trail around Austin?',
              time: '10:42 AM',
              unread: 1,
              online: true,
            },
            {
              userId: 'liam',
              name: 'Liam Chen',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',
              text: 'Are you going to the mindfulness meetup this weekend?',
              time: 'Yesterday',
              unread: 0,
              online: false,
            },
          ])
        }

        // 3. Fetch joined communities
        const { data: commMembers } = await supabase
          .from('community_members')
          .select('community_id, communities(id, community_name, profile_image_url, member_count)')
          .eq('user_id', user.id)

        if (commMembers && commMembers.length > 0) {
          setCommunitiesList(
            commMembers.map((cm: any) => ({
              id: cm.communities.id,
              name: cm.communities.community_name,
              image: cm.communities.profile_image_url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1000&q=85',
              members: cm.communities.member_count || 12,
              lastMessage: 'Community discussion active now',
            }))
          )
        } else {
          setCommunitiesList([
            {
              id: 'mindful-living',
              name: 'Mindful Living Austin',
              image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1000&q=85',
              members: 248,
              lastMessage: 'Alex: Friday meditation session at 7:00 AM!',
            },
            {
              id: 'hill-country-hikers',
              name: 'Hill Country Hikers',
              image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1000&q=85',
              members: 412,
              lastMessage: 'Marcus: Meet at Barton Creek Greenbelt trail head.',
            },
          ])
        }
      } catch {
        // Fallback demo data
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [user])

  const filteredDirect = conversations.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.text.toLowerCase().includes(query.toLowerCase())
  )

  const filteredCommunities = communitiesList.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <AppShell
      title="Messages"
      subtitle="Real conversations, authentic connections, and spaces"
      action={
        <button
          aria-label="Find connections to message"
          onClick={() => navigate('/matches')}
          className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 shadow-sm transition"
        >
          <Plus className="h-5 w-5" />
        </button>
      }
    >
      <div className="mx-auto max-w-3xl">
        {/* Switcher tabs */}
        <div className="mb-4 grid grid-cols-2 rounded-2xl border border-brand-line bg-white p-1 shadow-sm">
          {(['Direct', 'Communities'] as const).map(item => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-xl py-2.5 text-sm font-bold transition ${
                tab === item ? 'bg-brand-500 text-white shadow-sm' : 'text-brand-muted hover:text-brand-ink'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-brand-line bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-500 transition"
            placeholder={tab === 'Direct' ? 'Search messages or people...' : 'Search communities...'}
          />
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-brand-500" />
          </div>
        ) : tab === 'Direct' ? (
          filteredDirect.length === 0 ? (
            <Card className="p-10 text-center">
              <UsersRound className="mx-auto mb-3 h-10 w-10 text-brand-500" />
              <h3 className="text-lg font-bold text-brand-ink">No conversations found</h3>
              <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
                Connect with compatible members nearby to start meaningful conversations.
              </p>
              <Button className="mt-5" onClick={() => navigate('/matches')}>
                Discover People
              </Button>
            </Card>
          ) : (
            <Card className="divide-y divide-brand-line overflow-hidden">
              {filteredDirect.map(item => (
                <button
                  key={item.userId}
                  onClick={() => navigate(`/messages/direct/${item.userId}`)}
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-brand-50/50 transition"
                >
                  <Avatar src={item.avatar} name={item.name} size="md" online={item.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-brand-ink">
                      {item.name}
                      <Verified />
                    </div>
                    <div className="truncate text-xs text-brand-muted mt-0.5">{item.text}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-brand-muted">{item.time}</div>
                    {item.unread > 0 && (
                      <div className="ml-auto mt-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1.5 text-[10px] font-extrabold text-white">
                        {item.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </Card>
          )
        ) : filteredCommunities.length === 0 ? (
          <Card className="p-10 text-center">
            <UsersRound className="mx-auto mb-3 h-10 w-10 text-brand-500" />
            <h3 className="text-lg font-bold text-brand-ink">No community chats found</h3>
            <p className="mt-1 text-sm text-brand-muted max-w-sm mx-auto">
              Explore and join communities in your area to take part in shared conversations.
            </p>
            <Button className="mt-5" onClick={() => navigate('/communities')}>
              Explore Communities
            </Button>
          </Card>
        ) : (
          <Card className="divide-y divide-brand-line overflow-hidden">
            {filteredCommunities.map(c => (
              <button
                key={c.id}
                onClick={() => navigate(`/communities/${c.id}/chat`)}
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-brand-50/50 transition"
              >
                <img src={c.image} alt={c.name} className="h-12 w-12 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-brand-ink">{c.name}</div>
                  <div className="truncate text-xs text-brand-muted mt-0.5">{c.lastMessage}</div>
                </div>
                <div className="text-right text-xs text-brand-muted">{c.members} members</div>
              </button>
            ))}
          </Card>
        )}
      </div>
    </AppShell>
  )
}

/**
 * DirectChat: Full-featured realtime 1-to-1 conversation engine with authenticated chat shell.
 */
export function DirectChat() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { user } = useAuth()

  // Recipient resolution: target ID or fallback demo partner
  const recipientId = id && id !== 'direct' ? id : 'maya'
  const isPersistedRecipient = Boolean(recipientId && /^[0-9a-f-]{36}$/i.test(recipientId))

  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Picker & overlay states
  const [showEmoji, setShowEmoji] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showCall, setShowCall] = useState(false)
  const [showDisappearSettings, setShowDisappearSettings] = useState(false)
  const [disappearingEnabled, setDisappearingEnabled] = useState(false)
  const [disappearingDuration, setDisappearingDuration] = useState<string>('86400')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [hasStory, setHasStory] = useState(false)
  const [showStoryViewer, setShowStoryViewer] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBgSettings, setShowBgSettings] = useState(false)
  const [chatBg, setChatBg] = useState<{ type: 'color' | 'image'; value: string }>(() => {
    const saved = localStorage.getItem(`chat-bg-${recipientId}`)
    return saved ? JSON.parse(saved) : { type: 'color', value: '' }
  })

  // Account restrictions & block states
  const { canInteract, restrictionMessage } = useAccountRestrictions()
  const [blockState, setBlockState] = useState<{ iBlocked: boolean; blockedByOther: boolean; blockRowId: string | null }>({
    iBlocked: false,
    blockedByOther: false,
    blockRowId: null,
  })
  const [recipientRestricted, setRecipientRestricted] = useState(false)

  // Presence & Typing indicator
  const presence = usePresence(isPersistedRecipient ? recipientId : undefined)
  const { isRecipientTyping, sendTyping, sendStopTyping } = useTypingIndicator(
    isPersistedRecipient ? recipientId : undefined
  )

  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; offer: RTCSessionDescriptionInit } | null>(null)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [incomingOffer, setIncomingOffer] = useState<RTCSessionDescriptionInit | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)

  // Draft message passed from match recommendations
  useEffect(() => {
    const draft = (location.state as { draft?: unknown } | null)?.draft
    if (typeof draft === 'string' && draft.trim()) setMessage(draft)
  }, [location.state])

  // Load recipient profile & block state
  useEffect(() => {
    if (!isPersistedRecipient) {
      // Demo profile fallback
      setRecipientProfile({
        user_id: 'maya',
        first_name: 'Maya',
        last_name: 'Patel',
        profile_image_url: fallbackAvatar,
        location_city: 'Austin, Texas',
        bio: 'Community builder, book lover and hiker.',
      })
      setLoading(false)
      return
    }

    const loadRecipientState = async () => {
      const [{ data: profileData }, { data: storyData }] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name, profile_image_url, account_status, suspended_until, is_active, location_city, bio')
          .eq('user_id', recipientId)
          .maybeSingle(),
        supabase
          .from('stories')
          .select('id')
          .eq('user_id', recipientId)
          .eq('is_deleted', false)
          .gt('expires_at', new Date().toISOString())
          .limit(1),
      ])

      if (profileData) {
        const now = Date.now()
        const suspendedUntil = profileData.suspended_until ? new Date(profileData.suspended_until).getTime() : null
        const suspended =
          profileData.account_status === 'suspended' &&
          (suspendedUntil === null || Number.isNaN(suspendedUntil) || suspendedUntil > now)
        const deleted = profileData.account_status === 'deleted' || profileData.is_active === false
        const restricted = suspended || deleted

        setRecipientRestricted(restricted)
        setRecipientProfile({
          ...profileData,
          profile_image_url: restricted ? null : profileData.profile_image_url,
        })
      }

      setHasStory((storyData || []).length > 0)

      if (user) {
        const [{ data: iBlockedRow }, { data: blockedByRow }] = await Promise.all([
          supabase.from('blocked_users').select('id').eq('blocker_id', user.id).eq('blocked_id', recipientId).maybeSingle(),
          supabase.from('blocked_users').select('id').eq('blocker_id', recipientId).eq('blocked_id', user.id).maybeSingle(),
        ])

        setBlockState({
          iBlocked: !!iBlockedRow,
          blockedByOther: !!blockedByRow,
          blockRowId: iBlockedRow?.id || null,
        })
      }
    }

    loadRecipientState()
  }, [recipientId, isPersistedRecipient, user])

  // Listen for incoming WebRTC calls via call_signals
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`incoming-call-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `callee_id=eq.${user.id}`,
        },
        payload => {
          const signal = payload.new as any
          if (signal.signal_type === 'offer') {
            setIncomingCall({ callerId: signal.caller_id, offer: signal.signal_data })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Load conversation settings (disappearing messages duration)
  useEffect(() => {
    if (!user || !isPersistedRecipient) return
    supabase
      .from('conversation_settings')
      .select('disappearing_duration')
      .eq('user_id', user.id)
      .eq('other_user_id', recipientId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.disappearing_duration) {
          setDisappearingEnabled(true)
          setDisappearingDuration(String(data.disappearing_duration))
        }
      })
  }, [user, recipientId, isPersistedRecipient])

  // Load existing messages
  useEffect(() => {
    if (!user || !isPersistedRecipient) {
      if (!isPersistedRecipient) {
        setMessages([
          {
            id: 'm1',
            sender_id: 'maya',
            recipient_id: user?.id || 'me',
            content: 'Hey! 😊 Thanks for connecting.',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            is_read: true,
          },
          {
            id: 'm2',
            sender_id: user?.id || 'me',
            recipient_id: 'maya',
            content: "Great to meet you too! I saw we're both passionate about hiking, books, and local trails.",
            created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
            is_read: true,
          },
          {
            id: 'm3',
            sender_id: 'maya',
            recipient_id: user?.id || 'me',
            content: 'Same here. Do you have a favorite trail around Austin? Barton Creek Greenbelt has been wonderful lately.',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            is_read: true,
          },
        ])
        setLoading(false)
      }
      return
    }

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })

      const now = new Date()
      const filtered = (data || []).filter((m: any) => {
        if (m.disappears_at && new Date(m.disappears_at) < now) return false
        return true
      })
      setMessages(filtered)
      setLoading(false)

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', recipientId)
        .eq('recipient_id', user.id)
        .eq('is_read', false)
    }

    loadMessages()
  }, [user, recipientId, isPersistedRecipient])

  // Realtime subscription on messages table
  useEffect(() => {
    if (!user || !isPersistedRecipient) return

    const channel = supabase
      .channel(`dm-${user.id}-${recipientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new as Message
        if (
          (newMsg.sender_id === user.id && newMsg.recipient_id === recipientId) ||
          (newMsg.sender_id === recipientId && newMsg.recipient_id === user.id)
        ) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          if (newMsg.recipient_id === user.id) {
            supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id)
          }
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        const updated = payload.new as Message
        setMessages(prev => prev.map(m => (m.id === updated.id ? { ...m, ...updated } : m)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, recipientId, isPersistedRecipient])

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (type: string = 'text', stickerUrl?: string) => {
    if (type === 'text' && !message.trim()) return
    if (!user || sending) return

    if (!canInteract) {
      toast.error(restrictionMessage || 'Your account cannot send messages right now.')
      return
    }

    if (recipientRestricted || blockState.iBlocked || blockState.blockedByOther) {
      toast.error('Messaging is unavailable in this conversation.')
      return
    }

    const content = type === 'sticker' ? '🖼️ Sticker' : message.trim()
    if (type === 'text') setMessage('')
    setReplyTo(null)

    if (!isPersistedRecipient) {
      const localMsg: Message = {
        id: `local-${Date.now()}`,
        sender_id: user.id,
        recipient_id: recipientId,
        content,
        created_at: new Date().toISOString(),
        is_read: false,
        message_type: type,
        sticker_url: stickerUrl,
      }
      setMessages(curr => [...curr, localMsg])
      toast.success('Message sent')
      return
    }

    setSending(true)
    const insertData: any = {
      sender_id: user.id,
      recipient_id: recipientId,
      content,
      message_type: type,
      sticker_url: type === 'sticker' ? stickerUrl : null,
    }

    if (disappearingEnabled) {
      const dur = parseInt(disappearingDuration)
      insertData.disappears_at = new Date(Date.now() + dur * 1000).toISOString()
    }

    const { error } = await supabase.from('messages').insert(insertData)
    if (error) {
      toast.error('Failed to send message')
      if (type === 'text') setMessage(content)
    }
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSaveSticker = async (url: string) => {
    if (!user) return
    const { error } = await (supabase as any).from('user_saved_stickers').insert({ user_id: user.id, sticker_url: url })
    if (!error) toast.success('Sticker saved!')
    else if (error.code === '23505') toast.info('Already saved')
    else toast.error('Failed to save sticker')
  }

  const handleDeleteMessage = async (msgId: string) => {
    if (!user) return
    if (isPersistedRecipient) {
      await supabase.from('messages').delete().eq('id', msgId).eq('sender_id', user.id)
    }
    setMessages(prev => prev.filter(m => m.id !== msgId))
    toast.success('Message deleted')
  }

  const handleBlock = async () => {
    if (!user || !isPersistedRecipient) return
    try {
      if (blockState.iBlocked) {
        if (blockState.blockRowId) {
          await supabase.from('blocked_users').delete().eq('id', blockState.blockRowId)
        } else {
          await supabase.from('blocked_users').delete().eq('blocker_id', user.id).eq('blocked_id', recipientId)
        }
        setBlockState(prev => ({ ...prev, iBlocked: false, blockRowId: null }))
        toast.success('User unblocked')
      } else {
        const { data } = await supabase
          .from('blocked_users')
          .insert({ blocker_id: user.id, blocked_id: recipientId })
          .select('id')
          .maybeSingle()
        setBlockState(prev => ({ ...prev, iBlocked: true, blockRowId: data?.id || prev.blockRowId }))
        toast.success('User blocked')
      }
    } catch {
      toast.error('Failed to update block status')
    }
  }

  const handleReport = async () => {
    if (!user || !isPersistedRecipient) return
    try {
      await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: recipientId,
        reason: 'Inappropriate behavior in messages',
        report_type: 'user',
      })
      toast.success('Report submitted.')
    } catch {
      toast.error('Failed to submit report')
    }
  }

  const saveDisappearSettings = async () => {
    if (!user || !isPersistedRecipient) {
      setShowDisappearSettings(false)
      return
    }
    const dur = disappearingEnabled ? parseInt(disappearingDuration) : null
    await (supabase as any).from('conversation_settings').upsert(
      {
        user_id: user.id,
        other_user_id: recipientId,
        disappearing_duration: dur,
      },
      { onConflict: 'user_id,other_user_id' }
    )
    setShowDisappearSettings(false)
    toast.success(disappearingEnabled ? `Disappearing messages: ${formatDuration(dur!)}` : 'Disappearing messages off')
  }

  // Camera capture
  const handleCameraCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (!file || !user) return
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('stickers').upload(path, file)
      if (error) {
        toast.error('Failed to upload image')
        return
      }
      const { data } = supabase.storage.from('stickers').getPublicUrl(path)
      if (isPersistedRecipient) {
        await supabase.from('messages').insert({
          sender_id: user.id,
          recipient_id: recipientId,
          content: '📷 Photo',
          message_type: 'image',
          sticker_url: data.publicUrl,
        })
      } else {
        handleSend('image', data.publicUrl)
      }
    }
    input.click()
  }

  const handleMessageLongPress = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
    e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    setContextMenu({ msg, x: clientX, y: clientY })
  }

  const handleAcceptCall = () => {
    if (!incomingCall) return
    setIsIncomingCall(true)
    setIncomingOffer(incomingCall.offer)
    setShowCall(true)
    setIncomingCall(null)
  }

  const handleRejectCall = async () => {
    if (!incomingCall || !user) return
    await (supabase as any).from('call_signals').insert({
      caller_id: user.id,
      callee_id: incomingCall.callerId,
      signal_type: 'hangup',
      signal_data: {},
    })
    setIncomingCall(null)
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 3600) return `${seconds / 60} minutes`
    if (seconds < 86400) return `${seconds / 3600} hours`
    return `${seconds / 86400} days`
  }

  const displayName = recipientProfile
    ? `${recipientProfile.first_name || ''} ${recipientProfile.last_name || ''}`.trim() || 'Community Member'
    : 'Community Member'

  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr)
    if (isToday(d)) return 'Today'
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'EEEE, MMM d')
  }

  const getTickSymbol = (msg: Message) => {
    if (msg.is_read) return <CheckCheck className="h-3.5 w-3.5 text-emerald-500 inline ml-1" />
    if (presence.status === 'online') return <CheckCheck className="h-3.5 w-3.5 text-white/70 inline ml-1" />
    return <Check className="h-3.5 w-3.5 text-white/70 inline ml-1" />
  }

  return (
    <AppShell
      title={displayName}
      subtitle={
        presence.status === 'online'
          ? 'Online · 94% match'
          : isRecipientTyping
          ? 'Typing...'
          : 'Active community member'
      }
      action={
        <div className="flex items-center gap-1">
          <button
            aria-label="Start voice call"
            onClick={() => setShowCall(true)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-brand-canvas text-brand-muted hover:text-brand-ink transition"
          >
            <Phone className="h-4 w-4" />
          </button>
          <button
            aria-label="Start video call"
            onClick={() => setShowCall(true)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-brand-canvas text-brand-muted hover:text-brand-ink transition"
          >
            <Video className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Conversation options"
                className="grid h-9 w-9 place-items-center rounded-xl bg-brand-canvas text-brand-muted hover:text-brand-ink transition"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5 shadow-xl border-brand-line">
              <DropdownMenuItem onClick={() => setShowSearch(!showSearch)} className="rounded-xl font-medium text-xs">
                <Search className="h-4 w-4 mr-2" /> Search in chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowBgSettings(true)} className="rounded-xl font-medium text-xs">
                <Palette className="h-4 w-4 mr-2" /> Chat background
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/matches/${recipientId}`)} className="rounded-xl font-medium text-xs">
                View profile & match
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDisappearSettings(true)} className="rounded-xl font-medium text-xs">
                <Timer className="h-4 w-4 mr-2" /> Disappearing messages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info('Notifications muted')} className="rounded-xl font-medium text-xs">
                <BellOff className="h-4 w-4 mr-2" /> Mute notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleReport} className="rounded-xl font-medium text-xs text-red-600">
                <Flag className="h-4 w-4 mr-2" /> Report user
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlock} className="rounded-xl font-medium text-xs text-red-600">
                <Ban className="h-4 w-4 mr-2" /> {blockState.iBlocked ? 'Unblock' : 'Block user'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl">
        {/* Incoming Call Notification Banner */}
        {incomingCall && (
          <IncomingCall
            callerName={displayName}
            callerImage={recipientProfile?.profile_image_url || undefined}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
        )}

        <Card className="overflow-hidden shadow-lg border-brand-line flex flex-col min-h-[75vh]">
          {/* Header Card Sub-Bar */}
          <div className="flex items-center justify-between border-b border-brand-line bg-brand-canvas/60 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (hasStory) setShowStoryViewer(true)
                  else navigate(`/matches/${recipientId}`)
                }}
                className="relative"
              >
                <div
                  className={cn(
                    'rounded-full p-0.5 transition',
                    hasStory ? 'ring-2 ring-brand-500' : ''
                  )}
                >
                  <Avatar
                    src={recipientProfile?.profile_image_url || fallbackAvatar}
                    name={displayName}
                    size="md"
                    online={presence.status === 'online'}
                  />
                </div>
              </button>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-brand-ink text-sm">
                  {displayName}
                  <Verified />
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-muted">
                  {disappearingEnabled && (
                    <span className="inline-flex items-center gap-0.5 text-brand-600 font-semibold">
                      <Timer className="h-3 w-3" /> Disappearing
                    </span>
                  )}
                  <span>{presence.status === 'online' ? 'Active now' : 'Local member'}</span>
                </div>
              </div>
            </div>
            <Chip tone="green">94% Fit</Chip>
          </div>

          {/* Inline Search Bar if toggled */}
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-brand-line bg-white px-4 py-2.5">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversation..."
                className="flex-1 bg-transparent text-xs outline-none"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery('') }} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div
            className="flex-1 space-y-3 p-5 overflow-y-auto"
            style={
              chatBg.value
                ? chatBg.type === 'color'
                  ? { backgroundColor: chatBg.value }
                  : { backgroundImage: `url(${chatBg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { backgroundColor: '#ffffff' }
            }
          >
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
              </div>
            ) : (() => {
              const filtered = searchQuery
                ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
                : messages

              if (filtered.length === 0 && searchQuery) {
                return (
                  <div className="text-center py-12">
                    <p className="text-brand-muted text-xs">No messages matching "{searchQuery}"</p>
                  </div>
                )
              }

              return filtered.map((msg, idx, arr) => {
                const isMe = msg.sender_id === user?.id
                const showDate = idx === 0 || !isSameDay(new Date(msg.created_at), new Date(arr[idx - 1].created_at))
                const isSticker = msg.message_type === 'sticker' && msg.sticker_url
                const isImage = msg.message_type === 'image' && msg.sticker_url
                const isAudio = (msg.message_type === 'audio' || msg.message_type === 'voice') && (msg.sticker_url || msg.voice_url)

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="rounded-full bg-brand-canvas px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                          {getDateLabel(msg.created_at)}
                        </span>
                      </div>
                    )}

                    <div className={cn('flex flex-col mb-1.5', isMe ? 'items-end' : 'items-start')}>
                      {isSticker ? (
                        <button
                          onClick={() => !isMe && handleSaveSticker(msg.sticker_url!)}
                          onContextMenu={e => handleMessageLongPress(e, msg)}
                          className="max-w-[140px] group relative text-left"
                          title={!isMe ? 'Click to save sticker' : undefined}
                        >
                          <img src={msg.sticker_url!} alt="sticker" className="w-full rounded-2xl shadow-sm" />
                          <p className="text-[10px] mt-0.5 text-right text-brand-muted">
                            {format(new Date(msg.created_at), 'h:mm a')}
                          </p>
                        </button>
                      ) : isImage ? (
                        <div
                          onContextMenu={e => handleMessageLongPress(e, msg)}
                          className={cn(
                            'max-w-[75%] rounded-2xl overflow-hidden shadow-sm border',
                            isMe ? 'bg-brand-500 text-white rounded-br-sm border-brand-600' : 'bg-white rounded-bl-sm border-brand-line'
                          )}
                        >
                          <img src={msg.sticker_url!} alt="shared" className="w-full max-h-64 object-cover" />
                          <div className="px-3 py-1.5 flex items-center justify-between text-[10px]">
                            <span className={isMe ? 'text-white/80' : 'text-brand-muted'}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </span>
                            {isMe && getTickSymbol(msg)}
                          </div>
                        </div>
                      ) : isAudio ? (
                        <div
                          onContextMenu={e => handleMessageLongPress(e, msg)}
                          className={cn(
                            'max-w-[78%] rounded-2xl p-3 shadow-sm border',
                            isMe ? 'bg-brand-500 text-white rounded-br-sm border-brand-600' : 'bg-white text-brand-ink rounded-bl-sm border-brand-line'
                          )}
                        >
                          {msg.voice_url ? (
                            <VoiceMessagePlayer url={msg.voice_url} duration={msg.voice_duration} isMe={isMe} />
                          ) : (
                            <audio src={msg.sticker_url!} controls className="max-w-full h-8" />
                          )}
                          <div className="flex items-center justify-end text-[10px] mt-1">
                            <span className={isMe ? 'text-white/80' : 'text-brand-muted'}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </span>
                            {isMe && getTickSymbol(msg)}
                          </div>
                        </div>
                      ) : (
                        <div
                          onContextMenu={e => handleMessageLongPress(e, msg)}
                          className={cn(
                            'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border cursor-pointer select-none transition-transform active:scale-[0.99]',
                            isMe
                              ? 'bg-brand-500 text-white rounded-br-sm border-brand-600'
                              : 'bg-white text-brand-ink rounded-bl-sm border-brand-line'
                          )}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{renderMessageWithLinks(msg.content, isMe)}</p>
                          {extractUrls(msg.content).length > 0 && (
                            <div className="mt-2">
                              <LinkPreview url={extractUrls(msg.content)[0]} />
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-1 text-[10px] mt-1">
                            {msg.disappears_at && <Timer className="h-2.5 w-2.5 opacity-70" />}
                            <span className={isMe ? 'text-white/80' : 'text-brand-muted'}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                            </span>
                            {isMe && getTickSymbol(msg)}
                          </div>
                        </div>
                      )}
                      <MessageReactions messageId={msg.id} isMe={isMe} />
                    </div>
                  </div>
                )
              })
            })()}

            {isRecipientTyping && (
              <div className="flex items-center gap-2 text-xs text-brand-muted">
                <TypingIndicator />
                <span>{displayName} is typing...</span>
              </div>
            )}

            {/* Icebreaker Recommendation card when conversation is fresh */}
            {messages.length < 5 && (
              <button
                onClick={() => handleSend('text', 'What is your favorite local hiking spot or trail around town?')}
                className="w-full rounded-2xl border border-brand-line bg-brand-50/70 p-4 text-left hover:bg-brand-50 transition"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-brand-600">
                  <Bot className="h-4 w-4" /> AI Icebreaker Recommendation
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  "What is your favorite local hiking spot or trail around town?"
                </div>
              </button>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Context Menu on Right Click / Long Press */}
          {contextMenu && (
            <MessageContextMenu
              isMe={contextMenu.msg.sender_id === user?.id}
              content={contextMenu.msg.content}
              position={{ x: contextMenu.x, y: contextMenu.y }}
              onClose={() => setContextMenu(null)}
              onReply={() => {
                setReplyTo(contextMenu.msg)
                setContextMenu(null)
              }}
              onDelete={() => handleDeleteMessage(contextMenu.msg.id)}
            />
          )}

          {/* Pickers & Drawers */}
          {showEmoji && (
            <EmojiPicker
              onSelect={emoji => setMessage(prev => prev + emoji)}
              onClose={() => setShowEmoji(false)}
            />
          )}
          {showStickers && (
            <StickerPicker
              onSelect={url => handleSend('sticker', url)}
              onClose={() => setShowStickers(false)}
            />
          )}
          {showAttachments && (
            <AttachmentMenu
              recipientId={recipientId}
              onClose={() => setShowAttachments(false)}
              onStickerOpen={() => {
                setShowAttachments(false)
                setShowStickers(true)
              }}
              onImageSent={() => setShowAttachments(false)}
            />
          )}

          {/* Reply Quote Banner */}
          {replyTo && (
            <div className="border-t border-brand-line bg-brand-canvas px-4 py-2 flex items-center justify-between">
              <div className="border-l-2 border-brand-500 pl-2">
                <div className="text-[10px] font-bold text-brand-600">
                  Replying to {replyTo.sender_id === user?.id ? 'yourself' : displayName}
                </div>
                <div className="text-xs text-brand-muted truncate max-w-sm">{replyTo.content}</div>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Composer Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2 border-t border-brand-line bg-white p-3"
          >
            {/* Attachment Button */}
            <button
              type="button"
              aria-label="Add attachment"
              onClick={() => {
                setShowAttachments(!showAttachments)
                setShowEmoji(false)
                setShowStickers(false)
              }}
              className="grid h-10 w-10 place-items-center rounded-xl bg-brand-canvas text-brand-muted hover:text-brand-ink hover:bg-slate-100 transition shrink-0"
            >
              {showAttachments ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>

            {/* Text Input Pill */}
            <div className="flex flex-1 items-center rounded-xl bg-brand-canvas px-3 border border-brand-line">
              <button
                type="button"
                aria-label="Choose emoji"
                onClick={() => {
                  setShowEmoji(!showEmoji)
                  setShowStickers(false)
                  setShowAttachments(false)
                }}
                className="text-slate-400 hover:text-brand-600 p-1"
              >
                <Smile className="h-5 w-5" />
              </button>

              <input
                value={message}
                onChange={e => {
                  setMessage(e.target.value)
                  if (e.target.value.trim()) sendTyping()
                  else sendStopTyping()
                }}
                onKeyDown={handleKeyDown}
                onBlur={sendStopTyping}
                placeholder="Type a message..."
                className="min-w-0 flex-1 bg-transparent py-3 px-2 text-sm outline-none text-brand-ink placeholder:text-slate-400"
              />

              <button
                type="button"
                aria-label="Choose sticker"
                onClick={() => {
                  setShowStickers(!showStickers)
                  setShowEmoji(false)
                  setShowAttachments(false)
                }}
                className="text-slate-400 hover:text-brand-600 p-1"
              >
                <Smile className="h-5 w-5 rotate-12" />
              </button>
            </div>

            {/* Actions: Send OR Camera + Mic */}
            {message.trim() ? (
              <button
                type="submit"
                aria-label="Send message"
                disabled={sending}
                className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white shadow-sm hover:bg-brand-600 transition shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  aria-label="Take or choose photo"
                  onClick={handleCameraCapture}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-brand-canvas text-brand-muted hover:text-brand-ink transition"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Record voice note"
                  onClick={() => setShowVoiceRecorder(true)}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-brand-canvas text-brand-muted hover:text-brand-ink transition"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            )}
          </form>
        </Card>

        {/* Disappearing Messages Settings Modal */}
        <Dialog open={showDisappearSettings} onOpenChange={setShowDisappearSettings}>
          <DialogContent className="max-w-sm rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-brand-ink">
                Disappearing Messages
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-brand-ink">Enable disappearing</Label>
                <Switch checked={disappearingEnabled} onCheckedChange={setDisappearingEnabled} />
              </div>
              {disappearingEnabled && (
                <div className="space-y-2">
                  <Label className="text-xs text-brand-muted">Messages disappear after</Label>
                  <Select value={disappearingDuration} onValueChange={setDisappearingDuration}>
                    <SelectTrigger className="rounded-xl border-brand-line">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="86400">24 hours</SelectItem>
                      <SelectItem value="604800">7 days</SelectItem>
                      <SelectItem value="2592000">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={saveDisappearSettings} className="w-full mt-3">
                Save Preferences
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Chat Wallpaper Customization Modal */}
        <Dialog open={showBgSettings} onOpenChange={setShowBgSettings}>
          <DialogContent className="max-w-sm rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-brand-ink">
                Chat Background
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs font-bold text-brand-muted mb-2 block uppercase tracking-wider">
                  Select Theme Color
                </Label>
                <div className="flex flex-wrap gap-2">
                  {['', '#f8fafc', '#f0fdf4', '#fef2f2', '#eff6ff', '#faf5ff', '#fffbeb'].map(color => (
                    <button
                      key={color || 'default'}
                      onClick={() => {
                        const bg = color ? { type: 'color' as const, value: color } : { type: 'color' as const, value: '' }
                        setChatBg(bg)
                        localStorage.setItem(`chat-bg-${recipientId}`, JSON.stringify(bg))
                      }}
                      className={cn(
                        'h-9 w-9 rounded-xl border-2 transition-all',
                        chatBg.value === color ? 'border-brand-500 scale-110' : 'border-brand-line'
                      )}
                      style={{ backgroundColor: color || '#ffffff' }}
                    >
                      {!color && <span className="text-[10px] text-slate-500">Def</span>}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  const bg = { type: 'color' as const, value: '' }
                  setChatBg(bg)
                  localStorage.removeItem(`chat-bg-${recipientId}`)
                  setShowBgSettings(false)
                }}
                className="w-full text-xs"
              >
                Reset to Default
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Voice Note Recorder Overlay */}
        {showVoiceRecorder && (
          <VoiceRecorder
            recipientId={recipientId}
            onClose={() => setShowVoiceRecorder(false)}
            onSent={() => setShowVoiceRecorder(false)}
          />
        )}

        {/* Realtime Video/Audio Call Overlay */}
        {showCall && (
          <Suspense fallback={null}>
            <VideoCall
              recipientId={recipientId}
              recipientName={displayName}
              onClose={() => {
                setShowCall(false)
                setIsIncomingCall(false)
                setIncomingOffer(null)
              }}
              isIncoming={isIncomingCall}
              incomingOffer={incomingOffer || undefined}
            />
          </Suspense>
        )}

        {/* Story Viewer Overlay */}
        {showStoryViewer && (
          <ChatStoryViewer
            userId={recipientId}
            userName={displayName}
            onClose={() => setShowStoryViewer(false)}
          />
        )}
      </div>
    </AppShell>
  )
}

/**
 * Community Chat: Live group discussions and pinned announcements for communities
 */
export function CommunityChat() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isPersisted = Boolean(id && /^[0-9a-f-]{36}$/i.test(id))
  const [remoteMessages, setRemoteMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isPersisted || !id) return
    const refresh = () => {
      loadCommunityMessages(id)
        .then(setRemoteMessages)
        .catch(err => toast.error(err instanceof Error ? err.message : 'Could not load chat'))
    }
    refresh()
    return subscribeToCommunityMessages(id, refresh)
  }, [id, isPersisted])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const msg = text.trim()
    setText('')

    if (!isPersisted || !id) {
      setRemoteMessages(prev => [...prev, { id: `m-${Date.now()}`, content: msg }])
      return
    }

    try {
      setLoading(true)
      await sendCommunityMessage(id, msg)
      toast.success('Message sent')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell
      title="Community Chat"
      subtitle={isPersisted ? 'Live community conversation' : 'Mindful Living Community · 248 members'}
    >
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden shadow-lg border-brand-line">
          {/* Pinned Announcement */}
          <div className="border-b border-brand-line bg-brand-50/70 p-4 text-xs">
            <div className="font-bold text-brand-600">📌 Pinned announcement</div>
            <div className="mt-0.5 text-brand-muted">
              Weekly mindful meditation & circle this Friday at 7:00 AM. Everyone is welcome!
            </div>
          </div>

          {/* Group Chat Stream */}
          <div className="min-h-[55vh] space-y-4 p-5 bg-white">
            {isPersisted ? (
              remoteMessages.length ? (
                remoteMessages.map(m => (
                  <GroupMsg key={m.id} name="Community member" text={m.content} />
                ))
              ) : (
                <p className="py-12 text-center text-sm text-brand-muted">
                  No messages yet. Be the first to start the conversation!
                </p>
              )
            ) : (
              <>
                <GroupMsg
                  name="Alex Johnson"
                  text="Good morning everyone! How is everyone's week going?"
                />
                <GroupMsg
                  name="Sarah Williams"
                  text="Feeling grounded and grateful. The morning meditation session was so refreshing."
                />
                <GroupMsg
                  name="Marcus Lee"
                  text="Don't forget about our community nature walk this Saturday at 8:00 AM!"
                />
                {remoteMessages.map(m => (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-brand-500 px-4 py-2.5 text-sm text-white shadow-sm">
                      {m.content}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Upcoming Event Card */}
            <div className="rounded-2xl border border-brand-line bg-brand-canvas p-4">
              <div className="flex items-center gap-2 font-bold text-brand-ink text-sm">
                <UsersRound className="h-5 w-5 text-brand-500" /> Nature Walk at Zilker Park
              </div>
              <div className="mt-1 text-xs text-brand-muted">Sat · 8:00 AM · 15 members going</div>
              <Button
                variant="secondary"
                className="mt-3 text-xs py-1.5"
                onClick={() => navigate('/events')}
              >
                View Event
              </Button>
            </div>
          </div>

          {/* Community Composer */}
          <form onSubmit={submit} className="flex items-center gap-2 border-t border-brand-line bg-white p-3">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Message #general..."
              className="flex-1 rounded-xl bg-brand-canvas py-3 px-4 text-sm outline-none border border-brand-line"
            />
            <button
              type="submit"
              aria-label="Send community message"
              disabled={loading}
              className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500 text-white shadow-sm hover:bg-brand-600 transition shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </Card>
      </div>
    </AppShell>
  )
}

function GroupMsg({ name, text }: { name: string; text: string }) {
  return (
    <div className="flex gap-3">
      <Avatar name={name} size="md" />
      <div className="flex-1">
        <div className="text-xs font-bold text-brand-ink">{name}</div>
        <div className="mt-1 rounded-2xl rounded-tl-sm bg-brand-canvas px-4 py-2.5 text-sm text-brand-ink leading-relaxed border border-brand-line/50 inline-block max-w-[85%]">
          {text}
        </div>
      </div>
    </div>
  )
}
