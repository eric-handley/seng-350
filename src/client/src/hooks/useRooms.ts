import { useEffect, useMemo, useState } from 'react';
import { fetchRooms, RoomsQuery, RoomResponse } from '../api/schedule';

export function useRooms(q: RoomsQuery) {
  const [data, setData] = useState<RoomResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depsKey = useMemo(() => JSON.stringify(q), [q]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (data.length === 0) {
        setLoading(true);
      }
      setError(null);
      try {
        const resp = await fetchRooms(q);
        if (cancelled) {return;}
        setData(resp);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (!cancelled) {setError(msg);}
      } finally {
        if (!cancelled) {setLoading(false);}
      }
    };

    const t = setTimeout(run, 250);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depsKey]);

  return { rooms: data, loading, error };
}
