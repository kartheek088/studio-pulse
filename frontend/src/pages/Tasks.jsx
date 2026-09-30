import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Badge } from "../components/common/Badge";
import { RealtimePreviewModal } from "../components/common/RealtimePreviewModal";
import {
  CheckSquare,
  Play,
  CheckCircle2,
  Send,
  AlertOctagon,
  Unlock,
  Search,
  User,
  Calendar,
  Layers,
  Sparkles,
  Lock,
  GitCommit,
  PlaySquare,
  MessageSquareCheck,
  ExternalLink,
  GitMerge,
  Boxes,
} from "lucide-react";

export function Tasks() {
  const navigate = useNavigate();
  const {
    tasks,
    shots,
    role,
    currentArtist,
    currentUser,
    users,
    canEditTask,
    getMyTasks,
    updateTaskStatus,
    blockTask,
    submitTaskForReview,
    getArtistName,
    getShot,
    commitToGitLfs,
    submitToKitsuReview,
  } = useProduction();

  const isLead = currentUser?.role === "productionLead" || role === "productionLead";
  const isDirector = currentUser?.role === "director" || role === "director";
  const isArtist = currentUser?.role === "artist" || role === "artist";

  const [viewScope, setViewScope] = useState(isArtist ? "my" : "all");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [artistFilter, setArtistFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [previewShot, setPreviewShot] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  function triggerToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  // Update view scope when user switches
  useEffect(() => {
    if (isArtist) {
      setViewScope("my");
    } else {
      setViewScope("all");
    }
  }, [currentUser?.id, isArtist]);

  const departments = [
    "All",
    "Pre-production",
    "Real-time Previz",
    "Asset Production",
    "Animation",
    "Lighting",
    "Render",
  ];

  const KANBAN_COLUMNS = [
    { key: "Not Started", label: "To Do", tone: "neutral" },
    { key: "In Progress", label: "In Progress", tone: "info" },
    { key: "Review", label: "In Review (Kitsu)", tone: "warning" },
    { key: "Blocked", label: "Blocked", tone: "danger" },
    { key: "Completed", label: "Completed", tone: "ok" },
  ];

  const currentUserId = (currentUser?.id || currentArtist || "").toLowerCase();

  const myAccessibleTasks = tasks.filter((t) => {
    const tArtist = (t.artistId || "").toLowerCase();
    return tArtist === currentUserId || tArtist.includes(currentUserId);
  });

  const baseTasks = viewScope === "my" ? myAccessibleTasks : tasks;

  const displayTasks = baseTasks.filter((t) => {
    const shot = getShot(t.shotId);
    const dcc = (shot?.dccTool || "").toLowerCase();
    const stage = (t.stageId || "").toLowerCase();
    const dept = (t.department || "").toLowerCase();

    let matchDept = departmentFilter === "All";
    if (!matchDept) {
      const df = departmentFilter.toLowerCase();
      matchDept =
        dept.includes(df) ||
        stage.includes(df) ||
        dcc.includes(df) ||
        (df === "real-time previz" && (stage.includes("previz") || dcc.includes("unreal"))) ||
        (df === "pre-production" && (stage.includes("pre") || stage.includes("storyboard"))) ||
        (df === "asset production" && (stage.includes("asset") || dcc.includes("blender")));
    }

    const matchArtist =
      viewScope === "my" ||
      artistFilter === "All" ||
      (t.artistId || "").toLowerCase() === artistFilter.toLowerCase();

    const artistName = getArtistName(t.artistId).toLowerCase();
    const matchSearch =
      `${t.id} ${t.name} ${t.shotId} ${artistName} ${dcc}`.toLowerCase().includes(
        search.toLowerCase()
      );
    return matchDept && matchArtist && matchSearch;
  });

  async function handleQuickCommit(task) {
    const shot = getShot(task.shotId);
    await commitToGitLfs({
      shotId: task.shotId,
      message: `Progress check-in on ${task.name}`,
      dccTool: shot?.dccTool || "Blender",
      author: currentUser?.id || task.artistId,
    });
    triggerToast(`Committed ${task.id} (${task.shotId}) to Git LFS!`);
  }

  async function handleQuickSubmitKitsu(task) {
    await submitToKitsuReview({
      shotId: task.shotId,
      version: `v0${(getShot(task.shotId)?.version || 1) + 1}`,
      feedback: `Submitting task "${task.name}" for director critique.`,
    });
    triggerToast(`Queued ${task.shotId} playblast in Kitsu Review!`);
  }

  return (
    <div className="page tasks-page">
      {/* Real-time Previz Viewer Modal */}
      {previewShot && (
        <RealtimePreviewModal
          isOpen={Boolean(previewShot)}
          onClose={() => setPreviewShot(null)}
          shot={previewShot}
          onSubmitToKitsu={async (sId, ver, note) => {
            await submitToKitsuReview({ shotId: sId, version: ver, feedback: note });
            triggerToast(`Queued ${sId} in Kitsu Review!`);
          }}
          onCommitGit={async (sId) => {
            await commitToGitLfs({
              shotId: sId,
              message: "Task previz commit",
              dccTool: previewShot.dccTool,
            });
            triggerToast(`Committed ${sId} to Git LFS!`);
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
          <h1>Production Tasks</h1>
          <p className="page-subtitle">
            {isArtist
              ? `Work queue for ${getArtistName(currentArtist)}`
              : isDirector
              ? "Creative direction and departmental overview"
              : "Lead production supervision and task allocation"}
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
            <User size={14} /> My Accessible Tasks ({myAccessibleTasks.length})
          </button>
          <button
            type="button"
            className={`scope-pill-btn ${viewScope === "all" ? "active" : ""}`}
            onClick={() => setViewScope("all")}
          >
            <Layers size={14} /> All Studio Tasks ({tasks.length})
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card tone-info">
          <div className="stat-card-top">
            <p>{viewScope === "my" ? "My Total Tasks" : "Total Tasks"}</p>
            <span className="stat-icon-lucide"><CheckSquare size={18} /></span>
          </div>
          <strong className="stat-number">{displayTasks.length}</strong>
          <span className="stat-change">Active in current view</span>
        </div>
        <div className="stat-card tone-info">
          <div className="stat-card-top">
            <p>In Progress (Step 2: DCC)</p>
            <span className="stat-icon-lucide"><Play size={18} /></span>
          </div>
          <strong className="stat-number">
            {displayTasks.filter((t) => t.status === "In Progress").length}
          </strong>
          <span className="stat-change">Active DCC scene work</span>
        </div>
        <div className="stat-card tone-warning">
          <div className="stat-card-top">
            <p>In Review (Step 5: Kitsu)</p>
            <span className="stat-icon-lucide"><Send size={18} /></span>
          </div>
          <strong className="stat-number">
            {displayTasks.filter((t) => t.status === "Review").length}
          </strong>
          <span className="stat-change">Awaiting director critique</span>
        </div>
        <div className="stat-card tone-danger">
          <div className="stat-card-top">
            <p>Blocked Dependencies</p>
            <span className="stat-icon-lucide"><AlertOctagon size={18} /></span>
          </div>
          <strong className="stat-number">
            {displayTasks.filter((t) => t.status === "Blocked").length}
          </strong>
          <span className="stat-change">Needing upstream assets</span>
        </div>
      </div>

      {/* Unified Toolbar Filters */}
      <div className="studio-toolbar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by name, shot, artist, or DCC tool..."
          />
        </div>

        <div className="filter-chips-group">
          {departments.map((d) => (
            <button
              type="button"
              key={d}
              className={`filter-chip-btn ${departmentFilter === d ? "active" : ""}`}
              onClick={() => setDepartmentFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>

        {viewScope === "all" && (
          <div className="filter-selects-row">
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
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="kanban-columns task-kanban-board">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = displayTasks.filter((t) => t.status === col.key);

          return (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-header-left">
                  <span className={`col-dot tone-${col.tone}`} />
                  <h3>{col.label}</h3>
                </div>
                <span className="kanban-badge">{colTasks.length}</span>
              </div>

              <div className="kanban-list">
                {colTasks.length === 0 && (
                  <div className="kanban-empty">No tasks</div>
                )}

                {colTasks.map((task) => {
                  const shot = getShot(task.shotId);
                  const canExecuteTask =
                    isLead ||
                    canEditTask(task) ||
                    (isArtist && (task.artistId || "").toLowerCase() === currentUserId);

                  return (
                    <div key={task.id} className="kanban-card task-card-item">
                      <div className="kanban-card-top">
                        <strong
                          className="task-shot-link"
                          onClick={() => navigate(`/shots/${task.shotId}`)}
                          title="Open shot details"
                        >
                          {task.shotId}
                        </strong>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                          {shot?.dccTool && (
                            <span className="dcc-tag-pill" style={{ fontSize: "10px", padding: "1px 6px" }}>
                              {shot.dccTool}
                            </span>
                          )}
                          <span className={`badge badge-${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <h4 className="task-title-text">{task.name}</h4>

                      <div className="kanban-card-meta">
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <User size={13} /> {getArtistName(task.artistId)}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={13} /> {task.dueDate}
                        </span>
                        <span className="dept-tag">{task.department || task.stageId}</span>
                      </div>

                      {/* VCS & Review Micro-Pills */}
                      <div style={{ display: "flex", gap: "6px", margin: "6px 0 2px", flexWrap: "wrap" }}>
                        {shot?.gitHash && (
                          <span
                            className="git-hash-pill"
                            style={{ fontSize: "10px", cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/git-lfs");
                            }}
                            title="Inspect Git LFS Commit"
                          >
                            <GitCommit size={10} /> {shot.gitHash}
                          </span>
                        )}
                        {shot?.kitsuId && (
                          <span
                            className="kitsu-ticket-tag"
                            style={{ fontSize: "10px", cursor: "pointer" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/reviews");
                            }}
                            title="Open Kitsu Ticket"
                          >
                            <MessageSquareCheck size={10} /> {shot.kitsuId}
                          </span>
                        )}
                        {shot?.activityStep && (
                          <span className="slide-ref-pill" style={{ fontSize: "10px" }}>
                            Step {shot.activityStep}/6
                          </span>
                        )}
                      </div>

                      {/* Task Actions with RBAC */}
                      <div className="task-card-action-bar">
                        {canExecuteTask ? (
                          <>
                            {task.status === "Not Started" && (
                              <button
                                type="button"
                                className="task-btn-action primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTaskStatus(task.id, "In Progress");
                                }}
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <Play size={12} /> Start (Step 2: DCC)
                              </button>
                            )}

                            {task.status === "In Progress" && (
                              <>
                                <button
                                  type="button"
                                  className="task-btn-action success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTaskStatus(task.id, "Completed");
                                  }}
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                                >
                                  <CheckCircle2 size={12} /> Complete
                                </button>
                                <button
                                  type="button"
                                  className="task-btn-action review"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickSubmitKitsu(task);
                                  }}
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                                  title="Submit playblast to Kitsu (Step 5)"
                                >
                                  <Send size={12} /> Kitsu
                                </button>
                                <button
                                  type="button"
                                  className="task-btn-action"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickCommit(task);
                                  }}
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(236,72,153,0.12)", color: "#f472b6", border: "1px solid rgba(236,72,153,0.3)" }}
                                  title="Commit DCC version to Git LFS (Step 3)"
                                >
                                  <GitCommit size={12} /> LFS
                                </button>
                                {shot && (
                                  <button
                                    type="button"
                                    className="task-btn-action"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewShot(shot);
                                    }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(6,182,212,0.12)", color: "#38bdf8", border: "1px solid rgba(6,182,212,0.3)" }}
                                    title="Launch Real-time Unreal Previz Viewport (Step 4)"
                                  >
                                    <PlaySquare size={12} /> Previz
                                  </button>
                                )}
                              </>
                            )}

                            {task.status !== "Blocked" && task.status !== "Completed" && (
                              <button
                                type="button"
                                className="task-btn-action block"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  blockTask(task.id);
                                }}
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <AlertOctagon size={12} /> Block
                              </button>
                            )}

                            {task.status === "Blocked" && (
                              <button
                                type="button"
                                className="task-btn-action unblock"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTaskStatus(task.id, "In Progress");
                                }}
                                style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <Unlock size={12} /> Unblock
                              </button>
                            )}
                          </>
                        ) : isArtist ? (
                          <span className="task-assigned-pill">
                            <Lock size={11} /> Assigned to {getArtistName(task.artistId)}
                          </span>
                        ) : (
                          <div style={{ display: "flex", gap: "4px" }}>
                            {shot && (
                              <button
                                type="button"
                                className="btn-quick-previz"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewShot(shot);
                                }}
                                style={{ fontSize: "10px", padding: "3px 6px" }}
                              >
                                <PlaySquare size={11} /> Previz
                              </button>
                            )}
                            <span className="task-assigned-pill">
                              {task.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}