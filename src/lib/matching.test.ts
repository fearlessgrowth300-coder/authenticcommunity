import { describe, expect, it } from "vitest";
import { scoreConnection } from "./matching";

describe("scoreConnection", () => {
  it("prioritises values and related interests over a superficial exact hobby match", () => {
    const strong = scoreConnection({
      candidateId: "a", candidateInterests: ["Startups", "Gym"], candidateValues: ["Growth", "Honesty"], candidateCity: "Lagos", candidateGoal: "networking",
      myInterests: ["Entrepreneurship", "Fitness"], myValues: ["Growth", "Honesty"], myCity: "Lagos", myGoal: "networking",
    });
    const weak = scoreConnection({
      candidateId: "b", candidateInterests: ["Fitness"], candidateValues: ["Creativity"], candidateCity: "Lagos", candidateGoal: "friends",
      myInterests: ["Entrepreneurship", "Fitness"], myValues: ["Growth", "Honesty"], myCity: "Lagos", myGoal: "networking",
    });
    expect(strong.overall).toBeGreaterThan(weak.overall);
    expect(strong.reasons.join(" ")).toContain("growth");
  });

  it("keeps a values-aligned adjacent-interest introduction discoverable", () => {
    const score = scoreConnection({
      candidateId: "c", candidateInterests: ["Photography"], candidateValues: ["Community", "Growth"],
      myInterests: ["Startups"], myValues: ["Community", "Growth"], myGoal: "friends", candidateGoal: "friends",
    });
    expect(score.discovery).toBe(true);
    expect(score.overall).toBeGreaterThan(30);
  });
});
