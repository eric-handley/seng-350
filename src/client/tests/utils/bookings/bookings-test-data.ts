import * as bookingsApi from '../../../src/api/bookings';
import { format, addDays } from 'date-fns';

export const createMockBooking = (overrides?: Partial<bookingsApi.Booking>): bookingsApi.Booking => {
  const startDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
  const createdDate = format(addDays(new Date(), 20), 'yyyy-MM-dd');

  return {
    id: 'booking-1',
    user_id: 'user-1',
    room_id: 'ECS-124',
    start_time: `${startDate}T10:00:00Z`,
    end_time: `${startDate}T11:00:00Z`,
    status: 'Active',
    booking_series_id: 'booking-1',
    created_at: `${createdDate}T00:00:00Z`,
    updated_at: `${createdDate}T00:00:00Z`,
    ...overrides,
  };
};
