/** @format */

const statusMap: Record<string, string> = {
  applied: "var(--status-applied)",
  shortlisted: "var(--status-shortlisted)",
  interview: "var(--status-interview)",
  rejected: "var(--status-rejected)",
  hired: "var(--status-hired)",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      style={{
        background: statusMap[status],
        color: "white",
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}
