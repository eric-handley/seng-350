import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { User } from "../types";

interface LoginPageProps {
  onLogin: (user: User) => void;
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
        throw new Error(errorData?.message ?? `Login failed: ${response.status}`);
      }

      const user: User = await response.json(); // backend should return the user object
      const role = user.role.toLowerCase();
      onLogin(user);

      // Navigate based on rsole (assuming `user.role` exists)
      if (role === 'admin') {
        navigate('/admin-panel');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    }
    //console.warn("Logging in with:", { email, password });
  };

  const handleDevLogin = (role: 'staff' | 'admin' | 'registrar') => {
    const devUsers = {
      staff: { id: '2', name: 'Bob Smith', role: 'staff' as const, email: 'staff@uvic.ca' },
      admin: { id: '1', name: 'Alice Johnson', role: 'admin' as const, email: 'admin@uvic.ca' },
      registrar: { id: '3', name: 'Charlie Doe', role: 'registrar' as const, email: 'registrar@uvic.ca' }
    };
    onLogin(devUsers[role]);

    // Navigate based on role
    if (role === 'admin') {
      navigate('/admin-panel');
    } else {
      navigate('/home');
    }
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

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Development Login Options:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleDevLogin('staff')}
              style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
            >
              Continue as Staff
            </button>
            <button
              type="button"
              onClick={() => handleDevLogin('admin')}
              style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
            >
              Continue as Admin
            </button>
            <button
              type="button"
              onClick={() => handleDevLogin('registrar')}
              style={{ padding: '8px 16px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
            >
              Continue as Registrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}