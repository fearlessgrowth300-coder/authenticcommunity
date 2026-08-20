import { supabase } from './supabase'

export interface RealtimeMessageItem {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatar: string | null
  text: string
  createdAt: string
  timeAgo: string
  isMe: boolean
  isRead: boolean
  reactions?: Record<string, string[]>
}

/**
 * Fetch messages for a 1-on-1 direct chat.
 */
export async function loadConversationMessages(targetUserId: string): Promise<RealtimeMessageItem[]> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return []

  const currentUserId = auth.user.id

  // Canonical ordering for direct conversation channel or query
  const { data: rawMessages, error } = await (supabase as any)
    .from('messages')
    .select('id, sender_id, recipient_id, content, created_at, is_read')
    .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},recipient_id.eq.${currentUserId})`)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error || !rawMessages) return []

  const [p1, p2] = await Promise.all([
    supabase.from('profiles').select('user_id, first_name, last_name, profile_image_url').eq('user_id', currentUserId).maybeSingle(),
    supabase.from('profiles').select('user_id, first_name, last_name, profile_image_url').eq('user_id', targetUserId).maybeSingle(),
  ])

  const profileMap = new Map<string, any>()
  if (p1.data) profileMap.set(currentUserId, p1.data)
  if (p2.data) profileMap.set(targetUserId, p2.data)

  return rawMessages.map((m: any) => {
    const isMe = m.sender_id === currentUserId
    const p = profileMap.get(m.sender_id)
    const senderName = isMe ? 'You' : `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Member'
    const createdDate = new Date(m.created_at)
    const timeStr = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return {
      id: m.id,
      conversationId: targetUserId,
      senderId: m.sender_id,
      senderName,
      senderAvatar: p?.profile_image_url || null,
      text: m.content || '',
      createdAt: m.created_at,
      timeAgo: timeStr,
      isMe,
      isRead: Boolean(m.is_read),
    }
  })
}

/**
 * Send a direct message to a user.
 */
export async function sendDirectMessage(recipientId: string, content: string): Promise<RealtimeMessageItem> {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not authenticated')

  const currentUserId = auth.user.id

  const { data: inserted, error } = await (supabase as any)
    .from('messages')
    .insert({
      sender_id: currentUserId,
      recipient_id: recipientId,
      content: content.trim(),
      is_read: false,
    })
    .select('id, sender_id, recipient_id, content, created_at, is_read')
    .single()

  if (error) throw error

  const createdDate = new Date(inserted.created_at)
  const timeStr = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return {
    id: inserted.id,
    conversationId: recipientId,
    senderId: currentUserId,
    senderName: 'You',
    senderAvatar: null,
    text: inserted.content,
    createdAt: inserted.created_at,
    timeAgo: timeStr,
    isMe: true,
    isRead: false,
  }
}

/**
 * Subscribe to Supabase Realtime for a 1-on-1 direct conversation.
 */
export function subscribeToConversationRealtime(
  targetUserId: string,
  onNewMessage: (msg: RealtimeMessageItem) => void
) {
  const channelName = `dm-conversation-${Date.now()}`

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      async (payload) => {
        const newRow = payload.new as any
        const { data: auth } = await supabase.auth.getUser()
        const currentUserId = auth?.user?.id

        // Only process messages between current user and target user
        const isRelevant =
          (newRow.sender_id === currentUserId && newRow.recipient_id === targetUserId) ||
          (newRow.sender_id === targetUserId && newRow.recipient_id === currentUserId)

        if (!isRelevant) return

        const isMe = newRow.sender_id === currentUserId
        const createdDate = new Date(newRow.created_at)
        const timeStr = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

        onNewMessage({
          id: newRow.id,
          conversationId: targetUserId,
          senderId: newRow.sender_id,
          senderName: isMe ? 'You' : 'Member',
          senderAvatar: null,
          text: newRow.content,
          createdAt: newRow.created_at,
          timeAgo: timeStr,
          isMe,
          isRead: Boolean(newRow.is_read),
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
