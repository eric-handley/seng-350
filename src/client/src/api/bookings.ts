const API_BASE = process.env.API_BASE || 'http://localhost:3000';

export type CreateBookingReq = {
  room_id: string;
  start_time: string; // ISO, e.g. "2025-10-05T10:00:00"
  end_time: string;   // ISO
};

export type Booking = {
  id: string;
  user_id: string;
  room_id: string;          // e.g., "ECS-124"
  start_time: string;       // ISO with Z per backend
  end_time: string;         // ISO with Z
  status: 'Active' | 'Cancelled' | string;
  booking_series_id: string;
  created_at: string;
  updated_at: string;
};

export async function createBooking(body: CreateBookingReq): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST /bookings failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<Booking>;
}

export async function fetchUserBookings(): Promise<Booking[]> {
  // No filters: server derives "me" from session (staff → my bookings)
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET /bookings failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<Booking[]>;
}

export async function cancelBooking(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/bookings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  })
  // Swagger shows 204 No Content on success
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`DELETE /bookings/${id} failed: ${res.status} ${res.statusText} ${text}`)
  }
}