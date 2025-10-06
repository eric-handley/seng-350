import { useState, useEffect } from "react";
import {
  Equipment,
  CreateEquipment,
  UpdateEquipment,
  CreateRoomEquipment,
  UpdateRoomEquipment,
} from "../types";
import {
  fetchEquipmentByRoom,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  createRoomEquipment,
  updateRoomEquipment,
  deleteRoomEquipment,
} from "../api/equipment";

export function useEquipment(roomId?: string) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEquipment = async () => {
    if (!roomId) {return;}

    setLoading(true);
    setError(null);
    try {
      const data = await fetchEquipmentByRoom(roomId);
      setEquipment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  };

  const addEquipment = async (equipmentData: CreateEquipment) => {
    try {
      const newEquipment = await createEquipment(equipmentData);
      setEquipment((prev) => [...prev, newEquipment]);
      return newEquipment;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create equipment"
      );
      throw err;
    }
  };

  const editEquipment = async (id: string, equipmentData: UpdateEquipment) => {
    try {
      const updatedEquipment = await updateEquipment(id, equipmentData);
      setEquipment((prev) =>
        prev.map((eq) => (eq.id === id ? updatedEquipment : eq))
      );
      return updatedEquipment;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update equipment"
      );
      throw err;
    }
  };

  const removeEquipment = async (id: string) => {
    try {
      await deleteEquipment(id);
      setEquipment((prev) => prev.filter((eq) => eq.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete equipment"
      );
      throw err;
    }
  };

  const addRoomEquipment = async (roomEquipmentData: CreateRoomEquipment) => {
    try {
      const newRoomEquipment = await createRoomEquipment(roomEquipmentData);
      // Reload equipment to get updated data
      await loadEquipment();
      return newRoomEquipment;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add equipment to room"
      );
      throw err;
    }
  };

  const editRoomEquipment = async (
    roomId: string,
    equipmentId: string,
    roomEquipmentData: UpdateRoomEquipment
  ) => {
    try {
      const updatedRoomEquipment = await updateRoomEquipment(
        roomId,
        equipmentId,
        roomEquipmentData
      );
      // Reload equipment to get updated data
      await loadEquipment();
      return updatedRoomEquipment;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update room equipment"
      );
      throw err;
    }
  };

  const removeRoomEquipment = async (roomId: string, equipmentId: string) => {
    try {
      await deleteRoomEquipment(roomId, equipmentId);
      // Reload equipment to get updated data
      await loadEquipment();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove equipment from room"
      );
      throw err;
    }
  };

  useEffect(() => {
    void loadEquipment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return {
    equipment,
    loading,
    error,
    loadEquipment,
    addEquipment,
    editEquipment,
    removeEquipment,
    addRoomEquipment,
    editRoomEquipment,
    removeRoomEquipment,
  };
}
