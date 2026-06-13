import React, { useState } from 'react';
import { useCityContext } from '../context/CityContext';
import { useSupabaseFilteredCollection } from '../hooks/useSupabaseFiltered';
import { useSupabaseCollection } from '../hooks/useSupabase';
import { Area } from '../types';
import { MapPin, Plus, Trash2, Loader2, Search } from 'lucide-react';

export default function AreaManagement() {
  const { globalCity, cityObjects } = useCityContext();
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaPincode, setNewAreaPincode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const currentCityObject = cityObjects.find(c => c.name === globalCity);
  const cityId = currentCityObject?.id;

  // Real-time filtered collection
  const { data: areas, loading } = useSupabaseFilteredCollection<Area>(
    'areas',
    cityId ? 'city_id' : undefined,
    cityId
  );

  // Generic collection for mutations
  const { addItem, deleteItem } = useSupabaseCollection<Area>('areas');

  const filteredAreas = areas.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.pincode.includes(searchQuery)
  );

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityId || !newAreaName || !newAreaPincode) return;

    try {
      await addItem({
        city_id: cityId,
        name: newAreaName,
        pincode: newAreaPincode
      });
      setNewAreaName("");
      setNewAreaPincode("");
    } catch (err) {
      console.error("Failed to add area:", err);
    }
  };

  const handleDeleteArea = async (id: string) => {
    try {
      await deleteItem(id);
    } catch (err) {
      console.error("Failed to delete area:", err);
    }
  };

  if (!cityId && globalCity !== "All Cities") {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Please select a specific city to manage areas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-600" />
            Operational Areas in {globalCity}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Real-time synchronization active for the {globalCity} regional node.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            placeholder="Search areas or pincodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-orange-500/20 focus:outline-none w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Area Form */}
        {cityId && (
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm h-fit">
            <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              Register New Area
            </h3>
            <form onSubmit={handleAddArea} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Area Name</label>
                <input 
                  type="text"
                  required
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="e.g. Salt Lake Sector V"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1.5 block">Pincode</label>
                <input 
                  type="text"
                  required
                  value={newAreaPincode}
                  onChange={(e) => setNewAreaPincode(e.target.value)}
                  placeholder="700091"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:bg-white transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Initialize Area Node
              </button>
            </form>
          </div>
        )}

        {/* Areas List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-400 italic text-xs">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-orange-500" />
              Syncing with regional grid...
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="p-20 text-center text-gray-400 italic text-xs">
              {searchQuery ? "No areas match your search parameters." : `No operational areas registered in ${globalCity} yet.`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-gray-400">Area Name</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-gray-400">Pincode</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAreas.map((area) => (
                    <tr key={area.id} className="hover:bg-slate-50/50 group transition-colors">
                      <td className="px-5 py-4">
                        <span className="text-xs font-black text-slate-800">{area.name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {area.pincode}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button 
                          onClick={() => handleDeleteArea(area.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
