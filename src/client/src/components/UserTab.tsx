import React, { useState } from "react"
import { User } from "../types"

type UsersTabProps = {
  users: User[]
  currentUser: User // <-- Add currentUser prop
  handleEditUser: (user: User) => void
  handleAddUser: (user: User) => void
  handleBlockUser: (user: User) => void
};

export default function UsersTab({
  users,
  currentUser,
  handleEditUser,
  handleAddUser,
  handleBlockUser,
}: UsersTabProps) {
  // Only show tab for registrar or admin
  if (currentUser.role !== "registrar" && currentUser.role !== "admin") {
    return null
  }

  const visibleUsers = users.filter(user => !user.isBlocked)
  const [userToBlock, setUserToBlock] = useState<User | null>(null)

  return (
    <div>
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
                  (currentUser.role === "admin") ||
                  (currentUser.role === "registrar" && u.role === "staff");

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
                      >
                        Block
                      </button>
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
          onClick={() => handleAddUser({ id: '', first_name: '', last_name: '', role: 'staff', email: '' })}
        >
          Add User
        </button>
      </section>
      {userToBlock && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Are you sure you want to block {userToBlock.first_name} {userToBlock.last_name}?</p>
            <button onClick={() => {
              handleBlockUser(userToBlock)
              setUserToBlock(null)
            }}>Confirm</button>
            <button onClick={() => setUserToBlock(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}