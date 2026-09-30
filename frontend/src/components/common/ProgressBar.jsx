export function ProgressBar({ value, label, showLabel = true }) {
  const percent = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${percent}%` }}
      />
      {showLabel && (
        <span className="progress-label">
          {label || `${percent}%`}
        </span>
      )}
    </div>
  );
}