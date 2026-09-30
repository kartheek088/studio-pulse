import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { WorkflowStages } from "../components/common/WorkflowStages";
import { Badge } from "../components/common/Badge";
import { RealtimePreviewModal } from "../components/common/RealtimePreviewModal";
import {
  ArrowLeft,
  ArrowRight,
  GitMerge,
  Film,
  Calendar,
  CheckCircle2,
  GitCommit,
  MessageSquareCheck,
  PlaySquare,
  HardDrive,
  ExternalLink,
} from "lucide-react";

export function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    shots,
    getProject,
    getWorkflow,
    getArtistName,
    commitToGitLfs,
    submitToKitsuReview,
  } = useProduction();

  const [previewShot, setPreviewShot] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  function triggerToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const project = getProject(projectId) || projects.find((p) => p.id === projectId);
  const workflow = getWorkflow(project?.workflowId);
  const projectShots = shots.filter((s) => s.projectId === projectId);

  if (!project) {
    return (
      <div className="page project-detail-page">
        <div className="page-header">
          <button type="button" className="back-link-btn" onClick={() => navigate("/projects")}>
            <ArrowLeft size={14} />
            <span>Back to Projects</span>
          </button>
          <h1>Project Not Found</h1>
        </div>
        <div className="empty-shots">The requested project ID does not exist.</div>
      </div>
    );
  }

  // Count shots at each stage
  const stageCounts = {};
  projectShots.forEach((s) => {
    stageCounts[s.stageId] = (stageCounts[s.stageId] || 0) + 1;
  });

  const activeStage =
    projectShots.find((s) => s.status === "In Progress" || s.status === "Review")?.stageId ||
    workflow?.stages?.[1]?.id ||
    "realtime-previz";

  return (
    <div className="page project-detail-page">
      {/* Real-time Previz Modal */}
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
              message: "Previz review check-in",
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
          <button type="button" className="back-link-btn" onClick={() => navigate("/projects")}>
            <ArrowLeft size={14} />
            <span>Back to Projects</span>
          </button>
          <h1>{project.name}</h1>
          <p className="page-subtitle">
            Client: <strong>{project.client}</strong> · Pipeline:{" "}
            <strong>{workflow?.name}</strong> · Deadline: <strong>{project.deadline}</strong>
          </p>
        </div>
      </div>

      {/* Project Header Banner */}
      <div className="project-detail-banner">
        <div className="project-banner-info">
          <h2>{project.name}</h2>
          <p className="project-banner-sub">
            {project.type} Production · Directed for {project.client}
          </p>
          <div className="project-banner-meta">
            <div className="meta-badge-box">
              <span className="meta-title">Status</span>
              <Badge
                variant={project.health.toLowerCase() === "healthy" ? "ok" : "warn"}
                text={project.status}
              />
            </div>
            <div className="meta-badge-box">
              <span className="meta-title">Health</span>
              <span className={`health-indicator ${project.health.toLowerCase()}`}>
                ● {project.health}
              </span>
            </div>
            <div className="meta-badge-box">
              <span className="meta-title">Total Shots</span>
              <strong>{projectShots.length}</strong>
            </div>
            <div className="meta-badge-box">
              <span className="meta-title">Deadline</span>
              <strong>{project.deadline}</strong>
            </div>
          </div>
        </div>

        <div className="project-banner-progress">
          <div className="progress-value-huge">{project.progress}%</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="progress-legend">Overall Project Completion</span>
        </div>
      </div>


      {/* Workflow Section */}
      <section className="panel workflow-section">
        <div className="panel-header">
          <div>
            <h2>Production Workflow</h2>
            <p>{workflow?.name} Sequential Stages & Shot Distribution</p>
          </div>
          <button
            type="button"
            className="panel-action-btn"
            onClick={() => navigate("/workflow")}
          >
            <span>Open Kanban Board</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="workflow-detail-wrap">
          {workflow && (
            <WorkflowStages
              stages={workflow.stages}
              currentStageId={activeStage}
              shotStatus="In Progress"
              size="large"
            />
          )}

          <div className="workflow-legend-row">
            {workflow?.stages.map((stage) => {
              const count = stageCounts[stage.id] || 0;
              return (
                <div key={stage.id} className="wf-legend-chip">
                  <span className="wf-legend-name">{stage.name}</span>
                  {stage.subtitle && (
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "4px" }}>
                      ({stage.subtitle.split(" ")[0]})
                    </span>
                  )}
                  <span className={`wf-legend-count ${count > 0 ? "has-shots" : ""}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Shots List Table */}
      <section className="panel shots-section">
        <div className="panel-header">
          <div>
            <h2>Shots in Production</h2>
            <p>{projectShots.length} shots assigned in this project</p>
          </div>
          <button type="button" className="panel-action-btn" onClick={() => navigate("/shots")}>
            <span>View all in shot list</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="shots-table-container">
          <table>
            <thead>
              <tr>
                <th>SHOT ID</th>
                <th>DESCRIPTION</th>
                <th>STAGE</th>
                <th>DCC TOOL</th>
                <th>GIT LFS / KITSU</th>
                <th>ARTIST</th>
                <th>PROGRESS</th>
                <th>STATUS</th>
                <th>PREVIZ</th>
              </tr>
            </thead>
            <tbody>
              {projectShots.map((shot) => {
                const stageName =
                  workflow?.stages.find((st) => st.id === shot.stageId)?.name ||
                  shot.stageId;
                return (
                  <tr
                    key={shot.id}
                    onClick={() => navigate(`/shots/${shot.id}`)}
                    className="shot-row"
                  >
                    <td>
                      <strong className="shot-id-tag">{shot.id}</strong>
                    </td>
                    <td>{shot.name}</td>
                    <td>
                      <span className="stage-pill">{stageName}</span>
                    </td>
                    <td>
                      <span className="dcc-tag-pill">{shot.dccTool || "Blender"}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "5px" }}>
                        {shot.gitHash && (
                          <span
                            className="git-hash-pill"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/git-lfs");
                            }}
                            title="Inspect in Git LFS"
                          >
                            <GitCommit size={10} /> {shot.gitHash}
                          </span>
                        )}
                        {shot.kitsuId && (
                          <span
                            className="kitsu-ticket-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/reviews");
                            }}
                            title="Open Kitsu Review"
                          >
                            <MessageSquareCheck size={10} /> {shot.kitsuId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{getArtistName(shot.artistId)}</td>
                    <td>
                      <div className="shot-progress-cell">
                        <div className="progress-bar mini">
                          <div
                            className="progress-fill"
                            style={{ width: `${shot.progress}%` }}
                          />
                        </div>
                        <span className="mini-progress-val">{shot.progress}%</span>
                      </div>
                    </td>
                    <td>
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
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-quick-previz"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewShot(shot);
                        }}
                        title="Launch Real-time Unreal Previz"
                      >
                        <PlaySquare size={12} /> Previz
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}