/**
 * BookingPage.filters-and-reservations.test.tsx - Tests room filtering and reservation markers
 */

import { screen } from '@testing-library/react';
import { mockHooks, renderBookingPage } from './BookingPage.test-setup';

describe('<BookingPage /> - Filters and Reservations', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('marks rooms as reserved when they appear in booked slots', async () => {
        const allRooms = [
            {
                room_id: 'avail1',
                building_short_name: 'ECS',
                room_number: '101',
                room_type: 'classroom',
                capacity: 40,
                slots: [],
            },
            {
                room_id: 'booked1',
                building_short_name: 'ECS',
                room_number: '102',
                room_type: 'classroom',
                capacity: 35,
                slots: [],
            },
        ] as any;

        const bookedRooms = [
            {
                room_id: 'booked1',
                building_short_name: 'ECS',
                room_number: '102',
                room_type: 'classroom',
                capacity: 35,
                slots: [
                    { start_time: '2025-10-05T09:00:00Z', end_time: '2025-10-05T10:00:00Z' },
                ],
            },
        ] as any;

        mockHooks.useRooms.mockReturnValue({ rooms: allRooms, loading: false, error: null });
        mockHooks.useSchedule.mockReturnValue({ rooms: bookedRooms, loading: false, error: null });
        mockHooks.useBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        renderBookingPage();

        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument();
        expect(screen.getByText(/ECS 102/i)).toBeInTheDocument();

        const cards = screen.getAllByTestId('room-card');
        expect(cards).toHaveLength(2);
    });

    test('filters rooms by room query text', async () => {
        const allRooms = [
            {
                room_id: 'r101',
                building_short_name: 'ECS',
                room_number: '101',
                room_type: 'classroom',
                capacity: 40,
                slots: [],
            },
            {
                room_id: 'r102',
                building_short_name: 'ECS',
                room_number: '102',
                room_type: 'classroom',
                capacity: 35,
                slots: [],
            },
        ] as any;

        mockHooks.useRooms.mockReturnValue({ rooms: allRooms, loading: false, error: null });
        mockHooks.useSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockHooks.useBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        renderBookingPage({ roomQuery: '101' });

        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument();
        expect(screen.queryByText(/ECS 102/i)).not.toBeInTheDocument();
    });

    test('shows available and booked rooms', async () => {
        const allRooms = [
            {
                room_id: 'avail',
                building_short_name: 'ECS',
                room_number: '201',
                room_type: 'classroom',
                capacity: 40,
                slots: [],
            },
            {
                room_id: 'booked',
                building_short_name: 'ECS',
                room_number: '202',
                room_type: 'classroom',
                capacity: 35,
                slots: [],
            },
        ] as any;

        const bookedRooms = [
            {
                room_id: 'booked',
                building_short_name: 'ECS',
                room_number: '202',
                room_type: 'classroom',
                capacity: 35,
                slots: [
                    { start_time: '2025-10-05T09:00:00Z', end_time: '2025-10-05T10:00:00Z' },
                ],
            },
        ] as any;

        mockHooks.useRooms.mockReturnValue({ rooms: allRooms, loading: false, error: null });
        mockHooks.useSchedule.mockReturnValue({ rooms: bookedRooms, loading: false, error: null });
        mockHooks.useBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        renderBookingPage();

        expect(screen.getByText(/ECS 201/i)).toBeInTheDocument();
        expect(screen.getByText(/ECS 202/i)).toBeInTheDocument();
    });
});
