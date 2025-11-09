import * as bookingsUtils from '../../../src/utils/bookings';

describe('bookings utils - Time Formatting', () => {
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
});
