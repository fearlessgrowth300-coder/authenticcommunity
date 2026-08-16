export type MatchInput = {
  candidateId: string;
  candidateInterests: string[];
  candidateValues: string[];
  candidateCity?: string | null;
  candidateGoal?: string | null;
  candidateTrust?: number;
  myInterests: string[];
  myValues: string[];
  myCity?: string | null;
  myGoal?: string | null;
  sharedCommunities?: number;
  behavioralAffinity?: number;
};

const norm = (value: string) => value.trim().toLowerCase();
const clusters = [
  ["startups", "entrepreneurship", "business", "saas", "freelancing", "e-commerce", "marketing", "sales"],
  ["programming", "software", "coding", "ai", "technology", "design"],
  ["fitness", "gym", "running", "hiking", "yoga", "cycling", "nutrition"],
  ["meditation", "mindfulness", "mental health", "wellness"],
  ["photography", "art", "film", "writing", "music", "creativity"],
  ["books", "reading", "learning", "languages"],
];

function semanticOverlap(a: string[], b: string[]) {
  const left = a.map(norm); const right = b.map(norm);
  if (!left.length || !right.length) return 0;
  let total = 0;
  for (const interest of left) {
    const exact = right.includes(interest);
    const related = clusters.some((cluster) => cluster.includes(interest) && right.some((value) => cluster.includes(value)));
    total += exact ? 1 : related ? 0.65 : 0;
  }
  return Math.min(1, total / Math.max(1, Math.min(left.length, right.length)));
}

export type MatchScore = {
  overall: number;
  reasons: string[];
  breakdown: Record<string, number>;
  discovery: boolean;
};

/** Explainable ranking: deterministic signals decide; AI can only enrich tags/reasons later. */
export function scoreConnection(input: MatchInput): MatchScore {
  const sharedValues = input.myValues.map(norm).filter((value) => input.candidateValues.map(norm).includes(value));
  const values = Math.round((sharedValues.length / Math.max(1, Math.min(input.myValues.length, input.candidateValues.length))) * 30);
  const interestSimilarity = semanticOverlap(input.myInterests, input.candidateInterests);
  const interests = Math.round(interestSimilarity * 20);
  const sameCity = Boolean(input.myCity && input.candidateCity && norm(input.myCity) === norm(input.candidateCity));
  const location = sameCity ? 10 : 3;
  const goals = input.myGoal && input.candidateGoal && input.myGoal === input.candidateGoal ? 15 : input.myGoal === "all" || input.candidateGoal === "all" ? 8 : 4;
  const community = Math.min(10, (input.sharedCommunities || 0) * 5);
  const behavior = Math.min(5, Math.round((input.behavioralAffinity || 0) * 5));
  const trust = Math.min(5, Math.max(0, input.candidateTrust ?? 2));
  const overall = Math.min(100, values + interests + goals + community + location + behavior + trust);
  const reasons: string[] = [];
  if (sharedValues.length) reasons.push(`You both value ${sharedValues.slice(0, 2).join(" and ")}`);
  if (interestSimilarity >= 0.65) reasons.push("Your interests strongly overlap");
  else if (interestSimilarity > 0) reasons.push("You have related interests");
  if (sameCity) reasons.push("You are in the same city");
  if ((input.sharedCommunities || 0) > 0) reasons.push(`You share ${input.sharedCommunities} community${input.sharedCommunities === 1 ? "" : "ies"}`.replace("1 communityies", "1 community"));
  if (!reasons.length) reasons.push("A fresh perspective within your preferences");
  return { overall, reasons: reasons.slice(0, 3), breakdown: { values, interests, social: goals, community, location, behavior, trust }, discovery: interestSimilarity < 0.25 && sharedValues.length > 0 };
}

export function diversifyScores<T extends { score: MatchScore; interests: string[] }>(items: T[]) {
  const output: T[] = []; const categoryCounts = new Map<string, number>();
  for (const item of [...items].sort((a, b) => b.score.overall - a.score.overall)) {
    const key = item.interests.map(norm).sort()[0] || "other";
    const penalty = (categoryCounts.get(key) || 0) * 7;
    const adjusted = item.score.overall - penalty;
    const insertAt = output.findIndex((current) => adjusted > current.score.overall - ((categoryCounts.get(current.interests.map(norm).sort()[0] || "other") || 0) * 7));
    if (insertAt === -1) output.push(item); else output.splice(insertAt, 0, item);
    categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
  }
  return output;
}
