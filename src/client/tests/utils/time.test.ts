import * as timeUtils from '../../src/utils/time';

describe('time utils', () => {
  describe('toApiTime', () => {
    it('converts standard time to API format', () => {
      const result = timeUtils.toApiTime('14:30:00');
      expect(result).toBe('14-30-00');
    });

    it('converts time with dots', () => {
      const result = timeUtils.toApiTime('14.30.00');
      expect(result).toBe('14-30-00');
    });

    it('pads single digit values', () => {
      const result = timeUtils.toApiTime('9:5:3');
      expect(result).toBe('09-05-03');
    });

    it('returns undefined for empty string', () => {
      const result = timeUtils.toApiTime('');
      expect(result).toBeUndefined();
    });

    it('returns undefined for null or undefined', () => {
      expect(timeUtils.toApiTime(null as unknown as string)).toBeUndefined();
      expect(timeUtils.toApiTime(undefined)).toBeUndefined();
    });
  });

  describe('fromApiTime', () => {
    it('converts API time format to colons', () => {
      const result = timeUtils.fromApiTime('14-30-00');
      expect(result).toBe('14:30:00');
    });

    it('returns empty string for empty input', () => {
      const result = timeUtils.fromApiTime('');
      expect(result).toBe('');
    });

    it('returns empty string for null or undefined', () => {
      expect(timeUtils.fromApiTime(null as unknown as string)).toBe('');
      expect(timeUtils.fromApiTime(undefined)).toBe('');
    });
  });

  describe('toIsoDateTime', () => {
    it('combines date and API time format to ISO', () => {
      const result = timeUtils.toIsoDateTime('2025-01-15', '14-30-00');
      expect(result).toBe('2025-01-15T14:30:00');
    });
  });

  describe('parseUserTimeInput', () => {
    it('parses 12-hour AM format', () => {
      expect(timeUtils.parseUserTimeInput('9:30 AM')).toBe('09:30');
      expect(timeUtils.parseUserTimeInput('12:00 AM')).toBe('00:00');
    });

    it('parses 12-hour PM format', () => {
      expect(timeUtils.parseUserTimeInput('2:45 PM')).toBe('14:45');
      expect(timeUtils.parseUserTimeInput('12:00 PM')).toBe('12:00');
    });

    it('parses 24-hour format', () => {
      expect(timeUtils.parseUserTimeInput('14:30')).toBe('14:30');
      expect(timeUtils.parseUserTimeInput('09:00')).toBe('09:00');
    });

    it('parses compact format like 1430', () => {
      expect(timeUtils.parseUserTimeInput('1430')).toBe('14:30');
      expect(timeUtils.parseUserTimeInput('930')).toBe('09:30');
    });

    it('parses various AM/PM notations', () => {
      expect(timeUtils.parseUserTimeInput('1p')).toBe('13:00');
      expect(timeUtils.parseUserTimeInput('1 p.m.')).toBe('13:00');
      expect(timeUtils.parseUserTimeInput('1pm')).toBe('13:00');
      expect(timeUtils.parseUserTimeInput('1 PM')).toBe('13:00');
    });

    it('returns null for invalid input', () => {
      expect(timeUtils.parseUserTimeInput('25:00')).toBeNull();
      expect(timeUtils.parseUserTimeInput('abc')).toBeNull();
      expect(timeUtils.parseUserTimeInput('')).toBeNull();
      expect(timeUtils.parseUserTimeInput('   ')).toBeNull();
    });

    it('returns null for invalid hour in 12h format', () => {
      expect(timeUtils.parseUserTimeInput('13:00 PM')).toBeNull();
      expect(timeUtils.parseUserTimeInput('0:00 AM')).toBeNull();
    });

    it('returns null for invalid minutes', () => {
      expect(timeUtils.parseUserTimeInput('14:60')).toBeNull();
      expect(timeUtils.parseUserTimeInput('14:-5')).toBeNull();
    });

    it('returns null for non-string input', () => {
      expect(timeUtils.parseUserTimeInput(null as unknown as string)).toBeNull();
      expect(timeUtils.parseUserTimeInput(undefined as unknown as string)).toBeNull();
    });

    it('handles mixed delimiters', () => {
      expect(timeUtils.parseUserTimeInput('14 30')).toBe('14:30');
      expect(timeUtils.parseUserTimeInput('14:30')).toBe('14:30');
    });
  });

  describe('formatTimeForDisplay', () => {
    it('formats morning time', () => {
      expect(timeUtils.formatTimeForDisplay('09:30')).toBe('9:30 AM');
      expect(timeUtils.formatTimeForDisplay('00:00')).toBe('12:00 AM');
    });

    it('formats afternoon and evening time', () => {
      expect(timeUtils.formatTimeForDisplay('14:45')).toBe('2:45 PM');
      expect(timeUtils.formatTimeForDisplay('12:00')).toBe('12:00 PM');
      expect(timeUtils.formatTimeForDisplay('23:59')).toBe('11:59 PM');
    });

    it('pads minutes with zeros', () => {
      expect(timeUtils.formatTimeForDisplay('14:05')).toBe('2:05 PM');
    });

    it('returns empty string for null or undefined', () => {
      expect(timeUtils.formatTimeForDisplay(null)).toBe('');
      expect(timeUtils.formatTimeForDisplay(undefined)).toBe('');
      expect(timeUtils.formatTimeForDisplay('')).toBe('');
    });

    it('returns original value for invalid input', () => {
      const invalid = 'invalid';
      expect(timeUtils.formatTimeForDisplay(invalid)).toBe(invalid);
    });
  });
});
