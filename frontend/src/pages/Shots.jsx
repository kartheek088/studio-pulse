import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Badge } from "../components/common/Badge";
import { RealtimePreviewModal } from "../components/common/RealtimePreviewModal";
import {
  Search,
  Film,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlaySquare,
  GitCommit,
  MessageSquareCheck,
  GitMerge,
  ExternalLink,
  Boxes,
  Eye,
  Tv,
  User,
  Layers,
} from "lucide-react";

export function Shots() {
  const navigate = useNavigate();
  const {
    shots,
    projects,
    workflows,
    getWorkflow,
    getProject,
    role,
    currentArtist,
    currentUser,
    users,
    canEditShot,
    getMyShots,
    getArtistName,
    commitToGitLfs,
    submitToKitsuReview,
  } = useProduction();

  const isLead = currentUser?.role === "productionLead" || role === "productionLead";
  const isDirector = currentUser?.role === "director" || role === "director";
  const isArtist = currentUser?.role === "artist" || role === "artist";

  const [viewScope, setViewScope] = useState(isArtist ? "my" : "all");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [dccFilter, setDccFilter] = useState("All");
  const [artistFilter, setArtistFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [previewShot, setPreviewShot] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    if (isArtist) {
      setViewScope("my");
    } else {
      setViewScope("all");
    }
  }, [currentUser?.id, isArtist]);

  function triggerToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const currentUserId = (currentUser?.id || currentArtist || "").toLowerCase();

  const myAccessibleShots = shots.filter((s) => {
    const sArtist = (s.artistId || "").toLowerCase();
    return sArtist === currentUserId || sArtist.includes(currentUserId);
  });

  const baseShots = viewScope === "my" ? myAccessibleShots : shots;

  // Collect all unique stages across workflows for dynamic filtering
  const allStages = [
    { id: "pre-production", label: "Pre-production (Storyboard Pro)" },
    { id: "realtime-previz", label: "Real-time Previz (Unreal Engine)" },
    { id: "asset-production", label: "Asset Production (Blender)" },
    { id: "animation-layout", label: "Animation / Layout (Sequencer)" },
    { id: "render-review", label: "Render / Review (Unreal + Kitsu)" },
    { id: "storyboard", label: "Storyboard" },
    { id: "layout", label: "Layout" },
    { id: "blocking", label: "Blocking" },
    { id: "animation", label: "Animation" },
    { id: "lighting", label: "Lighting" },
    { id: "render", label: "Render" },
    { id: "review", label: "Review" },
    { id: "approval", label: "Approval" },
  ];

  const filteredShots = baseShots.filter((s) => {
    const matchProject = projectFilter === "All" || s.projectId === projectFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    const matchStage = stageFilter === "All" || s.stageId === stageFilter;
    const matchDcc =
      dccFilter === "All" ||
      (s.dccTool && s.dccTool.toLowerCase().includes(dccFilter.toLowerCase()));
    const matchArtist =
      viewScope === "my" ||
      artistFilter === "All" ||
      (s.artistId || "").toLowerCase() === artistFilter.toLowerCase();
    const matchPriority = priorityFilter === "All" || s.priority === priorityFilter;

    const project = getProject(s.projectId);
    const projectName = project ? project.name.toLowerCase() : "";
    const artistName = getArtistName(s.artistId).toLowerCase();
    const dccTool = (s.dccTool || "").toLowerCase();
    const kitsuId = (s.kitsuId || "").toLowerCase();
    const gitHash = (s.gitHash || "").toLowerCase();
    const searchText = `${s.id} ${s.name} ${artistName} ${projectName} ${dccTool} ${kitsuId} ${gitHash}`.toLowerCase();
    const matchSearch = searchText.includes(search.toLowerCase());

    return (
      matchProject &&
      matchStatus &&
      matchStage &&
      matchDcc &&
      matchArtist &&
      matchPriority &&
      matchSearch
    );
  });

  const stats = {
    total: filteredShots.length,
    inProgress: filteredShots.filter(
      (s) => s.status === "In Progress" || s.status === "Review"
    ).length,
    review: filteredShots.filter((s) => s.status === "Review").length,
    blocked: filteredShots.filter((s) => s.status === "Blocked").length,
    lfsTracked: filteredShots.filter((s) => Boolean(s.gitHash || s.lfsFile)).length,
  };

  const statusOptions = ["All", "In Progress", "Review", "Completed", "Blocked"];
  const dccOptions = ["All", "Unreal Engine", "Blender", "Storyboard Pro", "Sequencer"];

  return (
    <div className="page shots-page">
      {/* Real-Time Previz Modal */}
      {previewShot && (
        <RealtimePreviewModal
          isOpen={Boolean(previewShot)}
          onClose={() => setPreviewShot(null)}
          shot={previewShot}
          onSubmitToKitsu={async (sId, ver, note) => {
            await submitToKitsuReview({ shotId: sId, version: ver, feedback: note });
            triggerToast(`Shot ${sId} queued in Kitsu Review!`);
          }}
          onCommitGit={async (sId) => {
            await commitToGitLfs({
              shotId: sId,
              message: "Previz playblast check-in",
              dccTool: previewShot.dccTool,
            });
            triggerToast(`Shot ${sId} committed to Git LFS!`);
          }}
        />
      )}

      {toastMsg && (
        <div className="arch-toast-bar">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-main">
          <h1>Shot Directory</h1>
          <p className="page-subtitle">
            Search, filter, inspect Git LFS version hashes, launch Unreal Previz, and track reviews.
          </p>
        </div>

        {/* View Scope Switcher for User Accessibility */}
        <div className="view-scope-switcher">
          <button
            type="button"
            className={`scope-pill-btn ${viewScope === "my" ? "active" : ""}`}
            onClick={() => {
              setViewScope("my");
              setArtistFilter("All");
            }}
          >
            <User size={14} /> My Assigned Shots ({myAccessibleShots.length})
          </button>
          <button
            type="button"
            className={`scope-pill-btn ${viewScope === "all" ? "active" : ""}`}
            onClick={() => setViewScope("all")}
          >
            <Film size={14} /> All Studio Shots ({shots.length})
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card tone-info">
          <div className="stat-card-top">
            <p>{viewScope === "my" ? "My Matching Shots" : "Matching Shots"}</p>
            <Film size={18} className="stat-icon-lucide text-info" />
          </div>
          <strong className="stat-number">{stats.total}</strong>
          <span className="stat-change">Active in current filter</span>
        </div>

        <div className="stat-card tone-info">
          <div className="stat-card-top">
            <p>Active Work</p>
            <CheckCircle2 size={18} className="stat-icon-lucide text-info" />
          </div>
          <strong className="stat-number">{stats.inProgress}</strong>
          <span className="stat-change">In progress or review</span>
        </div>

        <div className="stat-card tone-warning">
          <div className="stat-card-top">
            <p>Awaiting Sign-off (Kitsu)</p>
            <Clock size={18} className="stat-icon-lucide text-warning" />
          </div>
          <strong className="stat-number">{stats.review}</strong>
          <span className="stat-change">In director review queue</span>
        </div>

        <div className="stat-card tone-danger">
          <div className="stat-card-top">
            <p>Blocked Dependencies</p>
            <AlertTriangle size={18} className="stat-icon-lucide text-danger" />
          </div>
          <strong className="stat-number">{stats.blocked}</strong>
          <span className="stat-change">Needing asset sign-off</span>
        </div>
      </div>

      {/* Unified Toolbar */}
      <div className="studio-toolbar-advanced">
        <div className="filter-chips-group">
          {statusOptions.map((item) => (
            <button
              type="button"
              key={item}
              className={`filter-chip-btn ${statusFilter === item ? "active" : ""}`}
              onClick={() => setStatusFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="filter-selects-row">
          <select
            className="filter-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="All">All Pipeline Stages</option>
            {allStages.map((st) => (
              <option key={st.id} value={st.id}>
                {st.label}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={dccFilter}
            onChange={(e) => setDccFilter(e.target.value)}
          >
            <option value="All">All DCC Tools</option>
            {dccOptions.slice(1).map((dcc) => (
              <option key={dcc} value={dcc}>
                {dcc}
              </option>
            ))}
          </select>

          {viewScope === "all" && (
            <select
              className="filter-select"
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
            >
              <option value="All">All Artists</option>
              {users &&
                Object.values(users).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.department || u.role})
                  </option>
                ))}
            </select>
          )}

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <div className="search-input-wrapper flex-1">
            <Search size={15} className="search-icon" />
            <input
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, DCC, Git hash, Kitsu ID..."
            />
          </div>
        </div>
      </div>

      {/* Table Panel */}
      <section className="panel shots-panel">
        <div className="panel-header">
          <div>
            <h2>Shots List ({filteredShots.length})</h2>
            <p>Click any shot to view details, or launch real-time Unreal previz directly</p>
          </div>
        </div>

        <div className="shots-table-container">
          <table>
            <thead>
              <tr>
                <th>SHOT ID</th>
                <th>PROJECT</th>
                <th>DESCRIPTION</th>
                <th>PIPELINE STAGE (SLIDE 5)</th>
                <th>DCC TOOL</th>
                <th>GIT LFS / KITSU</th>
                <th>ACTIVITY</th>
                <th>ARTIST</th>
                <th>PROGRESS</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredShots.map((s) => {
                const project = getProject(s.projectId);
                const wf = getWorkflow(s.projectId);
                const stageObj = wf?.stages?.find((st) => st.id === s.stageId);
                const stageName = stageObj?.name || s.stageId;
                const stageSub = stageObj?.subtitle;

                return (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/shots/${s.id}`)}
                    className="shot-row"
                  >
                    <td>
                      <strong className="shot-id-tag">{s.id}</strong>
                    </td>
                    <td>{project?.name || "—"}</td>
                    <td style={{ maxWidth: "220px" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-bright)" }}>{s.name}</div>
                      <div className="shot-sub-desc" style={{ fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.description}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span className="stage-pill">{stageName}</span>
                        {stageSub && (
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{stageSub}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="dcc-tag-pill">{s.dccTool || "Blender"}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {s.gitHash ? (
                          <span
                            className="git-hash-pill"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/git-lfs");
                            }}
                            title="Inspect in Git LFS"
                          >
                            <GitCommit size={11} /> {s.gitHash}
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>—</span>
                        )}
                        {s.kitsuId ? (
                          <span
                            className="kitsu-ticket-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/reviews");
                            }}
                            title="Inspect in Kitsu Review"
                          >
                            <MessageSquareCheck size={11} /> {s.kitsuId}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <span className="slide-ref-pill" style={{ fontSize: "11px" }}>
                        Step {s.activityStep || (s.status === "Completed" ? 6 : 4)}/6
                      </span>
                    </td>
                    <td>{getArtistName(s.artistId)}</td>
                    <td>
                      <div className="shot-progress-cell">
                        <div className="progress-bar mini">
                          <div
                            className="progress-fill"
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                        <span className="mini-progress-val">{s.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant={
                          s.status === "Blocked"
                            ? "danger"
                            : s.status === "Review"
                            ? "warn"
                            : s.status === "Completed"
                            ? "ok"
                            : "info"
                        }
                        text={s.status}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-quick-previz"
                          title="Launch Unreal Engine Real-time Previz Viewport"
                          onClick={() => setPreviewShot(s)}
                        >
                          <PlaySquare size={13} /> Previz
                        </button>
                        <button
                          type="button"
                          className="btn-quick-detail"
                          title="Open Shot Detail"
                          onClick={() => navigate(`/shots/${s.id}`)}
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredShots.length === 0 && (
            <div className="empty-shots">No shots matched your search or filters.</div>
          )}
        </div>
      </section>
    </div>
  );
}