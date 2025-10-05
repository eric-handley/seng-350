// "HH-MM-SS" -> "hh-mm-ss"
export function toApiTime(t?: string) {
  if (!t) return undefined;
  let s = t.trim();
  if (!s) return undefined;

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
  if (!t) return '';
  return t.replace(/-/g, ':'); // "hh-mm-ss" -> "hh:mm:ss"
}

export function toIsoDateTime(dateYYYYMMDD: string, apiTimeHHMMSS: string) {
  // turn "hh-mm-ss" -> "hh:mm:ss"
  const hms = apiTimeHHMMSS.replace(/-/g, ':');
  return `${dateYYYYMMDD}T${hms}`;
}
