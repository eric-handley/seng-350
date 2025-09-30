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
  name: string
  role: 'staff' | 'admin' | 'registrar'
  email: string
}

export type TabKey = 'schedule' | 'book' | 'history' | 'users'