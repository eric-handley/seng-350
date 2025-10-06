import React, { useEffect, useState } from "react";
import {
  Building,
  CreateBuilding,
  UpdateBuilding,
  createBuilding,
  deleteBuilding,
  fetchBuildings,
  updateBuilding,
} from "../../api/buildings";
import {
  Room,
  CreateRoom,
  UpdateRoom,
  createRoom,
  deleteRoom,
  updateRoom,
} from "../../api/rooms";

type BusyKey =
  | { kind: "load" }
  | { kind: "create-building" }
  | { kind: "update-building"; shortName: string }
  | { kind: "delete-building"; shortName: string }
  | { kind: "create-room"; buildingShortName: string }
  | { kind: "update-room"; roomId: string }
  | { kind: "delete-room"; roomId: string };

export default function BuildingsRooms(): JSX.Element {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<BusyKey | null>({ kind: "load" });

  // Forms state
  const [newBuilding, setNewBuilding] = useState<CreateBuilding>({
    short_name: "",
    name: "",
  });

  const [editingBuildingShort, setEditingBuildingShort] = useState<
    string | null
  >(null);
  const [editingBuildingName, setEditingBuildingName] = useState<string>("");

  const [roomDrafts, setRoomDrafts] = useState<Record<string, CreateRoom>>({});
  const [editingRoom, setEditingRoom] = useState<Record<string, UpdateRoom>>(
    {}
  );

  const isLoading = busy?.kind === "load";

  const reload = async (): Promise<void> => {
    setBusy({ kind: "load" });
    setError(null);
    try {
      const list = await fetchBuildings({ includeRooms: true });
      setBuildings(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load buildings");
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    void reload();
  }, []);


  const handleCreateBuilding = async (): Promise<void> => {
    if (!newBuilding.short_name.trim() || !newBuilding.name.trim()) {return;}
    setBusy({ kind: "create-building" });
    setError(null);
    try {
      const created = await createBuilding({
        short_name: newBuilding.short_name.trim().toUpperCase(),
        name: newBuilding.name.trim(),
      });
      setBuildings((prev) => [created, ...prev]);
      setNewBuilding({ short_name: "", name: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create building");
    } finally {
      setBusy(null);
    }
  };

  const startEditBuilding = (b: Building): void => {
    setEditingBuildingShort(b.short_name);
    setEditingBuildingName(b.name);
  };

  const handleUpdateBuilding = async (shortName: string): Promise<void> => {
    if (!editingBuildingName.trim()) {return;}
    setBusy({ kind: "update-building", shortName });
    setError(null);
    try {
      const updated = await updateBuilding(shortName, {
        name: editingBuildingName.trim(),
      } as UpdateBuilding);
      setBuildings((prev) =>
        prev.map((b) => (b.short_name === shortName ? updated : b))
      );
      setEditingBuildingShort(null);
      setEditingBuildingName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update building");
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteBuilding = async (shortName: string): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete building ${shortName}? This also removes rooms.`))
      {return;}
    setBusy({ kind: "delete-building", shortName });
    setError(null);
    try {
      await deleteBuilding(shortName);
      setBuildings((prev) => prev.filter((b) => b.short_name !== shortName));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete building");
    } finally {
      setBusy(null);
    }
  };

  const getRoomDraftFor = (shortName: string): CreateRoom => {
    return (
      roomDrafts[shortName] || {
        building_short_name: shortName,
        room_number: "",
        capacity: 1,
        room_type: "Classroom",
        url: "",
      }
    );
  };

  const setRoomDraftFor = (shortName: string, draft: CreateRoom): void => {
    setRoomDrafts((prev) => ({ ...prev, [shortName]: draft }));
  };

  const handleCreateRoom = async (shortName: string): Promise<void> => {
    const draft = getRoomDraftFor(shortName);
    if (!draft.room_number.trim() || !draft.url.trim()) {return;}
    setBusy({ kind: "create-room", buildingShortName: shortName });
    setError(null);
    try {
      const created = await createRoom({
        ...draft,
        building_short_name: shortName,
        room_number: draft.room_number.trim(),
        url: draft.url.trim(),
      });
      setBuildings((prev) =>
        prev.map((b) =>
          b.short_name === shortName
            ? { ...b, rooms: [created as unknown as Room, ...(b.rooms ?? [])] }
            : b
        )
      );
      setRoomDraftFor(shortName, {
        building_short_name: shortName,
        room_number: "",
        capacity: 1,
        room_type: draft.room_type,
        url: "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create room");
    } finally {
      setBusy(null);
    }
  };

  const startEditRoom = (room: Room): void => {
    setEditingRoom((prev) => ({
      ...prev,
      [room.room_id]: {
        capacity: room.capacity,
        room_type: room.room_type,
        url: room.url,
      },
    }));
  };

  const handleUpdateRoom = async (room: Room): Promise<void> => {
    const draft = editingRoom[room.room_id];
    if (!draft) {return;}
    setBusy({ kind: "update-room", roomId: room.room_id });
    setError(null);
    try {
      const updated = await updateRoom(room.room_id, draft);
      setBuildings((prev) =>
        prev.map((b) => ({
          ...b,
          rooms: (b.rooms ?? []).map((r) =>
            r.room_id === room.room_id ? (updated as unknown as Room) : r
          ),
        }))
      );
      setEditingRoom((prev) => {
        const next = { ...prev };
        delete next[room.room_id];
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update room");
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteRoom = async (room: Room): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Delete room ${room.room_id}?`)) {return;}
    setBusy({ kind: "delete-room", roomId: room.room_id });
    setError(null);
    try {
      await deleteRoom(room.room_id);
      setBuildings((prev) =>
        prev.map((b) => ({
          ...b,
          rooms: (b.rooms ?? []).filter((r) => r.room_id !== room.room_id),
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete room");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="content-stack" style={{ width: "100%" }}>
      <div className="card">
        <div className="card-title">Create Building</div>
        <div
          className="card-body"
          style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
        >
          <input
            className="input"
            aria-label="Building short name"
            placeholder="Short name (e.g., ECS)"
            value={newBuilding.short_name}
            onChange={(e) =>
              setNewBuilding((p) => ({ ...p, short_name: e.target.value }))
            }
          />
          <input
            className="input"
            aria-label="Building full name"
            placeholder="Full name"
            value={newBuilding.name}
            onChange={(e) =>
              setNewBuilding((p) => ({ ...p, name: e.target.value }))
            }
            style={{ minWidth: 260 }}
          />
          <button
            className="btn"
            onClick={() => void handleCreateBuilding()}
            disabled={busy?.kind === "create-building"}
          >
            {busy?.kind === "create-building" ? "Creating…" : "Create"}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="alert danger"
          role="alert"
          style={{ marginBottom: "1rem" }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: "1rem" }}>Loading buildings…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {buildings.map((b) => (
            <div key={b.short_name} className="card">
              <div
                className="card-title"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span className="badge" style={{ marginRight: "0.5rem" }}>
                    {b.short_name}
                  </span>
                  {editingBuildingShort === b.short_name ? (
                    <input
                      className="input"
                      value={editingBuildingName}
                      onChange={(e) => setEditingBuildingName(e.target.value)}
                    />
                  ) : (
                    <span>{b.name}</span>
                  )}
                </div>
                <div className="building-actions">
                  {editingBuildingShort === b.short_name ? (
                    <>
                      <button
                        className="btn btn--small"
                        onClick={() => void handleUpdateBuilding(b.short_name)}
                        disabled={
                          busy?.kind === "update-building" &&
                          busy.shortName === b.short_name
                        }
                      >
                        Save
                      </button>
                      <button
                        className="btn btn--small ghost"
                        onClick={() => {
                          setEditingBuildingShort(null);
                          setEditingBuildingName("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn--small"
                        onClick={() => startEditBuilding(b)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn--small danger"
                        onClick={() => void handleDeleteBuilding(b.short_name)}
                        disabled={
                          busy?.kind === "delete-building" &&
                          busy.shortName === b.short_name
                        }
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                  Rooms
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Capacity</th>
                        <th>Type</th>
                        <th>URL</th>
                        <th style={{ width: 160 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(b.rooms ?? []).map((r) => {
                        const draft = editingRoom[r.room_id];
                        const isEditing = Boolean(draft);
                        return (
                          <tr key={r.room_id}>
                            <td>{r.room_id}</td>
                            <td>
                              {isEditing ? (
                                <input
                                  className="input"
                                  type="number"
                                  min={1}
                                  value={draft?.capacity ?? r.capacity}
                                  onChange={(e) =>
                                    setEditingRoom((prev) => ({
                                      ...prev,
                                      [r.room_id]: {
                                        ...draft,
                                        capacity: Number(e.target.value || 1),
                                      },
                                    }))
                                  }
                                  style={{ width: 90 }}
                                />
                              ) : (
                                r.capacity
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  className="input"
                                  value={draft?.room_type ?? r.room_type}
                                  onChange={(e) =>
                                    setEditingRoom((prev) => ({
                                      ...prev,
                                      [r.room_id]: {
                                        ...draft,
                                        room_type: e.target.value,
                                      },
                                    }))
                                  }
                                  style={{ width: 140 }}
                                />
                              ) : (
                                r.room_type
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  className="input"
                                  value={draft?.url ?? r.url}
                                  onChange={(e) =>
                                    setEditingRoom((prev) => ({
                                      ...prev,
                                      [r.room_id]: {
                                        ...draft,
                                        url: e.target.value,
                                      },
                                    }))
                                  }
                                  style={{ minWidth: 180 }}
                                />
                              ) : (
                                <a
                                  href={r.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Link
                                </a>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div className="room-actions">
                                  <button
                                    className="btn btn--small"
                                    onClick={() => void handleUpdateRoom(r)}
                                    disabled={
                                      busy?.kind === "update-room" &&
                                      busy.roomId === r.room_id
                                    }
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn btn--small ghost"
                                    onClick={() =>
                                      setEditingRoom((prev) => {
                                        const next = { ...prev };
                                        delete next[r.room_id];
                                        return next;
                                      })
                                    }
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="room-actions">
                                  <button
                                    className="btn btn--small"
                                    onClick={() => startEditRoom(r)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn--small danger"
                                    onClick={() => void handleDeleteRoom(r)}
                                    disabled={
                                      busy?.kind === "delete-room" &&
                                      busy.roomId === r.room_id
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.25rem",
                              alignItems: "center",
                            }}
                          >
                            <span className="muted">{b.short_name}-</span>
                            <input
                              className="input"
                              placeholder="Number"
                              value={getRoomDraftFor(b.short_name).room_number}
                              onChange={(e) =>
                                setRoomDraftFor(b.short_name, {
                                  ...getRoomDraftFor(b.short_name),
                                  room_number: e.target.value,
                                })
                              }
                              style={{ width: 100 }}
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            min={1}
                            value={getRoomDraftFor(b.short_name).capacity}
                            onChange={(e) =>
                              setRoomDraftFor(b.short_name, {
                                ...getRoomDraftFor(b.short_name),
                                capacity: Number(e.target.value || 1),
                              })
                            }
                            style={{ width: 90 }}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            placeholder="Type"
                            value={getRoomDraftFor(b.short_name).room_type}
                            onChange={(e) =>
                              setRoomDraftFor(b.short_name, {
                                ...getRoomDraftFor(b.short_name),
                                room_type: e.target.value,
                              })
                            }
                            style={{ width: 140 }}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            placeholder="URL"
                            value={getRoomDraftFor(b.short_name).url}
                            onChange={(e) =>
                              setRoomDraftFor(b.short_name, {
                                ...getRoomDraftFor(b.short_name),
                                url: e.target.value,
                              })
                            }
                            style={{ minWidth: 180 }}
                          />
                        </td>
                        <td>
                          <button
                            className="btn"
                            onClick={() => void handleCreateRoom(b.short_name)}
                            disabled={
                              busy?.kind === "create-room" &&
                              busy.buildingShortName === b.short_name
                            }
                          >
                            Add Room
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
