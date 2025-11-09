import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./styles/app.css";
import "./styles/admin.css";

import { TabKey, UserRole } from "./types";
import { useUsers } from "./hooks/useUsers";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { getCurrentDate } from "./utils/dateHelpers";
import { useAuditLogs } from "./hooks/useAuditLogs";
import { convertAuditLogToRow } from "./types/admin";
import { TabNavigation } from "./components/TabNavigation";
import { BookingPage } from "./pages/BookingPage";
import { SchedulePage } from "./pages/SchedulePage";
import { HistoryPage } from "./pages/HistoryPage";
import { UsersPage } from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuditTable } from "./components/admin/AuditTable";
import { SystemHealth } from "./components/admin/SystemHealth";
import BuildingsRooms from "./components/admin/BuildingsRooms";
import EquipmentManagement from "./components/admin/EquipmentManagement";

/**
 * HomeComponent
 * - Authenticated application shell with header, tabs, and tabbed content areas.
 * - Derives the active tab from the current URL path.
 * - Gates admin/registrar-only content at render-time in addition to route guard.
 */
const HomeComponent: React.FC = () => {
  const { currentUser, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Derive current tab from URL path
  const tab: TabKey = location.pathname.includes("/schedule")
    ? "schedule"
    : location.pathname.includes("/history")
    ? "history"
    : location.pathname.includes("/users")
    ? "users"
    : location.pathname.includes("/audit")
    ? "audit"
    : location.pathname.includes("/health")
    ? "health"
    : location.pathname.includes("/buildings")
    ? "buildings"
    : location.pathname.includes("/equipment")
    ? "equipment"
    : "book";

  // Staff cannot manage users; admins and registrars can.
  const canManageUsers =
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.REGISTRAR;

  // User management state + handlers
  // NOTE: autoLoad depends on permission to avoid unnecessary requests.
  const {
    users,
    editingUser,
    addingUser,
    error,
    handleEditUser,
    handleSaveUser,
    handleAddUser,
    handleSaveNewUser,
    handleBlockUser,
    setEditingUser,
    setAddingUser,
  } = useUsers({ autoLoad: !!canManageUsers });

  // Fetch audit logs for admin users
  // NOTE: convertAuditLogToRow adapts server shape to table rows.
  const { auditLogs, loading: auditLoading, error: auditError } = useAuditLogs();
  const auditRows = auditLogs.map(convertAuditLogToRow);

  // Room filtering state (shared between Booking and Schedule pages)
  const [building, setBuilding] = useState<string>("");
  const [roomQuery, setRoomQuery] = useState<string>("");
  const [date, setDate] = useState<string>(getCurrentDate());
  const [start, setStart] = useState<string>("10:00");
  const [end, setEnd] = useState<string>("11:00");

  // Logout then hard-navigate to login to clear protected UI
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // Global auth loading placeholder
  if (isLoading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading…</div>;
  }

  // When unauthenticated inside ProtectedRoute boundary, render nothing here.
  if (!currentUser) {
    return null;
  }

  return (
    <div className="app-shell">
      {/* App header with current role badge and logout */}
      <div className="header">
        <div className="header-info">
          <span className="badge">
            {String(currentUser.role).toUpperCase()}
          </span>
          <h1 className="title">Rooms & Scheduling</h1>
        </div>
        <div className="header-actions">
          <button className="btn secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      {/* Top-level tab navigation; uses currentTab to highlight active tab */}
      <TabNavigation currentTab={tab} currentUser={currentUser} />

      {/* Tab content routing by derived "tab" (keeps URL as source of truth) */}
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
          // After a booking is created, navigate to the user's booking history
          onBookingCreated={() => navigate("/history")}
        />
      )}

      {tab === "schedule" && (
        <SchedulePage
          date={date}
          setDate={setDate}
          building={building}
          setBuilding={setBuilding}
        />
      )}

      {tab === "history" && <HistoryPage currentUser={currentUser} />}

      {/* Users page is visible to admins/registrars; logic also enforced in route guard */}
      {tab === "users" && (
        <UsersPage
          users={users}
          currentUser={currentUser}
          editingUser={editingUser}
          addingUser={addingUser}
          error={error}
          onEditUser={handleEditUser}
          onSaveUser={handleSaveUser}
          onAddUser={handleAddUser}
          onSaveNewUser={handleSaveNewUser}
          onBlockUser={handleBlockUser}
          onCancelEdit={() => setEditingUser(null)}
          onCancelAdd={() => setAddingUser(null)}
        />
      )}

      {/* Admin-only sections */}
      {tab === "audit" && currentUser.role === UserRole.ADMIN && (
        <AuditTable rows={auditRows} loading={auditLoading} error={auditError} />
      )}
      {tab === "health" && (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.REGISTRAR) && (
        <SystemHealth />
      )}
      {tab === "buildings" && currentUser.role === UserRole.ADMIN && (
        <BuildingsRooms />
      )}
      {tab === "equipment" && currentUser.role === UserRole.ADMIN && (
        <EquipmentManagement />
      )}
    </div>
  );
};

/**
 * AppRouter
 * - Declares top-level routes, including /login and a protected "/" area.
 * - Nested child routes under "/" exist to change the URL while content
 *   selection is handled inside HomeComponent via the derived "tab".
 *   (Routes render null to avoid double-mounting.)
 */
const AppRouter: React.FC = () => {
  const { login } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={login} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute
            allowedRoles={[UserRole.STAFF, UserRole.REGISTRAR, UserRole.ADMIN]}
          >
            <HomeComponent />
          </ProtectedRoute>
        }
      >
        {/* Default route redirects to the booking tab */}
        <Route index element={<Navigate to="/book" replace />} />
        {/* Child routes exist only to affect the URL; HomeComponent reads location */}
        <Route path="schedule" element={null} />
        <Route path="book" element={null} />
        <Route path="history" element={null} />
        <Route path="users" element={null} />
        <Route path="audit" element={null} />
        <Route path="health" element={null} />
        <Route path="buildings" element={null} />
        <Route path="equipment" element={null} />
      </Route>
      {/* Fallback to login for unknown paths */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

/**
 * App
 * - Provides Auth context and BrowserRouter for the entire application.
 * - Wraps AppRouter so both login and protected routes share the same providers.
 */
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRouter />
      </Router>
    </AuthProvider>
  );
}