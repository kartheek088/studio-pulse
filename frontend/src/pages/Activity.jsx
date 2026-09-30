import { useState } from "react";
import { useProduction } from "../context/ProductionContext";
import {
  CheckCircle2,
  Send,
  CheckSquare,
  AlertOctagon,
  ArrowRightLeft,
  Layers,
  Box,
  Clock,
  Activity as ActivityIcon,
} from "lucide-react";

export function Activity() {
  const { activities, formatActivityTime } = useProduction();
  const [filter, setFilter] = useState("All");

  // Group activities chronologically
  const grouped = activities.reduce((acc, act) => {
    const d = new Date(act.time);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 86400000);

    let key = "Today";
    if (d >= today) {
      key = "Today";
    } else if (d >= yesterday) {
      key = "Yesterday";
    } else {
      key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    if (!acc[key]) acc[key] = [];
    acc[key].push(act);
    return acc;
  }, {});

  function renderActivityIcon(type) {
    switch (type) {
      case "approval":
        return <CheckCircle2 size={13} />;
      case "review":
        return <Send size={13} />;
      case "task":
        return <CheckSquare size={13} />;
      case "block":
        return <AlertOctagon size={13} />;
      case "status":
        return <ArrowRightLeft size={13} />;
      case "stage":
        return <Layers size={13} />;
      case "asset":
        return <Box size={13} />;
      default:
        return <ActivityIcon size={13} />;
    }
  }

  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    return 0;
  });

  const filterOptions = ["All", "approval", "review", "task", "stage", "block", "asset"];

  return (
    <div className="page activity-page">
      <div className="page-header">
        <div className="page-header-main">
          <h1>Activity Timeline</h1>
          <p className="page-subtitle">
            Live chronological record of all pipeline status shifts, approvals, and notes.
          </p>
        </div>
      </div>

      <div className="studio-toolbar">
        <div className="filter-chips-group">
          {filterOptions.map((f) => (
            <button
              type="button"
              key={f}
              className={`filter-chip-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="activity-timeline-feed">
        {groupKeys.map((group) => {
          const groupItems = grouped[group].filter(
            (act) => filter === "All" || act.type === filter
          );

          if (groupItems.length === 0) return null;

          return (
            <div key={group} className="timeline-group-block">
              <div className="timeline-group-header">
                <span className="timeline-group-title">{group}</span>
                <span className="timeline-group-count">{groupItems.length} events</span>
              </div>

              <div className="timeline-items-list">
                {groupItems.map((act) => (
                  <div key={act.id} className={`timeline-entry type-${act.type}`}>
                    <div className={`timeline-icon-bubble type-${act.type}`}>
                      {renderActivityIcon(act.type)}
                    </div>
                    <div className="timeline-entry-content">
                      <div className="timeline-entry-top">
                        <strong className="timeline-text">{act.text}</strong>
                        <span className="timeline-time" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={11} /> {formatActivityTime(act.time)}
                        </span>
                      </div>
                      {act.detail && (
                        <p className="timeline-detail-text">{act.detail}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {activities.length === 0 && (
          <div className="empty-shots">No pipeline activity recorded.</div>
        )}
      </div>
    </div>
  );
}