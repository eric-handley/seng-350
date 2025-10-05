import { useEffect, useMemo, useState } from 'react';
import { fetchSchedule, ScheduleQuery } from '../api/schedule';
import type { ApiBuilding, ApiRoom } from '../types/schedule';

export type FlatRoom = ApiRoom & {
  id: string;
  building_short_name: string;
  building_name: string;
};

export function useSchedule(q: ScheduleQuery) {
  const [data, setData] = useState<FlatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depsKey = useMemo(() => JSON.stringify(q), [q]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Only show loading state on initial load (when there's no data yet)
      if (data.length === 0) {
        setLoading(true);
      }
      setError(null);
      try {
        const resp = await fetchSchedule(q);
        if (cancelled) {return;}

        const flat: FlatRoom[] = resp.buildings.flatMap((b: ApiBuilding) =>
          b.rooms.map((r: ApiRoom) => ({
            ...r,
            id: r.room_id,
            building_short_name: b.building_short_name,
            building_name: b.building_name,
          }))
        );

        setData(flat);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (!cancelled) { setError(msg); }
      } finally {
        if (!cancelled) {setLoading(false);}
      }
    };

    const t = setTimeout(run, 250);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]); // Run when any query parameter changes (q is tracked via depsKey, data.length intentionally excluded)

  return { rooms: data, loading, error };
}
