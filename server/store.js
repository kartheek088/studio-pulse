import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createFreshState, WORKFLOWS, ARTISTS, genId } from "./seedData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? path.join("/tmp", "studio-pulse-data") : path.join(__dirname, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem fallback
}

class Store {
  constructor() {
    this.subscribers = new Set();
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && parsed.projects && parsed.shots) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("[Store] Error reading store.json, resetting to seed:", e.message);
    }
    const seed = createFreshState();
    this.persist(seed);
    return seed;
  }

  persist(state) {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf-8");
    } catch (e) {
      console.error("[Store] Error writing store.json:", e.message);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  emit(type, payload) {
    const event = { type, payload, timestamp: new Date().toISOString() };
    for (const sub of this.subscribers) {
      try {
        sub(event);
      } catch (e) {
        console.error("[Store] Subscriber error:", e.message);
      }
    }
  }

  getState() {
    // Recalculate project progress based on average of shots
    const projects = this.state.projects.map((proj) => {
      const projShots = this.state.shots.filter((s) => s.projectId === proj.id);
      if (projShots.length === 0) return proj;
      const avgProgress = Math.round(
        projShots.reduce((acc, s) => acc + (s.progress || 0), 0) / projShots.length
      );
      return { ...proj, progress: avgProgress };
    });
    return { ...this.state, projects };
  }

  addActivity({ type, entityType, entity, text, detail }) {
    const act = {
      id: genId("A"),
      type: type || "status",
      entityType: entityType || "shot",
      entity: entity || "",
      text: text || "",
      detail: detail || "",
      time: new Date().toISOString(),
    };
    this.state.activities = [act, ...this.state.activities];
    this.persist(this.state);
    this.emit("activity", act);
    return act;
  }

  createProject(data) {
    const newProj = {
      id: data.id || `proj_${Date.now()}`,
      name: data.name?.trim() || "Untitled Production",
      type: data.type || "Animation",
      client: data.client?.trim() || "Independent",
      deadline: data.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      status: data.status || "In Production",
      health: data.health || "Healthy",
      workflowId: data.workflowId || "connected",
      architecture: data.architecture || (data.workflowId === "connected" ? "Connected Pipeline (Unreal + Blender + Kitsu)" : `${data.type || "Standard"} Pipeline`),
      vcs: data.vcs || "Git + Git LFS",
      reviewPlatform: data.reviewPlatform || "Kitsu",
      progress: 0,
      shotCount: data.shotCount || (data.initialShots ? data.initialShots.length : 0),
      description: data.description || "",
    };

    this.state.projects = [newProj, ...this.state.projects];

    if (data.initialShots && Array.isArray(data.initialShots)) {
      this.state.shots = [...data.initialShots, ...this.state.shots];
    }
    if (data.initialTasks && Array.isArray(data.initialTasks)) {
      this.state.tasks = [...data.initialTasks, ...this.state.tasks];
    }

    this.persist(this.state);
    this.addActivity({
      type: "project",
      entityType: "project",
      entity: newProj.name,
      text: `Created new project "${newProj.name}"`,
      detail: `Client: ${newProj.client} · Type: ${newProj.type}`,
    });

    return newProj;
  }

  // --- Shots ---
  getShots() {
    return this.state.shots;
  }

  getShot(id) {
    return this.state.shots.find((s) => s.id === id) || null;
  }

  updateShot(id, updates) {
    const idx = this.state.shots.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    const oldShot = this.state.shots[idx];
    const updated = { ...oldShot, ...updates };
    this.state.shots[idx] = updated;

    if (updates.status && updates.status !== oldShot.status) {
      this.addActivity({
        type: updates.status === "Blocked" ? "block" : "status",
        entityType: "shot",
        entity: id,
        text: `Shot ${id} status updated to ${updates.status}`,
        detail: `Shot status shifted from ${oldShot.status} to ${updates.status}`,
      });
    }

    this.persist(this.state);
    this.emit("shot:updated", updated);
    return updated;
  }

  completeTaskForShot(shotId) {
    const shot = this.getShot(shotId);
    if (!shot) return null;

    const project = this.state.projects.find((p) => p.id === shot.projectId);
    const wf = project ? WORKFLOWS[project.workflowId] || WORKFLOWS.animation : WORKFLOWS.animation;
    const currentIdx = wf.stages.findIndex((st) => st.id === shot.stageId);

    // Complete tasks for this stage
    let taskName = "Current task";
    this.state.tasks = this.state.tasks.map((t) => {
      if (t.shotId === shotId && (t.stageId === shot.stageId || t.status !== "Completed")) {
        taskName = t.name;
        return { ...t, status: "Completed" };
      }
      return t;
    });

    this.addActivity({
      type: "task",
      entityType: "task",
      entity: shotId,
      text: `Task "${taskName}" completed`,
      detail: `Stage ${shot.stageId} finished for ${shot.id}`,
    });

    // Advance stage
    let updatedShot = shot;
    if (currentIdx >= 0 && currentIdx < wf.stages.length - 1) {
      const nextStage = wf.stages[currentIdx + 1];
      const newProgress = Math.min(100, Math.round(((currentIdx + 2) / wf.stages.length) * 100));
      const newStatus = nextStage.id === "review" ? "Review" : "In Progress";

      updatedShot = {
        ...shot,
        stageId: nextStage.id,
        status: newStatus,
        progress: newProgress,
      };

      const shotIdx = this.state.shots.findIndex((s) => s.id === shotId);
      this.state.shots[shotIdx] = updatedShot;

      this.addActivity({
        type: "stage",
        entityType: "shot",
        entity: shotId,
        text: `${shot.id} advanced to ${nextStage.name}`,
        detail: `Workflow stage updated to ${nextStage.name} (${newProgress}%)`,
      });
    }

    this.persist(this.state);
    this.emit("shot:advanced", updatedShot);
    return updatedShot;
  }

  submitShotVersion(shotId, version, feedback) {
    const shot = this.getShot(shotId);
    if (!shot) return null;

    const now = new Date().toISOString();
    const newRev = {
      id: genId("R"),
      shotId,
      version: version || "v05",
      status: "Pending Review",
      feedback: feedback || "Submitted for director review",
      reviewerId: "director",
      date: now,
    };

    this.state.reviews = [newRev, ...this.state.reviews];

    const shotIdx = this.state.shots.findIndex((s) => s.id === shotId);
    this.state.shots[shotIdx] = {
      ...shot,
      version: version || "v05",
      stageId: "review",
      status: "Review",
    };

    this.addActivity({
      type: "review",
      entityType: "shot",
      entity: shotId,
      text: `${shot.id} submitted ${version || "v05"}`,
      detail: `Queued for director review: "${feedback || "Ready for approval"}"`,
    });

    this.persist(this.state);
    this.emit("review:submitted", newRev);
    return { shot: this.state.shots[shotIdx], review: newRev };
  }

  // --- Reviews ---
  getReviews() {
    return this.state.reviews;
  }

  approveReview(reviewId) {
    const revIdx = this.state.reviews.findIndex((r) => r.id === reviewId);
    if (revIdx === -1) return null;

    const review = this.state.reviews[revIdx];
    this.state.reviews[revIdx] = { ...review, status: "Approved" };

    const shot = this.getShot(review.shotId);
    let updatedShot = shot;

    if (shot) {
      const project = this.state.projects.find((p) => p.id === shot.projectId);
      const wf = project ? WORKFLOWS[project.workflowId] || WORKFLOWS.animation : WORKFLOWS.animation;
      const currentIdx = wf.stages.findIndex((st) => st.id === shot.stageId);
      const nextStage = currentIdx >= 0 && currentIdx < wf.stages.length - 1 ? wf.stages[currentIdx + 1] : null;

      const shotIdx = this.state.shots.findIndex((s) => s.id === shot.id);
      if (nextStage) {
        const newProgress = Math.min(100, Math.round(((currentIdx + 2) / wf.stages.length) * 100));
        updatedShot = {
          ...shot,
          stageId: nextStage.id,
          status: currentIdx + 1 === wf.stages.length - 1 ? "Completed" : "In Progress",
          progress: newProgress,
        };
      } else {
        updatedShot = { ...shot, status: "Completed", progress: 100 };
      }
      this.state.shots[shotIdx] = updatedShot;

      this.addActivity({
        type: "approval",
        entityType: "review",
        entity: reviewId,
        text: `Director approved ${shot.id} ${review.version}`,
        detail: nextStage
          ? `Approved version ${review.version}. Advanced to ${nextStage.name}`
          : `Approved version ${review.version}. Shot delivery completed!`,
      });
    }

    this.persist(this.state);
    this.emit("review:approved", { review: this.state.reviews[revIdx], shot: updatedShot });
    return { review: this.state.reviews[revIdx], shot: updatedShot };
  }

  requestChanges(reviewId, feedback) {
    const revIdx = this.state.reviews.findIndex((r) => r.id === reviewId);
    if (revIdx === -1) return null;

    const review = this.state.reviews[revIdx];
    this.state.reviews[revIdx] = {
      ...review,
      status: "Changes Requested",
      feedback: feedback || "Revisions required by director",
    };

    const shot = this.getShot(review.shotId);
    let updatedShot = shot;

    if (shot) {
      const project = this.state.projects.find((p) => p.id === shot.projectId);
      const wf = project ? WORKFLOWS[project.workflowId] || WORKFLOWS.animation : WORKFLOWS.animation;
      const reviewStageIdx = wf.stages.findIndex((st) => st.id === "review");
      const prevStage = reviewStageIdx > 0 ? wf.stages[reviewStageIdx - 1] : wf.stages[0];

      const shotIdx = this.state.shots.findIndex((s) => s.id === shot.id);
      updatedShot = {
        ...shot,
        stageId: prevStage.id,
        status: "In Progress",
      };
      this.state.shots[shotIdx] = updatedShot;

      // Add revision task
      const revisionTask = {
        id: genId("T"),
        shotId: shot.id,
        name: `Revisions: ${feedback || "Director Feedback"}`,
        stageId: prevStage.id,
        artistId: shot.artistId,
        priority: "High",
        status: "In Progress",
        dueDate: "Tomorrow",
        department: prevStage.name,
      };
      this.state.tasks = [revisionTask, ...this.state.tasks];

      this.addActivity({
        type: "review",
        entityType: "review",
        entity: reviewId,
        text: `Director requested changes on ${shot.id}`,
        detail: `Returned to ${prevStage.name}: "${feedback || "Adjustments required"}"`,
      });
    }

    this.persist(this.state);
    this.emit("review:changes_requested", { review: this.state.reviews[revIdx], shot: updatedShot });
    return { review: this.state.reviews[revIdx], shot: updatedShot };
  }

  // --- Tasks ---
  getTasks() {
    return this.state.tasks;
  }

  updateTask(id, updates) {
    const idx = this.state.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const oldTask = this.state.tasks[idx];
    const updated = { ...oldTask, ...updates };
    this.state.tasks[idx] = updated;

    this.addActivity({
      type: updates.status === "Blocked" ? "block" : "task",
      entityType: "task",
      entity: id,
      text: `Task "${oldTask.name}" status: ${updates.status || "Updated"}`,
      detail: `Task status set to ${updates.status || "Updated"}`,
    });

    this.persist(this.state);
    this.emit("task:updated", updated);
    return updated;
  }

  // --- Assets ---
  getAssets() {
    return this.state.assets;
  }

  updateAsset(id, { version, status }) {
    const idx = this.state.assets.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const asset = this.state.assets[idx];
    const updatedStatus = status || asset.status;
    const updatedVersion = version || asset.version;

    // Version history
    const existingVersions = asset.versions || [
      { version: asset.version, status: asset.status, date: asset.updated || "2026-09-08" },
    ];
    const versionHistory = [
      ...existingVersions.filter((v) => v.version !== updatedVersion),
      { version: updatedVersion, status: updatedStatus, date: new Date().toISOString().split("T")[0] },
    ];

    const updatedAsset = {
      ...asset,
      version: updatedVersion,
      status: updatedStatus,
      versions: versionHistory,
      updated: "Today",
    };
    this.state.assets[idx] = updatedAsset;

    // If approved, unblock dependent shots
    if (updatedStatus === "Approved") {
      this.state.shots = this.state.shots.map((sh) => {
        if (sh.status === "Blocked" && sh.dependencies && sh.dependencies.includes(id)) {
          const otherDeps = sh.dependencies.filter((dId) => dId !== id);
          const allOtherApproved = otherDeps.every((dId) => {
            const otherA = this.state.assets.find((a) => a.id === dId);
            return otherA && otherA.status === "Approved";
          });
          if (allOtherApproved) {
            return { ...sh, status: "In Progress" };
          }
        }
        return sh;
      });
    }

    this.addActivity({
      type: "asset",
      entityType: "asset",
      entity: id,
      text: `${asset.name} updated to ${updatedVersion}`,
      detail: `Status: ${updatedStatus}`,
    });

    this.persist(this.state);
    this.emit("asset:updated", updatedAsset);
    return updatedAsset;
  }

  // --- Git + Git LFS Asset & Version Control (Slide 5 & 7) ---
  getGitCommits() {
    return this.state.gitCommits || [];
  }

  getGitFiles() {
    return this.state.gitFiles || [];
  }

  addGitCommit({ shotId, assetId, version, message, author, files, dccTool }) {
    const hash = Math.random().toString(16).substring(2, 9);
    const commitId = genId("GIT");
    const commit = {
      id: commitId,
      hash,
      branch: "main",
      author: author || "saswat",
      shotId: shotId || null,
      assetId: assetId || null,
      version: version || "v01",
      message: message || `Updated ${shotId || assetId} (${version || "v01"}) via ${dccTool || "DCC"}`,
      timestamp: new Date().toISOString(),
      lfsFiles: files && files.length > 0 ? files : [
        { name: `${(shotId || assetId || "scene").toLowerCase()}_${version || "v01"}.blend`, size: "450 MB", oid: `sha256:${hash}ab9`, dcc: dccTool || "Blender" }
      ],
      totalSize: "450 MB",
    };

    if (!this.state.gitCommits) this.state.gitCommits = [];
    this.state.gitCommits = [commit, ...this.state.gitCommits];

    if (shotId) {
      const shot = this.getShot(shotId);
      if (shot) {
        this.updateShot(shotId, {
          version: typeof version === "string" ? parseInt(version.replace(/\D/g, "")) || shot.version : version,
          gitHash: hash,
          activityStep: Math.max(shot.activityStep || 1, 4),
        });
      }
    }

    this.addActivity({
      type: "commit",
      entityType: shotId ? "shot" : "asset",
      entity: shotId || assetId || commitId,
      text: `Git LFS commit [${hash}] on ${shotId || assetId}`,
      detail: `${commit.message} (${version || "v01"}) · ${author || "Artist"}`,
    });

    this.persist(this.state);
    this.emit("git:commit", commit);
    return commit;
  }

  // --- Kitsu Review & Approval Portal (Slide 5 & 7) ---
  getKitsuReviews() {
    return this.state.kitsuReviews || [];
  }

  submitKitsuReview({ shotId, version, playblastUrl, feedback, reviewerId }) {
    const shot = this.getShot(shotId);
    const kitsuId = `KT-${Math.floor(1000 + Math.random() * 9000)}`;
    const reviewId = genId("KT-REV");

    const newReview = {
      id: reviewId,
      kitsuId,
      shotId,
      version: version || (shot ? `v0${shot.version}` : "v01"),
      status: "Pending Review",
      reviewerId: reviewerId || "director",
      syncStatus: "Synchronized",
      playblastUrl: playblastUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      timecode: "01:00:04:12",
      fps: 24,
      totalFrames: 144,
      feedback: feedback || "Submitted to Kitsu review portal for creative director sign-off.",
      date: new Date().toISOString(),
      annotations: [],
    };

    if (!this.state.kitsuReviews) this.state.kitsuReviews = [];
    this.state.kitsuReviews = [newReview, ...this.state.kitsuReviews];

    if (shot) {
      this.updateShot(shotId, {
        status: "Review",
        stageId: "render-review",
        kitsuId,
        reviewId,
        activityStep: 5,
      });
    }

    this.addActivity({
      type: "review",
      entityType: "shot",
      entity: shotId,
      text: `Kitsu Review Ticket [${kitsuId}] created for ${shotId}`,
      detail: `Version ${newReview.version} queued in Kitsu portal`,
    });

    this.persist(this.state);
    this.emit("kitsu:review_created", newReview);
    return newReview;
  }

  addKitsuAnnotation({ reviewId, frame, timecode, text, author, coords }) {
    const reviews = this.state.kitsuReviews || [];
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) return null;

    const annotation = {
      id: genId("ann"),
      frame: frame || 1,
      timecode: timecode || "00:00:01",
      author: author || "director",
      authorRole: author === "director" ? "Creative Director" : "Lead",
      text: text || "Annotation added",
      coords: coords || { x: 50, y: 50 },
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    reviews[idx].annotations = [...(reviews[idx].annotations || []), annotation];
    this.state.kitsuReviews = reviews;

    this.addActivity({
      type: "review",
      entityType: "review",
      entity: reviewId,
      text: `Kitsu annotation on Frame ${frame}`,
      detail: `"${text}" · ${author || "Director"}`,
    });

    this.persist(this.state);
    this.emit("kitsu:annotated", { review: reviews[idx], annotation });
    return annotation;
  }

  approveKitsuReview(reviewId, feedback) {
    const reviews = this.state.kitsuReviews || [];
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) return null;

    reviews[idx].status = "Approved";
    if (feedback) reviews[idx].feedback = feedback;

    const shotId = reviews[idx].shotId;
    let updatedShot = null;
    if (shotId) {
      const shot = this.getShot(shotId);
      if (shot) {
        updatedShot = this.updateShot(shotId, {
          status: "Completed",
          progress: 100,
          activityStep: 6,
        });
      }
    }

    this.addActivity({
      type: "approval",
      entityType: "review",
      entity: reviewId,
      text: `Kitsu Review [${reviews[idx].kitsuId}] Approved`,
      detail: feedback || "Director approved final render for delivery.",
    });

    this.persist(this.state);
    this.emit("kitsu:approved", { review: reviews[idx], shot: updatedShot });
    return { review: reviews[idx], shot: updatedShot };
  }

  requestChangesKitsuReview(reviewId, feedback) {
    const reviews = this.state.kitsuReviews || [];
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) return null;

    reviews[idx].status = "Changes Requested";
    reviews[idx].feedback = feedback || "Revisions requested by director";

    const shotId = reviews[idx].shotId;
    let updatedShot = null;
    if (shotId) {
      const shot = this.getShot(shotId);
      if (shot) {
        updatedShot = this.updateShot(shotId, {
          status: "In Progress",
          activityStep: 2,
        });
      }
    }

    this.addActivity({
      type: "review",
      entityType: "review",
      entity: reviewId,
      text: `Changes requested on Kitsu Review [${reviews[idx].kitsuId}]`,
      detail: feedback || "Sent back to artist for adjustments.",
    });

    this.persist(this.state);
    this.emit("kitsu:changes_requested", { review: reviews[idx], shot: updatedShot });
    return { review: reviews[idx], shot: updatedShot };
  }

  // --- Reset ---
  reset() {
    const fresh = createFreshState();
    this.state = fresh;
    this.persist(fresh);
    this.emit("state:reset", fresh);
    return fresh;
  }
}

export const store = new Store();
