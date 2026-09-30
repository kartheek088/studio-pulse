import { createFreshState } from "../data/mockData";

const KEY = "studio-pulse-demo-v2";

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function resetPersistedState() {
  try {
    localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

export function getInitialOrFresh() {
  const saved = loadState();
  if (saved && saved.projects && saved.shots) return saved;
  const fresh = createFreshState();
  saveState(fresh);
  return fresh;
}
