import * as bookingsUtils from '../../../src/utils/bookings';

describe('bookings utils - ID Parsing', () => {
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
});
