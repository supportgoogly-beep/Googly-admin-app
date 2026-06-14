import React, { useState, useEffect, useMemo, useRef } from "react";
import { Rider, RiderStatus, Order } from "../types";
import OSMInteractiveMap from "./OSMInteractiveMap";
import { uploadFile } from "../lib/storage";
import { 
  Search, Sliders, MapPin, Phone, Mail, Calendar, User, Shield, 
  MapPinOff, Navigation, RefreshCw, X, AlertCircle, CheckCircle, Trash2, 
  ArrowRight, ToggleLeft, ToggleRight, XCircle, FileSpreadsheet, 
  ChevronRight, UserCheck, Moon, Sun, AlertOctagon, Ban, Download,
  Plus, Check, Eye, MoreVertical, Edit, UserX, ShieldAlert, DollarSign,
  Award, TrendingUp, History, Send, Compass, Crosshair, ZoomIn, ZoomOut, Maximize2, Bell
} from "lucide-react";

// Local interfaces for enriched rider details
export interface ExtendedRider extends Rider {
  email: string;
  joiningDate: string;
  address: string;
  city: string;
  vehicleType: "2-Wheeler (Electric)" | "2-Wheeler (Fuel)" | "Bicycle" | "3-Wheeler";
  aadharNumber: string;
  panNumber: string;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  acceptanceRate: number; // e.g. 96
  customerRating: number; // e.g. 4.8
  avgDeliveryTime: number; // in mins e.g. 24
  weeklyEarnings: number;
  monthlyEarnings: number;
  pendingSettlement: number;
  incentives: number;
  avatarUrl: string;
  kycDetails: {
    selfieUrl: string;
    drivingLicenseUrl: string;
    rcBookUrl: string;
    aadhaarUrl: string;
    panUrl: string;
  };
  kycStatus: "Verify Pending" | "Approved" | "Rejected";
  rejectionReason?: string;
  rejectionNotes?: string;
  lastOnlineTime: string;
}

interface RiderManagementModuleProps {
  riders: Rider[];
  setRiders: React.Dispatch<React.SetStateAction<Rider[]>>;
  orders: Order[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

// Global Activity logs for operations session
interface ActivityLog {
  id: string;
  timestamp: string;
  riderId: string;
  riderName: string;
  type: string;
  message: string;
  severity: "info" | "success" | "warning" | "error";
}

export default function RiderManagementModule({
  riders,
  setRiders,
  orders,
  triggerToast
}: RiderManagementModuleProps) {
  // --- LAYOUT & THEME MANAGEMENT ---
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  // --- FILTERS & SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [zoneFilter, setZoneFilter] = useState<string>("All");
  const [kycFilter, setKycFilter] = useState<string>("All");
  const [vehicleFilter, setVehicleFilter] = useState<string>("All");

  // --- INTERACTION / DRAWER / MODAL STATES ---
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [showRiderDrawer, setShowRiderDrawer] = useState(false);
  
  // Custom Live Tracking GPS Modal
  const [trackingRider, setTrackingRider] = useState<ExtendedRider | null>(null);
  const [trackingZoom, setTrackingZoom] = useState(14);
  const [mapMovingPin, setMapMovingPin] = useState({ x: 50, y: 55 });
  const [isLiveMapPolling, setIsLiveMapPolling] = useState(true);
  const [mapEta, setMapEta] = useState(14); // mins
  const [mapDistance, setMapDistance] = useState(3.4); // km
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Add / Onboarding Rider Wizard
  const [showAddWizard, setShowAddWizard] = useState(false);
  const [deleteRiderId, setDeleteRiderId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [wizardForm, setWizardForm] = useState({
    name: "",
    phone: "",
    altPhone: "",
    email: "",
    address: "",
    city: "Kolkata",
    zone: "Salt Lake Sector V",
    vehicleType: "2-Wheeler (Electric)" as any,
    vehicleNumber: "",
    avatarUrl: "",
    aadharNumber: "",
    panNumber: "",
    selfieUrl: "",
    drivingLicenseUrl: "",
    rcBookUrl: "",
    aadhaarUrl: "",
    panUrl: ""
  });

  // KYC Verification Modal
  const [verifyingRider, setVerifyingRider] = useState<ExtendedRider | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectPanel, setShowRejectPanel] = useState(false);

  // Wallet Actions Modal
  const [walletRider, setWalletRider] = useState<ExtendedRider | null>(null);
  const [walletTxType, setWalletTxType] = useState<"bonus" | "penalty" | "payout">("bonus");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletNote, setWalletNote] = useState("");
  const [walletTxLogs, setWalletTxLogs] = useState<Record<string, Array<{id: string, type: string, amount: number, timestamp: string, note: string}>>>({});

  // --- ADDITIONAL ACTION STATES ---
  const [openActionMenuRiderId, setOpenActionMenuRiderId] = useState<string | null>(null);
  const [editingRider, setEditingRider] = useState<ExtendedRider | null>(null);
  const [viewAssignedOrdersRider, setViewAssignedOrdersRider] = useState<ExtendedRider | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [bulkNotificationText, setBulkNotificationText] = useState<string>("");

  // Confirmation Alert Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Bulk operation tracking
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [showBulkActionConfirm, setShowBulkActionConfirm] = useState<string | null>(null);

  // Operation Activity Logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("googly_rider_activity_logs");
    return saved ? JSON.parse(saved) : [
      { id: "log-1", timestamp: "10:14 AM", riderId: "RD-101", riderName: "Siddharth Sen", type: "Rider Activated", message: "Operator verified document hash signature and set state to Online.", severity: "success" },
      { id: "log-2", timestamp: "09:41 AM", riderId: "RD-104", riderName: "Animesh Das", type: "KYC Approved", message: "Automated identity scan cleared driver selfie image match.", severity: "success" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("googly_rider_activity_logs", JSON.stringify(activityLogs));
  }, [activityLogs]);

  const addOperationLog = (riderId: string, riderName: string, type: string, message: string, severity: "info" | "success" | "warning" | "error" = "info") => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      riderId,
      riderName,
      type,
      message,
      severity
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const riderFileRef = useRef<HTMLInputElement>(null);
  const [activeUploadField, setActiveUploadField] = useState<string | null>(null);

  const handleRiderFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadField) {
      triggerToast("Uploading Document...", "Transferring encrypted payload to S3 Cluster", "info");
      const result = await uploadFile(file);
      if (result.success && result.url) {
        setWizardForm(prev => ({ ...prev, [activeUploadField]: result.url }));
        triggerToast("Asset Secured", "Document synchronized successfully.", "success");
      } else {
        triggerToast("Encryption Failed", result.error || "Storage cluster unreachable", "error");
      }
      setActiveUploadField(null);
    }
  };

  const handleSaveRiderEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRider) return;
    setRiders(prev => prev.map(r => r.id === editingRider.id ? {
      ...r,
      name: editingRider.name,
      phone: editingRider.phone,
      vehicleNumber: editingRider.vehicleNumber,
      vehicleType: editingRider.vehicleType,
      status: editingRider.status
    } : r));
    addOperationLog(editingRider.id, editingRider.name, "Rider Profile Updated", "Operator saved updated driver attributes in admin system.", "success");
    triggerToast("Rider Saved", `Profile details for ${editingRider.name} were successfully updated.`, "success");
    setEditingRider(null);
  };

  const executeDeleteRider = () => {
    if (!deleteRiderId) return;
    const target = riders.find(r => r.id === deleteRiderId);
    setRiders(prev => prev.filter(r => r.id !== deleteRiderId));
    if (target) {
      addOperationLog(target.id, target.name, "Rider Erased", "Permanently removed driver registry from operational clusters.", "error");
    }
    triggerToast("Fleet Record Removed", "The rider has been permanently deleted from active and historical clusters.", "success");
    setDeleteRiderId(null);
    if (selectedRiderId === deleteRiderId) {
      setShowRiderDrawer(false);
      setSelectedRiderId(null);
    }
  };

  // --- SYSTEM PRESET DICTIONARIES ---
  const CUISINE_AVATARS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80"
  ];

  // --- DERIVE & ENRICH RIDERS TO FULL ENTERPRISE DATA MODEL ---
  const enrichedRiders: ExtendedRider[] = useMemo(() => {
    return riders.map((rider, idx) => {
      // Establish fixed seed metrics based on rider ID length or index
      const seedValue = (rider.id.charCodeAt(3) || 7) + idx;
      const totalDel = 120 + (seedValue * 14);
      const compDel = Math.floor(totalDel * 0.98);
      const cancelDel = totalDel - compDel;
      const isPendingVer = !rider.kycApproved && rider.status !== "Offline" && idx % 2 === 0;
      
      const statusValue: RiderStatus = rider.status;
      let stateVal: "Verify Pending" | "Approved" | "Rejected" = "Approved";
      if (!rider.kycApproved) {
        stateVal = "Verify Pending";
      }

      const onlineTimeVal = statusValue === "Online" || statusValue === "On-Delivery"
        ? "Online Now"
        : seedValue % 4 === 0
        ? "4 mins ago"
        : seedValue % 4 === 1
        ? "32 mins ago"
        : seedValue % 4 === 2
        ? "2 hours ago"
        : "Yesterday";

      return {
        ...rider,
        // Override state bounds based on kycApproved flag
        kycStatus: stateVal,
        email: `${rider.name.toLowerCase().replace(/ /g, "")}@googlydelivery.in`,
        joiningDate: `1${(seedValue % 5) + 1} Apr 2024`,
        address: `${24 + seedValue}, Salt Lake Sector ${((seedValue % 4) + 1)}, Block BG, Kolkata`,
        city: "Kolkata",
        vehicleType: seedValue % 3 === 0 ? "2-Wheeler (Electric)" : seedValue % 3 === 1 ? "2-Wheeler (Fuel)" : "Bicycle",
        aadharNumber: `5491 8023 ${4912 + seedValue}`,
        panNumber: `DPYPR${1490 + seedValue}M`,
        totalDeliveries: totalDel,
        completedDeliveries: compDel,
        cancelledDeliveries: cancelDel,
        acceptanceRate: 90 + (seedValue % 10),
        customerRating: rider.rating || parseFloat((4.2 + (seedValue % 8) * 0.1).toFixed(1)),
        avgDeliveryTime: 20 + (seedValue % 15),
        weeklyEarnings: 4200 + (seedValue * 150),
        monthlyEarnings: 18000 + (seedValue * 600),
        pendingSettlement: seedValue % 2 === 0 ? 350 : 0,
        incentives: seedValue * 45,
        avatarUrl: CUISINE_AVATARS[idx % CUISINE_AVATARS.length],
        kycDetails: {
          selfieUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80",
          drivingLicenseUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=500&q=80",
          rcBookUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80",
          aadhaarUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=500&q=80",
          panUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&q=80"
        },
        lastOnlineTime: onlineTimeVal
      };
    });
  }, [riders]);

  // --- FILTERED SELECTIONS ---
  const filteredRiders = useMemo(() => {
    return enrichedRiders.filter(item => {
      // 1. Text Search
      const searchLower = searchQuery.toLowerCase();
      const matchText = 
        item.name.toLowerCase().includes(searchLower) ||
        item.id.toLowerCase().includes(searchLower) ||
        item.phone.toLowerCase().includes(searchLower) ||
        item.vehicleNumber.toLowerCase().includes(searchLower) ||
        (item.address && item.address.toLowerCase().includes(searchLower));

      // 2. Status Filter
      const matchStatus = statusFilter === "All" || item.status === statusFilter;

      // 3. Zone / Area Filters (Assumes they belong inside Salt Lake/Kolkata zones)
      const matchZone = zoneFilter === "All" || item.address.includes(`Sector ${zoneFilter}`);

      // 4. KYC Status filter
      const matchKyc = kycFilter === "All" || item.kycStatus === kycFilter;

      // 5. Vehicle type
      const matchVehicle = vehicleFilter === "All" || item.vehicleType.startsWith(vehicleFilter);

      return matchText && matchStatus && matchZone && matchKyc && matchVehicle;
    });
  }, [enrichedRiders, searchQuery, statusFilter, zoneFilter, kycFilter, vehicleFilter]);

  // --- SELECTED RIDER DOCK ---
  const selectedRider = useMemo(() => {
    return enrichedRiders.find(r => r.id === selectedRiderId) || null;
  }, [enrichedRiders, selectedRiderId]);

  // --- COUNTERS AND ANALYTICS BLOCKS ---
  const counts = useMemo(() => {
    return {
      total: enrichedRiders.length,
      online: enrichedRiders.filter(r => r.status === "Online").length,
      onDelivery: enrichedRiders.filter(r => r.status === "On-Delivery").length,
      offline: enrichedRiders.filter(r => r.status === "Offline").length,
      suspended: enrichedRiders.filter(r => r.status === "Suspended" || !r.active).length,
      pendingKyc: enrichedRiders.filter(r => r.kycStatus === "Verify Pending").length
    };
  }, [enrichedRiders]);

  // --- VIEW LOCATION SIMULATED GPS INTERPOLATION ENGINE ---
  useEffect(() => {
    if (isLiveMapPolling && trackingRider) {
      timerRef.current = setInterval(() => {
        setMapMovingPin(prev => {
          // Slowly move towards high-density center core
          const dx = (50 - prev.x) * 0.1;
          const dy = (50 - prev.y) * 0.1;
          const stepX = (Math.random() - 0.5) * 2;
          const stepY = (Math.random() - 0.5) * 2;
          
          // Re-evaluate boundaries
          let targetX = prev.x + stepX + dx;
          let targetY = prev.y + stepY + dy;
          if (targetX < 20) targetX = 20;
          if (targetX > 80) targetX = 80;
          if (targetY < 20) targetY = 20;
          if (targetY > 80) targetY = 80;

          return { x: targetX, y: targetY };
        });

        setMapEta(prev => {
          if (prev <= 1) return 12; // loop back to simulate fresh order dispatch
          return prev - 1;
        });

        setMapDistance(prev => {
          if (prev <= 0.2) return 4.1;
          return parseFloat((prev - 0.15).toFixed(2));
        });
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLiveMapPolling, trackingRider]);

  const startTracking = (rider: ExtendedRider) => {
    setTrackingRider(rider);
    setMapMovingPin({ x: 35 + Math.random() * 30, y: 35 + Math.random() * 30 });
    setMapEta(8 + Math.floor(Math.random() * 12));
    setMapDistance(2.1 + parseFloat((Math.random() * 3).toFixed(1)));
    addOperationLog(rider.id, rider.name, "Live Tracking Opened", "Operator connected to secure web GPS telemetry signals.", "info");
    triggerToast("Live Feeds Connected", `Tracking telemetry signals for ${rider.name}...`, "success");
  };

  // --- ACTIONS & OPERATIONS TRIGGERING HANDLERS ---
  const handleToggleActiveRider = (rider: ExtendedRider) => {
    setConfirmDialog({
      isOpen: true,
      title: "Are you sure?",
      message: "This action will change the rider's operational status.",
      onConfirm: () => {
        setRiders(prev => prev.map(r => {
          if (r.id === rider.id) {
            const nextStatus: RiderStatus = r.status === "Offline" ? "Online" : "Offline";
            return { ...r, status: nextStatus, active: nextStatus !== "Offline" };
          }
          return r;
        }));
        addOperationLog(rider.id, rider.name, "Rider Status Altered", `Toggled status.`, "warning");
        triggerToast("Operational Status Altered", `Driver status updated for "${rider.name}".`, "info");
        setConfirmDialog(null);
      }
    });
  };

  const handleBlockRider = (rider: ExtendedRider) => {
    setConfirmDialog({
      isOpen: true,
      title: "Are you sure?",
      message: "This action will change the rider's operational status. A suspended or blocked rider cannot access deliveries.",
      onConfirm: () => {
        setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, status: "Suspended" as any, active: false } : r));
        addOperationLog(rider.id, rider.name, "Rider Blocked", "Rider profile marked suspended.", "error");
        triggerToast("Operational Force Lockout", `Rider "${rider.name}" profile restricted and blocked.`, "error");
        setConfirmDialog(null);
      }
    });
  };

  const handleApproveKYC = (rider: ExtendedRider) => {
    setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, kycApproved: true, status: "Online" as any, active: true } : r));
    addOperationLog(rider.id, rider.name, "Rider Approved", "Completed document hash verification on PAN & credentials.", "success");
    triggerToast("Partnership Activated", `KYC documents verified. Welcoming "${rider.name}" to operations!`, "success");
    setVerifyingRider(null);
  };

  const handleRejectKYC = (rider: ExtendedRider) => {
    if (!rejectReason) {
      triggerToast("Missing Parameters", "Select a core validation rejection code first.", "error");
      return;
    }
    setRiders(prev => prev.map(r => r.id === rider.id ? { ...r, kycApproved: false, status: "Offline" as any, active: false } : r));
    addOperationLog(rider.id, rider.name, "Rider Rejected", `Rejected KYC due to ${rejectReason}. Notes: ${rejectNotes}`, "error");
    triggerToast("Verification Refused", `Discrepancy triggered. Notification dispatched to ${rider.name}.`, "error");
    setVerifyingRider(null);
    setShowRejectPanel(false);
    setRejectReason("");
    setRejectNotes("");
  };

  // Onboarding submissions wizard save
  const handleOnboardSubmit = (type: "draft" | "submit") => {
    if (!wizardForm.name.trim() || !wizardForm.phone.trim()) {
      triggerToast("Validation Failed", "Name and primary mobile contact are required fields.", "error");
      return;
    }

    const generateAlphanumericId = (l: number = 6) => Array.from({length: l}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))).join('');
    const generatedId = generateAlphanumericId(6);
    const newPartner: Rider = {
      id: generatedId,
      name: wizardForm.name,
      phone: wizardForm.phone,
      vehicleNumber: wizardForm.vehicleNumber || "WB-02-C-9812",
      status: type === "draft" ? "Offline" : "Offline", // stays pending verification or offline till review
      walletBalance: 0,
      active: false,
      rating: 5.0,
      kycApproved: type === "submit" ? false : false, // needs admin approval anyway if submitted
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40
    };

    setRiders(prev => [newPartner, ...prev]);
    addOperationLog(generatedId, wizardForm.name, type === "draft" ? "Rider Draft Saved" : "Rider Onboard Registered", `Onboard records filed via wizard stage. KYC approval pending.`, "success");
    triggerToast(
      type === "draft" ? "Draft Stashed Successfully" : "Credentials Acknowledged",
      type === "draft" ? `Onboarding file for ${wizardForm.name} saved.` : `Onboarding details received. Initiate file review.`,
      "success"
    );
    setShowAddWizard(false);
    // Reset wizard stack
    setWizardStep(1);
    setWizardForm({
      name: "", phone: "", altPhone: "", email: "", address: "", city: "Kolkata", zone: "Salt Lake Sector V",
      vehicleType: "2-Wheeler (Electric)" as any, vehicleNumber: "", avatarUrl: "", aadharNumber: "",
      panNumber: "", selfieUrl: "", drivingLicenseUrl: "", rcBookUrl: "", aadhaarUrl: "", panUrl: ""
    });
  };

  // Wallet modifications adding
  const handleExecuteWalletTx = () => {
    if (!walletRider) return;
    const value = parseFloat(walletAmount);
    if (isNaN(value) || value <= 0) {
      triggerToast("Input Error", "Enter valid positive ledger amount.", "error");
      return;
    }

    setRiders(prev => prev.map(r => {
      if (r.id === walletRider.id) {
        let currentbal = r.walletBalance;
        if (walletTxType === "bonus") currentbal += value;
        else if (walletTxType === "penalty") currentbal = Math.max(0, currentbal - value);
        else if (walletTxType === "payout") currentbal = Math.max(0, currentbal - value);
        return { ...r, walletBalance: currentbal };
      }
      return r;
    }));

    // Local ledger logs stashing
    const txLogNode = {
      id: `tx-${Date.now()}`,
      type: walletTxType === "bonus" ? "Credited Bonus Incentive" : walletTxType === "penalty" ? "Deducted Service Penalty" : "Debit Bank Settlement Payout",
      amount: value,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}),
      note: walletNote || "Operations manual override."
    };

    setWalletTxLogs(prev => ({
      ...prev,
      [walletRider.id]: [txLogNode, ...(prev[walletRider.id] || [])]
    }));

    addOperationLog(
      walletRider.id,
      walletRider.name,
      "Wallet Ledger Balance Modified",
      `Wallet adjust complete: ${txLogNode.type} of ₹${value}.`,
      walletTxType === "penalty" ? "warning" : "success"
    );

    triggerToast("Ledger Balance Updated", `Substituted values on credit line ledger.`, "success");
    setWalletRider(null);
    setWalletAmount("");
    setWalletNote("");
  };

  // --- BULK ACTION PROCESSORS ---
  const toggleBulkItem = (id: string) => {
    setBulkSelection(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkExecute = (actionKey: "approve" | "activate" | "suspend" | "export") => {
    if (bulkSelection.length === 0) {
      triggerToast("Selection Empty", "Select target drivers checking boxes inside data tables first.", "info");
      return;
    }

    if (actionKey === "export") {
      const selectedDrivers = enrichedRiders.filter(r => bulkSelection.includes(r.id));
      const headers = ["ID", "Name", "Phone", "Vehicle Type", "Vehicle Number", "Wallet Balance", "Total Deliveries", "KYC Approved"];
      const rows = selectedDrivers.map(d => [d.id, d.name, d.phone, d.vehicleType, d.vehicleNumber, d.walletBalance, d.totalDeliveries, d.kycApproved ? "Yes" : "No"]);
      const content = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const url = encodeURI(content);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `GooglyRiders_BulkExport_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      triggerToast("Data Stream Transmitted", `${bulkSelection.length} entries packed down. CSV download active.`, "success");
      setBulkSelection([]);
      setShowBulkActionConfirm(null);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Confirm Bulk Command?",
      message: `Are you sure you want to target ${bulkSelection.length} riders to perform this bulk update? It will alter their active shifts immediately.`,
      onConfirm: () => {
        setRiders(prev => prev.map(r => {
          if (bulkSelection.includes(r.id)) {
            if (actionKey === "approve") {
              return { ...r, kycApproved: true, status: "Online" as any, active: true };
            } else if (actionKey === "activate") {
              return { ...r, status: "Online" as any, active: true };
            } else if (actionKey === "suspend") {
              return { ...r, status: "Suspended" as any, active: false };
            }
          }
          return r;
        }));
        
        addOperationLog("BULK", `${bulkSelection.length} Riders`, `Bulk ${actionKey.toUpperCase()}`, "Triggered operational status rewrite via checkbox rows.", "warning");
        triggerToast("Bulk Action Implemented", "Processed statuses successfully.", "success");
        setBulkSelection([]);
        setShowBulkActionConfirm(null);
        setConfirmDialog(null);
      }
    });
  };

  return (
    <div className={`p-1 rounded-3xl transition-all font-sans ${themeMode === "dark" ? "bg-[#161618] text-gray-100" : "bg-white text-gray-800"}`}>
      
      {/* HEADER SECTION */}
      <div className={`p-6 border-b rounded-t-3xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 ${
        themeMode === "dark" ? "border-gray-800 bg-[#1A1A1F]/50" : "border-gray-100 bg-gray-50/50"
      }`}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              Delivery Partner Management
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                themeMode === "dark" ? "bg-red-900 text-[#FF4D5B]" : "bg-red-100 text-[#E23744]"
              }`}>
                Fleet Logistics
              </span>
            </h1>
            <button
              id="rider-theme-toggle"
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                themeMode === "dark" ? "border-gray-700 bg-gray-800 hover:bg-gray-800 text-amber-300" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
              }`}
            >
              {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-700 dark:text-gray-400 mt-0.5">Automate driver onboards, execute live delivery GPS routes, reconcile wallets and audit digital credentials.</p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Stats trigger */}
          <div className="hidden sm:flex rounded-xl bg-red-500/10 p-1 border border-red-500/15">
            <span className="px-2.5 py-1 text-[11px] font-black text-[#E23744]">Active Vehicles: {counts.online + counts.onDelivery}</span>
          </div>
          
          <button
            id="register-onboard-button"
            onClick={() => { setShowAddWizard(true); setWizardStep(1); }}
            className="px-4 py-2.5 bg-[#E23744] hover:bg-red-600 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shadow-[#E23744]/15"
          >
            <Plus className="w-4 h-4 text-white" /> Onboard Rider
          </button>
        </div>
      </div>

      {/* METRIC STATS BANNER */}
      <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {[
          { label: "Total Fleet Strength", val: counts.total, icon: User, color: "text-slate-500 bg-slate-500/10" },
          { label: "Online (Active Shifts)", val: counts.online, icon: UserCheck, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "On Delivery Task", val: counts.onDelivery, icon: Navigation, color: "text-blue-500 bg-blue-500/10" },
          { label: "KYC Verify Pending", val: counts.pendingKyc, icon: ShieldAlert, color: "text-amber-500 bg-amber-500/10" },
          { label: "Suspended Blocked", val: counts.suspended, icon: Ban, color: "text-rose-500 bg-rose-500/10" }
        ].map((met, mi) => (
          <div key={mi} className={`p-4 rounded-2xl border text-left flex items-center justify-between ${
            themeMode === "dark" ? "bg-[#1C1C21] border-gray-800" : "bg-gray-50/50 border-gray-200"
          }`}>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-400 uppercase tracking-widest">{met.label}</span>
              <strong className="text-xl font-black block text-gray-800 dark:text-white">{met.val}</strong>
            </div>
            <div className={`p-2.5 rounded-xl ${met.color}`}>
              <met.icon className="w-5 h-5 shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH / ADVANCED FILTERS SYSTEM */}
      <div className={`mx-6 p-4 rounded-2xl border flex flex-col gap-4 ${
        themeMode === "dark" ? "bg-[#1C1C21] border-[#2E2E33]" : "bg-white border-gray-200"
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Main search input */}
          <div className="relative md:col-span-4">
            <Search className="w-4 h-4 text-gray-700 dark:text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              id="rider-search-bar"
              placeholder="Search rider name, phone, driving SKU, DL, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-9 py-2.5 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] focus:border-[#E23744] ${
                themeMode === "dark" ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-800"
              }`}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-3.5 text-gray-700 dark:text-gray-400 hover:text-[#E23744]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] appearance-none cursor-pointer ${
                themeMode === "dark" ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-slate-800"
              }`}
            >
              <option value="All">All Shift States</option>
              <option value="Online">Online (Active)</option>
              <option value="On-Delivery">On Delivery</option>
              <option value="Offline">Offline</option>
              <option value="Suspended">Suspended / Inactive</option>
            </select>
          </div>

          {/* Sector Zone filter */}
          <div className="md:col-span-2">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] appearance-none cursor-pointer ${
                themeMode === "dark" ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-slate-800"
              }`}
            >
              <option value="All">All Geographic Sectors</option>
              <option value="Sector 1">Sector I Hub</option>
              <option value="Sector 2">Sector II District</option>
              <option value="Sector 3">Sector III Technopark</option>
              <option value="Sector 4">Sector IV Bypass</option>
            </select>
          </div>

          {/* Vehicle Type filter */}
          <div className="md:col-span-2">
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] appearance-none cursor-pointer ${
                themeMode === "dark" ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-slate-800"
              }`}
            >
              <option value="All">All Vehicle Classes</option>
              <option value="2-Wheeler (Electric)">Electric EV Bike</option>
              <option value="2-Wheeler (Fuel)">Combustion Engine</option>
              <option value="Bicycle">Bicycle Couriers</option>
            </select>
          </div>

          {/* KYC Status Filter */}
          <div className="md:col-span-2">
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className={`w-full p-2.5 text-xs font-bold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] appearance-none cursor-pointer ${
                themeMode === "dark" ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-slate-800"
              }`}
            >
              <option value="All">All KYC Verification States</option>
              <option value="Verify Pending">Verify Pending</option>
              <option value="Approved">Approved / Registered</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

        </div>

        {/* BULK OPERATION CONTROL BAR */}
        {bulkSelection.length > 0 && (
          <div className="p-3 bg-[#E23744]/5 rounded-xl border border-[#E23744]/20 flex flex-col md:flex-row justify-between items-center gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
              <span>Bulk Action Activated: <strong className="text-[#E23744]">{bulkSelection.length} selected partners</strong></span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkExecute("approve")}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-all cursor-pointer"
              >
                Approve KYC Selected
              </button>
              <button
                onClick={() => handleBulkExecute("activate")}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-all cursor-pointer"
              >
                Clock-In Shift Online
              </button>
              <button
                onClick={() => handleBulkExecute("suspend")}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-[#E23744] rounded-lg font-bold transition-all cursor-pointer"
              >
                Force Lockout Suspend
              </button>
              <button
                onClick={() => setShowNotificationModal(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all cursor-pointer"
              >
                Send Notification
              </button>
              <button
                onClick={() => handleBulkExecute("export")}
                className="px-3 py-1.5 bg-white border border-gray-200 text-stone-700 hover:bg-stone-50 rounded-lg font-bold transition-all cursor-pointer"
              >
                Bulk Export (.csv)
              </button>
              <button
                onClick={() => setBulkSelection([])}
                className="px-2.5 py-1.5 text-stone-700 dark:text-stone-400 hover:text-stone-600 font-bold cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CORE FLEET LISTINGS TABLE */}
      <div className="px-6 py-4">
        {filteredRiders.length === 0 ? (
          /* Empty state */
          <div className={`p-16 border-2 border-dashed rounded-3xl text-center space-y-4 ${
            themeMode === "dark" ? "border-gray-800 bg-[#1C1C21]/20" : "border-gray-200 bg-gray-50/20"
          }`}>
            <div className="w-16 h-16 bg-red-50 text-[#E23744] rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ?
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-gray-800 dark:text-white">Empty Fleet Segment Selection</h3>
              <p className="text-xs text-gray-700 dark:text-gray-400 max-w-sm mx-auto leading-normal">
                No active delivery riders matched your applied filtering matrix. Please adjust the searching text strings or check-status indicators.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
                setZoneFilter("All");
                setKycFilter("All");
                setVehicleFilter("All");
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer"
            >
              Reset Administrative Matrix
            </button>
          </div>
        ) : (
          <div className="border rounded-2xl overflow-hidden shadow-xs border-gray-200 text-left bg-white dark:bg-[#1C1C21]">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[1200px]">
                <thead className={`text-[10px] uppercase font-bold tracking-wider ${
                  themeMode === "dark" ? "bg-[#1E1E24] text-gray-700 dark:text-gray-400" : "bg-gray-50 text-stone-500"
                }`}>
                  <tr>
                    <th className="p-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={bulkSelection.length === filteredRiders.length && filteredRiders.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setBulkSelection(filteredRiders.map(r => r.id));
                          else setBulkSelection([]);
                        }}
                        className="rounded border-gray-300 accent-[#E23744]"
                      />
                    </th>
                    <th className="p-4 w-14 text-center">Photo</th>
                    <th className="p-4">Rider ID</th>
                    <th className="p-4">Rider Name</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Vehicle Type</th>
                    <th className="p-4">Vehicle Number</th>
                    <th className="p-4">Assigned Zone</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4 text-center">Active Deliveries</th>
                    <th className="p-4">Wallet Balance</th>
                    <th className="p-4">KYC Status</th>
                    <th className="p-4">Last Online</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${themeMode === "dark" ? "divide-gray-800" : "divide-gray-100"}`}>
                  {filteredRiders.map((item, index) => {
                    const riderAssignedOrders = orders.filter(o => o.riderId === item.id && o.status !== "Delivered" && o.status !== "Cancelled");
                    
                    return (
                      <tr 
                        key={item.id}
                        className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors ${
                          themeMode === "dark" ? "" : "even:bg-gray-50/30"
                        }`}
                      >
                        {/* Checkbox multiselect */}
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={bulkSelection.includes(item.id)}
                            onChange={() => toggleBulkItem(item.id)}
                            className="rounded border-gray-300 accent-[#E23744]"
                          />
                        </td>

                        {/* Profile Photo */}
                        <td className="p-4 text-center">
                          <div className="relative inline-block">
                            <img 
                              src={item.avatarUrl} 
                              alt={item.name} 
                              className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                              themeMode === "dark" ? "border-gray-900" : "border-white"
                            } ${
                              item.status === "Online" ? "bg-emerald-500 animate-pulse" :
                              item.status === "On-Delivery" ? "bg-blue-500 animate-pulse" :
                              item.status === "Suspended" ? "bg-red-500" : "bg-gray-400"
                            }`} />
                          </div>
                        </td>

                        {/* Rider ID */}
                        <td className="p-4 font-mono font-bold text-gray-500">{item.id}</td>

                        {/* Clickable Name */}
                        <td className="p-4 font-extrabold text-sm text-gray-900 dark:text-gray-200">
                          <button
                            onClick={() => { setSelectedRiderId(item.id); setShowRiderDrawer(true); }}
                            className="hover:text-[#E23744] hover:underline transition-all text-left block cursor-pointer"
                          >
                            {item.name}
                          </button>
                        </td>

                        {/* Phone number */}
                        <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{item.phone}</td>

                        {/* Vehicle Type */}
                        <td className="p-4 font-semibold text-gray-700 dark:text-gray-300 text-xs">
                          {item.vehicleType}
                        </td>

                        {/* Vehicle Number */}
                        <td className="p-4">
                          <code className="text-[10px] bg-red-50 dark:bg-[#201A1E] text-[#E23744] px-1.5 py-0.5 rounded font-mono font-bold uppercase block w-max">
                            {item.vehicleNumber}
                          </code>
                        </td>

                        {/* Zone */}
                        <td className="p-4 font-bold text-slate-800 dark:text-gray-300">
                          {item.address.includes("Sector 1") ? "Sector I Hub" :
                           item.address.includes("Sector 2") ? "Sector II District" :
                           item.address.includes("Sector 3") ? "Sector III Technopark" :
                           "Sector IV Bypass"}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 ${
                            item.status === "Online" ? "bg-emerald-100 text-emerald-800" :
                            item.status === "On-Delivery" ? "bg-blue-100 text-blue-800 animate-pulse" :
                            item.status === "Suspended" ? "bg-red-100 text-[#E23744]" :
                            item.status === "Pending Verification" ? "bg-amber-100 text-amber-800" :
                            "bg-gray-100 text-stone-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.status === "Online" ? "bg-emerald-500" :
                              item.status === "On-Delivery" ? "bg-blue-500" :
                              item.status === "Suspended" ? "bg-red-600" :
                              item.status === "Pending Verification" ? "bg-amber-500" :
                              "bg-gray-400"
                            }`}></span>
                            {item.status === "On-Delivery" ? "On Delivery" : item.status}
                          </span>
                        </td>

                        {/* Active Deliveries count */}
                        <td className="p-4 text-center">
                          {riderAssignedOrders.length > 0 ? (
                            <div className="flex flex-col gap-1 items-center">
                              <span className="text-[10px] text-blue-800 bg-blue-100 font-extrabold px-2 py-0.5 rounded-full inline-block mb-1">
                                {riderAssignedOrders.length} active
                              </span>
                              {riderAssignedOrders.map(o => (
                                 <span key={o.id} className="text-[9px] font-mono text-gray-700 dark:text-gray-300 block bg-gray-100 dark:bg-gray-800 px-1 rounded">{o.id}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-700 dark:text-gray-400 font-semibold">0 active</span>
                          )}
                        </td>

                        {/* Balance */}
                        <td className="p-4">
                          <button
                            onClick={() => setWalletRider(item)}
                            className="font-black hover:underline text-gray-800 dark:text-gray-200 hover:text-[#E23744] cursor-pointer"
                          >
                            ₹{item.walletBalance}
                          </button>
                        </td>

                        {/* KYC Status Badge */}
                        <td className="p-4">
                          {item.kycApproved ? (
                            <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-600" /> Cleared
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-[#E23744] font-extrabold bg-red-50 dark:bg-red-900/25 px-1.5 py-0.5 rounded text-[10px]">
                                Review Pending
                              </span>
                              <button
                                onClick={() => setVerifyingRider(item)}
                                className="text-[10px] text-blue-600 hover:underline font-bold text-left cursor-pointer"
                              >
                                Review KYC
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Last Online */}
                        <td className="p-4 text-gray-500 dark:text-gray-500 font-bold">
                          {item.lastOnlineTime}
                        </td>

                        {/* Actions drop control triggers */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`track-loc-btn-${item.id}`}
                              onClick={() => startTracking(item)}
                              className="px-2 py-1 bg-[#E23744]/10 hover:bg-[#E23744] hover:text-white text-[#E23744] rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                              title="Connect secure live GPS locator feed modal"
                            >
                              <MapPin className="w-3 h-3 text-[#E23744]" /> View Live Location
                            </button>

                            <div className="relative">
                              <button
                                onClick={() => setOpenActionMenuRiderId(openActionMenuRiderId === item.id ? null : item.id)}
                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openActionMenuRiderId === item.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setOpenActionMenuRiderId(null)} 
                                  />
                                  <ul className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1E1E22] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1 z-50 text-left font-bold text-[11px] animate-fade-in text-gray-700 dark:text-gray-300">
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          setSelectedRiderId(item.id);
                                          setShowRiderDrawer(true);
                                        }}
                                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <Eye className="w-4 h-4 text-gray-700 dark:text-gray-400" /> View Profile
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          setEditingRider(item);
                                        }}
                                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <Edit className="w-4 h-4 text-gray-700 dark:text-gray-400" /> Edit Rider
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          startTracking(item);
                                        }}
                                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <MapPin className="w-4 h-4 text-blue-500" /> View Live Location
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          setViewAssignedOrdersRider(item);
                                        }}
                                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <Sliders className="w-4 h-4 text-purple-500" /> View Assigned Orders
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          setWalletRider(item);
                                        }}
                                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <DollarSign className="w-4 h-4 text-emerald-500" /> Wallet Details
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          setVerifyingRider(item);
                                        }}
                                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <Shield className="w-4 h-4 text-amber-500" /> Verify KYC
                                      </button>
                                    </li>
                                    <li className="border-t border-gray-100 dark:border-gray-800 my-1 font-normal" />
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          setConfirmDialog({
                                            isOpen: true,
                                            title: "Confirm Activation?",
                                            message: `This action will change the rider's operational status. Check ${item.name} onto active online shift?`,
                                            onConfirm: () => {
                                              setRiders(prev => prev.map(r => r.id === item.id ? { ...r, status: "Online" as any, active: true } : r));
                                              addOperationLog(item.id, item.name, "Rider Activated", "Verified driver readiness and set state status to Online.", "success");
                                              triggerToast("Rider Activated", `Checked ${item.name} onto shift online.`, "success");
                                              setConfirmDialog(null);
                                            }
                                          });
                                        }}
                                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 text-emerald-600 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <UserCheck className="w-4 h-4" /> Activate Rider
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          setConfirmDialog({
                                            isOpen: true,
                                            title: "Are you sure?",
                                            message: `This action will change the rider's operational status. Suspend active delivery access for ${item.name}?`,
                                            onConfirm: () => {
                                              setRiders(prev => prev.map(r => r.id === item.id ? { ...r, status: "Suspended" as any, active: false } : r));
                                              addOperationLog(item.id, item.name, "Rider Suspended", "Rider suspended from operations.", "warning");
                                              triggerToast("Rider Suspended", `Changed operational status for ${item.name}.`, "info");
                                              setConfirmDialog(null);
                                            }
                                          });
                                        }}
                                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 text-amber-600 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <XCircle className="w-4 h-4" /> Suspend Rider
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          setConfirmDialog({
                                            isOpen: true,
                                            title: "Are you sure you want to block?",
                                            message: `This action will change the rider's operational status and permanently block ${item.name} from onboarding again.`,
                                            onConfirm: () => {
                                              setRiders(prev => prev.map(r => r.id === item.id ? { ...r, status: "Suspended" as any, active: false } : r));
                                              addOperationLog(item.id, item.name, "Profile Blocked", "Revoked credentials and blocked partner.", "error");
                                              triggerToast("Driver Blocked", `Restrained operational token for ${item.name}.`, "error");
                                              setConfirmDialog(null);
                                            }
                                          });
                                        }}
                                        className="w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-900 text-red-600 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <Ban className="w-4 h-4" /> Block Rider
                                      </button>
                                    </li>
                                    <li>
                                      <button
                                        onClick={() => {
                                          setOpenActionMenuRiderId(null);
                                          setDeleteRiderId(item.id);
                                        }}
                                        className="w-full px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 flex items-center gap-2 text-left cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4" /> Delete Permanently
                                      </button>
                                    </li>
                                  </ul>
                                </>
                              )}
                            </div>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* --- RIGHT-SIDE SLIDING RIDER PROFILE DRAWER --- */}
      {showRiderDrawer && selectedRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-lg bg-white dark:bg-[#1E1E22] h-full shadow-2xl flex flex-col animate-slide-left text-left">
            
            {/* Drawer head */}
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-red-50 rounded-xl text-[#E23744]">
                  <User className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-extrabold text-[#E23744] text-base">{selectedRider.name}</h2>
                  <p className="text-[10px] text-gray-700 dark:text-gray-400 mt-0.5">{selectedRider.id} • Registered Fleet Node</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRiderDrawer(false)}
                className="p-1.5 hover:bg-stone-100 rounded-full text-stone-700 dark:text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Image & Base metrics banner */}
              <div className="grid grid-cols-3 gap-4 items-center bg-[#E23744]/5 p-4 rounded-2xl border border-[#E23744]/10">
                <div className="col-span-1 shrink-0 flex justify-center">
                  <img src={selectedRider.avatarUrl} alt={selectedRider.name} className="w-20 h-20 rounded-full object-cover border border-[#E23744]/20" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedRider.status === "Online" ? "bg-emerald-100 text-emerald-800" :
                    selectedRider.status === "On-Delivery" ? "bg-blue-100 text-blue-800 animate-pulse" : "bg-gray-100 text-[#E23744]"
                  }`}>
                    {selectedRider.status}
                  </span>
                  <div className="font-bold text-sm text-gray-800 dark:text-gray-200">Customer Rating: {selectedRider.customerRating} ★</div>
                  <div className="text-[11px] text-gray-700 dark:text-gray-400">Total Shift Deliveries: <strong>{selectedRider.totalDeliveries} orders</strong></div>
                </div>
              </div>

              {/* Personal details info */}
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 tracking-wider">Contact & Credentials Details</h3>
                <div className="grid grid-cols-2 gap-3.5 bg-gray-50/50 p-4 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-700 dark:text-gray-400">Mobile Phone</span>
                    <strong className="block text-gray-800 mt-1 font-extrabold">{selectedRider.phone}</strong>
                  </div>
                  <div>
                    <span className="text-gray-700 dark:text-gray-400">Email Address</span>
                    <strong className="block text-gray-800 mt-1 truncate">{selectedRider.email}</strong>
                  </div>
                  <div>
                    <span className="text-gray-700 dark:text-gray-400">Joining Date</span>
                    <strong className="block text-gray-800 mt-1">{selectedRider.joiningDate}</strong>
                  </div>
                  <div>
                    <span className="text-gray-700 dark:text-gray-400">Registered City</span>
                    <strong className="block text-gray-800 mt-1">{selectedRider.city}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-700 dark:text-gray-400">Primary Hub Address</span>
                    <strong className="block text-gray-800 mt-1 leading-normal">{selectedRider.address}</strong>
                  </div>
                </div>
              </div>

              {/* Vehicle Specifications */}
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 tracking-wider">Vehicle Specifications</h3>
                <div className="grid grid-cols-2 gap-3.5 bg-gray-50/50 p-4 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-700 dark:text-gray-400">Vehicle Type Group</span>
                    <strong className="block text-gray-800 mt-1">{selectedRider.vehicleType}</strong>
                  </div>
                  <div>
                    <span className="text-gray-700 dark:text-gray-400">Number Plate SKU</span>
                    <strong className="block text-gray-800 mt-1 uppercase font-mono">{selectedRider.vehicleNumber}</strong>
                  </div>
                  <div>
                    <span className="text-gray-700 dark:text-gray-400">Aadhaar Card UID</span>
                    <strong className="block text-gray-800 mt-1 font-mono">{selectedRider.aadharNumber}</strong>
                  </div>
                  <div>
                    <span className="text-gray-700 dark:text-gray-400">PAN Permanent Acc</span>
                    <strong className="block text-gray-800 mt-1 font-mono uppercase">{selectedRider.panNumber}</strong>
                  </div>
                </div>
              </div>

              {/* Driver Performance Metrics */}
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 tracking-wider">Performance Analytics Log</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[10px] text-stone-500 uppercase block">Accept Rate</span>
                    <strong className="text-base font-black text-slate-800 block mt-1">{selectedRider.acceptanceRate}%</strong>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[10px] text-stone-500 uppercase block">Avg Prep-ETA</span>
                    <strong className="text-base font-black text-slate-800 block mt-1">{selectedRider.avgDeliveryTime} mins</strong>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center">
                    <span className="text-[10px] text-stone-500 uppercase block">Total Completed</span>
                    <strong className="text-base font-black text-emerald-600 block mt-1">{selectedRider.completedDeliveries}</strong>
                  </div>
                </div>
              </div>

              {/* Wallet Summary Block */}
              <div className="space-y-3">
                <h3 className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 tracking-wider">Earnings & Wallet summary</h3>
                <div className="p-4 bg-[#FF4D5B]/5 border border-[#FF4D5B]/10 rounded-2xl flex justify-between items-center">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-400 uppercase tracking-widest block">Available Balance</span>
                    <strong className="text-2xl font-black text-[#E23744]">₹{selectedRider.walletBalance}</strong>
                  </div>
                  <button
                    onClick={() => { setWalletRider(selectedRider); setShowRiderDrawer(false); }}
                    className="px-3.5 py-1.5 bg-[#E23744] text-white text-xs font-bold rounded-xl hover:bg-red-600 transition-colors"
                  >
                    Adjust Wallet Lines
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                  <div className="flex justify-between p-2 bg-gray-50 border border-gray-100 rounded-md">
                    <span>Weekly Balance:</span><strong>₹{selectedRider.weeklyEarnings}</strong>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 border border-gray-100 rounded-md">
                    <span>Month-to-Date:</span><strong>₹{selectedRider.monthlyEarnings}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions Drawer bottom action lines */}
            <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between gap-2">
              <button
                onClick={() => setDeleteRiderId(selectedRider.id)}
                className="px-3 bg-red-50 hover:bg-red-100 text-[#E23744] rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center"
                title="Permanently remove rider profile from database"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleToggleActiveRider(selectedRider)}
                className="flex-[2] py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-xs font-bold transition-all text-center"
              >
                {selectedRider.status === "Offline" ? "Pin Online Shift" : "Toggle Clock-Out"}
              </button>

              <button
                onClick={() => startTracking(selectedRider)}
                className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" /> Monitor Live
              </button>

              <button
                onClick={() => handleBlockRider(selectedRider)}
                className="py-2 px-3 bg-[#E23744]/10 hover:bg-red-500 hover:text-white text-[#E23744] rounded-xl text-xs font-bold transition-all text-center shrink-0"
                title="Force lockout profile suspension on rider"
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- LIVE GPS GEOLOCATION MODAL VIEW --- */}
      {trackingRider && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white dark:bg-[#1E1E22] w-full max-w-3xl h-[550px] sm:h-[500px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-left border border-gray-200">
            
            {/* Map pane viewport */}
            <div className="flex-1 bg-stone-100 dark:bg-[#121214] relative flex flex-col justify-between overflow-hidden">
              
              {/* Map Floating UI HUD info */}
              <div className="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row justify-between gap-2 pointer-events-none">
                <div className="bg-white/95 dark:bg-[#161618]/95 p-3 rounded-2xl shadow-xl border border-gray-200 inline-flex items-center gap-3.5 pointer-events-auto">
                  <div className="relative">
                    <img src={trackingRider.avatarUrl} alt={trackingRider.name} className="w-10 h-10 rounded-full object-cover border border-[#E23744]" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#E23744]">{trackingRider.name}</h4>
                    <span className="text-[10px] text-gray-700 dark:text-gray-400 font-mono inline-block">ID: {trackingRider.id} • {trackingRider.vehicleNumber}</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 text-white p-3.5 rounded-2xl shadow-xl inline-flex items-center gap-4 text-xs pointer-events-auto border border-white/10 self-start">
                  <div>
                    <span className="text-gray-700 dark:text-gray-400 text-[9px] uppercase tracking-widest font-bold">Estimated Arrival</span>
                    <strong className="block text-emerald-400 font-black text-sm">{mapEta} minutes remaining</strong>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <span className="text-stone-700 dark:text-stone-400 text-[9px] uppercase tracking-widest font-bold">Distance left</span>
                    <strong className="block text-white font-black text-sm">{mapDistance} km</strong>
                  </div>
                </div>
              </div>

              
              {/* REAL OPENSTREETMAP TRACKING VIEW */}
              <div className="flex-1 w-full relative z-0 flex flex-col">
                <OSMInteractiveMap
                  mode="tracking"
                  riders={trackingRider ? [{...trackingRider, x: mapMovingPin.x, y: mapMovingPin.y}] : []}
                  orders={orders}
                  selectedId={orders.find(o => o.riderId === trackingRider.id && o.status !== "Delivered" && o.status !== "Cancelled")?.id || null}
                  triggerToast={triggerToast}
                  isDarkMode={themeMode === 'dark'}
                  height="100%"
                />
              </div>

            </div>

            {/* Sidebar telemetry statistics list */}
            <div className="w-full md:w-80 bg-gray-50 dark:bg-[#1E1E22] border-l dark:border-gray-800 p-5 flex flex-col justify-between">
              
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b dark:border-gray-800 pb-3">
                  <h3 className="font-extrabold text-[#E23744] text-sm">GPS Telemetry Feeds</h3>
                  <button 
                    onClick={() => { setTrackingRider(null); if (timerRef.current) clearInterval(timerRef.current); }}
                    className="p-1 hover:bg-stone-200 dark:hover:bg-gray-800 rounded-full"
                  >
                    <X className="w-5 h-5 text-gray-700 dark:text-gray-400" />
                  </button>
                </div>

                <div className="space-y-3.5 text-xs text-left">
                  
                  {/* Job Details */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-gray-700 dark:text-gray-400 tracking-wider">Active Shift Assignment</span>
                    <div className="p-3 bg-white dark:bg-stone-900 border border-gray-300 dark:border-gray-800 rounded-xl space-y-1 font-bold">
                      <div className="text-gray-800 dark:text-gray-300 text-xs">Standard Dual-Drop Batch</div>
                      <div className="text-[10px] text-[#E23744] mt-1">Status: Enroute to Retailer</div>
                    </div>
                  </div>

                  {/* Device Telemetrics */}
                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-gray-700 dark:text-gray-400 tracking-wider">Device Hardware States</span>
                    <div className="grid grid-cols-2 gap-2 bg-white dark:bg-stone-900 border border-gray-200 border-dashed rounded-xl p-3 font-semibold text-[11px]">
                      <div>
                        <span className="text-stone-700 dark:text-stone-400 text-[10px]">Battery:</span>
                        <strong className="block text-emerald-600 mt-0.5">84% Connected</strong>
                      </div>
                      <div>
                        <span className="text-stone-700 dark:text-stone-400 text-[10px]">GPS Lockout:</span>
                        <strong className="block text-blue-600 mt-0.5">Dual-Freq High</strong>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-gray-100">
                        <span className="text-stone-700 dark:text-stone-400 text-[10px]">Speed Telemetry:</span>
                        <strong className="block text-stone-700 mt-0.5">~32 km/hour</strong>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action buttons footer inside side-HUD */}
              <div className="space-y-2 pt-6">
                <a
                  href={`tel:${trackingRider.phone}`}
                  className="w-full py-2.5 bg-[#E23744] hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Driver Contact
                </a>
                <button
                  onClick={() => {
                    
                  }}
                  className="w-full py-2 bg-stone-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" /> Fullscreen Viewport
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- ADD NEW RIDER ONBOARDING STEP WIZARD MODAL --- */}
      {showAddWizard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white dark:bg-[#1E1E22] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-left border">
            
            {/* Header step wizard trackers */}
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900">
              <div>
                <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Onboard New Delivery Partner</h3>
                <p className="text-[11px] text-gray-700 dark:text-gray-400">Step {wizardStep} of 4: Fill specifications, document scans and review metadata.</p>
              </div>
              <button onClick={() => setShowAddWizard(false)} className="p-1 hover:bg-stone-100 rounded-full text-stone-700 dark:text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper visual guide line */}
            <div className="grid grid-cols-4 border-b">
              {([
                "1. Personal details",
                "2. Vehicle Asset",
                "3. KYC Credentials",
                "4. Review & Register"
              ]).map((st, sidx) => {
                const stepNum = sidx + 1;
                const isActive = wizardStep === stepNum;
                const isPassed = wizardStep > stepNum;
                return (
                  <div 
                    key={st}
                    className={`p-3 text-center text-[10px] font-black tracking-wide border-r last:border-r-0 transition-colors ${
                      isActive ? "bg-red-50 text-[#E23744] border-b-2 border-b-[#E23744]" :
                      isPassed ? "bg-emerald-50 text-emerald-800" : "bg-gray-50/50 text-stone-700 dark:text-stone-400"
                    }`}
                  >
                    {isPassed ? "✓ " : ""}{st}
                  </div>
                );
              })}
            </div>

            {/* Scrollable form sections */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* STEP 1: PERSONAL INFORMATION */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">Full Legal Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Priyo Ranjan Das"
                        required
                        value={wizardForm.name}
                        onChange={(e) => setWizardForm({ ...wizardForm, name: e.target.value })}
                        className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">Primary Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="10-digit phone number"
                        required
                        value={wizardForm.phone}
                        onChange={(e) => setWizardForm({ ...wizardForm, phone: e.target.value })}
                        className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">Alternate Phone / Landline</label>
                      <input
                        type="tel"
                        placeholder="Secondary contact line"
                        value={wizardForm.altPhone}
                        onChange={(e) => setWizardForm({ ...wizardForm, altPhone: e.target.value })}
                        className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">Active Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. courier@googlydelivery.in"
                        value={wizardForm.email}
                        onChange={(e) => setWizardForm({ ...wizardForm, email: e.target.value })}
                        className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">Present Residential Address *</label>
                    <textarea
                      placeholder="Input complete address block details"
                      rows={3}
                      value={wizardForm.address}
                      onChange={(e) => setWizardForm({ ...wizardForm, address: e.target.value })}
                      className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                    />
                  </div>

                  {/* Profile Photo Mock upload helper */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">Selfie Portrait Image Attachment</label>
                    <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center gap-3.5 bg-gray-50/50">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-[#E23744] flex items-center justify-center font-bold">
                        P
                      </div>
                      <div className="text-left">
                        <button 
                          type="button"
                          onClick={() => {
                            setWizardForm({ ...wizardForm, avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80" });
                            triggerToast("Profile Attachment Bound", "Standard sample snapshot loaded.", "info");
                          }}
                          className="text-xs text-blue-600 hover:underline font-bold"
                        >
                          Auto-attach high contrast sample avatar photo
                        </button>
                        <p className="text-[10px] text-gray-700 dark:text-gray-400 mt-0.5">JPEG, PNG minimum 400x400 size.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: VEHICLE INFORMATION */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">Operational Vehicle Type *</label>
                      <select
                        value={wizardForm.vehicleType}
                        onChange={(e) => setWizardForm({ ...wizardForm, vehicleType: e.target.value as any })}
                        className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E23744] focus:outline-hidden bg-white"
                      >
                        <option value="2-Wheeler (Electric)">2-Wheeler (EV ECO Bike)</option>
                        <option value="2-Wheeler (Fuel)">2-Wheeler (Standard IC Engine)</option>
                        <option value="Bicycle">Non-Motorized Bicycle</option>
                        <option value="3-Wheeler">3-Wheeler Mini Cargo</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">RTO Vehicle Registration plate SKU *</label>
                      <input
                        type="text"
                        placeholder="e.g. WB-02-Y-4921"
                        value={wizardForm.vehicleNumber}
                        onChange={(e) => setWizardForm({ ...wizardForm, vehicleNumber: e.target.value })}
                        className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Document Uploader emulation actions */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border p-4 rounded-xl space-y-2 text-center bg-gray-50/50">
                      <span className="text-[11px] font-black block text-gray-700">RC Blue Book Document</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (wizardForm.rcBookUrl) {
                            setWizardForm({ ...wizardForm, rcBookUrl: "" });
                          } else {
                            setActiveUploadField("rcBookUrl");
                            riderFileRef.current?.click();
                          }
                        }}
                        className="px-3 py-1.5 bg-white border text-[11px] font-bold rounded-lg"
                      >
                        {wizardForm.rcBookUrl ? "Delete Attached Form" : "Upload RC"}
                      </button>
                    </div>

                    <div className="border p-4 rounded-xl space-y-2 text-center bg-gray-50/50">
                      <span className="text-[11px] font-black block text-gray-700">Driving License Paperwork</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (wizardForm.drivingLicenseUrl) {
                            setWizardForm({ ...wizardForm, drivingLicenseUrl: "" });
                          } else {
                            setActiveUploadField("drivingLicenseUrl");
                            riderFileRef.current?.click();
                          }
                        }}
                        className="px-3 py-1.5 bg-white border text-[11px] font-bold rounded-lg"
                      >
                        {wizardForm.drivingLicenseUrl ? "Delete Attached Form" : "Upload DL"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: KYC DETAILS CERTIFICATION */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">Aadhaar Card UID Number *</label>
                      <input
                        type="text"
                        placeholder="12-digit UID code"
                        maxLength={14}
                        value={wizardForm.aadharNumber}
                        onChange={(e) => setWizardForm({ ...wizardForm, aadharNumber: e.target.value })}
                        className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">PAN Permanent Acc Card SKU *</label>
                      <input
                        type="text"
                        placeholder="10-digit Alphanumeric"
                        maxLength={10}
                        value={wizardForm.panNumber}
                        onChange={(e) => setWizardForm({ ...wizardForm, panNumber: e.target.value })}
                        className="w-full border p-2.5 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-[#E23744] focus:outline-hidden uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-center mt-3">
                    <div className="border p-4 rounded-xl space-y-2 text-center bg-gray-50/50">
                      <span className="text-[11px] font-black block text-gray-700">Aadhaar SCAN</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (wizardForm.aadhaarUrl) {
                            setWizardForm({ ...wizardForm, aadhaarUrl: "" });
                          } else {
                            setActiveUploadField("aadhaarUrl");
                            riderFileRef.current?.click();
                          }
                        }}
                        className="px-3 py-1.5 bg-white border text-[11px] font-bold rounded-lg w-full text-gray-700 hover:bg-gray-50"
                      >
                        {wizardForm.aadhaarUrl ? "Delete Uploaded" : "Upload Aadhaar"}
                      </button>
                    </div>

                    <div className="border p-4 rounded-xl space-y-2 text-center bg-gray-50/50">
                      <span className="text-[11px] font-black block text-gray-700">PAN CARD Scan</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (wizardForm.panUrl) {
                            setWizardForm({ ...wizardForm, panUrl: "" });
                          } else {
                            setActiveUploadField("panUrl");
                            riderFileRef.current?.click();
                          }
                        }}
                        className="px-3 py-1.5 bg-white border text-[11px] font-bold rounded-lg w-full text-gray-700 hover:bg-gray-50"
                      >
                        {wizardForm.panUrl ? "Delete Uploaded" : "Upload PAN"}
                      </button>
                    </div>

                    <div className="border p-4 rounded-xl space-y-2 text-center bg-gray-50/50">
                      <span className="text-[11px] font-black block text-gray-700">Selfie Camera</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (wizardForm.selfieUrl) {
                            setWizardForm({ ...wizardForm, selfieUrl: "" });
                          } else {
                            setActiveUploadField("selfieUrl");
                            riderFileRef.current?.click();
                          }
                        }}
                        className="px-3 py-1.5 bg-white border text-[11px] font-bold rounded-lg w-full text-gray-700 hover:bg-gray-50"
                      >
                        {wizardForm.selfieUrl ? "Delete Capture" : "Capture Selfie"}
                      </button>
                    </div>
                  </div>

                  <input 
                    type="file" 
                    className="hidden" 
                    ref={riderFileRef} 
                    onChange={handleRiderFileUpload}
                  />
                </div>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span>Forms validated. Documents verified with digital hash signatures.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-4 border rounded-2xl text-xs text-left">
                    <div>
                      <span className="text-gray-700 dark:text-gray-400 block pb-1">Partner Full Name</span>
                      <strong className="text-gray-900 font-bold">{wizardForm.name || "N/A"}</strong>
                    </div>
                    <div>
                      <span className="text-gray-700 dark:text-gray-400 block pb-1">Mobile Contact Phone Number</span>
                      <strong className="text-gray-900 font-bold">{wizardForm.phone || "N/A"}</strong>
                    </div>
                    <div className="pt-2">
                      <span className="text-gray-700 dark:text-gray-400 block pb-1">Assigned Fleet Category</span>
                      <strong className="text-gray-900 font-bold">{wizardForm.vehicleType}</strong>
                    </div>
                    <div className="pt-2">
                      <span className="text-gray-700 dark:text-gray-400 block pb-1">Vehicle License Plate</span>
                      <strong className="text-gray-900 font-mono uppercase">{wizardForm.vehicleNumber || "N/A"}</strong>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-gray-100">
                      <span className="text-gray-700 dark:text-gray-400 block pb-0.5">Identity Documents Check</span>
                      <span className="text-emerald-700 font-bold block">✓ Aadhaar Card & PAN Document verified.</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Step Wizard Action bounds */}
            <div className="p-5 border-t bg-stone-50 dark:bg-gray-900 flex justify-between items-center">
              
              <button
                type="button"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep(prev => (prev - 1) as any)}
                className="px-4 py-2 border hover:bg-stone-100 disabled:opacity-40 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Back Step
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOnboardSubmit("draft")}
                  className="px-4 py-2 hover:bg-stone-200 text-stone-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Save Draft
                </button>

                {wizardStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep(prev => (prev + 1) as any)}
                    className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-black rounded-xl transition-all cursor-pointer"
                  >
                    Next Stage
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOnboardSubmit("submit")}
                    className="px-5 py-2 bg-[#E23744] hover:bg-red-700 text-white text-xs font-black rounded-xl transition-all shadow cursor-pointer"
                  >
                    Submit Verification Onboard
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- KYC DOCUMENT INSPECTION AND APPROVAL STATION MODAL --- */}
      {verifyingRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white dark:bg-[#1E1E22] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border">
            
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#E23744]" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">KYC Verification Station</h3>
                  <p className="text-[10px] text-gray-700 dark:text-gray-400 mt-0.5">Rider ID: {verifyingRider.id} • {verifyingRider.name}</p>
                </div>
              </div>
              <button onClick={() => setVerifyingRider(null)} className="p-1 hover:bg-stone-100 rounded-full text-stone-700 dark:text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document listings layouts */}
            <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5 text-xs">
              
              {/* Document grids */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Selfie match check */}
                <div className="border p-3.5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block">Digital Portrait Match</span>
                  <div className="h-36 rounded-lg bg-stone-100 overflow-hidden relative border">
                    <img src={verifyingRider.kycDetails.selfieUrl} alt="Selfie" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-2 left-2 bg-emerald-600 text-white font-bold p-0.5 px-2 rounded-md text-[9px]">Selfie Verified Match (98%)</span>
                  </div>
                </div>

                {/* Aadhaar match check */}
                <div className="border p-3.5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block">Government Aadhaar scan UID</span>
                  <div className="h-36 rounded-lg bg-stone-100 overflow-hidden relative border">
                    <img src={verifyingRider.kycDetails.aadhaarUrl} alt="Aadhaar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-2 left-2 bg-slate-900 text-white font-mono p-0.5 px-1.5 rounded text-[9px]">{verifyingRider.aadharNumber}</span>
                  </div>
                </div>

                {/* Driving License details */}
                <div className="border p-3.5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block">Driving License Paperwork</span>
                  <div className="h-36 rounded-lg bg-stone-100 overflow-hidden relative border">
                    <img src={verifyingRider.kycDetails.drivingLicenseUrl} alt="DL" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-2 left-2 bg-slate-900 text-white font-bold p-0.5 px-1.5 rounded text-[9px]">Class LMV Category</span>
                  </div>
                </div>

                {/* RTO blue book details */}
                <div className="border p-3.5 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block">Vehicle Registration RC Booklet</span>
                  <div className="h-36 rounded-lg bg-stone-100 overflow-hidden relative border">
                    <img src={verifyingRider.kycDetails.rcBookUrl} alt="RC" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-2 left-2 bg-slate-900 text-white font-bold p-0.5 px-1.5 rounded text-[9px] uppercase">{verifyingRider.vehicleNumber}</span>
                  </div>
                </div>

              </div>

              {/* Reject drawer section if action initialized */}
              {showRejectPanel ? (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 space-y-3">
                  <div className="font-bold text-[#E23744]">Log rejection reasons & notes</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold block text-gray-500 mb-1">Discrepancy trigger code *</label>
                      <select
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white font-bold text-xs"
                      >
                        <option value="">-- Choose reason --</option>
                        <option value="Invalid Aadhaar">Invalid / Misaligned Aadhaar</option>
                        <option value="Invalid PAN">Invalid / Misaligned PAN</option>
                        <option value="Blurry Documents">Blurry scans / Unreadable texts</option>
                        <option value="Expired License">Expired Driving License Paperwork</option>
                        <option value="Incorrect Information">Address discrepancy checks failed</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold block text-gray-500 mb-1">Additional Notes</label>
                      <input
                        type="text"
                        placeholder="e.g. Please re-upload high contrast scan"
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        className="w-full p-2 border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1.5">
                    <button
                      onClick={() => setShowRejectPanel(false)}
                      className="px-3 py-1.5 hover:bg-stone-200 text-stone-600 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRejectKYC(verifyingRider)}
                      className="px-4 py-1.5 bg-[#E23744] hover:bg-red-700 text-white rounded-lg font-black"
                    >
                      Confirm Rejection Dispatch
                    </button>
                  </div>
                </div>
              ) : null}

            </div>

            {/* Action buttons footer */}
            <div className="p-5 border-t bg-stone-50 dark:bg-gray-900 flex justify-between">
              
              <button
                onClick={() => setShowRejectPanel(true)}
                className="px-4 py-2 border hover:bg-red-50 hover:text-[#E23744] rounded-xl text-xs font-bold transition-all text-center"
              >
                Reject Onboard Application
              </button>

              <button
                onClick={() => handleApproveKYC(verifyingRider)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                Approve & Register Partner
              </button>

            </div>

          </div>
        </div>
      )}

      {/* --- WALLET SETTLEMENTS & ADJUSTMENTS CONTROL MODAL --- */}
      {walletRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white dark:bg-[#1E1E22] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border">
            
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Wallet Management Station</h3>
                  <p className="text-[10px] text-gray-700 dark:text-gray-400 mt-0.5">{walletRider.id} • {walletRider.name}</p>
                </div>
              </div>
              <button onClick={() => setWalletRider(null)} className="p-1 hover:bg-stone-100 rounded-full text-stone-700 dark:text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-left">
              
              {/* Balances grids */}
              <div className="grid grid-cols-2 gap-3.5 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10">
                <div>
                  <span className="text-gray-700 dark:text-gray-400 text-[10px]">Current Wallet balance</span>
                  <strong className="block text-2xl font-black text-emerald-600 mt-1">₹{walletRider.walletBalance}</strong>
                </div>
                <div>
                  <span className="text-gray-700 dark:text-gray-400 text-[10px]">Monthly aggregate earnings</span>
                  <strong className="block text-xl font-bold text-gray-800 dark:text-white mt-1">₹{walletRider.monthlyEarnings}</strong>
                </div>
              </div>

              {/* Transactions Type */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400">Adjustment entry formula *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "bonus", val: "Add Incentive Bonus" },
                    { key: "penalty", val: "Deduct Penalty fee" },
                    { key: "payout", val: "Release Settlement Payout" }
                  ].map(bt => (
                    <button
                      key={bt.key}
                      onClick={() => setWalletTxType(bt.key as any)}
                      className={`p-2.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${
                        walletTxType === bt.key 
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/10" 
                          : "bg-white border-gray-200 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      {bt.val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-400">Ledger INR Value *</label>
                  <input
                    type="number"
                    placeholder="₹ ₹"
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs font-bold text-center focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-700 dark:text-gray-400">Remarks justification note</label>
                  <input
                    type="text"
                    placeholder="e.g. Completed weekend delivery streak bonuses"
                    value={walletNote}
                    onChange={(e) => setWalletNote(e.target.value)}
                    className="w-full p-2.5 border rounded-xl text-xs focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {/* Mini history logs */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-stone-700 dark:text-stone-400 tracking-wider">Adjustment ledger history</span>
                <div className="border rounded-xl divide-y max-h-40 overflow-y-auto">
                  {(walletTxLogs[walletRider.id] || []).length === 0 ? (
                    <div className="p-4 text-center text-[10px] text-gray-700 dark:text-gray-400">No manual ledger adjustments filed in this operations session.</div>
                  ) : (
                    walletTxLogs[walletRider.id].map(lg => (
                      <div key={lg.id} className="p-2.5 flex justify-between items-center text-[11px]">
                        <div>
                          <strong className="block text-gray-800">{lg.type}</strong>
                          <span className="text-[9px] text-gray-700 dark:text-gray-400 block mt-0.5">{lg.timestamp} • {lg.note}</span>
                        </div>
                        <span className={`font-black ${lg.type.includes("Incentive") ? "text-emerald-600" : "text-rose-600"}`}>
                          {lg.type.includes("Incentive") ? "+" : "-"} ₹{lg.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Action footer */}
            <div className="p-5 border-t bg-stone-50 dark:bg-gray-900 flex justify-end gap-2">
              <button
                onClick={() => setWalletRider(null)}
                className="px-4 py-2 hover:bg-stone-200 text-stone-600 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteWalletTx}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl"
              >
                Commit Ledger entry
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- EDIT RIDER MODAL --- */}
      {editingRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white dark:bg-[#1E1E22] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-300 dark:border-gray-800">
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#E23744]" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Edit Fleet Partner Profile</h3>
                  <p className="text-[10px] text-gray-700 dark:text-gray-400 mt-0.5">ID: {editingRider.id}</p>
                </div>
              </div>
              <button onClick={() => setEditingRider(null)} className="p-1 hover:bg-stone-100 dark:hover:bg-gray-800 rounded-full text-stone-700 dark:text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRiderEdit} className="p-6 space-y-4 text-xs text-left">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block mb-1">Rider Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingRider.name}
                  onChange={(e) => setEditingRider({ ...editingRider, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editingRider.phone}
                    onChange={(e) => setEditingRider({ ...editingRider, phone: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block mb-1">Vehicle Asset *</label>
                  <input
                    type="text"
                    required
                    value={editingRider.vehicleNumber}
                    onChange={(e) => setEditingRider({ ...editingRider, vehicleNumber: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block mb-1">Vehicle Type *</label>
                  <select
                    value={editingRider.vehicleType}
                    onChange={(e) => setEditingRider({ ...editingRider, vehicleType: e.target.value as any })}
                    className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-stone-900 dark:text-white cursor-pointer"
                  >
                    <option value="2-Wheeler (Electric)">2-Wheeler (Electric)</option>
                    <option value="2-Wheeler (Fuel)">2-Wheeler (Fuel)</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block mb-1">Operation Status *</label>
                  <select
                    value={editingRider.status}
                    onChange={(e) => setEditingRider({ ...editingRider, status: e.target.value as any })}
                    className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-stone-900 dark:text-white cursor-pointer"
                  >
                    <option value="Online">Online / Shift Clocked In</option>
                    <option value="On-Delivery">On Delivery / Engaged</option>
                    <option value="Offline">Offline / Logged Out</option>
                    <option value="Suspended">Suspended / Blocked</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-[10px] text-gray-700 dark:text-gray-400 text-stone-500 leading-normal">
                Editing active fleet credentials will instantly synchronize the partner state. Please double-check operational zone clearance and registration rules before confirming records.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRider(null)}
                  className="px-4 py-2 hover:bg-stone-200 text-stone-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  Save Operations Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW ASSIGNED ORDERS MODAL --- */}
      {viewAssignedOrdersRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white dark:bg-[#1E1E22] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-300 dark:border-gray-800 animate-scale-up">
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-[#EAEEF6] dark:bg-gray-900">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-purple-600 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Active Assigned Tasks</h3>
                  <p className="text-[10px] text-gray-700 dark:text-gray-400 mt-0.5">{viewAssignedOrdersRider.id} • {viewAssignedOrdersRider.name}</p>
                </div>
              </div>
              <button onClick={() => setViewAssignedOrdersRider(null)} className="p-1 hover:bg-stone-200/50 rounded-full text-stone-700 dark:text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto text-xs text-left">
              {orders.filter(o => o.riderId === viewAssignedOrdersRider.id && o.status !== "Delivered" && o.status !== "Cancelled").length === 0 ? (
                <div className="p-12 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-gray-50 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center mx-auto text-lg font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-700">No active deliveries currently</h4>
                    <p className="text-[10px] text-gray-700 dark:text-gray-400 max-w-xs mx-auto leading-normal mt-1">This driver is either clock-off or waiting on the nearby hubs to receive food assignment requests.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.filter(o => o.riderId === viewAssignedOrdersRider.id && o.status !== "Delivered" && o.status !== "Cancelled").map(od => (
                    <div key={od.id} className="p-4 border rounded-2xl bg-gray-50/50 dark:bg-gray-900/55 flex flex-col sm:flex-row justify-between gap-4 border-gray-200 dark:border-gray-800">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-900 text-[9px] font-black px-2 py-0.5 rounded-full">
                            {od.status}
                          </span>
                          <span className="font-mono font-bold text-stone-700 dark:text-stone-400">#{od.id}</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-gray-800 dark:text-white">Restaurant: <span className="text-stone-600 dark:text-stone-300 font-extrabold">{od.restaurantName}</span></p>
                          <p className="text-gray-500 font-medium">Destination Address: <span className="text-stone-900 dark:text-stone-200">{od.address}</span></p>
                          <p className="text-[10px] text-stone-700 dark:text-stone-400 font-mono">Timestamp Placed: {od.orderTime}</p>
                        </div>
                      </div>

                      <div className="sm:text-right flex flex-col justify-between items-start sm:items-end shrink-0">
                        <div>
                          <strong className="block text-base font-black text-gray-900 dark:text-white">₹{od.billDetail.total}</strong>
                          <span className="text-[9px] text-[#E23744] font-black uppercase tracking-wider block mt-0.5">Payout share: ₹{Math.floor(od.billDetail.delivery * 0.85)}</span>
                        </div>
                        <button
                          onClick={() => {
                            setViewAssignedOrdersRider(null);
                            startTracking(viewAssignedOrdersRider);
                          }}
                          className="mt-3 px-3 py-1 bg-white border hover:bg-stone-50 text-stone-800 font-bold rounded-lg text-[10px] shadow-xs cursor-pointer"
                        >
                          Track Live Map
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 border-t bg-stone-50 dark:bg-gray-900 flex justify-end">
              <button
                onClick={() => setViewAssignedOrdersRider(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Close Task view
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BROADCAST ALERTS MODAL --- */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white dark:bg-[#1E1E22] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-300 dark:border-gray-800">
            <div className="p-5 border-b dark:border-gray-800 flex justify-between items-center bg-blue-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Broadcast Alerts Composer</h3>
                  <p className="text-[10px] text-gray-700 dark:text-gray-400 mt-0.5">Contacting <strong className="text-blue-600">{bulkSelection.length} selected partners</strong> directly</p>
                </div>
              </div>
              <button onClick={() => setShowNotificationModal(false)} className="p-1 hover:bg-stone-200 rounded-full text-stone-700 dark:text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-left">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-400 block mb-1.5">Notification Message Alert</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write notification message e.g. Extreme high demand rain alert: ₹15 surcharge bonus active in Salt Lake zone! Drive safe!"
                  value={bulkNotificationText}
                  onChange={(e) => setBulkNotificationText(e.target.value)}
                  className="w-full p-3 border rounded-2xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder-gray-300 dark:placeholder-gray-650 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                />
              </div>

              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900 text-[10.5px] text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                This broadcasting transmission will trigger instant mobile push alerts, telemetry audio chirps, and shift dashboard notifications to the {bulkSelection.length} selected partners.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2 hover:bg-stone-200 dark:hover:bg-gray-800 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!bulkNotificationText.trim()) {
                      triggerToast("Blank Alert", "Please compose an alert string before sending.", "error");
                      return;
                    }
                    // Dispatch success
                    triggerToast("Broadcast Sent", `Alert sent to ${bulkSelection.length} rider accounts successfully.`, "success");
                    
                    // Log for each rider
                    bulkSelection.forEach(riderId => {
                      const riderObj = riders.find(r => r.id === riderId);
                      addOperationLog(riderId, riderObj ? riderObj.name : "Driver", "Admin Notice Dispatch", `Broadcast sent: "${bulkNotificationText}"`, "success");
                    });

                    setBulkNotificationText("");
                    setBulkSelection([]);
                    setShowNotificationModal(false);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Transmit Message Alert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- REUSABLE SAAS CONFIRMATION DIALOG MODAL --- */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4">
          <div className="bg-white dark:bg-[#1E1E22] w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 border-t-8 border-[#E23744] text-center text-xs text-left">
            
            <div className="w-12 h-12 bg-red-50 text-[#E23744] rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
              ⚠
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-gray-900 dark:text-gray-100 text-sm">{confirmDialog.title}</h3>
              <p className="text-gray-700 dark:text-gray-400 text-stone-500 leading-relaxed text-xs">{confirmDialog.message}</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 border hover:bg-stone-100 text-stone-600 dark:text-gray-300 rounded-xl font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-2.5 bg-[#E23744] hover:bg-red-700 text-white rounded-xl font-black transition-all cursor-pointer"
              >
                Confirm Command
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- FLOATING / BOTTOM PANEL: ACTIVITY HISTORY AUDIT SHUTTLE --- */}
      <div className="mx-6 p-4 rounded-2xl border bg-gray-50/50 dark:bg-[#1E1E22]/50 border-gray-200 text-left mt-4 space-y-3.5 mb-12">
        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex items-center gap-1.5 font-bold">
            <History className="w-4.5 h-4.5 text-[#E23744]" />
            <span className="text-xs text-gray-800">Operational Log Transactions Ledger</span>
          </div>
          <button 
            onClick={() => {
              setActivityLogs([
                { id: "log-seed", timestamp: new Date().toLocaleTimeString(), riderId: "SYSTEM", riderName: "Platform Node", type: "Logs Seeded", message: "Logs indices flunked.", severity: "info" }
              ]);
            }}
            className="text-[10px] text-gray-700 dark:text-gray-400 hover:text-[#E23744] hover:underline"
          >
            Clear logs history
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-40 overflow-y-auto pr-1">
          {activityLogs.map((log) => (
            <div 
              key={log.id} 
              className={`p-2.5 border rounded-xl flex gap-2.5 text-[11px] items-start ${
                log.severity === "success" ? "bg-emerald-500/5 border-emerald-500/10" :
                log.severity === "error" ? "bg-red-500/5 border-red-500/10" : "bg-white border-stone-200"
              }`}
            >
              <div className="shrink-0 font-bold text-gray-700 dark:text-gray-400 font-mono text-[9px] mt-0.5">{log.timestamp}</div>
              <div className="space-y-0.5 truncate text-left">
                <div className="font-extrabold text-stone-800 block">
                  [{log.riderId}] {log.type}
                </div>
                <p className="text-[10px] text-stone-500 truncate mt-0.5">{log.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- PERMANENT RIDER DELETION CONFIRMATION MODAL --- */}
      {deleteRiderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 animate-fade-in text-left">
          <div className="bg-white dark:bg-[#1C1C21] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-red-200 dark:border-red-900/30 animate-scale-up">
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Delete Rider Account?</h3>
              </div>
              <button onClick={() => setDeleteRiderId(null)} className="p-1 hover:bg-red-100 rounded-full text-red-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                Warning: You are about to permanently delete rider <strong className="text-red-600 font-black">{riders.find(r => r.id === deleteRiderId)?.name}</strong>. 
                This will irretrievably remove their fleet registry, active delivery assignments, and historical logs from active operational clusters.
              </p>
              
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-100 dark:border-amber-900/30 text-[10px] font-bold text-center">
                Wallet balances and bank settlement records may persist in auditing ledgers for tax compliance.
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={executeDeleteRider}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  Confirm Permanent Deletion
                </button>
                <button 
                  onClick={() => setDeleteRiderId(null)}
                  className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer text-center"
                >
                  Dismiss Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
