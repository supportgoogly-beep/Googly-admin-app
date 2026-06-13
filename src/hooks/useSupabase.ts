import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseCollection<T extends { id: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      const { data: fetchResult, error } = await supabase
        .from(collectionName)
        .select('*');
      
      if (error) {
        console.error(`Error fetching ${collectionName}:`, error);
        return;
      }
      
      if (isMounted && fetchResult) {
        setData(fetchResult as T[]);
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`public:${collectionName}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: collectionName }, payload => {
        if (isMounted) setData(current => [...current, payload.new as T]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: collectionName }, payload => {
        if (isMounted) setData(current => current.map(item => item.id === payload.new.id ? payload.new as T : item));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: collectionName }, payload => {
        if (isMounted) setData(current => current.filter(item => item.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [collectionName]);

  const addItem = async (item: Omit<T, 'id'>) => {
    const { data: insertedData, error } = await supabase
      .from(collectionName)
      .insert([item as any])
      .select();

    if (error) {
      console.error(`Error adding to ${collectionName}:`, error);
      throw error;
    }

    try {
      if (insertedData && insertedData[0]) {
        fetch("/api/realtime/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            event: "INSERT", 
            table: collectionName, 
            row: insertedData[0], 
            rowId: (insertedData[0] as any).id,
            origin: "supabase-hook"
          })
        });
      }
    } catch (e) {
      console.warn("Supabase hook SSE broadcast error:", e);
    }

    return insertedData;
  };

  const updateItem = async (id: string, updates: Partial<T>) => {
    const { error } = await supabase
      .from(collectionName)
      .update(updates as any)
      .eq('id', id);

    if (error) {
      console.error(`Error updating in ${collectionName}:`, error);
      throw error;
    }

    try {
      fetch("/api/realtime/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          event: "UPDATE", 
          table: collectionName, 
          row: updates, 
          rowId: id,
          origin: "supabase-hook"
        })
      });
    } catch (e) {
      console.warn("Supabase hook SSE broadcast error:", e);
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from(collectionName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting from ${collectionName}:`, error);
      throw error;
    }

    try {
      fetch("/api/realtime/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          event: "DELETE", 
          table: collectionName, 
          row: null, 
          rowId: id,
          origin: "supabase-hook"
        })
      });
    } catch (e) {
      console.warn("Supabase hook SSE broadcast error:", e);
    }
  };

  return { data, loading, addItem, updateItem, deleteItem };
}
