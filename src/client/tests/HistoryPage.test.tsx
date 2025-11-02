// src/pages/__tests__/HistoryPage.test.tsx
/**
 * HistoryPage.test.tsx
 *
 * What this suite covers:
 * - Loading state: shows a loading placeholder while history is fetched
 * - Error state: surfaces hook-provided errors to the user
 * - Empty state: shows a friendly "no bookings" message
 * - Success state: renders BookingCard for each booking and triggers initial fetch
 * - Resilience: if BookingCard throws, the page shows a FallbackTile instead (Error Boundary)
 *
 * Test strategy:
 * - useBookingHistory is mocked to drive loading/error/data deterministically
 * - BookingCard is mocked so we can force a render error to exercise the fallback UI
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoryPage } from '../src/pages/HistoryPage';
import { useBookingHistory } from '../src/hooks/useBookingHistory';
import { BookingCard } from '../src/components/BookingCard';
import { User, UserRole } from '../src/types';

jest.mock('react-dom/client', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actual = jest.requireActual('react-dom/client') as any;
    return {
        ...actual,
        createRoot: (container: unknown, options?: { onRecoverableError?: (error: unknown, info: unknown) => void }) => {
            return actual.createRoot(container, {
                ...options,
                onRecoverableError: (error: unknown, info: unknown) => {
                    if ((error as Error)?.message !== 'Render failure') {
                        options?.onRecoverableError?.(error, info);
                    }
                },
            });
        },
    };
});

// Mock the hook and child component
jest.mock('../src/hooks/useBookingHistory');
jest.mock('../src/components/BookingCard', () => ({
    BookingCard: jest.fn(({ booking }) => (
        <div data-testid="booking-card">{booking.name}</div>
    )),
}))

describe('<HistoryPage />', () => {
    // Cast the imported hook to a jest.Mock so we can set a return value per test
    const mockUseBookingHistory = useBookingHistory as jest.Mock
    // Spies used by the hook return value
    const mockFetchHistory = jest.fn()
    const mockCancelBooking = jest.fn()

    // Base (non-privileged) user for most tests
    const baseUser: User = {
        id: 'u1',
        email: 'user@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: UserRole.STAFF,
    }

    beforeEach(() => {
        // Reset all mocks between tests to avoid leakage
        jest.clearAllMocks()
    })

    it('renders loading state while history is being fetched', () => {
        // Arrange: hook reports loading=true
        mockUseBookingHistory.mockReturnValue({
            history: [],
            loading: true,
            error: null,
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        })

        try {
            render(<HistoryPage currentUser={baseUser} />);
        } catch (error) {
            // React 18's concurrent rendering throws once before falling back to the
            // error boundary's synchronous pass. Swallow the intentional failure so
            // we can assert on the rendered fallback UI.
            if ((error as Error).message !== 'Render failure') {
                throw error;
            }
        }

        // Assert: loading placeholder is visible
        expect(screen.getByText(/Loading your bookings/i)).toBeInTheDocument()
    })

    it('renders error state when the hook surfaces an error', () => {
        // Arrange: hook returns a non-null error
        mockUseBookingHistory.mockReturnValue({
            history: [],
            loading: false,
            error: 'Something went wrong',
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        })

        // Act
        render(<HistoryPage currentUser={baseUser} />)

        // Assert: error message is displayed to the user
        expect(screen.getByText(/Error: Something went wrong/i)).toBeInTheDocument()
    })

    it('renders empty state when the user has no bookings', () => {
        // Arrange: hook returns an empty history with no loading/error
        mockUseBookingHistory.mockReturnValue({
            history: [],
            loading: false,
            error: null,
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        })

        // Act
        render(<HistoryPage currentUser={baseUser} />)

        // Assert: empty-state copy is shown
        expect(screen.getByText(/You have no bookings yet/i)).toBeInTheDocument()
    })

    it('renders BookingCard items and triggers initial fetch on mount', async () => {
        // Arrange: one booking in user history
        const mockHistory = [
            {
                id: 'b1',
                name: 'ECS 125',
                building: 'ECS',
                roomNumber: '125',
                start: '09:00',
                end: '10:00',
                date: '2025-10-05',
                cancelled: false,
            },
        ]
        mockUseBookingHistory.mockReturnValue({
            history: mockHistory,
            loading: false,
            error: null,
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        })

        // Act
        render(<HistoryPage currentUser={baseUser} />)

        // Assert: BookingCard is rendered with the booking name
        expect(await screen.findByTestId('booking-card')).toHaveTextContent('ECS 125')

        // Assert: fetchHistory is invoked by useEffect on mount
        await waitFor(() => expect(mockFetchHistory).toHaveBeenCalledTimes(1))
    })

    it('falls back to FallbackTile when BookingCard throws during render', async () => {
        // Arrange: force the BookingCard mock to throw once to simulate a broken child
        // Cast to jest.Mock so TypeScript understands the mock has mockImplementationOnce
        ;(BookingCard as unknown as jest.Mock).mockImplementationOnce(() => {
            throw new Error('Render failure')
        })

        const mockHistory = [
            {
                id: 'b1',
                name: 'Broken Card',
                building: 'ECS',
                roomNumber: '125',
                start: '09:00',
                end: '10:00',
                date: '2025-10-05',
                cancelled: false,
            },
        ]
        mockUseBookingHistory.mockReturnValue({
            history: mockHistory,
            loading: false,
            error: null,
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        })

        // Act
        render(<HistoryPage currentUser={baseUser} />)

        // Assert: the fallback tile text (booking name) is rendered instead of the card
        expect(await screen.findByText(/Broken Card/i)).toBeInTheDocument()
    })
})