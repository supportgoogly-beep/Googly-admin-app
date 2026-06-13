import React, { useState } from "react";
import { 
  Building, User, Check, Trash2, PlusCircle, AlertTriangle, 
  Settings, ShoppingBag, Truck, Info, HelpCircle, FileText, Send, X,
  ExternalLink, Search, Sparkles
} from "lucide-react";
import { MOCK_HUBS, MOCK_MANAGERS } from "./GeofencingMockData";
import { AreaZoneConfig, DeliveryHub, LocalManager } from "./GeofencingTypes";

interface GeofencingZoneConfigPanelProps {
  areaForm: Partial<AreaZoneConfig>;
  setAreaForm: React.Dispatch<React.SetStateAction<Partial<AreaZoneConfig>>>;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function GeofencingZoneConfigPanel({
  areaForm,
  setAreaForm,
  onSave,
  onCancel,
  isEditing,
  triggerToast
}: GeofencingZoneConfigPanelProps) {
  // Pin code additions state
  const [newPinCodeInput, setNewPinCodeInput] = useState("");
  const [bulkPinInput, setBulkPinInput] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Auto suggest area/city maps when primary pin changes
  const handlePrimaryPinChange = (pin: string) => {
    setAreaForm(prev => {
      const update: Partial<AreaZoneConfig> = { ...prev, primaryPinCode: pin };
      
      // Auto suggestion rule
      if (pin.startsWith("70009")) {
        update.city = "Kolkata";
        update.state = "West Bengal";
        update.name = prev.name || "Salt Lake Sector V";
      } else if (pin.startsWith("70001")) {
        update.city = "Kolkata";
        update.state = "West Bengal";
        update.name = prev.name || "Park Street Corridor";
      } else if (pin.startsWith("71110")) {
        update.city = "Howrah";
        update.state = "West Bengal";
        update.name = prev.name || "Howrah Central Segment";
      }
      return { ...prev, ...update };
    });
  };

  // Add tag-like additional pin codes
  const handleAddAdditionalPin = () => {
    if (!newPinCodeInput) return;
    if (!/^\d{6}$/.test(newPinCodeInput)) {
      triggerToast("Validation Alert", "Pin codes must follow a 6-digit numeric sequence.", "error");
      return;
    }
    const current = areaForm.additionalPinCodes || [];
    if (current.includes(newPinCodeInput)) {
      triggerToast("Duplicate Pin Code", "This pin code is already linked.", "info");
      return;
    }
    setAreaForm(prev => ({
      ...prev,
      additionalPinCodes: [...(prev.additionalPinCodes || []), newPinCodeInput]
    }));
    setNewPinCodeInput("");
    triggerToast("Pin Code Registered", `Link assigned to ${newPinCodeInput}`, "success");
  };

  const handleRemoveAdditionalPin = (pin: string) => {
    setAreaForm(prev => ({
      ...prev,
      additionalPinCodes: (prev.additionalPinCodes || []).filter(p => p !== pin)
    }));
    triggerToast("Pin Code Unassigned", `Terminated linkage with ${pin}`, "info");
  };

  // Bulk Pin Code Import Tool
  const handleBulkPinSubmit = () => {
    if (!bulkPinInput) return;
    const codes = bulkPinInput
      .split(/[\s,;\n]+/)
      .map(c => c.trim())
      .filter(c => /^\d{6}$/.test(c));

    if (codes.length === 0) {
      triggerToast("No Valid PINs", "Could not capture 6-digit numeric configurations.", "error");
      return;
    }

    const current = areaForm.additionalPinCodes || [];
    const uniqueIncoming = codes.filter(c => !current.includes(c));

    setAreaForm(prev => ({
      ...prev,
      additionalPinCodes: [...(prev.additionalPinCodes || []), ...uniqueIncoming]
    }));

    triggerToast("Bulk PINs Linked", `Successfully validated and linked ${uniqueIncoming.length} additional nodes.`, "success");
    setBulkPinInput("");
    setShowBulkImport(false);
  };

  // Fetch linked Hub details to display current state summary
  const selectedHub = MOCK_HUBS.find(h => h.id === areaForm.assignedHubId);
  // Fetch linked Manager details
  const selectedManager = MOCK_MANAGERS.find(m => m.id === areaForm.assignedManagerId);

  return (
    <form onSubmit={onSave} className="space-y-6 text-xs font-medium">
      
      {/* -------------------- STEP A: BASIC INFORMATION -------------------- */}
      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-150 dark:border-slate-800">
        <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4" /> Basic Zone Information
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[10px]">Delivery Area Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Salt Lake High-Density Corridor"
              value={areaForm.name || ""}
              onChange={(e) => setAreaForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[10px]">Area Code (Auto)</label>
            <input
              type="text"
              disabled
              value={areaForm.code || "EZ-KOL-700XXX"}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-gray-50 dark:bg-slate-900 text-gray-400 font-bold font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-gray-400 font-extrabold uppercase text-[10px]">SLA Operational Description</label>
          <textarea
            placeholder="Operational guidelines, target dispatch times, peak hour concerns..."
            value={areaForm.description || ""}
            onChange={(e) => setAreaForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold h-16"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[10px]">Operational Status</label>
            <select
              value={areaForm.status || "Draft"}
              onChange={(e) => setAreaForm(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold"
            >
              <option value="Active">Active (Serving Orders)</option>
              <option value="Inactive">Inactive (Shut Down temporarily)</option>
              <option value="Draft">Draft (Planning Sandbox)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[10px]">Zone Boundary Color Hex</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={areaForm.color || "#3b82f6"}
                onChange={(e) => setAreaForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-11 h-11 p-1 rounded-xl bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-750 cursor-pointer"
              />
              <input
                type="text"
                placeholder="#3b82f6"
                value={areaForm.color || ""}
                onChange={(e) => setAreaForm(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold font-mono text-center uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* -------------------- STEP B: PIN CODE MAPPINGS -------------------- */}
      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-150 dark:border-slate-800">
        <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> Pin Code Service Allocation</span>
          <button
            type="button"
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
          >
            {showBulkImport ? "Cancel Bulk Input" : "Bulk PIN Code Import"}
          </button>
        </h4>

        {showBulkImport ? (
          <div className="space-y-2 bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-dashed border-gray-300 dark:border-slate-800">
            <span className="text-[10px] text-gray-400 block font-bold leading-normal">
              Enter multiple 6-digit pin codes separated by commas, spaces, or lines:
            </span>
            <textarea
              placeholder="e.g. 700091, 700102, 700156"
              value={bulkPinInput}
              onChange={(e) => setBulkPinInput(e.target.value)}
              className="w-full p-2 border border-gray-200 dark:border-slate-750 bg-transparent text-slate-800 dark:text-white rounded-xl font-mono text-center h-16"
            />
            <button
              type="button"
              onClick={handleBulkPinSubmit}
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black cursor-pointer"
            >
              Parse & Validate PIN Pack
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-gray-400 font-extrabold uppercase text-[10px]">Primary PIN Code</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="700091"
                value={areaForm.primaryPinCode || ""}
                onChange={(e) => handlePrimaryPinChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold font-mono text-center"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 font-extrabold uppercase text-[10px]">Target Municipality</label>
              <input
                type="text"
                placeholder="Kolkata"
                value={areaForm.city || ""}
                onChange={(e) => setAreaForm(prev => ({ ...prev, city: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 font-extrabold uppercase text-[10px]">Provincial State</label>
              <input
                type="text"
                value={areaForm.state || "West Bengal"}
                onChange={(e) => setAreaForm(prev => ({ ...prev, state: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold"
              />
            </div>
          </div>
        )}

        {/* Linked PIN tags rendering */}
        <div className="space-y-2">
          <label className="text-gray-400 font-extrabold uppercase text-[10px] block">Serviceable Linked Pin Codes ({areaForm.additionalPinCodes?.length || 0})</label>
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-950 border border-gray-150 dark:border-slate-800 min-h-[44px]">
            {areaForm.additionalPinCodes?.length === 0 ? (
              <span className="text-gray-400 italic text-[10px] p-1 font-semibold">No additional pin codes mapped yet. Use the selector below.</span>
            ) : (
              areaForm.additionalPinCodes?.map(pin => (
                <span key={pin} className="px-2.5 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-black flex items-center gap-1">
                  {pin}
                  <button type="button" onClick={() => handleRemoveAdditionalPin(pin)} className="text-rose-500 hover:text-rose-700 font-bold focus:outline-none">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              placeholder="Add code (e.g. 700102)"
              value={newPinCodeInput}
              onChange={(e) => setNewPinCodeInput(e.target.value)}
              className="p-2 ... w-36 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 font-mono text-center"
            />
            <button
              type="button"
              onClick={handleAddAdditionalPin}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-black cursor-pointer"
            >
              Add Code Tag
            </button>
          </div>
        </div>
      </div>

      {/* -------------------- STEP C: DELIVERY HUB ASSIGNMENT -------------------- */}
      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-150 dark:border-slate-800">
        <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5">
          <Building className="w-4 h-4" /> Delivery Logistics Hub Allocation
        </h4>

        <div className="space-y-1">
          <label className="text-gray-400 font-extrabold uppercase text-[10px]">Select Dispatch Logistics Hub</label>
          <select
            value={areaForm.assignedHubId || ""}
            onChange={(e) => setAreaForm(prev => ({ ...prev, assignedHubId: e.target.value }))}
            className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold"
          >
            <option value="">-- No Hub Linkages allocated --</option>
            {MOCK_HUBS.map(hub => (
              <option key={hub.id} value={hub.id}>
                {hub.name} ({hub.code} | Max Capacity {hub.maxCapacity} orders)
              </option>
            ))}
          </select>
        </div>

        {selectedHub && (
          <div className="p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-slate-800 space-y-2 relative shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-black text-gray-900 dark:text-slate-100 block">{selectedHub.name}</span>
                <span className="text-[9px] text-gray-400 font-mono font-bold block">{selectedHub.address}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase">
                Linked Active
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1.5 border-t border-gray-100/10 font-bold">
              <div>
                <span className="text-gray-400 block text-[9px]">Active Orders</span>
                <span className="text-rose-500 text-xs font-black font-mono">{selectedHub.stats.activeOrders}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px]">Couriers Idle</span>
                <span className="text-emerald-500 text-xs font-black font-mono">{selectedHub.stats.availableRiders}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px]">Linked Vendors</span>
                <span className="text-blue-500 text-xs font-black font-mono">{selectedHub.stats.assignedRestaurants}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- STEP D: LOCAL MANAGER ASSIGNMENT -------------------- */}
      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-150 dark:border-slate-800">
        <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5">
          <User className="w-4 h-4" /> Assigned Local Operations Manager
        </h4>

        <div className="space-y-1">
          <label className="text-gray-400 font-extrabold uppercase text-[10px]">Select Operational Staff Lead</label>
          <select
            value={areaForm.assignedManagerId || ""}
            onChange={(e) => setAreaForm(prev => ({ ...prev, assignedManagerId: e.target.value }))}
            className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold"
          >
            <option value="">-- No Supervisor Allocated --</option>
            {MOCK_MANAGERS.map(mgr => (
              <option key={mgr.id} value={mgr.id}>
                {mgr.name} ({mgr.role} | ID: {mgr.employeeId})
              </option>
            ))}
          </select>
        </div>

        {selectedManager && (
          <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
            <div>
              <span className="text-gray-800 dark:text-white block font-extrabold">{selectedManager.name}</span>
              <span className="text-gray-405 block text-[9px] font-semibold">{selectedManager.email}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-450 block font-mono font-bold text-[9px]">{selectedManager.employeeId}</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] uppercase tracking-wide">
                {selectedManager.role}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* -------------------- STEP E: DELIVERY SETTINGS -------------------- */}
      <div className="space-y-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-150 dark:border-slate-800">
        <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5">
          <Settings className="w-4 h-4" /> Granular Operational Configurations
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[9px]">Base Delivery Fee</label>
            <div className="relative">
              <input
                type="number"
                value={areaForm.baseDeliveryFee || 0}
                onChange={(e) => setAreaForm(prev => ({ ...prev, baseDeliveryFee: Number(e.target.value) }))}
                className="w-full p-2.5 pl-6 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold font-mono"
              />
              <span className="absolute left-2.5 top-3.5 text-gray-400 font-bold">₹</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[9px]">Per KM Base Charge</label>
            <div className="relative">
              <input
                type="number"
                value={areaForm.perKmCharge || 0}
                onChange={(e) => setAreaForm(prev => ({ ...prev, perKmCharge: Number(e.target.value) }))}
                className="w-full p-2.5 pl-6 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold font-mono"
              />
              <span className="absolute left-2.5 top-3.5 text-gray-400 font-bold">₹</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[9px]">Max Radius Scope</label>
            <div className="relative">
              <input
                type="number"
                value={areaForm.maxDeliveryRadius || 0}
                onChange={(e) => setAreaForm(prev => ({ ...prev, maxDeliveryRadius: Number(e.target.value) }))}
                className="w-full p-2.5 pr-8 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold font-mono"
              />
              <span className="absolute right-2.5 top-3.5 text-gray-400 font-bold">km</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[9px]">Min Checkout Value</label>
            <div className="relative">
              <input
                type="number"
                value={areaForm.minOrderValue || 0}
                onChange={(e) => setAreaForm(prev => ({ ...prev, minOrderValue: Number(e.target.value) }))}
                className="w-full p-2.5 pl-6 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold font-mono"
              />
              <span className="absolute left-2.5 top-3.5 text-gray-400 font-bold">₹</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[9px]">Free Delivery Thresh</label>
            <div className="relative">
              <input
                type="number"
                value={areaForm.freeDeliveryThreshold || 0}
                onChange={(e) => setAreaForm(prev => ({ ...prev, freeDeliveryThreshold: Number(e.target.value) }))}
                className="w-full p-2.5 pl-6 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold font-mono"
              />
              <span className="absolute left-2.5 top-3.5 text-gray-400 font-bold">₹</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-gray-400 font-extrabold uppercase text-[9px]">Average Direct ETA</label>
            <div className="relative">
              <input
                type="number"
                value={areaForm.avgDeliveryTime || 0}
                onChange={(e) => setAreaForm(prev => ({ ...prev, avgDeliveryTime: Number(e.target.value) }))}
                className="w-full p-2.5 pr-11 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-950 text-slate-800 dark:text-white font-bold font-mono"
              />
              <span className="absolute right-2.5 top-3.5 text-gray-400 font-bold">mins</span>
            </div>
          </div>
        </div>

        {/* Dynamic Surge Toggle options */}
        <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-black text-gray-900 dark:text-slate-100 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Peak Area Surge Pricing (Dynamic)
            </span>
            <span className="text-[9px] text-gray-400 font-semibold block">Auto spikes rates by coefficient value when courier supply dwindles</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={areaForm.peakHourMultiplier || 1.0}
              onChange={(e) => setAreaForm(prev => ({ ...prev, peakHourMultiplier: Number(e.target.value) }))}
              className="p-1 rounded bg-gray-100 dark:bg-slate-850 border border-transparent text-[10px] font-black"
            >
              <option value="1.0">Standard (1.0x)</option>
              <option value="1.25">Moderate (+25%)</option>
              <option value="1.5">Heavy Rush (+50%)</option>
              <option value="1.8">Critical Surge (1.8x)</option>
            </select>
            <input
              type="checkbox"
              checked={areaForm.surgePricingEnabled || false}
              onChange={(e) => setAreaForm(prev => ({ ...prev, surgePricingEnabled: e.target.checked }))}
              className="rounded border-slate-800 accent-rose-500 bg-transparent w-4 h-4"
            />
          </div>
        </div>
      </div>

      {/* -------------------- ACTION CONTROL BUTTONS -------------------- */}
      <div className="flex gap-2.5 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-slate-800 dark:text-slate-100 text-xs font-black rounded-xl cursor-pointer"
        >
          Cancel Drafting
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#E23744] hover:bg-red-650 text-white text-xs font-black rounded-xl cursor-pointer shadow-md flex items-center gap-1"
        >
          <Check className="w-4 h-4" /> {isEditing ? "Apply Changes" : "Save Service Area"}
        </button>
      </div>

    </form>
  );
}
