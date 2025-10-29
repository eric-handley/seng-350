import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingPage } from '../src/pages/BookingPage';
import { useSchedule } from '../src/hooks/useSchedule';
import { useBookingHistory } from '../src/hooks/useBookingHistory';
import { useRooms } from '../src/hooks/useRooms';
import { Room } from '../src/types';

// Mock hooks
jest.mock('../src/hooks/useSchedule');
jest.mock('../src/hooks/useBookingHistory');
jest.mock('../src/hooks/useRooms');

// Mock child components
jest.mock('../src/components/FilterPanel', () => ({
    FilterPanel: ({ building, setBuilding }: { building: string; setBuilding: (b: string) => void }) => (
        <div data-testid="filter-panel">
            <button onClick={() => setBuilding('CLE')}>Set Building</button>
            <span>Building: {building}</span>
        </div>
    ),
}));
type RoomWithReserved = Room & { isReserved: boolean };
jest.mock('../src/components/RoomCard', () => ({
    RoomCard: ({ room, onBook }: { room: RoomWithReserved; onBook: (room: RoomWithReserved) => void }) => (
        <div data-testid="room-card">
            <h3>{room.name}</h3>
            <button onClick={() => onBook(room)}>{room.isReserved ? 'Reserved' : 'Book'}</button>
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

    test('renders empty state when no rooms are available', async () => {
        mockUseRooms.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(<BookingPage {...baseProps} />);

        expect(await screen.findByText(/No rooms available/i)).toBeInTheDocument();
    });

    test('renders rooms and can trigger booking', async () => {
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

        // RoomCard renders
        expect(await screen.findByText(/ECS 125/i)).toBeInTheDocument();

        // Click Book
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
});
