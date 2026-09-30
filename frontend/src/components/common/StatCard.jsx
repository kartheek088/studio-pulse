import { useProduction } from "../../context/ProductionContext";

export function StatCard({ title, value, change, tone }) {
  // If value is a function, compute it from state (for dynamic stats)
  const computedValue = typeof value === "function" ? value() : value;

  return (
    <div className={`stat-card${tone ? ` tone-${tone}` : ""}`}>
      <div className="stat-card-top">
        <p>{title}</p>
        <span className="stat-icon">•</span>
      </div>
      <strong>{computedValue}</strong>
      <span className="stat-change">{change}</span>
    </div>
  );
}