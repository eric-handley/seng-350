const API_BASE = 'http://localhost:3000';

// Request type for creating a series of recurring bookings
export type CreateBookingSeriesReq = {
  room_id: string;
  start_time: string; // ISO, e.g. "2025-10-05T10:00:00"
  end_time: string;   // ISO
  recurrence_type: 'daily' | 'weekly' | 'monthly';
  series_end_date: string; // ISO date string
  user_id?: string;
};

/**
 * Create a series of recurring bookings.
 * @param body - booking series request
 * @returns array of created Booking objects
 */
export async function createBookingSeries(body: CreateBookingSeriesReq): Promise<Booking[]> {
  const res = await fetch(`${API_BASE}/bookings/recurring`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = errorData?.message ?? `Recurring booking failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<Booking[]>;
}

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
  // User details (populated by backend for registrars/admins)
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
};

export async function createBooking(body: CreateBookingReq): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = errorData?.message ?? `Booking failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<Booking>;
}

export async function fetchUserBookings(userId?: string): Promise<Booking[]> {
  // If userId provided, filter to that user's bookings
  const url = userId ? `${API_BASE}/bookings?userId=${encodeURIComponent(userId)}` : `${API_BASE}/bookings`;
  const res = await fetch(url, {
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
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`DELETE /bookings/${id} failed: ${res.status} ${res.statusText} ${text}`)
  }
}