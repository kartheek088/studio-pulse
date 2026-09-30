import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Badge } from "../components/common/Badge";
import { Search, ArrowRight, FolderKanban, Film, Calendar, CheckCircle2, GitMerge, ExternalLink, User } from "lucide-react";

export function Projects() {
  const navigate = useNavigate();
  const { projects, shots, getWorkflow, currentUser, currentArtist } = useProduction();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = ["All", "In Production", "At Risk", "Healthy", "Completed"];

  const filtered = projects.filter((p) => {
    const matchStatus =
      statusFilter === "All" ||
      p.status === statusFilter ||
      p.health === statusFilter;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="page projects-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1>Active Projects</h1>
          <p className="page-subtitle">
            Monitor client productions, stage velocity, milestones, and deliverable commitments.
          </p>
        </div>
      </div>

      {/* Unified Toolbar */}
      <div className="studio-toolbar">
        <div className="filter-chips-group">
          {statuses.map((s) => (
            <button
              type="button"
              key={s}
              className={`filter-chip-btn ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, client, or type..."
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-grid">
        {filtered.map((p) => {
          const wf = getWorkflow(p.workflowId);
          const pShots = shots.filter((s) => s.projectId === p.id);

          return (
            <div
              key={p.id}
              className="project-card"
              onClick={() => navigate(`/projects/${p.id}`)}
              role="button"
              tabIndex={0}
            >
              <div className="project-card-top">
                <div>
                  <h3 className="project-card-title">{p.name}</h3>
                  <p className="project-card-client">
                    {p.type} · Client: {p.client}
                  </p>
                </div>
                <Badge
                  variant={p.health.toLowerCase() === "healthy" ? "ok" : "warn"}
                  text={p.status}
                />
              </div>

              <div className="progress-info">
                <span>Production Completion</span>
                <strong>{p.progress}%</strong>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${p.progress}%` }}
                />
              </div>

              <div className="project-stats-matrix">
                <div className="stat-pill">
                  <Film size={13} className="stat-pill-icon" />
                  <span>{pShots.length || p.shotCount} shots</span>
                </div>
                <div className="stat-pill">
                  <FolderKanban size={13} className="stat-pill-icon" />
                  <span>{wf?.name?.includes("Connected") ? "Connected Pipeline" : `${wf?.name || "Standard"} Pipeline`}</span>
                </div>
                <div className="stat-pill">
                  <Calendar size={13} className="stat-pill-icon" />
                  <span>Due {p.deadline}</span>
                </div>
                {pShots.filter((s) => {
                  const sArtist = (s.artistId || "").toLowerCase();
                  const uId = (currentUser?.id || currentArtist || "").toLowerCase();
                  return sArtist === uId || sArtist.includes(uId);
                }).length > 0 && (
                  <div className="stat-pill" style={{ background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.35)", color: "var(--accent)", fontWeight: 600 }}>
                    <User size={13} className="stat-pill-icon" />
                    <span>{pShots.filter((s) => {
                      const sArtist = (s.artistId || "").toLowerCase();
                      const uId = (currentUser?.id || currentArtist || "").toLowerCase();
                      return sArtist === uId || sArtist.includes(uId);
                    }).length} assigned to you</span>
                  </div>
                )}
              </div>

              {p.workflowId === "connected" && (
                <div style={{ marginTop: "10px", padding: "6px 10px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", borderRadius: "var(--radius-sm)", fontSize: "11px", color: "#38bdf8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Unreal Engine + Blender + Sequencer + Kitsu</span>
                  <span className="slide-ref-pill" style={{ fontSize: "10px" }}>Slide 5</span>
                </div>
              )}

              <button
                type="button"
                className="open-project-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/projects/${p.id}`);
                }}
              >
                <span>Inspect Project Pipeline</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-shots">No projects match the selected criteria.</div>
      )}
    </div>
  );
}