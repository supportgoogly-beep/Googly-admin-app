import React, { useState, useMemo, useEffect } from "react";
import { 
  DollarSign, Sparkles, AlertTriangle, CloudRain, ShieldCheck, Clock, 
  Map, RefreshCw, Layers, Sliders, ChevronRight, CheckCircle2, 
  HelpCircle, Eye, AlertOctagon, HelpCircle as HelpIcon, Calendar, 
  Info, TrendingUp, Users, ArrowUpRight, Sun, Moon, MapPin, 
  Plus, Check, Trash2, ShieldAlert
} from "lucide-react";
import OSMInteractiveMap from "./OSMInteractiveMap";
import { GeofencingZone, Order, Rider, TrafficWeatherWidget } from "../types";

interface DynamicPricingModuleProps {
  currentTab: string;
  zones: GeofencingZone[];
  setZones: React.Dispatch<React.SetStateAction<GeofencingZone[]>>;
  orders: Order[];
  riders: Rider[];
  weatherWidget: TrafficWeatherWidget;
  setWeatherWidget: React.Dispatch<React.SetStateAction<TrafficWeatherWidget>>;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

interface CustomSchedule {
  id: string;
  eventName: string;
  multiplier: number;
  date: string;
  startTime: string;
  endTime: string;
  eventType: string;
  active: boolean;
}

interface CustomTimeSlot {
  id: string;
  name: string;
  start: string;
  end: string;
  multiplier: number;
  active: boolean;
}

interface PricingNotification {
  id: string;
  type: "success" | "warning" | "error" | "info";
  message: string;
  time: string;
}

export default function DynamicPricingModule({
  currentTab,
  zones,
  setZones,
  orders,
  riders,
  weatherWidget,
  setWeatherWidget,
  triggerToast
}: DynamicPricingModuleProps) {
  // Theme Toggle Mode
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // Master Surge Pricing Control
  const [surgeMaster, setSurgeMaster] = useState(true);
  const [showConfirmMasterModal, setShowConfirmMasterModal] = useState(false);
  const [targetMasterState, setTargetMasterState] = useState(true);

  // Search and selector filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Kolkata Metro");

  // Surge Multiplier Slider Config
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.8);
  const baseDeliveryFee = 40;

  // Surge Trigger Conditions States
  const [weatherRain, setWeatherRain] = useState(true);
  const [weatherThunder, setWeatherThunder] = useState(false);
  const [weatherFlood, setWeatherFlood] = useState(false);
  const [weatherExtremeHeat, setWeatherExtremeHeat] = useState(false);
  const [weatherCyclone, setWeatherCyclone] = useState(false);

  // Traffic
  const [trafficModerate, setTrafficModerate] = useState(true);
  const [trafficHeavy, setTrafficHeavy] = useState(true);
  const [trafficSevere, setTrafficSevere] = useState(false);
  const [trafficThreshold, setTrafficThreshold] = useState(72);

  // Peak Hour Configurations
  const [timeSlots, setTimeSlots] = useState<CustomTimeSlot[]>([
    { id: "slot-1", name: "Morning Rush", start: "08:00", end: "11:00", multiplier: 1.2, active: true },
    { id: "slot-2", name: "Lunch Rush", start: "12:00", end: "15:00", multiplier: 1.5, active: true },
    { id: "slot-3", name: "Evening Rush", start: "18:00", end: "22:00", multiplier: 2.0, active: true },
    { id: "slot-4", name: "Late Night", start: "23:00", end: "03:00", multiplier: 1.6, active: false }
  ]);

  // Zone Selection for Surge
  const [selectedZones, setSelectedZones] = useState<string[]>([
    "Central Zone", "North Zone", "South Zone", "High Demand Area", "Business District"
  ]);

  // Special Events Custom Configuration
  const [activeEventTypes, setActiveEventTypes] = useState<string[]>(["Festival", "Holiday"]);
  const [schedules, setSchedules] = useState<CustomSchedule[]>([
    { id: "ev-1", eventName: "Durga Puja Carnival", multiplier: 2.2, date: "2026-10-20", startTime: "12:00", endTime: "23:30", eventType: "Festival", active: true },
    { id: "ev-2", eventName: "New Year's Eve Rush", multiplier: 2.8, date: "2026-12-31", startTime: "18:00", endTime: "04:00", eventType: "Holiday", active: true },
    { id: "ev-3", eventName: "Eden Gardens T20 Match", multiplier: 1.9, date: "2026-06-25", startTime: "16:00", endTime: "23:00", eventType: "Sports Event", active: false }
  ]);

  // New Event Form Modal / inputs state
  const [newEventName, setNewEventName] = useState("");
  const [newEventMultiplier, setNewEventMultiplier] = useState(1.5);
  const [newEventDate, setNewEventDate] = useState("2026-06-15");
  const [newEventStart, setNewEventStart] = useState("18:00");
  const [newEventEnd, setNewEventEnd] = useState("22:00");
  const [newEventType, setNewEventType] = useState("Festival");
  const [showEventModal, setShowEventModal] = useState(false);

  // Active Interactive Map Zone details select
  const [mapFocusedZone, setMapFocusedZone] = useState<string>("Central Zone");

  // Scheduling changes modal
  const [showSchedulePublishModal, setShowSchedulePublishModal] = useState(false);
  const [publishDate, setPublishDate] = useState("2026-06-12");
  const [publishTime, setPublishTime] = useState("12:00");

  // Reset Confirmation Modal
  const [showResetModal, setShowResetModal] = useState(false);

  // Activity log tracking pricing configurations and modifiers
  const [pricingLogs, setPricingLogs] = useState<Array<{
    id: string;
    adminName: string;
    action: string;
    previousVal: string;
    newVal: string;
    timestamp: string;
  }>>([
    { id: "log-1", adminName: "System Automation", action: "Weather Rain Trigger activated standard surge modifier", previousVal: "1.0x", newVal: "1.5x", timestamp: "03:45 AM" },
    { id: "log-2", adminName: "Ruhan D.", action: "Tuned Evening Rush threshold multiplier", previousVal: "1.8x", newVal: "2.0x", timestamp: "02:30 AM" },
    { id: "log-3", adminName: "Sonia G.", action: "Added custom multiplier override for Durga Puja Carnival", previousVal: "1.5x", newVal: "2.2x", timestamp: "Yesterday 08:31 PM" }
  ]);

  // Dynamic system notifications / alerts feed
  const [notificationsAlerts, setNotificationsAlerts] = useState<PricingNotification[]>([
    { id: "n-1", type: "info", message: "Weather Alert: Heavy Rain detected near Park Street Zone.", time: "Just now" },
    { id: "n-2", type: "warning", message: "Traffic Level near Airport Zone exceeded 70% limit.", time: "4 mins ago" },
    { id: "n-3", type: "success", message: "Dynamic pricing is applied across 5 active sectors.", time: "10 mins ago" }
  ]);

  const addPricingLog = (action: string, previousVal: string, newVal: string) => {
    const newLog = {
      id: `pricing-log-${Date.now()}`,
      adminName: "Ruhan D. (Director)",
      action,
      previousVal,
      newVal,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };
    setPricingLogs(prev => [newLog, ...prev]);
  };

  const addPricingNotification = (type: PricingNotification["type"], message: string) => {
    const alert = {
      id: `alert-${Date.now()}`,
      type,
      message,
      time: "Just now"
    };
    setNotificationsAlerts(prev => [alert, ...prev]);
  };

  // Weather simulation effect
  useEffect(() => {
    let timerWeather: NodeJS.Timeout;
    if (weatherRain) {
      timerWeather = setTimeout(() => {
        addPricingNotification("info", "Dynamic algorithm recalculated storm factor. Boosted multipliers applied to drivers.");
      }, 5000);
    }
    return () => clearTimeout(timerWeather);
  }, [weatherRain]);

  // Main list of mock zones to manage
  const zoneSurgeDetails = useMemo(() => {
    return [
      { name: "Central Zone", defaultMultiplier: 1.8, activeRiders: 14, pendingOrders: 28, trafficDensity: 75, demandState: "Critical" },
      { name: "North Zone", defaultMultiplier: 1.5, activeRiders: 8, pendingOrders: 11, trafficDensity: 42, demandState: "Moderate" },
      { name: "South Zone", defaultMultiplier: 2.2, activeRiders: 19, pendingOrders: 41, trafficDensity: 88, demandState: "Severe" },
      { name: "East Zone", defaultMultiplier: 1.2, activeRiders: 11, pendingOrders: 7, trafficDensity: 31, demandState: "Optimal" },
      { name: "West Zone", defaultMultiplier: 1.0, activeRiders: 6, pendingOrders: 2, trafficDensity: 18, demandState: "Optimal" },
      { name: "Airport Zone", defaultMultiplier: 2.5, activeRiders: 5, pendingOrders: 18, trafficDensity: 91, demandState: "Severe" },
      { name: "Business District", defaultMultiplier: 2.0, activeRiders: 22, pendingOrders: 33, trafficDensity: 80, demandState: "Critical" },
      { name: "High Demand Area", defaultMultiplier: 2.4, activeRiders: 15, pendingOrders: 39, trafficDensity: 85, demandState: "Critical" }
    ];
  }, []);

  // Filtered list of zones for rules manager list
  const filteredZonesList = useMemo(() => {
    return zoneSurgeDetails.filter(z => 
      z.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [zoneSurgeDetails, searchQuery]);

  // Bulk selector operations
  const handleSelectAllZones = () => {
    setSelectedZones(zoneSurgeDetails.map(z => z.name));
    triggerToast("All Zones Selected", "Surge configuration applied to all delivery geofences.", "success");
    addPricingLog("Bulk Selection", "None", "All 8 Zones Activated");
  };

  const handleClearAllZones = () => {
    setSelectedZones([]);
    triggerToast("Zones Disarmed", "Surge multipliers won't be applied to any sector.", "info");
    addPricingLog("Bulk Selection Cleaned", "All Zones Selected", "Selected List Cleared");
  };

  // Toggle master confirmation handling
  const handleToggleMasterClick = () => {
    setTargetMasterState(!surgeMaster);
    setShowConfirmMasterModal(true);
  };

  const confirmMasterStateSwitch = () => {
    const nextState = targetMasterState;
    setSurgeMaster(nextState);
    setShowConfirmMasterModal(false);
    triggerToast(
      "Surge Pricing Status Changed", 
      `Dynamic Pricing Engine was successfully ${nextState ? "ACTIVATED" : "DEACTIVATED"} across selected sectors.`,
      nextState ? "success" : "info"
    );
    addPricingLog(
      nextState ? "Enabled Engine" : "Disabled Engine",
      surgeMaster ? "ACTIVE" : "OFFLINE",
      nextState ? "ACTIVE" : "OFFLINE"
    );
    addPricingNotification(
      nextState ? "success" : "warning",
      `Dynamic pricing master switch was shifted to ${nextState ? "ON" : "OFF"}.`
    );
  };

  // Live pricing simulator calculated output
  const simulationResults = useMemo(() => {
    if (!surgeMaster) {
      return {
        multiplierUsed: 1.0,
        weatherAddition: 0,
        trafficAddition: 0,
        finalFee: 50,
        status: "Standard Pricing Active"
      };
    }
    
    let baseMultiplier = surgeMultiplier;
    let weatherAdd = 0;
    if (weatherRain) weatherAdd += 0.2;
    if (weatherThunder) weatherAdd += 0.3;
    if (weatherFlood) weatherAdd += 0.5;
    if (weatherCyclone) weatherAdd += 0.7;

    let trafficAdd = 0;
    if (trafficThreshold > 80) trafficAdd += 0.4;
    else if (trafficThreshold > 50) trafficAdd += 0.2;

    const aggregateMultiplier = Math.min(3.0, Number((baseMultiplier + weatherAdd + trafficAdd).toFixed(1)));
    
    return {
      multiplierUsed: aggregateMultiplier,
      weatherAddition: weatherAdd,
      trafficAddition: trafficAdd,
      finalFee: Math.round(50 * aggregateMultiplier),
      status: aggregateMultiplier >= 2.5 ? "Critical Surge" : aggregateMultiplier >= 1.8 ? "High Demand" : "Healthy"
    };
  }, [surgeMaster, surgeMultiplier, weatherRain, weatherThunder, weatherFlood, weatherCyclone, trafficThreshold]);

  // Peak times slots overrides handlers
  const handleUpdateSlotMultiplier = (id: string, val: number) => {
    setTimeSlots(prev => prev.map(s => {
      if (s.id === id) {
        addPricingLog(`Tuned ${s.name} override`, `${s.multiplier}x`, `${val}x`);
        return { ...s, multiplier: Number(val) };
      }
      return s;
    }));
  };

  const handleToggleSlotActive = (id: string) => {
    setTimeSlots(prev => prev.map(s => {
      if (s.id === id) {
        addPricingLog(`Toggle space slot ${s.name}`, s.active ? "Active" : "Disabled", !s.active ? "Active" : "Disabled");
        return { ...s, active: !s.active };
      }
      return s;
    }));
  };

  // New special event registration
  const handleAddNewEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) {
      triggerToast("Event Name Missing", "Please provide a description label for special event pricing rule.", "error");
      return;
    }

    const item: CustomSchedule = {
      id: `ev-${Date.now()}`,
      eventName: newEventName,
      multiplier: Number(newEventMultiplier),
      date: newEventDate,
      startTime: newEventStart,
      endTime: newEventEnd,
      eventType: newEventType,
      active: true
    };

    setSchedules(prev => [...prev, item]);
    setShowEventModal(false);
    triggerToast("Special Rule Published", `New surge modifier rules published for: ${newEventName}`, "success");
    addPricingLog("Create Special Event Pricing", "None", `${newEventName} at ${newEventMultiplier}x`);
    
    // reset form fields
    setNewEventName("");
  };

  // Reset core parameters back to defaults
  const handleConfirmReset = () => {
    setSurgeMaster(true);
    setSurgeMultiplier(1.8);
    setWeatherRain(true);
    setWeatherThunder(false);
    setWeatherFlood(false);
    setWeatherExtremeHeat(false);
    setWeatherCyclone(false);
    setTrafficThreshold(70);
    setTrafficModerate(true);
    setTrafficHeavy(true);
    setTrafficSevere(false);
    setSelectedZones(["Central Zone", "South Zone", "High Demand Area"]);
    setShowResetModal(false);
    triggerToast("Configurations Dispatched", "Pricing rules and thresholds restored to corporate standards.", "info");
    addPricingLog("Reset Operation Rules", "Current Modified Panel", "Corporate Default Standards");
  };

  // Main UI render
  return (
    <div className={`p-1 rounded-3xl transition-all ${themeMode === "dark" ? "bg-[#111113] text-gray-100" : "bg-white text-gray-900"}`}>
      
      {/* HEADER SECTION PANEL */}
      <div className={`p-5 rounded-2xl border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        themeMode === "dark" ? "border-gray-800 bg-[#1A1A1E]" : "border-gray-100 bg-gray-50/60"
      }`}>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className={`p-1 py-0.5 rounded uppercase font-black text-[9px] tracking-widest ${
              themeMode === "dark" ? "bg-red-900 text-red-400" : "bg-red-100 text-[#E23744]"
            }`}>
              FINANCIAL PROTOCOL: LEVEL B
            </span>
            <button 
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              className={`p-1 rounded-lg border cursor-pointer ${
                themeMode === "dark" ? "border-gray-700 bg-gray-800 text-amber-300" : "border-gray-200 bg-white text-gray-500"
              }`}
              title="Toggle theme style mode background"
            >
              {themeMode === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h1 className="text-xl font-black mt-1 text-gray-900 dark:text-white tracking-tight">Dynamic Pricing & Surge Management</h1>
          <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">Manage surge pricing rules, demand spikes, weather impact, and delivery charges in real time.</p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search zones, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border outline-hidden focus:ring-1 focus:ring-[#E23744] ${
                themeMode === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-zinc-200"
              }`}
            />
            <span className="absolute left-2.5 top-2 text-stone-400 font-bold">&#128269;</span>
          </div>

          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              triggerToast("City Shifted", `Surge matrix metrics calculated for: ${e.target.value}`, "info");
            }}
            className={`p-1.5 text-xs font-bold rounded-xl border cursor-pointer outline-hidden ${
              themeMode === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-zinc-200 text-stone-700"
            }`}
          >
            <option value="Kolkata Metro">Kolkata Metro Grid</option>
            <option value="Delhi NCR">Delhi NCR Sector</option>
            <option value="Mumbai Central">Mumbai Central Ring</option>
            <option value="Bangalore IT hub">Bangalore IT Domain</option>
          </select>

          <button 
            onClick={() => {
              triggerToast("Grid Synchronized", "Refetched real-time taxi and meteo indexes.", "success");
              addPricingNotification("info", "Synchronized live pricing tables with the local meteorological center.");
            }}
            className="p-2 bg-white dark:bg-gray-900 border border-zinc-200 dark:border-gray-700 rounded-xl hover:bg-stone-50 dark:hover:bg-gray-800 text-stone-700 dark:text-white cursor-pointer"
            title="Reload telemetry status indexes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button 
            onClick={() => triggerToast("KPI Logs Printed", "Surge optimization metrics forwarded to administration accounts.", "success")}
            className="px-3 py-2 bg-slate-900 dark:bg-gray-800 hover:bg-slate-800 dark:hover:bg-gray-800 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Pricing Analytics Audit
          </button>
        </div>
      </div>

      {/* PRICING ANALYTICS DASHBOARD STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-gray-200 shadow-xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Active Surge Zones</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <strong className="text-2xl font-black text-amber-500 mt-2">{selectedZones.length} / 8</strong>
          <span className="text-[9px] text-[#E23744] mt-1 font-bold">● High demand coverage</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-gray-200 shadow-xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Surge Orders Flow</span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <strong className="text-2xl font-black text-rose-500 mt-2">108 Active</strong>
          <span className="text-[9px] text-stone-400 mt-1">42% of total shipments</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-gray-200 shadow-xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Incremental Rev</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <strong className="text-2xl font-black text-emerald-600 mt-2">₹44,820</strong>
          <span className="text-[9px] text-emerald-500 mt-1 font-bold">▲ +18.5% margin boost</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-gray-200 shadow-xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Average Multiplier</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <strong className="text-2xl font-black text-purple-600 mt-2">{simulationResults.multiplierUsed}x</strong>
          <span className="text-[9px] text-stone-400 mt-1">Calculated from indices</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-gray-200 shadow-xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Acceptance rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#E23744]" />
          </div>
          <strong className="text-2xl font-black text-gray-900 dark:text-white mt-2">91.4%</strong>
          <span className="text-[9px] text-stone-400 mt-1">Optimal price elasticity</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-[#29292F]" : "bg-emerald-50/50 border-emerald-100 shadow-xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Rider Earnings Boost</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <strong className="text-2xl font-black text-teal-600 dark:text-emerald-400 mt-2">+34% Avg</strong>
          <span className="text-[9px] text-[#E23744] mt-1 font-bold">▲ Retaining active fleet</span>
        </div>
      </div>

      {/* MASTER SURGE SWITCH WARNING BOX */}
      <div className={`p-5 rounded-2xl border mb-6 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-5 ${
        surgeMaster 
          ? "bg-rose-500/5 border-[#E23744]/20" 
          : "bg-stone-100 border-stone-200 dark:bg-stone-900/30 dark:border-gray-800"
      }`}>
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <AlertOctagon className={`w-5 h-5 ${surgeMaster ? "text-[#E23744] animate-bounce" : "text-stone-400"}`} />
            <strong className="text-sm font-black text-gray-900 dark:text-white">Master Dynamic Pricing Pilot</strong>
          </div>
          <p className="text-xs text-stone-500 dark:text-gray-400 font-medium">
            When enabled, pricing multiplier rules and active storm sensors recalculate client order delivery checkout fees instantly. Deactivating reverts to standard flat pricing fees across all geo-boundaries.
          </p>
        </div>

        <button 
          onClick={handleToggleMasterClick}
          className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-sm tracking-wide cursor-pointer flex items-center gap-2 transition-all shrink-0 ${
            surgeMaster 
              ? "bg-[#E23744] hover:bg-rose-700 text-white" 
              : "bg-slate-900 dark:bg-gray-800 hover:bg-slate-800 text-stone-100"
          }`}
        >
          {surgeMaster ? (
            <><span>⚡ SIMULATOR RUNNING: ACTIVE</span></>
          ) : (
            <><span>💤 STANDBY FLAT PRICING APPLIED</span></>
          )}
        </button>
      </div>

      {/* CORE CONFIGURATION AREA GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
        
        {/* LEFT COLUMN COMPRISING CONDITIONS & OVERRIDES */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* MULTIPLIER AND SIMULATION CARD COMBINED */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* MULTIPLIER SLIDER PANEL */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
              themeMode === "dark" ? "bg-[#1A1A1E] border-gray-800" : "bg-white border-zinc-150 shadow-xs"
            }`}>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs uppercase font-black text-gray-500 tracking-wider">Surge Multiplier Scalar</h3>
                  <span className="p-1 px-2.5 bg-[#E23744]/10 rounded-full text-xs font-black text-[#E23744]">{surgeMultiplier}x Scale</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <input 
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      value={surgeMultiplier}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSurgeMultiplier(val);
                        addPricingLog("Tuned multiplier slider", `${surgeMultiplier}x`, `${val}x`);
                      }}
                      className="w-full h-2 bg-stone-100 dark:bg-gray-800 rounded-lg appearance-auto accent-[#E23744] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
                      <span>1.0x (Flat Fee)</span>
                      <span>1.5x</span>
                      <span>2.0x</span>
                      <span>2.5x</span>
                      <span>3.0x (Max Limit)</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-500 leading-relaxed font-semibold">
                    The general multiplier sets the foundational baseline scale. This value is added to by concurrent active storm alert factors and traffic loads.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-gray-200/50 mt-4 text-[11px] flex justify-between">
                <span>Standard Delivery Baseline:</span>
                <span className="font-bold">₹{baseDeliveryFee}</span>
              </div>
            </div>

            {/* LIVE SIMULATION PANEL WITH MATHEMATICS PREVIEW */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
              themeMode === "dark" 
                ? "bg-[#201A1B] border-red-900/40" 
                : "bg-red-500/5 border-red-100"
            }`}>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs uppercase font-black text-[#E23744]">Smart Calculation Simulation</h3>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    simulationResults.status === "Critical Surge" 
                      ? "bg-red-700 text-white" 
                      : simulationResults.status === "High Demand" 
                      ? "bg-amber-100 text-amber-800" 
                      : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {simulationResults.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-stone-400">Order Origin Geofence:</span>
                    <span className="text-gray-900 dark:text-white">{mapFocusedZone}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-stone-400">Foundation Multiplier:</span>
                    <span>{surgeMultiplier}x</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-stone-400">Rain/Storm Factor:</span>
                    <span className="text-[#E23744] font-bold">+{simulationResults.weatherAddition}x</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-stone-400">Traffic Congestion Factor:</span>
                    <span className="text-amber-500 font-bold">+{simulationResults.trafficAddition}x</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-dashed border-red-200/45 pt-2">
                    <span className="text-stone-500">Aggregate Applied Multiplier:</span>
                    <strong className="text-red-600 dark:text-rose-400">{simulationResults.multiplierUsed}x max</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-red-200/40 mt-4 flex justify-between items-center bg-white/40 dark:bg-black/30 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] text-stone-400 font-extrabold uppercase block leading-none">Simulated Checkout Fee</span>
                  <span className="text-[11px] text-stone-400 mt-0.5 inline-block">₹50 Base * {simulationResults.multiplierUsed}x</span>
                </div>
                <strong className="text-xl font-black text-gray-900 dark:text-white">₹{simulationResults.finalFee}</strong>
              </div>
            </div>

          </div>

          {/* CONDITIONS TRIGGERS PANEL */}
          <div className={`p-5 rounded-2xl border ${
            themeMode === "dark" ? "bg-[#1A1A1E] border-gray-900" : "bg-white border-zinc-150 shadow-xs"
          }`}>
            <h3 className="text-xs uppercase font-black text-gray-500 mb-4 block tracking-wider">Surge Trigger Conditions Panel</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* METEOROLOGICAL / WEATHER CLIMATES */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wide flex items-center gap-1.5">&#9729; Climatic Meteorological Events</span>

                <div className="space-y-1.5">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed hover:bg-stone-50/50 dark:hover:bg-gray-800/40 cursor-pointer dark:border-gray-900 text-xs">
                    <span className="flex items-center gap-2"><CloudRain className="w-4 h-4 text-sky-500" /> Active Heavy Rainfall</span>
                    <input 
                      type="checkbox" 
                      checked={weatherRain}
                      onChange={(e) => {
                        setWeatherRain(e.target.checked);
                        addPricingLog("Weather rainfall trigger switched", String(!weatherRain), String(weatherRain));
                      }}
                      className="rounded accent-[#E23744] h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed hover:bg-stone-50/50 dark:hover:bg-gray-800/40 cursor-pointer dark:border-gray-900 text-xs">
                    <span className="flex items-center gap-2">⚡ Active Thunderstorm / Wind</span>
                    <input 
                      type="checkbox" 
                      checked={weatherThunder}
                      onChange={(e) => {
                        setWeatherThunder(e.target.checked);
                        addPricingLog("Weather Thunderstorm trigger switched", String(!weatherThunder), String(weatherThunder));
                      }}
                      className="rounded accent-[#E23744] h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed hover:bg-stone-50/50 dark:hover:bg-gray-800/40 cursor-pointer dark:border-gray-900 text-xs">
                    <span className="flex items-center gap-2">⚠️ Local Water-Logging / Flood Alert</span>
                    <input 
                      type="checkbox" 
                      checked={weatherFlood}
                      onChange={(e) => {
                        setWeatherFlood(e.target.checked);
                        addPricingLog("Water logging flood warning switched", String(!weatherFlood), String(weatherFlood));
                      }}
                      className="rounded accent-[#E23744] h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed hover:bg-stone-50/50 dark:hover:bg-gray-800/40 cursor-pointer dark:border-gray-900 text-xs">
                    <span className="flex items-center gap-2">&#9728; Extreme Heat Wave Warning</span>
                    <input 
                      type="checkbox" 
                      checked={weatherExtremeHeat}
                      onChange={(e) => setWeatherExtremeHeat(e.target.checked)}
                      className="rounded accent-[#E23744] h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-dashed hover:bg-stone-50/50 dark:hover:bg-gray-800/40 cursor-pointer dark:border-gray-900 text-xs">
                    <span className="flex items-center gap-2">🌀 Cyclone Meteorological Threat</span>
                    <input 
                      type="checkbox" 
                      checked={weatherCyclone}
                      onChange={(e) => setWeatherCyclone(e.target.checked)}
                      className="rounded accent-[#E23744] h-4 w-4"
                    />
                  </label>
                </div>

                {weatherRain && (
                  <div className="p-2.5 bg-sky-50 dark:bg-sky-900/20 text-sky-800 dark:text-sky-300 rounded-xl text-[10px] flex items-center gap-2 font-semibold">
                    <Info className="w-4 h-4 text-sky-500 shrink-0" /> Local Meteorological stations reported 28mm precipitation. Smart Multipliers configured.
                  </div>
                )}
              </div>

              {/* TRAFFIC LEVEL TRIGGER SPEEDS */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wide flex items-center gap-1.5">&#128663; Traffic Level Congestions</span>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1 bg-stone-100 dark:bg-gray-900 p-1 rounded-xl">
                    <button 
                      onClick={() => setTrafficModerate(!trafficModerate)}
                      className={`p-1.5 text-[10px] rounded-lg flex-1 cursor-pointer font-bold ${trafficModerate ? "bg-white dark:bg-gray-900 text-stone-900 dark:text-white shadow-3xs" : "text-stone-400"}`}
                    >
                      Moderate (40-60%)
                    </button>
                    <button 
                      onClick={() => setTrafficHeavy(!trafficHeavy)}
                      className={`p-1.5 text-[10px] rounded-lg flex-1 cursor-pointer font-bold ${trafficHeavy ? "bg-white dark:bg-gray-900 text-stone-900 dark:text-white shadow-3xs" : "text-stone-400"}`}
                    >
                      Heavy (60-80%)
                    </button>
                    <button 
                      onClick={() => setTrafficSevere(!trafficSevere)}
                      className={`p-1.5 text-[10px] rounded-lg flex-1 cursor-pointer font-bold ${trafficSevere ? "bg-white dark:bg-gray-900 text-stone-900 dark:text-white shadow-3xs" : "text-stone-400"}`}
                    >
                      Severe (80%+)
                    </button>
                  </div>

                  {/* Traffic Threshold range slider */}
                  <div className="p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span>Min Traffic Congestion Trigger:</span>
                      <strong className="text-amber-600">{trafficThreshold}% Density</strong>
                    </div>

                    <input 
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={trafficThreshold}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTrafficThreshold(val);
                        addPricingLog("Changed Traffic Trigger limits", `${trafficThreshold}%`, `${val}%`);
                        if (val > 80) {
                          addPricingNotification("warning", `Smart trigger activated. Congestion index exceeded ${val}% on core highways.`);
                        }
                      }}
                      className="w-full h-1.5 bg-stone-200 dark:bg-gray-900 rounded accent-amber-500 cursor-pointer"
                    />

                    <span className="text-[10px] text-zinc-500 leading-normal block">
                      ✔ Apply additional surge factors if average vehicle speed drops and congestion exceeds {trafficThreshold}%.
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* PEAK HOUR OVERRIDES */}
          <div className={`p-5 rounded-2xl border ${
            themeMode === "dark" ? "bg-[#1A1A1E] border-gray-900" : "bg-white border-zinc-150 shadow-xs"
          }`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs uppercase font-black text-gray-500 tracking-wider">Peak Hours Congestion slots overrides</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Define slots and apply automatic custom multipliers override.</p>
              </div>
              <button 
                onClick={() => triggerToast("Slot Addition", "Time slot modifiers are bounded under corporate rules.", "info")}
                className="p-1 px-3 bg-slate-900 dark:bg-gray-800 text-stone-100 hover:text-white rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Define Custom Slot
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {timeSlots.map(s => (
                <div 
                  key={s.id}
                  className={`p-3.5 rounded-xl border flex justify-between items-center ${
                    s.active 
                      ? (themeMode === "dark" ? "bg-gray-900/50 border-[#E23744]/20" : "bg-zinc-50/50 border-[#E23744]/10") 
                      : "bg-gray-50/30 border-gray-200/80 dark:bg-gray-900/20 dark:border-gray-900"
                  }`}
                >
                  <div className="text-left space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${s.active ? "bg-[#E23744]" : "bg-zinc-400 animate-pulse"}`}></span>
                      <strong className="text-xs text-gray-900 dark:text-white block">{s.name}</strong>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono font-bold block">{s.start} - {s.end} Slot Interval</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="3.0"
                      value={s.multiplier}
                      onChange={(e) => handleUpdateSlotMultiplier(s.id, Number(e.target.value))}
                      className={`w-14 p-1 text-center text-xs font-black rounded-lg border focus:ring-1 focus:ring-[#E23744] ${
                        themeMode === "dark" ? "bg-gray-990 border-gray-800 text-white" : "bg-white border-zinc-200"
                      }`}
                    />
                    <button 
                      onClick={() => handleToggleSlotActive(s.id)}
                      className={`px-2 py-1 rounded text-[9px] font-extrabold cursor-pointer transition-colors ${
                        s.active ? "bg-[#E23744]/15 text-[#E23744] hover:bg-[#E23744]/30" : "bg-stone-200 hover:bg-stone-300 text-stone-600"
                      }`}
                    >
                      {s.active ? "Switched ON" : "Standby"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN GRID COMPRISING ZONE CONTROLS & EVENTS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* ZONE MATRIX SELECTION */}
          <div className={`p-5 rounded-2xl border ${
            themeMode === "dark" ? "bg-[#1A1A1E] border-gray-900" : "bg-white border-zinc-150 shadow-xs"
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-xs uppercase font-black text-gray-500 tracking-wider">Applicable Delivery Zones</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">{selectedZones.length} geofences currently surging</p>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={handleSelectAllZones}
                  className="p-1 px-1.5 bg-stone-100 hover:bg-stone-200 rounded text-[9px] font-bold text-stone-800 cursor-pointer"
                >
                  All
                </button>
                <button 
                  onClick={handleClearAllZones}
                  className="p-1 px-1.5 bg-stone-100 hover:bg-stone-200 rounded text-[9px] font-bold text-stone-800 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
              {filteredZonesList.map(z => {
                const isChecked = selectedZones.includes(z.name);
                return (
                  <div 
                    key={z.name}
                    onClick={() => {
                      if (isChecked) {
                        setSelectedZones(prev => prev.filter(name => name !== z.name));
                        addPricingLog("Deactivated geofence surge zone", z.name, "OFF");
                      } else {
                        setSelectedZones(prev => [...prev, z.name]);
                        addPricingLog("Activated geofence surge zone", "OFF", z.name);
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex justify-between items-center cursor-pointer transition-colors ${
                      isChecked 
                        ? "bg-rose-500/5 border-[#E23744]/20 text-gray-900 dark:text-white" 
                        : "bg-gray-50/50 hover:bg-stone-50 dark:bg-gray-900/30 border-transparent text-stone-500"
                    }`}
                  >
                    <div className="text-left">
                      <span className="text-xs font-bold block">{z.name}</span>
                      <span className="text-[10px] text-stone-400 font-medium">Pending Ord: {z.pendingOrders} • Riders: {z.activeRiders}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          z.demandState === "Critical" 
                            ? "bg-red-100 text-red-800" 
                            : z.demandState === "Severe" 
                            ? "bg-amber-100 text-amber-800" 
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {z.demandState}
                        </span>
                      </div>
                      <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
                        isChecked ? "bg-[#E23744] border-[#E23744]" : "border-gray-300"
                      }`}>
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SATELLITE ACTIVE SURGE MAP VIEWPORT */}
          <div className={`p-4 rounded-2xl border ${
            themeMode === "dark" ? "bg-[#1A1A1E] border-gray-900" : "bg-white border-zinc-150 shadow-xs"
          }`}>
            <h3 className="text-xs uppercase font-black text-gray-500 mb-2 block">Surge Intensity Map</h3>
            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-gray-900">
              <OSMInteractiveMap
                mode="geofence"
                zones={zones}
                triggerToast={triggerToast}
                isDarkMode={themeMode === "dark"}
                height="210px"
              />
            </div>
          </div>

          {/* SPECIAL EVENTS SCHEDULES LIST */}
          <div className={`p-5 rounded-2xl border ${
            themeMode === "dark" ? "bg-[#1A1A1E] border-gray-900" : "bg-white border-zinc-150 shadow-xs"
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-xs uppercase font-black text-gray-500 tracking-wider">Special Events Multipliers</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Event-driven triggers override zonal standard calculations.</p>
              </div>
              <button 
                onClick={() => setShowEventModal(true)}
                className="p-1 px-2.5 bg-[#E23744] hover:bg-[#E23744]/90 text-white rounded-lg text-[9px] font-black cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Define Event
              </button>
            </div>

            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {schedules.map(ev => (
                <div 
                  key={ev.id}
                  className={`p-3 rounded-xl border ${
                    ev.active 
                      ? (themeMode === "dark" ? "bg-amber-900/10 border-amber-900/30" : "bg-amber-50/70 border-amber-200/50") 
                      : "bg-gray-50/50 border-gray-300/20 dark:bg-gray-900/30 dark:border-gray-900"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-black uppercase text-[8px]">{ev.eventType}</span>
                        <strong className="text-xs text-gray-900 dark:text-white block">{ev.eventName}</strong>
                      </div>
                      <span className="text-[9px] text-zinc-400 block mt-1">{ev.date} @ {ev.startTime} - {ev.endTime}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-amber-600 block">{ev.multiplier}x multiplier</span>
                      <button 
                        onClick={() => {
                          setSchedules(prev => prev.map(s => s.id === ev.id ? { ...s, active: !s.active } : s));
                          triggerToast("Event state switched", `Surge rules for "${ev.eventName}" shifted.`, "success");
                          addPricingLog("Toggle Special Event", ev.eventName, ev.active ? "Standby" : "Active");
                        }}
                        className={`text-[9px] mt-1 hover:underline font-black ${ev.active ? "text-[#E23744]" : "text-emerald-600"} cursor-pointer`}
                      >
                        {ev.active ? "Pause rule" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* LOWER SECTION: ACTIVITY LOGS & ALERTS TRACKING */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-6 text-left">
        
        {/* RECENT CONFIGURATION ACTIVITY LOG */}
        <div className="xl:col-span-8">
          <div className={`p-4.5 rounded-2xl border ${
            themeMode === "dark" ? "bg-[#1A1A1E] border-gray-900" : "bg-white border-zinc-150 shadow-xs"
          }`}>
            <h3 className="text-xs uppercase font-black text-stone-500 mb-3 tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" /> Active Surge Pricing Change/Audit Logs
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-stone-50 dark:bg-gray-900 text-stone-400 font-bold uppercase text-[9px] border-b border-gray-100 dark:border-gray-800">
                    <th scope="col" className="p-3">Administrator Name</th>
                    <th scope="col" className="p-3">Action Performed</th>
                    <th scope="col" className="p-3">Previous Value</th>
                    <th scope="col" className="p-3">New Value</th>
                    <th scope="col" className="p-3 text-right">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pricingLogs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50/50 dark:hover:bg-gray-800/10">
                      <td className="p-3 font-semibold text-gray-900 dark:text-stone-300">{log.adminName}</td>
                      <td className="p-3 text-stone-500 dark:text-stone-400 font-medium">{log.action}</td>
                      <td className="p-3 font-mono font-bold text-stone-500">{log.previousVal}</td>
                      <td className="p-3 font-mono font-extrabold text-[#E23744]">{log.newVal}</td>
                      <td className="p-3 text-right font-mono text-[10px] text-stone-400">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FLOATING ACTION NOTIFICATIONS & ALERTS FEED */}
        <div className="xl:col-span-4">
          <div className={`p-4.5 rounded-2xl border h-full flex flex-col justify-between ${
            themeMode === "dark" ? "bg-[#1A1A1E] border-gray-900" : "bg-white border-zinc-150 shadow-xs"
          }`}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs uppercase font-black text-stone-500 tracking-wider">Dynamic Alerts stream</h3>
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" title="Algorithms online"></span>
              </div>

              <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                {notificationsAlerts.map(na => (
                  <div 
                    key={na.id}
                    className="p-2.5 rounded-lg border border-zinc-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 text-[11px] font-semibold space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`px-1.5 py-0.5 rounded uppercase text-[8px] font-black ${
                        na.type === "success" ? "bg-emerald-100 text-emerald-800" : na.type === "warning" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {na.type} Alert
                      </span>
                      <span className="text-[9px] text-zinc-400 font-mono">{na.time}</span>
                    </div>
                    <p className="text-gray-900 dark:text-stone-300 leading-normal">{na.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION TRIGGERS FOOTER CARD */}
            <div className="pt-4 border-t border-dashed border-gray-200/50 mt-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => {
                    triggerToast("Surge Parameters Saved", "Configuration successfully saved database parameters offline.", "success");
                    addPricingNotification("success", "Admin saved current pricing configurations successfully.");
                  }}
                  className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-900 text-center text-xs font-black rounded-xl cursor-pointer transition-colors"
                >
                  Save Local Config
                </button>
                <button 
                  onClick={() => setShowSchedulePublishModal(true)}
                  className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-900 text-center text-xs font-black rounded-xl cursor-pointer transition-colors"
                >
                  Schedule Futures
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setShowResetModal(true)}
                  className="p-2.5 bg-transparent hover:bg-rose-50 hover:text-[#E23744] text-stone-500 text-center text-xs font-black rounded-xl cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button 
                  onClick={() => {
                    triggerToast("Changes Published", "Recalculated customer surge multiplier values in production.", "success");
                    addPricingNotification("success", "Published and refreshed active geofences in production live apps.");
                  }}
                  className="p-2.5 bg-[#E23744] hover:bg-red-600 text-white text-center text-xs font-black rounded-xl cursor-pointer transition-all shadow-xs"
                >
                  Publish Changes
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* --- CONFIRMATION MASTER POPUP MODAL --- */}
      {showConfirmMasterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E1E24] p-6 rounded-3xl max-w-md w-full shadow-2xl text-left border border-zinc-150 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <h3 className="text-base font-black">Change Surge Pricing Status?</h3>
            </div>
            
            <p className="text-xs text-stone-500 dark:text-gray-500 leading-relaxed font-semibold">
              Are you sure you want to {targetMasterState ? "ENABLE" : "DISABLE"} surge pricing parameters across the selected {selectedZones.length} geofence sectors? This will modify user billing checkout estimates immediately.
            </p>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setShowConfirmMasterModal(false)}
                className="px-4 py-2 bg-neutral-100 dark:bg-gray-800 text-neutral-800 dark:text-stone-300 rounded-xl hover:bg-neutral-200 cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={confirmMasterStateSwitch}
                className="px-4 py-2 bg-[#E23744] hover:bg-red-700 text-white rounded-xl cursor-pointer font-bold"
              >
                Confirm Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DEFINE EVENT FORM SLIDEOUT MODAL --- */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form 
            onSubmit={handleAddNewEvent}
            className="bg-white dark:bg-[#1C1C21] p-6 rounded-3xl max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl text-left space-y-4"
          >
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xs uppercase font-black text-gray-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E23744]" /> Define Event-Driven surge Rule
              </h3>
              <button 
                type="button" 
                onClick={() => setShowEventModal(false)} 
                className="p-1 hover:bg-stone-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-stone-400 mb-1">Event Description Name Label:</label>
                <input 
                  type="text" 
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g. Durga Puja Carnival"
                  className="w-full p-2 rounded-xl border dark:bg-gray-900 border-zinc-200 dark:border-gray-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-400 mb-1">Surge Multiplier:</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="1.0"
                    max="3.0"
                    value={newEventMultiplier}
                    onChange={(e) => setNewEventMultiplier(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border dark:bg-gray-900 border-zinc-200 dark:border-gray-800 font-black"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Event Type:</label>
                  <select 
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full p-2 rounded-xl border dark:bg-gray-900 border-zinc-200 dark:border-gray-800 font-bold outline-hidden"
                  >
                    <option value="Festival">Festival</option>
                    <option value="Concert">Concert</option>
                    <option value="Sports Event">Sports Event</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Local Event">Local Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1">Scheduled Date:</label>
                <input 
                  type="date" 
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full p-2 rounded-xl border dark:bg-gray-900 border-zinc-200 dark:border-gray-800 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-400 mb-1">Start Time:</label>
                  <input 
                    type="time" 
                    value={newEventStart}
                    onChange={(e) => setNewEventStart(e.target.value)}
                    className="w-full p-2 rounded-xl border dark:bg-gray-900 border-zinc-200 dark:border-gray-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">End Time:</label>
                  <input 
                    type="time" 
                    value={newEventEnd}
                    onChange={(e) => setNewEventEnd(e.target.value)}
                    className="w-full p-2 rounded-xl border dark:bg-gray-900 border-zinc-200 dark:border-gray-800 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button 
                type="button" 
                onClick={() => setShowEventModal(false)}
                className="px-3.5 py-2 bg-neutral-100 dark:bg-gray-800 text-neutral-800 dark:text-stone-300 rounded-xl hover:bg-neutral-200 font-bold"
              >
                Discard Change
              </button>
              <button 
                type="submit"
                className="px-3.5 py-2 bg-[#E23744] hover:bg-red-700 text-white rounded-xl font-bold shadow-xs"
              >
                Publish Event Surge
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- SCHEDULE FUTURE PUBLISH MODAL --- */}
      {showSchedulePublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1C21] p-6 rounded-3xl max-w-sm w-full border border-gray-200 dark:border-gray-800 shadow-2xl text-left space-y-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500 animate-pulse" /> Schedule Surge Launch
            </h3>
            
            <p className="text-xs text-stone-500 font-medium leading-relaxed">
              Define a calendar date and stamp to release this surcharge settings snapshot into local user app environments.
            </p>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-400 mb-1">Target Date:</label>
                  <input 
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full p-2 rounded-xl border dark:bg-gray-900 border-zinc-200 dark:border-gray-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1">Target Time:</label>
                  <input 
                    type="time"
                    value={publishTime}
                    onChange={(e) => setPublishTime(e.target.value)}
                    className="w-full p-2 rounded-xl border dark:bg-gray-900 border-zinc-200 dark:border-gray-800 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setShowSchedulePublishModal(false)}
                className="px-4 py-2 bg-neutral-100 dark:bg-gray-800 text-neutral-800 dark:text-zinc-300 rounded-xl hover:bg-neutral-200 font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowSchedulePublishModal(false);
                  triggerToast("Config Timeline Scheduled", `Surge pricing settings scheduled for deployment on ${publishDate} at ${publishTime}.`, "info");
                  addPricingLog("Scheduled Config Launch", "Standby", `${publishDate} ${publishTime}`);
                  addPricingNotification("info", `Timeline event programmed for: ${publishDate} ${publishTime}.`);
                }}
                className="px-4 py-2 bg-slate-900 dark:bg-gray-800 hover:bg-slate-900 text-white rounded-xl font-bold"
              >
                Program Launcher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RESET CONFIGURATION MODAL CONFIRMATION --- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1E1E24] p-6 rounded-3xl max-w-sm w-full border border-gray-200 dark:border-gray-900 shadow-2xl text-left space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
              <h3 className="text-base font-black">Reset Pricing Configurations?</h3>
            </div>
            
            <p className="text-xs text-stone-500 dark:text-gray-440 font-medium leading-relaxed">
              Are you sure you want to restore all weather parameters, active triggers, multiplier sliders, and time slot configurations back to the corporate standard defaults? This action is immediate and cannot be undone.
            </p>

            <div className="pt-2 flex justify-end gap-2 text-xs font-bold">
              <button 
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-neutral-100 dark:bg-gray-800 text-neutral-800 dark:text-stone-300 rounded-xl hover:bg-neutral-200 cursor-pointer"
              >
                Keep Current
              </button>
              <button 
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl cursor-pointer"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
