import React, { useState, useEffect, useMemo } from "react";
import { 
  Order, Restaurant, Rider, User, GeofencingZone 
} from "../types";
import { 
  Download, FileText, Calendar, RefreshCcw, Filter, ChevronDown, Check,
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Truck, Star, 
  MapPin, Clock, Search, Grid, Plus, X, List, Eye, Trash, Mail, AlertCircle,
  BarChart2, PieChart as PieChartIcon, ArrowRight, Settings, LayoutGrid, Sparkles, AlertTriangle
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, Sector
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";

interface AnalyticsReportsDashboardProps {
  orders: Order[];
  restaurants: Restaurant[];
  riders: Rider[];
  users: User[];
  zones: GeofencingZone[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

// Interfaces for Custom Report Builder
interface CustomReportTemplate {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  fields: string[];
  filters: {
    city: string;
    status: string;
  };
}

export default function AnalyticsReportsDashboard({
  orders,
  restaurants,
  riders,
  users,
  zones,
  triggerToast
}: AnalyticsReportsDashboardProps) {

  // --- Theme Toggle state (Local Support for absolute fidelity) ---
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- Real-Time State Indicator & Simulator ---
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(
    new Date().toLocaleTimeString()
  );

  // Simulated live events list for the real-time activity feed
  const [liveEvents, setLiveEvents] = useState<Array<{
    id: string;
    time: string;
    description: string;
    badge: string;
    badgeColor: string;
  }>>([
    { id: "ev-1", time: "10:32:15 AM", description: "Order OO-512 placed from Silver Spoon Diner (₹450)", badge: "New Order", badgeColor: "bg-red-500" },
    { id: "ev-2", time: "10:31:40 AM", description: "Courier Vivek Prasad accepted dispatch OO-511", badge: "Transit Started", badgeColor: "bg-blue-500" },
    { id: "ev-3", time: "10:30:22 AM", description: "Feedback Left: ★★★★★ for Gourmet Pizza House", badge: "Rating Done", badgeColor: "bg-yellow-500" },
    { id: "ev-4", time: "10:28:50 AM", description: "Payout of ₹980 dispatched to Rider Sanjay Das", badge: "Financials", badgeColor: "bg-emerald-500" }
  ]);

  // --- Global Filter States ---
  const [selectedDateRange, setSelectedDateRange] = useState("Last 7 Days");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedZone, setSelectedZone] = useState("All");
  const [selectedRestaurant, setSelectedRestaurant] = useState("All");
  const [selectedRider, setSelectedRider] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Custom range sub-modal state overrides
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("2026-06-01");
  const [customEndDate, setCustomEndDate] = useState("2026-06-12");

  // --- Drill-Down Interactive Filter overrides ---
  // When a user clicks on a chart component, we update the global filters dynamically!
  const handleChartStatusClick = (status: string) => {
    setSelectedStatus(status);
    triggerToast("Dashboard Filtered", `Drill-down filter applied. Viewing all "${status}" orders.`, "info");
  };

  const handleChartCityClick = (city: string) => {
    setSelectedCity(city);
    triggerToast("Dashboard Filtered", `Drill-down filter applied. Viewing city of "${city}".`, "info");
  };

  const handleChartRestaurantClick = (restName: string) => {
    setSelectedRestaurant(restName);
    triggerToast("Dashboard Filtered", `Drill-down filter applied for: ${restName}`, "info");
  };

  // --- Custom Report Builder Form State ---
  const [customReportName, setCustomReportName] = useState("Weekly Sales & Delivery Matrix");
  const [customReportType, setCustomReportType] = useState("Revenue Report");
  const [customReportRange, setCustomReportRange] = useState("Last 7 Days");
  const [customReportFields, setCustomReportFields] = useState<string[]>([
    "Revenue", "Orders Count", "Commission Rate", "Average Rating"
  ]);
  const [customReportFilterCity, setCustomReportFilterCity] = useState("All");
  const [customReportFilterStatus, setCustomReportFilterStatus] = useState("All");
  const [customSavedTemplates, setCustomSavedTemplates] = useState<CustomReportTemplate[]>([
    {
      id: "tmpl-1",
      name: "Quarterly Audit Ledger",
      type: "Commission Report",
      dateRange: "This Month",
      fields: ["Revenue", "Commission Rate"],
      filters: { city: "All", status: "Delivered" }
    }
  ]);

  // --- Dashboard Personalization / Widget Reordering ---
  // Users can toggle visibility or drag / change ordering indices of sections
  const [personalization, setPersonalization] = useState({
    showRevenueStats: true,
    showOrderStats: true,
    showCustomerStats: true,
    showRestaurantStats: true,
    showRiderStats: true,
    showOperationsStats: true,
    showForecastPanel: true
  });
  const [showPersonalizerModal, setShowPersonalizerModal] = useState(false);

  // --- Auto-Refresh System Ticker ---
  useEffect(() => {
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        setRefreshCountdown(prev => {
          if (prev <= 1) {
            // Trigger auto simulation of incoming data
            setLastRefreshedAt(new Date().toLocaleTimeString());
            simulateIncomingData();
            return 30; // reset countdown to 30s
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Simulate real-time stream incoming
  const simulateIncomingData = () => {
    const randomDescriptions = [
      `New order OO-${Math.floor(Math.random() * 100) + 515} received from Imperial Biryani Hub (₹680)`,
      `Rider ${riders[Math.floor(Math.random() * riders.length)]?.name || "Rohan G"} logged online near Salt Lake Sector 5`,
      `Order status update: OO-${Math.floor(Math.random() * 50) + 400} was successfully delivered in 14 minutes.`,
      `Promo code 'RAINY25' was redeemed on order by customer Sneha K.`,
      `Customer refund request CR-${Math.floor(Math.random() * 50) + 120} instantly auto-settled by refund algorithm.`
    ];
    const badges = ["New Order", "Shift Update", "Delivery Complete", "Coupon Usage", "Dispute Resolution"];
    const colors = ["bg-[#E23744]", "bg-indigo-500", "bg-emerald-500", "bg-purple-500", "bg-orange-500"];
    const chosenIndex = Math.floor(Math.random() * randomDescriptions.length);

    setLiveEvents(prev => [
      {
        id: `ev-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        description: randomDescriptions[chosenIndex],
        badge: badges[chosenIndex],
        badgeColor: colors[chosenIndex]
      },
      ...prev.slice(0, 4)
    ]);
    triggerToast("Metrics Sync", "Real-time stream updated from centralized delivery node.", "success");
  };

  // Manual refresh hook
  const handleManualRefresh = () => {
    setLastRefreshedAt(new Date().toLocaleTimeString());
    setRefreshCountdown(30);
    simulateIncomingData();
    triggerToast("Dashboard Refreshed", "Centralized data cube aggregated manually successfully.", "info");
  };

  // Toggle report template fields helper
  const handleFieldToggle = (field: string) => {
    if (customReportFields.includes(field)) {
      setCustomReportFields(prev => prev.filter(f => f !== field));
    } else {
      setCustomReportFields(prev => [...prev, field]);
    }
  };

  // Save report builder schema template
  const handleSaveReportTemplate = () => {
    const newTemplate: CustomReportTemplate = {
      id: `tmpl-${Date.now()}`,
      name: customReportName,
      type: customReportType,
      dateRange: customReportRange,
      fields: customReportFields,
      filters: {
        city: customReportFilterCity,
        status: customReportFilterStatus
      }
    };
    setCustomSavedTemplates(prev => [newTemplate, ...prev]);
    triggerToast("Template Shared & Saved", `Custom configuration "${customReportName}" booked in secure workspace templates list.`, "success");
  };

  // Custom schedule settings state & overlay
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("Weekly");
  const [scheduleMethod, setScheduleMethod] = useState("Email");

  const handleConfirmSchedule = () => {
    setShowScheduleModal(false);
    triggerToast(
      "Report Schedule Confirmed",
      `The BI platform will auto-generate and ship this custom report via ${scheduleMethod} every ${scheduleFrequency}.`,
      "success"
    );
  };

  // --- DATA FILTER CLASSIFIER / CALCULATOR ENGINE ---
  // Let us build stable mock data grids matching the current date range & city/restaurant filters
  const filteredMetrics = useMemo(() => {
    let multiplier = 1.0;
    
    // Simulating variations based on date range
    if (selectedDateRange === "Today") multiplier = 0.14;
    else if (selectedDateRange === "Yesterday") multiplier = 0.15;
    else if (selectedDateRange === "Last 7 Days") multiplier = 0.58;
    else if (selectedDateRange === "This Month") multiplier = 1.0;
    else if (selectedDateRange === "Last Month") multiplier = 0.94;
    else if (selectedDateRange === "Last 30 Days") multiplier = 1.02;

    // Filter adjustments for selected filters
    if (selectedCity !== "All") multiplier *= 0.45;
    if (selectedZone !== "All") multiplier *= 0.3;
    if (selectedRestaurant !== "All") multiplier *= 0.15;
    if (selectedRider !== "All") multiplier *= 0.1;

    // Baseline database statistics
    const baseRevenue = 294850;
    const baseOrdersCount = 948;
    const baseCustomersCount = 1250;
    const baseRidersCount = riders.length > 0 ? riders.length : 35;
    const baseRestaurantsCount = restaurants.length > 0 ? restaurants.length : 18;

    const calcRevenue = Math.round(baseRevenue * multiplier);
    const calcOrders = Math.round(baseOrdersCount * multiplier);
    const calcCustomers = Math.round(baseCustomersCount * multiplier);
    const calcRiders = selectedRider === "All" ? Math.max(5, Math.round(baseRidersCount * (selectedCity === "All" ? 1 : 0.4))) : 1;
    const calcRestaurants = selectedRestaurant === "All" ? Math.max(3, Math.round(baseRestaurantsCount * (selectedCity === "All" ? 1 : 0.4))) : 1;

    // Revenue breakdown details
    const grossVal = calcRevenue;
    const commissionVal = Math.round(grossVal * 0.18);
    const deliveryFeeVal = Math.round(calcOrders * 35);
    const taxVal = Math.round(grossVal * 0.05);
    const netVal = grossVal - commissionVal - taxVal;

    return {
      totalRevenue: grossVal,
      netRevenue: netVal,
      commissionRevenue: commissionVal,
      deliveryFeeRevenue: deliveryFeeVal,
      taxRevenue: taxVal,
      totalOrders: calcOrders,
      activeCustomers: calcCustomers,
      activeRestaurants: calcRestaurants,
      activeRiders: calcRiders,
      avgOrderValue: calcOrders > 0 ? Math.round(grossVal / calcOrders) : 310,
      deliverySuccessRate: selectedStatus === "Cancelled" ? 0 : 98.4,
      satisfactionScore: 4.8
    };
  }, [selectedDateRange, selectedCity, selectedZone, selectedRestaurant, selectedRider, selectedStatus]);

  // Export CSV Action Simulator
  const handleExportCSV = () => {
    try {
      const headers = ["Metric Name", "Current Period Value", "Previous Period Value", "Growth Percentage", "Segment Filter"];
      const rows = [
        ["Gross Revenue (₹)", `${filteredMetrics.totalRevenue}`, `${Math.round(filteredMetrics.totalRevenue * 0.92)}`, "+8.0%", `${selectedCity}`],
        ["Net Revenue (₹)", `${filteredMetrics.netRevenue}`, `${Math.round(filteredMetrics.netRevenue * 0.90)}`, "+10.0%", `${selectedCity}`],
        ["Total Completed Orders", `${filteredMetrics.totalOrders}`, `${Math.round(filteredMetrics.totalOrders * 0.94)}`, "+6.0%", `${selectedRestaurant}`],
        ["Commission Inbound (₹)", `${filteredMetrics.commissionRevenue}`, `${Math.round(filteredMetrics.commissionRevenue * 0.95)}`, "+5.0%", "All Zones"],
        ["Avg Order Ticket (₹)", `${filteredMetrics.avgOrderValue}`, "298", "+4.0%", "Retail Segment"],
        ["Customer Health Satisfaction", `${filteredMetrics.satisfactionScore}`, "4.6", "+4.34%", "Operational"]
      ];

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(","))
          .join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `googly_delivery_bi_report_${selectedDateRange.replace(/ /g, "_")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast("CSV Download Complete", "Filtered corporate business intelligence spreadsheet has been shipped to local drive.", "success");
    } catch {
      triggerToast("CSV generation timeout", "A pipeline interrupt occurred. Retry.", "error");
    }
  };

  // Export PDF Report Simulator (Custom Styled Report Page Print template)
  const handlePrintPDF = () => {
    triggerToast("Opening system print dialog", "Creating premium styled statement audit template.", "info");
    const originalTitle = document.title;
    document.title = `Googly-Management-Report-${selectedDateRange}-${new Date().toISOString().split('T')[0]}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  // Email report simulation
  const handleEmailReportSim = (reportTypeName: string) => {
    triggerToast("Email Queued", `Dispatching secure corporate PDF report matching '${reportTypeName}' to system administrators...`, "success");
  };

  // --- CHART DATA GENERATORS ---
  // Trend line chart values
  const revenueTrendData = useMemo(() => {
    let baseData = [
      { name: "Day 1", gross: 32000, commission: 5700, tax: 1600 },
      { name: "Day 2", gross: 38040, commission: 6800, tax: 1900 },
      { name: "Day 3", gross: 31000, commission: 5500, tax: 1550 },
      { name: "Day 4", gross: 45000, commission: 8100, tax: 2250 },
      { name: "Day 5", gross: 51200, commission: 9200, tax: 2560 },
      { name: "Day 6", gross: 58900, commission: 10600, tax: 2945 },
      { name: "Day 7", gross: 61000, commission: 10980, tax: 3050 }
    ];

    // Scale according to date filters
    const scale = filteredMetrics.totalRevenue / 317140;
    return baseData.map(d => ({
      name: d.name,
      gross: Math.round(d.gross * scale),
      commission: Math.round(d.commission * scale),
      tax: Math.round(d.tax * scale)
    }));
  }, [filteredMetrics]);

  const ordersByHourData = [
    { hour: "08:00", orders: 42, volume: 14000 },
    { hour: "10:00", orders: 68, volume: 22000 },
    { hour: "12:00", orders: 151, volume: 49000 },
    { hour: "14:00", orders: 120, volume: 38000 },
    { hour: "16:00", orders: 58, volume: 18000 },
    { hour: "18:00", orders: 184, volume: 62000 },
    { hour: "20:00", orders: 240, volume: 81000 },
    { hour: "22:00", orders: 139, volume: 46000 }
  ];

  const cityTrendData = [
    { city: "Kolkata Hub", revenue: 142000, orders: 410 },
    { city: "Salt Lake Zone", revenue: 98000, orders: 290 },
    { city: "New Town Grid", revenue: 54850, orders: 150 }
  ];

  const orderSourceBreakdown = [
    { name: "Mobile App (iOS/A)", value: 65, color: "#E23744" },
    { name: "Web Browser Widget", value: 20, color: "#38bdf8" },
    { name: "API Partner Portals", value: 15, color: "#e2e8f0" }
  ];

  const customerSegments = [
    { name: "New Registers", value: 35, color: "#38bdf8" },
    { name: "Highly Active (3+ per wk)", value: 45, color: "#10b981" },
    { name: "At Risk Churning", value: 20, color: "#fbbf24" }
  ];

  // Predictive Forecasting calculation (linear extrapolation of current metrics + seasonal multipliers)
  const predictiveForecastData = useMemo(() => {
    const dailyAvg = filteredMetrics.totalRevenue / 7;
    return [
      { day: "Next Mon (Est)", forecastRevenue: Math.round(dailyAvg * 1.05), lowerBound: Math.round(dailyAvg * 0.98), upperBound: Math.round(dailyAvg * 1.12) },
      { day: "Next Tue (Est)", forecastRevenue: Math.round(dailyAvg * 1.08), lowerBound: Math.round(dailyAvg * 1.01), upperBound: Math.round(dailyAvg * 1.15) },
      { day: "Next Wed (Est)", forecastRevenue: Math.round(dailyAvg * 1.03), lowerBound: Math.round(dailyAvg * 0.96), upperBound: Math.round(dailyAvg * 1.10) },
      { day: "Next Thu (Est)", forecastRevenue: Math.round(dailyAvg * 1.12), lowerBound: Math.round(dailyAvg * 1.04), upperBound: Math.round(dailyAvg * 1.20) },
      { day: "Next Fri (Est)", forecastRevenue: Math.round(dailyAvg * 1.25), lowerBound: Math.round(dailyAvg * 1.15), upperBound: Math.round(dailyAvg * 1.35) },
      { day: "Next Sat (Est)", forecastRevenue: Math.round(dailyAvg * 1.42), lowerBound: Math.round(dailyAvg * 1.30), upperBound: Math.round(dailyAvg * 1.54) },
      { day: "Next Sun (Est)", forecastRevenue: Math.round(dailyAvg * 1.45), lowerBound: Math.round(dailyAvg * 1.32), upperBound: Math.round(dailyAvg * 1.58) }
    ];
  }, [filteredMetrics]);

  return (
    <div id="analytics-reports-dashboard" className={`space-y-6 ${isDarkMode ? "bg-slate-900 text-slate-100 p-6 rounded-3xl" : "text-slate-800"}`}>
      
      {/* HEADER SECTION WITH ENTERPRISE CONTROLS */}
      <div className={`p-6 rounded-3xl border flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Analytics & Reports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/10 text-teal-600 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> High-Resolution BI Node
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            Real-time business intelligence engine providing deep diagnostic analytics on revenue trends, restaurant settlements, client segmentation, and fleet courier logistics.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-gray-400 font-mono mt-1">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-500" /> Data Lake Status: Stable</span>
            <span className="flex items-center gap-1"><RefreshCcw className="w-3 h-3 text-red-500" /> Last updated: {lastRefreshedAt}</span>
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2 select-none self-stretch sm:self-auto">
          {/* Theme custom toggler */}
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              triggerToast("BI Palette Changed", `Theme switched to ${!isDarkMode ? "Deep Carbon Dark" : "Enterprise Light"} view.`, "info");
            }}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isDarkMode ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"}`}
            title="Toggle Dashboard Dark Mode"
          >
            {isDarkMode ? "☀️ Go Light" : "🌙 Go Dark"}
          </button>

          {/* Settings / Personalization Widget Button */}
          <button
            id="personalize-layout-btn"
            onClick={() => setShowPersonalizerModal(true)}
            className="p-2 bg-[#E23744]/10 text-[#E23744] hover:bg-[#E23744]/20 text-xs font-bold rounded-xl border border-[#E23744]/20 flex items-center gap-1 cursor-pointer transition-all"
            title="Personalize & Reorder Widgets"
          >
            <LayoutGrid className="w-4 h-4" /> Customized Layout
          </button>

          <button 
            id="export-csv-top-bar"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2.5} /> Export CSV
          </button>

          <button 
            id="download-pdf-top-bar"
            onClick={handlePrintPDF}
            className="px-3.5 py-2 bg-[#E23744] hover:bg-[#c12632] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Download PDF
          </button>

          <button
            id="schedule-reports-btn"
            onClick={() => setShowScheduleModal(true)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" /> Schedule Report
          </button>
        </div>
      </div>

      {/* STICKY FILTER BAR AT THE TOP WITH INTEGRATION PRESETS */}
      <div className={`sticky top-16 z-10 p-4 rounded-2xl border flex flex-col gap-4 shadow-sm transition-all ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100"}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase text-gray-400">
            <Filter className="w-4 h-4 text-[#E23744]" /> Active System Filters
          </div>

          {/* Quick Clear filter helper if modifications exist */}
          {(selectedCity !== "All" || selectedZone !== "All" || selectedRestaurant !== "All" || selectedRider !== "All" || selectedStatus !== "All") && (
            <button
              onClick={() => {
                setSelectedCity("All");
                setSelectedZone("All");
                setSelectedRestaurant("All");
                setSelectedRider("All");
                setSelectedStatus("All");
                triggerToast("Filters Cleared", "Reset all relational analytics parameters.", "info");
              }}
              className="text-[10px] font-bold text-[#E23744] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Global Select List grids */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* 1. Date range picker & preset selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase text-gray-400">Range Preset</label>
            <select
              id="global-range-picker"
              value={selectedDateRange}
              onChange={(e) => {
                const range = e.target.value;
                if (range === "Custom Range") {
                  setShowCustomRangeModal(true);
                } else {
                  setSelectedDateRange(range);
                  triggerToast("Range Shifted", `Operational view adjusted to ${range}.`, "info");
                }
              }}
              className={`w-full text-xs font-bold p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="Custom Range">📅 Custom Interval...</option>
            </select>
          </div>

          {/* 2. City Filter */}
          <div className="space-y-1 font-semibold">
            <label className="block text-[10px] font-extrabold uppercase text-gray-400">City Hub</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                triggerToast("City Pivot", `Auditing transactions in ${e.target.value}`, "info");
              }}
              className={`w-full text-xs font-bold p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
            >
              <option value="All">All Cities</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Salt Lake">Salt Lake</option>
              <option value="New Town">New Town</option>
            </select>
          </div>

          {/* 3. Zone Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase text-gray-400">Geofencing Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => {
                setSelectedZone(e.target.value);
                triggerToast("Zone Pivot", `Refined logistics metrics within zone: ${e.target.value}`, "info");
              }}
              className={`w-full text-xs font-bold p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
            >
              <option value="All">All Zones</option>
              {zones.map(z => (
                <option key={z.id} value={z.name}>{z.name}</option>
              ))}
              <option value="Sector V Hub">Sector V Hub</option>
              <option value="Salt Lake Hub">Salt Lake Hub</option>
            </select>
          </div>

          {/* 4. Restaurant Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase text-gray-400">Restaurant Outpost</label>
            <select
              value={selectedRestaurant}
              onChange={(e) => {
                setSelectedRestaurant(e.target.value);
                triggerToast("Restaurant Pivot", `Drilled metrics to restaurant: ${e.target.value}`, "info");
              }}
              className={`w-full text-xs font-bold p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
            >
              <option value="All">All Outposts</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* 5. Rider Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase text-gray-400">Rider Partner</label>
            <select
              value={selectedRider}
              onChange={(e) => {
                setSelectedRider(e.target.value);
                triggerToast("Rider Pivot", `Tracked specific earnings and SLAs for rider ID: ${e.target.value}`, "info");
              }}
              className={`w-full text-xs font-bold p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
            >
              <option value="All">All Riders</option>
              {riders.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* 6. Order Status Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase text-gray-400">Order Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                triggerToast("Status Refinement", `Selected status class '${e.target.value}'`, "info");
              }}
              className={`w-full text-xs font-bold p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Preparing">Preparing</option>
              <option value="Pending">Pending</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

        </div>
      </div>

      {/* REAL-TIME SIMULATION & LIVE METEOR STATUS WIDGET BAR */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-amber-500/5 border-amber-500/10"}`}>
        <div className="flex items-center gap-3">
          <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <div>
            <span className="text-xs font-black text-slate-900 dark:text-gray-100 flex items-center gap-1">
              Live Real-Time Stream Monitoring
            </span>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Direct pipeline feed containing incoming consumer logs. Autopilot active.
            </p>
          </div>
        </div>

        {/* Refresh controllers */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400 font-bold">Auto Refresh:</span>
            <button
              onClick={() => {
                setAutoRefresh(!autoRefresh);
                triggerToast("Engine Autopilot Shift", `Automation turned ${!autoRefresh ? "On" : "Off"}`, "info");
              }}
              className={`px-3 py-1 rounded-full font-black text-[10px] tracking-wider uppercase cursor-pointer transition-colors ${autoRefresh ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold" : "bg-gray-200 text-gray-500 dark:bg-slate-800"}`}
            >
              {autoRefresh ? `On (${refreshCountdown}s)` : "Paused"}
            </button>
          </div>

          <button
            onClick={handleManualRefresh}
            className="p-1.5 px-3 bg-white hover:bg-gray-200 border border-gray-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-indigo-500" /> Force Refresh
          </button>
        </div>
      </div>

      {/* --- EXECUTIVE KPI SUMMARY CARDS (Top of dashboard) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between hover:shadow-md transition-all ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block">Total GMV Revenue</span>
              <div className="text-2xl font-black font-mono text-emerald-600">₹{filteredMetrics.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-4 pt-3 border-t border-gray-50 dark:border-slate-800">
            <span className="text-gray-400 font-medium">vs Last Month:</span>
            <span className="text-emerald-600 font-black flex items-center gap-0.5">
              <TrendingUp className="w-4.5 h-4.5" /> +15.4%
            </span>
          </div>
          {/* Sparkline simulation */}
          <div className="mt-2 h-7 w-full overflow-hidden opacity-80" style={{ minHeight: "28px", minWidth: 0 }}>
            <SafeResponsiveContainer minHeight={28} minWidth={0}>
              <AreaChart data={revenueTrendData.slice(0, 5)}>
                <Area type="monotone" dataKey="gross" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </SafeResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between hover:shadow-md transition-all ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block">Platform Orders</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{filteredMetrics.totalOrders} Done</div>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-4 pt-3 border-t border-gray-50 dark:border-slate-800">
            <span className="text-gray-400 font-medium">Previous Period:</span>
            <span className="text-emerald-600 font-black flex items-center gap-0.5">
              <TrendingUp className="w-4.5 h-4.5" /> +11.2%
            </span>
          </div>
          {/* Sparkline simulation */}
          <div className="mt-2 h-7 w-full overflow-hidden opacity-80" style={{ minHeight: "28px", minWidth: 0 }}>
            <SafeResponsiveContainer minHeight={28} minWidth={0}>
              <AreaChart data={revenueTrendData.slice(2, 7)}>
                <Area type="monotone" dataKey="commission" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </SafeResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Active Demographics */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between hover:shadow-md transition-all ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block">Active Stakeholders</span>
              <div className="text-lg font-black leading-tight text-gray-900 dark:text-white">
                <div>🧑‍💻 {filteredMetrics.activeCustomers} Clients</div>
                <div className="text-xs text-slate-500 font-mono">🏪 {filteredMetrics.activeRestaurants} Outposts | 🚴 {filteredMetrics.activeRiders} Riders</div>
              </div>
            </div>
            <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-4 pt-3 border-t border-gray-50 dark:border-slate-800">
            <span className="text-gray-400 font-medium">Signups Retention:</span>
            <span className="text-emerald-600 font-black flex items-center gap-0.5">
              <TrendingUp className="w-4.5 h-4.5" /> +14.2%
            </span>
          </div>
          {/* Sparkline simulation */}
          <div className="mt-2 h-7 w-full overflow-hidden opacity-80" style={{ minHeight: "28px", minWidth: 0 }}>
            <SafeResponsiveContainer minHeight={28} minWidth={0}>
              <AreaChart data={revenueTrendData.slice(1, 6)}>
                <Area type="monotone" dataKey="gross" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </SafeResponsiveContainer>
          </div>
        </div>

        {/* Card 4: Customer Satisfaction & Performance */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between hover:shadow-md transition-all ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block">SLA Success Parameters</span>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{filteredMetrics.deliverySuccessRate}% SLA</div>
              <div className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {filteredMetrics.satisfactionScore} Care Index
              </div>
            </div>
            <div className="p-2.5 bg-yellow-50 rounded-xl text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-4 pt-3 border-t border-gray-50 dark:border-slate-800">
            <span className="text-gray-400 font-medium">On-Time Transit:</span>
            <span className="text-emerald-600 font-bold">96.8% Success</span>
          </div>
          {/* Sparkline simulation */}
          <div className="mt-2 h-7 w-full overflow-hidden opacity-80" style={{ minHeight: "28px", minWidth: 0 }}>
            <SafeResponsiveContainer minHeight={28} minWidth={0}>
              <AreaChart data={revenueTrendData.slice(3, 7)}>
                <Area type="monotone" dataKey="tax" stroke="#e11d48" fill="#e11d48" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </SafeResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- REVENUE ANALYTICS INTERACTIVE MODULE --- */}
      {personalization.showRevenueStats && (
        <div className={`p-6 rounded-3xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100/10 pb-4 gap-2">
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Revenue Overview & Profit Models
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Analysis of gross intake, calculated commissions (18% flat rate), and shipping carrier logistic pools.
              </p>
            </div>
            {/* Net Financial values row */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="p-2.5 bg-gray-50/50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 text-center min-w-[100px]">
                <span className="text-[9px] text-gray-400 uppercase font-bold block">Gross Revenue</span>
                <span className="font-black text-slate-800 dark:text-slate-100">₹{filteredMetrics.totalRevenue}</span>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-center min-w-[100px]">
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Commission Received</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{filteredMetrics.commissionRevenue}</span>
              </div>
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-center min-w-[100px]">
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase font-bold block">Delivery Fee Pools</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">₹{filteredMetrics.deliveryFeeRevenue}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AREA CHART - LINE TREND */}
            <div className="lg:col-span-2 space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-black">Gross sales trend & commission rates</span>
              <div className="w-full h-96 min-h-[300px]" style={{ minHeight: "300px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={300} minWidth={0}>
                  <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E23744" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E23744" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke={isDarkMode ? "#334155" : "#cbd5e1"} />
                    <XAxis dataKey="name" stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} />
                    <YAxis stroke={isDarkMode ? "#94a3b8" : "#64748b"} fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? "#1e293b" : "#fff", borderColor: "#e2e8f0" }} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Area type="monotone" name="Gross Sales (₹)" dataKey="gross" stroke="#E23744" fillOpacity={1} fill="url(#colorGross)" strokeWidth={2.5} />
                    <Area type="monotone" name="Commission Revenue (₹)" dataKey="commission" stroke="#10b981" fillOpacity={1} fill="url(#colorComm)" strokeWidth={2.5} />
                  </AreaChart>
                </SafeResponsiveContainer>
              </div>
            </div>

            {/* BAR CHART / PIE CHART FOR GEOGRAPHY */}
            <div className="space-y-4 border-l border-gray-100/10 pl-0 lg:pl-6">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-black">Sales By Urban Cities</span>
              
              <div className="h-56" style={{ minHeight: "224px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={224} minWidth={0}>
                  <BarChart data={cityTrendData} layout="vertical" margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" fontSize={9} />
                    <YAxis dataKey="city" type="category" fontSize={9} />
                    <Tooltip />
                    <Bar 
                      dataKey="revenue" 
                      name="Revenue (₹)" 
                      fill="#3b82f6" 
                      radius={[0, 8, 8, 0]} 
                      onClick={(data) => handleChartCityClick(data.city.split(" ")[0])}
                      className="cursor-pointer"
                    >
                      {cityTrendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#E23744" : index === 1 ? "#3b82f6" : "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </SafeResponsiveContainer>
              </div>

              <div className="p-3 bg-gray-50/40 dark:bg-slate-800 rounded-xl text-[10px] text-gray-500 border border-gray-200/10 leading-normal">
                ⭐️ <strong>Protip:</strong> Click on any city's bar above to drill down this dashboard's global scope parameters instantly.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- ORDER ANALYTICS & PEAK TIMES --- */}
      {personalization.showOrderStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className={`p-6 rounded-3xl border lg:col-span-2 space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Order Volumes & Logistics Velocity
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Analysis of order distribution densities mapped hour-by-hour across current operational shifts.
              </p>
            </div>

            <div className="h-60" style={{ minHeight: "240px", minWidth: 0 }}>
              <SafeResponsiveContainer minHeight={240} minWidth={0}>
                <AreaChart data={ordersByHourData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="hour" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Area type="monotone" name="Inbound Orders" dataKey="orders" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </SafeResponsiveContainer>
            </div>

            <div className="flex justify-between items-center text-xs text-gray-400 font-bold border-t border-gray-50 dark:border-slate-800 pt-3">
              <span>🔥 Peak ordering times focus window: 18:00 - 21:00</span>
              <span className="text-[#E23744] font-black">Coined Dinner Hours</span>
            </div>
          </div>

          {/* Pie Chart: Order Status & Sources */}
          <div className={`p-6 rounded-3xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
            <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">Order Source Channel Inflows</h3>
            
            <div className="h-44 flex items-center justify-center" style={{ minHeight: "176px", minWidth: 0 }}>
              <SafeResponsiveContainer minHeight={176} minWidth={0}>
                <PieChart>
                  <Pie
                    data={orderSourceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    className="cursor-pointer"
                  >
                    {orderSourceBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </SafeResponsiveContainer>
            </div>

            <div className="space-y-2 text-[11px] font-bold">
              {orderSourceBreakdown.map(o => (
                <div key={o.name} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: o.color }}></span>
                    {o.name}
                  </span>
                  <span>{o.value}% Share</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* --- CUSTOMER ANALYTICS & LOYALTY RETENTIONS --- */}
      {personalization.showCustomerStats && (
        <div className={`p-6 rounded-3xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
          <div>
            <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Customer Lifetime Segmentations & Cohorts
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Understand returning customers ratios, monthly loyalty coin redemptions, and churn alert factors.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            <div className="space-y-4">
              <div className="bg-sky-500/10 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] text-sky-600 dark:text-sky-400 uppercase font-black">Retention Ratios</span>
                <div className="text-xl font-black">84.2% Return Rate</div>
                <p className="text-[10px] text-gray-400 leading-normal">High repeated client index from residential sub-grids.</p>
              </div>

              <div className="bg-amber-100/30 dark:bg-amber-500/15 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] text-amber-600 uppercase font-black">Avg LTV Duration</span>
                <div className="text-xl font-black">₹4,120 per Client</div>
                <p className="text-[10px] text-gray-400 leading-normal">Calculated across baseline fiscal year 2026 logs.</p>
              </div>
            </div>

            {/* Retention pie chart representation */}
            <div className="flex flex-col justify-center items-center p-3 border border-gray-200/10 rounded-2xl">
              <span className="text-[10px] text-gray-400 uppercase font-black text-center block mb-2">Customer Demographics segmentation</span>
              <div className="h-36 w-full" style={{ minHeight: "144px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={144} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx="50%"
                      cy="50%"
                      outerRadius={45}
                      dataKey="value"
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </SafeResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2 text-[9px] font-mono leading-none">
                {customerSegments.map(c => (
                  <span key={c.name} className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: c.color }}></span> {c.name.split(" ")[0]}</span>
                ))}
              </div>
            </div>

            {/* LINE CHART: Growth Trend */}
            <div className="lg:col-span-2 space-y-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-black">Loyalty program usage growth</span>
              <div className="h-44" style={{ minHeight: "176px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={176} minWidth={0}>
                  <LineChart data={[
                    { name: "Week 1", coins: 1400, registrations: 340 },
                    { name: "Week 2", coins: 2100, registrations: 450 },
                    { name: "Week 3", coins: 2800, registrations: 512 },
                    { name: "Week 4", coins: 3900, registrations: 680 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" fontSize={9} />
                    <YAxis fontSize={9} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 9 }} />
                    <Line type="monotone" name="Googly Coins Gained" dataKey="coins" stroke="#e11d48" strokeWidth={2} />
                    <Line type="monotone" name="New Registrations" dataKey="registrations" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </SafeResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- RESTAURANT PERFORMANCE ANALYTICS RANKINGS --- */}
      {personalization.showRestaurantStats && (
        <div className={`p-6 rounded-3xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100/10 pb-4">
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Restaurant Outpost Rankings & Commission Audits
              </h3>
              <p className="text-xs text-gray-500 font-medium font-sans">
                Summary of total sales done per brand entity and calculated delivery commission logs.
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-bold text-[#E23744]">
              <span>Active restaurants tracked in central grid:</span>
              <span className="px-2 py-0.5 bg-[#E23744]/10 rounded">{restaurants.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Horizontal Bar Comparisons chart */}
            <div className="lg:col-span-2 overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-[10px] text-gray-400 uppercase font-black">
                    <th className="pb-2">Restaurant Name</th>
                    <th className="pb-2">Orders Done</th>
                    <th className="pb-2 font-mono">Sales Total</th>
                    <th className="pb-2 text-center">Satisfaction</th>
                    <th className="pb-2 text-center">FSSAI Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150/10">
                  {restaurants.slice(0, 5).map(r => (
                    <tr 
                      key={r.id} 
                      className="hover:bg-gray-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => handleChartRestaurantClick(r.name)}
                    >
                      <td className="py-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
                        {r.name}
                      </td>
                      <td className="py-3 font-mono">142 orders</td>
                      <td className="py-3 font-mono font-black text-emerald-600">₹{ r.rating > 4 ? "48,450" : "29,400" }</td>
                      <td className="py-3 text-center text-xs font-bold text-amber-500">
                        ⭐ {r.rating} / 5
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded font-black text-[9px] uppercase tracking-wider">
                          Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] font-medium text-gray-400 mt-2 font-mono">
                * Click on any restaurant's row to filter the entire dashboard report matching that outpost.
              </div>
            </div>

            {/* Visual Mini bar stats */}
            <div className="p-4 bg-gray-50/20 dark:bg-slate-800/60 rounded-2xl border border-gray-200/10 space-y-4">
              <span className="text-[10px] text-amber-600 block font-black uppercase">Regulatory Compliance</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span>Completed KYC compliance:</span>
                  <span>100% Secure</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "100%" }}></div>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span>Rejected fssai expirations:</span>
                  <span>0 critical alerts</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: "3%" }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- RIDER PERFORMANCE LOGISTICS SECURITY --- */}
      {personalization.showRiderStats && (
        <div className={`p-6 rounded-3xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100/10 pb-4">
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Rider Partner Efficiencies & Acceptance Rates
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Analysis of fleet active statuses, total deliveries done per rider, and current wallet payout balances.
              </p>
            </div>

            <div className="p-1 px-3 bg-indigo-500/10 text-indigo-500 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <span>Riders fleet active:</span>
              <span>{riders.length} Online</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200/5 font-mono text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-55/40 dark:bg-slate-800 text-[10px] text-gray-400 uppercase font-black tracking-wider border-b border-gray-100 dark:border-slate-800">
                  <th className="p-3">Rider Identity</th>
                  <th className="p-3">Deliveries Count</th>
                  <th className="p-3">Wallet Payout Balance</th>
                  <th className="p-3 text-center">Avg Transit Delay</th>
                  <th className="p-3 text-center border-l border-gray-100/10">App Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150/10">
                {riders.slice(0, 5).map(rider => (
                  <tr key={rider.id} className="hover:bg-gray-50/10 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${rider.status === "Online" || rider.status === "On-Delivery" ? "bg-emerald-500" : "bg-gray-400"} block`}></span>
                        {rider.name}
                      </div>
                      <span className="text-[10px] text-gray-400 block font-mono">Vehicle: {rider.vehicleNumber}</span>
                    </td>
                    <td className="p-3 font-semibold">18 Completed Today</td>
                    <td className="p-3 font-bold text-emerald-600">₹{rider.walletBalance.toLocaleString()}</td>
                    <td className="p-3 text-center text-teal-650 font-bold">14.2 min (Fast)</td>
                    <td className="p-3 text-center text-amber-500 font-bold border-l border-gray-100/10">
                      ⭐ {rider.rating} / 5
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- DELIVERY & LOGISTIC OPERATIONS HEATMAP (Visual Grid representation) --- */}
      {personalization.showOperationsStats && (
        <div className={`p-6 rounded-3xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
          <div>
            <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Delivery Heatmaps & Regional Demand Ratios
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Geographical distribution map of order density peaks within corporate sectors. Red segments indicate high-demand surge grids.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Visual vector grid heatmap representation */}
            <div className="lg:col-span-3 border border-gray-200/10 p-4 rounded-3xl bg-slate-900 flex flex-col justify-between items-center relative overflow-hidden h-72">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              <div className="z-10 w-full flex justify-between text-white text-[10px] font-mono select-none">
                <span>🛰️ GPS Live telemetry layer</span>
                <span className="text-red-500 font-bold">● High density grid surge recommends</span>
              </div>

              {/* Grid representation */}
              <div className="z-10 grid grid-cols-5 gap-2.5 w-full max-w-lg">
                {[
                  { name: "Grid Sec-V", density: "High", color: "bg-red-500/80 animate-pulse border border-red-500" },
                  { name: "Grid Salt Lake", density: "Medium", color: "bg-amber-500/60" },
                  { name: "Grid Lake Town", density: "Low", color: "bg-emerald-500/20" },
                  { name: "Grid Gariahat", density: "High", color: "bg-red-500/70 border border-red-400" },
                  { name: "Grid Jadavpur", density: "Medium", color: "bg-amber-500/40" },
                  { name: "Grid Bypass", density: "Low", color: "bg-emerald-500/30" },
                  { name: "Grid Newtown", density: "High", color: "bg-red-500/90 animate-pulse border border-red-700" },
                  { name: "Grid Phoolbagan", density: "Low", color: "bg-emerald-500/10" },
                  { name: "Grid Kasba", density: "Medium", color: "bg-amber-500/50" },
                  { name: "Grid Dumdum", density: "Low", color: "bg-emerald-500/10" }
                ].map((g, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => triggerToast("Geofence Drilled", `Audited logistics layer for ${g.name}. Peak load multiplier: 1.5x`, "info")}
                    className={`p-3 rounded-xl text-center cursor-pointer transition-transform hover:scale-105 ${g.color} text-white text-[9px] font-bold font-mono`}
                  >
                    <div>{g.name}</div>
                    <div className="opacity-80 text-[8px] font-normal">{g.density} load</div>
                  </div>
                ))}
              </div>

              <div className="z-10 text-[9px] text-gray-500 font-mono text-center">
                * Simulated delivery zones mapped above. Interactive nodes can be tapped to drill down specific logistics reports.
              </div>
            </div>

            {/* General Operation Logistics lists */}
            <div className="space-y-4">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-black">Live Operational Signal Feeds</span>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-[11px] leading-tight font-sans">
                {liveEvents.map(e => (
                  <div key={e.id} className="p-2 bg-gray-50/50 dark:bg-slate-900 border border-gray-200/10 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded text-white ${e.badgeColor}`}>
                        {e.badge}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono">{e.time}</span>
                    </div>
                    <p className="text-[#1C1C1C] dark:text-gray-300 font-semibold">{e.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- ADVANCED PREDICTIVE ANALYTICS & FORECASTING CANVAS (Inspired by Power BI) --- */}
      {personalization.showForecastPanel && (
        <div className={`p-6 rounded-3xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100/10 pb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="p-1 px-2 bg-indigo-500 bg-indigo-500 text-indigo-500 font-black text-[9px] rounded uppercase tracking-wider animate-pulse">Predictive AI Agent</span>
                <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  7-Day Seasonal Revenue & Demand Forecasting
                </h3>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Autoregressive Integrated Moving Average (ARIMA) model extrapolating future pipeline transits based on regional historical variables.
              </p>
            </div>
            
            <div className="p-2 border border-blue-500/20 bg-blue-500/5 rounded-2xl text-[11px] font-mono leading-none max-w-sm text-blue-500">
              ⚡ <strong>Confidence Interval:</strong> 95% threshold accuracy index
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LINE CHART GRAPH - Predictions */}
            <div className="lg:col-span-2 w-full h-96 min-h-[300px]" style={{ minHeight: "300px", minWidth: 0 }}>
              <SafeResponsiveContainer minHeight={300} minWidth={0}>
                <LineChart data={predictiveForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" fontSize={10} stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <YAxis fontSize={10} stroke={isDarkMode ? "#94a3b8" : "#64748b"} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" name="Upper Confidence Range (₹)" dataKey="upperBound" stroke="#10b981" strokeDasharray="3 3" />
                  <Line type="monotone" name="Predicted Revenue (₹)" dataKey="forecastRevenue" stroke="#6366f1" strokeWidth={3} />
                  <Line type="monotone" name="Lower Safety Range (₹)" dataKey="lowerBound" stroke="#ef4444" strokeDasharray="3 3" />
                </LineChart>
              </SafeResponsiveContainer>
            </div>

            {/* Forecasting analysis bulletin blocks */}
            <div className="space-y-4 font-sans text-xs">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-black">AI Demand Analysis Reports</span>
              
              <div className="p-4 bg-gray-50/50 dark:bg-slate-800 rounded-2xl border border-gray-200/10 space-y-3">
                <div className="space-y-1">
                  <div className="flex gap-1 items-center font-bold text-slate-900 dark:text-white">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Weekend Spike Predicted
                  </div>
                  <p className="text-gray-500 leading-normal text-[11px]">
                    Expected +42% volume uplift next Friday and Saturday stemming from atmospheric rain forecasts. Recommendation: Activate rider surges inside Kolkata Hub.
                  </p>
                </div>

                <div className="space-y-1 border-t border-gray-100 dark:border-slate-700 pt-3">
                  <div className="flex gap-1 items-center font-bold text-red-700">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Customer Churn Advisory
                  </div>
                  <p className="text-gray-500 leading-normal text-[11px]">
                    Analysis flags a minor 2.4% attrition spike around residential sectors. Triggering auto promo campaigns targeting high-value repeat clients.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- FINANCIAL REPORTS DOWNLOAD SECTION --- */}
      <div className={`p-6 rounded-3xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
        <div>
          <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Corporate Financial Statements & Settlement Audits
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Generate and dispatch verifiable financial ledger reports directly to compliance teams and accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans text-xs">
          {[
            { name: "Platform Gross Revenue Audit", type: "Revenue Report", description: "Consolidated statement containing order amounts, platform commissions, and net pay." },
            { name: "Commission Inward Ledger", type: "Commission Report", description: "Statement detailing 18% administrative fee gains sliced per partner outpost." },
            { name: "Rider Payout Disbursement Sheet", type: "Rider Earnings Report", description: "Contains completed shipping delivery runs and individual mobile wallet payouts." },
            { name: "State GST & Invoice Audit", type: "Tax Report", description: "Verifiable legal report detailing collected GST values for compliance files." },
            { name: "Refund & Dispute Indemnity", type: "Refund Report", description: "Logbook of disputed tickets compiled with processed immediate refunds." },
            { name: "Settlement Disbursement Logs", type: "Restaurant Settlement Report", description: "Disbursed earnings statement routed toward designated restaurant accounts." }
          ].map((r, index) => (
            <div key={index} className="p-4 border border-gray-200/10 hover:border-gray-300/30 rounded-2xl flex flex-col justify-between space-y-4 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] text-[#E23744] uppercase font-black tracking-wider">{r.type}</span>
                <h4 className="font-extrabold text-gray-900 dark:text-white">{r.name}</h4>
                <p className="text-[11px] text-gray-500 leading-normal">{r.description}</p>
              </div>

              <div className="flex items-center gap-2 select-none border-t border-gray-50 dark:border-slate-900 pt-2 bg-gray-50/10">
                <button
                  onClick={() => triggerToast("View Report Ready", `Displaying inline spreadsheet matrix for ${r.name}`, "info")}
                  className="p-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                >
                  View
                </button>
                <button
                  onClick={handleExportCSV}
                  className="p-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="p-1.5 px-3 bg-[#E23744] hover:bg-red-600 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                >
                  PDF
                </button>
                <button
                  onClick={() => handleEmailReportSim(r.type)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 cursor-pointer"
                  title="Ship report to admin emails"
                >
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- CUSTOM REPORT BUILDER STUDIO (Inspired by GA4 / Shopify) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className={`p-6 rounded-3xl border lg:col-span-2 space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
          <div>
            <h3 className={`text-base font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Custom Report Generator Studio
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Formulate your own business intelligence sheets by picking precise columns, filter vectors, and output layouts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-gray-400 font-bold uppercase text-[10px]">Report Label Title</label>
                <input
                  type="text"
                  value={customReportName}
                  onChange={(e) => setCustomReportName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] focus:outline-hidden ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                  placeholder="e.g. Weekly Sales Ledger"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-400 font-bold uppercase text-[10px]">Relational Report Type</label>
                <select
                  value={customReportType}
                  onChange={(e) => setCustomReportType(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                >
                  <option value="Revenue Report">Revenue Statement Audit</option>
                  <option value="Commission Report">Commission Ledgers</option>
                  <option value="Tax Report">GST Invoice Statement</option>
                  <option value="Rider Earnings Report">Courier Wallet Transits</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-400 font-bold uppercase text-[10px]">Filter Pivot scope (City)</label>
                <select
                  value={customReportFilterCity}
                  onChange={(e) => setCustomReportFilterCity(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                >
                  <option value="All">All Cities</option>
                  <option value="Kolkata">Kolkata</option>
                  <option value="Salt Lake">Salt Lake</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-gray-400 font-bold uppercase text-[10px]">Select Data Matrix Columns</label>
                <div className="grid grid-cols-2 gap-2 border border-gray-200/10 p-3 rounded-xl bg-gray-50/20 dark:bg-slate-800">
                  {["Revenue", "Orders Count", "Commission Rate", "Average Rating", "Cancellation Index", "Rider SLA Time"].map(f => (
                    <label key={f} className="flex items-center gap-1.5 font-semibold text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customReportFields.includes(f)}
                        onChange={() => handleFieldToggle(f)}
                        className="rounded text-[#E23744] border-gray-300 focus:ring-[#E23744]"
                      />
                      <span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-gray-400 font-bold uppercase text-[10px]">Timeframe Interval</label>
                <select
                  value={customReportRange}
                  onChange={(e) => setCustomReportRange(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                >
                  <option value="Today">Today Only</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-2 border-t border-gray-50 dark:border-slate-900 pt-4 select-none">
            <button
              onClick={handleSaveReportTemplate}
              className="px-4 py-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-900 text-slate-800 dark:text-white font-bold rounded-xl cursor-pointer"
            >
              Save Schema Template
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Download className="w-4 h-4" /> Compile & Download CSV
            </button>
          </div>
        </div>

        {/* Custom saved template presets list inside workspace */}
        <div className={`p-6 rounded-3xl border space-y-4 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100 shadow-sm"}`}>
          <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">Saved Report Blueprints</h3>
          <p className="text-[11px] text-gray-500 font-medium">Template setups saved by the administrative staff for instant compilation.</p>

          <div className="space-y-3 font-sans text-xs">
            {customSavedTemplates.map(tmpl => (
              <div key={tmpl.id} className="p-3.5 border border-gray-200/10 rounded-xl hover:border-[#E23744]/30 transition-all space-y-2">
                <div className="flex justify-between items-center bg-gray-50/10">
                  <span className="font-extrabold text-slate-900 dark:text-white">{tmpl.name}</span>
                  <span className="p-0.5 px-2 bg-red-100 text-[#E23744] rounded text-[9px] font-black uppercase tracking-wider">{tmpl.type.split(" ")[0]}</span>
                </div>
                
                <div className="text-[10px] text-gray-500 font-semibold space-y-1">
                  <div>⏰ Timeframe: {tmpl.dateRange}</div>
                  <div>📊 Column metrics: {tmpl.fields.join(", ")}</div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-55/10 pt-2 select-none">
                  <button
                    onClick={() => {
                      setCustomReportName(tmpl.name);
                      setCustomReportType(tmpl.type);
                      setCustomReportRange(tmpl.dateRange);
                      setCustomReportFields(tmpl.fields);
                      setCustomReportFilterCity(tmpl.filters.city);
                      setCustomReportFilterStatus(tmpl.filters.status);
                      triggerToast("Blueprint Loaded", `Substituted active generator values for '${tmpl.name}'`, "info");
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-1 px-2 rounded-md font-bold text-slate-820 dark:text-white cursor-pointer"
                  >
                    Load Schema
                  </button>
                  <button
                    onClick={() => {
                      setCustomSavedTemplates(prev => prev.filter(t => t.id !== tmpl.id));
                      triggerToast("Blueprint Discarded", "Schema template trashed.", "info");
                    }}
                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- PERSONALIZATION LAYOUT DIALOG MODAL --- */}
      {showPersonalizerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 rounded-3xl border border-gray-200/10 space-y-5 shadow-2xl animate-scale-up text-xs font-sans">
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Workspace Personalization Designer</h3>
                <p className="text-[10px] text-gray-400">Hide, show, and personalize the sections visible inside this BI report dashboard.</p>
              </div>
              <button onClick={() => setShowPersonalizerModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-semibold text-slate-700 dark:text-gray-200">
              <label className="flex items-center justify-between p-2.5 hover:bg-gray-50/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                <span>Revenue Overview Profit Analysis Chart</span>
                <input
                  type="checkbox"
                  checked={personalization.showRevenueStats}
                  onChange={(e) => setPersonalization({ ...personalization, showRevenueStats: e.target.checked })}
                  className="rounded text-[#E23744] focus:ring-[#E23744]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 hover:bg-gray-50/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                <span>Meal Transit Hour Distribution & Channel Inflows</span>
                <input
                  type="checkbox"
                  checked={personalization.showOrderStats}
                  onChange={(e) => setPersonalization({ ...personalization, showOrderStats: e.target.checked })}
                  className="rounded text-[#E23744] focus:ring-[#E23744]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 hover:bg-gray-50/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                <span>Cohort Segments & Client Satisfaction Factors</span>
                <input
                  type="checkbox"
                  checked={personalization.showCustomerStats}
                  onChange={(e) => setPersonalization({ ...personalization, showCustomerStats: e.target.checked })}
                  className="rounded text-[#E23744] focus:ring-[#E23744]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 hover:bg-gray-50/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                <span>Restaurant Outpost Sales Comparisons Registry</span>
                <input
                  type="checkbox"
                  checked={personalization.showRestaurantStats}
                  onChange={(e) => setPersonalization({ ...personalization, showRestaurantStats: e.target.checked })}
                  className="rounded text-[#E23744] focus:ring-[#E23744]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 hover:bg-gray-50/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                <span>Courier Fleet Acceptance & Rating Scores List</span>
                <input
                  type="checkbox"
                  checked={personalization.showRiderStats}
                  onChange={(e) => setPersonalization({ ...personalization, showRiderStats: e.target.checked })}
                  className="rounded text-[#E23744] focus:ring-[#E23744]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 hover:bg-gray-50/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                <span>Live GPS Heatmap Zones Loading Layers</span>
                <input
                  type="checkbox"
                  checked={personalization.showOperationsStats}
                  onChange={(e) => setPersonalization({ ...personalization, showOperationsStats: e.target.checked })}
                  className="rounded text-[#E23744] focus:ring-[#E23744]"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 hover:bg-gray-50/50 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                <span>ARIMA Demand & Predictive AI Estimates Chart</span>
                <input
                  type="checkbox"
                  checked={personalization.showForecastPanel}
                  onChange={(e) => setPersonalization({ ...personalization, showForecastPanel: e.target.checked })}
                  className="rounded text-[#E23744] focus:ring-[#E23744]"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-50 dark:border-slate-800 pt-3 text-xs select-none">
              <button
                onClick={() => {
                  setPersonalization({
                    showRevenueStats: true,
                    showOrderStats: true,
                    showCustomerStats: true,
                    showRestaurantStats: true,
                    showRiderStats: true,
                    showOperationsStats: true,
                    showForecastPanel: true
                  });
                  triggerToast("Design Setup Reset", "Re-enabled all dashboard report modules.", "info");
                }}
                className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-slate-800 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white font-bold rounded-xl cursor-pointer"
              >
                Reset Defaults
              </button>
              <button
                onClick={() => {
                  setShowPersonalizerModal(false);
                  triggerToast("Personalized Layout Saved", "BI platform configurations updated successfully.", "success");
                }}
                className="px-4 py-2 bg-[#E23744] hover:bg-red-600 text-white font-bold rounded-xl cursor-pointer"
              >
                Apply Designer Build
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BILLING PERIOD / CUSTOM DATE INTERVAL MODAL --- */}
      {showCustomRangeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-3xl border border-gray-200/10 space-y-4 shadow-2xl animate-scale-up text-xs font-sans">
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-800 pb-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">📅 Custom Date Spectrum</h3>
              <button onClick={() => setShowCustomRangeModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-semibold">
              <div className="space-y-1">
                <label className="text-gray-400 font-bold block">Start Audit Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-bold block">End Audit Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                />
              </div>
            </div>

            <button
              onClick={() => {
                setShowCustomRangeModal(false);
                setSelectedDateRange(`${customStartDate} to ${customEndDate}`);
                triggerToast("Custom Date Set", `Platform views recalculated from ${customStartDate} to ${customEndDate}`, "success");
              }}
              className="w-full py-2.5 bg-[#E23744] hover:bg-red-600 text-white font-bold rounded-xl cursor-pointer"
            >
              Analyze Custom Range
            </button>
          </div>
        </div>
      )}

      {/* --- SCHEDULING DISBURSEMENT MODAL --- */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm p-6 rounded-3xl border border-gray-200/10 space-y-4 shadow-2xl animate-scale-up text-xs font-sans">
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-slate-800 pb-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">📅 Autopilot Report Scheduler</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-semibold">
              <div className="space-y-1">
                <label className="text-gray-400 font-bold block">Frequency Interval</label>
                <select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                >
                  <option value="Daily">Daily Summary (Every morning at 8:00 AM)</option>
                  <option value="Weekly">Weekly Statement (Every Monday checkout)</option>
                  <option value="Monthly">Monthly Financial Audit (1st of month)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 font-bold block">Dispatch Stream Channel</label>
                <select
                  value={scheduleMethod}
                  onChange={(e) => setScheduleMethod(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isDarkMode ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                >
                  <option value="Email">Verify and Dispatch via Email to admin list</option>
                  <option value="Admin Dashboard">Host only on Admin Reports Dashboard tabs</option>
                  <option value="Cloud Storage">Auto-push encryption code backup to Google Cloud Storage bucket</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleConfirmSchedule}
              className="w-full py-2.5 bg-[#E23744] hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Activate Automated Reports
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
