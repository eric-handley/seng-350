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

export const getUserDisplayName = (
  user: Pick<User, "first_name" | "last_name">
): string => {
  return `${user.first_name} ${user.last_name}`.trim();
};
