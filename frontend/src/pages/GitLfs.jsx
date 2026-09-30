import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Badge } from "../components/common/Badge";
import {
  Database,
  GitCommit,
  GitBranch,
  Lock,
  Unlock,
  FileCode,
  HardDrive,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Plus,
  Box,
  Film,
  User,
  Layers,
} from "lucide-react";

export function GitLfs() {
  const navigate = useNavigate();
  const {
    gitCommits,
    gitFiles,
    shots,
    assets,
    commitToGitLfs,
    currentArtist,
    getArtistName,
    currentUser,
    role,
  } = useProduction();

  const isLead = currentUser?.role === "productionLead" || role === "productionLead";
  const isArtist = currentUser?.role === "artist" || role === "artist";

  const [viewScope, setViewScope] = useState(isArtist ? "my" : "all");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'commits' | 'files'
  const [selectedShotForCommit, setSelectedShotForCommit] = useState("SHOT04");
  const [commitMessage, setCommitMessage] = useState("");
  const [versionBump, setVersionBump] = useState("v05");
  const [isCommitting, setIsCommitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [fileLocks, setFileLocks] = useState({});

  useEffect(() => {
    if (isArtist) {
      setViewScope("my");
    } else {
      setViewScope("all");
    }
  }, [currentUser?.id, isArtist]);

  const currentUserId = (currentUser?.id || currentArtist || "").toLowerCase();
  const currentUserName = currentUser?.name || "Artist";

  function handleToggleFileLock(fileId, existingLock) {
    const isLockedByMe =
      existingLock &&
      (existingLock.toLowerCase().includes(currentUserId) ||
        existingLock.toLowerCase().includes(currentUserName.toLowerCase()));

    if (existingLock && !isLockedByMe && !isLead) {
      setToast(`File is locked by ${existingLock}. Permission restricted.`);
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setFileLocks((prev) => {
      const next = { ...prev };
      if (next[fileId] || existingLock) {
        delete next[fileId];
        setToast(`Released exclusive Git LFS lock on ${fileId}!`);
      } else {
        next[fileId] = `${currentUser?.avatar || currentUser?.id?.toUpperCase() || "YOU"} (${currentUserName})`;
        setToast(`Acquired exclusive Git LFS lock on ${fileId}!`);
      }
      return next;
    });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleCreateCommit(e) {
    e.preventDefault();
    if (!selectedShotForCommit) return;
    setIsCommitting(true);

    const shot = shots.find((s) => s.id === selectedShotForCommit);
    const msg = commitMessage || `Update ${selectedShotForCommit} assets & sequencer layout`;

    await commitToGitLfs({
      shotId: selectedShotForCommit,
      version: versionBump,
      message: msg,
      author: currentUser?.id || currentArtist,
      dccTool: shot?.dccTool || "Blender",
    });

    setCommitMessage("");
    setIsCommitting(false);
    setToast(`Committed ${selectedShotForCommit} (${versionBump}) to Git + Git LFS!`);
    setTimeout(() => setToast(null), 3500);
  }

  const myCommits = gitCommits.filter((c) => {
    const cAuthor = (c.author || "").toLowerCase();
    return cAuthor === currentUserId || cAuthor.includes(currentUserId);
  });

  const displayCommits = viewScope === "my" ? myCommits : gitCommits;

  const totalLfsStorage = "16.8 GB";

  return (
    <div className="page git-lfs-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1>Git + Git LFS Version Control</h1>
          <p className="page-subtitle">
            Track large DCC binary scene files (.blend, .uasset, textures) and exclusive locks.
          </p>
        </div>
      </div>

      {toast && (
        <div className="arch-toast-bar">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card tone-info">
          <div className="stat-card-top">
            <p>Active Branch</p>
            <span className="stat-icon-lucide"><GitBranch size={18} /></span>
          </div>
          <strong>main</strong>
          <span className="stat-change">Synchronized with remote LFS server</span>
        </div>

        <div className="stat-card tone-ok">
          <div className="stat-card-top">
            <p>Git Commits</p>
            <span className="stat-icon-lucide"><GitCommit size={18} /></span>
          </div>
          <strong>{gitCommits.length}</strong>
          <span className="stat-change">Tracked across shots & assets</span>
        </div>

        <div className="stat-card tone-warning">
          <div className="stat-card-top">
            <p>LFS Binary Objects</p>
            <span className="stat-icon-lucide"><HardDrive size={18} /></span>
          </div>
          <strong>{gitFiles.length}</strong>
          <span className="stat-change">{totalLfsStorage} storage managed</span>
        </div>
      </div>

      {/* New Commit Drawer / Card */}
      <section className="panel git-commit-panel">
        <div className="panel-header">
          <div>
            <h2>Commit New Version (Git + Git LFS)</h2>
            <p>Check in an artist iteration with version bump and binary tracking</p>
          </div>
        </div>

        <form onSubmit={handleCreateCommit} className="git-commit-form">
          <div className="commit-form-grid">
            <div className="form-group">
              <label>Target Shot:</label>
              <select
                className="form-select"
                value={selectedShotForCommit}
                onChange={(e) => setSelectedShotForCommit(e.target.value)}
              >
                {shots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}: {s.name} (Current: v{s.version || 1})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Version Bump:</label>
              <input
                type="text"
                className="form-input"
                value={versionBump}
                onChange={(e) => setVersionBump(e.target.value)}
                placeholder="e.g. v05"
              />
            </div>

            <div className="form-group span-2">
              <label>Commit Message:</label>
              <input
                type="text"
                className="form-input"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="e.g. Blender animation curves pass & Unreal Sequencer playblast sync"
              />
            </div>
          </div>

          <div className="commit-form-submit">
            <button
              type="submit"
              className="btn-action-primary"
              disabled={isCommitting}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <UploadCloud size={16} />
              {isCommitting ? "Pushed to Git LFS..." : "Commit Version & Push to Git LFS"}
            </button>
          </div>
        </form>
      </section>

      {/* View Scope Switcher for User Accessibility */}
      <div className="view-scope-switcher">
        <button
          type="button"
          className={`scope-pill-btn ${viewScope === "my" ? "active" : ""}`}
          onClick={() => setViewScope("my")}
        >
          <User size={14} /> My Commits ({myCommits.length})
        </button>
        <button
          type="button"
          className={`scope-pill-btn ${viewScope === "all" ? "active" : ""}`}
          onClick={() => setViewScope("all")}
        >
          <Layers size={14} /> All VCS Records ({gitCommits.length})
        </button>
      </div>

      {/* Commit History & LFS Files Tabs */}
      <div className="studio-toolbar">
        <div className="filter-chips-group">
          {["all", "commits", "files"].map((tab) => (
            <button
              type="button"
              key={tab}
              className={`filter-chip-btn ${filterType === tab ? "active" : ""}`}
              onClick={() => setFilterType(tab)}
            >
              {tab === "all" ? "All VCS Records" : tab === "commits" ? "Commit Log" : "LFS File Vault"}
            </button>
          ))}
        </div>
      </div>

      {/* Commits Log */}
      {(filterType === "all" || filterType === "commits") && (
        <section className="panel git-history-panel">
          <div className="panel-header">
            <div>
              <h2>Git Version Log ({displayCommits.length} commits)</h2>
              <p>Chronological commits linking DCC scenes, playblasts, and pipeline versions</p>
            </div>
          </div>

          <div className="git-commit-list">
            {displayCommits.map((c) => (
              <div key={c.id} className="git-commit-row">
                <div className="git-commit-left">
                  <span className="git-hash-pill">
                    <GitCommit size={13} /> {c.hash}
                  </span>
                  <span className="git-version-badge">{c.version}</span>
                </div>

                <div className="git-commit-mid">
                  <div className="git-commit-msg-row">
                    <strong>{c.message}</strong>
                    {c.shotId && (
                      <span
                        className="git-shot-link"
                        onClick={() => navigate(`/shots/${c.shotId}`)}
                      >
                        {c.shotId} <ExternalLink size={11} />
                      </span>
                    )}
                    {c.assetId && (
                      <span
                        className="git-shot-link"
                        onClick={() => navigate("/assets")}
                      >
                        {c.assetId} <ExternalLink size={11} />
                      </span>
                    )}
                  </div>
                  <div className="git-commit-meta">
                    <span>Committed by: <strong>{getArtistName(c.author)}</strong></span>
                    <span>Branch: <strong>{c.branch}</strong></span>
                    <span>Date: {new Date(c.timestamp).toLocaleString()}</span>
                  </div>

                  {/* LFS Files attached */}
                  {c.lfsFiles && c.lfsFiles.length > 0 && (
                    <div className="git-lfs-files-pills">
                      {c.lfsFiles.map((f, idx) => (
                        <span key={idx} className="lfs-file-chip">
                          <HardDrive size={11} /> {f.name} ({f.size})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="git-commit-right">
                  <span className="git-total-size">{c.totalSize || "450 MB"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LFS Files Table */}
      {(filterType === "all" || filterType === "files") && (
        <section className="panel git-files-panel">
          <div className="panel-header">
            <div>
              <h2>Git LFS Managed Large Files ({gitFiles.length} tracked)</h2>
              <p>DCC scenes, rigs, Unreal assets, and media managed via Git LFS pointers. Click lock badge to acquire/release.</p>
            </div>
          </div>

          <table className="studio-table">
            <thead>
              <tr>
                <th>LFS Filename</th>
                <th>DCC Application</th>
                <th>File Type</th>
                <th>File Size</th>
                <th>Lock Status (Click to Toggle)</th>
                <th>Linked Shot / Asset</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {gitFiles.map((file) => {
                const currentLock = fileLocks[file.id] || file.lockedBy;

                return (
                  <tr key={file.id}>
                    <td>
                      <span className="lfs-filename-tag">
                        <FileCode size={14} /> {file.name}
                      </span>
                    </td>
                    <td>
                      <span className="dcc-tag-pill">{file.dcc}</span>
                    </td>
                    <td>{file.type}</td>
                    <td>
                      <strong>{file.size}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`lock-status-badge ${currentLock ? "locked" : "unlocked"}`}
                        onClick={() => handleToggleFileLock(file.id, currentLock)}
                        title={currentLock ? `Locked by ${currentLock}. Click to unlock` : "Click to acquire exclusive lock"}
                        style={{ border: "none", cursor: "pointer", background: "transparent" }}
                      >
                        {currentLock ? (
                          <>
                            <Lock size={12} /> Locked: {currentLock}
                          </>
                        ) : (
                          <>
                            <Unlock size={12} /> Unlocked (Click to Lock)
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      {file.shotId ? (
                        <button
                          type="button"
                          className="table-link-btn"
                          onClick={() => navigate(`/shots/${file.shotId}`)}
                        >
                          {file.shotId}
                        </button>
                      ) : file.assetId ? (
                        <button
                          type="button"
                          className="table-link-btn"
                          onClick={() => navigate("/assets")}
                        >
                          {file.assetId}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{file.updated}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
