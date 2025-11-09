import * as bookingsUtils from '../../../src/utils/bookings';
import * as bookingsApi from '../../../src/api/bookings';
import type { UiBooking } from '../../../src/types';
import { createMockBooking } from './bookings-test-data';

describe('bookings utils - Data Mapping', () => {
  describe('mapApiBookingToUi', () => {
    it('maps complete booking to UI format', () => {
      const booking = createMockBooking();

      const result = bookingsUtils.mapApiBookingToUi(booking);

      expect(result.id).toBe('booking-1');
      expect(result.building).toBe('ECS');
      expect(result.roomNumber).toBe('124');
      expect(result.name).toBe('ECS 124');
      expect(result.date).toBe('2025-01-15');
    });

    it('marks cancelled bookings', () => {
      const booking = createMockBooking({ status: 'Cancelled' });

      const result = bookingsUtils.mapApiBookingToUi(booking);

      expect(result.cancelled).toBe(true);
    });

    it('includes user details when present', () => {
      const booking = createMockBooking({
        user: {
          id: 'user-1',
          email: 'john@uvic.ca',
          first_name: 'John',
          last_name: 'Doe',
          role: 'Student',
        },
      });

      type UiBookingWithUser = UiBooking & {
        user_name: string;
        user_email: string;
        user_role: string;
      };

      const result = bookingsUtils.mapApiBookingToUi(booking) as UiBookingWithUser;

      expect(result.user_name).toBe('John Doe');
      expect(result.user_email).toBe('john@uvic.ca');
      expect(result.user_role).toBe('Student');
    });
  });

  describe('reconcileTemp', () => {
    it('replaces temp booking with real booking', () => {
      const temp = createMockBooking({ id: 'temp-123', booking_series_id: 'temp-123' });
      const real = createMockBooking({ id: 'real-456', booking_series_id: 'real-456' });

      const result = bookingsUtils.reconcileTemp([temp], 'temp-123', real);

      expect(result[0].id).toBe('real-456');
    });

    it('keeps temp booking when real is undefined', () => {
      const temp = createMockBooking({ id: 'temp-123', booking_series_id: 'temp-123' });

      const result = bookingsUtils.reconcileTemp([temp], 'temp-123');

      expect(result[0].id).toBe('temp-123');
    });
  });

  describe('mergeBookings', () => {
    it('merges optimistic and server bookings with server priority', () => {
      const optimistic = createMockBooking();
      const server = createMockBooking({ room_id: 'ECS-125' });

      const result = bookingsUtils.mergeBookings([optimistic], [server]);

      expect(result[0].room_id).toBe('ECS-125');
    });

    it('combines unique bookings from both sources', () => {
      const optimistic = createMockBooking();
      const server = createMockBooking({ id: 'booking-2', room_id: 'ECS-125' });

      const result = bookingsUtils.mergeBookings([optimistic], [server]);

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toEqual(
        expect.arrayContaining(['booking-1', 'booking-2'])
      );
    });
  });
});
