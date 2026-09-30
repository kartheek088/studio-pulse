import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { WorkflowStages } from "../components/common/WorkflowStages";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import { RealtimePreviewModal } from "../components/common/RealtimePreviewModal";
import {
  ArrowLeft,
  CheckCircle2,
  Send,
  AlertOctagon,
  Unlock,
  Clock,
  ExternalLink,
  Layers,
  Box,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Lock,
  Tv,
  GitCommit,
  PlaySquare,
  MessageSquareCheck,
  Boxes,
  CheckSquare,
  Check,
} from "lucide-react";

export function ShotDetail() {
  const { shotId } = useParams();
  const navigate = useNavigate();
  const {
    shots,
    tasks,
    assets,
    reviews,
    activities,
    getProject,
    getWorkflow,
    getShot,
    getArtistName,
    completeCurrentTask,
    submitVersion,
    updateShotStatus,
    approveReview,
    requestChanges,
    commitToGitLfs,
    submitToKitsuReview,
    advanceActivityStep,
    formatActivityTime,
    role,
    currentArtist,
    currentUser,
    canEditShot,
    canApprove: ctxCanApprove,
  } = useProduction();

  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionInput, setVersionInput] = useState("v05");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("Missing lighting references and shader setup");
  const [directorFeedback, setDirectorFeedback] = useState("");
  const [actionDone, setActionDone] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [gitToast, setGitToast] = useState(null);

  const shot = getShot(shotId);

  if (!shot) {
    return (
      <div className="page shot-detail-page">
        <div className="page-header">
          <button type="button" className="back-link-btn" onClick={() => navigate("/shots")}>
            <ArrowLeft size={16} /> Back to Shots
          </button>
          <h1>Shot Not Found</h1>
        </div>
        <div className="empty-shots">Shot with ID "{shotId}" does not exist.</div>
      </div>
    );
  }

  const project = getProject(shot.projectId);
  const workflow = getWorkflow(shot.projectId);
  const shotTasks = tasks.filter((t) => t.shotId === shot.id);
  const shotReviews = reviews.filter((r) => r.shotId === shot.id);
  const shotActivities = activities.filter(
    (a) => a.entity === shot.id || (a.detail && a.detail.includes(shot.id))
  );

  // Associated assets
  const shotAssets = assets.filter((a) => a.usedIn && a.usedIn.includes(shot.id));

  // Check if any dependency is unapproved
  const unapprovedAssets = shotAssets.filter((a) => a.status !== "Approved");
  const hasUnapprovedDeps = unapprovedAssets.length > 0;

  // Active current task (first non-completed or latest)
  const currentTask =
    shotTasks.find((t) => t.status !== "Completed") || shotTasks[0];

  // Latest review
  const latestReview = shotReviews[0] || null;

  // RBAC permissions
  const isLead = currentUser?.role === "productionLead" || role === "productionLead";
  const isDirector = currentUser?.role === "director" || role === "director";
  const isArtist = currentUser?.role === "artist" || role === "artist";
  const currentUserId = (currentUser?.id || currentArtist || "").toLowerCase();
  const shotArtist = (shot.artistId || "").toLowerCase();
  const isAssignedArtist = isArtist && (shotArtist === currentUserId || shotArtist.includes(currentUserId));
  const canExecute = isLead || isAssignedArtist;
  const canApprove = isDirector || isLead || (ctxCanApprove ? ctxCanApprove() : false);

  function handleCompleteTask() {
    if (!canExecute) return;
    completeCurrentTask(shot.id);
  }

  function handleSubmitVersion() {
    if (!canExecute || !versionInput) return;
    submitVersion(shot.id, versionInput, feedbackInput);
    setShowVersionModal(false);
    setFeedbackInput("");
  }

  function handleToggleBlock() {
    if (!canExecute && !isLead) return;
    if (shot.status === "Blocked") {
      updateShotStatus(shot.id, "In Progress");
    } else {
      updateShotStatus(shot.id, "Blocked");
      setShowBlockModal(false);
    }
  }

  function handleDirectApprove(reviewId) {
    if (!canApprove) return;
    approveReview(reviewId);
    setActionDone("Approved");
    setTimeout(() => setActionDone(null), 2500);
  }

  function handleDirectRequestChanges(reviewId) {
    if (!canApprove) return;
    const note = directorFeedback || "Refine lighting balance on primary subject.";
    requestChanges(reviewId, note);
    setActionDone("Changes Requested");
    setTimeout(() => setActionDone(null), 2500);
  }

  return (
    <div className="page shot-detail-page">
      {/* Real-time Previz Viewer Modal */}
      {showPreviewModal && (
        <RealtimePreviewModal
          isOpen={true}
          onClose={() => setShowPreviewModal(false)}
          shot={shot}
          onSubmitToKitsu={async (sId, ver, note) => {
            await submitToKitsuReview({ shotId: sId, version: ver, feedback: note });
            setGitToast("Playblast queued in Kitsu Review portal!");
            setTimeout(() => setGitToast(null), 3000);
          }}
          onCommitGit={async (sId) => {
            await commitToGitLfs({ shotId: sId, message: "Previz playblast check-in", dccTool: shot.dccTool });
            setGitToast("Previz iteration committed to Git LFS!");
            setTimeout(() => setGitToast(null), 3000);
          }}
        />
      )}

      {/* Submit Version Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => setShowVersionModal(false)}
        title={`Submit Version for Review — ${shot.id}`}
      >
        <div className="modal-form">
          <label className="form-label">
            Version Tag
            <input
              className="form-input"
              value={versionInput}
              onChange={(e) => setVersionInput(e.target.value)}
              placeholder="e.g. v05"
            />
          </label>
          <label className="form-label">
            Submission Notes & Changelog
            <textarea
              className="form-textarea"
              rows={3}
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="Describe adjustments made (e.g. rim lighting tweaked, contrast balanced)..."
            />
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={() => setShowVersionModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="modal-submit-btn"
              onClick={handleSubmitVersion}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <Send size={15} /> Submit to Director Queue
            </button>
          </div>
        </div>
      </Modal>

      {/* Block Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title={`Flag Shot as Blocked — ${shot.id}`}
      >
        <div className="modal-form">
          <p className="modal-description">
            Flag this shot as blocked to notify the production lead and team.
          </p>
          <label className="form-label">
            Block Reason / Dependency
            <input
              className="form-input"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Waiting for Forest Environment v05 approval"
            />
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={() => setShowBlockModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="modal-submit-btn btn-danger"
              onClick={handleToggleBlock}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <AlertOctagon size={15} /> Confirm Block
            </button>
          </div>
        </div>
      </Modal>

      {/* Top Navigation */}
      <div style={{ marginBottom: "14px" }}>
        <button type="button" className="back-link-btn" onClick={() => navigate("/shots")} style={{ margin: 0 }}>
          <ArrowLeft size={14} /> <span>Back to Shot List</span>
        </button>
      </div>

      {/* Artist Seat Notice if viewing another artist's shot */}
      {isArtist && !isAssignedArtist && (
        <div className="rbac-notice-banner info">
          <ShieldCheck size={16} />
          <span>
            <strong>Read-Only Workspace:</strong> This shot is assigned to{" "}
            <strong>{getArtistName(shot.artistId)}</strong>. Switch artist seats in the TopBar to execute tasks.
          </span>
        </div>
      )}

      {/* Hero Shot Banner */}
      <div className="shot-detail-banner">
        <div className="shot-banner-main">
          <div className="shot-title-row">
            <h1>
              {shot.id} — {shot.name}
            </h1>
            <Badge
              variant={
                shot.status === "Blocked"
                  ? "danger"
                  : shot.status === "Review"
                  ? "warn"
                  : shot.status === "Completed"
                  ? "ok"
                  : "info"
              }
              text={shot.status}
            />
          </div>
          <p className="shot-banner-desc">{shot.description}</p>

          <div className="shot-meta-grid">
            <div className="meta-box">
              <span className="meta-label">Project</span>
              <strong>{project?.name || "—"}</strong>
            </div>
            <div className="meta-box">
              <span className="meta-label">Assigned Artist</span>
              <strong>{getArtistName(shot.artistId)}</strong>
            </div>
            <div className="meta-box">
              <span className="meta-label">Priority</span>
              <span className={`badge badge-${shot.priority.toLowerCase()}`}>
                {shot.priority}
              </span>
            </div>
            <div className="meta-box">
              <span className="meta-label">Due Date</span>
              <strong>{shot.dueDate || "Sep 15"}</strong>
            </div>
            <div className="meta-box">
              <span className="meta-label">Active Version</span>
              <strong className="version-pill">v{shot.version || "01"}</strong>
            </div>
            <div className="meta-box">
              <span className="meta-label">DCC Tool</span>
              <strong className="dcc-tag-pill">{shot.dccTool || "Blender"}</strong>
            </div>
            {shot.gitHash && (
              <div className="meta-box" onClick={() => navigate("/git-lfs")} style={{ cursor: "pointer" }} title="Inspect in Git LFS">
                <span className="meta-label">Git LFS Hash</span>
                <strong className="git-hash-pill"><GitCommit size={11} /> {shot.gitHash}</strong>
              </div>
            )}
            {shot.kitsuId && (
              <div className="meta-box" onClick={() => navigate("/reviews")} style={{ cursor: "pointer" }} title="Open Kitsu Review">
                <span className="meta-label">Kitsu Review</span>
                <strong className="kitsu-ticket-tag"><MessageSquareCheck size={11} /> {shot.kitsuId}</strong>
              </div>
            )}
          </div>
        </div>

        <div className="shot-banner-progress">
          <div className="progress-number">{shot.progress}%</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${shot.progress}%` }}
            />
          </div>
          <span className="progress-caption">Current Stage Progress</span>
        </div>
      </div>

      {/* Dependency Warning Banner */}
      {hasUnapprovedDeps && shot.status === "Blocked" && (
        <div className="dependency-alert-banner">
          <AlertOctagon size={22} className="dep-icon-svg" style={{ color: "var(--danger)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>BLOCKED ON UNAPPROVED ASSET DEPENDENCY</strong>
            <p style={{ margin: "4px 0 0" }}>
              Waiting for asset sign-off:{" "}
              {unapprovedAssets.map((a) => `${a.name} (${a.status})`).join(", ")}
            </p>
          </div>
          {canApprove ? (
            <button
              type="button"
              className="panel-action"
              onClick={() => navigate("/assets")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Sign-Off Assets <ExternalLink size={14} />
            </button>
          ) : (
            <button
              type="button"
              className="panel-action"
              onClick={() => navigate("/assets")}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              Inspect Assets <ExternalLink size={14} />
            </button>
          )}
        </div>
      )}

      {gitToast && (
        <div className="arch-toast-bar">
          <CheckCircle2 size={16} />
          <span>{gitToast}</span>
        </div>
      )}

      {/* Activity Flow Stepper (Slide 7 Activity Diagram) */}
      <section className="panel activity-flow-panel">
        <div className="panel-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2>Production Activity Flow (Slide 7)</h2>
              <span className="slide-ref-pill">Step {shot.activityStep || 4} of 6</span>
            </div>
            <p>6-step sequential pipeline lifecycle: Create Task → DCC Work → Commit (Git LFS) → Real-Time Previz → Kitsu Review → Approve</p>
          </div>
          <button
            type="button"
            className="panel-action"
            onClick={() => navigate("/architecture")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Full Architecture & DFD <ExternalLink size={13} />
          </button>
        </div>

        <div className="activity-stepper-strip">
          {[
            { step: 1, title: "1. Create Task", icon: CheckSquare },
            { step: 2, title: "2. DCC Work", icon: Boxes },
            { step: 3, title: "3. Commit (LFS)", icon: GitCommit },
            { step: 4, title: "4. Real-time Previz", icon: PlaySquare },
            { step: 5, title: "5. Review in Kitsu", icon: MessageSquareCheck },
            { step: 6, title: "6. Approve & Output", icon: CheckCircle2 },
          ].map((st) => {
            const currentStepNum = shot.activityStep || (shot.status === "Completed" ? 6 : 4);
            const isDone = currentStepNum > st.step;
            const isCur = currentStepNum === st.step;
            const Icon = st.icon;

            return (
              <div
                key={st.step}
                className={`stepper-node-item ${isDone ? "done" : isCur ? "current" : "pending"}`}
              >
                <div className="stepper-circle">
                  {isDone ? <Check size={13} strokeWidth={3} /> : <Icon size={14} />}
                </div>
                <span className="stepper-title">{st.title}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Stepper Action Strip */}
        <div className="stepper-actions-bar">
          <button
            type="button"
            className="btn-stepper-action previz-btn"
            onClick={() => setShowPreviewModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <PlaySquare size={14} /> Launch Unreal Previz Viewport
          </button>
          <button
            type="button"
            className="btn-stepper-action git-btn"
            onClick={() => navigate("/git-lfs")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <GitCommit size={14} /> Commit Version (Git LFS)
          </button>
          <button
            type="button"
            className="btn-stepper-action kitsu-btn"
            onClick={() => navigate("/reviews")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <MessageSquareCheck size={14} /> Open in Kitsu Review
          </button>
        </div>
      </section>

      {/* 1. Workflow Progress */}
      <section className="panel workflow-progress-panel">
        <div className="panel-header">
          <div>
            <h2>Workflow Progress</h2>
            <p>Stage status tracking along {workflow?.name} pipeline</p>
          </div>
        </div>

        <div className="workflow-detail-wrap">
          {workflow && (
            <WorkflowStages
              stages={workflow.stages}
              currentStageId={shot.stageId}
              shotStatus={shot.status}
              size="large"
            />
          )}
        </div>
      </section>

      {/* 2. Current Task & Actions */}
      <section className="panel current-task-panel">
        <div className="panel-header">
          <div>
            <h2>Current Task Execution</h2>
            <p>Departmental assignment for active pipeline stage</p>
          </div>
        </div>

        {currentTask ? (
          <div className="task-detail-box">
            <div className="task-detail-info">
              <div>
                <h3 className="task-detail-title">{currentTask.name}</h3>
                <p className="task-detail-sub">
                  Assigned Artist: <strong>{getArtistName(currentTask.artistId)}</strong> · Target Due:{" "}
                  <strong>{currentTask.dueDate}</strong>
                </p>
              </div>
              <div className="task-detail-meta">
                <Badge
                  variant={currentTask.status === "Completed" ? "ok" : "info"}
                  text={currentTask.status}
                />
                <span className={`badge badge-${currentTask.priority.toLowerCase()}`}>
                  {currentTask.priority} Priority
                </span>
              </div>
            </div>

            {/* Core Action Buttons with RBAC protection */}
            <div className="task-action-buttons">
              {canExecute ? (
                <>
                  {currentTask.status !== "Completed" && (
                    <button
                      type="button"
                      className="btn-action-primary"
                      onClick={handleCompleteTask}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                    >
                      <CheckCircle2 size={16} /> Mark Complete & Advance Stage
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-action-secondary"
                    onClick={() => setShowVersionModal(true)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    <Send size={15} /> Submit for Review
                  </button>

                  {shot.status !== "Blocked" ? (
                    <button
                      type="button"
                      className="btn-action-block"
                      onClick={() => setShowBlockModal(true)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                    >
                      <AlertOctagon size={15} /> Flag as Blocked
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-action-unblock"
                      onClick={handleToggleBlock}
                      style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                    >
                      <Unlock size={15} /> Unblock Shot
                    </button>
                  )}
                </>
              ) : isDirector ? (
                <div className="rbac-context-note">
                  <ShieldCheck size={15} />
                  <span>Creative Director Mode: Artist tasks are executed by the assigned department artist. Use the Creative Sign-off section below to critique and approve versions.</span>
                </div>
              ) : (
                <div className="rbac-context-note">
                  <Lock size={15} />
                  <span>Task Execution Locked: Assigned to {getArtistName(shot.artistId)}. Only the assigned artist or production lead can advance this task.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="no-task-box">
            <p>All stage tasks completed. Shot is ready to advance.</p>
            {canExecute && (
              <button
                type="button"
                className="btn-action-secondary"
                onClick={() => setShowVersionModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <Send size={15} /> Submit New Version
              </button>
            )}
          </div>
        )}
      </section>

      {/* 3. Associated Assets */}
      <section className="panel assets-section">
        <div className="panel-header">
          <div>
            <h2>Assets Required ({shotAssets.length})</h2>
            <p>Character rigs, environments, props, and cameras used in this shot</p>
          </div>
          <button
            type="button"
            className="panel-action"
            onClick={() => navigate("/assets")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            Manage Assets <ExternalLink size={14} />
          </button>
        </div>

        <div className="assets-grid-mini">
          {shotAssets.map((asset) => (
            <div key={asset.id} className="asset-card-compact">
              <div className="asset-compact-top">
                <span className="asset-tag" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Box size={13} /> {asset.id}
                </span>
                <Badge
                  variant={asset.status === "Approved" ? "ok" : "warn"}
                  text={asset.status}
                />
              </div>
              <h4 className="asset-compact-name">{asset.name}</h4>
              <div className="asset-compact-meta">
                <span>Version: <strong>{asset.version}</strong></span>
                <span>Type: {asset.type || asset.category}</span>
                <span>Owner: {asset.owner || "Team"}</span>
              </div>
            </div>
          ))}

          {shotAssets.length === 0 && (
            <div className="empty-shots">No specific asset dependencies assigned.</div>
          )}
        </div>
      </section>

      {/* 4. Review & Approval History (RBAC Gated) */}
      <section className="panel review-history-panel">
        <div className="panel-header">
          <div>
            <h2>Creative Review & Approvals</h2>
            <p>Director sign-off queue and artistic revision notes</p>
          </div>
          {canExecute && (
            <button
              type="button"
              className="panel-action"
              onClick={() => setShowVersionModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Send size={14} /> Submit New Version
            </button>
          )}
        </div>

        {latestReview ? (
          <div className="review-highlight-card">
            <div className="review-highlight-top">
              <div className="review-highlight-meta-row">
                <span className="review-version-pill">Version {latestReview.version}</span>
                <span className="review-reviewer-pill">
                  Reviewed by: <strong>{latestReview.reviewerId || "Creative Director"}</strong>
                </span>
              </div>
              <Badge
                variant={
                  latestReview.status === "Approved"
                    ? "ok"
                    : latestReview.status === "Changes Requested"
                    ? "danger"
                    : "warn"
                }
                text={latestReview.status}
              />
            </div>

            <div className="review-feedback-container">
              <div className="feedback-icon-wrap">
                <MessageSquare size={16} />
              </div>
              <div className="feedback-text-content">
                <p className="feedback-body-text">
                  "{latestReview.feedback || "Awaiting director review notes."}"
                </p>
              </div>
            </div>

            {/* Direct Director Sign-Off inside ShotDetail */}
            {canApprove && latestReview.status === "Pending Review" && (
              <div className="director-inline-approval-box">
                <label className="director-input-label">Director Revision Notes (Optional):</label>
                <input
                  className="form-input"
                  value={directorFeedback}
                  onChange={(e) => setDirectorFeedback(e.target.value)}
                  placeholder="Enter revision notes or approval remarks..."
                  style={{ marginBottom: "12px" }}
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn-director-action request-changes"
                    onClick={() => handleDirectRequestChanges(latestReview.id)}
                  >
                    <RotateCcw size={13} /> Request Changes
                  </button>
                  <button
                    type="button"
                    className="btn-director-action approve"
                    onClick={() => handleDirectApprove(latestReview.id)}
                  >
                    <CheckCircle2 size={14} /> Approve & Advance Stage
                  </button>
                  {actionDone && (
                    <span className="director-success-flash">✓ {actionDone}!</span>
                  )}
                </div>
              </div>
            )}

            <div className="review-highlight-footer">
              <div className="review-footer-left">
                <Clock size={13} />
                <span>Submitted: {latestReview.date ? new Date(latestReview.date).toLocaleDateString() : "Today"}</span>
              </div>
              {latestReview.status === "Pending Review" && (
                <button
                  type="button"
                  className="review-goto-btn"
                  onClick={() => navigate("/reviews")}
                >
                  <span>{canApprove ? "Go to Director Queue" : "View in Reviews"}</span>
                  <ExternalLink size={13} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-shots">
            No versions submitted for review yet. Click "Submit for Review" to queue a version.
          </div>
        )}
      </section>

      {/* 5. Chronological Shot Activity */}
      <section className="panel activity-section">
        <div className="panel-header">
          <div>
            <h2>Shot Timeline & Audit Trail</h2>
            <p>Logged pipeline events for {shot.id}</p>
          </div>
        </div>

        <div className="shot-timeline-list">
          {shotActivities.slice(0, 5).map((act) => (
            <div key={act.id} className="timeline-event-card">
              <div className={`timeline-indicator-bubble type-${act.type}`}>
                <span className="indicator-core" />
              </div>
              <div className="timeline-event-body">
                <div className="timeline-event-header">
                  <strong className="timeline-event-title">{act.text}</strong>
                  <span className="timeline-event-timestamp">
                    <Clock size={11} /> {formatActivityTime(act.time)}
                  </span>
                </div>
                {act.detail && <p className="timeline-event-desc">{act.detail}</p>}
              </div>
            </div>
          ))}

          {shotActivities.length === 0 && (
            <div className="empty-shots">No activity logged for this shot yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}