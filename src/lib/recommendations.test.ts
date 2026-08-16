import { describe, expect, it } from "vitest";
import { scoreLocalRecommendation } from "./recommendations";

describe("scoreLocalRecommendation", () => {
  it("prioritizes nearby activities that fit a member's interests", () => {
    const result = scoreLocalRecommendation({
      itemCity: "London",
      itemCategory: "Tech",
      memberCount: 20,
      myCity: "london",
      myInterests: ["Coding", "Coffee"],
    });

    expect(result.score).toBeGreaterThan(50);
    expect(result.reason).toBe("Near you and fits your interests");
  });

  it("does not use popularity as the primary signal", () => {
    const nearby = scoreLocalRecommendation({ itemCity: "Lagos", itemCategory: "Social", memberCount: 2, myCity: "Lagos" });
    const popularButIrrelevant = scoreLocalRecommendation({ itemCity: "Abuja", itemCategory: "Social", memberCount: 100000, myCity: "Lagos" });

    expect(nearby.score).toBeGreaterThan(popularButIrrelevant.score);
  });
});
