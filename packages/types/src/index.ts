export interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string | null;
  role: "USER" | "FOUNDER" | "MODERATOR" | "ADMIN";
  onboarded: boolean;
  verified: boolean;
  interests?: string[];
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  following?: boolean;
  location?: string | null;
  website?: string | null;
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

export interface BuildDnaDTO {
  id: string;
  userId: string;
  postId?: string | null;
  startupId?: string | null;
  sourceType: string;
  projectDomains: string[];
  technicalSkills: string[];
  technologies: string[];
  projectStage: string;
  skillsOffered: string[];
  skillsNeeded: string[];
  collaborationInterest: boolean;
  currentBlockers: string[];
  interests: string[];
  projectDescription: string;
  modelVersion: string;
  createdAt: string;
}

export interface RelevantProjectDTO {
  id: string;
  title: string;
  caption: string;
  tags: string[];
  startupName?: string;
}

export interface RecommendationEvidenceDTO {
  sharedDomains?: string[];
  offeredMatchesNeeded?: Array<{ need: string; matchedBy: string }>;
  matchingSkills?: string[];
  complementarySkills?: string[];
  sourcePostId?: string;
  sourcePostCaption?: string;
  quote?: string;
}

export interface BuilderRecommendationDTO {
  id: string;
  category: "COMPLEMENTARY" | "SIMILARITY";
  score: number;
  matchingSkills: string[];
  complementarySkills: string[];
  relevantProjects: RelevantProjectDTO[];
  explanation: string;
  evidence: RecommendationEvidenceDTO;
  suggestedBuilder: User;
  createdAt: string;
}

export interface BuildRadarOverviewDTO {
  myBuildDna: BuildDnaDTO | null;
  forYou: BuilderRecommendationDTO[];
  collaborators: BuilderRecommendationDTO[];
  projectRecommendations: Array<{
    post: Post;
    relevanceScore: number;
    reason: string;
    matchingSkills: string[];
  }>;
  opportunityRadar: BuilderRecommendationDTO[];
  stats: {
    analyzedBuildersCount: number;
    collaborationOpportunitiesCount: number;
    aiModel: string;
    aiStatus: "online" | "degraded" | "heuristic_fallback";
  };
}

export interface DemoStartupUpdateDTO {
  id: string;
  startupId: string;
  title: string;
  body: string;
  updateType: string;
  date: string;
}

export interface DemoStartupDTO {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  country: string;
  countryCode: "NZ" | "US" | "MY" | string;
  currency: string;
  currencySymbol: string;
  industry: string;
  stage: string;
  businessModel: string;
  technologies: string[];
  founderName: string;
  founderBio: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  website?: string | null;
  targetMarket: string;
  demoTargetAmount: number;
  demoRaisedAmount: number;
  demoMinTicket: number;
  demoPreMoneyValuation: number;
  demoPostMoneyValuation: number;
  featured: boolean;
  published: boolean;
  createdAt: string;
  updates?: DemoStartupUpdateDTO[];
  isWatchlisted?: boolean;
  hasSimulatedPosition?: boolean;
}

export interface SimulatedPositionDTO {
  id: string;
  userId: string;
  startupId: string;
  startup: DemoStartupDTO;
  hypotheticalAmount: number;
  currency: string;
  illustrativeEquityPercent: number;
  notes: string;
  createdAt: string;
}

export interface SimulatedActivityDTO {
  id: string;
  userId: string;
  startupId: string;
  startupName: string;
  action: string;
  amount?: number | null;
  details: string;
  createdAt: string;
}

export interface SimulatedPortfolioDTO {
  totalSimulatedAllocated: number;
  positionsCount: number;
  positions: SimulatedPositionDTO[];
  distributionByIndustry: Record<string, number>;
  distributionByCountry: Record<string, number>;
  watchlist: DemoStartupDTO[];
  recentActivity: SimulatedActivityDTO[];
}

export interface MarketEvaluationDTO {
  countryCode: "NZ" | "US" | "MY";
  countryName: string;
  currency: string;
  currencySymbol: string;
  status: "Under evaluation — not an available investment market";
  marketOverview: string;
  potentialOpportunity: string;
  startupEcosystem: string;
  regulatoryResearchTopics: string[];
  licensingConsiderations: string[];
  currentResearchStatus: string;
  outstandingQuestions: string[];
  sampleStartupsCount: number;
}
