import type { ScheduleResponse } from '../types/schedule';

const API_BASE =
  (typeof process !== 'undefined' && (process as any).env?.API_BASE) ||
  (typeof window !== 'undefined' && (window as any).__API_BASE__) ||
  'http://localhost:3000';

export default API_BASE;

export type ScheduleQuery = {
  building_short_name?: string;
  room_id?: string;
  date?: string;        // YYYY-MM-DD
  start_time?: string;  // HH:MM:SS
  end_time?: string;    // HH:MM:SS
  slot_type?: 'available' | 'booked';
};

function toQueryString(q: ScheduleQuery) {
  const params = new URLSearchParams();
  (Object.keys(q) as (keyof ScheduleQuery)[]).forEach((k) => {
    const v = q[k];
    if (v !== undefined && v !== '') params.append(k, String(v));
  });
  return params.toString();
}

export async function fetchSchedule(q: ScheduleQuery): Promise<ScheduleResponse> {
  const qs = toQueryString({ slot_type: 'available', ...q });
  const res = await fetch(`${API_BASE}/schedule?${qs}`, {
    method: 'GET',
    credentials: 'include', // cookies-based auth from server
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET /schedule failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<ScheduleResponse>;
}
