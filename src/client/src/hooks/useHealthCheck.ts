import { useState, useEffect } from "react";

export interface HealthStatus {
  ok: boolean;
  now?: string;
  message: string;
  error?: string;
}

export interface SystemHealth {
  backend: HealthStatus;
  lastChecked: Date;
  isChecking: boolean;
  error: string | null;
}

export function useHealthCheck(): SystemHealth {
  const [backend, setBackend] = useState<HealthStatus>({
    ok: false,
    message: "Not checked yet",
  });
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/health", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setBackend({
        ok: data.ok,
        now: data.now,
        message: data.message,
        error: data.error,
      });

      setLastChecked(new Date());
    } catch (err) {
      let errorMessage = "Unknown error";

      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        errorMessage = "Cannot connect to server - server may be down";
      } else if (err instanceof SyntaxError && err.message.includes("JSON")) {
        errorMessage =
          "Server returned invalid response - check server configuration";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setBackend({
        ok: false,
        message: "Health check failed",
        error: errorMessage,
      });
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  // Check health on mount and every 30 seconds
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    backend,
    lastChecked,
    isChecking,
    error,
  };
}
