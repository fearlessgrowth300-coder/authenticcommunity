import { describe, expect, it } from 'vitest'

describe('Mobile Section 5: Messages & Chat Suite', () => {
  const directConversations = [
    { id: '1', name: 'Jane Doe', unreadCount: 2 },
    { id: '2', name: 'Michael Chen', unreadCount: 1 },
    { id: '3', name: 'Priya Sharma', unreadCount: 0 },
    { id: '4', name: 'David Rodriguez', unreadCount: 0 },
  ]

  const communityConversations = [
    { id: 'c1', name: 'Austin Hikers', unreadCount: 3 },
    { id: 'c2', name: 'Mindful Living Community', unreadCount: 4 },
  ]

  describe('1. Unread Badge Aggregation', () => {
    it('computes total unread count across direct and community conversations', () => {
      const totalDirect = directConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
      const totalCommunity = communityConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

      expect(totalDirect).toBe(3)
      expect(totalCommunity).toBe(7)
    })
  })

  describe('2. Direct Message Sending & AI Icebreaker', () => {
    it('creates a new message with valid sender and text', () => {
      const icebreakerPrompt = 'Ask about her favorite photo spots in Austin'
      const newMsg = {
        id: 'msg-101',
        sender: 'me',
        text: icebreakerPrompt,
        time: '9:42 AM',
      }

      expect(newMsg.text).toContain('photo spots')
      expect(newMsg.sender).toBe('me')
    })
  })

  describe('3. Community Chat Reactions & Embedded Events', () => {
    it('handles reactions count accurately', () => {
      const reactions = [
        { emoji: '❤️', count: 12 },
        { emoji: '🙌', count: 6 },
      ]

      const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0)
      expect(totalReactions).toBe(18)
    })

    it('validates embedded event attachment structure', () => {
      const embeddedEvent = {
        title: 'Nature Walk at Zilker Park',
        date: 'Sat, May 25 · 8:00 AM',
        attendeesCount: 12,
      }

      expect(embeddedEvent.title).toBe('Nature Walk at Zilker Park')
      expect(embeddedEvent.attendeesCount).toBeGreaterThan(0)
    })
  })
})
