import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { User, UserRole } from "../types";

interface LoginPageProps {
  onLogin: (user: User) => void;
}

function getErrorMessage(err: unknown, fallback = "Something went wrong") {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // send cookies (needed if using sessions)
      });

      if (response.status === 401) {
        throw new Error("Invalid email or password");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ?? `Login failed: ${response.status}`
        );
      }

      const user: User = await response.json(); // backend returns AuthenticatedUser shape
      onLogin(user);

      if (user.role === UserRole.ADMIN) {
        navigate("/admin-panel");
      } else {
        navigate("/home");
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Login failed"));
    }
    //console.warn("Logging in with:", { email, password });
  };

  const handleDevLogin = (role: UserRole) => {
    const credentials: Record<UserRole, { email: string; password: string }> = {
      [UserRole.STAFF]: { email: "staff@uvic.ca", password: "staff" },
      [UserRole.ADMIN]: { email: "admin@uvic.ca", password: "admin" },
      [UserRole.REGISTRAR]: {
        email: "registrar@uvic.ca",
        password: "registrar",
      },
    };

    const { email: prefillEmail, password: prefillPassword } =
      credentials[role];
    setEmail(prefillEmail);
    setPassword(prefillPassword);
    setError(null);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Uvic Room Booking Login</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>

        <div
          style={{
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1px solid #ddd",
          }}
        >
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "10px" }}>
            Development Login Options:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              type="button"
              onClick={() => handleDevLogin(UserRole.STAFF)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Continue as Staff
            </button>
            <button
              type="button"
              onClick={() => handleDevLogin(UserRole.ADMIN)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Continue as Admin
            </button>
            <button
              type="button"
              onClick={() => handleDevLogin(UserRole.REGISTRAR)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f0f0f0",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Continue as Registrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
