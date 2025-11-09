import * as bookingsApi from '../../../src/api/bookings';

export const createMockBooking = (overrides?: Partial<bookingsApi.Booking>): bookingsApi.Booking => {
  return {
    id: 'booking-1',
    user_id: 'user-1',
    room_id: 'ECS-124',
    start_time: '2025-01-15T10:00:00Z',
    end_time: '2025-01-15T11:00:00Z',
    status: 'Active',
    booking_series_id: 'booking-1',
    created_at: '2025-01-10T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
    ...overrides,
  };
};
