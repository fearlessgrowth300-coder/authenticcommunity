export type DiverseRankedItem = {
  id: string
  authorId: string
  primaryTopic?: string
  score: number
}

export function diversifyRankedItems<T extends DiverseRankedItem>(
  items: T[],
  limit: number,
  options: { maxPerAuthor?: number; maxPerTopic?: number } = {},
) {
  const maxPerAuthor = options.maxPerAuthor ?? 2
  const maxPerTopic = options.maxPerTopic ?? 3
  const authorCounts = new Map<string, number>()
  const topicCounts = new Map<string, number>()
  const selected: T[] = []
  const deferred: T[] = []

  for (const item of items) {
    const authorCount = authorCounts.get(item.authorId) || 0
    const topic = item.primaryTopic?.toLowerCase() || 'general'
    const topicCount = topicCounts.get(topic) || 0
    if (authorCount >= maxPerAuthor || topicCount >= maxPerTopic) {
      deferred.push(item)
      continue
    }
    selected.push(item)
    authorCounts.set(item.authorId, authorCount + 1)
    topicCounts.set(topic, topicCount + 1)
    if (selected.length === limit) return selected
  }

  for (const item of deferred) {
    selected.push(item)
    if (selected.length === limit) break
  }
  return selected
}

