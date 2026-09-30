import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { WorkflowStages } from "../components/common/WorkflowStages";
import { Badge } from "../components/common/Badge";
import { ArrowRight, User, Layers, CheckCircle2, Clock, AlertTriangle, GitMerge, ExternalLink, Tv, GitCommit, MessageSquareCheck } from "lucide-react";

export function Workflow() {
  const navigate = useNavigate();
  const {
    projects,
    shots,
    getWorkflow,
    getProject,
    getArtistName,
    moveShotToStage,
    updateShotStatus,
    currentUser,
    role,
    currentArtist,
  } = useProduction();

  const [selectedProjectId, setSelectedProjectId] = useState("p1");
  const [kanbanFilter, setKanbanFilter] = useState("All");

  const isLead = currentUser?.role === "productionLead" || role === "productionLead";
  const isDirector = currentUser?.role === "director" || role === "director";
  const currentUserId = (currentUser?.id || currentArtist || "").toLowerCase();

  const project = getProject(selectedProjectId) || projects[0];
  const workflow = getWorkflow(project?.workflowId);
  const projectShots = shots.filter((s) => s.projectId === project?.id);

  const myAssignedShots = projectShots.filter((s) => {
    const sArtist = (s.artistId || "").toLowerCase();
    return sArtist === currentUserId || sArtist.includes(currentUserId);
  });

  const [viewScope, setViewScope] = useState(isLead || isDirector ? "all" : "my");

  const displayedShots = viewScope === "my" && myAssignedShots.length > 0 ? myAssignedShots : projectShots;

  const KANBAN_COLUMNS = [
    { key: "Not Started", label: "Not Started", color: "neutral" },
    { key: "In Progress", label: "In Progress", color: "info" },
    { key: "Review", label: "Review", color: "warning" },
    { key: "Blocked", label: "Blocked", color: "danger" },
    { key: "Completed", label: "Completed", color: "ok" },
  ];

  function getStageName(stageId) {
    return workflow?.stages.find((s) => s.id === stageId)?.name || stageId;
  }

  function handleAdvanceStage(shot, e) {
    e.stopPropagation();
    if (!workflow || !workflow.stages) return;
    const currentIdx = workflow.stages.findIndex((st) => st.id === shot.stageId);
    if (currentIdx < workflow.stages.length - 1) {
      const nextStage = workflow.stages[currentIdx + 1];
      moveShotToStage(shot.id, nextStage.id);
    }
  }

  function handleStatusChange(shotId, newStatus, e) {
    e.stopPropagation();
    updateShotStatus(shotId, newStatus);
  }

  return (
    <div className="page workflow-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1>Workflow Tracker</h1>
          <p className="page-subtitle">
            Monitor sequential stage progression and move shots across production statuses in real time.
          </p>
        </div>
      </div>

      {/* Project Switcher Toolbar */}
      <div className="studio-toolbar">
        <div className="project-switcher-tabs">
          {projects.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`project-tab-btn ${selectedProjectId === p.id ? "active" : ""}`}
              onClick={() => setSelectedProjectId(p.id)}
            >
              <span className="tab-name">{p.name}</span>
              <span className="tab-type">{p.type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Linear Pipeline Stages Banner */}
      {workflow && (
        <section className="panel workflow-tracker-panel">
          <div className="panel-header">
            <div>
              <h2>{workflow.name} Pipeline Stages</h2>
              <p>
                {workflow.stages.length} stages · {projectShots.length} shots assigned in{" "}
                {project?.name}
              </p>
            </div>
            <span className="template-badge">{workflow.type} Pipeline Template</span>
          </div>

          <div className="workflow-container">
            <WorkflowStages
              stages={workflow.stages}
              currentStageId={
                projectShots.find((s) => s.status === "In Progress" || s.status === "Review")
                  ?.stageId || workflow.stages[3]?.id
              }
              shotStatus="In Progress"
              size="large"
            />

            <div className="workflow-stage-metrics">
              {workflow.stages.map((stage) => {
                const count = projectShots.filter((s) => s.stageId === stage.id).length;
                return (
                  <div key={stage.id} className="stage-metric-box">
                    <span className="stage-metric-name">{stage.name}</span>
                    <span className={`stage-metric-count ${count > 0 ? "active" : ""}`}>
                      {count} shot{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Kanban Board */}
      <section className="panel kanban-panel">
        <div className="panel-header">
          <div>
            <h2>Production Status Board</h2>
            <p>Directly transition shot statuses or advance to subsequent workflow stages</p>
          </div>
          <div className="filter-chips-group">
            {["All", ...KANBAN_COLUMNS.map((c) => c.key)].map((f) => (
              <button
                type="button"
                key={f}
                className={`filter-chip-btn ${kanbanFilter === f ? "active" : ""}`}
                onClick={() => setKanbanFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* View Scope Switcher for User Accessibility */}
        <div className="view-scope-switcher">
          <button
            type="button"
            className={`scope-pill-btn ${viewScope === "my" ? "active" : ""}`}
            onClick={() => setViewScope("my")}
          >
            <User size={14} /> My Assigned Shots ({myAssignedShots.length})
          </button>
          <button
            type="button"
            className={`scope-pill-btn ${viewScope === "all" ? "active" : ""}`}
            onClick={() => setViewScope("all")}
          >
            <Layers size={14} /> All Project Shots ({projectShots.length})
          </button>
        </div>

        <div className="kanban-columns">
          {KANBAN_COLUMNS.map((col) => {
            if (kanbanFilter !== "All" && kanbanFilter !== col.key) return null;

            const colShots = displayedShots.filter((s) => s.status === col.key);

            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-header-left">
                    <span className={`col-dot tone-${col.color}`} />
                    <h3>{col.label}</h3>
                  </div>
                  <span className="kanban-badge">{colShots.length}</span>
                </div>

                <div className="kanban-list">
                  {colShots.length === 0 && (
                    <div className="kanban-empty">No shots in {col.label}</div>
                  )}

                  {colShots.map((shot) => {
                    const stageIdx =
                      workflow?.stages?.findIndex((st) => st.id === shot.stageId) ?? -1;
                    const canAdvance =
                      stageIdx >= 0 && stageIdx < (workflow?.stages?.length ?? 0) - 1;
                    const nextStageName = canAdvance
                      ? workflow.stages[stageIdx + 1].name
                      : null;

                    return (
                      <div
                        key={shot.id}
                        className="kanban-card"
                        onClick={() => navigate(`/shots/${shot.id}`)}
                      >
                        <div className="kanban-card-top">
                          <strong className="kanban-shot-id">{shot.id}</strong>
                          <span className="kanban-stage-badge">
                            {getStageName(shot.stageId)}
                          </span>
                        </div>

                        <h4 className="kanban-shot-name">{shot.name}</h4>

                        <div className="kanban-card-meta">
                          <span>
                            <User size={12} className="inline-icon" />
                            {getArtistName(shot.artistId)}
                          </span>
                          <span className={`badge badge-${shot.priority.toLowerCase()}`}>
                            {shot.priority}
                          </span>
                          {shot.dccTool && (
                            <span className="dcc-mini-tag">{shot.dccTool}</span>
                          )}
                          <span>{shot.progress}%</span>
                        </div>

                        <div className="kanban-card-progress">
                          <div className="progress-bar mini">
                            <div
                              className="progress-fill"
                              style={{ width: `${shot.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Interactive Controls */}
                        <div className="kanban-card-actions">
                          <select
                            className={`kanban-status-select status-${shot.status.toLowerCase().replace(" ", "-")}`}
                            value={shot.status}
                            onChange={(e) => handleStatusChange(shot.id, e.target.value, e)}
                            onClick={(e) => e.stopPropagation()}
                            title="Update shot status"
                          >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Review">Review</option>
                            <option value="Blocked">Blocked</option>
                            <option value="Completed">Completed</option>
                          </select>

                          {canAdvance && (
                            <button
                              type="button"
                              className="kanban-advance-btn"
                              onClick={(e) => handleAdvanceStage(shot, e)}
                              title={`Advance to ${nextStageName}`}
                            >
                              <span>→ {nextStageName}</span>
                            </button>
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
      </section>
    </div>
  );
}