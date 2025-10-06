// src/pages/__tests__/BookingPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingPage } from '../src/pages/BookingPage';
import { useSchedule } from '../src/hooks/useSchedule';
import { useBookingHistory } from '../src/hooks/useBookingHistory';
import { Room } from '../src/types';
// Mock hooks
jest.mock('../../hooks/useSchedule');
jest.mock('../../hooks/useBookingHistory');

// Mock child components
jest.mock('../../components/FilterPanel', () => ({
    FilterPanel: ({ building, setBuilding }: { building: string; setBuilding: (b: string) => void }) => (
        <div data-testid="filter-panel">
            <button onClick={() => setBuilding('ECS')}>Set Building</button>
            <span>Building: {building}</span>
        </div>
    ),
}));

jest.mock('../../components/RoomCard', () => ({
    RoomCard: ({ room, onBook }: { room: Room; onBook: (room: Room) => void }) => (
        <div data-testid="room-card">
            <h3>{room.name}</h3>
            <button onClick={() => onBook(room)}>Book</button>
        </div>
    ),
}));

describe('<BookingPage />', () => {
    const mockUseSchedule = useSchedule as jest.Mock;
    const mockUseBookingHistory = useBookingHistory as jest.Mock;

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

    test('renders loading state', () => {
        mockUseSchedule.mockReturnValue({ rooms: [], loading: true, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(<BookingPage {...baseProps} />);

        expect(screen.getByText(/Loading available rooms/i)).toBeInTheDocument();
    });

    test('renders error state', () => {
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: 'Server error' });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(<BookingPage {...baseProps} />);

        expect(screen.getByText(/Error: Server error/i)).toBeInTheDocument();
    });

    test('renders empty state when no rooms available', () => {
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        render(<BookingPage {...baseProps} />);

        expect(screen.getByText(/No rooms available/i)).toBeInTheDocument();
    });

    test('renders rooms and can trigger booking', async () => {
        const mockCreateBooking = jest.fn().mockResolvedValueOnce(undefined);
        mockUseBookingHistory.mockReturnValue({ createBooking: mockCreateBooking, error: null });

        const mockRooms: Room[] = [
            {
                id: 'room1',
                name: 'ECS 125',
                number: '125',
                building: 'ECS',
                type: 'classroom',
                capacity: 40,
                slots: [
                    {
                        start_time: '2025-10-05T08:00:00Z',
                        end_time: '2025-10-05T11:00:00Z',
                    },
                ],
            } as unknown as Room,
        ];

        mockUseSchedule.mockReturnValue({ rooms: mockRooms, loading: false, error: null });

        render(<BookingPage {...baseProps} />);

        expect(screen.getByText(/Find an available room/i)).toBeInTheDocument();
        expect(screen.getByText(/ECS 125/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText('Book'));

        await waitFor(() => expect(mockCreateBooking).toHaveBeenCalledTimes(1));
        expect(mockCreateBooking).toHaveBeenCalledWith('room1', '2025-10-05', '09:00', '10:00');
        expect(baseProps.onBookingCreated).toHaveBeenCalled();
    });

    test('renders booking error message', () => {
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({
            createBooking: jest.fn(),
            error: 'Booking failed',
        });

        render(<BookingPage {...baseProps} />);

        expect(screen.getByText(/Booking error: Booking failed/i)).toBeInTheDocument();
    });
});
