const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
  : "";
const BASE_URL = `${API_BASE}/api`;

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Request to ${endpoint} failed:`, err.message);
    return null;
  }
}

export const api = {
  // Live SSE stream endpoint
  getEventsUrl: () => `${BASE_URL}/events`,

  // Check health and ping latency
  checkHealth: async () => {
    const start = performance.now();
    const data = await request("/health");
    if (!data) return null;
    const latency = Math.round(performance.now() - start);
    return { ...data, latency };
  },

  // Fetch full state from backend
  getState: () => request("/state"),

  // Projects
  getProjects: () => request("/projects"),
  getProject: (id) => request(`/projects/${id}`),

  // Shots
  getShots: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return request(`/shots${params ? `?${params}` : ""}`);
  },
  getShot: (id) => request(`/shots/${id}`),
  updateShot: (id, updates) =>
    request(`/shots/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),
  completeTaskForShot: (id) =>
    request(`/shots/${id}/complete-task`, {
      method: "POST",
    }),
  submitVersion: (id, version, feedback) =>
    request(`/shots/${id}/submit-version`, {
      method: "POST",
      body: JSON.stringify({ version, feedback }),
    }),

  // Tasks
  getTasks: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return request(`/tasks${params ? `?${params}` : ""}`);
  },
  updateTask: (id, updates) =>
    request(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  // Assets
  getAssets: () => request("/assets"),
  updateAsset: (id, { version, status }) =>
    request(`/assets/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ version, status }),
    }),

  // Reviews
  getReviews: () => request("/reviews"),
  approveReview: (id) =>
    request(`/reviews/${id}/approve`, {
      method: "POST",
    }),
  requestChanges: (id, feedback) =>
    request(`/reviews/${id}/request-changes`, {
      method: "POST",
      body: JSON.stringify({ feedback }),
    }),

  // Git + Git LFS (Asset & Version Control)
  getGitCommits: () => request("/git/commits"),
  getGitFiles: () => request("/git/files"),
  createGitCommit: (data) =>
    request("/git/commit", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Kitsu Review & Tracking Portal
  getKitsuReviews: () => request("/kitsu/reviews"),
  submitKitsuReview: (data) =>
    request("/kitsu/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  addKitsuAnnotation: (reviewId, data) =>
    request(`/kitsu/reviews/${reviewId}/annotate`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  approveKitsuReview: (reviewId, feedback) =>
    request(`/kitsu/reviews/${reviewId}/approve`, {
      method: "POST",
      body: JSON.stringify({ feedback }),
    }),
  requestChangesKitsuReview: (reviewId, feedback) =>
    request(`/kitsu/reviews/${reviewId}/request-changes`, {
      method: "POST",
      body: JSON.stringify({ feedback }),
    }),

  // Activities
  getActivities: () => request("/activities"),

  // Reset
  resetState: () =>
    request("/reset", {
      method: "POST",
    }),
};

