/**
 * LoginPage.test.tsx
 *
 * What this suite covers:
 * - Successful login flow: sends credentials, calls onLogin, and navigates to /book
 * - Error handling for failed logins:
 *   - 401 Unauthorized -> shows "Invalid email or password" with CSS class "error"
 *   - Non-OK responses with a JSON body containing `message`
 *   - Non-OK responses where parsing JSON fails -> falls back to "Login failed: <status>"
 *   - Fetch rejections:
 *     - Error instance -> shows error.message
 *     - String -> shows the string
 *     - Non-serializable object -> uses a generic "Login failed" fallback
 * - UI behavior:
 *   - Clearing old errors when a new submit starts
 *   - "Dev login" buttons that prefill credentials and clear errors
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../src/pages/LoginPage'
import { BrowserRouter } from 'react-router-dom'

// Mock react-router's useNavigate to capture and assert navigation behavior
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}))

/**
 * Note: This beforeEach provides a basic global.fetch mock.
 * A more specific beforeEach below replaces it with `mockFetch` for all tests.
 * Keeping this is harmless but somewhat redundant.
 */
beforeEach(() => {
    jest.clearAllMocks()
    // Generic fetch mock; will be overridden by the more specific one below
    global.fetch = jest.fn() as jest.Mock
})

/**
 * Helper: render with a BrowserRouter so <LoginPage> can use routing hooks.
 */
function renderWithRouter(ui: React.ReactElement) {
    return render(<BrowserRouter>{ui}</BrowserRouter>)
}

/**
 * Helpers: interact with the login form in an accessible way.
 * - typeCredentials: fill the email and password inputs
 * - clickLogin: submit the form by clicking the "Login" button
 */
function typeCredentials(email: string, password: string) {
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: email } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } })
}
function clickLogin() {
    fireEvent.click(screen.getByRole('button', { name: /login/i }))
}

// Centralized fetch mock that every test uses
const mockFetch = jest.fn() as jest.Mock

/**
 * Authoritative beforeEach for fetch mocking across tests:
 * - Clear all Jest mocks
 * - Reset our shared mockFetch
 * - Assign mockFetch to global.fetch so the component's API calls are intercepted
 */
beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
    global.fetch = mockFetch as unknown as typeof fetch
})

describe('LoginPage', () => {
    it('submits credentials and navigates on successful login', async () => {
        const onLogin = jest.fn()

        // Arrange: simulate a successful server response with a user payload
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                id: '1',
                email: 'admin@uvic.ca',
                first_name: 'Admin',
                last_name: 'User',
                role: 'Admin',
            }),
        })

        renderWithRouter(<LoginPage onLogin={onLogin} />)

        // Act: fill in valid credentials and submit
        typeCredentials('admin@uvic.ca', 'password123')
        clickLogin()

        // Assert: the component made exactly one request
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledTimes(1)
        })

        // Assert: request options are correct (POST, JSON body, include cookies)
        const [, options] = mockFetch.mock.calls[0]
        expect(options).toMatchObject({
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        })

        // Assert: body contains the typed credentials
        const parsed = JSON.parse((options as any).body)
        expect(parsed).toEqual({ email: 'admin@uvic.ca', password: 'password123' })

        // Assert: onLogin is called with the returned user and navigation goes to /book
        await waitFor(() => {
            expect(onLogin).toHaveBeenCalledWith(
                expect.objectContaining({ email: 'admin@uvic.ca', role: 'Admin' })
            )
            expect(mockNavigate).toHaveBeenCalledWith('/book')
        })
    })

    it('shows "Invalid email or password" for 401 responses', async () => {
        // Arrange: backend indicates invalid credentials with 401
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({}),
        })

        renderWithRouter(<LoginPage onLogin={jest.fn()} />)

        // Act: attempt a bad login
        typeCredentials('x@x.com', 'bad')
        clickLogin()

        // Assert: a specific message is shown for 401
        await waitFor(() =>
            expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument()
        )
        // And it renders with a CSS hook for styling
        expect(screen.getByText(/Invalid email or password/i)).toHaveClass('error')
    })

    it('shows server-provided error message for non-ok responses with JSON message', async () => {
        // Arrange: server returns a non-OK status with a JSON error payload
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ message: 'Server error' }),
        })

        renderWithRouter(<LoginPage onLogin={jest.fn()} />)

        // Act
        typeCredentials('a@b.com', 'pw')
        clickLogin()

        // Assert: the server-provided message is surfaced to the user
        await waitFor(() => expect(screen.getByText(/Server error/i)).toBeInTheDocument())
    })

    it('falls back to "Login failed: <status>" when error JSON cannot be parsed', async () => {
        // Arrange: server responds non-OK but the JSON body is invalid/throws
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 502,
            json: async () => {
                throw new Error('bad json')
            },
        })

        renderWithRouter(<LoginPage onLogin={jest.fn()} />)

        // Act
        typeCredentials('a@b.com', 'pw')
        clickLogin()

        // Assert: shows a generic status-based message when parsing fails
        await waitFor(() =>
            expect(screen.getByText(/Login failed: 502/i)).toBeInTheDocument()
        )
    })

    it('displays Error.message when fetch rejects with an Error', async () => {
        // Arrange: fetch itself rejects with an Error instance (network, etc.)
        mockFetch.mockRejectedValueOnce(new Error('Network down'))

        renderWithRouter(<LoginPage onLogin={jest.fn()} />)

        // Act
        typeCredentials('a@b.com', 'pw')
        clickLogin()

        // Assert: the error.message is displayed
        await waitFor(() => expect(screen.getByText(/Network down/i)).toBeInTheDocument())
    })

    it('displays the string itself when fetch rejects with a string', async () => {
        // Arrange: fetch rejects with a raw string
        mockFetch.mockRejectedValueOnce('plain string error')

        renderWithRouter(<LoginPage onLogin={jest.fn()} />)

        // Act
        typeCredentials('a@b.com', 'pw')
        clickLogin()

        // Assert: the string is rendered as the error
        await waitFor(() =>
            expect(screen.getByText(/plain string error/i)).toBeInTheDocument()
        )
    })

    it('uses fallback "Login failed" when fetch rejects with a non-serializable object', async () => {
        // Arrange: create a circular object; useful to simulate "unstringifiable" errors
        const circular: any = {}
        circular.self = circular
        mockFetch.mockRejectedValueOnce(circular)

        renderWithRouter(<LoginPage onLogin={jest.fn()} />)

        // Act
        typeCredentials('a@b.com', 'pw')
        clickLogin()

        // Assert: falls back to a generic message when error cannot be meaningfully stringified
        await waitFor(() => expect(screen.getByText(/Login failed/i)).toBeInTheDocument())
    })

    it('clears any previous error at the beginning of a new submit', async () => {
        // Arrange (1st attempt): provoke a 401 to display an error
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({}),
        })
        // Arrange (2nd attempt): leave the promise pending; we only verify that
        // clicking submit clears the previous error immediately (before resolution)
        mockFetch.mockImplementationOnce(() => new Promise(() => { }))

        renderWithRouter(<LoginPage onLogin={jest.fn()} />)

        // Act (1st): submit invalid credentials to show an error
        typeCredentials('bad@x.com', 'bad')
        clickLogin()
        await waitFor(() =>
            expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument()
        )

        // Act (2nd): click submit again; component should synchronously clear prior errors
        clickLogin()

        // Assert: old error is cleared immediately on new submit
        expect(screen.queryByText(/Invalid email or password/i)).toBeNull()
    })

    it('dev login buttons prefill credentials and clear error (Staff/Admin/Registrar)', async () => {
        renderWithRouter(<LoginPage onLogin={jest.fn()} />)

        // Seed an error to verify the dev buttons also clear any existing error
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({}),
        })
        typeCredentials('seed@err.com', 'x')
        clickLogin()
        await waitFor(() =>
            expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument()
        )

        // Staff quick-fill should set email/password and clear error
        fireEvent.click(screen.getByRole('button', { name: /Continue as Staff/i }))
        expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe('staff@uvic.ca')
        expect((screen.getByLabelText(/password/i) as HTMLInputElement).value).toBe('staff')
        expect(screen.queryByText(/Invalid email or password/i)).toBeNull()

        // Admin quick-fill
        fireEvent.click(screen.getByRole('button', { name: /Continue as Admin/i }))
        expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe('admin@uvic.ca')
        expect((screen.getByLabelText(/password/i) as HTMLInputElement).value).toBe('admin')

        // Registrar quick-fill
        fireEvent.click(screen.getByRole('button', { name: /Continue as Registrar/i }))
        expect((screen.getByLabelText(/email/i) as HTMLInputElement).value).toBe('registrar@uvic.ca')
        expect((screen.getByLabelText(/password/i) as HTMLInputElement).value).toBe('registrar')
    })
})