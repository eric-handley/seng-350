export type Room = {
  id: string
  name: string
  building: string
  capacity: number
}

export type Booking = {
  id: string
  roomId: string
  start: string // ISO
  end: string   // ISO
  user: string
  cancelled?: boolean
}

export type UiBooking = Booking & {
  name?: string;
  building?: string;
  roomNumber?: string;
  room?: { id: string; name?: string };
  date?: string; // "YYYY-MM-DD"
};

export type User = {
  id: string
  name: string
  role: 'staff' | 'admin' | 'registrar'
  email: string
}

export type TabKey = 'schedule' | 'book' | 'history' | 'users'