import React, { useMemo, useState, useEffect } from "react";

function useDarkModePref(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("uvic-admin-dark");
    if (stored !== null) {
      return stored === "1";
    }
    return (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });
  useEffect(
    () => localStorage.setItem("uvic-admin-dark", enabled ? "1" : "0"),
    [enabled]
  );
  return [enabled, setEnabled];
}

// Types
type AuditRow = {
  id: string;
  time: string; // ISO string
  actor: string;
  action: string;
  target: string;
  severity: "low" | "medium" | "high";
  ip: string;
};

// Sample data (replace with real API data)
const SAMPLE_AUDITS: AuditRow[] = Array.from({ length: 42 }).map((_, i) => ({
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
}));

const HEALTH = {
  services: [
    { name: "API Gateway", status: "ok", latencyMs: 41, uptime: 99.98 },
    { name: "Auth Service", status: "degraded", latencyMs: 128, uptime: 99.2 },
    { name: "Audit DB", status: "ok", latencyMs: 18, uptime: 99.995 },
    { name: "Worker Queue", status: "ok", latencyMs: 63, uptime: 99.89 },
  ] as {
    name: string;
    status: "ok" | "degraded" | "down";
    latencyMs: number;
    uptime: number;
  }[],
  infra: { cpu: 43, mem: 62, disk: 71, queueDepth: 3, errors1h: 2 },
};

function Badge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "danger" | "info";
  children: React.ReactNode;
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="card stat">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function HealthBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="bar">
      <div className="bar-fill" style={{ width: `${clamped}%` }} />
      <div className="bar-text">{clamped}%</div>
    </div>
  );
}

function ServiceRow({
  name,
  status,
  latencyMs,
  uptime,
}: {
  name: string;
  status: "ok" | "degraded" | "down";
  latencyMs: number;
  uptime: number;
}) {
  const tone =
    status === "ok" ? "ok" : status === "degraded" ? "warn" : "danger";
  return (
    <tr>
      <td className="mono">{name}</td>
      <td>
        <Badge tone={tone}>{status}</Badge>
      </td>
      <td className="mono">{latencyMs} ms</td>
      <td className="mono">{uptime.toFixed(3)}%</td>
    </tr>
  );
}

function filterAudits(
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

function AuditTable({ rows }: { rows: AuditRow[] }) {
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
      .concat(filtered.map((r) => headers.map((h) => (r as any)[h]).join(",")))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            onChange={(e) => setSev(e.target.value as any)}
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
}

function SystemHealth() {
  const { services, infra } = HEALTH;
  const okCount = services.filter((s) => s.status === "ok").length;
  const degraded = services.filter((s) => s.status !== "ok").length;

  return (
    <div className="grid">
      <div className="grid-left">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">System Health</div>
          </div>
          <div className="stats">
            <StatCard
              title="Services OK"
              value={`${okCount}/${services.length}`}
              sub="Healthy"
            />
            <StatCard
              title="Issues"
              value={`${degraded}`}
              sub="Degraded/Down"
            />
            <StatCard
              title="Queue Depth"
              value={`${infra.queueDepth}`}
              sub="Workers"
            />
          </div>
          <div className="kv">
            <div>
              <div className="kv-label">CPU</div>
              <HealthBar pct={infra.cpu} />
            </div>
            <div>
              <div className="kv-label">Memory</div>
              <HealthBar pct={infra.mem} />
            </div>
            <div>
              <div className="kv-label">Disk</div>
              <HealthBar pct={infra.disk} />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Services</div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th>p50 Latency</th>
                  <th>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <ServiceRow key={s.name} {...s} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-right">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Recent Audit Activity</div>
          </div>
          <AuditTable rows={SAMPLE_AUDITS.slice(0, 12)} />
        </div>
      </div>
    </div>
  );
}

export default function AdminConsole() {
  const [dark, setDark] = useDarkModePref();
  const [tab, setTab] = useState<"audit" | "health">("audit");

  return (
    <main className={dark ? "theme theme--dark" : "theme"}>
      <header className="topbar">
        <div className="brand">
          <div className="shield" aria-hidden />
          <div className="brand-text">
            <div className="brand-top">University of Victoria</div>
            <div className="brand-bottom">Admin Console</div>
          </div>
        </div>
        <div className="top-actions">
          <nav className="tabs">
            <button
              className={`tab ${tab === "audit" ? "is-active" : ""}`}
              onClick={() => setTab("audit")}
            >
              Audit
            </button>
            <button
              className={`tab ${tab === "health" ? "is-active" : ""}`}
              onClick={() => setTab("health")}
            >
              System Health
            </button>
          </nav>
          <button
            className="btn"
            onClick={() => setDark(!dark)}
            title="Toggle theme"
          >
            {dark ? "☾" : "☼"}
          </button>
        </div>
      </header>

      <section className="content">
        {tab === "audit" ? (
          <AuditTable rows={SAMPLE_AUDITS} />
        ) : (
          <SystemHealth />
        )}
      </section>

      <footer className="footer">
        <div>© {new Date().getFullYear()} UVic • Admin • Demo UI</div>
        <div className="links">
          <a href="#">Docs</a>
          <a href="#">Status</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </main>
  );
}