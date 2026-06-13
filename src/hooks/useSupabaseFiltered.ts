import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseFilteredCollection<T extends { id: string }>(
  collectionName: string,
  filterColumn?: string,
  filterValue?: string | number
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      let query = supabase.from(collectionName).select('*');
      
      if (filterColumn && filterValue !== undefined) {
        query = query.eq(filterColumn, filterValue);
      }
      
      const { data: fetchResult, error } = await query;
      
      if (error) {
        console.error(`Error fetching filtered ${collectionName}:`, error);
        return;
      }
      
      if (isMounted && fetchResult) {
        setData(fetchResult as T[]);
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime changes with filter
    const filterString = filterColumn && filterValue !== undefined ? `${filterColumn}=eq.${filterValue}` : undefined;
    
    const channel = supabase
      .channel(`public:${collectionName}:${filterColumn}:${filterValue}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: collectionName,
        filter: filterString
      }, payload => {
        if (isMounted) setData(current => [...current, payload.new as T]);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: collectionName,
        filter: filterString
      }, payload => {
        if (isMounted) setData(current => current.map(item => item.id === payload.new.id ? payload.new as T : item));
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: collectionName,
        filter: filterString
      }, payload => {
        if (isMounted) setData(current => current.filter(item => item.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [collectionName, filterColumn, filterValue]);

  return { data, loading };
}
