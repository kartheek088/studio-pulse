import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Badge } from "../components/common/Badge";
import { RealtimePreviewModal } from "../components/common/RealtimePreviewModal";
import { NewProjectModal } from "../components/projects/NewProjectModal";
import {
  FolderPlus,
  FolderKanban,
  Film,
  Clock,
  AlertTriangle,
  ArrowRight,
  GitBranch,
  CheckCircle2,
  Play,
  Send,
  RotateCcw,
  Box,
  User,
  Calendar,
  Layers,
  Sparkles,
  MessageSquare,
  Unlock,
  AlertOctagon,
  CheckSquare,
  GitMerge,
  ExternalLink,
  PlaySquare,
  GitCommit,
  Lock,
  HardDrive,
  MessageSquareCheck,
  Tv,
} from "lucide-react";

export function Dashboard() {
  const navigate = useNavigate();
  const {
    projects,
    shots,
    tasks,
    reviews,
    assets,
    activities,
    getWorkflow,
    role,
    currentUser,
    currentArtist,
    getArtistName,
    updateTaskStatus,
    approveReview,
    requestChanges,
    updateAssetVersion,
    commitToGitLfs,
    submitToKitsuReview,
    createProject,
  } = useProduction();

  const [feedbackNotes, setFeedbackNotes] = useState({});
  const [actionDone, setActionDone] = useState({});
  const [previewShot, setPreviewShot] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [artistViewMode, setArtistViewMode] = useState("my"); // "my" | "all"
  const [lockedAssets, setLockedAssets] = useState({
    CHAR_001: "MJ (Maya Joshi)",
    ENV_014: "RS (Rohan Sharma)",
  });

  function triggerToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function handleDirectorApprove(reviewId) {
    approveReview(reviewId);
    setActionDone((prev) => ({ ...prev, [reviewId]: "Approved" }));
    triggerToast("Shot version approved! Advanced to downstream stage.");
    setTimeout(() => {
      setActionDone((prev) => {
        const copy = { ...prev };
        delete copy[reviewId];
        return copy;
      });
    }, 2000);
  }

  function handleDirectorRequestChanges(reviewId) {
    const note = feedbackNotes[reviewId] || "Adjust lighting contrast and specular highlights on rim edges.";
    requestChanges(reviewId, note);
    setActionDone((prev) => ({ ...prev, [reviewId]: "Changes Requested" }));
    triggerToast("Revision notes sent to artist.");
    setTimeout(() => {
      setActionDone((prev) => {
        const copy = { ...prev };
        delete copy[reviewId];
        return copy;
      });
    }, 2000);
  }

  function handleToggleLock(assetId) {
    if (lockedAssets[assetId]) {
      setLockedAssets((prev) => {
        const copy = { ...prev };
        delete copy[assetId];
        return copy;
      });
      triggerToast(`Unlocked ${assetId} in Git LFS!`);
    } else {
      setLockedAssets((prev) => ({ ...prev, [assetId]: currentUser?.name || "Current Artist" }));
      triggerToast(`Acquired Git LFS file lock on ${assetId}!`);
    }
  }

  async function handleQuickCommitTask(task) {
    const shot = shots.find((s) => s.id === task.shotId);
    await commitToGitLfs({
      shotId: task.shotId,
      message: `Work-in-progress commit on ${task.name}`,
      dccTool: shot?.dccTool || currentUser?.dcc?.split(" ")[0] || "Blender",
      author: currentUser?.id,
    });
    triggerToast(`Committed ${task.shotId} progress to Git LFS!`);
  }

  const activeUserId = (currentUser?.id || currentArtist || "").toLowerCase();
  const activeUserAvatar = (currentUser?.avatar || "").toLowerCase();

  // Filter items assigned to active user
  const myTasks = tasks.filter(
    (t) => (t.artistId || "").toLowerCase() === activeUserId
  );
  const myShots = shots.filter(
    (s) => (s.artistId || "").toLowerCase() === activeUserId
  );
  const myShotIds = myShots.map((s) => s.id);
  const myReviews = reviews.filter((r) => myShotIds.includes(r.shotId));
  const pendingReviews = reviews.filter((r) => r.status === "Pending Review");
  const unapprovedAssets = assets.filter((a) => a.status !== "Approved");

  // Assets owned by active user
  const myAssets = assets.filter((a) => {
    const owner = (a.owner || "").toLowerCase();
    return (
      owner === activeUserId ||
      owner === activeUserAvatar ||
      owner.includes(activeUserId) ||
      owner.includes(activeUserAvatar)
    );
  });

  // =========================================================
  // VIEW 1: PRODUCTION ARTIST WORKSPACE
  // =========================================================
  if (role === "artist") {
    const activeTasks = myTasks.filter((t) => t.status !== "Completed");
    const inProgressTasks = myTasks.filter((t) => t.status === "In Progress");
    const awaitingReviewOnMyShots = myReviews.filter((r) => r.status === "Pending Review");
    const blockedTasks = myTasks.filter((t) => t.status === "Blocked");

    const displayedTasks = artistViewMode === "my" ? activeTasks : tasks.filter((t) => t.status !== "Completed");
    const displayedShots = artistViewMode === "my" ? myShots : shots;

    return (
      <div className="page dashboard-page">
        {/* Previz Modal */}
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
                message: "Dashboard previz commit",
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
            <h1>{currentUser?.name}'s Desk</h1>
            <p className="page-subtitle">
              {currentUser?.title || "Production Artist"} · {currentUser?.dept || "Department"} ({currentUser?.dcc || "DCC"})
            </p>
          </div>

          {/* View Mode Filter Tabs (Segmented Control) */}
          <div className="view-scope-switcher">
            <button
              type="button"
              className={`scope-pill-btn ${artistViewMode === "my" ? "active" : ""}`}
              onClick={() => setArtistViewMode("my")}
            >
              <User size={14} /> My Work ({myTasks.length} tasks · {myShots.length} shots)
            </button>
            <button
              type="button"
              className={`scope-pill-btn ${artistViewMode === "all" ? "active" : ""}`}
              onClick={() => setArtistViewMode("all")}
            >
              <Layers size={14} /> Studio Facilities
            </button>
          </div>
        </div>

        {/* Artist KPIs */}
        <div className="stats-grid">
          <div className="stat-card tone-info">
            <div className="stat-card-top">
              <p>Active Assigned Tasks</p>
              <span className="stat-icon-lucide"><CheckSquare size={18} /></span>
            </div>
            <strong className="stat-number">{activeTasks.length}</strong>
            <span className="stat-change">{inProgressTasks.length} currently in DCC work</span>
          </div>

          <div className="stat-card tone-info">
            <div className="stat-card-top">
              <p>My Tracked Shots</p>
              <span className="stat-icon-lucide"><Film size={18} /></span>
            </div>
            <strong className="stat-number">{myShots.length}</strong>
            <span className="stat-change">Sequence deliverables assigned</span>
          </div>

          <div className="stat-card tone-warning">
            <div className="stat-card-top">
              <p>In Director Review</p>
              <span className="stat-icon-lucide"><Clock size={18} /></span>
            </div>
            <strong className="stat-number">{awaitingReviewOnMyShots.length}</strong>
            <span className="stat-change">Queued in Kitsu portal</span>
          </div>

          <div className="stat-card tone-danger">
            <div className="stat-card-top">
              <p>Blocked Dependencies</p>
              <span className="stat-icon-lucide"><AlertTriangle size={18} /></span>
            </div>
            <strong className="stat-number">{blockedTasks.length}</strong>
            <span className="stat-change">Needing upstream approvals</span>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* 1. Artist Immediate Tasks */}
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  {artistViewMode === "my" ? "My Active Tasks" : "Studio Active Tasks"} ({displayedTasks.length})
                </h2>
                <p>Execute DCC work, commit to Git LFS, and submit for director critique</p>
              </div>
              <button
                type="button"
                className="panel-action"
                onClick={() => navigate("/tasks")}
              >
                <span>Full task board</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="artist-task-list">
              {displayedTasks.map((task) => {
                const isMine = (task.artistId || "").toLowerCase() === activeUserId;
                const shot = shots.find((s) => s.id === task.shotId);

                return (
                  <div key={task.id} className="artist-task-row">
                    <div className="artist-task-info">
                      <div className="artist-task-title-line">
                        <strong
                          className="task-shot-link"
                          onClick={() => navigate(`/shots/${task.shotId}`)}
                          title="Open shot details"
                        >
                          {task.shotId}
                        </strong>
                        <span className="artist-task-name">{task.name}</span>
                        {shot?.dccTool && (
                          <span className="dcc-tag-pill" style={{ fontSize: "10px", padding: "1px 6px" }}>
                            {shot.dccTool}
                          </span>
                        )}
                        <Badge
                          variant={task.priority.toLowerCase() === "high" ? "danger" : "warn"}
                          text={task.priority}
                        />
                      </div>
                      <div className="artist-task-meta">
                        <span>Assigned: <strong>{getArtistName(task.artistId)}</strong></span>
                        <span>Due: <strong>{task.dueDate}</strong></span>
                        <span className={`status-text-pill ${task.status.toLowerCase().replace(" ", "-")}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    <div className="artist-task-actions">
                      {isMine ? (
                        <>
                          {task.status === "Not Started" && (
                            <button
                              type="button"
                              className="btn-task-quick-action start"
                              onClick={() => {
                                updateTaskStatus(task.id, "In Progress");
                                triggerToast(`Started task "${task.name}"`);
                              }}
                            >
                              <Play size={12} /> Start Work
                            </button>
                          )}
                          {task.status === "In Progress" && (
                            <>
                              <button
                                type="button"
                                className="btn-task-quick-action complete"
                                onClick={() => {
                                  updateTaskStatus(task.id, "Completed");
                                  triggerToast(`Marked "${task.name}" as Completed!`);
                                }}
                              >
                                <CheckCircle2 size={12} /> Complete
                              </button>
                              <button
                                type="button"
                                className="btn-task-quick-action"
                                style={{ background: "rgba(236,72,153,0.12)", color: "#f472b6", border: "1px solid rgba(236,72,153,0.3)" }}
                                onClick={() => handleQuickCommitTask(task)}
                                title="Commit to Git LFS"
                              >
                                <GitCommit size={12} /> Commit LFS
                              </button>
                              {shot && (
                                <button
                                  type="button"
                                  className="btn-task-quick-action"
                                  style={{ background: "rgba(6,182,212,0.12)", color: "#38bdf8", border: "1px solid rgba(6,182,212,0.3)" }}
                                  onClick={() => setPreviewShot(shot)}
                                  title="Launch Unreal Previz Viewport"
                                >
                                  <PlaySquare size={12} /> Previz
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn-task-quick-action submit"
                                onClick={() => navigate(`/shots/${task.shotId}`)}
                              >
                                <Send size={12} /> Submit Version
                              </button>
                            </>
                          )}
                          {task.status === "Blocked" && (
                            <button
                              type="button"
                              className="btn-task-quick-action unblock"
                              onClick={() => {
                                updateTaskStatus(task.id, "In Progress");
                                triggerToast(`Unblocked task "${task.name}"`);
                              }}
                            >
                              <Unlock size={12} /> Unblock
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="task-assigned-pill" style={{ fontSize: "11px" }}>
                          Assigned to {getArtistName(task.artistId)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {displayedTasks.length === 0 && (
                <div className="empty-shots">You have no active pending tasks right now. Great work!</div>
              )}
            </div>
          </section>

          {/* 2. My Assigned Shots & Previz */}
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>
                  {artistViewMode === "my" ? "My Assigned Shots" : "Studio Shot Sequence"} ({displayedShots.length})
                </h2>
                <p>Launch Unreal Engine real-time previz player or inspect stage progression</p>
              </div>
              <button
                type="button"
                className="panel-action"
                onClick={() => navigate("/shots")}
              >
                <span>Shot catalog</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="artist-shots-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {displayedShots.slice(0, 5).map((sh) => (
                <div key={sh.id} className="artist-review-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong
                        className="task-shot-link"
                        onClick={() => navigate(`/shots/${sh.id}`)}
                      >
                        {sh.id} — {sh.name}
                      </strong>
                      <span className="stage-pill" style={{ fontSize: "10px" }}>{sh.stageId}</span>
                      <Badge
                        variant={
                          sh.status === "Completed"
                            ? "ok"
                            : sh.status === "Review"
                            ? "warn"
                            : sh.status === "Blocked"
                            ? "danger"
                            : "info"
                        }
                        text={sh.status}
                      />
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                      DCC: <strong>{sh.dccTool || "Blender"}</strong> · Progress: <strong>{sh.progress}%</strong>
                      {sh.gitHash && (
                        <span style={{ marginLeft: "8px", fontFamily: "monospace", color: "#f472b6" }}>
                          LFS: {sh.gitHash}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn-quick-previz"
                      onClick={() => setPreviewShot(sh)}
                    >
                      <PlaySquare size={13} /> Previz
                    </button>
                    <button
                      type="button"
                      className="btn-quick-detail"
                      onClick={() => navigate(`/shots/${sh.id}`)}
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. My Owned Assets (Slide 5 & 7 Git LFS Vault) */}
          {myAssets.length > 0 && (
            <section className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="panel-header">
                <div>
                  <h2>My Owned Assets & Git LFS Locks ({myAssets.length})</h2>
                  <p>3D Meshes, rigs, and environment packages authored by you</p>
                </div>
                <button
                  type="button"
                  className="panel-action"
                  onClick={() => navigate("/assets")}
                >
                  <span>Asset library</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {myAssets.map((asset) => {
                  const isLocked = Boolean(lockedAssets[asset.id]);

                  return (
                    <div key={asset.id} className="asset-card" style={{ padding: "14px" }}>
                      <div className="asset-card-top">
                        <span className="asset-id" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <Box size={13} /> {asset.id}
                        </span>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {isLocked && (
                            <span className="git-lfs-lock-pill">
                              <Lock size={10} /> Locked
                            </span>
                          )}
                          <Badge
                            variant={asset.status === "Approved" ? "ok" : "warn"}
                            text={asset.status}
                          />
                        </div>
                      </div>

                      <h3 className="asset-title" style={{ fontSize: "14px", margin: "6px 0 10px" }}>{asset.name}</h3>

                      <div className="asset-meta" style={{ fontSize: "11px", marginBottom: "10px" }}>
                        <div>
                          <small>Version</small>
                          <strong>v{asset.version}</strong>
                        </div>
                        <div>
                          <small>Type</small>
                          <strong>{asset.type}</strong>
                        </div>
                        <div>
                          <small>Git LFS Lock</small>
                          <strong style={{ color: isLocked ? "var(--warning)" : "var(--ok)" }}>
                            {isLocked ? "Locked" : "Unlocked"}
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="task-btn-action"
                          style={{ flex: 1, justifyContent: "center" }}
                          onClick={() => handleToggleLock(asset.id)}
                        >
                          {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                          {isLocked ? "Release Lock" : "Acquire Lock"}
                        </button>
                        <button
                          type="button"
                          className="task-btn-action primary"
                          style={{ flex: 1, justifyContent: "center" }}
                          onClick={() => navigate("/assets")}
                        >
                          <GitCommit size={12} /> Manage LFS
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 4. Director Feedback on My Work */}
          <section className="panel" style={{ gridColumn: "1 / -1" }}>
            <div className="panel-header">
              <div>
                <h2>Director Feedback & Kitsu Review Status</h2>
                <p>Recent review notes on versions submitted for creative sign-off</p>
              </div>
              <button
                type="button"
                className="panel-action"
                onClick={() => navigate("/reviews")}
              >
                <span>Kitsu reviews</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="artist-reviews-list">
              {myReviews.map((rev) => (
                <div key={rev.id} className="artist-review-item">
                  <div className="artist-review-top">
                    <div className="artist-review-headline">
                      <strong
                        className="task-shot-link"
                        onClick={() => navigate(`/shots/${rev.shotId}`)}
                      >
                        {rev.shotId} (Version {rev.version})
                      </strong>
                      <Badge
                        variant={
                          rev.status === "Approved"
                            ? "ok"
                            : rev.status === "Changes Requested"
                            ? "danger"
                            : "warn"
                        }
                        text={rev.status}
                      />
                    </div>
                    <span className="artist-review-date">
                      {rev.date ? new Date(rev.date).toLocaleDateString() : "Recent"}
                    </span>
                  </div>

                  <div className="artist-review-quote">
                    <MessageSquare size={14} className="quote-icon" />
                    <p>{rev.feedback || "Awaiting director review comments."}</p>
                  </div>

                  {rev.status === "Changes Requested" && (
                    <div className="revisions-alert-banner">
                      <AlertOctagon size={14} />
                      <span>Revisions requested. Please tweak version in DCC and re-submit for sign-off.</span>
                    </div>
                  )}
                </div>
              ))}

              {myReviews.length === 0 && (
                <div className="empty-shots">No review submissions logged for your shots yet.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW 2: CREATIVE DIRECTOR REVIEW & SIGN-OFF DESK
  // =========================================================
  if (role === "director") {
    const approvedCount = reviews.filter((r) => r.status === "Approved").length;
    const revisionsCount = reviews.filter((r) => r.status === "Changes Requested").length;

    return (
      <div className="page dashboard-page">
        {/* Previz Modal */}
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
                message: "Director review check-in",
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
            <h1>Director Approval Desk</h1>
            <p className="page-subtitle">
              Executive Creative Direction · Final sign-off & frame annotations
            </p>
          </div>
        </div>

        {/* Director KPIs */}
        <div className="stats-grid">
          <div className="stat-card tone-warning">
            <div className="stat-card-top">
              <p>Awaiting My Approval</p>
              <span className="stat-icon-lucide"><Clock size={18} /></span>
            </div>
            <strong className="stat-number">{pendingReviews.length}</strong>
            <span className="stat-change">Immediate director review needed</span>
          </div>

          <div className="stat-card tone-ok">
            <div className="stat-card-top">
              <p>Approved Versions</p>
              <span className="stat-icon-lucide"><CheckCircle2 size={18} /></span>
            </div>
            <strong className="stat-number">{approvedCount}</strong>
            <span className="stat-change">Advanced to downstream stages</span>
          </div>

          <div className="stat-card tone-danger">
            <div className="stat-card-top">
              <p>Revisions In Progress</p>
              <span className="stat-icon-lucide"><RotateCcw size={18} /></span>
            </div>
            <strong className="stat-number">{revisionsCount}</strong>
            <span className="stat-change">Returned to artists with feedback</span>
          </div>

          <div className="stat-card tone-info">
            <div className="stat-card-top">
              <p>Asset Approvals Needed</p>
              <span className="stat-icon-lucide"><Box size={18} /></span>
            </div>
            <strong className="stat-number">{unapprovedAssets.length}</strong>
            <span className="stat-change">Environment & character assets</span>
          </div>
        </div>

        {/* Immediate Sign-off Queue */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Immediate Review Queue ({pendingReviews.length})</h2>
              <p>Review artist submissions, enter revision notes, inspect Unreal previz, and approve</p>
            </div>
            <button
              type="button"
              className="panel-action"
              onClick={() => navigate("/reviews")}
            >
              <span>Full review queue</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="director-review-queue-list">
            {pendingReviews.map((rev) => {
              const shot = shots.find((s) => s.id === rev.shotId);
              const project = projects.find((p) => p.id === shot?.projectId);

              return (
                <div key={rev.id} className="director-queue-card">
                  <div className="director-queue-top">
                    <div>
                      <div className="director-shot-heading">
                        <strong
                          className="task-shot-link"
                          onClick={() => navigate(`/shots/${rev.shotId}`)}
                        >
                          {rev.shotId} — {shot?.name || "Sequence Shot"}
                        </strong>
                        <span className="version-pill">Version {rev.version}</span>
                        {shot && (
                          <button
                            type="button"
                            className="btn-quick-previz"
                            style={{ marginLeft: "8px" }}
                            onClick={() => setPreviewShot(shot)}
                          >
                            <PlaySquare size={12} /> Inspect Previz
                          </button>
                        )}
                        <Badge variant="warn" text="Pending Approval" />
                      </div>
                      <p className="director-shot-sub">
                        Production: <strong>{project?.name || "Mystic Island"}</strong> · Artist:{" "}
                        <strong>{getArtistName(shot?.artistId)}</strong> · DCC:{" "}
                        <strong>{shot?.dccTool || "Blender"}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="director-feedback-input-box">
                    <label className="director-input-label">Director Revision Notes / Feedback:</label>
                    <textarea
                      className="director-textarea"
                      rows={2}
                      value={feedbackNotes[rev.id] || rev.feedback || ""}
                      onChange={(e) =>
                        setFeedbackNotes({ ...feedbackNotes, [rev.id]: e.target.value })
                      }
                      placeholder="Add specific artistic notes (e.g. rim light intensity, camera shake, motion blur)..."
                    />
                  </div>

                  <div className="director-card-actions">
                    {actionDone[rev.id] && (
                      <span className="director-success-flash">
                        ✓ {actionDone[rev.id]}! Shot workflow updated.
                      </span>
                    )}
                    <div className="director-action-buttons-row">
                      <button
                        type="button"
                        className="btn-director-action request-changes"
                        onClick={() => handleDirectorRequestChanges(rev.id)}
                      >
                        <RotateCcw size={13} /> Request Changes
                      </button>
                      <button
                        type="button"
                        className="btn-director-action approve"
                        onClick={() => handleDirectorApprove(rev.id)}
                      >
                        <CheckCircle2 size={14} /> Approve & Advance Shot
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {pendingReviews.length === 0 && (
              <div className="empty-shots">All submitted versions have been reviewed. Creative queue is clear!</div>
            )}
          </div>
        </section>

        {/* Asset Approval Gating */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Asset Production Gating ({unapprovedAssets.length})</h2>
              <p>Approve character rigs and environment packages to unblock dependent shots</p>
            </div>
            <button
              type="button"
              className="panel-action"
              onClick={() => navigate("/assets")}
            >
              <span>Asset library</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="director-assets-gating-grid">
            {unapprovedAssets.map((asset) => (
              <div key={asset.id} className="asset-gate-card">
                <div className="asset-gate-top">
                  <div>
                    <span className="asset-tag">{asset.id}</span>
                    <h3 className="asset-gate-name">{asset.name}</h3>
                    <p className="asset-gate-sub">
                      Category: {asset.type || asset.category} · Owner: {asset.owner || "Team"}
                    </p>
                  </div>
                  <Badge variant="warn" text={asset.status} />
                </div>
                <div className="asset-gate-actions">
                  <button
                    type="button"
                    className="btn-quick-asset-approve"
                    onClick={() => {
                      updateAssetVersion(asset.id, asset.version, "Approved");
                      triggerToast(`Approved ${asset.id} (${asset.name})! Blockers resolved.`);
                    }}
                  >
                    <CheckCircle2 size={13} /> Sign-Off & Unblock Shots
                  </button>
                  <button
                    type="button"
                    className="btn-quick-asset-view"
                    onClick={() => navigate("/assets")}
                  >
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}

            {unapprovedAssets.length === 0 && (
              <div className="empty-shots">All production assets are approved! No dependency blocks.</div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // =========================================================
  // VIEW 3: PRODUCTION LEAD SUPERVISORY DESK (DEFAULT)
  // =========================================================
  const totalShots = shots.length;
  const inProgress = shots.filter((s) => s.status === "In Progress").length;
  const inReview = shots.filter((s) => s.status === "Review").length;
  const blocked = shots.filter((s) => s.status === "Blocked").length;

  return (
    <div className="page dashboard-page">
      {/* Previz Modal */}
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
              message: "Lead previz check-in",
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
          <h1>Studio Supervisory Desk</h1>
          <p className="page-subtitle">
            Facility velocity, milestone gating, and cross-department throughput
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card tone-info">
          <div className="stat-card-top">
            <p>Active Productions</p>
            <span className="stat-icon-lucide"><FolderKanban size={18} /></span>
          </div>
          <strong className="stat-number">{projects.length}</strong>
          <span className="stat-change">Productions underway</span>
        </div>

        <div className="stat-card tone-info">
          <div className="stat-card-top">
            <p>Total Pipeline Shots</p>
            <span className="stat-icon-lucide"><Film size={18} /></span>
          </div>
          <strong className="stat-number">{totalShots}</strong>
          <span className="stat-change">{inProgress} currently in progress</span>
        </div>

        <div className="stat-card tone-warning">
          <div className="stat-card-top">
            <p>Director Review Queue</p>
            <span className="stat-icon-lucide"><Clock size={18} /></span>
          </div>
          <strong className="stat-number">{inReview}</strong>
          <span className="stat-change">Awaiting creative sign-off</span>
        </div>

        <div className="stat-card tone-danger">
          <div className="stat-card-top">
            <p>Blocked Bottlenecks</p>
            <span className="stat-icon-lucide"><AlertTriangle size={18} /></span>
          </div>
          <strong className="stat-number">{blocked}</strong>
          <span className="stat-change">Require dependency resolution</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Active Projects */}
        <section className="panel projects-panel">
          <div className="panel-header">
            <div>
              <h2>Active Production Runs</h2>
              <p>Real-time delivery progress across client engagements</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px" }}
                onClick={() => setIsNewProjectOpen(true)}
              >
                <FolderPlus size={14} />
                <span>New Project</span>
              </button>
              <button
                type="button"
                className="panel-action"
                onClick={() => navigate("/projects")}
              >
                <span>All projects</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="project-card-list">
            {projects.map((proj) => {
              const wf = getWorkflow(proj.workflowId);
              const pShots = shots.filter((s) => s.projectId === proj.id);

              return (
                <div
                  key={proj.id}
                  className="project-row"
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="project-row-info">
                    <strong className="project-row-name">{proj.name}</strong>
                    <p className="project-row-sub">
                      Client: <strong>{proj.client}</strong> · {wf?.name || "Connected"} Pipeline · {pShots.length} shots
                    </p>
                  </div>
                  <div className="project-row-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    <span className="progress-val">{proj.progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Priority Attention */}
        <section className="panel attention-panel">
          <div className="panel-header">
            <div>
              <h2>Supervisor Attention Required</h2>
              <p>Bottlenecks and dependency halts impacting delivery deadlines</p>
            </div>
          </div>

          <div className="attention-list">
            {blocked > 0 && (
              <div
                className="attention-card danger"
                onClick={() => navigate("/shots")}
                role="button"
                tabIndex={0}
              >
                <div className="att-icon-box danger">
                  <AlertTriangle size={16} />
                </div>
                <div className="att-text-box">
                  <strong>{blocked} shot{blocked > 1 ? "s" : ""} currently blocked</strong>
                  <p>Missing environment/rig dependencies halting artists</p>
                </div>
                <ArrowRight size={14} className="att-arrow" />
              </div>
            )}

            {pendingReviews.length > 0 && (
              <div
                className="attention-card warn"
                onClick={() => navigate("/reviews")}
                role="button"
                tabIndex={0}
              >
                <div className="att-icon-box warn">
                  <Clock size={16} />
                </div>
                <div className="att-text-box">
                  <strong>{pendingReviews.length} shot{pendingReviews.length > 1 ? "s" : ""} in review queue</strong>
                  <p>Creative Director sign-off required to advance stages</p>
                </div>
                <ArrowRight size={14} className="att-arrow" />
              </div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="panel activity-panel">
          <div className="panel-header">
            <div>
              <h2>Facility Activity Feed</h2>
              <p>Audit trail of all pipeline state changes</p>
            </div>
            <button
              type="button"
              className="panel-action"
              onClick={() => navigate("/activity")}
            >
              <span>Full stream</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="activity-stream-list">
            {activities.slice(0, 5).map((a) => (
              <div key={a.id} className="activity-stream-item">
                <span className={`activity-stream-dot type-${a.type}`} />
                <div className="activity-stream-content">
                  <strong className="activity-stream-title">{a.text}</strong>
                  <p className="activity-stream-detail">{a.detail}</p>
                </div>
                <span className="activity-stream-time">{formatTimeAgo(a.time)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreateProject={createProject}
      />
    </div>
  );
}

function formatTimeAgo(iso) {
  if (!iso) return "Just now";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}