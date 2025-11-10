import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BookingPage } from '../../src/pages/BookingPage';
import { useSchedule } from '../../src/hooks/useSchedule';
import { useBookingHistory } from '../../src/hooks/useBookingHistory';
import { useRooms } from '../../src/hooks/useRooms';
import { Room } from '../../src/types';

// Mock the hooks
jest.mock('../../src/hooks/useSchedule');
jest.mock('../../src/hooks/useBookingHistory');
jest.mock('../../src/hooks/useRooms');

// Mock the components
jest.mock('../../src/components/FilterPanel', () => ({
    FilterPanel: ({ building, setBuilding }: { building: string; setBuilding: (b: string) => void }) => (
        <div data-testid="filter-panel">
            <button onClick={() => setBuilding('CLE')}>Set Building</button>
            <span>Building: {building}</span>
        </div>
    ),
}));

jest.mock('../../src/components/RoomCard', () => ({
    __esModule: true,
    default: ({ room, isReserved, onBook }: { room: Room; isReserved?: boolean; onBook: (room: Room) => void }) => (
        <div data-testid="room-card">
            <h3>{room.name}</h3>
            <button onClick={() => onBook(room)}>{isReserved ? 'Reserved' : 'Book'}</button>
        </div>
    ),
}));

export const mockUseSchedule = useSchedule as jest.Mock;
export const mockUseBookingHistory = useBookingHistory as jest.Mock;
export const mockUseRooms = useRooms as jest.Mock;

export const mockHooks = {
    useSchedule: mockUseSchedule,
    useBookingHistory: mockUseBookingHistory,
    useRooms: mockUseRooms,
};

export const baseProps = {
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

type BookingPageProps = typeof baseProps;

export function renderBookingPage(
    overrides?: Partial<BookingPageProps>,
    renderOptions?: RenderOptions
) {
    const props = { ...baseProps, ...overrides };
    return render(<BookingPage {...props} />, renderOptions);
}
