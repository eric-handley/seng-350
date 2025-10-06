import React, { useState, useEffect } from "react";
import { useEquipment } from "../../hooks/useEquipment";
import { fetchBuildings, Building, Room } from "../../api/buildings";
import { fetchAllEquipment } from "../../api/equipment";
import {
  Equipment,
  CreateEquipment,
  UpdateEquipment,
  CreateRoomEquipment,
  UpdateRoomEquipment,
} from "../../types";

export default function EquipmentManagement() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showAddRoomEquipment, setShowAddRoomEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(
    null
  );
  const [editingRoomEquipment, setEditingRoomEquipment] = useState<{
    roomId: string;
    equipmentId: string;
    quantity: number | null;
  } | null>(null);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newRoomEquipmentQuantity, setNewRoomEquipmentQuantity] =
    useState<number>(1);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);

  const {
    equipment,
    loading,
    error,
    addEquipment,
    editEquipment,
    removeEquipment,
    addRoomEquipment,
    editRoomEquipment,
    removeRoomEquipment,
  } = useEquipment(selectedRoom);

  // Load buildings on component mount
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const data = await fetchBuildings({ includeRooms: true });
        setBuildings(data);
      } catch (err) {
        console.error("Failed to load buildings:", err);
      }
    };
    loadBuildings();
  }, []);

  // Update rooms when building changes
  useEffect(() => {
    if (selectedBuilding) {
      const building = buildings.find((b) => b.short_name === selectedBuilding);
      if (building?.rooms) {
        setRooms(building.rooms);
        setSelectedRoom(""); // Reset room selection
      }
    } else {
      setRooms([]);
      setSelectedRoom("");
    }
  }, [selectedBuilding, buildings]);

  // Load available equipment for adding to rooms
  useEffect(() => {
    const loadAvailableEquipment = async () => {
      try {
        const data = await fetchAllEquipment();
        setAvailableEquipment(data);
      } catch (err) {
        console.error("Failed to load available equipment:", err);
      }
    };
    loadAvailableEquipment();
  }, []);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipmentName.trim()) return;

    try {
      const equipmentData: CreateEquipment = { name: newEquipmentName.trim() };
      await addEquipment(equipmentData);
      setNewEquipmentName("");
      setShowAddEquipment(false);
    } catch (err) {
      console.error("Failed to add equipment:", err);
    }
  };

  const handleEditEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment || !newEquipmentName.trim()) return;

    try {
      const equipmentData: UpdateEquipment = { name: newEquipmentName.trim() };
      await editEquipment(editingEquipment.id, equipmentData);
      setEditingEquipment(null);
      setNewEquipmentName("");
    } catch (err) {
      console.error("Failed to edit equipment:", err);
    }
  };

  const handleAddRoomEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !editingRoomEquipment?.equipmentId) return;

    try {
      const roomEquipmentData: CreateRoomEquipment = {
        room_id: selectedRoom,
        equipment_id: editingRoomEquipment.equipmentId,
        quantity: newRoomEquipmentQuantity,
      };
      await addRoomEquipment(roomEquipmentData);
      setEditingRoomEquipment(null);
      setNewRoomEquipmentQuantity(1);
      setShowAddRoomEquipment(false);
    } catch (err) {
      console.error("Failed to add equipment to room:", err);
    }
  };

  const handleEditRoomEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomEquipment || !selectedRoom) return;

    try {
      const roomEquipmentData: UpdateRoomEquipment = {
        quantity: newRoomEquipmentQuantity,
      };
      await editRoomEquipment(
        selectedRoom,
        editingRoomEquipment.equipmentId,
        roomEquipmentData
      );
      setEditingRoomEquipment(null);
      setNewRoomEquipmentQuantity(1);
    } catch (err) {
      console.error("Failed to edit room equipment:", err);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this equipment? This will remove it from all rooms."
      )
    ) {
      return;
    }

    try {
      await removeEquipment(equipmentId);
    } catch (err) {
      console.error("Failed to delete equipment:", err);
    }
  };

  const handleDeleteRoomEquipment = async (equipmentId: string) => {
    if (
      !selectedRoom ||
      !window.confirm(
        "Are you sure you want to remove this equipment from the room?"
      )
    ) {
      return;
    }

    try {
      await removeRoomEquipment(selectedRoom, equipmentId);
    } catch (err) {
      console.error("Failed to remove equipment from room:", err);
    }
  };

  const startEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setNewEquipmentName(equipment.name);
  };

  const startEditRoomEquipment = (equipment: Equipment) => {
    const roomEquipment = equipment.room_equipment?.find(
      (re) => re.room.room === selectedRoom.split("-")[1]
    );
    if (roomEquipment) {
      setEditingRoomEquipment({
        roomId: selectedRoom,
        equipmentId: equipment.id,
        quantity: roomEquipment.quantity || null,
      });
      setNewRoomEquipmentQuantity(roomEquipment.quantity || 1);
    }
  };

  const cancelEdit = () => {
    setEditingEquipment(null);
    setEditingRoomEquipment(null);
    setNewEquipmentName("");
    setNewRoomEquipmentQuantity(1);
  };

  return (
    <div className="equipment-management">
      <div className="equipment-header">
        <h2>Equipment Management</h2>
        <div className="equipment-actions">
          {selectedRoom && (
            <button
              className="btn btn--secondary"
              onClick={() => setShowAddRoomEquipment(true)}
            >
              Add Equipment to{" "}
              {rooms.find((r) => r.room_id === selectedRoom)?.room_number}
            </button>
          )}
        </div>
      </div>

      <div className="equipment-filters">
        <div className="filter-group">
          <label htmlFor="building-select">Building:</label>
          <select
            id="building-select"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="form-control"
          >
            <option value="">Select a building</option>
            {buildings.map((building) => (
              <option key={building.short_name} value={building.short_name}>
                {building.name} ({building.short_name})
              </option>
            ))}
          </select>
        </div>

        {selectedBuilding && (
          <div className="filter-group">
            <label htmlFor="room-select">Room:</label>
            <select
              id="room-select"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="form-control"
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.room_id} value={room.room_id}>
                  {room.room_number} (Capacity: {room.capacity})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {selectedRoom && (
        <div className="equipment-content">
          <div className="current-room-info">
            <h3>
              Equipment in{" "}
              {buildings.find((b) => b.short_name === selectedBuilding)?.name} -
              Room {rooms.find((r) => r.room_id === selectedRoom)?.room_number}
            </h3>
          </div>
          {loading ? (
            <div className="loading">Loading equipment...</div>
          ) : (
            <div className="equipment-list">
              {equipment.length === 0 ? (
                <div className="empty-state">
                  <p>No equipment found in this room.</p>
                </div>
              ) : (
                equipment.map((eq) => (
                  <div key={eq.id} className="equipment-card">
                    <div className="equipment-info">
                      <h3>{eq.name}</h3>
                      <p className="equipment-meta">
                        Created: {new Date(eq.created_at).toLocaleDateString()}
                      </p>
                      {eq.room_equipment && eq.room_equipment.length > 0 && (
                        <div className="room-equipment-info">
                          <p>
                            Quantity: {eq.room_equipment[0].quantity || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="equipment-actions">
                      <button
                        className="btn btn--small btn--secondary"
                        onClick={() => startEditEquipment(eq)}
                      >
                        Edit
                      </button>
                      {/* <button
                        className="btn btn--small btn--secondary"
                        onClick={() => startEditRoomEquipment(eq)}
                      >
                        Edit Quantity
                      </button> */}
                      <button
                        className="btn btn--small btn--danger"
                        onClick={() => handleDeleteRoomEquipment(eq.id)}
                      >
                        Remove from Room
                      </button>
                      <button
                        className="btn btn--small btn--danger"
                        onClick={() => handleDeleteEquipment(eq.id)}
                      >
                        Delete Equipment
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Equipment</h3>
              <button
                className="btn btn--icon"
                onClick={() => setShowAddEquipment(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddEquipment} className="modal-body">
              <div className="form-group">
                <label htmlFor="equipment-name">Equipment Name:</label>
                <input
                  id="equipment-name"
                  type="text"
                  value={newEquipmentName}
                  onChange={(e) => setNewEquipmentName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowAddEquipment(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {editingEquipment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Equipment</h3>
              <button className="btn btn--icon" onClick={cancelEdit}>
                ×
              </button>
            </div>
            <form onSubmit={handleEditEquipment} className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-equipment-name">Equipment Name:</label>
                <input
                  id="edit-equipment-name"
                  type="text"
                  value={newEquipmentName}
                  onChange={(e) => setNewEquipmentName(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Room Equipment Modal */}
      {showAddRoomEquipment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Equipment to Room</h3>
              <button
                className="btn btn--icon"
                onClick={() => setShowAddRoomEquipment(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddRoomEquipment} className="modal-body">
              <div className="room-selection-info">
                <h4>Adding equipment to:</h4>
                <div className="room-info-card">
                  <div className="room-info-item">
                    <strong>Building:</strong>{" "}
                    {
                      buildings.find((b) => b.short_name === selectedBuilding)
                        ?.name
                    }{" "}
                    ({selectedBuilding})
                  </div>
                  <div className="room-info-item">
                    <strong>Room:</strong>{" "}
                    {rooms.find((r) => r.room_id === selectedRoom)?.room_number}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="equipment-select">Select Equipment:</label>
                <select
                  id="equipment-select"
                  value={editingRoomEquipment?.equipmentId || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      setEditingRoomEquipment({
                        roomId: selectedRoom,
                        equipmentId: e.target.value,
                        quantity: 1,
                      });
                    } else {
                      setEditingRoomEquipment(null);
                    }
                  }}
                  className="form-control"
                  required
                >
                  <option value="">Choose equipment to add</option>
                  {availableEquipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="room-equipment-quantity">Quantity:</label>
                <input
                  id="room-equipment-quantity"
                  type="number"
                  min="1"
                  value={newRoomEquipmentQuantity}
                  onChange={(e) =>
                    setNewRoomEquipmentQuantity(parseInt(e.target.value) || 1)
                  }
                  className="form-control"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setShowAddRoomEquipment(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Add to{" "}
                  {rooms.find((r) => r.room_id === selectedRoom)?.room_number}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Room Equipment Modal */}
      {editingRoomEquipment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Equipment Quantity</h3>
              <button className="btn btn--icon" onClick={cancelEdit}>
                ×
              </button>
            </div>
            <form onSubmit={handleEditRoomEquipment} className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-room-equipment-quantity">Quantity:</label>
                <input
                  id="edit-room-equipment-quantity"
                  type="number"
                  min="1"
                  value={newRoomEquipmentQuantity}
                  onChange={(e) =>
                    setNewRoomEquipmentQuantity(parseInt(e.target.value) || 1)
                  }
                  className="form-control"
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
