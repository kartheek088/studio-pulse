export function Badge({ variant, text }) {
  const className = `badge badge-${variant}`;
  return <span className={className}>{text}</span>;
}