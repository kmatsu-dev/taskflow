import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * Mirror a Supabase table into local React state with realtime sync.
 * Returns { items, loaded, add, update, remove }.
 *
 * - Initial fetch on mount.
 * - Subscribes to postgres_changes (INSERT / UPDATE / DELETE) and applies them.
 * - Mutations are optimistic; failures roll back (insert) or log (update/delete).
 */
export function useSupabaseCollection(table) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.error(`[supabase] fetch ${table} failed`, error);
      } else {
        setItems(data || []);
      }
      setLoaded(true);
    })();

    const channel = supabase
      .channel(`realtime:public:${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === 'INSERT') {
              if (prev.some((x) => x.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((x) =>
                x.id === payload.new.id ? payload.new : x
              );
            }
            if (payload.eventType === 'DELETE') {
              const oldId = payload.old?.id;
              if (!oldId) return prev;
              return prev.filter((x) => x.id !== oldId);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [table]);

  const add = useCallback(
    async (item) => {
      setItems((prev) => [...prev, item]);
      const { error } = await supabase.from(table).insert(item);
      if (error) {
        console.error(`[supabase] insert ${table} failed`, error);
        setItems((prev) => prev.filter((x) => x.id !== item.id));
      }
    },
    [table]
  );

  const update = useCallback(
    async (item) => {
      setItems((prev) => prev.map((x) => (x.id === item.id ? item : x)));
      const { id, ...patch } = item;
      const { error } = await supabase.from(table).update(patch).eq('id', id);
      if (error) console.error(`[supabase] update ${table} failed`, error);
    },
    [table]
  );

  const remove = useCallback(
    async (id) => {
      setItems((prev) => prev.filter((x) => x.id !== id));
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) console.error(`[supabase] delete ${table} failed`, error);
    },
    [table]
  );

  return { items, loaded, add, update, remove };
}
