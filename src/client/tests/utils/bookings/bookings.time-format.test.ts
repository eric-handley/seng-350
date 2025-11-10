import * as bookingsUtils from '../../../src/utils/bookings';
import { format, addDays } from 'date-fns';

describe('bookings utils - Time Formatting', () => {
  const testDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');

  describe('toIsoDateTimeUTC', () => {
    it('converts date and time with dashes to ISO format with Z', () => {
      const result = bookingsUtils.toIsoDateTimeUTC(testDate, '14-30-00');
      expect(result).toBe(`${testDate}T14:30:00Z`);
    });

    it('handles single digit times', () => {
      const result = bookingsUtils.toIsoDateTimeUTC(testDate, '9-5-3');
      expect(result).toBe(`${testDate}T9:5:3Z`);
    });
  });

  describe('isoOrHmsToHms', () => {
    it('converts ISO timestamp to HMS', () => {
      const result = bookingsUtils.isoOrHmsToHms(`${testDate}T14:30:00Z`);
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
      const result = bookingsUtils.isoOrHmsToHms(`${testDate}T09:15:30Z`);
      expect(result).toBe('09:15:30');
    });
  });
});
