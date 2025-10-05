import { useState, useEffect } from "react";
import { AuditLog } from "../types";

const API_BASE_URL = "http://localhost:3001";

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_BASE_URL}/logs`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied - Admin role required");
        }
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }

      const data = await response.json();
      setAuditLogs(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch audit logs";
      setError(errorMessage);
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return {
    auditLogs,
    loading,
    error,
    refetch: fetchAuditLogs,
  };
}
