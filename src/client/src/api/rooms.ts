const API_BASE = "http://localhost:3000";

export type Room = {
  room_id: string;
  building_short_name: string;
  room_number: string;
  capacity: number;
  room_type: string;
  url: string;
  created_at: string;
  updated_at: string;
};

export type CreateRoom = {
  building_short_name: string;
  room_number: string;
  capacity: number;
  room_type: string;
  url: string;
};

export type UpdateRoom = Partial<
  Pick<CreateRoom, "capacity" | "room_type" | "url">
>;

export type RoomQuery = {
  building_short_name?: string;
  min_capacity?: number;
  room_type?: string;
  equipment?: string;
};

function toQueryString(query: RoomQuery) {
  const params = new URLSearchParams();
  (Object.keys(query) as (keyof RoomQuery)[]).forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== "") {
      params.append(String(key), String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchRooms(query: RoomQuery = {}): Promise<Room[]> {
  const res = await fetch(`${API_BASE}/rooms${toQueryString(query)}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /rooms failed: ${res.status} ${res.statusText} ${text}`
    );
  }
  return res.json() as Promise<Room[]>;
}

export async function createRoom(body: CreateRoom): Promise<Room> {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message =
      errorData?.message ??
      `POST /rooms failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<Room>;
}

export async function updateRoom(
  roomId: string,
  body: UpdateRoom
): Promise<Room> {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message =
      errorData?.message ??
      `PATCH /rooms/${roomId} failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<Room>;
}

export async function deleteRoom(roomId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomId)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `DELETE /rooms/${roomId} failed: ${res.status} ${res.statusText} ${text}`
    );
  }
}
