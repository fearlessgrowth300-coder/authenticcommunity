function saturatingScore(count: number, scale: number) {
  const safeCount = Math.max(0, Number.isFinite(count) ? count : 0)
  return 1 - Math.exp(-safeCount / scale)
}

export function contentEngagementQuality(input: {
  likes: number
  comments: number
  saves: number
  shares?: number
}) {
  const likes = saturatingScore(input.likes, 40)
  const comments = saturatingScore(input.comments, 12)
  const saves = saturatingScore(input.saves, 10)
  const shares = saturatingScore(input.shares || 0, 8)
  return Math.min(1, likes * 0.15 + comments * 0.3 + saves * 0.3 + shares * 0.25)
}

