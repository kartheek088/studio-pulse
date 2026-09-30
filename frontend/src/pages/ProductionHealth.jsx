import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Badge } from "../components/common/Badge";
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Zap,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

export function ProductionHealth() {
  const navigate = useNavigate();
  const { shots, tasks, assets, reviews } = useProduction();

  // Stage distribution & bottlenecks
  const STAGES_LIST = [
    { id: "layout", name: "Layout" },
    { id: "blocking", name: "Blocking" },
    { id: "animation", name: "Animation" },
    { id: "lighting", name: "Lighting" },
    { id: "render", name: "Rendering" },
    { id: "review", name: "Review Queue" },
  ];

  const stageBottlenecks = STAGES_LIST.map((stage) => {
    const stageShots = shots.filter((s) => s.stageId === stage.id);
    const blockedInStage = stageShots.filter((s) => s.status === "Blocked").length;
    let health = "Healthy";
    let statusTone = "ok";

    if (stageShots.length >= 4 || blockedInStage >= 1) {
      health = "Bottleneck";
      statusTone = "danger";
    } else if (stageShots.length >= 2) {
      health = "At Risk";
      statusTone = "warn";
    }

    return {
      ...stage,
      count: stageShots.length,
      blocked: blockedInStage,
      health,
      statusTone,
    };
  });

  // Blocked shots with unapproved asset dependencies
  const blockedShots = shots.filter((s) => s.status === "Blocked");

  // Review Queue Waiting Time
  const inReviewShots = shots.filter(
    (s) => s.status === "Review" || s.stageId === "review"
  );
  const pendingReviews = reviews.filter((r) => r.status === "Pending Review");

  // Production Risk categories
  const highRisk = shots.filter(
    (s) => s.status === "Blocked" || (s.priority === "High" && s.progress < 50)
  ).length;
  const mediumRisk = shots.filter(
    (s) => (s.status === "Review" && s.progress < 80) || s.priority === "Medium"
  ).length;
  const lowRisk = Math.max(0, shots.length - highRisk - mediumRisk);

  return (
    <div className="page health-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1>Production Health</h1>
          <p className="page-subtitle">
            Pipeline diagnostics, stage velocity, risk distribution, and dependency blockers.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card tone-info">
          <div className="stat-card-top">
            <p>Total Pipeline Volume</p>
            <span className="stat-icon-lucide"><Layers size={18} /></span>
          </div>
          <strong>{shots.length}</strong>
          <span className="stat-change">Active tracked shots</span>
        </div>
        <div className="stat-card tone-ok">
          <div className="stat-card-top">
            <p>On Schedule (Low Risk)</p>
            <span className="stat-icon-lucide"><CheckCircle2 size={18} /></span>
          </div>
          <strong>{lowRisk}</strong>
          <span className="stat-change">Healthy stage turnaround</span>
        </div>
        <div className="stat-card tone-warning">
          <div className="stat-card-top">
            <p>Medium Risk / Review</p>
            <span className="stat-icon-lucide"><AlertTriangle size={18} /></span>
          </div>
          <strong>{mediumRisk}</strong>
          <span className="stat-change">Watching queue times</span>
        </div>
        <div className="stat-card tone-danger">
          <div className="stat-card-top">
            <p>High Risk / Blocked</p>
            <span className="stat-icon-lucide"><AlertOctagon size={18} /></span>
          </div>
          <strong>{highRisk}</strong>
          <span className="stat-change">Immediate lead intervention</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* 1. Workflow Bottlenecks */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Stage Bottlenecks</h2>
              <p>Workload density & throughput status per stage</p>
            </div>
            <button
              type="button"
              className="panel-action"
              onClick={() => navigate("/workflow")}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              Workflow Board <ExternalLink size={13} />
            </button>
          </div>

          <div className="bottleneck-table-wrap">
            {stageBottlenecks.map((stage) => (
              <div key={stage.id} className="bottleneck-row-card">
                <div className="bottleneck-row-left">
                  <strong>{stage.name}</strong>
                  <span className="bottleneck-count-sub">
                    {stage.count} shot{stage.count !== 1 ? "s" : ""}{" "}
                    {stage.blocked > 0 && `(${stage.blocked} blocked)`}
                  </span>
                </div>
                <Badge variant={stage.statusTone} text={stage.health} />
              </div>
            ))}
          </div>
        </section>

        {/* 2. Review Queue Waiting Time */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Review Queue Backlog</h2>
              <p>Creative approval queue wait analytics</p>
            </div>
            <button
              type="button"
              className="panel-action"
              onClick={() => navigate("/reviews")}
              style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
            >
              Review Queue <ExternalLink size={13} />
            </button>
          </div>

          <div className="waiting-time-box">
            <div className="waiting-metric-row">
              <div className="waiting-card">
                <span className="waiting-label">Shots in Review</span>
                <strong className="waiting-val">{inReviewShots.length}</strong>
              </div>
              <div className="waiting-card">
                <span className="waiting-label">Pending Sign-off</span>
                <strong className="waiting-val">{pendingReviews.length}</strong>
              </div>
              <div className="waiting-card">
                <span className="waiting-label">Average Wait Time</span>
                <strong className="waiting-val">1.8 days</strong>
              </div>
            </div>

            <div className="queue-velocity-note">
              <Zap size={16} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }} />
              <p style={{ margin: 0 }}>
                Target SLA for review turnarounds is <strong>24 hours</strong>. Lighting and Compositing
                currently account for 65% of review cycle duration.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Blocked Work & Dependency Resolution */}
      <section className="panel blocked-work-panel">
        <div className="panel-header">
          <div>
            <h2>Blocked Work ({blockedShots.length})</h2>
            <p>Shots halted pending asset approval or upstream stages</p>
          </div>
          <button
            type="button"
            className="panel-action"
            onClick={() => navigate("/assets")}
            style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
          >
            Inspect Assets <ExternalLink size={13} />
          </button>
        </div>

        <div className="blocked-items-container">
          {blockedShots.map((shot) => {
            const missingAssets = (shot.dependencies || [])
              .map((aId) => assets.find((a) => a.id === aId))
              .filter((a) => a && a.status !== "Approved");

            return (
              <div key={shot.id} className="blocked-card-row">
                <div className="blocked-card-left">
                  <strong
                    className="blocked-shot-title"
                    onClick={() => navigate(`/shots/${shot.id}`)}
                  >
                    {shot.id} — {shot.name}
                  </strong>
                  <div className="blocked-reason-line">
                    <span className="dep-tag">DEPENDENCY:</span>
                    <span>
                      Waiting for:{" "}
                      <strong>
                        {missingAssets.length > 0
                          ? missingAssets
                              .map((a) => `${a.name} (${a.version}, ${a.status})`)
                              .join(", ")
                          : "Forest Environment v05 (Unapproved)"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="blocked-card-actions">
                  <button
                    type="button"
                    className="btn-action-view"
                    onClick={() => navigate(`/shots/${shot.id}`)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                  >
                    Open Shot <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {blockedShots.length === 0 && (
            <div className="empty-shots">No shots currently blocked. Pipeline is flowing smoothly!</div>
          )}
        </div>
      </section>

      {/* 4. Production Risk Summary */}
      <section className="panel risk-summary-panel">
        <div className="panel-header">
          <div>
            <h2>Production Risk Distribution</h2>
            <p>Projected delivery exposure across active catalog</p>
          </div>
        </div>

        <div className="risk-bars-container">
          <div className="risk-segment-row">
            <span className="risk-seg-label">High Risk ({highRisk})</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.round((highRisk / (shots.length || 1)) * 100)}%`,
                  background: "var(--danger)",
                }}
              />
            </div>
            <span className="risk-seg-val">
              {Math.round((highRisk / (shots.length || 1)) * 100)}%
            </span>
          </div>

          <div className="risk-segment-row">
            <span className="risk-seg-label">Medium Risk ({mediumRisk})</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.round((mediumRisk / (shots.length || 1)) * 100)}%`,
                  background: "var(--warn)",
                }}
              />
            </div>
            <span className="risk-seg-val">
              {Math.round((mediumRisk / (shots.length || 1)) * 100)}%
            </span>
          </div>

          <div className="risk-segment-row">
            <span className="risk-seg-label">Low Risk ({lowRisk})</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.round((lowRisk / (shots.length || 1)) * 100)}%`,
                  background: "var(--ok)",
                }}
              />
            </div>
            <span className="risk-seg-val">
              {Math.round((lowRisk / (shots.length || 1)) * 100)}%
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}