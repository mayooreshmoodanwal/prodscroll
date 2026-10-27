# Recommendation engine

The implementation is an inspectable first-generation ranker, not a trained predictive model. It combines fresh, popular and followed candidates with selected interests, recorded behavior, negative feedback and diversity. Tests exercise ranking order, negative signals, creator saturation and exploration.

## Candidate generation

For a new feed snapshot the server fetches up to 150 fresh posts, 80 popular posts and 100 posts sampled from up to 500 recent accepted user follows and 500 recent startup follows, then deduplicates IDs. Public fresh/popular IDs share a 15-second Redis cache with per-process miss coalescing; visibility is always checked again. The bounded follow sample is for discovery; the chronological Following endpoint still represents the full follow graph. Candidate IDs are selected before the more expensive author visibility joins. Filters exclude drafts, removed content, suspended/deactivated authors, private accounts without an accepted follow, and blocked/muted accounts. Reels additionally require READY video media.

For authenticated users it reads interests, at most 1,000 recent events from 30 days, and impression counts from seven days restricted to the current candidate IDs. Cold start uses interest affinity, freshness, quality and exploration; anonymous users have no personalized behavioral history. Geography is not inferred.

## Score and configurable weights

The pure `rankCandidates` function in `apps/api/src/domains/ranking.ts` uses:

```
 affinity * 2.5
 + followed * 2
 + exp(-ageDays / 4) * 1.6
 + log(1 + saves*3 + comments*2 + likes) * 0.8
 - negativeFeedback * 5
 - min(5, impressions) * 1.8
```

`RankingConfig` with key `default` overrides weights. Every selected result penalizes candidates sharing creators/startups (3 per recent occurrence) or categories (2), considering the preceding four results. Every roughly seventh position receives an exploration bonus favoring unseen content with little engagement; the default fraction is 0.15. These are soft penalties, not impossible guarantees when a small candidate pool is homogeneous.

Selected interests initialize affinity. Completion/save/follow events add 0.15, other positive events add 0.03, and skip/not-interested/report events subtract 0.3 for associated topics. Explicit negative feedback also applies a post penalty. Weights are runtime data; update them through a reviewed database change. There is no public endpoint that lets users change ranking weights.

## Events, snapshots and pagination

Clients submit batches to `/events`; validation verifies allowed event types and content visibility. BullMQ ingests asynchronously using stable job-derived IDs. Feed impressions, watch quartiles/completion, likes/saves/comments and negative feedback are persisted. Some vocabulary such as return-visit and inferred creator similarity is reserved for future instrumentation; do not interpret the vocabulary as evidence every client emits every possible event.

Home uses a ranking snapshot that stores only ordered IDs for ten minutes under a user/mode-specific Redis key. A cursor contains a snapshot token and offset, preventing reorder/duplicate churn while scrolling. Each page rechecks current visibility. Starting a new feed snapshot incorporates completed event jobs; an existing snapshot does not reorder in place.

Following uses a separate chronological query containing only accepted followed authors/startups. It bypasses the discovery ranker.

Reels uses `/reels` in repeating batches of 10. On the seventh item of each batch, clients send the last 40 loaded IDs and request the next batch. Reels avoids allocating unused ranking snapshots and scores only ten winners per request. Each batch uses a new ranking, so interests and newly ingested watch, skip, follow and save feedback can change subsequent recommendations. The server prefers unseen-in-session candidates; when the finite catalog is exhausted it relaxes the oldest exclusions to allow continued browsing. This is repeated discovery from available content, not an unlimited supply of unique videos. Clients retain metadata for back scrolling while mounting only a small window of players (at most five on web, three on native), with the next video prepared ahead of time.

## Evaluation and scaling

Track completion, saves per impression, unique creators/categories seen, hides/reports, return rate and latency. Evaluate diversity and negative-feedback reduction alongside engagement. No model-training or collaborative-filtering effectiveness is claimed. A large-corpus candidate index, offline replay dataset, experiment allocation, bot-resistant event validation, retention policy and production load/fault tests remain necessary for a large public launch. The reproducible local million-account benchmark and its limits are documented in SCALABILITY_REVIEW.md.
