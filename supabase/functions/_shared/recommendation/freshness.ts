export function freshnessScore(createdAt: string, halfLifeHours = 36) {
  const timestamp = new Date(createdAt).getTime()
  if (!Number.isFinite(timestamp)) return 0
  const ageHours = Math.max(0, (Date.now() - timestamp) / 3_600_000)
  return Math.exp((-Math.log(2) * ageHours) / halfLifeHours)
}

