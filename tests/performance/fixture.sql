-- Synthetic performance data only; never run against an application database.
DO $$ BEGIN
  IF current_database() NOT LIKE 'productscroll_scale_%' THEN RAISE EXCEPTION 'Use a dedicated productscroll_scale_* database'; END IF;
  IF EXISTS (SELECT 1 FROM "User" LIMIT 1) THEN RAISE EXCEPTION 'Scale fixture requires an empty database'; END IF;
END $$;
INSERT INTO "User" (id,email,username,"displayName","emailVerifiedAt",onboarded,"updatedAt")
SELECT 'perf-user-'||i,'perf_'||i||'@example.invalid','perf_'||i,'Synthetic Builder '||i,now(),true,now() FROM generate_series(1,1000000) i;
INSERT INTO "Startup" (id,slug,name,pitch,description,category,"ownerId","updatedAt")
SELECT 'perf-startup-'||i,'perf-startup-'||i,'Synthetic Startup '||i,'Performance fixture','Synthetic data for local capacity tests',CASE WHEN i%2=0 THEN 'AI' ELSE 'Robotics' END,'perf-user-'||i,now() FROM generate_series(1,1000) i;
INSERT INTO "MediaAsset" (id,"ownerId","storageKey","mediaType","mimeType","fileSizeBytes","processingStatus","processedUrl","updatedAt")
SELECT 'perf-media-'||i,'perf-user-'||i,'synthetic/'||i,'VIDEO','video/mp4',100000,'READY','http://localhost:4180/media/public/performance-fixture.mp4',now() FROM generate_series(1,1000) i;
INSERT INTO "Post" (id,"authorId","startupId",kind,caption,tags,"createdAt","updatedAt")
SELECT 'perf-post-'||i,'perf-user-'||(1+(i%1000)),'perf-startup-'||(1+(i%1000)),CASE WHEN i%3=0 THEN 'REEL'::"PostKind" ELSE 'POST'::"PostKind" END,'Synthetic performance post '||i,ARRAY[CASE WHEN i%2=0 THEN 'AI' ELSE 'Robotics' END],now()-(i%1209600)*interval '1 second',now() FROM generate_series(1,100000) i;
INSERT INTO "PostMedia" ("postId","mediaId",position) SELECT 'perf-post-'||i,'perf-media-'||(1+(i%1000)),0 FROM generate_series(1,100000) i WHERE i%3=0;
INSERT INTO "Like" ("userId","postId") SELECT 'perf-user-'||(1000+i),'perf-post-'||i FROM generate_series(1,100000) i;
UPDATE "Post" SET "likeCount"=1;
INSERT INTO "StartupFollow" ("userId","startupId") SELECT 'perf-user-'||(1000+i),'perf-startup-'||(1+(i%1000)) FROM generate_series(1,50000) i;
INSERT INTO "EngagementEvent" (id,"userId","postId",type) SELECT 'perf-event-'||u||'-'||i,'perf-user-'||u,'perf-post-'||(1+(i*97)%100000),'VIDEO_COMPLETE' FROM generate_series(1001,1020) u CROSS JOIN generate_series(1,1000) i;
INSERT INTO "FeedImpression" (id,"userId","postId") SELECT 'perf-impression-'||u||'-'||i,'perf-user-'||u,'perf-post-'||(1+(i*97)%100000) FROM generate_series(1001,1020) u CROSS JOIN generate_series(1,200) i;
ANALYZE;
SELECT current_database() AS database, pg_size_pretty(pg_database_size(current_database())) AS size, (SELECT count(*) FROM "User") AS users, (SELECT count(*) FROM "Post") AS posts;
