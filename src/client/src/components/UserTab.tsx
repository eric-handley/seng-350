import React from "react"
import { User } from "../types/models"

type UsersTabProps = {
  users: User[]
  handleEditUser: (user: User) => void
  handleAddUser: (user: User) => void
  handleBlockUser: (user: User) => void
};

export default function UsersTab({ users, handleEditUser, handleAddUser, handleBlockUser }: UsersTabProps) {
  return (
    <div>
      <section className="panel" aria-labelledby="users-label">
        <h2 id="users-label" style={{ marginTop: 0 }}>All Users</h2>

        {users.length === 0 ? (
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
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.role}</td>
                  <td>{u.email}</td>
                  <td>
                    <button
                      className="btn primary"
                      onClick={() => handleEditUser(u)}
                      style={{ marginRight: '10px' }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn primary"
                      onClick={() => handleBlockUser(u)}
                    >
                      Block
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="panel" aria-labelledby="add-users-label">
        <h3 id="add-users-label" style={{ marginTop: 0 }}>Add New User</h3>
          <button
            className="btn primary"
            onClick={() => handleAddUser({ id: '', name: '', role: 'staff', email: '' })}
          >
          Add User
          </button>
        
      </section>
    </div>
  );
}