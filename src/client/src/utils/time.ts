// "HH-MM-SS" -> "hh-mm-ss"
export function toApiTime(t?: string) {
  if (!t) {return undefined;}
  let s = t.trim();
  if (!s) {return undefined;}

  s = s.replace(/\./g, ':').replace(/-/g, ':');

  const parts = s.split(':').filter(Boolean);
  const [H = '0', M = '0', S = '0'] = parts;

  const pad = (x: string) => x.padStart(2, '0');

  const h = pad(String(parseInt(H, 10) || 0));
  const m = pad(String(parseInt(M, 10) || 0));
  const sec = pad(String(parseInt(S, 10) || 0));

  return `${h}-${m}-${sec}`;
}

export function fromApiTime(t?: string) {
  if (!t) {return '';}
  return t.replace(/-/g, ':'); // "hh-mm-ss" -> "hh:mm:ss"
}

export function toIsoDateTime(dateYYYYMMDD: string, apiTimeHHMMSS: string) {
  // turn "hh-mm-ss" -> "hh:mm:ss"
  const hms = apiTimeHHMMSS.replace(/-/g, ':');
  return `${dateYYYYMMDD}T${hms}`;
}

const MERIDIEM_REGEX = /\s*(a\.?\s*m\.?|p\.?\s*m\.?|a|p)$/i;

/**
 * Convert user-entered time into 24-hour "HH:MM". Accepts 12h (w/ AM/PM) and 24h forms.
 */
export function parseUserTimeInput(value: string): string | null {
  if (typeof value !== 'string') {return null;}
  const trimmed = value.trim();
  if (!trimmed) {return null;}

  let meridiem: 'am' | 'pm' | null = null;
  let working = trimmed;

  const meridiemMatch = trimmed.match(MERIDIEM_REGEX);
  if (meridiemMatch) {
    const token = meridiemMatch[1] ?? meridiemMatch[0];
    const normalized = token.replace(/[^ap]/gi, '').toLowerCase();
    meridiem = normalized.startsWith('p') ? 'pm' : 'am';
    working = trimmed.slice(0, trimmed.length - meridiemMatch[0].length).trim();
  }

  const cleaned = working
    .replace(/[^0-9:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {return null;}

  const parts = cleaned.split(/[:\s]/).filter(Boolean);

  let hoursStr = parts[0];
  let minutesStr = parts[1];

  if (parts.length === 1) {
    const digitsOnly = parts[0];
    if (digitsOnly.length >= 3) {
      const splitIdx = digitsOnly.length - 2;
      hoursStr = digitsOnly.slice(0, splitIdx);
      minutesStr = digitsOnly.slice(splitIdx);
    } else {
      hoursStr = digitsOnly;
      minutesStr = '0';
    }
  }

  const hours = parseInt(hoursStr ?? '', 10);
  if (Number.isNaN(hours)) {return null;}

  let minutes = parseInt(minutesStr ?? '0', 10);
  if (Number.isNaN(minutes)) {minutes = 0;}

  if (minutes < 0 || minutes > 59) {return null;}

  let normalizedHours = hours;
  if (meridiem) {
    if (hours < 1 || hours > 12) {return null;}
    normalizedHours = hours % 12;
    if (meridiem === 'pm') {
      normalizedHours += 12;
    }
  }

  if (normalizedHours < 0 || normalizedHours > 23) {return null;}

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(normalizedHours)}:${pad(minutes)}`;
}

/** Format a 24-hour "HH:MM" string as "h:MM AM/PM" for display. */
export function formatTimeForDisplay(value: string | undefined | null): string {
  if (!value) {return '';}
  const [hourStr, minuteStr = '00'] = value.split(':');
  const hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {return value;}

  const meridiem = hours >= 12 ? 'PM' : 'AM';
  const hour12 = ((hours + 11) % 12) + 1;
  const paddedMinutes = String(minutes).padStart(2, '0');

  return `${hour12}:${paddedMinutes} ${meridiem}`;
}
