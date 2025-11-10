/**
 * BookingPage.booking-flow.test.tsx - Tests happy path and booking error scenarios
 */

import { screen, fireEvent, waitFor } from '@testing-library/react';
import { mockHooks, renderBookingPage, baseProps } from './BookingPage.test-setup';
import { format, addDays } from 'date-fns';

type MockRoom = {
    room_id: string;
    building_short_name: string;
    room_number: string;
    room_type: string;
    capacity: number;
    slots: Array<{ start_time: string; end_time: string }>;
};

const testDate = format(addDays(new Date(), 5), 'yyyy-MM-dd');

describe('<BookingPage /> - Booking Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders rooms and triggers booking', async () => {
        const mockCreateBooking = jest.fn().mockResolvedValue(undefined);
        mockHooks.useBookingHistory.mockReturnValue({ createBooking: mockCreateBooking, error: null });

        const mockRooms: MockRoom[] = [
            {
                room_id: 'room1',
                building_short_name: 'ECS',
                room_number: '125',
                room_type: 'classroom',
                capacity: 40,
                slots: [
                    { start_time: `${testDate}T08:00:00Z`, end_time: `${testDate}T11:00:00Z` },
                ],
            },
        ];
        mockHooks.useRooms.mockReturnValue({ rooms: mockRooms, loading: false, error: null });
        mockHooks.useSchedule.mockReturnValue({ rooms: [], loading: false, error: null });

        renderBookingPage();
        expect(await screen.findByText(/ECS 125/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText('Book'));

        await waitFor(() => expect(mockCreateBooking).toHaveBeenCalledTimes(1));
        expect(mockCreateBooking).toHaveBeenCalledWith('room1', testDate, '09:00', '10:00');
        expect(baseProps.onBookingCreated).toHaveBeenCalled();
    });
});
