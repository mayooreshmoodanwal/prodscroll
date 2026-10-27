import { describe, it, expect } from "vitest";
import {
  rankCandidates,
  defaultWeights,
  type Candidate,
} from "../../apps/api/src/domains/ranking";
const now = Date.now();
const candidate = (id: string, extra: Partial<Candidate> = {}): Candidate => ({
  id,
  authorId: id,
  startupId: id,
  category: "AI",
  createdAt: new Date(now),
  likeCount: 2,
  commentCount: 1,
  saveCount: 1,
  affinity: 0,
  followed: false,
  negative: 0,
  seen: 0,
  ...extra,
});
describe("feed ranking", () => {
  it("keeps the same ranking prefix when only one reel batch is requested", () => {
    const input = Array.from({ length: 80 }, (_, i) =>
      candidate(String(i), {
        authorId: String(i % 9),
        startupId: String(i % 11),
        category: String(i % 5),
        affinity: i % 3,
        likeCount: i * 2,
        negative: Number(i % 7 === 0),
        seen: i % 4,
      }),
    );
    expect(rankCandidates(input, defaultWeights, now, 10)).toEqual(
      rankCandidates(input, defaultWeights, now).slice(0, 10),
    );
  });
  it("adapts to affinity and negative feedback rather than sorting by likes", () => {
    const ids = rankCandidates(
      [
        candidate("popular", { likeCount: 200, negative: 2 }),
        candidate("relevant", { affinity: 4 }),
      ],
      defaultWeights,
      now,
    );
    expect(ids[0]).toBe("relevant");
  });
  it("penalizes consecutive posts from the same startup", () => {
    const items = [
      candidate("a", { startupId: "same", authorId: "same", affinity: 1 }),
      candidate("b", { startupId: "same", authorId: "same", affinity: 1 }),
      candidate("c", { category: "Hardware" }),
    ];
    const ids = rankCandidates(items, defaultWeights, now);
    expect(ids.indexOf("c")).toBe(1);
  });
  it("does not duplicate candidates and reserves exploration for unseen content", () => {
    const input = Array.from({ length: 20 }, (_, i) =>
      candidate(String(i), { likeCount: 100, seen: 3, affinity: 2 }),
    );
    input.push(candidate("new", { category: "Climate" }));
    const ids = rankCandidates(input, defaultWeights, now);
    expect(new Set(ids).size).toBe(input.length);
    expect(ids.indexOf("new")).toBeLessThan(15);
  });
});
