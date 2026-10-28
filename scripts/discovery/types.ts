export interface RawCandidate {
  source: "hackernews" | "github" | "website";
  sourceId: string;
  sourceUrl: string;
  title: string;
  rawText: string;
  authorUsername?: string;
  externalUrl?: string;
  stars?: number;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface ProductAction {
  type:
    | "website"
    | "try_product"
    | "demo"
    | "pricing"
    | "waitlist"
    | "download"
    | "github"
    | "documentation"
    | "careers"
    | "internship"
    | "claim";
  label: string;
  url: string;
}

export interface NormalizedCandidate {
  source: "hackernews" | "github" | "website";
  sourceId: string;
  sourceUrl: string;
  productName: string;
  companyName: string;
  canonicalUrl: string;
  pitch: string;
  description: string;
  category: string;
  tags: string[];
  founderName: string | null;
  founderSource: string | null;
  founderEmail: string | null;
  founderEmailSource: string | null;
  founderLinkedIn: string | null;
  logoUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  demoUrl?: string | null;
  repoUrl?: string | null;
  docsUrl?: string | null;
  careersUrl?: string | null;
  pricingUrl?: string | null;
  downloadUrl?: string | null;
  waitlistUrl?: string | null;
  jobVacancy?: {
    title: string;
    type: "full-time" | "internship";
    location?: string;
    applyUrl: string;
  } | null;
  rawMetadata: Record<string, unknown>;
  discoveredAt: string;
}

export interface CandidateScore {
  score: number; // 0-100
  breakdown: {
    authenticity: number; // Max 25
    clarity: number; // Max 20
    workingProduct: number; // Max 15
    completeness: number; // Max 15
    mediaQuality: number; // Max 15
    freshness: number; // Max 10
  };
  passed: boolean;
  rejectionReason: string | null;
  selectedActions: ProductAction[];
}

export interface FounderOnboardingRecord {
  uid: string; // 7-digit numeric string (e.g. 1048293)
  founderName: string;
  startup: string;
  product: string;
  username: string;
  tempPassword?: string;
  passwordHash?: string;
  inviteToken?: string;
  verifiedEmail: string | null;
  emailSourceUrl: string | null;
  emailVerifiedStatus: "UNVERIFIED" | "VERIFIED";
  linkedInUrl: string | null;
  companyWebsite: string;
  productWebsite: string;
  demoUrl: string | null;
  sourcePlatform: string;
  discoveryUrl: string;
  companyProfileId: string;
  productId: string;
  profileStatus: "UNVERIFIED" | "VERIFIED";
  accountInvitationStatus: "INVITED" | "ACTIVE" | "CLAIMED";
  ownershipVerificationStatus: "UNCLAIMED" | "CLAIMED";
  qualityScore: number;
  createdAt: string;
  publicationStatus: "PUBLISHED" | "REJECTED" | "HELD";
  notes: string;
  outreachDraft: string;
}
