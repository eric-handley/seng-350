import React, { useState } from "react";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { useDarkModePref } from "../../hooks/useDarkMode";
import { convertAuditLogToRow } from "../../types/admin";
import { AuditTable } from "./AuditTable";
import { SystemHealth } from "./SystemHealth";

type AdminConsoleProps = {
  onLogout?: () => void;
};

export default function AdminConsole({ onLogout }: AdminConsoleProps = {}) {
  const [dark, setDark] = useDarkModePref();
  const [tab, setTab] = useState<"audit" | "health">("audit");
  const { auditLogs, loading, error } = useAuditLogs();

  // Convert audit logs to display format
  const auditRows = auditLogs.map(convertAuditLogToRow);

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
          {onLogout && (
            <button
              className="btn"
              style={{ marginLeft: "0.75rem" }}
              onClick={onLogout}
            >
              Log out
            </button>
          )}
        </div>
      </header>

      <section className="content">
        {tab === "audit" ? (
          <AuditTable rows={auditRows} loading={loading} error={error} />
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
