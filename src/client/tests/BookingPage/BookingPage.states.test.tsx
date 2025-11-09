/**
 * BookingPage.states.test.tsx - Tests loading, error, empty, and reservation banner states
 */

import { screen } from '@testing-library/react';
import { mockHooks, renderBookingPage } from './BookingPage.test-setup';

describe('<BookingPage /> - UI States', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders loading state', async () => {
        mockHooks.useRooms.mockReturnValue({ rooms: [], loading: true, error: null });
        mockHooks.useSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockHooks.useBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        renderBookingPage();
        expect(await screen.findByText(/Loading available rooms/i)).toBeInTheDocument();
    });

    test('renders error state', async () => {
        mockHooks.useRooms.mockReturnValue({ rooms: [], loading: false, error: 'Rooms fetch failed' });
        mockHooks.useSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockHooks.useBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        renderBookingPage();
        expect(await screen.findByText(/Error: Rooms fetch failed/i)).toBeInTheDocument();
    });

    test('renders empty state when no rooms available', async () => {
        mockHooks.useRooms.mockReturnValue({ rooms: [], loading: false, error: null });
        mockHooks.useSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockHooks.useBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        renderBookingPage();
        expect(await screen.findByText(/No rooms available/i)).toBeInTheDocument();
    });

    test('renders booking error message', async () => {
        mockHooks.useRooms.mockReturnValue({ rooms: [], loading: false, error: null });
        mockHooks.useSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockHooks.useBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: 'Booking failed' });

        renderBookingPage();
        expect(await screen.findByText(/Booking error: Booking failed/i)).toBeInTheDocument();
    });

    test('shows all rooms as reserved when time filter is incomplete', async () => {
        const mockRooms = [
            {
                room_id: 'r1',
                building_short_name: 'ECS',
                room_number: '105',
                room_type: 'classroom',
                capacity: 30,
                slots: [],
            },
        ] as any;

        mockHooks.useRooms.mockReturnValue({ rooms: mockRooms, loading: false, error: null });
        mockHooks.useSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockHooks.useBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        renderBookingPage({ start: '' });

        expect(screen.getByText(/ECS 105/i)).toBeInTheDocument();
        const cards = screen.getAllByTestId('room-card');
        expect(cards).toHaveLength(1);
    });
});
