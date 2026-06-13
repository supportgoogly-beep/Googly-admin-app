import React, { createContext, useContext, useState, useEffect } from 'react';

type CityContextType = {
  globalCity: string;
  setGlobalCity: (city: string) => void;
  cities: string[];
  addCity: (city: string) => void;
  deleteCity: (city: string) => void;
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [globalCity, setGlobalCity] = useState(() => {
    return localStorage.getItem("googly_global_city") || "Kolkata";
  });
  
  const [cities, setCities] = useState<string[]>(() => {
    const saved = localStorage.getItem("googly_cities");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return ["Kolkata", "Howrah", "New Town", "Udaipur"];
  });

  useEffect(() => {
    localStorage.setItem("googly_global_city", globalCity);
  }, [globalCity]);

  useEffect(() => {
    localStorage.setItem("googly_cities", JSON.stringify(cities));
  }, [cities]);

  const addCity = (newCity: string) => {
    const trimmed = newCity.trim();
    if (!trimmed) return;
    if (cities.some(c => c.toLowerCase() === trimmed.toLowerCase())) return;
    setCities(prev => [...prev, trimmed]);
  };

  const deleteCity = (cityToDelete: string) => {
    setCities(prev => prev.filter(c => c.toLowerCase() !== cityToDelete.toLowerCase()));
    if (globalCity.toLowerCase() === cityToDelete.toLowerCase()) {
      setGlobalCity("All Cities");
    }
  };

  return (
    <CityContext.Provider value={{ globalCity, setGlobalCity, cities, addCity, deleteCity }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCityContext = () => {
  const context = useContext(CityContext);
  if (!context) throw new Error('useCityContext must be used within a CityProvider');
  return context;
};
