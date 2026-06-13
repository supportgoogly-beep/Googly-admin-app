import React, { createContext, useContext, useState } from 'react';

type CityContextType = {
  globalCity: string;
  setGlobalCity: (city: string) => void;
};

const CityContext = createContext<CityContextType | undefined>(undefined);

export const CityProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [globalCity, setGlobalCity] = useState("Kolkata");
  return (
    <CityContext.Provider value={{ globalCity, setGlobalCity }}>
      {children}
    </CityContext.Provider>
  );
};

export const useCityContext = () => {
  const context = useContext(CityContext);
  if (!context) throw new Error('useCityContext must be used within a CityProvider');
  return context;
};
