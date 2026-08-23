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
  mediaUrl?: string | null
  parentMessageId?: string | null
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
    .select('id, sender_id, recipient_id, content, created_at, is_read, media_url, parent_message_id')
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
      mediaUrl: m.media_url || null,
      parentMessageId: m.parent_message_id || null,
    }
  })
}

/**
 * Send a direct message to a user.
 */
export async function getDirectMessagingPermission(recipientId: string) {
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) throw new Error('Not authenticated')
  const currentUserId = auth.user.id
  const u1 = currentUserId < recipientId ? currentUserId : recipientId
  const u2 = currentUserId < recipientId ? recipientId : currentUserId
  const [connectionRes, requestRes] = await Promise.all([
    supabase
      .from('connections')
      .select('id, status')
      .eq('user_id_1', u1)
      .eq('user_id_2', u2)
      .in('status', ['active', 'accepted'])
      .maybeSingle(),
    (supabase as any)
      .from('message_requests')
      .select('id, sender_id, recipient_id, status')
      .or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${currentUserId})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return { currentUserId, canSend: Boolean(connectionRes.data || requestRes.data?.status === 'accepted'), request: requestRes.data }
}

export async function sendDirectMessage(recipientId: string, content: string, options?: { mediaUrl?: string; parentMessageId?: string }): Promise<RealtimeMessageItem> {
  const { currentUserId, canSend, request } = await getDirectMessagingPermission(recipientId)
  if (!canSend) {
    if (options?.mediaUrl) throw new Error('Accept a connection or message request before sending media.')
    if (request?.status === 'pending') {
      throw new Error('Your message request is waiting for approval.')
    }
    const { error: requestError } = await (supabase as any).from('message_requests').insert({
      sender_id: currentUserId,
      recipient_id: recipientId,
      initial_message: content.trim(),
      status: 'pending',
    })
    if (requestError) throw requestError
    throw new Error('Message request sent. You can send more after it is accepted.')
  }

  const { data: inserted, error } = await (supabase as any)
    .from('messages')
    .insert({
      sender_id: currentUserId,
      recipient_id: recipientId,
      content: content.trim(),
      is_read: false,
      media_url: options?.mediaUrl || null,
      parent_message_id: options?.parentMessageId || null,
    })
    .select('id, sender_id, recipient_id, content, created_at, is_read, media_url, parent_message_id')
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
    mediaUrl: inserted.media_url || null,
    parentMessageId: inserted.parent_message_id || null,
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
          mediaUrl: newRow.media_url || null,
          parentMessageId: newRow.parent_message_id || null,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
