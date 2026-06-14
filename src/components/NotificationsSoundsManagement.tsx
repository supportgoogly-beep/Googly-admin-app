import React, { useState, useRef, useEffect } from "react";
import { 
  Bell, Volume2, VolumeX, Upload, Play, Pause, Square, Trash, Plus, Search, 
  MessageSquare, Settings, Activity, FileText, Check, ChevronRight, Sparkles, 
  Download, Database, AlertTriangle, Server, ShieldAlert, Moon, Sun, Filter, 
  Share2, FileSpreadsheet, UserCheck, RefreshCw, Smartphone, Mail, AlertOctagon, 
  Volume1, Zap, Sliders, Layout, History, FileUp, Copy, Eye, HelpCircle, Save, Info
} from "lucide-react";
import { uploadFile } from "../lib/storage";

interface SoundAsset {
  id: string;
  name: string;
  format: string;
  duration: string;
  size: string;
  uploadDate: string;
  isCustom: boolean;
  srcUrl?: string; // used for custom uploaded files
}

interface NotificationEvent {
  id: string;
  name: string;
  category: "System" | "Restaurant" | "Rider" | "Support" | "Alerts";
  soundAssigned: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  inAppEnabled: boolean;
  status: "Active" | "Disabled";
  description: string;
}

interface AuditLogEntry {
  id: string;
  eventName: string;
  soundChanged: string;
  previousSound: string;
  newSound: string;
  modifiedBy: string;
  timestamp: string;
}

interface TemplateConfig {
  id: string;
  eventName: string;
  push: { title: string; message: string; actionText: string };
  email: { subject: string; content: string; branding: string };
  sms: { content: string };
}

export default function NotificationsSoundsManagement({
  triggerToast
}: {
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}) {
  // Theme Toggle: Inspired by dark settings dashboards (Discord sound tab)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Active Subsection Index (Slack/Discord Sidebar Model)
  const [activeMenuSection, setActiveMenuSection] = useState<"overview" | "events" | "sounds" | "volume" | "templates" | "logs">("overview");

  // Custom dispatched push campaigns state
  const [campaigns, setCampaigns] = useState<Array<{
    id: string;
    title: string;
    message: string;
    segment: string;
    recipients: number;
    timestamp: string;
  }>>(() => {
    const saved = localStorage.getItem("googly_dispatched_campaigns");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: "camp-1", title: "Weekend Surge Activated", message: "Surge pricing multiplier is now up to 1.5x in Salt Lake! Log in now to accept orders.", segment: "All Riders", recipients: 42, timestamp: "2026-06-12 18:30:00" },
      { id: "camp-2", title: "FSSAI Compliance Notice", message: "Reminder: Please upload updated FSSAI certification to prevent suspension.", segment: "Partner Restaurants", recipients: 18, timestamp: "2026-06-11 11:15:00" },
      { id: "camp-3", title: "Rain Alert - Save Extra!", message: "Heavy rainfall in Kolkata. Enjoy Free On-Time Delivery today only!", segment: "All Customers", recipients: 154, timestamp: "2026-06-10 14:02:11" }
    ];
  });

  const [composerTitle, setComposerTitle] = useState("");
  const [composerMessage, setComposerMessage] = useState("");
  const [composerTarget, setComposerTarget] = useState("All Users");

  useEffect(() => {
    localStorage.setItem("googly_dispatched_campaigns", JSON.stringify(campaigns));
  }, [campaigns]);

  // Sync state when localstorage changes on other screens
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "googly_dispatched_campaigns" && e.newValue) {
        try {
          setCampaigns(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Filter Event Table State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All");

  // Core Static Sound Alerts (Built using Web Audio API in real-time!)
  const [soundsList, setSoundsList] = useState<SoundAsset[]>([
    { id: "s-1", name: "Chime Note", format: "Synth Mono", duration: "0.6s", size: "12 KB", uploadDate: "System Default", isCustom: false },
    { id: "s-2", name: "Cyber Swoop", format: "Synth Saw", duration: "0.3s", size: "8 KB", uploadDate: "System Default", isCustom: false },
    { id: "s-3", name: "Bubble Pop", format: "Synth Sine", duration: "0.15s", size: "5 KB", uploadDate: "System Default", isCustom: false },
    { id: "s-4", name: "Echo Bell", format: "Synth Pitch", duration: "0.8s", size: "18 KB", uploadDate: "System Default", isCustom: false },
    { id: "s-5", name: "Alert Chime", format: "Synth Pulse", duration: "0.3s", size: "10 KB", uploadDate: "System Default", isCustom: false },
    { id: "s-6", name: "Digital Synth", format: "Synth Retro", duration: "0.25s", size: "9 KB", uploadDate: "System Default", isCustom: false },
    // Pre-loaded simulated high quality sounds
    { id: "s-7", name: "incoming_order_bell.wav", format: "WAV", duration: "2.4s", size: "180 KB", uploadDate: "2026-06-05", isCustom: true },
    { id: "s-8", name: "urgent_dispatch_alert.mp3", format: "MP3", duration: "3.1s", size: "295 KB", uploadDate: "2026-06-10", isCustom: true },
  ]);

  // Core Events Schema configuration
  const [events, setEvents] = useState<NotificationEvent[]>([
    // System Events
    { id: "e-1", name: "New Order Received", category: "System", soundAssigned: "Alert Chime", pushEnabled: true, emailEnabled: false, smsEnabled: true, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "Triggered whenever a customer finalizes dynamic surge checkout on the consumer app" },
    { id: "e-2", name: "Order Accepted", category: "System", soundAssigned: "Chime Note", pushEnabled: true, emailEnabled: true, smsEnabled: false, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Triggered when partner kitchen acknowledges ticket and commences active cooking" },
    { id: "e-3", name: "Order Rejected", category: "System", soundAssigned: "Digital Synth", pushEnabled: true, emailEnabled: true, smsEnabled: true, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Admin/Kitchen cancels order (automatic notification triggers refund dispute workflow)" },
    { id: "e-4", name: "Order Cancelled", category: "System", soundAssigned: "Cyber Swoop", pushEnabled: true, emailEnabled: true, smsEnabled: true, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "Rider/Customer drops order within cancellation penalty window" },
    { id: "e-5", name: "Order Delivered", category: "System", soundAssigned: "Chime Note", pushEnabled: true, emailEnabled: true, smsEnabled: false, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "Rider sets geographic endpoint completed inside boundary limits" },
    { id: "e-6", name: "Payment Successful", category: "System", soundAssigned: "Chime Note", pushEnabled: false, emailEnabled: true, smsEnabled: true, whatsappEnabled: true, inAppEnabled: false, status: "Active", description: "Gateway completes and settles bank checkout details successfully" },
    { id: "e-7", name: "Refund Requested", category: "System", soundAssigned: "Bubble Pop", pushEnabled: true, emailEnabled: true, smsEnabled: false, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Customer raises ticket or files refund query" },
    { id: "e-8", name: "Refund Approved", category: "System", soundAssigned: "Chime Note", pushEnabled: true, emailEnabled: true, smsEnabled: true, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Admin approves refund transaction in Financial CRM panel" },

    // Restaurant Events
    { id: "e-9", name: "New Restaurant Registration", category: "Restaurant", soundAssigned: "Echo Bell", pushEnabled: false, emailEnabled: true, smsEnabled: false, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Partner requests portal access and uploads KYC documents" },
    { id: "e-10", name: "Restaurant Approved", category: "Restaurant", soundAssigned: "Chime Note", pushEnabled: true, emailEnabled: true, smsEnabled: true, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "Admin validates restaurant FSSAI credentials and activates catalog" },
    { id: "e-11", name: "Restaurant Suspended", category: "Restaurant", soundAssigned: "Digital Synth", pushEnabled: true, emailEnabled: true, smsEnabled: true, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "KYC failure or customer ratings drop trigger suspension" },

    // Rider Events
    { id: "e-12", name: "New Rider Registration", category: "Rider", soundAssigned: "Echo Bell", pushEnabled: false, emailEnabled: true, smsEnabled: false, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Onboarding rider files profile details and vehicle information" },
    { id: "e-13", name: "Rider Assigned", category: "Rider", soundAssigned: "Alert Chime", pushEnabled: true, emailEnabled: false, smsEnabled: true, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "Dispatch module anchors closest online rider node to order" },
    { id: "e-14", name: "Rider Arrived", category: "Rider", soundAssigned: "Bubble Pop", pushEnabled: true, emailEnabled: false, smsEnabled: false, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "Geofence triggers arrival check when rider crosses restaurant radius" },
    { id: "e-15", name: "Rider Offline", category: "Rider", soundAssigned: "Cyber Swoop", pushEnabled: false, emailEnabled: false, smsEnabled: true, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Rider disconnects session or loses signal range" },

    // Support Events
    { id: "e-16", name: "New Support Ticket", category: "Support", soundAssigned: "Alert Chime", pushEnabled: true, emailEnabled: true, smsEnabled: false, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Support CRM receives open query from client or active rider" },
    { id: "e-17", name: "Ticket Resolved", category: "Support", soundAssigned: "Chime Note", pushEnabled: true, emailEnabled: true, smsEnabled: false, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "CRM desk issues resolution status to customer account" },
    { id: "e-18", name: "Customer Complaint", category: "Support", soundAssigned: "Digital Synth", pushEnabled: true, emailEnabled: true, smsEnabled: true, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "High weight ticket raised regarding delivery delays or missing items" },

    // Alerts
    { id: "e-19", name: "Server Warning", category: "Alerts", soundAssigned: "Echo Bell", pushEnabled: true, emailEnabled: true, smsEnabled: false, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Server load exceeds 85% or latency increases across API" },
    { id: "e-20", name: "Maintenance Mode", category: "Alerts", soundAssigned: "Digital Synth", pushEnabled: true, emailEnabled: true, smsEnabled: true, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "Dev team triggers global app shut-off schedule in core admin" },
    { id: "e-21", name: "API Failure", category: "Alerts", soundAssigned: "Digital Synth", pushEnabled: true, emailEnabled: true, smsEnabled: true, whatsappEnabled: false, inAppEnabled: true, status: "Active", description: "Downstream microservice fails health checks" },
    { id: "e-22", name: "Security Alert", category: "Alerts", soundAssigned: "Echo Bell", pushEnabled: true, emailEnabled: true, smsEnabled: true, whatsappEnabled: true, inAppEnabled: true, status: "Active", description: "Multiple failed root login attempts or unauthorized header signatures" },
  ]);

  // Volume Configuration Nodes
  const [globalVolume, setGlobalVolume] = useState<number>(75);
  const [orderAlertVolume, setOrderAlertVolume] = useState<number>(85);
  const [criticalAlertVolume, setCriticalAlertVolume] = useState<number>(100);
  const [supportAlertVolume, setSupportAlertVolume] = useState<number>(60);

  // Playback rules
  const [playbackRule, setPlaybackRule] = useState<"once" | "thrice" | "continuous">("once");
  const [prioritySetting, setPrioritySetting] = useState<"low" | "medium" | "high" | "critical">("high");

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    { id: "l-1", eventName: "New Order Received", soundChanged: "Audio Assignee", previousSound: "Chime Note", newSound: "Alert Chime", modifiedBy: "Ruhan (SysAdmin)", timestamp: "2026-06-12 11:15:24" },
    { id: "l-2", eventName: "Security Alert", soundChanged: "Audio Assignee", previousSound: "Chime Note", newSound: "Echo Bell", modifiedBy: "Ruhan (SysAdmin)", timestamp: "2026-06-12 10:44:11" },
    { id: "l-3", eventName: "Order Cancelled", soundChanged: "Audio Assignee", previousSound: "None", newSound: "Cyber Swoop", modifiedBy: "System Default Root", timestamp: "2026-06-11 16:30:22" },
    { id: "l-4", eventName: "New Rider Registration", soundChanged: "Channels Settings", previousSound: "SMS Enabled", newSound: "SMS Disabled", modifiedBy: "Ruhan (SysAdmin)", timestamp: "2026-06-11 13:02:18" }
  ]);

  // Template custom values state
  const [templates, setTemplates] = useState<TemplateConfig[]>([
    {
      id: "t-1",
      eventName: "New Order Received",
      push: { title: "🍔 New Order Received!", message: "Order #{orderId} has been placed. Tap to delegate preparation countdown.", actionText: "Launch Kitchen UI" },
      email: { subject: "Success: New Order Received - ID {orderId}", content: "Dear Partner, an order has been finalized. Subtotal: INR {orderTotal}. Please commence cooking.", branding: "Enterprise Delivery System" },
      sms: { content: "New Delivery Order Alert! ID {orderId} for ₹{orderTotal}. View active dispatch panel." }
    },
    {
      id: "t-2",
      eventName: "Order Cancelled",
      push: { title: "⚠️ Order Cancelled by Client", message: "Order #{orderId} cancelled. Active dispatch routing aborted immediately.", actionText: "View Penalty Fee" },
      email: { subject: "Cancel Notice: Order #{orderId}", content: "The current transit Order status was updated to cancelled. Cancellation policy fees of ₹{penaltyAmount} will be calculated.", branding: "Enterprise Delivery System" },
      sms: { content: "ALERT: Order {orderId} Has been cancelled by client. Penalty applied. Check app settings." }
    },
  ]);

  // Template Editing state
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const [editingTemplate, setEditingTemplate] = useState<TemplateConfig>(templates[0]);

  // Audio Playback / Controller State (Sound testing center)
  const [playingState, setPlayingState] = useState<{ soundId: string | null; loop: boolean; progress: number }>({
    soundId: null,
    loop: false,
    progress: 0
  });

  // Sound Assignment Modal Toggle
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; preselectedEventId: string | null; selectedSound: string }>({
    isOpen: false,
    preselectedEventId: null,
    selectedSound: "Chime Note"
  });

  // Event Edit Inline Modal Drawer
  const [editingEvent, setEditingEvent] = useState<NotificationEvent | null>(null);

  // Save Settings Workflow Confirmation Modal
  const [showSaveConfirmation, setShowSaveConfirmation] = useState<boolean>(false);

  // File Upload State
  const [dragOverActive, setDragOverActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sound play interval emulator
  const playbackTimerRef = useRef<any>(null);

  // SYNTHESIZE SOUND ENGINE (Pure Web Audio API - zero missing files, beautiful hearable alerts on all devices!)
  const playSyntheticSound = (soundName: string, overrideVolMultiplier: number = 1) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("Web Audio API not supported by browser environment.");
        return;
      }
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Determine volume dynamically based on settings
      let baseVolume = (globalVolume / 100) * 0.3; // guard max gain to keep comfortable
      if (soundName === "Alert Chime" || soundName.includes("bell") || soundName.includes("alarm")) {
        baseVolume = (orderAlertVolume / 100) * (globalVolume / 100) * 0.4;
      } else if (soundName === "Echo Bell" || soundName.includes("Security")) {
        baseVolume = (criticalAlertVolume / 100) * (globalVolume / 100) * 0.5;
      } else if (soundName === "Digital Synth") {
        baseVolume = (supportAlertVolume / 100) * (globalVolume / 100) * 0.35;
      }
      
      gainNode.gain.setValueAtTime(baseVolume * overrideVolMultiplier, ctx.currentTime);
      const now = ctx.currentTime;

      switch (soundName) {
        case "Chime Note":
          osc.type = "sine";
          osc.frequency.setValueAtTime(523.25, now); // C5
          osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
          osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
          gainNode.gain.setValueAtTime(baseVolume, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.start(now);
          osc.stop(now + 0.5);
          break;

        case "Cyber Swoop":
          osc.type = "sine";
          osc.frequency.setValueAtTime(1400, now);
          osc.frequency.exponentialRampToValueAtTime(220, now + 0.28);
          gainNode.gain.setValueAtTime(baseVolume, now);
          gainNode.gain.linearRampToValueAtTime(0.01, now + 0.28);
          osc.start(now);
          osc.stop(now + 0.28);
          break;

        case "Bubble Pop":
          osc.type = "sine";
          osc.frequency.setValueAtTime(130, now);
          osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
          gainNode.gain.setValueAtTime(baseVolume, now);
          gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.11);
          osc.start(now);
          osc.stop(now + 0.11);
          break;

        case "Echo Bell":
          // Clear high pitch bell
          osc.type = "sine";
          osc.frequency.setValueAtTime(987.77, now); // B5
          gainNode.gain.setValueAtTime(baseVolume, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.82);
          osc.start(now);
          osc.stop(now + 0.82);
          
          // Echo effect
          setTimeout(() => {
            try {
              const ctxEcho = new AudioContextClass();
              const oscE = ctxEcho.createOscillator();
              const gainE = ctxEcho.createGain();
              oscE.connect(gainE);
              gainE.connect(ctxEcho.destination);
              oscE.frequency.setValueAtTime(987.77, ctxEcho.currentTime);
              gainE.gain.setValueAtTime(baseVolume * 0.4, ctxEcho.currentTime);
              gainE.gain.exponentialRampToValueAtTime(0.01, ctxEcho.currentTime + 0.5);
              oscE.start(ctxEcho.currentTime);
              oscE.stop(ctxEcho.currentTime + 0.5);
            } catch {}
          }, 300);
          break;

        case "Alert Chime":
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(587.33, now); // D5
          gainNode.gain.setValueAtTime(baseVolume, now);
          gainNode.gain.setValueAtTime(0.001, now + 0.09);
          // Pulse 2
          setTimeout(() => {
            try {
              const ctxP = new AudioContextClass();
              const oscP = ctxP.createOscillator();
              const gainP = ctxP.createGain();
              oscP.connect(gainP);
              gainP.connect(ctxP.destination);
              oscP.type = "sawtooth";
              oscP.frequency.setValueAtTime(587.33, ctxP.currentTime);
              gainP.gain.setValueAtTime(baseVolume * 0.8, ctxP.currentTime);
              gainP.gain.exponentialRampToValueAtTime(0.01, ctxP.currentTime + 0.12);
              oscP.start(ctxP.currentTime);
              oscP.stop(ctxP.currentTime + 0.12);
            } catch {}
          }, 120);
          osc.start(now);
          osc.stop(now + 0.1);
          break;

        case "Digital Synth":
          osc.type = "square";
          osc.frequency.setValueAtTime(261.63, now); // C4
          osc.frequency.linearRampToValueAtTime(783.99, now + 0.25); // Sweep to G5
          gainNode.gain.setValueAtTime(baseVolume, now);
          gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.26);
          osc.start(now);
          osc.stop(now + 0.26);
          break;

        default:
          // Standard pleasant notification sine ping
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, now);
          gainNode.gain.setValueAtTime(baseVolume, now);
          gainNode.gain.exponentialRampToValueAtTime(0.005, now + 0.45);
          osc.start(now);
          osc.stop(now + 0.45);
          break;
      }
    } catch (e) {
      console.error("Synthesizer context play error: ", e);
    }
  };

  // Sound library execution trigger
  const handlePlaySound = (soundName: string) => {
    // If loop is selected, simulate continuous play
    if (playingState.soundId === soundName) {
      handleStopSound();
      return;
    }

    setPlayingState({ soundId: soundName, loop: playingState.loop, progress: 0 });
    playSyntheticSound(soundName);

    let tick = 0;
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    
    playbackTimerRef.current = setInterval(() => {
      tick += 10;
      setPlayingState(prev => {
        if (tick >= 100) {
          if (prev.loop) {
            playSyntheticSound(soundName);
            return { ...prev, progress: 0 };
          } else {
            clearInterval(playbackTimerRef.current);
            return { soundId: null, loop: false, progress: 0 };
          }
        }
        return { ...prev, progress: tick / 100 };
      });
    }, 30);
  };

  const handleStopSound = () => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setPlayingState({ soundId: null, loop: false, progress: 0 });
  };

  // Simulation Trigger: Sends visual alert toast and fires synthesis chime matching event configuration
  const handleExecuteSimulation = (eventRow: NotificationEvent) => {
    if (eventRow.status === "Disabled") {
      triggerToast("Event Inactive", `Simulation ignored. ${eventRow.name} status is currently Disabled.`, "error");
      return;
    }

    // Play synthesized sound
    playSyntheticSound(eventRow.soundAssigned);

    triggerToast(`Simulation: ${eventRow.category}`, `Audio Alert: "${eventRow.soundAssigned}" fired successfully!`, "info");
  };

  // Custom File Uploader validations
  const processUploadedFile = async (file: File) => {
    const validExtensions = ["wav", "mp3"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    
    // Type validation
    if (!validExtensions.includes(fileExtension)) {
      triggerToast("Invalid Format", "Unsupported format. Please select or drag a valid .mp3 or .wav asset.", "error");
      return;
    }

    // Max limit validation (strict 5MB)
    const maxSize = 5 * 1024 * 1024; // 5 Megabytes
    if (file.size > maxSize) {
      triggerToast("File Too Large", "Maximum threshold exceeded. File size must be under 5MB.", "error");
      return;
    }

    // Calculate metadata
    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    triggerToast("Syncing S3...", "Uploading custom acoustic payload to Googly Storage", "info");
    
    const result = await uploadFile(file);
    
    if (!result.success || !result.url) {
      triggerToast("Upload Failed", result.error || "Storage cluster unreachable", "error");
      return;
    }

    // Fast HTML Audio reader to calculate real duration!
    let durationFormatted = "2.5s"; // default safe preview
    try {
      const audioMock = new Audio(result.url);
      await new Promise((resolve) => {
        audioMock.onloadedmetadata = () => {
          const secs = audioMock.duration;
          if (secs && isFinite(secs)) {
            durationFormatted = `${secs.toFixed(1)}s`;
          }
          resolve(true);
        };
        // Timeout just in case
        setTimeout(resolve, 2000);
      });
    } catch (err) {}

    // Add object entry representing loaded media reference to custom sounds state
    const customAsset: SoundAsset = {
      id: `custom-${Date.now()}`,
      name: file.name,
      format: fileExtension.toUpperCase(),
      duration: durationFormatted,
      size: sizeFormatted,
      uploadDate: new Date().toISOString().split("T")[0],
      isCustom: true,
      srcUrl: result.url
    };

    setSoundsList(prev => [...prev, customAsset]);
    triggerToast("Asset Bridged", "Custom sound successfully stored in S3 bucket.", "success");

    // Update real-time logs
    const newLog: AuditLogEntry = {
      id: `l-${Date.now()}`,
      eventName: "Custom Audio Library Update",
      soundChanged: "File Upload Added",
      previousSound: "N/A",
      newSound: file.name,
      modifiedBy: "Ruhan (SysAdmin)",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setAuditLogs(prev => [newLog, ...prev]);

    triggerToast("Audio Upload Success", `Loaded node: "${file.name}" | Format: ${customAsset.format} | Size: ${sizeFormatted}.`, "success");
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Assign Sound handler
  const handleOpenAssignModal = (eventId: string) => {
    const ev = events.find(item => item.id === eventId);
    if (!ev) return;
    setAssignModal({
      isOpen: true,
      preselectedEventId: eventId,
      selectedSound: ev.soundAssigned
    });
  };

  const handleConfirmAssignment = () => {
    if (!assignModal.preselectedEventId) return;
    
    const eventId = assignModal.preselectedEventId;
    const soundName = assignModal.selectedSound;
    const targetEvent = events.find(ev => ev.id === eventId);
    
    if (targetEvent) {
      const prevSound = targetEvent.soundAssigned;
      
      // Update events array state
      setEvents(prev => prev.map(ev => {
        if (ev.id === eventId) {
          return { ...ev, soundAssigned: soundName };
        }
        return ev;
      }));

      // Fire Synthesizer alert immediately to confirm tone
      playSyntheticSound(soundName);

      // Create new audit trail entry
      const logRow: AuditLogEntry = {
        id: `l-${Date.now()}`,
        eventName: targetEvent.name,
        soundChanged: "Audio Assignee",
        previousSound: prevSound,
        newSound: soundName,
        modifiedBy: "Ruhan (SysAdmin)",
        timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
      };

      setAuditLogs(prev => [logRow, ...prev]);
      triggerToast("Sound Assigned", `Assigned "${soundName}" alert to event: "${targetEvent.name}".`, "success");
    }

    setAssignModal({ isOpen: false, preselectedEventId: null, selectedSound: "Chime Note" });
  };

  // Delete event handler
  const handleDeleteEvent = (eventId: string, eventName: string) => {
    setEvents(prev => prev.filter(ev => ev.id !== eventId));
    triggerToast("Event Deleted", `Notification event: "${eventName}" has been archived.`, "info");
    
    const logRow: AuditLogEntry = {
      id: `l-${Date.now()}`,
      eventName: eventName,
      soundChanged: "Event archived",
      previousSound: "Active status",
      newSound: "Deleted / Inactive",
      modifiedBy: "Ruhan (SysAdmin)",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setAuditLogs(prev => [logRow, ...prev]);
  };

  // Toggle Single channel status directly on configuration grid
  const handleToggleChannel = (eventId: string, channel: "push" | "email" | "sms" | "whatsapp" | "inApp") => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const updated = { ...ev };
        if (channel === "push") updated.pushEnabled = !ev.pushEnabled;
        if (channel === "email") updated.emailEnabled = !ev.emailEnabled;
        if (channel === "sms") updated.smsEnabled = !ev.smsEnabled;
        if (channel === "whatsapp") updated.whatsappEnabled = !ev.whatsappEnabled;
        if (channel === "inApp") updated.inAppEnabled = !ev.inAppEnabled;
        return updated;
      }
      return ev;
    }));

    const target = events.find(ev => ev.id === eventId);
    if (target) {
      triggerToast("Channel Toggled", `${target.name} routing rule updated dynamically.`, "info");
    }
  };

  // Disable/Enable complete Event node status
  const handleToggleEventStatus = (eventId: string) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const nextStatus = ev.status === "Active" ? "Disabled" : "Active";
        return { ...ev, status: nextStatus };
      }
      return ev;
    }));
    
    const item = events.find(ev => ev.id === eventId);
    if (item) {
      const stateLog = item.status === "Active" ? "Disabled" : "Active";
      triggerToast(`Event ${stateLog}`, `Transits deactivated for "${item.name}" event cascade.`, "info");
    }
  };

  // Sound File management removals
  const handleDeleteSoundFile = (soundId: string, soundName: string) => {
    setSoundsList(prev => prev.filter(s => s.id !== soundId));
    triggerToast("Sound Archived", `Sound asset: "${soundName}" removed from library pool.`, "info");
  };

  // Synchronize and update Template configs
  const handleTemplateSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    setSelectedTemplateIndex(idx);
    setEditingTemplate(templates[idx]);
  };

  const handleUpdateTemplateFields = (channelKey: "push" | "email" | "sms", fieldKey: string, value: string) => {
    setEditingTemplate(prev => {
      const copy = { ...prev };
      if (channelKey === "push") {
        (copy.push as any)[fieldKey] = value;
      } else if (channelKey === "email") {
        (copy.email as any)[fieldKey] = value;
      } else if (channelKey === "sms") {
        copy.sms.content = value;
      }
      return copy;
    });
  };

  const handleSaveActiveTemplate = () => {
    const updated = templates.map((t, i) => i === selectedTemplateIndex ? editingTemplate : t);
    setTemplates(updated);
    triggerToast("Template Synced", `Custom branding and variables saved for Event: "${editingTemplate.eventName}"`, "success");
  };

  // Save Settings overall deployment draft
  const handleSaveAllSystemSettings = () => {
    setShowSaveConfirmation(true);
  };

  const handleDeployDraftChanges = (status: "draft" | "apply") => {
    setShowSaveConfirmation(false);
    if (status === "apply") {
      triggerToast("Deployment Successful", "All sound alert cascades, global noise levels, and channel switches are live across microservices.", "success");
    } else {
      triggerToast("Draft Saved", "Your workspace configuration states are safely indexed as raw draft JSON.", "info");
    }
  };

  // Export Settings overall to JSON file in browser download
  const handleExportJSONConfig = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      systemName: "Restaurant Delivery Notification Engine",
      volumes: { globalVolume, orderAlertVolume, criticalAlertVolume, supportAlertVolume },
      playbackRules: { playbackRule, prioritySetting },
      sounds: soundsList,
      events: events.map(e => ({ id: e.id, name: e.name, sound: e.soundAssigned, channels: { push: e.pushEnabled, email: e.emailEnabled, sms: e.smsEnabled, whatsapp: e.whatsappEnabled, inApp: e.inAppEnabled }, status: e.status }))
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `delivery_notifications_config_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    triggerToast("Export Succeeded", "Notifications configuration file exported as structured JSON scheme.", "success");
  };

  // Recover default structures
  const handleRestoreDefaultsCascade = () => {
    setGlobalVolume(75);
    setOrderAlertVolume(85);
    setCriticalAlertVolume(100);
    setSupportAlertVolume(60);
    setPlaybackRule("once");
    setPrioritySetting("high");
    triggerToast("Restored Defaults", "System sound thresholds and priorities reset to default parameters", "info");
  };

  // Filter computations
  const filteredEventsList = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "All" || e.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="notifications-sounds-dashboard" className={`rounded-2xl border transition-all duration-300 ${isDarkMode ? "bg-slate-900 text-slate-100 border-slate-800" : "bg-white text-slate-800 border-slate-100 shadow-xl"}`}>
      
      {/* 1. TOP HEADER BRAND HERO */}
      <div className={`p-6 border-b flex flex-wrap justify-between items-center gap-4 ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-[#FBFBFC]"}`}>
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#E23744]/10 rounded-xl">
              <Bell className="w-6 h-6 text-[#E23744]" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                Notifications & Alerts Hub
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">v2.4 Live</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Configure system chimes, assign custom alert wave files, manage templates, and execute sound checks.</p>
            </div>
          </div>
        </div>

        {/* Toolbar Controller Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Theme switcher */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${isDarkMode ? "bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-800" : "bg-white text-slate-600 border-gray-200 hover:bg-gray-50 shadow-sm"}`}
            title="Toggle theme view"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button 
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className="px-3.5 py-1.5 bg-[#E23744]/10 hover:bg-[#E23744]/25 text-[#E23744] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-4.5 h-4.5" />
            Upload Wave
          </button>

          <button 
            onClick={handleRestoreDefaultsCascade}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            Restore Defaults
          </button>

          <button 
            onClick={handleExportJSONConfig}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-1 cursor-pointer ${isDarkMode ? "bg-slate-900 border-slate-800 text-emerald-400 hover:bg-slate-800" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`}
          >
            <Download className="w-4 h-4" /> Export Configuration
          </button>

          <button 
            onClick={handleSaveAllSystemSettings}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1 transition-all cursor-pointer animate-pulse"
          >
            <Check className="w-4.5 h-4.5" /> Save Changes
          </button>
        </div>
      </div>

      {/* 2. OVERALL ANALYTICS METRICS BAR */}
      <div className={`p-5 grid grid-cols-2 md:grid-cols-6 gap-4 border-b ${isDarkMode ? "border-slate-800 bg-slate-900/20" : "border-slate-100 bg-[#FAFAFC]/50"}`}>
        <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase uppercase">Total Events</span>
          <p className="text-xl font-black mt-0.5 text-[#E23744]">{events.length}</p>
          <span className="text-[9px] text-gray-400 font-bold">5 Root Categories</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase uppercase">Custom Sounds</span>
          <p className="text-xl font-black mt-0.5 text-violet-500">{soundsList.filter(s => s.isCustom).length} Audio Files</p>
          <span className="text-[9px] text-gray-400 font-bold">WAV / MP3 registered</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase uppercase">Default Synth Alerts</span>
          <p className="text-xl font-black mt-0.5 text-blue-500">{soundsList.filter(s => !s.isCustom).length} Chimes</p>
          <span className="text-[9px] text-gray-400 font-bold">Web Audio API synth active</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase uppercase">Push Templates</span>
          <p className="text-xl font-black mt-0.5 text-amber-500">{templates.length} Active</p>
          <span className="text-[9px] text-gray-400 font-bold">Dynamic custom headers</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase uppercase">Email Channels</span>
          <p className="text-xl font-black mt-0.5 text-indigo-500">{events.filter(e => e.emailEnabled).length} Enabled</p>
          <span className="text-[9px] text-gray-400 font-bold">HTML templates validated</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
          <span className="text-[10px] text-gray-400 font-extrabold uppercase uppercase">SMS Templates</span>
          <p className="text-xl font-black mt-0.5 text-sky-500">{events.filter(e => e.smsEnabled).length} Standard</p>
          <span className="text-[9px] text-gray-400 font-bold">With character counter</span>
        </div>
      </div>

      {/* Hidden file selector */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept=".mp3,.wav" 
        className="hidden" 
      />

      {/* 4. MAIN THREE-COLUMN DISCORD & SLACK-INSPIRED WORKSPACE */}
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        
        {/* SIDE BAR BUTTON DIRECTORY - Left Pane */}
        <div className={`w-full lg:w-60 p-4 shrink-0 flex flex-row lg:flex-col gap-1 border-r overflow-x-auto lg:overflow-x-visible ${isDarkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-100 bg-[#FBFBFC]/40"}`}>
          <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider hidden lg:block mb-2 px-2.5">Settings Section</span>
          
          <button
            onClick={() => setActiveMenuSection("overview")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeMenuSection === "overview" 
                ? "bg-[#E23744]/10 text-[#E23744]" 
                : `${isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-gray-50"}`
            }`}
          >
            <Layout className="w-4 h-4" />
            Control Center
          </button>

          <button
            onClick={() => setActiveMenuSection("events")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeMenuSection === "events" 
                ? "bg-[#E23744]/10 text-[#E23744]" 
                : `${isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-gray-50"}`
            }`}
          >
            <Bell className="w-4 h-4" />
            Event Cascade Grid
          </button>

          <button
            onClick={() => setActiveMenuSection("sounds")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeMenuSection === "sounds" 
                ? "bg-[#E23744]/10 text-[#E23744]" 
                : `${isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-gray-50"}`
            }`}
          >
            <Volume2 className="w-4 h-4" />
            Audio Library Store
          </button>

          <button
            onClick={() => setActiveMenuSection("volume")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeMenuSection === "volume" 
                ? "bg-[#E23744]/10 text-[#E23744]" 
                : `${isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-gray-50"}`
            }`}
          >
            <Sliders className="w-4 h-4" />
            Advanced Audio Rules
          </button>

          <button
            onClick={() => setActiveMenuSection("templates")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeMenuSection === "templates" 
                ? "bg-[#E23744]/10 text-[#E23744]" 
                : `${isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-gray-50"}`
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Branded Templates
          </button>

          <button
            onClick={() => setActiveMenuSection("logs")}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
              activeMenuSection === "logs" 
                ? "bg-[#E23744]/10 text-[#E23744]" 
                : `${isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-gray-50"}`
            }`}
          >
            <History className="w-4 h-4" />
            Security Audit Trail
          </button>

          <div className="hidden lg:block border-t my-4 border-slate-100/15 pt-4">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase uppercase px-2.5">Acoustic Status</span>
            <div className={`mt-2.5 p-3 rounded-xl block text-[11px] font-semibold ${isDarkMode ? "bg-slate-900/60" : "bg-gray-50"}`}>
              <div className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Web-Audio engine online</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed font-semibold">Decibels, volume limit thresholds, and direct arpeggio synthesizer validated successfully.</p>
            </div>
          </div>
        </div>

        {/* SECTION WORKSPACE FRAME - Right Pane */}
        <div className="flex-1 p-6 overflow-x-hidden">
          
          {/* SECTION A: DESKTOP CONTROL CENTER OVERVIEW */}
          {activeMenuSection === "overview" && (
            <div className="space-y-6 animate-fade-in text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Simulated Device Controller Block */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900/65 border-slate-800" : "bg-[#FAFBFD] border-gray-200 shadow-sm"}`}>
                  <h3 className="text-sm font-black flex items-center gap-2 text-[#E23744]">
                    <Zap className="w-5 h-5" /> Sound & Vibration Testing Sandbox
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Trigger simulated orders, warnings, support complaints instantly. This will fire live audio beeps over your device speakers and display high-fidelity phone notification templates.</p>
                  
                  <div className="mt-5 space-y-2 max-h-64 overflow-y-auto pr-1">
                    {events.slice(0, 6).map(item => (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-xl border flex justify-between items-center transition-all ${isDarkMode ? "bg-slate-900 border-slate-900 hover:bg-slate-900" : "bg-white border-slate-100 hover:bg-slate-50/50"}`}
                      >
                        <div>
                          <p className="font-bold text-slate-500 text-[11px] tracking-wide">{item.category} Event</p>
                          <h4 className="font-black text-xs mt-0.5">{item.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full">{item.soundAssigned}</span>
                          <button
                            onClick={() => handleExecuteSimulation(item)}
                            className="p-1 px-3 bg-[#E23744] hover:bg-red-700 text-white rounded-lg text-[10px] font-black tracking-wide cursor-pointer transition-colors"
                          >
                            Execute
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Uploader Drag & Drop Container */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all min-h-[240px] ${
                    dragOverActive 
                      ? "border-[#E23744] bg-[#E23744]/10" 
                      : `${isDarkMode ? "border-slate-800 bg-slate-900/20 hover:border-slate-800" : "border-gray-200 bg-white hover:border-[#E23744]/40"}`
                  }`}
                >
                  <FileUp className={`w-12 h-12 mb-4 ${dragOverActive ? "text-[#E23744] animate-bounce" : "text-gray-400"}`} />
                  <h3 className="text-sm font-black text-slate-500">Drag & Drop Premium Tones Here</h3>
                  <p className="text-[11px] text-gray-400 max-w-xs mt-2 leading-relaxed font-semibold">Drag and drop your custom .wav or .mp3 assets, or click to search local systems. Absolute maximum limit is capped at 5MB.</p>
                  
                  <button 
                    onClick={() => {
                      if (fileInputRef.current) fileInputRef.current.click();
                    }}
                    className="mt-5 px-5 py-2 bg-[#E23744] hover:bg-red-700 text-white text-[11px] font-black tracking-wide rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Browse Sounds
                  </button>
                </div>

              </div>

              {/* Advanced Controls Overview */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-gray-200"}`}>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-wider">Sound Assignment Rule Cascade</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Want to quickly assign a sound alert directly to a category of delivery events?</p>
                  </div>
                  <button 
                    onClick={() => setAssignModal({ isOpen: true, preselectedEventId: "e-1", selectedSound: "Chime Note" })}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-bold font-semibold transition-colors cursor-pointer"
                  >
                    Quick-Assign Wizard
                  </button>
                </div>
              </div>

              {/* Quick instructions block */}
              <div className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${isDarkMode ? "bg-slate-90% border-slate-800 text-slate-400" : "bg-blue-50/50 border-blue-100 text-slate-600"}`}>
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-blue-800 text-[12px]">System Compliance Guidelines</h4>
                  <p className="mt-1 font-semibold text-gray-400">All alerts configure push, SMS, email, in-app and WhatsApp channels synchronously. Custom files upload instantaneously to the Local State Container. If you exit the platform or reload, config sets may reset. Use **"Export Configuration"** file triggers to save backups of acoustic weights.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: DENSE EVENT CONFIGURATION TABLE AND SEARCH */}
          {activeMenuSection === "events" && (
            <div className="space-y-4 animate-fade-in text-xs font-semibold">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                
                {/* Searches */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input 
                    type="text" 
                    placeholder="Search events (e.g., rider, refund cancellations...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9.5 pr-4 py-2 rounded-xl text-xs font-bold border ${isDarkMode ? "bg-slate-900/60 border-slate-800 text-white focus:ring-1 focus:ring-[#E23744]" : "bg-white border-gray-200 focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"}`}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-200">Clear</button>
                  )}
                </div>

                {/* Filter dropdown */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-gray-400 text-[11px] font-bold">Category:</span>
                  {["All", "System", "Restaurant", "Rider", "Support", "Alerts"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                        selectedCategoryFilter === cat 
                          ? "bg-[#E23744] text-white border-[#E23744]" 
                          : `${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

              </div>

              {/* The Events Table Grid */}
              <div className={`rounded-xl border overflow-x-auto ${isDarkMode ? "border-slate-800 bg-slate-900/20" : "border-gray-200 bg-white shadow-sm"}`}>
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className={`border-b text-[10px] font-extrabold uppercase tracking-widest ${isDarkMode ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-100 bg-gray-50 text-gray-500"}`}>
                      <th className="p-3 pl-4">Notification Event Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-[#E23744]">Sound Assigned</th>
                      <th className="p-3 text-center">Push</th>
                      <th className="p-3 text-center">Email</th>
                      <th className="p-3 text-center">SMS</th>
                      <th className="p-3 text-center">WhatsApp</th>
                      <th className="p-3 text-center">In-App</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/10">
                    {filteredEventsList.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-12 text-center text-gray-400">
                          <AlertOctagon className="w-8 h-8 mx-auto mb-2 text-[#E23744] opacity-50" />
                          No events located matching your current keyword query bounds.
                        </td>
                      </tr>
                    ) : (
                      filteredEventsList.map(ev => {
                        const catColors: Record<string, string> = {
                          System: "border-blue-500/10 bg-blue-500/10 text-blue-500",
                          Restaurant: "border-yellow-500/10 bg-yellow-500/10 text-yellow-500",
                          Rider: "border-[#E23744]/10 bg-[#E23744]/10 text-[#E23744]",
                          Support: "border-purple-500/10 bg-purple-500/10 text-purple-500",
                          Alerts: "border-red-500/10 bg-red-400/10 text-red-400"
                        };

                        return (
                          <tr 
                            key={ev.id} 
                            className={`group transition-colors text-xs ${
                              ev.status === "Disabled" 
                                ? "opacity-55" 
                                : `${isDarkMode ? "hover:bg-slate-900/40" : "hover:bg-slate-50/50"}`
                            }`}
                          >
                            <td className="p-3 pl-4">
                              <div className="flex flex-col max-w-sm">
                                <span className="font-extrabold text-xs">{ev.name}</span>
                                <span className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 group-hover:line-clamp-none font-semibold leading-relaxed">{ev.description}</span>
                              </div>
                            </td>
                            <td className="p-3 font-bold">
                              <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full border ${catColors[ev.category] || "border-gray-500/10 bg-gray-500/10 text-gray-500"}`}>
                                {ev.category}
                              </span>
                            </td>
                            <td className="p-3 font-black">
                              <div className="flex items-center gap-1">
                                <span className={`font-mono text-[11px] font-black ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                                  {ev.soundAssigned}
                                </span>
                                <button 
                                  onClick={() => playSyntheticSound(ev.soundAssigned)}
                                  className={`p-1 rounded-md opacity-20 group-hover:opacity-100 hover:bg-slate-500/10 cursor-pointer ${isDarkMode ? "text-yellow-400" : "text-[#E23744]"}`}
                                  title="Test sound pitch"
                                >
                                  <Play className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            
                            {/* Toggle Indicators for Channels */}
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={ev.pushEnabled} 
                                onChange={() => handleToggleChannel(ev.id, "push")}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-[#E23744] focus:ring-[#E23744] cursor-pointer" 
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={ev.emailEnabled} 
                                onChange={() => handleToggleChannel(ev.id, "email")}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-sky-700 focus:ring-sky-700 cursor-pointer" 
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={ev.smsEnabled} 
                                onChange={() => handleToggleChannel(ev.id, "sms")}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500 cursor-pointer" 
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={ev.whatsappEnabled} 
                                onChange={() => handleToggleChannel(ev.id, "whatsapp")}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500 focus:ring-[#E23744] cursor-pointer" 
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox" 
                                checked={ev.inAppEnabled} 
                                onChange={() => handleToggleChannel(ev.id, "inApp")}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-amber-500 focus:ring-amber-500 cursor-pointer" 
                              />
                            </td>

                            {/* Status slider */}
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleToggleEventStatus(ev.id)}
                                className={`px-2 py-0.5 text-[9px] font-black tracking-wide rounded ${
                                  ev.status === "Active" 
                                    ? "bg-emerald-500/15 text-emerald-500" 
                                    : "bg-gray-500/15 text-gray-400"
                                }`}
                              >
                                {ev.status}
                              </button>
                            </td>

                            {/* Dense context actions */}
                            <td className="p-3 pr-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleExecuteSimulation(ev)}
                                  className="p-1 px-2.5 bg-[#E23744]/10 hover:bg-[#E23744]/25 text-[#E23744] rounded text-[10px] font-bold cursor-pointer transition-all"
                                  title="Fire test cascade"
                                >
                                  Test Alert
                                </button>
                                <button
                                  onClick={() => handleOpenAssignModal(ev.id)}
                                  className={`p-1 px-2.5 font-bold rounded text-[10px] transition-all cursor-pointer ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                >
                                  Assign
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(ev.id, ev.name)}
                                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded cursor-pointer"
                                  title="Archive event"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION C: CUSTOM AUDIO LIBRARY */}
          {activeMenuSection === "sounds" && (
            <div className="space-y-6 animate-fade-in text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Upload Section Card */}
                <div className={`md:col-span-1 p-5 rounded-2xl border flex flex-col justify-between ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
                  <div>
                    <h3 className="text-sm font-black text-slate-500 flex items-center gap-1.5"><Sliders className="w-4.5 h-4.5 text-[#E23744]" /> File Upload Constraints</h3>
                    <p className="text-[11px] text-gray-400 mt-2 leading-relaxed font-semibold">Verify files adhere to exact standards before uploading to the platform cache directory:</p>
                    
                    <ul className="mt-4 space-y-2 text-gray-400 text-[11px] font-semibold">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Maximum File Threshold: 5.0 Megabytes</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Supported Extensions: wav, mp3</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Bitrate threshold: 128 kbps minimum</li>
                    </ul>
                  </div>

                  <div className="mt-8">
                    <button 
                      onClick={() => {
                        if (fileInputRef.current) fileInputRef.current.click();
                      }}
                      className="w-full py-3 bg-[#E23744] hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex justify-center items-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Selected Local Audio
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-2 font-mono">Chrome & Safari codec sandbox verified</p>
                  </div>
                </div>

                {/* Library Records Lists */}
                <div className={`md:col-span-2 p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-gray-200"}`}>
                  <h3 className="text-sm font-black mb-4">Acoustic Audio Assets List</h3>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {soundsList.map(s => {
                      const isPlayingThis = playingState.soundId === s.name;
                      return (
                        <div 
                          key={s.id} 
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3 transition-colors ${
                            isPlayingThis 
                              ? "bg-amber-500/10 border-amber-500/40" 
                              : `${isDarkMode ? "bg-slate-900/60 border-slate-900 hover:bg-slate-900" : "bg-[#FCFCFD] border-slate-100 hover:bg-slate-50"}`
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              {s.isCustom ? (
                                <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase bg-indigo-500/15 text-indigo-400 rounded-full">Custom WAV</span>
                              ) : (
                                <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase bg-amber-500/15 text-amber-500 rounded-full">Web Audio Synth</span>
                              )}
                              <h4 className="font-black text-xs">{s.name}</h4>
                            </div>
                            <div className="flex items-center gap-4 text-gray-400 mt-1.5 text-[10px] font-mono">
                              <span>Format: {s.format}</span>
                              <span>Duration: {s.duration}</span>
                              <span>Ratio Size: {s.size}</span>
                              <span className="hidden sm:inline">Uploaded: {s.uploadDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              onClick={() => handlePlaySound(s.name)}
                              className={`p-2 rounded-lg transition-all cursor-pointer ${
                                isPlayingThis 
                                  ? "bg-amber-500 text-white hover:bg-amber-600" 
                                  : "bg-[#E23744]/15 text-[#E23744] hover:bg-[#E23744]/30"
                              }`}
                              title={isPlayingThis ? "Stop play" : "Play alert"}
                            >
                              {isPlayingThis ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => {
                                const payload = { exportItem: s };
                                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload));
                                const a = document.createElement("a");
                                a.setAttribute("href", dataStr);
                                a.setAttribute("download", `${s.name}.json`);
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                              }}
                              className={`p-2 rounded-lg transition-all border cursor-pointer ${isDarkMode ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                              title="Download metadata"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {s.isCustom && (
                              <button
                                onClick={() => handleDeleteSoundFile(s.id, s.name)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/25 text-red-500 rounded-lg transition-all cursor-pointer"
                                title="Remove file node"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SECTION D: ADVANCED SOUNDS volume AND priority SETTINGS */}
          {activeMenuSection === "volume" && (
            <div className="space-y-6 animate-fade-in text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Audiometric Decibels Controllers */}
                <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
                  <h3 className="text-sm font-black mb-1 flex items-center gap-1"><Sliders className="w-4.5 h-4.5 text-[#E23744]" /> Decibels Volume Levels</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">Sliders assign specific maximum decibel levels allowed to play per category. Critical node alerts will auto-override other signals.</p>
                  
                  <div className="mt-8 space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black">Global Notification Volume</span>
                        <span className="font-mono text-[#E23744] font-black">{globalVolume}% DB</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={globalVolume}
                        onChange={(e) => setGlobalVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E23744]"
                      />
                    </div>

                    <div className="border-t border-slate-100/10 pt-5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-blue-500">Order Alerts Volume</span>
                        <span className="font-mono font-black">{orderAlertVolume}% DB</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={orderAlertVolume}
                        onChange={(e) => setOrderAlertVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E23744]"
                      />
                    </div>

                    <div className="border-t border-slate-100/10 pt-5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-rose-500">Critical Warnings & System Failures Volume</span>
                        <span className="font-mono font-black">{criticalAlertVolume}% DB</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={criticalAlertVolume}
                        onChange={(e) => setCriticalAlertVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E23744]"
                      />
                    </div>

                    <div className="border-t border-slate-100/10 pt-5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-violet-500">Support tickets Volume</span>
                        <span className="font-mono font-black">{supportAlertVolume}% DB</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={supportAlertVolume}
                        onChange={(e) => setSupportAlertVolume(Number(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E23744]"
                      />
                    </div>
                  </div>
                </div>

                {/* Priority Rule Management */}
                <div className={`p-6 rounded-2xl border space-y-6 ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
                  <div>
                    <h3 className="text-sm font-black mb-1">Acoustic Playback Rules</h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-semibold font-semibold">Determine how the speaker handles repeat alarms until dispatch coordinates resolve.</p>
                    
                    <div className="mt-4 space-y-3">
                      {[
                        { key: "once", title: "Play alert once", desc: "Chime triggers standard 1-time pulse signal upon received event." },
                        { key: "thrice", title: "Repeat alert exactly 3 times", desc: "Pulse loops 3 times with a 120ms interval sequence spacing." },
                        { key: "continuous", title: "Continuous Loop until Acknowledged", desc: "Drones continuous synth alarms. Intended for urgent dispatch failures." },
                      ].map(item => (
                        <label 
                          key={item.key}
                          className={`p-3 rounded-xl border flex gap-3 cursor-pointer transition-colors ${
                            playbackRule === item.key 
                              ? "bg-[#E23744]/10 border-[#E23744]/40" 
                              : "border-slate-100/10 hover:bg-slate-500/5"
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="playbackRuleRadio"
                            checked={playbackRule === item.key} 
                            onChange={() => setPlaybackRule(item.key as any)}
                            className="mt-0.5 cursor-pointer accent-[#E23744]" 
                          />
                          <div>
                            <p className="font-extrabold text-[#E23744]">{item.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold leading-relaxed">{item.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100/10 pt-5">
                    <h3 className="text-sm font-black mb-1">Signal Severity Level</h3>
                    <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">Assign prioritized threshold parameters. Critical levels override system silences.</p>
                    
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {[
                        { key: "low", title: "Low", color: "text-slate-500 bg-slate-500/10 border-slate-300" },
                        { key: "medium", title: "Medium", color: "text-blue-500 bg-blue-500/10 border-blue-300" },
                        { key: "high", title: "High", color: "text-amber-500 bg-amber-500/10 border-amber-300" },
                        { key: "critical", title: "Critical", color: "text-red-500 bg-red-500/10 border-red-300 animate-pulse" },
                      ].map(priority => (
                        <button
                          key={priority.key}
                          onClick={() => setPrioritySetting(priority.key as any)}
                          className={`p-2.5 rounded-lg border text-center text-[10px] font-extrabold transition-all cursor-pointer ${
                            prioritySetting === priority.key 
                              ? "ring-2 ring-[#E23744] border-[#E23744] scale-[1.02]" 
                              : `${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`
                          }`}
                        >
                          <span className={`${priority.color} p-1 px-2 rounded-md block`}>{priority.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SECTION E: CUSTOMIZED NOTIFICATION TEMPLATES */}
          {activeMenuSection === "templates" && (
            <div className="space-y-6 animate-fade-in text-xs font-semibold">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left template index checklist */}
                <div className={`p-4 rounded-2xl border ${isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
                  <h3 className="text-sm font-black mb-3">Notification Event templates</h3>
                  <p className="text-[11px] text-gray-400 mb-4 leading-relaxed font-semibold">Select an event below to configure custom branded dynamic message structures.</p>
                  
                  <div className="space-y-2">
                    {templates.map((t, idx) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTemplateIndex(idx);
                          setEditingTemplate(t);
                        }}
                        className={`w-full text-left p-3 rounded-xl border flex justify-between items-center transition-all cursor-pointer ${
                          selectedTemplateIndex === idx 
                            ? "bg-[#E23744]/10 border-[#E23744]/45 text-[#E23744]" 
                            : "border-slate-100/10 hover:bg-slate-500/5"
                        }`}
                      >
                        <div>
                          <h4 className="font-extrabold text-xs">{t.eventName}</h4>
                          <span className="text-[10px] text-gray-400 mt-1 font-mono">ID ref: {t.id}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main customizable canvas form */}
                <div className={`md:col-span-2 p-6 rounded-2xl border space-y-6 ${isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-gray-200"}`}>
                  <div className="flex justify-between items-center border-b border-slate-100/10 pb-4">
                    <div>
                      <h3 className="text-sm font-black">Template Branding overrides</h3>
                      <p className="text-[11px] text-[#E23744] font-black uppercase tracking-wider mt-0.5">{editingTemplate.eventName}</p>
                    </div>
                    <button 
                      onClick={handleSaveActiveTemplate}
                      className="px-4 py-2 bg-[#E23744] hover:bg-red-700 text-white text-[11px] font-black tracking-wide rounded-xl shadow-lg transition-colors cursor-pointer"
                    >
                      Sync and Save Template
                    </button>
                  </div>

                  {/* Section tabs for channel types */}
                  <div className="space-y-4">
                    
                    {/* Push Template Block */}
                    <div className="space-y-3">
                      <span className="text-[10px] text-amber-500 font-extrabold uppercase uppercase flex items-center gap-1"><Smartphone className="w-4 h-4" /> Push Channel Override</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Push Notification Title Header *</label>
                          <input 
                            type="text" 
                            value={editingTemplate.push.title}
                            onChange={(e) => handleUpdateTemplateFields("push", "title", e.target.value)}
                            className={`w-full border p-2.5 rounded-lg text-xs font-semibold ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-300"}`}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">In-App Target Action CTA *</label>
                          <input 
                            type="text" 
                            value={editingTemplate.push.actionText}
                            onChange={(e) => handleUpdateTemplateFields("push", "actionText", e.target.value)}
                            className={`w-full border p-2.5 rounded-lg text-xs font-semibold ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-300"}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1 font-bold">Push Body Alert draft (Max 160 Characters) *</label>
                        <textarea 
                          value={editingTemplate.push.message}
                          maxLength={160}
                          onChange={(e) => handleUpdateTemplateFields("push", "message", e.target.value)}
                          className={`w-full border p-2.5 rounded-lg text-xs font-semibold h-18 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-300"}`}
                        />
                        <span className="text-[10px] text-gray-400 font-mono flex justify-end mt-1">{editingTemplate.push.message.length}/160 character limit</span>
                      </div>
                    </div>

                    {/* Email Template Block */}
                    <div className="border-t border-slate-100/10 pt-5 space-y-3">
                      <span className="text-[10px] text-blue-500 font-extrabold uppercase uppercase flex items-center gap-1"><Mail className="w-4 h-4" /> Branded Email Configuration</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">HTML Subject Line template *</label>
                          <input 
                            type="text" 
                            value={editingTemplate.email.subject}
                            onChange={(e) => handleUpdateTemplateFields("email", "subject", e.target.value)}
                            className={`w-full border p-2.5 rounded-lg text-xs font-semibold ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-300"}`}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-400 mb-1 font-bold">Company Footer Branding sign *</label>
                          <input 
                            type="text" 
                            value={editingTemplate.email.branding}
                            onChange={(e) => handleUpdateTemplateFields("email", "branding", e.target.value)}
                            className={`w-full border p-2.5 rounded-lg text-xs font-semibold ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-300"}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-1 font-bold">HTML Core Email Layout Markup content *</label>
                        <textarea 
                          value={editingTemplate.email.content}
                          onChange={(e) => handleUpdateTemplateFields("email", "content", e.target.value)}
                          className={`w-full border p-2.5 rounded-lg text-xs font-semibold h-24 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-300 font-mono"}`}
                        />
                      </div>
                    </div>

                    {/* SMS Template Block */}
                    <div className="border-t border-slate-100/15 pt-5 space-y-3">
                      <span className="text-[10px] text-indigo-500 font-extrabold uppercase uppercase">SMS Content & Metrics</span>
                      <div>
                        <label className="block text-gray-400 mb-1 font-bold">SMS Core Alert body (Real-time Character limit validated) *</label>
                        <textarea 
                          value={editingTemplate.sms.content}
                          maxLength={120}
                          onChange={(e) => handleUpdateTemplateFields("sms", "content", e.target.value)}
                          className={`w-full border p-2.5 rounded-lg text-xs font-semibold h-20 ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-300"}`}
                        />
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono mt-1">
                          <span>Estimates: {Math.ceil(editingTemplate.sms.content.length / 60)} SMS units required</span>
                          <span>{editingTemplate.sms.content.length}/120 maximum</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* SECTION F: SECURITY TRANSACTION LOGS - Audit Logs */}
          {activeMenuSection === "logs" && (
            <div className="space-y-4 animate-fade-in text-xs font-semibold">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black">Security Audit Trail</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Below contains real-time changes logged during current operator session.</p>
                </div>
                <button
                  onClick={() => {
                    const headings = ["Log ID,Event Cascade,Action Column,Previous Sound,New Target,Operator,Time Stamp\n"];
                    const rows = auditLogs.map(l => `${l.id},${l.eventName},${l.soundChanged},${l.previousSound},${l.newSound},${l.modifiedBy},${l.timestamp}`);
                    const content = headings.concat(rows).join("\n");
                    const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(content);
                    const link = document.createElement("a");
                    link.setAttribute("href", dataUri);
                    link.setAttribute("download", "notifications_security_logs.csv");
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    triggerToast("Audit exported", "Security logs downloaded successfully.", "success");
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1 transition-all cursor-pointer ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 bg-[#FCFCFD]"}`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#E23744]" /> Export CSV Logs
                </button>
              </div>

              {/* Logger Table View */}
              <div className={`rounded-xl border overflow-hidden ${isDarkMode ? "border-slate-900 bg-slate-900" : "border-slate-200 bg-white"}`}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[10px] font-extrabold uppercase tracking-widest ${isDarkMode ? "border-slate-800 bg-slate-900 text-slate-400" : "border-slate-100 bg-gray-50 text-gray-500"}`}>
                      <th className="p-3 pl-4">Log Event Name</th>
                      <th className="p-3">Action Column</th>
                      <th className="p-3">Previous Element</th>
                      <th className="p-3">New Element Weight</th>
                      <th className="p-3">Modified Operator</th>
                      <th className="p-3 pr-4 text-right">Time Stamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-105/5">
                    {auditLogs.map(log => (
                      <tr key={log.id} className={`hover:bg-slate-500/5 transition-colors text-xs font-mono`}>
                        <td className="p-3 pl-4 font-black text-[#E23744]">{log.eventName}</td>
                        <td className="p-3 font-semibold">{log.soundChanged}</td>
                        <td className="p-3 text-slate-400">{log.previousSound}</td>
                        <td className="p-3 text-[#E23744] font-bold">{log.newSound}</td>
                        <td className="p-3 text-slate-400 font-sans">{log.modifiedBy}</td>
                        <td className="p-3 pr-4 text-right text-gray-400 font-semibold">{log.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CAMPAIGN BROADCAST CHRONOLOGY & LIVE COMPOSER */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 border-t border-slate-100/10 mt-6 select-none font-sans">
                {/* Left side: Compose on the spot panel */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!composerTitle || !composerMessage) {
                      triggerToast("Form Incomplete", "Please specify a notification title and message body.", "error");
                      return;
                    }

                    const newCampaign = {
                      id: `camp-${Date.now()}`,
                      title: composerTitle,
                      message: composerMessage,
                      segment: composerTarget,
                      recipients: composerTarget === "All Riders" ? 42 : composerTarget === "Partner Restaurants" ? 18 : 154,
                      timestamp: new Date().toLocaleString()
                    };

                    setCampaigns(prev => [newCampaign, ...prev]);
                    triggerToast("Broadcast Dispatched", `Notification campaign "${composerTitle}" transmitted globally.`, "success");
                    setComposerTitle("");
                    setComposerMessage("");
                  }}
                  className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col space-y-4 ${isDarkMode ? "bg-slate-905 border-slate-800 text-slate-100" : "bg-white border-slate-205 text-slate-800 shadow-xs"}`}
                >
                  <div className="flex items-center gap-2 border-b pb-2 border-slate-100/10">
                    <Smartphone className="w-5 h-5 text-[#E23744]" />
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider">Fast Campaign Broadcaster</h4>
                      <p className="text-[10px] text-gray-400">Transmit micro-alerts instantly to consumer app devices.</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Target Audience Cohort</label>
                    <select
                      value={composerTarget}
                      onChange={(e) => setComposerTarget(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                    >
                      <option value="All Users">All Customers & Residents (154)</option>
                      <option value="All Riders">Active Dispatch Riders (42)</option>
                      <option value="Partner Restaurants">Partner Restaurants (18)</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Notification Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flash Sales Enabled!"
                      value={composerTitle}
                      onChange={(e) => setComposerTitle(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200 placeholder-gray-600" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Message Body</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Extra 20% discount on entire menu catalogs in Udaipur city boundaries."
                      value={composerMessage}
                      onChange={(e) => setComposerMessage(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none resize-none ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-200 placeholder-gray-600" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl text-xs font-extrabold tracking-wide uppercase hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" /> Transmit Signal
                  </button>
                </form>

                {/* Right side: Dispatched History logs */}
                <div className={`lg:col-span-7 p-5 rounded-2xl border flex flex-col space-y-4 ${isDarkMode ? "bg-slate-905 border-slate-800 text-slate-100" : "bg-white border-slate-205 text-slate-800 shadow-xs"}`}>
                  <div className="flex justify-between items-center border-b pb-2 border-slate-100/10">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-gray-400" />
                      <div className="text-left">
                        <h4 className="text-xs font-black uppercase tracking-wider">Dispatched Push History ({campaigns.length})</h4>
                        <p className="text-[10px] text-gray-400">Global signal logs dispatched via CRM dashboards.</p>
                      </div>
                    </div>
                    {campaigns.length > 0 && (
                      <button
                        onClick={() => {
                          setCampaigns([]);
                          triggerToast("All Logs Cleared", "Cleared all dispatched broadcast campaigns.", "success");
                        }}
                        className="text-[10px] font-extrabold tracking-wider uppercase text-red-500 hover:underline cursor-pointer"
                      >
                        Purge All
                      </button>
                    )}
                  </div>

                  {campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                      <Bell className="w-8 h-8 text-gray-500/30 animate-pulse" />
                      <p className="text-xs text-gray-400">No active custom broadcast entries currently exist.</p>
                      <p className="text-[10px] text-gray-500">Transmitted signals will append in dynamic sequence here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                      {campaigns.map((camp) => (
                        <div
                          key={camp.id}
                          className={`p-3 rounded-xl border flex justify-between items-start text-left text-xs transition-all ${isDarkMode ? "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700" : "bg-gray-50/50 border-gray-150 text-slate-700 hover:border-gray-300"}`}
                        >
                          <div className="space-y-1 max-w-[85%]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-[#E23744] text-xs">{camp.title}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-gray-200 text-slate-700"}`}>
                                {camp.segment}
                              </span>
                              <span className="text-[9px] text-gray-400 font-mono">({camp.recipients} Rec.)</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-normal">{camp.message}</p>
                            <div className="text-[9px] text-gray-500 font-mono italic">Dispatched: {camp.timestamp}</div>
                          </div>
                          <button
                            onClick={() => {
                              setCampaigns(prev => prev.filter(c => c.id !== camp.id));
                              triggerToast("Alert Log Purged", `Permanently deleted campaign: "${camp.title}"`, "info");
                            }}
                            className={`p-1.5 rounded-lg hover:bg-slate-500/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer`}
                            title="Delete campaign"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 5. MODAL ASSIGN SOUND WORKFLOW WIZARD */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl overflow-hidden p-6 shadow-2xl relative space-y-4 ${isDarkMode ? "bg-slate-900 border border-slate-900 text-slate-200" : "bg-white border border-gray-100 text-slate-800"}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-100/10">
              <h3 className="text-sm font-black flex items-center gap-1.5 text-[#E23744]"><Sparkles className="w-5 h-5" /> Sound Assignment Wizard</h3>
              <button 
                onClick={() => setAssignModal({ isOpen: false, preselectedEventId: null, selectedSound: "Chime Note" })}
                className="p-1 hover:bg-slate-500/15 rounded-lg text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              
              {/* Event selection dropdown */}
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Select target Dispatch Event *</label>
                <select
                  value={assignModal.preselectedEventId || "e-1"}
                  onChange={(e) => setAssignModal(prev => ({ ...prev, preselectedEventId: e.target.value }))}
                  className={`w-full border p-2.5 rounded-lg text-xs font-bold ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-[#FBFBFC] border-gray-200"}`}
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.category}: {ev.name}</option>
                  ))}
                </select>
              </div>

              {/* Sound Selection Choice */}
              <div>
                <label className="block text-gray-400 mb-1 font-bold">Select Premium Audio Tone *</label>
                <select
                  value={assignModal.selectedSound}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAssignModal(prev => ({ ...prev, selectedSound: val }));
                    playSyntheticSound(val);
                  }}
                  className={`w-full border p-2.5 rounded-lg text-xs font-bold ${isDarkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-[#FBFBFC] border-gray-300"}`}
                >
                  <optgroup label="System Synthesized Sounds (Web Audio)">
                    {soundsList.filter(s => !s.isCustom).map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.duration})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Custom Uploaded Files">
                    {soundsList.filter(s => s.isCustom).map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.duration})</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-gray-400 mt-1 font-semibold leading-relaxed">Selecting a sound automatically fires a synthetic preview tone on your terminal speakers.</p>
              </div>

              {/* Custom Live Preview Widget inside modal */}
              <div className={`p-3.5 rounded-xl border flex justify-between items-center ${isDarkMode ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-200"}`}>
                <div>
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase uppercase">Selected Preview Asset</span>
                  <p className="font-extrabold text-xs text-[#E23744] mt-0.5">{assignModal.selectedSound}</p>
                </div>
                <button
                  onClick={() => playSyntheticSound(assignModal.selectedSound)}
                  className="px-3.5 py-1.5 bg-[#E23744] hover:bg-red-700 text-white text-[10px] font-black tracking-wide rounded-lg cursor-pointer"
                >
                  Play Tone Preview
                </button>
              </div>

            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 border-t pt-4 border-slate-101/10 text-xs font-bold mt-2">
              <button 
                onClick={() => setAssignModal({ isOpen: false, preselectedEventId: null, selectedSound: "Chime Note" })}
                className={`px-4 py-2 rounded-xl border cursor-pointer ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-gray-200 text-gray-700"}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAssignment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg cursor-pointer"
              >
                Assign Sound Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL SAVE SETTINGS OVERALL CONFIRMATION DEPLOYMENT */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-2xl overflow-hidden p-6 shadow-2xl relative space-y-4 ${isDarkMode ? "bg-slate-900 border border-slate-900 text-slate-200" : "bg-white border border-gray-100 text-slate-800"}`}>
            <div className="flex justify-between items-center border-b pb-3 border-slate-100/10">
              <h3 className="text-sm font-black flex items-center gap-1.5 text-[#E23744]"><Layout className="w-5 h-5 animate-spin" /> Deploy System Weights Cascade</h3>
              <button 
                onClick={() => setShowSaveConfirmation(false)}
                className="p-1 hover:bg-slate-500/15 rounded-lg text-gray-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex gap-2.5">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-[12px]">Operator Deployment Warning</h4>
                  <p className="mt-1 font-semibold leading-relaxed text-gray-400">These changes will immediately apply to active notifications and acoustic alerts on Admin, Partner Kitchen KDS, Rider Android client, and Consumer applications.</p>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] text-gray-400 font-extrabold uppercase tracking-wide mb-2">Acoustic Weight Settings Summary:</h4>
                <div className={`p-3 rounded-lg space-y-2 border ${isDarkMode ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex justify-between">
                    <span>Events Active Cascades</span>
                    <span className="font-bold text-[#E23744] font-mono">{events.filter(e => e.status === "Active").length} Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Global DB volume Threshold</span>
                    <span className="font-bold font-mono text-blue-500">{globalVolume}% Max</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority Settings Overlap</span>
                    <span className="font-bold font-mono text-purple-500 uppercase">{prioritySetting} override</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Repeat Play Alert sequence</span>
                    <span className="font-bold font-mono text-emerald-500">{playbackRule}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 border-t pt-4 border-slate-100/10 text-xs font-bold mt-2">
              <button 
                onClick={() => setShowSaveConfirmation(false)}
                className={`px-4 py-2 rounded-xl border cursor-pointer ${isDarkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-gray-200 text-gray-700"}`}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeployDraftChanges("draft")}
                className={`px-4 py-2 rounded-xl border cursor-pointer ${isDarkMode ? "bg-slate-900 border-slate-800 text-indigo-400" : "bg-[#FCFCFD] border-gray-300 text-indigo-720 hover:bg-gray-50"}`}
              >
                Save Draft JSON
              </button>
              <button 
                onClick={() => handleDeployDraftChanges("apply")}
                className="px-5 py-2 bg-[#E23744] hover:bg-red-700 text-white rounded-xl shadow-lg cursor-pointer"
              >
                Apply Changes Live
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
