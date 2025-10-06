import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import "./styles/app.css";
import "./styles/admin.css";

import { TabKey, UserRole } from "./types";

import { useUsers } from "./hooks/useUsers";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { getCurrentDate } from "./utils/dateHelpers";

import { TabNavigation } from './components/TabNavigation'
import { BookingPage } from './pages/BookingPage'
import { SchedulePage } from './pages/SchedulePage'
import { HistoryPage } from './pages/HistoryPage'
import { UsersPage } from './pages/UsersPage'
import LoginPage from './pages/LoginPage'
import AdminConsole from './components/admin/AdminConsole'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuditTable } from './components/admin/AuditTable'
import { SystemHealth } from './components/admin/SystemHealth'

const HomeComponent: React.FC = () => {
  const { currentUser, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("book");

  const canManageUsers =
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.REGISTRAR;
  const {
    users,
    editingUser,
    addingUser,
    handleEditUser,
    handleSaveUser,
    handleAddUser,
    handleSaveNewUser,
    handleBlockUser,
    setEditingUser,
    setAddingUser,
  } = useUsers({ autoLoad: !!canManageUsers });

  // Room filtering state
  const [building, setBuilding] = useState<string>("");
  const [roomQuery, setRoomQuery] = useState<string>("");
  const [date, setDate] = useState<string>(getCurrentDate());
  const [start, setStart] = useState<string>("10:00");
  const [end, setEnd] = useState<string>("11:00");

  useEffect(() => {
    if (currentUser && currentUser.role === "staff" && tab === "schedule") {
      setTab("book");
    }
  }, [currentUser, tab]);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="app-shell">
      <div className="header">
        <div className="header-info">
          <span className="badge">{currentUser.role.toUpperCase()}</span>
          <h1 className="title">Rooms & Scheduling</h1>
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <TabNavigation
        currentTab={tab}
        setTab={setTab}
        currentUser={currentUser}
      />

      {tab === "book" && (
        <BookingPage
          currentUserId={currentUser.id}
          building={building}
          setBuilding={setBuilding}
          roomQuery={roomQuery}
          setRoomQuery={setRoomQuery}
          date={date}
          setDate={setDate}
          start={start}
          setStart={setStart}
          end={end}
          setEnd={setEnd}
          onBookingCreated={() => setTab("history")}
        />
      )}

      {tab === "schedule" && currentUser.role !== "staff" && (
        <SchedulePage
          date={date}
          setDate={setDate}
          building={building}
          setBuilding={setBuilding}
        />
      )}

      {tab === "history" && <HistoryPage currentUser={currentUser} />}

      {tab === "users" && (
        <UsersPage
          users={users}
          currentUser={currentUser}
          editingUser={editingUser}
          addingUser={addingUser}
          onEditUser={handleEditUser}
          onSaveUser={handleSaveUser}
          onAddUser={handleAddUser}
          onSaveNewUser={handleSaveNewUser}
          onBlockUser={handleBlockUser}
          onCancelEdit={() => setEditingUser(null)}
          onCancelAdd={() => setAddingUser(null)}
        />
      )}
      {tab === "audit" && currentUser.role === UserRole.ADMIN && <AuditTable />}
      {tab === "health" && currentUser.role === UserRole.ADMIN && (
        <SystemHealth />
      )}
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { login } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route
        path="/home"
        element={
          <ProtectedRoute
            allowedRoles={[UserRole.STAFF, UserRole.REGISTRAR, UserRole.ADMIN]}
          >
            <HomeComponent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-panel"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const AdminPage: React.FC = () => {
  const { currentUser, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  }

  if (!currentUser) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return <AdminConsole onLogout={handleLogout} />;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRouter />
      </Router>
    </AuthProvider>
  );
}
