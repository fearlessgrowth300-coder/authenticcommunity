const normalize = (value?: string | null) => (value || "").trim().toLowerCase();

const categoryKeywords: Record<string, string[]> = {
  "outdoors": ["hiking", "nature", "travel", "cycling", "running", "camping"],
  "food & drink": ["food", "cooking", "coffee", "wine", "restaurant", "baking"],
  "arts & culture": ["art", "music", "film", "photography", "writing", "culture"],
  "wellness": ["wellness", "yoga", "meditation", "mental health", "fitness"],
  "tech": ["tech", "coding", "software", "design", "ai", "startup"],
  "social": ["friends", "social", "games", "conversation", "community"],
  "sports": ["football", "basketball", "sports", "running", "fitness", "cycling"],
  "learning": ["learning", "books", "reading", "language", "career", "coding"],
};

export type Recommendation = {
  score: number;
  reason: string | null;
};

/**
 * A deliberately transparent ranking model: location and shared interests matter;
 * popularity is only a modest tie-breaker. This keeps discovery useful without
 * turning the feed into a follower-count contest.
 */
export function scoreLocalRecommendation(input: {
  itemCity?: string | null;
  itemCategory?: string | null;
  memberCount?: number | null;
  myCity?: string | null;
  myInterests?: string[];
}): Recommendation {
  const category = normalize(input.itemCategory);
  const interests = (input.myInterests || []).map(normalize);
  const keywords = categoryKeywords[category] || [];
  const interestMatch = interests.some((interest) => keywords.some((keyword) => interest.includes(keyword) || keyword.includes(interest)));
  const sameCity = Boolean(normalize(input.myCity) && normalize(input.itemCity) === normalize(input.myCity));
  const popularityTieBreaker = Math.min(Math.log2((input.memberCount || 0) + 1), 8);
  const score = (sameCity ? 36 : 0) + (interestMatch ? 24 : 0) + popularityTieBreaker;
  const reason = sameCity && interestMatch
    ? `Near you and fits your interests`
    : sameCity
      ? `Happening in ${input.itemCity}`
      : interestMatch
        ? `Fits your interests`
        : null;
  return { score, reason };
}
