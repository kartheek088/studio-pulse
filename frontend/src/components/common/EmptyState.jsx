export function EmptyState({ title, description, icon }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon || "◌"}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}