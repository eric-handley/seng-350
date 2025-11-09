import React from "react";
import { parseISO, format } from 'date-fns';
import { useHealthCheck } from "../../hooks/useHealthCheck";
import { Badge, StatCard } from "./AdminComponents";

export const SystemHealth = () => {
  const { backend, lastChecked, isChecking, error } = useHealthCheck();

  const getStatusTone = (ok: boolean) => {
    if (isChecking) {return "info";}
    return ok ? "ok" : "danger";
  };

  const getStatusText = (ok: boolean) => {
    if (isChecking) {return "Checking...";}
    return ok ? "Healthy" : "Unhealthy";
  };

  return (
    <div className="grid">
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">System Health</div>
          <button
            className="btn btn--ghost"
            onClick={() => window.location.reload()}
            disabled={isChecking}
          >
            {isChecking ? "Checking..." : "Refresh"}
          </button>
        </div>
        <div className="stats">
          <StatCard
            title="Backend Status"
            value={getStatusText(backend.ok)}
            sub={
              isChecking
                ? "Checking..."
                : `Last checked: ${format(lastChecked, 'HH:mm:ss')}`
            }
          />
          <StatCard
            title="Database"
            value={backend.ok ? "Connected" : "Disconnected"}
            sub={backend.message}
          />
          <StatCard
            title="Last Response"
            value={
              backend.now ? format(parseISO(backend.now), 'HH:mm:ss') : "N/A"
            }
            sub="Server time"
          />
        </div>
        {error && (
          <div className="kv">
            <div>
              <div className="kv-label">Error Details</div>
              <div style={{ color: "var(--color-danger)", fontSize: "0.9em" }}>
                {error}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Service Status</div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Message</th>
                <th>Last Check</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono">Backend API</td>
                <td>
                  <Badge tone={getStatusTone(backend.ok)}>
                    {getStatusText(backend.ok)}
                  </Badge>
                </td>
                <td className="mono">{backend.message}</td>
                <td className="mono">{lastChecked.toLocaleTimeString()}</td>
              </tr>
              {backend.error && (
                <tr>
                  <td className="mono">Database</td>
                  <td>
                    <Badge tone="danger">Error</Badge>
                  </td>
                  <td className="mono" style={{ color: "var(--color-danger)" }}>
                    {backend.error}
                  </td>
                  <td className="mono">{lastChecked.toLocaleTimeString()}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
