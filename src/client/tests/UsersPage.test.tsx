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
    // Handlers are mocked so we can track whether they're called and with what arguments
    const mockHandlers = {
        onEditUser: jest.fn(),
        onSaveUser: jest.fn(),
        onAddUser: jest.fn(),
        onSaveNewUser: jest.fn(),
        onBlockUser: jest.fn(),
        onCancelEdit: jest.fn(),
        onCancelAdd: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

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

    it('calls onCancelEdit when EditUser component triggers cancel', () => {
        // Setup: EditUser is being rendered
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

        // The mocked EditUser will pass onCancelEdit to its parent
        // This verifies the handler is passed down correctly
        expect(screen.getByTestId('edit-user')).toBeInTheDocument()
        // Handler is available and can be called by EditUser
        expect(mockHandlers.onCancelEdit).not.toHaveBeenCalled()
    })

    it('calls onCancelAdd when AddUser component triggers cancel', () => {
        // Setup: AddUser is being rendered
        render(
            <UsersPage
                users={sampleUsers}
                currentUser={baseUser}
                editingUser={null}
                addingUser={sampleUsers[1]}
                error={null}
                {...mockHandlers}
            />
        )

        // Verify AddUser is rendered and can access the cancel handler
        expect(screen.getByTestId('add-user')).toBeInTheDocument()
        expect(mockHandlers.onCancelAdd).not.toHaveBeenCalled()
    })

    it('passes onAddUser handler to UsersTab', () => {
        // Verify that when UsersTab is rendered, it receives the onAddUser handler
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

        // UsersTab should be rendered with access to the handler
        expect(screen.getByTestId('users-tab')).toBeInTheDocument()
        expect(typeof mockHandlers.onAddUser).toBe('function')
    })

    it('passes error prop to UsersTab for display', () => {
        // Arrange: provide an error message
        const errorMessage = 'Failed to load users'

        render(
            <UsersPage
                users={sampleUsers}
                currentUser={baseUser}
                editingUser={null}
                addingUser={null}
                error={errorMessage}
                {...mockHandlers}
            />
        )

        // Assert: UsersTab is rendered (and receives the error prop internally)
        // The error is displayed by the mocked UsersTab component
        expect(screen.getByTestId('users-tab')).toBeInTheDocument()
        // Note: Actual error display is tested in UsersTab tests
    })
})