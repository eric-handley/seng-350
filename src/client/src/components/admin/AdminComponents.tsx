import React from "react";

export function Badge({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "danger" | "info";
  children: React.ReactNode;
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function StatCard({
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

export function HealthBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="bar">
      <div className="bar-fill" style={{ width: `${clamped}%` }} />
      <div className="bar-text">{clamped}%</div>
    </div>
  );
}
