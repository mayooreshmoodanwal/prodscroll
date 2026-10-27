CREATE INDEX "UserFollow_followerId_createdAt_followingId_idx" ON "UserFollow" ("followerId", "createdAt", "followingId");
CREATE INDEX "StartupFollow_userId_createdAt_startupId_idx" ON "StartupFollow" ("userId", "createdAt", "startupId");
