--
-- PostgreSQL database dump
--

\restrict d5gIN9mMolfMzEUaOiZX0WAfmGQx0Rl9CccBsYkpUnuwDVM2RdUGpoGnUKBMtU6

-- Dumped from database version 18.3 (Homebrew)
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: MediaType; Type: TYPE; Schema: public; Owner: ayushkumarsingh
--

CREATE TYPE public."MediaType" AS ENUM (
    'IMAGE',
    'VIDEO'
);


ALTER TYPE public."MediaType" OWNER TO ayushkumarsingh;

--
-- Name: PostKind; Type: TYPE; Schema: public; Owner: ayushkumarsingh
--

CREATE TYPE public."PostKind" AS ENUM (
    'POST',
    'REEL',
    'UPDATE',
    'LAUNCH'
);


ALTER TYPE public."PostKind" OWNER TO ayushkumarsingh;

--
-- Name: ProcessingStatus; Type: TYPE; Schema: public; Owner: ayushkumarsingh
--

CREATE TYPE public."ProcessingStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'READY',
    'FAILED'
);


ALTER TYPE public."ProcessingStatus" OWNER TO ayushkumarsingh;

--
-- Name: ProductStatus; Type: TYPE; Schema: public; Owner: ayushkumarsingh
--

CREATE TYPE public."ProductStatus" AS ENUM (
    'CONCEPT',
    'PROTOTYPE',
    'BETA',
    'LAUNCHED',
    'DISCONTINUED'
);


ALTER TYPE public."ProductStatus" OWNER TO ayushkumarsingh;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: ayushkumarsingh
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'FOUNDER',
    'MODERATOR',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO ayushkumarsingh;

--
-- Name: TeamRole; Type: TYPE; Schema: public; Owner: ayushkumarsingh
--

CREATE TYPE public."TeamRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'CONTENT_MANAGER',
    'ANALYST'
);


ALTER TYPE public."TeamRole" OWNER TO ayushkumarsingh;

--
-- Name: VerificationStatus; Type: TYPE; Schema: public; Owner: ayushkumarsingh
--

CREATE TYPE public."VerificationStatus" AS ENUM (
    'UNVERIFIED',
    'APPLICATION_SUBMITTED',
    'UNDER_REVIEW',
    'VERIFIED',
    'REJECTED'
);


ALTER TYPE public."VerificationStatus" OWNER TO ayushkumarsingh;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "actorId" text,
    action text NOT NULL,
    "targetId" text NOT NULL,
    detail text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO ayushkumarsingh;

--
-- Name: AuthToken; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."AuthToken" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    purpose text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "consumedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuthToken" OWNER TO ayushkumarsingh;

--
-- Name: Block; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Block" (
    "blockerId" text NOT NULL,
    "blockedId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT no_self_block CHECK (("blockerId" <> "blockedId"))
);


ALTER TABLE public."Block" OWNER TO ayushkumarsingh;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL
);


ALTER TABLE public."Category" OWNER TO ayushkumarsingh;

--
-- Name: Collection; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Collection" (
    id text NOT NULL,
    name text NOT NULL,
    "userId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Collection" OWNER TO ayushkumarsingh;

--
-- Name: CollectionItem; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."CollectionItem" (
    "collectionId" text NOT NULL,
    "saveId" text NOT NULL
);


ALTER TABLE public."CollectionItem" OWNER TO ayushkumarsingh;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    "postId" text NOT NULL,
    "authorId" text NOT NULL,
    body text NOT NULL,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Comment" OWNER TO ayushkumarsingh;

--
-- Name: CommentLike; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."CommentLike" (
    "userId" text NOT NULL,
    "commentId" text NOT NULL
);


ALTER TABLE public."CommentLike" OWNER TO ayushkumarsingh;

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    title text,
    "directKey" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO ayushkumarsingh;

--
-- Name: ConversationMember; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."ConversationMember" (
    "conversationId" text NOT NULL,
    "userId" text NOT NULL,
    accepted boolean DEFAULT false NOT NULL,
    muted boolean DEFAULT false NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastReadAt" timestamp(3) without time zone
);


ALTER TABLE public."ConversationMember" OWNER TO ayushkumarsingh;

--
-- Name: EngagementEvent; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."EngagementEvent" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "postId" text,
    "startupId" text,
    type text NOT NULL,
    value double precision DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EngagementEvent" OWNER TO ayushkumarsingh;

--
-- Name: FeatureFlag; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."FeatureFlag" (
    key text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FeatureFlag" OWNER TO ayushkumarsingh;

--
-- Name: FeedImpression; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."FeedImpression" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "postId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FeedImpression" OWNER TO ayushkumarsingh;

--
-- Name: JobFailure; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."JobFailure" (
    id text NOT NULL,
    queue text NOT NULL,
    "jobId" text NOT NULL,
    reason text NOT NULL,
    attempts integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."JobFailure" OWNER TO ayushkumarsingh;

--
-- Name: Like; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Like" (
    "userId" text NOT NULL,
    "postId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Like" OWNER TO ayushkumarsingh;

--
-- Name: MediaAsset; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."MediaAsset" (
    id text NOT NULL,
    "ownerId" text NOT NULL,
    "mediaType" public."MediaType" NOT NULL,
    "storageKey" text NOT NULL,
    "originalUrl" text,
    "processedUrl" text,
    "thumbnailUrl" text,
    width integer,
    height integer,
    "durationMs" integer,
    "mimeType" text NOT NULL,
    "fileSizeBytes" integer NOT NULL,
    "processingStatus" public."ProcessingStatus" DEFAULT 'PENDING'::public."ProcessingStatus" NOT NULL,
    "failureReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT valid_file_size CHECK ((("fileSizeBytes" > 0) AND ("fileSizeBytes" <= 104857600)))
);


ALTER TABLE public."MediaAsset" OWNER TO ayushkumarsingh;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    body text NOT NULL,
    "sharedPostId" text,
    "replyToId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "unsentAt" timestamp(3) without time zone
);


ALTER TABLE public."Message" OWNER TO ayushkumarsingh;

--
-- Name: MessageHidden; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."MessageHidden" (
    "messageId" text NOT NULL,
    "userId" text NOT NULL
);


ALTER TABLE public."MessageHidden" OWNER TO ayushkumarsingh;

--
-- Name: MessageMedia; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."MessageMedia" (
    "messageId" text NOT NULL,
    "mediaId" text NOT NULL
);


ALTER TABLE public."MessageMedia" OWNER TO ayushkumarsingh;

--
-- Name: MessageRead; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."MessageRead" (
    "messageId" text NOT NULL,
    "userId" text NOT NULL,
    "readAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageRead" OWNER TO ayushkumarsingh;

--
-- Name: ModerationAction; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."ModerationAction" (
    id text NOT NULL,
    "reportId" text NOT NULL,
    "moderatorId" text NOT NULL,
    action text NOT NULL,
    note text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ModerationAction" OWNER TO ayushkumarsingh;

--
-- Name: Mute; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Mute" (
    "muterId" text NOT NULL,
    "mutedId" text NOT NULL
);


ALTER TABLE public."Mute" OWNER TO ayushkumarsingh;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "actorId" text,
    type text NOT NULL,
    body text NOT NULL,
    "postId" text,
    "startupId" text,
    "groupKey" text,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO ayushkumarsingh;

--
-- Name: NotificationPreference; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."NotificationPreference" (
    "userId" text NOT NULL,
    "inApp" boolean DEFAULT true NOT NULL,
    push boolean DEFAULT false NOT NULL,
    email boolean DEFAULT false NOT NULL
);


ALTER TABLE public."NotificationPreference" OWNER TO ayushkumarsingh;

--
-- Name: Post; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Post" (
    id text NOT NULL,
    "authorId" text NOT NULL,
    "startupId" text,
    "productId" text,
    kind public."PostKind" DEFAULT 'POST'::public."PostKind" NOT NULL,
    caption text NOT NULL,
    tags text[],
    draft boolean DEFAULT false NOT NULL,
    "removedAt" timestamp(3) without time zone,
    "likeCount" integer DEFAULT 0 NOT NULL,
    "commentCount" integer DEFAULT 0 NOT NULL,
    "saveCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    CONSTRAINT nonnegative_counters CHECK ((("likeCount" >= 0) AND ("saveCount" >= 0) AND ("commentCount" >= 0)))
);


ALTER TABLE public."Post" OWNER TO ayushkumarsingh;

--
-- Name: PostMedia; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."PostMedia" (
    "postId" text NOT NULL,
    "mediaId" text NOT NULL,
    "position" integer NOT NULL
);


ALTER TABLE public."PostMedia" OWNER TO ayushkumarsingh;

--
-- Name: Product; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    website text,
    "imageUrl" text,
    status public."ProductStatus" DEFAULT 'PROTOTYPE'::public."ProductStatus" NOT NULL,
    "releaseNotes" text DEFAULT ''::text NOT NULL,
    "launchDate" timestamp(3) without time zone,
    "startupId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO ayushkumarsingh;

--
-- Name: ProductFollow; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."ProductFollow" (
    "userId" text NOT NULL,
    "productId" text NOT NULL
);


ALTER TABLE public."ProductFollow" OWNER TO ayushkumarsingh;

--
-- Name: RankingConfig; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."RankingConfig" (
    key text DEFAULT 'default'::text NOT NULL,
    weights jsonb NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."RankingConfig" OWNER TO ayushkumarsingh;

--
-- Name: Report; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    "reporterId" text NOT NULL,
    "userId" text,
    "postId" text,
    reason text NOT NULL,
    details text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'OPEN'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Report" OWNER TO ayushkumarsingh;

--
-- Name: Save; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Save" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "postId" text,
    "startupId" text,
    "productId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT save_exactly_one_target CHECK ((num_nonnulls("postId", "startupId", "productId") = 1))
);


ALTER TABLE public."Save" OWNER TO ayushkumarsingh;

--
-- Name: SearchHistory; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."SearchHistory" (
    id text NOT NULL,
    "userId" text NOT NULL,
    query text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SearchHistory" OWNER TO ayushkumarsingh;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "tokenHash" text NOT NULL,
    "refreshHash" text NOT NULL,
    "previousRefreshHash" text,
    "userAgent" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "lastUsedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Session" OWNER TO ayushkumarsingh;

--
-- Name: Startup; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."Startup" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    pitch text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    website text,
    "logoUrl" text,
    "coverUrl" text,
    location text,
    "foundingYear" integer,
    problem text DEFAULT ''::text NOT NULL,
    solution text DEFAULT ''::text NOT NULL,
    "verificationStatus" public."VerificationStatus" DEFAULT 'UNVERIFIED'::public."VerificationStatus" NOT NULL,
    "ownerId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Startup" OWNER TO ayushkumarsingh;

--
-- Name: StartupFollow; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."StartupFollow" (
    "userId" text NOT NULL,
    "startupId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StartupFollow" OWNER TO ayushkumarsingh;

--
-- Name: StartupMember; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."StartupMember" (
    "startupId" text NOT NULL,
    "userId" text NOT NULL,
    role public."TeamRole" NOT NULL
);


ALTER TABLE public."StartupMember" OWNER TO ayushkumarsingh;

--
-- Name: User; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    "displayName" text NOT NULL,
    "passwordHash" text,
    "googleId" text,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    bio text DEFAULT ''::text NOT NULL,
    "avatarUrl" text,
    location text,
    website text,
    "emailVerifiedAt" timestamp(3) without time zone,
    onboarded boolean DEFAULT false NOT NULL,
    "privateAccount" boolean DEFAULT false NOT NULL,
    "activityVisible" boolean DEFAULT true NOT NULL,
    "messageControl" text DEFAULT 'EVERYONE'::text NOT NULL,
    suspended boolean DEFAULT false NOT NULL,
    "deactivatedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO ayushkumarsingh;

--
-- Name: UserFollow; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."UserFollow" (
    "followerId" text NOT NULL,
    "followingId" text NOT NULL,
    accepted boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT no_self_follow CHECK (("followerId" <> "followingId"))
);


ALTER TABLE public."UserFollow" OWNER TO ayushkumarsingh;

--
-- Name: UserInterest; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."UserInterest" (
    "userId" text NOT NULL,
    "categoryId" text NOT NULL,
    affinity double precision DEFAULT 1 NOT NULL
);


ALTER TABLE public."UserInterest" OWNER TO ayushkumarsingh;

--
-- Name: VerificationApplication; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public."VerificationApplication" (
    id text NOT NULL,
    "startupId" text NOT NULL,
    evidence text NOT NULL,
    status public."VerificationStatus" DEFAULT 'APPLICATION_SUBMITTED'::public."VerificationStatus" NOT NULL,
    note text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reviewedAt" timestamp(3) without time zone
);


ALTER TABLE public."VerificationApplication" OWNER TO ayushkumarsingh;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: ayushkumarsingh
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO ayushkumarsingh;

--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."AuditLog" (id, "actorId", action, "targetId", detail, "createdAt") FROM stdin;
\.


--
-- Data for Name: AuthToken; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."AuthToken" (id, "userId", "tokenHash", purpose, "expiresAt", "consumedAt", "createdAt") FROM stdin;
cmuf8zfne0002ut981mdfnqim	cmuf8zfn40000ut98083f1bzt	577dfd162b76affe7917f6d100fbe34a239a82aed7b1cfc7a15c9a7804d4cbf7	email_verification	2026-09-25 08:06:03.001	\N	2026-09-24 08:06:03.002
cmuf919j10008ut98wtohrv4p	cmuf8zfn40000ut98083f1bzt	0a7fae0c8bf87eeb36d5bab1fc2872753975f2ede98fc7f21a47e30f2cb06c74	password_reset	2026-09-24 09:07:28.381	\N	2026-09-24 08:07:28.382
cmufa3m6j000gutxbt80wvzoz	cmufa3m6g000eutxbklb8fmke	78bbce0e7f9cc95e97fe0c509a5a4290aa9e921f2a00d783ee168e90973de87b	email_verification	2026-09-25 08:37:17.707	\N	2026-09-24 08:37:17.707
cmufa3m83000lutxb0y1rsbr9	cmufa3m80000jutxbo0gbvb2e	471219558e1612b90273b1346a1c47dabfc84374ba57a537f6df18034f6775d8	email_verification	2026-09-25 08:37:17.762	\N	2026-09-24 08:37:17.763
cmufa3mfh000vutxb93wny0w1	cmufa3mff000tutxbcstszkyk	eb0cef9c1c99c123763175c7e3400874dd9415771f6eb5062cc0d1b8cc9609a3	email_verification	2026-09-25 08:37:18.029	\N	2026-09-24 08:37:18.029
cmufa3mos0012utxbv8urpscz	cmufa3moq0010utxbxiu1boa6	a530c796a0169650e1174d97d39072b99cc948ec92b17cf51f5f35060000ad45	email_verification	2026-09-25 08:37:18.364	\N	2026-09-24 08:37:18.365
cmufa6kad000eutjbv0rwe9jn	cmufa6ka9000cutjbpjyruycg	1cf2fb3fb72b0f59c1b7c5c62b1b09a477e318f855c7f90d5d59d185dcc61630	email_verification	2026-09-25 08:39:35.22	\N	2026-09-24 08:39:35.221
cmufa6kbr000jutjbyjz8dnrj	cmufa6kbm000hutjbrv6fprey	53a705870836364420a6a87a2638977c69b0fe53548f75126a1f283ff6ac3747	email_verification	2026-09-25 08:39:35.271	\N	2026-09-24 08:39:35.271
cmufa6kjv000tutjb2rmtl0ht	cmufa6kjs000rutjb2b60ohxh	dee759c75730000eacb987e1f9a135a37992f61ec53ae0f9d9657019b14ef99e	email_verification	2026-09-25 08:39:35.562	\N	2026-09-24 08:39:35.563
cmufa6kuj0010utjb7oq5zdaw	cmufa6kui000yutjb7bgvio5f	f890d8305be23095f65e1cbc4d74336740d5bbfe8e7e2b91de3a5b5753a92b91	email_verification	2026-09-25 08:39:35.947	\N	2026-09-24 08:39:35.947
cmufa6kvy0015utjbcncppfc7	cmufa6kvu0013utjbmxbvw5xd	65b31b89c2ea4a843ad39c87a689d68da8a6e9b116b216bf45ae57c99598ab51	email_verification	2026-09-25 08:39:35.998	\N	2026-09-24 08:39:35.998
cmufa7isa000eutva87mvj5wx	cmufa7is8000cutvapayxs0zx	db2e29fc24854f191d6da005c7b3b13e85917296aa3178b5638096c9bbf920c4	email_verification	2026-09-25 08:40:19.93	\N	2026-09-24 08:40:19.93
cmufa7itm000jutvar5l3y38h	cmufa7itl000hutvah8olel07	0d86e9d0ef0e85c604013856621e79150e705ca89b8867c1a0cdc24e8815be9e	email_verification	2026-09-25 08:40:19.978	\N	2026-09-24 08:40:19.979
cmufa7j3k000sutvagewy0kox	cmufa7j3h000qutvatvfj5zm7	b3c22bdd7a0d94f367ae4f3c0eeb256e5484b48ced9b97256f1319eeb78b02f5	email_verification	2026-09-25 08:40:20.335	\N	2026-09-24 08:40:20.336
cmufa7jci000zutvaddvb6gdl	cmufa7jch000xutva9zo2jbsc	d5a2546644a711d37f05ae84b06a3e6e79edb9f3c0aef372e19033cb22c33959	email_verification	2026-09-25 08:40:20.658	\N	2026-09-24 08:40:20.659
cmufa7jdt0014utvauf8460n7	cmufa7jdr0012utvae0pqohc2	86c5a87837adacd08cf7e3d26d1e9a239ba9e8eea0dee0715cbf4e4ca81e56d3	email_verification	2026-09-25 08:40:20.705	\N	2026-09-24 08:40:20.706
cmufa8jp30002ut3vzr1i7x6t	cmufa8joz0000ut3vzf95i06s	1b178a04437663233c45920deadb0ff2cbe0ce01eb29be48819a3837b0d73bfa	email_verification	2026-09-25 08:41:07.766	\N	2026-09-24 08:41:07.767
cmufa8jr40007ut3vuvzt6pqt	cmufa8jr20005ut3vptpczxec	17b751cb9f3f359ceb4c57556411cd2ac40df6de39bf810013ecb4d51aef2844	email_verification	2026-09-25 08:41:07.839	\N	2026-09-24 08:41:07.84
cmufa8kb6000sut3v3zf25an7	cmufa8kb4000qut3vr9viyake	7b2ddb2884e30e4b3a1655c11bd33287ed6407ef67d8a1b45d2168cb152867df	email_verification	2026-09-25 08:41:08.561	\N	2026-09-24 08:41:08.562
cmufa8kn1000zut3vub2uvcol	cmufa8kn0000xut3v8luj9bd7	4c3bca5d28ecef04cabfd9b200217aa20288199ce5254b6d3deee4230a064c1c	email_verification	2026-09-25 08:41:08.989	\N	2026-09-24 08:41:08.99
cmufa8kou0014ut3v8hsdlj08	cmufa8kor0012ut3vz4568jdf	5b1b532e9967e3951843c35d6e035ffdc7943d94762d8aee6bd3ccc1aeccbbef	email_verification	2026-09-25 08:41:09.053	\N	2026-09-24 08:41:09.054
cmufa94eq001eut3vagbamww5	cmufa94eh001cut3vim5o0anj	c67e7065e3602eb4891e038abd3c55220e5d2705f26f806c101e42bd0eb82dbe	email_verification	2026-09-25 08:41:34.61	\N	2026-09-24 08:41:34.611
cmufa94ge001jut3vdpximcam	cmufa94gc001hut3v60magkah	3a384cef6ed04461137622b8b4ca798beff98a115a796fc1aab41e05c5fd5476	email_verification	2026-09-25 08:41:34.67	\N	2026-09-24 08:41:34.671
cmufa94ph001sut3vfjnrro2c	cmufa94pd001qut3vdj8g1md4	279ca26521310c0b167dd103e173fa58040c5d485c9e89cd0d67b1ad4d3b6dcb	email_verification	2026-09-25 08:41:34.997	\N	2026-09-24 08:41:34.998
cmufa94r0001xut3vsu2v6ibo	cmufa94qy001vut3vmjhf4879	00a42d5aaaee1feac1383e87bed94ec09486a6feba0630dfdd33bffa6342c183	email_verification	2026-09-25 08:41:35.051	\N	2026-09-24 08:41:35.052
cmufa956r002jut3v5yx66xk5	cmufa956q002hut3vpjxtflap	0a4b7e1fff3f098f541394639efac495e31ec0d4879a9e35c6b4370dd5555188	email_verification	2026-09-25 08:41:35.619	\N	2026-09-24 08:41:35.62
cmufavus60006utx5cr8xp6ab	cmufavurl0004utx51goqpzxf	1d98e39246a383171bb9102d1778017d815cbb32b721971bb748b058c0c5bb6c	email_verification	2026-09-25 08:59:15.221	\N	2026-09-24 08:59:15.222
cmufavuw3000butx5s4lnbp9s	cmufavuw00009utx5bt46xprm	6447831b638f383564504edbcae7e39a193abed61460ae2ad541462c8defce6a	email_verification	2026-09-25 08:59:15.363	\N	2026-09-24 08:59:15.363
cmufavvj9000kutx57hf6cnzc	cmufavvj3000iutx5b3mjnwps	bf3499076c7a805b92be167c1844d46ad45f73c2d7af7f9fad87503e5652d930	email_verification	2026-09-25 08:59:16.196	\N	2026-09-24 08:59:16.197
cmufavvmj000putx5rese17s6	cmufavvmf000nutx5x7yz57wo	d26209cc3e853c6f43091796189cccfa9ab105f487fc4a7441e642df8264faa9	email_verification	2026-09-25 08:59:16.314	\N	2026-09-24 08:59:16.316
cmufavwso001butx5wl11jmuh	cmufavwsm0019utx5ooic2abw	da29cfb49389fda1964ce75be61132866b010390a47d1ba64498c03d38b6d515	email_verification	2026-09-25 08:59:17.831	\N	2026-09-24 08:59:17.832
cmufbflod0002utr61zg6rciz	cmufbflo10000utr6214dt0t9	d915a0b7257f0bed2f2e7ff0e5257ea7f92b7128eb9b539f8144d29104026ba6	email_verification	2026-09-25 09:14:36.54	\N	2026-09-24 09:14:36.542
cmufbflqa0007utr6bmz0tzwq	cmufbflq90005utr6tkyrind4	c04f70b8a58e9a6622468961d5c8cf06d90484906a73d2728d55b5642eb2234a	email_verification	2026-09-25 09:14:36.61	\N	2026-09-24 09:14:36.611
cmufbflyo000gutr6bh77qwq2	cmufbflyl000eutr6ryb7m033	1e43221b9468572f8b18f391717a4da5cd0bc723aaf356799eeac531a0288dc9	email_verification	2026-09-25 09:14:36.912	\N	2026-09-24 09:14:36.912
cmufbflzy000lutr6o7cz8ff1	cmufbflzv000jutr6w9j89r9e	7d9d0d88b0371fedfb86e58120867b3de0ba8679f1947fedeebb87c52c40984d	email_verification	2026-09-25 09:14:36.958	\N	2026-09-24 09:14:36.959
cmufbfmf00017utr68gyyb8l8	cmufbfmey0015utr6sk0c2lo9	488e8b7eacc12abb237cd8a14cf16a0053176cdaec490630094a3f4028d5d144	email_verification	2026-09-25 09:14:37.499	\N	2026-09-24 09:14:37.5
cmuffdk46001qutr6m2ac1jlo	cmuffdk3s001outr66qzpwwyx	00597cdcce025d2685c69ce8fb47464f2405303370f7a60e2976dfc13510709a	email_verification	2026-09-25 11:04:59.669	\N	2026-09-24 11:04:59.67
cmuffdk73001vutr6wfb5llgk	cmuffdk72001tutr6tki6l5gt	da0c542066eb52dea7fc7545223dffbc1c32b459673f022c3f87b51b0ad8197b	email_verification	2026-09-25 11:04:59.775	\N	2026-09-24 11:04:59.776
cmuffdkj70024utr6tnborvcz	cmuffdkj40022utr6sj3iqi2f	c84987a286d382523d6aa5c02f8e7d294a4b0d96a41310bef18bf5be81d2675f	email_verification	2026-09-25 11:05:00.211	\N	2026-09-24 11:05:00.212
cmuffdklb0029utr6ef9mrxbk	cmuffdkl70027utr6zhspnezt	18a0a86c37a4770d20d16a4b3f17fe1e4e3a107c7ce6f1e8255492b8f870c619	email_verification	2026-09-25 11:05:00.286	\N	2026-09-24 11:05:00.287
cmuffdkw3002jutr6etvksk4m	cmuffdkw2002hutr688wxtl56	7458b4b46a6faf4a7071b478244690ce9748b19bed13427973cd5c01b4e01bba	email_verification	2026-09-25 11:05:00.675	\N	2026-09-24 11:05:00.676
\.


--
-- Data for Name: Block; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Block" ("blockerId", "blockedId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Category" (id, name, slug) FROM stdin;
cmueqm5490000ut75filoydd7	AI	ai
cmueqm54i0001ut75c5c80zkj	Robotics	robotics
cmueqm54j0002ut75gs1nf7t4	Consumer Apps	consumer-apps
cmueqm54m0004ut75bi887tko	Healthtech	healthtech
cmueqm54n0005ut75qo7hnbfb	SaaS	saas
cmueqm54o0006ut75629casux	Climate	climate
cmueqm54q0007ut75bk39ipep	Mobility	mobility
cmueqm54r0008ut75dho8m2mu	Space	space
cmueqm54s0009ut756vrvkek8	Gaming	gaming
cmueqm54t000aut75rgl1jn6m	Cybersecurity	cybersecurity
cmueqm54v000cut75mhdaozdo	Hardware	hardware
cmueqm54w000dut756ly2znr2	Biotech	biotech
cmueqm54x000eut7590grcg6o	Ecommerce	ecommerce
cmueqm54y000fut75lqedis3i	Education	education
cmueqm54z000gut75flphmncn	Creator Economy	creator-economy
cmueqm550000hut75se5a1sbu	Design	design
cmufaroyd0000utuo3jxob7v6	AI & Machine Learning	ai-machine-learning
cmueqm54u000but756hqltjux	Developer Tools	developer-tools
cmueqm54l0003ut75xcpqvdl7	Fintech	fintech
cmufaroyl0003utuoowzriypf	Design & Creative	design-creative
cmufaroyn0004utuours78gk2	B2B SaaS	b2b-saas
cmufaroyo0005utuom2bgc0ua	Consumer Social	consumer-social
cmufaroyp0006utuod118o3es	Health & Biotech	health-biotech
cmufaroz40007utuop10fcbca	Hardware & IoT	hardware-iot
cmufaroz60008utuo9axw49z3	Security & Privacy	security-privacy
cmufaroz70009utuo1ux1rent	Climate & CleanTech	climate-cleantech
\.


--
-- Data for Name: Collection; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Collection" (id, name, "userId", "createdAt") FROM stdin;
cmueqm5wv001xut75e7ux9z90	Products to try	seed-user-0	2026-09-23 23:31:50.767
\.


--
-- Data for Name: CollectionItem; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."CollectionItem" ("collectionId", "saveId") FROM stdin;
cmueqm5wv001xut75e7ux9z90	cmueqm5bt000iut75fk7sjey8
cmueqm5wv001xut75e7ux9z90	cmueqm5ca000jut75w18rciz3
cmueqm5wv001xut75e7ux9z90	cmueqm5cq000kut75jhd729q2
cmueqm5wv001xut75e7ux9z90	cmueqm5d9000lut75oszmryqs
cmueqm5wv001xut75e7ux9z90	cmueqm5ds000mut75kg8k2yu1
cmueqm5wv001xut75e7ux9z90	cmueqm5e8000nut75agrhdi11
cmueqm5wv001xut75e7ux9z90	cmueqm5er000out75w62sdzrb
cmueqm5wv001xut75e7ux9z90	cmueqm5ez000put75feboqrrg
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Comment" (id, "postId", "authorId", body, "parentId", "createdAt", "updatedAt") FROM stdin;
seed-comment-0	seed-post-000	seed-user-12	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.012	2026-09-23 23:31:50.012
seed-comment-2	seed-post-002	seed-user-14	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.022	2026-09-23 23:31:50.022
seed-comment-4	seed-post-004	seed-user-16	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.032	2026-09-23 23:31:50.032
seed-comment-6	seed-post-006	seed-user-18	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.043	2026-09-23 23:31:50.043
seed-comment-8	seed-post-008	seed-user-20	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.055	2026-09-23 23:31:50.055
seed-comment-10	seed-post-010	seed-user-22	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.068	2026-09-23 23:31:50.068
seed-comment-12	seed-post-012	seed-user-24	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.081	2026-09-23 23:31:50.081
seed-comment-14	seed-post-014	seed-user-26	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.09	2026-09-23 23:31:50.09
seed-comment-16	seed-post-016	seed-user-28	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.103	2026-09-23 23:31:50.103
seed-comment-18	seed-post-018	seed-user-0	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.116	2026-09-23 23:31:50.116
seed-comment-20	seed-post-020	seed-user-2	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.121	2026-09-23 23:31:50.121
seed-comment-22	seed-post-022	seed-user-4	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.127	2026-09-23 23:31:50.127
seed-comment-24	seed-post-024	seed-user-6	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.133	2026-09-23 23:31:50.133
seed-comment-26	seed-post-026	seed-user-8	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.14	2026-09-23 23:31:50.14
seed-comment-28	seed-post-028	seed-user-10	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.149	2026-09-23 23:31:50.149
seed-comment-30	seed-post-030	seed-user-12	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.157	2026-09-23 23:31:50.157
seed-comment-32	seed-post-032	seed-user-14	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.167	2026-09-23 23:31:50.167
seed-comment-34	seed-post-034	seed-user-16	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.178	2026-09-23 23:31:50.178
seed-comment-36	seed-post-036	seed-user-18	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.191	2026-09-23 23:31:50.191
seed-comment-38	seed-post-038	seed-user-20	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.201	2026-09-23 23:31:50.201
seed-comment-40	seed-post-040	seed-user-22	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.207	2026-09-23 23:31:50.207
seed-comment-42	seed-post-042	seed-user-24	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.213	2026-09-23 23:31:50.213
seed-comment-44	seed-post-044	seed-user-26	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.22	2026-09-23 23:31:50.22
seed-comment-46	seed-post-046	seed-user-28	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.228	2026-09-23 23:31:50.228
seed-comment-48	seed-post-048	seed-user-0	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.237	2026-09-23 23:31:50.237
seed-comment-50	seed-post-050	seed-user-2	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.246	2026-09-23 23:31:50.246
seed-comment-52	seed-post-052	seed-user-4	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.256	2026-09-23 23:31:50.256
seed-comment-54	seed-post-054	seed-user-6	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.267	2026-09-23 23:31:50.267
seed-comment-56	seed-post-056	seed-user-8	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.278	2026-09-23 23:31:50.278
seed-comment-58	seed-post-058	seed-user-10	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.282	2026-09-23 23:31:50.282
seed-comment-60	seed-post-060	seed-user-12	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.287	2026-09-23 23:31:50.287
seed-comment-62	seed-post-062	seed-user-14	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.292	2026-09-23 23:31:50.292
seed-comment-64	seed-post-064	seed-user-16	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.299	2026-09-23 23:31:50.299
seed-comment-66	seed-post-066	seed-user-18	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.307	2026-09-23 23:31:50.307
seed-comment-68	seed-post-068	seed-user-20	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.316	2026-09-23 23:31:50.316
seed-comment-70	seed-post-070	seed-user-22	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.327	2026-09-23 23:31:50.327
seed-comment-72	seed-post-072	seed-user-24	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.336	2026-09-23 23:31:50.336
seed-comment-74	seed-post-074	seed-user-26	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.348	2026-09-23 23:31:50.348
seed-comment-76	seed-post-076	seed-user-28	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.356	2026-09-23 23:31:50.356
seed-comment-78	seed-post-078	seed-user-0	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.361	2026-09-23 23:31:50.361
seed-comment-80	seed-post-080	seed-user-2	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.368	2026-09-23 23:31:50.368
seed-comment-82	seed-post-082	seed-user-4	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.375	2026-09-23 23:31:50.375
seed-comment-84	seed-post-084	seed-user-6	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.385	2026-09-23 23:31:50.385
seed-comment-86	seed-post-086	seed-user-8	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.394	2026-09-23 23:31:50.394
seed-comment-88	seed-post-088	seed-user-10	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.404	2026-09-23 23:31:50.404
seed-comment-90	seed-post-090	seed-user-12	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.415	2026-09-23 23:31:50.415
seed-comment-92	seed-post-092	seed-user-14	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.428	2026-09-23 23:31:50.428
seed-comment-94	seed-post-094	seed-user-16	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.442	2026-09-23 23:31:50.442
seed-comment-96	seed-post-096	seed-user-18	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.448	2026-09-23 23:31:50.448
seed-comment-98	seed-post-098	seed-user-20	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.454	2026-09-23 23:31:50.454
seed-comment-100	seed-post-100	seed-user-22	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.462	2026-09-23 23:31:50.462
seed-comment-102	seed-post-102	seed-user-24	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.47	2026-09-23 23:31:50.47
seed-comment-104	seed-post-104	seed-user-26	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.479	2026-09-23 23:31:50.479
seed-comment-106	seed-post-106	seed-user-28	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.49	2026-09-23 23:31:50.49
seed-comment-108	seed-post-108	seed-user-0	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.502	2026-09-23 23:31:50.502
seed-comment-110	seed-post-110	seed-user-2	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.514	2026-09-23 23:31:50.514
seed-comment-112	seed-post-112	seed-user-4	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.527	2026-09-23 23:31:50.527
seed-comment-114	seed-post-114	seed-user-6	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.536	2026-09-23 23:31:50.536
seed-comment-116	seed-post-116	seed-user-8	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.542	2026-09-23 23:31:50.542
seed-comment-118	seed-post-118	seed-user-10	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.549	2026-09-23 23:31:50.549
seed-comment-120	seed-post-120	seed-user-12	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.557	2026-09-23 23:31:50.557
seed-comment-122	seed-post-122	seed-user-14	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.566	2026-09-23 23:31:50.566
seed-comment-124	seed-post-124	seed-user-16	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.576	2026-09-23 23:31:50.576
seed-comment-126	seed-post-126	seed-user-18	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.587	2026-09-23 23:31:50.587
seed-comment-128	seed-post-128	seed-user-20	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.599	2026-09-23 23:31:50.599
seed-comment-130	seed-post-130	seed-user-22	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.611	2026-09-23 23:31:50.611
seed-comment-132	seed-post-132	seed-user-24	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.625	2026-09-23 23:31:50.625
seed-comment-134	seed-post-134	seed-user-26	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.631	2026-09-23 23:31:50.631
seed-comment-136	seed-post-136	seed-user-28	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.637	2026-09-23 23:31:50.637
seed-comment-138	seed-post-138	seed-user-0	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.644	2026-09-23 23:31:50.644
seed-comment-140	seed-post-140	seed-user-2	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.652	2026-09-23 23:31:50.652
seed-comment-142	seed-post-142	seed-user-4	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.661	2026-09-23 23:31:50.661
seed-comment-144	seed-post-144	seed-user-6	Love the thinking behind this. How did you approach the first version?	\N	2026-09-23 23:31:50.671	2026-09-23 23:31:50.671
seed-comment-146	seed-post-146	seed-user-8	Really thoughtful work. Would love to hear more about your next steps.	\N	2026-09-23 23:31:50.681	2026-09-23 23:31:50.681
seed-comment-148	seed-post-148	seed-user-10	The simpler onboarding makes a lot of sense. Following along!	\N	2026-09-23 23:31:50.694	2026-09-23 23:31:50.694
cmufa3lyo000butxbxn7wry1m	cmufa3lwt0009utxbfqtmuoqu	seed-user-0	Incredible product, congratulations on the launch!	\N	2026-09-24 08:37:17.424	2026-09-24 08:37:17.424
cmufa6k3v0009utjbtyqrpmvt	cmufa6k2n0007utjbz01znhey	seed-user-0	Incredible product, congratulations on the launch!	\N	2026-09-24 08:39:34.988	2026-09-24 08:39:34.988
cmufa7ikj0009utvajn3345ej	cmufa7ijc0007utvacxh1fihi	seed-user-0	Incredible product, congratulations on the launch!	\N	2026-09-24 08:40:19.651	2026-09-24 08:40:19.651
cmufa8k42000nut3vquh5jhwy	cmufa8k2z000lut3v9iehdweb	seed-user-0	Incredible product, congratulations on the launch!	\N	2026-09-24 08:41:08.307	2026-09-24 08:41:08.307
cmufa9502002eut3vfcbr9mau	cmufa94z3002cut3v8koed6rd	seed-user-0	Incredible product, congratulations on the launch!	\N	2026-09-24 08:41:35.378	2026-09-24 08:41:35.378
cmufavwc10016utx5e0pfen2r	cmufavwa80014utx5kugpo8zs	seed-user-0	Incredible product, congratulations on the launch!	\N	2026-09-24 08:59:17.234	2026-09-24 08:59:17.234
cmufbfm950012utr6dxt8jf2o	cmufbfm8g0010utr680q1938y	seed-user-0	Incredible product, congratulations on the launch!	\N	2026-09-24 09:14:37.289	2026-09-24 09:14:37.289
cmuffdlch002xutr6n4x7vdy7	cmuffdlbi002vutr63iogugfk	seed-user-0	Incredible product, congratulations on the launch!	\N	2026-09-24 11:05:01.266	2026-09-24 11:05:01.266
\.


--
-- Data for Name: CommentLike; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."CommentLike" ("userId", "commentId") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Conversation" (id, title, "directKey", "createdAt", "updatedAt") FROM stdin;
seed-conversation-1	\N	seed-user-0:seed-user-1	2026-09-23 23:31:50.77	2026-09-23 23:31:50.77
seed-conversation-2	\N	seed-user-0:seed-user-2	2026-09-23 23:31:50.773	2026-09-23 23:31:50.773
cmufa3m8h000outxbl775nime	\N	\N	2026-09-24 08:37:17.777	2026-09-24 08:37:17.817
cmufa6kc2000mutjbjkwx3pm0	\N	\N	2026-09-24 08:39:35.283	2026-09-24 08:39:35.321
cmufa7je70017utvayewyx5yl	\N	\N	2026-09-24 08:40:20.72	2026-09-24 08:40:20.75
cmufa8kp80017ut3vijw65z6q	\N	\N	2026-09-24 08:41:09.069	2026-09-24 08:41:09.105
cmufa94rb0020ut3veh3b2erx	\N	\N	2026-09-24 08:41:35.064	2026-09-24 08:41:35.09
cmufavvnk000sutx5qvwwtyvb	\N	\N	2026-09-24 08:59:16.352	2026-09-24 08:59:16.429
cmufbfm0c000outr6vpx79b3l	\N	\N	2026-09-24 09:14:36.972	2026-09-24 09:14:36.999
seed-conversation-3	\N	seed-user-0:seed-user-3	2026-09-23 23:31:50.774	2026-09-24 09:21:32.586
cmuffdklu002cutr61l0lj91r	\N	\N	2026-09-24 11:05:00.306	2026-09-24 11:05:00.352
\.


--
-- Data for Name: ConversationMember; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."ConversationMember" ("conversationId", "userId", accepted, muted, "joinedAt", "lastReadAt") FROM stdin;
seed-conversation-1	seed-user-0	t	f	2026-09-23 23:31:50.77	\N
seed-conversation-1	seed-user-1	t	f	2026-09-23 23:31:50.77	\N
seed-conversation-2	seed-user-0	t	f	2026-09-23 23:31:50.773	\N
seed-conversation-2	seed-user-2	t	f	2026-09-23 23:31:50.773	\N
seed-conversation-3	seed-user-3	t	f	2026-09-23 23:31:50.774	\N
cmufa3m8h000outxbl775nime	cmufa3m6g000eutxbklb8fmke	t	f	2026-09-24 08:37:17.777	\N
cmufa3m8h000outxbl775nime	cmufa3m80000jutxbo0gbvb2e	f	f	2026-09-24 08:37:17.777	2026-09-24 08:37:17.803
cmufa6kc2000mutjbjkwx3pm0	cmufa6ka9000cutjbpjyruycg	t	f	2026-09-24 08:39:35.283	\N
cmufa6kc2000mutjbjkwx3pm0	cmufa6kbm000hutjbrv6fprey	f	f	2026-09-24 08:39:35.283	2026-09-24 08:39:35.309
cmufa7je70017utvayewyx5yl	cmufa7jch000xutva9zo2jbsc	t	f	2026-09-24 08:40:20.72	\N
cmufa7je70017utvayewyx5yl	cmufa7jdr0012utvae0pqohc2	f	f	2026-09-24 08:40:20.72	2026-09-24 08:40:20.74
cmufa8kp80017ut3vijw65z6q	cmufa8kn0000xut3v8luj9bd7	t	f	2026-09-24 08:41:09.069	\N
cmufa8kp80017ut3vijw65z6q	cmufa8kor0012ut3vz4568jdf	f	f	2026-09-24 08:41:09.069	2026-09-24 08:41:09.096
cmufa94rb0020ut3veh3b2erx	cmufa94pd001qut3vdj8g1md4	t	f	2026-09-24 08:41:35.064	\N
cmufa94rb0020ut3veh3b2erx	cmufa94qy001vut3vmjhf4879	f	f	2026-09-24 08:41:35.064	2026-09-24 08:41:35.082
cmufavvnk000sutx5qvwwtyvb	cmufavvj3000iutx5b3mjnwps	t	f	2026-09-24 08:59:16.352	\N
cmufavvnk000sutx5qvwwtyvb	cmufavvmf000nutx5x7yz57wo	f	f	2026-09-24 08:59:16.352	2026-09-24 08:59:16.406
cmufbfm0c000outr6vpx79b3l	cmufbflyl000eutr6ryb7m033	t	f	2026-09-24 09:14:36.972	\N
cmufbfm0c000outr6vpx79b3l	cmufbflzv000jutr6w9j89r9e	f	f	2026-09-24 09:14:36.972	2026-09-24 09:14:36.992
seed-conversation-3	seed-user-0	t	f	2026-09-23 23:31:50.774	2026-09-24 09:21:22.146
cmuffdklu002cutr61l0lj91r	cmuffdkj40022utr6sj3iqi2f	t	f	2026-09-24 11:05:00.306	\N
cmuffdklu002cutr61l0lj91r	cmuffdkl70027utr6zhspnezt	f	f	2026-09-24 11:05:00.306	2026-09-24 11:05:00.337
\.


--
-- Data for Name: EngagementEvent; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."EngagementEvent" (id, "userId", "postId", "startupId", type, value, "createdAt") FROM stdin;
job-23-event-0	seed-user-0	seed-post-107	\N	FEED_IMPRESSION	1	2026-09-24 06:47:34.817
job-22-event-0	seed-user-0	seed-post-107	\N	VIDEO_START	1	2026-09-24 06:47:34.819
job-24-event-0	seed-user-0	seed-post-107	\N	FEED_IMPRESSION	1	2026-09-24 06:47:34.827
job-25-event-0	seed-user-0	seed-post-107	\N	VIDEO_25	1576.021	2026-09-24 06:47:36.405
job-26-event-0	seed-user-0	seed-post-107	\N	VIDEO_50	3170.244	2026-09-24 06:47:38.008
job-27-event-0	seed-user-0	seed-post-107	\N	VIDEO_75	4762.432000000001	2026-09-24 06:47:39.601
job-28-event-0	seed-user-0	seed-post-107	\N	VIDEO_COMPLETE	5826.336	2026-09-24 06:47:40.655
job-29-event-0	seed-user-0	seed-post-107	\N	VIDEO_REPLAY	1	2026-09-24 06:47:40.842
job-30-event-0	seed-user-0	seed-post-107	\N	VIDEO_25	1582.758	2026-09-24 06:47:42.428
job-31-event-0	seed-user-0	seed-post-107	\N	VIDEO_50	3177.238	2026-09-24 06:47:44.022
job-32-event-0	seed-user-0	seed-post-107	\N	VIDEO_75	4504.63	2026-09-24 06:47:45.336
job-33-event-0	seed-user-0	seed-post-107	\N	VIDEO_COMPLETE	5833.402999999999	2026-09-24 06:47:46.67
job-34-event-0	seed-user-0	seed-post-107	\N	VIDEO_REPLAY	1	2026-09-24 06:47:46.852
job-35-event-0	seed-user-0	seed-post-107	\N	VIDEO_25	1587.719	2026-09-24 06:47:48.429
job-36-event-0	seed-user-0	seed-post-110	\N	FEED_IMPRESSION	1	2026-09-24 06:47:49.962
job-37-event-0	seed-user-0	seed-post-110	\N	FEED_IMPRESSION	1	2026-09-24 06:47:49.962
job-38-event-0	seed-user-0	seed-post-110	\N	VIDEO_START	1	2026-09-24 06:47:49.967
job-39-event-0	seed-user-0	seed-post-107	\N	SAVE	1	2026-09-24 06:47:49.986
job-40-event-0	seed-user-0	seed-post-107	\N	VIDEO_50	3180.562	2026-09-24 06:47:50.023
job-41-event-0	seed-user-0	seed-post-000	\N	FEED_IMPRESSION	1	2026-09-24 06:47:50.54
job-42-event-0	seed-user-0	seed-post-102	\N	FEED_IMPRESSION	1	2026-09-24 06:48:14.713
job-43-event-0	seed-user-0	seed-post-102	\N	VIDEO_START	1	2026-09-24 06:48:14.744
job-44-event-0	seed-user-0	seed-post-102	\N	FEED_IMPRESSION	1	2026-09-24 06:48:14.744
job-45-event-0	seed-user-0	seed-post-003	\N	FEED_IMPRESSION	1	2026-09-24 06:48:15.391
job-46-event-0	seed-user-0	seed-post-105	\N	FEED_IMPRESSION	1	2026-09-24 06:48:15.706
job-47-event-0	seed-user-0	seed-post-105	\N	FEED_IMPRESSION	1	2026-09-24 06:48:15.909
job-48-event-0	seed-user-0	seed-post-105	\N	VIDEO_START	1	2026-09-24 06:48:15.909
job-49-event-0	seed-user-0	seed-post-006	\N	FEED_IMPRESSION	1	2026-09-24 06:48:16.375
job-50-event-0	seed-user-0	seed-post-107	\N	FEED_IMPRESSION	1	2026-09-24 06:48:16.895
job-51-event-0	seed-user-0	seed-post-107	\N	FEED_IMPRESSION	1	2026-09-24 06:48:16.895
job-52-event-0	seed-user-0	seed-post-107	\N	VIDEO_START	1	2026-09-24 06:48:16.897
job-53-event-0	seed-user-0	seed-post-108	\N	FEED_IMPRESSION	1	2026-09-24 06:48:16.994
job-54-event-0	seed-user-0	seed-post-108	\N	FEED_IMPRESSION	1	2026-09-24 06:48:16.994
job-55-event-0	seed-user-0	seed-post-108	\N	VIDEO_START	1	2026-09-24 06:48:16.997
job-56-event-0	seed-user-0	seed-post-009	\N	FEED_IMPRESSION	1	2026-09-24 06:48:17.073
job-57-event-0	seed-user-0	seed-post-111	\N	FEED_IMPRESSION	1	2026-09-24 06:48:17.188
job-58-event-0	seed-user-0	seed-post-111	\N	FEED_IMPRESSION	1	2026-09-24 06:48:17.209
job-59-event-0	seed-user-0	seed-post-111	\N	VIDEO_START	1	2026-09-24 06:48:17.209
job-60-event-0	seed-user-0	seed-post-012	\N	FEED_IMPRESSION	1	2026-09-24 06:48:17.54
job-61-event-0	seed-user-0	seed-post-114	\N	VIDEO_START	1	2026-09-24 06:48:17.795
job-62-event-0	seed-user-0	seed-post-114	\N	FEED_IMPRESSION	1	2026-09-24 06:48:17.795
job-63-event-0	seed-user-0	seed-post-114	\N	FEED_IMPRESSION	1	2026-09-24 06:48:17.798
job-64-event-0	seed-user-0	seed-post-015	\N	FEED_IMPRESSION	1	2026-09-24 06:48:17.858
job-66-event-0	seed-user-0	seed-post-117	\N	FEED_IMPRESSION	1	2026-09-24 06:48:17.927
job-65-event-0	seed-user-0	seed-post-117	\N	VIDEO_START	1	2026-09-24 06:48:17.927
job-67-event-0	seed-user-0	seed-post-117	\N	FEED_IMPRESSION	1	2026-09-24 06:48:17.929
job-68-event-0	seed-user-0	seed-post-018	\N	FEED_IMPRESSION	1	2026-09-24 06:48:18.007
job-69-event-0	seed-user-0	seed-post-120	\N	FEED_IMPRESSION	1	2026-09-24 06:48:18.179
job-71-event-0	seed-user-0	seed-post-120	\N	VIDEO_START	1	2026-09-24 06:48:18.192
job-70-event-0	seed-user-0	seed-post-120	\N	FEED_IMPRESSION	1	2026-09-24 06:48:18.192
job-72-event-0	seed-user-0	seed-post-117	\N	FEED_IMPRESSION	1	2026-09-24 06:48:19.361
job-73-event-0	seed-user-0	seed-post-117	\N	VIDEO_START	1	2026-09-24 06:48:19.361
job-74-event-0	seed-user-0	seed-post-114	\N	VIDEO_START	1	2026-09-24 06:48:19.495
job-75-event-0	seed-user-0	seed-post-114	\N	FEED_IMPRESSION	1	2026-09-24 06:48:19.495
job-77-event-0	seed-user-0	seed-post-111	\N	FEED_IMPRESSION	1	2026-09-24 06:48:19.893
job-76-event-0	seed-user-0	seed-post-111	\N	VIDEO_START	1	2026-09-24 06:48:19.893
job-79-event-0	seed-user-0	seed-post-108	\N	FEED_IMPRESSION	1	2026-09-24 06:48:20.059
job-78-event-0	seed-user-0	seed-post-108	\N	VIDEO_START	1	2026-09-24 06:48:20.059
job-81-event-0	seed-user-0	seed-post-107	\N	VIDEO_START	1	2026-09-24 06:48:20.209
job-80-event-0	seed-user-0	seed-post-107	\N	FEED_IMPRESSION	1	2026-09-24 06:48:20.21
job-82-event-0	seed-user-0	seed-post-105	\N	VIDEO_START	1	2026-09-24 06:48:20.86
job-83-event-0	seed-user-0	seed-post-105	\N	FEED_IMPRESSION	1	2026-09-24 06:48:20.86
job-84-event-0	seed-user-0	seed-post-102	\N	FEED_IMPRESSION	1	2026-09-24 06:48:21.374
job-85-event-0	seed-user-0	seed-post-102	\N	VIDEO_START	1	2026-09-24 06:48:21.374
job-86-event-0	seed-user-0	seed-post-000	\N	FEED_IMPRESSION	1	2026-09-24 06:50:23.313
job-88-event-0	seed-user-0	seed-post-000	\N	FEED_IMPRESSION	1	2026-09-24 06:57:19.809
\.


--
-- Data for Name: FeatureFlag; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."FeatureFlag" (key, enabled, "updatedAt") FROM stdin;
group_messages	t	2026-09-23 23:31:50.782
startup_verification	t	2026-09-23 23:31:50.784
founder_analytics	t	2026-09-23 23:31:50.785
recommendation_v2	f	2026-09-23 23:31:50.785
investment_module	f	2026-09-24 12:09:59.348
\.


--
-- Data for Name: FeedImpression; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."FeedImpression" (id, "userId", "postId", "createdAt") FROM stdin;
job-23-impression-0	seed-user-0	seed-post-107	2026-09-24 06:47:34.817
job-24-impression-0	seed-user-0	seed-post-107	2026-09-24 06:47:34.827
job-37-impression-0	seed-user-0	seed-post-110	2026-09-24 06:47:49.962
job-36-impression-0	seed-user-0	seed-post-110	2026-09-24 06:47:49.962
job-41-impression-0	seed-user-0	seed-post-000	2026-09-24 06:47:50.54
job-42-impression-0	seed-user-0	seed-post-102	2026-09-24 06:48:14.713
job-44-impression-0	seed-user-0	seed-post-102	2026-09-24 06:48:14.744
job-45-impression-0	seed-user-0	seed-post-003	2026-09-24 06:48:15.391
job-46-impression-0	seed-user-0	seed-post-105	2026-09-24 06:48:15.706
job-47-impression-0	seed-user-0	seed-post-105	2026-09-24 06:48:15.909
job-49-impression-0	seed-user-0	seed-post-006	2026-09-24 06:48:16.375
job-50-impression-0	seed-user-0	seed-post-107	2026-09-24 06:48:16.895
job-51-impression-0	seed-user-0	seed-post-107	2026-09-24 06:48:16.895
job-54-impression-0	seed-user-0	seed-post-108	2026-09-24 06:48:16.994
job-53-impression-0	seed-user-0	seed-post-108	2026-09-24 06:48:16.994
job-56-impression-0	seed-user-0	seed-post-009	2026-09-24 06:48:17.073
job-57-impression-0	seed-user-0	seed-post-111	2026-09-24 06:48:17.188
job-58-impression-0	seed-user-0	seed-post-111	2026-09-24 06:48:17.209
job-60-impression-0	seed-user-0	seed-post-012	2026-09-24 06:48:17.54
job-62-impression-0	seed-user-0	seed-post-114	2026-09-24 06:48:17.795
job-63-impression-0	seed-user-0	seed-post-114	2026-09-24 06:48:17.798
job-64-impression-0	seed-user-0	seed-post-015	2026-09-24 06:48:17.858
job-66-impression-0	seed-user-0	seed-post-117	2026-09-24 06:48:17.927
job-67-impression-0	seed-user-0	seed-post-117	2026-09-24 06:48:17.929
job-68-impression-0	seed-user-0	seed-post-018	2026-09-24 06:48:18.007
job-69-impression-0	seed-user-0	seed-post-120	2026-09-24 06:48:18.179
job-70-impression-0	seed-user-0	seed-post-120	2026-09-24 06:48:18.192
job-72-impression-0	seed-user-0	seed-post-117	2026-09-24 06:48:19.361
job-75-impression-0	seed-user-0	seed-post-114	2026-09-24 06:48:19.495
job-77-impression-0	seed-user-0	seed-post-111	2026-09-24 06:48:19.893
job-79-impression-0	seed-user-0	seed-post-108	2026-09-24 06:48:20.059
job-80-impression-0	seed-user-0	seed-post-107	2026-09-24 06:48:20.21
job-83-impression-0	seed-user-0	seed-post-105	2026-09-24 06:48:20.86
job-84-impression-0	seed-user-0	seed-post-102	2026-09-24 06:48:21.374
job-86-impression-0	seed-user-0	seed-post-000	2026-09-24 06:50:23.313
job-88-impression-0	seed-user-0	seed-post-000	2026-09-24 06:57:19.809
\.


--
-- Data for Name: JobFailure; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."JobFailure" (id, queue, "jobId", reason, attempts, "createdAt") FROM stdin;
cmuf6r04w0000utctv4em4g5c	productscroll	media-cmuf6qby2000butcs6ze7ncrq	spawn /Users/ayushkumarsingh/Documents/Codex/2026-09-24/files-mentioned-by-the-user-productscroll/work/ProductScroll/node_modules/.pnpm/@ffprobe-installer+darwin-arm64@5.0.1/node_modules/@ffprobe-installer/darwin-arm64/ffprobe EACCES	5	2026-09-24 07:03:30.417
cmufhh5bx0000utj4ls92sd5m	productscroll	media-cmufhgh1s000butj3q9kjqxam	ffmpeg exited 1: 100 /  7.110.100\n  libswscale      5.  9.100 /  5.  9.100\n  libswresample   3.  9.100 /  3.  9.100\n  libpostproc    55.  9.100 / 55.  9.100\nInput #0, mov,mp4,m4a,3gp,3g2,mj2, from '/Users/ayushkumarsingh/Documents/Codex/2026-09-24/files-mentioned-by-the-user-productscroll/work/ProductScroll/work/media/incoming/xKzEtX2YaYHS6AzrjHwDNdPh_faNEy9SnVRQxU9v6_Q':\n  Metadata:\n    major_brand     : isom\n    minor_version   : 512\n    compatible_brands: isomiso2avc1mp41\n    encoder         	5	2026-09-24 12:03:46.365
\.


--
-- Data for Name: Like; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Like" ("userId", "postId", "createdAt") FROM stdin;
seed-user-10	seed-post-000	2026-09-23 23:31:50.007
seed-user-11	seed-post-000	2026-09-23 23:31:50.009
seed-user-12	seed-post-000	2026-09-23 23:31:50.009
seed-user-11	seed-post-001	2026-09-23 23:31:50.016
seed-user-12	seed-post-001	2026-09-23 23:31:50.016
seed-user-13	seed-post-001	2026-09-23 23:31:50.017
seed-user-14	seed-post-001	2026-09-23 23:31:50.017
seed-user-12	seed-post-002	2026-09-23 23:31:50.02
seed-user-13	seed-post-002	2026-09-23 23:31:50.02
seed-user-14	seed-post-002	2026-09-23 23:31:50.021
seed-user-15	seed-post-002	2026-09-23 23:31:50.021
seed-user-16	seed-post-002	2026-09-23 23:31:50.021
seed-user-13	seed-post-003	2026-09-23 23:31:50.024
seed-user-14	seed-post-003	2026-09-23 23:31:50.025
seed-user-15	seed-post-003	2026-09-23 23:31:50.025
seed-user-16	seed-post-003	2026-09-23 23:31:50.025
seed-user-17	seed-post-003	2026-09-23 23:31:50.026
seed-user-18	seed-post-003	2026-09-23 23:31:50.026
seed-user-14	seed-post-004	2026-09-23 23:31:50.03
seed-user-15	seed-post-004	2026-09-23 23:31:50.03
seed-user-16	seed-post-004	2026-09-23 23:31:50.031
seed-user-17	seed-post-004	2026-09-23 23:31:50.031
seed-user-18	seed-post-004	2026-09-23 23:31:50.031
seed-user-19	seed-post-004	2026-09-23 23:31:50.032
seed-user-20	seed-post-004	2026-09-23 23:31:50.032
seed-user-15	seed-post-005	2026-09-23 23:31:50.035
seed-user-16	seed-post-005	2026-09-23 23:31:50.035
seed-user-17	seed-post-005	2026-09-23 23:31:50.036
seed-user-18	seed-post-005	2026-09-23 23:31:50.036
seed-user-19	seed-post-005	2026-09-23 23:31:50.036
seed-user-20	seed-post-005	2026-09-23 23:31:50.037
seed-user-21	seed-post-005	2026-09-23 23:31:50.037
seed-user-22	seed-post-005	2026-09-23 23:31:50.037
seed-user-16	seed-post-006	2026-09-23 23:31:50.04
seed-user-17	seed-post-006	2026-09-23 23:31:50.04
seed-user-18	seed-post-006	2026-09-23 23:31:50.04
seed-user-19	seed-post-006	2026-09-23 23:31:50.041
seed-user-20	seed-post-006	2026-09-23 23:31:50.041
seed-user-21	seed-post-006	2026-09-23 23:31:50.042
seed-user-22	seed-post-006	2026-09-23 23:31:50.042
seed-user-23	seed-post-006	2026-09-23 23:31:50.042
seed-user-24	seed-post-006	2026-09-23 23:31:50.043
seed-user-17	seed-post-007	2026-09-23 23:31:50.046
seed-user-18	seed-post-007	2026-09-23 23:31:50.046
seed-user-19	seed-post-007	2026-09-23 23:31:50.047
seed-user-20	seed-post-007	2026-09-23 23:31:50.047
seed-user-21	seed-post-007	2026-09-23 23:31:50.048
seed-user-22	seed-post-007	2026-09-23 23:31:50.048
seed-user-23	seed-post-007	2026-09-23 23:31:50.048
seed-user-24	seed-post-007	2026-09-23 23:31:50.049
seed-user-25	seed-post-007	2026-09-23 23:31:50.049
seed-user-26	seed-post-007	2026-09-23 23:31:50.049
seed-user-18	seed-post-008	2026-09-23 23:31:50.051
seed-user-19	seed-post-008	2026-09-23 23:31:50.052
seed-user-20	seed-post-008	2026-09-23 23:31:50.052
seed-user-21	seed-post-008	2026-09-23 23:31:50.052
seed-user-22	seed-post-008	2026-09-23 23:31:50.053
seed-user-23	seed-post-008	2026-09-23 23:31:50.053
seed-user-24	seed-post-008	2026-09-23 23:31:50.053
seed-user-25	seed-post-008	2026-09-23 23:31:50.054
seed-user-26	seed-post-008	2026-09-23 23:31:50.054
seed-user-27	seed-post-008	2026-09-23 23:31:50.055
seed-user-28	seed-post-008	2026-09-23 23:31:50.055
seed-user-19	seed-post-009	2026-09-23 23:31:50.058
seed-user-20	seed-post-009	2026-09-23 23:31:50.058
seed-user-21	seed-post-009	2026-09-23 23:31:50.058
seed-user-22	seed-post-009	2026-09-23 23:31:50.059
seed-user-23	seed-post-009	2026-09-23 23:31:50.059
seed-user-24	seed-post-009	2026-09-23 23:31:50.059
seed-user-25	seed-post-009	2026-09-23 23:31:50.06
seed-user-26	seed-post-009	2026-09-23 23:31:50.06
seed-user-27	seed-post-009	2026-09-23 23:31:50.06
seed-user-28	seed-post-009	2026-09-23 23:31:50.06
seed-user-29	seed-post-009	2026-09-23 23:31:50.061
seed-user-0	seed-post-009	2026-09-23 23:31:50.061
seed-user-20	seed-post-010	2026-09-23 23:31:50.064
seed-user-21	seed-post-010	2026-09-23 23:31:50.064
seed-user-22	seed-post-010	2026-09-23 23:31:50.064
seed-user-23	seed-post-010	2026-09-23 23:31:50.065
seed-user-24	seed-post-010	2026-09-23 23:31:50.065
seed-user-25	seed-post-010	2026-09-23 23:31:50.065
seed-user-26	seed-post-010	2026-09-23 23:31:50.066
seed-user-27	seed-post-010	2026-09-23 23:31:50.066
seed-user-28	seed-post-010	2026-09-23 23:31:50.066
seed-user-29	seed-post-010	2026-09-23 23:31:50.066
seed-user-0	seed-post-010	2026-09-23 23:31:50.067
seed-user-1	seed-post-010	2026-09-23 23:31:50.067
seed-user-2	seed-post-010	2026-09-23 23:31:50.068
seed-user-21	seed-post-011	2026-09-23 23:31:50.07
seed-user-22	seed-post-011	2026-09-23 23:31:50.071
seed-user-23	seed-post-011	2026-09-23 23:31:50.071
seed-user-24	seed-post-011	2026-09-23 23:31:50.071
seed-user-25	seed-post-011	2026-09-23 23:31:50.072
seed-user-26	seed-post-011	2026-09-23 23:31:50.072
seed-user-27	seed-post-011	2026-09-23 23:31:50.072
seed-user-28	seed-post-011	2026-09-23 23:31:50.073
seed-user-29	seed-post-011	2026-09-23 23:31:50.073
seed-user-0	seed-post-011	2026-09-23 23:31:50.073
seed-user-1	seed-post-011	2026-09-23 23:31:50.073
seed-user-2	seed-post-011	2026-09-23 23:31:50.074
seed-user-3	seed-post-011	2026-09-23 23:31:50.074
seed-user-4	seed-post-011	2026-09-23 23:31:50.074
seed-user-22	seed-post-012	2026-09-23 23:31:50.076
seed-user-23	seed-post-012	2026-09-23 23:31:50.076
seed-user-24	seed-post-012	2026-09-23 23:31:50.077
seed-user-25	seed-post-012	2026-09-23 23:31:50.077
seed-user-26	seed-post-012	2026-09-23 23:31:50.077
seed-user-27	seed-post-012	2026-09-23 23:31:50.078
seed-user-28	seed-post-012	2026-09-23 23:31:50.078
seed-user-29	seed-post-012	2026-09-23 23:31:50.078
seed-user-0	seed-post-012	2026-09-23 23:31:50.078
seed-user-1	seed-post-012	2026-09-23 23:31:50.079
seed-user-2	seed-post-012	2026-09-23 23:31:50.079
seed-user-3	seed-post-012	2026-09-23 23:31:50.079
seed-user-4	seed-post-012	2026-09-23 23:31:50.08
seed-user-5	seed-post-012	2026-09-23 23:31:50.08
seed-user-6	seed-post-012	2026-09-23 23:31:50.08
seed-user-23	seed-post-013	2026-09-23 23:31:50.083
seed-user-24	seed-post-013	2026-09-23 23:31:50.083
seed-user-25	seed-post-013	2026-09-23 23:31:50.083
seed-user-26	seed-post-013	2026-09-23 23:31:50.084
seed-user-27	seed-post-013	2026-09-23 23:31:50.084
seed-user-28	seed-post-013	2026-09-23 23:31:50.084
seed-user-29	seed-post-013	2026-09-23 23:31:50.084
seed-user-0	seed-post-013	2026-09-23 23:31:50.084
seed-user-1	seed-post-013	2026-09-23 23:31:50.085
seed-user-2	seed-post-013	2026-09-23 23:31:50.085
seed-user-3	seed-post-013	2026-09-23 23:31:50.085
seed-user-4	seed-post-013	2026-09-23 23:31:50.085
seed-user-5	seed-post-013	2026-09-23 23:31:50.085
seed-user-6	seed-post-013	2026-09-23 23:31:50.085
seed-user-7	seed-post-013	2026-09-23 23:31:50.086
seed-user-8	seed-post-013	2026-09-23 23:31:50.086
seed-user-24	seed-post-014	2026-09-23 23:31:50.087
seed-user-25	seed-post-014	2026-09-23 23:31:50.087
seed-user-26	seed-post-014	2026-09-23 23:31:50.087
seed-user-27	seed-post-014	2026-09-23 23:31:50.088
seed-user-28	seed-post-014	2026-09-23 23:31:50.088
seed-user-29	seed-post-014	2026-09-23 23:31:50.088
seed-user-0	seed-post-014	2026-09-23 23:31:50.088
seed-user-1	seed-post-014	2026-09-23 23:31:50.088
seed-user-2	seed-post-014	2026-09-23 23:31:50.089
seed-user-3	seed-post-014	2026-09-23 23:31:50.089
seed-user-4	seed-post-014	2026-09-23 23:31:50.089
seed-user-5	seed-post-014	2026-09-23 23:31:50.089
seed-user-6	seed-post-014	2026-09-23 23:31:50.089
seed-user-7	seed-post-014	2026-09-23 23:31:50.089
seed-user-8	seed-post-014	2026-09-23 23:31:50.09
seed-user-9	seed-post-014	2026-09-23 23:31:50.09
seed-user-10	seed-post-014	2026-09-23 23:31:50.09
seed-user-25	seed-post-015	2026-09-23 23:31:50.092
seed-user-26	seed-post-015	2026-09-23 23:31:50.092
seed-user-27	seed-post-015	2026-09-23 23:31:50.092
seed-user-28	seed-post-015	2026-09-23 23:31:50.093
seed-user-29	seed-post-015	2026-09-23 23:31:50.093
seed-user-0	seed-post-015	2026-09-23 23:31:50.093
seed-user-1	seed-post-015	2026-09-23 23:31:50.093
seed-user-2	seed-post-015	2026-09-23 23:31:50.094
seed-user-3	seed-post-015	2026-09-23 23:31:50.094
seed-user-4	seed-post-015	2026-09-23 23:31:50.094
seed-user-5	seed-post-015	2026-09-23 23:31:50.094
seed-user-6	seed-post-015	2026-09-23 23:31:50.095
seed-user-7	seed-post-015	2026-09-23 23:31:50.095
seed-user-8	seed-post-015	2026-09-23 23:31:50.095
seed-user-9	seed-post-015	2026-09-23 23:31:50.095
seed-user-10	seed-post-015	2026-09-23 23:31:50.095
seed-user-11	seed-post-015	2026-09-23 23:31:50.096
seed-user-12	seed-post-015	2026-09-23 23:31:50.096
seed-user-26	seed-post-016	2026-09-23 23:31:50.098
seed-user-27	seed-post-016	2026-09-23 23:31:50.098
seed-user-28	seed-post-016	2026-09-23 23:31:50.099
seed-user-29	seed-post-016	2026-09-23 23:31:50.099
seed-user-0	seed-post-016	2026-09-23 23:31:50.099
seed-user-1	seed-post-016	2026-09-23 23:31:50.099
seed-user-2	seed-post-016	2026-09-23 23:31:50.1
seed-user-3	seed-post-016	2026-09-23 23:31:50.1
seed-user-4	seed-post-016	2026-09-23 23:31:50.1
seed-user-5	seed-post-016	2026-09-23 23:31:50.1
seed-user-6	seed-post-016	2026-09-23 23:31:50.101
seed-user-7	seed-post-016	2026-09-23 23:31:50.101
seed-user-8	seed-post-016	2026-09-23 23:31:50.101
seed-user-9	seed-post-016	2026-09-23 23:31:50.101
seed-user-10	seed-post-016	2026-09-23 23:31:50.101
seed-user-11	seed-post-016	2026-09-23 23:31:50.102
seed-user-12	seed-post-016	2026-09-23 23:31:50.102
seed-user-13	seed-post-016	2026-09-23 23:31:50.102
seed-user-14	seed-post-016	2026-09-23 23:31:50.102
seed-user-27	seed-post-017	2026-09-23 23:31:50.104
seed-user-28	seed-post-017	2026-09-23 23:31:50.105
seed-user-29	seed-post-017	2026-09-23 23:31:50.105
seed-user-0	seed-post-017	2026-09-23 23:31:50.106
seed-user-1	seed-post-017	2026-09-23 23:31:50.106
seed-user-2	seed-post-017	2026-09-23 23:31:50.106
seed-user-3	seed-post-017	2026-09-23 23:31:50.106
seed-user-4	seed-post-017	2026-09-23 23:31:50.106
seed-user-5	seed-post-017	2026-09-23 23:31:50.107
seed-user-6	seed-post-017	2026-09-23 23:31:50.107
seed-user-7	seed-post-017	2026-09-23 23:31:50.107
seed-user-8	seed-post-017	2026-09-23 23:31:50.107
seed-user-9	seed-post-017	2026-09-23 23:31:50.108
seed-user-10	seed-post-017	2026-09-23 23:31:50.108
seed-user-11	seed-post-017	2026-09-23 23:31:50.108
seed-user-12	seed-post-017	2026-09-23 23:31:50.108
seed-user-13	seed-post-017	2026-09-23 23:31:50.108
seed-user-14	seed-post-017	2026-09-23 23:31:50.109
seed-user-15	seed-post-017	2026-09-23 23:31:50.109
seed-user-16	seed-post-017	2026-09-23 23:31:50.109
seed-user-28	seed-post-018	2026-09-23 23:31:50.111
seed-user-29	seed-post-018	2026-09-23 23:31:50.111
seed-user-0	seed-post-018	2026-09-23 23:31:50.111
seed-user-1	seed-post-018	2026-09-23 23:31:50.111
seed-user-2	seed-post-018	2026-09-23 23:31:50.112
seed-user-3	seed-post-018	2026-09-23 23:31:50.112
seed-user-4	seed-post-018	2026-09-23 23:31:50.112
seed-user-5	seed-post-018	2026-09-23 23:31:50.113
seed-user-6	seed-post-018	2026-09-23 23:31:50.113
seed-user-7	seed-post-018	2026-09-23 23:31:50.113
seed-user-8	seed-post-018	2026-09-23 23:31:50.113
seed-user-9	seed-post-018	2026-09-23 23:31:50.113
seed-user-10	seed-post-018	2026-09-23 23:31:50.114
seed-user-11	seed-post-018	2026-09-23 23:31:50.114
seed-user-12	seed-post-018	2026-09-23 23:31:50.114
seed-user-13	seed-post-018	2026-09-23 23:31:50.114
seed-user-14	seed-post-018	2026-09-23 23:31:50.115
seed-user-15	seed-post-018	2026-09-23 23:31:50.115
seed-user-16	seed-post-018	2026-09-23 23:31:50.115
seed-user-17	seed-post-018	2026-09-23 23:31:50.115
seed-user-18	seed-post-018	2026-09-23 23:31:50.115
seed-user-29	seed-post-019	2026-09-23 23:31:50.118
seed-user-0	seed-post-019	2026-09-23 23:31:50.118
seed-user-1	seed-post-019	2026-09-23 23:31:50.118
seed-user-0	seed-post-020	2026-09-23 23:31:50.12
seed-user-1	seed-post-020	2026-09-23 23:31:50.12
seed-user-2	seed-post-020	2026-09-23 23:31:50.12
seed-user-3	seed-post-020	2026-09-23 23:31:50.12
seed-user-1	seed-post-021	2026-09-23 23:31:50.123
seed-user-2	seed-post-021	2026-09-23 23:31:50.123
seed-user-3	seed-post-021	2026-09-23 23:31:50.123
seed-user-4	seed-post-021	2026-09-23 23:31:50.123
seed-user-5	seed-post-021	2026-09-23 23:31:50.124
seed-user-2	seed-post-022	2026-09-23 23:31:50.126
seed-user-3	seed-post-022	2026-09-23 23:31:50.126
seed-user-4	seed-post-022	2026-09-23 23:31:50.126
seed-user-5	seed-post-022	2026-09-23 23:31:50.126
seed-user-6	seed-post-022	2026-09-23 23:31:50.127
seed-user-7	seed-post-022	2026-09-23 23:31:50.127
seed-user-3	seed-post-023	2026-09-23 23:31:50.129
seed-user-4	seed-post-023	2026-09-23 23:31:50.13
seed-user-5	seed-post-023	2026-09-23 23:31:50.13
seed-user-6	seed-post-023	2026-09-23 23:31:50.13
seed-user-7	seed-post-023	2026-09-23 23:31:50.13
seed-user-8	seed-post-023	2026-09-23 23:31:50.13
seed-user-9	seed-post-023	2026-09-23 23:31:50.13
seed-user-4	seed-post-024	2026-09-23 23:31:50.132
seed-user-5	seed-post-024	2026-09-23 23:31:50.132
seed-user-6	seed-post-024	2026-09-23 23:31:50.132
seed-user-7	seed-post-024	2026-09-23 23:31:50.132
seed-user-8	seed-post-024	2026-09-23 23:31:50.132
seed-user-9	seed-post-024	2026-09-23 23:31:50.133
seed-user-10	seed-post-024	2026-09-23 23:31:50.133
seed-user-11	seed-post-024	2026-09-23 23:31:50.133
seed-user-5	seed-post-025	2026-09-23 23:31:50.135
seed-user-6	seed-post-025	2026-09-23 23:31:50.135
seed-user-7	seed-post-025	2026-09-23 23:31:50.135
seed-user-8	seed-post-025	2026-09-23 23:31:50.136
seed-user-9	seed-post-025	2026-09-23 23:31:50.136
seed-user-10	seed-post-025	2026-09-23 23:31:50.136
seed-user-11	seed-post-025	2026-09-23 23:31:50.136
seed-user-12	seed-post-025	2026-09-23 23:31:50.136
seed-user-13	seed-post-025	2026-09-23 23:31:50.137
seed-user-6	seed-post-026	2026-09-23 23:31:50.138
seed-user-7	seed-post-026	2026-09-23 23:31:50.138
seed-user-8	seed-post-026	2026-09-23 23:31:50.138
seed-user-9	seed-post-026	2026-09-23 23:31:50.139
seed-user-10	seed-post-026	2026-09-23 23:31:50.139
seed-user-11	seed-post-026	2026-09-23 23:31:50.139
seed-user-12	seed-post-026	2026-09-23 23:31:50.139
seed-user-13	seed-post-026	2026-09-23 23:31:50.14
seed-user-14	seed-post-026	2026-09-23 23:31:50.14
seed-user-15	seed-post-026	2026-09-23 23:31:50.14
seed-user-7	seed-post-027	2026-09-23 23:31:50.142
seed-user-8	seed-post-027	2026-09-23 23:31:50.143
seed-user-9	seed-post-027	2026-09-23 23:31:50.143
seed-user-10	seed-post-027	2026-09-23 23:31:50.143
seed-user-11	seed-post-027	2026-09-23 23:31:50.143
seed-user-12	seed-post-027	2026-09-23 23:31:50.143
seed-user-13	seed-post-027	2026-09-23 23:31:50.144
seed-user-14	seed-post-027	2026-09-23 23:31:50.144
seed-user-15	seed-post-027	2026-09-23 23:31:50.144
seed-user-16	seed-post-027	2026-09-23 23:31:50.144
seed-user-17	seed-post-027	2026-09-23 23:31:50.145
seed-user-8	seed-post-028	2026-09-23 23:31:50.147
seed-user-9	seed-post-028	2026-09-23 23:31:50.147
seed-user-10	seed-post-028	2026-09-23 23:31:50.147
seed-user-11	seed-post-028	2026-09-23 23:31:50.147
seed-user-12	seed-post-028	2026-09-23 23:31:50.147
seed-user-13	seed-post-028	2026-09-23 23:31:50.147
seed-user-14	seed-post-028	2026-09-23 23:31:50.148
seed-user-15	seed-post-028	2026-09-23 23:31:50.148
seed-user-16	seed-post-028	2026-09-23 23:31:50.148
seed-user-17	seed-post-028	2026-09-23 23:31:50.148
seed-user-18	seed-post-028	2026-09-23 23:31:50.148
seed-user-19	seed-post-028	2026-09-23 23:31:50.148
seed-user-9	seed-post-029	2026-09-23 23:31:50.15
seed-user-10	seed-post-029	2026-09-23 23:31:50.15
seed-user-11	seed-post-029	2026-09-23 23:31:50.15
seed-user-12	seed-post-029	2026-09-23 23:31:50.15
seed-user-13	seed-post-029	2026-09-23 23:31:50.151
seed-user-14	seed-post-029	2026-09-23 23:31:50.151
seed-user-15	seed-post-029	2026-09-23 23:31:50.151
seed-user-16	seed-post-029	2026-09-23 23:31:50.151
seed-user-17	seed-post-029	2026-09-23 23:31:50.151
seed-user-18	seed-post-029	2026-09-23 23:31:50.151
seed-user-19	seed-post-029	2026-09-23 23:31:50.152
seed-user-20	seed-post-029	2026-09-23 23:31:50.152
seed-user-21	seed-post-029	2026-09-23 23:31:50.152
seed-user-10	seed-post-030	2026-09-23 23:31:50.154
seed-user-11	seed-post-030	2026-09-23 23:31:50.154
seed-user-12	seed-post-030	2026-09-23 23:31:50.154
seed-user-13	seed-post-030	2026-09-23 23:31:50.154
seed-user-14	seed-post-030	2026-09-23 23:31:50.155
seed-user-15	seed-post-030	2026-09-23 23:31:50.155
seed-user-16	seed-post-030	2026-09-23 23:31:50.155
seed-user-17	seed-post-030	2026-09-23 23:31:50.155
seed-user-18	seed-post-030	2026-09-23 23:31:50.156
seed-user-19	seed-post-030	2026-09-23 23:31:50.156
seed-user-20	seed-post-030	2026-09-23 23:31:50.156
seed-user-21	seed-post-030	2026-09-23 23:31:50.156
seed-user-22	seed-post-030	2026-09-23 23:31:50.157
seed-user-23	seed-post-030	2026-09-23 23:31:50.157
seed-user-11	seed-post-031	2026-09-23 23:31:50.159
seed-user-12	seed-post-031	2026-09-23 23:31:50.159
seed-user-13	seed-post-031	2026-09-23 23:31:50.16
seed-user-14	seed-post-031	2026-09-23 23:31:50.16
seed-user-15	seed-post-031	2026-09-23 23:31:50.16
seed-user-16	seed-post-031	2026-09-23 23:31:50.16
seed-user-17	seed-post-031	2026-09-23 23:31:50.161
seed-user-18	seed-post-031	2026-09-23 23:31:50.161
seed-user-19	seed-post-031	2026-09-23 23:31:50.161
seed-user-20	seed-post-031	2026-09-23 23:31:50.162
seed-user-21	seed-post-031	2026-09-23 23:31:50.162
seed-user-22	seed-post-031	2026-09-23 23:31:50.162
seed-user-23	seed-post-031	2026-09-23 23:31:50.162
seed-user-24	seed-post-031	2026-09-23 23:31:50.163
seed-user-25	seed-post-031	2026-09-23 23:31:50.163
seed-user-12	seed-post-032	2026-09-23 23:31:50.164
seed-user-13	seed-post-032	2026-09-23 23:31:50.165
seed-user-14	seed-post-032	2026-09-23 23:31:50.165
seed-user-15	seed-post-032	2026-09-23 23:31:50.165
seed-user-16	seed-post-032	2026-09-23 23:31:50.165
seed-user-17	seed-post-032	2026-09-23 23:31:50.165
seed-user-18	seed-post-032	2026-09-23 23:31:50.166
seed-user-19	seed-post-032	2026-09-23 23:31:50.166
seed-user-20	seed-post-032	2026-09-23 23:31:50.166
seed-user-21	seed-post-032	2026-09-23 23:31:50.166
seed-user-22	seed-post-032	2026-09-23 23:31:50.166
seed-user-23	seed-post-032	2026-09-23 23:31:50.166
seed-user-24	seed-post-032	2026-09-23 23:31:50.167
seed-user-25	seed-post-032	2026-09-23 23:31:50.167
seed-user-26	seed-post-032	2026-09-23 23:31:50.167
seed-user-27	seed-post-032	2026-09-23 23:31:50.167
seed-user-13	seed-post-033	2026-09-23 23:31:50.169
seed-user-14	seed-post-033	2026-09-23 23:31:50.169
seed-user-15	seed-post-033	2026-09-23 23:31:50.169
seed-user-16	seed-post-033	2026-09-23 23:31:50.169
seed-user-17	seed-post-033	2026-09-23 23:31:50.17
seed-user-18	seed-post-033	2026-09-23 23:31:50.17
seed-user-19	seed-post-033	2026-09-23 23:31:50.17
seed-user-20	seed-post-033	2026-09-23 23:31:50.171
seed-user-21	seed-post-033	2026-09-23 23:31:50.171
seed-user-22	seed-post-033	2026-09-23 23:31:50.171
seed-user-23	seed-post-033	2026-09-23 23:31:50.171
seed-user-24	seed-post-033	2026-09-23 23:31:50.171
seed-user-25	seed-post-033	2026-09-23 23:31:50.172
seed-user-26	seed-post-033	2026-09-23 23:31:50.172
seed-user-27	seed-post-033	2026-09-23 23:31:50.172
seed-user-28	seed-post-033	2026-09-23 23:31:50.172
seed-user-29	seed-post-033	2026-09-23 23:31:50.172
seed-user-14	seed-post-034	2026-09-23 23:31:50.174
seed-user-15	seed-post-034	2026-09-23 23:31:50.174
seed-user-16	seed-post-034	2026-09-23 23:31:50.174
seed-user-17	seed-post-034	2026-09-23 23:31:50.175
seed-user-18	seed-post-034	2026-09-23 23:31:50.175
seed-user-19	seed-post-034	2026-09-23 23:31:50.175
seed-user-20	seed-post-034	2026-09-23 23:31:50.175
seed-user-21	seed-post-034	2026-09-23 23:31:50.176
seed-user-22	seed-post-034	2026-09-23 23:31:50.176
seed-user-23	seed-post-034	2026-09-23 23:31:50.176
seed-user-24	seed-post-034	2026-09-23 23:31:50.176
seed-user-25	seed-post-034	2026-09-23 23:31:50.177
seed-user-26	seed-post-034	2026-09-23 23:31:50.177
seed-user-27	seed-post-034	2026-09-23 23:31:50.177
seed-user-28	seed-post-034	2026-09-23 23:31:50.177
seed-user-29	seed-post-034	2026-09-23 23:31:50.178
seed-user-0	seed-post-034	2026-09-23 23:31:50.178
seed-user-1	seed-post-034	2026-09-23 23:31:50.178
seed-user-15	seed-post-035	2026-09-23 23:31:50.18
seed-user-16	seed-post-035	2026-09-23 23:31:50.181
seed-user-17	seed-post-035	2026-09-23 23:31:50.181
seed-user-18	seed-post-035	2026-09-23 23:31:50.181
seed-user-19	seed-post-035	2026-09-23 23:31:50.181
seed-user-20	seed-post-035	2026-09-23 23:31:50.181
seed-user-21	seed-post-035	2026-09-23 23:31:50.182
seed-user-22	seed-post-035	2026-09-23 23:31:50.182
seed-user-23	seed-post-035	2026-09-23 23:31:50.182
seed-user-24	seed-post-035	2026-09-23 23:31:50.182
seed-user-25	seed-post-035	2026-09-23 23:31:50.183
seed-user-26	seed-post-035	2026-09-23 23:31:50.183
seed-user-27	seed-post-035	2026-09-23 23:31:50.183
seed-user-28	seed-post-035	2026-09-23 23:31:50.183
seed-user-29	seed-post-035	2026-09-23 23:31:50.184
seed-user-0	seed-post-035	2026-09-23 23:31:50.184
seed-user-1	seed-post-035	2026-09-23 23:31:50.184
seed-user-2	seed-post-035	2026-09-23 23:31:50.184
seed-user-3	seed-post-035	2026-09-23 23:31:50.184
seed-user-16	seed-post-036	2026-09-23 23:31:50.186
seed-user-17	seed-post-036	2026-09-23 23:31:50.186
seed-user-18	seed-post-036	2026-09-23 23:31:50.187
seed-user-19	seed-post-036	2026-09-23 23:31:50.187
seed-user-20	seed-post-036	2026-09-23 23:31:50.187
seed-user-21	seed-post-036	2026-09-23 23:31:50.187
seed-user-22	seed-post-036	2026-09-23 23:31:50.188
seed-user-23	seed-post-036	2026-09-23 23:31:50.188
seed-user-24	seed-post-036	2026-09-23 23:31:50.188
seed-user-25	seed-post-036	2026-09-23 23:31:50.188
seed-user-26	seed-post-036	2026-09-23 23:31:50.189
seed-user-27	seed-post-036	2026-09-23 23:31:50.189
seed-user-28	seed-post-036	2026-09-23 23:31:50.189
seed-user-29	seed-post-036	2026-09-23 23:31:50.189
seed-user-0	seed-post-036	2026-09-23 23:31:50.189
seed-user-1	seed-post-036	2026-09-23 23:31:50.19
seed-user-2	seed-post-036	2026-09-23 23:31:50.19
seed-user-3	seed-post-036	2026-09-23 23:31:50.19
seed-user-4	seed-post-036	2026-09-23 23:31:50.19
seed-user-5	seed-post-036	2026-09-23 23:31:50.191
seed-user-17	seed-post-037	2026-09-23 23:31:50.193
seed-user-18	seed-post-037	2026-09-23 23:31:50.193
seed-user-19	seed-post-037	2026-09-23 23:31:50.194
seed-user-20	seed-post-037	2026-09-23 23:31:50.194
seed-user-21	seed-post-037	2026-09-23 23:31:50.194
seed-user-22	seed-post-037	2026-09-23 23:31:50.194
seed-user-23	seed-post-037	2026-09-23 23:31:50.195
seed-user-24	seed-post-037	2026-09-23 23:31:50.195
seed-user-25	seed-post-037	2026-09-23 23:31:50.195
seed-user-26	seed-post-037	2026-09-23 23:31:50.195
seed-user-27	seed-post-037	2026-09-23 23:31:50.196
seed-user-28	seed-post-037	2026-09-23 23:31:50.196
seed-user-29	seed-post-037	2026-09-23 23:31:50.196
seed-user-0	seed-post-037	2026-09-23 23:31:50.196
seed-user-1	seed-post-037	2026-09-23 23:31:50.197
seed-user-2	seed-post-037	2026-09-23 23:31:50.197
seed-user-3	seed-post-037	2026-09-23 23:31:50.197
seed-user-4	seed-post-037	2026-09-23 23:31:50.197
seed-user-5	seed-post-037	2026-09-23 23:31:50.197
seed-user-6	seed-post-037	2026-09-23 23:31:50.198
seed-user-7	seed-post-037	2026-09-23 23:31:50.198
seed-user-18	seed-post-038	2026-09-23 23:31:50.2
seed-user-19	seed-post-038	2026-09-23 23:31:50.2
seed-user-20	seed-post-038	2026-09-23 23:31:50.201
seed-user-19	seed-post-039	2026-09-23 23:31:50.203
seed-user-20	seed-post-039	2026-09-23 23:31:50.203
seed-user-21	seed-post-039	2026-09-23 23:31:50.203
seed-user-22	seed-post-039	2026-09-23 23:31:50.204
seed-user-20	seed-post-040	2026-09-23 23:31:50.206
seed-user-21	seed-post-040	2026-09-23 23:31:50.206
seed-user-22	seed-post-040	2026-09-23 23:31:50.206
seed-user-23	seed-post-040	2026-09-23 23:31:50.206
seed-user-24	seed-post-040	2026-09-23 23:31:50.207
seed-user-21	seed-post-041	2026-09-23 23:31:50.209
seed-user-22	seed-post-041	2026-09-23 23:31:50.209
seed-user-23	seed-post-041	2026-09-23 23:31:50.209
seed-user-24	seed-post-041	2026-09-23 23:31:50.209
seed-user-25	seed-post-041	2026-09-23 23:31:50.21
seed-user-26	seed-post-041	2026-09-23 23:31:50.21
seed-user-22	seed-post-042	2026-09-23 23:31:50.212
seed-user-23	seed-post-042	2026-09-23 23:31:50.212
seed-user-24	seed-post-042	2026-09-23 23:31:50.212
seed-user-25	seed-post-042	2026-09-23 23:31:50.212
seed-user-26	seed-post-042	2026-09-23 23:31:50.212
seed-user-27	seed-post-042	2026-09-23 23:31:50.213
seed-user-28	seed-post-042	2026-09-23 23:31:50.213
seed-user-23	seed-post-043	2026-09-23 23:31:50.215
seed-user-24	seed-post-043	2026-09-23 23:31:50.215
seed-user-25	seed-post-043	2026-09-23 23:31:50.215
seed-user-26	seed-post-043	2026-09-23 23:31:50.215
seed-user-27	seed-post-043	2026-09-23 23:31:50.215
seed-user-28	seed-post-043	2026-09-23 23:31:50.216
seed-user-29	seed-post-043	2026-09-23 23:31:50.216
seed-user-0	seed-post-043	2026-09-23 23:31:50.216
seed-user-24	seed-post-044	2026-09-23 23:31:50.218
seed-user-25	seed-post-044	2026-09-23 23:31:50.218
seed-user-26	seed-post-044	2026-09-23 23:31:50.218
seed-user-27	seed-post-044	2026-09-23 23:31:50.218
seed-user-28	seed-post-044	2026-09-23 23:31:50.219
seed-user-29	seed-post-044	2026-09-23 23:31:50.219
seed-user-0	seed-post-044	2026-09-23 23:31:50.219
seed-user-1	seed-post-044	2026-09-23 23:31:50.219
seed-user-2	seed-post-044	2026-09-23 23:31:50.219
seed-user-25	seed-post-045	2026-09-23 23:31:50.222
seed-user-26	seed-post-045	2026-09-23 23:31:50.222
seed-user-27	seed-post-045	2026-09-23 23:31:50.222
seed-user-28	seed-post-045	2026-09-23 23:31:50.222
seed-user-29	seed-post-045	2026-09-23 23:31:50.223
seed-user-0	seed-post-045	2026-09-23 23:31:50.223
seed-user-1	seed-post-045	2026-09-23 23:31:50.223
seed-user-2	seed-post-045	2026-09-23 23:31:50.223
seed-user-3	seed-post-045	2026-09-23 23:31:50.223
seed-user-4	seed-post-045	2026-09-23 23:31:50.224
seed-user-26	seed-post-046	2026-09-23 23:31:50.225
seed-user-27	seed-post-046	2026-09-23 23:31:50.226
seed-user-28	seed-post-046	2026-09-23 23:31:50.226
seed-user-29	seed-post-046	2026-09-23 23:31:50.226
seed-user-0	seed-post-046	2026-09-23 23:31:50.227
seed-user-1	seed-post-046	2026-09-23 23:31:50.227
seed-user-2	seed-post-046	2026-09-23 23:31:50.227
seed-user-3	seed-post-046	2026-09-23 23:31:50.227
seed-user-4	seed-post-046	2026-09-23 23:31:50.227
seed-user-5	seed-post-046	2026-09-23 23:31:50.228
seed-user-6	seed-post-046	2026-09-23 23:31:50.228
seed-user-27	seed-post-047	2026-09-23 23:31:50.23
seed-user-28	seed-post-047	2026-09-23 23:31:50.23
seed-user-29	seed-post-047	2026-09-23 23:31:50.231
seed-user-0	seed-post-047	2026-09-23 23:31:50.231
seed-user-1	seed-post-047	2026-09-23 23:31:50.231
seed-user-2	seed-post-047	2026-09-23 23:31:50.231
seed-user-3	seed-post-047	2026-09-23 23:31:50.232
seed-user-4	seed-post-047	2026-09-23 23:31:50.232
seed-user-5	seed-post-047	2026-09-23 23:31:50.232
seed-user-6	seed-post-047	2026-09-23 23:31:50.232
seed-user-7	seed-post-047	2026-09-23 23:31:50.232
seed-user-8	seed-post-047	2026-09-23 23:31:50.233
seed-user-28	seed-post-048	2026-09-23 23:31:50.234
seed-user-29	seed-post-048	2026-09-23 23:31:50.234
seed-user-0	seed-post-048	2026-09-23 23:31:50.235
seed-user-1	seed-post-048	2026-09-23 23:31:50.235
seed-user-2	seed-post-048	2026-09-23 23:31:50.235
seed-user-3	seed-post-048	2026-09-23 23:31:50.235
seed-user-4	seed-post-048	2026-09-23 23:31:50.235
seed-user-5	seed-post-048	2026-09-23 23:31:50.236
seed-user-6	seed-post-048	2026-09-23 23:31:50.236
seed-user-7	seed-post-048	2026-09-23 23:31:50.236
seed-user-8	seed-post-048	2026-09-23 23:31:50.236
seed-user-9	seed-post-048	2026-09-23 23:31:50.237
seed-user-10	seed-post-048	2026-09-23 23:31:50.237
seed-user-29	seed-post-049	2026-09-23 23:31:50.238
seed-user-0	seed-post-049	2026-09-23 23:31:50.239
seed-user-1	seed-post-049	2026-09-23 23:31:50.239
seed-user-2	seed-post-049	2026-09-23 23:31:50.239
seed-user-3	seed-post-049	2026-09-23 23:31:50.239
seed-user-4	seed-post-049	2026-09-23 23:31:50.239
seed-user-5	seed-post-049	2026-09-23 23:31:50.24
seed-user-6	seed-post-049	2026-09-23 23:31:50.24
seed-user-7	seed-post-049	2026-09-23 23:31:50.24
seed-user-8	seed-post-049	2026-09-23 23:31:50.24
seed-user-9	seed-post-049	2026-09-23 23:31:50.24
seed-user-10	seed-post-049	2026-09-23 23:31:50.24
seed-user-11	seed-post-049	2026-09-23 23:31:50.24
seed-user-12	seed-post-049	2026-09-23 23:31:50.241
seed-user-0	seed-post-050	2026-09-23 23:31:50.242
seed-user-1	seed-post-050	2026-09-23 23:31:50.242
seed-user-2	seed-post-050	2026-09-23 23:31:50.242
seed-user-3	seed-post-050	2026-09-23 23:31:50.242
seed-user-4	seed-post-050	2026-09-23 23:31:50.243
seed-user-5	seed-post-050	2026-09-23 23:31:50.243
seed-user-6	seed-post-050	2026-09-23 23:31:50.243
seed-user-7	seed-post-050	2026-09-23 23:31:50.244
seed-user-8	seed-post-050	2026-09-23 23:31:50.244
seed-user-9	seed-post-050	2026-09-23 23:31:50.244
seed-user-10	seed-post-050	2026-09-23 23:31:50.244
seed-user-11	seed-post-050	2026-09-23 23:31:50.245
seed-user-12	seed-post-050	2026-09-23 23:31:50.245
seed-user-13	seed-post-050	2026-09-23 23:31:50.245
seed-user-14	seed-post-050	2026-09-23 23:31:50.245
seed-user-1	seed-post-051	2026-09-23 23:31:50.247
seed-user-2	seed-post-051	2026-09-23 23:31:50.248
seed-user-3	seed-post-051	2026-09-23 23:31:50.248
seed-user-4	seed-post-051	2026-09-23 23:31:50.248
seed-user-5	seed-post-051	2026-09-23 23:31:50.248
seed-user-6	seed-post-051	2026-09-23 23:31:50.249
seed-user-7	seed-post-051	2026-09-23 23:31:50.249
seed-user-8	seed-post-051	2026-09-23 23:31:50.249
seed-user-9	seed-post-051	2026-09-23 23:31:50.249
seed-user-10	seed-post-051	2026-09-23 23:31:50.249
seed-user-11	seed-post-051	2026-09-23 23:31:50.25
seed-user-12	seed-post-051	2026-09-23 23:31:50.25
seed-user-13	seed-post-051	2026-09-23 23:31:50.25
seed-user-14	seed-post-051	2026-09-23 23:31:50.25
seed-user-15	seed-post-051	2026-09-23 23:31:50.251
seed-user-16	seed-post-051	2026-09-23 23:31:50.251
seed-user-2	seed-post-052	2026-09-23 23:31:50.253
seed-user-3	seed-post-052	2026-09-23 23:31:50.253
seed-user-4	seed-post-052	2026-09-23 23:31:50.253
seed-user-5	seed-post-052	2026-09-23 23:31:50.254
seed-user-6	seed-post-052	2026-09-23 23:31:50.254
seed-user-7	seed-post-052	2026-09-23 23:31:50.254
seed-user-8	seed-post-052	2026-09-23 23:31:50.254
seed-user-9	seed-post-052	2026-09-23 23:31:50.254
seed-user-10	seed-post-052	2026-09-23 23:31:50.255
seed-user-11	seed-post-052	2026-09-23 23:31:50.255
seed-user-12	seed-post-052	2026-09-23 23:31:50.255
seed-user-13	seed-post-052	2026-09-23 23:31:50.255
seed-user-14	seed-post-052	2026-09-23 23:31:50.255
seed-user-15	seed-post-052	2026-09-23 23:31:50.255
seed-user-16	seed-post-052	2026-09-23 23:31:50.256
seed-user-17	seed-post-052	2026-09-23 23:31:50.256
seed-user-18	seed-post-052	2026-09-23 23:31:50.256
seed-user-3	seed-post-053	2026-09-23 23:31:50.258
seed-user-4	seed-post-053	2026-09-23 23:31:50.258
seed-user-5	seed-post-053	2026-09-23 23:31:50.258
seed-user-6	seed-post-053	2026-09-23 23:31:50.258
seed-user-7	seed-post-053	2026-09-23 23:31:50.258
seed-user-8	seed-post-053	2026-09-23 23:31:50.258
seed-user-9	seed-post-053	2026-09-23 23:31:50.259
seed-user-10	seed-post-053	2026-09-23 23:31:50.259
seed-user-11	seed-post-053	2026-09-23 23:31:50.259
seed-user-12	seed-post-053	2026-09-23 23:31:50.259
seed-user-13	seed-post-053	2026-09-23 23:31:50.259
seed-user-14	seed-post-053	2026-09-23 23:31:50.259
seed-user-15	seed-post-053	2026-09-23 23:31:50.26
seed-user-16	seed-post-053	2026-09-23 23:31:50.26
seed-user-17	seed-post-053	2026-09-23 23:31:50.26
seed-user-18	seed-post-053	2026-09-23 23:31:50.261
seed-user-19	seed-post-053	2026-09-23 23:31:50.261
seed-user-20	seed-post-053	2026-09-23 23:31:50.261
seed-user-4	seed-post-054	2026-09-23 23:31:50.263
seed-user-5	seed-post-054	2026-09-23 23:31:50.263
seed-user-6	seed-post-054	2026-09-23 23:31:50.263
seed-user-7	seed-post-054	2026-09-23 23:31:50.263
seed-user-8	seed-post-054	2026-09-23 23:31:50.263
seed-user-9	seed-post-054	2026-09-23 23:31:50.264
seed-user-10	seed-post-054	2026-09-23 23:31:50.264
seed-user-11	seed-post-054	2026-09-23 23:31:50.264
seed-user-12	seed-post-054	2026-09-23 23:31:50.264
seed-user-13	seed-post-054	2026-09-23 23:31:50.265
seed-user-14	seed-post-054	2026-09-23 23:31:50.265
seed-user-15	seed-post-054	2026-09-23 23:31:50.265
seed-user-16	seed-post-054	2026-09-23 23:31:50.265
seed-user-17	seed-post-054	2026-09-23 23:31:50.266
seed-user-18	seed-post-054	2026-09-23 23:31:50.266
seed-user-19	seed-post-054	2026-09-23 23:31:50.266
seed-user-20	seed-post-054	2026-09-23 23:31:50.266
seed-user-21	seed-post-054	2026-09-23 23:31:50.266
seed-user-22	seed-post-054	2026-09-23 23:31:50.267
seed-user-5	seed-post-055	2026-09-23 23:31:50.269
seed-user-6	seed-post-055	2026-09-23 23:31:50.269
seed-user-7	seed-post-055	2026-09-23 23:31:50.27
seed-user-8	seed-post-055	2026-09-23 23:31:50.27
seed-user-9	seed-post-055	2026-09-23 23:31:50.27
seed-user-10	seed-post-055	2026-09-23 23:31:50.27
seed-user-11	seed-post-055	2026-09-23 23:31:50.27
seed-user-12	seed-post-055	2026-09-23 23:31:50.27
seed-user-13	seed-post-055	2026-09-23 23:31:50.271
seed-user-14	seed-post-055	2026-09-23 23:31:50.271
seed-user-15	seed-post-055	2026-09-23 23:31:50.271
seed-user-16	seed-post-055	2026-09-23 23:31:50.271
seed-user-17	seed-post-055	2026-09-23 23:31:50.271
seed-user-18	seed-post-055	2026-09-23 23:31:50.271
seed-user-19	seed-post-055	2026-09-23 23:31:50.272
seed-user-20	seed-post-055	2026-09-23 23:31:50.272
seed-user-21	seed-post-055	2026-09-23 23:31:50.272
seed-user-22	seed-post-055	2026-09-23 23:31:50.272
seed-user-23	seed-post-055	2026-09-23 23:31:50.272
seed-user-24	seed-post-055	2026-09-23 23:31:50.272
seed-user-6	seed-post-056	2026-09-23 23:31:50.274
seed-user-7	seed-post-056	2026-09-23 23:31:50.274
seed-user-8	seed-post-056	2026-09-23 23:31:50.274
seed-user-9	seed-post-056	2026-09-23 23:31:50.274
seed-user-10	seed-post-056	2026-09-23 23:31:50.274
seed-user-11	seed-post-056	2026-09-23 23:31:50.275
seed-user-12	seed-post-056	2026-09-23 23:31:50.275
seed-user-13	seed-post-056	2026-09-23 23:31:50.275
seed-user-14	seed-post-056	2026-09-23 23:31:50.275
seed-user-15	seed-post-056	2026-09-23 23:31:50.275
seed-user-16	seed-post-056	2026-09-23 23:31:50.275
seed-user-17	seed-post-056	2026-09-23 23:31:50.276
seed-user-18	seed-post-056	2026-09-23 23:31:50.276
seed-user-19	seed-post-056	2026-09-23 23:31:50.276
seed-user-20	seed-post-056	2026-09-23 23:31:50.276
seed-user-21	seed-post-056	2026-09-23 23:31:50.277
seed-user-22	seed-post-056	2026-09-23 23:31:50.277
seed-user-23	seed-post-056	2026-09-23 23:31:50.277
seed-user-24	seed-post-056	2026-09-23 23:31:50.277
seed-user-25	seed-post-056	2026-09-23 23:31:50.277
seed-user-26	seed-post-056	2026-09-23 23:31:50.278
seed-user-7	seed-post-057	2026-09-23 23:31:50.279
seed-user-8	seed-post-057	2026-09-23 23:31:50.28
seed-user-9	seed-post-057	2026-09-23 23:31:50.28
seed-user-8	seed-post-058	2026-09-23 23:31:50.281
seed-user-9	seed-post-058	2026-09-23 23:31:50.282
seed-user-10	seed-post-058	2026-09-23 23:31:50.282
seed-user-11	seed-post-058	2026-09-23 23:31:50.282
seed-user-9	seed-post-059	2026-09-23 23:31:50.283
seed-user-10	seed-post-059	2026-09-23 23:31:50.284
seed-user-11	seed-post-059	2026-09-23 23:31:50.284
seed-user-12	seed-post-059	2026-09-23 23:31:50.284
seed-user-13	seed-post-059	2026-09-23 23:31:50.284
seed-user-10	seed-post-060	2026-09-23 23:31:50.286
seed-user-11	seed-post-060	2026-09-23 23:31:50.286
seed-user-12	seed-post-060	2026-09-23 23:31:50.286
seed-user-13	seed-post-060	2026-09-23 23:31:50.286
seed-user-14	seed-post-060	2026-09-23 23:31:50.286
seed-user-15	seed-post-060	2026-09-23 23:31:50.287
seed-user-11	seed-post-061	2026-09-23 23:31:50.288
seed-user-12	seed-post-061	2026-09-23 23:31:50.289
seed-user-13	seed-post-061	2026-09-23 23:31:50.289
seed-user-14	seed-post-061	2026-09-23 23:31:50.289
seed-user-15	seed-post-061	2026-09-23 23:31:50.289
seed-user-16	seed-post-061	2026-09-23 23:31:50.289
seed-user-17	seed-post-061	2026-09-23 23:31:50.289
seed-user-12	seed-post-062	2026-09-23 23:31:50.291
seed-user-13	seed-post-062	2026-09-23 23:31:50.291
seed-user-14	seed-post-062	2026-09-23 23:31:50.291
seed-user-15	seed-post-062	2026-09-23 23:31:50.291
seed-user-16	seed-post-062	2026-09-23 23:31:50.291
seed-user-17	seed-post-062	2026-09-23 23:31:50.292
seed-user-18	seed-post-062	2026-09-23 23:31:50.292
seed-user-19	seed-post-062	2026-09-23 23:31:50.292
seed-user-13	seed-post-063	2026-09-23 23:31:50.294
seed-user-14	seed-post-063	2026-09-23 23:31:50.294
seed-user-15	seed-post-063	2026-09-23 23:31:50.294
seed-user-16	seed-post-063	2026-09-23 23:31:50.294
seed-user-17	seed-post-063	2026-09-23 23:31:50.294
seed-user-18	seed-post-063	2026-09-23 23:31:50.295
seed-user-19	seed-post-063	2026-09-23 23:31:50.295
seed-user-20	seed-post-063	2026-09-23 23:31:50.295
seed-user-21	seed-post-063	2026-09-23 23:31:50.295
seed-user-14	seed-post-064	2026-09-23 23:31:50.297
seed-user-15	seed-post-064	2026-09-23 23:31:50.297
seed-user-16	seed-post-064	2026-09-23 23:31:50.297
seed-user-17	seed-post-064	2026-09-23 23:31:50.297
seed-user-18	seed-post-064	2026-09-23 23:31:50.298
seed-user-19	seed-post-064	2026-09-23 23:31:50.298
seed-user-20	seed-post-064	2026-09-23 23:31:50.298
seed-user-21	seed-post-064	2026-09-23 23:31:50.298
seed-user-22	seed-post-064	2026-09-23 23:31:50.299
seed-user-23	seed-post-064	2026-09-23 23:31:50.299
seed-user-15	seed-post-065	2026-09-23 23:31:50.301
seed-user-16	seed-post-065	2026-09-23 23:31:50.301
seed-user-17	seed-post-065	2026-09-23 23:31:50.302
seed-user-18	seed-post-065	2026-09-23 23:31:50.302
seed-user-19	seed-post-065	2026-09-23 23:31:50.302
seed-user-20	seed-post-065	2026-09-23 23:31:50.302
seed-user-21	seed-post-065	2026-09-23 23:31:50.303
seed-user-22	seed-post-065	2026-09-23 23:31:50.303
seed-user-23	seed-post-065	2026-09-23 23:31:50.303
seed-user-24	seed-post-065	2026-09-23 23:31:50.303
seed-user-25	seed-post-065	2026-09-23 23:31:50.304
seed-user-16	seed-post-066	2026-09-23 23:31:50.305
seed-user-17	seed-post-066	2026-09-23 23:31:50.305
seed-user-18	seed-post-066	2026-09-23 23:31:50.305
seed-user-19	seed-post-066	2026-09-23 23:31:50.305
seed-user-20	seed-post-066	2026-09-23 23:31:50.306
seed-user-21	seed-post-066	2026-09-23 23:31:50.306
seed-user-22	seed-post-066	2026-09-23 23:31:50.306
seed-user-23	seed-post-066	2026-09-23 23:31:50.306
seed-user-24	seed-post-066	2026-09-23 23:31:50.306
seed-user-25	seed-post-066	2026-09-23 23:31:50.307
seed-user-26	seed-post-066	2026-09-23 23:31:50.307
seed-user-27	seed-post-066	2026-09-23 23:31:50.307
seed-user-17	seed-post-067	2026-09-23 23:31:50.309
seed-user-18	seed-post-067	2026-09-23 23:31:50.309
seed-user-19	seed-post-067	2026-09-23 23:31:50.309
seed-user-20	seed-post-067	2026-09-23 23:31:50.309
seed-user-21	seed-post-067	2026-09-23 23:31:50.309
seed-user-22	seed-post-067	2026-09-23 23:31:50.31
seed-user-23	seed-post-067	2026-09-23 23:31:50.31
seed-user-24	seed-post-067	2026-09-23 23:31:50.31
seed-user-25	seed-post-067	2026-09-23 23:31:50.31
seed-user-26	seed-post-067	2026-09-23 23:31:50.31
seed-user-27	seed-post-067	2026-09-23 23:31:50.31
seed-user-28	seed-post-067	2026-09-23 23:31:50.311
seed-user-29	seed-post-067	2026-09-23 23:31:50.311
seed-user-18	seed-post-068	2026-09-23 23:31:50.312
seed-user-19	seed-post-068	2026-09-23 23:31:50.312
seed-user-20	seed-post-068	2026-09-23 23:31:50.313
seed-user-21	seed-post-068	2026-09-23 23:31:50.313
seed-user-22	seed-post-068	2026-09-23 23:31:50.313
seed-user-23	seed-post-068	2026-09-23 23:31:50.313
seed-user-24	seed-post-068	2026-09-23 23:31:50.314
seed-user-25	seed-post-068	2026-09-23 23:31:50.314
seed-user-26	seed-post-068	2026-09-23 23:31:50.314
seed-user-27	seed-post-068	2026-09-23 23:31:50.315
seed-user-28	seed-post-068	2026-09-23 23:31:50.315
seed-user-29	seed-post-068	2026-09-23 23:31:50.315
seed-user-0	seed-post-068	2026-09-23 23:31:50.315
seed-user-1	seed-post-068	2026-09-23 23:31:50.316
seed-user-19	seed-post-069	2026-09-23 23:31:50.318
seed-user-20	seed-post-069	2026-09-23 23:31:50.318
seed-user-21	seed-post-069	2026-09-23 23:31:50.318
seed-user-22	seed-post-069	2026-09-23 23:31:50.318
seed-user-23	seed-post-069	2026-09-23 23:31:50.319
seed-user-24	seed-post-069	2026-09-23 23:31:50.319
seed-user-25	seed-post-069	2026-09-23 23:31:50.319
seed-user-26	seed-post-069	2026-09-23 23:31:50.319
seed-user-27	seed-post-069	2026-09-23 23:31:50.32
seed-user-28	seed-post-069	2026-09-23 23:31:50.32
seed-user-29	seed-post-069	2026-09-23 23:31:50.32
seed-user-0	seed-post-069	2026-09-23 23:31:50.32
seed-user-1	seed-post-069	2026-09-23 23:31:50.32
seed-user-2	seed-post-069	2026-09-23 23:31:50.321
seed-user-3	seed-post-069	2026-09-23 23:31:50.321
seed-user-20	seed-post-070	2026-09-23 23:31:50.323
seed-user-21	seed-post-070	2026-09-23 23:31:50.323
seed-user-22	seed-post-070	2026-09-23 23:31:50.324
seed-user-23	seed-post-070	2026-09-23 23:31:50.324
seed-user-24	seed-post-070	2026-09-23 23:31:50.324
seed-user-25	seed-post-070	2026-09-23 23:31:50.324
seed-user-26	seed-post-070	2026-09-23 23:31:50.325
seed-user-27	seed-post-070	2026-09-23 23:31:50.325
seed-user-28	seed-post-070	2026-09-23 23:31:50.325
seed-user-29	seed-post-070	2026-09-23 23:31:50.325
seed-user-0	seed-post-070	2026-09-23 23:31:50.325
seed-user-1	seed-post-070	2026-09-23 23:31:50.326
seed-user-2	seed-post-070	2026-09-23 23:31:50.326
seed-user-3	seed-post-070	2026-09-23 23:31:50.326
seed-user-4	seed-post-070	2026-09-23 23:31:50.326
seed-user-5	seed-post-070	2026-09-23 23:31:50.327
seed-user-21	seed-post-071	2026-09-23 23:31:50.328
seed-user-22	seed-post-071	2026-09-23 23:31:50.329
seed-user-23	seed-post-071	2026-09-23 23:31:50.329
seed-user-24	seed-post-071	2026-09-23 23:31:50.329
seed-user-25	seed-post-071	2026-09-23 23:31:50.329
seed-user-26	seed-post-071	2026-09-23 23:31:50.329
seed-user-27	seed-post-071	2026-09-23 23:31:50.329
seed-user-28	seed-post-071	2026-09-23 23:31:50.33
seed-user-29	seed-post-071	2026-09-23 23:31:50.33
seed-user-0	seed-post-071	2026-09-23 23:31:50.33
seed-user-1	seed-post-071	2026-09-23 23:31:50.331
seed-user-2	seed-post-071	2026-09-23 23:31:50.331
seed-user-3	seed-post-071	2026-09-23 23:31:50.331
seed-user-4	seed-post-071	2026-09-23 23:31:50.331
seed-user-5	seed-post-071	2026-09-23 23:31:50.331
seed-user-6	seed-post-071	2026-09-23 23:31:50.331
seed-user-7	seed-post-071	2026-09-23 23:31:50.332
seed-user-22	seed-post-072	2026-09-23 23:31:50.333
seed-user-23	seed-post-072	2026-09-23 23:31:50.333
seed-user-24	seed-post-072	2026-09-23 23:31:50.333
seed-user-25	seed-post-072	2026-09-23 23:31:50.333
seed-user-26	seed-post-072	2026-09-23 23:31:50.333
seed-user-27	seed-post-072	2026-09-23 23:31:50.334
seed-user-28	seed-post-072	2026-09-23 23:31:50.334
seed-user-29	seed-post-072	2026-09-23 23:31:50.334
seed-user-0	seed-post-072	2026-09-23 23:31:50.334
seed-user-1	seed-post-072	2026-09-23 23:31:50.334
seed-user-2	seed-post-072	2026-09-23 23:31:50.335
seed-user-3	seed-post-072	2026-09-23 23:31:50.335
seed-user-4	seed-post-072	2026-09-23 23:31:50.335
seed-user-5	seed-post-072	2026-09-23 23:31:50.335
seed-user-6	seed-post-072	2026-09-23 23:31:50.335
seed-user-7	seed-post-072	2026-09-23 23:31:50.336
seed-user-8	seed-post-072	2026-09-23 23:31:50.336
seed-user-9	seed-post-072	2026-09-23 23:31:50.336
seed-user-23	seed-post-073	2026-09-23 23:31:50.339
seed-user-24	seed-post-073	2026-09-23 23:31:50.339
seed-user-25	seed-post-073	2026-09-23 23:31:50.339
seed-user-26	seed-post-073	2026-09-23 23:31:50.339
seed-user-27	seed-post-073	2026-09-23 23:31:50.339
seed-user-28	seed-post-073	2026-09-23 23:31:50.34
seed-user-29	seed-post-073	2026-09-23 23:31:50.34
seed-user-0	seed-post-073	2026-09-23 23:31:50.34
seed-user-1	seed-post-073	2026-09-23 23:31:50.34
seed-user-2	seed-post-073	2026-09-23 23:31:50.341
seed-user-3	seed-post-073	2026-09-23 23:31:50.341
seed-user-4	seed-post-073	2026-09-23 23:31:50.341
seed-user-5	seed-post-073	2026-09-23 23:31:50.341
seed-user-6	seed-post-073	2026-09-23 23:31:50.342
seed-user-7	seed-post-073	2026-09-23 23:31:50.342
seed-user-8	seed-post-073	2026-09-23 23:31:50.342
seed-user-9	seed-post-073	2026-09-23 23:31:50.342
seed-user-10	seed-post-073	2026-09-23 23:31:50.342
seed-user-11	seed-post-073	2026-09-23 23:31:50.343
seed-user-24	seed-post-074	2026-09-23 23:31:50.344
seed-user-25	seed-post-074	2026-09-23 23:31:50.344
seed-user-26	seed-post-074	2026-09-23 23:31:50.344
seed-user-27	seed-post-074	2026-09-23 23:31:50.345
seed-user-28	seed-post-074	2026-09-23 23:31:50.345
seed-user-29	seed-post-074	2026-09-23 23:31:50.345
seed-user-0	seed-post-074	2026-09-23 23:31:50.345
seed-user-1	seed-post-074	2026-09-23 23:31:50.345
seed-user-2	seed-post-074	2026-09-23 23:31:50.345
seed-user-3	seed-post-074	2026-09-23 23:31:50.346
seed-user-4	seed-post-074	2026-09-23 23:31:50.346
seed-user-5	seed-post-074	2026-09-23 23:31:50.346
seed-user-6	seed-post-074	2026-09-23 23:31:50.346
seed-user-7	seed-post-074	2026-09-23 23:31:50.346
seed-user-8	seed-post-074	2026-09-23 23:31:50.347
seed-user-9	seed-post-074	2026-09-23 23:31:50.347
seed-user-10	seed-post-074	2026-09-23 23:31:50.347
seed-user-11	seed-post-074	2026-09-23 23:31:50.347
seed-user-12	seed-post-074	2026-09-23 23:31:50.347
seed-user-13	seed-post-074	2026-09-23 23:31:50.347
seed-user-25	seed-post-075	2026-09-23 23:31:50.349
seed-user-26	seed-post-075	2026-09-23 23:31:50.349
seed-user-27	seed-post-075	2026-09-23 23:31:50.35
seed-user-28	seed-post-075	2026-09-23 23:31:50.35
seed-user-29	seed-post-075	2026-09-23 23:31:50.35
seed-user-0	seed-post-075	2026-09-23 23:31:50.35
seed-user-1	seed-post-075	2026-09-23 23:31:50.35
seed-user-2	seed-post-075	2026-09-23 23:31:50.35
seed-user-3	seed-post-075	2026-09-23 23:31:50.35
seed-user-4	seed-post-075	2026-09-23 23:31:50.351
seed-user-5	seed-post-075	2026-09-23 23:31:50.351
seed-user-6	seed-post-075	2026-09-23 23:31:50.351
seed-user-7	seed-post-075	2026-09-23 23:31:50.351
seed-user-8	seed-post-075	2026-09-23 23:31:50.352
seed-user-9	seed-post-075	2026-09-23 23:31:50.352
seed-user-10	seed-post-075	2026-09-23 23:31:50.352
seed-user-11	seed-post-075	2026-09-23 23:31:50.352
seed-user-12	seed-post-075	2026-09-23 23:31:50.353
seed-user-13	seed-post-075	2026-09-23 23:31:50.353
seed-user-14	seed-post-075	2026-09-23 23:31:50.353
seed-user-15	seed-post-075	2026-09-23 23:31:50.353
seed-user-26	seed-post-076	2026-09-23 23:31:50.355
seed-user-27	seed-post-076	2026-09-23 23:31:50.355
seed-user-28	seed-post-076	2026-09-23 23:31:50.356
seed-user-27	seed-post-077	2026-09-23 23:31:50.358
seed-user-28	seed-post-077	2026-09-23 23:31:50.358
seed-user-29	seed-post-077	2026-09-23 23:31:50.358
seed-user-0	seed-post-077	2026-09-23 23:31:50.358
seed-user-28	seed-post-078	2026-09-23 23:31:50.36
seed-user-29	seed-post-078	2026-09-23 23:31:50.36
seed-user-0	seed-post-078	2026-09-23 23:31:50.36
seed-user-1	seed-post-078	2026-09-23 23:31:50.361
seed-user-2	seed-post-078	2026-09-23 23:31:50.361
seed-user-29	seed-post-079	2026-09-23 23:31:50.363
seed-user-0	seed-post-079	2026-09-23 23:31:50.363
seed-user-1	seed-post-079	2026-09-23 23:31:50.364
seed-user-2	seed-post-079	2026-09-23 23:31:50.364
seed-user-3	seed-post-079	2026-09-23 23:31:50.364
seed-user-4	seed-post-079	2026-09-23 23:31:50.364
seed-user-0	seed-post-080	2026-09-23 23:31:50.366
seed-user-1	seed-post-080	2026-09-23 23:31:50.366
seed-user-2	seed-post-080	2026-09-23 23:31:50.366
seed-user-3	seed-post-080	2026-09-23 23:31:50.367
seed-user-4	seed-post-080	2026-09-23 23:31:50.367
seed-user-5	seed-post-080	2026-09-23 23:31:50.367
seed-user-6	seed-post-080	2026-09-23 23:31:50.367
seed-user-1	seed-post-081	2026-09-23 23:31:50.369
seed-user-2	seed-post-081	2026-09-23 23:31:50.37
seed-user-3	seed-post-081	2026-09-23 23:31:50.37
seed-user-4	seed-post-081	2026-09-23 23:31:50.37
seed-user-5	seed-post-081	2026-09-23 23:31:50.37
seed-user-6	seed-post-081	2026-09-23 23:31:50.371
seed-user-7	seed-post-081	2026-09-23 23:31:50.371
seed-user-8	seed-post-081	2026-09-23 23:31:50.371
seed-user-2	seed-post-082	2026-09-23 23:31:50.373
seed-user-3	seed-post-082	2026-09-23 23:31:50.373
seed-user-4	seed-post-082	2026-09-23 23:31:50.373
seed-user-5	seed-post-082	2026-09-23 23:31:50.374
seed-user-6	seed-post-082	2026-09-23 23:31:50.374
seed-user-7	seed-post-082	2026-09-23 23:31:50.374
seed-user-8	seed-post-082	2026-09-23 23:31:50.374
seed-user-9	seed-post-082	2026-09-23 23:31:50.375
seed-user-10	seed-post-082	2026-09-23 23:31:50.375
seed-user-3	seed-post-083	2026-09-23 23:31:50.377
seed-user-4	seed-post-083	2026-09-23 23:31:50.377
seed-user-5	seed-post-083	2026-09-23 23:31:50.377
seed-user-6	seed-post-083	2026-09-23 23:31:50.378
seed-user-7	seed-post-083	2026-09-23 23:31:50.378
seed-user-8	seed-post-083	2026-09-23 23:31:50.379
seed-user-9	seed-post-083	2026-09-23 23:31:50.379
seed-user-10	seed-post-083	2026-09-23 23:31:50.379
seed-user-11	seed-post-083	2026-09-23 23:31:50.379
seed-user-12	seed-post-083	2026-09-23 23:31:50.38
seed-user-4	seed-post-084	2026-09-23 23:31:50.382
seed-user-5	seed-post-084	2026-09-23 23:31:50.382
seed-user-6	seed-post-084	2026-09-23 23:31:50.382
seed-user-7	seed-post-084	2026-09-23 23:31:50.382
seed-user-8	seed-post-084	2026-09-23 23:31:50.383
seed-user-9	seed-post-084	2026-09-23 23:31:50.383
seed-user-10	seed-post-084	2026-09-23 23:31:50.383
seed-user-11	seed-post-084	2026-09-23 23:31:50.383
seed-user-12	seed-post-084	2026-09-23 23:31:50.384
seed-user-13	seed-post-084	2026-09-23 23:31:50.384
seed-user-14	seed-post-084	2026-09-23 23:31:50.384
seed-user-5	seed-post-085	2026-09-23 23:31:50.386
seed-user-6	seed-post-085	2026-09-23 23:31:50.387
seed-user-7	seed-post-085	2026-09-23 23:31:50.387
seed-user-8	seed-post-085	2026-09-23 23:31:50.387
seed-user-9	seed-post-085	2026-09-23 23:31:50.387
seed-user-10	seed-post-085	2026-09-23 23:31:50.388
seed-user-11	seed-post-085	2026-09-23 23:31:50.388
seed-user-12	seed-post-085	2026-09-23 23:31:50.388
seed-user-13	seed-post-085	2026-09-23 23:31:50.388
seed-user-14	seed-post-085	2026-09-23 23:31:50.389
seed-user-15	seed-post-085	2026-09-23 23:31:50.389
seed-user-16	seed-post-085	2026-09-23 23:31:50.389
seed-user-6	seed-post-086	2026-09-23 23:31:50.391
seed-user-7	seed-post-086	2026-09-23 23:31:50.391
seed-user-8	seed-post-086	2026-09-23 23:31:50.391
seed-user-9	seed-post-086	2026-09-23 23:31:50.392
seed-user-10	seed-post-086	2026-09-23 23:31:50.392
seed-user-11	seed-post-086	2026-09-23 23:31:50.392
seed-user-12	seed-post-086	2026-09-23 23:31:50.392
seed-user-13	seed-post-086	2026-09-23 23:31:50.392
seed-user-14	seed-post-086	2026-09-23 23:31:50.393
seed-user-15	seed-post-086	2026-09-23 23:31:50.393
seed-user-16	seed-post-086	2026-09-23 23:31:50.393
seed-user-17	seed-post-086	2026-09-23 23:31:50.393
seed-user-18	seed-post-086	2026-09-23 23:31:50.394
seed-user-7	seed-post-087	2026-09-23 23:31:50.396
seed-user-8	seed-post-087	2026-09-23 23:31:50.396
seed-user-9	seed-post-087	2026-09-23 23:31:50.396
seed-user-10	seed-post-087	2026-09-23 23:31:50.397
seed-user-11	seed-post-087	2026-09-23 23:31:50.397
seed-user-12	seed-post-087	2026-09-23 23:31:50.397
seed-user-13	seed-post-087	2026-09-23 23:31:50.397
seed-user-14	seed-post-087	2026-09-23 23:31:50.397
seed-user-15	seed-post-087	2026-09-23 23:31:50.398
seed-user-16	seed-post-087	2026-09-23 23:31:50.398
seed-user-17	seed-post-087	2026-09-23 23:31:50.398
seed-user-18	seed-post-087	2026-09-23 23:31:50.398
seed-user-19	seed-post-087	2026-09-23 23:31:50.399
seed-user-20	seed-post-087	2026-09-23 23:31:50.399
seed-user-8	seed-post-088	2026-09-23 23:31:50.401
seed-user-9	seed-post-088	2026-09-23 23:31:50.401
seed-user-10	seed-post-088	2026-09-23 23:31:50.401
seed-user-11	seed-post-088	2026-09-23 23:31:50.401
seed-user-12	seed-post-088	2026-09-23 23:31:50.402
seed-user-13	seed-post-088	2026-09-23 23:31:50.402
seed-user-14	seed-post-088	2026-09-23 23:31:50.402
seed-user-15	seed-post-088	2026-09-23 23:31:50.402
seed-user-16	seed-post-088	2026-09-23 23:31:50.403
seed-user-17	seed-post-088	2026-09-23 23:31:50.403
seed-user-18	seed-post-088	2026-09-23 23:31:50.403
seed-user-19	seed-post-088	2026-09-23 23:31:50.403
seed-user-20	seed-post-088	2026-09-23 23:31:50.404
seed-user-21	seed-post-088	2026-09-23 23:31:50.404
seed-user-22	seed-post-088	2026-09-23 23:31:50.404
seed-user-9	seed-post-089	2026-09-23 23:31:50.406
seed-user-10	seed-post-089	2026-09-23 23:31:50.406
seed-user-11	seed-post-089	2026-09-23 23:31:50.407
seed-user-12	seed-post-089	2026-09-23 23:31:50.407
seed-user-13	seed-post-089	2026-09-23 23:31:50.407
seed-user-14	seed-post-089	2026-09-23 23:31:50.407
seed-user-15	seed-post-089	2026-09-23 23:31:50.407
seed-user-16	seed-post-089	2026-09-23 23:31:50.408
seed-user-17	seed-post-089	2026-09-23 23:31:50.408
seed-user-18	seed-post-089	2026-09-23 23:31:50.408
seed-user-19	seed-post-089	2026-09-23 23:31:50.408
seed-user-20	seed-post-089	2026-09-23 23:31:50.409
seed-user-21	seed-post-089	2026-09-23 23:31:50.409
seed-user-22	seed-post-089	2026-09-23 23:31:50.409
seed-user-23	seed-post-089	2026-09-23 23:31:50.409
seed-user-24	seed-post-089	2026-09-23 23:31:50.41
seed-user-10	seed-post-090	2026-09-23 23:31:50.411
seed-user-11	seed-post-090	2026-09-23 23:31:50.411
seed-user-12	seed-post-090	2026-09-23 23:31:50.412
seed-user-13	seed-post-090	2026-09-23 23:31:50.412
seed-user-14	seed-post-090	2026-09-23 23:31:50.412
seed-user-15	seed-post-090	2026-09-23 23:31:50.412
seed-user-16	seed-post-090	2026-09-23 23:31:50.413
seed-user-17	seed-post-090	2026-09-23 23:31:50.413
seed-user-18	seed-post-090	2026-09-23 23:31:50.413
seed-user-19	seed-post-090	2026-09-23 23:31:50.413
seed-user-20	seed-post-090	2026-09-23 23:31:50.413
seed-user-21	seed-post-090	2026-09-23 23:31:50.414
seed-user-22	seed-post-090	2026-09-23 23:31:50.414
seed-user-23	seed-post-090	2026-09-23 23:31:50.414
seed-user-24	seed-post-090	2026-09-23 23:31:50.414
seed-user-25	seed-post-090	2026-09-23 23:31:50.414
seed-user-26	seed-post-090	2026-09-23 23:31:50.415
seed-user-11	seed-post-091	2026-09-23 23:31:50.417
seed-user-12	seed-post-091	2026-09-23 23:31:50.418
seed-user-13	seed-post-091	2026-09-23 23:31:50.418
seed-user-14	seed-post-091	2026-09-23 23:31:50.418
seed-user-15	seed-post-091	2026-09-23 23:31:50.418
seed-user-16	seed-post-091	2026-09-23 23:31:50.419
seed-user-17	seed-post-091	2026-09-23 23:31:50.419
seed-user-18	seed-post-091	2026-09-23 23:31:50.419
seed-user-19	seed-post-091	2026-09-23 23:31:50.419
seed-user-20	seed-post-091	2026-09-23 23:31:50.42
seed-user-21	seed-post-091	2026-09-23 23:31:50.42
seed-user-22	seed-post-091	2026-09-23 23:31:50.42
seed-user-23	seed-post-091	2026-09-23 23:31:50.42
seed-user-24	seed-post-091	2026-09-23 23:31:50.42
seed-user-25	seed-post-091	2026-09-23 23:31:50.421
seed-user-26	seed-post-091	2026-09-23 23:31:50.421
seed-user-27	seed-post-091	2026-09-23 23:31:50.421
seed-user-28	seed-post-091	2026-09-23 23:31:50.421
seed-user-12	seed-post-092	2026-09-23 23:31:50.423
seed-user-13	seed-post-092	2026-09-23 23:31:50.423
seed-user-14	seed-post-092	2026-09-23 23:31:50.424
seed-user-15	seed-post-092	2026-09-23 23:31:50.424
seed-user-16	seed-post-092	2026-09-23 23:31:50.424
seed-user-17	seed-post-092	2026-09-23 23:31:50.424
seed-user-18	seed-post-092	2026-09-23 23:31:50.425
seed-user-19	seed-post-092	2026-09-23 23:31:50.425
seed-user-20	seed-post-092	2026-09-23 23:31:50.425
seed-user-21	seed-post-092	2026-09-23 23:31:50.425
seed-user-22	seed-post-092	2026-09-23 23:31:50.425
seed-user-23	seed-post-092	2026-09-23 23:31:50.426
seed-user-24	seed-post-092	2026-09-23 23:31:50.426
seed-user-25	seed-post-092	2026-09-23 23:31:50.426
seed-user-26	seed-post-092	2026-09-23 23:31:50.427
seed-user-27	seed-post-092	2026-09-23 23:31:50.427
seed-user-28	seed-post-092	2026-09-23 23:31:50.427
seed-user-29	seed-post-092	2026-09-23 23:31:50.428
seed-user-0	seed-post-092	2026-09-23 23:31:50.428
seed-user-13	seed-post-093	2026-09-23 23:31:50.43
seed-user-14	seed-post-093	2026-09-23 23:31:50.431
seed-user-15	seed-post-093	2026-09-23 23:31:50.431
seed-user-16	seed-post-093	2026-09-23 23:31:50.431
seed-user-17	seed-post-093	2026-09-23 23:31:50.431
seed-user-18	seed-post-093	2026-09-23 23:31:50.432
seed-user-19	seed-post-093	2026-09-23 23:31:50.432
seed-user-20	seed-post-093	2026-09-23 23:31:50.432
seed-user-21	seed-post-093	2026-09-23 23:31:50.432
seed-user-22	seed-post-093	2026-09-23 23:31:50.433
seed-user-23	seed-post-093	2026-09-23 23:31:50.433
seed-user-24	seed-post-093	2026-09-23 23:31:50.433
seed-user-25	seed-post-093	2026-09-23 23:31:50.433
seed-user-26	seed-post-093	2026-09-23 23:31:50.434
seed-user-27	seed-post-093	2026-09-23 23:31:50.434
seed-user-28	seed-post-093	2026-09-23 23:31:50.434
seed-user-29	seed-post-093	2026-09-23 23:31:50.434
seed-user-0	seed-post-093	2026-09-23 23:31:50.435
seed-user-1	seed-post-093	2026-09-23 23:31:50.435
seed-user-2	seed-post-093	2026-09-23 23:31:50.435
seed-user-14	seed-post-094	2026-09-23 23:31:50.437
seed-user-15	seed-post-094	2026-09-23 23:31:50.438
seed-user-16	seed-post-094	2026-09-23 23:31:50.438
seed-user-17	seed-post-094	2026-09-23 23:31:50.438
seed-user-18	seed-post-094	2026-09-23 23:31:50.438
seed-user-19	seed-post-094	2026-09-23 23:31:50.439
seed-user-20	seed-post-094	2026-09-23 23:31:50.439
seed-user-21	seed-post-094	2026-09-23 23:31:50.439
seed-user-22	seed-post-094	2026-09-23 23:31:50.439
seed-user-23	seed-post-094	2026-09-23 23:31:50.44
seed-user-24	seed-post-094	2026-09-23 23:31:50.44
seed-user-25	seed-post-094	2026-09-23 23:31:50.44
seed-user-26	seed-post-094	2026-09-23 23:31:50.44
seed-user-27	seed-post-094	2026-09-23 23:31:50.441
seed-user-28	seed-post-094	2026-09-23 23:31:50.441
seed-user-29	seed-post-094	2026-09-23 23:31:50.441
seed-user-0	seed-post-094	2026-09-23 23:31:50.441
seed-user-1	seed-post-094	2026-09-23 23:31:50.441
seed-user-2	seed-post-094	2026-09-23 23:31:50.442
seed-user-3	seed-post-094	2026-09-23 23:31:50.442
seed-user-4	seed-post-094	2026-09-23 23:31:50.442
seed-user-15	seed-post-095	2026-09-23 23:31:50.444
seed-user-16	seed-post-095	2026-09-23 23:31:50.445
seed-user-17	seed-post-095	2026-09-23 23:31:50.445
seed-user-16	seed-post-096	2026-09-23 23:31:50.447
seed-user-17	seed-post-096	2026-09-23 23:31:50.447
seed-user-18	seed-post-096	2026-09-23 23:31:50.447
seed-user-19	seed-post-096	2026-09-23 23:31:50.448
seed-user-17	seed-post-097	2026-09-23 23:31:50.45
seed-user-18	seed-post-097	2026-09-23 23:31:50.45
seed-user-19	seed-post-097	2026-09-23 23:31:50.45
seed-user-20	seed-post-097	2026-09-23 23:31:50.451
seed-user-21	seed-post-097	2026-09-23 23:31:50.451
seed-user-18	seed-post-098	2026-09-23 23:31:50.453
seed-user-19	seed-post-098	2026-09-23 23:31:50.453
seed-user-20	seed-post-098	2026-09-23 23:31:50.453
seed-user-21	seed-post-098	2026-09-23 23:31:50.453
seed-user-22	seed-post-098	2026-09-23 23:31:50.454
seed-user-23	seed-post-098	2026-09-23 23:31:50.454
seed-user-19	seed-post-099	2026-09-23 23:31:50.456
seed-user-20	seed-post-099	2026-09-23 23:31:50.456
seed-user-21	seed-post-099	2026-09-23 23:31:50.456
seed-user-22	seed-post-099	2026-09-23 23:31:50.457
seed-user-23	seed-post-099	2026-09-23 23:31:50.457
seed-user-24	seed-post-099	2026-09-23 23:31:50.457
seed-user-25	seed-post-099	2026-09-23 23:31:50.458
seed-user-20	seed-post-100	2026-09-23 23:31:50.46
seed-user-21	seed-post-100	2026-09-23 23:31:50.46
seed-user-22	seed-post-100	2026-09-23 23:31:50.46
seed-user-23	seed-post-100	2026-09-23 23:31:50.46
seed-user-24	seed-post-100	2026-09-23 23:31:50.461
seed-user-25	seed-post-100	2026-09-23 23:31:50.461
seed-user-26	seed-post-100	2026-09-23 23:31:50.461
seed-user-27	seed-post-100	2026-09-23 23:31:50.461
seed-user-21	seed-post-101	2026-09-23 23:31:50.464
seed-user-22	seed-post-101	2026-09-23 23:31:50.464
seed-user-23	seed-post-101	2026-09-23 23:31:50.464
seed-user-24	seed-post-101	2026-09-23 23:31:50.465
seed-user-25	seed-post-101	2026-09-23 23:31:50.465
seed-user-26	seed-post-101	2026-09-23 23:31:50.465
seed-user-27	seed-post-101	2026-09-23 23:31:50.465
seed-user-28	seed-post-101	2026-09-23 23:31:50.466
seed-user-29	seed-post-101	2026-09-23 23:31:50.466
seed-user-22	seed-post-102	2026-09-23 23:31:50.467
seed-user-23	seed-post-102	2026-09-23 23:31:50.468
seed-user-24	seed-post-102	2026-09-23 23:31:50.468
seed-user-25	seed-post-102	2026-09-23 23:31:50.468
seed-user-26	seed-post-102	2026-09-23 23:31:50.468
seed-user-27	seed-post-102	2026-09-23 23:31:50.469
seed-user-28	seed-post-102	2026-09-23 23:31:50.469
seed-user-29	seed-post-102	2026-09-23 23:31:50.469
seed-user-0	seed-post-102	2026-09-23 23:31:50.469
seed-user-1	seed-post-102	2026-09-23 23:31:50.47
seed-user-23	seed-post-103	2026-09-23 23:31:50.472
seed-user-24	seed-post-103	2026-09-23 23:31:50.473
seed-user-25	seed-post-103	2026-09-23 23:31:50.473
seed-user-26	seed-post-103	2026-09-23 23:31:50.473
seed-user-27	seed-post-103	2026-09-23 23:31:50.473
seed-user-28	seed-post-103	2026-09-23 23:31:50.474
seed-user-29	seed-post-103	2026-09-23 23:31:50.474
seed-user-0	seed-post-103	2026-09-23 23:31:50.474
seed-user-1	seed-post-103	2026-09-23 23:31:50.474
seed-user-2	seed-post-103	2026-09-23 23:31:50.475
seed-user-3	seed-post-103	2026-09-23 23:31:50.475
seed-user-24	seed-post-104	2026-09-23 23:31:50.476
seed-user-25	seed-post-104	2026-09-23 23:31:50.477
seed-user-26	seed-post-104	2026-09-23 23:31:50.477
seed-user-27	seed-post-104	2026-09-23 23:31:50.477
seed-user-28	seed-post-104	2026-09-23 23:31:50.477
seed-user-29	seed-post-104	2026-09-23 23:31:50.478
seed-user-0	seed-post-104	2026-09-23 23:31:50.478
seed-user-1	seed-post-104	2026-09-23 23:31:50.478
seed-user-2	seed-post-104	2026-09-23 23:31:50.478
seed-user-3	seed-post-104	2026-09-23 23:31:50.479
seed-user-4	seed-post-104	2026-09-23 23:31:50.479
seed-user-5	seed-post-104	2026-09-23 23:31:50.479
seed-user-25	seed-post-105	2026-09-23 23:31:50.481
seed-user-26	seed-post-105	2026-09-23 23:31:50.482
seed-user-27	seed-post-105	2026-09-23 23:31:50.482
seed-user-28	seed-post-105	2026-09-23 23:31:50.482
seed-user-29	seed-post-105	2026-09-23 23:31:50.483
seed-user-0	seed-post-105	2026-09-23 23:31:50.483
seed-user-1	seed-post-105	2026-09-23 23:31:50.483
seed-user-2	seed-post-105	2026-09-23 23:31:50.483
seed-user-3	seed-post-105	2026-09-23 23:31:50.484
seed-user-4	seed-post-105	2026-09-23 23:31:50.484
seed-user-5	seed-post-105	2026-09-23 23:31:50.484
seed-user-6	seed-post-105	2026-09-23 23:31:50.484
seed-user-7	seed-post-105	2026-09-23 23:31:50.485
seed-user-26	seed-post-106	2026-09-23 23:31:50.486
seed-user-27	seed-post-106	2026-09-23 23:31:50.487
seed-user-28	seed-post-106	2026-09-23 23:31:50.487
seed-user-29	seed-post-106	2026-09-23 23:31:50.487
seed-user-0	seed-post-106	2026-09-23 23:31:50.488
seed-user-1	seed-post-106	2026-09-23 23:31:50.488
seed-user-2	seed-post-106	2026-09-23 23:31:50.488
seed-user-3	seed-post-106	2026-09-23 23:31:50.488
seed-user-4	seed-post-106	2026-09-23 23:31:50.488
seed-user-5	seed-post-106	2026-09-23 23:31:50.489
seed-user-6	seed-post-106	2026-09-23 23:31:50.489
seed-user-7	seed-post-106	2026-09-23 23:31:50.489
seed-user-8	seed-post-106	2026-09-23 23:31:50.489
seed-user-9	seed-post-106	2026-09-23 23:31:50.49
seed-user-27	seed-post-107	2026-09-23 23:31:50.492
seed-user-28	seed-post-107	2026-09-23 23:31:50.492
seed-user-29	seed-post-107	2026-09-23 23:31:50.493
seed-user-0	seed-post-107	2026-09-23 23:31:50.493
seed-user-1	seed-post-107	2026-09-23 23:31:50.493
seed-user-2	seed-post-107	2026-09-23 23:31:50.493
seed-user-3	seed-post-107	2026-09-23 23:31:50.494
seed-user-4	seed-post-107	2026-09-23 23:31:50.494
seed-user-5	seed-post-107	2026-09-23 23:31:50.494
seed-user-6	seed-post-107	2026-09-23 23:31:50.494
seed-user-7	seed-post-107	2026-09-23 23:31:50.495
seed-user-8	seed-post-107	2026-09-23 23:31:50.495
seed-user-9	seed-post-107	2026-09-23 23:31:50.495
seed-user-10	seed-post-107	2026-09-23 23:31:50.495
seed-user-11	seed-post-107	2026-09-23 23:31:50.496
seed-user-28	seed-post-108	2026-09-23 23:31:50.497
seed-user-29	seed-post-108	2026-09-23 23:31:50.497
seed-user-0	seed-post-108	2026-09-23 23:31:50.498
seed-user-1	seed-post-108	2026-09-23 23:31:50.498
seed-user-2	seed-post-108	2026-09-23 23:31:50.498
seed-user-3	seed-post-108	2026-09-23 23:31:50.498
seed-user-4	seed-post-108	2026-09-23 23:31:50.499
seed-user-5	seed-post-108	2026-09-23 23:31:50.499
seed-user-6	seed-post-108	2026-09-23 23:31:50.499
seed-user-7	seed-post-108	2026-09-23 23:31:50.499
seed-user-8	seed-post-108	2026-09-23 23:31:50.5
seed-user-9	seed-post-108	2026-09-23 23:31:50.5
seed-user-10	seed-post-108	2026-09-23 23:31:50.5
seed-user-11	seed-post-108	2026-09-23 23:31:50.5
seed-user-12	seed-post-108	2026-09-23 23:31:50.501
seed-user-13	seed-post-108	2026-09-23 23:31:50.501
seed-user-29	seed-post-109	2026-09-23 23:31:50.503
seed-user-0	seed-post-109	2026-09-23 23:31:50.504
seed-user-1	seed-post-109	2026-09-23 23:31:50.504
seed-user-2	seed-post-109	2026-09-23 23:31:50.504
seed-user-3	seed-post-109	2026-09-23 23:31:50.504
seed-user-4	seed-post-109	2026-09-23 23:31:50.505
seed-user-5	seed-post-109	2026-09-23 23:31:50.505
seed-user-6	seed-post-109	2026-09-23 23:31:50.505
seed-user-7	seed-post-109	2026-09-23 23:31:50.505
seed-user-8	seed-post-109	2026-09-23 23:31:50.506
seed-user-9	seed-post-109	2026-09-23 23:31:50.506
seed-user-10	seed-post-109	2026-09-23 23:31:50.506
seed-user-11	seed-post-109	2026-09-23 23:31:50.506
seed-user-12	seed-post-109	2026-09-23 23:31:50.507
seed-user-13	seed-post-109	2026-09-23 23:31:50.507
seed-user-14	seed-post-109	2026-09-23 23:31:50.507
seed-user-15	seed-post-109	2026-09-23 23:31:50.507
seed-user-0	seed-post-110	2026-09-23 23:31:50.509
seed-user-1	seed-post-110	2026-09-23 23:31:50.509
seed-user-2	seed-post-110	2026-09-23 23:31:50.509
seed-user-3	seed-post-110	2026-09-23 23:31:50.51
seed-user-4	seed-post-110	2026-09-23 23:31:50.51
seed-user-5	seed-post-110	2026-09-23 23:31:50.51
seed-user-6	seed-post-110	2026-09-23 23:31:50.51
seed-user-7	seed-post-110	2026-09-23 23:31:50.511
seed-user-8	seed-post-110	2026-09-23 23:31:50.511
seed-user-9	seed-post-110	2026-09-23 23:31:50.511
seed-user-10	seed-post-110	2026-09-23 23:31:50.512
seed-user-11	seed-post-110	2026-09-23 23:31:50.512
seed-user-12	seed-post-110	2026-09-23 23:31:50.512
seed-user-13	seed-post-110	2026-09-23 23:31:50.512
seed-user-14	seed-post-110	2026-09-23 23:31:50.513
seed-user-15	seed-post-110	2026-09-23 23:31:50.513
seed-user-16	seed-post-110	2026-09-23 23:31:50.513
seed-user-17	seed-post-110	2026-09-23 23:31:50.513
seed-user-1	seed-post-111	2026-09-23 23:31:50.516
seed-user-2	seed-post-111	2026-09-23 23:31:50.516
seed-user-3	seed-post-111	2026-09-23 23:31:50.516
seed-user-4	seed-post-111	2026-09-23 23:31:50.516
seed-user-5	seed-post-111	2026-09-23 23:31:50.517
seed-user-6	seed-post-111	2026-09-23 23:31:50.517
seed-user-7	seed-post-111	2026-09-23 23:31:50.517
seed-user-8	seed-post-111	2026-09-23 23:31:50.517
seed-user-9	seed-post-111	2026-09-23 23:31:50.518
seed-user-10	seed-post-111	2026-09-23 23:31:50.518
seed-user-11	seed-post-111	2026-09-23 23:31:50.518
seed-user-12	seed-post-111	2026-09-23 23:31:50.518
seed-user-13	seed-post-111	2026-09-23 23:31:50.519
seed-user-14	seed-post-111	2026-09-23 23:31:50.519
seed-user-15	seed-post-111	2026-09-23 23:31:50.519
seed-user-16	seed-post-111	2026-09-23 23:31:50.519
seed-user-17	seed-post-111	2026-09-23 23:31:50.52
seed-user-18	seed-post-111	2026-09-23 23:31:50.52
seed-user-19	seed-post-111	2026-09-23 23:31:50.52
seed-user-2	seed-post-112	2026-09-23 23:31:50.522
seed-user-3	seed-post-112	2026-09-23 23:31:50.522
seed-user-4	seed-post-112	2026-09-23 23:31:50.523
seed-user-5	seed-post-112	2026-09-23 23:31:50.523
seed-user-6	seed-post-112	2026-09-23 23:31:50.523
seed-user-7	seed-post-112	2026-09-23 23:31:50.523
seed-user-8	seed-post-112	2026-09-23 23:31:50.524
seed-user-9	seed-post-112	2026-09-23 23:31:50.524
seed-user-10	seed-post-112	2026-09-23 23:31:50.524
seed-user-11	seed-post-112	2026-09-23 23:31:50.524
seed-user-12	seed-post-112	2026-09-23 23:31:50.524
seed-user-13	seed-post-112	2026-09-23 23:31:50.525
seed-user-14	seed-post-112	2026-09-23 23:31:50.525
seed-user-15	seed-post-112	2026-09-23 23:31:50.525
seed-user-16	seed-post-112	2026-09-23 23:31:50.525
seed-user-17	seed-post-112	2026-09-23 23:31:50.526
seed-user-18	seed-post-112	2026-09-23 23:31:50.526
seed-user-19	seed-post-112	2026-09-23 23:31:50.526
seed-user-20	seed-post-112	2026-09-23 23:31:50.526
seed-user-21	seed-post-112	2026-09-23 23:31:50.527
seed-user-3	seed-post-113	2026-09-23 23:31:50.529
seed-user-4	seed-post-113	2026-09-23 23:31:50.529
seed-user-5	seed-post-113	2026-09-23 23:31:50.53
seed-user-6	seed-post-113	2026-09-23 23:31:50.53
seed-user-7	seed-post-113	2026-09-23 23:31:50.53
seed-user-8	seed-post-113	2026-09-23 23:31:50.53
seed-user-9	seed-post-113	2026-09-23 23:31:50.53
seed-user-10	seed-post-113	2026-09-23 23:31:50.531
seed-user-11	seed-post-113	2026-09-23 23:31:50.531
seed-user-12	seed-post-113	2026-09-23 23:31:50.531
seed-user-13	seed-post-113	2026-09-23 23:31:50.531
seed-user-14	seed-post-113	2026-09-23 23:31:50.532
seed-user-15	seed-post-113	2026-09-23 23:31:50.532
seed-user-16	seed-post-113	2026-09-23 23:31:50.532
seed-user-17	seed-post-113	2026-09-23 23:31:50.532
seed-user-18	seed-post-113	2026-09-23 23:31:50.533
seed-user-19	seed-post-113	2026-09-23 23:31:50.533
seed-user-20	seed-post-113	2026-09-23 23:31:50.533
seed-user-21	seed-post-113	2026-09-23 23:31:50.533
seed-user-22	seed-post-113	2026-09-23 23:31:50.534
seed-user-23	seed-post-113	2026-09-23 23:31:50.534
seed-user-4	seed-post-114	2026-09-23 23:31:50.535
seed-user-5	seed-post-114	2026-09-23 23:31:50.536
seed-user-6	seed-post-114	2026-09-23 23:31:50.536
seed-user-5	seed-post-115	2026-09-23 23:31:50.539
seed-user-6	seed-post-115	2026-09-23 23:31:50.539
seed-user-7	seed-post-115	2026-09-23 23:31:50.539
seed-user-8	seed-post-115	2026-09-23 23:31:50.539
seed-user-6	seed-post-116	2026-09-23 23:31:50.541
seed-user-7	seed-post-116	2026-09-23 23:31:50.541
seed-user-8	seed-post-116	2026-09-23 23:31:50.541
seed-user-9	seed-post-116	2026-09-23 23:31:50.542
seed-user-10	seed-post-116	2026-09-23 23:31:50.542
seed-user-7	seed-post-117	2026-09-23 23:31:50.544
seed-user-8	seed-post-117	2026-09-23 23:31:50.544
seed-user-9	seed-post-117	2026-09-23 23:31:50.545
seed-user-10	seed-post-117	2026-09-23 23:31:50.545
seed-user-11	seed-post-117	2026-09-23 23:31:50.545
seed-user-12	seed-post-117	2026-09-23 23:31:50.545
seed-user-8	seed-post-118	2026-09-23 23:31:50.547
seed-user-9	seed-post-118	2026-09-23 23:31:50.548
seed-user-10	seed-post-118	2026-09-23 23:31:50.548
seed-user-11	seed-post-118	2026-09-23 23:31:50.548
seed-user-12	seed-post-118	2026-09-23 23:31:50.548
seed-user-13	seed-post-118	2026-09-23 23:31:50.549
seed-user-14	seed-post-118	2026-09-23 23:31:50.549
seed-user-9	seed-post-119	2026-09-23 23:31:50.551
seed-user-10	seed-post-119	2026-09-23 23:31:50.551
seed-user-11	seed-post-119	2026-09-23 23:31:50.552
seed-user-12	seed-post-119	2026-09-23 23:31:50.552
seed-user-13	seed-post-119	2026-09-23 23:31:50.552
seed-user-14	seed-post-119	2026-09-23 23:31:50.552
seed-user-15	seed-post-119	2026-09-23 23:31:50.553
seed-user-16	seed-post-119	2026-09-23 23:31:50.553
seed-user-10	seed-post-120	2026-09-23 23:31:50.554
seed-user-11	seed-post-120	2026-09-23 23:31:50.555
seed-user-12	seed-post-120	2026-09-23 23:31:50.555
seed-user-13	seed-post-120	2026-09-23 23:31:50.555
seed-user-14	seed-post-120	2026-09-23 23:31:50.555
seed-user-15	seed-post-120	2026-09-23 23:31:50.556
seed-user-16	seed-post-120	2026-09-23 23:31:50.556
seed-user-17	seed-post-120	2026-09-23 23:31:50.556
seed-user-18	seed-post-120	2026-09-23 23:31:50.556
seed-user-11	seed-post-121	2026-09-23 23:31:50.559
seed-user-12	seed-post-121	2026-09-23 23:31:50.559
seed-user-13	seed-post-121	2026-09-23 23:31:50.559
seed-user-14	seed-post-121	2026-09-23 23:31:50.56
seed-user-15	seed-post-121	2026-09-23 23:31:50.56
seed-user-16	seed-post-121	2026-09-23 23:31:50.56
seed-user-17	seed-post-121	2026-09-23 23:31:50.561
seed-user-18	seed-post-121	2026-09-23 23:31:50.561
seed-user-19	seed-post-121	2026-09-23 23:31:50.561
seed-user-20	seed-post-121	2026-09-23 23:31:50.561
seed-user-12	seed-post-122	2026-09-23 23:31:50.563
seed-user-13	seed-post-122	2026-09-23 23:31:50.563
seed-user-14	seed-post-122	2026-09-23 23:31:50.564
seed-user-15	seed-post-122	2026-09-23 23:31:50.564
seed-user-16	seed-post-122	2026-09-23 23:31:50.564
seed-user-17	seed-post-122	2026-09-23 23:31:50.565
seed-user-18	seed-post-122	2026-09-23 23:31:50.565
seed-user-19	seed-post-122	2026-09-23 23:31:50.565
seed-user-20	seed-post-122	2026-09-23 23:31:50.565
seed-user-21	seed-post-122	2026-09-23 23:31:50.566
seed-user-22	seed-post-122	2026-09-23 23:31:50.566
seed-user-13	seed-post-123	2026-09-23 23:31:50.568
seed-user-14	seed-post-123	2026-09-23 23:31:50.568
seed-user-15	seed-post-123	2026-09-23 23:31:50.568
seed-user-16	seed-post-123	2026-09-23 23:31:50.569
seed-user-17	seed-post-123	2026-09-23 23:31:50.569
seed-user-18	seed-post-123	2026-09-23 23:31:50.569
seed-user-19	seed-post-123	2026-09-23 23:31:50.569
seed-user-20	seed-post-123	2026-09-23 23:31:50.57
seed-user-21	seed-post-123	2026-09-23 23:31:50.57
seed-user-22	seed-post-123	2026-09-23 23:31:50.57
seed-user-23	seed-post-123	2026-09-23 23:31:50.57
seed-user-24	seed-post-123	2026-09-23 23:31:50.571
seed-user-14	seed-post-124	2026-09-23 23:31:50.573
seed-user-15	seed-post-124	2026-09-23 23:31:50.573
seed-user-16	seed-post-124	2026-09-23 23:31:50.573
seed-user-17	seed-post-124	2026-09-23 23:31:50.573
seed-user-18	seed-post-124	2026-09-23 23:31:50.574
seed-user-19	seed-post-124	2026-09-23 23:31:50.574
seed-user-20	seed-post-124	2026-09-23 23:31:50.574
seed-user-21	seed-post-124	2026-09-23 23:31:50.574
seed-user-22	seed-post-124	2026-09-23 23:31:50.575
seed-user-23	seed-post-124	2026-09-23 23:31:50.575
seed-user-24	seed-post-124	2026-09-23 23:31:50.575
seed-user-25	seed-post-124	2026-09-23 23:31:50.575
seed-user-26	seed-post-124	2026-09-23 23:31:50.576
seed-user-15	seed-post-125	2026-09-23 23:31:50.578
seed-user-16	seed-post-125	2026-09-23 23:31:50.578
seed-user-17	seed-post-125	2026-09-23 23:31:50.578
seed-user-18	seed-post-125	2026-09-23 23:31:50.579
seed-user-19	seed-post-125	2026-09-23 23:31:50.579
seed-user-20	seed-post-125	2026-09-23 23:31:50.579
seed-user-21	seed-post-125	2026-09-23 23:31:50.579
seed-user-22	seed-post-125	2026-09-23 23:31:50.58
seed-user-23	seed-post-125	2026-09-23 23:31:50.58
seed-user-24	seed-post-125	2026-09-23 23:31:50.58
seed-user-25	seed-post-125	2026-09-23 23:31:50.58
seed-user-26	seed-post-125	2026-09-23 23:31:50.581
seed-user-27	seed-post-125	2026-09-23 23:31:50.581
seed-user-28	seed-post-125	2026-09-23 23:31:50.581
seed-user-16	seed-post-126	2026-09-23 23:31:50.583
seed-user-17	seed-post-126	2026-09-23 23:31:50.583
seed-user-18	seed-post-126	2026-09-23 23:31:50.584
seed-user-19	seed-post-126	2026-09-23 23:31:50.584
seed-user-20	seed-post-126	2026-09-23 23:31:50.584
seed-user-21	seed-post-126	2026-09-23 23:31:50.584
seed-user-22	seed-post-126	2026-09-23 23:31:50.585
seed-user-23	seed-post-126	2026-09-23 23:31:50.585
seed-user-24	seed-post-126	2026-09-23 23:31:50.585
seed-user-25	seed-post-126	2026-09-23 23:31:50.585
seed-user-26	seed-post-126	2026-09-23 23:31:50.586
seed-user-27	seed-post-126	2026-09-23 23:31:50.586
seed-user-28	seed-post-126	2026-09-23 23:31:50.586
seed-user-29	seed-post-126	2026-09-23 23:31:50.586
seed-user-0	seed-post-126	2026-09-23 23:31:50.586
seed-user-17	seed-post-127	2026-09-23 23:31:50.589
seed-user-18	seed-post-127	2026-09-23 23:31:50.589
seed-user-19	seed-post-127	2026-09-23 23:31:50.589
seed-user-20	seed-post-127	2026-09-23 23:31:50.59
seed-user-21	seed-post-127	2026-09-23 23:31:50.59
seed-user-22	seed-post-127	2026-09-23 23:31:50.59
seed-user-23	seed-post-127	2026-09-23 23:31:50.59
seed-user-24	seed-post-127	2026-09-23 23:31:50.591
seed-user-25	seed-post-127	2026-09-23 23:31:50.591
seed-user-26	seed-post-127	2026-09-23 23:31:50.591
seed-user-27	seed-post-127	2026-09-23 23:31:50.591
seed-user-28	seed-post-127	2026-09-23 23:31:50.592
seed-user-29	seed-post-127	2026-09-23 23:31:50.592
seed-user-0	seed-post-127	2026-09-23 23:31:50.592
seed-user-1	seed-post-127	2026-09-23 23:31:50.592
seed-user-2	seed-post-127	2026-09-23 23:31:50.593
seed-user-18	seed-post-128	2026-09-23 23:31:50.594
seed-user-19	seed-post-128	2026-09-23 23:31:50.595
seed-user-20	seed-post-128	2026-09-23 23:31:50.595
seed-user-21	seed-post-128	2026-09-23 23:31:50.595
seed-user-22	seed-post-128	2026-09-23 23:31:50.596
seed-user-23	seed-post-128	2026-09-23 23:31:50.596
seed-user-24	seed-post-128	2026-09-23 23:31:50.596
seed-user-25	seed-post-128	2026-09-23 23:31:50.596
seed-user-26	seed-post-128	2026-09-23 23:31:50.596
seed-user-27	seed-post-128	2026-09-23 23:31:50.597
seed-user-28	seed-post-128	2026-09-23 23:31:50.597
seed-user-29	seed-post-128	2026-09-23 23:31:50.597
seed-user-0	seed-post-128	2026-09-23 23:31:50.597
seed-user-1	seed-post-128	2026-09-23 23:31:50.598
seed-user-2	seed-post-128	2026-09-23 23:31:50.598
seed-user-3	seed-post-128	2026-09-23 23:31:50.598
seed-user-4	seed-post-128	2026-09-23 23:31:50.598
seed-user-19	seed-post-129	2026-09-23 23:31:50.6
seed-user-20	seed-post-129	2026-09-23 23:31:50.601
seed-user-21	seed-post-129	2026-09-23 23:31:50.601
seed-user-22	seed-post-129	2026-09-23 23:31:50.601
seed-user-23	seed-post-129	2026-09-23 23:31:50.601
seed-user-24	seed-post-129	2026-09-23 23:31:50.602
seed-user-25	seed-post-129	2026-09-23 23:31:50.602
seed-user-26	seed-post-129	2026-09-23 23:31:50.602
seed-user-27	seed-post-129	2026-09-23 23:31:50.603
seed-user-28	seed-post-129	2026-09-23 23:31:50.603
seed-user-29	seed-post-129	2026-09-23 23:31:50.603
seed-user-0	seed-post-129	2026-09-23 23:31:50.603
seed-user-1	seed-post-129	2026-09-23 23:31:50.604
seed-user-2	seed-post-129	2026-09-23 23:31:50.604
seed-user-3	seed-post-129	2026-09-23 23:31:50.604
seed-user-4	seed-post-129	2026-09-23 23:31:50.604
seed-user-5	seed-post-129	2026-09-23 23:31:50.604
seed-user-6	seed-post-129	2026-09-23 23:31:50.605
seed-user-20	seed-post-130	2026-09-23 23:31:50.607
seed-user-21	seed-post-130	2026-09-23 23:31:50.607
seed-user-22	seed-post-130	2026-09-23 23:31:50.607
seed-user-23	seed-post-130	2026-09-23 23:31:50.607
seed-user-24	seed-post-130	2026-09-23 23:31:50.608
seed-user-25	seed-post-130	2026-09-23 23:31:50.608
seed-user-26	seed-post-130	2026-09-23 23:31:50.608
seed-user-27	seed-post-130	2026-09-23 23:31:50.608
seed-user-28	seed-post-130	2026-09-23 23:31:50.609
seed-user-29	seed-post-130	2026-09-23 23:31:50.609
seed-user-0	seed-post-130	2026-09-23 23:31:50.609
seed-user-1	seed-post-130	2026-09-23 23:31:50.609
seed-user-2	seed-post-130	2026-09-23 23:31:50.609
seed-user-3	seed-post-130	2026-09-23 23:31:50.61
seed-user-4	seed-post-130	2026-09-23 23:31:50.61
seed-user-5	seed-post-130	2026-09-23 23:31:50.61
seed-user-6	seed-post-130	2026-09-23 23:31:50.61
seed-user-7	seed-post-130	2026-09-23 23:31:50.611
seed-user-8	seed-post-130	2026-09-23 23:31:50.611
seed-user-21	seed-post-131	2026-09-23 23:31:50.614
seed-user-22	seed-post-131	2026-09-23 23:31:50.614
seed-user-23	seed-post-131	2026-09-23 23:31:50.614
seed-user-24	seed-post-131	2026-09-23 23:31:50.614
seed-user-25	seed-post-131	2026-09-23 23:31:50.615
seed-user-26	seed-post-131	2026-09-23 23:31:50.615
seed-user-27	seed-post-131	2026-09-23 23:31:50.615
seed-user-28	seed-post-131	2026-09-23 23:31:50.615
seed-user-29	seed-post-131	2026-09-23 23:31:50.616
seed-user-0	seed-post-131	2026-09-23 23:31:50.616
seed-user-1	seed-post-131	2026-09-23 23:31:50.616
seed-user-2	seed-post-131	2026-09-23 23:31:50.616
seed-user-3	seed-post-131	2026-09-23 23:31:50.616
seed-user-4	seed-post-131	2026-09-23 23:31:50.617
seed-user-5	seed-post-131	2026-09-23 23:31:50.617
seed-user-6	seed-post-131	2026-09-23 23:31:50.617
seed-user-7	seed-post-131	2026-09-23 23:31:50.618
seed-user-8	seed-post-131	2026-09-23 23:31:50.618
seed-user-9	seed-post-131	2026-09-23 23:31:50.618
seed-user-10	seed-post-131	2026-09-23 23:31:50.618
seed-user-22	seed-post-132	2026-09-23 23:31:50.62
seed-user-23	seed-post-132	2026-09-23 23:31:50.62
seed-user-24	seed-post-132	2026-09-23 23:31:50.62
seed-user-25	seed-post-132	2026-09-23 23:31:50.621
seed-user-26	seed-post-132	2026-09-23 23:31:50.621
seed-user-27	seed-post-132	2026-09-23 23:31:50.621
seed-user-28	seed-post-132	2026-09-23 23:31:50.621
seed-user-29	seed-post-132	2026-09-23 23:31:50.622
seed-user-0	seed-post-132	2026-09-23 23:31:50.622
seed-user-1	seed-post-132	2026-09-23 23:31:50.622
seed-user-2	seed-post-132	2026-09-23 23:31:50.622
seed-user-3	seed-post-132	2026-09-23 23:31:50.623
seed-user-4	seed-post-132	2026-09-23 23:31:50.623
seed-user-5	seed-post-132	2026-09-23 23:31:50.623
seed-user-6	seed-post-132	2026-09-23 23:31:50.623
seed-user-7	seed-post-132	2026-09-23 23:31:50.623
seed-user-8	seed-post-132	2026-09-23 23:31:50.624
seed-user-9	seed-post-132	2026-09-23 23:31:50.624
seed-user-10	seed-post-132	2026-09-23 23:31:50.624
seed-user-11	seed-post-132	2026-09-23 23:31:50.624
seed-user-12	seed-post-132	2026-09-23 23:31:50.625
seed-user-23	seed-post-133	2026-09-23 23:31:50.627
seed-user-24	seed-post-133	2026-09-23 23:31:50.628
seed-user-25	seed-post-133	2026-09-23 23:31:50.628
seed-user-24	seed-post-134	2026-09-23 23:31:50.629
seed-user-25	seed-post-134	2026-09-23 23:31:50.63
seed-user-26	seed-post-134	2026-09-23 23:31:50.63
seed-user-27	seed-post-134	2026-09-23 23:31:50.63
seed-user-25	seed-post-135	2026-09-23 23:31:50.632
seed-user-26	seed-post-135	2026-09-23 23:31:50.633
seed-user-27	seed-post-135	2026-09-23 23:31:50.633
seed-user-28	seed-post-135	2026-09-23 23:31:50.633
seed-user-29	seed-post-135	2026-09-23 23:31:50.633
seed-user-26	seed-post-136	2026-09-23 23:31:50.635
seed-user-27	seed-post-136	2026-09-23 23:31:50.636
seed-user-28	seed-post-136	2026-09-23 23:31:50.636
seed-user-29	seed-post-136	2026-09-23 23:31:50.636
seed-user-0	seed-post-136	2026-09-23 23:31:50.636
seed-user-1	seed-post-136	2026-09-23 23:31:50.637
seed-user-27	seed-post-137	2026-09-23 23:31:50.639
seed-user-28	seed-post-137	2026-09-23 23:31:50.639
seed-user-29	seed-post-137	2026-09-23 23:31:50.639
seed-user-0	seed-post-137	2026-09-23 23:31:50.64
seed-user-1	seed-post-137	2026-09-23 23:31:50.64
seed-user-2	seed-post-137	2026-09-23 23:31:50.64
seed-user-3	seed-post-137	2026-09-23 23:31:50.64
seed-user-28	seed-post-138	2026-09-23 23:31:50.642
seed-user-29	seed-post-138	2026-09-23 23:31:50.642
seed-user-0	seed-post-138	2026-09-23 23:31:50.642
seed-user-1	seed-post-138	2026-09-23 23:31:50.643
seed-user-2	seed-post-138	2026-09-23 23:31:50.643
seed-user-3	seed-post-138	2026-09-23 23:31:50.643
seed-user-4	seed-post-138	2026-09-23 23:31:50.643
seed-user-5	seed-post-138	2026-09-23 23:31:50.644
seed-user-29	seed-post-139	2026-09-23 23:31:50.646
seed-user-0	seed-post-139	2026-09-23 23:31:50.646
seed-user-1	seed-post-139	2026-09-23 23:31:50.647
seed-user-2	seed-post-139	2026-09-23 23:31:50.647
seed-user-3	seed-post-139	2026-09-23 23:31:50.648
seed-user-4	seed-post-139	2026-09-23 23:31:50.648
seed-user-5	seed-post-139	2026-09-23 23:31:50.648
seed-user-6	seed-post-139	2026-09-23 23:31:50.648
seed-user-7	seed-post-139	2026-09-23 23:31:50.648
seed-user-0	seed-post-140	2026-09-23 23:31:50.65
seed-user-1	seed-post-140	2026-09-23 23:31:50.65
seed-user-2	seed-post-140	2026-09-23 23:31:50.65
seed-user-3	seed-post-140	2026-09-23 23:31:50.65
seed-user-4	seed-post-140	2026-09-23 23:31:50.65
seed-user-5	seed-post-140	2026-09-23 23:31:50.65
seed-user-6	seed-post-140	2026-09-23 23:31:50.651
seed-user-7	seed-post-140	2026-09-23 23:31:50.651
seed-user-8	seed-post-140	2026-09-23 23:31:50.651
seed-user-9	seed-post-140	2026-09-23 23:31:50.651
seed-user-1	seed-post-141	2026-09-23 23:31:50.654
seed-user-2	seed-post-141	2026-09-23 23:31:50.654
seed-user-3	seed-post-141	2026-09-23 23:31:50.654
seed-user-4	seed-post-141	2026-09-23 23:31:50.655
seed-user-5	seed-post-141	2026-09-23 23:31:50.655
seed-user-6	seed-post-141	2026-09-23 23:31:50.655
seed-user-7	seed-post-141	2026-09-23 23:31:50.655
seed-user-8	seed-post-141	2026-09-23 23:31:50.656
seed-user-9	seed-post-141	2026-09-23 23:31:50.656
seed-user-10	seed-post-141	2026-09-23 23:31:50.656
seed-user-11	seed-post-141	2026-09-23 23:31:50.656
seed-user-2	seed-post-142	2026-09-23 23:31:50.658
seed-user-3	seed-post-142	2026-09-23 23:31:50.658
seed-user-4	seed-post-142	2026-09-23 23:31:50.659
seed-user-5	seed-post-142	2026-09-23 23:31:50.659
seed-user-6	seed-post-142	2026-09-23 23:31:50.659
seed-user-7	seed-post-142	2026-09-23 23:31:50.659
seed-user-8	seed-post-142	2026-09-23 23:31:50.659
seed-user-9	seed-post-142	2026-09-23 23:31:50.66
seed-user-10	seed-post-142	2026-09-23 23:31:50.66
seed-user-11	seed-post-142	2026-09-23 23:31:50.66
seed-user-12	seed-post-142	2026-09-23 23:31:50.66
seed-user-13	seed-post-142	2026-09-23 23:31:50.661
seed-user-3	seed-post-143	2026-09-23 23:31:50.663
seed-user-4	seed-post-143	2026-09-23 23:31:50.663
seed-user-5	seed-post-143	2026-09-23 23:31:50.663
seed-user-6	seed-post-143	2026-09-23 23:31:50.664
seed-user-7	seed-post-143	2026-09-23 23:31:50.664
seed-user-8	seed-post-143	2026-09-23 23:31:50.664
seed-user-9	seed-post-143	2026-09-23 23:31:50.664
seed-user-10	seed-post-143	2026-09-23 23:31:50.665
seed-user-11	seed-post-143	2026-09-23 23:31:50.665
seed-user-12	seed-post-143	2026-09-23 23:31:50.665
seed-user-13	seed-post-143	2026-09-23 23:31:50.665
seed-user-14	seed-post-143	2026-09-23 23:31:50.666
seed-user-15	seed-post-143	2026-09-23 23:31:50.666
seed-user-4	seed-post-144	2026-09-23 23:31:50.667
seed-user-5	seed-post-144	2026-09-23 23:31:50.668
seed-user-6	seed-post-144	2026-09-23 23:31:50.668
seed-user-7	seed-post-144	2026-09-23 23:31:50.668
seed-user-8	seed-post-144	2026-09-23 23:31:50.668
seed-user-9	seed-post-144	2026-09-23 23:31:50.668
seed-user-10	seed-post-144	2026-09-23 23:31:50.669
seed-user-11	seed-post-144	2026-09-23 23:31:50.669
seed-user-12	seed-post-144	2026-09-23 23:31:50.669
seed-user-13	seed-post-144	2026-09-23 23:31:50.669
seed-user-14	seed-post-144	2026-09-23 23:31:50.67
seed-user-15	seed-post-144	2026-09-23 23:31:50.67
seed-user-16	seed-post-144	2026-09-23 23:31:50.67
seed-user-17	seed-post-144	2026-09-23 23:31:50.67
seed-user-5	seed-post-145	2026-09-23 23:31:50.673
seed-user-6	seed-post-145	2026-09-23 23:31:50.673
seed-user-7	seed-post-145	2026-09-23 23:31:50.673
seed-user-8	seed-post-145	2026-09-23 23:31:50.674
seed-user-9	seed-post-145	2026-09-23 23:31:50.674
seed-user-10	seed-post-145	2026-09-23 23:31:50.674
seed-user-11	seed-post-145	2026-09-23 23:31:50.674
seed-user-12	seed-post-145	2026-09-23 23:31:50.674
seed-user-13	seed-post-145	2026-09-23 23:31:50.675
seed-user-14	seed-post-145	2026-09-23 23:31:50.675
seed-user-15	seed-post-145	2026-09-23 23:31:50.675
seed-user-16	seed-post-145	2026-09-23 23:31:50.675
seed-user-17	seed-post-145	2026-09-23 23:31:50.676
seed-user-18	seed-post-145	2026-09-23 23:31:50.676
seed-user-19	seed-post-145	2026-09-23 23:31:50.676
seed-user-6	seed-post-146	2026-09-23 23:31:50.678
seed-user-7	seed-post-146	2026-09-23 23:31:50.678
seed-user-8	seed-post-146	2026-09-23 23:31:50.678
seed-user-9	seed-post-146	2026-09-23 23:31:50.678
seed-user-10	seed-post-146	2026-09-23 23:31:50.679
seed-user-11	seed-post-146	2026-09-23 23:31:50.679
seed-user-12	seed-post-146	2026-09-23 23:31:50.679
seed-user-13	seed-post-146	2026-09-23 23:31:50.679
seed-user-14	seed-post-146	2026-09-23 23:31:50.68
seed-user-15	seed-post-146	2026-09-23 23:31:50.68
seed-user-16	seed-post-146	2026-09-23 23:31:50.68
seed-user-17	seed-post-146	2026-09-23 23:31:50.68
seed-user-18	seed-post-146	2026-09-23 23:31:50.68
seed-user-19	seed-post-146	2026-09-23 23:31:50.681
seed-user-20	seed-post-146	2026-09-23 23:31:50.681
seed-user-21	seed-post-146	2026-09-23 23:31:50.681
seed-user-7	seed-post-147	2026-09-23 23:31:50.683
seed-user-8	seed-post-147	2026-09-23 23:31:50.684
seed-user-9	seed-post-147	2026-09-23 23:31:50.684
seed-user-10	seed-post-147	2026-09-23 23:31:50.684
seed-user-11	seed-post-147	2026-09-23 23:31:50.685
seed-user-12	seed-post-147	2026-09-23 23:31:50.685
seed-user-13	seed-post-147	2026-09-23 23:31:50.685
seed-user-14	seed-post-147	2026-09-23 23:31:50.685
seed-user-15	seed-post-147	2026-09-23 23:31:50.686
seed-user-16	seed-post-147	2026-09-23 23:31:50.686
seed-user-17	seed-post-147	2026-09-23 23:31:50.686
seed-user-18	seed-post-147	2026-09-23 23:31:50.686
seed-user-19	seed-post-147	2026-09-23 23:31:50.687
seed-user-20	seed-post-147	2026-09-23 23:31:50.687
seed-user-21	seed-post-147	2026-09-23 23:31:50.687
seed-user-22	seed-post-147	2026-09-23 23:31:50.687
seed-user-23	seed-post-147	2026-09-23 23:31:50.688
seed-user-8	seed-post-148	2026-09-23 23:31:50.689
seed-user-9	seed-post-148	2026-09-23 23:31:50.69
seed-user-10	seed-post-148	2026-09-23 23:31:50.69
seed-user-11	seed-post-148	2026-09-23 23:31:50.69
seed-user-12	seed-post-148	2026-09-23 23:31:50.69
seed-user-13	seed-post-148	2026-09-23 23:31:50.691
seed-user-14	seed-post-148	2026-09-23 23:31:50.691
seed-user-15	seed-post-148	2026-09-23 23:31:50.691
seed-user-16	seed-post-148	2026-09-23 23:31:50.691
seed-user-17	seed-post-148	2026-09-23 23:31:50.692
seed-user-18	seed-post-148	2026-09-23 23:31:50.692
seed-user-19	seed-post-148	2026-09-23 23:31:50.692
seed-user-20	seed-post-148	2026-09-23 23:31:50.692
seed-user-21	seed-post-148	2026-09-23 23:31:50.692
seed-user-22	seed-post-148	2026-09-23 23:31:50.693
seed-user-23	seed-post-148	2026-09-23 23:31:50.693
seed-user-24	seed-post-148	2026-09-23 23:31:50.693
seed-user-25	seed-post-148	2026-09-23 23:31:50.693
seed-user-9	seed-post-149	2026-09-23 23:31:50.696
seed-user-10	seed-post-149	2026-09-23 23:31:50.696
seed-user-11	seed-post-149	2026-09-23 23:31:50.696
seed-user-12	seed-post-149	2026-09-23 23:31:50.696
seed-user-13	seed-post-149	2026-09-23 23:31:50.697
seed-user-14	seed-post-149	2026-09-23 23:31:50.697
seed-user-15	seed-post-149	2026-09-23 23:31:50.697
seed-user-16	seed-post-149	2026-09-23 23:31:50.697
seed-user-17	seed-post-149	2026-09-23 23:31:50.697
seed-user-18	seed-post-149	2026-09-23 23:31:50.698
seed-user-19	seed-post-149	2026-09-23 23:31:50.698
seed-user-20	seed-post-149	2026-09-23 23:31:50.698
seed-user-21	seed-post-149	2026-09-23 23:31:50.698
seed-user-22	seed-post-149	2026-09-23 23:31:50.699
seed-user-23	seed-post-149	2026-09-23 23:31:50.699
seed-user-24	seed-post-149	2026-09-23 23:31:50.699
seed-user-25	seed-post-149	2026-09-23 23:31:50.699
seed-user-26	seed-post-149	2026-09-23 23:31:50.7
seed-user-27	seed-post-149	2026-09-23 23:31:50.7
seed-user-0	seed-post-0	2026-09-24 08:57:31.235
seed-user-0	seed-post-1	2026-09-24 08:57:31.24
seed-user-0	seed-post-2	2026-09-24 08:57:31.245
seed-user-0	seed-post-3	2026-09-24 08:57:31.247
seed-user-0	seed-post-4	2026-09-24 08:57:31.249
seed-user-1	seed-post-0	2026-09-24 08:57:31.258
seed-user-1	seed-post-1	2026-09-24 08:57:31.26
seed-user-1	seed-post-2	2026-09-24 08:57:31.263
seed-user-1	seed-post-3	2026-09-24 08:57:31.265
seed-user-1	seed-post-4	2026-09-24 08:57:31.267
seed-user-2	seed-post-0	2026-09-24 08:57:31.274
seed-user-2	seed-post-1	2026-09-24 08:57:31.276
seed-user-2	seed-post-2	2026-09-24 08:57:31.279
seed-user-2	seed-post-3	2026-09-24 08:57:31.281
seed-user-2	seed-post-4	2026-09-24 08:57:31.283
seed-user-3	seed-post-0	2026-09-24 08:57:31.29
seed-user-3	seed-post-1	2026-09-24 08:57:31.292
seed-user-3	seed-post-2	2026-09-24 08:57:31.295
seed-user-3	seed-post-3	2026-09-24 08:57:31.298
seed-user-3	seed-post-4	2026-09-24 08:57:31.301
seed-user-4	seed-post-0	2026-09-24 08:57:31.308
seed-user-4	seed-post-1	2026-09-24 08:57:31.311
seed-user-4	seed-post-2	2026-09-24 08:57:31.315
seed-user-4	seed-post-3	2026-09-24 08:57:31.317
seed-user-4	seed-post-4	2026-09-24 08:57:31.319
seed-user-5	seed-post-0	2026-09-24 08:57:31.328
seed-user-5	seed-post-1	2026-09-24 08:57:31.33
seed-user-5	seed-post-2	2026-09-24 08:57:31.331
seed-user-5	seed-post-3	2026-09-24 08:57:31.333
seed-user-5	seed-post-4	2026-09-24 08:57:31.334
seed-user-6	seed-post-0	2026-09-24 08:57:31.346
seed-user-6	seed-post-1	2026-09-24 08:57:31.348
seed-user-6	seed-post-2	2026-09-24 08:57:31.349
seed-user-6	seed-post-3	2026-09-24 08:57:31.351
seed-user-6	seed-post-4	2026-09-24 08:57:31.352
seed-user-7	seed-post-0	2026-09-24 08:57:31.359
seed-user-7	seed-post-1	2026-09-24 08:57:31.361
seed-user-7	seed-post-2	2026-09-24 08:57:31.363
seed-user-7	seed-post-3	2026-09-24 08:57:31.365
seed-user-7	seed-post-4	2026-09-24 08:57:31.367
seed-user-8	seed-post-0	2026-09-24 08:57:31.375
seed-user-8	seed-post-1	2026-09-24 08:57:31.377
seed-user-8	seed-post-2	2026-09-24 08:57:31.38
seed-user-8	seed-post-3	2026-09-24 08:57:31.382
seed-user-8	seed-post-4	2026-09-24 08:57:31.384
seed-user-9	seed-post-0	2026-09-24 08:57:31.391
seed-user-9	seed-post-1	2026-09-24 08:57:31.393
seed-user-9	seed-post-2	2026-09-24 08:57:31.395
seed-user-9	seed-post-3	2026-09-24 08:57:31.397
seed-user-9	seed-post-4	2026-09-24 08:57:31.399
\.


--
-- Data for Name: MediaAsset; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."MediaAsset" (id, "ownerId", "mediaType", "storageKey", "originalUrl", "processedUrl", "thumbnailUrl", width, height, "durationMs", "mimeType", "fileSizeBytes", "processingStatus", "failureReason", "createdAt", "updatedAt") FROM stdin;
seed-media-6	seed-user-6	IMAGE	seed/6	\N	http://localhost:4180/media/seed/fieldwork.webp	http://localhost:4180/media/seed/fieldwork.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.038	2026-09-24 12:09:58.398
seed-media-7	seed-user-7	IMAGE	seed/7	\N	http://localhost:4180/media/seed/lumen-health.webp	http://localhost:4180/media/seed/lumen-health.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.044	2026-09-24 12:09:58.407
seed-media-8	seed-user-8	IMAGE	seed/8	\N	http://localhost:4180/media/seed/tinker.webp	http://localhost:4180/media/seed/tinker.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.05	2026-09-24 12:09:58.415
seed-media-9	seed-user-9	IMAGE	seed/9	\N	http://localhost:4180/media/seed/wayfarer.webp	http://localhost:4180/media/seed/wayfarer.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.056	2026-09-24 12:09:58.422
seed-media-10	seed-user-0	IMAGE	seed/10	\N	http://localhost:4180/media/seed/patch.webp	http://localhost:4180/media/seed/patch.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.062	2026-09-24 12:09:58.437
seed-media-11	seed-user-1	IMAGE	seed/11	\N	http://localhost:4180/media/seed/threadline.webp	http://localhost:4180/media/seed/threadline.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.069	2026-09-24 12:09:58.446
seed-media-12	seed-user-2	IMAGE	seed/12	\N	http://localhost:4180/media/seed/solstice.webp	http://localhost:4180/media/seed/solstice.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.075	2026-09-24 12:09:58.455
seed-media-13	seed-user-3	IMAGE	seed/13	\N	http://localhost:4180/media/seed/arcade-garden.webp	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.081	2026-09-24 12:09:58.467
seed-media-14	seed-user-4	IMAGE	seed/14	\N	http://localhost:4180/media/seed/drift-space.webp	http://localhost:4180/media/seed/drift-space.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.086	2026-09-24 12:09:58.471
seed-media-15	seed-user-0	IMAGE	seed/15	\N	http://localhost:4180/media/seed/forma.webp	http://localhost:4180/media/seed/forma.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.091	2026-09-24 12:09:58.483
seed-media-17	seed-user-2	IMAGE	seed/17	\N	http://localhost:4180/media/seed/moss.webp	http://localhost:4180/media/seed/moss.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.103	2026-09-24 12:09:58.494
seed-media-18	seed-user-3	IMAGE	seed/18	\N	http://localhost:4180/media/seed/relay.webp	http://localhost:4180/media/seed/relay.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.109	2026-09-24 12:09:58.498
seed-media-19	seed-user-4	IMAGE	seed/19	\N	http://localhost:4180/media/seed/kite.webp	http://localhost:4180/media/seed/kite.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.116	2026-09-24 12:09:58.503
seed-media-20	seed-user-5	IMAGE	seed/20	\N	http://localhost:4180/media/seed/orbit-studio.webp	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.118	2026-09-24 12:09:58.508
seed-media-21	seed-user-6	IMAGE	seed/21	\N	http://localhost:4180/media/seed/fieldwork.webp	http://localhost:4180/media/seed/fieldwork.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.121	2026-09-24 12:09:58.511
seed-media-22	seed-user-7	IMAGE	seed/22	\N	http://localhost:4180/media/seed/lumen-health.webp	http://localhost:4180/media/seed/lumen-health.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.124	2026-09-24 12:09:58.513
seed-media-23	seed-user-8	IMAGE	seed/23	\N	http://localhost:4180/media/seed/tinker.webp	http://localhost:4180/media/seed/tinker.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.128	2026-09-24 12:09:58.516
seed-media-24	seed-user-9	IMAGE	seed/24	\N	http://localhost:4180/media/seed/wayfarer.webp	http://localhost:4180/media/seed/wayfarer.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.131	2026-09-24 12:09:58.518
seed-media-25	seed-user-0	IMAGE	seed/25	\N	http://localhost:4180/media/seed/patch.webp	http://localhost:4180/media/seed/patch.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.134	2026-09-24 12:09:58.521
seed-media-26	seed-user-1	IMAGE	seed/26	\N	http://localhost:4180/media/seed/threadline.webp	http://localhost:4180/media/seed/threadline.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.137	2026-09-24 12:09:58.524
seed-media-27	seed-user-2	IMAGE	seed/27	\N	http://localhost:4180/media/seed/solstice.webp	http://localhost:4180/media/seed/solstice.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.141	2026-09-24 12:09:58.529
seed-media-28	seed-user-3	IMAGE	seed/28	\N	http://localhost:4180/media/seed/arcade-garden.webp	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.145	2026-09-24 12:09:58.532
seed-media-29	seed-user-4	IMAGE	seed/29	\N	http://localhost:4180/media/seed/drift-space.webp	http://localhost:4180/media/seed/drift-space.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.149	2026-09-24 12:09:58.535
seed-media-30	seed-user-0	IMAGE	seed/30	\N	http://localhost:4180/media/seed/forma.webp	http://localhost:4180/media/seed/forma.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.152	2026-09-24 12:09:58.538
seed-media-31	seed-user-1	IMAGE	seed/31	\N	http://localhost:4180/media/seed/nova-robotics.webp	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.158	2026-09-24 12:09:58.543
seed-media-32	seed-user-2	IMAGE	seed/32	\N	http://localhost:4180/media/seed/moss.webp	http://localhost:4180/media/seed/moss.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.163	2026-09-24 12:09:58.547
seed-media-33	seed-user-3	IMAGE	seed/33	\N	http://localhost:4180/media/seed/relay.webp	http://localhost:4180/media/seed/relay.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.168	2026-09-24 12:09:58.551
seed-media-34	seed-user-4	IMAGE	seed/34	\N	http://localhost:4180/media/seed/kite.webp	http://localhost:4180/media/seed/kite.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.173	2026-09-24 12:09:58.556
seed-media-35	seed-user-5	IMAGE	seed/35	\N	http://localhost:4180/media/seed/orbit-studio.webp	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.179	2026-09-24 12:09:58.561
seed-media-36	seed-user-6	IMAGE	seed/36	\N	http://localhost:4180/media/seed/fieldwork.webp	http://localhost:4180/media/seed/fieldwork.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.185	2026-09-24 12:09:58.565
seed-media-1	seed-user-1	IMAGE	seed/1	\N	http://localhost:4180/media/seed/nova-robotics.webp	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.014	2026-09-24 12:09:58.331
seed-media-2	seed-user-2	IMAGE	seed/2	\N	http://localhost:4180/media/seed/moss.webp	http://localhost:4180/media/seed/moss.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.018	2026-09-24 12:09:58.338
seed-media-3	seed-user-3	IMAGE	seed/3	\N	http://localhost:4180/media/seed/relay.webp	http://localhost:4180/media/seed/relay.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.022	2026-09-24 12:09:58.376
seed-media-4	seed-user-4	IMAGE	seed/4	\N	http://localhost:4180/media/seed/kite.webp	http://localhost:4180/media/seed/kite.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.028	2026-09-24 12:09:58.382
seed-media-5	seed-user-5	IMAGE	seed/5	\N	http://localhost:4180/media/seed/orbit-studio.webp	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.033	2026-09-24 12:09:58.389
seed-media-43	seed-user-3	IMAGE	seed/43	\N	http://localhost:4180/media/seed/arcade-garden.webp	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.214	2026-09-24 12:09:58.59
seed-media-44	seed-user-4	IMAGE	seed/44	\N	http://localhost:4180/media/seed/drift-space.webp	http://localhost:4180/media/seed/drift-space.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.216	2026-09-24 12:09:58.593
seed-media-45	seed-user-0	IMAGE	seed/45	\N	http://localhost:4180/media/seed/forma.webp	http://localhost:4180/media/seed/forma.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.22	2026-09-24 12:09:58.597
seed-media-46	seed-user-1	IMAGE	seed/46	\N	http://localhost:4180/media/seed/nova-robotics.webp	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.224	2026-09-24 12:09:58.6
seed-media-47	seed-user-2	IMAGE	seed/47	\N	http://localhost:4180/media/seed/moss.webp	http://localhost:4180/media/seed/moss.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.229	2026-09-24 12:09:58.61
seed-media-48	seed-user-3	IMAGE	seed/48	\N	http://localhost:4180/media/seed/relay.webp	http://localhost:4180/media/seed/relay.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.233	2026-09-24 12:09:58.613
seed-media-49	seed-user-4	IMAGE	seed/49	\N	http://localhost:4180/media/seed/kite.webp	http://localhost:4180/media/seed/kite.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.237	2026-09-24 12:09:58.617
seed-media-50	seed-user-5	IMAGE	seed/50	\N	http://localhost:4180/media/seed/orbit-studio.webp	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.241	2026-09-24 12:09:58.621
seed-media-51	seed-user-6	IMAGE	seed/51	\N	http://localhost:4180/media/seed/fieldwork.webp	http://localhost:4180/media/seed/fieldwork.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.246	2026-09-24 12:09:58.627
seed-media-52	seed-user-7	IMAGE	seed/52	\N	http://localhost:4180/media/seed/lumen-health.webp	http://localhost:4180/media/seed/lumen-health.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.251	2026-09-24 12:09:58.632
seed-media-53	seed-user-8	IMAGE	seed/53	\N	http://localhost:4180/media/seed/tinker.webp	http://localhost:4180/media/seed/tinker.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.257	2026-09-24 12:09:58.638
seed-media-54	seed-user-9	IMAGE	seed/54	\N	http://localhost:4180/media/seed/wayfarer.webp	http://localhost:4180/media/seed/wayfarer.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.261	2026-09-24 12:09:58.644
seed-media-55	seed-user-0	IMAGE	seed/55	\N	http://localhost:4180/media/seed/patch.webp	http://localhost:4180/media/seed/patch.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.268	2026-09-24 12:09:58.649
seed-media-57	seed-user-2	IMAGE	seed/57	\N	http://localhost:4180/media/seed/solstice.webp	http://localhost:4180/media/seed/solstice.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.278	2026-09-24 12:09:58.665
seed-media-58	seed-user-3	IMAGE	seed/58	\N	http://localhost:4180/media/seed/arcade-garden.webp	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.28	2026-09-24 12:09:58.668
seed-media-59	seed-user-4	IMAGE	seed/59	\N	http://localhost:4180/media/seed/drift-space.webp	http://localhost:4180/media/seed/drift-space.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.282	2026-09-24 12:09:58.67
seed-media-60	seed-user-0	IMAGE	seed/60	\N	http://localhost:4180/media/seed/forma.webp	http://localhost:4180/media/seed/forma.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.285	2026-09-24 12:09:58.68
seed-media-61	seed-user-1	IMAGE	seed/61	\N	http://localhost:4180/media/seed/nova-robotics.webp	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.287	2026-09-24 12:09:58.683
seed-media-62	seed-user-2	IMAGE	seed/62	\N	http://localhost:4180/media/seed/moss.webp	http://localhost:4180/media/seed/moss.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.29	2026-09-24 12:09:58.686
seed-media-63	seed-user-3	IMAGE	seed/63	\N	http://localhost:4180/media/seed/relay.webp	http://localhost:4180/media/seed/relay.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.293	2026-09-24 12:09:58.693
seed-media-64	seed-user-4	IMAGE	seed/64	\N	http://localhost:4180/media/seed/kite.webp	http://localhost:4180/media/seed/kite.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.296	2026-09-24 12:09:58.698
seed-media-65	seed-user-5	IMAGE	seed/65	\N	http://localhost:4180/media/seed/orbit-studio.webp	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.3	2026-09-24 12:09:58.701
seed-media-66	seed-user-6	IMAGE	seed/66	\N	http://localhost:4180/media/seed/fieldwork.webp	http://localhost:4180/media/seed/fieldwork.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.304	2026-09-24 12:09:58.705
seed-media-67	seed-user-7	IMAGE	seed/67	\N	http://localhost:4180/media/seed/lumen-health.webp	http://localhost:4180/media/seed/lumen-health.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.308	2026-09-24 12:09:58.713
seed-media-68	seed-user-8	IMAGE	seed/68	\N	http://localhost:4180/media/seed/tinker.webp	http://localhost:4180/media/seed/tinker.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.311	2026-09-24 12:09:58.718
seed-media-69	seed-user-9	IMAGE	seed/69	\N	http://localhost:4180/media/seed/wayfarer.webp	http://localhost:4180/media/seed/wayfarer.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.316	2026-09-24 12:09:58.728
seed-media-70	seed-user-0	IMAGE	seed/70	\N	http://localhost:4180/media/seed/patch.webp	http://localhost:4180/media/seed/patch.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.322	2026-09-24 12:09:58.733
seed-media-71	seed-user-1	IMAGE	seed/71	\N	http://localhost:4180/media/seed/threadline.webp	http://localhost:4180/media/seed/threadline.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.327	2026-09-24 12:09:58.736
seed-media-72	seed-user-2	IMAGE	seed/72	\N	http://localhost:4180/media/seed/solstice.webp	http://localhost:4180/media/seed/solstice.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.332	2026-09-24 12:09:58.741
seed-media-73	seed-user-3	IMAGE	seed/73	\N	http://localhost:4180/media/seed/arcade-garden.webp	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.337	2026-09-24 12:09:58.754
seed-media-38	seed-user-8	IMAGE	seed/38	\N	http://localhost:4180/media/seed/tinker.webp	http://localhost:4180/media/seed/tinker.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.198	2026-09-24 12:09:58.575
seed-media-39	seed-user-9	IMAGE	seed/39	\N	http://localhost:4180/media/seed/wayfarer.webp	http://localhost:4180/media/seed/wayfarer.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.201	2026-09-24 12:09:58.577
seed-media-40	seed-user-0	IMAGE	seed/40	\N	http://localhost:4180/media/seed/patch.webp	http://localhost:4180/media/seed/patch.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.204	2026-09-24 12:09:58.581
seed-media-41	seed-user-1	IMAGE	seed/41	\N	http://localhost:4180/media/seed/threadline.webp	http://localhost:4180/media/seed/threadline.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.207	2026-09-24 12:09:58.584
seed-media-42	seed-user-2	IMAGE	seed/42	\N	http://localhost:4180/media/seed/solstice.webp	http://localhost:4180/media/seed/solstice.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.211	2026-09-24 12:09:58.586
seed-media-80	seed-user-5	IMAGE	seed/80	\N	http://localhost:4180/media/seed/orbit-studio.webp	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.365	2026-09-24 12:09:58.787
seed-media-81	seed-user-6	IMAGE	seed/81	\N	http://localhost:4180/media/seed/fieldwork.webp	http://localhost:4180/media/seed/fieldwork.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.368	2026-09-24 12:09:58.79
seed-media-82	seed-user-7	IMAGE	seed/82	\N	http://localhost:4180/media/seed/lumen-health.webp	http://localhost:4180/media/seed/lumen-health.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.372	2026-09-24 12:09:58.795
seed-media-83	seed-user-8	IMAGE	seed/83	\N	http://localhost:4180/media/seed/tinker.webp	http://localhost:4180/media/seed/tinker.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.376	2026-09-24 12:09:58.799
seed-media-84	seed-user-9	IMAGE	seed/84	\N	http://localhost:4180/media/seed/wayfarer.webp	http://localhost:4180/media/seed/wayfarer.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.38	2026-09-24 12:09:58.802
seed-media-85	seed-user-0	IMAGE	seed/85	\N	http://localhost:4180/media/seed/patch.webp	http://localhost:4180/media/seed/patch.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.385	2026-09-24 12:09:58.805
seed-media-86	seed-user-1	IMAGE	seed/86	\N	http://localhost:4180/media/seed/threadline.webp	http://localhost:4180/media/seed/threadline.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.389	2026-09-24 12:09:58.809
seed-media-87	seed-user-2	IMAGE	seed/87	\N	http://localhost:4180/media/seed/solstice.webp	http://localhost:4180/media/seed/solstice.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.394	2026-09-24 12:09:58.814
seed-media-89	seed-user-4	IMAGE	seed/89	\N	http://localhost:4180/media/seed/drift-space.webp	http://localhost:4180/media/seed/drift-space.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.405	2026-09-24 12:09:58.833
seed-media-90	seed-user-0	IMAGE	seed/90	\N	http://localhost:4180/media/seed/forma.webp	http://localhost:4180/media/seed/forma.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.41	2026-09-24 12:09:58.839
seed-media-91	seed-user-1	IMAGE	seed/91	\N	http://localhost:4180/media/seed/nova-robotics.webp	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.416	2026-09-24 12:09:58.85
seed-media-92	seed-user-2	IMAGE	seed/92	\N	http://localhost:4180/media/seed/moss.webp	http://localhost:4180/media/seed/moss.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.422	2026-09-24 12:09:58.871
seed-media-93	seed-user-3	IMAGE	seed/93	\N	http://localhost:4180/media/seed/relay.webp	http://localhost:4180/media/seed/relay.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.429	2026-09-24 12:09:58.893
seed-media-94	seed-user-4	IMAGE	seed/94	\N	http://localhost:4180/media/seed/kite.webp	http://localhost:4180/media/seed/kite.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.436	2026-09-24 12:09:58.899
seed-media-95	seed-user-5	IMAGE	seed/95	\N	http://localhost:4180/media/seed/orbit-studio.webp	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.443	2026-09-24 12:09:58.911
seed-media-96	seed-user-6	IMAGE	seed/96	\N	http://localhost:4180/media/seed/fieldwork.webp	http://localhost:4180/media/seed/fieldwork.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.445	2026-09-24 12:09:58.913
seed-media-97	seed-user-7	IMAGE	seed/97	\N	http://localhost:4180/media/seed/lumen-health.webp	http://localhost:4180/media/seed/lumen-health.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.449	2026-09-24 12:09:58.915
seed-media-98	seed-user-8	IMAGE	seed/98	\N	http://localhost:4180/media/seed/tinker.webp	http://localhost:4180/media/seed/tinker.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.451	2026-09-24 12:09:58.918
seed-media-99	seed-user-9	IMAGE	seed/99	\N	http://localhost:4180/media/seed/wayfarer.webp	http://localhost:4180/media/seed/wayfarer.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.455	2026-09-24 12:09:58.921
seed-media-100	seed-user-0	VIDEO	seed/100	\N	http://localhost:4180/media/seed/patch.mp4	http://localhost:4180/media/seed/patch.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.458	2026-09-24 12:09:58.925
seed-media-101	seed-user-1	VIDEO	seed/101	\N	http://localhost:4180/media/seed/threadline.mp4	http://localhost:4180/media/seed/threadline.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.462	2026-09-24 12:09:58.929
seed-media-102	seed-user-2	VIDEO	seed/102	\N	http://localhost:4180/media/seed/solstice.mp4	http://localhost:4180/media/seed/solstice.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.466	2026-09-24 12:09:58.935
seed-media-103	seed-user-3	VIDEO	seed/103	\N	http://localhost:4180/media/seed/arcade-garden.mp4	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.471	2026-09-24 12:09:58.94
seed-media-104	seed-user-4	VIDEO	seed/104	\N	http://localhost:4180/media/seed/drift-space.mp4	http://localhost:4180/media/seed/drift-space.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.475	2026-09-24 12:09:58.945
seed-media-105	seed-user-0	VIDEO	seed/105	\N	http://localhost:4180/media/seed/forma.mp4	http://localhost:4180/media/seed/forma.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.48	2026-09-24 12:09:58.952
seed-media-106	seed-user-1	VIDEO	seed/106	\N	http://localhost:4180/media/seed/nova-robotics.mp4	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.485	2026-09-24 12:09:58.958
seed-media-107	seed-user-2	VIDEO	seed/107	\N	http://localhost:4180/media/seed/moss.mp4	http://localhost:4180/media/seed/moss.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.491	2026-09-24 12:09:58.967
seed-media-108	seed-user-3	VIDEO	seed/108	\N	http://localhost:4180/media/seed/relay.mp4	http://localhost:4180/media/seed/relay.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.496	2026-09-24 12:09:58.973
seed-media-109	seed-user-4	VIDEO	seed/109	\N	http://localhost:4180/media/seed/kite.mp4	http://localhost:4180/media/seed/kite.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.502	2026-09-24 12:09:58.993
seed-media-110	seed-user-5	VIDEO	seed/110	\N	http://localhost:4180/media/seed/orbit-studio.mp4	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.507	2026-09-24 12:09:59.001
seed-media-75	seed-user-0	IMAGE	seed/75	\N	http://localhost:4180/media/seed/forma.webp	http://localhost:4180/media/seed/forma.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.348	2026-09-24 12:09:58.766
seed-media-76	seed-user-1	IMAGE	seed/76	\N	http://localhost:4180/media/seed/nova-robotics.webp	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.354	2026-09-24 12:09:58.771
seed-media-77	seed-user-2	IMAGE	seed/77	\N	http://localhost:4180/media/seed/moss.webp	http://localhost:4180/media/seed/moss.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.356	2026-09-24 12:09:58.78
seed-media-78	seed-user-3	IMAGE	seed/78	\N	http://localhost:4180/media/seed/relay.webp	http://localhost:4180/media/seed/relay.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.359	2026-09-24 12:09:58.782
seed-media-79	seed-user-4	IMAGE	seed/79	\N	http://localhost:4180/media/seed/kite.webp	http://localhost:4180/media/seed/kite.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.362	2026-09-24 12:09:58.784
seed-media-118	seed-user-3	VIDEO	seed/118	\N	http://localhost:4180/media/seed/arcade-garden.mp4	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.546	2026-09-24 12:09:59.087
seed-media-119	seed-user-4	VIDEO	seed/119	\N	http://localhost:4180/media/seed/drift-space.mp4	http://localhost:4180/media/seed/drift-space.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.55	2026-09-24 12:09:59.093
seed-media-120	seed-user-0	VIDEO	seed/120	\N	http://localhost:4180/media/seed/forma.mp4	http://localhost:4180/media/seed/forma.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.553	2026-09-24 12:09:59.103
seed-media-121	seed-user-1	VIDEO	seed/121	\N	http://localhost:4180/media/seed/nova-robotics.mp4	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.558	2026-09-24 12:09:59.112
seed-media-122	seed-user-2	VIDEO	seed/122	\N	http://localhost:4180/media/seed/moss.mp4	http://localhost:4180/media/seed/moss.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.562	2026-09-24 12:09:59.117
seed-media-123	seed-user-3	VIDEO	seed/123	\N	http://localhost:4180/media/seed/relay.mp4	http://localhost:4180/media/seed/relay.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.567	2026-09-24 12:09:59.123
seed-media-124	seed-user-4	VIDEO	seed/124	\N	http://localhost:4180/media/seed/kite.mp4	http://localhost:4180/media/seed/kite.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.571	2026-09-24 12:09:59.136
seed-media-125	seed-user-5	VIDEO	seed/125	\N	http://localhost:4180/media/seed/orbit-studio.mp4	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.576	2026-09-24 12:09:59.148
seed-media-126	seed-user-6	VIDEO	seed/126	\N	http://localhost:4180/media/seed/fieldwork.mp4	http://localhost:4180/media/seed/fieldwork.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.581	2026-09-24 12:09:59.153
seed-media-127	seed-user-7	VIDEO	seed/127	\N	http://localhost:4180/media/seed/lumen-health.mp4	http://localhost:4180/media/seed/lumen-health.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.588	2026-09-24 12:09:59.162
seed-media-128	seed-user-8	VIDEO	seed/128	\N	http://localhost:4180/media/seed/tinker.mp4	http://localhost:4180/media/seed/tinker.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.593	2026-09-24 12:09:59.167
seed-media-129	seed-user-9	VIDEO	seed/129	\N	http://localhost:4180/media/seed/wayfarer.mp4	http://localhost:4180/media/seed/wayfarer.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.599	2026-09-24 12:09:59.172
seed-media-130	seed-user-0	VIDEO	seed/130	\N	http://localhost:4180/media/seed/patch.mp4	http://localhost:4180/media/seed/patch.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.605	2026-09-24 12:09:59.179
seed-media-131	seed-user-1	VIDEO	seed/131	\N	http://localhost:4180/media/seed/threadline.mp4	http://localhost:4180/media/seed/threadline.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.612	2026-09-24 12:09:59.185
seed-media-132	seed-user-2	VIDEO	seed/132	\N	http://localhost:4180/media/seed/solstice.mp4	http://localhost:4180/media/seed/solstice.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.619	2026-09-24 12:09:59.192
seed-media-133	seed-user-3	VIDEO	seed/133	\N	http://localhost:4180/media/seed/arcade-garden.mp4	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.626	2026-09-24 12:09:59.199
seed-media-134	seed-user-4	VIDEO	seed/134	\N	http://localhost:4180/media/seed/drift-space.mp4	http://localhost:4180/media/seed/drift-space.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.628	2026-09-24 12:09:59.201
seed-media-135	seed-user-0	VIDEO	seed/135	\N	http://localhost:4180/media/seed/forma.mp4	http://localhost:4180/media/seed/forma.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.631	2026-09-24 12:09:59.203
seed-media-136	seed-user-1	VIDEO	seed/136	\N	http://localhost:4180/media/seed/nova-robotics.mp4	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.634	2026-09-24 12:09:59.209
seed-media-137	seed-user-2	VIDEO	seed/137	\N	http://localhost:4180/media/seed/moss.mp4	http://localhost:4180/media/seed/moss.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.637	2026-09-24 12:09:59.213
seed-media-138	seed-user-3	VIDEO	seed/138	\N	http://localhost:4180/media/seed/relay.mp4	http://localhost:4180/media/seed/relay.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.641	2026-09-24 12:09:59.216
seed-media-139	seed-user-4	VIDEO	seed/139	\N	http://localhost:4180/media/seed/kite.mp4	http://localhost:4180/media/seed/kite.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.645	2026-09-24 12:09:59.22
seed-media-140	seed-user-5	VIDEO	seed/140	\N	http://localhost:4180/media/seed/orbit-studio.mp4	http://localhost:4180/media/seed/orbit-studio.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.649	2026-09-24 12:09:59.223
seed-media-141	seed-user-6	VIDEO	seed/141	\N	http://localhost:4180/media/seed/fieldwork.mp4	http://localhost:4180/media/seed/fieldwork.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.652	2026-09-24 12:09:59.228
seed-media-142	seed-user-7	VIDEO	seed/142	\N	http://localhost:4180/media/seed/lumen-health.mp4	http://localhost:4180/media/seed/lumen-health.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.657	2026-09-24 12:09:59.232
seed-media-143	seed-user-8	VIDEO	seed/143	\N	http://localhost:4180/media/seed/tinker.mp4	http://localhost:4180/media/seed/tinker.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.661	2026-09-24 12:09:59.236
seed-media-144	seed-user-9	VIDEO	seed/144	\N	http://localhost:4180/media/seed/wayfarer.mp4	http://localhost:4180/media/seed/wayfarer.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.666	2026-09-24 12:09:59.244
seed-media-145	seed-user-0	VIDEO	seed/145	\N	http://localhost:4180/media/seed/patch.mp4	http://localhost:4180/media/seed/patch.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.671	2026-09-24 12:09:59.248
seed-media-146	seed-user-1	VIDEO	seed/146	\N	http://localhost:4180/media/seed/threadline.mp4	http://localhost:4180/media/seed/threadline.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.676	2026-09-24 12:09:59.252
seed-media-147	seed-user-2	VIDEO	seed/147	\N	http://localhost:4180/media/seed/solstice.mp4	http://localhost:4180/media/seed/solstice.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.682	2026-09-24 12:09:59.256
seed-media-113	seed-user-8	VIDEO	seed/113	\N	http://localhost:4180/media/seed/tinker.mp4	http://localhost:4180/media/seed/tinker.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.528	2026-09-24 12:09:59.049
seed-media-114	seed-user-9	VIDEO	seed/114	\N	http://localhost:4180/media/seed/wayfarer.mp4	http://localhost:4180/media/seed/wayfarer.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.534	2026-09-24 12:09:59.057
seed-media-115	seed-user-0	VIDEO	seed/115	\N	http://localhost:4180/media/seed/patch.mp4	http://localhost:4180/media/seed/patch.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.537	2026-09-24 12:09:59.065
seed-media-116	seed-user-1	VIDEO	seed/116	\N	http://localhost:4180/media/seed/threadline.mp4	http://localhost:4180/media/seed/threadline.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.54	2026-09-24 12:09:59.068
seed-media-117	seed-user-2	VIDEO	seed/117	\N	http://localhost:4180/media/seed/solstice.mp4	http://localhost:4180/media/seed/solstice.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.543	2026-09-24 12:09:59.082
cmuf9e9070005ut9bdagobeqd	seed-user-0	IMAGE	uploads/1790237854230-sample.png	http://localhost:4000/media/uploads/1790237854230-sample.png	http://localhost:4000/media/uploads/1790237854230-sample.png	http://localhost:4000/media/uploads/1790237854230-sample.png	720	1280	\N	image/png	68	READY	\N	2026-09-24 08:17:34.231	2026-09-24 08:17:34.587
seed-media-0	seed-user-0	IMAGE	seed/0	\N	http://localhost:4180/media/seed/forma.webp	http://localhost:4180/media/seed/forma.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:49.984	2026-09-24 12:09:58.305
seed-media-16	seed-user-1	IMAGE	seed/16	\N	http://localhost:4180/media/seed/nova-robotics.webp	http://localhost:4180/media/seed/nova-robotics.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.097	2026-09-24 12:09:58.489
seed-media-37	seed-user-7	IMAGE	seed/37	\N	http://localhost:4180/media/seed/lumen-health.webp	http://localhost:4180/media/seed/lumen-health.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.192	2026-09-24 12:09:58.57
seed-media-56	seed-user-1	IMAGE	seed/56	\N	http://localhost:4180/media/seed/threadline.webp	http://localhost:4180/media/seed/threadline.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.273	2026-09-24 12:09:58.659
seed-media-74	seed-user-4	IMAGE	seed/74	\N	http://localhost:4180/media/seed/drift-space.webp	http://localhost:4180/media/seed/drift-space.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.343	2026-09-24 12:09:58.759
seed-media-88	seed-user-3	IMAGE	seed/88	\N	http://localhost:4180/media/seed/arcade-garden.webp	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	\N	image/webp	80000	READY	\N	2026-09-23 23:31:50.399	2026-09-24 12:09:58.82
seed-media-111	seed-user-6	VIDEO	seed/111	\N	http://localhost:4180/media/seed/fieldwork.mp4	http://localhost:4180/media/seed/fieldwork.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.514	2026-09-24 12:09:59.024
seed-media-112	seed-user-7	VIDEO	seed/112	\N	http://localhost:4180/media/seed/lumen-health.mp4	http://localhost:4180/media/seed/lumen-health.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.521	2026-09-24 12:09:59.033
seed-media-148	seed-user-3	VIDEO	seed/148	\N	http://localhost:4180/media/seed/arcade-garden.mp4	http://localhost:4180/media/seed/arcade-garden.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.688	2026-09-24 12:09:59.261
seed-media-149	seed-user-4	VIDEO	seed/149	\N	http://localhost:4180/media/seed/drift-space.mp4	http://localhost:4180/media/seed/drift-space.webp	1200	900	6000	video/mp4	500000	READY	\N	2026-09-23 23:31:50.694	2026-09-24 12:09:59.266
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Message" (id, "conversationId", "senderId", body, "sharedPostId", "replyToId", "createdAt", "unsentAt") FROM stdin;
seed-message-1	seed-conversation-1	seed-user-1	Hey Maya! I saw your latest update on Forma. How did you approach the canvas interactions?	\N	\N	2026-09-23 23:31:50.771	\N
seed-message-2	seed-conversation-2	seed-user-2	That new prototype looks really thoughtful. Would love to compare notes sometime.	\N	\N	2026-09-23 23:31:50.773	\N
seed-message-3	seed-conversation-3	seed-user-3	Thanks for sharing your process. We are exploring something similar with our onboarding.	\N	\N	2026-09-23 23:31:50.775	\N
cmufa3m8t000qutxbdfhe8w0s	cmufa3m8h000outxbl775nime	cmufa3m6g000eutxbklb8fmke	Hello User B from integration test!	\N	\N	2026-09-24 08:37:17.789	\N
cmufa3m9j000sutxbxa06j1gk	cmufa3m8h000outxbl775nime	cmufa3m80000jutxbo0gbvb2e	Hello back User A! Received loud and clear.	\N	\N	2026-09-24 08:37:17.816	\N
cmufa6kci000outjb0kyel7k1	cmufa6kc2000mutjbjkwx3pm0	cmufa6ka9000cutjbpjyruycg	Hello User B from integration test!	\N	\N	2026-09-24 08:39:35.298	\N
cmufa6kd4000qutjbxi7p98x4	cmufa6kc2000mutjbjkwx3pm0	cmufa6kbm000hutjbrv6fprey	Hello back User A! Received loud and clear.	\N	\N	2026-09-24 08:39:35.32	\N
cmufa7jeg0019utvab7eejpn9	cmufa7je70017utvayewyx5yl	cmufa7jch000xutva9zo2jbsc	Hello User B from integration test!	\N	\N	2026-09-24 08:40:20.729	\N
cmufa7jf0001butvald8zomtx	cmufa7je70017utvayewyx5yl	cmufa7jdr0012utvae0pqohc2	Hello back User A! Received loud and clear.	\N	\N	2026-09-24 08:40:20.749	\N
cmufa8kpm0019ut3vsczl4zs6	cmufa8kp80017ut3vijw65z6q	cmufa8kn0000xut3v8luj9bd7	Hello User B from integration test!	\N	\N	2026-09-24 08:41:09.082	\N
cmufa8kq7001but3vs5sc1kks	cmufa8kp80017ut3vijw65z6q	cmufa8kor0012ut3vz4568jdf	Hello back User A! Received loud and clear.	\N	\N	2026-09-24 08:41:09.104	\N
cmufa94rl0022ut3vafqbsr3m	cmufa94rb0020ut3veh3b2erx	cmufa94pd001qut3vdj8g1md4	Hello User B from integration test!	\N	\N	2026-09-24 08:41:35.073	\N
cmufa94s00024ut3vvkgnfwqb	cmufa94rb0020ut3veh3b2erx	cmufa94qy001vut3vmjhf4879	Hello back User A! Received loud and clear.	\N	\N	2026-09-24 08:41:35.089	\N
seed-msg-0	seed-conversation-1	seed-user-1	Hey Maya! Loving the new Forma Canvas interactive whiteboard drop.	\N	\N	2026-09-24 07:58:38.413	\N
seed-msg-1	seed-conversation-1	seed-user-0	Thanks Alex! Really excited about the real-time sync engine we rolled out.	\N	\N	2026-09-24 08:58:38.418	\N
cmufavvo8000uutx56l91fcp4	cmufavvnk000sutx5qvwwtyvb	cmufavvj3000iutx5b3mjnwps	Hello User B from integration test!	\N	\N	2026-09-24 08:59:16.376	\N
cmufavvph000wutx5kdqb8gtr	cmufavvnk000sutx5qvwwtyvb	cmufavvmf000nutx5x7yz57wo	Hello back User A! Received loud and clear.	\N	\N	2026-09-24 08:59:16.422	\N
cmufbfm0l000qutr6spt53ksf	cmufbfm0c000outr6vpx79b3l	cmufbflyl000eutr6ryb7m033	Hello User B from integration test!	\N	\N	2026-09-24 09:14:36.982	\N
cmufbfm11000sutr67lifs4wi	cmufbfm0c000outr6vpx79b3l	cmufbflzv000jutr6w9j89r9e	Hello back User A! Received loud and clear.	\N	\N	2026-09-24 09:14:36.998	\N
cmufboip0001jutr6xpm08xj8	seed-conversation-3	seed-user-0	hi marcus	\N	\N	2026-09-24 09:21:32.581	\N
cmuffdkm7002eutr6z7xqdj98	cmuffdklu002cutr61l0lj91r	cmuffdkj40022utr6sj3iqi2f	Hello User B from integration test!	\N	\N	2026-09-24 11:05:00.32	\N
cmuffdkn2002gutr6ddv31h4i	cmuffdklu002cutr61l0lj91r	cmuffdkl70027utr6zhspnezt	Hello back User A! Received loud and clear.	\N	\N	2026-09-24 11:05:00.35	\N
\.


--
-- Data for Name: MessageHidden; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."MessageHidden" ("messageId", "userId") FROM stdin;
\.


--
-- Data for Name: MessageMedia; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."MessageMedia" ("messageId", "mediaId") FROM stdin;
\.


--
-- Data for Name: MessageRead; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."MessageRead" ("messageId", "userId", "readAt") FROM stdin;
cmufa3m8t000qutxbdfhe8w0s	cmufa3m80000jutxbo0gbvb2e	2026-09-24 08:37:17.807
cmufa6kci000outjb0kyel7k1	cmufa6kbm000hutjbrv6fprey	2026-09-24 08:39:35.314
cmufa7jeg0019utvab7eejpn9	cmufa7jdr0012utvae0pqohc2	2026-09-24 08:40:20.744
cmufa8kpm0019ut3vsczl4zs6	cmufa8kor0012ut3vz4568jdf	2026-09-24 08:41:09.099
cmufa94rl0022ut3vafqbsr3m	cmufa94qy001vut3vmjhf4879	2026-09-24 08:41:35.085
cmufavvo8000uutx56l91fcp4	cmufavvmf000nutx5x7yz57wo	2026-09-24 08:59:16.411
cmufbfm0l000qutr6spt53ksf	cmufbflzv000jutr6w9j89r9e	2026-09-24 09:14:36.995
seed-message-3	seed-user-0	2026-09-24 09:21:22.156
cmuffdkm7002eutr6z7xqdj98	cmuffdkl70027utr6zhspnezt	2026-09-24 11:05:00.345
\.


--
-- Data for Name: ModerationAction; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."ModerationAction" (id, "reportId", "moderatorId", action, note, "createdAt") FROM stdin;
\.


--
-- Data for Name: Mute; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Mute" ("muterId", "mutedId") FROM stdin;
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Notification" (id, "userId", "actorId", type, body, "postId", "startupId", "groupKey", "readAt", "createdAt") FROM stdin;
seed-notification-1	seed-user-0	seed-user-1	FOLLOW	Arjun Mehta started following you.	\N	\N	\N	\N	2026-09-23 22:31:50.775
seed-notification-2	seed-user-0	seed-user-2	COMMENT	Elena Torres commented on your launch.	seed-post-000	\N	\N	\N	2026-09-23 21:31:50.776
seed-notification-3	seed-user-0	seed-user-3	FOLLOW	Kabir Shah started following you.	\N	\N	\N	\N	2026-09-23 20:31:50.777
seed-notification-4	seed-user-0	seed-user-4	COMMENT	Sofia Andersson commented on your launch.	seed-post-000	\N	\N	\N	2026-09-23 19:31:50.777
seed-notification-5	seed-user-0	seed-user-5	FOLLOW	Nikhil Rao started following you.	\N	\N	\N	\N	2026-09-23 18:31:50.778
seed-notification-6	seed-user-0	seed-user-6	COMMENT	Amara Okafor commented on your launch.	seed-post-000	\N	\N	\N	2026-09-23 17:31:50.779
seed-notification-7	seed-user-0	seed-user-7	FOLLOW	Leo Park started following you.	\N	\N	\N	\N	2026-09-23 16:31:50.779
seed-notification-8	seed-user-0	seed-user-8	COMMENT	Riya Kapoor commented on your launch.	seed-post-000	\N	\N	\N	2026-09-23 15:31:50.78
seed-notification-9	seed-user-0	seed-user-9	FOLLOW	Oliver Reed started following you.	\N	\N	\N	\N	2026-09-23 14:31:50.78
seed-notification-10	seed-user-0	seed-user-10	COMMENT	Zoe Martin commented on your launch.	seed-post-000	\N	\N	\N	2026-09-23 13:31:50.781
seed-notification-11	seed-user-0	seed-user-11	FOLLOW	Dev Patel started following you.	\N	\N	\N	\N	2026-09-23 12:31:50.781
seed-notif-0	seed-user-0	seed-user-1	LIKE	Alex Rivera liked your post.	seed-post-0	\N	\N	2026-09-24 06:58:38.42	2026-09-24 06:58:38.42
seed-notif-1	seed-user-0	seed-user-6	STARTUP_FOLLOW	Priya Sharma followed Forma Canvas.	\N	seed-startup-0	\N	\N	2026-09-24 08:28:38.428
\.


--
-- Data for Name: NotificationPreference; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."NotificationPreference" ("userId", "inApp", push, email) FROM stdin;
\.


--
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Post" (id, "authorId", "startupId", "productId", kind, caption, tags, draft, "removedAt", "likeCount", "commentCount", "saveCount", "createdAt", "updatedAt") FROM stdin;
seed-post-0	seed-user-0	seed-startup-0	seed-prod-0	POST	Week 1 update on Forma Canvas: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	10	0	0	2026-08-30 08:56:57.694	2026-09-24 08:58:52.488
seed-post-129	seed-user-9	seed-startup-9	seed-product-9	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #synapse-health #buildinpublic	{reel,buildinpublic,tech}	f	\N	18	0	1	2026-09-21 12:31:50.599	2026-09-24 08:58:53.441
cmufa3lwt0009utxbfqtmuoqu	seed-user-0	cmufa3lsz0003utxbqhpiqi85	cmufa3lwf0007utxb0xicb5hh	LAUNCH	Officially announcing AutoProduct Engine on ProductScroll!	{autotest,launch}	f	\N	0	1	0	2026-09-24 08:37:17.357	2026-09-24 08:37:17.46
seed-post-98	seed-user-8	seed-startup-8	seed-prod-23	UPDATE	Week 33 update on OmniMorph: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-15 16:57:30.961	2026-09-24 08:58:53.214
seed-post-99	seed-user-9	seed-startup-9	seed-prod-24	POST	Week 34 update on Synapse Health: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-15 20:57:30.97	2026-09-24 08:58:53.221
seed-post-080	seed-user-5	seed-startup-5	seed-product-5	POST	A new chapter for Orbit Studio. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{AI,"Building in public"}	f	\N	7	1	0	2026-09-17 07:31:50.365	2026-09-23 23:31:50.365
seed-post-081	seed-user-6	seed-startup-6	seed-product-6	UPDATE	A new chapter for Fieldwork. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{SaaS,"Building in public"}	f	\N	8	0	1	2026-09-17 05:31:50.368	2026-09-23 23:31:50.369
seed-post-082	seed-user-7	seed-startup-7	seed-product-7	POST	A new chapter for Lumen Health. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Healthtech,"Building in public"}	f	\N	9	1	0	2026-09-17 03:31:50.372	2026-09-23 23:31:50.372
seed-post-083	seed-user-8	seed-startup-8	seed-product-8	POST	A new chapter for Tinker. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Education,"Building in public"}	f	\N	10	0	0	2026-09-17 01:31:50.376	2026-09-23 23:31:50.376
seed-post-084	seed-user-9	seed-startup-9	seed-product-9	LAUNCH	A new chapter for Wayfarer. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Mobility,"Building in public"}	f	\N	11	1	1	2026-09-16 23:31:50.38	2026-09-23 23:31:50.381
seed-post-077	seed-user-2	seed-startup-2	seed-product-2	LAUNCH	A new chapter for Moss. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Climate,"Building in public"}	f	\N	4	0	0	2026-09-17 13:31:50.356	2026-09-23 23:31:50.357
seed-post-085	seed-user-0	seed-startup-10	seed-product-10	POST	A new chapter for Patch. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Cybersecurity,"Building in public"}	f	\N	12	0	0	2026-09-16 21:31:50.385	2026-09-23 23:31:50.386
seed-post-2	seed-user-2	seed-startup-2	seed-prod-2	UPDATE	Week 1 update on PulseKit: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	10	0	0	2026-08-30 16:57:30.342	2026-09-24 08:58:52.538
seed-post-092	seed-user-2	seed-startup-2	seed-product-2	POST	Meet Moss One. Bring a little more outside, inside. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Climate,"Building in public"}	f	\N	19	1	0	2026-09-16 07:31:50.422	2026-09-23 23:31:50.422
seed-post-093	seed-user-3	seed-startup-3	seed-product-3	UPDATE	Meet Relay Deploy. Ship the idea. Skip the busywork. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{"Developer Tools","Building in public"}	f	\N	20	0	1	2026-09-16 05:31:50.429	2026-09-23 23:31:50.43
seed-post-094	seed-user-4	seed-startup-4	seed-product-4	POST	Meet Kite Maps. Your city, through a local lens. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{"Consumer Apps","Building in public"}	f	\N	21	1	0	2026-09-16 03:31:50.436	2026-09-23 23:31:50.436
seed-post-095	seed-user-5	seed-startup-5	seed-product-5	POST	Meet Orbit Notes. Turn a rough thought into a useful first draft. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{AI,"Building in public"}	f	\N	3	0	0	2026-09-16 01:31:50.443	2026-09-23 23:31:50.444
seed-post-007	seed-user-7	seed-startup-7	seed-product-7	LAUNCH	Meet Lumen Journal. Small habits. A clearer picture of your day. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Healthtech,"Building in public"}	f	\N	10	0	0	2026-09-23 09:31:50.044	2026-09-23 23:31:50.045
seed-post-008	seed-user-8	seed-startup-8	seed-product-8	POST	Meet Tinker Lab. The next generation learns by making. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Education,"Building in public"}	f	\N	11	1	0	2026-09-23 07:31:50.05	2026-09-23 23:31:50.05
seed-post-19	seed-user-19	seed-startup-4	seed-prod-19	LAUNCH	🚀 Big announcement: Introducing PulseKit Offline SDK! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-02 12:57:30.485	2026-09-24 08:58:52.648
seed-post-15	seed-user-15	seed-startup-0	seed-prod-15	POST	Week 6 update on Forma Canvas: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-01 20:57:30.454	2026-09-24 08:58:52.616
seed-post-16	seed-user-16	seed-startup-1	seed-prod-16	LAUNCH	🚀 Big announcement: Introducing SoundWave VST! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-02 00:57:30.467	2026-09-24 08:58:52.631
seed-post-17	seed-user-17	seed-startup-2	seed-prod-17	UPDATE	Week 6 update on PulseKit: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-02 04:57:30.473	2026-09-24 08:58:52.636
seed-post-135	seed-user-0	seed-startup-0	seed-product-0	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #forma-canvas #buildinpublic	{reel,buildinpublic,tech}	f	\N	5	0	1	2026-09-21 00:31:50.631	2026-09-24 08:58:53.483
seed-post-136	seed-user-1	seed-startup-1	seed-product-1	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #devflow-ai #buildinpublic	{reel,buildinpublic,tech}	f	\N	6	1	0	2026-09-20 22:31:50.634	2026-09-24 08:58:53.49
seed-post-100	seed-user-0	seed-startup-10	seed-product-10	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #gridpulse-iot #buildinpublic	{reel,buildinpublic,tech}	f	\N	8	1	0	2026-09-23 22:31:50.458	2026-09-24 08:58:53.228
seed-post-104	seed-user-4	seed-startup-14	seed-product-14	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #soundwave-labs #buildinpublic	{reel,buildinpublic,tech}	f	\N	12	1	0	2026-09-23 14:31:50.475	2026-09-24 08:58:53.255
seed-post-105	seed-user-0	seed-startup-0	seed-product-0	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #forma-canvas #buildinpublic	{reel,buildinpublic,tech}	f	\N	13	0	1	2026-09-23 12:31:50.48	2026-09-24 08:58:53.261
seed-post-107	seed-user-2	seed-startup-2	seed-product-2	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #pulsekit #buildinpublic	{reel,buildinpublic,tech}	f	\N	15	0	1	2026-09-23 08:31:50.491	2026-09-24 08:58:53.278
seed-post-138	seed-user-3	seed-startup-3	seed-product-3	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #veridion-security #buildinpublic	{reel,buildinpublic,tech}	f	\N	8	1	1	2026-09-20 18:31:50.641	2026-09-24 08:58:53.503
cmufa8k2z000lut3v9iehdweb	seed-user-0	cmufa8k1z000hut3vreh6lx1k	cmufa8k2t000jut3vm5xzjfu3	LAUNCH	Officially announcing AutoProduct Engine on ProductScroll!	{autotest,launch}	f	\N	0	1	0	2026-09-24 08:41:08.267	2026-09-24 08:41:08.333
seed-post-139	seed-user-4	seed-startup-4	seed-product-4	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #tensorsphere #buildinpublic	{reel,buildinpublic,tech}	f	\N	9	0	0	2026-09-20 16:31:50.645	2026-09-24 08:58:53.51
seed-post-21	seed-user-21	seed-startup-6	seed-prod-21	POST	Week 8 update on NovaScale: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-02 20:57:30.5	2026-09-24 08:58:52.659
seed-post-22	seed-user-22	seed-startup-7	seed-prod-22	LAUNCH	🚀 Big announcement: Introducing ZenDNS! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-03 00:57:30.506	2026-09-24 08:58:52.665
seed-post-23	seed-user-23	seed-startup-8	seed-prod-23	UPDATE	Week 8 update on OmniMorph: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-03 04:57:30.514	2026-09-24 08:58:52.672
seed-post-24	seed-user-24	seed-startup-9	seed-prod-24	POST	Week 9 update on Synapse Health: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-03 08:57:30.519	2026-09-24 08:58:52.677
seed-post-25	seed-user-25	seed-startup-10	seed-prod-0	LAUNCH	🚀 Big announcement: Introducing Forma Studio! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-03 12:57:30.523	2026-09-24 08:58:52.682
seed-post-26	seed-user-26	seed-startup-11	seed-prod-1	UPDATE	Week 9 update on RelayChat: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-03 16:57:30.531	2026-09-24 08:58:52.689
seed-post-126	seed-user-6	seed-startup-6	seed-product-6	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #novascale #buildinpublic	{reel,buildinpublic,tech}	f	\N	15	1	1	2026-09-21 18:31:50.581	2026-09-24 08:58:53.41
seed-post-130	seed-user-0	seed-startup-10	seed-product-10	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #gridpulse-iot #buildinpublic	{reel,buildinpublic,tech}	f	\N	19	1	0	2026-09-21 10:31:50.605	2026-09-24 08:58:53.447
seed-post-131	seed-user-1	seed-startup-11	seed-product-11	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #relaychat #buildinpublic	{reel,buildinpublic,tech}	f	\N	20	0	0	2026-09-21 08:31:50.612	2026-09-24 08:58:53.456
seed-post-132	seed-user-2	seed-startup-12	seed-product-12	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #hypermatrix #buildinpublic	{reel,buildinpublic,tech}	f	\N	21	1	1	2026-09-21 06:31:50.619	2026-09-24 08:58:53.463
seed-post-133	seed-user-3	seed-startup-13	seed-product-13	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #lumensolar #buildinpublic	{reel,buildinpublic,tech}	f	\N	3	0	0	2026-09-21 04:31:50.626	2026-09-24 08:58:53.471
seed-post-134	seed-user-4	seed-startup-14	seed-product-14	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #soundwave-labs #buildinpublic	{reel,buildinpublic,tech}	f	\N	4	1	0	2026-09-21 02:31:50.628	2026-09-24 08:58:53.477
seed-post-137	seed-user-2	seed-startup-2	seed-product-2	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #pulsekit #buildinpublic	{reel,buildinpublic,tech}	f	\N	7	0	0	2026-09-20 20:31:50.637	2026-09-24 08:58:53.496
seed-post-20	seed-user-20	seed-startup-5	seed-prod-20	UPDATE	Week 7 update on EcoCloud Compute: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-02 16:57:30.49	2026-09-24 08:58:52.653
seed-post-020	seed-user-5	seed-startup-5	seed-product-5	POST	A small look behind the scenes at Orbit Studio. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{AI,"Building in public"}	f	\N	4	1	0	2026-09-22 07:31:50.118	2026-09-23 23:31:50.119
seed-post-021	seed-user-6	seed-startup-6	seed-product-6	LAUNCH	A small look behind the scenes at Fieldwork. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{SaaS,"Building in public"}	f	\N	5	0	1	2026-09-22 05:31:50.121	2026-09-23 23:31:50.122
seed-post-149	seed-user-4	seed-startup-14	seed-product-14	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #soundwave-labs #buildinpublic	{reel,buildinpublic,tech}	f	\N	19	0	0	2026-09-19 20:31:50.694	2026-09-24 08:58:53.583
seed-post-120	seed-user-0	seed-startup-0	seed-product-0	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #forma-canvas #buildinpublic	{reel,buildinpublic,tech}	f	\N	9	1	1	2026-09-22 06:31:50.553	2026-09-24 08:58:53.369
seed-post-067	seed-user-7	seed-startup-7	seed-product-7	POST	Lumen Journal is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Healthtech,"Building in public"}	f	\N	13	0	0	2026-09-18 09:31:50.308	2026-09-23 23:31:50.308
seed-post-022	seed-user-7	seed-startup-7	seed-product-7	POST	A small look behind the scenes at Lumen Health. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Healthtech,"Building in public"}	f	\N	6	1	0	2026-09-22 03:31:50.124	2026-09-23 23:31:50.125
seed-post-023	seed-user-8	seed-startup-8	seed-product-8	POST	A small look behind the scenes at Tinker. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Education,"Building in public"}	f	\N	7	0	0	2026-09-22 01:31:50.128	2026-09-23 23:31:50.129
seed-post-024	seed-user-9	seed-startup-9	seed-product-9	UPDATE	A small look behind the scenes at Wayfarer. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Mobility,"Building in public"}	f	\N	8	1	1	2026-09-21 23:31:50.131	2026-09-23 23:31:50.131
cmufa94z3002cut3v8koed6rd	seed-user-0	cmufa94yf0028ut3vm9zohrm9	cmufa94yz002aut3vx56edw7c	LAUNCH	Officially announcing AutoProduct Engine on ProductScroll!	{autotest,launch}	f	\N	0	1	0	2026-09-24 08:41:35.344	2026-09-24 08:41:35.403
seed-post-009	seed-user-9	seed-startup-9	seed-product-9	UPDATE	Meet Wayfarer Cargo. A lighter footprint for the last mile. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Mobility,"Building in public"}	f	\N	12	0	1	2026-09-23 05:31:50.056	2026-09-23 23:31:50.057
seed-post-033	seed-user-3	seed-startup-3	seed-product-3	UPDATE	From our notebook to your screen. Here is a visual walkthrough of the idea behind Relay Deploy. Still early, still learning — feedback from builders is always welcome.	{"Developer Tools","Building in public"}	f	\N	17	0	1	2026-09-21 05:31:50.168	2026-09-23 23:31:50.168
seed-post-034	seed-user-4	seed-startup-4	seed-product-4	POST	From our notebook to your screen. Here is a visual walkthrough of the idea behind Kite Maps. Still early, still learning — feedback from builders is always welcome.	{"Consumer Apps","Building in public"}	f	\N	18	1	0	2026-09-21 03:31:50.173	2026-09-23 23:31:50.173
seed-post-035	seed-user-5	seed-startup-5	seed-product-5	LAUNCH	From our notebook to your screen. Here is a visual walkthrough of the idea behind Orbit Notes. Still early, still learning — feedback from builders is always welcome.	{AI,"Building in public"}	f	\N	19	0	0	2026-09-21 01:31:50.179	2026-09-23 23:31:50.18
seed-post-038	seed-user-8	seed-startup-8	seed-product-8	POST	From our notebook to your screen. Here is a visual walkthrough of the idea behind Tinker Lab. Still early, still learning — feedback from builders is always welcome.	{Education,"Building in public"}	f	\N	3	1	0	2026-09-20 19:31:50.198	2026-09-23 23:31:50.199
seed-post-039	seed-user-9	seed-startup-9	seed-product-9	UPDATE	From our notebook to your screen. Here is a visual walkthrough of the idea behind Wayfarer Cargo. Still early, still learning — feedback from builders is always welcome.	{Mobility,"Building in public"}	f	\N	4	0	1	2026-09-20 17:31:50.202	2026-09-23 23:31:50.202
seed-post-040	seed-user-0	seed-startup-10	seed-product-10	POST	From our notebook to your screen. Here is a visual walkthrough of the idea behind Patch Watch. Still early, still learning — feedback from builders is always welcome.	{Cybersecurity,"Building in public"}	f	\N	5	1	0	2026-09-20 15:31:50.204	2026-09-23 23:31:50.205
seed-post-041	seed-user-1	seed-startup-11	seed-product-11	POST	From our notebook to your screen. Here is a visual walkthrough of the idea behind Threadline Stories. Still early, still learning — feedback from builders is always welcome.	{"Creator Economy","Building in public"}	f	\N	6	0	0	2026-09-20 13:31:50.207	2026-09-23 23:31:50.208
seed-post-042	seed-user-2	seed-startup-12	seed-product-12	LAUNCH	From our notebook to your screen. Here is a visual walkthrough of the idea behind Solstice Meter. Still early, still learning — feedback from builders is always welcome.	{Hardware,"Building in public"}	f	\N	7	1	1	2026-09-20 11:31:50.211	2026-09-23 23:31:50.211
seed-post-043	seed-user-3	seed-startup-13	seed-product-13	POST	From our notebook to your screen. Here is a visual walkthrough of the idea behind Garden Worlds. Still early, still learning — feedback from builders is always welcome.	{Gaming,"Building in public"}	f	\N	8	0	0	2026-09-20 09:31:50.214	2026-09-23 23:31:50.214
seed-post-044	seed-user-4	seed-startup-14	seed-product-14	POST	From our notebook to your screen. Here is a visual walkthrough of the idea behind Drift Atlas. Still early, still learning — feedback from builders is always welcome.	{Space,"Building in public"}	f	\N	9	1	0	2026-09-20 07:31:50.216	2026-09-23 23:31:50.217
seed-post-045	seed-user-0	seed-startup-0	seed-product-0	UPDATE	One thing we learned building Forma: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Design,"Building in public"}	f	\N	10	0	1	2026-09-20 05:31:50.22	2026-09-23 23:31:50.221
seed-post-046	seed-user-1	seed-startup-1	seed-product-1	POST	One thing we learned building Nova Robotics: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Robotics,"Building in public"}	f	\N	11	1	0	2026-09-20 03:31:50.224	2026-09-23 23:31:50.225
seed-post-011	seed-user-1	seed-startup-11	seed-product-11	POST	Meet Threadline Stories. Independent voices, connected. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{"Creator Economy","Building in public"}	f	\N	14	0	0	2026-09-23 01:31:50.069	2026-09-23 23:31:50.07
seed-post-106	seed-user-1	seed-startup-1	seed-product-1	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #devflow-ai #buildinpublic	{reel,buildinpublic,tech}	f	\N	14	1	0	2026-09-23 10:31:50.485	2026-09-24 08:58:53.271
seed-post-108	seed-user-3	seed-startup-3	seed-product-3	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #veridion-security #buildinpublic	{reel,buildinpublic,tech}	f	\N	16	1	1	2026-09-23 06:31:50.496	2026-09-24 08:58:53.284
seed-post-109	seed-user-4	seed-startup-4	seed-product-4	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #tensorsphere #buildinpublic	{reel,buildinpublic,tech}	f	\N	17	0	0	2026-09-23 04:31:50.502	2026-09-24 08:58:53.291
seed-post-012	seed-user-2	seed-startup-12	seed-product-12	UPDATE	Meet Solstice Meter. Make every watt count. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Hardware,"Building in public"}	f	\N	15	1	1	2026-09-22 23:31:50.075	2026-09-23 23:31:50.075
seed-post-013	seed-user-3	seed-startup-13	seed-product-13	POST	Meet Garden Worlds. Little worlds with room to wonder. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Gaming,"Building in public"}	f	\N	16	0	0	2026-09-22 21:31:50.082	2026-09-23 23:31:50.082
seed-post-014	seed-user-4	seed-startup-14	seed-product-14	LAUNCH	Meet Drift Atlas. Space data, closer to home. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Space,"Building in public"}	f	\N	17	1	0	2026-09-22 19:31:50.086	2026-09-23 23:31:50.086
seed-post-019	seed-user-4	seed-startup-4	seed-product-4	POST	A small look behind the scenes at Kite. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{"Consumer Apps","Building in public"}	f	\N	3	0	0	2026-09-22 09:31:50.116	2026-09-23 23:31:50.117
seed-post-015	seed-user-0	seed-startup-0	seed-product-0	UPDATE	A small look behind the scenes at Forma. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Design,"Building in public"}	f	\N	18	0	1	2026-09-22 17:31:50.091	2026-09-23 23:31:50.091
seed-post-016	seed-user-1	seed-startup-1	seed-product-1	POST	A small look behind the scenes at Nova Robotics. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Robotics,"Building in public"}	f	\N	19	1	0	2026-09-22 15:31:50.097	2026-09-23 23:31:50.097
seed-post-017	seed-user-2	seed-startup-2	seed-product-2	POST	A small look behind the scenes at Moss. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Climate,"Building in public"}	f	\N	20	0	0	2026-09-22 13:31:50.103	2026-09-23 23:31:50.104
seed-post-018	seed-user-3	seed-startup-3	seed-product-3	UPDATE	A small look behind the scenes at Relay. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{"Developer Tools","Building in public"}	f	\N	21	1	1	2026-09-22 11:31:50.109	2026-09-23 23:31:50.11
seed-post-28	seed-user-28	seed-startup-13	seed-prod-3	LAUNCH	🚀 Big announcement: Introducing DevFlow Cloud Monitor! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-04 00:57:30.543	2026-09-24 08:58:52.7
seed-post-29	seed-user-29	seed-startup-14	seed-prod-4	UPDATE	Week 10 update on SoundWave Labs: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-04 04:57:30.551	2026-09-24 08:58:52.707
seed-post-30	seed-user-0	seed-startup-0	seed-prod-5	POST	Week 11 update on Forma Canvas: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-04 08:57:30.557	2026-09-24 08:58:52.718
seed-post-43	seed-user-13	seed-startup-13	seed-prod-18	LAUNCH	🚀 Big announcement: Introducing DevFlow Time Machine! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-06 12:57:30.657	2026-09-24 08:58:52.81
seed-post-44	seed-user-14	seed-startup-14	seed-prod-19	UPDATE	Week 15 update on SoundWave Labs: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-06 16:57:30.663	2026-09-24 08:58:52.816
seed-post-45	seed-user-15	seed-startup-0	seed-prod-20	POST	Week 16 update on Forma Canvas: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-06 20:57:30.667	2026-09-24 08:58:52.823
seed-post-46	seed-user-16	seed-startup-1	seed-prod-21	LAUNCH	🚀 Big announcement: Introducing NovaCustomer Portal! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-07 00:57:30.672	2026-09-24 08:58:52.832
seed-post-47	seed-user-17	seed-startup-2	seed-prod-22	UPDATE	Week 16 update on PulseKit: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-07 04:57:30.678	2026-09-24 08:58:52.84
seed-post-010	seed-user-0	seed-startup-10	seed-product-10	POST	Meet Patch Watch. Know what changed. Know what matters. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Cybersecurity,"Building in public"}	f	\N	13	1	0	2026-09-23 03:31:50.062	2026-09-23 23:31:50.063
seed-post-48	seed-user-18	seed-startup-3	seed-prod-23	POST	Week 17 update on Veridion Security: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-07 08:57:30.684	2026-09-24 08:58:52.847
seed-post-49	seed-user-19	seed-startup-4	seed-prod-24	LAUNCH	🚀 Big announcement: Introducing SoundWave Spatial Audio SDK! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-07 12:57:30.689	2026-09-24 08:58:52.853
seed-post-50	seed-user-20	seed-startup-5	seed-prod-0	UPDATE	Week 17 update on EcoCloud Compute: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-07 16:57:30.696	2026-09-24 08:58:52.861
seed-post-110	seed-user-5	seed-startup-5	seed-product-5	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #ecocloud #buildinpublic	{reel,buildinpublic,tech}	f	\N	18	1	0	2026-09-23 02:31:50.508	2026-09-24 08:58:53.3
seed-post-51	seed-user-21	seed-startup-6	seed-prod-1	POST	Week 18 update on NovaScale: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-07 20:57:30.702	2026-09-24 08:58:52.869
seed-post-52	seed-user-22	seed-startup-7	seed-prod-2	LAUNCH	🚀 Big announcement: Introducing DevFlow CLI! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-08 00:57:30.706	2026-09-24 08:58:52.876
seed-post-53	seed-user-23	seed-startup-8	seed-prod-3	UPDATE	Week 18 update on OmniMorph: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-08 04:57:30.71	2026-09-24 08:58:52.883
seed-post-54	seed-user-24	seed-startup-9	seed-prod-4	POST	Week 19 update on Synapse Health: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-08 08:57:30.715	2026-09-24 08:58:52.892
seed-post-55	seed-user-25	seed-startup-10	seed-prod-5	LAUNCH	🚀 Big announcement: Introducing Veridion Guard! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-08 12:57:30.719	2026-09-24 08:58:52.902
seed-post-56	seed-user-26	seed-startup-11	seed-prod-6	UPDATE	Week 19 update on RelayChat: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-08 16:57:30.724	2026-09-24 08:58:52.909
seed-post-57	seed-user-27	seed-startup-12	seed-prod-7	POST	Week 20 update on HyperMatrix: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-08 20:57:30.729	2026-09-24 08:58:52.916
seed-post-58	seed-user-28	seed-startup-13	seed-prod-8	LAUNCH	🚀 Big announcement: Introducing NovaMeter! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-09 00:57:30.734	2026-09-24 08:58:52.923
seed-post-59	seed-user-29	seed-startup-14	seed-prod-9	UPDATE	Week 20 update on SoundWave Labs: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-09 04:57:30.738	2026-09-24 08:58:52.93
seed-post-60	seed-user-0	seed-startup-0	seed-prod-10	POST	Week 21 update on Forma Canvas: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-09 08:57:30.743	2026-09-24 08:58:52.937
seed-post-61	seed-user-1	seed-startup-1	seed-prod-11	LAUNCH	🚀 Big announcement: Introducing Synapse Patch! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-09 12:57:30.748	2026-09-24 08:58:52.943
seed-post-62	seed-user-2	seed-startup-2	seed-prod-12	UPDATE	Week 21 update on PulseKit: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-09 16:57:30.753	2026-09-24 08:58:52.949
seed-post-63	seed-user-3	seed-startup-3	seed-prod-13	POST	Week 22 update on Veridion Security: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-09 20:57:30.757	2026-09-24 08:58:52.958
seed-post-64	seed-user-4	seed-startup-4	seed-prod-14	LAUNCH	🚀 Big announcement: Introducing HyperFlow Builder! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-10 00:57:30.763	2026-09-24 08:58:52.969
seed-post-65	seed-user-5	seed-startup-5	seed-prod-15	UPDATE	Week 22 update on EcoCloud Compute: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-10 04:57:30.772	2026-09-24 08:58:52.975
seed-post-39	seed-user-9	seed-startup-9	seed-prod-14	POST	Week 14 update on Synapse Health: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-05 20:57:30.634	2026-09-24 08:58:52.783
seed-post-40	seed-user-10	seed-startup-10	seed-prod-15	LAUNCH	🚀 Big announcement: Introducing LumenCell Photovoltaic! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-06 00:57:30.64	2026-09-24 08:58:52.791
seed-post-41	seed-user-11	seed-startup-11	seed-prod-16	UPDATE	Week 14 update on RelayChat: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-06 04:57:30.647	2026-09-24 08:58:52.798
seed-post-71	seed-user-11	seed-startup-11	seed-prod-21	UPDATE	Week 24 update on RelayChat: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-11 04:57:30.804	2026-09-24 08:58:53.021
seed-post-72	seed-user-12	seed-startup-12	seed-prod-22	POST	Week 25 update on HyperMatrix: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-11 08:57:30.811	2026-09-24 08:58:53.028
seed-post-73	seed-user-13	seed-startup-13	seed-prod-23	LAUNCH	🚀 Big announcement: Introducing Relay Encrypted Backup! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-11 12:57:30.817	2026-09-24 08:58:53.037
seed-post-74	seed-user-14	seed-startup-14	seed-prod-24	UPDATE	Week 25 update on SoundWave Labs: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-11 16:57:30.83	2026-09-24 08:58:53.042
seed-post-42	seed-user-12	seed-startup-12	seed-prod-17	POST	Week 15 update on HyperMatrix: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-06 08:57:30.652	2026-09-24 08:58:52.805
seed-post-76	seed-user-16	seed-startup-1	seed-prod-1	LAUNCH	🚀 Big announcement: Introducing Forma Reader! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-12 00:57:30.84	2026-09-24 08:58:53.056
seed-post-77	seed-user-17	seed-startup-2	seed-prod-2	UPDATE	Week 26 update on PulseKit: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-12 04:57:30.845	2026-09-24 08:58:53.069
seed-post-78	seed-user-18	seed-startup-3	seed-prod-3	POST	Week 27 update on Veridion Security: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-12 08:57:30.85	2026-09-24 08:58:53.076
seed-post-114	seed-user-9	seed-startup-9	seed-product-9	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #synapse-health #buildinpublic	{reel,buildinpublic,tech}	f	\N	3	1	1	2026-09-22 18:31:50.534	2026-09-24 08:58:53.326
seed-post-115	seed-user-0	seed-startup-10	seed-product-10	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #gridpulse-iot #buildinpublic	{reel,buildinpublic,tech}	f	\N	4	0	0	2026-09-22 16:31:50.537	2026-09-24 08:58:53.334
seed-post-79	seed-user-19	seed-startup-4	seed-prod-4	LAUNCH	🚀 Big announcement: Introducing PulseKit Engine! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-12 12:57:30.857	2026-09-24 08:58:53.084
seed-post-80	seed-user-20	seed-startup-5	seed-prod-5	UPDATE	Week 27 update on EcoCloud Compute: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-12 16:57:30.861	2026-09-24 08:58:53.092
seed-post-81	seed-user-21	seed-startup-6	seed-prod-6	POST	Week 28 update on NovaScale: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-12 20:57:30.866	2026-09-24 08:58:53.104
seed-post-82	seed-user-22	seed-startup-7	seed-prod-7	LAUNCH	🚀 Big announcement: Introducing EcoFunctions! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-13 00:57:30.871	2026-09-24 08:58:53.111
seed-post-83	seed-user-23	seed-startup-8	seed-prod-8	UPDATE	Week 28 update on OmniMorph: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-13 04:57:30.874	2026-09-24 08:58:53.119
seed-post-84	seed-user-24	seed-startup-9	seed-prod-9	POST	Week 29 update on Synapse Health: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-13 08:57:30.878	2026-09-24 08:58:53.125
seed-post-85	seed-user-25	seed-startup-10	seed-prod-10	LAUNCH	🚀 Big announcement: Introducing OmniAnimator! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-13 12:57:30.883	2026-09-24 08:58:53.132
seed-post-86	seed-user-26	seed-startup-11	seed-prod-11	UPDATE	Week 29 update on RelayChat: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-13 16:57:30.888	2026-09-24 08:58:53.139
seed-post-87	seed-user-27	seed-startup-12	seed-prod-12	POST	Week 30 update on HyperMatrix: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-13 20:57:30.896	2026-09-24 08:58:53.144
seed-post-88	seed-user-28	seed-startup-13	seed-prod-13	LAUNCH	🚀 Big announcement: Introducing Relay Messenger Desktop! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-14 00:57:30.902	2026-09-24 08:58:53.149
seed-post-89	seed-user-29	seed-startup-14	seed-prod-14	UPDATE	Week 30 update on SoundWave Labs: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-14 04:57:30.906	2026-09-24 08:58:53.156
seed-post-90	seed-user-0	seed-startup-0	seed-prod-15	POST	Week 31 update on Forma Canvas: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-14 08:57:30.912	2026-09-24 08:58:53.161
seed-post-91	seed-user-1	seed-startup-1	seed-prod-16	LAUNCH	🚀 Big announcement: Introducing SoundWave VST! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-14 12:57:30.917	2026-09-24 08:58:53.168
seed-post-92	seed-user-2	seed-startup-2	seed-prod-17	UPDATE	Week 31 update on PulseKit: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-14 16:57:30.93	2026-09-24 08:58:53.175
seed-post-93	seed-user-3	seed-startup-3	seed-prod-18	POST	Week 32 update on Veridion Security: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-14 20:57:30.935	2026-09-24 08:58:53.182
seed-post-67	seed-user-7	seed-startup-7	seed-prod-17	LAUNCH	🚀 Big announcement: Introducing Forma Mobile Companion! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-10 12:57:30.782	2026-09-24 08:58:52.989
seed-post-68	seed-user-8	seed-startup-8	seed-prod-18	UPDATE	Week 23 update on OmniMorph: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-10 16:57:30.787	2026-09-24 08:58:52.995
seed-post-69	seed-user-9	seed-startup-9	seed-prod-19	POST	Week 24 update on Synapse Health: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-10 20:57:30.791	2026-09-24 08:58:53.004
seed-post-94	seed-user-4	seed-startup-4	seed-prod-19	LAUNCH	🚀 Big announcement: Introducing PulseKit Offline SDK! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-15 00:57:30.939	2026-09-24 08:58:53.189
seed-post-95	seed-user-5	seed-startup-5	seed-prod-20	UPDATE	Week 32 update on EcoCloud Compute: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-15 04:57:30.945	2026-09-24 08:58:53.195
seed-post-054	seed-user-9	seed-startup-9	seed-product-9	UPDATE	One thing we learned building Wayfarer: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Mobility,"Building in public"}	f	\N	19	1	1	2026-09-19 11:31:50.261	2026-09-23 23:31:50.262
seed-post-055	seed-user-0	seed-startup-10	seed-product-10	POST	One thing we learned building Patch: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Cybersecurity,"Building in public"}	f	\N	20	0	0	2026-09-19 09:31:50.268	2026-09-23 23:31:50.268
seed-post-70	seed-user-10	seed-startup-10	seed-prod-20	LAUNCH	🚀 Big announcement: Introducing TensorBench Suite! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-11 00:57:30.8	2026-09-24 08:58:53.01
seed-post-118	seed-user-3	seed-startup-13	seed-product-13	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #lumensolar #buildinpublic	{reel,buildinpublic,tech}	f	\N	7	1	0	2026-09-22 10:31:50.546	2026-09-24 08:58:53.354
seed-post-121	seed-user-1	seed-startup-1	seed-product-1	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #devflow-ai #buildinpublic	{reel,buildinpublic,tech}	f	\N	10	0	0	2026-09-22 04:31:50.558	2026-09-24 08:58:53.375
seed-post-056	seed-user-1	seed-startup-11	seed-product-11	LAUNCH	One thing we learned building Threadline: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{"Creator Economy","Building in public"}	f	\N	21	1	0	2026-09-19 07:31:50.273	2026-09-23 23:31:50.273
seed-post-061	seed-user-1	seed-startup-1	seed-product-1	POST	Nova Arm is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Robotics,"Building in public"}	f	\N	7	0	0	2026-09-18 21:31:50.287	2026-09-23 23:31:50.288
seed-post-062	seed-user-2	seed-startup-2	seed-product-2	POST	Moss One is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Climate,"Building in public"}	f	\N	8	1	0	2026-09-18 19:31:50.289	2026-09-23 23:31:50.29
seed-post-063	seed-user-3	seed-startup-3	seed-product-3	LAUNCH	Relay Deploy is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{"Developer Tools","Building in public"}	f	\N	9	0	1	2026-09-18 17:31:50.292	2026-09-23 23:31:50.293
seed-post-064	seed-user-4	seed-startup-4	seed-product-4	POST	Kite Maps is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{"Consumer Apps","Building in public"}	f	\N	10	1	0	2026-09-18 15:31:50.296	2026-09-23 23:31:50.296
seed-post-065	seed-user-5	seed-startup-5	seed-product-5	POST	Orbit Notes is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{AI,"Building in public"}	f	\N	11	0	0	2026-09-18 13:31:50.3	2026-09-23 23:31:50.3
seed-post-066	seed-user-6	seed-startup-6	seed-product-6	UPDATE	Fieldwork Research is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{SaaS,"Building in public"}	f	\N	12	1	1	2026-09-18 11:31:50.304	2026-09-23 23:31:50.304
seed-post-068	seed-user-8	seed-startup-8	seed-product-8	POST	Tinker Lab is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Education,"Building in public"}	f	\N	14	1	0	2026-09-18 07:31:50.311	2026-09-23 23:31:50.312
seed-post-069	seed-user-9	seed-startup-9	seed-product-9	UPDATE	Wayfarer Cargo is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Mobility,"Building in public"}	f	\N	15	0	1	2026-09-18 05:31:50.316	2026-09-23 23:31:50.317
seed-post-070	seed-user-0	seed-startup-10	seed-product-10	LAUNCH	Patch Watch is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Cybersecurity,"Building in public"}	f	\N	16	1	0	2026-09-18 03:31:50.322	2026-09-23 23:31:50.322
seed-post-071	seed-user-1	seed-startup-11	seed-product-11	POST	Threadline Stories is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{"Creator Economy","Building in public"}	f	\N	17	0	0	2026-09-18 01:31:50.327	2026-09-23 23:31:50.328
seed-post-072	seed-user-2	seed-startup-12	seed-product-12	UPDATE	Solstice Meter is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Hardware,"Building in public"}	f	\N	18	1	1	2026-09-17 23:31:50.332	2026-09-23 23:31:50.332
cmufbfm8g0010utr680q1938y	seed-user-0	cmufbfm7u000wutr6q3u8jxae	cmufbfm8c000yutr68332r93n	LAUNCH	Officially announcing AutoProduct Engine on ProductScroll!	{autotest,launch}	f	\N	0	1	0	2026-09-24 09:14:37.264	2026-09-24 09:14:37.31
seed-post-073	seed-user-3	seed-startup-13	seed-product-13	POST	Garden Worlds is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Gaming,"Building in public"}	f	\N	19	0	0	2026-09-17 21:31:50.337	2026-09-23 23:31:50.338
seed-post-074	seed-user-4	seed-startup-14	seed-product-14	POST	Drift Atlas is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Space,"Building in public"}	f	\N	20	1	0	2026-09-17 19:31:50.343	2026-09-23 23:31:50.344
seed-post-075	seed-user-0	seed-startup-0	seed-product-0	UPDATE	A new chapter for Forma. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Design,"Building in public"}	f	\N	21	0	1	2026-09-17 17:31:50.348	2026-09-23 23:31:50.349
seed-post-3	seed-user-3	seed-startup-3	seed-prod-3	POST	Week 2 update on Veridion Security: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	10	0	0	2026-08-30 20:57:30.349	2026-09-24 08:58:52.543
seed-post-5	seed-user-5	seed-startup-5	seed-prod-5	UPDATE	Week 2 update on EcoCloud Compute: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-08-31 04:57:30.373	2026-09-24 08:58:52.557
seed-post-6	seed-user-6	seed-startup-6	seed-prod-6	POST	Week 3 update on NovaScale: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-08-31 08:57:30.383	2026-09-24 08:58:52.564
seed-post-7	seed-user-7	seed-startup-7	seed-prod-7	LAUNCH	🚀 Big announcement: Introducing EcoFunctions! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-08-31 12:57:30.388	2026-09-24 08:58:52.571
seed-post-101	seed-user-1	seed-startup-11	seed-product-11	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #relaychat #buildinpublic	{reel,buildinpublic,tech}	f	\N	9	0	0	2026-09-23 20:31:50.463	2026-09-24 08:58:53.236
seed-post-000	seed-user-0	seed-startup-0	seed-product-0	LAUNCH	Meet Forma Canvas. A calmer home for your next big idea. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Design,"Building in public"}	f	\N	3	1	1	2026-09-23 23:31:49.992	2026-09-23 23:31:49.992
seed-post-001	seed-user-1	seed-startup-1	seed-product-1	POST	Meet Nova Arm. Small robots. Extraordinary possibilities. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Robotics,"Building in public"}	f	\N	4	0	0	2026-09-23 21:31:50.014	2026-09-23 23:31:50.015
seed-post-002	seed-user-2	seed-startup-2	seed-product-2	POST	Meet Moss One. Bring a little more outside, inside. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Climate,"Building in public"}	f	\N	5	1	0	2026-09-23 19:31:50.018	2026-09-23 23:31:50.019
seed-post-003	seed-user-3	seed-startup-3	seed-product-3	UPDATE	Meet Relay Deploy. Ship the idea. Skip the busywork. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{"Developer Tools","Building in public"}	f	\N	6	0	1	2026-09-23 17:31:50.023	2026-09-23 23:31:50.023
seed-post-004	seed-user-4	seed-startup-4	seed-product-4	POST	Meet Kite Maps. Your city, through a local lens. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{"Consumer Apps","Building in public"}	f	\N	7	1	0	2026-09-23 15:31:50.028	2026-09-23 23:31:50.029
cmuffdlbi002vutr63iogugfk	seed-user-0	cmuffdlan002rutr6bh129lau	cmuffdlbb002tutr6cu5sgpwx	LAUNCH	Officially announcing AutoProduct Engine on ProductScroll!	{autotest,launch}	f	\N	0	1	0	2026-09-24 11:05:01.23	2026-09-24 11:05:01.293
cmufa6k2n0007utjbz01znhey	seed-user-0	cmufa6k100003utjbtz5ufzcx	cmufa6k2f0005utjb4hjtu8ia	LAUNCH	Officially announcing AutoProduct Engine on ProductScroll!	{autotest,launch}	f	\N	0	1	0	2026-09-24 08:39:34.944	2026-09-24 08:39:35.016
seed-post-102	seed-user-2	seed-startup-12	seed-product-12	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #hypermatrix #buildinpublic	{reel,buildinpublic,tech}	f	\N	10	1	1	2026-09-23 18:31:50.466	2026-09-24 08:58:53.242
seed-post-103	seed-user-3	seed-startup-13	seed-product-13	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #lumensolar #buildinpublic	{reel,buildinpublic,tech}	f	\N	11	0	0	2026-09-23 16:31:50.471	2026-09-24 08:58:53.25
seed-post-96	seed-user-6	seed-startup-6	seed-prod-21	POST	Week 33 update on NovaScale: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-15 08:57:30.949	2026-09-24 08:58:53.201
seed-post-97	seed-user-7	seed-startup-7	seed-prod-22	LAUNCH	🚀 Big announcement: Introducing ZenDNS! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-15 12:57:30.955	2026-09-24 08:58:53.208
seed-post-052	seed-user-7	seed-startup-7	seed-product-7	POST	One thing we learned building Lumen Health: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Healthtech,"Building in public"}	f	\N	17	1	0	2026-09-19 15:31:50.251	2026-09-23 23:31:50.252
seed-post-14	seed-user-14	seed-startup-14	seed-prod-14	UPDATE	Week 5 update on SoundWave Labs: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-01 16:57:30.446	2026-09-24 08:58:52.611
seed-post-27	seed-user-27	seed-startup-12	seed-prod-2	POST	Week 10 update on HyperMatrix: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-03 20:57:30.537	2026-09-24 08:58:52.694
seed-post-38	seed-user-8	seed-startup-8	seed-prod-13	UPDATE	Week 13 update on OmniMorph: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-05 16:57:30.626	2026-09-24 08:58:52.776
seed-post-66	seed-user-6	seed-startup-6	seed-prod-16	POST	Week 23 update on NovaScale: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-10 08:57:30.777	2026-09-24 08:58:52.984
seed-post-122	seed-user-2	seed-startup-2	seed-product-2	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #pulsekit #buildinpublic	{reel,buildinpublic,tech}	f	\N	11	1	0	2026-09-22 02:31:50.562	2026-09-24 08:58:53.383
seed-post-8	seed-user-8	seed-startup-8	seed-prod-8	UPDATE	Week 3 update on OmniMorph: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-08-31 16:57:30.395	2026-09-24 08:58:52.577
seed-post-9	seed-user-9	seed-startup-9	seed-prod-9	POST	Week 4 update on Synapse Health: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-08-31 20:57:30.401	2026-09-24 08:58:52.582
seed-post-4	seed-user-4	seed-startup-4	seed-prod-4	LAUNCH	🚀 Big announcement: Introducing PulseKit Engine! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	10	0	0	2026-08-31 00:57:30.364	2026-09-24 08:58:52.551
seed-post-005	seed-user-5	seed-startup-5	seed-product-5	POST	Meet Orbit Notes. Turn a rough thought into a useful first draft. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{AI,"Building in public"}	f	\N	8	0	0	2026-09-23 13:31:50.033	2026-09-23 23:31:50.034
seed-post-006	seed-user-6	seed-startup-6	seed-product-6	UPDATE	Meet Fieldwork Research. Better research starts with listening. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{SaaS,"Building in public"}	f	\N	9	1	1	2026-09-23 11:31:50.038	2026-09-23 23:31:50.039
seed-post-025	seed-user-0	seed-startup-10	seed-product-10	POST	A small look behind the scenes at Patch. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Cybersecurity,"Building in public"}	f	\N	9	0	0	2026-09-21 21:31:50.134	2026-09-23 23:31:50.134
seed-post-026	seed-user-1	seed-startup-11	seed-product-11	POST	A small look behind the scenes at Threadline. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{"Creator Economy","Building in public"}	f	\N	10	1	0	2026-09-21 19:31:50.137	2026-09-23 23:31:50.137
seed-post-027	seed-user-2	seed-startup-12	seed-product-12	UPDATE	A small look behind the scenes at Solstice. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Hardware,"Building in public"}	f	\N	11	0	1	2026-09-21 17:31:50.141	2026-09-23 23:31:50.142
seed-post-028	seed-user-3	seed-startup-13	seed-product-13	LAUNCH	A small look behind the scenes at Arcade Garden. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Gaming,"Building in public"}	f	\N	12	1	0	2026-09-21 15:31:50.145	2026-09-23 23:31:50.146
seed-post-148	seed-user-3	seed-startup-13	seed-product-13	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #lumensolar #buildinpublic	{reel,buildinpublic,tech}	f	\N	18	1	0	2026-09-19 22:31:50.688	2026-09-24 08:58:53.576
seed-post-086	seed-user-1	seed-startup-11	seed-product-11	POST	A new chapter for Threadline. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{"Creator Economy","Building in public"}	f	\N	13	1	0	2026-09-16 19:31:50.389	2026-09-23 23:31:50.39
seed-post-087	seed-user-2	seed-startup-12	seed-product-12	UPDATE	A new chapter for Solstice. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Hardware,"Building in public"}	f	\N	14	0	1	2026-09-16 17:31:50.394	2026-09-23 23:31:50.395
seed-post-088	seed-user-3	seed-startup-13	seed-product-13	POST	A new chapter for Arcade Garden. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Gaming,"Building in public"}	f	\N	15	1	0	2026-09-16 15:31:50.399	2026-09-23 23:31:50.4
seed-post-089	seed-user-4	seed-startup-14	seed-product-14	POST	A new chapter for Drift Space. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Space,"Building in public"}	f	\N	16	0	0	2026-09-16 13:31:50.405	2026-09-23 23:31:50.405
seed-post-090	seed-user-0	seed-startup-0	seed-product-0	UPDATE	Meet Forma Canvas. A calmer home for your next big idea. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Design,"Building in public"}	f	\N	17	1	1	2026-09-16 11:31:50.41	2026-09-23 23:31:50.411
seed-post-091	seed-user-1	seed-startup-1	seed-product-1	LAUNCH	Meet Nova Arm. Small robots. Extraordinary possibilities. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Robotics,"Building in public"}	f	\N	18	0	0	2026-09-16 09:31:50.416	2026-09-23 23:31:50.417
cmufa7ijc0007utvacxh1fihi	seed-user-0	cmufa7iih0003utvamrh5gd9j	cmufa7ij60005utva0oufcpv2	LAUNCH	Officially announcing AutoProduct Engine on ProductScroll!	{autotest,launch}	f	\N	0	1	0	2026-09-24 08:40:19.609	2026-09-24 08:40:19.679
seed-post-116	seed-user-1	seed-startup-11	seed-product-11	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #relaychat #buildinpublic	{reel,buildinpublic,tech}	f	\N	5	1	0	2026-09-22 14:31:50.54	2026-09-24 08:58:53.34
seed-post-117	seed-user-2	seed-startup-12	seed-product-12	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #hypermatrix #buildinpublic	{reel,buildinpublic,tech}	f	\N	6	0	1	2026-09-22 12:31:50.543	2026-09-24 08:58:53.347
seed-post-119	seed-user-4	seed-startup-14	seed-product-14	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #soundwave-labs #buildinpublic	{reel,buildinpublic,tech}	f	\N	8	0	0	2026-09-22 08:31:50.55	2026-09-24 08:58:53.36
seed-post-10	seed-user-10	seed-startup-10	seed-prod-10	LAUNCH	🚀 Big announcement: Introducing OmniAnimator! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-01 00:57:30.407	2026-09-24 08:58:52.587
seed-post-146	seed-user-1	seed-startup-11	seed-product-11	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #relaychat #buildinpublic	{reel,buildinpublic,tech}	f	\N	16	1	0	2026-09-20 02:31:50.676	2026-09-24 08:58:53.559
seed-post-1	seed-user-1	seed-startup-1	seed-prod-1	LAUNCH	🚀 Big announcement: Introducing Forma Reader! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	10	0	0	2026-08-30 12:57:30.323	2026-09-24 08:58:52.532
seed-post-031	seed-user-1	seed-startup-1	seed-product-1	POST	From our notebook to your screen. Here is a visual walkthrough of the idea behind Nova Arm. Still early, still learning — feedback from builders is always welcome.	{Robotics,"Building in public"}	f	\N	15	0	0	2026-09-21 09:31:50.158	2026-09-23 23:31:50.158
seed-post-032	seed-user-2	seed-startup-2	seed-product-2	POST	From our notebook to your screen. Here is a visual walkthrough of the idea behind Moss One. Still early, still learning — feedback from builders is always welcome.	{Climate,"Building in public"}	f	\N	16	1	0	2026-09-21 07:31:50.163	2026-09-23 23:31:50.164
seed-post-18	seed-user-18	seed-startup-3	seed-prod-18	POST	Week 7 update on Veridion Security: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-02 08:57:30.479	2026-09-24 08:58:52.642
seed-post-123	seed-user-3	seed-startup-3	seed-product-3	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #veridion-security #buildinpublic	{reel,buildinpublic,tech}	f	\N	12	0	1	2026-09-22 00:31:50.567	2026-09-24 08:58:53.39
seed-post-124	seed-user-4	seed-startup-4	seed-product-4	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #tensorsphere #buildinpublic	{reel,buildinpublic,tech}	f	\N	13	1	0	2026-09-21 22:31:50.571	2026-09-24 08:58:53.396
seed-post-125	seed-user-5	seed-startup-5	seed-product-5	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #ecocloud #buildinpublic	{reel,buildinpublic,tech}	f	\N	14	0	0	2026-09-21 20:31:50.576	2026-09-24 08:58:53.404
seed-post-036	seed-user-6	seed-startup-6	seed-product-6	UPDATE	From our notebook to your screen. Here is a visual walkthrough of the idea behind Fieldwork Research. Still early, still learning — feedback from builders is always welcome.	{SaaS,"Building in public"}	f	\N	20	1	1	2026-09-20 23:31:50.185	2026-09-23 23:31:50.185
seed-post-037	seed-user-7	seed-startup-7	seed-product-7	POST	From our notebook to your screen. Here is a visual walkthrough of the idea behind Lumen Journal. Still early, still learning — feedback from builders is always welcome.	{Healthtech,"Building in public"}	f	\N	21	0	0	2026-09-20 21:31:50.192	2026-09-23 23:31:50.192
seed-post-047	seed-user-2	seed-startup-2	seed-product-2	POST	One thing we learned building Moss: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Climate,"Building in public"}	f	\N	12	0	0	2026-09-20 01:31:50.229	2026-09-23 23:31:50.229
seed-post-048	seed-user-3	seed-startup-3	seed-product-3	UPDATE	One thing we learned building Relay: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{"Developer Tools","Building in public"}	f	\N	13	1	1	2026-09-19 23:31:50.233	2026-09-23 23:31:50.234
seed-post-049	seed-user-4	seed-startup-4	seed-product-4	LAUNCH	One thing we learned building Kite: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{"Consumer Apps","Building in public"}	f	\N	14	0	0	2026-09-19 21:31:50.237	2026-09-23 23:31:50.238
seed-post-050	seed-user-5	seed-startup-5	seed-product-5	POST	One thing we learned building Orbit Studio: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{AI,"Building in public"}	f	\N	15	1	0	2026-09-19 19:31:50.241	2026-09-23 23:31:50.241
seed-post-051	seed-user-6	seed-startup-6	seed-product-6	UPDATE	One thing we learned building Fieldwork: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{SaaS,"Building in public"}	f	\N	16	0	1	2026-09-19 17:31:50.246	2026-09-23 23:31:50.247
seed-post-31	seed-user-1	seed-startup-1	seed-prod-6	LAUNCH	🚀 Big announcement: Introducing TensorJIT! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-04 12:57:30.571	2026-09-24 08:58:52.724
seed-post-32	seed-user-2	seed-startup-2	seed-prod-7	UPDATE	Week 11 update on PulseKit: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-04 16:57:30.583	2026-09-24 08:58:52.729
seed-post-33	seed-user-3	seed-startup-3	seed-prod-8	POST	Week 12 update on Veridion Security: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-04 20:57:30.591	2026-09-24 08:58:52.735
seed-post-34	seed-user-4	seed-startup-4	seed-prod-9	LAUNCH	🚀 Big announcement: Introducing ZenProxy! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-05 00:57:30.598	2026-09-24 08:58:52.741
seed-post-35	seed-user-5	seed-startup-5	seed-prod-10	UPDATE	Week 12 update on EcoCloud Compute: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-05 04:57:30.605	2026-09-24 08:58:52.75
seed-post-36	seed-user-6	seed-startup-6	seed-prod-11	POST	Week 13 update on NovaScale: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-05 08:57:30.614	2026-09-24 08:58:52.756
seed-post-37	seed-user-7	seed-startup-7	seed-prod-12	LAUNCH	🚀 Big announcement: Introducing GridPulse Sensor Probe! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-05 12:57:30.62	2026-09-24 08:58:52.761
seed-post-11	seed-user-11	seed-startup-11	seed-prod-11	UPDATE	Week 4 update on RelayChat: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-01 04:57:30.421	2026-09-24 08:58:52.593
seed-post-12	seed-user-12	seed-startup-12	seed-prod-12	POST	Week 5 update on HyperMatrix: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-01 08:57:30.428	2026-09-24 08:58:52.6
seed-post-13	seed-user-13	seed-startup-13	seed-prod-13	LAUNCH	🚀 Big announcement: Introducing Relay Messenger Desktop! We're opening access to beta testers today. #launch #startups	{launch,startups,beta}	f	\N	0	0	0	2026-09-01 12:57:30.437	2026-09-24 08:58:52.605
cmufavwa80014utx5kugpo8zs	seed-user-0	cmufavw8c0010utx5jdozl1qi	cmufavw9s0012utx54zwywo8f	LAUNCH	Officially announcing AutoProduct Engine on ProductScroll!	{autotest,launch}	f	\N	0	1	0	2026-09-24 08:59:17.168	2026-09-24 08:59:17.299
seed-post-078	seed-user-3	seed-startup-3	seed-product-3	UPDATE	A new chapter for Relay. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{"Developer Tools","Building in public"}	f	\N	5	1	1	2026-09-17 11:31:50.359	2026-09-23 23:31:50.359
seed-post-111	seed-user-6	seed-startup-6	seed-product-6	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #novascale #buildinpublic	{reel,buildinpublic,tech}	f	\N	19	0	1	2026-09-23 00:31:50.514	2026-09-24 08:58:53.306
seed-post-112	seed-user-7	seed-startup-7	seed-product-7	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #zenroute #buildinpublic	{reel,buildinpublic,tech}	f	\N	20	1	0	2026-09-22 22:31:50.521	2026-09-24 08:58:53.312
seed-post-113	seed-user-8	seed-startup-8	seed-product-8	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #omnimorph #buildinpublic	{reel,buildinpublic,tech}	f	\N	21	0	0	2026-09-22 20:31:50.528	2026-09-24 08:58:53.32
seed-post-029	seed-user-4	seed-startup-14	seed-product-14	POST	A small look behind the scenes at Drift Space. This week we stripped away three steps from the first-use experience. Sometimes the best feature is the one you remove.	{Space,"Building in public"}	f	\N	13	0	0	2026-09-21 13:31:50.149	2026-09-23 23:31:50.149
seed-post-053	seed-user-8	seed-startup-8	seed-product-8	POST	One thing we learned building Tinker: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Education,"Building in public"}	f	\N	18	0	0	2026-09-19 13:31:50.256	2026-09-23 23:31:50.257
seed-post-030	seed-user-0	seed-startup-0	seed-product-0	UPDATE	From our notebook to your screen. Here is a visual walkthrough of the idea behind Forma Canvas. Still early, still learning — feedback from builders is always welcome.	{Design,"Building in public"}	f	\N	14	1	1	2026-09-21 11:31:50.152	2026-09-23 23:31:50.153
seed-post-076	seed-user-1	seed-startup-1	seed-product-1	POST	A new chapter for Nova Robotics. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{Robotics,"Building in public"}	f	\N	3	1	0	2026-09-17 15:31:50.354	2026-09-23 23:31:50.354
seed-post-079	seed-user-4	seed-startup-4	seed-product-4	POST	A new chapter for Kite. We are testing the next iteration with a small group of makers. What would you want us to explore next?	{"Consumer Apps","Building in public"}	f	\N	6	0	0	2026-09-17 09:31:50.362	2026-09-23 23:31:50.363
seed-post-147	seed-user-2	seed-startup-12	seed-product-12	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #hypermatrix #buildinpublic	{reel,buildinpublic,tech}	f	\N	17	0	1	2026-09-20 00:31:50.682	2026-09-24 08:58:53.569
seed-post-127	seed-user-7	seed-startup-7	seed-product-7	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #zenroute #buildinpublic	{reel,buildinpublic,tech}	f	\N	16	0	0	2026-09-21 16:31:50.588	2026-09-24 08:58:53.418
seed-post-128	seed-user-8	seed-startup-8	seed-product-8	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #omnimorph #buildinpublic	{reel,buildinpublic,tech}	f	\N	17	1	0	2026-09-21 14:31:50.593	2026-09-24 08:58:53.433
seed-post-140	seed-user-5	seed-startup-5	seed-product-5	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #ecocloud #buildinpublic	{reel,buildinpublic,tech}	f	\N	10	1	0	2026-09-20 14:31:50.648	2026-09-24 08:58:53.518
seed-post-141	seed-user-6	seed-startup-6	seed-product-6	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #novascale #buildinpublic	{reel,buildinpublic,tech}	f	\N	11	0	1	2026-09-20 12:31:50.652	2026-09-24 08:58:53.524
seed-post-096	seed-user-6	seed-startup-6	seed-product-6	UPDATE	Meet Fieldwork Research. Better research starts with listening. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{SaaS,"Building in public"}	f	\N	4	1	1	2026-09-15 23:31:50.445	2026-09-23 23:31:50.446
seed-post-097	seed-user-7	seed-startup-7	seed-product-7	POST	Meet Lumen Journal. Small habits. A clearer picture of your day. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Healthtech,"Building in public"}	f	\N	5	0	0	2026-09-15 21:31:50.449	2026-09-23 23:31:50.449
seed-post-098	seed-user-8	seed-startup-8	seed-product-8	LAUNCH	Meet Tinker Lab. The next generation learns by making. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Education,"Building in public"}	f	\N	6	1	0	2026-09-15 19:31:50.451	2026-09-23 23:31:50.452
seed-post-099	seed-user-9	seed-startup-9	seed-product-9	UPDATE	Meet Wayfarer Cargo. A lighter footprint for the last mile. We have been quietly building this, and today we are opening the doors. Curious what you would make with it.	{Mobility,"Building in public"}	f	\N	7	0	1	2026-09-15 17:31:50.455	2026-09-23 23:31:50.455
seed-post-142	seed-user-7	seed-startup-7	seed-product-7	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #zenroute #buildinpublic	{reel,buildinpublic,tech}	f	\N	12	1	0	2026-09-20 10:31:50.657	2026-09-24 08:58:53.531
seed-post-143	seed-user-8	seed-startup-8	seed-product-8	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #omnimorph #buildinpublic	{reel,buildinpublic,tech}	f	\N	13	0	0	2026-09-20 08:31:50.662	2026-09-24 08:58:53.538
seed-post-144	seed-user-9	seed-startup-9	seed-product-9	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #synapse-health #buildinpublic	{reel,buildinpublic,tech}	f	\N	14	1	1	2026-09-20 06:31:50.666	2026-09-24 08:58:53.543
seed-post-145	seed-user-0	seed-startup-10	seed-product-10	REEL	Check out how we built this rapid microservice workflow in 15 seconds! 🔥 #gridpulse-iot #buildinpublic	{reel,buildinpublic,tech}	f	\N	15	0	0	2026-09-20 04:31:50.671	2026-09-24 08:58:53.551
seed-post-75	seed-user-15	seed-startup-0	seed-prod-0	POST	Week 26 update on Forma Canvas: Shipped telemetry optimizations and reduced latency by 35%. #updates	{update,engineering}	f	\N	0	0	0	2026-09-11 20:57:30.835	2026-09-24 08:58:53.05
seed-post-057	seed-user-2	seed-startup-12	seed-product-12	UPDATE	One thing we learned building Solstice: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Hardware,"Building in public"}	f	\N	3	0	1	2026-09-19 05:31:50.278	2026-09-23 23:31:50.279
seed-post-058	seed-user-3	seed-startup-13	seed-product-13	POST	One thing we learned building Arcade Garden: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Gaming,"Building in public"}	f	\N	4	1	0	2026-09-19 03:31:50.28	2026-09-23 23:31:50.281
seed-post-059	seed-user-4	seed-startup-14	seed-product-14	POST	One thing we learned building Drift Space: the details people notice are rarely the ones you expect. Sharing a little progress from the workshop today.	{Space,"Building in public"}	f	\N	5	0	0	2026-09-19 01:31:50.282	2026-09-23 23:31:50.283
seed-post-060	seed-user-0	seed-startup-0	seed-product-0	UPDATE	Forma Canvas is taking shape. We redesigned the onboarding after sitting down with early users. Here is what that process taught us about keeping things simple.	{Design,"Building in public"}	f	\N	6	1	1	2026-09-18 23:31:50.285	2026-09-23 23:31:50.285
\.


--
-- Data for Name: PostMedia; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."PostMedia" ("postId", "mediaId", "position") FROM stdin;
seed-post-000	seed-media-0	0
seed-post-001	seed-media-1	0
seed-post-002	seed-media-2	0
seed-post-003	seed-media-3	0
seed-post-004	seed-media-4	0
seed-post-005	seed-media-5	0
seed-post-006	seed-media-6	0
seed-post-007	seed-media-7	0
seed-post-008	seed-media-8	0
seed-post-009	seed-media-9	0
seed-post-010	seed-media-10	0
seed-post-011	seed-media-11	0
seed-post-012	seed-media-12	0
seed-post-013	seed-media-13	0
seed-post-014	seed-media-14	0
seed-post-015	seed-media-15	0
seed-post-016	seed-media-16	0
seed-post-017	seed-media-17	0
seed-post-018	seed-media-18	0
seed-post-019	seed-media-19	0
seed-post-020	seed-media-20	0
seed-post-021	seed-media-21	0
seed-post-022	seed-media-22	0
seed-post-023	seed-media-23	0
seed-post-024	seed-media-24	0
seed-post-025	seed-media-25	0
seed-post-026	seed-media-26	0
seed-post-027	seed-media-27	0
seed-post-028	seed-media-28	0
seed-post-029	seed-media-29	0
seed-post-030	seed-media-30	0
seed-post-031	seed-media-31	0
seed-post-032	seed-media-32	0
seed-post-033	seed-media-33	0
seed-post-034	seed-media-34	0
seed-post-035	seed-media-35	0
seed-post-036	seed-media-36	0
seed-post-037	seed-media-37	0
seed-post-038	seed-media-38	0
seed-post-039	seed-media-39	0
seed-post-040	seed-media-40	0
seed-post-041	seed-media-41	0
seed-post-042	seed-media-42	0
seed-post-043	seed-media-43	0
seed-post-044	seed-media-44	0
seed-post-045	seed-media-45	0
seed-post-046	seed-media-46	0
seed-post-047	seed-media-47	0
seed-post-048	seed-media-48	0
seed-post-049	seed-media-49	0
seed-post-050	seed-media-50	0
seed-post-051	seed-media-51	0
seed-post-052	seed-media-52	0
seed-post-053	seed-media-53	0
seed-post-054	seed-media-54	0
seed-post-055	seed-media-55	0
seed-post-056	seed-media-56	0
seed-post-057	seed-media-57	0
seed-post-058	seed-media-58	0
seed-post-059	seed-media-59	0
seed-post-060	seed-media-60	0
seed-post-061	seed-media-61	0
seed-post-062	seed-media-62	0
seed-post-063	seed-media-63	0
seed-post-064	seed-media-64	0
seed-post-065	seed-media-65	0
seed-post-066	seed-media-66	0
seed-post-067	seed-media-67	0
seed-post-068	seed-media-68	0
seed-post-069	seed-media-69	0
seed-post-070	seed-media-70	0
seed-post-071	seed-media-71	0
seed-post-072	seed-media-72	0
seed-post-073	seed-media-73	0
seed-post-074	seed-media-74	0
seed-post-075	seed-media-75	0
seed-post-076	seed-media-76	0
seed-post-077	seed-media-77	0
seed-post-078	seed-media-78	0
seed-post-079	seed-media-79	0
seed-post-080	seed-media-80	0
seed-post-081	seed-media-81	0
seed-post-082	seed-media-82	0
seed-post-083	seed-media-83	0
seed-post-084	seed-media-84	0
seed-post-085	seed-media-85	0
seed-post-086	seed-media-86	0
seed-post-087	seed-media-87	0
seed-post-088	seed-media-88	0
seed-post-089	seed-media-89	0
seed-post-090	seed-media-90	0
seed-post-091	seed-media-91	0
seed-post-092	seed-media-92	0
seed-post-093	seed-media-93	0
seed-post-094	seed-media-94	0
seed-post-095	seed-media-95	0
seed-post-096	seed-media-96	0
seed-post-097	seed-media-97	0
seed-post-098	seed-media-98	0
seed-post-099	seed-media-99	0
seed-post-100	seed-media-100	0
seed-post-101	seed-media-101	0
seed-post-102	seed-media-102	0
seed-post-103	seed-media-103	0
seed-post-104	seed-media-104	0
seed-post-105	seed-media-105	0
seed-post-106	seed-media-106	0
seed-post-107	seed-media-107	0
seed-post-108	seed-media-108	0
seed-post-109	seed-media-109	0
seed-post-110	seed-media-110	0
seed-post-111	seed-media-111	0
seed-post-112	seed-media-112	0
seed-post-113	seed-media-113	0
seed-post-114	seed-media-114	0
seed-post-115	seed-media-115	0
seed-post-116	seed-media-116	0
seed-post-117	seed-media-117	0
seed-post-118	seed-media-118	0
seed-post-119	seed-media-119	0
seed-post-120	seed-media-120	0
seed-post-121	seed-media-121	0
seed-post-122	seed-media-122	0
seed-post-123	seed-media-123	0
seed-post-124	seed-media-124	0
seed-post-125	seed-media-125	0
seed-post-126	seed-media-126	0
seed-post-127	seed-media-127	0
seed-post-128	seed-media-128	0
seed-post-129	seed-media-129	0
seed-post-130	seed-media-130	0
seed-post-131	seed-media-131	0
seed-post-132	seed-media-132	0
seed-post-133	seed-media-133	0
seed-post-134	seed-media-134	0
seed-post-135	seed-media-135	0
seed-post-136	seed-media-136	0
seed-post-137	seed-media-137	0
seed-post-138	seed-media-138	0
seed-post-139	seed-media-139	0
seed-post-140	seed-media-140	0
seed-post-141	seed-media-141	0
seed-post-142	seed-media-142	0
seed-post-143	seed-media-143	0
seed-post-144	seed-media-144	0
seed-post-145	seed-media-145	0
seed-post-146	seed-media-146	0
seed-post-147	seed-media-147	0
seed-post-148	seed-media-148	0
seed-post-149	seed-media-149	0
seed-post-0	seed-media-0	0
seed-post-1	seed-media-1	0
seed-post-2	seed-media-2	0
seed-post-3	seed-media-3	0
seed-post-4	seed-media-4	0
seed-post-5	seed-media-5	0
seed-post-6	seed-media-6	0
seed-post-7	seed-media-7	0
seed-post-8	seed-media-8	0
seed-post-9	seed-media-9	0
seed-post-10	seed-media-10	0
seed-post-11	seed-media-11	0
seed-post-12	seed-media-12	0
seed-post-13	seed-media-13	0
seed-post-14	seed-media-14	0
seed-post-15	seed-media-15	0
seed-post-16	seed-media-16	0
seed-post-17	seed-media-17	0
seed-post-18	seed-media-18	0
seed-post-19	seed-media-19	0
seed-post-20	seed-media-20	0
seed-post-21	seed-media-21	0
seed-post-22	seed-media-22	0
seed-post-23	seed-media-23	0
seed-post-24	seed-media-24	0
seed-post-25	seed-media-25	0
seed-post-26	seed-media-26	0
seed-post-27	seed-media-27	0
seed-post-28	seed-media-28	0
seed-post-29	seed-media-29	0
seed-post-30	seed-media-30	0
seed-post-31	seed-media-31	0
seed-post-32	seed-media-32	0
seed-post-33	seed-media-33	0
seed-post-34	seed-media-34	0
seed-post-35	seed-media-35	0
seed-post-36	seed-media-36	0
seed-post-37	seed-media-37	0
seed-post-38	seed-media-38	0
seed-post-39	seed-media-39	0
seed-post-40	seed-media-40	0
seed-post-41	seed-media-41	0
seed-post-42	seed-media-42	0
seed-post-43	seed-media-43	0
seed-post-44	seed-media-44	0
seed-post-45	seed-media-45	0
seed-post-46	seed-media-46	0
seed-post-47	seed-media-47	0
seed-post-48	seed-media-48	0
seed-post-49	seed-media-49	0
seed-post-50	seed-media-50	0
seed-post-51	seed-media-51	0
seed-post-52	seed-media-52	0
seed-post-53	seed-media-53	0
seed-post-54	seed-media-54	0
seed-post-55	seed-media-55	0
seed-post-56	seed-media-56	0
seed-post-57	seed-media-57	0
seed-post-58	seed-media-58	0
seed-post-59	seed-media-59	0
seed-post-60	seed-media-60	0
seed-post-61	seed-media-61	0
seed-post-62	seed-media-62	0
seed-post-63	seed-media-63	0
seed-post-64	seed-media-64	0
seed-post-65	seed-media-65	0
seed-post-66	seed-media-66	0
seed-post-67	seed-media-67	0
seed-post-68	seed-media-68	0
seed-post-69	seed-media-69	0
seed-post-70	seed-media-70	0
seed-post-71	seed-media-71	0
seed-post-72	seed-media-72	0
seed-post-73	seed-media-73	0
seed-post-74	seed-media-74	0
seed-post-75	seed-media-75	0
seed-post-76	seed-media-76	0
seed-post-77	seed-media-77	0
seed-post-78	seed-media-78	0
seed-post-79	seed-media-79	0
seed-post-80	seed-media-80	0
seed-post-81	seed-media-81	0
seed-post-82	seed-media-82	0
seed-post-83	seed-media-83	0
seed-post-84	seed-media-84	0
seed-post-85	seed-media-85	0
seed-post-86	seed-media-86	0
seed-post-87	seed-media-87	0
seed-post-88	seed-media-88	0
seed-post-89	seed-media-89	0
seed-post-90	seed-media-90	0
seed-post-91	seed-media-91	0
seed-post-92	seed-media-92	0
seed-post-93	seed-media-93	0
seed-post-94	seed-media-94	0
seed-post-95	seed-media-95	0
seed-post-96	seed-media-96	0
seed-post-97	seed-media-97	0
seed-post-98	seed-media-98	0
seed-post-99	seed-media-99	0
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Product" (id, slug, name, description, category, website, "imageUrl", status, "releaseNotes", "launchDate", "startupId", "createdAt", "updatedAt") FROM stdin;
seed-product-1	nova-robotics-one	Nova Arm	A modular desktop robot arm for makers, educators and small workshops. Built to be repaired, understood and extended.	Robotics	https://example.com/nova-robotics	http://localhost:4180/media/seed/nova-robotics.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-22 23:31:49.942	seed-startup-1	2026-09-23 23:31:49.943	2026-09-24 12:09:58.265
seed-product-2	moss-one	Moss One	A quiet, soil-aware indoor growing system that helps urban homes grow herbs with less water and no guesswork.	Climate	https://example.com/moss	http://localhost:4180/media/seed/moss.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-21 23:31:49.944	seed-startup-2	2026-09-23 23:31:49.944	2026-09-24 12:09:58.266
seed-product-3	relay-one	Relay Deploy	A preview environment for every branch, with readable deployment logs and a simple path from prototype to production.	Developer Tools	https://example.com/relay	http://localhost:4180/media/seed/relay.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-20 23:31:49.945	seed-startup-3	2026-09-23 23:31:49.946	2026-09-24 12:09:58.267
seed-product-4	kite-one	Kite Maps	Thoughtfully curated walking routes, independent shops and neighbourhood stories from people who call the city home.	Consumer Apps	https://example.com/kite	http://localhost:4180/media/seed/kite.webp	LAUNCHED	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-19 23:31:49.947	seed-startup-4	2026-09-23 23:31:49.947	2026-09-24 12:09:58.269
seed-product-5	orbit-studio-one	Orbit Notes	A private writing companion for teams that need clear meeting notes and grounded answers from their own documents.	AI	https://example.com/orbit-studio	http://localhost:4180/media/seed/orbit-studio.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-18 23:31:49.948	seed-startup-5	2026-09-23 23:31:49.948	2026-09-24 12:09:58.27
seed-product-6	fieldwork-one	Fieldwork Research	Customer research that connects interviews, observations and product decisions without burying teams in spreadsheets.	SaaS	https://example.com/fieldwork	http://localhost:4180/media/seed/fieldwork.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-17 23:31:49.949	seed-startup-6	2026-09-23 23:31:49.95	2026-09-24 12:09:58.271
seed-product-7	lumen-health-one	Lumen Journal	A personal wellbeing journal focused on reflection and routines. It helps people notice patterns without clinical claims.	Healthtech	https://example.com/lumen-health	http://localhost:4180/media/seed/lumen-health.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-16 23:31:49.951	seed-startup-7	2026-09-23 23:31:49.951	2026-09-24 12:09:58.272
seed-product-8	tinker-one	Tinker Lab	Open-ended electronics kits and playful challenges that turn a kitchen table into a small invention lab.	Education	https://example.com/tinker	http://localhost:4180/media/seed/tinker.webp	LAUNCHED	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-15 23:31:49.952	seed-startup-8	2026-09-23 23:31:49.953	2026-09-24 12:09:58.272
seed-product-9	wayfarer-one	Wayfarer Cargo	A compact electric cargo platform designed with neighbourhood delivery teams and local repair shops.	Mobility	https://example.com/wayfarer	http://localhost:4180/media/seed/wayfarer.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-14 23:31:49.953	seed-startup-9	2026-09-23 23:31:49.954	2026-09-24 12:09:58.273
seed-product-10	patch-one	Patch Watch	Practical dependency monitoring that explains changes in plain language and helps small teams prioritize maintenance.	Cybersecurity	https://example.com/patch	http://localhost:4180/media/seed/patch.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-13 23:31:49.955	seed-startup-10	2026-09-23 23:31:49.955	2026-09-24 12:09:58.274
seed-product-11	threadline-one	Threadline Stories	A publishing workspace for independent creators with collaborative editing and beautiful, accessible reading experiences.	Creator Economy	https://example.com/threadline	http://localhost:4180/media/seed/threadline.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-12 23:31:49.956	seed-startup-11	2026-09-23 23:31:49.956	2026-09-24 12:09:58.276
seed-product-12	solstice-one	Solstice Meter	An open energy monitor that helps makers understand everyday electricity use through simple, local-first dashboards.	Hardware	https://example.com/solstice	http://localhost:4180/media/seed/solstice.webp	LAUNCHED	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-11 23:31:49.957	seed-startup-12	2026-09-23 23:31:49.957	2026-09-24 12:09:58.277
seed-product-13	arcade-garden-one	Garden Worlds	A cooperative building game about making a shared garden, discovering tiny ecosystems and creating with friends.	Gaming	https://example.com/arcade-garden	http://localhost:4180/media/seed/arcade-garden.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-10 23:31:49.958	seed-startup-13	2026-09-23 23:31:49.959	2026-09-24 12:09:58.287
seed-product-14	drift-space-one	Drift Atlas	A student-built visual explorer for open Earth observation datasets, connecting satellite imagery with local questions.	Space	https://example.com/drift-space	http://localhost:4180/media/seed/drift-space.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-09 23:31:49.959	seed-startup-14	2026-09-23 23:31:49.96	2026-09-24 12:09:58.288
seed-product-15	forma-studio	Forma Studio	An infinite canvas that brings sketches, research and product thinking into one beautifully simple space.	Design	https://example.com/forma	http://localhost:4180/media/seed/forma.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-08 23:31:49.961	seed-startup-0	2026-09-23 23:31:49.962	2026-09-24 12:09:58.289
seed-product-16	nova-robotics-studio	Nova Robotics Studio	A modular desktop robot arm for makers, educators and small workshops. Built to be repaired, understood and extended.	Robotics	https://example.com/nova-robotics	http://localhost:4180/media/seed/nova-robotics.webp	LAUNCHED	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-07 23:31:49.963	seed-startup-1	2026-09-23 23:31:49.963	2026-09-24 12:09:58.29
seed-product-17	moss-studio	Moss Studio	A quiet, soil-aware indoor growing system that helps urban homes grow herbs with less water and no guesswork.	Climate	https://example.com/moss	http://localhost:4180/media/seed/moss.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-06 23:31:49.964	seed-startup-2	2026-09-23 23:31:49.964	2026-09-24 12:09:58.29
seed-product-18	relay-studio	Relay Studio	A preview environment for every branch, with readable deployment logs and a simple path from prototype to production.	Developer Tools	https://example.com/relay	http://localhost:4180/media/seed/relay.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-05 23:31:49.965	seed-startup-3	2026-09-23 23:31:49.966	2026-09-24 12:09:58.293
cmufa3lwf0007utxb0xicb5hh	autoproduct-engine-1790239037040	AutoProduct Engine	Engine for testing product workflows	Developer Tools	\N	\N	BETA		\N	cmufa3lsz0003utxbqhpiqi85	2026-09-24 08:37:17.343	2026-09-24 08:37:17.343
cmufa6k2f0005utjb4hjtu8ia	autoproduct-engine-1790239174733	AutoProduct Engine	Engine for testing product workflows	Developer Tools	\N	\N	BETA		\N	cmufa6k100003utjbtz5ufzcx	2026-09-24 08:39:34.935	2026-09-24 08:39:34.935
cmufa7ij60005utva0oufcpv2	autoproduct-engine-1790239219480	AutoProduct Engine	Engine for testing product workflows	Developer Tools	\N	\N	BETA		\N	cmufa7iih0003utvamrh5gd9j	2026-09-24 08:40:19.603	2026-09-24 08:40:19.603
cmufa8k2t000jut3vm5xzjfu3	autoproduct-engine-1790239268149	AutoProduct Engine	Engine for testing product workflows	Developer Tools	\N	\N	BETA		\N	cmufa8k1z000hut3vreh6lx1k	2026-09-24 08:41:08.262	2026-09-24 08:41:08.262
cmufa94yz002aut3vx56edw7c	autoproduct-engine-1790239295254	AutoProduct Engine	Engine for testing product workflows	Developer Tools	\N	\N	BETA		\N	cmufa94yf0028ut3vm9zohrm9	2026-09-24 08:41:35.34	2026-09-24 08:41:35.34
seed-prod-5	veridion-guard	Veridion Guard	Kubernetes admission controller for zero-trust security.	Security & Privacy	\N	\N	BETA		\N	seed-startup-3	2026-09-24 08:56:40.648	2026-09-24 08:58:52.426
seed-prod-6	tensor-jit	TensorJIT	Dynamic graph compiler for ultra-low latency inference.	AI & Machine Learning	\N	\N	BETA		\N	seed-startup-4	2026-09-24 08:56:40.655	2026-09-24 08:58:52.428
seed-prod-7	ecocloud-lambda	EcoFunctions	Serverless execution scheduled strictly on green grid surplus.	Climate & CleanTech	\N	\N	BETA		\N	seed-startup-5	2026-09-24 08:56:40.657	2026-09-24 08:58:52.432
seed-prod-8	novascale-meter	NovaMeter	High-precision event-based billing calculation engine.	Fintech	\N	\N	BETA		\N	seed-startup-6	2026-09-24 08:56:40.659	2026-09-24 08:58:52.434
seed-prod-9	zenroute-proxy	ZenProxy	Global Anycast TCP proxy with smart congestion avoidance.	B2B SaaS	\N	\N	BETA		\N	seed-startup-7	2026-09-24 08:56:40.662	2026-09-24 08:58:52.436
seed-prod-10	omni-animator	OmniAnimator	Real-time procedural 3D motion generator.	Design & Creative	\N	\N	BETA		\N	seed-startup-8	2026-09-24 08:56:40.663	2026-09-24 08:58:52.438
seed-prod-11	synapse-patch	Synapse Patch	Continuous wearable cardiac telemetry monitor.	Health & Biotech	\N	\N	BETA		\N	seed-startup-9	2026-09-24 08:56:40.665	2026-09-24 08:58:52.441
seed-prod-12	gridpulse-probe	GridPulse Sensor Probe	Optical harmonic sensor for high voltage substations.	Hardware & IoT	\N	\N	BETA		\N	seed-startup-10	2026-09-24 08:56:40.667	2026-09-24 08:58:52.442
seed-prod-13	relay-desktop	Relay Messenger Desktop	Cross-platform Rust client for encrypted messaging.	Consumer Social	\N	\N	BETA		\N	seed-startup-11	2026-09-24 08:56:40.668	2026-09-24 08:58:52.449
seed-prod-14	hyper-flow	HyperFlow Builder	Canvas ETL tool with visual streaming node execution.	Developer Tools	\N	\N	BETA		\N	seed-startup-12	2026-09-24 08:56:40.67	2026-09-24 08:58:52.45
seed-prod-15	lumen-cell	LumenCell Photovoltaic	Ultrathin flexible solar module with 28% efficiency.	Climate & CleanTech	\N	\N	BETA		\N	seed-startup-13	2026-09-24 08:56:40.672	2026-09-24 08:58:52.452
seed-prod-16	soundwave-vst	SoundWave VST	AI-assisted spatial sound plugin for digital audio workstations.	Design & Creative	\N	\N	BETA		\N	seed-startup-14	2026-09-24 08:56:40.674	2026-09-24 08:58:52.454
seed-prod-17	forma-mobile	Forma Mobile Companion	Pocket companion app for fast idea capture.	Design & Creative	\N	\N	BETA		\N	seed-startup-0	2026-09-24 08:56:40.675	2026-09-24 08:58:52.455
seed-prod-18	devflow-replay	DevFlow Time Machine	Deterministic bug replay for failing CI builds.	Developer Tools	\N	\N	BETA		\N	seed-startup-1	2026-09-24 08:56:40.678	2026-09-24 08:58:52.458
seed-prod-19	pulsekit-mobile	PulseKit Offline SDK	React Native and Flutter offline-first database drivers.	Developer Tools	\N	\N	BETA		\N	seed-startup-2	2026-09-24 08:56:40.679	2026-09-24 08:58:52.46
seed-prod-20	tensor-bench	TensorBench Suite	Micro-benchmarking framework for ML accelerators.	AI & Machine Learning	\N	\N	BETA		\N	seed-startup-4	2026-09-24 08:56:40.681	2026-09-24 08:58:52.463
seed-prod-21	novascale-portal	NovaCustomer Portal	Self-serve customer usage and invoice dashboard.	Fintech	\N	\N	BETA		\N	seed-startup-6	2026-09-24 08:56:40.682	2026-09-24 08:58:52.468
seed-product-20	orbit-studio-studio	Orbit Studio Studio	A private writing companion for teams that need clear meeting notes and grounded answers from their own documents.	AI	https://example.com/orbit-studio	http://localhost:4180/media/seed/orbit-studio.webp	LAUNCHED	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-03 23:31:49.971	seed-startup-5	2026-09-23 23:31:49.972	2026-09-24 12:09:58.295
seed-prod-0	forma-canvas-studio	Forma Studio	Infinite reactive whiteboard for engineering teams.	Design & Creative	\N	\N	BETA		\N	seed-startup-0	2026-09-24 08:56:40.637	2026-09-24 08:58:52.409
seed-prod-1	forma-reader	Forma Reader	Distraction-free technical document viewer.	Design & Creative	\N	\N	BETA		\N	seed-startup-0	2026-09-24 08:56:40.64	2026-09-24 08:58:52.412
seed-prod-2	devflow-cli	DevFlow CLI	Zero-config build telemetry and regression detection.	Developer Tools	\N	\N	BETA		\N	seed-startup-1	2026-09-24 08:56:40.643	2026-09-24 08:58:52.414
seed-prod-3	devflow-monitor	DevFlow Cloud Monitor	Live flakiness tracker and pull request insights.	Developer Tools	\N	\N	BETA		\N	seed-startup-1	2026-09-24 08:56:40.645	2026-09-24 08:58:52.417
seed-prod-4	pulsekit-engine	PulseKit Engine	Lightweight SQLite-to-Postgres edge replication.	Developer Tools	\N	\N	BETA		\N	seed-startup-2	2026-09-24 08:56:40.646	2026-09-24 08:58:52.424
seed-product-21	fieldwork-studio	Fieldwork Studio	Customer research that connects interviews, observations and product decisions without burying teams in spreadsheets.	SaaS	https://example.com/fieldwork	http://localhost:4180/media/seed/fieldwork.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-02 23:31:49.973	seed-startup-6	2026-09-23 23:31:49.974	2026-09-24 12:09:58.296
seed-product-22	lumen-health-studio	Lumen Health Studio	A personal wellbeing journal focused on reflection and routines. It helps people notice patterns without clinical claims.	Healthtech	https://example.com/lumen-health	http://localhost:4180/media/seed/lumen-health.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-01 23:31:49.974	seed-startup-7	2026-09-23 23:31:49.975	2026-09-24 12:09:58.296
seed-product-23	tinker-studio	Tinker Studio	Open-ended electronics kits and playful challenges that turn a kitchen table into a small invention lab.	Education	https://example.com/tinker	http://localhost:4180/media/seed/tinker.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-08-31 23:31:49.978	seed-startup-8	2026-09-23 23:31:49.979	2026-09-24 12:09:58.298
seed-product-24	wayfarer-studio	Wayfarer Studio	A compact electric cargo platform designed with neighbourhood delivery teams and local repair shops.	Mobility	https://example.com/wayfarer	http://localhost:4180/media/seed/wayfarer.webp	LAUNCHED	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-08-30 23:31:49.981	seed-startup-9	2026-09-23 23:31:49.981	2026-09-24 12:09:58.298
seed-prod-22	zenroute-dns	ZenDNS	Geo-steered latency-optimal authoritative DNS.	B2B SaaS	\N	\N	BETA		\N	seed-startup-7	2026-09-24 08:56:40.686	2026-09-24 08:58:52.47
seed-prod-23	relay-vault	Relay Encrypted Backup	Zero-knowledge cloud archive for conversation histories.	Security & Privacy	\N	\N	BETA		\N	seed-startup-11	2026-09-24 08:56:40.689	2026-09-24 08:58:52.471
seed-prod-24	soundwave-sdk	SoundWave Spatial Audio SDK	Spatial acoustics engine for Unity and Unreal 5.	Design & Creative	\N	\N	BETA		\N	seed-startup-14	2026-09-24 08:56:40.691	2026-09-24 08:58:52.473
cmufavw9s0012utx54zwywo8f	autoproduct-engine-1790240356941	AutoProduct Engine	Engine for testing product workflows	Developer Tools	\N	\N	BETA		\N	cmufavw8c0010utx5jdozl1qi	2026-09-24 08:59:17.153	2026-09-24 08:59:17.153
cmufbfm8c000yutr68332r93n	autoproduct-engine-1790241277189	AutoProduct Engine	Engine for testing product workflows	Developer Tools	\N	\N	BETA		\N	cmufbfm7u000wutr6q3u8jxae	2026-09-24 09:14:37.261	2026-09-24 09:14:37.261
cmuffdlbb002tutr6cu5sgpwx	autoproduct-engine-1790247901093	AutoProduct Engine	Engine for testing product workflows	Developer Tools	\N	\N	BETA		\N	cmuffdlan002rutr6bh129lau	2026-09-24 11:05:01.223	2026-09-24 11:05:01.223
seed-product-0	forma-one	Forma Canvas	An infinite canvas that brings sketches, research and product thinking into one beautifully simple space.	Design	https://example.com/forma	http://localhost:4180/media/seed/forma.webp	LAUNCHED	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-23 23:31:49.938	seed-startup-0	2026-09-23 23:31:49.939	2026-09-24 12:09:58.261
seed-product-19	kite-studio	Kite Studio	Thoughtfully curated walking routes, independent shops and neighbourhood stories from people who call the city home.	Consumer Apps	https://example.com/kite	http://localhost:4180/media/seed/kite.webp	BETA	This demonstration release explores a simpler setup flow, accessible controls and clearer feedback.	2026-09-04 23:31:49.966	seed-startup-4	2026-09-23 23:31:49.967	2026-09-24 12:09:58.294
\.


--
-- Data for Name: ProductFollow; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."ProductFollow" ("userId", "productId") FROM stdin;
\.


--
-- Data for Name: RankingConfig; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."RankingConfig" (key, weights, "updatedAt") FROM stdin;
default	{"quality": 0.8, "affinity": 2.5, "negative": 5, "following": 2, "freshness": 1.6, "repetition": 1.8, "exploration": 0.15, "creatorPenalty": 3, "categoryPenalty": 2}	2026-09-23 23:31:50.786
\.


--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Report" (id, "reporterId", "userId", "postId", reason, details, status, "createdAt") FROM stdin;
cmufa7ivm000putvazfpxv48m	cmufa7is8000cutvapayxs0zx	cmufa7is8000cutvapayxs0zx	\N	SPAM	Automated test report submission	OPEN	2026-09-24 08:40:20.051
cmufa8jtd000dut3vw54yw3uv	cmufa8joz0000ut3vzf95i06s	cmufa8joz0000ut3vzf95i06s	\N	SPAM	Automated test report submission	OPEN	2026-09-24 08:41:07.921
cmufa94ii001put3vb2zbv9v6	cmufa94eh001cut3vim5o0anj	cmufa94eh001cut3vim5o0anj	\N	SPAM	Automated test report submission	OPEN	2026-09-24 08:41:34.747
cmufavv0g000hutx51nicrh4r	cmufavurl0004utx51goqpzxf	cmufavurl0004utx51goqpzxf	\N	SPAM	Automated test report submission	OPEN	2026-09-24 08:59:15.52
cmufbfls9000dutr6vm8q8fs7	cmufbflo10000utr6214dt0t9	cmufbflo10000utr6214dt0t9	\N	SPAM	Automated test report submission	OPEN	2026-09-24 09:14:36.681
cmuffdk9n0021utr6hqd505ur	cmuffdk3s001outr66qzpwwyx	cmuffdk3s001outr66qzpwwyx	\N	SPAM	Automated test report submission	OPEN	2026-09-24 11:04:59.867
\.


--
-- Data for Name: Save; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Save" (id, "userId", "postId", "startupId", "productId", "createdAt") FROM stdin;
cmueqm5bt000iut75fk7sjey8	seed-user-0	seed-post-000	\N	\N	2026-09-23 23:31:50.01
cmueqm5ca000jut75w18rciz3	seed-user-0	seed-post-003	\N	\N	2026-09-23 23:31:50.027
cmueqm5cq000kut75jhd729q2	seed-user-0	seed-post-006	\N	\N	2026-09-23 23:31:50.043
cmueqm5d9000lut75oszmryqs	seed-user-0	seed-post-009	\N	\N	2026-09-23 23:31:50.061
cmueqm5ds000mut75kg8k2yu1	seed-user-0	seed-post-012	\N	\N	2026-09-23 23:31:50.08
cmueqm5e8000nut75agrhdi11	seed-user-0	seed-post-015	\N	\N	2026-09-23 23:31:50.097
cmueqm5er000out75w62sdzrb	seed-user-0	seed-post-018	\N	\N	2026-09-23 23:31:50.116
cmueqm5ez000put75feboqrrg	seed-user-0	seed-post-021	\N	\N	2026-09-23 23:31:50.124
cmueqm5f9000qut75zfuw1yws	seed-user-0	seed-post-024	\N	\N	2026-09-23 23:31:50.133
cmueqm5fl000rut75x3i04xew	seed-user-0	seed-post-027	\N	\N	2026-09-23 23:31:50.145
cmueqm5fw000sut75rduevn97	seed-user-0	seed-post-030	\N	\N	2026-09-23 23:31:50.157
cmueqm5gc000tut75eyxc2p1r	seed-user-0	seed-post-033	\N	\N	2026-09-23 23:31:50.172
cmueqm5gu000uut754r4xdrr5	seed-user-0	seed-post-036	\N	\N	2026-09-23 23:31:50.191
cmueqm5h7000vut75y9ocvdyn	seed-user-0	seed-post-039	\N	\N	2026-09-23 23:31:50.204
cmueqm5hh000wut759coiuh0a	seed-user-0	seed-post-042	\N	\N	2026-09-23 23:31:50.213
cmueqm5hr000xut75ckyga2ks	seed-user-0	seed-post-045	\N	\N	2026-09-23 23:31:50.224
cmueqm5i4000yut75whb9fckv	seed-user-0	seed-post-048	\N	\N	2026-09-23 23:31:50.237
cmueqm5ij000zut75sy0bgel8	seed-user-0	seed-post-051	\N	\N	2026-09-23 23:31:50.251
cmueqm5iy0010ut75wqlsjljx	seed-user-0	seed-post-054	\N	\N	2026-09-23 23:31:50.267
cmueqm5jb0011ut75r0gxkhs8	seed-user-0	seed-post-057	\N	\N	2026-09-23 23:31:50.28
cmueqm5ji0012ut75sa5rjucc	seed-user-0	seed-post-060	\N	\N	2026-09-23 23:31:50.287
cmueqm5jr0013ut75wo4ac8ae	seed-user-0	seed-post-063	\N	\N	2026-09-23 23:31:50.295
cmueqm5k30014ut75u3t0pdi5	seed-user-0	seed-post-066	\N	\N	2026-09-23 23:31:50.307
cmueqm5kh0015ut75nzgzpci5	seed-user-0	seed-post-069	\N	\N	2026-09-23 23:31:50.321
cmueqm5kw0016ut75at2ny0zx	seed-user-0	seed-post-072	\N	\N	2026-09-23 23:31:50.336
cmueqm5ld0017ut75ygs0l8ua	seed-user-0	seed-post-075	\N	\N	2026-09-23 23:31:50.354
cmueqm5ll0018ut75oq6zect9	seed-user-0	seed-post-078	\N	\N	2026-09-23 23:31:50.361
cmueqm5lv0019ut75bxsruzpw	seed-user-0	seed-post-081	\N	\N	2026-09-23 23:31:50.371
cmueqm5m8001aut75b2ibo2n2	seed-user-0	seed-post-084	\N	\N	2026-09-23 23:31:50.384
cmueqm5mm001but75zfpc7k0c	seed-user-0	seed-post-087	\N	\N	2026-09-23 23:31:50.399
cmueqm5n2001cut75w09ecjra	seed-user-0	seed-post-090	\N	\N	2026-09-23 23:31:50.415
cmueqm5nn001dut757w2fom3d	seed-user-0	seed-post-093	\N	\N	2026-09-23 23:31:50.435
cmueqm5nz001eut755mdme84v	seed-user-0	seed-post-096	\N	\N	2026-09-23 23:31:50.448
cmueqm5o9001fut75k92s93ke	seed-user-0	seed-post-099	\N	\N	2026-09-23 23:31:50.458
cmueqm5ol001gut75j9se1nm5	seed-user-0	seed-post-102	\N	\N	2026-09-23 23:31:50.47
cmueqm5p0001hut75u6ij6272	seed-user-0	seed-post-105	\N	\N	2026-09-23 23:31:50.485
cmueqm5ph001iut75tv164fwv	seed-user-0	seed-post-108	\N	\N	2026-09-23 23:31:50.501
cmueqm5q0001jut75dv6qa0d1	seed-user-0	seed-post-111	\N	\N	2026-09-23 23:31:50.52
cmueqm5qg001kut751nvwvill	seed-user-0	seed-post-114	\N	\N	2026-09-23 23:31:50.536
cmueqm5qp001lut758pabdosc	seed-user-0	seed-post-117	\N	\N	2026-09-23 23:31:50.546
cmueqm5r0001mut75mxc294r6	seed-user-0	seed-post-120	\N	\N	2026-09-23 23:31:50.557
cmueqm5re001nut75xz1r02ny	seed-user-0	seed-post-123	\N	\N	2026-09-23 23:31:50.571
cmueqm5ru001out75fzsj2550	seed-user-0	seed-post-126	\N	\N	2026-09-23 23:31:50.587
cmueqm5sc001put7568x86oa8	seed-user-0	seed-post-129	\N	\N	2026-09-23 23:31:50.605
cmueqm5sw001qut75k7ynhc6m	seed-user-0	seed-post-132	\N	\N	2026-09-23 23:31:50.625
cmueqm5t5001rut75qzxlby12	seed-user-0	seed-post-135	\N	\N	2026-09-23 23:31:50.634
cmueqm5tf001sut75aorr75bb	seed-user-0	seed-post-138	\N	\N	2026-09-23 23:31:50.644
cmueqm5ts001tut75y3frit5u	seed-user-0	seed-post-141	\N	\N	2026-09-23 23:31:50.656
cmueqm5u6001uut750q5matgf	seed-user-0	seed-post-144	\N	\N	2026-09-23 23:31:50.671
cmueqm5un001vut75jup7x3nj	seed-user-0	seed-post-147	\N	\N	2026-09-23 23:31:50.688
cmuf66uhk0002utshyh10y391	seed-user-0	seed-post-107	\N	\N	2026-09-24 06:47:49.977
\.


--
-- Data for Name: SearchHistory; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."SearchHistory" (id, "userId", query, "createdAt") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Session" (id, "userId", "tokenHash", "refreshHash", "previousRefreshHash", "userAgent", "createdAt", "expiresAt", "revokedAt", "lastUsedAt") FROM stdin;
cmuf66im90001utshbdx9y6x4	seed-user-0	588b051268c650acf5a8ca518e83bf14d96c263f28e30f9444a2314abc2f7d58	30f946f5d1004292edc20a5a133a0ade9fb67b969bfa047d6d0b84e36429e958	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-09-24 06:47:34.594	2026-10-24 06:47:34.593	\N	2026-09-24 06:47:34.594
cmuf8zfnm0004ut98v2ukuqec	cmuf8zfn40000ut98083f1bzt	b43ab4e58e1e4df8bf33a95690638ffc6aca2b7a3f01e3286b8a33d612808bae	dcfc0d7b4eeca1fc679f48ad8ccde90360406f6c0d95fb66b66729ac5c89e453	\N	curl/8.7.1	2026-09-24 08:06:03.011	2026-10-01 08:06:03.01	\N	2026-09-24 08:06:03.011
cmuf8zm6v0006ut98am2nwyks	cmuf8zfn40000ut98083f1bzt	0c323783c6f4bc91ab5e73b8cd588ddb38a585f4b5bf0e3eb87eb368019cf950	37f0609e27691d4ad428188b36fd85e81b20e0aed7685917d8809ac1ca4c6135	\N	curl/8.7.1	2026-09-24 08:06:11.48	2026-10-01 08:06:11.479	\N	2026-09-24 08:06:11.48
cmuf9e5l30001ut9br6cwhiya	seed-user-0	bb262b1f45e9238108b9dad47fd3d0ded4c8b51f55607965a0a4499cc2c610d8	7ca7eed9a30bab4c58546c77bd9034cf3d2ee74e4d87a085bbd98d71887825ff	\N	node	2026-09-24 08:17:29.8	2026-10-01 08:17:29.799	\N	2026-09-24 08:17:29.8
cmuf9e8zv0003ut9bw65e16y9	seed-user-0	f17a24856f58a24adbf3c0893d53b627d113fed0cbc0bbb338dd43dfa1e21f3f	80a318fb4b914d06807de6576545491b3a5c77daeb21bcfb912f8f7a0c37ec0d	\N	node	2026-09-24 08:17:34.219	2026-10-01 08:17:34.218	\N	2026-09-24 08:17:34.219
cmufa3lsb0001utxbx5nkqje1	seed-user-0	62b0c881d0345d33f3a712f08e87da2d1ac504cf950a08f736a2255b611db2d3	5066543b9a11beba288d59adef9bf2bc039fdb035dd1c4b71e977bb191407d14	\N	node	2026-09-24 08:37:17.195	2026-10-01 08:37:17.193	\N	2026-09-24 08:37:17.195
cmufa3m6v000iutxblz0utjip	cmufa3m6g000eutxbklb8fmke	f29737abd1c71c02e0f77bfb140c1e6faffe95eb6e67ff439fdcb4b0c53f6d22	44b51aaf0f1c29ca15a4ec3e420946f53e73c889c61cc2a0d10774190ad4f950	\N	node	2026-09-24 08:37:17.719	2026-10-01 08:37:17.719	\N	2026-09-24 08:37:17.719
cmufa3m86000nutxb6kntush0	cmufa3m80000jutxbo0gbvb2e	e26b5cb20f133e5177f6297270ecf4a702280f2058b19dfb19ae8db0c5b7f5b5	2973dc77168fd3d69ed01f2980cbfaf69d412b60e3a2062285ddecaae4440f32	\N	node	2026-09-24 08:37:17.766	2026-10-01 08:37:17.766	\N	2026-09-24 08:37:17.766
cmufa3mfk000xutxbvyy0yhug	cmufa3mff000tutxbcstszkyk	c947e15152e53270c4bef82610a8fa9023f72b5e5e6b7b3db0707ede3c71567f	a92ba8328c16fb6768d5ba027a2eb12e4c934caebd7979378c1f5fe7c81f9bf8	d7c356507ae2e73d064a13799608588c31f30864dd6bd9d136733dc7cbc4d83c	node	2026-09-24 08:37:18.032	2026-10-01 08:37:18.031	2026-09-24 08:37:18.052	2026-09-24 08:37:18.049
cmufa3mov0014utxb4m1iwtvo	cmufa3moq0010utxbxiu1boa6	d372e16f79a039df84a5150a179ee1a839108835d31683ba5a352118884c8078	52881e1bd9628119f31f1dbed4830833d73fb7fd4c56a5546396012196a8239c	\N	node	2026-09-24 08:37:18.367	2026-10-01 08:37:18.367	\N	2026-09-24 08:37:18.367
cmufa6k0e0001utjbxwptm90e	seed-user-0	c679b6a26d4f477810bbba07f2c59bdd566f2c2598054b3cd41a56f488a89c0d	b3d3573327b00c5dc6c5cc58ee3857289ae79b038a04ff58ad35cb54499d7a7d	\N	node	2026-09-24 08:39:34.862	2026-10-01 08:39:34.861	\N	2026-09-24 08:39:34.862
cmufa6kaj000gutjb91v9xcxr	cmufa6ka9000cutjbpjyruycg	f558d5b8b3e581ff7f8727429f3b47fe946f6bd9fbd686b6f0992fcc9dfa75c0	25950e3e5855bc33f2b99438e09d724a770477eacd11dd7f894a73bdc68a9903	\N	node	2026-09-24 08:39:35.228	2026-10-01 08:39:35.227	\N	2026-09-24 08:39:35.228
cmufa6kbt000lutjb5p6fmetk	cmufa6kbm000hutjbrv6fprey	0bcf3e54f782ad1dea3289bb52ac8dc140d2cdf4daa6c8a773871d8c74a491ad	a6d6bcbb1605aa1aae9b1f3211249cfb615d7e8081be94af591d6d29d81830fb	\N	node	2026-09-24 08:39:35.274	2026-10-01 08:39:35.273	\N	2026-09-24 08:39:35.274
cmufa6kjz000vutjbdwtoxnod	cmufa6kjs000rutjb2b60ohxh	433b261dcd6fb10668a15c7017125129065d874fbbe894f58bf46721f0cadb0f	1c44c4d9954aa69d518c97cfa2d279d57ee15c5aa3c4e95ab934cde9ef5653e9	4660fd655c5ffeab5588ed4e051f267ddb60260219d020c37bf59f44d45e833c	node	2026-09-24 08:39:35.568	2026-10-01 08:39:35.567	2026-09-24 08:39:35.601	2026-09-24 08:39:35.592
cmufa6km2000xutjbytrbwfm0	cmufa6kjs000rutjb2b60ohxh	b929f296f25d29967be4430bc8431ff3c8c2cd9f5787fd32bcdd5a7bb9bad3b7	39d774cfac61710934d552fa765e447da4a78d7bf2a1e527a211f890732e247b	\N	node	2026-09-24 08:39:35.642	2026-10-01 08:39:35.641	\N	2026-09-24 08:39:35.642
cmufa6kul0012utjbyt0dbuf2	cmufa6kui000yutjb7bgvio5f	b211f587a28472516a8c3b00f8f643ffd05e69d33ea13fd81a71cb69b9c1d208	f93621f91f8dae30028e97151e15cfa4a07f6228b63bb19b58a371a8f18320ba	\N	node	2026-09-24 08:39:35.949	2026-10-01 08:39:35.949	\N	2026-09-24 08:39:35.949
cmufa6kw10017utjb1kajz0lg	cmufa6kvu0013utjbmxbvw5xd	1dac37d6d996dcbd2e928573d2498b2d9c786c853709e33e453c40a2f687d9bf	5998518b112747f0303029b444e396a6b98a7dd64880f180dbc13c1efc8fbb43	\N	node	2026-09-24 08:39:36.001	2026-10-01 08:39:36.001	\N	2026-09-24 08:39:36.001
cmufa7ii00001utvac0kk8u8f	seed-user-0	066975444901c2d5a4005579143a1e386c08d62c51f19eec8613765c5742615b	0b548bd5e43071bfbd6c89dd40c514bf2b181404f9c61d8471e3e5e01957da2e	\N	node	2026-09-24 08:40:19.56	2026-10-01 08:40:19.559	\N	2026-09-24 08:40:19.56
cmufa7isf000gutvafymamn8h	cmufa7is8000cutvapayxs0zx	0332299ff048feb2841fd8605b7be9f522f0e235e4300a1173ac8341771326b8	5dc5d1b0e3ca475bba0ba82f1f5010ccfc09f87ba2d7b0ae1227831322281b2e	\N	node	2026-09-24 08:40:19.936	2026-10-01 08:40:19.935	\N	2026-09-24 08:40:19.936
cmufa7ito000lutvask0au4tx	cmufa7itl000hutvah8olel07	be5e403919689471e91e075bc06f6ddce1ad9cfacd3ae5616948c08e3c563c8d	4b97aa851e3525e24600d147f31dfa53b793c32fa86940f608ed33ef75531c11	\N	node	2026-09-24 08:40:19.981	2026-10-01 08:40:19.98	\N	2026-09-24 08:40:19.981
cmufa7ivd000nutvaqs1bex5f	cmufa7itl000hutvah8olel07	b48beca587c9308f89a8860c1250d2d7ecc656f49fd66d7a31fc9fd0aafea71a	742f0e91dff84a256b4635f4f3d096c963512574a3c2e1773bf0021464cd3f60	\N	node	2026-09-24 08:40:20.041	2026-10-01 08:40:20.04	\N	2026-09-24 08:40:20.041
cmufa7j3n000uutvaj86smwex	cmufa7j3h000qutvatvfj5zm7	9dd3ad3403ced677073068d78b32b36e6e5f9205f383553413142e73551cc3dd	6768629285236f1e72d9ee9bcf1be4346b5ac1741c4ebd67bf595d49333326f8	24f2e70ab6ee0868cdb9ce29be015e0686704b33a468e15c28b12293fae97c72	node	2026-09-24 08:40:20.34	2026-10-01 08:40:20.339	2026-09-24 08:40:20.365	2026-09-24 08:40:20.357
cmufa7j5o000wutvad95mbo7m	cmufa7j3h000qutvatvfj5zm7	a00ff06433b8208178af3ecb4c161998c36b9601e95f976db1fe7f7c7b87991a	e374b52758af8d4143b28755dff2b7bf436dc6ed5ca626346602f31404226424	\N	node	2026-09-24 08:40:20.412	2026-10-01 08:40:20.412	\N	2026-09-24 08:40:20.412
cmufa7jck0011utvapf4lvbap	cmufa7jch000xutva9zo2jbsc	9421475c5b0a6859ae0cc4694d16e657644dab427a0443263a75aabcd6ed1ba0	faae11f262477bbd9fb87602e94e9fe9b164a40683a6839239a6a773ade46766	\N	node	2026-09-24 08:40:20.661	2026-10-01 08:40:20.66	\N	2026-09-24 08:40:20.661
cmufa7jdx0016utvaqn5u4kp9	cmufa7jdr0012utvae0pqohc2	32b4a701b83383c24f9d18dbbec80ddfd27a9555d279950c1e34a2a0abe574f2	7f9b8ee18c2a81eab1d1087ee2115abb0aabf91dce1f667e2bd3b60d3edec6d7	\N	node	2026-09-24 08:40:20.709	2026-10-01 08:40:20.708	\N	2026-09-24 08:40:20.709
cmufa8jph0004ut3vjdfr0apg	cmufa8joz0000ut3vzf95i06s	bae218f9e72e105b5b1c92206ab2f815988aff370170d4e07d2f6c2c3d5142e3	8223215abe4dbc37ae579ac3d677267a60a9b8f5b61702d5819aedf64bcaf83c	\N	node	2026-09-24 08:41:07.782	2026-10-01 08:41:07.781	\N	2026-09-24 08:41:07.782
cmufa8jra0009ut3vmpqiislt	cmufa8jr20005ut3vptpczxec	adebb615b580bb5457852d071b985fd63fe47ba7e11c8488691f543c04bfbba3	e7d2e39ba875941ede6ae70d6f665105ea18a8a962afdb160846d7252c707f56	\N	node	2026-09-24 08:41:07.847	2026-10-01 08:41:07.846	\N	2026-09-24 08:41:07.847
cmufa8jt1000but3v3rlfdidq	cmufa8jr20005ut3vptpczxec	b904209e7f4f010b32f3240b23f84aec15278b93802706cb778a2afe96b10383	f72ba68bde639969823e4284503c68b4976d06af5e09a2dc35379ed58dab22fa	\N	node	2026-09-24 08:41:07.909	2026-10-01 08:41:07.909	\N	2026-09-24 08:41:07.909
cmufa8k18000fut3vvhzskso4	seed-user-0	4f39fb1072161616e8b3380d38dd9443fba8efa631f7aea9f43636c07bd23646	51de107698f9675e4b9258c5b455fdcef6eb657d991065b42357147c43a2b2a2	\N	node	2026-09-24 08:41:08.205	2026-10-01 08:41:08.204	\N	2026-09-24 08:41:08.205
cmufa8kb9000uut3vbr5cij6d	cmufa8kb4000qut3vr9viyake	d5879cf96bdee1d6865913f4dbbf66278d3cf5b870adea20909df8a0ea2e38bd	8c71f21672b584ccaa739dfd90af8e8f156eb4bb818e764fe5c84fd64af88a45	4b0a0d763873b680c43fb35d928b1abc8dd785f43f53dbd2acc2c5628a854010	node	2026-09-24 08:41:08.565	2026-10-01 08:41:08.565	2026-09-24 08:41:08.588	2026-09-24 08:41:08.58
cmufa8kd0000wut3vzq3j28z8	cmufa8kb4000qut3vr9viyake	a6754503c710920704d95d3e88aef1f1c88858c80f3c0cd1e6a30a7edcc334dc	e5320bdc1accac39a919f1d56a2bb42e209ae4a500090a453a6dc1733d9fda8e	\N	node	2026-09-24 08:41:08.628	2026-10-01 08:41:08.627	\N	2026-09-24 08:41:08.628
cmufa8kn50011ut3v4866nby2	cmufa8kn0000xut3v8luj9bd7	637217334a19a38e8c22e636c1d53f30a9d2ee9d6ca6f80897ef4344862594ba	f4af71914ebe751eb0c205b9e73cf1f385347a35e98b61d92b63f1fa194077da	\N	node	2026-09-24 08:41:08.993	2026-10-01 08:41:08.992	\N	2026-09-24 08:41:08.993
cmufa8kow0016ut3veqs9me3z	cmufa8kor0012ut3vz4568jdf	26daea661861e85d0230495e4199b015e235f022ea46f4726d3fc068537aa3a3	ad0e5786cd8d0245e83eda6986daf18267387629af26bc9491e3210cc03ac9e0	\N	node	2026-09-24 08:41:09.056	2026-10-01 08:41:09.056	\N	2026-09-24 08:41:09.056
cmufa94ew001gut3vgg940m85	cmufa94eh001cut3vim5o0anj	64a0b4220cc946e51372ff27addb62a7dae7ea105dc72977b8e1edff6d486383	4edcd34acbe9e1e89a60e106423bc1e962c257513d0e7abbff6fa754a9e1503c	\N	node	2026-09-24 08:41:34.617	2026-10-01 08:41:34.616	\N	2026-09-24 08:41:34.617
cmufa94gi001lut3v9lnzs4tu	cmufa94gc001hut3v60magkah	30d720a47e1667bca3d6b7c584a79b7b59bdc2132c0e6a14f729553cf2ce63a2	9f6dbd8844349b4f9c6efd5a406db27dd763e2cdcb186b3635212bc9793e32ec	\N	node	2026-09-24 08:41:34.674	2026-10-01 08:41:34.674	\N	2026-09-24 08:41:34.674
cmufa94id001nut3v02fhu3ph	cmufa94gc001hut3v60magkah	04d8d6a07c6072871e987c5f91175c2d36bd7600bc5863feeb2709dbf1b7a3e4	9c740a31976c71e5eb6a155db5c56757d8a32cde100cac31fb48ab600568de42	\N	node	2026-09-24 08:41:34.741	2026-10-01 08:41:34.74	\N	2026-09-24 08:41:34.741
cmufa94pm001uut3vr48ktz1u	cmufa94pd001qut3vdj8g1md4	d7ddaf7f8644e1dc0dd6b733a30d0d863d29158dcb73ede66877aa734b29c9c3	e119d51a9e29b6d22d20069eb3bdb6145808be1662c49e9edccedb9550416ca1	\N	node	2026-09-24 08:41:35.002	2026-10-01 08:41:35.002	\N	2026-09-24 08:41:35.002
cmufa94r2001zut3vf522853c	cmufa94qy001vut3vmjhf4879	a2db065da14568c7d3540beaf82a3b48e1a69f560e5d7f6ecb6bec28270c27c2	14d31e4970aaf8e3d4ecc8b95834056302a5f9282c5750891cface819c3bff3c	\N	node	2026-09-24 08:41:35.054	2026-10-01 08:41:35.054	\N	2026-09-24 08:41:35.054
cmufa94y30026ut3vju9fd0ky	seed-user-0	1cbf806992660141db64d9d1847e67224eccad619619b9bd735fd79071e15355	75be8bef5e36fd7abfc3d45e6dd349f697f4f23f25365cbe444c261754f931fe	\N	node	2026-09-24 08:41:35.308	2026-10-01 08:41:35.307	\N	2026-09-24 08:41:35.308
cmufa956t002lut3vmmcyvvgu	cmufa956q002hut3vpjxtflap	a434cae05c1a0d7b42eb89eb804cd0c9507025377da4281cf537c93161c56278	d9fff76961a967724f9fe4a0ef4f12e4986c5b4a59c681dd185801dc98b05fb5	7f6e89e06d68e4725b8970fe23d926d1d8455639bcf6473fbac1d1be9101ce7c	node	2026-09-24 08:41:35.621	2026-10-01 08:41:35.621	2026-09-24 08:41:35.64	2026-09-24 08:41:35.635
cmufa958d002nut3vv6s6q2ap	cmufa956q002hut3vpjxtflap	c7ee1f8ba0dc4f3c72ebc1cb440e9ba7a7c00cbd228ed84936e88923be114228	1b5e643891dd6f02d5bae26d6227d2eb89c8e32c81dc3025bfece326d2bc61ce	\N	node	2026-09-24 08:41:35.677	2026-10-01 08:41:35.677	\N	2026-09-24 08:41:35.677
cmufadcbe002put3vk6kgmxum	seed-user-0	a35d63f3a604331cc3eb4facbbaa533982db8d1274125030d47851a860d28414	143e620d7e367bbf21697936595ad0ddea44e2942c5b3404842d60f9986ec160	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	2026-09-24 08:44:51.482	2026-10-01 08:44:51.481	\N	2026-09-24 08:44:51.482
cmufaemt1002rut3vzup05n6e	seed-user-0	4e4698c0be979cf9264597d68fb6abf9c21043a91be6ea0a6fefd60273a369d7	6bfbdd21f9d446516f4af26a37bf5a6a2a455330cd794261a60a2766c171bf01	\N	curl/8.7.1	2026-09-24 08:45:51.733	2026-10-01 08:45:51.732	\N	2026-09-24 08:45:51.733
cmufafw6j002tut3v0enqxe5t	seed-user-0	ad41ddc3f8817cf324752de35b3917825c9024dfd35d42483313058f2ddb0e5a	506a0007edc61f74b2c8708ebf4868e61f93328764d060cef06be3aafbd58974	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	2026-09-24 08:46:50.54	2026-10-01 08:46:50.539	\N	2026-09-24 08:46:50.54
cmufagbzj002vut3vfuxlg294	seed-user-0	0d96eb0cb0bfdf00bca171613376384c536d63aa9304f48340dca09da938d004	ad57059b0c83866a72beeec219319f6ed668c5036de01f0bfe6f1343f23e0481	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.8010.12 Safari/537.36	2026-09-24 08:47:11.023	2026-10-01 08:47:11.022	\N	2026-09-24 08:47:11.023
cmufaj2go002xut3v85t46g6w	seed-user-0	067cb6f2aed8a5a9909b97fe642f54f5fdc44f506110e82c58c193cd0c8fd7fb	0d7539271ece8b367373eeec1cbc9f0f450c07c16c47dc93f6793b049363fb66	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	2026-09-24 08:49:18.648	2026-10-01 08:49:18.647	\N	2026-09-24 08:49:18.648
cmufajj6a002zut3v9wf87vlm	seed-user-0	28e36cc7070b43c36e263b442affac817c67e9c4c90fb1962e9c72ff5df6492f	ed420842366e3b0c2e00bd189f6ecda1dc1c722dbc5b73dfa6462e478a10a517	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.8010.12 Safari/537.36	2026-09-24 08:49:40.307	2026-10-01 08:49:40.306	\N	2026-09-24 08:49:40.307
cmufam2ev0001utx5cguq3luj	seed-user-0	d10eb0b41b43000ed966b34e6e16de25e74bfc9bb18d17bed12f7bb3db41a5b0	7f1d2c2efd2573651170e9f11b6d9517f6ffd9399e3c3ada10e1160a423ce156	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	2026-09-24 08:51:38.55	2026-10-01 08:51:38.548	\N	2026-09-24 08:51:38.55
cmufambch0003utx5fi8yni5p	seed-user-0	2a9c486620c5b1120348928ceb6e6469946bb958b7972583b63f84e56bcee7f3	a899a31fb5fb50e9e5a9b69743dc53294d80f46bd4d562c871273407e859974d	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.8010.12 Safari/537.36	2026-09-24 08:51:50.13	2026-10-01 08:51:50.129	\N	2026-09-24 08:51:50.13
cmufavusv0008utx5grx4f8k2	cmufavurl0004utx51goqpzxf	28abd2f14d266942e754f3ab7b617e097a4900502c02053a5795ca814018194e	e42e7bc32e8dcff0cc13162918ced6ded08cf922eabce042b573c9a7bbb1333a	\N	node	2026-09-24 08:59:15.247	2026-10-01 08:59:15.246	\N	2026-09-24 08:59:15.247
cmufavuw9000dutx5cbzslu9b	cmufavuw00009utx5bt46xprm	db1d0faae08d3c20089035f956dcc562ce73f9132684190480adf4de77bf2937	9593c93e31f2af63e6b7a7bb16b4a857d6b8d0dd0ad296f3411b5f51d9088261	\N	node	2026-09-24 08:59:15.369	2026-10-01 08:59:15.368	\N	2026-09-24 08:59:15.369
cmufavuzx000futx5svburi5e	cmufavuw00009utx5bt46xprm	436c7f18bbb9e562711ec55d1ac6a5b9f12ea2cd9346b8a82300dad2a09a4ef1	ff2e6323deaface3aaaacc13861d3bc17feaa5dd2d75ab04aec704515325e166	\N	node	2026-09-24 08:59:15.502	2026-10-01 08:59:15.501	\N	2026-09-24 08:59:15.502
cmufavvji000mutx5ki22ztrv	cmufavvj3000iutx5b3mjnwps	7004e083d8d93c1ed5ebe1013869a1e68ffeb5dbda407fcb0f3ad0616b643f2d	330d04a5aefc0547f2bd20224f5ea6b83fc14fa4b3e3ecebb99dbbe5b4e74038	\N	node	2026-09-24 08:59:16.207	2026-10-01 08:59:16.205	\N	2026-09-24 08:59:16.207
cmufavvmw000rutx5ai35hliq	cmufavvmf000nutx5x7yz57wo	3d813ebc222f5a04ccb5c48333085a5967ff112c8c0119c6d1baffc60ec99301	174335bf0be405410758e270c4336b0e685fa6c0f515854dc15f7e516b35f7c1	\N	node	2026-09-24 08:59:16.329	2026-10-01 08:59:16.328	\N	2026-09-24 08:59:16.329
cmufavw7n000yutx5p8es5s3w	seed-user-0	d3097a2fdef53f3dc48e9b87d4eff598ca98375045f83787e44d41a57c6090d3	2d567ef8e58eedc6351aaa88f57a4dc6f508194cd4c8fd1a69a3eb9cb6968675	\N	node	2026-09-24 08:59:17.075	2026-10-01 08:59:17.074	\N	2026-09-24 08:59:17.075
cmufavwt2001dutx5qk3zxu5n	cmufavwsm0019utx5ooic2abw	8a5c5391020df56d59bde91d5468055768e895576b4b6e334a42ece84313bbbb	191f60a6f611321209d8bd92e66f23ddeb006c8440f90d0ee432a1d50f3d5414	dcc5a4c40cde341cc12043ff6b1f29e1a3935ed9c98e15b166839fc731daa6bf	node	2026-09-24 08:59:17.847	2026-10-01 08:59:17.846	2026-09-24 08:59:17.873	2026-09-24 08:59:17.867
cmufavwvv001futx5lh3ls1xl	cmufavwsm0019utx5ooic2abw	eabf9003fb251de5669a3c6589ee41265ae29073dae1ebb46f097eea6e895c29	067564163237fbdbe954057f7cf78c3d5f7cbe4e58d2cc98dc84e3510bf8d48b	\N	node	2026-09-24 08:59:17.947	2026-10-01 08:59:17.946	\N	2026-09-24 08:59:17.947
cmufbflot0004utr6w3xdppvl	cmufbflo10000utr6214dt0t9	bc665d30863ffee5a425f7dbe0d468993174d55c5f86d020cc8770d1b02b19c0	9dcc213cc08932de397ca1dd02c50e26ed646b1f81f88d76327872a24c0b8796	\N	node	2026-09-24 09:14:36.558	2026-10-01 09:14:36.557	\N	2026-09-24 09:14:36.558
cmufbflqd0009utr6sksaj84r	cmufbflq90005utr6tkyrind4	924899e735686039d922b320d9c778f5e04e726d2040f50e87f6ba6b1cb31a1d	df39607fdda32b07122a3c3afc11f21e35d41cfeaf01c76b86090b36cda82cac	\N	node	2026-09-24 09:14:36.614	2026-10-01 09:14:36.613	\N	2026-09-24 09:14:36.614
cmufbfls1000butr6bf4ql4ph	cmufbflq90005utr6tkyrind4	6bde24f145465ffa7f69de95f171addd20af30cb166d752c3ec3cbef7e6a4e88	c7bd488fd19bdeb972fadcf13fc26df71843ad6eaa11b713326fcba3ef4373b7	\N	node	2026-09-24 09:14:36.673	2026-10-01 09:14:36.673	\N	2026-09-24 09:14:36.673
cmufbflyr000iutr6c7wzvk2a	cmufbflyl000eutr6ryb7m033	e268e03735a52f3a469223b150baf7a9490c5df2f0d4ac7ae4ba01db3a6a196d	0c262fe675811f059b1d21e4f0ecf14f6fa86021bf76f12cac7846406aaaee72	\N	node	2026-09-24 09:14:36.915	2026-10-01 09:14:36.915	\N	2026-09-24 09:14:36.915
cmufbfm01000nutr6dsc6avju	cmufbflzv000jutr6w9j89r9e	600302f95378a8573ac9dde38fd3864458b3270a5e141e175109d8d53a49b34d	15184a980ebd45e0d52f7cd74598e0ad869b75d48f48568d9ae9cd21d6185eb8	\N	node	2026-09-24 09:14:36.961	2026-10-01 09:14:36.961	\N	2026-09-24 09:14:36.961
cmufbfm7k000uutr604wc0alp	seed-user-0	58d878ca9f5c41a31e65468cc25b4acd0263d4d77504e21820374e4cc118179f	81eae7dc8dc671b18cf54285269b0e7e22f78b7e323409384abb8ced5bf928c1	\N	node	2026-09-24 09:14:37.233	2026-10-01 09:14:37.232	\N	2026-09-24 09:14:37.233
cmufbfmf20019utr60s6saobb	cmufbfmey0015utr6sk0c2lo9	7df6afa4e93f486255102725bda08d710642a31905e2d6bdf0b1a77d1472afae	4d3b4ec44b09bd0831275b729175546462987b52f01512282677ca96aefe311a	1c81778cae76068d9401d13d4bc023e5cc42855f3e6151cc75695ef6d4048c8f	node	2026-09-24 09:14:37.502	2026-10-01 09:14:37.502	2026-09-24 09:14:37.519	2026-09-24 09:14:37.515
cmufbfmgk001butr65zc7kp17	cmufbfmey0015utr6sk0c2lo9	0f3fd940feb73bc12d1912e00163ffada5c835dd1a8dc91242d1a8b70c6375d0	e0ee237ecf73f3edacc7dbc3f6516e8f33a73b7c8f67df8372a0e83bc1b9fbd2	\N	node	2026-09-24 09:14:37.557	2026-10-01 09:14:37.556	\N	2026-09-24 09:14:37.557
cmufbi0nf001dutr6ugyqrbgr	seed-user-0	a35d848fa7bca0fd3eb77a2ce2c841742a9019ae4f0799fe20dad860521d7672	dd4618093084125701709780266b675ef6d3ad2bf6605dcbc78c86ede1ccb7e0	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	2026-09-24 09:16:29.259	2026-10-01 09:16:29.258	\N	2026-09-24 09:16:29.259
cmufbi8sh001futr6g3dckgkf	seed-user-0	21e9ad23d1b6c8bc56890f4411155a045fbf8061fdbee39ea2022104b917f5de	2662b03654b7d61dc1cbe0e524a685f02be872a54dbf647f9f0e23cbc0504afc	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.8010.12 Safari/537.36	2026-09-24 09:16:39.809	2026-10-01 09:16:39.808	\N	2026-09-24 09:16:39.809
cmufbo8za001hutr6213ch37b	seed-user-0	f4554094bbf783a35740f3c5dfe1e181e2e611f5662fd7e3f757ffd88f3e7c23	cf6d4a8b6ec600d36dbd9e2a57596e62ddfc6aebe247b2fde5abbce2ec580637	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1	2026-09-24 09:21:19.99	2026-10-01 09:21:19.989	\N	2026-09-24 09:21:19.99
cmuffcptf001lutr6l6j4ark1	seed-user-0	55a36cd93ca9e5ab44cf0b300600a323d998cb8bd5781a67b4bacc7f12e57aff	baeb9a3f9946da7c948a7c1db457f9f51d9a045a0ace7446bccc1aa68f04b99e	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.12 Safari/537.36	2026-09-24 11:04:20.403	2026-10-01 11:04:20.402	\N	2026-09-24 11:04:20.403
cmuffcwts001nutr6vfjv597l	seed-user-0	60fc925dddbe5e3589e8cba5c3aa952f3f70d5fb90fcf8edd83cd6cac322f912	d6d713f8005be825b9b27e8468aee9282f6bb0b784392bead64c66b06a129ba8	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.8010.12 Safari/537.36	2026-09-24 11:04:29.488	2026-10-01 11:04:29.488	\N	2026-09-24 11:04:29.488
cmuffdk5n001sutr6zlndzk99	cmuffdk3s001outr66qzpwwyx	a7e765815b822cbdf8233f37d4078f1e90692e59dabacb362a9417c8ff088074	bdfc10bb5da465e1b59bb38a4216fca9311be9db2821b2b9561497d04f2d1c6e	\N	node	2026-09-24 11:04:59.724	2026-10-01 11:04:59.723	\N	2026-09-24 11:04:59.724
cmuffdk76001xutr696h9yq28	cmuffdk72001tutr6tki6l5gt	8b8b21d6be0eb3689fd814fe3ce749dfeb926c251eb632c43daacfb320fafb0e	1e10bc997350501d1286062625eb967089ce6e60c52842ee1a0d38e0cd2a85ed	\N	node	2026-09-24 11:04:59.778	2026-10-01 11:04:59.778	\N	2026-09-24 11:04:59.778
cmuffdk9e001zutr6eilwx087	cmuffdk72001tutr6tki6l5gt	32510584a10a789d83d5ca165b104910c37acc443394714bcc4891cc0c335997	e78a95c0b0c271739ce88ea65ae2e928d4de13033eb758851328ea17f0d37c3c	\N	node	2026-09-24 11:04:59.859	2026-10-01 11:04:59.858	\N	2026-09-24 11:04:59.859
cmuffdkjd0026utr6bifb0nkc	cmuffdkj40022utr6sj3iqi2f	8455a8e6c5d77c16ebe224b4e891ccd193511a71def3cbd3d55669f82329c1b0	c7ef15f8d559ec2d017d4e3eee56bc6860474a7ae62f493c47750902f22abe40	\N	node	2026-09-24 11:05:00.217	2026-10-01 11:05:00.216	\N	2026-09-24 11:05:00.217
cmuffdklf002butr6kn068qgx	cmuffdkl70027utr6zhspnezt	3dd76ffe99a2e04e42e0f17a7c08816bd6cecb38ec157b8dee38902887c06224	5151d6cfb9c7e4e1325d8bc58a95e792ca885b28b297e05fd47a42c17dfbea2d	\N	node	2026-09-24 11:05:00.292	2026-10-01 11:05:00.291	\N	2026-09-24 11:05:00.292
cmuffdkw9002lutr6q0xjd32k	cmuffdkw2002hutr688wxtl56	5f85ee9c84393cbcb89542f419153ef6f7c1b9fc70eb447b2b3ff18a0d26921a	05876596765f492f6703f5bc0efc95b4968728e2117f76e014809ac631057d1d	849c3a210dba46a44be2b3fa651fa0a8edb0c524f68ade5b58c8e732ccd0d327	node	2026-09-24 11:05:00.682	2026-10-01 11:05:00.681	2026-09-24 11:05:00.708	2026-09-24 11:05:00.701
cmuffdkyl002nutr6ijf3ma71	cmuffdkw2002hutr688wxtl56	3d212f6f05c0114d650aac31cf169abe036331119483b4e93c7d03b24920b491	59b3112a1778b5930b9de852a2e6fef74717391d625961f3353ecd24adba919e	\N	node	2026-09-24 11:05:00.765	2026-10-01 11:05:00.764	\N	2026-09-24 11:05:00.765
cmuffdla9002putr6qm7h3dj5	seed-user-0	26bc125f42234e3d7be9abff9ba81f989bc0aab57af5d32f43be95fae632dedf	b5ff2a9554ff0ae4c342c86642af478bad9727fe6d234aba1165d3d28c879c9b	\N	node	2026-09-24 11:05:01.185	2026-10-01 11:05:01.184	\N	2026-09-24 11:05:01.185
cmufh09lm0031utr69z7wq8zn	seed-user-0	104248267da4275a833e4a6ebc31c77963d0bf93d274c9a92a887e9cfbad23e7	64add9477d51cc881755d1e0310a29efe2dbb8f82a05632316083e6c18fce68f	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36	2026-09-24 11:50:38.746	2026-10-01 11:50:38.745	\N	2026-09-24 11:50:38.746
\.


--
-- Data for Name: Startup; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."Startup" (id, slug, name, pitch, description, category, website, "logoUrl", "coverUrl", location, "foundingYear", problem, solution, "verificationStatus", "ownerId", "createdAt", "updatedAt") FROM stdin;
seed-startup-7	lumen-health	Lumen Health	Small habits. A clearer picture of your day.	A personal wellbeing journal focused on reflection and routines. It helps people notice patterns without clinical claims.	Healthtech	https://example.com/lumen-health	\N	http://localhost:4180/media/seed/lumen-health.webp	Pune	2025	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	A personal wellbeing journal focused on reflection and routines. It helps people notice patterns without clinical claims.	UNVERIFIED	seed-user-7	2026-09-23 23:31:49.925	2026-09-24 12:09:58.237
seed-startup-8	tinker	Tinker	The next generation learns by making.	Open-ended electronics kits and playful challenges that turn a kitchen table into a small invention lab.	Education	https://example.com/tinker	\N	http://localhost:4180/media/seed/tinker.webp	Austin	2026	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	Open-ended electronics kits and playful challenges that turn a kitchen table into a small invention lab.	VERIFIED	seed-user-8	2026-09-23 23:31:49.927	2026-09-24 12:09:58.239
seed-startup-9	wayfarer	Wayfarer	A lighter footprint for the last mile.	A compact electric cargo platform designed with neighbourhood delivery teams and local repair shops.	Mobility	https://example.com/wayfarer	\N	http://localhost:4180/media/seed/wayfarer.webp	Berlin	2024	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	A compact electric cargo platform designed with neighbourhood delivery teams and local repair shops.	UNVERIFIED	seed-user-9	2026-09-23 23:31:49.929	2026-09-24 12:09:58.243
seed-startup-10	patch	Patch	Know what changed. Know what matters.	Practical dependency monitoring that explains changes in plain language and helps small teams prioritize maintenance.	Cybersecurity	https://example.com/patch	\N	http://localhost:4180/media/seed/patch.webp	Hyderabad	2025	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	Practical dependency monitoring that explains changes in plain language and helps small teams prioritize maintenance.	UNVERIFIED	seed-user-0	2026-09-23 23:31:49.931	2026-09-24 12:09:58.245
seed-startup-12	solstice	Solstice	Make every watt count.	An open energy monitor that helps makers understand everyday electricity use through simple, local-first dashboards.	Hardware	https://example.com/solstice	\N	http://localhost:4180/media/seed/solstice.webp	Jaipur	2024	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	An open energy monitor that helps makers understand everyday electricity use through simple, local-first dashboards.	VERIFIED	seed-user-2	2026-09-23 23:31:49.934	2026-09-24 12:09:58.248
seed-startup-13	arcade-garden	Arcade Garden	Little worlds with room to wonder.	A cooperative building game about making a shared garden, discovering tiny ecosystems and creating with friends.	Gaming	https://example.com/arcade-garden	\N	http://localhost:4180/media/seed/arcade-garden.webp	Kyoto	2025	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	A cooperative building game about making a shared garden, discovering tiny ecosystems and creating with friends.	UNVERIFIED	seed-user-3	2026-09-23 23:31:49.935	2026-09-24 12:09:58.25
seed-startup-1	nova-robotics	Nova Robotics	Small robots. Extraordinary possibilities.	A modular desktop robot arm for makers, educators and small workshops. Built to be repaired, understood and extended.	Robotics	https://example.com/nova-robotics	\N	http://localhost:4180/media/seed/nova-robotics.webp	Bengaluru	2025	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	A modular desktop robot arm for makers, educators and small workshops. Built to be repaired, understood and extended.	UNVERIFIED	seed-user-1	2026-09-23 23:31:49.916	2026-09-24 12:09:58.212
seed-startup-2	moss	Moss	Bring a little more outside, inside.	A quiet, soil-aware indoor growing system that helps urban homes grow herbs with less water and no guesswork.	Climate	https://example.com/moss	\N	http://localhost:4180/media/seed/moss.webp	Copenhagen	2026	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	A quiet, soil-aware indoor growing system that helps urban homes grow herbs with less water and no guesswork.	UNVERIFIED	seed-user-2	2026-09-23 23:31:49.917	2026-09-24 12:09:58.214
seed-startup-3	relay	Relay	Ship the idea. Skip the busywork.	A preview environment for every branch, with readable deployment logs and a simple path from prototype to production.	Developer Tools	https://example.com/relay	\N	http://localhost:4180/media/seed/relay.webp	London	2024	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	A preview environment for every branch, with readable deployment logs and a simple path from prototype to production.	UNVERIFIED	seed-user-3	2026-09-23 23:31:49.919	2026-09-24 12:09:58.218
seed-startup-4	kite	Kite	Your city, through a local lens.	Thoughtfully curated walking routes, independent shops and neighbourhood stories from people who call the city home.	Consumer Apps	https://example.com/kite	\N	http://localhost:4180/media/seed/kite.webp	Mumbai	2025	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	Thoughtfully curated walking routes, independent shops and neighbourhood stories from people who call the city home.	VERIFIED	seed-user-4	2026-09-23 23:31:49.921	2026-09-24 12:09:58.221
seed-startup-5	orbit-studio	Orbit Studio	Turn a rough thought into a useful first draft.	A private writing companion for teams that need clear meeting notes and grounded answers from their own documents.	AI	https://example.com/orbit-studio	\N	http://localhost:4180/media/seed/orbit-studio.webp	Singapore	2026	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	A private writing companion for teams that need clear meeting notes and grounded answers from their own documents.	UNVERIFIED	seed-user-5	2026-09-23 23:31:49.922	2026-09-24 12:09:58.222
seed-startup-6	fieldwork	Fieldwork	Better research starts with listening.	Customer research that connects interviews, observations and product decisions without burying teams in spreadsheets.	SaaS	https://example.com/fieldwork	\N	http://localhost:4180/media/seed/fieldwork.webp	Amsterdam	2024	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	Customer research that connects interviews, observations and product decisions without burying teams in spreadsheets.	UNVERIFIED	seed-user-6	2026-09-23 23:31:49.924	2026-09-24 12:09:58.235
cmufa3lsz0003utxbqhpiqi85	autotest-startup-1790239037040	AutoTest Startup 1790239037040	Autonomous edge workflow engine	Comprehensive test startup description	AI & Machine Learning	\N	\N	\N	\N	\N	Siloed data and fragile pipelines	Unified autonomous coordination layer	UNVERIFIED	seed-user-0	2026-09-24 08:37:17.22	2026-09-24 08:37:17.22
cmufa6k100003utjbtz5ufzcx	autotest-startup-1790239174733	AutoTest Startup 1790239174733	Autonomous edge workflow engine	Comprehensive test startup description	AI & Machine Learning	\N	\N	\N	\N	\N	Siloed data and fragile pipelines	Unified autonomous coordination layer	UNVERIFIED	seed-user-0	2026-09-24 08:39:34.884	2026-09-24 08:39:34.884
cmufa7iih0003utvamrh5gd9j	autotest-startup-1790239219480	AutoTest Startup 1790239219480	Autonomous edge workflow engine	Comprehensive test startup description	AI & Machine Learning	\N	\N	\N	\N	\N	Siloed data and fragile pipelines	Unified autonomous coordination layer	UNVERIFIED	seed-user-0	2026-09-24 08:40:19.578	2026-09-24 08:40:19.578
cmufa8k1z000hut3vreh6lx1k	autotest-startup-1790239268149	AutoTest Startup 1790239268149	Autonomous edge workflow engine	Comprehensive test startup description	AI & Machine Learning	\N	\N	\N	\N	\N	Siloed data and fragile pipelines	Unified autonomous coordination layer	UNVERIFIED	seed-user-0	2026-09-24 08:41:08.231	2026-09-24 08:41:08.231
cmufa94yf0028ut3vm9zohrm9	autotest-startup-1790239295254	AutoTest Startup 1790239295254	Autonomous edge workflow engine	Comprehensive test startup description	AI & Machine Learning	\N	\N	\N	\N	\N	Siloed data and fragile pipelines	Unified autonomous coordination layer	UNVERIFIED	seed-user-0	2026-09-24 08:41:35.319	2026-09-24 08:41:35.319
cmuffdlan002rutr6bh129lau	autotest-startup-1790247901093	AutoTest Startup 1790247901093	Autonomous edge workflow engine	Comprehensive test startup description	AI & Machine Learning	\N	\N	\N	\N	\N	Siloed data and fragile pipelines	Unified autonomous coordination layer	UNVERIFIED	seed-user-0	2026-09-24 11:05:01.199	2026-09-24 11:05:01.199
seed-startup-0	forma	Forma	A calmer home for your next big idea.	An infinite canvas that brings sketches, research and product thinking into one beautifully simple space.	Design	https://example.com/forma	\N	http://localhost:4180/media/seed/forma.webp	San Francisco	2024	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	An infinite canvas that brings sketches, research and product thinking into one beautifully simple space.	VERIFIED	seed-user-0	2026-09-23 23:31:49.885	2026-09-24 12:09:58.183
cmufavw8c0010utx5jdozl1qi	autotest-startup-1790240356941	AutoTest Startup 1790240356941	Autonomous edge workflow engine	Comprehensive test startup description	AI & Machine Learning	\N	\N	\N	\N	\N	Siloed data and fragile pipelines	Unified autonomous coordination layer	UNVERIFIED	seed-user-0	2026-09-24 08:59:17.101	2026-09-24 08:59:17.101
seed-startup-11	threadline	Threadline	Independent voices, connected.	A publishing workspace for independent creators with collaborative editing and beautiful, accessible reading experiences.	Creator Economy	https://example.com/threadline	\N	http://localhost:4180/media/seed/threadline.webp	New York	2026	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	A publishing workspace for independent creators with collaborative editing and beautiful, accessible reading experiences.	UNVERIFIED	seed-user-1	2026-09-23 23:31:49.932	2026-09-24 12:09:58.246
seed-startup-14	drift-space	Drift Space	Space data, closer to home.	A student-built visual explorer for open Earth observation datasets, connecting satellite imagery with local questions.	Space	https://example.com/drift-space	\N	http://localhost:4180/media/seed/drift-space.webp	Chennai	2026	Useful ideas deserve tools that are easier to understand and more enjoyable to use.	A student-built visual explorer for open Earth observation datasets, connecting satellite imagery with local questions.	UNVERIFIED	seed-user-4	2026-09-23 23:31:49.937	2026-09-24 12:09:58.252
cmufbfm7u000wutr6q3u8jxae	autotest-startup-1790241277189	AutoTest Startup 1790241277189	Autonomous edge workflow engine	Comprehensive test startup description	AI & Machine Learning	\N	\N	\N	\N	\N	Siloed data and fragile pipelines	Unified autonomous coordination layer	UNVERIFIED	seed-user-0	2026-09-24 09:14:37.243	2026-09-24 09:14:37.243
\.


--
-- Data for Name: StartupFollow; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."StartupFollow" ("userId", "startupId", "createdAt") FROM stdin;
seed-user-0	seed-startup-0	2026-09-23 23:31:50.7
seed-user-0	seed-startup-1	2026-09-23 23:31:50.701
seed-user-0	seed-startup-2	2026-09-23 23:31:50.701
seed-user-0	seed-startup-3	2026-09-23 23:31:50.702
seed-user-0	seed-startup-4	2026-09-23 23:31:50.702
seed-user-1	seed-startup-1	2026-09-23 23:31:50.704
seed-user-1	seed-startup-2	2026-09-23 23:31:50.704
seed-user-1	seed-startup-3	2026-09-23 23:31:50.704
seed-user-1	seed-startup-4	2026-09-23 23:31:50.705
seed-user-1	seed-startup-5	2026-09-23 23:31:50.705
seed-user-2	seed-startup-2	2026-09-23 23:31:50.706
seed-user-2	seed-startup-3	2026-09-23 23:31:50.706
seed-user-2	seed-startup-4	2026-09-23 23:31:50.706
seed-user-2	seed-startup-5	2026-09-23 23:31:50.707
seed-user-2	seed-startup-6	2026-09-23 23:31:50.707
seed-user-3	seed-startup-3	2026-09-23 23:31:50.708
seed-user-3	seed-startup-4	2026-09-23 23:31:50.708
seed-user-3	seed-startup-5	2026-09-23 23:31:50.708
seed-user-3	seed-startup-6	2026-09-23 23:31:50.709
seed-user-3	seed-startup-7	2026-09-23 23:31:50.709
seed-user-4	seed-startup-4	2026-09-23 23:31:50.71
seed-user-4	seed-startup-5	2026-09-23 23:31:50.71
seed-user-4	seed-startup-6	2026-09-23 23:31:50.711
seed-user-4	seed-startup-7	2026-09-23 23:31:50.711
seed-user-4	seed-startup-8	2026-09-23 23:31:50.711
seed-user-5	seed-startup-5	2026-09-23 23:31:50.712
seed-user-5	seed-startup-6	2026-09-23 23:31:50.712
seed-user-5	seed-startup-7	2026-09-23 23:31:50.713
seed-user-5	seed-startup-8	2026-09-23 23:31:50.713
seed-user-5	seed-startup-9	2026-09-23 23:31:50.713
seed-user-6	seed-startup-6	2026-09-23 23:31:50.714
seed-user-6	seed-startup-7	2026-09-23 23:31:50.714
seed-user-6	seed-startup-8	2026-09-23 23:31:50.715
seed-user-6	seed-startup-9	2026-09-23 23:31:50.715
seed-user-6	seed-startup-10	2026-09-23 23:31:50.715
seed-user-7	seed-startup-7	2026-09-23 23:31:50.716
seed-user-7	seed-startup-8	2026-09-23 23:31:50.716
seed-user-7	seed-startup-9	2026-09-23 23:31:50.717
seed-user-7	seed-startup-10	2026-09-23 23:31:50.717
seed-user-7	seed-startup-11	2026-09-23 23:31:50.717
seed-user-8	seed-startup-8	2026-09-23 23:31:50.718
seed-user-8	seed-startup-9	2026-09-23 23:31:50.719
seed-user-8	seed-startup-10	2026-09-23 23:31:50.719
seed-user-8	seed-startup-11	2026-09-23 23:31:50.719
seed-user-8	seed-startup-12	2026-09-23 23:31:50.719
seed-user-9	seed-startup-9	2026-09-23 23:31:50.72
seed-user-9	seed-startup-10	2026-09-23 23:31:50.721
seed-user-9	seed-startup-11	2026-09-23 23:31:50.721
seed-user-9	seed-startup-12	2026-09-23 23:31:50.721
seed-user-9	seed-startup-13	2026-09-23 23:31:50.721
seed-user-10	seed-startup-10	2026-09-23 23:31:50.722
seed-user-10	seed-startup-11	2026-09-23 23:31:50.723
seed-user-10	seed-startup-12	2026-09-23 23:31:50.723
seed-user-10	seed-startup-13	2026-09-23 23:31:50.723
seed-user-10	seed-startup-14	2026-09-23 23:31:50.723
seed-user-11	seed-startup-11	2026-09-23 23:31:50.724
seed-user-11	seed-startup-12	2026-09-23 23:31:50.725
seed-user-11	seed-startup-13	2026-09-23 23:31:50.725
seed-user-11	seed-startup-14	2026-09-23 23:31:50.725
seed-user-11	seed-startup-0	2026-09-23 23:31:50.725
seed-user-12	seed-startup-12	2026-09-23 23:31:50.726
seed-user-12	seed-startup-13	2026-09-23 23:31:50.727
seed-user-12	seed-startup-14	2026-09-23 23:31:50.727
seed-user-12	seed-startup-0	2026-09-23 23:31:50.727
seed-user-12	seed-startup-1	2026-09-23 23:31:50.727
seed-user-13	seed-startup-13	2026-09-23 23:31:50.729
seed-user-13	seed-startup-14	2026-09-23 23:31:50.729
seed-user-13	seed-startup-0	2026-09-23 23:31:50.729
seed-user-13	seed-startup-1	2026-09-23 23:31:50.729
seed-user-13	seed-startup-2	2026-09-23 23:31:50.729
seed-user-14	seed-startup-14	2026-09-23 23:31:50.731
seed-user-14	seed-startup-0	2026-09-23 23:31:50.731
seed-user-14	seed-startup-1	2026-09-23 23:31:50.731
seed-user-14	seed-startup-2	2026-09-23 23:31:50.731
seed-user-14	seed-startup-3	2026-09-23 23:31:50.732
seed-user-15	seed-startup-0	2026-09-23 23:31:50.733
seed-user-15	seed-startup-1	2026-09-23 23:31:50.733
seed-user-15	seed-startup-2	2026-09-23 23:31:50.733
seed-user-15	seed-startup-3	2026-09-23 23:31:50.733
seed-user-15	seed-startup-4	2026-09-23 23:31:50.734
seed-user-16	seed-startup-1	2026-09-23 23:31:50.735
seed-user-16	seed-startup-2	2026-09-23 23:31:50.735
seed-user-16	seed-startup-3	2026-09-23 23:31:50.735
seed-user-16	seed-startup-4	2026-09-23 23:31:50.736
seed-user-16	seed-startup-5	2026-09-23 23:31:50.736
seed-user-17	seed-startup-2	2026-09-23 23:31:50.737
seed-user-17	seed-startup-3	2026-09-23 23:31:50.737
seed-user-17	seed-startup-4	2026-09-23 23:31:50.738
seed-user-17	seed-startup-5	2026-09-23 23:31:50.738
seed-user-17	seed-startup-6	2026-09-23 23:31:50.738
seed-user-18	seed-startup-3	2026-09-23 23:31:50.739
seed-user-18	seed-startup-4	2026-09-23 23:31:50.739
seed-user-18	seed-startup-5	2026-09-23 23:31:50.74
seed-user-18	seed-startup-6	2026-09-23 23:31:50.74
seed-user-18	seed-startup-7	2026-09-23 23:31:50.74
seed-user-19	seed-startup-4	2026-09-23 23:31:50.741
seed-user-19	seed-startup-5	2026-09-23 23:31:50.742
seed-user-19	seed-startup-6	2026-09-23 23:31:50.742
seed-user-19	seed-startup-7	2026-09-23 23:31:50.742
seed-user-19	seed-startup-8	2026-09-23 23:31:50.742
seed-user-20	seed-startup-5	2026-09-23 23:31:50.744
seed-user-20	seed-startup-6	2026-09-23 23:31:50.744
seed-user-20	seed-startup-7	2026-09-23 23:31:50.744
seed-user-20	seed-startup-8	2026-09-23 23:31:50.744
seed-user-20	seed-startup-9	2026-09-23 23:31:50.745
seed-user-21	seed-startup-6	2026-09-23 23:31:50.746
seed-user-21	seed-startup-7	2026-09-23 23:31:50.746
seed-user-21	seed-startup-8	2026-09-23 23:31:50.746
seed-user-21	seed-startup-9	2026-09-23 23:31:50.747
seed-user-21	seed-startup-10	2026-09-23 23:31:50.747
seed-user-22	seed-startup-7	2026-09-23 23:31:50.748
seed-user-22	seed-startup-8	2026-09-23 23:31:50.748
seed-user-22	seed-startup-9	2026-09-23 23:31:50.749
seed-user-22	seed-startup-10	2026-09-23 23:31:50.749
seed-user-22	seed-startup-11	2026-09-23 23:31:50.749
seed-user-23	seed-startup-8	2026-09-23 23:31:50.75
seed-user-23	seed-startup-9	2026-09-23 23:31:50.75
seed-user-23	seed-startup-10	2026-09-23 23:31:50.751
seed-user-23	seed-startup-11	2026-09-23 23:31:50.752
seed-user-23	seed-startup-12	2026-09-23 23:31:50.752
seed-user-24	seed-startup-9	2026-09-23 23:31:50.754
seed-user-24	seed-startup-10	2026-09-23 23:31:50.754
seed-user-24	seed-startup-11	2026-09-23 23:31:50.754
seed-user-24	seed-startup-12	2026-09-23 23:31:50.754
seed-user-24	seed-startup-13	2026-09-23 23:31:50.755
seed-user-25	seed-startup-10	2026-09-23 23:31:50.756
seed-user-25	seed-startup-11	2026-09-23 23:31:50.756
seed-user-25	seed-startup-12	2026-09-23 23:31:50.756
seed-user-25	seed-startup-13	2026-09-23 23:31:50.757
seed-user-25	seed-startup-14	2026-09-23 23:31:50.757
seed-user-26	seed-startup-11	2026-09-23 23:31:50.758
seed-user-26	seed-startup-12	2026-09-23 23:31:50.758
seed-user-26	seed-startup-13	2026-09-23 23:31:50.759
seed-user-26	seed-startup-14	2026-09-23 23:31:50.759
seed-user-26	seed-startup-0	2026-09-23 23:31:50.759
seed-user-27	seed-startup-12	2026-09-23 23:31:50.76
seed-user-27	seed-startup-13	2026-09-23 23:31:50.761
seed-user-27	seed-startup-14	2026-09-23 23:31:50.761
seed-user-27	seed-startup-0	2026-09-23 23:31:50.761
seed-user-27	seed-startup-1	2026-09-23 23:31:50.761
seed-user-28	seed-startup-13	2026-09-23 23:31:50.763
seed-user-28	seed-startup-14	2026-09-23 23:31:50.763
seed-user-28	seed-startup-0	2026-09-23 23:31:50.763
seed-user-28	seed-startup-1	2026-09-23 23:31:50.763
seed-user-28	seed-startup-2	2026-09-23 23:31:50.764
seed-user-29	seed-startup-14	2026-09-23 23:31:50.765
seed-user-29	seed-startup-0	2026-09-23 23:31:50.765
seed-user-29	seed-startup-1	2026-09-23 23:31:50.765
seed-user-29	seed-startup-2	2026-09-23 23:31:50.766
seed-user-29	seed-startup-3	2026-09-23 23:31:50.766
\.


--
-- Data for Name: StartupMember; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."StartupMember" ("startupId", "userId", role) FROM stdin;
seed-startup-0	seed-user-0	OWNER
seed-startup-1	seed-user-1	OWNER
seed-startup-2	seed-user-2	OWNER
seed-startup-3	seed-user-3	OWNER
seed-startup-4	seed-user-4	OWNER
seed-startup-5	seed-user-5	OWNER
seed-startup-6	seed-user-6	OWNER
seed-startup-7	seed-user-7	OWNER
seed-startup-8	seed-user-8	OWNER
seed-startup-9	seed-user-9	OWNER
seed-startup-10	seed-user-0	OWNER
seed-startup-11	seed-user-1	OWNER
seed-startup-12	seed-user-2	OWNER
seed-startup-13	seed-user-3	OWNER
seed-startup-14	seed-user-4	OWNER
cmufa3lsz0003utxbqhpiqi85	seed-user-0	OWNER
cmufa6k100003utjbtz5ufzcx	seed-user-0	OWNER
cmufa7iih0003utvamrh5gd9j	seed-user-0	OWNER
cmufa8k1z000hut3vreh6lx1k	seed-user-0	OWNER
cmufa94yf0028ut3vm9zohrm9	seed-user-0	OWNER
seed-startup-2	seed-user-6	OWNER
seed-startup-3	seed-user-8	OWNER
seed-startup-4	seed-user-10	OWNER
seed-startup-5	seed-user-13	OWNER
seed-startup-6	seed-user-4	OWNER
seed-startup-7	seed-user-0	OWNER
seed-startup-8	seed-user-1	OWNER
seed-startup-9	seed-user-4	OWNER
seed-startup-10	seed-user-6	OWNER
seed-startup-11	seed-user-8	OWNER
seed-startup-12	seed-user-10	OWNER
seed-startup-13	seed-user-13	OWNER
seed-startup-14	seed-user-0	OWNER
cmufavw8c0010utx5jdozl1qi	seed-user-0	OWNER
cmufbfm7u000wutr6q3u8jxae	seed-user-0	OWNER
cmuffdlan002rutr6bh129lau	seed-user-0	OWNER
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."User" (id, email, username, "displayName", "passwordHash", "googleId", role, bio, "avatarUrl", location, website, "emailVerifiedAt", onboarded, "privateAccount", "activityVisible", "messageControl", suspended, "deactivatedAt", "createdAt", "updatedAt") FROM stdin;
seed-user-1	arjun_mehta@productscroll.local	arjun_mehta	Arjun Mehta	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Building thoughtful tools. Sharing the messy middle.	\N	London	\N	2026-09-23 23:31:49.785	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.786	2026-09-24 12:09:58.089
seed-user-2	elena_torres@productscroll.local	elena_torres	Elena Torres	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	ADMIN	Building thoughtful tools. Sharing the messy middle.	\N	San Francisco	\N	2026-09-23 23:31:49.789	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.789	2026-09-24 12:09:58.095
seed-user-3	kabir_shah@productscroll.local	kabir_shah	Kabir Shah	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	MODERATOR	Building thoughtful tools. Sharing the messy middle.	\N	Copenhagen	\N	2026-09-23 23:31:49.792	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.793	2026-09-24 12:09:58.097
seed-user-4	sofia_andersson@productscroll.local	sofia_andersson	Sofia Andersson	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Building thoughtful tools. Sharing the messy middle.	\N	Bengaluru	\N	2026-09-23 23:31:49.796	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.796	2026-09-24 12:09:58.099
seed-user-5	nikhil_rao@productscroll.local	nikhil_rao	Nikhil Rao	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Building thoughtful tools. Sharing the messy middle.	\N	London	\N	2026-09-23 23:31:49.799	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.799	2026-09-24 12:09:58.101
seed-user-6	amara_okafor@productscroll.local	amara_okafor	Amara Okafor	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Building thoughtful tools. Sharing the messy middle.	\N	San Francisco	\N	2026-09-23 23:31:49.802	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.802	2026-09-24 12:09:58.103
seed-user-7	leo_park@productscroll.local	leo_park	Leo Park	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Building thoughtful tools. Sharing the messy middle.	\N	Copenhagen	\N	2026-09-23 23:31:49.805	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.805	2026-09-24 12:09:58.113
seed-user-8	riya_kapoor@productscroll.local	riya_kapoor	Riya Kapoor	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Building thoughtful tools. Sharing the messy middle.	\N	Bengaluru	\N	2026-09-23 23:31:49.808	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.808	2026-09-24 12:09:58.115
seed-user-9	oliver_reed@productscroll.local	oliver_reed	Oliver Reed	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Building thoughtful tools. Sharing the messy middle.	\N	London	\N	2026-09-23 23:31:49.814	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.814	2026-09-24 12:09:58.117
seed-user-10	zoe_martin@productscroll.local	zoe_martin	Zoe Martin	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Curious about the people building what comes next.	\N	San Francisco	\N	2026-09-23 23:31:49.817	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.818	2026-09-24 12:09:58.119
seed-user-11	dev_patel@productscroll.local	dev_patel	Dev Patel	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	Copenhagen	\N	2026-09-23 23:31:49.824	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.825	2026-09-24 12:09:58.12
seed-user-12	isha_menon@productscroll.local	isha_menon	Isha Menon	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	Bengaluru	\N	2026-09-23 23:31:49.827	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.828	2026-09-24 12:09:58.122
seed-user-13	sam_rivera@productscroll.local	sam_rivera	Sam Rivera	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Curious about the people building what comes next.	\N	London	\N	2026-09-23 23:31:49.83	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.831	2026-09-24 12:09:58.131
seed-user-14	aanya_gupta@productscroll.local	aanya_gupta	Aanya Gupta	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	San Francisco	\N	2026-09-23 23:31:49.833	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.833	2026-09-24 12:09:58.133
seed-user-15	noah_kim@productscroll.local	noah_kim	Noah Kim	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	Copenhagen	\N	2026-09-23 23:31:49.835	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.836	2026-09-24 12:09:58.135
seed-user-16	priya_nair@productscroll.local	priya_nair	Priya Nair	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Curious about the people building what comes next.	\N	Bengaluru	\N	2026-09-23 23:31:49.838	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.839	2026-09-24 12:09:58.141
seed-user-17	ethan_brooks@productscroll.local	ethan_brooks	Ethan Brooks	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	London	\N	2026-09-23 23:31:49.841	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.842	2026-09-24 12:09:58.145
seed-user-18	sara_ahmed@productscroll.local	sara_ahmed	Sara Ahmed	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	San Francisco	\N	2026-09-23 23:31:49.844	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.845	2026-09-24 12:09:58.148
seed-user-19	aditya_joshi@productscroll.local	aditya_joshi	Aditya Joshi	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	Copenhagen	\N	2026-09-23 23:31:49.847	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.848	2026-09-24 12:09:58.151
cmufa6kbm000hutjbrv6fprey	msg_b_1790239175173@productscroll.local	msg_user_b_1790239175173	Message User B	scrypt:8c3585a442a0356ba25bc0e66c45b578:11533e486981f39bfe7ed7c49e1e9604ea82aaaf8767822e5ec8501dbb4f4ab17338d3e27d049c3798e9e9b75468bda4474f78df68bbd40b7d8b9627881811af	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:39:35.267	2026-09-24 08:39:35.267
cmuf8zfn40000ut98083f1bzt	testuser@example.com	testuser	Test User	$2b$12$w94CzH79tUELoEHPAtmft.WVy0J0e.qbeu/muhYt87Fu/0drlVYAe	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:06:02.993	2026-09-24 08:06:02.993
cmufa6kjs000rutjb2b60ohxh	integration_test_1790239175493@productscroll.local	test_user_1790239175493	Test User Integration	scrypt:073365591a83fc47057dc79ef8397490:fa77b7abd4c69a39a14a34ffe3eb39e6f3da082aafee5bc344bcd4dc0793e6c7a1ec359735ebf841aed154951229c864bbebfb562c2061fa6d55be4681eb13ba	\N	FOUNDER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:39:35.561	2026-09-24 08:39:35.561
cmufa3m6g000eutxbklb8fmke	msg_a_1790239037649@productscroll.local	msg_user_a_1790239037649	Message User A	scrypt:fa71a15f21942724ac48e6e2d2f37bd5:369c3a2db3b7557efc0171c456484570cbdc0fad70a92138e244dca53d319678364a5954ac83988db1edbae4ee3ba0e3c06d315218ac50d9719fc048078b9c39	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:37:17.704	2026-09-24 08:37:17.704
cmufa3m80000jutxbo0gbvb2e	msg_b_1790239037649@productscroll.local	msg_user_b_1790239037649	Message User B	scrypt:dd9d0cb9b895c43b194375eb7dde8121:d3704a8e5eea180602a195b4b47d53d7599617d8c340c7c7d02333b06ca70ae54f95777bdd0fb766a60dea7c9e7cc132d0d5558879628a3ed8eaa08b636f99e4	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:37:17.761	2026-09-24 08:37:17.761
cmufa6kui000yutjb7bgvio5f	reg_1790239175889@productscroll.local	reg_1790239175889	Regular User	scrypt:0daa3f792d46857a4b9cc8ca2a7c2152:6a0b925693bb726c58bb8249481fbd376d9f454d32c647e5dba27f344414eb11aa4eac15c19b223f790338d391690273cc306dfcf35ab382cfabe97289d7f110	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:39:35.946	2026-09-24 08:39:35.946
cmufa3mff000tutxbcstszkyk	integration_test_1790239037982@productscroll.local	test_user_1790239037982	Test User Integration	scrypt:711dfa1596a0131734551244cfe58fb2:bd21b517bd2916a89dd928384186e42acd314bb665d4d62513e1be35385715a068338d1a5fa1ac0ca0a288182741aea1b946925a86a82dac2e07162b6d6d7d06	\N	FOUNDER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:37:18.028	2026-09-24 08:37:18.028
cmufa3moq0010utxbxiu1boa6	reg_1790239038313@productscroll.local	reg_1790239038313	Regular User	scrypt:a09d4b374a4d90bf4a3e0d91844ccdcd:294af16cfa015c565463a2e911d376a72de21cc38d39bb4f3eccb61f77ed0ff0f5e0cc05c1d6be641b2c142f699a9d7b472fc3f6a4dd5972d04fc6389748a976	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:37:18.363	2026-09-24 08:37:18.363
cmufa7is8000cutvapayxs0zx	reg_1790239219881@productscroll.local	reg_1790239219881	Regular User	scrypt:50d6db817126236fafc3b01538895006:b80716a28d500f24df089e9799731e72865fa38fd147177cb918cd2de8571e157ba8f351df55018353be59e4e22063b274efd5f5ddd68d4786ef2e99f12f5ffc	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:40:19.928	2026-09-24 08:40:19.928
cmufa6ka9000cutjbpjyruycg	msg_a_1790239175173@productscroll.local	msg_user_a_1790239175173	Message User A	scrypt:1d9f5d475279025919296536fbd22a29:5bd9d9b71b9d3b757f25f874daa37bce3bbb6da249836900029be363c28dda69d75e6371cbc8dcd293f4b31920c8f27c08012b634e0a1d1dddad88bde2b18aa5	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:39:35.217	2026-09-24 08:39:35.217
cmufa6kvu0013utjbmxbvw5xd	adm_1790239175889@productscroll.local	adm_1790239175889	Admin User	scrypt:9736f83244be3309f04fea96045fcc87:2dd0f7f484fe593aa08feb2ba8c0ac239724fad4b1d2450ab4469284d1a9d1cee10048355a0941219a77786ee5754ba33804b9715733de9dc6f9cbd3d9062576	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:39:35.994	2026-09-24 08:39:35.994
seed-user-0	maya@productscroll.local	maya_chen	Maya Chen	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Building thoughtful tools. Sharing the messy middle.	\N	Bengaluru	\N	2026-09-23 23:31:49.765	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.766	2026-09-24 12:09:58.083
seed-user-21	lina_fischer@productscroll.local	lina_fischer	Lina Fischer	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	London	\N	2026-09-23 23:31:49.857	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.857	2026-09-24 12:09:58.155
seed-user-22	omar_hassan@productscroll.local	omar_hassan	Omar Hassan	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	San Francisco	\N	2026-09-23 23:31:49.861	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.862	2026-09-24 12:09:58.156
seed-user-23	anika_bose@productscroll.local	anika_bose	Anika Bose	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	Copenhagen	\N	2026-09-23 23:31:49.864	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.864	2026-09-24 12:09:58.159
seed-user-24	max_wilson@productscroll.local	max_wilson	Max Wilson	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Curious about the people building what comes next.	\N	Bengaluru	\N	2026-09-23 23:31:49.867	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.867	2026-09-24 12:09:58.162
seed-user-25	meera_iyer@productscroll.local	meera_iyer	Meera Iyer	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	London	\N	2026-09-23 23:31:49.871	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.871	2026-09-24 12:09:58.164
seed-user-26	alex_morgan@productscroll.local	alex_morgan	Alex Morgan	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	San Francisco	\N	2026-09-23 23:31:49.873	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.874	2026-09-24 12:09:58.172
seed-user-27	tara_singh@productscroll.local	tara_singh	Tara Singh	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	Copenhagen	\N	2026-09-23 23:31:49.876	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.877	2026-09-24 12:09:58.178
seed-user-28	lucas_silva@productscroll.local	lucas_silva	Lucas Silva	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Curious about the people building what comes next.	\N	Bengaluru	\N	2026-09-23 23:31:49.88	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.88	2026-09-24 12:09:58.18
seed-user-29	admin@productscroll.local	aisha_khan	Aisha Khan	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	USER	Curious about the people building what comes next.	\N	London	\N	2026-09-23 23:31:49.882	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.883	2026-09-24 12:09:58.182
cmufa7itl000hutvah8olel07	adm_1790239219881@productscroll.local	adm_1790239219881	Admin User	scrypt:064beb90e9523fb5544c8da3416157f5:51a098328ed39d036a99f5c2902799283a787bcd9535fd0d348eb1835792768a87572c3ca97484a4ce5593593e97c7b66d4dffd1cdd1690d364533dbb29c4987	\N	ADMIN		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:40:19.977	2026-09-24 08:40:19.993
cmufa7j3h000qutvatvfj5zm7	integration_test_1790239220263@productscroll.local	test_user_1790239220263	Test User Integration	scrypt:44111e35b6d42986b367113b3e3a5e28:62d58b08a0457c1de55b1b1c277fd6391b6c1e7ee8e34da1ec0be10e9e8fa8aabef70f45a11f6fb8d01ac0258d7ea566fb3a6676370a3fb124a0d0187c394bc5	\N	FOUNDER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:40:20.334	2026-09-24 08:40:20.334
cmufa7jch000xutva9zo2jbsc	msg_a_1790239220611@productscroll.local	msg_user_a_1790239220611	Message User A	scrypt:fad7176583d00ff67b972ca517f62d05:93c3487a9cbd0b015e61e49014d69b38fb230424e746cd23dacba49a7c72e60e928606990b3abdb77d9ab30e5d0b575156647c82cfc98da9382c9b13dbc9b195	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:40:20.657	2026-09-24 08:40:20.657
cmufa7jdr0012utvae0pqohc2	msg_b_1790239220611@productscroll.local	msg_user_b_1790239220611	Message User B	scrypt:24e6450b2b7ed70af882099563ad89e0:23d6e5b8c7cbec07d2ea472328c4bda37ca61c1f853edb76783b5d02909b86ddf4fe50e42d5a15f643485ee17913483e213c46bbda8bf679d7be02d05423f823	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:40:20.704	2026-09-24 08:40:20.704
cmufa8joz0000ut3vzf95i06s	reg_1790239267651@productscroll.local	reg_1790239267651	Regular User	scrypt:2bc44684c00f4290e3f1e23d5f16481e:b4bb442fb3c9752e630d907be4ed309bc92226f3a2177cdc92e888dd78dbc6a96a1b0f50752160a6364cf7beda7d97fed64dcfe96a4270eab2b5219540c39779	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:07.764	2026-09-24 08:41:07.764
cmufa8jr20005ut3vptpczxec	adm_1790239267651@productscroll.local	adm_1790239267651	Admin User	scrypt:cea6f79fe12a0c5801df7b349a6dd4a0:6eb701e2bdc8ccc68db7cd633ad96469698c9519f79cd7ebcb0faae4d1918cdb116bb8b737a5821ea70b6bc07789fd067e160502b508c309c45e317c8bd270c4	\N	ADMIN		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:07.838	2026-09-24 08:41:07.861
cmufa8kb4000qut3vr9viyake	integration_test_1790239268504@productscroll.local	test_user_1790239268504	Test User Integration	scrypt:18d97998892dc1c0179bb20eabbacb1d:c3119d5ea847503c81b9585656be81c7f09c5baea4ebb8dc5cb7981d4e679cef8b5035b1aa5204cd1c597799d74ac1e70eb9a1516eb5012fa4f435818d317ddc	\N	FOUNDER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:08.56	2026-09-24 08:41:08.56
cmufa8kn0000xut3v8luj9bd7	msg_a_1790239268906@productscroll.local	msg_user_a_1790239268906	Message User A	scrypt:d4dd79fc83edc16ded8e77d1c71176c9:63fbae6d5a63d2167290e4d7760f8ca94e91a3be8686953592dee5882f9f5f46f80dd231aaa1c9de76f9da262fded0e1cd28aa39736ed75fcea9c29a6f211d41	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:08.988	2026-09-24 08:41:08.988
cmufa8kor0012ut3vz4568jdf	msg_b_1790239268906@productscroll.local	msg_user_b_1790239268906	Message User B	scrypt:6ae3d27821bcdf3133db74cf0d961d52:ca79526ab8fb3f2d945800d5091444dd5d256af3e94bf79f160d988872473506260526665162d54a0a0ee5352304b674fa120270b6c7f3be3308b9b05bd26008	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:09.052	2026-09-24 08:41:09.052
cmufa94eh001cut3vim5o0anj	reg_1790239294477@productscroll.local	reg_1790239294477	Regular User	scrypt:340a8b0c55a9fc528f507a8341c692e8:45560915d02c260eb12576577b601ce5e8290e74a73d1f776a6d617f14c514f3e50d146d5cc924121828c698a9e78c9fb3dc94e4e7d11c26485ec043910d64b8	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:34.601	2026-09-24 08:41:34.601
cmufa94gc001hut3v60magkah	adm_1790239294477@productscroll.local	adm_1790239294477	Admin User	scrypt:98e1395a4fed5386e9a51a71ae28e95b:b004d2f2a2178f807b7dd8cd13335b5385f0f2c48dea19d43f3d347c56c3e852f96ec987ce96f84b47575e2306ac9d562afa4100835cad40c740538011aa6f08	\N	ADMIN		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:34.668	2026-09-24 08:41:34.691
cmufa94pd001qut3vdj8g1md4	msg_a_1790239294922@productscroll.local	msg_user_a_1790239294922	Message User A	scrypt:48e4ddd72f3d43d45c678301ef3b7a7c:f3b10e305e4d8aa18cd6f16d08d97fa05f37de1a8e3a23a9d4e51dd9dc1aa9c628b7d38427ee3b8d7df0f6d136bd40a930b1e2c6235e53584b13609c59f2cc24	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:34.994	2026-09-24 08:41:34.994
cmufa94qy001vut3vmjhf4879	msg_b_1790239294922@productscroll.local	msg_user_b_1790239294922	Message User B	scrypt:836224688c3002eb2d98fb6921a1ef1d:c2e2789213c5b400498d19431f9b0596492d44962074c0f2a73fcb575b9c0e07d4c1d98b0e760b2b1f94f768c0a55ba83ea28c455e094dd5c76b6c5a65e18eab	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:35.05	2026-09-24 08:41:35.05
cmufa956q002hut3vpjxtflap	integration_test_1790239295567@productscroll.local	test_user_1790239295567	Test User Integration	scrypt:8fe503a3c68688c2b4f55f760869ae11:97e5fac495e85dd931acb21833d2554e361dd862638701d5c57b3415fc4e1b465ce48177acfe05ae61df0d88d43f02379d405a836d3fbcafde8510830ac1806c	\N	FOUNDER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:41:35.618	2026-09-24 08:41:35.618
cmufavvj3000iutx5b3mjnwps	msg_a_1790240356058@productscroll.local	msg_user_a_1790240356058	Message User A	scrypt:b9f87074ca3aaa57d01f1455fc63831c:bbb5f414d8a45921aa86c551fbc8ad52b88ba217ff99f40654b81c989c5f900c70f2849491dc9d481bcfe097c9c5dd9640740b314eda654672f963e252acb4d4	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:59:16.192	2026-09-24 08:59:16.192
cmufavvmf000nutx5x7yz57wo	msg_b_1790240356058@productscroll.local	msg_user_b_1790240356058	Message User B	scrypt:78794a8923dcae99f0472bb92d76642f:8f68e47889f24471030f6da47cabd29b6c45538e92f45ebe57756d591201db713b5ec944a13e0c049ef9a95fbbea461c8e8851ecf31eb6d244d31193a6e6dc33	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:59:16.311	2026-09-24 08:59:16.311
cmufavwsm0019utx5ooic2abw	integration_test_1790240357734@productscroll.local	test_user_1790240357734	Test User Integration	scrypt:c8be82b2e936399d7dc4dac6e5c51797:af21bf9141ed55bd3945c08740662ad386a341516b30626df11abc2da36b54fb633a34dec38f492e2e426a0da8a4e92725361128c6a6aecab1d5f1cde07546e7	\N	FOUNDER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:59:17.83	2026-09-24 08:59:17.83
cmufavurl0004utx51goqpzxf	reg_1790240355052@productscroll.local	reg_1790240355052	Regular User	scrypt:49ab9b491a841ebf7839bb8a43c21c9e:d8e0500bebf888fe189cb4317f25754901363bce26753724f554afd75cf64e5eca4e90347e17867c008602af17fbf6dc4561d4f221ae806978559d03b33cfde3	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:59:15.201	2026-09-24 08:59:15.201
cmufavuw00009utx5bt46xprm	adm_1790240355052@productscroll.local	adm_1790240355052	Admin User	scrypt:7fe2a359a690859f8a813439c2d5feca:a984a233ec849b6d391891302e19764c7354ef62980cd05b37f0b1bd028ccd2b19c984766f8c3d4f00ab4139f713f230b9d7cf3f7669931cae57283891fcba08	\N	ADMIN		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 08:59:15.36	2026-09-24 08:59:15.393
cmufbflo10000utr6214dt0t9	reg_1790241276353@productscroll.local	reg_1790241276353	Regular User	scrypt:a3ca88d0a4aeb54cd68b60958dbcb287:9bdc675d85c759b71e8bf2c662aa3cfa2fd006a6fda88b914eb80479a66965191d77ca70ef0283a667fe2d876ac161e485b08ab932ebae381bcbd39e645feb04	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 09:14:36.529	2026-09-24 09:14:36.529
cmufbflq90005utr6tkyrind4	adm_1790241276353@productscroll.local	adm_1790241276353	Admin User	scrypt:a5f8a1654d5748083839f1e5ee2cf0b5:d82351f669f5daefcf32f63a953adfbb786670eaea5e67e34e7ba1ed7362b98b77df0a798f38523117640448167ab1f5b81e9fe80da63c752e376b9b355296da	\N	ADMIN		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 09:14:36.609	2026-09-24 09:14:36.623
cmufbflyl000eutr6ryb7m033	msg_a_1790241276861@productscroll.local	msg_user_a_1790241276861	Message User A	scrypt:430a76e8b16113ad41e663555f17190d:f7bb6e50698c01b01d8df61fcfaf78b221be1549491a201b4653e422f5755f364ce9c5b944164752cb62b15e9d45925db7250f84e199cac1571dc0833b07248d	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 09:14:36.91	2026-09-24 09:14:36.91
cmufbflzv000jutr6w9j89r9e	msg_b_1790241276861@productscroll.local	msg_user_b_1790241276861	Message User B	scrypt:4e1ff12105eedef09969db8e8f864811:989806a19972d1b99f4d9cca650c37a97cc415d6b9f14e6e89d1652f9a7a6fff44097d8eabf6dfa1c682fc9ab8593b5c2e9655483a900f69e6542c04345e28b7	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 09:14:36.956	2026-09-24 09:14:36.956
cmufbfmey0015utr6sk0c2lo9	integration_test_1790241277456@productscroll.local	test_user_1790241277456	Test User Integration	scrypt:606c38fc7efc707d27ccf7c1ac7bb1d4:0d096688c73f475c8f9a83ebc0e0ade2d1c227cc19ded55721c29f56ccc4ad956c3601f3527d290ac0a6a23a24b51872e7e6663bb45361401a2d0f23fdbdd1c1	\N	FOUNDER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 09:14:37.499	2026-09-24 09:14:37.499
cmuffdk3s001outr66qzpwwyx	reg_1790247899584@productscroll.local	reg_1790247899584	Regular User	scrypt:6e5763954825cff6410579302a38643a:c8e3d09b8fb0b8c672d0187569f3814f09a01a3cac543b37932f26fdd64efe5cea71fd51a6c7980d691765b73edb7b0abdb1791b1d16ec437eb48378266f583b	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 11:04:59.654	2026-09-24 11:04:59.654
cmuffdk72001tutr6tki6l5gt	adm_1790247899584@productscroll.local	adm_1790247899584	Admin User	scrypt:0c87b02e6a5791629a43416b409550a1:13c2357f1d765a63e861a35ab170feeb45fdd12eea18b7a3e23ce3534803ef191d46600e4dcb04df0a737f2dcaea5e45e057eaef9dd2f20bf09a9a4ccfa75213	\N	ADMIN		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 11:04:59.774	2026-09-24 11:04:59.798
cmuffdkj40022utr6sj3iqi2f	msg_a_1790247900130@productscroll.local	msg_user_a_1790247900130	Message User A	scrypt:6b9b189279cbb218b57ba15bab4a4143:01b1af5bb04cef20dcff82ae38c5a3d1ce071b4fa54d929d091d8a0c75bb92f26f9897ce14a7d1dffb59e0a48385265ba5faf01a05bd32fd62a66df77cebe3bc	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 11:05:00.209	2026-09-24 11:05:00.209
cmuffdkl70027utr6zhspnezt	msg_b_1790247900130@productscroll.local	msg_user_b_1790247900130	Message User B	scrypt:f6ea00694083e1ab626ce9c1f2df09f0:8b86a7cae6db34f326b4c9feb8ba4b205a90773391a7547c80a3744998eb1ebfb2843efe98a79c5b00207c43e1278b88c3ca1841a9c00fd7f31c38a6fd5d9c4c	\N	USER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 11:05:00.283	2026-09-24 11:05:00.283
cmuffdkw2002hutr688wxtl56	integration_test_1790247900595@productscroll.local	test_user_1790247900595	Test User Integration	scrypt:b8cafdb4d8e10699a96774f661445846:bed7bf6858812238ea8960e4ff1a8b054dfdf6c5f38bb071a8485b82512064da63271f1d64117e30bc5828ba587cce6078039cbe513e1633579a894263487710	\N	FOUNDER		\N	\N	\N	\N	f	f	t	EVERYONE	f	\N	2026-09-24 11:05:00.674	2026-09-24 11:05:00.674
seed-user-20	yuki_tanaka@productscroll.local	yuki_tanaka	Yuki Tanaka	scrypt:323cff68184ef1fce733c0da0508fe8f:e734fbe10672d4cd7daca321df740333ec3aa6533c80bb81b419844f02d4f9d774dbf028508f19722fbc6aebf5d33626870003ef25476737e98af1e4ec931005	\N	FOUNDER	Curious about the people building what comes next.	\N	Bengaluru	\N	2026-09-23 23:31:49.85	t	f	t	EVERYONE	f	\N	2026-09-23 23:31:49.85	2026-09-24 12:09:58.153
\.


--
-- Data for Name: UserFollow; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."UserFollow" ("followerId", "followingId", accepted, "createdAt") FROM stdin;
seed-user-0	seed-user-1	t	2026-09-23 23:31:50.702
seed-user-0	seed-user-3	t	2026-09-23 23:31:50.703
seed-user-0	seed-user-4	t	2026-09-23 23:31:50.704
seed-user-1	seed-user-2	t	2026-09-23 23:31:50.705
seed-user-1	seed-user-3	t	2026-09-23 23:31:50.705
seed-user-1	seed-user-4	t	2026-09-23 23:31:50.706
seed-user-1	seed-user-5	t	2026-09-23 23:31:50.706
seed-user-2	seed-user-3	t	2026-09-23 23:31:50.707
seed-user-2	seed-user-4	t	2026-09-23 23:31:50.707
seed-user-2	seed-user-5	t	2026-09-23 23:31:50.708
seed-user-2	seed-user-6	t	2026-09-23 23:31:50.708
seed-user-3	seed-user-4	t	2026-09-23 23:31:50.709
seed-user-3	seed-user-5	t	2026-09-23 23:31:50.709
seed-user-3	seed-user-6	t	2026-09-23 23:31:50.71
seed-user-3	seed-user-7	t	2026-09-23 23:31:50.71
seed-user-4	seed-user-5	t	2026-09-23 23:31:50.711
seed-user-4	seed-user-6	t	2026-09-23 23:31:50.712
seed-user-4	seed-user-7	t	2026-09-23 23:31:50.712
seed-user-4	seed-user-8	t	2026-09-23 23:31:50.712
seed-user-5	seed-user-6	t	2026-09-23 23:31:50.713
seed-user-5	seed-user-7	t	2026-09-23 23:31:50.714
seed-user-5	seed-user-8	t	2026-09-23 23:31:50.714
seed-user-5	seed-user-9	t	2026-09-23 23:31:50.714
seed-user-6	seed-user-7	t	2026-09-23 23:31:50.715
seed-user-6	seed-user-8	t	2026-09-23 23:31:50.716
seed-user-6	seed-user-9	t	2026-09-23 23:31:50.716
seed-user-6	seed-user-10	t	2026-09-23 23:31:50.716
seed-user-7	seed-user-8	t	2026-09-23 23:31:50.717
seed-user-7	seed-user-9	t	2026-09-23 23:31:50.718
seed-user-7	seed-user-10	t	2026-09-23 23:31:50.718
seed-user-7	seed-user-11	t	2026-09-23 23:31:50.718
seed-user-8	seed-user-9	t	2026-09-23 23:31:50.719
seed-user-8	seed-user-10	t	2026-09-23 23:31:50.72
seed-user-8	seed-user-11	t	2026-09-23 23:31:50.72
seed-user-8	seed-user-12	t	2026-09-23 23:31:50.72
seed-user-9	seed-user-10	t	2026-09-23 23:31:50.721
seed-user-9	seed-user-11	t	2026-09-23 23:31:50.722
seed-user-9	seed-user-12	t	2026-09-23 23:31:50.722
seed-user-9	seed-user-13	t	2026-09-23 23:31:50.722
seed-user-10	seed-user-11	t	2026-09-23 23:31:50.723
seed-user-10	seed-user-12	t	2026-09-23 23:31:50.724
seed-user-10	seed-user-13	t	2026-09-23 23:31:50.724
seed-user-10	seed-user-14	t	2026-09-23 23:31:50.724
seed-user-11	seed-user-12	t	2026-09-23 23:31:50.725
seed-user-11	seed-user-13	t	2026-09-23 23:31:50.726
seed-user-11	seed-user-14	t	2026-09-23 23:31:50.726
seed-user-11	seed-user-15	t	2026-09-23 23:31:50.726
seed-user-12	seed-user-13	t	2026-09-23 23:31:50.728
seed-user-12	seed-user-14	t	2026-09-23 23:31:50.728
seed-user-12	seed-user-15	t	2026-09-23 23:31:50.728
seed-user-12	seed-user-16	t	2026-09-23 23:31:50.728
seed-user-13	seed-user-14	t	2026-09-23 23:31:50.73
seed-user-13	seed-user-15	t	2026-09-23 23:31:50.73
seed-user-13	seed-user-16	t	2026-09-23 23:31:50.73
seed-user-13	seed-user-17	t	2026-09-23 23:31:50.73
seed-user-14	seed-user-15	t	2026-09-23 23:31:50.732
seed-user-14	seed-user-16	t	2026-09-23 23:31:50.732
seed-user-14	seed-user-17	t	2026-09-23 23:31:50.732
seed-user-14	seed-user-18	t	2026-09-23 23:31:50.732
seed-user-15	seed-user-16	t	2026-09-23 23:31:50.734
seed-user-15	seed-user-17	t	2026-09-23 23:31:50.734
seed-user-15	seed-user-18	t	2026-09-23 23:31:50.734
seed-user-15	seed-user-19	t	2026-09-23 23:31:50.735
seed-user-16	seed-user-17	t	2026-09-23 23:31:50.736
seed-user-16	seed-user-18	t	2026-09-23 23:31:50.736
seed-user-16	seed-user-19	t	2026-09-23 23:31:50.737
seed-user-16	seed-user-20	t	2026-09-23 23:31:50.737
seed-user-17	seed-user-18	t	2026-09-23 23:31:50.738
seed-user-17	seed-user-19	t	2026-09-23 23:31:50.739
seed-user-17	seed-user-20	t	2026-09-23 23:31:50.739
seed-user-17	seed-user-21	t	2026-09-23 23:31:50.739
seed-user-18	seed-user-19	t	2026-09-23 23:31:50.74
seed-user-18	seed-user-20	t	2026-09-23 23:31:50.741
seed-user-18	seed-user-21	t	2026-09-23 23:31:50.741
seed-user-18	seed-user-22	t	2026-09-23 23:31:50.741
seed-user-19	seed-user-20	t	2026-09-23 23:31:50.743
seed-user-19	seed-user-21	t	2026-09-23 23:31:50.743
seed-user-19	seed-user-22	t	2026-09-23 23:31:50.743
seed-user-19	seed-user-23	t	2026-09-23 23:31:50.743
seed-user-20	seed-user-21	t	2026-09-23 23:31:50.745
seed-user-20	seed-user-22	t	2026-09-23 23:31:50.745
seed-user-20	seed-user-23	t	2026-09-23 23:31:50.745
seed-user-20	seed-user-24	t	2026-09-23 23:31:50.746
seed-user-21	seed-user-22	t	2026-09-23 23:31:50.747
seed-user-21	seed-user-23	t	2026-09-23 23:31:50.747
seed-user-21	seed-user-24	t	2026-09-23 23:31:50.748
seed-user-21	seed-user-25	t	2026-09-23 23:31:50.748
seed-user-22	seed-user-23	t	2026-09-23 23:31:50.749
seed-user-22	seed-user-24	t	2026-09-23 23:31:50.75
seed-user-22	seed-user-25	t	2026-09-23 23:31:50.75
seed-user-22	seed-user-26	t	2026-09-23 23:31:50.75
seed-user-23	seed-user-24	t	2026-09-23 23:31:50.752
seed-user-23	seed-user-25	t	2026-09-23 23:31:50.753
seed-user-23	seed-user-26	t	2026-09-23 23:31:50.753
seed-user-23	seed-user-27	t	2026-09-23 23:31:50.753
seed-user-24	seed-user-25	t	2026-09-23 23:31:50.755
seed-user-24	seed-user-26	t	2026-09-23 23:31:50.755
seed-user-24	seed-user-27	t	2026-09-23 23:31:50.755
seed-user-24	seed-user-28	t	2026-09-23 23:31:50.756
seed-user-25	seed-user-26	t	2026-09-23 23:31:50.757
seed-user-25	seed-user-27	t	2026-09-23 23:31:50.757
seed-user-25	seed-user-28	t	2026-09-23 23:31:50.758
seed-user-25	seed-user-29	t	2026-09-23 23:31:50.758
seed-user-26	seed-user-27	t	2026-09-23 23:31:50.759
seed-user-26	seed-user-28	t	2026-09-23 23:31:50.759
seed-user-26	seed-user-29	t	2026-09-23 23:31:50.76
seed-user-26	seed-user-0	t	2026-09-23 23:31:50.76
seed-user-27	seed-user-28	t	2026-09-23 23:31:50.761
seed-user-27	seed-user-29	t	2026-09-23 23:31:50.762
seed-user-27	seed-user-0	t	2026-09-23 23:31:50.762
seed-user-27	seed-user-1	t	2026-09-23 23:31:50.762
seed-user-28	seed-user-29	t	2026-09-23 23:31:50.764
seed-user-28	seed-user-0	t	2026-09-23 23:31:50.764
seed-user-28	seed-user-1	t	2026-09-23 23:31:50.764
seed-user-28	seed-user-2	t	2026-09-23 23:31:50.765
seed-user-29	seed-user-0	t	2026-09-23 23:31:50.766
seed-user-29	seed-user-1	t	2026-09-23 23:31:50.766
seed-user-29	seed-user-2	t	2026-09-23 23:31:50.766
seed-user-29	seed-user-3	t	2026-09-23 23:31:50.767
seed-user-0	seed-user-2	t	2026-09-24 09:22:14.952
\.


--
-- Data for Name: UserInterest; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."UserInterest" ("userId", "categoryId", affinity) FROM stdin;
seed-user-0	cmueqm5490000ut75filoydd7	1
seed-user-0	cmueqm54l0003ut75xcpqvdl7	1
seed-user-0	cmueqm54o0006ut75629casux	1
seed-user-1	cmueqm54i0001ut75c5c80zkj	1
seed-user-1	cmueqm54m0004ut75bi887tko	1
seed-user-1	cmueqm54q0007ut75bk39ipep	1
seed-user-2	cmueqm54j0002ut75gs1nf7t4	1
seed-user-2	cmueqm54n0005ut75qo7hnbfb	1
seed-user-2	cmueqm54r0008ut75dho8m2mu	1
seed-user-3	cmueqm54l0003ut75xcpqvdl7	1
seed-user-3	cmueqm54o0006ut75629casux	1
seed-user-3	cmueqm54s0009ut756vrvkek8	1
seed-user-4	cmueqm54m0004ut75bi887tko	1
seed-user-4	cmueqm54q0007ut75bk39ipep	1
seed-user-4	cmueqm54t000aut75rgl1jn6m	1
seed-user-5	cmueqm54n0005ut75qo7hnbfb	1
seed-user-5	cmueqm54r0008ut75dho8m2mu	1
seed-user-5	cmueqm54u000but756hqltjux	1
seed-user-6	cmueqm54o0006ut75629casux	1
seed-user-6	cmueqm54s0009ut756vrvkek8	1
seed-user-6	cmueqm54v000cut75mhdaozdo	1
seed-user-7	cmueqm54q0007ut75bk39ipep	1
seed-user-7	cmueqm54t000aut75rgl1jn6m	1
seed-user-7	cmueqm54w000dut756ly2znr2	1
seed-user-8	cmueqm54r0008ut75dho8m2mu	1
seed-user-8	cmueqm54u000but756hqltjux	1
seed-user-8	cmueqm54x000eut7590grcg6o	1
seed-user-9	cmueqm54s0009ut756vrvkek8	1
seed-user-9	cmueqm54v000cut75mhdaozdo	1
seed-user-9	cmueqm54y000fut75lqedis3i	1
seed-user-10	cmueqm54t000aut75rgl1jn6m	1
seed-user-10	cmueqm54w000dut756ly2znr2	1
seed-user-10	cmueqm54z000gut75flphmncn	1
seed-user-11	cmueqm54u000but756hqltjux	1
seed-user-11	cmueqm54x000eut7590grcg6o	1
seed-user-11	cmueqm550000hut75se5a1sbu	1
seed-user-12	cmueqm5490000ut75filoydd7	1
seed-user-12	cmueqm54v000cut75mhdaozdo	1
seed-user-12	cmueqm54y000fut75lqedis3i	1
seed-user-13	cmueqm54i0001ut75c5c80zkj	1
seed-user-13	cmueqm54w000dut756ly2znr2	1
seed-user-13	cmueqm54z000gut75flphmncn	1
seed-user-14	cmueqm54j0002ut75gs1nf7t4	1
seed-user-14	cmueqm54x000eut7590grcg6o	1
seed-user-14	cmueqm550000hut75se5a1sbu	1
seed-user-15	cmueqm5490000ut75filoydd7	1
seed-user-15	cmueqm54l0003ut75xcpqvdl7	1
seed-user-15	cmueqm54y000fut75lqedis3i	1
seed-user-16	cmueqm54i0001ut75c5c80zkj	1
seed-user-16	cmueqm54m0004ut75bi887tko	1
seed-user-16	cmueqm54z000gut75flphmncn	1
seed-user-17	cmueqm54j0002ut75gs1nf7t4	1
seed-user-17	cmueqm54n0005ut75qo7hnbfb	1
seed-user-17	cmueqm550000hut75se5a1sbu	1
seed-user-18	cmueqm5490000ut75filoydd7	1
seed-user-18	cmueqm54l0003ut75xcpqvdl7	1
seed-user-18	cmueqm54o0006ut75629casux	1
seed-user-19	cmueqm54i0001ut75c5c80zkj	1
seed-user-19	cmueqm54m0004ut75bi887tko	1
seed-user-19	cmueqm54q0007ut75bk39ipep	1
seed-user-20	cmueqm54j0002ut75gs1nf7t4	1
seed-user-20	cmueqm54n0005ut75qo7hnbfb	1
seed-user-20	cmueqm54r0008ut75dho8m2mu	1
seed-user-21	cmueqm54l0003ut75xcpqvdl7	1
seed-user-21	cmueqm54o0006ut75629casux	1
seed-user-21	cmueqm54s0009ut756vrvkek8	1
seed-user-22	cmueqm54m0004ut75bi887tko	1
seed-user-22	cmueqm54q0007ut75bk39ipep	1
seed-user-22	cmueqm54t000aut75rgl1jn6m	1
seed-user-23	cmueqm54n0005ut75qo7hnbfb	1
seed-user-23	cmueqm54r0008ut75dho8m2mu	1
seed-user-23	cmueqm54u000but756hqltjux	1
seed-user-24	cmueqm54o0006ut75629casux	1
seed-user-24	cmueqm54s0009ut756vrvkek8	1
seed-user-24	cmueqm54v000cut75mhdaozdo	1
seed-user-25	cmueqm54q0007ut75bk39ipep	1
seed-user-25	cmueqm54t000aut75rgl1jn6m	1
seed-user-25	cmueqm54w000dut756ly2znr2	1
seed-user-26	cmueqm54r0008ut75dho8m2mu	1
seed-user-26	cmueqm54u000but756hqltjux	1
seed-user-26	cmueqm54x000eut7590grcg6o	1
seed-user-27	cmueqm54s0009ut756vrvkek8	1
seed-user-27	cmueqm54v000cut75mhdaozdo	1
seed-user-27	cmueqm54y000fut75lqedis3i	1
seed-user-28	cmueqm54t000aut75rgl1jn6m	1
seed-user-28	cmueqm54w000dut756ly2znr2	1
seed-user-28	cmueqm54z000gut75flphmncn	1
seed-user-29	cmueqm54u000but756hqltjux	1
seed-user-29	cmueqm54x000eut7590grcg6o	1
seed-user-29	cmueqm550000hut75se5a1sbu	1
\.


--
-- Data for Name: VerificationApplication; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public."VerificationApplication" (id, "startupId", evidence, status, note, "createdAt", "reviewedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: ayushkumarsingh
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
63d90e20-0acd-4d99-9ea0-43839dd6cad7	0e6859b2d82e6e9f7a9517e55894991d77db54bc59680d1ca1ef4fa771513183	2026-09-24 04:58:41.294211+05:30	202609240001_initial	\N	\N	2026-09-24 04:58:41.181976+05:30	1
664d9aab-d32b-42dd-8b11-2a1f6621324e	5956695bd94af6f00cd3dd71456d74766e0bd25ddda64d494a31853869f656e5	2026-09-24 04:58:41.337156+05:30	202609240002_search_constraints	\N	\N	2026-09-24 04:58:41.294506+05:30	1
b5de7fb4-58df-4185-981d-9606b141468c	b45991564ddddc20b2a88b3aa56ca72dc1fa7ef1ad790d595f696b53f3fafe03	2026-09-24 17:43:32.187012+05:30	202609240003_comment_likes	\N	\N	2026-09-24 17:43:32.155751+05:30	1
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: AuthToken AuthToken_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."AuthToken"
    ADD CONSTRAINT "AuthToken_pkey" PRIMARY KEY (id);


--
-- Name: Block Block_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_pkey" PRIMARY KEY ("blockerId", "blockedId");


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: CollectionItem CollectionItem_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."CollectionItem"
    ADD CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("collectionId", "saveId");


--
-- Name: Collection Collection_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Collection"
    ADD CONSTRAINT "Collection_pkey" PRIMARY KEY (id);


--
-- Name: CommentLike CommentLike_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."CommentLike"
    ADD CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("userId", "commentId");


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: ConversationMember ConversationMember_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."ConversationMember"
    ADD CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("conversationId", "userId");


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: EngagementEvent EngagementEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."EngagementEvent"
    ADD CONSTRAINT "EngagementEvent_pkey" PRIMARY KEY (id);


--
-- Name: FeatureFlag FeatureFlag_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."FeatureFlag"
    ADD CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY (key);


--
-- Name: FeedImpression FeedImpression_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."FeedImpression"
    ADD CONSTRAINT "FeedImpression_pkey" PRIMARY KEY (id);


--
-- Name: JobFailure JobFailure_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."JobFailure"
    ADD CONSTRAINT "JobFailure_pkey" PRIMARY KEY (id);


--
-- Name: Like Like_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_pkey" PRIMARY KEY ("userId", "postId");


--
-- Name: MediaAsset MediaAsset_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MediaAsset"
    ADD CONSTRAINT "MediaAsset_pkey" PRIMARY KEY (id);


--
-- Name: MessageHidden MessageHidden_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MessageHidden"
    ADD CONSTRAINT "MessageHidden_pkey" PRIMARY KEY ("messageId", "userId");


--
-- Name: MessageMedia MessageMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MessageMedia"
    ADD CONSTRAINT "MessageMedia_pkey" PRIMARY KEY ("messageId", "mediaId");


--
-- Name: MessageRead MessageRead_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MessageRead"
    ADD CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("messageId", "userId");


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: ModerationAction ModerationAction_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."ModerationAction"
    ADD CONSTRAINT "ModerationAction_pkey" PRIMARY KEY (id);


--
-- Name: Mute Mute_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Mute"
    ADD CONSTRAINT "Mute_pkey" PRIMARY KEY ("muterId", "mutedId");


--
-- Name: NotificationPreference NotificationPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId");


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: PostMedia PostMedia_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."PostMedia"
    ADD CONSTRAINT "PostMedia_pkey" PRIMARY KEY ("postId", "mediaId");


--
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- Name: ProductFollow ProductFollow_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."ProductFollow"
    ADD CONSTRAINT "ProductFollow_pkey" PRIMARY KEY ("userId", "productId");


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: RankingConfig RankingConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."RankingConfig"
    ADD CONSTRAINT "RankingConfig_pkey" PRIMARY KEY (key);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: Save Save_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Save"
    ADD CONSTRAINT "Save_pkey" PRIMARY KEY (id);


--
-- Name: SearchHistory SearchHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."SearchHistory"
    ADD CONSTRAINT "SearchHistory_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: StartupFollow StartupFollow_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."StartupFollow"
    ADD CONSTRAINT "StartupFollow_pkey" PRIMARY KEY ("userId", "startupId");


--
-- Name: StartupMember StartupMember_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."StartupMember"
    ADD CONSTRAINT "StartupMember_pkey" PRIMARY KEY ("startupId", "userId");


--
-- Name: Startup Startup_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Startup"
    ADD CONSTRAINT "Startup_pkey" PRIMARY KEY (id);


--
-- Name: UserFollow UserFollow_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."UserFollow"
    ADD CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("followerId", "followingId");


--
-- Name: UserInterest UserInterest_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."UserInterest"
    ADD CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("userId", "categoryId");


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: VerificationApplication VerificationApplication_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."VerificationApplication"
    ADD CONSTRAINT "VerificationApplication_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuthToken_tokenHash_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "AuthToken_tokenHash_key" ON public."AuthToken" USING btree ("tokenHash");


--
-- Name: AuthToken_userId_purpose_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "AuthToken_userId_purpose_idx" ON public."AuthToken" USING btree ("userId", purpose);


--
-- Name: Block_blockedId_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Block_blockedId_idx" ON public."Block" USING btree ("blockedId");


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: Collection_userId_name_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Collection_userId_name_key" ON public."Collection" USING btree ("userId", name);


--
-- Name: CommentLike_commentId_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "CommentLike_commentId_idx" ON public."CommentLike" USING btree ("commentId");


--
-- Name: Comment_postId_createdAt_id_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Comment_postId_createdAt_id_idx" ON public."Comment" USING btree ("postId", "createdAt", id);


--
-- Name: ConversationMember_userId_conversationId_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "ConversationMember_userId_conversationId_idx" ON public."ConversationMember" USING btree ("userId", "conversationId");


--
-- Name: Conversation_directKey_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Conversation_directKey_key" ON public."Conversation" USING btree ("directKey");


--
-- Name: EngagementEvent_postId_type_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "EngagementEvent_postId_type_createdAt_idx" ON public."EngagementEvent" USING btree ("postId", type, "createdAt");


--
-- Name: EngagementEvent_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "EngagementEvent_userId_createdAt_idx" ON public."EngagementEvent" USING btree ("userId", "createdAt");


--
-- Name: FeedImpression_userId_postId_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "FeedImpression_userId_postId_createdAt_idx" ON public."FeedImpression" USING btree ("userId", "postId", "createdAt");


--
-- Name: JobFailure_queue_jobId_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "JobFailure_queue_jobId_key" ON public."JobFailure" USING btree (queue, "jobId");


--
-- Name: Like_postId_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Like_postId_idx" ON public."Like" USING btree ("postId");


--
-- Name: MediaAsset_processingStatus_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "MediaAsset_processingStatus_createdAt_idx" ON public."MediaAsset" USING btree ("processingStatus", "createdAt");


--
-- Name: MediaAsset_storageKey_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON public."MediaAsset" USING btree ("storageKey");


--
-- Name: Message_conversationId_createdAt_id_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Message_conversationId_createdAt_id_idx" ON public."Message" USING btree ("conversationId", "createdAt", id);


--
-- Name: Notification_userId_createdAt_id_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Notification_userId_createdAt_id_idx" ON public."Notification" USING btree ("userId", "createdAt", id);


--
-- Name: Notification_userId_groupKey_readAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Notification_userId_groupKey_readAt_idx" ON public."Notification" USING btree ("userId", "groupKey", "readAt");


--
-- Name: PostMedia_postId_position_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "PostMedia_postId_position_key" ON public."PostMedia" USING btree ("postId", "position");


--
-- Name: Post_authorId_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Post_authorId_createdAt_idx" ON public."Post" USING btree ("authorId", "createdAt");


--
-- Name: Post_createdAt_id_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Post_createdAt_id_idx" ON public."Post" USING btree ("createdAt", id);


--
-- Name: Post_kind_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Post_kind_createdAt_idx" ON public."Post" USING btree (kind, "createdAt");


--
-- Name: Post_startupId_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Post_startupId_createdAt_idx" ON public."Post" USING btree ("startupId", "createdAt");


--
-- Name: ProductFollow_productId_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "ProductFollow_productId_idx" ON public."ProductFollow" USING btree ("productId");


--
-- Name: Product_category_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Product_category_createdAt_idx" ON public."Product" USING btree (category, "createdAt");


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Product_slug_key" ON public."Product" USING btree (slug);


--
-- Name: Report_status_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Report_status_createdAt_idx" ON public."Report" USING btree (status, "createdAt");


--
-- Name: Save_postId_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Save_postId_idx" ON public."Save" USING btree ("postId");


--
-- Name: Save_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Save_userId_createdAt_idx" ON public."Save" USING btree ("userId", "createdAt");


--
-- Name: Save_userId_postId_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Save_userId_postId_key" ON public."Save" USING btree ("userId", "postId");


--
-- Name: Save_userId_productId_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Save_userId_productId_key" ON public."Save" USING btree ("userId", "productId");


--
-- Name: Save_userId_startupId_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Save_userId_startupId_key" ON public."Save" USING btree ("userId", "startupId");


--
-- Name: SearchHistory_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "SearchHistory_userId_createdAt_idx" ON public."SearchHistory" USING btree ("userId", "createdAt");


--
-- Name: SearchHistory_userId_query_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "SearchHistory_userId_query_key" ON public."SearchHistory" USING btree ("userId", query);


--
-- Name: Session_refreshHash_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Session_refreshHash_key" ON public."Session" USING btree ("refreshHash");


--
-- Name: Session_tokenHash_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Session_tokenHash_key" ON public."Session" USING btree ("tokenHash");


--
-- Name: Session_userId_revokedAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Session_userId_revokedAt_idx" ON public."Session" USING btree ("userId", "revokedAt");


--
-- Name: StartupFollow_startupId_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "StartupFollow_startupId_createdAt_idx" ON public."StartupFollow" USING btree ("startupId", "createdAt");


--
-- Name: Startup_category_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "Startup_category_createdAt_idx" ON public."Startup" USING btree (category, "createdAt");


--
-- Name: Startup_slug_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "Startup_slug_key" ON public."Startup" USING btree (slug);


--
-- Name: UserFollow_followingId_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "UserFollow_followingId_idx" ON public."UserFollow" USING btree ("followingId");


--
-- Name: User_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "User_createdAt_idx" ON public."User" USING btree ("createdAt");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_googleId_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: VerificationApplication_status_createdAt_idx; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX "VerificationApplication_status_createdAt_idx" ON public."VerificationApplication" USING btree (status, "createdAt");


--
-- Name: product_name_trigram; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX product_name_trigram ON public."Product" USING gin (name public.gin_trgm_ops);


--
-- Name: product_search; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX product_search ON public."Product" USING gin (to_tsvector('english'::regconfig, ((((name || ' '::text) || description) || ' '::text) || category)));


--
-- Name: startup_name_trigram; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX startup_name_trigram ON public."Startup" USING gin (name public.gin_trgm_ops);


--
-- Name: startup_search; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX startup_search ON public."Startup" USING gin (to_tsvector('english'::regconfig, ((((name || ' '::text) || pitch) || ' '::text) || category)));


--
-- Name: user_search; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX user_search ON public."User" USING gin (to_tsvector('simple'::regconfig, ((username || ' '::text) || "displayName")));


--
-- Name: username_trigram; Type: INDEX; Schema: public; Owner: ayushkumarsingh
--

CREATE INDEX username_trigram ON public."User" USING gin (username public.gin_trgm_ops);


--
-- Name: AuditLog AuditLog_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuthToken AuthToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."AuthToken"
    ADD CONSTRAINT "AuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Block Block_blockedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Block Block_blockerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Block"
    ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CollectionItem CollectionItem_collectionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."CollectionItem"
    ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES public."Collection"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CollectionItem CollectionItem_saveId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."CollectionItem"
    ADD CONSTRAINT "CollectionItem_saveId_fkey" FOREIGN KEY ("saveId") REFERENCES public."Save"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Collection Collection_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Collection"
    ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommentLike CommentLike_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."CommentLike"
    ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public."Comment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommentLike CommentLike_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."CommentLike"
    ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Comment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationMember ConversationMember_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."ConversationMember"
    ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationMember ConversationMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."ConversationMember"
    ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EngagementEvent EngagementEvent_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."EngagementEvent"
    ADD CONSTRAINT "EngagementEvent_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EngagementEvent EngagementEvent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."EngagementEvent"
    ADD CONSTRAINT "EngagementEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FeedImpression FeedImpression_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."FeedImpression"
    ADD CONSTRAINT "FeedImpression_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FeedImpression FeedImpression_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."FeedImpression"
    ADD CONSTRAINT "FeedImpression_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Like Like_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Like Like_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Like"
    ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MediaAsset MediaAsset_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MediaAsset"
    ADD CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageHidden MessageHidden_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MessageHidden"
    ADD CONSTRAINT "MessageHidden_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageHidden MessageHidden_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MessageHidden"
    ADD CONSTRAINT "MessageHidden_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageMedia MessageMedia_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MessageMedia"
    ADD CONSTRAINT "MessageMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."MediaAsset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageMedia MessageMedia_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MessageMedia"
    ADD CONSTRAINT "MessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageRead MessageRead_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MessageRead"
    ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageRead MessageRead_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."MessageRead"
    ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_replyToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_sharedPostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_sharedPostId_fkey" FOREIGN KEY ("sharedPostId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ModerationAction ModerationAction_moderatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."ModerationAction"
    ADD CONSTRAINT "ModerationAction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ModerationAction ModerationAction_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."ModerationAction"
    ADD CONSTRAINT "ModerationAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public."Report"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mute Mute_mutedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Mute"
    ADD CONSTRAINT "Mute_mutedId_fkey" FOREIGN KEY ("mutedId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mute Mute_muterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Mute"
    ADD CONSTRAINT "Mute_muterId_fkey" FOREIGN KEY ("muterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: NotificationPreference NotificationPreference_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."NotificationPreference"
    ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PostMedia PostMedia_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."PostMedia"
    ADD CONSTRAINT "PostMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."MediaAsset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PostMedia PostMedia_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."PostMedia"
    ADD CONSTRAINT "PostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Post Post_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Post Post_startupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES public."Startup"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductFollow ProductFollow_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."ProductFollow"
    ADD CONSTRAINT "ProductFollow_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductFollow ProductFollow_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."ProductFollow"
    ADD CONSTRAINT "ProductFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_startupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES public."Startup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Report Report_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Report Report_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Report Report_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Save Save_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Save"
    ADD CONSTRAINT "Save_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Save Save_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Save"
    ADD CONSTRAINT "Save_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Save Save_startupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Save"
    ADD CONSTRAINT "Save_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES public."Startup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Save Save_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Save"
    ADD CONSTRAINT "Save_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SearchHistory SearchHistory_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."SearchHistory"
    ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StartupFollow StartupFollow_startupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."StartupFollow"
    ADD CONSTRAINT "StartupFollow_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES public."Startup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StartupFollow StartupFollow_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."StartupFollow"
    ADD CONSTRAINT "StartupFollow_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StartupMember StartupMember_startupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."StartupMember"
    ADD CONSTRAINT "StartupMember_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES public."Startup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StartupMember StartupMember_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."StartupMember"
    ADD CONSTRAINT "StartupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Startup Startup_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."Startup"
    ADD CONSTRAINT "Startup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserFollow UserFollow_followerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."UserFollow"
    ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserFollow UserFollow_followingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."UserFollow"
    ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserInterest UserInterest_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."UserInterest"
    ADD CONSTRAINT "UserInterest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserInterest UserInterest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."UserInterest"
    ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VerificationApplication VerificationApplication_startupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ayushkumarsingh
--

ALTER TABLE ONLY public."VerificationApplication"
    ADD CONSTRAINT "VerificationApplication_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES public."Startup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict d5gIN9mMolfMzEUaOiZX0WAfmGQx0Rl9CccBsYkpUnuwDVM2RdUGpoGnUKBMtU6

