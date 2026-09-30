import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Badge } from "../components/common/Badge";
import { RealtimePreviewModal } from "../components/common/RealtimePreviewModal";
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  PlaySquare,
  Sparkles,
  Tv,
  MessageSquareCheck,
  Send,
  Plus,
  GitCommit,
  User,
  Layers,
} from "lucide-react";

export function Reviews() {
  const navigate = useNavigate();
  const {
    reviews,
    kitsuReviews,
    shots,
    getShot,
    getProject,
    getWorkflow,
    approveReview,
    requestChanges,
    approveInKitsu,
    requestChangesInKitsu,
    addKitsuAnnotation,
    submitToKitsuReview,
    commitToGitLfs,
    role,
    currentUser,
    canApprove: ctxCanApprove,
  } = useProduction();

  const isLead = currentUser?.role === "productionLead" || role === "productionLead";
  const isDirector = currentUser?.role === "director" || role === "director";
  const isArtist = currentUser?.role === "artist" || role === "artist";
  const canApprove = isDirector || isLead || (ctxCanApprove ? ctxCanApprove() : false);

  const [viewScope, setViewScope] = useState(isArtist ? "my" : "all");
  const [statusFilter, setStatusFilter] = useState(
    isDirector ? "Pending Review" : "All"
  );
  const [feedbackMap, setFeedbackMap] = useState({});
  const [actionSuccess, setActionSuccess] = useState({});
  const [previewShot, setPreviewShot] = useState(null);
  const [newAnnotationText, setNewAnnotationText] = useState({});
  const [newAnnotationFrame, setNewAnnotationFrame] = useState({});

  useEffect(() => {
    if (isArtist) {
      setViewScope("my");
    } else {
      setViewScope("all");
    }
  }, [currentUser?.id, isArtist]);

  const filterTabs = ["Pending Review", "Changes Requested", "Approved", "All"];

  // Merge standard reviews and kitsuReviews so user sees all items
  const combinedReviews = [...(kitsuReviews || [])];
  reviews.forEach((r) => {
    if (!combinedReviews.some((kr) => kr.id === r.id || kr.shotId === r.shotId)) {
      combinedReviews.push({
        ...r,
        kitsuId: `KT-${r.id.replace(/\D/g, "") || "8400"}`,
        syncStatus: "Synchronized",
        annotations: [],
      });
    }
  });

  const currentUserId = (currentUser?.id || "").toLowerCase();

  const myAccessibleReviews = combinedReviews.filter((r) => {
    const shot = getShot(r.shotId);
    const sArtist = (shot?.artistId || "").toLowerCase();
    return sArtist === currentUserId || sArtist.includes(currentUserId);
  });

  const baseReviews = viewScope === "my" ? myAccessibleReviews : combinedReviews;

  const filteredReviews = baseReviews.filter((r) => {
    if (statusFilter === "All") return true;
    return r.status === statusFilter;
  });

  function handleApprove(review) {
    if (!canApprove) return;
    const note = feedbackMap[review.id] || "Director sign-off approved for final delivery.";
    if (review.id.startsWith("KT-REV") || review.kitsuId) {
      approveInKitsu(review.id, note);
    } else {
      approveReview(review.id);
    }

    setActionSuccess((prev) => ({ ...prev, [review.id]: "Approved in Kitsu" }));
    setTimeout(() => {
      setActionSuccess((prev) => {
        const copy = { ...prev };
        delete copy[review.id];
        return copy;
      });
    }, 2500);
  }

  function handleRequestChanges(review) {
    if (!canApprove) return;
    const feedback = feedbackMap[review.id] || "Adjust lighting contrast and smooth camera curve.";
    if (review.id.startsWith("KT-REV") || review.kitsuId) {
      requestChangesInKitsu(review.id, feedback);
    } else {
      requestChanges(review.id, feedback);
    }

    setActionSuccess((prev) => ({ ...prev, [review.id]: "Changes Requested" }));
    setTimeout(() => {
      setActionSuccess((prev) => {
        const copy = { ...prev };
        delete copy[review.id];
        return copy;
      });
    }, 2500);
  }

  function handleAddAnnotation(reviewId) {
    const text = newAnnotationText[reviewId];
    if (!text) return;
    const frame = Number(newAnnotationFrame[reviewId]) || 48;
    const seconds = Math.floor(frame / 24);
    const ff = frame % 24;
    const tc = `00:${String(seconds).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;

    addKitsuAnnotation(reviewId, {
      frame,
      timecode: tc,
      text,
      author: currentUser?.id || (canApprove ? "director" : "artist"),
      authorRole: currentUser?.title || (canApprove ? "Creative Director" : "Artist"),
    });

    setNewAnnotationText({ ...newAnnotationText, [reviewId]: "" });
    setNewAnnotationFrame({ ...newAnnotationFrame, [reviewId]: "" });
  }

  const pendingCount = baseReviews.filter((r) => r.status === "Pending Review").length;
  const approvedCount = baseReviews.filter((r) => r.status === "Approved").length;
  const changesCount = baseReviews.filter((r) => r.status === "Changes Requested").length;

  return (
    <div className="page reviews-page">
      {/* Real-time Previz Viewer Modal */}
      {previewShot && (
        <RealtimePreviewModal
          isOpen={true}
          onClose={() => setPreviewShot(null)}
          shot={previewShot}
          onSubmitToKitsu={async (sId, ver, note) => {
            await submitToKitsuReview({ shotId: sId, version: ver, feedback: note });
          }}
          onCommitGit={async (sId) => {
            await commitToGitLfs({ shotId: sId, message: "Previz playblast check-in" });
          }}
        />
      )}

      <div className="page-header">
        <div className="page-header-main">
          <h1>Creative Review & Approval</h1>
          <p className="page-subtitle">
            {isArtist
              ? "Review director feedback, timecode annotations, and revision notes"
              : "Creative director sign-off, timecoded annotations, and version approvals"}
          </p>
        </div>

        {/* View Scope Switcher for User Accessibility */}
        <div className="view-scope-switcher">
          <button
            type="button"
            className={`scope-pill-btn ${viewScope === "my" ? "active" : ""}`}
            onClick={() => {
              setViewScope("my");
              setStatusFilter("All");
            }}
          >
            <User size={14} /> My Reviews ({myAccessibleReviews.length})
          </button>
          <button
            type="button"
            className={`scope-pill-btn ${viewScope === "all" ? "active" : ""}`}
            onClick={() => setViewScope("all")}
          >
            <Layers size={14} /> All Reviews ({combinedReviews.length})
          </button>
        </div>
      </div>

      {/* Artist Read-Only Warning Notice */}
      {isArtist && (
        <div className="rbac-notice-banner">
          <AlertCircle size={16} />
          <span>
            <strong>Artist Permissions:</strong> You are viewing director submissions in read-only mode.
            Final sign-off and stage advance permissions are restricted to Creative Directors.
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card tone-warning">
          <div className="stat-card-top">
            <p>Awaiting Sign-Off</p>
            <span className="stat-icon-lucide"><Clock size={18} /></span>
          </div>
          <strong>{pendingCount}</strong>
          <span className="stat-change">Immediate director review needed</span>
        </div>
        <div className="stat-card tone-ok">
          <div className="stat-card-top">
            <p>Approved Versions</p>
            <span className="stat-icon-lucide"><CheckCircle2 size={18} /></span>
          </div>
          <strong>{approvedCount}</strong>
          <span className="stat-change">Advanced to downstream pipeline stages</span>
        </div>
        <div className="stat-card tone-danger">
          <div className="stat-card-top">
            <p>Changes Requested</p>
            <span className="stat-icon-lucide"><RotateCcw size={18} /></span>
          </div>
          <strong>{changesCount}</strong>
          <span className="stat-change">Active revision notes sent to artists</span>
        </div>
      </div>

      {/* Filter Tabs in Unified Toolbar */}
      <div className="studio-toolbar">
        <div className="filter-chips-group">
          {filterTabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={`filter-chip-btn ${statusFilter === tab ? "active" : ""}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Review Queue Cards */}
      <div className="review-cards-list">
        {filteredReviews.map((review) => {
          const shot = getShot(review.shotId);
          const project = shot ? getProject(shot.projectId) : null;
          const wf = shot ? getWorkflow(shot.projectId) : null;
          const stageName =
            wf?.stages.find((st) => st.id === shot?.stageId)?.name || shot?.stageId || "Review";

          const hasAnnotations = review.annotations && review.annotations.length > 0;

          return (
            <div key={review.id} className="review-card-interactive kitsu-enhanced-card">
              <div className="review-card-topbar">
                <div className="review-shot-summary">
                  <span
                    className="review-shot-tag"
                    onClick={() => navigate(`/shots/${review.shotId}`)}
                    title="Open shot details"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    {review.shotId} <ExternalLink size={12} />
                  </span>
                  <div>
                    <h3 className="review-card-shot-name">
                      {shot?.name || "Production Shot"}
                    </h3>
                    <p className="review-card-project-sub">
                      Production: <strong>{project?.name || "Mystic Island"}</strong> · Active Stage:{" "}
                      <strong>{stageName}</strong> · Tool: <strong>{shot?.dccTool || "Blender"}</strong>
                    </p>
                  </div>
                </div>

                <div className="review-status-col">
                  {/* Kitsu ID pill */}
                  <span className="kitsu-ticket-tag">
                    <MessageSquareCheck size={12} /> {review.kitsuId || "KT-8491"}
                  </span>
                  <Badge
                    variant={
                      review.status === "Approved"
                        ? "ok"
                        : review.status === "Changes Requested"
                        ? "danger"
                        : "warn"
                    }
                    text={review.status}
                  />
                  <span className="review-version-tag">Version {review.version}</span>
                </div>
              </div>

              {/* Real-time Playblast Preview Bar */}
              <div className="kitsu-preview-strip">
                <div className="preview-strip-left">
                  <div className="playblast-thumb-box" onClick={() => shot && setPreviewShot(shot)}>
                    <Tv size={20} />
                    <span className="playblast-play-icon">▶</span>
                  </div>
                  <div>
                    <strong>Unreal Engine Sequencer Real-Time Previz</strong>
                    <p>60 FPS Lumen render pass · Timecode: {review.timecode || "01:00:04:12"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-launch-previewer"
                  onClick={() => shot && setPreviewShot(shot)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <PlaySquare size={14} /> Launch Real-Time Viewport
                </button>
              </div>

              {/* Timecoded Annotations List */}
              {hasAnnotations && (
                <div className="kitsu-annotations-section">
                  <h4 className="annotations-title">
                    <MessageSquare size={14} /> Kitsu Timecoded Annotations ({review.annotations.length})
                  </h4>
                  <div className="annotations-list">
                    {review.annotations.map((ann) => (
                      <div key={ann.id} className="annotation-item">
                        <span className="ann-timecode-badge">
                          Frame {ann.frame} ({ann.timecode})
                        </span>
                        <div className="ann-body">
                          <strong>{ann.authorRole || ann.author}:</strong>
                          <p>{ann.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Annotation Form */}
              <div className="kitsu-add-annotation-box">
                <div className="add-annotation-inputs">
                  <input
                    type="number"
                    placeholder="Frame #"
                    className="ann-frame-input"
                    value={newAnnotationFrame[review.id] || ""}
                    onChange={(e) =>
                      setNewAnnotationFrame({ ...newAnnotationFrame, [review.id]: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Add frame-specific critique for artist (e.g. increase rim light specular)..."
                    className="ann-text-input"
                    value={newAnnotationText[review.id] || ""}
                    onChange={(e) =>
                      setNewAnnotationText({ ...newAnnotationText, [review.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddAnnotation(review.id);
                    }}
                  />
                  <button
                    type="button"
                    className="btn-add-ann"
                    onClick={() => handleAddAnnotation(review.id)}
                    title="Add annotation to this frame"
                  >
                    <Plus size={14} /> Add Note
                  </button>
                </div>
              </div>

              {/* Feedback Content */}
              <div className="review-body-section">
                <label className="review-input-label">Director Feedback & Remarks:</label>
                {canApprove ? (
                  <textarea
                    className="review-textarea"
                    rows={2}
                    value={
                      feedbackMap[review.id] !== undefined
                        ? feedbackMap[review.id]
                        : review.feedback || ""
                    }
                    onChange={(e) =>
                      setFeedbackMap({ ...feedbackMap, [review.id]: e.target.value })
                    }
                    placeholder="Enter notes for the artist before approving or requesting changes..."
                  />
                ) : (
                  <div className="review-feedback-readonly">
                    <p>{review.feedback || "Awaiting director review comments."}</p>
                  </div>
                )}
              </div>

              {/* Actions Bar */}
              <div className="review-card-actions-bar">
                <div className="review-actions-left">
                  <span className="review-date-str" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} /> Submitted:{" "}
                    {review.date ? new Date(review.date).toLocaleDateString() : "Today"}
                  </span>
                  {actionSuccess[review.id] && (
                    <span className="action-success-flash" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <CheckCircle2 size={14} /> {actionSuccess[review.id]}! Workflow updated.
                    </span>
                  )}
                </div>

                <div className="review-actions-buttons">
                  {canApprove ? (
                    <>
                      <button
                        type="button"
                        className="btn-request-changes"
                        onClick={() => handleRequestChanges(review)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <RotateCcw size={14} /> Request Changes in Kitsu
                      </button>
                      <button
                        type="button"
                        className="btn-approve-review"
                        onClick={() => handleApprove(review)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                      >
                        <CheckCircle2 size={15} /> Approve & Final Output
                      </button>
                    </>
                  ) : (
                    <div className="rbac-disabled-badge">
                      <ShieldCheck size={13} />
                      <span>Director Sign-off Required</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredReviews.length === 0 && (
          <div className="empty-shots">No reviews in "{statusFilter}" queue.</div>
        )}
      </div>
    </div>
  );
}