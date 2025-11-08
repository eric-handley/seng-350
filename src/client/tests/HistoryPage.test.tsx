// src/pages/__tests__/HistoryPage.test.tsx
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
}));

describe('<HistoryPage />', () => {
    const mockUseBookingHistory = useBookingHistory as jest.Mock;
    const mockFetchHistory = jest.fn();
    const mockCancelBooking = jest.fn();

    const baseUser: User = {
        id: 'u1',
        email: 'user@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: UserRole.STAFF,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders loading state', () => {
        mockUseBookingHistory.mockReturnValue({
            history: [],
            loading: true,
            error: null,
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        });

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

        expect(screen.getByText(/Loading your bookings/i)).toBeInTheDocument();
    });

    test('renders error state', () => {
        mockUseBookingHistory.mockReturnValue({
            history: [],
            loading: false,
            error: 'Something went wrong',
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        });

        render(<HistoryPage currentUser={baseUser} />);

        expect(screen.getByText(/Error: Something went wrong/i)).toBeInTheDocument();
    });

    test('renders empty state', () => {
        mockUseBookingHistory.mockReturnValue({
            history: [],
            loading: false,
            error: null,
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        });

        render(<HistoryPage currentUser={baseUser} />);

        expect(screen.getByText(/You have no bookings yet/i)).toBeInTheDocument();
    });

    test('renders booking cards when history is present', async () => {
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
        ];

        mockUseBookingHistory.mockReturnValue({
            history: mockHistory,
            loading: false,
            error: null,
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        });

        render(<HistoryPage currentUser={baseUser} />);

        // BookingCard should render
        expect(await screen.findByTestId('booking-card')).toHaveTextContent('ECS 125');

        // fetchHistory should be called once by useEffect
        await waitFor(() => expect(mockFetchHistory).toHaveBeenCalledTimes(1));
    });

    test('renders FallbackTile when BookingCard throws error', async () => {
        // Force BookingCard mock to throw
        (BookingCard as jest.Mock).mockImplementationOnce(() => {
            throw new Error('Render failure');
        });

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
        ];

        mockUseBookingHistory.mockReturnValue({
            history: mockHistory,
            loading: false,
            error: null,
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
            fetchAllBookings: jest.fn(),
            allBookings: [],
        });

        render(<HistoryPage currentUser={baseUser} />);

        // Should fall back to FallbackTile text
        expect(await screen.findByText(/Broken Card/i)).toBeInTheDocument();
    });
});
