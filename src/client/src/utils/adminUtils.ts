import { AuditRow } from "../types/admin";

// Sample data (replace with real API data)
export const SAMPLE_AUDITS: AuditRow[] = Array.from({ length: 42 }).map(
  (_, i) => ({
    id: `AUD-${1000 + i}`,
    time: new Date(Date.now() - i * 36_00_000).toISOString(),
    actor: [
      "system",
      "admin@uvic.ca",
      "svc.reports",
      "alice@uvic.ca",
      "bob@uvic.ca",
    ][i % 5],
    action: [
      "LOGIN",
      "LOGOUT",
      "EXPORT_CSV",
      "GRANT_ROLE",
      "REVOKE_ROLE",
      "DELETE",
    ][i % 6],
    target: [
      "/api/health",
      "/admin/users",
      "/admin/audit",
      "role:auditor",
      "id:7231",
    ][i % 5],
    severity: (["low", "medium", "high"] as const)[i % 3],
    ip: `142.104.${i % 255}.${(200 - i) % 255}`,
  })
);

export function filterAudits(
  rows: AuditRow[],
  query: string,
  sev: "all" | "low" | "medium" | "high"
) {
  const q = query.trim().toLowerCase();
  const pool = rows.filter((r) => (sev === "all" ? true : r.severity === sev));
  if (!q) {
    return pool;
  }
  return pool.filter((r) =>
    [
      r.id,
      r.actor,
      r.action,
      r.target,
      r.ip,
      new Date(r.time).toLocaleString(),
    ].some((v) => String(v).toLowerCase().includes(q))
  );
}
