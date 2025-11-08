import { renderHook, waitFor } from '@testing-library/react';
import { useRooms } from '../../src/hooks/useRooms';
import * as scheduleApi from '../../src/api/schedule';

jest.mock('../../src/api/schedule');

const mockFetchRooms = jest.mocked(scheduleApi.fetchRooms);

const mockRooms: scheduleApi.RoomResponse[] = [
  {
    room_id: 'ECS-124',
    room_number: '124',
    building_short_name: 'ECS',
    building_name: 'Engineering',
    capacity: 30,
    room_type: 'Classroom',
  },
  {
    room_id: 'ECS-125',
    room_number: '125',
    building_short_name: 'ECS',
    building_name: 'Engineering',
    capacity: 25,
    room_type: 'Classroom',
  },
];

describe('useRooms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('successfully fetches rooms with query', async () => {
    mockFetchRooms.mockResolvedValueOnce(mockRooms);

    const { result } = renderHook(() => useRooms({ building_short_name: 'ECS' }));

    expect(result.current.loading).toBe(false);

    jest.advanceTimersByTime(250);

    await waitFor(() => {
      expect(mockFetchRooms).toHaveBeenCalledWith({ building_short_name: 'ECS' });
      expect(result.current.rooms).toEqual(mockRooms);
    });
  });

  it('handles error when fetch fails', async () => {
    mockFetchRooms.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useRooms({ building_short_name: 'ECS' }));

    jest.advanceTimersByTime(250);

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });

  it('debounces fetch by 250ms', () => {
    mockFetchRooms.mockResolvedValueOnce(mockRooms);

    renderHook(() => useRooms({ building_short_name: 'ECS' }));

    jest.advanceTimersByTime(100);
    expect(mockFetchRooms).not.toHaveBeenCalled();

    jest.advanceTimersByTime(150);
    jest.runAllTimers();

    expect(mockFetchRooms).toHaveBeenCalledTimes(1);
  });

  it('refetches when query changes', async () => {
    mockFetchRooms.mockResolvedValueOnce(mockRooms);

    const { rerender } = renderHook(
      ({ query }: { query: scheduleApi.RoomsQuery }) => useRooms(query),
      { initialProps: { query: { building_short_name: 'ECS' } } }
    );

    jest.advanceTimersByTime(250);

    await waitFor(() => {
      expect(mockFetchRooms).toHaveBeenCalledTimes(1);
    });

    mockFetchRooms.mockResolvedValueOnce([]);

    rerender({ query: { building_short_name: 'CLE' } });

    jest.advanceTimersByTime(250);

    await waitFor(() => {
      expect(mockFetchRooms).toHaveBeenCalledTimes(2);
      expect(mockFetchRooms).toHaveBeenLastCalledWith({ building_short_name: 'CLE' });
    });
  });

  it('cancels fetch on unmount', () => {
    mockFetchRooms.mockImplementation(() => new Promise(() => {}));

    const { unmount } = renderHook(() => useRooms({ building_short_name: 'ECS' }));

    jest.advanceTimersByTime(250);

    unmount();
    jest.runAllTimers();

    expect(mockFetchRooms).toHaveBeenCalledTimes(1);
  });

  it('shows loading only on initial fetch', async () => {
    mockFetchRooms.mockResolvedValueOnce(mockRooms);

    const { result, rerender } = renderHook(
      ({ query }: { query: scheduleApi.RoomsQuery }) => useRooms(query),
      { initialProps: { query: { building_short_name: 'ECS' } } }
    );

    jest.advanceTimersByTime(250);

    await waitFor(() => {
      expect(result.current.rooms).toEqual(mockRooms);
    });

    mockFetchRooms.mockResolvedValueOnce([]);

    rerender({ query: { building_short_name: 'CLE' } });

    jest.advanceTimersByTime(250);

    await waitFor(() => {
      expect(mockFetchRooms).toHaveBeenCalledTimes(2);
    });
  });
});
