import React, { useState } from "react"
import { User } from "../types"

type UsersTabProps = {
  users: User[]
  currentUser: User
  error: string | null
  handleEditUser: (user: User) => void
  handleAddUser: (currentUser: User) => void 
  handleBlockUser: (user: User) => void
  handleEditRole: (user: User) => void
};

export default function UsersTab({
  users,
  currentUser,
  error,
  handleEditUser,
  handleAddUser,
  handleBlockUser,
  handleEditRole, 
}: UsersTabProps) {
  const [userToBlock, setUserToBlock] = useState<User | null>(null)

  if (currentUser.role !== 'Registrar' && currentUser.role !== 'Admin') {
    return null
  }

  const visibleUsers = users

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        {error && (
          <div className="toast">
            {error}
          </div>
        )}
      </div>
      <section className="panel" aria-labelledby="users-label">
        <h2 id="users-label" style={{ marginTop: 0 }}>All Users</h2>
        {visibleUsers.length === 0 ? (
          <div className="empty">No users found.</div>
        ) : (
          <table className="table" aria-label="Users">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => {
                // Only admin can edit/block registrar or admin users
                const canEditOrBlock =
                  currentUser.role === "Admin" ||
                  (currentUser.role === "Registrar" && u.role === "Staff");

                // Only admin can edit the role of other users
                const canEditRole = currentUser.role === "Admin";

                return (
                  <tr key={u.id}>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.role}</td>
                    <td>{u.email}</td>
                    <td>
                      <button
                        className="btn primary"
                        onClick={() => handleEditUser(u)}
                        style={{ marginRight: '10px' }}
                        disabled={!canEditOrBlock}
                      >
                        Edit
                      </button>
                      <button
                        className="btn primary"
                        onClick={() => setUserToBlock(u)}
                        disabled={!canEditOrBlock}
                        style={{ marginRight: '10px' }}
                      >
                        Block
                      </button>
                      {canEditRole && (
                        <button
                          className="btn"
                          onClick={() => handleEditRole(u)}
                          style={{ marginRight: '10px' }}
                        >
                          Edit Role
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      <section className="panel" aria-labelledby="add-users-label">
        <h3 id="add-users-label" style={{ marginTop: 0 }}>Add New User</h3>
          <button
            className="btn primary"
            onClick={() => handleAddUser(currentUser)}
          >
          Add User
        </button>
      </section>
      {userToBlock && (
        <div className="modal-overlay">
          <div className="modal">
            <p style={{ marginBottom: '1.5rem' }}>Are you sure you want to delete {userToBlock.first_name} {userToBlock.last_name}?</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button
                className="btn danger"
                onClick={() => {
                  handleBlockUser(userToBlock)
                  setUserToBlock(null)
                }}
              >
                Delete
              </button>
              <button
                className="btn"
                onClick={() => setUserToBlock(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  )
}
