import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabaseCollection } from '../hooks/useSupabase';
import { City } from '../types';

type CityContextType = {
  globalCity: string;
  setGlobalCity: (city: string) => void;
  cities: string[];
  cityObjects: City[];
  addCity: (name: string) => Promise<void>;
  deleteCity: (name: string) => Promise<void>;
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [globalCity, setGlobalCity] = useState(() => {
    return localStorage.getItem("googly_global_city") || "All Cities";
  });
  
  const { data: cityObjects, addItem, deleteItem } = useSupabaseCollection<City>("cities");
  
  const cities = React.useMemo(() => {
    return cityObjects.map(c => c.name);
  }, [cityObjects]);

  useEffect(() => {
    localStorage.setItem("googly_global_city", globalCity);
  }, [globalCity]);

  const addCity = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (cities.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    await addItem({ name, pincode_prefix: '' });
  };

  const deleteCity = async (name: string) => {
    const cityObj = cityObjects.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (cityObj) {
      await deleteItem(cityObj.id);
      if (globalCity.toLowerCase() === name.toLowerCase()) {
        setGlobalCity("All Cities");
      }
    }
  };

  return (
    <CityContext.Provider value={{ globalCity, setGlobalCity, cities, cityObjects, addCity, deleteCity }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCityContext = () => {
  const context = useContext(CityContext);
  if (!context) throw new Error('useCityContext must be used within a CityProvider');
  return context;
};
