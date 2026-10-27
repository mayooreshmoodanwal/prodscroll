export const eventNames = [
  "FEED_IMPRESSION",
  "VIDEO_START",
  "VIDEO_25",
  "VIDEO_50",
  "VIDEO_75",
  "VIDEO_COMPLETE",
  "VIDEO_REPLAY",
  "LIKE",
  "UNLIKE",
  "COMMENT",
  "SAVE",
  "UNSAVE",
  "SHARE",
  "PROFILE_OPEN",
  "STARTUP_OPEN",
  "FOLLOW",
  "UNFOLLOW",
  "NOT_INTERESTED",
  "REPORT",
  "SEARCH_CLICK",
  "SKIP",
  "WEBSITE_CLICK",
] as const;
export type EventType = (typeof eventNames)[number];
export interface EngagementSignal {
  type: EventType;
  postId?: string;
  startupId?: string;
  value?: number;
}
