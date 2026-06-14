import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Helper to generate a simple unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Known database tables and their schema columns to filter out unmapped client-only attributes
const TABLE_COLUMNS: { [key: string]: string[] } = {
  cities: ["id", "name", "pincode_prefix", "created_at"],
  areas: ["id", "city_id", "name", "pincode", "created_at"],
  profiles: ["id", "auth_id", "name", "email", "phone", "city_id", "role", "wallet_balance", "is_blocked", "created_at"],
  user_addresses: ["id", "user_id", "address_type", "address_text", "pincode", "latitude", "longitude"],
  restaurants: ["id", "user_id", "city_id", "name", "phone", "address", "latitude", "longitude", "is_active", "is_verified", "auto_accept_orders", "voice_alerts_enabled", "created_at"],
  restaurant_documents: ["restaurant_id", "fssai_number", "fssai_doc_url", "gst_number", "pan_card_url", "kyc_doc_url", "bank_name", "bank_account_no", "bank_ifsc", "updated_at"],
  menu_categories: ["id", "restaurant_id", "name", "sort_order"],
  menu_items: ["id", "category_id", "restaurant_id", "name", "description", "price", "is_veg", "image_url", "addons_config", "is_available", "created_at"],
  riders: ["id", "city_id", "vehicle_number", "vehicle_type", "current_status", "wallet_balance", "is_verified", "created_at"],
  rider_documents: ["rider_id", "driving_license_no", "dl_image_url", "aadhaar_number", "aadhaar_front_url", "aadhaar_back_url", "pan_number", "pan_card_url", "updated_at"],
  rider_locations: ["rider_id", "location", "latitude", "longitude", "updated_at"],
  city_staff: ["id", "city_id", "designation", "name", "email", "role", "active", "phone", "department", "avatar", "employee_id", "security", "permissions_override", "created_at"],
  staff_permissions: ["staff_id", "module_name", "can_view", "can_edit", "can_delete"],
  surge_settings: ["id", "is_surge_enabled", "surge_multiplier", "updated_at"],
  surge_zones: ["id", "zone_id"],
  orders: ["id", "user_id", "area_id", "restaurant_id", "rider_id", "zone_id", "city_id", "status", "order_items", "sub_total", "delivery_charge", "surge_charge", "coupon_discount", "tax_amount", "grand_total", "payment_mode", "payment_status", "cancel_reason", "dest_latitude", "dest_longitude", "auto_assign_enabled", "created_at", "updated_at"],
  order_status_logs: ["id", "order_id", "status", "updated_by", "created_at"],
  coupons: ["id", "code", "title", "discount_type", "discount_value", "min_order_value", "max_discount", "start_date", "end_date", "is_active", "created_at"],
  coupons_restaurants: ["coupon_id", "restaurant_id"],
  global_commissions: ["id", "restaurant_commission_pct", "rider_commission_pct"],
  payouts_ledger: ["id", "entity_type", "entity_id", "order_id", "amount_owed", "type", "status", "created_at"],
  payout_settlements: ["id", "entity_type", "batch_amount", "status", "processed_by", "created_at"],
  refund_requests: ["id", "order_id", "user_id", "amount", "reason", "status", "reject_reason", "created_at"],
  support_tickets: ["id", "user_id", "order_id", "subject", "status", "created_at"],
  tickets_chat: ["id", "ticket_id", "sender_id", "message", "created_at"],
  reviews: ["id", "order_id", "user_id", "restaurant_rating", "rider_rating", "review_text", "is_hidden_frontend", "created_at"],
  push_notifications: ["id", "user_id", "title", "body", "image_url", "type", "sent_at"],
  cms_banners: ["id", "image_url", "redirection_link", "is_published", "created_at"],
  loyalty_settings: ["id", "rupees_per_coin", "coins_rewarded"],
  loyalty_ledger: ["id", "user_id", "coins", "reason", "created_at"],
  penalty_policies: ["id", "cancel_after_minutes", "penalty_percentage", "applicable_to"],
  app_settings: ["id", "force_app_update", "maintenance_mode", "enable_cod", "gst_percentage", "delivery_tax_percentage", "updated_at"],
  admin_logs: ["id", "admin_id", "action_performed", "ip_address", "created_at"],
  zones: ["id", "city_id", "name", "is_active", "created_at"],
};

function cleanPayloadForDb(tableName: string, payload: any): any {
  const allowed = TABLE_COLUMNS[tableName];
  if (!allowed) return payload;
  
  const cleaned: any = {};
  for (const key of Object.keys(payload)) {
    if (payload[key] === undefined || payload[key] === null) continue;
    
    // Direct matches
    if (allowed.includes(key)) {
      cleaned[key] = payload[key];
    } else {
      // Map camelCase keys to snake_case equivalent
      const snake = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowed.includes(snake)) {
        cleaned[snake] = payload[key];
      }
    }
  }
  return cleaned;
}

export function useSupabaseCollection<T extends { id: string }>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const localKey = `local_supabase_${collectionName}`;

  useEffect(() => {
    let isMounted = true;

    // Load from local storage cache first for zero-latency start & robust fallback
    const cached = localStorage.getItem(localKey);
    let initialLocalData: T[] = [];
    if (cached) {
      try {
        initialLocalData = JSON.parse(cached);
        setData(initialLocalData);
      } catch (e) {
        console.error("Failed to parse cached data for " + collectionName);
      }
    }

    const fetchData = async () => {
      try {
        const { data: fetchResult, error } = await supabase
          .from(collectionName)
          .select('*');
        
        if (error) {
          console.warn(`Error fetching ${collectionName} from Supabase, relying on localStorage:`, error);
          if (isMounted) setLoading(false);
          return;
        }
        
        if (isMounted && fetchResult) {
          // Merge with cached local data to preserve client-only properties (like coordinates, polygons, etc.)
          const cachedMap = new Map((initialLocalData || []).map((item: any) => [item.id, item]));
          const merged = fetchResult.map((dbItem: any) => {
            const cachedItem = cachedMap.get(dbItem.id);
            if (cachedItem) {
              return { ...cachedItem, ...dbItem };
            }
            return dbItem;
          }) as T[];

          setData(merged);
          localStorage.setItem(localKey, JSON.stringify(merged));
          setLoading(false);
        }
      } catch (err) {
        console.warn(`Exception fetching ${collectionName}, relying on local storage fallback:`, err);
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime database changes
    const channel = supabase
      .channel(`public:${collectionName}:${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: collectionName }, payload => {
        if (isMounted) {
          setData(current => {
            const exists = current.some(x => x.id === payload.new.id);
            if (exists) return current;
            const updated = [...current, payload.new as T];
            localStorage.setItem(localKey, JSON.stringify(updated));
            return updated;
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: collectionName }, payload => {
        if (isMounted) {
          setData(current => {
            const updated = current.map(item => item.id === payload.new.id ? payload.new as T : item);
            localStorage.setItem(localKey, JSON.stringify(updated));
            return updated;
          });
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: collectionName }, payload => {
        if (isMounted) {
          setData(current => {
            const updated = current.filter(item => item.id !== payload.old.id);
            localStorage.setItem(localKey, JSON.stringify(updated));
            return updated;
          });
        }
      })
      .subscribe();

    // Inter-tab or inter-component local synchronization when offline / using local storage
    const handleLocalSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || !isMounted) return;
      const { collectionName: colName, action, payload } = customEvent.detail;
      if (colName !== collectionName) return;

      setData(current => {
        let updated = [...current];
        if (action === 'INSERT') {
          if (!updated.some(x => x.id === payload.id)) {
            updated.push(payload);
          }
        } else if (action === 'UPDATE') {
          updated = updated.map(item => item.id === payload.id ? { ...item, ...payload } : item);
        } else if (action === 'DELETE') {
          updated = updated.filter(item => item.id !== payload.id);
        }
        localStorage.setItem(localKey, JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('supabase_local_sync', handleLocalSync);

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      window.removeEventListener('supabase_local_sync', handleLocalSync);
    };
  }, [collectionName]);

  const addItem = async (item: Omit<T, 'id'> & { id?: string }) => {
    const generated = { id: item.id || generateId(), ...item } as unknown as T;

    // Dispatch event immediately for instant local UI update across all components
    window.dispatchEvent(
      new CustomEvent('supabase_local_sync', {
        detail: { collectionName, action: 'INSERT', payload: generated }
      })
    );

    // Try to sync with Supabase in the background
    try {
      const cleanItem = cleanPayloadForDb(collectionName, generated);
      const { data: insertedData, error } = await supabase
        .from(collectionName)
        .insert([cleanItem])
        .select();

      if (!error && insertedData && insertedData.length > 0) {
        const dbResult = insertedData[0] as T;
        // Broadcast the real DB item to replace mock representation
        window.dispatchEvent(
          new CustomEvent('supabase_local_sync', {
            detail: { collectionName, action: 'UPDATE', payload: { id: generated.id, ...dbResult } }
          })
        );
        return insertedData;
      } else {
        console.warn(`Supabase insertion warning for ${collectionName}:`, error);
      }
    } catch (err) {
      console.warn(`Supabase write exception for ${collectionName}, using local model:`, err);
    }

    return [generated];
  };

  const updateItem = async (id: string, updates: Partial<T>) => {
    // Notify locally immediately
    window.dispatchEvent(
      new CustomEvent('supabase_local_sync', {
        detail: { collectionName, action: 'UPDATE', payload: { id, ...updates } }
      })
    );

    try {
      const cleanUpdates = cleanPayloadForDb(collectionName, updates);
      const { error } = await supabase
        .from(collectionName)
        .update(cleanUpdates)
        .eq('id', id);

      if (error) {
        console.warn(`Supabase update error for ${collectionName}:`, error);
      }
    } catch (err) {
      console.warn(`Supabase update exception for ${collectionName}:`, err);
    }
  };

  const deleteItem = async (id: string) => {
    // Notify locally immediately
    window.dispatchEvent(
      new CustomEvent('supabase_local_sync', {
        detail: { collectionName, action: 'DELETE', payload: { id } }
      })
    );

    try {
      const { error } = await supabase
        .from(collectionName)
        .delete()
        .eq('id', id);

      if (error) {
        console.warn(`Supabase delete error for ${collectionName}:`, error);
      }
    } catch (err) {
      console.warn(`Supabase delete exception for ${collectionName}:`, err);
    }
  };

  return { data, loading, addItem, updateItem, deleteItem };
}
