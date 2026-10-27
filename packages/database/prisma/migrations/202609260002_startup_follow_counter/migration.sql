ALTER TABLE "Startup" ADD COLUMN "followerCount" INTEGER NOT NULL DEFAULT 0;
UPDATE "Startup" s SET "followerCount" = (SELECT COUNT(*)::integer FROM "StartupFollow" f WHERE f."startupId" = s.id);
ALTER TABLE "Startup" ADD CONSTRAINT "Startup_followerCount_nonnegative" CHECK ("followerCount" >= 0);
CREATE INDEX "Startup_followerCount_idx" ON "Startup" ("followerCount");
CREATE FUNCTION maintain_startup_follow_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Startup" SET "followerCount" = "followerCount" + 1 WHERE id = NEW."startupId";
    RETURN NEW;
  ELSE
    UPDATE "Startup" SET "followerCount" = GREATEST(0, "followerCount" - 1) WHERE id = OLD."startupId";
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER startup_follow_count_insert AFTER INSERT ON "StartupFollow" FOR EACH ROW EXECUTE FUNCTION maintain_startup_follow_count();
CREATE TRIGGER startup_follow_count_delete AFTER DELETE ON "StartupFollow" FOR EACH ROW EXECUTE FUNCTION maintain_startup_follow_count();
