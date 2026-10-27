-- Run the equivalent CREATE INDEX CONCURRENTLY statements outside a transaction
-- on an already-large production database, then mark this migration applied.
CREATE INDEX "Post_discovery_fresh" ON "Post" ("createdAt" DESC, "id" DESC) WHERE "draft" = false AND "removedAt" IS NULL;
CREATE INDEX "Post_discovery_popular" ON "Post" ("saveCount" DESC, "id" DESC) WHERE "draft" = false AND "removedAt" IS NULL;
CREATE INDEX "Post_reels_popular" ON "Post" ("kind", "saveCount" DESC, "id" DESC) WHERE "draft" = false AND "removedAt" IS NULL;
CREATE INDEX "MediaAsset_ownerId_createdAt_idx" ON "MediaAsset" ("ownerId", "createdAt");
CREATE INDEX "PostMedia_mediaId_postId_idx" ON "PostMedia" ("mediaId", "postId");
CREATE INDEX "MessageMedia_mediaId_messageId_idx" ON "MessageMedia" ("mediaId", "messageId");
