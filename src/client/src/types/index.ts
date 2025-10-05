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

export type User = {
  id: string
  email: string
  password_hash?: string
  first_name: string
  last_name: string
  role: 'staff' | 'registrar' | 'admin'
  isBlocked?: boolean
  created_at?: string
  updated_at?: string
}

export type TabKey = 'schedule' | 'book' | 'history' | 'users'