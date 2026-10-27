export interface RankWeights {
  affinity: number;
  following: number;
  freshness: number;
  quality: number;
  negative: number;
  repetition: number;
  exploration: number;
  creatorPenalty: number;
  categoryPenalty: number;
}
export const defaultWeights: RankWeights = {
  affinity: 2.5,
  following: 2,
  freshness: 1.6,
  quality: 0.8,
  negative: 5,
  repetition: 1.8,
  exploration: 0.15,
  creatorPenalty: 3,
  categoryPenalty: 2,
};
export interface Candidate {
  id: string;
  authorId: string;
  startupId: string | null;
  category: string;
  createdAt: Date;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  affinity: number;
  followed: boolean;
  negative: number;
  seen: number;
}
export function rankCandidates(
  candidates: Candidate[],
  weights: RankWeights,
  now = Date.now(),
  limit = candidates.length,
) {
  const score = (p: Candidate) =>
    p.affinity * weights.affinity +
    Number(p.followed) * weights.following +
    Math.exp(-(now - p.createdAt.getTime()) / 86400000 / 4) *
      weights.freshness +
    Math.log1p(p.saveCount * 3 + p.commentCount * 2 + p.likeCount) *
      weights.quality -
    p.negative * weights.negative -
    Math.min(5, p.seen) * weights.repetition;
  const remaining = candidates.map((c) => ({ ...c, score: score(c) }));
  const selected: Candidate[] = [];
  const step = Math.max(2, Math.round(1 / Math.max(0.01, weights.exploration)));
  while (remaining.length && selected.length < limit) {
    const recent = selected.slice(-4);
    const explore = selected.length > 0 && selected.length % step === 0;
    const adjusted = (c: (typeof remaining)[number]) =>
      c.score -
      recent.filter(
        (p) =>
          p.authorId === c.authorId ||
          (!!c.startupId && p.startupId === c.startupId),
      ).length *
        weights.creatorPenalty -
      recent.filter((p) => p.category === c.category).length *
        weights.categoryPenalty +
      (explore ? 5 / (1 + c.seen + c.likeCount) : 0);
    // Select only the next winner; sorting the whole pool at every step does extra work.
    let best = 0;
    let bestScore = adjusted(remaining[0]!);
    for (let index = 1; index < remaining.length; index++) {
      const value = adjusted(remaining[index]!);
      if (
        value > bestScore ||
        (value === bestScore &&
          remaining[index]!.id.localeCompare(remaining[best]!.id) < 0)
      ) {
        best = index;
        bestScore = value;
      }
    }
    selected.push(remaining.splice(best, 1)[0]!);
  }
  return selected.map((c) => c.id);
}
