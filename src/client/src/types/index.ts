export enum UserRole {
  ADMIN = "Admin",
  REGISTRAR = "Registrar",
  STAFF = "Staff",
}

export type Room = {
  id: string;
  name: string;
  building: string;
  capacity: number;
};

export type Booking = {
  id: string;
  roomId: string;
  start: string; // ISO
  end: string; // ISO
  user: string;
  cancelled?: boolean;
};

export type UiBooking = Booking & {
  name?: string;
  building?: string;
  roomNumber?: string;
  room?: { id: string; name?: string };
  date?: string; // "YYYY-MM-DD"
  booking_series_id?: string;
};

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
};

export type TabKey =
  | "schedule"
  | "book"
  | "history"
  | "users"
  | "audit"
  | "health"
  | "buildings"
  | "equipment";

export type AuditLog = {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  action: string;
  route: string;
  request: {
    query?: Record<string, unknown> | null;
    body?: unknown;
  } | null;
  created_at: string;
  updated_at: string;
};

export type Equipment = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  room_equipment?: Array<{
    room: {
      id: string;
      room: string;
      building_id: string;
      building_name: string;
      building_short_name: string;
    };
    quantity?: number;
  }>;
};

export type RoomEquipment = {
  room_id: string;
  equipment_id: string;
  quantity: number | null;
  created_at: string;
  updated_at: string;
};

export type CreateEquipment = {
  name: string;
};

export type UpdateEquipment = {
  name?: string;
};

export type CreateRoomEquipment = {
  room_id: string;
  equipment_id: string;
  quantity?: number;
};

export type UpdateRoomEquipment = {
  quantity?: number;
};

export const getUserDisplayName = (
  user: Pick<User, "first_name" | "last_name">
): string => {
  return `${user.first_name} ${user.last_name}`.trim();
};
