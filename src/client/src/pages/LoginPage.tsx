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
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.warn("Logging in with:", { email, password });
  };

  const handleDevLogin = (role: 'staff' | 'admin' | 'registrar') => {
    const devUsers = {
      staff: { id: '2', name: 'Bob Smith', role: 'staff' as const, email: 'bobsmith@uvic.ca' },
      admin: { id: '1', name: 'Alice Johnson', role: 'admin' as const, email: 'alicejohnson@uvic.ca' },
      registrar: { id: '3', name: 'Charlie Doe', role: 'registrar' as const, email: 'charliedoe@uvic.ca' }
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
        <h1>UVic Classroom Booking Login</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <div>
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
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