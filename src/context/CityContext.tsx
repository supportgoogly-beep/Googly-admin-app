import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseCollection } from '../hooks/useSupabase';
import { City } from '../types';
import { RefreshCw } from "lucide-react";

type CityContextType = {
  globalCity: string;
  setGlobalCity: (city: string) => void;
  cities: string[];
  cityObjects: City[];
  addCity: (name: string) => Promise<void>;
  deleteCity: (name: string) => Promise<void>;
  softDeletedCities: string[];
  restoreCity: (name: string) => void;
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [globalCity, setGlobalCity] = useState(() => {
    return localStorage.getItem("googly_global_city") || "All Cities";
  });
  
  const [softDeletedCities, setSoftDeletedCities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("googly_soft_deleted_cities");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { data: cityObjects, addItem, deleteItem } = useSupabaseCollection<City>("cities");
  
  const cities = React.useMemo(() => {
    return cityObjects
      .map(c => c.name)
      .filter(name => !softDeletedCities.some(sd => sd.toLowerCase() === name.toLowerCase()));
  }, [cityObjects, softDeletedCities]);

  useEffect(() => {
    localStorage.setItem("googly_global_city", globalCity);
  }, [globalCity]);

  useEffect(() => {
    localStorage.setItem("googly_soft_deleted_cities", JSON.stringify(softDeletedCities));
  }, [softDeletedCities]);

  const addCity = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Check if it is in soft-deleted, if yes, restore it!
    const inSoftDeleted = softDeletedCities.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (inSoftDeleted) {
      restoreCity(trimmed);
      return;
    }
    if (cities.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    await addItem({ name, pincode_prefix: '' });
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTargetCity, setRefreshTargetCity] = useState("");

  const changeCityWithRefresh = (city: string) => {
    if (city === globalCity && !isRefreshing) return;
    localStorage.setItem("googly_global_city", city);
    setGlobalCity(city);
    setRefreshTargetCity(city);
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const deleteCity = async (name: string) => {
    const cityObj = cityObjects.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (cityObj) {
      await deleteItem(cityObj.id);
      if (globalCity.toLowerCase() === name.toLowerCase()) {
        localStorage.setItem("googly_global_city", "All Cities");
        setGlobalCity("All Cities");
      }
    }
  };

  const restoreCity = (name: string) => {
    setSoftDeletedCities(prev => prev.filter(c => c.toLowerCase() !== name.toLowerCase()));
  };

  return (
    <CityContext.Provider value={{ globalCity, setGlobalCity: changeCityWithRefresh, cities, cityObjects, addCity, deleteCity, softDeletedCities, restoreCity }}>
      {children}
      {isRefreshing && (
        <div id="city-refresh-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-[99999] p-6 text-white">
          <div className="relative flex flex-col items-center max-w-sm text-center">
            {/* Spinning loader */}
            <div className="p-5 bg-red-500/10 rounded-full border border-red-500/20 mb-6 animate-pulse">
              <RefreshCw className="w-12 h-12 text-[#E23744] animate-spin" />
            </div>
            
            {/* Context title */}
            <h3 className="text-sm font-black tracking-widest mb-2 uppercase text-[#E23744] font-mono">
              SYSTEM RE-INITIALIZING
            </h3>
            
            <p className="text-xs font-bold text-gray-300 mb-6">
              Locking operational matrix onto: <span className="bg-[#E23744] text-white px-2.5 py-1 rounded-md border border-red-500/30 font-black tracking-wide ml-1 uppercase">{refreshTargetCity || "All Cities"}</span>
            </p>
            
            <div className="text-[11px] text-gray-400 font-medium space-y-1">
              <p className="animate-pulse">Loading active order nodes & delivery corridors...</p>
              <p className="text-gray-500">Updating live geofending buffers & personnel dashboards</p>
            </div>
          </div>
        </div>
      )}
    </CityContext.Provider>
  );
};

export const useCityContext = () => {
  const context = useContext(CityContext);
  if (!context) throw new Error('useCityContext must be used within a CityProvider');
  return context;
};
