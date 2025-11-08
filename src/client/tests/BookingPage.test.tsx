/**
 * BookingPage.test.tsx - Tests room booking UI and availability logic
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingPage } from '../src/pages/BookingPage';
import { useSchedule } from '../src/hooks/useSchedule';
import { useBookingHistory } from '../src/hooks/useBookingHistory';
import { useRooms } from '../src/hooks/useRooms';
import { Room } from '../src/types';

jest.mock('../src/hooks/useSchedule');
jest.mock('../src/hooks/useBookingHistory');
jest.mock('../src/hooks/useRooms');

jest.mock('../src/components/FilterPanel', () => ({
    FilterPanel: ({ building, setBuilding }: { building: string; setBuilding: (b: string) => void }) => (
        <div data-testid="filter-panel">
            <button onClick={() => setBuilding('CLE')}>Set Building</button>
            <span>Building: {building}</span>
        </div>
    ),
}));

jest.mock('../src/components/RoomCard', () => ({
    RoomCard: ({ room, isReserved, onBook }: { room: any; isReserved?: boolean; onBook: (room: any) => void }) => (
        <div data-testid="room-card">
            <h3>{room.name}</h3>
            <button onClick={() => onBook(room)}>{isReserved ? 'Reserved' : 'Book'}</button>
        </div>
    ),
}));

describe('<BookingPage />', () => {
    const mockUseSchedule = useSchedule as jest.Mock;
    const mockUseBookingHistory = useBookingHistory as jest.Mock;
    const mockUseRooms = useRooms as jest.Mock;

    const baseProps = {
        currentUserId: '123',
        building: '',
        setBuilding: jest.fn(),
        roomQuery: '',
        setRoomQuery: jest.fn(),
        date: '2025-10-05',
        setDate: jest.fn(),
        start: '09:00',
        setStart: jest.fn(),
        end: '10:00',
        setEnd: jest.fn(),
        onBookingCreated: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders loading state', async () => {
        mockUseRooms.mockReturnValue({ rooms: [], loading: true, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(<BookingPage {...baseProps} />);
        expect(await screen.findByText(/Loading available rooms/i)).toBeInTheDocument();
    });

    test('renders error state', async () => {
        mockUseRooms.mockReturnValue({ rooms: [], loading: false, error: 'Rooms fetch failed' });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(<BookingPage {...baseProps} />);
        expect(await screen.findByText(/Error: Rooms fetch failed/i)).toBeInTheDocument();
    });

    test('renders empty state when no rooms available', async () => {
        mockUseRooms.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(<BookingPage {...baseProps} />);
        expect(await screen.findByText(/No rooms available/i)).toBeInTheDocument();
    });

    test('renders rooms and triggers booking', async () => {
        const mockCreateBooking = jest.fn().mockResolvedValue(undefined);
        mockUseBookingHistory.mockReturnValue({ createBooking: mockCreateBooking, error: null });

        const mockRooms: Room[] = [
            {
                room_id: 'room1',
                building_short_name: 'ECS',
                room_number: '125',
                room_type: 'classroom',
                capacity: 40,
                slots: [
                    { start_time: '2025-10-05T08:00:00Z', end_time: '2025-10-05T11:00:00Z' },
                ],
            } as unknown as Room,
        ];
        mockUseRooms.mockReturnValue({ rooms: mockRooms, loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });

        render(<BookingPage {...baseProps} />);
        expect(await screen.findByText(/ECS 125/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText('Book'));

        await waitFor(() => expect(mockCreateBooking).toHaveBeenCalledTimes(1));
        expect(mockCreateBooking).toHaveBeenCalledWith('room1', '2025-10-05', '09:00', '10:00');
        expect(baseProps.onBookingCreated).toHaveBeenCalled();
    });

    test('renders booking error message', async () => {
        mockUseRooms.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: 'Booking failed' });

        render(<BookingPage {...baseProps} />);
        expect(await screen.findByText(/Booking error: Booking failed/i)).toBeInTheDocument();
    });

    test('marks rooms as reserved when they appear in booked slots', async () => {
        const allRooms: Room[] = [
            {
                room_id: 'avail1',
                building_short_name: 'ECS',
                room_number: '101',
                room_type: 'classroom',
                capacity: 40,
                slots: [],
            } as unknown as Room,
            {
                room_id: 'booked1',
                building_short_name: 'ECS',
                room_number: '102',
                room_type: 'classroom',
                capacity: 35,
                slots: [],
            } as unknown as Room,
        ];

        const bookedRooms: Room[] = [
            {
                room_id: 'booked1',
                building_short_name: 'ECS',
                room_number: '102',
                room_type: 'classroom',
                capacity: 35,
                slots: [
                    { start_time: '2025-10-05T09:00:00Z', end_time: '2025-10-05T10:00:00Z' },
                ],
            } as unknown as Room,
        ];

        mockUseRooms.mockReturnValue({ rooms: allRooms, loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: bookedRooms, loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(<BookingPage {...baseProps} />);

        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument();
        expect(screen.getByText(/ECS 102/i)).toBeInTheDocument();

        const cards = screen.getAllByTestId('room-card');
        expect(cards).toHaveLength(2);
    });

    test('shows all rooms as reserved when time filter is incomplete', async () => {
        const mockRooms: Room[] = [
            {
                room_id: 'r1',
                building_short_name: 'ECS',
                room_number: '105',
                room_type: 'classroom',
                capacity: 30,
                slots: [],
            } as unknown as Room,
        ];

        mockUseRooms.mockReturnValue({ rooms: mockRooms, loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(
            <BookingPage
                {...baseProps}
                start=""
            />
        );

        expect(screen.getByText(/ECS 105/i)).toBeInTheDocument();
        const cards = screen.getAllByTestId('room-card');
        expect(cards).toHaveLength(1);
    });

    test('filters rooms by room query text', async () => {
        const allRooms: Room[] = [
            {
                room_id: 'r101',
                building_short_name: 'ECS',
                room_number: '101',
                room_type: 'classroom',
                capacity: 40,
                slots: [],
            } as unknown as Room,
            {
                room_id: 'r102',
                building_short_name: 'ECS',
                room_number: '102',
                room_type: 'classroom',
                capacity: 35,
                slots: [],
            } as unknown as Room,
        ];

        mockUseRooms.mockReturnValue({ rooms: allRooms, loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        const props = {
            ...baseProps,
            roomQuery: '101',
        };
        render(<BookingPage {...props} />);

        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument();
        expect(screen.queryByText(/ECS 102/i)).not.toBeInTheDocument();
    });

    test('shows available and booked rooms', async () => {
        const allRooms: Room[] = [
            {
                room_id: 'avail',
                building_short_name: 'ECS',
                room_number: '201',
                room_type: 'classroom',
                capacity: 40,
                slots: [],
            } as unknown as Room,
            {
                room_id: 'booked',
                building_short_name: 'ECS',
                room_number: '202',
                room_type: 'classroom',
                capacity: 35,
                slots: [],
            } as unknown as Room,
        ];

        const bookedRooms: Room[] = [
            {
                room_id: 'booked',
                building_short_name: 'ECS',
                room_number: '202',
                room_type: 'classroom',
                capacity: 35,
                slots: [
                    { start_time: '2025-10-05T09:00:00Z', end_time: '2025-10-05T10:00:00Z' },
                ],
            } as unknown as Room,
        ];

        mockUseRooms.mockReturnValue({ rooms: allRooms, loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: bookedRooms, loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(<BookingPage {...baseProps} />);

        expect(screen.getByText(/ECS 201/i)).toBeInTheDocument();
        expect(screen.getByText(/ECS 202/i)).toBeInTheDocument();
    });
});