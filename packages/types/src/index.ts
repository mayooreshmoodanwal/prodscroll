export interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  role: "USER" | "FOUNDER" | "MODERATOR" | "ADMIN";
  onboarded: boolean;
  verified: boolean;
  interests?: string[];
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  following?: boolean;
  location?: string;
  website?: string;
  privateAccount?: boolean;
  activityVisible?: boolean;
  messageControl?: string;
}
export interface Startup {
  id: string;
  slug: string;
  name: string;
  pitch: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  category: string;
  website?: string;
  location?: string;
  foundingYear?: number;
  verified: boolean;
  followerCount: number;
  following?: boolean;
  ownerId: string;
  products?: Product[];
  posts?: Post[];
  team?: User[];
}
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  website?: string;
  imageUrl?: string;
  status: string;
  category: string;
  startup: Startup;
  actions?: Array<{ type: string; label: string; url: string }>;
  releaseNotes?: string;
}
export interface Media {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  processingStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  width?: number;
  height?: number;
  durationMs?: number;
}
export interface Post {
  id: string;
  kind: "POST" | "REEL" | "UPDATE" | "LAUNCH";
  caption: string;
  createdAt: string;
  author: User;
  startup?: Startup | null;
  product?: Product | null;
  media: Media[];
  tags: string[];
  likeCount: number;
  commentCount: number;
  saveCount: number;
  liked: boolean;
  saved: boolean;
}
export interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: User;
  parentId?: string;
  likeCount: number;
  replies?: Comment[];
}
export interface Message {
  id: string;
  conversationId: string;
  sender: User;
  body: string;
  createdAt: string;
  readBy: string[];
  sharedPost?: Pick<Post, "id" | "caption"> | null;
  replyToId?: string;
  unsent?: boolean;
}
export interface Conversation {
  id: string;
  title?: string;
  members: User[];
  lastMessage?: Message;
  unreadCount: number;
  isRequest?: boolean;
}
export interface Notification {
  id: string;
  type: string;
  body: string;
  createdAt: string;
  readAt?: string;
  actor?: User;
  postId?: string;
  startupId?: string;
}
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
export interface Explore {
  trending: Startup[];
  newProducts: Product[];
  founders: User[];
  categories: string[];
}
export interface Collection {
  id: string;
  name: string;
  itemCount?: number;
  items?: Post[];
}
export interface SocketEvent {
  type: "message" | "read" | "typing" | "notification" | "message_unsent";
  conversationId?: string;
  message?: Message;
  messageId?: string;
  userId?: string;
  typing?: boolean;
  notification?: Notification;
}
