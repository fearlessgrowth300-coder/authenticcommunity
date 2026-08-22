function stableUnit(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4_294_967_295
}

export function explorationBoost(seed: string, enabled: boolean, rate = 0.05) {
  if (!enabled) return 0
  return stableUnit(seed) < rate ? 0.08 : 0
}

