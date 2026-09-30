import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Badge } from "../components/common/Badge";
import { RealtimePreviewModal } from "../components/common/RealtimePreviewModal";
import {
  GitMerge,
  Database,
  CheckCircle2,
  PlaySquare,
  MessageSquareCheck,
  Send,
  Boxes,
  Film,
  User,
  ExternalLink,
  ArrowRight,
  Layers,
  Sparkles,
  GitCommit,
  CheckSquare,
  FileText,
  Image as ImageIcon,
  Box,
  Video,
  Table,
  BarChart3,
  Cpu,
  Tv,
  Eye,
  Check,
} from "lucide-react";

export function ArchitectureFlow() {
  const navigate = useNavigate();
  const {
    projects,
    shots,
    tasks,
    assets,
    reviews,
    gitCommits,
    gitFiles,
    kitsuReviews,
    activitySteps,
    getWorkflow,
    getProject,
    getArtistName,
    advanceActivityStep,
    commitToGitLfs,
    submitToKitsuReview,
    approveInKitsu,
    role,
  } = useProduction();

  const [activeTab, setActiveTab] = useState("architecture"); // 'architecture' | 'dfd' | 'activity'
  const [selectedShotId, setSelectedShotId] = useState("SHOT04");
  const [previewShot, setPreviewShot] = useState(null);
  const [simulatingStep, setSimulatingStep] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const selectedShot = shots.find((s) => s.id === selectedShotId) || shots[0];
  const project = getProject(selectedShot?.projectId) || projects[0];
  const workflow = getWorkflow("connected");

  function triggerToast(msg) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // 5 connected pipeline stages from Slide 5
  const CONNECTED_STAGES = [
    {
      id: "pre-production",
      name: "Pre-production",
      subtitle: "Storyboard / Animatic",
      tool: "Storyboard Pro / Pen",
      icon: ImageIcon,
      color: "#f59e0b",
      description: "Script breakdown, concept art, storyboards, and editorial animatic timing",
    },
    {
      id: "realtime-previz",
      name: "Real-time Previz",
      subtitle: "Unreal Engine",
      tool: "Unreal Engine",
      icon: Tv,
      color: "#06b6d4",
      description: "Rapid 3D layout, virtual camera exploration, and real-time lighting exploration",
    },
    {
      id: "asset-production",
      name: "Asset Production",
      subtitle: "Blender",
      tool: "Blender",
      icon: Box,
      color: "#8b5cf6",
      description: "High-resolution character modeling, rigging, texturing, and modular environment kits",
    },
    {
      id: "animation-layout",
      name: "Animation / Layout",
      subtitle: "Blender + Sequencer",
      tool: "Blender + Sequencer",
      icon: Film,
      color: "#3b82f6",
      description: "Character animation curves, multi-camera Sequencer layout, and performance capture",
    },
    {
      id: "render-review",
      name: "Render / Review",
      subtitle: "Unreal + Kitsu",
      tool: "Unreal + Kitsu",
      icon: MessageSquareCheck,
      color: "#10b981",
      description: "Lumen real-time sequencer render passes, collaborative Kitsu review, and director sign-off",
    },
  ];

  // 6 Activity Flow Steps from Slide 7
  const ACTIVITY_FLOW_STEPS = [
    {
      step: 1,
      id: "create-assign-task",
      title: "Create / assign task",
      actor: "Lead / Supervisor",
      system: "Studio Pulse Engine",
      desc: "Assign task with target stage, DCC tool, deadline, and asset requirements.",
      icon: CheckSquare,
    },
    {
      step: 2,
      id: "work-asset-shot",
      title: "Work on asset or shot",
      actor: "Artist",
      system: "Blender / Unreal Engine",
      desc: "Artist works directly in DCC tool (modeling, rigging, animation, or previz) with live file lock.",
      icon: Boxes,
    },
    {
      step: 3,
      id: "commit-version",
      title: "Commit version",
      actor: "Artist",
      system: "Git / Git LFS",
      desc: "Commit iteration to version control (e.g. v01 → v02), tracking large binary files (.blend, .uasset).",
      icon: GitCommit,
    },
    {
      step: 4,
      id: "realtime-preview",
      title: "Real-time preview",
      actor: "Artist / Lead",
      system: "Unreal Engine Viewport",
      desc: "Real-time playblast playback at 60 FPS in Unreal Sequencer for instant visual verification.",
      icon: PlaySquare,
    },
    {
      step: 5,
      id: "review-kitsu",
      title: "Review in Kitsu",
      actor: "Lead / Director",
      system: "Kitsu Platform",
      desc: "Frame-by-frame annotations, timecode notes, and creative feedback synced with Kitsu queue.",
      icon: MessageSquareCheck,
    },
    {
      step: 6,
      id: "approve-output",
      title: "Approve → final output",
      actor: "Creative Director",
      system: "Studio Pulse / Unreal Render",
      desc: "Sign-off marks shot Approved, advances pipeline stage, and triggers final 4K sequencer delivery.",
      icon: CheckCircle2,
    },
  ];

  // Artifact counts for DFD
  const artifactCounts = {
    images: 18,
    scripts: 12,
    assets3D: assets.length,
    videos: shots.filter((s) => s.gitHash || s.kitsuId).length + 4,
    sheets: 6,
    analytics: shots.length + tasks.length,
  };

  // Step simulation runner
  async function handleExecuteStep(stepNum) {
    if (!selectedShot) return;
    setSimulatingStep(stepNum);

    if (stepNum === 1) {
      advanceActivityStep(selectedShot.id, 2);
      triggerToast(`Step 1 Complete: Task assigned to ${getArtistName(selectedShot.artistId)} for ${selectedShot.id}`);
    } else if (stepNum === 2) {
      advanceActivityStep(selectedShot.id, 3);
      triggerToast(`Step 2 Complete: DCC work in ${selectedShot.dccTool || "Blender"} saved. File locked.`);
    } else if (stepNum === 3) {
      const nextVer = `v0${(selectedShot.version || 1) + 1}`;
      await commitToGitLfs({
        shotId: selectedShot.id,
        version: nextVer,
        message: `Committed ${selectedShot.name} iteration to Git LFS`,
        author: selectedShot.artistId,
        dccTool: selectedShot.dccTool,
      });
      advanceActivityStep(selectedShot.id, 4);
      triggerToast(`Step 3 Complete: Committed ${nextVer} to Git + Git LFS with binary scene tracking!`);
    } else if (stepNum === 4) {
      setPreviewShot(selectedShot);
      advanceActivityStep(selectedShot.id, 5);
      triggerToast(`Step 4 Complete: Real-time Previz generated in Unreal Engine!`);
    } else if (stepNum === 5) {
      await submitToKitsuReview({
        shotId: selectedShot.id,
        version: `v0${selectedShot.version || 1}`,
        feedback: "Submitted to Kitsu for director critique.",
      });
      advanceActivityStep(selectedShot.id, 5);
      triggerToast(`Step 5 Complete: Synced with Kitsu Review Portal! Ticket created.`);
    } else if (stepNum === 6) {
      const linkedKitsu = kitsuReviews.find((r) => r.shotId === selectedShot.id);
      if (linkedKitsu) {
        await approveInKitsu(linkedKitsu.id, "Director approved for final delivery.");
      }
      advanceActivityStep(selectedShot.id, 6);
      triggerToast(`Step 6 Complete: Approved! Final 4K output render delivered and stage locked.`);
    }

    setSimulatingStep(null);
  }

  const currentShotStep = selectedShot?.activityStep || (selectedShot?.status === "Completed" ? 6 : 4);

  return (
    <div className="page architecture-page">
      {/* Real-time Previz Viewer Modal */}
      {previewShot && (
        <RealtimePreviewModal
          isOpen={true}
          onClose={() => setPreviewShot(null)}
          shot={previewShot}
          onSubmitToKitsu={async (sId, ver, note) => {
            await submitToKitsuReview({ shotId: sId, version: ver, feedback: note });
            advanceActivityStep(sId, 5);
            triggerToast("Playblast queued in Kitsu Review!");
          }}
          onCommitGit={async (sId) => {
            await commitToGitLfs({ shotId: sId, message: "Previz playblast check-in" });
            triggerToast("Previz asset committed to Git LFS!");
          }}
        />
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="dept-banner-top">
          <span className="dept-pill">Department of Computer Science and Design</span>
          <span className="slide-ref-pill">Slide 5 & Slide 7 Compliance</span>
        </div>
        <h1>System Architecture & Activity Flow</h1>
        <p className="page-description">
          End-to-end production data flow (DFD) and connected 5-stage architecture spanning Pre-production,
          Unreal Previz, Blender DCC, Git / Git LFS version control, and Kitsu review.
        </p>

        {/* View Switcher Tabs */}
        <div className="architecture-tabs-nav">
          <button
            type="button"
            className={`arch-tab-btn ${activeTab === "architecture" ? "active" : ""}`}
            onClick={() => setActiveTab("architecture")}
          >
            <GitMerge size={16} /> 1. System Architecture (Slide 5)
          </button>
          <button
            type="button"
            className={`arch-tab-btn ${activeTab === "dfd" ? "active" : ""}`}
            onClick={() => setActiveTab("dfd")}
          >
            <Cpu size={16} /> 2. DFD – Production Data Flow (Slide 7)
          </button>
          <button
            type="button"
            className={`arch-tab-btn ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            <PlaySquare size={16} /> 3. Interactive Activity Flow (Slide 7)
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="arch-toast-bar">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TAB 1: SYSTEM ARCHITECTURE (SLIDE 5) ── */}
      {activeTab === "architecture" && (
        <div className="arch-content-section">
          {/* Main 5-Stage Architecture Flow Diagram */}
          <div className="panel arch-diagram-panel">
            <div className="panel-header">
              <div>
                <h2>System Architecture — Connected Pipeline Workflow</h2>
                <p>
                  Linear connected workflow: <strong>Pre-production</strong> → <strong>Real-time Previz</strong> → <strong>Asset Production</strong> → <strong>Animation/Layout</strong> → <strong>Render/Review</strong>
                </p>
              </div>
              <span className="architecture-quote-badge">
                "Connected workflow minimizes manual handoffs and enables earlier feedback before final rendering."
              </span>
            </div>

            {/* Visual Stage Nodes */}
            <div className="architecture-stages-container">
              {CONNECTED_STAGES.map((st, i) => {
                const Icon = st.icon;
                const activeShots = shots.filter((s) => s.stageId === st.id);

                return (
                  <div key={st.id} className="arch-stage-card-wrap">
                    <div className="arch-stage-card" style={{ borderColor: st.color }}>
                      <div className="arch-card-header">
                        <span className="arch-card-num">0{i + 1}</span>
                        <span className="arch-card-tool-tag" style={{ color: st.color }}>
                          {st.tool}
                        </span>
                      </div>

                      <div className="arch-card-body">
                        <div className="arch-icon-bubble" style={{ background: `${st.color}22`, color: st.color }}>
                          <Icon size={20} />
                        </div>
                        <h3 className="arch-stage-title">{st.name}</h3>
                        <p className="arch-stage-subtitle">{st.subtitle}</p>
                        <p className="arch-stage-desc">{st.description}</p>
                      </div>

                      <div className="arch-card-footer">
                        <span className="arch-shot-count">
                          <strong>{activeShots.length}</strong> active shot{activeShots.length !== 1 ? "s" : ""}
                        </span>
                        <div className="arch-shot-badges">
                          {activeShots.slice(0, 3).map((s) => (
                            <span
                              key={s.id}
                              className="arch-mini-pill"
                              onClick={() => navigate(`/shots/${s.id}`)}
                              title={`Inspect ${s.id}`}
                            >
                              {s.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {i < CONNECTED_STAGES.length - 1 && (
                      <div className="arch-arrow-connector">
                        <ArrowRight size={22} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Foundational Pillars: Git LFS & Kitsu */}
            <div className="architecture-foundations-row">
              <div className="foundation-card git-lfs-card" onClick={() => navigate("/git-lfs")}>
                <div className="foundation-card-left">
                  <div className="foundation-icon-circle git">
                    <Database size={22} />
                  </div>
                  <div>
                    <h3>Git + Git LFS</h3>
                    <p className="foundation-sub">Asset / Version Control</p>
                    <p className="foundation-detail">
                      Manages large binary scene files (.blend, .uasset, textures, playblasts), commit history, and branches.
                    </p>
                  </div>
                </div>
                <div className="foundation-card-right">
                  <span className="foundation-stat"><strong>{gitCommits.length}</strong> Commits</span>
                  <span className="foundation-stat"><strong>{gitFiles.length}</strong> LFS Files</span>
                  <span className="foundation-link">Open Git LFS Panel →</span>
                </div>
              </div>

              <div className="foundation-card kitsu-card" onClick={() => navigate("/reviews")}>
                <div className="foundation-card-left">
                  <div className="foundation-icon-circle kitsu">
                    <MessageSquareCheck size={22} />
                  </div>
                  <div>
                    <h3>Kitsu</h3>
                    <p className="foundation-sub">Tracking / Review / Approval</p>
                    <p className="foundation-detail">
                      Cloud review hub with frame-by-frame annotations, real-time playblast playback, and director approvals.
                    </p>
                  </div>
                </div>
                <div className="foundation-card-right">
                  <span className="foundation-stat"><strong>{kitsuReviews.length}</strong> Review Tickets</span>
                  <span className="foundation-stat"><strong>{kitsuReviews.filter(r => r.status === "Approved").length}</strong> Approved</span>
                  <span className="foundation-link">Open Kitsu Review →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: DFD – PRODUCTION DATA FLOW (SLIDE 7) ── */}
      {activeTab === "dfd" && (
        <div className="arch-content-section">
          <div className="panel dfd-panel">
            <div className="panel-header">
              <div>
                <h2>DFD – Production Data Flow</h2>
                <p>System context diagram showing entities, central pipeline engine, external review platform, and version control</p>
              </div>
              <span className="template-badge">Data Flow Architecture</span>
            </div>

            {/* DFD Node Graph */}
            <div className="dfd-graph-container">
              {/* Entity 1: Artist / Lead */}
              <div className="dfd-node dfd-entity-artist">
                <div className="dfd-node-icon">
                  <User size={28} />
                </div>
                <h3 className="dfd-node-title">Artist / Lead</h3>
                <span className="dfd-node-role">Primary Actors</span>
                <p className="dfd-node-desc">
                  Tasks creation, DCC asset development, version commits, and feedback resolution.
                </p>
              </div>

              {/* Data Flow Arrow 1 */}
              <div className="dfd-flow-channel">
                <span className="dfd-flow-label">Assigns & Executes</span>
                <div className="dfd-arrow-line">
                  <ArrowRight size={22} />
                </div>
                <span className="dfd-flow-sublabel">Tasks, Assets, Commits</span>
              </div>

              {/* Core Process Engine: Studio Pulse Pipeline */}
              <div className="dfd-node dfd-core-engine">
                <div className="dfd-core-badge">CENTRAL PROCESS</div>
                <div className="dfd-node-icon pulse">
                  <Cpu size={32} />
                </div>
                <h3 className="dfd-node-title">Studio Pulse Pipeline</h3>
                <div className="dfd-core-modules">
                  <span className="core-module-tag">Tasks ({tasks.length})</span>
                  <span className="core-module-tag">Assets ({assets.length})</span>
                  <span className="core-module-tag">Shots ({shots.length})</span>
                </div>
                <p className="dfd-node-desc">
                  Orchestrates stage advancement, dependency resolution, RBAC access control, and live event streaming.
                </p>

                {/* Sub-Layer: Git / Git LFS directly below core engine */}
                <div className="dfd-sub-layer-git">
                  <div className="dfd-sub-git-header">
                    <Database size={15} />
                    <strong>Git / Git LFS Data Store</strong>
                  </div>
                  <p>Binary storage & SHA256 version tree for .blend, .uasset, .exr</p>
                </div>
              </div>

              {/* Data Flow Arrow 2 */}
              <div className="dfd-flow-channel">
                <span className="dfd-flow-label">Queues for Critique</span>
                <div className="dfd-arrow-line">
                  <ArrowRight size={22} />
                </div>
                <span className="dfd-flow-sublabel">Playblasts & Metadata</span>
              </div>

              {/* External Review System: Kitsu Review */}
              <div className="dfd-node dfd-entity-kitsu">
                <div className="dfd-node-icon">
                  <MessageSquareCheck size={28} />
                </div>
                <h3 className="dfd-node-title">Kitsu Review</h3>
                <span className="dfd-node-role">External Quality Control</span>
                <p className="dfd-node-desc">
                  Timecoded annotation player, approval sign-off, director critique, and playlist distribution.
                </p>
              </div>
            </div>

            {/* Bottom Artifact Badges from Slide 7 Icons */}
            <div className="dfd-artifacts-tray">
              <div className="dfd-tray-header">
                <h4>Pipeline Data Artifacts Flowing Through Modules:</h4>
              </div>
              <div className="dfd-artifacts-grid">
                <div className="dfd-artifact-card">
                  <div className="artifact-icon img"><ImageIcon size={18} /></div>
                  <div>
                    <strong>Images / Storyboards</strong>
                    <span>{artifactCounts.images} files · Concept & Textures</span>
                  </div>
                </div>

                <div className="dfd-artifact-card">
                  <div className="artifact-icon doc"><FileText size={18} /></div>
                  <div>
                    <strong>Scripts / Documents</strong>
                    <span>{artifactCounts.scripts} items · Screenplay & Notes</span>
                  </div>
                </div>

                <div className="dfd-artifact-card">
                  <div className="artifact-icon obj"><Box size={18} /></div>
                  <div>
                    <strong>3D Assets (.blend)</strong>
                    <span>{artifactCounts.assets3D} assets · Rigs & Meshes</span>
                  </div>
                </div>

                <div className="dfd-artifact-card">
                  <div className="artifact-icon vid"><Video size={18} /></div>
                  <div>
                    <strong>Real-time Videos (.mp4)</strong>
                    <span>{artifactCounts.videos} playblasts · Unreal Previz</span>
                  </div>
                </div>

                <div className="dfd-artifact-card">
                  <div className="artifact-icon tbl"><Table size={18} /></div>
                  <div>
                    <strong>Shot Lists & Metadata</strong>
                    <span>{artifactCounts.sheets} sheets · Timecode specs</span>
                  </div>
                </div>

                <div className="dfd-artifact-card">
                  <div className="artifact-icon cht"><BarChart3 size={18} /></div>
                  <div>
                    <strong>Analytics & Tracking</strong>
                    <span>{artifactCounts.analytics} metrics · Health & Velocity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: INTERACTIVE 6-STEP ACTIVITY FLOW SIMULATOR (SLIDE 7) ── */}
      {activeTab === "activity" && (
        <div className="arch-content-section">
          {/* Shot Picker & Activity Flow Overview */}
          <div className="panel activity-sim-panel">
            <div className="panel-header">
              <div>
                <h2>Activity Flow Execution Engine</h2>
                <p>Run any production shot through the 6-step lifecycle shown on Slide 7</p>
              </div>

              {/* Shot Selector Dropdown */}
              <div className="activity-shot-picker">
                <label>Select Shot to Test:</label>
                <select
                  value={selectedShotId}
                  onChange={(e) => setSelectedShotId(e.target.value)}
                  className="form-select"
                >
                  {shots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}: {s.name} ({s.status} — v{s.version || 1})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Shot Info Banner */}
            <div className="activity-shot-card-summary">
              <div className="shot-summary-col">
                <span className="summary-label">Selected Shot</span>
                <h3>{selectedShot.id} — {selectedShot.name}</h3>
                <p>{selectedShot.description}</p>
              </div>
              <div className="shot-summary-col">
                <span className="summary-label">Active Stage</span>
                <strong className="summary-val">{workflow?.stages.find(st => st.id === selectedShot.stageId)?.name || selectedShot.stageId}</strong>
                <span className="summary-tool">DCC: {selectedShot.dccTool || "Blender"}</span>
              </div>
              <div className="shot-summary-col">
                <span className="summary-label">Assigned Artist</span>
                <strong className="summary-val">{getArtistName(selectedShot.artistId)}</strong>
                <span className="summary-tool">Priority: {selectedShot.priority}</span>
              </div>
              <div className="shot-summary-col">
                <span className="summary-label">Current Lifecycle Step</span>
                <strong className="summary-val step-highlight">Step {currentShotStep} of 6</strong>
                <Badge variant={selectedShot.status === "Completed" ? "ok" : "warn"} text={selectedShot.status} />
              </div>
            </div>

            {/* The 6 Sequential Flow Steps */}
            <div className="activity-steps-ladder">
              {ACTIVITY_FLOW_STEPS.map((st) => {
                const Icon = st.icon;
                const isCurrent = currentShotStep === st.step;
                const isPast = currentShotStep > st.step;

                return (
                  <div
                    key={st.step}
                    className={`activity-step-row ${isCurrent ? "current" : isPast ? "done" : "upcoming"}`}
                  >
                    <div className="step-num-bubble">
                      {isPast ? <Check size={16} strokeWidth={3} /> : st.step}
                    </div>

                    <div className="step-content-card">
                      <div className="step-header-line">
                        <div className="step-title-group">
                          <Icon size={18} className="step-icon-svg" />
                          <h4 className="step-title-text">{st.title}</h4>
                        </div>
                        <div className="step-meta-group">
                          <span className="step-actor-tag">Actor: {st.actor}</span>
                          <span className="step-system-tag">Tool: {st.system}</span>
                        </div>
                      </div>

                      <p className="step-desc-text">{st.desc}</p>

                      {/* Interactive Trigger Button for this step */}
                      <div className="step-action-strip">
                        <button
                          type="button"
                          className={`btn-step-execute ${isCurrent ? "active-run" : ""}`}
                          onClick={() => handleExecuteStep(st.step)}
                          disabled={simulatingStep === st.step}
                        >
                          {simulatingStep === st.step ? (
                            <span>Processing Step {st.step}...</span>
                          ) : (
                            <>
                              <PlaySquare size={14} /> Execute Step {st.step}: {st.title}
                            </>
                          )}
                        </button>

                        {isCurrent && (
                          <span className="step-live-pill">
                            <span className="live-dot" /> ACTIVE STEP IN PIPELINE
                          </span>
                        )}

                        {isPast && (
                          <span className="step-completed-pill">
                            <CheckCircle2 size={13} /> Completed for {selectedShot.id}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
