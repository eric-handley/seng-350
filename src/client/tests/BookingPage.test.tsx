/**
 * BookingPage.test.tsx
 *
 * What this suite covers:
 * - Loading state: shows a loading placeholder while either data source is loading
 * - Error state: surfaces upstream error messages from useRooms/useSchedule
 * - Empty state: shows a friendly "no rooms available" message when filters yield no rooms
 * - Success state: renders RoomCard items and invokes createBooking on "Book"
 * - Booking error: displays a banner when createBooking reports an error
 *
 * Test strategy:
 * - Hooks (useRooms/useSchedule/useBookingHistory) are mocked to control loading/error/data
 * - FilterPanel is mocked to a minimal stub (we only need building value/handler)
 * - RoomCard is mocked to render the name and expose a button to trigger onBook
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingPage } from '../src/pages/BookingPage';
import { useSchedule } from '../src/hooks/useSchedule';
import { useBookingHistory } from '../src/hooks/useBookingHistory';
import { useRooms } from '../src/hooks/useRooms';
import { Room } from '../src/types';

// Mock hooks so tests can deterministically drive component state
jest.mock('../src/hooks/useSchedule');
jest.mock('../src/hooks/useBookingHistory');
jest.mock('../src/hooks/useRooms');

// Mock child components:
// - FilterPanel: exposes setBuilding click to keep props flow testable without UI complexity
jest.mock('../src/components/FilterPanel', () => ({
    FilterPanel: ({ building, setBuilding }: { building: string; setBuilding: (b: string) => void }) => (
        <div data-testid="filter-panel">
            <button onClick={() => setBuilding('CLE')}>Set Building</button>
            <span>Building: {building}</span>
        </div>
    ),
}));
// - RoomCard: shows room name and toggles button label based on reserved state; clicking calls onBook
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
    // Typed handles to the mocked hooks
    const mockUseSchedule = useSchedule as jest.Mock;
    const mockUseBookingHistory = useBookingHistory as jest.Mock;
    const mockUseRooms = useRooms as jest.Mock;

    // Common props used across tests
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
        // Clean all mocks to avoid cross-test interference
        jest.clearAllMocks();
    });

    test('renders loading state', async () => {
        // Arrange: rooms still loading; schedule loaded; no booking error
        mockUseRooms.mockReturnValue({ rooms: [], loading: true, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        // Act
        render(<BookingPage {...baseProps} />);

        // Assert: loading placeholder is visible
        expect(await screen.findByText(/Loading available rooms/i)).toBeInTheDocument();
    });

    test('renders error state', async () => {
        // Arrange: rooms hook reports an error
        mockUseRooms.mockReturnValue({ rooms: [], loading: false, error: 'Rooms fetch failed' });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        // Act
        render(<BookingPage {...baseProps} />);

        // Assert: upstream error message is shown
        expect(await screen.findByText(/Error: Rooms fetch failed/i)).toBeInTheDocument();
    });

    test('renders empty state when no rooms are available', async () => {
        // Arrange: no data errors, but no rooms returned after filters
        mockUseRooms.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: null });

        // Act
        render(<BookingPage {...baseProps} />);

        // Assert: empty copy suggests adjusting filters
        expect(await screen.findByText(/No rooms available/i)).toBeInTheDocument();
    });

    test('renders rooms and can trigger booking', async () => {
        // Arrange:
        // - createBooking succeeds
        const mockCreateBooking = jest.fn().mockResolvedValue(undefined);
        mockUseBookingHistory.mockReturnValue({ createBooking: mockCreateBooking, error: null });
        // - one available room, schedule has no bookings
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

        // Act
        render(<BookingPage {...baseProps} />);

        // Assert: RoomCard shows the composed room name
        expect(await screen.findByText(/ECS 125/i)).toBeInTheDocument();

        // Act: user clicks "Book" and triggers booking flow
        fireEvent.click(screen.getByText('Book'));

        // Assert: createBooking called with correct payload and success callback fired
        await waitFor(() => expect(mockCreateBooking).toHaveBeenCalledTimes(1));
        expect(mockCreateBooking).toHaveBeenCalledWith('room1', '2025-10-05', '09:00', '10:00');
        expect(baseProps.onBookingCreated).toHaveBeenCalled();
    });

    test('renders booking error message', async () => {
        // Arrange: booking hook exposes an error banner
        mockUseRooms.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null });
        mockUseBookingHistory.mockReturnValue({ createBooking: jest.fn(), error: 'Booking failed' });

        // Act
        render(<BookingPage {...baseProps} />);

        // Assert: booking error is surfaced to the user
        expect(await screen.findByText(/Booking error: Booking failed/i)).toBeInTheDocument();
    });
});