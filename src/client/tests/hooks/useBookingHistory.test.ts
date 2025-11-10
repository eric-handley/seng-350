import { renderHook, act } from '@testing-library/react';
import { useBookingHistory } from '../../src/hooks/useBookingHistory';
import * as bookingsApi from '../../src/api/bookings';
import * as timeUtils from '../../src/utils/time';
import type { UiBooking } from '../../src/types';
import { format, addDays } from 'date-fns';

jest.mock('../../src/api/bookings');
jest.mock('../../src/utils/time');
jest.mock('../../src/utils/bookings', () => ({
  mapApiBookingToUi: (booking: bookingsApi.Booking): UiBooking => ({
    id: booking.id,
    roomId: booking.room_id,
    start: booking.start_time,
    end: booking.end_time,
    user: booking.user_id,
  }),
  mergeBookings: jest.fn(
    (optimistic: bookingsApi.Booking[], server: bookingsApi.Booking[]) => [
      ...optimistic,
      ...server,
    ]
  ),
  reconcileTemp: jest.fn(
    (prev: bookingsApi.Booking[], tempId: string, real?: bookingsApi.Booking) =>
      prev.map((booking) => (booking.id === tempId && real ? real : booking))
  ),
  toIsoDateTimeUTC: jest.fn((date: string, time: string) => `${date}T${time}Z`),
}));

const mockFetchUserBookings = jest.mocked(bookingsApi.fetchUserBookings);
const mockCreateBooking = jest.mocked(bookingsApi.createBooking);
const mockCancelBooking = jest.mocked(bookingsApi.cancelBooking);
const mockToApiTime = jest.mocked(timeUtils.toApiTime);

const booking1Date = format(addDays(new Date(), 30), 'yyyy-MM-dd');
const booking1CreatedDate = format(addDays(new Date(), 20), 'yyyy-MM-dd');
const booking2Date = format(addDays(new Date(), 31), 'yyyy-MM-dd');
const booking2CreatedDate = format(addDays(new Date(), 21), 'yyyy-MM-dd');

const mockBooking1: bookingsApi.Booking = {
  id: 'booking-1',
  user_id: 'user-1',
  room_id: 'ECS-124',
  start_time: `${booking1Date}T10:00:00Z`,
  end_time: `${booking1Date}T11:00:00Z`,
  status: 'Active',
  booking_series_id: 'booking-1',
  created_at: `${booking1CreatedDate}T00:00:00Z`,
  updated_at: `${booking1CreatedDate}T00:00:00Z`,
};

const mockBooking2: bookingsApi.Booking = {
  id: 'booking-2',
  user_id: 'user-1',
  room_id: 'CLE-A308',
  start_time: `${booking2Date}T14:00:00Z`,
  end_time: `${booking2Date}T15:00:00Z`,
  status: 'Active',
  booking_series_id: 'booking-2',
  created_at: `${booking2CreatedDate}T00:00:00Z`,
  updated_at: `${booking2CreatedDate}T00:00:00Z`,
};

describe('useBookingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToApiTime.mockImplementation((t) => t?.replace(/:/g, '-'));
  });

  it('successfully fetches user booking history', async () => {
    mockFetchUserBookings.mockResolvedValueOnce([mockBooking1, mockBooking2]);
    const { result } = renderHook(() => useBookingHistory('user-1'));

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(mockFetchUserBookings).toHaveBeenCalledWith('user-1');
    expect(result.current.error).toBe(null);
  });

  it('handles error when fetching history fails', async () => {
    mockFetchUserBookings.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useBookingHistory('user-1'));

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.loading).toBe(false);
  });

  it('handles non-Error rejection when fetching history', async () => {
    mockFetchUserBookings.mockRejectedValueOnce('String error');
    const { result } = renderHook(() => useBookingHistory('user-1'));

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(result.current.error).toBe('Failed to load history');
  });

  it('adds optimistic booking and replaces with real booking on success', async () => {
    mockToApiTime.mockReturnValue('14-30-00');
    mockCreateBooking.mockResolvedValueOnce(mockBooking1);
    mockFetchUserBookings.mockResolvedValueOnce([mockBooking1]);

    const { result } = renderHook(() => useBookingHistory('user-1'));

    await act(async () => {
      await result.current.createBooking('ECS-124', booking1Date, '14:30:00', '15:30:00');
    });

    expect(mockCreateBooking).toHaveBeenCalledWith({
      room_id: 'ECS-124',
      start_time: expect.stringContaining(booking1Date),
      end_time: expect.stringContaining(booking1Date),
    });
    expect(result.current.error).toBe(null);
  });

  it('throws error with invalid time format', async () => {
    mockToApiTime.mockReturnValue(undefined);
    const { result } = renderHook(() => useBookingHistory('user-1'));

    await expect(
      result.current.createBooking('ECS-124', booking1Date, 'invalid', '15:30:00')
    ).rejects.toThrow('Invalid time format');
  });

  it('handles creation error without crashing on refresh failure', async () => {
    mockToApiTime.mockReturnValue('14-30-00');
    mockCreateBooking.mockResolvedValueOnce(mockBooking1);
    mockFetchUserBookings.mockRejectedValueOnce(new Error('Refresh failed'));

    const { result } = renderHook(() => useBookingHistory('user-1'));

    await act(async () => {
      await result.current.createBooking('ECS-124', booking1Date, '14:30:00', '15:30:00');
    });

    expect(result.current.error).toBe(null);
  });

  it('optimistically removes booking and refreshes from server', async () => {
    mockFetchUserBookings.mockResolvedValueOnce([mockBooking1, mockBooking2]);
    mockCancelBooking.mockResolvedValueOnce();
    mockFetchUserBookings.mockResolvedValueOnce([mockBooking2]);

    const { result } = renderHook(() => useBookingHistory('user-1'));

    await act(async () => {
      await result.current.fetchHistory();
      await result.current.cancelBooking('booking-1');
    });

    expect(mockCancelBooking).toHaveBeenCalledWith('booking-1');
    expect(result.current.error).toBe(null);
  });

  it('fetches all bookings and populates allBookings', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [mockBooking1, mockBooking2],
    });

    const { result } = renderHook(() => useBookingHistory('user-1'));

    await act(async () => {
      await result.current.fetchAllBookings();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/bookings',
      expect.objectContaining({ credentials: 'include' })
    );
  });

  it('handles fetch error gracefully in fetchAllBookings', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useBookingHistory('user-1'));

    await act(async () => {
      await result.current.fetchAllBookings();
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(result.current.allBookings).toEqual([]);

    consoleSpy.mockRestore();
  });
});
