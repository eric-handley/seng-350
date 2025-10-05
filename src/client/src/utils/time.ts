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