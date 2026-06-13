import React, { useState, useEffect, useMemo, useRef } from "react";
import { Order, Rider, OrderStatus, RiderStatus } from "../types";
import { useCityContext } from "../context/CityContext";
import { 
  MapPin, Search, Sliders, RefreshCw, ZoomIn, ZoomOut, Maximize2, 
  Sparkles, Check, Phone, X, AlertTriangle, Play, Settings, 
  User, Compass, Bell, Activity, Clock, Trash2, Send, Info, 
  ChevronRight, CheckCircle, HelpCircle, ArrowRight, Sun, Moon, 
  UserCheck, ShieldAlert, Award, AlertCircle, TrendingUp, BarChart2, 
  Grid, Database, Layers, CheckSquare, Square, Volume2, Save, FileText,
  Smartphone, Share2, ClipboardList, Ban, ThumbsUp, RefreshCw as LoopIcon
} from "lucide-react";
import OSMInteractiveMap from "./OSMInteractiveMap";

// Types for dispatch logs & notifications
interface DispatchHistoryLog {
  id: string;
  orderId: string;
  riderId: string;
  riderName: string;
  assignmentTime: string;
  responseTime: string;
  status: "Accepted" | "Rejected" | "Expired" | "Reassigned" | "Completed";
  reassignmentCount: number;
}

interface NotificationSetting {
  id: string;
  name: string;
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
  inApp: boolean;
}

interface DeliveryDispatchModuleProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  riders: Rider[];
  setRiders: React.Dispatch<React.SetStateAction<Rider[]>>;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function DeliveryDispatchModule({
  orders,
  setOrders,
  riders,
  setRiders,
  triggerToast
}: DeliveryDispatchModuleProps) {
  // Theme & Section state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"operations" | "analytics" | "notifications">("operations");

  // Filter States
  const [cityFilter, setCityFilter] = useState<string>("All");
  const [zoneFilter, setZoneFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [riderStatusFilter, setRiderStatusFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Map settings
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [mapTraffic, setMapTraffic] = useState<boolean>(true);
  const [selectedMapPoint, setSelectedMapPoint] = useState<any>(null);

  // Workflow states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState<boolean>(false);

  // Rider filters inside manual assign sidepanel
  const [riderSearch, setRiderSearch] = useState<string>("");
  const [riderSortBy, setRiderSortBy] = useState<"distance" | "rating" | "acceptance" | "active">("distance");
  const [riderFilterCategory, setRiderFilterCategory] = useState<"all" | "nearest" | "highest-rated" | "available">("all");

  // Real-Time Notification simulation properties
  const [activeAssignment, setActiveAssignment] = useState<{
    orderId: string;
    riderId: string;
    riderName: string;
    timeLeft: number; // in seconds
    status: "Sent" | "Delivered" | "Viewed" | "Accepted" | "Rejected" | "Expired";
    autoReassignEnabled: boolean;
    retryCount: number;
  } | null>(null);

  // Escalation rule config variables
  const [isAutoReassignEnabled, setIsAutoReassignEnabled] = useState<boolean>(true);
  const [isManualReassignRequired, setIsManualReassignRequired] = useState<boolean>(false);
  const [maxRetryCount, setMaxRetryCount] = useState<number>(3);

  // Sound chimes simulator status
  const [globalVolume, setGlobalVolume] = useState<number>(80);
  const [isAmbientSoundOn, setIsAmbientSoundOn] = useState<boolean>(true);

  // Selected Order for viewing visual details
  const [detailedOrder, setDetailedOrder] = useState<Order | null>(null);

  const { cities } = useCityContext();
  // Static list of Cities & Zones for custom filters
  const citiesList = ["All", ...cities];
  const zonesList = ["All", "North Zone", "South Sector", "Central Hub", "East End"];

  // Real-world dummy assignment logs for the enterprise dashboard grid
  const [dispatchHistory, setDispatchHistory] = useState<DispatchHistoryLog[]>([
    { id: "log-1", orderId: "A9M2C4", riderId: "V8K3A2", riderName: "Subhas Sharma", assignmentTime: "11:42 AM", responseTime: "24s", status: "Accepted", reassignmentCount: 0 },
    { id: "log-2", orderId: "X1P8L5", riderId: "P2Q7L8", riderName: "Rahul Pal", assignmentTime: "11:20 AM", responseTime: "1m 12s", status: "Completed", reassignmentCount: 1 },
    { id: "log-3", orderId: "R7G3K9", riderId: "F1D8C4", riderName: "Bishal Roy", assignmentTime: "10:55 AM", responseTime: "Expired", status: "Expired", reassignmentCount: 2 },
    { id: "log-4", orderId: "D4T1Z9", riderId: "M9X4R1", riderName: "Karan Sen", assignmentTime: "10:15 AM", responseTime: "Rejected", status: "Rejected", reassignmentCount: 1 },
    { id: "log-5", orderId: "B7F3M1", riderId: "Z3H6B9", riderName: "Amit Das", assignmentTime: "09:44 AM", responseTime: "45s", status: "Accepted", reassignmentCount: 0 }
  ]);

  // Push notifications channel structures
  const [notificationsList, setNotificationsList] = useState<NotificationSetting[]>([
    { id: "n-1", name: "New Assignment Alert", push: true, sms: true, whatsapp: true, inApp: true },
    { id: "n-2", name: "30 Seconds Remaining Alert", push: true, sms: false, whatsapp: false, inApp: true },
    { id: "n-3", name: "1 Minute Remaining Alert", push: true, sms: false, whatsapp: false, inApp: true },
    { id: "n-4", name: "Assignment Expiry Alert", push: true, sms: true, whatsapp: true, inApp: true }
  ]);

  // Bulk assignment checklists tracking
  const [checkedOrdersList, setCheckedOrdersList] = useState<string[]>([]);

  // 120-seconds real-time responder timer ticker
  useEffect(() => {
    let interval: any = null;
    if (activeAssignment && activeAssignment.status !== "Accepted" && activeAssignment.status !== "Rejected" && activeAssignment.status !== "Expired") {
      interval = setInterval(() => {
        setActiveAssignment(prev => {
          if (!prev) return null;
          if (prev.timeLeft <= 1) {
            clearInterval(interval);
            // Fire expiry synthesizer sound
            playSynthTone("Expired");
            handleAssignmentExpiry(prev);
            return { ...prev, timeLeft: 0, status: "Expired" };
          }
          
          // Simulate driver behavior step metrics
          let nextStatus = prev.status;
          if (prev.timeLeft === 115) {
            nextStatus = "Delivered";
          } else if (prev.timeLeft === 108) {
            nextStatus = "Viewed";
            playSynthTone("Viewed");
          } else if (prev.timeLeft === 95 && Math.random() > 0.85) {
            // Chance of random simulated accept
            clearInterval(interval);
            playSynthTone("Accepted");
            setTimeout(() => finalizeRiderAcceptance(prev), 100);
            return { ...prev, timeLeft: prev.timeLeft - 1, status: "Accepted" };
          } else if (prev.timeLeft === 80 && Math.random() > 0.9) {
            // Chance of random rejection
            clearInterval(interval);
            playSynthTone("Rejected");
            setTimeout(() => handleAssignmentRejection(prev), 100);
            return { ...prev, timeLeft: prev.timeLeft - 1, status: "Rejected" };
          }

          return { ...prev, timeLeft: prev.timeLeft - 1, status: nextStatus };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeAssignment]);

  // Synthesis Audio generator using Web Audio API: Zero missing file errors across all devices
  const playSynthTone = (type: "Assign" | "Accepted" | "Rejected" | "Expired" | "Viewed") => {
    if (!isAmbientSoundOn) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const vol = (globalVolume / 100) * 0.2; // keep safe ceiling
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      const now = ctx.currentTime;

      switch (type) {
        case "Assign": // Sweet warning arpeggio
          osc.type = "sine";
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.setValueAtTime(554.37, now + 0.1);
          osc.frequency.setValueAtTime(659.25, now + 0.2);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        case "Accepted": // Joyful success note
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(783.99, now + 0.12);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case "Rejected": // Sad decline sweep
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(330, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
          osc.start(now);
          osc.stop(now + 0.38);
          break;
        case "Expired": // Dual repeating warning
          osc.type = "square";
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.setValueAtTime(220, now + 0.15);
          gain.gain.setValueAtTime(vol * 1.2, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case "Viewed": // Quick high pitch blip
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(vol * 0.8, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
      }
    } catch (e) {
      console.warn("Audio Context init error or disabled user permissions", e);
    }
  };

  // Callback logic when timer runs out
  const handleAssignmentExpiry = (curr: any) => {
    triggerToast("Assignment Timeout", `Order ${curr.orderId} alert expired. Rider has not responded.`, "error");
    
    // Add audit log
    const indexStr = `log-${Date.now()}`;
    const newHistoryLog: DispatchHistoryLog = {
      id: indexStr,
      orderId: curr.orderId,
      riderId: curr.riderId,
      riderName: curr.riderName,
      assignmentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responseTime: "Expired (2m)",
      status: "Expired",
      reassignmentCount: curr.retryCount + 1
    };
    setDispatchHistory(prev => [newHistoryLog, ...prev]);

    if (isAutoReassignEnabled && curr.retryCount < maxRetryCount) {
      // Find another best available rider automatically
      const nextRider = riders.find(r => r.active && r.status === "Online" && r.id !== curr.riderId);
      if (nextRider) {
        setTimeout(() => {
          triggerToast("Auto-Reassignment", `Routing ${curr.orderId} immediately to next best partner: ${nextRider.name}.`, "info");
          executeDirectAssignment(curr.orderId, nextRider);
        }, 3000);
      } else {
        triggerToast("No Alternates Found", `No active backup riders match online bounds. Order re-opened.`, "error");
      }
    }
  };

  // Rejection logic handle
  const handleAssignmentRejection = (curr: any) => {
    triggerToast("Assignment Rejected", `Rider ${curr.riderName} declined Order ${curr.orderId}.`, "error");
    
    const indexStr = `log-${Date.now()}`;
    const newHistoryLog: DispatchHistoryLog = {
      id: indexStr,
      orderId: curr.orderId,
      riderId: curr.riderId,
      riderName: curr.riderName,
      assignmentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responseTime: "Rejected (45s)",
      status: "Rejected",
      reassignmentCount: curr.retryCount + 1
    };
    setDispatchHistory(prev => [newHistoryLog, ...prev]);

    if (isAutoReassignEnabled) {
      const nextRider = riders.find(r => r.active && r.status === "Online" && r.id !== curr.riderId);
      if (nextRider) {
        triggerToast("Auto-Reassignment Initialized", `Re-routing Order to next ready rider: ${nextRider.name}`, "info");
        executeDirectAssignment(curr.orderId, nextRider);
      }
    }
  };

  // Acceptance workflow
  const finalizeRiderAcceptance = (curr: any) => {
    triggerToast("Order Accepted!", `${curr.riderName} accepted assignment for ${curr.orderId}.`, "success");

    // Update global state of orders and riders
    setOrders(prev => prev.map(o => o.id === curr.orderId ? { ...o, status: "Preparing", riderId: curr.riderId, riderName: curr.riderName } : o));
    setRiders(prev => prev.map(r => r.id === curr.riderId ? { ...r, status: "On-Delivery" } : r));

    // Audit Log Entry
    const indexStr = `log-${Date.now()}`;
    const newHistoryLog: DispatchHistoryLog = {
      id: indexStr,
      orderId: curr.orderId,
      riderId: curr.riderId,
      riderName: curr.riderName,
      assignmentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responseTime: "42s",
      status: "Accepted",
      reassignmentCount: curr.retryCount
    };
    setDispatchHistory(prev => [newHistoryLog, ...prev]);
    setActiveAssignment(null);
  };

  // Manual select and immediately assign function
  const executeDirectAssignment = (orderId: string, rider: Rider) => {
    // Fire synthesizer beep
    playSynthTone("Assign");

    const activeItem = {
      orderId,
      riderId: rider.id,
      riderName: rider.name,
      timeLeft: 120, // 2-minute countdown
      status: "Sent" as const,
      autoReassignEnabled: isAutoReassignEnabled,
      retryCount: activeAssignment?.orderId === orderId ? activeAssignment.retryCount + 1 : 0
    };

    setActiveAssignment(activeItem);
    triggerToast("Assignment Transmitted", `Push & In-App alert dispatched to ${rider.name}. Driver response awaited.`, "info");
  };

  const handleOpenAssignWorkflow = (order: Order) => {
    setSelectedOrder(order);
    // Auto populate top candidate recommended
    const topRider = riders.find(r => r.active && r.status === "Online");
    setSelectedRider(topRider || null);
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssignmentModal = () => {
    if (!selectedOrder || !selectedRider) return;
    setIsConfirmationOpen(false);
    setIsAssignModalOpen(false);
    
    executeDirectAssignment(selectedOrder.id, selectedRider);
    setSelectedOrder(null);
  };

  // Bulk Auto assign algorithm
  const triggerBulkAutoAssign = () => {
    if (checkedOrdersList.length === 0) {
      triggerToast("No Selection", "Please check-mark at least one unassigned order to execute bulk assignment.", "error");
      return;
    }

    const unassignedChecked = orders.filter(o => checkedOrdersList.includes(o.id) && !o.riderId);
    if (unassignedChecked.length === 0) {
      triggerToast("No Orders", "Selected orders are already assigned to riders.", "info");
      return;
    }

    let allocatedCounter = 0;
    let availableRiders = riders.filter(r => r.active && r.status === "Online");

    if (availableRiders.length === 0) {
      triggerToast("All Riders Busy", "No active online riders found. Real-time reallocation standby.", "error");
      return;
    }

    const updatedOrders = orders.map(o => {
      if (checkedOrdersList.includes(o.id) && !o.riderId) {
        const matchingRider = availableRiders.shift();
        if (matchingRider) {
          allocatedCounter++;
          // Trigger mock state update on the rider too
          setRiders(prev => prev.map(r => r.id === matchingRider.id ? { ...r, status: "On-Delivery" } : r));
          return {
            ...o,
            status: "Preparing" as OrderStatus,
            riderId: matchingRider.id,
            riderName: matchingRider.name
          };
        }
      }
      return o;
    });

    setOrders(prev => prev.map(o => {
       const uo = updatedOrders.find(u => u.id === o.id);
       return uo || o;
    }));
    setCheckedOrdersList([]);
    triggerToast("Bulk Assign Successful", `Allocated ${allocatedCounter} pending tickets optimized by logistics coordinates.`, "success");
  };

  // Refresh rider status simulation callback
  const simulateRefreshRiderPositions = () => {
    // Randomize telemetry positions for online riders slightly to showcase real-time map updates
    setRiders(prev => prev.map(r => {
      if (r.active && r.status === "Online") {
        const dx = (Math.random() - 0.5) * 5;
        const dy = (Math.random() - 0.5) * 5;
        return {
          ...r,
          x: Math.max(15, Math.min(85, r.x + dx)),
          y: Math.max(15, Math.min(85, r.y + dy))
        };
      }
      return r;
    }));
    triggerToast("Rider Positions Synced", "Re-indexed real-time GPS telemetry from active rider smartphones.", "success");
  };

  // Fast auto assignment for single event
  const executeInstantAutoAssign = (orderId: string) => {
    const candidate = riders.find(r => r.active && r.status === "Online");
    if (!candidate) {
      triggerToast("No Available Partners", "No active 'Online' riders found in the immediate sector.", "error");
      return;
    }
    executeDirectAssignment(orderId, candidate);
  };

  // Filters computed orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Must be unassigned or uncompleted for pending panel
      const isUnassigned = !o.riderId;
      const matchesSearch = searchQuery === "" || 
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        o.restaurantName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === "All" || 
        (priorityFilter === "Urgent" && o.billDetail.total > 1500) || 
        (priorityFilter === "VIP" && o.billDetail.total > 2000) ||
        (priorityFilter === "High" && o.billDetail.total > 1000 && o.billDetail.total <= 1500) ||
        (priorityFilter === "Normal" && o.billDetail.total <= 1000);

      // Simple mock zone match
      const matchesZone = zoneFilter === "All" || o.x > (zoneFilter === "East End" ? 50 : 0);

      return isUnassigned && matchesSearch && matchesPriority && matchesZone;
    });
  }, [orders, searchQuery, priorityFilter, zoneFilter]);

  // Compute stats helper
  const statistics = useMemo(() => {
    const totalPending = orders.filter(o => o.status === "Pending" && !o.riderId).length;
    const totalAssigned = orders.filter(o => o.riderId).length;
    const totalUnassigned = orders.filter(o => !o.riderId).length;
    
    const active = riders.filter(r => r.active && r.status !== "Offline").length;
    const available = riders.filter(r => r.active && r.status === "Online").length;
    const busy = riders.filter(r => r.active && r.status === "On-Delivery").length;
    const rejections = dispatchHistory.filter(l => l.status === "Rejected").length;

    return {
      totalPending,
      totalAssigned,
      totalUnassigned,
      active,
      available,
      busy,
      rejections
    };
  }, [orders, riders, dispatchHistory]);

  // Filters riders in Side panel manual assign list
  const filteredRidersForManual = useMemo(() => {
    let list = riders.filter(r => r.active);

    // Apply category filter
    if (riderFilterCategory === "nearest") {
      list = list.sort((a,b) => a.x - b.x); // simple proximity mock
    } else if (riderFilterCategory === "highest-rated") {
      list = list.filter(r => r.rating >= 4.8);
    } else if (riderFilterCategory === "available") {
      list = list.filter(r => r.status === "Online");
    }

    // Apply search filter
    if (riderSearch) {
      list = list.filter(r => r.name.toLowerCase().includes(riderSearch.toLowerCase()) || r.phone.includes(riderSearch));
    }

    // Apply sorting
    if (riderSortBy === "distance") {
      list = list.sort((a,b) => (a.x + a.y) - (b.x + b.y));
    } else if (riderSortBy === "rating") {
      list = list.sort((a,b) => b.rating - a.rating);
    } else if (riderSortBy === "acceptance") {
      list = list.sort((a,b) => b.rating - a.rating); // simple correlation
    } else if (riderSortBy === "active") {
      list = list.sort((a,b) => (a.status === "On-Delivery" ? -1 : 1));
    }

    return list;
  }, [riders, riderSortBy, riderSearch, riderFilterCategory]);

  // Custom priority helper badge
  const getPriorityText = (totalValue: number) => {
    if (totalValue > 2000) return { flag: "VIP", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" };
    if (totalValue > 1500) return { flag: "Urgent", color: "bg-red-500/10 text-red-500 border-red-500/20" };
    if (totalValue > 1000) return { flag: "High", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
    return { flag: "Normal", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
  };

  // Toggle single Checked Box
  const toggleOrderSelection = (id: string) => {
    setCheckedOrdersList(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Toggle all unchecked orders
  const toggleSelectAllPage = () => {
    const unassignedIds = filteredOrders.map(o => o.id);
    const allRegistered = unassignedIds.every(id => checkedOrdersList.includes(id));
    if (allRegistered) {
      setCheckedOrdersList(prev => prev.filter(id => !unassignedIds.includes(id)));
    } else {
      setCheckedOrdersList(prev => Array.from(new Set([...prev, ...unassignedIds])));
    }
  };

  return (
    <div id="manual-dispatch-operations-center" className={`rounded-3xl border transition-all duration-300 ${isDarkMode ? "bg-slate-900 text-slate-100 border-slate-800" : "bg-white text-slate-800 border-slate-200 shadow-2xl"}`}>
      
      {/* 1. TOP HEADER BRAND LOGISTICS ROW */}
      <div className={`p-6 border-b flex flex-wrap justify-between items-center gap-4 ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-[#FAF9FB]"}`}>
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-rose-500/10 rounded-2xl">
              <Compass className="w-6 h-6 text-rose-500 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                Manual Rider Dispatch Hub
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-rose-500/15 text-rose-500 rounded-full">REAL-TIME GPS</span>
              </h1>
              <p className="text-xs text-gray-700 dark:text-gray-400 mt-0.5">Allocate pending restaurant tickets, monitor active riders, and configure escalation protocols.</p>
            </div>
          </div>
        </div>

        {/* Action button controls toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Light/Dark Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl transition-all cursor-pointer border ${isDarkMode ? "bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-900" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-xs"}`}
            title="Toggle Dashboard Theme Style"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Refresh GPS Positions */}
          <button 
            onClick={simulateRefreshRiderPositions}
            className={`p-2.5 rounded-xl transition-all cursor-pointer border flex items-center gap-2 text-xs font-bold ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            title="Update driver physical coords"
          >
            <RefreshCw className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Refresh Rider Status</span>
          </button>

          {/* Bulk Assign */}
          <button 
            onClick={triggerBulkAutoAssign}
            disabled={checkedOrdersList.length === 0}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all relative flex items-center gap-1.5 ${
              checkedOrdersList.length > 0 
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer animate-pulse" 
                : "bg-slate-800 text-slate-500 border border-slate-700 opacity-60 cursor-not-allowed"
            }`}
          >
            <Layers className="w-4 h-4" />
            Bulk Assignment
            {checkedOrdersList.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-500 text-slate-900 font-black rounded-full text-[9px] flex items-center justify-center border border-white">
                {checkedOrdersList.length}
              </span>
            )}
          </button>

          {/* Auto Assign Toggle */}
          <div className={`p-1.5 rounded-xl border flex items-center gap-2 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-slate-200"}`}>
            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-400 pl-1.5">Auto Assign</span>
            <button
              onClick={() => {
                setIsAutoReassignEnabled(!isAutoReassignEnabled);
                triggerToast(
                  "Logistics Switch Toggled", 
                  `Dynamic backup re-routing ${!isAutoReassignEnabled ? "ENABLED" : "DISABLED"}`,
                  "info"
                );
              }}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-hidden ${isAutoReassignEnabled ? "bg-rose-500" : "bg-slate-700"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isAutoReassignEnabled ? "translate-x-4" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. LIVE TELEMETRY STATS BAR */}
      <div className={`p-5 grid grid-cols-2 md:grid-cols-7 gap-4 border-b ${isDarkMode ? "border-slate-800 bg-slate-900/20" : "border-slate-100 bg-[#FAF9FC]/50"}`}>
        <div className={`p-4 rounded-2xl border text-left ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase select-none">Pending Orders</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-black text-rose-5 animate-pulse text-rose-500">{statistics.totalPending}</span>
            <span className="text-[9px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-bold">Awaiting</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border text-left ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase select-none">Assigned Active</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-black text-blue-500">{statistics.totalAssigned}</span>
            <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-bold">In-Transit</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border text-left ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase select-none">Unassigned Box</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-black text-amber-500">{statistics.totalUnassigned}</span>
            <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-bold">Unallocated</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border text-left ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase select-none">Active Riders</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-black text-emerald-500">{statistics.active}</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">Checked-In</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border text-left ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase select-none">Ready Available</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-black text-emerald-400">{statistics.available}</span>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-full animate-ping text-[1px] w-2 h-2" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border text-left ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase select-none">On-Delivery Busy</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-black text-sky-500 text-indigo-400">{statistics.busy}</span>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-bold">Engaged</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border text-left ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase select-none">Rejected Flags</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-black text-red-500">{statistics.rejections}</span>
            <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-bold">Skipped</span>
          </div>
        </div>
      </div>

      {/* 3. SUB SECTION NAVIGATION TABS */}
      <div className="flex border-b border-slate-800 bg-slate-900/10 px-6 gap-6">
        <button
          onClick={() => setActiveTab("operations")}
          className={`py-3.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "operations" 
              ? "border-rose-500 text-rose-500" 
              : "border-transparent text-gray-700 dark:text-gray-400 hover:text-slate-200"
          }`}
        >
          <Compass className="w-4 h-4" /> Live Control Room
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`py-3.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "analytics" 
              ? "border-rose-500 text-rose-500" 
              : "border-transparent text-gray-700 dark:text-gray-400 hover:text-slate-200"
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Dispatch Analytics
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={`py-3.5 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "notifications" 
              ? "border-rose-500 text-rose-500" 
              : "border-transparent text-gray-700 dark:text-gray-400 hover:text-slate-200"
          }`}
        >
          <Bell className="w-4 h-4" /> Assignment Settings
        </button>
      </div>

      {/* 4. MAIN INTERACTIVE LAYOUT MODULE */}
      {activeTab === "operations" && (
        <div className="p-6 space-y-6">
          
          {/* QUICK TELEMETRY GRID FILTER PANEL */}
          <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-gray-50 border-slate-200"} flex flex-wrap items-center justify-between gap-4 text-xs font-bold`}>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Query ticket ID, restaurant or buyer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 pr-4 py-1.5 w-64 rounded-xl border outline-hidden transition-all text-xs ${
                    isDarkMode 
                      ? "bg-slate-900 border-slate-800 text-slate-100 focus:border-rose-500" 
                      : "bg-white border-slate-200 text-slate-800 focus:border-rose-500 shadow-xs"
                  }`}
                />
              </div>

              {/* City select */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700 dark:text-gray-400 text-[10px] uppercase font-bold">City</span>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className={`p-1.5 rounded-lg border text-[11px] font-bold ${isDarkMode ? "bg-slate-900 border-slate-800 text-gray-700 dark:text-gray-300" : "bg-white border-slate-200"}`}
                >
                  {citiesList.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              {/* Zone Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700 dark:text-gray-400 text-[10px] uppercase font-bold">Zone</span>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className={`p-1.5 rounded-lg border text-[11px] font-bold ${isDarkMode ? "bg-slate-900 border-slate-800 text-gray-700 dark:text-gray-300" : "bg-white border-slate-200"}`}
                >
                  {zonesList.map(zone => <option key={zone} value={zone}>{zone}</option>)}
                </select>
              </div>

              {/* Priority level select */}
              <div className="flex items-center gap-1.5">
                <span className="text-gray-700 dark:text-gray-400 text-[10px] uppercase font-bold">Priority</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className={`p-1.5 rounded-lg border text-[11px] font-bold ${isDarkMode ? "bg-slate-900 border-slate-800 text-gray-700 dark:text-gray-300" : "bg-white border-slate-200"}`}
                >
                  <option value="All">All Levels</option>
                  <option value="VIP">VIP Tier</option>
                  <option value="Urgent">Urgent priority</option>
                  <option value="High">High priority</option>
                  <option value="Normal">Normal tier</option>
                </select>
              </div>
            </div>

            {/* Config alert reminder indicators block */}
            {activeAssignment && (
              <div className="px-4 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl flex items-center gap-3 animate-pulse">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-[10px] font-black uppercase">Active Transmission:</span>
                </div>
                <div>
                  <span className="font-extrabold">{activeAssignment.orderId}</span> To <span className="font-extrabold">{activeAssignment.riderName}</span>
                </div>
                <div className="font-mono bg-rose-500/20 px-2 py-0.5 rounded text-rose-500 text-xs font-black">
                  ⏱ {Math.floor(activeAssignment.timeLeft / 60)}:{(activeAssignment.timeLeft % 60).toString().padStart(2, '0')}
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 font-bold uppercase rounded border border-yellow-500/20">
                  Status: {activeAssignment.status}
                </span>
                <button 
                  onClick={() => finalizeRiderAcceptance(activeAssignment)}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] uppercase font-black cursor-pointer"
                  title="Simulate Accept immediately"
                >
                  Force Accept
                </button>
                <button 
                  onClick={() => handleAssignmentRejection(activeAssignment)}
                  className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded text-[10px] uppercase font-black cursor-pointer"
                  title="Force decline simulation"
                >
                  Sim Reject
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* COLUMN LEFT: UNASSIGNED ORDERS VIEWPORT TABLE */}
            <div className="xl:col-span-2 space-y-6">
              <div className={`border rounded-2xl overflow-hidden ${isDarkMode ? "border-slate-800/80 bg-slate-900/10" : "border-slate-200 bg-white"}`}>
                <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-[#FAF9FC]"}`}>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-rose-500" />
                    <h2 className="text-xs uppercase font-black tracking-wider text-gray-700 dark:text-gray-400">Incoming Unassigned Allocations</h2>
                  </div>
                  <span className="text-[10px] bg-rose-500/10 text-rose-500 px-2.5 py-0.5 rounded-full font-black">
                    {filteredOrders.length} Pending
                  </span>
                </div>

                <div className="overflow-x-auto text-left text-xs font-semibold">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b text-[10px] uppercase tracking-wider text-gray-700 dark:text-gray-400 ${isDarkMode ? "border-slate-800 bg-slate-900/30" : "border-slate-100 bg-gray-50"}`}>
                        <th className="p-3 text-center">
                          <input 
                            type="checkbox"
                            checked={filteredOrders.length > 0 && filteredOrders.every(o => checkedOrdersList.includes(o.id))}
                            onChange={toggleSelectAllPage}
                            className="rounded accent-rose-500 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Order Specs</th>
                        <th className="p-3">Restaurant Vendor</th>
                        <th className="p-3">Delivery Destination</th>
                        <th className="p-3">Valuation</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3 text-right">Dispatch Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/65">
                      {filteredOrders.map(order => {
                        const pri = getPriorityText(order.billDetail.total);
                        const isChecked = checkedOrdersList.includes(order.id);
                        return (
                          <tr 
                            key={order.id}
                            className={`transition-colors hover:bg-slate-600/5 ${isChecked ? (isDarkMode ? "bg-rose-500/5" : "bg-rose-50/40") : ""}`}
                          >
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleOrderSelection(order.id)}
                                className="rounded accent-rose-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-extrabold text-rose-600 dark:text-rose-500 text-[11px]">{order.id}</div>
                              <div className="text-[10px] text-gray-700 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-gray-500" /> {order.orderTime || "11:58 AM"}
                              </div>
                            </td>
                            <td className="p-3 font-bold">
                              <div className="text-gray-800 dark:text-gray-200">{order.restaurantName}</div>
                              <div className="text-[10px] text-gray-700 dark:text-gray-400">Salt Lake Sector I</div>
                            </td>
                            <td className="p-3">
                              <div className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{order.address}</div>
                              <div className="text-[10px] font-extrabold text-gray-700 dark:text-gray-400">Buyer: {order.userName}</div>
                            </td>
                            <td className="p-3 font-black text-rose-500 text-right pr-6">
                              ₹{order.billDetail.total}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${pri.color}`}>
                                {pri.flag}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenAssignWorkflow(order)}
                                  className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black cursor-pointer uppercase transition-colors"
                                >
                                  Assign Manually
                                </button>
                                <button
                                  onClick={() => executeInstantAutoAssign(order.id)}
                                  className={`px-2 py-1.5 rounded-lg text-[10px] font-black uppercase-none transition-colors cursor-pointer ${
                                    isDarkMode 
                                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white" 
                                      : "bg-gray-100 text-slate-800 hover:bg-gray-200"
                                  }`}
                                  title="Allocate to closest driver node automatically"
                                >
                                  Auto Assign
                                </button>
                                <button
                                  onClick={() => setDetailedOrder(order)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isDarkMode ? "bg-slate-900 border-slate-900 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-gray-50"
                                  }`}
                                  title="Inspect ticket details"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-10 text-center text-gray-700 dark:text-gray-400">
                            <div className="max-w-xs mx-auto space-y-2">
                              <div className="p-3 bg-slate-900/50 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-dashed border-rose-500/20">
                                <CheckCircle className="w-5 h-5 text-emerald-500" />
                              </div>
                              <h4 className="text-xs font-black text-slate-300">Operations Buffer Clear</h4>
                              <p className="text-[10px] text-gray-700 dark:text-gray-400">All dynamic surge deliveries successfully assigned to active rider nodes.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* INTEGRATED HISTORICAL LOGS ARCHIVE */}
              <div className={`border rounded-2xl overflow-hidden ${isDarkMode ? "border-slate-800 bg-slate-900/10" : "border-slate-200 bg-white"}`}>
                <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-[#FAF9FC]"}`}>
                  <h3 className="text-xs uppercase font-black text-gray-700 dark:text-gray-400 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-rose-500" /> Dispatch History Logs
                  </h3>
                  <button 
                    onClick={() => {
                      setDispatchHistory([]);
                      triggerToast("History archived", "Dispatch memory logs successfully cleared.", "info");
                    }} 
                    className="text-[10px] text-gray-700 dark:text-gray-400 font-bold hover:underline"
                  >
                    Clear Memory
                  </button>
                </div>
                <div className="overflow-x-auto text-left text-xs font-semibold">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b text-[9px] uppercase tracking-wider text-gray-700 dark:text-gray-400 ${isDarkMode ? "border-slate-800 bg-slate-900/20" : "border-slate-100 bg-gray-50"}`}>
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Assigned Rider Info</th>
                        <th className="p-3">Handshake Sent At</th>
                        <th className="p-3">Response Latency</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Reassignment Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60">
                      {dispatchHistory.map(hist => (
                        <tr key={hist.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-3 font-extrabold text-rose-600 dark:text-rose-400">{hist.orderId}</td>
                          <td className="p-3 font-bold text-gray-900 dark:text-gray-100">
                            {hist.riderName} <span className="text-[10px] font-mono text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{hist.riderId}</span>
                          </td>
                          <td className="p-3 text-gray-800 dark:text-gray-300 font-mono font-bold">{hist.assignmentTime}</td>
                          <td className="p-3 text-gray-900 dark:text-gray-200 font-mono font-bold">{hist.responseTime}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              hist.status === "Accepted" || hist.status === "Completed"
                                ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none dark:border-solid border-emerald-500/20"
                                : hist.status === "Rejected"
                                ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-none dark:border-solid border-red-500/20"
                                : hist.status === "Expired"
                                ? "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-none dark:border-solid border-amber-500/20"
                                : "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-none dark:border-solid border-blue-500/20"
                            }`}>
                              {hist.status}
                            </span>
                          </td>
                          <td className="p-3 text-right pr-4 sm:pr-8 font-mono text-rose-600 dark:text-rose-400 font-black">
                            {hist.reassignmentCount} Retries
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* COLUMN RIGHT: DIGITAL VECTOR MAP AREA */}
            <div className="xl:col-span-1 space-y-6 text-left">
              <div className={`border rounded-2xl overflow-hidden ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "bg-white border-slate-200 shadow-sm"}`}>
                <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-100 bg-[#FAF9FC]"}`}>
                  <div>
                    <h3 className="text-xs uppercase font-black text-gray-700 dark:text-gray-400">Active Fleet Tracker</h3>
                    <p className="text-[9px] text-gray-700 dark:text-gray-400">Simulated 1600m dispatch boundary</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setMapTraffic(!mapTraffic)} 
                      className={`p-1 rounded text-[9px] font-bold ${mapTraffic ? "bg-rose-500 text-white" : "bg-slate-800 text-gray-700 dark:text-gray-400"}`}
                      title="Toggle traffic paths lines"
                    >
                      Traffic Flow
                    </button>
                    <button 
                      onClick={() => {
                        setMapZoom(13);
                        triggerToast("Map Re-Centered", "Map scaled to Downtown city grid view.", "info");
                      }} 
                      className="p-1 rounded text-[9px] font-bold bg-[#E23744]/10 text-[#E23744]"
                      title="Reset view"
                    >
                      Center
                    </button>
                  </div>
                </div>

                {/* REAL OPENSTREETMAP INTERACTIVE LAYER */}
                <div className="relative border-b border-slate-900">
                  <OSMInteractiveMap
                    mode={selectedMapPoint?.type === "order" ? "tracking" : "dispatcher"}
                    orders={orders}
                    riders={riders}
                    selectedId={selectedMapPoint?.type === "order" ? selectedMapPoint.info.id : null}
                    onSelectMapPoint={(pt) => {
                      setSelectedMapPoint(pt);
                      triggerToast(`${pt.type === "rider" ? "Rider telemetry stream connected" : "Order location selected"}`, `Plotted on real-world OSM coordinates.`, "info");
                    }}
                    triggerToast={triggerToast}
                    isDarkMode={isDarkMode}
                    height="500px"
                  />
                </div>

                {/* Selected Map inspector footer widget */}
                <div className={`p-4 text-xs font-semibold ${isDarkMode ? "bg-slate-900" : "bg-gray-50"}`}>
                  {selectedMapPoint ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-700 dark:text-gray-400">Map Inspector Selection</span>
                          <h4 className="font-black text-rose-500">{selectedMapPoint.info.name || selectedMapPoint.info.id}</h4>
                        </div>
                        <button onClick={() => setSelectedMapPoint(null)} className="text-gray-700 dark:text-gray-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-700 dark:text-gray-300">
                        {selectedMapPoint.type === "rider" 
                          ? `Phone: ${selectedMapPoint.info.phone} | Wallet: ₹${selectedMapPoint.info.walletBalance} | Vehicle: ${selectedMapPoint.info.vehicleNumber}`
                          : `Customer Address: ${selectedMapPoint.info.address} | Total Value: ₹${selectedMapPoint.info.billDetail.total}`
                        }
                      </p>
                      {selectedMapPoint.type === "order" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenAssignWorkflow(selectedMapPoint.info)}
                            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            Manual dispatch <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDetailedOrder(selectedMapPoint.info)}
                            className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                          >
                            View All Details <Info className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-700 dark:text-gray-400 text-center py-2 text-[10px] flex items-center justify-center gap-1.5">
                      <MapPin className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                      Click any live rider blip (Blue) or order pin (Red) to launch microservice actions.
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Sound Controls sandbox */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-zinc-150"}`}>
                <h3 className="text-xs uppercase font-black text-rose-500 flex items-center gap-1.5 mb-3.5">
                  <Volume2 className="w-4 h-4" /> Operator decibel controllers
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-black">
                      <span className="text-gray-700 dark:text-gray-400 uppercase">Master notify volume</span>
                      <span className="text-rose-400">{globalVolume}% dp</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={globalVolume}
                      onChange={(e) => setGlobalVolume(Number(e.target.value))}
                      className="w-full text-rose-600 accent-rose-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <div className="text-left">
                      <h4 className="text-[11px] font-extrabold text-[#E23744]">Enable Sound Chimes</h4>
                      <p className="text-[9px] text-gray-700 dark:text-gray-400">Play live synthesizer signals directly in operator console</p>
                    </div>
                    <button
                      onClick={() => setIsAmbientSoundOn(!isAmbientSoundOn)}
                      className={`px-3 py-1 text-[10px] uppercase font-black rounded-lg transition-colors cursor-pointer ${
                        isAmbientSoundOn ? "bg-emerald-600 text-white" : "bg-slate-800 text-gray-700 dark:text-gray-400 hover:bg-slate-700"
                      }`}
                    >
                      {isAmbientSoundOn ? "Synthesizer on" : "Muted"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 5. DISPATCH ANALYTICS SUB SECTION */}
      {activeTab === "analytics" && (
        <div className="p-6 space-y-6">
          
          {/* Summary Operational insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase">Avg Response Speed</span>
                  <h4 className="text-2xl font-black mt-1 text-emerald-500">22 Seconds</h4>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <div className="text-[10px] text-emerald-500 flex items-center gap-1.5 mt-4 font-bold">
                <TrendingUp className="w-3.5 h-3.5" /> 12% faster than last hour average
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase">Rider Acceptance</span>
                  <h4 className="text-2xl font-black mt-1 text-rose-500">94.8% Rate</h4>
                </div>
                <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-rose-400 flex items-center gap-1.5 mt-4 font-bold">
                <ThumbsUp className="w-3.5 h-3.5" /> Sector leaderboard score optimized
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase">Reassignment Weight</span>
                  <h4 className="text-2xl font-black mt-1 text-indigo-400">4.1% Recoil</h4>
                </div>
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <LoopIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-indigo-400 flex items-center gap-1.5 mt-4 font-bold">
                <Check className="w-3.5 h-3.5" /> Lower reassignment count saves ₹14 per ticket
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] text-gray-700 dark:text-gray-400 font-extrabold uppercase">Failed Shipments</span>
                  <h4 className="text-2xl font-black mt-1 text-yellow-500">0.05% Failure</h4>
                </div>
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-[10px] text-yellow-500 flex items-center gap-1.5 mt-4 font-bold">
                <CheckCircle className="w-3.5 h-3.5" /> Zero disputes unresolved this cycle
              </div>
            </div>
          </div>

          {/* HIGH POLISHED SVG AREA CHARTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* Chart Block 1 */}
            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className="text-xs uppercase font-black text-gray-700 dark:text-gray-400 mb-4 tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-rose-500" /> Hourly Allocation Trend Analysis
              </h3>
              <div className="h-48 flex items-end justify-between gap-1 border-b border-l border-slate-800 p-2 relative">
                
                {/* Visual guideline markers */}
                <div className="absolute top-4 left-0 right-0 border-t border-dashed border-slate-800/40 text-[9px] text-gray-500 text-right pr-2">120 Assigned</div>
                <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-slate-800/40 text-[9px] text-gray-500 text-right pr-2">60 Assigned</div>

                {/* SVG Polyline to give modern area look */}
                <div className="absolute inset-x-0 bottom-0 h-44 overflow-hidden pointer-events-none">
                  <svg className="w-full h-full opacity-20" preserveAspectRatio="none">
                    <path d="M 0 160 Q 40 80, 100 120 T 200 60 T 300 100 T 400 40 L 400 180 L 0 180 Z" fill="url(#roseGrad)" />
                    <defs>
                      <linearGradient id="roseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F43F5E" />
                        <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Bars custom representation */}
                {[
                  { time: "09:00", count: 42, color: "bg-rose-500" },
                  { time: "10:00", count: 85, color: "bg-rose-500" },
                  { time: "11:00", count: 110, color: "bg-rose-500" },
                  { time: "12:00", count: 95, color: "bg-rose-500" },
                  { time: "13:00", count: 118, color: "bg-rose-600 animate-pulse" },
                  { time: "14:00", count: 64, color: "bg-red-400" },
                  { time: "15:00", count: 50, color: "bg-red-400" },
                ].map(item => (
                  <div key={item.time} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-4.5 rounded-t-md transition-all duration-700 ${item.color}`} 
                      style={{ height: `${(item.count / 130) * 160}px` }}
                      title={`${item.count} tickets assigned`}
                    />
                    <span className="text-[9px] text-gray-500 mt-2 font-mono font-bold leading-none">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Block 2 */}
            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className="text-xs uppercase font-black text-gray-700 dark:text-gray-400 mb-4 tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-rose-500" /> Logistics Efficiency Sector Performance
              </h3>
              <div className="space-y-4">
                {[
                  { sector: "Salt Lake Sector V", assigned: "381 Orders", load: "High surge", efficiency: 98, color: "bg-emerald-500" },
                  { sector: "Gariahat South", assigned: "244 Orders", load: "Medium load", efficiency: 91, color: "bg-emerald-400" },
                  { sector: "New Town Hub", assigned: "419 Orders", load: "Extreme waterlogging", efficiency: 72, color: "bg-amber-400 animate-pulse" },
                  { sector: "Park Circus", assigned: "185 Orders", load: "Low fleet density", efficiency: 86, color: "bg-indigo-400" }
                ].map(sec => (
                  <div key={sec.sector} className="space-y-1 text-xs">
                    <div className="flex justify-between font-extrabold text-[11px]">
                      <span>{sec.sector} <span className="font-medium text-gray-700 dark:text-gray-400">({sec.load})</span></span>
                      <span>{sec.efficiency}% Efficiency KPI</span>
                    </div>
                    <div className="h-2 bg-slate-800/80 rounded-full overflow-hidden flex">
                      <div className={`h-full rounded-full ${sec.color}`} style={{ width: `${sec.efficiency}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-gray-700 dark:text-gray-400">
                      <span>{sec.assigned} today</span>
                      <span>Target ceiling 44m limit</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 6. ADVANCED ASSIGNMENT SETTINGS TAB */}
      {activeTab === "notifications" && (
        <div className="p-6 space-y-6 text-left">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* ESCALATION AND SLA REASSIGN RULE CARD */}
            <div className={`p-6 rounded-2xl border md:col-span-2 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                <h3 className="text-xs uppercase font-black tracking-wider text-gray-700 dark:text-gray-400">Automatic Escalation Rules Engine</h3>
              </div>

              <div className="space-y-5 text-xs font-semibold">
                <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                  <div className="text-left pr-4">
                    <h4 className="text-xs font-black text-rose-50">Enable Automatic Dispatcher Fallback (SLA)</h4>
                    <p className="text-[10px] text-gray-700 dark:text-gray-400 mt-1 leading-relaxed">
                      If the preselected rider fails to click "Accept" in their smartphone UI within the countdown window, immediately trigger warning chime, re-open the public bid sector, or reallocate to next closest vector.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAutoReassignEnabled(!isAutoReassignEnabled)}
                    className={`px-3.5 py-1.5 text-[10px] uppercase font-black rounded-lg transition-colors cursor-pointer ${
                      isAutoReassignEnabled ? "bg-rose-600 text-white" : "bg-slate-900 text-gray-700 dark:text-gray-400 hover:bg-slate-800"
                    }`}
                  >
                    {isAutoReassignEnabled ? "Auto Enabled" : "Manual Only"}
                  </button>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                  <div className="text-left pr-4">
                    <h4 className="text-xs font-black text-rose-5">Required Dispatcher Override Permission</h4>
                    <p className="text-[10px] text-gray-700 dark:text-gray-400 mt-1">Force confirmation modal prompts to operator before shifting the fallback rider.</p>
                  </div>
                  <button
                    onClick={() => setIsManualReassignRequired(!isManualReassignRequired)}
                    className={`px-3 py-1.5 text-[10px] uppercase font-black rounded-lg transition-colors cursor-pointer ${
                      isManualReassignRequired ? "bg-rose-600 text-white animate-pulse" : "bg-slate-900 text-gray-700 dark:text-gray-400 hover:bg-slate-800"
                    }`}
                  >
                    {isManualReassignRequired ? "Forced Prompt" : "Silent re-routing"}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-black">
                    <span className="text-gray-700 dark:text-gray-300">Maximum Reassignment Handshake Retries</span>
                    <span className="text-rose-400 font-mono">{maxRetryCount} Cycles</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        onClick={() => {
                          setMaxRetryCount(val);
                          triggerToast("Escalation parameters synchronized", `Maximum allocation ceiling set to ${val} attempt iterations.`, "success");
                        }}
                        className={`flex-1 py-1.5 text-center text-[10px] font-black rounded-lg border cursor-pointer ${
                          maxRetryCount === val 
                            ? "bg-rose-600/10 border-rose-500 text-rose-500 shadow-xs" 
                            : `${isDarkMode ? "bg-slate-900 border-slate-900 text-slate-400" : "bg-gray-100 border-gray-200 text-slate-700"}`
                        }`}
                      >
                        {val} Try
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CHANNEL PER EVENTS TOGGLES RULING */}
            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-rose-500" />
                <h3 className="text-xs uppercase font-black tracking-wider text-gray-700 dark:text-gray-400">Assignment Channels Settings</h3>
              </div>

              <div className="space-y-4 text-xs font-bold font-mono">
                {notificationsList.map(notif => (
                  <div key={notif.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-900 space-y-2 text-[11px]">
                    <h4 className="font-extrabold text-gray-700 dark:text-gray-300">{notif.name}</h4>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => {
                          const listUpdated = notificationsList.map(x => x.id === notif.id ? { ...x, push: !x.push } : x);
                          setNotificationsList(listUpdated);
                          triggerToast("Channel updated", "Push status synced.", "info");
                        }}
                        className={`text-[9px] p-1 rounded font-black cursor-pointer text-center ${notif.push ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-400 opacity-60"}`}
                      >
                        Push
                      </button>
                      <button
                        onClick={() => {
                          const listUpdated = notificationsList.map(x => x.id === notif.id ? { ...x, sms: !x.sms } : x);
                          setNotificationsList(listUpdated);
                        }}
                        className={`text-[9px] p-1 rounded font-black cursor-pointer text-center ${notif.sms ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-400 opacity-60"}`}
                      >
                        SMS
                      </button>
                      <button
                        onClick={() => {
                          const listUpdated = notificationsList.map(x => x.id === notif.id ? { ...x, whatsapp: !x.whatsapp } : x);
                          setNotificationsList(listUpdated);
                        }}
                        className={`text-[9px] p-1 rounded font-black cursor-pointer text-center ${notif.whatsapp ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-400 opacity-60"}`}
                      >
                        WA
                      </button>
                      <button
                        onClick={() => {
                          const listUpdated = notificationsList.map(x => x.id === notif.id ? { ...x, inApp: !x.inApp } : x);
                          setNotificationsList(listUpdated);
                        }}
                        className={`text-[9px] p-1 rounded font-black cursor-pointer text-center ${notif.inApp ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 text-slate-400 opacity-60"}`}
                      >
                        App
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 7. DIALOGS WORKFLOW: INTERACTIVE MANUAL RIDER ASSIGN DRAWER MODAL */}
      {isAssignModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"} text-left shadow-2xl space-y-6 relative border border-slate-800`}>
            
            {/* Close */}
            <button 
              onClick={() => { setIsAssignModalOpen(false); setSelectedOrder(null); }} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-[#E23744]">Manual Allocation Workflow</span>
              <h2 className="text-lg font-black mt-1">Manual Rider Selection & Dispatch Grid</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Order Info Panel (Left 2 cols) */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3.5 text-xs">
                  <h3 className="font-extrabold uppercase text-[10px] text-rose-500">Order Information Block</h3>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-700 dark:text-gray-400 font-bold">Ticket Identifier</span>
                    <strong className="font-mono text-white text-right">{selectedOrder.id}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-700 dark:text-gray-400 font-bold">Restaurant Location</span>
                    <strong className="text-right">{selectedOrder.restaurantName}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-700 dark:text-gray-400 font-bold">Customer Endpoint</span>
                    <span className="text-right truncate max-w-[160px] inline-block" title={selectedOrder.address}>{selectedOrder.address}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-700 dark:text-gray-400 font-bold">Total Bill Value</span>
                    <strong className="text-rose-400 font-black">₹{selectedOrder.billDetail.total}</strong>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-700 dark:text-gray-400 font-bold">Order Priority</span>
                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 font-bold rounded uppercase border border-yellow-500/20 text-[9px]">
                      {getPriorityText(selectedOrder.billDetail.total).flag}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-700 dark:text-gray-400 font-bold">Calculated Distance</span>
                    <strong className="text-white font-mono">1.8 KM</strong>
                  </div>
                </div>

                {/* Confirm workflow instructions */}
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl text-[10px] leading-relaxed border border-rose-500/20">
                  <span className="font-black block mb-0.5">⚠️ DISPATCHER NOTICE:</span> Choose an active, nearest rider node below to initiate the critical countdown response handshake.
                </div>
              </div>

              {/* Rider Selection grid column list (Right 3 cols) */}
              <div className="md:col-span-3 space-y-4 text-xs font-semibold">
                
                {/* Rider list filters */}
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter by name / ID..."
                      value={riderSearch}
                      onChange={(e) => setRiderSearch(e.target.value)}
                      className={`pl-8 pr-2.5 py-1.5 w-full rounded-lg text-[11px] font-bold border outline-hidden ${
                        isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-700"
                      }`}
                    />
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setRiderFilterCategory("nearest")}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer border ${
                        riderFilterCategory === "nearest" ? "bg-rose-600 border-rose-500 text-white" : "bg-slate-900 border-slate-800 text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      Nearest
                    </button>
                    <button
                      onClick={() => setRiderFilterCategory("highest-rated")}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer border ${
                        riderFilterCategory === "highest-rated" ? "bg-rose-600 border-rose-500 text-white" : "bg-slate-900 border-slate-800 text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      ★ 4.8+ Rated
                    </button>
                    <button
                      onClick={() => setRiderFilterCategory("available")}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer border ${
                        riderFilterCategory === "available" ? "bg-rose-600 border-rose-500 text-white" : "bg-slate-900 border-slate-800 text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      Online list
                    </button>
                  </div>
                </div>

                {/* Actual Rider list mapped */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {filteredRidersForManual.map(r => {
                    const isRiderSelected = selectedRider?.id === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelectedRider(r)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isRiderSelected 
                            ? "border-rose-500 bg-rose-500/10 shadow-md"
                            : `${isDarkMode ? "bg-slate-900 hover:bg-slate-900 border-slate-900" : "bg-slate-50 hover:bg-slate-100 border-slate-200"}`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 bg-slate-800/80 text-white rounded-full flex items-center justify-center font-black capitalize border border-slate-700">
                              {r.name.substring(0, 2)}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                              r.status === "Online" ? "bg-emerald-500" : "bg-amber-400"
                            }`} />
                          </div>
                          <div>
                            <div className="font-extrabold text-white text-xs dark:text-slate-100">{r.name}</div>
                            <div className="text-[10px] text-gray-700 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <span>★ {r.rating} Rating</span> | <span className="text-[#E23744] font-bold">89% Acceptance</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-gray-700 dark:text-gray-300 font-mono font-black">{r.vehicleNumber}</span>
                          <div className="text-[9px] text-gray-500 mt-0.5">Distance: 1.2 KM</div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredRidersForManual.length === 0 && (
                    <div className="p-8 text-center text-gray-700 dark:text-gray-400 text-xs">
                      No active onboarding partners match structural bounds.
                    </div>
                  )}
                </div>

                {/* Confirm Footer buttons */}
                <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-2.5">
                  <button
                    onClick={() => { setIsAssignModalOpen(false); setSelectedOrder(null); }}
                    className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-900 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setIsConfirmationOpen(true)}
                    disabled={!selectedRider}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    Select & Verify <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* 8. SAVE & DOUBLE SECURITY WORKFLOW CONFIRMATION MODAL */}
      {isConfirmationOpen && selectedOrder && selectedRider && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl w-full max-w-md bg-slate-900 text-slate-100 text-left border border-slate-800 shadow-2xl space-y-5">
            <h3 className="text-sm font-black text-rose-500 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="w-5 h-5" /> Dispatch verification checkpoint
            </h3>
            
            <p className="text-xs text-gray-700 dark:text-gray-400 leading-relaxed">
              You are about to execute a direct manual driver allocation. The smartphone carrier will receive high priority visual push sound chimes instantly and is required to accept within the dynamic SLA window of 2 minutes.
            </p>

            <div className="p-3.5 bg-slate-900/40 rounded-2xl text-xs space-y-2 border border-slate-900">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700 dark:text-gray-400">Selected Ticket ID</span>
                <strong className="text-rose-500">{selectedOrder.id}</strong>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700 dark:text-gray-400">Target Rider Partner</span>
                <strong className="text-white">{selectedRider.name}</strong>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700 dark:text-gray-400">Pickup Distance</span>
                <strong className="text-white">1.2 KM (Est. Delivery 24 mins)</strong>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-gray-700 dark:text-gray-400">Surge Settlement Value</span>
                <strong className="text-emerald-400">₹{selectedOrder.billDetail.total}</strong>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end text-xs">
              <button
                onClick={() => setIsConfirmationOpen(false)}
                className="px-4 py-2 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-900 cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmAssignmentModal}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase rounded-xl shadow-lg cursor-pointer"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. DETAILED TICKET INSPECTOR DIALOG */}
      {detailedOrder && (
        <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl w-full max-w-lg overflow-y-auto ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} text-left shadow-2xl relative border space-y-4`}>
            
            <button 
              onClick={() => setDetailedOrder(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-sm font-black uppercase tracking-wider text-rose-500">
              Detailed Freight Specs: {detailedOrder.id}
            </h3>

            <div className={`p-4 rounded-2xl border text-xs space-y-2 font-semibold ${isDarkMode ? "bg-slate-900/60 border-slate-900" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-400">Client Account Name</span>
                <strong className={isDarkMode ? "text-white" : "text-gray-900"}>{detailedOrder.userName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-400">Bistro Vendor</span>
                <strong className={isDarkMode ? "text-white" : "text-gray-900"}>{detailedOrder.restaurantName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-400">Transit Coordinates</span>
                <strong className="text-slate-400 font-mono">X: {detailedOrder.x}%, Y: {detailedOrder.y}%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-400">Delivery Address</span>
                <strong className={`truncate max-w-[200px] ${isDarkMode ? "text-white" : "text-gray-900"}`}>{detailedOrder.address}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-400">Timestamp Logged</span>
                <strong className="text-gray-700 dark:text-gray-400">{detailedOrder.orderTime}</strong>
              </div>
              <div className={`flex justify-between pt-2 border-t text-emerald-500 ${isDarkMode ? "border-slate-900" : "border-gray-200"}`}>
                <span>Value</span>
                <strong>₹{detailedOrder.billDetail.total} (Surge)</strong>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-extrabold text-gray-700 dark:text-gray-400 uppercase text-[10px]">Cart items:</p>
              <div className="space-y-1 pt-1">
                {detailedOrder.items.map(item => (
                  <div key={item.id} className={`flex justify-between text-[11px] p-2 rounded-lg ${isDarkMode ? "bg-slate-900/50" : "bg-gray-50 border border-gray-200"}`}>
                    <span className={isDarkMode ? "text-gray-700 dark:text-gray-300" : "text-gray-700"}>{item.name} <strong className="text-rose-500 font-bold font-mono">x{item.count}</strong></span>
                    <strong className={isDarkMode ? "text-white" : "text-gray-900"}>₹{item.price * item.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const order = detailedOrder;
                setDetailedOrder(null);
                handleOpenAssignWorkflow(order);
              }}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              Dispatch this order <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
