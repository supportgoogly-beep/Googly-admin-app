/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import DynamicPricingModule from "./DynamicPricingModule";
import GeofencingManagementSystem from "./GeofencingManagementSystem";
import AnalyticsReportsDashboard from "./AnalyticsReportsDashboard";
import { 
  Order, Restaurant, Rider, User, GeofencingZone, 
  TrafficWeatherWidget, MapPoint, Area as DbArea 
} from "../types";
import { useSupabaseCollection } from "../hooks/useSupabase";
import { useCityContext } from "../context/CityContext";
import { 
  ArrowUpRight, Users, DollarSign, ShoppingBag, Truck, Compass, 
  TrendingUp, Download, CloudRain, Sun, AlertTriangle, Play, Save, 
  Map, Check, X, ShieldAlert, Clock, Star, Calendar, MessageSquare, 
  Phone, Printer, MapPin, Eye, ExternalLink, Activity, CheckCircle, 
  XCircle, Moon, RefreshCw, ShoppingCart, UserCheck, Search, Sliders,
  ChevronRight, FileText
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line 
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";

interface AnalyticsMapsProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  orders: Order[];
  restaurants: Restaurant[];
  riders: Rider[];
  users: User[];
  zones: GeofencingZone[];
  addZone: (item: Omit<GeofencingZone, 'id'>) => Promise<any>;
  updateZone: (id: string, updates: Partial<GeofencingZone>) => Promise<void>;
  deleteZone: (id: string) => Promise<void>;
  weatherWidget: TrafficWeatherWidget;
  setWeatherWidget: React.Dispatch<React.SetStateAction<TrafficWeatherWidget>>;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function AnalyticsMaps({
  currentTab,
  setCurrentTab,
  orders,
  restaurants,
  riders,
  users,
  zones,
  addZone,
  updateZone,
  deleteZone,
  weatherWidget,
  setWeatherWidget,
  triggerToast
}: AnalyticsMapsProps) {

  const { globalCity, cityObjects } = useCityContext();
  const currentCityObject = cityObjects.find((c) => c.name === globalCity);
  const cityId = currentCityObject?.id;

  const { addItem: addAreaSync, deleteItem: deleteAreaSync } = useSupabaseCollection<DbArea>("areas");

  const setZones = async (action: any) => {
    let nextValue: GeofencingZone[];
    if (typeof action === 'function') {
      nextValue = action(zones);
    } else {
      nextValue = action;
    }

    // Now, synchronize these updates to Supabase!
    // 1. Find if any zone was deleted
    const nextIds = new Set(nextValue.map(z => z.id));
    for (const z of zones) {
      if (!nextIds.has(z.id)) {
        console.log("Syncing DELETE of zone & area match:", z.id);
        try {
          await deleteZone(z.id);
        } catch (e) {}
        try {
          await deleteAreaSync(z.id);
        } catch (e) {}
      }
    }

    // 2. Find if any zone was updated (Updates only! No auto-additions to prevent loading feedback loops!)
    for (const z of nextValue) {
      const existing = zones.find(orig => orig.id === z.id);
      if (existing) {
        if (
          existing.name !== z.name ||
          existing.active !== z.active ||
          existing.surgeEnabled !== z.surgeEnabled ||
          existing.surgeMultiplier !== z.surgeMultiplier ||
          JSON.stringify(existing.polygon) !== JSON.stringify(z.polygon)
        ) {
          console.log("Syncing UPDATE of zone", z.id);
          try {
            await updateZone(z.id, {
              name: z.name,
              polygon: z.polygon,
              active: z.active,
              surgeEnabled: z.surgeEnabled,
              surgeMultiplier: z.surgeMultiplier,
              city: z.city || globalCity || "Kolkata",
            });
          } catch (e) {}
        }
      }
    }
  };

  const [surgeMaster, setSurgeMaster] = useState(true);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.5);
  const [selectedSurgeZones, setSelectedSurgeZones] = useState<string[]>(["zone-2"]);

  // --- Zone Geofencing Editor State ---
  const [newZoneName, setNewZoneName] = useState("");
  const [draftPoints, setDraftPoints] = useState<MapPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- Analytics Date Range State ---
  const [analyticsDateRange, setAnalyticsDateRange] = useState("Last 7 Days");

  // --- Premium Home Screen Dashboard Extras ---
  const [darkMode, setDarkMode] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState<Order | null>(null);
  const [chartPeriod, setChartPeriod] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [currentTimeString, setCurrentTimeString] = useState("");

  // Live activity logging feed
  const [activities, setActivities] = useState<{ id: string; text: string; time: string; type: string }[]>([
    { id: "1", text: "New User Registration: Sneha R. joined from Salt Lake Group", time: "Just now", type: "user" },
    { id: "2", text: "Rider Status: Amit K. went Online", time: "2m ago", type: "rider" },
    { id: "3", text: "Inbound Order Placed: OO-506 by Amrita S. (₹780)", time: "5m ago", type: "order" },
    { id: "4", text: "Quality Audit Passed: Blue Lagoon Bistro FSSAI updated", time: "12m ago", type: "restaurant" },
    { id: "5", text: "Settlement Settled: ₹14,250 disbursed to Royal Chef Kitchen", time: "18m ago", type: "payment" },
  ]);

  // Live Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeString(now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync Live Activities with actual order feed rather than random generated ones
  useEffect(() => {
    if (currentTab !== "dashboard") return;
    
    if (!orders || orders.length === 0) {
      setActivities([]);
      return;
    }
    
    const sortedOrders = [...orders].sort((a, b) => new Date(b.orderTime).getTime() - new Date(a.orderTime).getTime());
    const topOrders = sortedOrders.slice(0, 5);
    
    const events = topOrders.map(o => {
      let text = `New Order Placed: ${o.id.substring(0, 6)} by ${o.userName} from ${o.restaurantName} (₹${o.billDetail.total})`;
      let type: "order" | "rider" | "payment" | "user" | "restaurant" | "system" = "order";
      
      if (o.status === "Delivered") {
         text = `Order Completed: ${o.id.substring(0, 6)} delivered successfully`;
         type = "system";
      } else if (o.status === "Cancelled") {
         text = `Order Cancelled: ${o.id.substring(0, 6)}`;
         type = "system";
      } else if (o.status === "Out for Delivery" && o.riderName) {
         text = `Rider Status: ${o.riderName} is in transit for ${o.id.substring(0, 6)}`;
         type = "rider";
      }
      
      return {
        id: `ev-${o.id}`,
        text,
        time: new Date(o.orderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type
      };
    });
    
    setActivities(events);
  }, [orders, currentTab]);

  // --- Calculation Helpers ---
  const totalRevenue = orders
    .filter(o => o.status === "Delivered")
    .reduce((sum, o) => sum + (o.billDetail.total || 0), 0);

  const activeRidersCount = riders.filter(r => r.active).length;
  const activeRestaurantsCount = restaurants.filter(r => r.active).length;

  // Uses just real revenue instead of hardcoded chart
  const salesTrend = [0, 0, 0, 0, 0, 0, totalRevenue];
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];

  // Click handler to drop nodes on the interactive drawing zone canvas
  const handleMapCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    // Get percentage coordinates to fit nicely on any screen size!
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    
    setDraftPoints([...draftPoints, { x, y }]);
    triggerToast("Node Registered", `Added boundary coordinate at X:${x}%, Y:${y}%`, "info");
  };

  // Save drew perimeter polygon
  const handleSaveDraftZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName) {
      triggerToast("Invalid trade name", "Please provide a regulatory zone name.", "error");
      return;
    }
    if (draftPoints.length < 3) {
      triggerToast("Boundary Incomplete", "Please draw at least 3 vertices on the canvas.", "error");
      return;
    }

    const nextId = `zone-${Date.now()}`;
    const cleanZone: Omit<GeofencingZone, 'id'> = {
      name: newZoneName,
      polygon: draftPoints,
      active: true,
      ordersCount: 0,
      surgeEnabled: false,
      surgeMultiplier: 1.0
    };

    addZone(cleanZone);
    triggerToast("Delivery Zone Drawn", `Geofence perimeter for ${cleanZone.name} is now live!`, "success");
    setNewZoneName("");
    setDraftPoints([]);
    setIsDrawing(false);
  };

  // Convert mock records to real downloadable CSV link
  const triggerCSVDownload = () => {
    try {
      const headers = ["Order ID", "Customer Name", "Restaurant", "Subtotal", "Total Bill", "Order Status", "Dispatch Time"];
      const rows = orders.map(o => [
        o.id,
        o.userName,
        o.restaurantName,
        o.billDetail.subtotal,
        o.billDetail.total,
        o.status,
        o.orderTime
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `googly_sales_reports_${analyticsDateRange.replace(/ /g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast("CSV Compiled", "Corporate sales ledgers downloaded successfully.", "success");
    } catch {
      triggerToast("Extraction failed", "Audit sheets compile timeout", "error");
    }
  };

  return (
    <div id="analytics-maps" className="space-y-6">

      {/* --- FEATURE 1: DASHBOARD (THE HOME SCREEN) --- */}
      {currentTab === "dashboard" && (
        <div className={`space-y-6 animate-fade-in p-1 rounded-2xl transition-all duration-300 ${darkMode ? "bg-slate-900 text-gray-100" : "text-slate-900"}`}>
          
          {/* HEADER SECTION */}
          <div className={`p-6 rounded-2xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
            darkMode ? "bg-slate-900/90 border-slate-800" : "bg-white border-gray-100 shadow-xs"
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
                  Government & Corporate Cockpit
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E23744]/10 text-[#E23744] uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <Activity className="w-3 h-3 text-[#E23744]" /> Live Operations
                </span>
              </div>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                Welcome Back, <strong>Chief Operations Officer (ruhandharpurkayastha)</strong>. Monitor logistics stream, driver shifts and client settlements.
              </p>
              {/* Date and Time ticker */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-[#E23744] bg-[#E23744]/5 p-1 px-2.5 rounded-lg w-max shrink-0 mt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentTimeString || "Ticking system clocks..."}</span>
              </div>
            </div>

            {/* Dark mode & Export indicators tab */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {/* Dark Mode button toggle */}
              <button
                onClick={() => {
                  setDarkMode(!darkMode);
                  triggerToast(
                    "Interface Tone Adjusted",
                    `Super cockpit toggled to ${!darkMode ? "Obsidian Dark" : "Daylight Clean"} style.`,
                    "info"
                  );
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  darkMode 
                    ? "bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700" 
                    : "bg-[#F8F9FA] text-slate-800 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {darkMode ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>Go Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-500" />
                    <span>Switch Dark</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setCurrentTab("analytics");
                  triggerToast("Redirecting to Reports", "Showing administrative report summary.", "success");
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" /> Export audit
              </button>
            </div>
          </div>

          {/* QUICK ACTIONS BUTTONS */}
          <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-gray-50 border-gray-100"} space-y-3`}>
            <span className={`text-[10px] font-black uppercase tracking-widest block ${darkMode ? "text-slate-400" : "text-gray-400"}`}>
              Quick Executive Actions
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => {
                  setCurrentTab("restaurants");
                  triggerToast("Onbording Directed", "Transited to Restaurant Onboarding Form.", "info");
                }}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 ${
                  darkMode 
                    ? "bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600" 
                    : "bg-white border-gray-200 text-slate-800 hover:bg-gray-50 hover:shadow-xs"
                }`}
              >
                <span className="p-1 px-1.5 bg-[#E23744]/10 text-[#E23744] rounded font-black text-sm">+</span>
                <span>Add Restaurant</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab("riders");
                  triggerToast("Partner Fleet Directed", "Transited to Delivery Fleet Management.", "info");
                }}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 ${
                  darkMode 
                    ? "bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600" 
                    : "bg-white border-gray-200 text-slate-800 hover:bg-gray-50 hover:shadow-xs"
                }`}
              >
                <span className="p-1 px-1.5 bg-sky-500/10 text-sky-500 rounded font-black text-sm">+</span>
                <span>Add Delivery Partner</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab("coupons");
                  triggerToast("Marketing Campaigns Directed", "Transited to Promo Code Builder.", "info");
                }}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 ${
                  darkMode 
                    ? "bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600" 
                    : "bg-white border-gray-200 text-slate-800 hover:bg-gray-50 hover:shadow-xs"
                }`}
              >
                <span className="p-1 px-1.5 bg-amber-500/10 text-amber-500 rounded font-black text-sm">%</span>
                <span>Create Promo Code</span>
              </button>

              <button
                onClick={() => {
                  setCurrentTab("analytics");
                  triggerToast("Performance Data Directed", "Showing high-resolution CSV analytics sheets.", "info");
                }}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 ${
                  darkMode 
                    ? "bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600" 
                    : "bg-white border-gray-200 text-slate-800 hover:bg-gray-50 hover:shadow-xs"
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>View Reports</span>
              </button>
            </div>
          </div>

          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div 
              id="stat-card-users"
              onClick={() => {
                setCurrentTab("users");
                triggerToast("Target Navigated", "Showing Customer Register.", "info");
              }}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex justify-between items-center hover:-translate-y-1 ${
                darkMode 
                  ? "bg-slate-900 border-slate-800 hover:border-[#E23744]/70 shadow-md" 
                  : "bg-white border-gray-200 shadow-xs hover:shadow-md hover:border-[#E23744]"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Total Users</span>
                <div className="text-2xl font-black">{users.length} Users</div>
                <div className="text-[10px] text-emerald-600 flex items-center gap-0.5 font-bold mt-1">
                  <ArrowUpRight className="w-4 h-4" /> +15.4% registered
                </div>
              </div>
              <div className="p-3 bg-[#E23744]/15 rounded-2xl text-[#E23744]">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div 
              id="stat-card-restaurants"
              onClick={() => {
                setCurrentTab("restaurants");
                triggerToast("Target Navigated", "Showing verification documents status.", "info");
              }}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex justify-between items-center hover:-translate-y-1 ${
                darkMode 
                  ? "bg-slate-900 border-slate-800 hover:border-[#E23744]/70 shadow-md" 
                  : "bg-white border-gray-200 shadow-xs hover:shadow-md hover:border-[#E23744]"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Total Restaurants</span>
                <div className="text-2xl font-black">{restaurants.length} Outposts</div>
                <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold mt-1">
                  <span>✓ {activeRestaurantsCount} Active</span>
                  <span className="text-amber-500">• {restaurants.filter(r => !r.active).length} Pending</span>
                </div>
              </div>
              <div className="p-3 bg-sky-500/15 rounded-2xl text-sky-500">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            <div 
              id="stat-card-riders"
              onClick={() => {
                setCurrentTab("riders");
                triggerToast("Target Navigated", "Showing active delivery fleet shifts.", "info");
              }}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex justify-between items-center hover:-translate-y-1 ${
                darkMode 
                  ? "bg-slate-900 border-slate-800 hover:border-[#E23744]/70 shadow-md" 
                  : "bg-white border-gray-200 shadow-xs hover:shadow-md hover:border-[#E23744]"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Delivery Partners</span>
                <div className="text-2xl font-black">{riders.length} Fleet Partners</div>
                <div className="text-[10px] text-sky-500 flex items-center gap-1 font-bold mt-1">
                  <span>● {riders.filter(r => r.status === 'Online' || r.status === 'On-Delivery').length} Online</span>
                  <span className="text-gray-400">• {riders.filter(r => r.status === 'Offline').length} Offline</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-500/15 rounded-2xl text-indigo-500">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            <div 
              id="stat-card-revenue"
              onClick={() => {
                setCurrentTab("payouts");
                triggerToast("Target Navigated", "Redirecting to commission settlements list.", "info");
              }}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex justify-between items-center hover:-translate-y-1 ${
                darkMode 
                  ? "bg-slate-900 border-slate-800 hover:border-emerald-500/70 shadow-md" 
                  : "bg-white border-gray-200 shadow-xs hover:shadow-md hover:border-emerald-500"
              }`}
            >
              <div className="space-y-1">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block">Total Gross Revenue</span>
                <div className="text-2xl font-black text-emerald-600 font-mono">₹{totalRevenue.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold mt-1">
                  <span>Today: ₹4,890</span>
                  <span className="text-gray-400">• Monthly: ₹2,45,700</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/15 rounded-2xl text-emerald-500">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* SALES ANALYTICS & TIME PERIOD CHANGER */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* SALES WEEK CHART */}
            <div className={`md:col-span-2 p-5 rounded-2xl border transition-all ${
              darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"
            } space-y-4`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Real-Time Sales Performance Analytics
                  </h3>
                  <p className={`text-xs ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                    Interactive logistics tracking, Gross Merchandise Values (GMV), and order completions.
                  </p>
                </div>
                
                {/* Period Filter Toggle */}
                <div className="flex bg-gray-100/10 p-1 rounded-xl border border-gray-200/10 self-end">
                  {(["weekly", "monthly", "yearly"] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setChartPeriod(p);
                        triggerToast("Sales spectrum modified", `Filtering chart context to ${p.toUpperCase()} summaries.`, "info");
                      }}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        chartPeriod === p 
                          ? "bg-[#E23744] text-white shadow"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metrics Grid inside the chart dashboard */}
              <div className="grid grid-cols-3 gap-2 bg-gray-100/5 p-3 rounded-xl border border-gray-200/10 text-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Total GMV</span>
                  <span className="text-sm font-black text-[#E23744]">
                    ₹{chartPeriod === "weekly" ? "1,45,800" : chartPeriod === "monthly" ? "3,27,000" : "13,50,000"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Orders Done</span>
                  <span className="text-sm font-black text-sky-500">
                    {chartPeriod === "weekly" ? "928" : chartPeriod === "monthly" ? "2,190" : "9,020"}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-gray-400 block">Average Order</span>
                  <span className="text-sm font-black text-emerald-500">₹340</span>
                </div>
              </div>

              {/* RECHARTS CHANNELS */}
              <div className="h-64 w-full" style={{ minHeight: "256px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={256} minWidth={0}>
                  <AreaChart
                       data={(() => {
                      if (!orders || orders.length === 0) return [];

                      // Calculate real trends based on actual order data
                      const now = new Date();
                      
                      if (chartPeriod === "weekly") {
                         // Default recent 7 days
                         const last7Days = Array.from({length: 7}, (_, i) => {
                           const d = new Date();
                           d.setDate(d.getDate() - (6 - i));
                           return d;
                         });

                         return last7Days.map(date => {
                           const dateString = date.toISOString().split('T')[0];
                           const dayOrders = orders.filter(o => o.orderTime.startsWith(dateString));
                           return {
                             name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                             revenue: dayOrders.reduce((sum, o) => sum + (o.billDetail.total || 0), 0),
                             orders: dayOrders.length
                           };
                         });
                      } else if (chartPeriod === "monthly") {
                         // Default 4 weeks for monthly view
                         return [1, 2, 3, 4].map(weekNum => {
                           // Approx week buckets using order slicing or time
                           const weekOrders = orders.filter(o => {
                             const orderDate = new Date(o.orderTime).getDate();
                             return orderDate > (weekNum - 1) * 7 && orderDate <= weekNum * 7;
                           });
                           return {
                             name: `Week ${weekNum}`,
                             revenue: weekOrders.reduce((sum, o) => sum + (o.billDetail.total || 0), 0),
                             orders: weekOrders.length
                           };
                         });
                      } else {
                         // Quarterly view (just summarizing all real orders roughly)
                         return [
                            { name: "Current Q", revenue: orders.reduce((sum, o) => sum + (o.billDetail.total || 0), 0), orders: orders.length }
                         ];
                      }
                    })()}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="chartRevenuePath" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E23744" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#E23744" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} opacity={0.5} />
                    <XAxis dataKey="name" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickLine={false} />
                    <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#0f172a" : "#ffffff", 
                        borderColor: darkMode ? "#1e293b" : "#e2e8f0",
                        color: darkMode ? "#f8fafc" : "#0f172a"
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Area 
                      type="monotone" 
                      name="Revenue (₹)" 
                      dataKey="revenue" 
                      stroke="#E23744" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#chartRevenuePath)" 
                    />
                  </AreaChart>
                </SafeResponsiveContainer>
              </div>
              
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                <span>* Interactive points can be inspected by hover</span>
                <button
                  onClick={() => {
                    triggerToast("Data Export Launched", "Extracting current timeframe logs into raw CSV matrix...", "success");
                    triggerCSVDownload();
                  }}
                  className="text-[#E23744] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Timeframe Data
                </button>
              </div>
            </div>

            {/* TODAY'S METEOROLOGICAL & TRAFFIC STATUS CARD */}
            <div className={`p-5 rounded-2xl border transition-all md:col-span-1 h-fit ${
              darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"
            } space-y-4`}>
                <div className="flex justify-between items-start border-b border-gray-200/10 pb-3">
                  <div>
                    <span className="text-[9px] bg-[#E23744] font-black px-2 py-0.5 rounded text-white block uppercase tracking-widest text-center max-w-[130px]">
                      Climate Radar Feed
                    </span>
                    <h4 className={`font-black text-sm mt-1.5 ${darkMode ? "text-white" : "text-slate-900"}`}>
                      {weatherWidget.location}
                    </h4>
                  </div>
                  {weatherWidget.weather === "Heavy Rain" ? (
                    <CloudRain className="w-8 h-8 text-blue-400 animate-bounce" />
                  ) : (
                    <Sun className="w-8 h-8 text-amber-500 animate-pulse" />
                  )}
                </div>

                <div className="space-y-3 text-xs leading-none">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-400">Atmosphere State:</span>
                    <span className="text-amber-500">{weatherWidget.weather} ({weatherWidget.temperature}°C)</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-400">Street Congestion:</span>
                    <span className="text-red-600 font-black">{weatherWidget.trafficDensity}</span>
                  </div>
                </div>

                {/* Dynamic climate selection modifier built inside */}
                <div className={`p-3 rounded-xl ${darkMode ? "bg-slate-800/60" : "bg-gray-50"} space-y-2`}>
                  <span className="text-[10px] text-gray-400 block font-bold">Simulate Climate Change</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        setWeatherWidget({ ...weatherWidget, weather: "Sunny", temperature: 34, trafficDensity: "Low Congestion" });
                        triggerToast("Weather Sim: Sunny", "Perfect riders transit velocity unlocked.", "success");
                      }}
                      className={`p-1.5 rounded text-[10px] font-bold text-center cursor-pointer ${
                        weatherWidget.weather === "Sunny" ? "bg-amber-500 text-white" : "bg-gray-300/20 text-gray-500"
                      }`}
                    >
                      ☀️ Sunny Day
                    </button>
                    <button
                      onClick={() => {
                        setWeatherWidget({ ...weatherWidget, weather: "Heavy Rain", temperature: 24, trafficDensity: "Extreme Jam" });
                        triggerToast("Weather Sim: Heavy Rain", "Extreme delay warning triggered. Surge recommendation active.", "error");
                      }}
                      className={`p-1.5 rounded text-[10px] font-bold text-center cursor-pointer ${
                        weatherWidget.weather === "Heavy Rain" ? "bg-blue-600 text-white animate-pulse" : "bg-gray-300/20 text-gray-500"
                      }`}
                    >
                      🌧️ Storm Rain
                    </button>
                  </div>
                </div>

                {/* Action suggestion box */}
                {weatherWidget.weather === "Heavy Rain" && (
                  <div className="bg-[#E23744]/10 border border-[#E23744]/20 p-3 rounded-xl text-xs space-y-2 text-red-200">
                    <div className="flex gap-1.5 items-center font-bold text-[#E23744]">
                      <AlertTriangle className="w-4 h-4 text-[#E23744]" />
                      Storm alert triggers
                    </div>
                    <p className={`text-[10px] leading-normal ${darkMode ? "text-slate-300" : "text-gray-600"}`}>
                      Rainstorm has slowed transit riders. Activate 2.2x Dynamic Surging to steady fleet turn-outs?
                    </p>
                    <button
                      onClick={() => {
                        setCurrentTab("pricing");
                        setSurgeMaster(true);
                        setSurgeMultiplier(2.2);
                        triggerToast("Pricing Pilot Redirect", "Surges activated to 2.2x to secure rider capacity.", "success");
                      }}
                      className="w-full bg-[#E23744] hover:bg-red-700 text-white font-bold text-[10px] py-1.5 rounded-lg cursor-pointer transition-colors block text-center"
                    >
                      Set Surge to 2.2x Now
                    </button>
                  </div>
                )}
              </div>

              {/* SYSTEM ALERTS CARD / NOTIFICATION CENTER */}
              <div className={`p-5 rounded-2xl border transition-all md:col-span-1 h-fit ${
                darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"
              } space-y-3`}>
                <div className="flex justify-between items-center border-b border-gray-200/10 pb-2">
                  <h4 className={`text-xs font-black uppercase tracking-wider ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                    Pending System Alerts
                  </h4>
                  <span className="text-[10px] font-bold text-[#E23744] bg-[#E23744]/10 px-2 py-0.5 rounded">
                    Requires Attention
                  </span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div 
                    onClick={() => { setCurrentTab("restaurants"); triggerToast("Navigated", "Audit restaurant approval queue", "info"); }}
                    className={`p-2 rounded-lg border flex justify-between items-center cursor-pointer transition-colors ${
                      darkMode ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800/80" : "bg-amber-50 border-amber-100 hover:bg-amber-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
                      <span className="font-bold">Pending verification: 'Wok Star Bistro'</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>

                  <div 
                    onClick={() => { setCurrentTab("riders"); triggerToast("Navigated", "Enabling partner document scan", "info"); }}
                    className={`p-2 rounded-lg border flex justify-between items-center cursor-pointer transition-colors ${
                      darkMode ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800/80" : "bg-blue-50 border-blue-100 hover:bg-blue-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500 block"></span>
                      <span className="font-bold">Rider KYC scan needs approval</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>

                  <div 
                    onClick={() => { setCurrentTab("payouts"); triggerToast("Navigated", "Checking client ledger failure nodes.", "info"); }}
                    className={`p-2 rounded-lg border flex justify-between items-center cursor-pointer transition-colors ${
                      darkMode ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800/80" : "bg-red-50 border-red-100 hover:bg-red-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600 block"></span>
                      <span className="font-bold">Transaction failed on customer OO-489</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>
              </div>
          </div>

          {/* BUSINESS PERFORMANCE SNAPSHOT */}
          <div className={`p-5 rounded-2xl border transition-all ${
            darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"
          } space-y-4`}>
            <h3 className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              Logistics Business Performance Snapshot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* TODAY'S ORDERS METRICS */}
              <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-800/40 border-slate-700" : "bg-gray-50 border-gray-200/40"} space-y-2`}>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Today's Order Count</span>
                <div className="text-xl font-black">{orders.length} Registered</div>
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-amber-500">Pending: {orders.filter(o => o.status === "Pending" || o.status === "Preparing").length}</span>
                  <span className="text-emerald-600">Done: {orders.filter(o => o.status === "Delivered").length}</span>
                </div>
              </div>

              {/* ACTIVE CURRENT DELIVERIES */}
              <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-800/40 border-slate-700" : "bg-gray-50 border-gray-200/40"} space-y-2`}>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Active Deliveries</span>
                <div className="text-xl font-black text-sky-500">
                  {orders.filter(o => o.status === "Out for Delivery").length} Live Transit
                </div>
                <span className="text-[10px] text-gray-400 font-mono block">Live dispatch radar tracking active</span>
              </div>

              {/* AVERAGE TRANSIT DELAY */}
              <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-800/40 border-slate-700" : "bg-gray-50 border-gray-200/40"} space-y-2`}>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Average Delivery Time</span>
                <div className="text-xl font-black text-amber-500">18.4 mins</div>
                <span className="text-[10px] text-emerald-600 font-bold flex items-center">-1.2 mins vs average</span>
              </div>

              {/* TOTAL RATINGS SCORE */}
              <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-800/40 border-slate-700" : "bg-gray-50 border-gray-200/40"} space-y-2`}>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Satisfaction Average</span>
                <div className="text-xl font-black text-yellow-500 flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500 inline" />
                  {restaurants.length > 0 
                     ? (restaurants.reduce((sum, r) => sum + r.rating, 0) / restaurants.length).toFixed(1)
                     : "4.7"} / 5.0
                </div>
                <span className="text-[10px] text-gray-400 block">{restaurants.length} partner outposts reviewed</span>
              </div>
            </div>
          </div>

          {/* RECENT ORDERS TABLE & LIVE ACTIVITY LOGS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* RECENT ORDERS COMPONENT TABLE */}
            <div className={`lg:col-span-2 p-5 rounded-2xl border transition-all ${
              darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"
            } space-y-4`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    Live Logistics Registry
                  </h3>
                  <span className="text-xs text-gray-500 font-semibold">{orders.length} total orders active in database</span>
                </div>
                
                {/* View All Button redirected */}
                <button
                  onClick={() => {
                    setCurrentTab("orders");
                    triggerToast("Order Operations Opened", "Showing live dispatcher cockpit.", "info");
                  }}
                  className="px-3 py-1.5 bg-[#E23744]/15 hover:bg-[#E23744]/25 text-[#E23744] text-xs font-black rounded-lg transition-all cursor-pointer"
                >
                  View All Orders →
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className={`border-b font-black uppercase tracking-wider ${
                      darkMode ? "bg-slate-800/50 border-slate-700 text-slate-400" : "bg-gray-50 border-gray-100 text-gray-500"
                    }`}>
                      <th className="p-3 font-mono">ID</th>
                      <th className="p-3">Client details</th>
                      <th className="p-3">Outpost / Rider</th>
                      <th className="p-3">Bill Sum</th>
                      <th className="p-3">Logistics Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? "divide-slate-800" : "divide-gray-100"}`}>
                    {orders.slice(0, 5).map(o => (
                      <tr key={o.id} className={`transition-colors ${darkMode ? "hover:bg-slate-800/40" : "hover:bg-gray-50"}`}>
                        {/* ORDER ID */}
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedOrderDetails(o)}
                            className="font-mono font-black text-[#E23744] hover:underline cursor-pointer"
                          >
                            {o.id}
                          </button>
                        </td>
                        
                        {/* CLIENT DETAILS */}
                        <td className="p-3 font-semibold">
                          <div className={`${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>{o.userName}</div>
                          <div className={`text-[9px] truncate max-w-[120px] font-normal ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{o.address}</div>
                        </td>

                        {/* RESTAURANT & ASSIGNED DRIVER */}
                        <td className="p-3 font-medium">
                          <div className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{o.restaurantName}</div>
                          <div className="text-[10px] text-sky-600 flex items-center gap-1 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 inline-block"></span>
                            {o.riderName || "Assigning dispatch..."}
                          </div>
                        </td>

                        {/* BILL AMOUNT */}
                        <td className={`p-3 font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                          ₹{o.billDetail.total}
                        </td>

                        {/* LOGISTICS STATUS */}
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            o.status === "Delivered" ? (darkMode ? "bg-emerald-900 text-emerald-400" : "bg-emerald-100 text-emerald-800") :
                            o.status === "Cancelled" ? (darkMode ? "bg-red-900 text-red-400" : "bg-red-200 text-red-800") :
                            o.status === "Out for Delivery" ? (darkMode ? "bg-amber-900 text-amber-400" : "bg-amber-100 text-amber-800") :
                            o.status === "Preparing" ? (darkMode ? "bg-blue-900 text-blue-400" : "bg-blue-100 text-blue-800") :
                            (darkMode ? "bg-yellow-950 text-yellow-400" : "bg-yellow-100 text-yellow-800")
                          }`}>
                            {o.status}
                          </span>
                        </td>

                        {/* ORDER ACTIONS ROW ROW */}
                        <td className="p-3">
                          <div className="flex justify-center items-center gap-1.5">
                            {/* VIEW DETAILS */}
                            <button
                              onClick={() => setSelectedOrderDetails(o)}
                              title="Inspect full logs"
                              className="p-1.5 rounded-lg bg-gray-200/50 hover:bg-gray-200 text-gray-700 cursor-pointer dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-gray-300 border border-transparent dark:border-slate-700"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* PRINT INVOICE THERMAL */}
                            <button
                              onClick={() => setSelectedInvoiceToPrint(o)}
                              title="Print corporate thermal receipt"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 cursor-pointer border border-transparent"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* PHONE CONTACT DISPATCH CUSTOMER */}
                            <button
                              onClick={() => {
                                triggerToast(
                                  "Secure Line Opened", 
                                  `Bridging SECURE outbound proxy route to customer ${o.userName} (${o.userId})`, 
                                  "success"
                                );
                              }}
                              title="Proxy call customer"
                              className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 cursor-pointer border border-transparent"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>

                            {/* PHONE CONTACT DISPATCH RIDER */}
                            <button
                              onClick={() => {
                                if (!o.riderName) {
                                  triggerToast("No Courier Assigned", "A carrier partner is not currently bound to Order ID.", "error");
                                  return;
                                }
                                triggerToast(
                                  "Secure Dispatch Bridge", 
                                  `Routing cryptographically masked VoIP link to ${o.riderName}`, 
                                  "success"
                                );
                              }}
                              title="Proxy call rider"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 cursor-pointer border border-transparent"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LIVE ACTIVITY LOGGER FEED CARD */}
            <div className={`p-5 rounded-2xl border transition-all ${
              darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"
            } space-y-4`}>
              <div className="flex justify-between items-center border-b border-gray-200/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#E23744] rounded-full inline-block animate-ping"></span>
                  <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? "text-white" : "text-slate-900"}`}>
                    Live Logistics Telegraph
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">
                  Realtime Ticks
                </span>
              </div>

              <div className="space-y-3 min-h-[300px]">
                {activities.map(act => (
                  <div 
                    key={act.id} 
                    className={`p-3 rounded-xl border flex gap-3 items-start animate-slide-in text-xs leading-normal ${
                      darkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg text-xs leading-none mt-0.5 shrink-0 ${
                      act.type === "order" ? "bg-[#E23744]/10 text-[#E23744]" :
                      act.type === "rider" ? "bg-sky-500/10 text-sky-500" :
                      act.type === "payment" ? "bg-emerald-500/10 text-emerald-500" : 
                      act.type === "user" ? "bg-purple-500/10 text-purple-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {act.type === "order" ? <ShoppingCart className="w-3.5 h-3.5" /> :
                       act.type === "rider" ? <Truck className="w-3.5 h-3.5" /> :
                       act.type === "payment" ? <DollarSign className="w-3.5 h-3.5" /> :
                       act.type === "user" ? <Users className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    </span>
                    <div className="flex-1 space-y-0.5">
                      <p className={`font-semibold ${darkMode ? "text-slate-200" : "text-gray-800"}`}>
                        {act.text}
                      </p>
                      <span className="text-[10px] text-gray-400 block font-mono">
                        {act.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center p-2.5 bg-gray-100/5 rounded-xl border border-dashed border-gray-200/10">
                <span className={`text-[10px] font-mono font-bold ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                  ✔ Autoupdate engine active (4.5s ticks)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FEATURE 8: DYNAMIC PRICING (SURGE MANAGEMENT) --- */}
      {currentTab === "pricing" && (
        <div className="animate-fade-in">
          <DynamicPricingModule 
            currentTab={currentTab}
            zones={zones}
            setZones={setZones}
            orders={orders}
            riders={riders}
            weatherWidget={weatherWidget}
            setWeatherWidget={setWeatherWidget}
            triggerToast={triggerToast}
          />
        </div>
      )}

      {/* --- FEATURE 15: ZONE / GEOFENCING MANAGEMENT --- */}
      {currentTab === "geofence" && (
        <GeofencingManagementSystem
          zones={zones}
          setZones={setZones}
          addZone={addZone}
          updateZone={updateZone}
          deleteZone={deleteZone}
          addAreaSync={addAreaSync}
          deleteAreaSync={deleteAreaSync}
          restaurants={restaurants}
          riders={riders}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 23: ANALYTICS & REPORTS (SUPER ENTERPRISE GRAPH) --- */}
      {currentTab === "analytics" && (
        <div className="col-span-4 animate-fade-in">
          <AnalyticsReportsDashboard
            orders={orders}
            restaurants={restaurants}
            riders={riders}
            users={users}
            zones={zones}
            triggerToast={triggerToast}
          />
        </div>
      )}

      {/* --- FEATURE: ORDER DETAILS SIDE DRAWER --- */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          {/* Slide-out Drawer */}
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between text-xs text-slate-800 dark:text-gray-100 animate-slide-in">
            <div className="space-y-6 flex-1">
              {/* Header */}
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">Logistics Audit Document</span>
                  <h3 className="text-lg font-black text-[#E23744]">{selectedOrderDetails.id}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 font-bold transition-all cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>

              {/* Client specifications */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black tracking-wider uppercase text-gray-400 dark:text-slate-500">Customer Metadata</h4>
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl space-y-1 border border-gray-100 dark:border-slate-800">
                  <div className="text-slate-900 dark:text-white font-extrabold text-sm">{selectedOrderDetails.userName}</div>
                  <div className="text-gray-500 dark:text-slate-300 font-medium leading-relaxed">Recipient Address: {selectedOrderDetails.address}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-1">Dispatched On: {selectedOrderDetails.orderTime}</div>
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black tracking-wider uppercase text-gray-400 dark:text-slate-500">Merchant Details</h4>
                <div className="p-4 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-slate-900 dark:text-white font-extrabold">{selectedOrderDetails.restaurantName}</div>
                  <span className="text-[10px] text-[#E23744] font-black uppercase tracking-wider block mt-0.5">Corporate Food Business Partner</span>
                </div>
              </div>

              {/* Itemized list */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black tracking-wider uppercase text-gray-400 dark:text-slate-500">Ordered items</h4>
                <div className="p-4 border border-gray-200/60 dark:border-slate-800 rounded-xl space-y-2 bg-white dark:bg-slate-900">
                  {selectedOrderDetails.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center font-bold text-xs">
                      <span className="text-slate-800 dark:text-gray-200">
                        {it.count}x {it.name} {it.isVeg ? "🟢" : "🔴"}
                      </span>
                      <span className="font-mono">₹{it.price * it.count}</span>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-100 dark:border-slate-800 pt-3 space-y-1.5 font-bold text-gray-400 text-[11px]">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{selectedOrderDetails.billDetail.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (5%)</span>
                      <span>₹{selectedOrderDetails.billDetail.gst}</span>
                    </div>
                    <div className="flex justify-between text-rose-500">
                      <span>Platform Discount</span>
                      <span>-₹{selectedOrderDetails.billDetail.discount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge</span>
                      <span>₹{selectedOrderDetails.billDetail.delivery}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2.5 border-t border-dashed border-gray-300 dark:border-slate-800">
                      <span>Grand Total Sum</span>
                      <span className="font-mono text-[#E23744]">₹{selectedOrderDetails.billDetail.total}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Assignment Live Tracking simulator */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black tracking-wider uppercase text-gray-400 dark:text-slate-500">Carrier Assigned & Telemetry</h4>
                <div className="p-4 border border-gray-200/60 dark:border-slate-800 rounded-xl space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-bold">Driver Partner:</span>
                    <span className="text-sky-500 font-black flex items-center gap-1">
                      <UserCheck className="w-4 h-4" />
                      {selectedOrderDetails.riderName || "Searching for dispatch..."}
                    </span>
                  </div>

                  {/* Micro Map Coordinate Visualizer */}
                  <div className="h-32 bg-slate-900 rounded-xl relative overflow-hidden border border-slate-900">
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E23744_1px,transparent_1px)] [background-size:10px_10px]"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-800"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-800"></div>
                    
                    {/* Pins */}
                    <div 
                      style={{ left: `${selectedOrderDetails.x || 30}%`, top: `${selectedOrderDetails.y || 40}%` }}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 bg-[#E23744] text-white p-1 rounded font-mono text-[8px] animate-pulse whitespace-nowrap"
                    >
                      📍 Destination
                    </div>
                    
                    <div 
                      style={{ left: `${((selectedOrderDetails.x || 30) + 20) % 90}%`, top: `${((selectedOrderDetails.y || 40) + 15) % 90}%` }}
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 bg-sky-500 text-white p-1 rounded font-mono text-[8px] whitespace-nowrap"
                    >
                      🛵 Rider GPS
                    </div>

                    <div className="absolute bottom-1 right-2 text-[8px] text-gray-400 font-mono">
                      Telemetry Matrix: GPS Signal High
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer controls inside drawer */}
            <div className="border-t border-gray-200 dark:border-slate-800 pt-4 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedInvoiceToPrint(selectedOrderDetails);
                    setSelectedOrderDetails(null);
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Thermal Receipt Printer
                </button>
                <button
                  onClick={() => {
                    triggerToast("Outgoing VoIP Linked", `Secure proxy line active to recipient ${selectedOrderDetails.userName}.`, "success");
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-slate-900 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Call Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FEATURE: SIMULATED THERMAL PAPER RECEIPTS PRINT MODAL --- */}
      {selectedInvoiceToPrint && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          {/* Thermal container paper */}
          <div className="bg-white text-slate-900 w-full max-w-sm p-6 rounded shadow-2xl border-t-8 border-dashed border-[#E23744] space-y-4 font-mono select-none">
            
            <div className="text-center space-y-1">
              <div className="text-base font-black tracking-widest border-b border-dashed border-gray-300 pb-2">
                * GOOGLY LOGISTICS CORP *
              </div>
              <div className="text-[10px]">GOOGLY HUB ID NO. 14</div>
              <div className="text-[10px]">SALT LAKE COMMERCE CORRIDOR, IN</div>
              <div className="text-[9px] text-gray-400">SUPPORT TEL: 1800-410-GOOGLY</div>
            </div>

            <div className="border-b border-dashed border-gray-300 py-2.5 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>BILL ID:</span>
                <span className="font-black text-[#E23744]">{selectedInvoiceToPrint.id}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE/TIME:</span>
                <span>{selectedInvoiceToPrint.orderTime}</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENT:</span>
                <span className="font-extrabold">{selectedInvoiceToPrint.userName}</span>
              </div>
              <div className="flex justify-between">
                <span>MERCHANT:</span>
                <span className="font-semibold">{selectedInvoiceToPrint.restaurantName}</span>
              </div>
            </div>

            {/* Items table list nested */}
            <div className="text-[10px] space-y-2">
              <div className="font-black border-b border-dashed border-gray-200 pb-1 flex justify-between">
                <span>DESCRIPTION QTY</span>
                <span>PRICE</span>
              </div>

              {selectedInvoiceToPrint.items.map((it, idx) => (
                <div key={idx} className="flex justify-between font-bold">
                  <span>
                    {it.count}x {it.name}
                  </span>
                  <span>₹{it.price * it.count}</span>
                </div>
              ))}

              <div className="border-t border-dashed border-gray-300 pt-2.5 space-y-1 font-bold">
                <div className="flex justify-between text-gray-500">
                  <span>SUBTOTAL AMOUNT</span>
                  <span>₹{selectedInvoiceToPrint.billDetail.subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>GST COMP (5.0%)</span>
                  <span>₹{selectedInvoiceToPrint.billDetail.gst}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>CAMPAIGN DEDUCT</span>
                  <span>-₹{selectedInvoiceToPrint.billDetail.discount}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>FLEET DISPATCH FEE</span>
                  <span>₹{selectedInvoiceToPrint.billDetail.delivery}</span>
                </div>
                <div className="flex justify-between text-xs font-black border-t-2 border-dashed border-slate-900 pt-2 text-[#E23744]">
                  <span>TOTAL SUM BILL</span>
                  <span>₹{selectedInvoiceToPrint.billDetail.total}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-[8px] text-gray-400 border-t border-dashed border-gray-300 pt-4 space-y-1">
              <div>*** DIGITAL SYSTEM COMPLIANCE PASS ***</div>
              <div>COMMISSION CLEARING TRANSACTION RECORD</div>
              <span className="mt-1 block font-black text-rose-500">TEAR HERE-AUDIT LEDGER MASTER COPY</span>
            </div>

            {/* Print trigger buttons */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  triggerToast("Print Job Sent", "Simulating print command connection to default local spooler.", "success");
                  window.print();
                }}
                className="flex-1 bg-black text-white hover:bg-slate-900 font-bold text-[10px] py-2 rounded-lg cursor-pointer transition-all text-center flex items-center justify-center gap-1"
              >
                🖨️ Spool Hardware Print
              </button>
              <button
                onClick={() => setSelectedInvoiceToPrint(null)}
                className="px-3.5 bg-gray-200 text-slate-800 hover:bg-gray-300 text-[10px] font-bold py-2 rounded-lg cursor-pointer transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
