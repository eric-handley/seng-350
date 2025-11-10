import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { User, UserRole } from "../types";

/**
 * LoginPage
 *
 * Responsibilities:
 * - Collect user credentials and submit to the auth API
 * - Handle success (call onLogin and navigate to /book)
 * - Handle errors robustly and show a friendly message
 * - Provide developer quick-login buttons that prefill credentials
 */
interface LoginPageProps {
  onLogin: (user: User) => void;
}

/**
 * Normalizes unknown error values into a user-friendly string.
 * - Error instance -> err.message
 * - string -> the string itself
 * - other -> JSON.stringify fallback, or provided fallback if that fails
 */
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
  // Controlled form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Error banner text; null when no error
  const [error, setError] = useState<string | null>(null);
  // Router navigation hook
  const navigate = useNavigate();

  /**
   * Submit handler:
   * - Prevent default form navigation
   * - Clear any previous error
   * - POST credentials to backend
   * - Interpret response codes and surfaces helpful messages
   * - On success: parse user, call onLogin, and navigate to /book
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear stale error right when a new submission starts
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      // Common case for bad credentials
      if (response.status === 401) {
        throw new Error("Invalid email or password");
      }

      // Other non-OK responses: try to surface server-provided message
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ?? `Login failed: ${response.status}`
        );
      }

      // Success: parse the user payload and notify parent
      const user: User = await response.json(); // backend returns AuthenticatedUser shape
      onLogin(user);

      // Navigate to main booking flow
      navigate("/book");
    } catch (err: unknown) {
      // Gracefully convert any thrown value into a message
      setError(getErrorMessage(err, "Login failed"));
    }
  };

  /**
   * Developer quick-login:
   * - Prefills email/password for the selected role
   * - Clears any existing error
   */
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
        {/* Page title */}
        <h1>Uvic Room Booking Login</h1>

        {/* Credential form: email + password + submit */}
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

          {/* Primary action */}
          <button type="submit">Login</button>

          {/* Error banner (shown only when error is set) */}
          {error && <p className="error">{error}</p>}
        </form>

        {/* Dev-only quick login shortcuts for faster testing */}
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