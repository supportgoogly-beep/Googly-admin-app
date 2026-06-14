import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseFilteredCollection<T extends { id: string }>(
  collectionName: string,
  filterColumn?: string,
  filterValue?: string | number
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const localKey = `local_supabase_${collectionName}`;

  useEffect(() => {
    let isMounted = true;

    // Load and filter from local cache first
    const cached = localStorage.getItem(localKey);
    let initialFilteredData: T[] = [];
    let initialAllData: T[] = [];
    if (cached) {
      try {
        initialAllData = JSON.parse(cached);
        if (filterColumn && filterValue !== undefined) {
          initialFilteredData = initialAllData.filter(
            (item: any) => String(item[filterColumn]) === String(filterValue)
          );
        } else {
          initialFilteredData = initialAllData;
        }
        setData(initialFilteredData);
      } catch (e) {
        console.error("Failed to parse cached filtered data for " + collectionName);
      }
    }

    const fetchData = async () => {
      try {
        let query = supabase.from(collectionName).select('*');
        
        if (filterColumn && filterValue !== undefined) {
          query = query.eq(filterColumn, filterValue);
        }
        
        const { data: fetchResult, error } = await query;
        
        if (error) {
          console.warn(`Error fetching filtered ${collectionName} from Supabase, relying on localStorage:`, error);
          if (isMounted) setLoading(false);
          return;
        }
        
        if (isMounted && fetchResult) {
          // Merge with cached local data to preserve client-only properties (e.g. coordinates, geometry, etc.)
          const cachedMap = new Map((initialAllData || []).map((item: any) => [item.id, item]));
          const mergedFetchResult = fetchResult.map((dbItem: any) => {
            const cachedItem = cachedMap.get(dbItem.id);
            if (cachedItem) {
              return { ...cachedItem, ...dbItem };
            }
            return dbItem;
          }) as T[];

          setData(mergedFetchResult);
          setLoading(false);

          // Update general cache store safely by removing old keys matching the filter and adding the new ones
          const currentStoreCached = localStorage.getItem(localKey);
          let storeItems: T[] = [];
          if (currentStoreCached) {
            try { storeItems = JSON.parse(currentStoreCached); } catch {}
          }
          
          if (filterColumn && filterValue !== undefined) {
            storeItems = storeItems.filter(
              (item: any) => String(item[filterColumn]) !== String(filterValue)
            );
          } else {
            storeItems = [];
          }
          
          const updatedStore = [...storeItems, ...mergedFetchResult];
          localStorage.setItem(localKey, JSON.stringify(updatedStore));
        }
      } catch (err) {
        console.warn(`Exception fetching filtered ${collectionName}, relying on local storage fallback:`, err);
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime changes with filter
    const filterString = filterColumn && filterValue !== undefined ? `${filterColumn}=eq.${filterValue}` : undefined;
    
    const updateLocalCache = (action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => {
      if (!isMounted) return;
      const stored = localStorage.getItem(localKey);
      let storeItems: T[] = [];
      if (stored) {
        try { storeItems = JSON.parse(stored); } catch {}
      }

      if (action === 'INSERT') {
        if (!storeItems.some((x: T) => x.id === payload.id)) {
          storeItems.push(payload);
        }
      } else if (action === 'UPDATE') {
        storeItems = storeItems.map((item: T) => item.id === payload.id ? { ...item, ...payload } : item);
      } else if (action === 'DELETE') {
        storeItems = storeItems.filter((item: T) => item.id !== payload.id);
      }

      // Save updated entire store to local cache
      localStorage.setItem(localKey, JSON.stringify(storeItems));

      // Filter and set data state for this filtered list hook
      setData(() => {
        if (filterColumn && filterValue !== undefined) {
          return storeItems.filter((item: any) => String(item[filterColumn]) === String(filterValue));
        }
        return storeItems;
      });
    };

    const channel = supabase
      .channel(`public:${collectionName}:${filterColumn}:${filterValue}:${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: collectionName,
        filter: filterString
      }, payload => {
        updateLocalCache('INSERT', payload.new);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: collectionName,
        filter: filterString
      }, payload => {
        updateLocalCache('UPDATE', payload.new);
      })
      .on('postgres_changes', { 
        event: 'DELETE', 
        schema: 'public', 
        table: collectionName,
        filter: filterString
      }, payload => {
        updateLocalCache('DELETE', { id: payload.old.id });
      })
      .subscribe();

    // Inter-component notification for real-time local sync offline
    const handleLocalSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || !isMounted) return;
      const { collectionName: colName, action, payload } = customEvent.detail;
      if (colName !== collectionName) return;

      updateLocalCache(action, payload);
    };

    window.addEventListener('supabase_local_sync', handleLocalSync);

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      window.removeEventListener('supabase_local_sync', handleLocalSync);
    };
  }, [collectionName, filterColumn, filterValue]);

  return { data, loading };
}
