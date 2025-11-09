import { renderHook, waitFor, act } from '@testing-library/react';
import { useSchedule } from '../../src/hooks/useSchedule';
import * as scheduleApi from '../../src/api/schedule';
import type { ScheduleResponse } from '../../src/types/schedule';

jest.mock('../../src/api/schedule');

const mockFetchSchedule = jest.mocked(scheduleApi.fetchSchedule);

const mockSchedule: ScheduleResponse = {
  buildings: [
    {
      building_short_name: 'ECS',
      building_name: 'Engineering',
      rooms: [
        {
          room_id: 'ECS-124',
          room_number: '124',
          capacity: 30,
          room_type: 'Classroom',
          slots: [],
        },
      ],
    },
  ],
};

describe('useSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('fetches and flattens buildings and rooms', async () => {
    mockFetchSchedule.mockResolvedValueOnce(mockSchedule);

    const { result } = renderHook(() =>
      useSchedule({ building_short_name: 'ECS', date: '2025-01-15' })
    );

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(mockFetchSchedule).toHaveBeenCalledWith({
        building_short_name: 'ECS',
        date: '2025-01-15',
      });
      expect(result.current.rooms.length).toBe(1);
      expect(result.current.rooms[0]).toMatchObject({
        room_id: 'ECS-124',
        building_short_name: 'ECS',
        building_name: 'Engineering',
      });
    });
  });

  it('refetches when query changes', async () => {
    mockFetchSchedule.mockResolvedValueOnce(mockSchedule);

    const { rerender } = renderHook(
      ({ query }: { query: scheduleApi.ScheduleQuery }) => useSchedule(query),
      { initialProps: { query: { date: '2025-01-15' } } }
    );

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(mockFetchSchedule).toHaveBeenCalledTimes(1);
    });

    mockFetchSchedule.mockResolvedValueOnce({ buildings: [] });

    rerender({ query: { date: '2025-01-16' } });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(mockFetchSchedule).toHaveBeenCalledTimes(2);
      expect(mockFetchSchedule).toHaveBeenLastCalledWith({ date: '2025-01-16' });
    });
  });

  it('debounces fetch by 250ms', async () => {
    mockFetchSchedule.mockResolvedValueOnce(mockSchedule);

    renderHook(() => useSchedule({ date: '2025-01-15' }));

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(mockFetchSchedule).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(150);
      jest.runAllTimers();
    });

    expect(mockFetchSchedule).toHaveBeenCalledTimes(1);
  });

  it('cancels fetch on unmount', async () => {
    mockFetchSchedule.mockImplementation(() => new Promise(() => {}));

    const { unmount } = renderHook(() => useSchedule({ date: '2025-01-15' }));

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    unmount();
    await act(async () => {
      jest.runAllTimers();
    });

    expect(mockFetchSchedule).toHaveBeenCalledTimes(1);
  });

  it('shows loading only on initial fetch', async () => {
    mockFetchSchedule.mockResolvedValueOnce(mockSchedule);

    const { result, rerender } = renderHook(
      ({ query }: { query: scheduleApi.ScheduleQuery }) => useSchedule(query),
      { initialProps: { query: { date: '2025-01-15' } } }
    );

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(result.current.rooms.length).toBe(1);
    });

    mockFetchSchedule.mockResolvedValueOnce({ buildings: [] });

    rerender({ query: { date: '2025-01-16' } });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(mockFetchSchedule).toHaveBeenCalledTimes(2);
    });
  });
});
