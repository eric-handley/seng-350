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
  | "health";

export type AuditLog = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
};

export const getUserDisplayName = (
  user: Pick<User, "first_name" | "last_name">
): string => {
  return `${user.first_name} ${user.last_name}`.trim();
};
