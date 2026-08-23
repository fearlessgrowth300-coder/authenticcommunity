import type { RecommendationReasonCode } from './types.ts'

const LABELS: Record<RecommendationReasonCode, string> = {
  explicit_interest: "It matches an interest you selected",
  learned_interest: "It relates to topics you engage with",
  shared_value: "You share an important value",
  relationship_strength: "You interact with this person",
  following: "You follow this person",
  shared_community: "You share a community",
  nearby: "It is near your general area",
  local_event: "This event is near your general area",
  friends_attending: "People you know are attending",
  fresh_content: "It was posted recently",
  quality_content: "It is creating useful community interaction",
  discovery: "It adds something new to your recommendations",
}

export function explainReasonCodes(codes: RecommendationReasonCode[]) {
  return [...new Set(codes)].slice(0, 4).map((code) => LABELS[code])
}

