// src/pages/__tests__/HistoryPage.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { HistoryPage } from '../src/pages/HistoryPage';
import { useBookingHistory } from '../src/hooks/useBookingHistory';
import { BookingCard } from '../src/components/BookingCard';
import { User, UserRole } from '../src/types';

// Mock the hook and child component
jest.mock('../../hooks/useBookingHistory');
jest.mock('../../components/BookingCard', () => ({
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
        });

        render(<HistoryPage currentUser={baseUser} />);

        expect(screen.getByText(/Loading your bookings/i)).toBeInTheDocument();
    });

    test('renders error state', () => {
        mockUseBookingHistory.mockReturnValue({
            history: [],
            loading: false,
            error: 'Something went wrong',
            fetchHistory: mockFetchHistory,
            cancelBooking: mockCancelBooking,
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
        });

        render(<HistoryPage currentUser={baseUser} />);

        // Should fall back to FallbackTile text
        expect(await screen.findByText(/Broken Card/i)).toBeInTheDocument();
    });
});
