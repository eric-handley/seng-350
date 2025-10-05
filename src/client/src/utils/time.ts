// Accepts "H", "HH", "HH:MM", "HH:MM:SS", "HH-MM", "HH-MM-SS"
// Returns "hh-mm-ss" or undefined if empty
export function toApiTime(t?: string) {
  if (!t) return undefined;
  let s = t.trim();
  if (!s) return undefined;

  // unify delimiters
  s = s.replace(/\./g, ':').replace(/-/g, ':');

  const parts = s.split(':').filter(Boolean);
  const [H = '0', M = '0', S = '0'] = parts;

  const pad = (x: string) => x.padStart(2, '0');

  // clamp/clean numeric only
  const h = pad(String(parseInt(H, 10) || 0));
  const m = pad(String(parseInt(M, 10) || 0));
  const sec = pad(String(parseInt(S, 10) || 0));

  return `${h}-${m}-${sec}`;
}


export function fromApiTime(t?: string) {
  if (!t) return '';
  return t.replace(/-/g, ':'); // "hh-mm-ss" -> "hh:mm:ss"
}

// already have toApiTime() which returns "hh-mm-ss".
// Add this:
export function toIsoDateTime(dateYYYYMMDD: string, apiTimeHHMMSS: string) {
  // turn "hh-mm-ss" -> "hh:mm:ss"
  const hms = apiTimeHHMMSS.replace(/-/g, ':');
  // build a local ISO-like string; many Nest setups with class-transformer
  // accept this and cast to Date
  // If your backend needs 'Z', use `${dateYYYYMMDD}T${hms}Z` instead.
  return `${dateYYYYMMDD}T${hms}`;
}
