import React from "react";
import { TabKey, User, UserRole } from "../types";

interface TabNavigationProps {
  currentTab: TabKey;
  setTab: (tab: TabKey) => void;
  currentUser: User;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  currentTab,
  setTab,
  currentUser,
}) => {
  const isStaff = currentUser.role === UserRole.STAFF;

  return (
    <div className="tabs" role="tablist" aria-label="Sections">
      {!isStaff && (
        <button
          type="button"
          className={currentTab === "schedule" ? "tab active" : "tab"}
          role="tab"
          aria-selected={currentTab === "schedule"}
          onClick={() => setTab("schedule")}
        >
          Schedule
        </button>
      )}

      <button
        type="button"
        className={currentTab === "book" ? "tab active" : "tab"}
        role="tab"
        aria-selected={currentTab === "book"}
        onClick={() => setTab("book")}
      >
        Book Rooms
      </button>

      <button
        type="button"
        className={currentTab === "history" ? "tab active" : "tab"}
        role="tab"
        aria-selected={currentTab === "history"}
        onClick={() => setTab("history")}
      >
        My Bookings &amp; History
      </button>

      {(currentUser.role === UserRole.ADMIN ||
        currentUser.role === UserRole.REGISTRAR) && (
        <button
          type="button"
          className={currentTab === "users" ? "tab active" : "tab"}
          role="tab"
          aria-selected={currentTab === "users"}
          onClick={() => setTab("users")}
        >
          User List
        </button>
      )}

      {currentUser.role === UserRole.ADMIN && (
        <button
          className="tab"
          role="tab"
          aria-selected={currentTab === "buildings"}
          onClick={() => setTab("buildings")}
        >
          Manage Buildings & Rooms
        </button>
      )}
      {currentUser.role === UserRole.ADMIN && (
        <button
          className="tab"
          role="tab"
          aria-selected={currentTab === "equipment"}
          onClick={() => setTab("equipment")}
        >
          Manage Equipment
        </button>
      )}
      {currentUser.role === UserRole.ADMIN && (
        <button
          className="tab"
          role="tab"
          aria-selected={currentTab === "audit"}
          onClick={() => setTab("audit")}
        >
          Audit
        </button>
      )}
      {currentUser.role === UserRole.ADMIN && (
        <button
          className="tab"
          role="tab"
          aria-selected={currentTab === "health"}
          onClick={() => setTab("health")}
        >
          System Health
        </button>
      )}
    </div>
  );
};
