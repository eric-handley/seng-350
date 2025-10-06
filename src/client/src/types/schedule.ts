export type Slot = {
  start_time: string; // ISO8601
  end_time: string;   // ISO8601
};

export type ApiRoom = {
  room_id: string;
  room_number: string;
  capacity: number;
  room_type: string;
  slots: Slot[];
};

export type ApiBuilding = {
  building_short_name: string;
  building_name: string;
  rooms: ApiRoom[];
};

export type ScheduleResponse = {
  buildings: ApiBuilding[];
};
