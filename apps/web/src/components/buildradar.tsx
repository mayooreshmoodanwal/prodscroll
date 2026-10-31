"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  Compass,
  Radar,
  ArrowUpRight,
  MessageCircle,
  RefreshCw,
  Cpu,
  Layers,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Search,
} from "lucide-react";
import { api, mutate } from "../lib/api";
import { useApp } from "../lib/context";
import { useResource } from "../lib/hooks";
import type { BuildRadarOverviewDTO } from "@productscroll/types";
import { Avatar, Verified, Loading, ErrorState, Empty, PageHeading } from "./ui";

export function BuildRadarPage() {
  const { user, setAuthOpen } = useApp();
  const { data, loading, error, load } =
    useResource<BuildRadarOverviewDTO>("/buildradar/overview");
  const [activeTab, setActiveTab] = useState<
    "for-you" | "collaborators" | "projects" | "radar"
  >("for-you");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState("");

  const handleAnalyze = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setAnalyzing(true);
    setAnalyzeMsg("");
    try {
      const res = await mutate<{ message: string }>("/buildradar/analyze", {});
      setAnalyzeMsg(res.message || "Build DNA successfully extracted!");
      await load();
    } catch (err) {
      setAnalyzeMsg(
        err instanceof Error ? err.message : "Failed to analyze Build DNA.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <Loading cards={3} />;
  if (error) return <ErrorState error={error} retry={load} />;

  const stats = data?.stats;
  const myDna = data?.myBuildDna;

  return (
    <div className="buildradar-page">
      <PageHeading
        eyebrow="BUILDRADAR · GEMMA 4 INTELLIGENCE"
        title="BuildRadar"
        description="Discover the people, projects, and collaboration opportunities you didn’t know you were looking for."
        action={
          <button
            className="button primary"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            <RefreshCw size={15} className={analyzing ? "spin" : ""} />
            {analyzing ? "Analyzing DNA..." : "Analyze My Build DNA"}
          </button>
        }
      />

      {/* AI Engine Status Banner */}
      <div className="radar-status-banner">
        <div className="status-indicator">
          <span
            className={`status-dot ${stats?.aiStatus === "online" ? "online" : "heuristic"}`}
          />
          <span className="status-label">
            <strong>Engine:</strong> {stats?.aiModel || "Gemma 4"}{" "}
            {stats?.aiStatus === "online" ? (
              <span className="badge-online">Connected</span>
            ) : (
              <span className="badge-heuristic">Heuristic Fallback Active</span>
            )}
          </span>
        </div>
        <div className="stats-pills">
          <span className="stat-pill">
            <Users size={14} />
            <strong>{stats?.analyzedBuildersCount || 0}</strong> Builders Analyzed
          </span>
          <span className="stat-pill">
            <Sparkles size={14} />
            <strong>{stats?.collaborationOpportunitiesCount || 0}</strong> Matches
          </span>
        </div>
      </div>

      {analyzeMsg && (
        <div className="radar-toast">
          <CheckCircle2 size={16} />
          <span>{analyzeMsg}</span>
        </div>
      )}

      {/* Current User Build DNA Summary */}
      {user && myDna && (
        <div className="my-dna-card">
          <div className="dna-header">
            <div className="dna-title">
              <Cpu size={18} />
              <h3>Your Extracted Build DNA</h3>
              <span className="stage-badge">{myDna.projectStage} Stage</span>
            </div>
            {myDna.collaborationInterest && (
              <span className="collab-badge">
                <Users size={13} /> Open to Collaborations
              </span>
            )}
          </div>
          <div className="dna-grid">
            <div className="dna-col">
              <span className="dna-label">Domains & Interests</span>
              <div className="dna-tags">
                {myDna.projectDomains.map((d) => (
                  <span className="dna-tag domain" key={d}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div className="dna-col">
              <span className="dna-label">Tech Stack</span>
              <div className="dna-tags">
                {myDna.technologies.map((t) => (
                  <span className="dna-tag tech" key={t}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="dna-col">
              <span className="dna-label">Skills Offered</span>
              <div className="dna-tags">
                {myDna.skillsOffered.map((s) => (
                  <span className="dna-tag offered" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {myDna.skillsNeeded.length > 0 && (
              <div className="dna-col">
                <span className="dna-label">Skills Needed / Blockers</span>
                <div className="dna-tags">
                  {myDna.skillsNeeded.map((n) => (
                    <span className="dna-tag needed" key={n}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!user && (
        <div className="radar-cta-box">
          <Radar size={28} />
          <div>
            <h4>Activate Personalized BuildRadar Discovery</h4>
            <p>
              Sign in to let Gemma analyze your public builds and automatically
              connect with builders whose skills complement your blockers.
            </p>
          </div>
          <button
            className="button primary"
            onClick={() => setAuthOpen(true)}
          >
            Sign in to Connect
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="radar-tabs">
        <button
          className={`radar-tab ${activeTab === "for-you" ? "active" : ""}`}
          onClick={() => setActiveTab("for-you")}
        >
          <Sparkles size={16} />
          For You
        </button>
        <button
          className={`radar-tab ${activeTab === "collaborators" ? "active" : ""}`}
          onClick={() => setActiveTab("collaborators")}
        >
          <Users size={16} />
          Find Collaborators ({data?.collaborators?.length || 0})
        </button>
        <button
          className={`radar-tab ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <Compass size={16} />
          Project Discovery ({data?.projectRecommendations?.length || 0})
        </button>
        <button
          className={`radar-tab ${activeTab === "radar" ? "active" : ""}`}
          onClick={() => setActiveTab("radar")}
        >
          <Radar size={16} />
          Opportunity Radar ({data?.opportunityRadar?.length || 0})
        </button>
      </div>

      {/* TAB 1: FOR YOU */}
      {activeTab === "for-you" && (
        <div className="radar-content-list">
          <div className="section-intro">
            <h3>Personalized Recommendations</h3>
            <p className="muted">
              Ranked deterministically by skill complementarity (30%), project domain (20%), collaboration readiness (20%), and stack compatibility.
            </p>
          </div>

          {data?.forYou && data.forYou.length > 0 ? (
            <div className="rec-cards-grid">
              {data.forYou.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          ) : (
            <Empty
              title="No recommendations yet"
              description="Post a project or update your bio, then click 'Analyze My Build DNA'."
              action={
                <button className="button secondary" onClick={handleAnalyze}>
                  Analyze My Content
                </button>
              }
            />
          )}
        </div>
      )}

      {/* TAB 2: FIND COLLABORATORS */}
      {activeTab === "collaborators" && (
        <div className="radar-content-list">
          <div className="section-intro">
            <h3>Complementary Ability Matching</h3>
            <p className="muted">
              Builders whose capabilities address your needs, or whose technical blockers match your offered skills.
            </p>
          </div>

          {data?.collaborators && data.collaborators.length > 0 ? (
            <div className="rec-cards-grid">
              {data.collaborators.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} />
              ))}
            </div>
          ) : (
            <Empty
              title="No complementary collaborators found"
              description="Make sure your posts mention technologies you need help with (e.g. 'struggling with database indexing')."
            />
          )}
        </div>
      )}

      {/* TAB 3: PROJECT DISCOVERY */}
      {activeTab === "projects" && (
        <div className="radar-content-list">
          <div className="section-intro">
            <h3>Projects Relevant to Your Stack</h3>
            <p className="muted">
              Active open-source codebases and startup projects matching your technical background and interests.
            </p>
          </div>

          <div className="project-recs-grid">
            {data?.projectRecommendations.map((item) => (
              <div className="project-rec-card" key={item.post.id}>
                <div className="project-rec-header">
                  <div className="project-author">
                    <Avatar
                      name={item.post.author.displayName}
                      url={item.post.author.avatarUrl || undefined}
                      size={32}
                    />
                    <div>
                      <Link
                        href={`/@${item.post.author.username}`}
                        className="author-name"
                      >
                        {item.post.author.displayName}
                      </Link>
                      <small className="muted">
                        @{item.post.author.username}
                      </small>
                    </div>
                  </div>
                  <span className="relevance-score">
                    {item.relevanceScore}% Fit
                  </span>
                </div>

                <p className="project-caption">{item.post.caption}</p>

                <div className="project-reason-box">
                  <Sparkles size={14} />
                  <span>{item.reason}</span>
                </div>

                <div className="project-card-footer">
                  <div className="matching-tags">
                    {item.matchingSkills.map((s) => (
                      <span className="tag-pill" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/post/${item.post.id}`}
                    className="button small secondary"
                  >
                    View Project <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: OPPORTUNITY RADAR */}
      {activeTab === "radar" && (
        <div className="radar-content-list">
          <div className="section-intro">
            <h3>Opportunity Radar</h3>
            <p className="muted">
              High-conviction collaboration opportunities with full supporting evidence and source references.
            </p>
          </div>

          {data?.opportunityRadar && data.opportunityRadar.length > 0 ? (
            <div className="rec-cards-grid">
              {data.opportunityRadar.map((rec) => (
                <RecommendationCard key={rec.id} rec={rec} highPriority />
              ))}
            </div>
          ) : (
            <Empty
              title="Radar scanning..."
              description="High-conviction opportunities will appear here once builders post complementary needs."
            />
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  highPriority = false,
}: {
  rec: import("@productscroll/types").BuilderRecommendationDTO;
  highPriority?: boolean;
}) {
  const b = rec.suggestedBuilder;
  const isComplementary = rec.category === "COMPLEMENTARY";

  return (
    <div className={`rec-card ${highPriority ? "high-priority" : ""}`}>
      <div className="rec-card-top">
        <div className="builder-info">
          <Avatar name={b.displayName} url={b.avatarUrl || undefined} size={44} />
          <div>
            <div className="name-row">
              <Link href={`/@${b.username}`} className="builder-name">
                <strong>{b.displayName}</strong>
              </Link>
              {b.verified && <Verified />}
              <span className="role-tag">{b.role}</span>
            </div>
            <span className="builder-handle">@{b.username}</span>
          </div>
        </div>

        <div className="score-block">
          <span className="score-num">{rec.score}%</span>
          <span
            className={`category-badge ${isComplementary ? "comp" : "sim"}`}
          >
            {isComplementary ? "Complementary" : "Similarity"}
          </span>
        </div>
      </div>

      {b.bio && <p className="builder-bio">{b.bio}</p>}

      {/* Why This Match */}
      <div className="match-explanation">
        <Sparkles size={15} />
        <div>
          <strong>Why this match:</strong> {rec.explanation}
        </div>
      </div>

      {/* Complementary & Matching Skills */}
      <div className="skills-overview">
        {rec.complementarySkills.length > 0 && (
          <div className="skill-line">
            <span className="skill-label">Complementary:</span>
            <div className="skill-tags">
              {rec.complementarySkills.map((s) => (
                <span className="tag-pill comp" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
        {rec.matchingSkills.length > 0 && (
          <div className="skill-line">
            <span className="skill-label">Shared Tech:</span>
            <div className="skill-tags">
              {rec.matchingSkills.map((s) => (
                <span className="tag-pill match" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Relevant Project Snippet */}
      {rec.relevantProjects.length > 0 && (
        <div className="relevant-project-box">
          <div className="proj-title">
            <Layers size={13} />
            <span>Active Project: {rec.relevantProjects[0].title}</span>
          </div>
          <p className="proj-caption">{rec.relevantProjects[0].caption}</p>
        </div>
      )}

      {/* Actions */}
      <div className="rec-card-actions">
        <Link href={`/@${b.username}`} className="button secondary">
          View Profile
        </Link>
        <Link href={`/messages`} className="button primary">
          <MessageCircle size={15} />
          Connect & Message
        </Link>
      </div>
    </div>
  );
}

