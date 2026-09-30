import express from "express";
import cors from "cors";
import { store } from "./store.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ── Health ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Studio Pulse Pipeline Engine",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    shotCount: store.getShots().length,
  });
});

// ── Full State ─────────────────────────────────────────────────────────
app.get("/api/state", (req, res) => {
  res.json(store.getState());
});

// ── Projects ───────────────────────────────────────────────────────────
app.get("/api/projects", (req, res) => {
  res.json(store.getState().projects);
});

app.get("/api/projects/:id", (req, res) => {
  const project = store.getState().projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
});

// ── Shots ──────────────────────────────────────────────────────────────
app.get("/api/shots", (req, res) => {
  let shots = store.getShots();
  const { projectId, status, stageId, artistId } = req.query;
  if (projectId) shots = shots.filter((s) => s.projectId === projectId);
  if (status) shots = shots.filter((s) => s.status === status);
  if (stageId) shots = shots.filter((s) => s.stageId === stageId);
  if (artistId) shots = shots.filter((s) => s.artistId === artistId);
  res.json(shots);
});

app.get("/api/shots/:id", (req, res) => {
  const shot = store.getShot(req.params.id);
  if (!shot) return res.status(404).json({ error: "Shot not found" });
  res.json(shot);
});

app.patch("/api/shots/:id", (req, res) => {
  const updated = store.updateShot(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Shot not found" });
  res.json(updated);
});

app.post("/api/shots/:id/complete-task", (req, res) => {
  const updated = store.completeTaskForShot(req.params.id);
  if (!updated) return res.status(404).json({ error: "Shot not found" });
  res.json(updated);
});

app.post("/api/shots/:id/submit-version", (req, res) => {
  const { version, feedback } = req.body;
  const result = store.submitShotVersion(req.params.id, version, feedback);
  if (!result) return res.status(404).json({ error: "Shot not found" });
  res.json(result);
});

// ── Tasks ──────────────────────────────────────────────────────────────
app.get("/api/tasks", (req, res) => {
  let tasks = store.getTasks();
  if (req.query.shotId) tasks = tasks.filter((t) => t.shotId === req.query.shotId);
  if (req.query.artistId) tasks = tasks.filter((t) => t.artistId === req.query.artistId);
  res.json(tasks);
});

app.patch("/api/tasks/:id", (req, res) => {
  const updated = store.updateTask(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Task not found" });
  res.json(updated);
});

// ── Assets ─────────────────────────────────────────────────────────────
app.get("/api/assets", (req, res) => {
  res.json(store.getAssets());
});

app.patch("/api/assets/:id", (req, res) => {
  const updated = store.updateAsset(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Asset not found" });
  res.json(updated);
});

// ── Reviews ────────────────────────────────────────────────────────────
app.get("/api/reviews", (req, res) => {
  res.json(store.getReviews());
});

app.post("/api/reviews/:id/approve", (req, res) => {
  const result = store.approveReview(req.params.id);
  if (!result) return res.status(404).json({ error: "Review not found" });
  res.json(result);
});

app.post("/api/reviews/:id/request-changes", (req, res) => {
  const { feedback } = req.body;
  const result = store.requestChanges(req.params.id, feedback);
  if (!result) return res.status(404).json({ error: "Review not found" });
  res.json(result);
});

// ── Git + Git LFS (Asset & Version Control) ───────────────────────────
app.get("/api/git/commits", (req, res) => {
  res.json(store.getGitCommits());
});

app.get("/api/git/files", (req, res) => {
  res.json(store.getGitFiles());
});

app.post("/api/git/commit", (req, res) => {
  const commit = store.addGitCommit(req.body);
  res.json(commit);
});

// ── Kitsu Review & Approval Portal ────────────────────────────────────
app.get("/api/kitsu/reviews", (req, res) => {
  res.json(store.getKitsuReviews());
});

app.post("/api/kitsu/reviews", (req, res) => {
  const review = store.submitKitsuReview(req.body);
  res.json(review);
});

app.post("/api/kitsu/reviews/:id/annotate", (req, res) => {
  const annotation = store.addKitsuAnnotation({ reviewId: req.params.id, ...req.body });
  if (!annotation) return res.status(404).json({ error: "Review not found" });
  res.json(annotation);
});

app.post("/api/kitsu/reviews/:id/approve", (req, res) => {
  const result = store.approveKitsuReview(req.params.id, req.body.feedback);
  if (!result) return res.status(404).json({ error: "Review not found" });
  res.json(result);
});

app.post("/api/kitsu/reviews/:id/request-changes", (req, res) => {
  const result = store.requestChangesKitsuReview(req.params.id, req.body.feedback);
  if (!result) return res.status(404).json({ error: "Review not found" });
  res.json(result);
});

// ── Activities ─────────────────────────────────────────────────────────
app.get("/api/activities", (req, res) => {
  res.json(store.getState().activities);
});

// ── Reset ──────────────────────────────────────────────────────────────
app.post("/api/reset", (req, res) => {
  const fresh = store.reset();
  res.json({ success: true, message: "Demo state reset to initial seed.", state: fresh });
});

// ── Server-Sent Events (Live Pipeline Events Stream) ───────────────────
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`);

  // Subscribe to store mutations
  const unsubscribe = store.subscribe((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  // Keep-alive heartbeat every 15s
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

app.listen(PORT, () => {
  console.log(`[Studio Pulse API] Server running on http://localhost:${PORT}`);
});
