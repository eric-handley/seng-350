import React, { useMemo, useState, useEffect } from "react";
import { AuditRow } from "../../types/admin";
import { Badge } from "./AdminComponents";
import { filterAudits } from "../../utils/adminUtils";

export const AuditTable = ({
  rows = [],
  loading = false,
  error = null,
}: {
  rows?: AuditRow[];
  loading?: boolean;
  error?: string | null;
}) => {
  const [query, setQuery] = useState("");
  const [sev, setSev] = useState<"all" | "low" | "medium" | "high">("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(
    () => filterAudits(rows, query, sev),
    [rows, query, sev]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [query, sev]);

  function exportCSV() {
    const headers = [
      "id",
      "time",
      "actor",
      "action",
      "target",
      "severity",
      "ip",
    ] as const;
    const csv = [headers.join(",")]
      .concat(filtered.map((r) => headers.map((h) => r[h]).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Audit Records</div>
        </div>
        <div
          className="panel-body"
          style={{ textAlign: "center", padding: "2rem" }}
        >
          <div>Loading audit logs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Audit Records</div>
        </div>
        <div
          className="panel-body"
          style={{ textAlign: "center", padding: "2rem" }}
        >
          <div style={{ color: "var(--color-danger)" }}>Error: {error}</div>
          <button
            className="btn"
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">Audit Records</div>
        <div className="filters">
          <input
            className="input"
            placeholder="Search id, actor, action, target, ip…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="select"
            value={sev}
            onChange={(e) =>
              setSev(e.target.value as "all" | "low" | "medium" | "high")
            }
          >
            <option value="all">All severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button className="btn btn--ghost" onClick={exportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Severity</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.id}</td>
                <td className="mono">{new Date(r.time).toLocaleString()}</td>
                <td>{r.actor}</td>
                <td className="mono">{r.action}</td>
                <td className="mono">{r.target}</td>
                <td>
                  <Badge
                    tone={
                      r.severity === "high"
                        ? "danger"
                        : r.severity === "medium"
                        ? "warn"
                        : "info"
                    }
                  >
                    {r.severity}
                  </Badge>
                </td>
                <td className="mono">{r.ip}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="empty">
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button
          className="btn btn--ghost"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ◀ Prev
        </button>
        <div className="pager-text">
          Page {page} / {totalPages}
        </div>
        <button
          className="btn btn--ghost"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
};
