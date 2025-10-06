const API_BASE = "http://localhost:3000";

export type Building = {
  short_name: string;
  name: string;
  created_at: string;
  updated_at: string;
  rooms?: Room[];
};

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

export type CreateBuilding = {
  short_name: string;
  name: string;
};

export type UpdateBuilding = {
  name: string;
};

export async function fetchBuildings(
  options: { includeRooms?: boolean } = {}
): Promise<Building[]> {
  const params = new URLSearchParams();
  if (options.includeRooms) {params.set("includeRooms", "true");}
  const res = await fetch(
    `${API_BASE}/buildings${params.toString() ? `?${params.toString()}` : ""}`,
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GET /buildings failed: ${res.status} ${res.statusText} ${text}`
    );
  }
  return res.json() as Promise<Building[]>;
}

export async function createBuilding(body: CreateBuilding): Promise<Building> {
  const res = await fetch(`${API_BASE}/buildings`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message =
      errorData?.message ??
      `POST /buildings failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<Building>;
}

export async function updateBuilding(
  shortName: string,
  body: UpdateBuilding
): Promise<Building> {
  const res = await fetch(
    `${API_BASE}/buildings/${encodeURIComponent(shortName)}`,
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
      `PATCH /buildings/${shortName} failed: ${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return res.json() as Promise<Building>;
}

export async function deleteBuilding(shortName: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/buildings/${encodeURIComponent(shortName)}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" },
    }
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `DELETE /buildings/${shortName} failed: ${res.status} ${res.statusText} ${text}`
    );
  }
}
