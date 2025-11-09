import * as bookingsApi from '../../src/api/bookings';

const mockFetch = (global.fetch = jest.fn());

describe('bookings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('successfully creates a booking', async () => {
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => booking,
      });

      const result = await bookingsApi.createBooking({
        room_id: 'ECS-124',
        start_time: '2025-01-15T10:00:00Z',
        end_time: '2025-01-15T11:00:00Z',
      });

      expect(result).toEqual(booking);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/bookings',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('throws error with message from response on 400', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Room unavailable' }),
      });

      await expect(
        bookingsApi.createBooking({
          room_id: 'ECS-124',
          start_time: '2025-01-15T10:00:00Z',
          end_time: '2025-01-15T11:00:00Z',
        })
      ).rejects.toThrow('Room unavailable');
    });

    it('throws error when response is not ok and json fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        bookingsApi.createBooking({
          room_id: 'ECS-124',
          start_time: '2025-01-15T10:00:00Z',
          end_time: '2025-01-15T11:00:00Z',
        })
      ).rejects.toThrow(/Booking failed/);
    });
  });

  describe('fetchUserBookings', () => {
    it('fetches bookings for a specific user', async () => {
      const bookings: bookingsApi.Booking[] = [
        {
          id: 'booking-1',
          user_id: 'user-1',
          room_id: 'ECS-124',
          start_time: '2025-01-15T10:00:00Z',
          end_time: '2025-01-15T11:00:00Z',
          status: 'Active',
          booking_series_id: 'booking-1',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => bookings,
      });

      const result = await bookingsApi.fetchUserBookings('user-1');

      expect(result).toEqual(bookings);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('userId=user-1'),
        expect.any(Object)
      );
    });

    it('fetches all bookings without userId', async () => {
      const bookings: bookingsApi.Booking[] = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => bookings,
      });

      await bookingsApi.fetchUserBookings();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/bookings',
        expect.any(Object)
      );
    });

    it('throws error on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(bookingsApi.fetchUserBookings()).rejects.toThrow(/404/);
    });
  });

  describe('cancelBooking', () => {
    it('successfully cancels a booking', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await bookingsApi.cancelBooking('booking-1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/bookings/booking-1',
        expect.objectContaining({
          method: 'DELETE',
          credentials: 'include',
        })
      );
    });

    it('throws error when delete fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      await expect(bookingsApi.cancelBooking('booking-1')).rejects.toThrow(/403/);
    });
  });
});
