"use client";
import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Globe,
  Compass,
  Bookmark,
  Briefcase,
  PieChart,
  HelpCircle,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  Search,
  Filter,
  Layers,
  Coins,
  ShieldAlert,
  Info,
  Calendar,
  Building2,
  ExternalLink as ExtIcon,
} from "lucide-react";
import { api, mutate } from "../lib/api";
import { useApp } from "../lib/context";
import { useResource } from "../lib/hooks";
import type {
  DemoStartupDTO,
  SimulatedPortfolioDTO,
  MarketEvaluationDTO,
} from "@productscroll/types";
import { Avatar, PageHeading, Loading, ErrorState, Empty, Modal } from "./ui";

export function InvestPage() {
  const { user, setAuthOpen } = useApp();
  const [activeTab, setActiveTab] = useState<
    "overview" | "discover" | "watchlist" | "portfolio" | "markets" | "how-it-works"
  >("overview");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStartupSlug, setActiveStartupSlug] = useState<string | null>(null);

  // Overview data
  const {
    data: overviewData,
    loading: overviewLoading,
    error: overviewError,
    load: reloadOverview,
  } = useResource<{
    disclaimer: string;
    featured: DemoStartupDTO[];
    recent: DemoStartupDTO[];
    markets: MarketEvaluationDTO[];
    portfolioSummary: SimulatedPortfolioDTO | null;
  }>("/invest/overview");

  // Filtered startups data
  const startupsPath = `/invest/startups?${selectedCountry !== "ALL" ? `countryCode=${selectedCountry}&` : ""}${selectedIndustry !== "ALL" ? `industry=${encodeURIComponent(selectedIndustry)}&` : ""}${searchQuery ? `search=${encodeURIComponent(searchQuery)}` : ""}`;
  const {
    data: startupsData,
    loading: startupsLoading,
    load: reloadStartups,
  } = useResource<{
    disclaimer: string;
    startups: DemoStartupDTO[];
    total: number;
  }>(activeTab === "discover" ? startupsPath : null);

  // Watchlist data
  const {
    data: watchlistData,
    loading: watchlistLoading,
    load: reloadWatchlist,
  } = useResource<{
    disclaimer: string;
    watchlist: DemoStartupDTO[];
  }>(activeTab === "watchlist" && user ? "/invest/watchlist" : null);

  // Portfolio data
  const {
    data: portfolioData,
    loading: portfolioLoading,
    load: reloadPortfolio,
  } = useResource<{
    disclaimer: string;
    portfolio: SimulatedPortfolioDTO;
  }>(activeTab === "portfolio" && user ? "/invest/portfolio" : null);

  // Selected startup details
  const {
    data: startupDetailData,
    loading: detailLoading,
    load: reloadDetail,
  } = useResource<{
    disclaimer: string;
    startup: DemoStartupDTO;
    simulatedPosition: import("@productscroll/types").SimulatedPositionDTO | null;
    marketEvaluation: MarketEvaluationDTO | null;
  }>(activeStartupSlug ? `/invest/startups/${activeStartupSlug}` : null);

  // Simulation modal state
  const [simModalStartup, setSimModalStartup] = useState<DemoStartupDTO | null>(null);
  const [hypotheticalAmount, setHypotheticalAmount] = useState<number>(500);
  const [simConfirmOpen, setSimConfirmOpen] = useState(false);
  const [simSubmitting, setSimSubmitting] = useState(false);
  const [simSuccessMsg, setSimSuccessMsg] = useState("");

  const handleOpenSim = (startup: DemoStartupDTO) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSimModalStartup(startup);
    setHypotheticalAmount(startup.demoMinTicket || 250);
    setSimSuccessMsg("");
  };

  const handleToggleWatchlist = async (startupId: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    try {
      await mutate(`/invest/startups/${startupId}/watchlist`, {});
      if (activeTab === "discover") void reloadStartups();
      if (activeTab === "watchlist") void reloadWatchlist();
      if (activeStartupSlug) void reloadDetail();
      void reloadOverview();
    } catch (err) {
      console.error("Watchlist error:", err);
    }
  };

  const handleConfirmSimulation = async () => {
    if (!simModalStartup) return;
    setSimSubmitting(true);
    try {
      const res = await mutate<{ message: string }>("/invest/simulate", {
        startupId: simModalStartup.id,
        hypotheticalAmount: Number(hypotheticalAmount),
      });
      setSimSuccessMsg(res.message);
      setSimConfirmOpen(false);
      setSimModalStartup(null);
      void reloadOverview();
      if (activeTab === "portfolio") void reloadPortfolio();
      if (activeStartupSlug) void reloadDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Simulation failed.");
    } finally {
      setSimSubmitting(false);
    }
  };

  const handleRemovePosition = async (positionId: string) => {
    if (!confirm("Are you sure you want to remove this simulated position?")) return;
    try {
      await api(`/invest/positions/${positionId}`, { method: "DELETE" });
      void reloadPortfolio();
      void reloadOverview();
    } catch (err) {
      alert("Failed to remove position.");
    }
  };

  return (
    <div className="invest-page">
      {/* PERSISTENT CRITICAL DISCLAIMER BANNER */}
      <div className="prototype-persistent-banner" role="alert">
        <ShieldAlert size={20} />
        <div>
          <strong>PROTOTYPE MODE — No real investments or transactions are available.</strong>
          <p>
            ProductScroll Invest is an interactive educational simulation. It does not facilitate real investments, process payments, or offer securities.
          </p>
        </div>
      </div>

      <PageHeading
        eyebrow="PRODUCTSCROLL INVEST · FUTURE EXPLORATION"
        title="Invest"
        description="Discover early-stage startups. Explore investment opportunities. Participate in the future of entrepreneurship."
      />

      {simSuccessMsg && (
        <div className="invest-toast">
          <CheckCircle2 size={16} />
          <span>{simSuccessMsg}</span>
        </div>
      )}

      {/* Invest Section Navigation */}
      <nav className="invest-subnav" aria-label="Invest navigation">
        <button
          className={`subnav-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("overview");
            setActiveStartupSlug(null);
          }}
        >
          <TrendingUp size={16} />
          Overview
        </button>
        <button
          className={`subnav-item ${activeTab === "discover" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("discover");
            setActiveStartupSlug(null);
          }}
        >
          <Compass size={16} />
          Discover Startups
        </button>
        <button
          className={`subnav-item ${activeTab === "watchlist" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("watchlist");
            setActiveStartupSlug(null);
          }}
        >
          <Bookmark size={16} />
          Watchlist
        </button>
        <button
          className={`subnav-item ${activeTab === "portfolio" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("portfolio");
            setActiveStartupSlug(null);
          }}
        >
          <PieChart size={16} />
          Portfolio Simulator
        </button>
        <button
          className={`subnav-item ${activeTab === "markets" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("markets");
            setActiveStartupSlug(null);
          }}
        >
          <Globe size={16} />
          Markets Under Evaluation
        </button>
        <button
          className={`subnav-item ${activeTab === "how-it-works" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("how-it-works");
            setActiveStartupSlug(null);
          }}
        >
          <HelpCircle size={16} />
          How It Works
        </button>
      </nav>

      {/* STARTUP DETAIL MODAL / VIEW */}
      {activeStartupSlug && startupDetailData && (
        <div className="startup-detail-view">
          <button
            className="button secondary small back-btn"
            onClick={() => setActiveStartupSlug(null)}
          >
            ← Back to Startups
          </button>

          <div className="startup-detail-hero">
            <div className="startup-hero-left">
              <span className="demo-tag">DEMO LISTING</span>
              <h2>{startupDetailData.startup.name}</h2>
              <p className="startup-pitch">{startupDetailData.startup.tagline}</p>
              <div className="badge-row">
                <span className="badge country">
                  {startupDetailData.startup.country} ({startupDetailData.startup.currency})
                </span>
                <span className="badge industry">
                  {startupDetailData.startup.industry}
                </span>
                <span className="badge stage">{startupDetailData.startup.stage}</span>
              </div>
            </div>

            <div className="startup-hero-actions">
              <button
                className={`button ${startupDetailData.startup.isWatchlisted ? "primary" : "secondary"}`}
                onClick={() => handleToggleWatchlist(startupDetailData.startup.id)}
              >
                <Bookmark size={15} />
                {startupDetailData.startup.isWatchlisted
                  ? "Saved in Watchlist"
                  : "Add to Watchlist"}
              </button>
              <button
                className="button primary simulate-cta"
                onClick={() => handleOpenSim(startupDetailData.startup)}
              >
                <Coins size={16} />
                Simulate Allocation
              </button>
            </div>
          </div>

          <div className="detail-columns">
            <div className="detail-main">
              <section className="detail-section">
                <h3>About the Company</h3>
                <p>{startupDetailData.startup.description}</p>
              </section>

              <section className="detail-section">
                <h3>Founder & Team</h3>
                <div className="founder-box">
                  <Avatar name={startupDetailData.startup.founderName} size={42} />
                  <div>
                    <strong>{startupDetailData.startup.founderName}</strong>
                    <p className="muted">{startupDetailData.startup.founderBio}</p>
                  </div>
                </div>
              </section>

              <section className="detail-section">
                <h3>Business Model & Target Market</h3>
                <p>
                  <strong>Business Model:</strong> {startupDetailData.startup.businessModel}
                </p>
                <p>
                  <strong>Target Market:</strong> {startupDetailData.startup.targetMarket}
                </p>
              </section>

              <section className="detail-section">
                <h3>Technology Stack</h3>
                <div className="tech-tags">
                  {startupDetailData.startup.technologies.map((t) => (
                    <span className="tech-pill" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </section>

              {/* Updates timeline */}
              {startupDetailData.startup.updates && startupDetailData.startup.updates.length > 0 && (
                <section className="detail-section">
                  <h3>Demonstration Updates Timeline</h3>
                  <div className="updates-timeline">
                    {startupDetailData.startup.updates.map((u) => (
                      <div className="timeline-item" key={u.id}>
                        <div className="timeline-dot" />
                        <div className="timeline-content">
                          <span className="timeline-type">{u.updateType}</span>
                          <h4>{u.title}</h4>
                          <p>{u.body}</p>
                          <small className="muted">
                            {new Date(u.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right side: Demo Funding & Simulation Card */}
            <aside className="detail-sidebar">
              <div className="funding-card">
                <span className="fictional-notice">FICTIONAL DEMO FIGURES</span>
                <h3>Illustrative Funding Round</h3>

                <div className="funding-progress-block">
                  <div className="funding-numbers">
                    <span>
                      <strong>
                        {startupDetailData.startup.currencySymbol}
                        {startupDetailData.startup.demoRaisedAmount.toLocaleString()}
                      </strong>{" "}
                      raised
                    </span>
                    <span className="muted">
                      Goal: {startupDetailData.startup.currencySymbol}
                      {startupDetailData.startup.demoTargetAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(100, Math.round((startupDetailData.startup.demoRaisedAmount / startupDetailData.startup.demoTargetAmount) * 100))}%`,
                      }}
                    />
                  </div>
                  <small className="muted progress-percent">
                    {Math.round(
                      (startupDetailData.startup.demoRaisedAmount /
                        startupDetailData.startup.demoTargetAmount) *
                        100,
                    )}
                    % simulated progress
                  </small>
                </div>

                <div className="funding-metrics-grid">
                  <div className="metric-box">
                    <span className="metric-label">Min. Ticket</span>
                    <span className="metric-val">
                      {startupDetailData.startup.currencySymbol}
                      {startupDetailData.startup.demoMinTicket.toLocaleString()}
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Pre-Money Val.</span>
                    <span className="metric-val">
                      {startupDetailData.startup.currencySymbol}
                      {(startupDetailData.startup.demoPreMoneyValuation / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Post-Money Val.</span>
                    <span className="metric-val">
                      {startupDetailData.startup.currencySymbol}
                      {(startupDetailData.startup.demoPostMoneyValuation / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="metric-box">
                    <span className="metric-label">Jurisdiction</span>
                    <span className="metric-val">{startupDetailData.startup.countryCode}</span>
                  </div>
                </div>

                <button
                  className="button primary full sim-btn"
                  onClick={() => handleOpenSim(startupDetailData.startup)}
                >
                  <Coins size={16} />
                  Simulate Allocation
                </button>
              </div>

              {startupDetailData.marketEvaluation && (
                <div className="market-card-mini">
                  <h4>Jurisdiction Scoping: {startupDetailData.marketEvaluation.countryName}</h4>
                  <p className="muted">{startupDetailData.marketEvaluation.currentResearchStatus}</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      {/* 1. OVERVIEW TAB */}
      {!activeStartupSlug && activeTab === "overview" && (
        <div className="invest-tab-content">
          <div className="invest-hero-banner">
            <div>
              <span className="eyebrow">THE FUTURE OF STARTUP CAPITAL</span>
              <h2>Accessible Early-Stage Startup Discovery</h2>
              <p>
                Explore early-stage technology companies across New Zealand, the United States, and Malaysia. Simulate hypothetical allocations and experience ProductScroll's future vision.
              </p>
              <div className="hero-buttons">
                <button
                  className="button primary"
                  onClick={() => setActiveTab("discover")}
                >
                  Explore Demo Startups <ArrowUpRight size={15} />
                </button>
                <button
                  className="button secondary"
                  onClick={() => setActiveTab("how-it-works")}
                >
                  How It Works
                </button>
              </div>
            </div>
          </div>

          {/* Portfolio quick glance */}
          {user && overviewData?.portfolioSummary && (
            <div className="portfolio-glance-card">
              <div className="glance-header">
                <div>
                  <span className="eyebrow">YOUR SIMULATED PORTFOLIO</span>
                  <h3>Simulated Capital Overview</h3>
                </div>
                <button
                  className="button secondary small"
                  onClick={() => setActiveTab("portfolio")}
                >
                  Open Simulator <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="glance-metrics">
                <div className="glance-stat">
                  <span className="stat-label">Total Simulated Allocated</span>
                  <span className="stat-value">
                    ${overviewData.portfolioSummary.totalSimulatedAllocated.toLocaleString()}
                  </span>
                </div>
                <div className="glance-stat">
                  <span className="stat-label">Simulated Positions</span>
                  <span className="stat-value">
                    {overviewData.portfolioSummary.positionsCount}
                  </span>
                </div>
                <div className="glance-stat">
                  <span className="stat-label">Watchlisted Startups</span>
                  <span className="stat-value">
                    {overviewData.portfolioSummary.watchlist.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Featured Demo Startups */}
          <section className="invest-section">
            <div className="section-row">
              <div>
                <h2>Featured Startups</h2>
                <p className="muted">Fictional demonstration profiles curated across evaluated markets.</p>
              </div>
              <button
                className="button secondary small"
                onClick={() => setActiveTab("discover")}
              >
                View all ({overviewData?.recent.length || 0})
              </button>
            </div>

            <div className="startups-grid">
              {overviewData?.featured.map((startup) => (
                <StartupCard
                  key={startup.id}
                  startup={startup}
                  onView={() => setActiveStartupSlug(startup.slug)}
                  onSimulate={() => handleOpenSim(startup)}
                  onWatchlist={() => handleToggleWatchlist(startup.id)}
                />
              ))}
            </div>
          </section>

          {/* Markets Under Evaluation */}
          <section className="invest-section">
            <div className="section-row">
              <div>
                <h2>Markets Under Scoping</h2>
                <p className="muted">Evaluating regulatory pathways in New Zealand, the US, and Malaysia.</p>
              </div>
              <button
                className="button secondary small"
                onClick={() => setActiveTab("markets")}
              >
                Explore Regulatory Research
              </button>
            </div>

            <div className="markets-grid">
              {overviewData?.markets.map((m) => (
                <div className="market-card" key={m.countryCode}>
                  <div className="market-header">
                    <span className="market-flag">{m.countryCode}</span>
                    <div>
                      <h4>{m.countryName}</h4>
                      <small className="muted">{m.currency} ({m.currencySymbol})</small>
                    </div>
                  </div>
                  <span className="eval-status-pill">{m.status}</span>
                  <p className="market-desc">{m.marketOverview}</p>
                  <button
                    className="button secondary small full"
                    onClick={() => {
                      setSelectedCountry(m.countryCode);
                      setActiveTab("discover");
                    }}
                  >
                    View {m.countryName} Startups
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* 2. DISCOVER STARTUPS TAB */}
      {!activeStartupSlug && activeTab === "discover" && (
        <div className="invest-tab-content">
          <div className="filter-bar">
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search startups, technologies, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="country-filters">
              {[
                { code: "ALL", label: "All Markets" },
                { code: "NZ", label: "New Zealand (NZ$)" },
                { code: "US", label: "United States ($)" },
                { code: "MY", label: "Malaysia (RM)" },
              ].map((c) => (
                <button
                  key={c.code}
                  className={`country-btn ${selectedCountry === c.code ? "active" : ""}`}
                  onClick={() => setSelectedCountry(c.code)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {startupsLoading && <Loading cards={2} />}

          {!startupsLoading && startupsData?.startups && (
            <div className="startups-grid">
              {startupsData.startups.map((s) => (
                <StartupCard
                  key={s.id}
                  startup={s}
                  onView={() => setActiveStartupSlug(s.slug)}
                  onSimulate={() => handleOpenSim(s)}
                  onWatchlist={() => handleToggleWatchlist(s.id)}
                />
              ))}
            </div>
          )}

          {!startupsLoading && startupsData?.startups.length === 0 && (
            <Empty
              title="No demo startups found"
              description="Try adjusting your country or industry filter."
              action={
                <button
                  className="button secondary"
                  onClick={() => {
                    setSelectedCountry("ALL");
                    setSelectedIndustry("ALL");
                    setSearchQuery("");
                  }}
                >
                  Reset Filters
                </button>
              }
            />
          )}
        </div>
      )}

      {/* 3. WATCHLIST TAB */}
      {!activeStartupSlug && activeTab === "watchlist" && (
        <div className="invest-tab-content">
          {!user ? (
            <div className="radar-cta-box">
              <Bookmark size={28} />
              <div>
                <h4>Save Startups to Your Watchlist</h4>
                <p>Sign in to track progress updates and simulate allocations.</p>
              </div>
              <button className="button primary" onClick={() => setAuthOpen(true)}>
                Sign in
              </button>
            </div>
          ) : watchlistLoading ? (
            <Loading cards={2} />
          ) : watchlistData?.watchlist && watchlistData.watchlist.length > 0 ? (
            <div className="startups-grid">
              {watchlistData.watchlist.map((s) => (
                <StartupCard
                  key={s.id}
                  startup={s}
                  onView={() => setActiveStartupSlug(s.slug)}
                  onSimulate={() => handleOpenSim(s)}
                  onWatchlist={() => handleToggleWatchlist(s.id)}
                />
              ))}
            </div>
          ) : (
            <Empty
              title="Your watchlist is empty"
              description="Browse demo startups and click the bookmark icon to save them here."
              action={
                <button className="button primary" onClick={() => setActiveTab("discover")}>
                  Discover Startups
                </button>
              }
            />
          )}
        </div>
      )}

      {/* 4. PORTFOLIO SIMULATOR TAB */}
      {!activeStartupSlug && activeTab === "portfolio" && (
        <div className="invest-tab-content">
          {!user ? (
            <div className="radar-cta-box">
              <PieChart size={28} />
              <div>
                <h4>Interactive Portfolio Simulator</h4>
                <p>Sign in to simulate mock allocations, track hypothetical equity percentages, and test portfolio strategies.</p>
              </div>
              <button className="button primary" onClick={() => setAuthOpen(true)}>
                Sign in
              </button>
            </div>
          ) : portfolioLoading ? (
            <Loading cards={2} />
          ) : portfolioData?.portfolio ? (
            <div className="portfolio-simulator-layout">
              {/* Summary Stats */}
              <div className="portfolio-stats-bar">
                <div className="p-stat">
                  <span className="p-label">Total Simulated Allocation</span>
                  <span className="p-val">
                    ${portfolioData.portfolio.totalSimulatedAllocated.toLocaleString()}
                  </span>
                  <small className="muted">Non-financial fictional simulation</small>
                </div>
                <div className="p-stat">
                  <span className="p-label">Simulated Positions</span>
                  <span className="p-val">{portfolioData.portfolio.positionsCount}</span>
                  <small className="muted">Active demo investments</small>
                </div>
                <div className="p-stat">
                  <span className="p-label">Watchlisted Companies</span>
                  <span className="p-val">{portfolioData.portfolio.watchlist.length}</span>
                  <small className="muted">Early stage discovery</small>
                </div>
              </div>

              {/* Positions List */}
              <section className="portfolio-section">
                <h3>Active Simulated Positions</h3>
                {portfolioData.portfolio.positions.length > 0 ? (
                  <div className="positions-table-wrapper">
                    <table className="positions-table">
                      <thead>
                        <tr>
                          <th>Startup</th>
                          <th>Market</th>
                          <th>Hypothetical Allocation</th>
                          <th>Illustrative Ownership</th>
                          <th>Simulated On</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioData.portfolio.positions.map((p) => (
                          <tr key={p.id}>
                            <td>
                              <strong>{p.startup.name}</strong>
                              <br />
                              <small className="muted">{p.startup.industry}</small>
                            </td>
                            <td>
                              <span className="tag-pill">{p.startup.countryCode}</span>
                            </td>
                            <td>
                              <strong>
                                {p.currency} {p.hypotheticalAmount.toLocaleString()}
                              </strong>
                            </td>
                            <td>
                              <span className="equity-badge">
                                {p.illustrativeEquityPercent}%
                              </span>
                            </td>
                            <td>
                              <small className="muted">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <button
                                className="button danger small"
                                onClick={() => handleRemovePosition(p.id)}
                                title="Remove simulation"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title="No simulated allocations yet"
                    description="Explore demo startups and click 'Simulate Allocation' to add positions to your demo portfolio."
                    action={
                      <button className="button primary" onClick={() => setActiveTab("discover")}>
                        Explore Startups
                      </button>
                    }
                  />
                )}
              </section>

              {/* Activity History */}
              {portfolioData.portfolio.recentActivity.length > 0 && (
                <section className="portfolio-section">
                  <h3>Simulated Activity History</h3>
                  <div className="activity-list">
                    {portfolioData.portfolio.recentActivity.map((act) => (
                      <div className="activity-item" key={act.id}>
                        <div className="act-dot" />
                        <div>
                          <strong>{act.action.replace(/_/g, " ")}</strong>: {act.details}
                          <br />
                          <small className="muted">{new Date(act.createdAt).toLocaleString()}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 5. MARKETS TAB */}
      {!activeStartupSlug && activeTab === "markets" && (
        <div className="invest-tab-content">
          <div className="section-intro">
            <h3>Jurisdiction Scoping & Regulatory Research</h3>
            <p className="muted">
              ProductScroll is researching early-stage capital formation frameworks across New Zealand, the United States, and Malaysia.
            </p>
          </div>

          <div className="markets-detail-list">
            {overviewData?.markets.map((m) => (
              <div className="market-deep-card" key={m.countryCode}>
                <div className="m-card-header">
                  <div className="m-title-block">
                    <span className="market-big-flag">{m.countryCode}</span>
                    <div>
                      <h3>{m.countryName}</h3>
                      <span className="muted">Currency: {m.currency} ({m.currencySymbol})</span>
                    </div>
                  </div>
                  <span className="eval-status-pill">{m.status}</span>
                </div>

                <p className="m-overview">{m.marketOverview}</p>

                <div className="m-columns">
                  <div className="m-col">
                    <h4>Regulatory Research Topics</h4>
                    <ul>
                      {m.regulatoryResearchTopics.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="m-col">
                    <h4>Licensing & Intermediary Considerations</h4>
                    <ul>
                      {m.licensingConsiderations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="m-status-box">
                  <strong>Current Research Status:</strong> {m.currentResearchStatus}
                </div>

                <div className="m-questions-box">
                  <strong>Outstanding Questions:</strong>
                  <ul>
                    {m.outstandingQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. HOW IT WORKS TAB */}
      {!activeStartupSlug && activeTab === "how-it-works" && (
        <div className="invest-tab-content">
          <div className="how-it-works-card">
            <h2>About ProductScroll Invest Prototype</h2>
            <p className="lead">
              ProductScroll connects people building the future. Invest demonstrates our future ambition to make small-ticket early-stage startup capital accessible under appropriate regulatory compliance.
            </p>

            <div className="principles-grid">
              <div className="principle-card">
                <ShieldAlert size={24} />
                <h4>Strictly Non-Transactional Prototype</h4>
                <p>
                  This module facilitates NO real investments, accepts NO funds, and processes NO payments. All figures, percentages, and valuations are illustrative educational demo values.
                </p>
              </div>

              <div className="principle-card">
                <Globe size={24} />
                <h4>International Regulatory Scoping</h4>
                <p>
                  Evaluating crowdfunding frameworks in New Zealand (FMCA 2013), the United States (SEC Reg CF), and Malaysia (SC Malaysia RMO).
                </p>
              </div>

              <div className="principle-card">
                <Coins size={24} />
                <h4>Interactive Portfolio Simulator</h4>
                <p>
                  Experience the allocation workflow: select a fictional startup, enter an illustrative ticket size, review the calculated ownership stake, and track simulated positions.
                </p>
              </div>
            </div>

            <div className="disclaimer-callout">
              <strong>Legal Disclaimer for Hack Day Delhi NCR:</strong>
              <p>
                ProductScroll is not a registered funding portal, broker-dealer, or investment intermediary. Nothing in this application constitutes financial advice, solicitation, or an offer of securities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE ALLOCATION MODAL */}
      {simModalStartup && (
        <Modal
          title={`Simulate Allocation: ${simModalStartup.name}`}
          onClose={() => setSimModalStartup(null)}
        >
          <div className="simulation-modal-content">
            <div className="sim-modal-banner">
              <AlertTriangle size={18} />
              <span>
                <strong>Educational Simulation Only:</strong> No real money will be transferred or requested.
              </span>
            </div>

            <div className="sim-form-group">
              <label>Hypothetical Allocation Amount ({simModalStartup.currency})</label>
              <div className="sim-input-wrapper">
                <span className="currency-prefix">{simModalStartup.currencySymbol}</span>
                <input
                  type="number"
                  min={simModalStartup.demoMinTicket}
                  step={50}
                  value={hypotheticalAmount}
                  onChange={(e) => setHypotheticalAmount(Number(e.target.value))}
                />
              </div>
              <small className="muted">
                Hypothetical minimum ticket: {simModalStartup.currencySymbol}
                {simModalStartup.demoMinTicket.toLocaleString()}
              </small>
            </div>

            {/* Illustrative Ownership Calculation */}
            <div className="illustrative-calc-box">
              <div className="calc-row">
                <span>Illustrative Post-Money Valuation:</span>
                <strong>
                  {simModalStartup.currencySymbol}
                  {simModalStartup.demoPostMoneyValuation.toLocaleString()}
                </strong>
              </div>
              <div className="calc-row result">
                <span>Hypothetical Illustrative Ownership:</span>
                <strong className="calc-percent">
                  {(
                    (hypotheticalAmount / simModalStartup.demoPostMoneyValuation) *
                    100
                  ).toFixed(4)}
                  %
                </strong>
              </div>
              <small className="muted calc-note">
                Formula: (Hypothetical Amount / Illustrative Post-Money Valuation) × 100
              </small>
            </div>

            <div className="sim-modal-footer">
              <button
                className="button secondary"
                onClick={() => setSimModalStartup(null)}
              >
                Cancel
              </button>
              <button
                className="button primary"
                disabled={
                  hypotheticalAmount < simModalStartup.demoMinTicket ||
                  simSubmitting
                }
                onClick={handleConfirmSimulation}
              >
                {simSubmitting ? "Simulating..." : "Simulate Allocation"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StartupCard({
  startup,
  onView,
  onSimulate,
  onWatchlist,
}: {
  startup: DemoStartupDTO;
  onView: () => void;
  onSimulate: () => void;
  onWatchlist: () => void;
}) {
  const percentRaised = Math.min(
    100,
    Math.round((startup.demoRaisedAmount / startup.demoTargetAmount) * 100),
  );

  return (
    <div className="startup-card">
      <div className="card-top">
        <span className="demo-badge">PROTOTYPE DEMO</span>
        <button
          className={`watchlist-btn ${startup.isWatchlisted ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onWatchlist();
          }}
          title={startup.isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Bookmark size={15} />
        </button>
      </div>

      <div className="card-header" onClick={onView}>
        <div className="logo-placeholder">
          {startup.name.slice(0, 1)}
        </div>
        <div>
          <h4>{startup.name}</h4>
          <span className="card-country">
            {startup.country} · {startup.countryCode}
          </span>
        </div>
      </div>

      <p className="card-pitch" onClick={onView}>{startup.tagline}</p>

      <div className="card-meta">
        <span className="pill industry">{startup.industry}</span>
        <span className="pill stage">{startup.stage}</span>
      </div>

      <div className="card-funding" onClick={onView}>
        <div className="funding-labels">
          <span>
            <strong>
              {startup.currencySymbol}
              {startup.demoRaisedAmount.toLocaleString()}
            </strong>{" "}
            <small className="muted">raised</small>
          </span>
          <span className="muted">
            Target: {startup.currencySymbol}
            {startup.demoTargetAmount.toLocaleString()}
          </span>
        </div>
        <div className="card-progress-bar">
          <div
            className="card-progress-fill"
            style={{ width: `${percentRaised}%` }}
          />
        </div>
        <div className="funding-bottom">
          <small className="muted">
            Min. ticket: {startup.currencySymbol}
            {startup.demoMinTicket.toLocaleString()}
          </small>
          <small className="muted">
            Valuation: {startup.currencySymbol}
            {(startup.demoPostMoneyValuation / 1000000).toFixed(1)}M
          </small>
        </div>
      </div>

      <div className="card-actions">
        <button className="button secondary small" onClick={onView}>
          Details
        </button>
        <button className="button primary small" onClick={onSimulate}>
          <Coins size={14} />
          Simulate Allocation
        </button>
      </div>
    </div>
  );
}
