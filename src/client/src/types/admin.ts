import { AuditLog } from "./index";

// Types
export type AuditRow = {
  id: string;
  time: string; // ISO string
  actor: string;
  action: string;
  target: string;
  severity: "low" | "medium" | "high";
  details: string;
};

// Convert API audit log to display format
export function convertAuditLogToRow(auditLog: AuditLog): AuditRow {
  const actor = auditLog.user
    ? `${auditLog.user.first_name} ${auditLog.user.last_name} (${auditLog.user.email})`
    : "Unknown";

  // Format request details for display
  const details = auditLog.request
    ? JSON.stringify(auditLog.request, null, 2)
    : "N/A";

  return {
    id: auditLog.id,
    time: auditLog.created_at,
    actor,
    action: auditLog.action,
    target: auditLog.route,
    severity:
      auditLog.action === "DELETE"
        ? "high"
        : auditLog.action === "UPDATE" || auditLog.action === "CREATE"
        ? "medium"
        : "low",
    details,
  };
}
