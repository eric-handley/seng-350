import * as bookingsUtils from '../../src/utils/bookings';
import * as bookingsApi from '../../src/api/bookings';
import type { UiBooking } from '../../src/types';

describe('bookings utils', () => {
  describe('toIsoDateTimeUTC', () => {
    it('converts date and time with dashes to ISO format with Z', () => {
      const result = bookingsUtils.toIsoDateTimeUTC('2025-01-15', '14-30-00');
      expect(result).toBe('2025-01-15T14:30:00Z');
    });

    it('handles single digit times', () => {
      const result = bookingsUtils.toIsoDateTimeUTC('2025-01-15', '9-5-3');
      expect(result).toBe('2025-01-15T9:5:3Z');
    });
  });

  describe('isoOrHmsToHms', () => {
    it('converts ISO timestamp to HMS', () => {
      const result = bookingsUtils.isoOrHmsToHms('2025-01-15T14:30:00Z');
      expect(result).toBe('14:30:00');
    });

    it('converts dashed time to colons', () => {
      const result = bookingsUtils.isoOrHmsToHms('14-30-00');
      expect(result).toBe('14:30:00');
    });

    it('returns coloned time as is', () => {
      const result = bookingsUtils.isoOrHmsToHms('14:30:00');
      expect(result).toBe('14:30:00');
    });

    it('handles ISO with Z', () => {
      const result = bookingsUtils.isoOrHmsToHms('2025-01-15T09:15:30Z');
      expect(result).toBe('09:15:30');
    });
  });

  describe('splitRoomId', () => {
    it('splits standard room ID format', () => {
      const result = bookingsUtils.splitRoomId('CLE-A308');
      expect(result).toEqual({
        building: 'CLE',
        roomNumber: 'A308',
        roomName: 'CLE A308',
      });
    });

    it('handles room ID without dash', () => {
      const result = bookingsUtils.splitRoomId('ECS');
      expect(result).toEqual({
        building: 'ECS',
        roomNumber: '',
        roomName: 'ECS',
      });
    });

    it('handles empty room ID', () => {
      const result = bookingsUtils.splitRoomId('');
      expect(result).toEqual({
        building: '',
        roomNumber: '',
        roomName: '',
      });
    });
  });

  describe('mapApiBookingToUi', () => {
    it('maps complete booking to UI format', () => {
      const booking: bookingsApi.Booking = {
        id: 'booking-1',
        user_id: 'user-1',
        room_id: 'ECS-124',
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T11:00:00Z',
        status: 'Active',
        booking_series_id: 'booking-1',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      };

      const result = bookingsUtils.mapApiBookingToUi(booking);

      expect(result.id).toBe('booking-1');
      expect(result.building).toBe('ECS');
      expect(result.roomNumber).toBe('124');
      expect(result.name).toBe('ECS 124');
      expect(result.date).toBe('2025-01-15');
    });

    it('marks cancelled bookings', () => {
      const booking: bookingsApi.Booking = {
        id: 'booking-1',
        user_id: 'user-1',
        room_id: 'ECS-124',
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T11:00:00Z',
        status: 'Cancelled',
        booking_series_id: 'booking-1',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      };

      const result = bookingsUtils.mapApiBookingToUi(booking);

      expect(result.cancelled).toBe(true);
    });

    it('includes user details when present', () => {
      const booking: bookingsApi.Booking = {
        id: 'booking-1',
        user_id: 'user-1',
        room_id: 'ECS-124',
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T11:00:00Z',
        status: 'Active',
        booking_series_id: 'booking-1',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
        user: {
          id: 'user-1',
          email: 'john@uvic.ca',
          first_name: 'John',
          last_name: 'Doe',
          role: 'Student',
        },
      };

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
      const temp: bookingsApi.Booking = {
        id: 'temp-123',
        user_id: 'user-1',
        room_id: 'ECS-124',
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T11:00:00Z',
        status: 'Active',
        booking_series_id: 'temp-123',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      };

      const real: bookingsApi.Booking = {
        ...temp,
        id: 'real-456',
        booking_series_id: 'real-456',
      };

      const result = bookingsUtils.reconcileTemp([temp], 'temp-123', real);

      expect(result[0].id).toBe('real-456');
    });

    it('keeps temp booking when real is undefined', () => {
      const temp: bookingsApi.Booking = {
        id: 'temp-123',
        user_id: 'user-1',
        room_id: 'ECS-124',
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T11:00:00Z',
        status: 'Active',
        booking_series_id: 'temp-123',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      };

      const result = bookingsUtils.reconcileTemp([temp], 'temp-123');

      expect(result[0].id).toBe('temp-123');
    });
  });

  describe('mergeBookings', () => {
    it('merges optimistic and server bookings with server priority', () => {
      const optimistic: bookingsApi.Booking = {
        id: 'booking-1',
        user_id: 'user-1',
        room_id: 'ECS-124',
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T11:00:00Z',
        status: 'Active',
        booking_series_id: 'booking-1',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      };

      const server: bookingsApi.Booking = {
        ...optimistic,
        room_id: 'ECS-125',
      };

      const result = bookingsUtils.mergeBookings([optimistic], [server]);

      expect(result[0].room_id).toBe('ECS-125');
    });

    it('combines unique bookings from both sources', () => {
      const optimistic: bookingsApi.Booking = {
        id: 'booking-1',
        user_id: 'user-1',
        room_id: 'ECS-124',
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T11:00:00Z',
        status: 'Active',
        booking_series_id: 'booking-1',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z',
      };

      const server: bookingsApi.Booking = {
        ...optimistic,
        id: 'booking-2',
        room_id: 'ECS-125',
      };

      const result = bookingsUtils.mergeBookings([optimistic], [server]);

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toEqual(
        expect.arrayContaining(['booking-1', 'booking-2'])
      );
    });
  });
});
