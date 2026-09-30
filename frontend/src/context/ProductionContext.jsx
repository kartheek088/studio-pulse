import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  createFreshState,
  genId,
  WORKFLOWS,
  ARTISTS,
  USERS,
} from "../data/mockData";
import {
  loadState,
  saveState,
  resetPersistedState,
  getInitialOrFresh,
} from "../utils/storage";
import { api } from "../utils/api";

const defaultContextValue = {
  projects: [],
  workflows: {},
  shots: [],
  tasks: [],
  assets: [],
  reviews: [],
  activities: [],
  gitCommits: [],
  gitFiles: [],
  kitsuReviews: [],
  activitySteps: [],
  role: "productionLead",
  currentArtist: "nv",
  currentUser: USERS.nv,
  users: USERS,
  currentProjectId: null,
  backendConnected: false,
  backendLatency: null,
  mobileMenuOpen: false,
  toggleMobileMenu: () => {},
  closeMobileMenu: () => {},
  login: () => {},
  logout: () => {},
  switchUser: () => {},
  canEditShot: () => true,
  canEditTask: () => true,
  canEditAsset: () => true,
  canApprove: () => true,
  setRole: () => {},
  setCurrentArtist: () => {},
  setCurrentProjectId: () => {},
  addActivity: () => {},
  updateShotStatus: () => {},
  moveShotToStage: () => {},
  completeCurrentTask: () => {},
  submitVersion: () => {},
  approveReview: () => {},
  requestChanges: () => {},
  updateTaskStatus: () => {},
  blockTask: () => {},
  submitTaskForReview: () => {},
  updateAssetVersion: () => {},
  commitToGitLfs: () => {},
  submitToKitsuReview: () => {},
  addKitsuAnnotation: () => {},
  approveInKitsu: () => {},
  requestChangesInKitsu: () => {},
  advanceActivityStep: () => {},
  resetData: () => {},
  resetDemoData: () => {},
  getProject: () => null,
  getWorkflow: () => WORKFLOWS.connected || WORKFLOWS.animation,
  getShot: () => null,
  getTask: () => null,
  getAsset: () => null,
  getReview: () => null,
  getArtistName: () => "",
  getMyShots: () => [],
  getMyTasks: () => [],
  getReviewsForShot: () => [],
  getBlockedShots: () => [],
  getInReviewShots: () => [],
  computeShotProgress: () => 0,
  formatActivityTime: () => "",
};

const ProductionContext = createContext(defaultContextValue);

export function useProduction() {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error("useProduction must be used within a ProductionProvider");
  }
  return context;
}

export function ProductionProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const urlUser = params.get("user");
        if (urlUser && USERS[urlUser.toLowerCase()]) {
          localStorage.setItem("studio_pulse_active_user", urlUser.toLowerCase());
          return USERS[urlUser.toLowerCase()];
        }
      }
      const saved = localStorage.getItem("studio_pulse_active_user");
      if (saved && USERS[saved]) return USERS[saved];
    } catch {}
    return USERS.nv; // Default to Production Lead (Nishanth V.)
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function toggleMobileMenu() {
    setMobileMenuOpen((prev) => !prev);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  const [state, setState] = useState(() => {
    const init = getInitialOrFresh() ?? createFreshState();
    return {
      ...init,
      role: currentUser?.role || "productionLead",
      currentArtist: currentUser?.id || "nv",
    };
  });

  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendLatency, setBackendLatency] = useState(null);

  // Sync active user to state and localStorage
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem("studio_pulse_active_user", currentUser.id);
      } catch {}
      setState((s) => ({
        ...s,
        role: currentUser.role,
        currentArtist: currentUser.id,
      }));
    } else {
      try {
        localStorage.removeItem("studio_pulse_active_user");
      } catch {}
    }
  }, [currentUser]);

  function login(userId) {
    const user = USERS[userId] || Object.values(USERS).find((u) => u.email === userId) || USERS.nv;
    setCurrentUser(user);
    setState((s) => ({
      ...s,
      role: user.role,
      currentArtist: user.id,
    }));
    return user;
  }

  function logout() {
    setCurrentUser(null);
    try {
      localStorage.removeItem("studio_pulse_active_user");
    } catch {}
  }

  function switchUser(userId) {
    return login(userId);
  }

  function canEditShot(shot) {
    if (!currentUser) return false;
    if (currentUser.role === "productionLead") return true;
    const shotArtist = (shot?.artistId || "").toLowerCase();
    const uid = currentUser.id.toLowerCase();
    return Boolean(shot && (shotArtist === uid || shotArtist.includes(uid)));
  }

  function canEditTask(task) {
    if (!currentUser) return false;
    if (currentUser.role === "productionLead") return true;
    const taskArtist = (task?.artistId || "").toLowerCase();
    const uid = currentUser.id.toLowerCase();
    return Boolean(task && (taskArtist === uid || taskArtist.includes(uid)));
  }

  function canEditAsset(asset) {
    if (!currentUser) return false;
    if (currentUser.role === "productionLead") return true;
    const owner = (asset?.owner || "").toLowerCase();
    const uid = currentUser.id.toLowerCase();
    const uAvatar = (currentUser.avatar || "").toLowerCase();
    return owner === uid || owner === uAvatar || owner.includes(uid) || owner.includes(uAvatar);
  }

  function canApprove() {
    if (!currentUser) return false;
    return currentUser.role === "director" || currentUser.role === "productionLead";
  }

  // Sync state to localStorage as a safety backup
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Initial load from backend API & Server-Sent Events (SSE) stream
  useEffect(() => {
    let sse = null;

    async function initBackend() {
      const health = await api.checkHealth();
      if (health) {
        setBackendConnected(true);
        setBackendLatency(health.latency);

        // Load full state from backend
        const remoteState = await api.getState();
        if (remoteState && remoteState.projects && remoteState.shots) {
          setState((prev) => ({
            ...prev,
            ...remoteState,
            role: prev.role || "productionLead",
            currentArtist: prev.currentArtist || "saswat",
          }));
        }

        // Subscribe to live SSE events from backend
        try {
          sse = new EventSource("/api/events");
          sse.onmessage = (e) => {
            try {
              const event = JSON.parse(e.data);
              if (event.type === "activity" && event.payload) {
                setState((s) => ({
                  ...s,
                  activities: [
                    event.payload,
                    ...s.activities.filter((a) => a.id !== event.payload.id),
                  ],
                }));
              }
            } catch {
              // heartbeat or non-json message
            }
          };
          sse.onerror = () => {
            // Keep going gracefully
          };
        } catch {
          // SSE not supported or network error
        }
      } else {
        setBackendConnected(false);
      }
    }

    initBackend();

    // Ping health periodically every 20s
    const pingInterval = setInterval(async () => {
      const health = await api.checkHealth();
      if (health) {
        setBackendConnected(true);
        setBackendLatency(health.latency);
      } else {
        setBackendConnected(false);
      }
    }, 20000);

    return () => {
      clearInterval(pingInterval);
      if (sse) sse.close();
    };
  }, []);

  // Recalculate project overall progress based on average of child shots
  const projectsWithRecalculatedProgress = useMemo(() => {
    return state.projects.map((proj) => {
      const projShots = state.shots.filter((s) => s.projectId === proj.id);
      if (projShots.length === 0) return proj;
      const avgProgress = Math.round(
        projShots.reduce((acc, s) => acc + (s.progress || 0), 0) / projShots.length
      );
      return { ...proj, progress: avgProgress };
    });
  }, [state.projects, state.shots]);

  // ── Role & Artist Selection ──────────────────────────────────────────
  function setRole(role) {
    setState((s) => ({ ...s, role }));
  }

  function setCurrentArtist(artistId) {
    setState((s) => ({ ...s, currentArtist: artistId }));
  }

  // ── Entity Lookups ───────────────────────────────────────────────────
  function getProject(id) {
    return projectsWithRecalculatedProgress.find((p) => p.id === id) || null;
  }

  function getWorkflow(workflowIdOrProjectId) {
    if (!workflowIdOrProjectId) {
      const proj = state.projects.find((p) => p.id === currentProjectId);
      const wfId = proj?.workflowId || "animation";
      return state.workflows[wfId] || WORKFLOWS[wfId] || WORKFLOWS.animation;
    }
    if (state.workflows[workflowIdOrProjectId] || WORKFLOWS[workflowIdOrProjectId]) {
      return state.workflows[workflowIdOrProjectId] || WORKFLOWS[workflowIdOrProjectId];
    }
    const proj = state.projects.find((p) => p.id === workflowIdOrProjectId);
    if (proj) {
      return state.workflows[proj.workflowId] || WORKFLOWS[proj.workflowId] || WORKFLOWS.animation;
    }
    return WORKFLOWS.animation;
  }

  function getShot(id) {
    return state.shots.find((s) => s.id === id) || null;
  }

  function getTask(id) {
    return state.tasks.find((t) => t.id === id) || null;
  }

  function getAsset(id) {
    return state.assets.find((a) => a.id === id) || null;
  }

  function getReview(id) {
    return state.reviews.find((r) => r.id === id) || null;
  }

  function getArtistName(id) {
    return ARTISTS[id]?.name || id || "Unassigned";
  }

  // ── Filtered Views by Role ──────────────────────────────────────────
  function getMyShots() {
    if (currentUser?.role === "artist" || state.role === "artist") {
      const activeId = (currentUser?.id || state.currentArtist || "").toLowerCase();
      return state.shots.filter(
        (s) => (s.artistId || "").toLowerCase() === activeId || (s.artistId || "").toLowerCase().includes(activeId)
      );
    }
    return state.shots;
  }

  function getMyTasks() {
    if (currentUser?.role === "artist" || state.role === "artist") {
      const activeId = (currentUser?.id || state.currentArtist || "").toLowerCase();
      return state.tasks.filter(
        (t) => (t.artistId || "").toLowerCase() === activeId || (t.artistId || "").toLowerCase().includes(activeId)
      );
    }
    return state.tasks;
  }

  function getReviewsForShot(shotId) {
    return state.reviews.filter((r) => r.shotId === shotId);
  }

  function getBlockedShots() {
    return state.shots.filter((s) => s.status === "Blocked");
  }

  function getInReviewShots() {
    return state.shots.filter((s) => s.status === "Review" || s.stageId === "review");
  }

  // ── Progress Computation ────────────────────────────────────────────
  function computeShotProgress(shot) {
    if (!shot) return 0;
    const project = state.projects.find((p) => p.id === shot.projectId);
    const wf = project ? state.workflows[project.workflowId] || WORKFLOWS[project.workflowId] : WORKFLOWS.animation;
    if (!wf || !wf.stages) return shot.progress || 0;
    const stageIdx = wf.stages.findIndex((s) => s.id === shot.stageId);
    if (stageIdx < 0) return shot.progress || 0;
    return Math.min(100, Math.round(((stageIdx + 1) / wf.stages.length) * 100));
  }

  // ── Activity Logging ────────────────────────────────────────────────
  function addActivity(act) {
    const now = new Date().toISOString();
    const newAct = {
      id: genId("A"),
      type: act.type || "status",
      entityType: act.entityType || "shot",
      entity: act.entity || "",
      text: act.text || "",
      detail: act.detail || "",
      time: now,
    };
    setState((s) => ({
      ...s,
      activities: [newAct, ...s.activities],
    }));
  }

  function formatActivityTime(dateStr) {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // ── Shot Actions ────────────────────────────────────────────────────
  function updateShotStatus(shotId, newStatus) {
    setState((s) => ({
      ...s,
      shots: s.shots.map((shot) =>
        shot.id === shotId ? { ...shot, status: newStatus } : shot
      ),
    }));
    addActivity({
      type: newStatus === "Blocked" ? "block" : "status",
      entityType: "shot",
      entity: shotId,
      text: `Shot ${shotId} status: ${newStatus}`,
      detail: `Marked as ${newStatus}`,
    });
    api.updateShot(shotId, { status: newStatus });
  }

  function moveShotToStage(shotId, targetStageId) {
    const shot = state.shots.find((s) => s.id === shotId);
    if (!shot) return;

    const project = state.projects.find((p) => p.id === shot.projectId);
    const wf = project ? state.workflows[project.workflowId] || WORKFLOWS[project.workflowId] : WORKFLOWS.animation;
    const stageObj = wf.stages.find((st) => st.id === targetStageId);
    const stageName = stageObj?.name || targetStageId;
    const stageIdx = wf.stages.findIndex((st) => st.id === targetStageId);
    const isFinalStage = stageIdx === wf.stages.length - 1;
    const isReviewStage = targetStageId === "review" || stageName.toLowerCase() === "review";

    const newProgress = Math.min(100, Math.round(((stageIdx + 1) / wf.stages.length) * 100));
    let newStatus = shot.status;
    if (isFinalStage) {
      newStatus = "Completed";
    } else if (isReviewStage) {
      newStatus = "Review";
    } else if (shot.status === "Blocked" || shot.status === "Not Started") {
      newStatus = "In Progress";
    }

    const updates = {
      stageId: targetStageId,
      status: newStatus,
      progress: newProgress,
    };

    setState((s) => ({
      ...s,
      shots: s.shots.map((sh) =>
        sh.id === shotId ? { ...sh, ...updates } : sh
      ),
    }));

    addActivity({
      type: "stage",
      entityType: "shot",
      entity: shotId,
      text: `${shot.id} moved to ${stageName}`,
      detail: `Progress updated to ${newProgress}%. Stage: ${stageName}`,
    });

    api.updateShot(shotId, updates);
  }

  // ── Task Actions ────────────────────────────────────────────────────
  function completeCurrentTask(shotId) {
    const shot = state.shots.find((s) => s.id === shotId);
    if (!shot) return;

    const project = state.projects.find((p) => p.id === shot.projectId);
    const wf = project ? state.workflows[project.workflowId] || WORKFLOWS[project.workflowId] : WORKFLOWS.animation;
    const currentStageIdx = wf.stages.findIndex((st) => st.id === shot.stageId);

    let completedTaskName = "Current task";
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.shotId === shotId && (t.stageId === shot.stageId || t.status !== "Completed")) {
          completedTaskName = t.name;
          return { ...t, status: "Completed" };
        }
        return t;
      }),
    }));

    addActivity({
      type: "task",
      entityType: "task",
      entity: shotId,
      text: `Task "${completedTaskName}" completed`,
      detail: `Work finished for ${shot.id} stage: ${shot.stageId}`,
    });

    if (currentStageIdx >= 0 && currentStageIdx < wf.stages.length - 1) {
      const nextStage = wf.stages[currentStageIdx + 1];
      moveShotToStage(shotId, nextStage.id);
    }

    api.completeTaskForShot(shotId);
  }

  function updateTaskStatus(taskId, newStatus) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ),
    }));

    addActivity({
      type: newStatus === "Blocked" ? "block" : "task",
      entityType: "task",
      entity: taskId,
      text: `Task ${taskId} status: ${newStatus}`,
      detail: `Task "${task.name}" is now ${newStatus}`,
    });

    if (newStatus === "Completed" && task.shotId) {
      const shot = state.shots.find((s) => s.id === task.shotId);
      if (shot && shot.stageId === task.stageId) {
        completeCurrentTask(shot.id);
      }
    }

    api.updateTask(taskId, { status: newStatus });
  }

  function blockTask(taskId) {
    updateTaskStatus(taskId, "Blocked");
  }

  function submitTaskForReview(taskId) {
    updateTaskStatus(taskId, "Review");
  }

  // ── Version Submission ──────────────────────────────────────────────
  function submitVersion(shotId, newVersion, feedback) {
    const shot = state.shots.find((s) => s.id === shotId);
    if (!shot) return;

    const now = new Date().toISOString();
    const newRev = {
      id: genId("R"),
      shotId,
      version: newVersion,
      status: "Pending Review",
      feedback: feedback || "Version submitted for director review",
      reviewerId: "director",
      date: now,
    };

    setState((s) => ({
      ...s,
      reviews: [newRev, ...s.reviews],
      shots: s.shots.map((sh) =>
        sh.id === shotId
          ? { ...sh, version: newVersion, stageId: "review", status: "Review" }
          : sh
      ),
    }));

    addActivity({
      type: "review",
      entityType: "shot",
      entity: shotId,
      text: `${shot.id} submitted ${newVersion}`,
      detail: `Ready for director review${feedback ? `: "${feedback}"` : ""}`,
    });

    api.submitVersion(shotId, newVersion, feedback);
  }

  // ── Director Review Actions ─────────────────────────────────────────
  function approveReview(reviewId) {
    const review = state.reviews.find((r) => r.id === reviewId);
    if (!review) return;

    const shot = state.shots.find((s) => s.id === review.shotId);
    if (!shot) return;

    const project = state.projects.find((p) => p.id === shot.projectId);
    const wf = project ? state.workflows[project.workflowId] || WORKFLOWS[project.workflowId] : WORKFLOWS.animation;
    const currentIdx = wf.stages.findIndex((st) => st.id === shot.stageId);
    const nextStage = currentIdx >= 0 && currentIdx < wf.stages.length - 1 ? wf.stages[currentIdx + 1] : null;

    setState((s) => ({
      ...s,
      reviews: s.reviews.map((r) =>
        r.id === reviewId ? { ...r, status: "Approved" } : r
      ),
    }));

    if (nextStage) {
      moveShotToStage(shot.id, nextStage.id);
    } else {
      updateShotStatus(shot.id, "Completed");
    }

    addActivity({
      type: "approval",
      entityType: "review",
      entity: reviewId,
      text: `${shot.id} ${review.version} approved`,
      detail: nextStage
        ? `Director approved ${review.version}. Shot advances to ${nextStage.name}`
        : `Director approved ${review.version}. Shot completed delivery!`,
    });

    api.approveReview(reviewId);
  }

  function requestChanges(reviewId, feedback) {
    const review = state.reviews.find((r) => r.id === reviewId);
    if (!review) return;

    const shot = state.shots.find((s) => s.id === review.shotId);
    if (!shot) return;

    const project = state.projects.find((p) => p.id === shot.projectId);
    const wf = project ? state.workflows[project.workflowId] || WORKFLOWS[project.workflowId] : WORKFLOWS.animation;
    const reviewStageIdx = wf.stages.findIndex((st) => st.id === "review" || st.name.toLowerCase() === "review");
    const prevStage = reviewStageIdx > 0 ? wf.stages[reviewStageIdx - 1] : wf.stages[0];

    setState((s) => ({
      ...s,
      reviews: s.reviews.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              status: "Changes Requested",
              feedback: feedback || "Revisions requested by director",
            }
          : r
      ),
      shots: s.shots.map((sh) =>
        sh.id === shot.id
          ? {
              ...sh,
              stageId: prevStage.id,
              status: "In Progress",
              progress: Math.min(100, Math.round(((wf.stages.findIndex((x) => x.id === prevStage.id) + 1) / wf.stages.length) * 100)),
            }
          : sh
      ),
      tasks: [
        {
          id: genId("T"),
          shotId: shot.id,
          name: `Revisions: ${feedback || "Director Feedback"}`,
          stageId: prevStage.id,
          artistId: shot.artistId,
          priority: "High",
          status: "In Progress",
          dueDate: "Tomorrow",
          department: prevStage.name,
        },
        ...s.tasks,
      ],
    }));

    addActivity({
      type: "review",
      entityType: "review",
      entity: reviewId,
      text: `Director requested changes on ${shot.id}`,
      detail: feedback ? `"${feedback}" — shot returned to ${prevStage.name}` : `Returned to ${prevStage.name} for revision`,
    });

    api.requestChanges(reviewId, feedback);
  }

  // ── Asset Actions ───────────────────────────────────────────────────
  function updateAssetVersion(assetId, newVersion, newStatus) {
    const asset = state.assets.find((a) => a.id === assetId);
    if (!asset) return;

    const now = new Date().toISOString();
    const updatedStatus = newStatus || asset.status;
    const updatedVersion = newVersion || asset.version;

    const existingVersions = asset.versions || [
      { version: asset.version, status: asset.status, date: asset.updated || "2026-09-08" },
    ];
    const versionHistory = [
      ...existingVersions.filter((v) => v.version !== updatedVersion),
      { version: updatedVersion, status: updatedStatus, date: now.split("T")[0] },
    ];

    setState((s) => {
      let updatedShots = s.shots;
      if (updatedStatus === "Approved") {
        updatedShots = s.shots.map((sh) => {
          if (sh.status === "Blocked" && sh.dependencies && sh.dependencies.includes(assetId)) {
            const otherDeps = sh.dependencies.filter((dId) => dId !== assetId);
            const allOtherApproved = otherDeps.every((dId) => {
              const otherAsset = s.assets.find((a) => a.id === dId);
              return otherAsset && otherAsset.status === "Approved";
            });
            if (allOtherApproved) {
              return { ...sh, status: "In Progress" };
            }
          }
          return sh;
        });
      }

      return {
        ...s,
        assets: s.assets.map((a) =>
          a.id === assetId
            ? {
                ...a,
                version: updatedVersion,
                status: updatedStatus,
                versions: versionHistory,
                updated: "Today",
              }
            : a
        ),
        shots: updatedShots,
      };
    });

    addActivity({
      type: "asset",
      entityType: "asset",
      entity: assetId,
      text: `${asset.name} updated to ${updatedVersion}`,
      detail: `Status: ${updatedStatus}`,
    });

    api.updateAsset(assetId, { version: updatedVersion, status: updatedStatus });
  }

  // ── Git + Git LFS Asset & Version Control (Slide 5 & 7 Architecture) ──
  async function commitToGitLfs({ shotId, assetId, version, message, author, files, dccTool }) {
    const hash = Math.random().toString(16).substring(2, 9);
    const commitId = genId("GIT");
    const commit = {
      id: commitId,
      hash,
      branch: "main",
      author: author || state.currentArtist || "saswat",
      shotId: shotId || null,
      assetId: assetId || null,
      version: version || "v01",
      message: message || `Committed ${shotId || assetId} (${version || "v01"}) via ${dccTool || "DCC"}`,
      timestamp: new Date().toISOString(),
      lfsFiles: files && files.length > 0 ? files : [
        { name: `${(shotId || assetId || "scene").toLowerCase()}_${version || "v01"}.blend`, size: "450 MB", oid: `sha256:${hash}ab9`, dcc: dccTool || "Blender" }
      ],
      totalSize: "450 MB",
    };

    setState((s) => {
      let updatedShots = s.shots;
      if (shotId) {
        const vNum = typeof version === "string" ? parseInt(version.replace(/\D/g, "")) || 1 : version;
        updatedShots = s.shots.map((sh) =>
          sh.id === shotId
            ? { ...sh, version: vNum, gitHash: hash, activityStep: Math.max(sh.activityStep || 1, 4) }
            : sh
        );
      }
      return {
        ...s,
        gitCommits: [commit, ...(s.gitCommits || [])],
        shots: updatedShots,
      };
    });

    addActivity({
      type: "commit",
      entityType: shotId ? "shot" : "asset",
      entity: shotId || assetId || commitId,
      text: `Git LFS commit [${hash}] on ${shotId || assetId}`,
      detail: `${commit.message} (${version || "v01"}) · Git/LFS Tracking`,
    });

    api.createGitCommit({ shotId, assetId, version, message, author: author || state.currentArtist, files, dccTool });
    return commit;
  }

  // ── Kitsu Review & Tracking Portal (Slide 5 & 7 Architecture) ──────────
  async function submitToKitsuReview({ shotId, version, playblastUrl, feedback, reviewerId }) {
    const kitsuId = `KT-${Math.floor(1000 + Math.random() * 9000)}`;
    const reviewId = genId("KT-REV");

    const newRev = {
      id: reviewId,
      kitsuId,
      shotId,
      version: version || "v04",
      status: "Pending Review",
      reviewerId: reviewerId || "director",
      syncStatus: "Synchronized",
      playblastUrl: playblastUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      timecode: "01:00:04:12",
      fps: 24,
      totalFrames: 144,
      feedback: feedback || "Queued in Kitsu review queue for creative approval.",
      date: new Date().toISOString(),
      annotations: [],
    };

    setState((s) => ({
      ...s,
      kitsuReviews: [newRev, ...(s.kitsuReviews || [])],
      shots: s.shots.map((sh) =>
        sh.id === shotId
          ? { ...sh, status: "Review", stageId: "render-review", kitsuId, reviewId, activityStep: 5 }
          : sh
      ),
    }));

    addActivity({
      type: "review",
      entityType: "shot",
      entity: shotId,
      text: `Kitsu Review [${kitsuId}] submitted for ${shotId}`,
      detail: `Version ${version || "v04"} waiting for director inspection`,
    });

    api.submitKitsuReview({ shotId, version, playblastUrl, feedback, reviewerId });
    return newRev;
  }

  async function addKitsuAnnotation(reviewId, { frame, timecode, text, author, coords }) {
    const annotation = {
      id: genId("ann"),
      frame: frame || 1,
      timecode: timecode || "00:00:01",
      author: author || "director",
      authorRole: author === "director" ? "Creative Director" : "Lead",
      text: text || "Annotation note",
      coords: coords || { x: 50, y: 50 },
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    setState((s) => ({
      ...s,
      kitsuReviews: (s.kitsuReviews || []).map((r) =>
        r.id === reviewId ? { ...r, annotations: [...(r.annotations || []), annotation] } : r
      ),
    }));

    api.addKitsuAnnotation(reviewId, { frame, timecode, text, author, coords });
    return annotation;
  }

  async function approveInKitsu(reviewId, feedback) {
    setState((s) => {
      const review = (s.kitsuReviews || []).find((r) => r.id === reviewId);
      const shotId = review?.shotId;
      return {
        ...s,
        kitsuReviews: (s.kitsuReviews || []).map((r) =>
          r.id === reviewId ? { ...r, status: "Approved", feedback: feedback || r.feedback } : r
        ),
        shots: shotId
          ? s.shots.map((sh) =>
              sh.id === shotId
                ? { ...sh, status: "Completed", progress: 100, activityStep: 6 }
                : sh
            )
          : s.shots,
      };
    });

    addActivity({
      type: "approval",
      entityType: "review",
      entity: reviewId,
      text: `Kitsu review approved`,
      detail: feedback || "Final sign-off completed for delivery.",
    });

    api.approveKitsuReview(reviewId, feedback);
  }

  async function requestChangesInKitsu(reviewId, feedback) {
    setState((s) => {
      const review = (s.kitsuReviews || []).find((r) => r.id === reviewId);
      const shotId = review?.shotId;
      return {
        ...s,
        kitsuReviews: (s.kitsuReviews || []).map((r) =>
          r.id === reviewId ? { ...r, status: "Changes Requested", feedback: feedback || r.feedback } : r
        ),
        shots: shotId
          ? s.shots.map((sh) =>
              sh.id === shotId
                ? { ...sh, status: "In Progress", activityStep: 2 }
                : sh
            )
          : s.shots,
      };
    });

    addActivity({
      type: "review",
      entityType: "review",
      entity: reviewId,
      text: `Changes requested on Kitsu review`,
      detail: feedback || "Sent back to artist for adjustments.",
    });

    api.requestChangesKitsuReview(reviewId, feedback);
  }

  function advanceActivityStep(shotId, nextStep) {
    setState((s) => ({
      ...s,
      shots: s.shots.map((sh) =>
        sh.id === shotId ? { ...sh, activityStep: nextStep } : sh
      ),
    }));
  }

  // ── Reset Demo State ────────────────────────────────────────────────
  async function resetDemoData() {
    resetPersistedState();
    const fresh = createFreshState();
    setState(fresh);
    saveState(fresh);
    await api.resetState();
  }

  const contextValue = {
    projects: projectsWithRecalculatedProgress,
    workflows: state.workflows,
    shots: state.shots,
    tasks: state.tasks,
    assets: state.assets,
    reviews: state.reviews,
    activities: state.activities,
    gitCommits: state.gitCommits || [],
    gitFiles: state.gitFiles || [],
    kitsuReviews: state.kitsuReviews || [],
    activitySteps: state.activitySteps || [],
    role: state.role,
    currentArtist: state.currentArtist,
    currentProjectId,
    backendConnected,
    backendLatency,

    setRole,
    setCurrentArtist,
    setCurrentProjectId,

    updateShotStatus,
    moveShotToStage,
    completeCurrentTask,
    submitVersion,
    updateTaskStatus,
    blockTask,
    submitTaskForReview,

    approveReview,
    requestChanges,
    updateAssetVersion,

    commitToGitLfs,
    submitToKitsuReview,
    addKitsuAnnotation,
    approveInKitsu,
    requestChangesInKitsu,
    advanceActivityStep,

    currentUser,
    users: USERS,
    isLoggedIn: Boolean(currentUser),
    login,
    logout,
    switchUser,
    canEditShot,
    canEditTask,
    canEditAsset,
    canApprove,
    mobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,

    addActivity,
    formatActivityTime,
    computeShotProgress,

    resetData: resetDemoData,
    resetDemoData,

    getProject,
    getWorkflow,
    getShot,
    getTask,
    getAsset,
    getReview,
    getArtistName,
    getMyShots,
    getMyTasks,
    getReviewsForShot,
    getBlockedShots,
    getInReviewShots,
  };

  return (
    <ProductionContext.Provider value={contextValue}>
      {children}
    </ProductionContext.Provider>
  );
}