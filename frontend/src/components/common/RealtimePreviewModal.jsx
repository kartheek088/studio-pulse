import { useState, useRef, useEffect } from "react";
import { Modal } from "./Modal";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Maximize2,
  Camera,
  Layers,
  Sparkles,
  Send,
  GitCommit,
  CheckCircle2,
  Tv,
} from "lucide-react";

export function RealtimePreviewModal({
  isOpen,
  onClose,
  shot,
  onSubmitToKitsu,
  onCommitGit,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(48);
  const [totalFrames] = useState(144);
  const [fps] = useState(24);
  const [cameraAngle, setCameraAngle] = useState("Hero Cam (35mm)");
  const [viewportMode, setViewportMode] = useState("Lit (Lumen + Nanite)");
  const [resolution] = useState("3840 × 2160 (4K UHD)");
  const [simFps] = useState("59.8 FPS");
  const [commentText, setCommentText] = useState("");
  const [notification, setNotification] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame((f) => {
          if (f >= totalFrames) {
            setIsPlaying(false);
            return totalFrames;
          }
          return f + 1;
        });
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, totalFrames, fps]);

  if (!isOpen || !shot) return null;

  // Compute timecode (hh:mm:ss:ff)
  const seconds = Math.floor(currentFrame / fps);
  const frames = currentFrame % fps;
  const timecode = `01:00:${String(seconds).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;

  function handleFrameScrub(e) {
    setCurrentFrame(Number(e.target.value));
  }

  function handleStep(delta) {
    setCurrentFrame((f) => Math.min(totalFrames, Math.max(1, f + delta)));
  }

  function handleKitsuSubmit() {
    if (onSubmitToKitsu) {
      onSubmitToKitsu(shot.id, `v0${shot.version || 1}`, commentText);
      setNotification("Playblast submitted to Kitsu Review queue!");
      setTimeout(() => setNotification(null), 3000);
    }
  }

  function handleGitCommit() {
    if (onCommitGit) {
      onCommitGit(shot.id);
      setNotification("Committed real-time previz to Git LFS!");
      setTimeout(() => setNotification(null), 3000);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Real-time Previz: ${shot.id} — ${shot.name}`}>
      <div className="realtime-preview-container">
        {/* Viewport Meta Bar */}
        <div className="realtime-topbar">
          <div className="realtime-badge-group">
            <span className="rt-pill rt-engine">
              <Tv size={13} /> Unreal Engine 5.4
            </span>
            <span className="rt-pill rt-fps">{simFps}</span>
            <span className="rt-pill rt-res">{resolution}</span>
          </div>
          <div className="realtime-selectors">
            <select
              className="rt-select"
              value={cameraAngle}
              onChange={(e) => setCameraAngle(e.target.value)}
              title="Select Camera"
            >
              <option value="Hero Cam (35mm)">Hero Cam (35mm Prime)</option>
              <option value="Top Orbit Cam">Top Orbit Previz Cam</option>
              <option value="Director Handheld">Director Handheld Rig</option>
            </select>
            <select
              className="rt-select"
              value={viewportMode}
              onChange={(e) => setViewportMode(e.target.value)}
              title="Viewport Render Mode"
            >
              <option value="Lit (Lumen + Nanite)">Lit (Lumen + Nanite)</option>
              <option value="Unlit">Unlit / Flat Albedo</option>
              <option value="Wireframe">Wireframe Overlay</option>
              <option value="Lighting Only">Lighting Only Pass</option>
            </select>
          </div>
        </div>

        {/* Viewport Canvas Simulation */}
        <div className="realtime-viewport">
          <div className="viewport-overlay-hud">
            <div className="hud-corner top-left">
              <span>CAM: {cameraAngle}</span>
              <span>MODE: {viewportMode}</span>
            </div>
            <div className="hud-corner top-right">
              <span className="hud-rec-dot" />
              <span>LIVE PREVIZ</span>
            </div>
            <div className="hud-crosshair">
              <div className="ch-line-h" />
              <div className="ch-line-v" />
              <div className="ch-box" />
            </div>
            <div className="hud-corner bottom-left">
              <span>TC: {timecode}</span>
              <span>FRAME: {currentFrame} / {totalFrames}</span>
            </div>
            <div className="hud-corner bottom-right">
              <span>COLOR: ACEScg</span>
              <span>LENS: f/2.8 1/48s</span>
            </div>
          </div>

          {/* Graphical Viewport Representation */}
          <div className="viewport-scene-graphic">
            <div className="scene-grid-floor" />
            <div className="scene-lighting-ray" />
            <div className="scene-character-silhouette">
              <div className="char-head" />
              <div className="char-body" />
              <div className="char-light-rim" />
            </div>
            <div className="scene-foliage-left" />
            <div className="scene-foliage-right" />
          </div>
        </div>

        {/* Playback Controls & Scrubber */}
        <div className="realtime-controls-strip">
          <div className="timeline-scrubber-row">
            <input
              type="range"
              min={1}
              max={totalFrames}
              value={currentFrame}
              onChange={handleFrameScrub}
              className="timeline-slider"
            />
          </div>

          <div className="playback-buttons-bar">
            <div className="pb-left">
              <button
                type="button"
                className="pb-btn"
                onClick={() => setCurrentFrame(1)}
                title="Rewind to frame 1"
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                className="pb-btn"
                onClick={() => handleStep(-1)}
                title="Step backward 1 frame"
              >
                <SkipBack size={15} />
              </button>
              <button
                type="button"
                className="pb-btn pb-btn-play"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={17} /> : <Play size={17} />}
              </button>
              <button
                type="button"
                className="pb-btn"
                onClick={() => handleStep(1)}
                title="Step forward 1 frame"
              >
                <SkipForward size={15} />
              </button>
            </div>

            <div className="pb-center">
              <span className="timecode-display">{timecode}</span>
              <span className="frame-count-tag">F: {currentFrame}</span>
            </div>

            <div className="pb-right">
              <span className="stage-dcc-tag">Blender Sequencer → Unreal</span>
            </div>
          </div>
        </div>

        {/* Quick Review Actions */}
        <div className="realtime-handoff-bar">
          <div className="handoff-comment-input">
            <input
              type="text"
              placeholder="Add revision note or playblast description for Kitsu..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="rt-text-input"
            />
          </div>
          <div className="handoff-actions">
            <button
              type="button"
              className="rt-action-btn btn-git-commit"
              onClick={handleGitCommit}
              title="Commit current version with Git + Git LFS"
            >
              <GitCommit size={15} /> Commit to Git LFS
            </button>
            <button
              type="button"
              className="rt-action-btn btn-kitsu-submit"
              onClick={handleKitsuSubmit}
              title="Queue in Kitsu Review for Director Sign-off"
            >
              <Send size={15} /> Send to Kitsu Review
            </button>
          </div>
        </div>

        {notification && (
          <div className="rt-toast-notification">
            <CheckCircle2 size={16} />
            <span>{notification}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
