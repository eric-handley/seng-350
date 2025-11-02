import React from 'react'
import { render, screen } from '@testing-library/react'
import { UsersPage } from '../src/pages/UsersPage'
import { User, UserRole } from '../src/types'

// Child components are mocked to:
// - Isolate UsersPage conditional rendering logic
// - Keep tests fast and focused on which branch renders
// The mocks expose recognizable testids/text to assert against.
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

// Base admin user used to validate privileged rendering paths
const baseUser: User = {
    id: '1',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
}

// Representative user list to pass through to child tabs/forms
const sampleUsers: User[] = [
    { id: '2', email: 'a@b.com', first_name: 'Jane', last_name: 'Doe', role: UserRole.STAFF },
    { id: '3', email: 'x@y.com', first_name: 'John', last_name: 'Smith', role: UserRole.REGISTRAR },
]

describe('UsersPage', () => {
    // Handlers are mocked so UsersPage can be rendered without real implementations.
    // Note: calls are not asserted in these tests.
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
        // Default (no edit/add state) shows the main Users tab for admins
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
        // Edit mode takes precedence and shows EditUser
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
        // Add mode shows AddUser with the seed user object
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
        // Non-admins should not see the Users management UI
        // (component is expected to short-circuit render)
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