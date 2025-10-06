import React from 'react'
import { render, screen } from '@testing-library/react'
import { UsersPage } from '../src/pages/UsersPage'
import { User, UserRole } from '../src/types'

// Mock child components
jest.mock('../src/components/UserTab', () => {
    const Mock = () => <div data-testid="users-tab">UsersTab</div>
    Mock.displayName = 'UserTab'
    return Mock
})

jest.mock('../src/components/EditUser', () => {
    const Mock = ({ user }: { user: User }) => <div data-testid="edit-user">Editing: {user.first_name}</div>
    Mock.displayName = 'EditUser'
    return Mock
})

jest.mock('../src/components/AddUser', () => {
    const Mock = ({ user }: { user: User }) => <div data-testid="add-user">Adding: {user.first_name}</div>
    Mock.displayName = 'AddUser'
    return Mock
})

const baseUser: User = {
    id: '1',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
}

const sampleUsers: User[] = [
    { id: '2', email: 'a@b.com', first_name: 'Jane', last_name: 'Doe', role: UserRole.STAFF },
    { id: '3', email: 'x@y.com', first_name: 'John', last_name: 'Smith', role: UserRole.REGISTRAR },
]

describe('UsersPage', () => {
    const mockHandlers = {
        onEditUser: jest.fn(),
        onSaveUser: jest.fn(),
        onAddUser: jest.fn(),
        onSaveNewUser: jest.fn(),
        onBlockUser: jest.fn(),
        onCancelEdit: jest.fn(),
        onCancelAdd: jest.fn(),
    }

    it('renders UsersTab for admin user', () => {
        render(
            <UsersPage
                users={sampleUsers}
                currentUser={baseUser}
                editingUser={null}
                addingUser={null}
                error={null}
                {...mockHandlers}
            />
        )

        expect(screen.getByTestId('users-tab')).toBeInTheDocument()
    })

    it('renders EditUser when editingUser is provided', () => {
        render(
            <UsersPage
                users={sampleUsers}
                currentUser={baseUser}
                editingUser={sampleUsers[0]}
                addingUser={null}
                error={null}
                {...mockHandlers}
            />
        )

        expect(screen.getByTestId('edit-user')).toHaveTextContent('Editing: Jane')
    })

    it('renders AddUser when addingUser is provided', () => {
        render(
            <UsersPage
                users={sampleUsers}
                currentUser={baseUser}
                editingUser={null}
                error={null}
                addingUser={sampleUsers[1]}
                {...mockHandlers}
            />
        )

        expect(screen.getByTestId('add-user')).toHaveTextContent('Adding: John')
    })

    it('renders nothing for non-admin users', () => {
        const nonAdmin: User = { ...baseUser, role: UserRole.STAFF }

        const { container } = render(
            <UsersPage
                users={sampleUsers}
                currentUser={nonAdmin}
                editingUser={null}
                addingUser={null}
                error={null}
                {...mockHandlers}
            />
        )

        expect(container).toBeEmptyDOMElement()
    })
})
