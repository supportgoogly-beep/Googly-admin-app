import React, { useState, useMemo, useEffect } from "react";
import { 
  Tv, ChefHat, Save, RotateCcw, Activity, HardDrive, Wifi, 
  Settings, Sparkles, AlertCircle, AlertTriangle, ShieldCheck, 
  Volume2, VolumeX, Speech, Volume1, HelpCircle, Check, Play,
  Copy, Eye, Download, Search, CheckCircle2, Sliders, LayoutGrid, 
  ListOrdered, RefreshCw, Layers, Radio, Phone, User, Clock, ToggleLeft, ToggleRight
} from "lucide-react";
import { Restaurant } from "../types";

// Types for activities log
interface KDSActivityLog {
  id: string;
  changedSetting: string;
  prevValue: string;
  newValue: string;
  updatedBy: string;
  timestamp: string;
  deviceUsed: string;
}

// Initial default logs
const INITIAL_KDS_LOGS: KDSActivityLog[] = [
  {
    id: "LOG-KDS-881",
    changedSetting: "Auto-Accept Orders Priority",
    prevValue: "Disabled",
    newValue: "Enabled for orders below ₹1000",
    updatedBy: "Rohan P. (Admin)",
    timestamp: "2026-06-12 04:12 AM",
    deviceUsed: "Auditor iPad Pro"
  },
  {
    id: "LOG-KDS-880",
    changedSetting: "New Order Voice Alerts",
    prevValue: "Continuous looped",
    newValue: "Repeat 2 times",
    updatedBy: "Subrata Roy (KDS Lead)",
    timestamp: "2026-06-11 11:30 PM",
    deviceUsed: "Chef Station terminal #3"
  },
  {
    id: "LOG-KDS-879",
    changedSetting: "Simultaneous Orders Peak Limit",
    prevValue: "25 Concurrent orders",
    newValue: "40 Concurrent orders",
    updatedBy: "System Load Balancer",
    timestamp: "2026-06-11 05:45 PM",
    deviceUsed: "API Gateway Node"
  }
];

interface KitchenDisplaySystemCRMProps {
  restaurants: Restaurant[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function KitchenDisplaySystemCRM({
  restaurants,
  triggerToast
}: KitchenDisplaySystemCRMProps) {
  // Select active restaurant for configuration
  const [selectedRestId, setSelectedRestId] = useState<string>(
    restaurants.length > 0 ? restaurants[0].id.toString() : "1"
  );

  const activeRestName = useMemo(() => {
    const found = restaurants.find(r => r.id.toString() === selectedRestId);
    return found ? found.name : "Grand Biryani Darbar";
  }, [restaurants, selectedRestId]);

  // Save changes states
  const [isSaving, setIsSaving] = useState(false);
  
  // 1. KDS Device Integration variables
  const [integrationStatus, setIntegrationStatus] = useState<"Connected" | "Disconnected" | "Syncing" | "Error">("Connected");
  const [deviceIp, setDeviceIp] = useState("192.168.1.182");
  const [deviceId, setDeviceId] = useState("KDS-POS-STATION-04");
  const [softwareVersion, setSoftwareVersion] = useState("v4.8.2-GA");
  const [lastSyncTime, setLastSyncTime] = useState("2026-06-12 04:58 AM");
  const [isTestingConn, setIsTestingConn] = useState(false);

  // 2. Order Processing variables
  const [enableAutoAccept, setEnableAutoAccept] = useState(true);
  const [autoAcceptHoursOnly, setAutoAcceptHoursOnly] = useState(true);
  const [autoAcceptScheduled, setAutoAcceptScheduled] = useState(false);
  const [autoAcceptBelowVal, setAutoAcceptBelowVal] = useState(true);
  const [autoAcceptThreshold, setAutoAcceptThreshold] = useState<number>(1500);
  const [showAutoAcceptModal, setShowAutoAcceptModal] = useState(false);

  // 3. Auto Reject Rules
  const [rejectWhenOffline, setRejectWhenOffline] = useState(true);
  const [rejectOutsideHours, setRejectOutsideHours] = useState(true);
  const [rejectOnMaxCapacity, setRejectOnMaxCapacity] = useState(false);
  const [maxKitchenCapacity, setMaxKitchenCapacity] = useState<number>(30);

  // 4. Voice Alerts & TTS
  const [enableVoiceAlerts, setEnableVoiceAlerts] = useState(true);
  const [alertLanguage, setAlertLanguage] = useState<"en" | "hi" | "bn">("en");
  const [voiceType, setVoiceType] = useState<"Male" | "Female" | "Robotic">("Female");
  const [alertVolume, setAlertVolume] = useState<number>(85);
  const [repeatCount, setRepeatCount] = useState<string>("2");
  const [continuousAlert, setContinuousAlert] = useState(false);

  // 5. Sound Alerts & Preferences
  const [soundAlertNew, setSoundAlertNew] = useState(true);
  const [soundAlertCancel, setSoundAlertCancel] = useState(true);
  const [soundAlertModify, setSoundAlertModify] = useState(false);
  const [soundAlertDelayed, setSoundAlertDelayed] = useState(true);
  const [soundAlertUrgent, setSoundAlertUrgent] = useState(true);
  const [volumeNewOrder, setVolumeNewOrder] = useState<number>(90);
  const [volumeUrgentOrder, setVolumeUrgentOrder] = useState<number>(100);
  const [volumeGeneral, setVolumeGeneral] = useState<number>(70);

  // 6. Workflow Settings
  const [enableQueueMgmt, setEnableQueueMgmt] = useState(true);
  const [enableEstPrepTime, setEnableEstPrepTime] = useState(true);
  const [enableAutoPrioritize, setEnableAutoPrioritize] = useState(true);
  const [enableMultiStation, setEnableMultiStation] = useState(false);
  const [enablePerformanceTracking, setEnablePerformanceTracking] = useState(true);
  const [queueStrategy, setQueueStrategy] = useState<"FIFO" | "Priority" | "Manual">("Priority");

  // 7. Order Status Synced Targets
  const [syncInstantStatus, setSyncInstantStatus] = useState(true);
  const [syncAutoPrepStart, setSyncAutoPrepStart] = useState(true);
  const [syncAutoReady, setSyncAutoReady] = useState(true);
  const [syncAutoCompletion, setSyncAutoCompletion] = useState(false);

  // 8. Restaurant Level Configurations & Holiday Override
  const [defaultPrepTime, setDefaultPrepTime] = useState<number>(20);
  const [maxSimultaneousOrders, setMaxSimultaneousOrders] = useState<number>(25);
  const [peakHourRules, setPeakHourRules] = useState<"Default" | "BoostPrepTime" | "ThrottleThroughput">("BoostPrepTime");
  const [tempAutoAcceptOverride, setTempAutoAcceptOverride] = useState(false);
  const [holidayRulesActive, setHolidayRulesActive] = useState(false);

  // 9. Activity Logs State
  const [activityLogs, setActivityLogs] = useState<KDSActivityLog[]>(INITIAL_KDS_LOGS);
  const [filterLogsSearch, setFilterLogsSearch] = useState("");
  const [viewingLogDetail, setViewingLogDetail] = useState<KDSActivityLog | null>(null);

  // Simulated Order Incoming Alert Playground Sandbox
  const [simulatedIncomingOrder, setSimulatedIncomingOrder] = useState<any>(null);

  // browser text to speech test helper
  const handleTestVoiceAlert = () => {
    try {
      const phrases = {
        en: "Attention, new delivery order has arrived! Please start preparing immediately.",
        hi: "ध्यान दें, नया आर्डर आया है! कृपया रसोइए फ़ौरन खाना बनाना शुरू करें।",
        bn: "মনোযোগ দিন, নতুন ডেলিভারি অর্ডার এসেছে! অনুগ্রহ করে এখনই প্রস্তুত করা শুরু করুন।"
      };
      
      const textToSpeak = phrases[alertLanguage] || phrases.en;
      
      if ("speechSynthesis" in window) {
        // Stop any current speaking
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.volume = alertVolume / 100;
        
        // Seek a matching voice style
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          if (voiceType === "Robotic") {
            // Find a deep or distinct voice
            const deepVoice = voices.find(v => v.lang.includes("en-HK") || v.lang.includes("en-IN"));
            if (deepVoice) utterance.voice = deepVoice;
          } else if (voiceType === "Male") {
            const maleVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("google uk"));
            if (maleVoice) utterance.voice = maleVoice;
          } else {
            const femaleVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("google us"));
            if (femaleVoice) utterance.voice = femaleVoice;
          }
        }
        
        window.speechSynthesis.speak(utterance);
        triggerToast(
          "Voice Alert Triggered",
          `Synthesized speech: "${textToSpeak.substring(0, 45)}..." at ${alertVolume}% volume.`,
          "success"
        );
      } else {
        triggerToast(
          "Acousticks Test (Simulated)",
          `Browser doesn't support WebSpeech API, simulated audio tone fired: "${textToSpeak}"`,
          "info"
        );
      }
    } catch (err) {
      console.warn("Speech Synthesis error: ", err);
      triggerToast("Test Error", "Acoustic audio test could not play.", "error");
    }
  };

  // Test notification visual popup trigger
  const handlePreviewVisualNotification = () => {
    triggerToast(
      "KDS Kitchen System Notification Alert",
      `🔔 ORDER INCOMING - Station #1 (Grand Curry Platter & Garlic Naan). High Priority.`,
      "info"
    );
  };

  // Connect/Reconnect device loop
  const handleTestDeviceConnection = () => {
    setIsTestingConn(true);
    setIntegrationStatus("Syncing");
    
    setTimeout(() => {
      setIsTestingConn(false);
      setIntegrationStatus("Connected");
      saveAuditLog(
        "KDS Device Diagnostics", 
        "Connected", 
        "Completed healthy sync connection", 
        "Network Router"
      );
      triggerToast(
        "KDS Device Diagnostics Passed", 
        `Device ${deviceId} responded to ping at host address ${deviceIp}. Status: HEALTHY`, 
        "success"
      );
    }, 1500);
  };

  // Manual Trigger Force Sync
  const handleForceSyncKDS = () => {
    setIntegrationStatus("Syncing");
    triggerToast("Initiating Full Sync", "Synchronizing KDS templates with delivery databases...", "info");
    
    setTimeout(() => {
      setIntegrationStatus("Connected");
      const cleanTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(`2026-06-12 ${cleanTime}`);
      
      triggerToast(
        "Synchronization Complete", 
        "All active station terminals, printer spoolers, and menu layouts are fully updated.", 
        "success"
      );
      saveAuditLog("KDS Synchronization", "Syncing", "Completed complete databases alignment", "Cloud Spooler");
    }, 1200);
  };

  // Save full configurations
  const handleSaveChanges = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      triggerToast(
        "KDS Settings Transmitted Successfully", 
        `All active thresholds, automatic timers, and voice cues are locked into ${activeRestName} main board.`, 
        "success"
      );
      saveAuditLog("KDS Settings Lock", "Previous configuration", "Committed premium KDS profile V3", "Rohan P. (Admin)");
    }, 1000);
  };

  // Reset to system default configurations
  const handleResetToDefault = () => {
    setEnableAutoAccept(true);
    setAutoAcceptHoursOnly(true);
    setAutoAcceptScheduled(false);
    setAutoAcceptBelowVal(true);
    setAutoAcceptThreshold(1500);
    setRejectWhenOffline(true);
    setRejectOutsideHours(true);
    setRejectOnMaxCapacity(false);
    setMaxKitchenCapacity(30);
    setEnableVoiceAlerts(true);
    setAlertLanguage("en");
    setVoiceType("Female");
    setAlertVolume(85);
    setRepeatCount("2");
    setContinuousAlert(false);
    setSoundAlertNew(true);
    setSoundAlertCancel(true);
    setSoundAlertModify(false);
    setSoundAlertDelayed(true);
    setSoundAlertUrgent(true);
    setVolumeNewOrder(90);
    setVolumeUrgentOrder(100);
    setVolumeGeneral(70);
    setEnableQueueMgmt(true);
    setEnableEstPrepTime(true);
    setEnableAutoPrioritize(true);
    setEnableMultiStation(false);
    setQueueStrategy("Priority");
    setDefaultPrepTime(20);
    setMaxSimultaneousOrders(25);
    setPeakHourRules("BoostPrepTime");
    setTempAutoAcceptOverride(false);
    setSyncInstantStatus(true);
    setSyncAutoPrepStart(true);
    setSyncAutoReady(true);
    setSyncAutoCompletion(false);

    triggerToast(
      "Defaults Re-applied", 
      "Re-instated master configurations for kitchen display routing systems.", 
      "info"
    );
    saveAuditLog("KDS Profile Restored", "Custom Configurations", "System Factory Default settings applied", "System Master Override");
  };

  // Helper log audit write
  const saveAuditLog = (setting: string, prev: string, next: string, user: string) => {
    const logId = `LOG-KDS-${Math.floor(Math.random() * 800 + 100)}`;
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newEntry: KDSActivityLog = {
      id: logId,
      changedSetting: setting,
      prevValue: prev,
      newValue: next,
      updatedBy: user,
      timestamp: nowStr,
      deviceUsed: "FinTech Admin Desk"
    };
    setActivityLogs(prev => [newEntry, ...prev]);
  };

  // Filter logs list based on search bar
  const filteredLogs = useMemo(() => {
    if (!filterLogsSearch.trim()) return activityLogs;
    const q = filterLogsSearch.toLowerCase();
    return activityLogs.filter(
      l => l.changedSetting.toLowerCase().includes(q) || 
           l.newValue.toLowerCase().includes(q) || 
           l.updatedBy.toLowerCase().includes(q)
    );
  }, [activityLogs, filterLogsSearch]);

  // Hook to handle Auto-Accept Safe Toggling Confirmation warnings
  const handleToggleAutoAccept = () => {
    if (!enableAutoAccept) {
      // Prompt modal safely
      setShowAutoAcceptModal(true);
    } else {
      setEnableAutoAccept(false);
      triggerToast("Auto-Accept Disabled", "Orders must now be manually acknowledged by kitchen staff.", "info");
      saveAuditLog("Auto-Accept Mode", "Enabled", "Disabled manually", "Main Controller");
    }
  };

  const confirmAutoAcceptEnable = () => {
    setEnableAutoAccept(true);
    setShowAutoAcceptModal(false);
    triggerToast(
      "Auto-Accept Safety Gate Swapped", 
      "Automatic dispatcher is active. Incoming client orders will bypass manual click validations.", 
      "success"
    );
    saveAuditLog("Auto-Accept Mode", "Disabled", "Enabled with safety bypass", "Rohan P. (Admin)");
  };

  // Trigger simulated order event play for demonstrating alerts & auto-accept workflow
  const triggerSimulatedIncomingOrder = () => {
    const dummyOrder = {
      orderId: `OO-${Math.floor(Math.random() * 89999 + 10000)}`,
      itemsCount: 3,
      amount: Math.floor(Math.random() * 800 + 300),
      client: "Aarav Sharma",
      dishes: "1xPaneer Butter Masala, 2x Butter Tandoori Rotis",
      type: "Home Delivery",
      isHighPriority: Math.random() > 0.5
    };
    
    setSimulatedIncomingOrder(dummyOrder);
    triggerToast(
      "📦 Simulated Order Dispatched to Kitchen", 
      `Order ${dummyOrder.orderId} (₹${dummyOrder.amount}) by Aarav Sharma`, 
      "info"
    );

    // If Voice Alerts are configured, speak out automatically
    if (enableVoiceAlerts) {
      setTimeout(() => {
        if ("speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const p = `Urgent alert! A new order numbered ${dummyOrder.orderId} containing paneer butter masala is sent to kitchen terminal. Status check active.`;
          const utterance = new SpeechSynthesisUtterance(p);
          utterance.volume = alertVolume / 100;
          window.speechSynthesis.speak(utterance);
        }
      }, 800);
    }

    // Append to logs
    saveAuditLog(
      `Incoming Order Accepted (${dummyOrder.orderId})`, 
      "Queue Idle", 
      enableAutoAccept ? "Auto-queued (Accepted - No hands)" : "Pending manual restaurant tap", 
      "KDS Automation Engine"
    );
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans pb-16">
      
      {/* 1. COMPACT PAGE HEADER WITH AUDITING ACTIONS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center p-6 bg-gradient-to-r from-stone-900 via-neutral-900 to-red-950 border border-stone-900 rounded-3xl gap-4 shadow-md text-white">
        <div className="text-left space-y-1">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-900/40 border border-red-800/30 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-wider">
            ☕ Restaurant Operations Hub
          </div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Tv className="w-6.5 h-6.5 text-[#E23744]" /> Kitchen Display System (KDS) Settings
          </h2>
          <p className="text-xs text-stone-300 max-w-2xl">
            Configure restaurant-side kitchen tablet endpoints, printer networks, auto-accept loops, spoken audio triggers, and synchronize live delivery metrics with the driver fleet.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap gap-2 pt-2 xl:pt-0">
          <button
            id="kds-trigger-sim-btn"
            onClick={triggerSimulatedIncomingOrder}
            className="p-2 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Fire Simulation Order
          </button>

          <button
            id="kds-view-logs-btn"
            onClick={() => {
              const element = document.getElementById("kds-audit-logs-section");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
                triggerToast("Navigated to Audit Panel", "Showing continuous logs trails", "info");
              }
            }}
            className="p-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5" /> View Activity Logs
          </button>

          <button
            id="kds-reset-defaults-btn"
            onClick={handleResetToDefault}
            className="p-2 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>

          <button
            id="kds-save-changes-top-btn"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="p-2 px-4.5 bg-[#E23744] hover:bg-red-700 disabled:bg-rose-900 text-white rounded-xl text-xs font-black tracking-wide cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. SPECIFIC BRAND SELECTOR OVERVIEW */}
      <div className="bg-white dark:bg-[#1E1E24] p-4 rounded-2xl border border-zinc-150 dark:border-gray-900 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 text-[#E23744] rounded-xl font-bold">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-extrabold uppercase block tracking-wider">Configure Operations for Node:</span>
            <select
              id="kds-restaurant-picker-dropdown"
              value={selectedRestId}
              onChange={(e) => {
                setSelectedRestId(e.target.value);
                triggerToast(
                  "Switched Restaurant Scope", 
                  "Loaded custom calibration profiles for selected restaurant", 
                  "info"
                );
              }}
              className="p-1 border border-zinc-200 rounded-lg text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#E23744] bg-slate-50 min-w-[200px]"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id.toString()}>
                  {r.name} ({r.cuisine || "Indian"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic warning if offline */}
        <div className="p-3 px-4 bg-emerald-50 dark:bg-stone-900 rounded-xl border border-emerald-200/50 flex items-center gap-2.5 md:max-w-md">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <p className="text-[11px] text-emerald-800 leading-normal">
            <strong>Active Integration Mode:</strong> KDS Terminal is sync-locked with merchant master catalog. Preparation dispatch registers automatically in Googly Rider pipeline.
          </p>
        </div>
      </div>

      {/* THREE ROW CONFIGURATION GRID PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: DEVICES, AUTO ACCEPT & AUTO REJECT COMPLETED PANELS */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* HARDWARE DEVICE INTEGRATION SETTINGS */}
          <div className="bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 shadow-3xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-stone-700" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">KDS Integration & POS Hardware Link</h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                integrationStatus === "Connected" ? "bg-emerald-100 text-emerald-800" :
                integrationStatus === "Syncing" ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-red-100 text-red-800"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${integrationStatus === "Connected" ? "bg-emerald-600" : "bg-rose-600 animate-ping"}`} />
                POS State: {integrationStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block text-[10px] text-stone-400 font-extrabold mb-1 uppercase tracking-wider">Device Hardware Local IP</label>
                <input
                  type="text"
                  value={deviceIp}
                  onChange={(e) => setDeviceIp(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-zinc-200 rounded-lg text-[11px] font-mono font-bold text-stone-700 focus:outline-[#E23744]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-extrabold mb-1 uppercase tracking-wider">Terminal ID Identifier</label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-zinc-200 rounded-lg text-[11px] font-mono font-bold text-stone-700"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-extrabold mb-1 uppercase tracking-wider">Software Version Code</label>
                <div className="p-2 bg-slate-50 border rounded-lg text-[11px] font-mono font-bold text-stone-600">
                  {softwareVersion} <span className="text-[9px] bg-sky-100 text-sky-800 px-1 py-0.5 rounded font-sans ml-1">LATEST</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-extrabold mb-1 uppercase tracking-wider">Last Synced Timestamp</label>
                <div className="p-2 bg-slate-50 border rounded-lg text-[11px] font-mono font-bold text-stone-500 flex items-center justify-between">
                  <span>{lastSyncTime}</span>
                  <Wifi className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <button
                id="kds-connect-device-btn"
                onClick={() => {
                  setIntegrationStatus("Connected");
                  triggerToast("Hardware Initialized", "KDS terminal port locked successfully.", "success");
                }}
                className="p-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold cursor-pointer transition-all"
              >
                Connect Device
              </button>
              
              <button
                id="kds-reconnect-btn"
                onClick={handleTestDeviceConnection}
                className="p-1.5 px-3 bg-slate-100 hover:bg-slate-300 text-stone-700 rounded-lg font-bold cursor-pointer"
              >
                Reconnect
              </button>

              <button
                id="kds-test-connection-btn"
                onClick={handleTestDeviceConnection}
                disabled={isTestingConn}
                className="p-1.5 px-3 bg-slate-100 hover:bg-slate-300 text-stone-700 rounded-lg font-bold cursor-pointer flex items-center gap-1"
              >
                {isTestingConn && <RefreshCw className="w-3 h-3 animate-spin text-stone-500" />}
                Test Diagnostic
              </button>

              <button
                id="kds-sync-now-btn"
                onClick={handleForceSyncKDS}
                className="p-1.5 px-3 bg-red-50 hover:bg-red-100 text-[#E23744] rounded-lg font-extrabold cursor-pointer ml-auto"
              >
                Sync Now
              </button>
            </div>
          </div>

          {/* ORDER PROCESSING & AUTO-ACCEPT SETTINGS */}
          <div className="bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 shadow-3xs space-y-4">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#E23744]" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">Order Processing Automation</h3>
              </div>
              
              {/* Premium Slide Toggle Switch */}
              <button
                id="kds-toggle-autoaccept"
                onClick={handleToggleAutoAccept}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                  enableAutoAccept ? "bg-emerald-600 justify-end" : "bg-neutral-200 justify-start"
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Quick alert indicator */}
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2.5 leading-normal ${
              enableAutoAccept ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong>Auto-Accept is {enableAutoAccept ? "ACTIVE" : "DISABLED"}:</strong>
                {enableAutoAccept ? (
                  <p className="mt-0.5 text-[11px] opacity-90">Orders will auto-approve bypassing human tablet interaction. This is configured to speed up kitchen preparation delivery streams.</p>
                ) : (
                  <p className="mt-0.5 text-[11px] opacity-90">Requires manual touch confirmation on the kitchen tablet for every incoming client ticket. Might increase dispatch delays.</p>
                )}
              </div>
            </div>

            {enableAutoAccept && (
              <div className="space-y-3.5 pt-1.5 text-xs animate-fade-in">
                <strong className="text-[10px] text-stone-400 font-extrabold uppercase tracking-wide">ADDITIONAL AUTOMATION PARAMS:</strong>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900">During Business Hours Only</span>
                    <p className="text-[10.5px] text-zinc-400">Bypasses automatic accepts after restaurant shutdown</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAcceptHoursOnly}
                    onChange={(e) => setAutoAcceptHoursOnly(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#E23744] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900">Auto-Accept Scheduled Pre-Orders</span>
                    <p className="text-[10.5px] text-zinc-400">Accept advance order timesheets immediately</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoAcceptScheduled}
                    onChange={(e) => setAutoAcceptScheduled(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#E23744] cursor-pointer"
                  />
                </div>

                <div className="space-y-2 border-t border-dashed border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900">Auto-Accept Below Target Tier Threshold</span>
                      <p className="text-[10.5px] text-zinc-400">High-value bills over target amount require manual chef vetting</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoAcceptBelowVal}
                      onChange={(e) => setAutoAcceptBelowVal(e.target.checked)}
                      className="w-4.5 h-4.5 accent-[#E23744] cursor-pointer"
                    />
                  </div>

                  {autoAcceptBelowVal && (
                    <div className="p-3 bg-slate-50 dark:bg-stone-900 rounded-lg flex items-center justify-between gap-4 text-xs font-bold font-mono">
                      <span className="text-stone-500">Auto approve orders below:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-800 dark:text-white">₹</span>
                        <input
                          type="number"
                          value={autoAcceptThreshold}
                          onChange={(e) => setAutoAcceptThreshold(Math.max(0, Number(e.target.value)))}
                          className="w-20 p-1 border rounded text-center text-stone-700 font-mono bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AUTO-REJECT LOGISTICS GUARD RULES */}
          <div className="bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 shadow-3xs space-y-4">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">Auto-Reject Logistics Rules</h3>
              </div>
              <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-extrabold font-mono">FINANCIAL PROTECTION</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900">Auto-Reject When Restaurant Status is Offline</span>
                  <p className="text-[10.5px] text-zinc-400">Drop orders automatically if outlet turns off internet</p>
                </div>
                <input
                  type="checkbox"
                  checked={rejectWhenOffline}
                  onChange={(e) => setRejectWhenOffline(e.target.checked)}
                  className="w-4.5 h-4.5 accent-[#E23744] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900">Auto-Reject Outside Permitted Operating Hours</span>
                  <p className="text-[10.5px] text-zinc-400">Instantly decline night cravings outside official shifts</p>
                </div>
                <input
                  type="checkbox"
                  checked={rejectOutsideHours}
                  onChange={(e) => setRejectOutsideHours(e.target.checked)}
                  className="w-4.5 h-4.5 accent-[#E23744] cursor-pointer"
                />
              </div>

              <div className="space-y-2 border-t border-dashed border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-900">Auto-Reject at Max Backlog Capacity</span>
                    <p className="text-[10.5px] text-zinc-400">Protects restaurant reputation against extreme cook backlogs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={rejectOnMaxCapacity}
                    onChange={(e) => setRejectOnMaxCapacity(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#E23744] cursor-pointer"
                  />
                </div>

                {rejectOnMaxCapacity && (
                  <div className="p-3 bg-slate-50 dark:bg-stone-900 rounded-lg flex items-center justify-between gap-4 text-xs font-mono">
                    <span className="text-stone-500 font-bold">Block orders if active kitchen queue exceeds:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={maxKitchenCapacity}
                        onChange={(e) => setMaxKitchenCapacity(Math.max(1, Number(e.target.value)))}
                        className="w-16 p-1 border rounded text-center text-stone-700 font-mono font-bold bg-white"
                      />
                      <span className="text-stone-800 dark:text-white font-sans text-xs">tickets</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: KITCHEN AUDIO NOTIFICATION, PREFERENCES & ROUTING STATUS SETTINGS */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* KITCHEN AUDIO & SPEECH (TTS) ALERTS PANEL */}
          <div className="bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 shadow-3xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-stone-700" />
                <h3 className="font-extrabold text-sm text-stone-900 dark:text-white">Kitchen Voice Alerts (Text-to-Speech)</h3>
              </div>
              <button
                id="kds-toggle-voicealerts"
                onClick={() => {
                  setEnableVoiceAlerts(!enableVoiceAlerts);
                  triggerToast("Acoustics Toggled", `Kitchen spoken audio prompts are ${!enableVoiceAlerts ? "Enabled" : "Disabled"}.`, "info");
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                  enableVoiceAlerts ? "bg-emerald-600 justify-end" : "bg-neutral-200 justify-start"
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {enableVoiceAlerts ? (
              <div className="space-y-3.5 text-xs animate-fade-in">
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] text-stone-400 font-extrabold mb-1">ALERT LANGUAGE</label>
                    <select
                      value={alertLanguage}
                      onChange={(e: any) => setAlertLanguage(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-zinc-200 rounded-lg text-xs font-bold"
                    >
                      <option value="en">English (UK/Global)</option>
                      <option value="hi">हिंदी (India)</option>
                      <option value="bn">বাংলা (Bengal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-400 font-extrabold mb-1">VOICE CALIBRATION</label>
                    <select
                      value={voiceType}
                      onChange={(e: any) => setVoiceType(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-zinc-200 rounded-lg text-xs font-bold"
                    >
                      <option value="Female">Standard Female</option>
                      <option value="Male">Standard Male</option>
                      <option value="Robotic">Industrial Robotic</option>
                    </select>
                  </div>
                </div>

                {/* Repeat dropdown */}
                <div className="grid grid-cols-2 gap-3.5 items-center">
                  <div>
                    <label className="block text-[10px] text-stone-400 font-extrabold mb-1">REPEAT COUNT</label>
                    <select
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-zinc-200 rounded-lg text-xs font-bold"
                    >
                      <option value="1">Spoken once</option>
                      <option value="2">Repeat twice (Recommended)</option>
                      <option value="3">Repeat 3 times</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-4 pl-2">
                    <span className="font-bold text-stone-800 dark:text-stone-200">Repeat until acknowledged</span>
                    <input
                      type="checkbox"
                      checked={continuousAlert}
                      onChange={(e) => setContinuousAlert(e.target.checked)}
                      className="w-4 h-4 accent-[#E23744]"
                    />
                  </div>
                </div>

                {/* Alert Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="block text-[10px] text-stone-400 font-extrabold">MASTER VOLUME SET</span>
                    <span className="font-mono text-stone-700 font-bold">{alertVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={alertVolume}
                    onChange={(e) => setAlertVolume(Number(e.target.value))}
                    className="w-full accent-[#E23744] h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Previews and Speech Testing Buttons */}
                <div className="pt-2 grid grid-cols-2 gap-2.5">
                  <button
                    id="kds-test-voice-tts-btn"
                    onClick={handleTestVoiceAlert}
                    className="p-2 bg-stone-900 text-white rounded-lg font-bold hover:bg-stone-800 cursor-pointer text-xs flex items-center justify-center gap-1.5"
                  >
                    <Speech className="w-4 h-4 text-rose-500" /> Test Voice Synthesis
                  </button>

                  <button
                    id="kds-preview-notif-btn"
                    onClick={handlePreviewVisualNotification}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-stone-700 rounded-lg font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> Preview Notification
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-50 border rounded-xl text-center text-xs text-stone-500">
                ⚠️ Spoken alerts are disabled. Kitchen staff must monitor active display boards visually for delivery updates.
              </div>
            )}
          </div>

          {/* KITCHEN SOUND PANELS & GENERAL SOUND CHANNELS */}
          <div className="bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 shadow-3xs space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <Volume1 className="w-5 h-5 text-stone-700" /> Kitchen Sound & Alert Preferences
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200">Sound Tone Alert for New Orders</span>
                <input
                  type="checkbox"
                  checked={soundAlertNew}
                  onChange={(e) => setSoundAlertNew(e.target.checked)}
                  className="w-4.5 h-4.5 accent-rose-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200">Sound Tone Alert for Order Cancellation</span>
                <input
                  type="checkbox"
                  checked={soundAlertCancel}
                  onChange={(e) => setSoundAlertCancel(e.target.checked)}
                  className="w-4.5 h-4.5 accent-rose-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200">Acoustic Beep for Order Modification</span>
                <input
                  type="checkbox"
                  checked={soundAlertModify}
                  onChange={(e) => setSoundAlertModify(e.target.checked)}
                  className="w-4.5 h-4.5 accent-rose-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200">Urgent Beep for Overdue Delayed Orders</span>
                <input
                  type="checkbox"
                  checked={soundAlertDelayed}
                  onChange={(e) => setSoundAlertDelayed(e.target.checked)}
                  className="w-4.5 h-4.5 accent-rose-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 dark:text-stone-200">Sirens for High-Priority / Extreme Commits</span>
                <input
                  type="checkbox"
                  checked={soundAlertUrgent}
                  onChange={(e) => setSoundAlertUrgent(e.target.checked)}
                  className="w-4.5 h-4.5 accent-rose-600"
                />
              </div>

              {/* Slider Tunnels */}
              <div className="border-t border-dashed border-gray-100 pt-3 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-stone-400 font-extrabold uppercase">
                    <span>New Order Volume Ring</span>
                    <span>{volumeNewOrder}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumeNewOrder}
                    onChange={(e) => setVolumeNewOrder(Number(e.target.value))}
                    className="w-full accent-[#E23744] h-1 bg-gray-100 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-stone-400 font-extrabold uppercase">
                    <span>Urgent Warning / Sirens Volume</span>
                    <span>{volumeUrgentOrder}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumeUrgentOrder}
                    onChange={(e) => setVolumeUrgentOrder(Number(e.target.value))}
                    className="w-full accent-[#E23744] h-1 bg-gray-100 rounded"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-stone-400 font-extrabold uppercase">
                    <span>General Chat / Comms Ping</span>
                    <span>{volumeGeneral}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumeGeneral}
                    onChange={(e) => setVolumeGeneral(Number(e.target.value))}
                    className="w-full accent-[#E23744] h-1 bg-gray-100 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KITCHEN WORKFLOW OPERATIONS & QUEUE ROUTING */}
          <div className="bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 shadow-3xs space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-stone-700" /> Kitchen Workflow Operations
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Queue sorting type selections */}
              <div>
                <label className="block text-[10px] text-stone-400 font-extrabold mb-1.5 uppercase">QUEUING DISPATCH METHODOLOGY</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="kds-strategy-fifo-btn"
                    onClick={() => {
                      setQueueStrategy("FIFO");
                      triggerToast("FIFO Selected", "Default oldest-first queue applied.", "info");
                    }}
                    className={`p-2 border rounded-xl font-bold transition-all text-center ${
                      queueStrategy === "FIFO" 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 text-stone-700 hover:bg-slate-100"
                    }`}
                  >
                    FIFO (Classic)
                  </button>

                  <button
                    id="kds-strategy-priority-btn"
                    onClick={() => {
                      setQueueStrategy("Priority");
                      triggerToast("Priority Algorithm Armed", "Orders prioritized by size/delivery tier.", "success");
                    }}
                    className={`p-2 border rounded-xl font-bold transition-all text-center ${
                      queueStrategy === "Priority" 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 text-stone-700 hover:bg-slate-100"
                    }`}
                  >
                    Priority-Based
                  </button>

                  <button
                    id="kds-strategy-manual-btn"
                    onClick={() => {
                      setQueueStrategy("Manual");
                      triggerToast("Manual Sort Allowed", "Chefs can re-order digital cards manually.", "info");
                    }}
                    className={`p-2 border rounded-xl font-bold transition-all text-center ${
                      queueStrategy === "Manual" 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 text-stone-700 hover:bg-slate-100"
                    }`}
                  >
                    Manual Sort
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-1 border-t border-dashed border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200">Enable Order Queue Management (Digital Board)</span>
                  <input
                    type="checkbox"
                    checked={enableQueueMgmt}
                    onChange={(e) => setEnableQueueMgmt(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#E23744]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200">Calculate Dynamic Estimated Preparation Time</span>
                  <input
                    type="checkbox"
                    checked={enableEstPrepTime}
                    onChange={(e) => setEnableEstPrepTime(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#E23744]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200">Highlight Flagged High Priority Orders</span>
                  <input
                    type="checkbox"
                    checked={enableAutoPrioritize}
                    onChange={(e) => setEnableAutoPrioritize(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#E23744]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200">Multi-Station Kitchen Routing (Prep / Fry / Grill)</span>
                  <input
                    type="checkbox"
                    checked={enableMultiStation}
                    onChange={(e) => setEnableMultiStation(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#E23744]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 dark:text-stone-200">Report Terminal Cook-Times Performance to Admin</span>
                  <input
                    type="checkbox"
                    checked={enablePerformanceTracking}
                    onChange={(e) => setEnablePerformanceTracking(e.target.checked)}
                    className="w-4.5 h-4.5 accent-[#E23744]"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* THREE SECTION ROW: REALTIME SYNC PATTERNS & SPECIFIC RESTAURANT DEFAULTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* REAL-TIME ORDER STATUS SYNCHRONIZATION PIPELINE */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 shadow-3xs space-y-4">
          <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-stone-700" /> Order Status Synchronization Pipeline
            </h3>
            <span className="text-[10px] text-emerald-800 px-2 py-0.5 bg-emerald-50 rounded font-bold font-mono">HEALTHY</span>
          </div>

          <p className="text-xs text-stone-500 leading-normal">
            Configure how the restaurant app sends and synchronizes live cook-times instantly with drivers and the consumer's delivery application wrapper.
          </p>

          <div className="space-y-3 text-xs pt-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900">Instant Event Updates dispatching</span>
                <p className="text-[11px] text-zinc-400">WebSocket real-time broadcast instead of polling</p>
              </div>
              <input
                type="checkbox"
                checked={syncInstantStatus}
                onChange={(e) => setSyncInstantStatus(e.target.checked)}
                className="w-4.5 h-4.5 accent-[#E23744]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900">Auto-Mark "Preparation Started" on Cook Acceptance</span>
                <p className="text-[11px] text-zinc-400">Instantly alerts consumer that order is on the pan</p>
              </div>
              <input
                type="checkbox"
                checked={syncAutoPrepStart}
                onChange={(e) => setSyncAutoPrepStart(e.target.checked)}
                className="w-4.5 h-4.5 accent-[#E23744]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900">Auto-Mark "Ready for Pickup" when prep timer expires</span>
                <p className="text-[11px] text-zinc-400">Alerts nearby riders instantly to proceed to counter</p>
              </div>
              <input
                type="checkbox"
                checked={syncAutoReady}
                onChange={(e) => setSyncAutoReady(e.target.checked)}
                className="w-4.5 h-4.5 accent-[#E23744]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900">Auto-Complete Ticket when runner grabs parcel</span>
                <p className="text-[11px] text-zinc-400">Discharges card from kitchen screen upon runner hand-off</p>
              </div>
              <input
                type="checkbox"
                checked={syncAutoCompletion}
                onChange={(e) => setSyncAutoCompletion(e.target.checked)}
                className="w-4.5 h-4.5 accent-[#E23744]"
              />
            </div>
          </div>
        </div>

        {/* RESTAURANT-SPECIFIC LEVEL OVERRIDES CONTROL */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 shadow-3xs space-y-4">
          <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-stone-700" /> Specific Operational Overrides
            </h3>
            <span className="text-[9.5px] text-stone-500 font-bold bg-slate-100 p-1 rounded">
              Config Scope: {activeRestName}
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] text-zinc-450 font-extrabold mb-1">DEFAULT PREP LAPSE (MINUTES)</label>
                <input
                  type="number"
                  value={defaultPrepTime}
                  onChange={(e) => setDefaultPrepTime(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2 bg-slate-50 border border-zinc-200 rounded-lg font-bold font-mono text-stone-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-450 font-extrabold mb-1">MAX SIMULTANEOUS QUEUE</label>
                <input
                  type="number"
                  value={maxSimultaneousOrders}
                  onChange={(e) => setMaxSimultaneousOrders(Math.max(1, Number(e.target.value)))}
                  className="w-full p-2 bg-slate-50 border border-zinc-200 rounded-lg font-bold font-mono text-stone-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-450 font-extrabold mb-1 uppercase">Peak Hour Congestion Handling Rules</label>
              <select
                value={peakHourRules}
                onChange={(e: any) => setPeakHourRules(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-zinc-200 rounded-lg text-xs font-bold"
              >
                <option value="BoostPrepTime">Add 10 mins dynamically to client preparation times</option>
                <option value="ThrottleThroughput">Throttle new orders intake (rate limit queue input)</option>
                <option value="Default">Keep standard preparation times (High Stress Mode)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-bold text-stone-900">Temporary Auto-Accept Override Off</span>
                <p className="text-[10.5px] text-zinc-400">Forces full manual acceptance during high load kitchen chaos</p>
              </div>
              <input
                type="checkbox"
                checked={tempAutoAcceptOverride}
                onChange={(e) => setTempAutoAcceptOverride(e.target.checked)}
                className="w-4.5 h-4.5 accent-[#E23744]"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-stone-900">Enforce Holiday / Special Event Rules</span>
                <p className="text-[10.5px] text-zinc-400">Triggers customized festive greetings on order receipts</p>
              </div>
              <input
                type="checkbox"
                checked={holidayRulesActive}
                onChange={(e) => setHolidayRulesActive(e.target.checked)}
                className="w-4.5 h-4.5 accent-[#E23744]"
              />
            </div>
          </div>
        </div>

      </div>

      {/* PLAYGROUND: SIMULATED LIVE TICKET ENQUEUE DRAWER (Shown if simulation order clicked) */}
      {simulatedIncomingOrder && (
        <div className="p-5 bg-gradient-to-r from-red-50 to-stone-100 border-2 border-[#E23744]/30 rounded-2xl relative animate-slide-in text-xs space-y-3">
          <button
            onClick={() => setSimulatedIncomingOrder(null)}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 font-extrabold"
          >
            ✕ Dismiss Ticket
          </button>
          
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black uppercase">LIVE ENQUEUE TESTER</span>
            <strong className="text-stone-900 font-extrabold text-sm">Active Simulated Order: {simulatedIncomingOrder.orderId}</strong>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[11px] pt-1">
            <div className="bg-white p-2.5 rounded-xl border">
              <span className="text-zinc-400 block text-[9px] uppercase font-bold">CLIENT NAME</span>
              <strong className="text-stone-800">{simulatedIncomingOrder.client}</strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border">
              <span className="text-zinc-400 block text-[9px] uppercase font-bold">DISHES ORDER MODULE</span>
              <strong className="text-[#E23744] truncate block">{simulatedIncomingOrder.dishes}</strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border">
              <span className="text-zinc-400 block text-[9px] uppercase font-bold">MUTED BILL SUM</span>
              <strong className="text-stone-800">₹{simulatedIncomingOrder.amount}</strong>
            </div>

            <div className="bg-white p-2.5 rounded-xl border">
              <span className="text-zinc-400 block text-[9px] uppercase font-bold">DECISION TAKEN BY ALGORITHM</span>
              {enableAutoAccept ? (
                <span className="text-emerald-700 font-bold block">✓ Accepted Instantly via Auto-Accept</span>
              ) : (
                <span className="text-amber-700 font-bold block">⏸ Pending click on kitchen terminal</span>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            {!enableAutoAccept && (
              <button
                id="kds-sim-manual-approve"
                onClick={() => {
                  triggerToast("Order Approved", `Simulated ticket ${simulatedIncomingOrder.orderId} accepted successfully.`, "success");
                  setSimulatedIncomingOrder(null);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 px-3 rounded font-bold"
              >
                Accept Meal Manually
              </button>
            )}
            <button
              onClick={() => {
                triggerToast("Test Order Discharged", "Cleaned simulation logs state", "info");
                setSimulatedIncomingOrder(null);
              }}
              className="bg-stone-900 text-white p-1.5 px-3 rounded"
            >
              Clear Simulator Display
            </button>
          </div>
        </div>
      )}

      {/* 4. ACTIVITY LOGS & AUDIT TRAIL TABLE */}
      <div id="kds-audit-logs-section" className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-zinc-150 dark:border-gray-900 shadow-3xs overflow-hidden">
        
        {/* Log table custom header */}
        <div className="p-5 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="text-left">
            <h3 className="font-extrabold text-sm text-stone-900 dark:text-white flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-stone-500" /> KDS Settings Modification Logs & Audit Trails
            </h3>
            <p className="text-[11px] text-stone-400">Trailing log history containing the 20 most recent operational shifts.</p>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search setting, agent..."
              value={filterLogsSearch}
              onChange={(e) => setFilterLogsSearch(e.target.value)}
              className="pl-8 p-1.5 text-xs w-full bg-slate-50 border border-zinc-200 rounded-lg focus:outline-[#E23744]"
            />
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 font-black text-[9.5px] uppercase text-stone-400 border-b">
                <th className="p-3 pl-5">Audit Log ID</th>
                <th className="p-3">Changed Setting Node</th>
                <th className="p-3 text-red-700">Previous value</th>
                <th className="p-3 text-emerald-800">New configured value</th>
                <th className="p-3">Updated By</th>
                <th className="p-3 font-mono">Date & Time</th>
                <th className="p-3">Device Terminal</th>
                <th className="p-3 text-center">Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 text-stone-600">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400 font-bold">
                    No settings activity logs found for the search query: "{filterLogsSearch}"
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 pl-5 font-mono font-black text-stone-900">{log.id}</td>
                    <td className="p-3 font-bold text-stone-900">{log.changedSetting}</td>
                    <td className="p-3 font-mono text-zinc-400 line-through">{log.prevValue}</td>
                    <td className="p-3 font-mono text-emerald-700 font-semibold">{log.newValue}</td>
                    <td className="p-3 font-semibold text-stone-900">{log.updatedBy}</td>
                    <td className="p-3 text-[11px] text-stone-400">{log.timestamp}</td>
                    <td className="p-3 text-[11.5px]">{log.deviceUsed}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          setViewingLogDetail(log);
                        }}
                        className="p-1 px-2.5 bg-slate-900 hover:bg-stone-800 text-white rounded font-bold text-[10px] cursor-pointer"
                      >
                        Inspect Node
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer actions inside log section */}
        <div className="p-3.5 bg-slate-50 border-t flex justify-between items-center text-[10.5px]">
          <span className="text-stone-400 font-medium">Auto-purge scheduler: <strong>Continuous 90 Days Retainment</strong></span>
          <button
            onClick={() => {
              triggerToast(
                "Audit Logs Dumped",
                "Successfully exported the kitchen calibration logs list to system CSV audit sheets.",
                "success"
              );
            }}
            className="p-1.5 bg-white border border-zinc-200 hover:bg-slate-50 text-stone-700 rounded-lg font-black flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export KDS Logs Spreadsheet
          </button>
        </div>
      </div>

      {/* SAFEGUARD WARNING CONFIRMATION MODAL BEFORE ENABLING AUTO-ACCEPT */}
      {showAutoAcceptModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl skew-y-0 text-left">
            <div className="flex items-center gap-3 text-amber-600 border-b pb-3 border-zinc-100">
              <AlertTriangle className="w-8 h-8 shrink-0 text-amber-500 animate-bounce" />
              <div>
                <h3 className="font-extrabold text-base text-stone-900">Safety Warning Gate</h3>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">CRITICAL OPERATIONS TOGGLE</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Enabling <strong>Auto-Accept Orders</strong> means the restaurant bypasses the initial staff manual ticket check. All future orders instantly display in the kitchen queuing lists.
            </p>

            <div className="p-3 bg-red-100/35 border text-xs text-[#E23744] font-bold rounded-xl space-y-1">
              <span>⚠️ POTENTIAL LOGISTICAL SIDE EFFECTS:</span>
              <ul className="list-disc list-inside text-[10px] font-medium leading-relaxed pl-1 space-y-0.5 mt-1 text-slate-700">
                <li>Increased chance of auto-reject failures during intense rush hours</li>
                <li>Unable to decline custom client notes on food allergies</li>
                <li>Instant commission dispatch triggers on rider fleet networks</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowAutoAcceptModal(false)}
                className="p-2 px-4 bg-slate-100 hover:bg-slate-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel & Keep Disabled
              </button>
              
              <button
                id="kds-confirm-autoaccept-modal"
                onClick={confirmAutoAcceptEnable}
                className="p-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Yes, Enable Auto-Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT ACTIVITY LOG MODAL DETAIL */}
      {viewingLogDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <strong className="text-sm font-black text-stone-900">Inspect Log Node: {viewingLogDetail.id}</strong>
              <button onClick={() => setViewingLogDetail(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="space-y-2.5">
              <div>
                <span className="text-stone-400 block text-[10px]">CHANGED SETTING FIELD</span>
                <strong className="text-[#E23744] text-xs font-black">{viewingLogDetail.changedSetting}</strong>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-red-50 p-2.5 rounded-lg border border-red-100">
                  <span className="text-red-400 block text-[9px] font-extrabold">PREVIOUS CONFIG</span>
                  <p className="font-mono text-zinc-700 leading-normal line-through">{viewingLogDetail.prevValue}</p>
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  <span className="text-emerald-400 block text-[9px] font-extrabold">NEW ASSIGNED SETTING</span>
                  <p className="font-mono text-emerald-800 leading-normal font-bold">{viewingLogDetail.newValue}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-[11px] pt-1">
                <div>
                  <span className="text-stone-400 block text-[9px]">UPDATED BY</span>
                  <strong className="text-stone-800">{viewingLogDetail.updatedBy}</strong>
                </div>

                <div>
                  <span className="text-stone-400 block text-[9px]">LOG DATE TIME</span>
                  <strong className="text-stone-800">{viewingLogDetail.timestamp}</strong>
                </div>
              </div>

              <div>
                <span className="text-stone-400 block text-[9px]">AUTHORIZATION HARDWARE HOST</span>
                <strong className="text-stone-800">{viewingLogDetail.deviceUsed}</strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingLogDetail(null)}
                className="p-2 bg-stone-900 text-white rounded-xl font-bold px-4"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
