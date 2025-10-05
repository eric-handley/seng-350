import { AuditLog } from "./index";

// Types
export type AuditRow = {
  id: string;
  time: string; // ISO string
  actor: string;
  action: string;
  target: string;
  severity: "low" | "medium" | "high";
  ip: string;
};

// Convert API audit log to display format
export function convertAuditLogToRow(auditLog: AuditLog): AuditRow {
  return {
    id: auditLog.id,
    time: auditLog.created_at,
    actor: `${auditLog.user.first_name} ${auditLog.user.last_name} (${auditLog.user.email})`,
    action: auditLog.action,
    target: `${auditLog.entity_type}:${auditLog.entity_id}`,
    severity:
      auditLog.action === "DELETE"
        ? "high"
        : auditLog.action === "UPDATE"
        ? "medium"
        : "low",
    ip: "N/A", // IP not available in current API response
  };
}
