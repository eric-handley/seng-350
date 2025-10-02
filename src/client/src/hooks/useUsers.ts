import { useState } from 'react'
import { User } from '../types'
import { INITIAL_USERS } from '../constants'

export const useUsers = () => {
  const [users] = useState<User[]>(INITIAL_USERS)

  const editUser = (user: User) => {
    console.error(`Edit user: ${user.name} (${user.role})`)
  }

  return {
    users,
    editUser,
  }
}