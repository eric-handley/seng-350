import * as scheduleApi from '../../src/api/schedule';
import type { ScheduleResponse } from '../../src/types/schedule';

const mockFetch = (global.fetch = jest.fn());

describe('schedule API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchSchedule', () => {
    it('fetches schedule with query parameters', async () => {
      const response: ScheduleResponse = {
        buildings: [
          {
            building_short_name: 'ECS',
            building_name: 'Engineering',
            rooms: [],
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => response,
      });

      const result = await scheduleApi.fetchSchedule({
        building_short_name: 'ECS',
        date: '2025-01-15',
      });

      expect(result).toEqual(response);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('building_short_name=ECS'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('slot_type=available'),
        expect.any(Object)
      );
    });

    it('adds default slot_type=available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ buildings: [] }),
      });

      await scheduleApi.fetchSchedule({ building_short_name: 'ECS' });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('slot_type=available');
    });

    it('filters out empty query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ buildings: [] }),
      });

      await scheduleApi.fetchSchedule({
        building_short_name: 'ECS',
        date: '',
        room_id: undefined,
      });

      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('building_short_name=ECS');
      expect(url).not.toContain('date=');
      expect(url).not.toContain('room_id=');
    });

    it('throws error on failed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      await expect(
        scheduleApi.fetchSchedule({ building_short_name: 'ECS' })
      ).rejects.toThrow(/500/);
    });
  });

  describe('fetchRooms', () => {
    it('fetches rooms with query parameters', async () => {
      const rooms: scheduleApi.RoomResponse[] = [
        {
          room_id: 'ECS-124',
          room_number: '124',
          building_short_name: 'ECS',
          building_name: 'Engineering',
          capacity: 30,
          room_type: 'Classroom',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => rooms,
      });

      const result = await scheduleApi.fetchRooms({
        building_short_name: 'ECS',
        room_id: 'ECS-124',
      });

      expect(result).toEqual(rooms);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('building_short_name=ECS'),
        expect.any(Object)
      );
    });

    it('fetches all rooms without parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await scheduleApi.fetchRooms({});

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:3000/rooms');
    });

    it('throws error when response fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(
        scheduleApi.fetchRooms({ building_short_name: 'XYZ' })
      ).rejects.toThrow(/404/);
    });
  });
});
