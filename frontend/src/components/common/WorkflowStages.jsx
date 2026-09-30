import { Check } from "lucide-react";

export function WorkflowStages({ stages, currentStageId, shotStatus, size = "normal" }) {
  if (!stages || stages.length === 0) return null;

  return (
    <div className={`workflow-stages workflow-stages--${size}`}>
      {stages.map((stage, i) => {
        const isDone = i < getStageIndex(currentStageId, stages);
        const isCurrent = stage.id === currentStageId;
        const stageStatus = isDone ? "done" : isCurrent ? (shotStatus || "progress") : "pending";

        return (
          <div key={stage.id} className="workflow-stage">
            {i > 0 && <span className="workflow-connector" />}
            <div className={`workflow-node state-${stageStatus}`}>
              {isDone ? <Check size={13} strokeWidth={3} /> : i + 1}
            </div>
            <div className="workflow-stage-text">
              <span className="workflow-label">{stage.name}</span>
              {stage.subtitle && (
                <span className="workflow-sublabel">{stage.subtitle}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getStageIndex(stageId, stages) {
  return stages.findIndex((s) => s.id === stageId);
}