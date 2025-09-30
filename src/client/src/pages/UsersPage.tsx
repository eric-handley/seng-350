import React from 'react'
import { User } from '../types'

interface UsersPageProps {
  users: User[]
  currentUser: User
  onEditUser: (user: User) => void
}

export const UsersPage: React.FC<UsersPageProps> = ({ users, currentUser, onEditUser }) => {
  if (currentUser.role !== 'admin' && currentUser.role !== 'registrar') {
    return null
  }

  return (
    <section className="panel" aria-labelledby="users-label">
      <h2 id="users-label" style={{marginTop:0}}>All Users</h2>

      {users.length === 0 ? (
        <div className="empty">No users found.</div>
      ) : (
        <table className="table" aria-label="Users">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>
                  <button 
                    className="btn primary" 
                    onClick={() => onEditUser(user)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}