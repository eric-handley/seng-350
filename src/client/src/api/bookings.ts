// src/api/bookings.ts
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Optional toggle: set USE_CREDENTIALS=false to test without cookies
const USE_CREDENTIALS =
  (process.env.USE_CREDENTIALS ?? 'true').toLowerCase() !== 'false';

export type CreateBookingReq = {
  user_id: string;
  room_id: string;
  date: string;        // YYYY-MM-DD
  start_time: string;  // hh-mm-ss
  end_time: string;    // hh-mm-ss
};

export type Booking = {
  id: string;
  user_id: string;
  room_id: string;
  building_short_name: string;
  room_number: string;
  date: string;        // YYYY-MM-DD
  start_time: string;  // hh-mm-ss
  end_time: string;    // hh-mm-ss
};

export async function createBooking(body: CreateBookingReq): Promise<Booking> {
  const url = `${API_BASE}/bookings`; // ensure this matches Swagger
  console.log('POST', url, body, { USE_CREDENTIALS, API_BASE });

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      credentials: USE_CREDENTIALS ? 'include' : 'same-origin',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    // This is the classic CORS/URL case
    throw new Error(
      `Network error calling ${url}: ${e?.message ?? e}. ` +
      `Likely CORS (credentials) or unreachable API_BASE (${API_BASE}).`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST /bookings failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<Booking>;
}

export async function fetchUserBookings(user_id: string): Promise<Booking[]> {
  const url = new URL(`${API_BASE}/bookings`);
  url.searchParams.set('user_id', user_id);
  console.log('GET', url.toString(), { USE_CREDENTIALS, API_BASE });

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      credentials: USE_CREDENTIALS ? 'include' : 'same-origin',
      headers: { 'Accept': 'application/json' },
    });
  } catch (e: any) {
    throw new Error(
      `Network error calling ${url}: ${e?.message ?? e}. ` +
      `Likely CORS (credentials) or unreachable API_BASE (${API_BASE}).`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET /bookings failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<Booking[]>;
}


// // src/api/bookings.ts
// const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// export type CreateBookingReq = {
//   user_id: string;
//   room_id: string;
//   date: string;        // YYYY-MM-DD
//   start_time: string;  // hh-mm-ss
//   end_time: string;    // hh-mm-ss
// };

// export type Booking = {
//   id: string;
//   user_id: string;
//   room_id: string;
//   building_short_name: string;
//   room_number: string;
//   date: string;        // YYYY-MM-DD
//   start_time: string;  // hh-mm-ss
//   end_time: string;    // hh-mm-ss
//   // ...any other fields your backend returns
// };

// export async function createBooking(body: CreateBookingReq): Promise<Booking> {
//   const res = await fetch(`${API_BASE}/bookings`, {
//     method: 'POST',
//     credentials: 'include',
//     headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
//     body: JSON.stringify(body),
//   });
//   if (!res.ok) {
//     const text = await res.text().catch(() => '');
//     throw new Error(`POST /bookings failed: ${res.status} ${res.statusText} ${text}`);
//   }
//   return res.json() as Promise<Booking>;
// }

// export async function fetchUserBookings(user_id: string): Promise<Booking[]> {
//   const url = new URL(`${API_BASE}/bookings`);
//   url.searchParams.set('user_id', user_id);
//   const res = await fetch(url.toString(), {
//     method: 'GET',
//     credentials: 'include',
//     headers: { 'Accept': 'application/json' },
//   });
//   if (!res.ok) {
//     const text = await res.text().catch(() => '');
//     throw new Error(`GET /bookings failed: ${res.status} ${res.statusText} ${text}`);
//   }
//   return res.json() as Promise<Booking[]>;
// }
