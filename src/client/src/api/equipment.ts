const API_BASE = "http://localhost:3000";

import {
  Equipment,
  CreateEquipment,
  UpdateEquipment,
  RoomEquipment,
  CreateRoomEquipment,
  UpdateRoomEquipment,
} from "../types";

export async function fetchEquipmentByRoom(
  roomId: string
): Promise<Equipment[]> {
  const res = await fetch(
    `${API_BASE}/equipment/room/${encodeURIComponent(roomId)}`,
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /equipment/room/${roomId} failed: ${res.status} ${res.statusText} ${text}`
    );
  }
  return res.json() as Promise<Equipment[]>;
}

export async function createEquipment(
  body: CreateEquipment
): Promise<Equipment> {
  const res = await fetch(`${API_BASE}/equipment`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message =
      errorData?.message ??
      `POST /equipment failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<Equipment>;
}

export async function updateEquipment(
  id: string,
  body: UpdateEquipment
): Promise<Equipment> {
  const res = await fetch(`${API_BASE}/equipment/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message =
      errorData?.message ??
      `PATCH /equipment/${id} failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<Equipment>;
}

export async function deleteEquipment(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/equipment/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `DELETE /equipment/${id} failed: ${res.status} ${res.statusText} ${text}`
    );
  }
}

export async function createRoomEquipment(
  body: CreateRoomEquipment
): Promise<RoomEquipment> {
  const res = await fetch(`${API_BASE}/room-equipment`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message =
      errorData?.message ??
      `POST /room-equipment failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<RoomEquipment>;
}

export async function updateRoomEquipment(
  roomId: string,
  equipmentId: string,
  body: UpdateRoomEquipment
): Promise<RoomEquipment> {
  const res = await fetch(
    `${API_BASE}/room-equipment/${encodeURIComponent(
      roomId
    )}/${encodeURIComponent(equipmentId)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message =
      errorData?.message ??
      `PATCH /room-equipment/${roomId}/${equipmentId} failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<RoomEquipment>;
}

export async function deleteRoomEquipment(
  roomId: string,
  equipmentId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/room-equipment/${encodeURIComponent(
      roomId
    )}/${encodeURIComponent(equipmentId)}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `DELETE /room-equipment/${roomId}/${equipmentId} failed: ${res.status} ${res.statusText} ${text}`
    );
  }
}
