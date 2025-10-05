import { useEffect, useMemo, useState } from 'react';
import { fetchSchedule, ScheduleQuery } from '../api/schedule';
import type { ApiBuilding, ApiRoom } from '../types/schedule';

export type FlatRoom = ApiRoom & {
  id: string; // alias for your existing RoomCard key
  building_short_name: string;
  building_name: string;
};

export function useSchedule(q: ScheduleQuery) {
  const [data, setData] = useState<FlatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce to avoid spamming while user types
  const depsKey = useMemo(() => JSON.stringify(q), [q]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchSchedule(q);
        if (cancelled) return;

        // Flatten buildings -> rooms and attach building info
        const flat: FlatRoom[] = resp.buildings.flatMap((b: ApiBuilding) =>
          b.rooms.map((r: ApiRoom) => ({
            ...r,
            id: r.room_id,
            building_short_name: b.building_short_name,
            building_name: b.building_name,
          }))
        );

        setData(flat);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(run, 250); // simple debounce
    return () => { cancelled = true; clearTimeout(t); };
  }, [depsKey]); // run when any query parameter changes

  return { rooms: data, loading, error };
}
