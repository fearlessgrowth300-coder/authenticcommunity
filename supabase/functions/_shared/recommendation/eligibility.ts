export type FeedEligibilityCandidate = {
  authorId: string
  status: string
  visibility: string
  authorActive: boolean
  authorAccountStatus: string
  communityAllowed: boolean
}

export function isFeedCandidateEligible(
  candidate: FeedEligibilityCandidate,
  context: {
    currentUserId: string
    blockedUserIds: Set<string>
    dismissedItemIds: Set<string>
    itemId: string
  },
) {
  if (candidate.status !== 'active') return false
  if (!candidate.authorActive || candidate.authorAccountStatus !== 'active') return false
  if (context.blockedUserIds.has(candidate.authorId)) return false
  if (context.dismissedItemIds.has(context.itemId)) return false
  if (!candidate.communityAllowed) return false
  if (!['public', 'followers', 'connections', 'community'].includes(candidate.visibility)) return false
  return true
}

