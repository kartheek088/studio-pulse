import { useState } from "react";
import { X, FolderPlus, Layers, Film, Calendar, Building, Sparkles } from "lucide-react";

export function NewProjectModal({ isOpen, onClose, onCreateProject }) {
  const defaultDeadline = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [type, setType] = useState("Animation");
  const [workflowId, setWorkflowId] = useState("connected");
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [shotCount, setShotCount] = useState(4);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a project name");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onCreateProject({
        name: name.trim(),
        client: client.trim() || "Independent Production",
        type,
        workflowId,
        deadline,
        shotCount: Number(shotCount) || 3,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  }

  const pipelineDescriptions = {
    connected: "5-stage connected flow: Pre-production → Unreal Previz → Blender Assets → Animation → Unreal + Kitsu",
    vfx: "8-stage VFX flow: Plate → Tracking → Roto → FX → Compositing → Review → Approval → Delivery",
    animation: "9-stage Animation flow: Storyboard → Layout → Blocking → Animation → Lighting → Render → Review",
    virtualProduction: "8-stage VP flow: Previz → Asset Prep → Environment → Lighting → Capture → Edit → Review",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content new-project-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="new-project-modal-header-text">
            <div className="new-project-modal-badge">
              <FolderPlus size={14} />
              <span>Production Setup</span>
            </div>
            <h3 className="new-project-modal-title">Initialize New Project</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="new-project-form">
          <div className="modal-body new-project-modal-body">
            {error && <div className="form-error-banner">{error}</div>}

            {/* Project Name & Client */}
            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="proj-name">
                  Project Title <span className="req">*</span>
                </label>
                <input
                  id="proj-name"
                  type="text"
                  className="studio-input"
                  placeholder="e.g. Project Chronos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="proj-client">Client / Production Studio</label>
                <div className="input-with-icon">
                  <Building size={14} className="input-inner-icon" />
                  <input
                    id="proj-client"
                    type="text"
                    className="studio-input with-left-icon"
                    placeholder="e.g. Lumen Studios / Paramount"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Type & Pipeline Selection */}
            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="proj-type">Production Format</label>
                <select
                  id="proj-type"
                  className="studio-select"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Animation">3D Feature Animation</option>
                  <option value="VFX">VFX & Plate Integration</option>
                  <option value="Virtual Production">Virtual Production (LED / In-Camera)</option>
                  <option value="Commercial">Commercial / Cinematic</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="proj-workflow">
                  Pipeline Architecture
                </label>
                <select
                  id="proj-workflow"
                  className="studio-select"
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                >
                  <option value="connected">Connected Pipeline (Unreal + Blender + Kitsu)</option>
                  <option value="vfx">VFX Linear Pipeline</option>
                  <option value="animation">Standard Animation Pipeline</option>
                  <option value="virtualProduction">Virtual Production Pipeline</option>
                </select>
              </div>
            </div>

            {/* Pipeline description banner */}
            <div className="pipeline-hint-card">
              <Sparkles size={14} className="pipeline-hint-icon" />
              <span>{pipelineDescriptions[workflowId]}</span>
            </div>

            {/* Deadline & Initial Shot Count */}
            <div className="form-row-2col">
              <div className="form-group">
                <label htmlFor="proj-deadline">Target Milestone Deadline</label>
                <div className="input-with-icon">
                  <Calendar size={14} className="input-inner-icon" />
                  <input
                    id="proj-deadline"
                    type="date"
                    className="studio-input with-left-icon"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="proj-shots">
                  Initial Starter Shots
                </label>
                <div className="input-with-icon">
                  <Film size={14} className="input-inner-icon" />
                  <input
                    id="proj-shots"
                    type="number"
                    min="1"
                    max="12"
                    className="studio-input with-left-icon"
                    value={shotCount}
                    onChange={(e) => setShotCount(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Brief / Description */}
            <div className="form-group">
              <label htmlFor="proj-desc">Production Brief / Scope</label>
              <textarea
                id="proj-desc"
                className="studio-textarea"
                rows="2"
                placeholder="High-level creative logline, visual goals, and target deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer new-project-modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              <FolderPlus size={15} />
              <span>{isSubmitting ? "Initializing Pipeline..." : "Create Production Project"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
