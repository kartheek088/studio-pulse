import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProduction } from "../context/ProductionContext";
import { Badge } from "../components/common/Badge";
import { Modal } from "../components/common/Modal";
import {
  Box,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ExternalLink,
  GitCommit,
  Lock,
  Unlock,
  FolderKanban,
  FileCode,
  HardDrive,
  GitMerge,
  User,
  ShieldCheck,
} from "lucide-react";

export function Assets() {
  const navigate = useNavigate();
  const {
    assets,
    updateAssetVersion,
    commitToGitLfs,
    gitFiles,
    currentUser,
    canEditAsset,
    canApprove: ctxCanApprove,
    role,
  } = useProduction();

  const isLead = currentUser?.role === "productionLead" || role === "productionLead";
  const isDirector = currentUser?.role === "director" || role === "director";
  const isArtist = currentUser?.role === "artist" || role === "artist";
  const canApprove = isLead || isDirector || (ctxCanApprove ? ctxCanApprove() : false);

  const [viewScope, setViewScope] = useState(isArtist ? "my" : "all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [lockedAssets, setLockedAssets] = useState({
    CHAR_001: "MJ (Maya Joshi)",
    ENV_014: "RS (Rohan Sharma)",
  });

  useEffect(() => {
    if (isArtist) {
      setViewScope("my");
    } else {
      setViewScope("all");
    }
  }, [currentUser?.id, isArtist]);

  function triggerToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  const currentUserId = (currentUser?.id || "").toLowerCase();
  const currentUserAvatar = (currentUser?.avatar || "").toLowerCase();
  const currentUserName = currentUser?.name || "Current Artist";

  const myAccessibleAssets = assets.filter((a) => {
    const owner = (a.owner || "").toLowerCase();
    return (
      owner === currentUserId ||
      owner === currentUserAvatar ||
      owner.includes(currentUserId) ||
      owner.includes(currentUserAvatar)
    );
  });

  const baseAssets = viewScope === "my" ? myAccessibleAssets : assets;

  const categories = ["All", "Character", "Environment", "Prop", "Camera", "Rig"];

  const filtered = baseAssets.filter((a) => {
    const matchCategory =
      categoryFilter === "All" ||
      a.category === categoryFilter ||
      a.type === categoryFilter;
    const matchSearch =
      `${a.id} ${a.name} ${a.owner || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  function handleSelectVersion(version, status) {
    if (!selectedAsset) return;
    updateAssetVersion(selectedAsset.id, version, status || selectedAsset.status);
    setSelectedAsset((prev) => ({
      ...prev,
      version,
      status: status || prev.status,
    }));
  }

  function handleToggleApproval() {
    if (!selectedAsset) return;
    if (!canApprove) {
      triggerToast("Approval restricted to Creative Director or Production Lead.");
      return;
    }
    const newStatus = selectedAsset.status === "Approved" ? "In Progress" : "Approved";
    updateAssetVersion(selectedAsset.id, selectedAsset.version, newStatus);
    setSelectedAsset((prev) => ({
      ...prev,
      status: newStatus,
    }));
    triggerToast(`${selectedAsset.id} marked as ${newStatus}!`);
  }

  function handleToggleLock(assetId) {
    const currentHolder = lockedAssets[assetId];
    if (currentHolder) {
      const canUnlock =
        isLead ||
        currentHolder.toLowerCase().includes(currentUserId) ||
        currentHolder.toLowerCase().includes(currentUserAvatar) ||
        currentHolder.toLowerCase().includes(currentUserName.toLowerCase());

      if (!canUnlock) {
        triggerToast(`Exclusive Lock held by ${currentHolder}. Only the holder or lead can unlock.`);
        return;
      }
      setLockedAssets((prev) => {
        const copy = { ...prev };
        delete copy[assetId];
        return copy;
      });
      triggerToast(`Unlocked ${assetId} in Git LFS!`);
    } else {
      const lockerLabel = `${currentUser?.avatar || currentUser?.id?.toUpperCase() || "YOU"} (${currentUser?.name || "Artist"})`;
      setLockedAssets((prev) => ({ ...prev, [assetId]: lockerLabel }));
      triggerToast(`Acquired Git LFS file lock on ${assetId}!`);
    }
  }

  async function handleCommitAsset(asset) {
    const newVer = `v0${(parseInt(String(asset.version).replace(/\D/g, "")) || 1) + 1}`;
    await commitToGitLfs({
      assetId: asset.id,
      version: newVer,
      message: `Asset revision bump: ${asset.name} (${newVer})`,
      dccTool: asset.type === "Environment" ? "Unreal Engine" : "Blender",
      author: currentUser?.id || "artist",
    });
    updateAssetVersion(asset.id, newVer, asset.status);
    triggerToast(`Committed ${asset.id} ${newVer} to Git LFS!`);
  }

  function getAssetFileInfo(asset) {
    const isEnv = asset.type === "Environment";
    const isRig = asset.type === "Rig" || asset.type === "Character";
    return {
      filename: `${asset.id.toLowerCase()}_master_v${asset.version || "01"}.${isEnv ? "uasset" : "blend"}`,
      size: isEnv ? "1.4 GB" : "480 MB",
      dcc: isEnv ? "Unreal Engine 5.4" : "Blender 4.2 LTS",
      lfsOid: `sha256:${asset.id.toLowerCase()}84920fcb`,
    };
  }

  return (
    <div className="page assets-page">
      {toastMsg && (
        <div className="arch-toast-bar">
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <Modal
          isOpen={Boolean(selectedAsset)}
          onClose={() => setSelectedAsset(null)}
          title={`${selectedAsset.id} — ${selectedAsset.name}`}
        >
          <div className="asset-detail-modal-body">
            <div className="asset-modal-header-row">
              <div>
                <span className="asset-modal-category">
                  {selectedAsset.category || selectedAsset.type} Asset
                </span>
                <p className="asset-modal-owner">
                  Owner: <strong>{selectedAsset.owner || "Production Team"}</strong>
                </p>
              </div>
              <Badge
                variant={selectedAsset.status === "Approved" ? "ok" : "warn"}
                text={selectedAsset.status}
              />
            </div>

            {/* Git LFS Asset Vault Details (Slide 5 & 7) */}
            {(() => {
              const fileInfo = getAssetFileInfo(selectedAsset);
              const isLocked = Boolean(lockedAssets[selectedAsset.id]);

              return (
                <div className="asset-lfs-info-card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "14px", margin: "14px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "13px" }}>
                      <HardDrive size={15} style={{ color: "var(--accent)" }} />
                      <span>Git + Git LFS Binary Tracking (Slide 5 & 7)</span>
                    </div>
                    <span className="git-lfs-badge" style={{ fontSize: "10px", padding: "2px 7px" }}>
                      LFS Vault
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    <div>
                      <span style={{ display: "block", color: "var(--text-muted)", fontSize: "11px" }}>Tracked Binary File:</span>
                      <strong style={{ color: "var(--text-bright)", fontFamily: "monospace" }}>{fileInfo.filename}</strong>
                    </div>
                    <div>
                      <span style={{ display: "block", color: "var(--text-muted)", fontSize: "11px" }}>Storage Allocation:</span>
                      <strong>{fileInfo.size} (Git LFS Pointer)</strong>
                    </div>
                    <div>
                      <span style={{ display: "block", color: "var(--text-muted)", fontSize: "11px" }}>Authoring DCC Tool:</span>
                      <strong style={{ color: "var(--text-bright)" }}>{fileInfo.dcc}</strong>
                    </div>
                    <div>
                      <span style={{ display: "block", color: "var(--text-muted)", fontSize: "11px" }}>Lock Status:</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: isLocked ? "var(--warning)" : "var(--ok)", fontWeight: 600 }}>
                        {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                        {isLocked ? `Locked by ${lockedAssets[selectedAsset.id]}` : "Unlocked (Free to Edit)"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="task-btn-action"
                      onClick={() => handleToggleLock(selectedAsset.id)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                      {isLocked ? "Release LFS File Lock" : "Acquire Exclusive LFS Lock"}
                    </button>
                    <button
                      type="button"
                      className="task-btn-action primary"
                      onClick={() => handleCommitAsset(selectedAsset)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <GitCommit size={12} /> Commit Next Version to LFS
                    </button>
                    <button
                      type="button"
                      className="task-btn-action"
                      onClick={() => {
                        setSelectedAsset(null);
                        navigate("/git-lfs");
                      }}
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                    >
                      <FolderKanban size={12} /> View Git LFS Vault
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Version Switcher */}
            <div className="asset-version-section">
              <h4>Available Versions</h4>
              <p className="asset-subtext">Select an active version for production pipelines:</p>
              <div className="version-selector-chips">
                {(selectedAsset.versions || [
                  { version: "v01", status: "Approved" },
                  { version: "v02", status: "Approved" },
                  { version: "v03", status: "Approved" },
                  { version: selectedAsset.version, status: selectedAsset.status },
                ]).map((vObj) => (
                  <button
                    type="button"
                    key={vObj.version}
                    className={`version-chip-btn ${selectedAsset.version === vObj.version ? "active" : ""}`}
                    onClick={() => handleSelectVersion(vObj.version, vObj.status)}
                  >
                    <strong>{vObj.version}</strong>
                    <small>{vObj.status}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Approval Toggle */}
            <div className="asset-actions-box">
              <h4>Status Control</h4>
              <p className="asset-subtext">
                Shots depending on this asset will be unblocked when Approved.
              </p>
              <button
                type="button"
                className={`btn-approval-toggle ${selectedAsset.status === "Approved" ? "approved" : "unapproved"}`}
                onClick={handleToggleApproval}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
              >
                {selectedAsset.status === "Approved" ? (
                  <>
                    <CheckCircle2 size={16} /> Approved for Production (Click to Re-evaluate)
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} /> Mark Asset Approved & Resolve Blockers
                  </>
                )}
              </button>
            </div>

            {/* Used in Shots */}
            <div className="asset-shots-list-box">
              <h4>Used in Shots ({selectedAsset.usedIn?.length || 0})</h4>
              <div className="used-in-chips">
                {(selectedAsset.usedIn || []).map((shotId) => (
                  <button
                    type="button"
                    key={shotId}
                    className="shot-link-chip"
                    onClick={() => {
                      setSelectedAsset(null);
                      navigate(`/shots/${shotId}`);
                    }}
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                  >
                    {shotId} <ExternalLink size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-main">
          <h1>Asset Library</h1>
          <p className="page-subtitle">
            Production assets, rigs, and environment packages version-controlled with Git + Git LFS.
          </p>
        </div>

        {/* View Scope Switcher for User Accessibility */}
        <div className="view-scope-switcher">
          <button
            type="button"
            className={`scope-pill-btn ${viewScope === "my" ? "active" : ""}`}
            onClick={() => {
              setViewScope("my");
              setCategoryFilter("All");
            }}
          >
            <User size={14} /> My Assets ({myAccessibleAssets.length})
          </button>
          <button
            type="button"
            className={`scope-pill-btn ${viewScope === "all" ? "active" : ""}`}
            onClick={() => setViewScope("all")}
          >
            <Box size={14} /> All Assets ({assets.length})
          </button>
        </div>
      </div>

      {/* Unified Toolbar */}
      <div className="studio-toolbar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets by name or ID..."
          />
        </div>

        <div className="filter-chips-group">
          {categories.map((c) => (
            <button
              type="button"
              key={c}
              className={`filter-chip-btn ${categoryFilter === c ? "active" : ""}`}
              onClick={() => setCategoryFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="assets-grid">
        {filtered.map((asset) => {
          const fileInfo = getAssetFileInfo(asset);
          const isLocked = Boolean(lockedAssets[asset.id]);

          return (
            <div
              key={asset.id}
              className="asset-card"
              onClick={() => setSelectedAsset(asset)}
              role="button"
              tabIndex={0}
            >
              <div className="asset-card-top">
                <span className="asset-id" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <Box size={13} /> {asset.id}
                </span>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {isLocked && (
                    <span className="git-lfs-lock-pill" title={`Locked by ${lockedAssets[asset.id]}`}>
                      <Lock size={10} /> Locked
                    </span>
                  )}
                  <Badge
                    variant={asset.status === "Approved" ? "ok" : "warn"}
                    text={asset.status}
                  />
                </div>
              </div>

              <h3 className="asset-title">{asset.name}</h3>

              <div className="asset-meta">
                <div>
                  <small>Version</small>
                  <strong>v{asset.version}</strong>
                </div>
                <div>
                  <small>Category</small>
                  <strong>{asset.category || asset.type}</strong>
                </div>
                <div>
                  <small>DCC Tool</small>
                  <strong style={{ color: "var(--accent)" }}>{fileInfo.dcc.split(" ")[0]}</strong>
                </div>
              </div>

              <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid var(--border-subtle)", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{fileInfo.filename}</span>
                <span className="git-hash-pill" style={{ fontSize: "10px" }}>{fileInfo.size}</span>
              </div>

              <div className="asset-footer">
                <span>Used in {asset.usedIn?.length || 0} shot(s)</span>
                <span className="asset-click-hint" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Inspect & LFS <ArrowRight size={13} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-shots">No assets matched your filter.</div>
      )}
    </div>
  );
}