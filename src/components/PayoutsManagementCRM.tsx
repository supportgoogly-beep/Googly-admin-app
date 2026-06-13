import React, { useState, useMemo } from "react";
import { 
  DollarSign, Percent, TrendingUp, TrendingDown, Calendar, 
  Settings, Save, RotateCcw, AlertTriangle, ArrowUpRight, 
  ArrowDownRight, CheckCircle2, XCircle, Clock, Search, 
  Download, FileText, FileSpreadsheet, Eye, Send, ArrowRight,
  Shield, Check, Play, User, RefreshCw, AlertOctagon, HelpCircle,
  TrendingUp as TrendUp, Layers, Info
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar 
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";

// Interfaces
interface RestaurantFinance {
  id: string;
  name: string;
  totalOrders: number;
  grossRevenue: number;
  platformCommission: number;
  taxes: number;
  netEarnings: number;
  pendingAmount: number;
  lastSettlementDate: string;
  status: "Pending" | "Processing" | "Completed" | "Failed" | "On Hold";
  overrideCommission?: number;
}

interface RiderFinance {
  id: string;
  name: string;
  completedDeliveries: number;
  baseEarnings: number;
  incentives: number;
  bonuses: number;
  penalties: number;
  netEarnings: number;
  pendingAmount: number;
  lastPayoutDate: string;
  status: "Pending" | "Processing" | "Completed" | "Failed" | "On Hold";
}

interface PayoutHistoryItem {
  id: string;
  beneficiaryName: string;
  beneficiaryType: "Restaurant" | "Rider";
  amount: number;
  paymentMethod: string;
  settlementDate: string;
  status: "Completed" | "Processing" | "Failed" | "Schedule-Pending";
  referenceNumber: string;
}

interface AuditLog {
  timestamp: string;
  author: string;
  action: string;
  detail: string;
}

interface PayoutsManagementCRMProps {
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function PayoutsManagementCRM({ triggerToast }: PayoutsManagementCRMProps) {
  // Date range state
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days">("7days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isCustomDate, setIsCustomDate] = useState(false);

  // Commission controls
  const [commissionModel, setCommissionModel] = useState<"Fixed Percentage" | "Fixed Amount" | "Hybrid Commission Model">("Fixed Percentage");
  const [globalCommissionPct, setGlobalCommissionPct] = useState(18);
  const [fixedAmountValue, setFixedAmountValue] = useState(45); // e.g. flats per order
  const [riderCommissionBase, setRiderCommissionBase] = useState(50); // ₹ per delivery base fee
  const [deliveryFeeSharing, setDeliveryFeeSharing] = useState(80); // % of delivery fee shared with rider
  const [taxAndServiceFeePct, setTaxAndServiceFeePct] = useState(5.0);

  // Overrides per restaurant name search matching
  const [restaurantOverrides, setRestaurantOverrides] = useState<Array<{ name: string; overridePct: number }>>([
    { name: "Swadh Bengal Restaurant", overridePct: 15 },
    { name: "Cheesy Crust Parlor", overridePct: 12 },
    { name: "Grand Biryani Darbar", overridePct: 16 }
  ]);
  const [newOverrideRest, setNewOverrideRest] = useState("");
  const [newOverrideVal, setNewOverrideVal] = useState(15);

  // Safety Confirmation overlay
  const [showCommissionWarning, setShowCommissionWarning] = useState(false);
  const [pendingCommissionModelChange, setPendingCommissionModelChange] = useState<any>(null);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { timestamp: "2026-06-12 10:20:11", author: "Rohan P. (Admin)", action: "Commission Change", detail: "Global Percentage updated from 15% to 18%" },
    { timestamp: "2026-06-11 14:15:30", author: "System Auto-Trigger", action: "SLA Adjustment", detail: "Rider delivery fee split calibrated to 80% to retain drivers during heavy showers" },
    { timestamp: "2026-06-08 09:12:00", author: "Abhishek S.", action: "Restaurant Override", detail: "Set Cheesy Crust Parlor override discount rate to 12% permanently" }
  ]);

  // Restaurant Ledger Accounts
  const [restaurantsLedger, setRestaurantsLedger] = useState<RestaurantFinance[]>([
    { id: "REST-301", name: "Swadh Bengal Restaurant", totalOrders: 114, grossRevenue: 85500, platformCommission: 12825, taxes: 4275, netEarnings: 68400, pendingAmount: 4220, lastSettlementDate: "2026-06-05", status: "Pending", overrideCommission: 15 },
    { id: "REST-302", name: "Cheesy Crust Parlor", totalOrders: 78, grossRevenue: 46800, platformCommission: 5616, taxes: 2340, netEarnings: 38844, pendingAmount: 1850, lastSettlementDate: "2026-06-05", status: "Pending", overrideCommission: 12 },
    { id: "REST-303", name: "Royal Mughal Cuisine", totalOrders: 142, grossRevenue: 124000, platformCommission: 22320, taxes: 6200, netEarnings: 95480, pendingAmount: 12400, lastSettlementDate: "2026-06-01", status: "Processing" },
    { id: "REST-304", name: "The Green Salad Hub", totalOrders: 42, grossRevenue: 18900, platformCommission: 3402, taxes: 945, netEarnings: 14553, pendingAmount: 0, lastSettlementDate: "2026-06-10", status: "Completed" },
    { id: "REST-305", name: "Momos Junction Extra", totalOrders: 290, grossRevenue: 98000, platformCommission: 17640, taxes: 4900, netEarnings: 75460, pendingAmount: 0, lastSettlementDate: "2026-06-11", status: "Completed" },
    { id: "REST-306", name: "Waffle Wonders", totalOrders: 21, grossRevenue: 6400, platformCommission: 1152, taxes: 320, netEarnings: 4928, pendingAmount: 420, lastSettlementDate: "2026-05-28", status: "Failed" },
    { id: "REST-307", name: "Biryani Express Master", totalOrders: 99, grossRevenue: 59400, platformCommission: 10692, taxes: 2970, netEarnings: 45738, pendingAmount: 3100, lastSettlementDate: "2026-06-03", status: "On Hold" }
  ]);

  // Rider Earnings Ledger Accounts
  const [ridersLedger, setRidersLedger] = useState<RiderFinance[]>([
    { id: "M9X4R1", name: "Amit Kumar Shaw", completedDeliveries: 45, baseEarnings: 2250, incentives: 350, bonuses: 500, penalties: 50, netEarnings: 3050, pendingAmount: 1250, lastPayoutDate: "2026-06-05", status: "Pending" },
    { id: "V8K3A2", name: "Vikram Das", completedDeliveries: 38, baseEarnings: 1900, incentives: 280, bonuses: 200, penalties: 0, netEarnings: 2380, pendingAmount: 420, lastPayoutDate: "2026-06-05", status: "Pending" },
    { id: "Y7N2W6", name: "Suresh Mukherjee", completedDeliveries: 92, baseEarnings: 4600, incentives: 1200, bonuses: 900, penalties: 100, netEarnings: 6600, pendingAmount: 4300, lastPayoutDate: "2026-06-01", status: "Processing" },
    { id: "H5J8Q1", name: "Rahul Dev Prasad", completedDeliveries: 12, baseEarnings: 600, incentives: 50, bonuses: 0, penalties: 150, netEarnings: 500, pendingAmount: 0, lastPayoutDate: "2026-06-10", status: "Completed" },
    { id: "K3V9C4", name: "Deepak Rawat", completedDeliveries: 54, baseEarnings: 2700, incentives: 450, bonuses: 300, penalties: 0, netEarnings: 3450, pendingAmount: 0, lastPayoutDate: "2026-06-11", status: "Completed" },
    { id: "G2X1L8", name: "Subhasis Roy", completedDeliveries: 31, baseEarnings: 1550, incentives: 180, bonuses: 250, penalties: 200, netEarnings: 1780, pendingAmount: 900, lastPayoutDate: "2026-05-25", status: "Failed" }
  ]);

  // Batch transfer modal state controls
  const [showBatchSettleModal, setShowBatchSettleModal] = useState(false);
  const [batchTargetType, setBatchTargetType] = useState<"Restaurants" | "Riders" | "All Pending">("All Pending");
  const [bankMethod, setBankMethod] = useState("Direct NEFT / Corporate Handshake");
  const [payoutScheduleType, setPayoutScheduleType] = useState<"instant" | "later">("instant");
  const [scheduledTime, setScheduledTime] = useState("2026-06-13T12:00");

  // Historic Payouts List
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryItem[]>([
    { id: "TXN-88120", beneficiaryName: "Swadh Bengal Restaurant", beneficiaryType: "Restaurant", amount: 14200, paymentMethod: "Direct NEFT", settlementDate: "2026-06-05", status: "Completed", referenceNumber: "REF-BK10912X" },
    { id: "TXN-88121", beneficiaryName: "Cheesy Crust Parlor", beneficiaryType: "Restaurant", amount: 8900, paymentMethod: "IMPS Transfer", settlementDate: "2026-06-05", status: "Completed", referenceNumber: "REF-BK10913X" },
    { id: "TXN-88122", beneficiaryName: "Amit Kumar Shaw", beneficiaryType: "Rider", amount: 1800, paymentMethod: "UPI Payout", settlementDate: "2026-06-05", status: "Completed", referenceNumber: "REF-BK2100A3" },
    { id: "TXN-88123", beneficiaryName: "Vikram Das", beneficiaryType: "Rider", amount: 1960, paymentMethod: "UPI Payout", settlementDate: "2026-06-05", status: "Completed", referenceNumber: "REF-BK2100B9" },
    { id: "TXN-88124", beneficiaryName: "Grand Biryani Darbar", beneficiaryType: "Restaurant", amount: 31050, paymentMethod: "Direct NEFT", settlementDate: "2026-06-01", status: "Completed", referenceNumber: "REF-BK10815X" },
    { id: "TXN-88125", beneficiaryName: "Waffle Wonders", beneficiaryType: "Restaurant", amount: 4920, paymentMethod: "IMPS Transfer", settlementDate: "2026-05-28", status: "Failed", referenceNumber: "ERR-99120-REJ" },
    { id: "TXN-88126", beneficiaryName: "Subhasis Roy", beneficiaryType: "Rider", amount: 1250, paymentMethod: "UPI Payout", settlementDate: "2026-05-25", status: "Failed", referenceNumber: "ERR-91225-BAD" }
  ]);

  // History search/filters state
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("All");
  const [historyMinAmount, setHistoryMinAmount] = useState(0);
  const [historyMaxAmount, setHistoryMaxAmount] = useState(50000);

  // Drilldown overlay view modals
  const [selectedLedgerDetails, setSelectedLedgerDetails] = useState<{ type: "restaurant" | "rider"; data: any } | null>(null);

  // Dynamic values based on date range selection
  const statistics = useMemo(() => {
    let scalar = 1.0;
    if (dateRange === "today") scalar = 0.15;
    else if (dateRange === "7days") scalar = 1.0;
    else scalar = 3.6;

    const baseRev = Math.round(435400 * scalar);
    const baseComm = Math.round(78300 * scalar);
    
    // Sum from actual pending states
    const owedToRes = restaurantsLedger.filter(r => r.status === "Pending").reduce((acc, cr) => acc + cr.pendingAmount, 0);
    const owedToRiders = ridersLedger.filter(r => r.status === "Pending").reduce((acc, cr) => acc + cr.pendingAmount, 0);

    const completedPayoutsNum = Math.round(314500 * scalar);
    const pendingPayoutsNum = Math.round((owedToRes + owedToRiders) * scalar);
    const failedPayoutsNum = Math.round(6170 * (dateRange === "today" ? 0 : 1));

    return {
      revenue: baseRev,
      commission: baseComm,
      owedRestaurants: owedToRes,
      owedRiders: owedToRiders,
      completed: completedPayoutsNum,
      pending: pendingPayoutsNum,
      failed: failedPayoutsNum
    };
  }, [dateRange, restaurantsLedger, ridersLedger]);

  // Chart data simulation
  const financialChartData = useMemo(() => {
    return [
      { name: "Day 1", OrdersRevenue: 42000, PlatformCut: 7560, DisbursedPayouts: 31000 },
      { name: "Day 2", OrdersRevenue: 51000, PlatformCut: 9180, DisbursedPayouts: 42000 },
      { name: "Day 3", OrdersRevenue: 38000, PlatformCut: 6840, DisbursedPayouts: 29000 },
      { name: "Day 4", OrdersRevenue: 64000, PlatformCut: 11520, DisbursedPayouts: 50000 },
      { name: "Day 5", OrdersRevenue: 72000, PlatformCut: 12960, DisbursedPayouts: 58000 },
      { name: "Day 6", OrdersRevenue: 89000, PlatformCut: 16020, DisbursedPayouts: 71000 },
      { name: "Day 7", OrdersRevenue: 79000, PlatformCut: 14220, DisbursedPayouts: 65000 }
    ];
  }, []);

  // Handlers for overrides
  const handleAddOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOverrideRest) return;
    setRestaurantOverrides(prev => [
      ...prev,
      { name: newOverrideRest, overridePct: newOverrideVal }
    ]);
    triggerToast("Override Appended", `Applied overrides for ${newOverrideRest}: ${newOverrideVal}%`, "success");
    setNewOverrideRest("");
  };

  const handleRemoveOverride = (name: string) => {
    setRestaurantOverrides(prev => prev.filter(o => o.name !== name));
    triggerToast("Override Revoked", `Reverted ${name} to master commission level.`, "info");
  };

  // Safe save changes commission
  const handleVerifyAndSaveCommission = () => {
    // Stage warning modal
    setPendingCommissionModelChange({
      model: commissionModel,
      globalPct: globalCommissionPct,
      fixedAmount: fixedAmountValue,
      sharing: deliveryFeeSharing,
      riderBase: riderCommissionBase,
      tax: taxAndServiceFeePct
    });
    setShowCommissionWarning(true);
  };

  const confirmCommissionChanges = () => {
    if (!pendingCommissionModelChange) return;

    // Log the action is audited
    const now = new Date().toISOString().replace("T", " ").substring(0, 19);
    setAuditLogs(prev => [
      {
        timestamp: now,
        author: "Root Security admin",
        action: "Model Calibration",
        detail: `Shifted base config model to: [${pendingCommissionModelChange.model}]. Global base: ${pendingCommissionModelChange.globalPct}%. Rider base: ₹${pendingCommissionModelChange.riderBase}`
      },
      ...prev
    ]);

    triggerToast("Contract Recalibrated", "New commission rules parsed successfully. Future settlements affected.", "success");
    setShowCommissionWarning(false);
    setPendingCommissionModelChange(null);
  };

  // Reset commission back
  const handleResetCommissionSettings = () => {
    setCommissionModel("Fixed Percentage");
    setGlobalCommissionPct(18);
    setFixedAmountValue(45);
    setRiderCommissionBase(50);
    setDeliveryFeeSharing(80);
    setTaxAndServiceFeePct(5.0);
    triggerToast("Configurations Restored", "Commission schema reverted to legacy defaults.", "info");
  };

  // Settlement processes trigger
  const handleOpenSettleModal = (type: "Restaurants" | "Riders" | "All Pending") => {
    setBatchTargetType(type);
    setShowBatchSettleModal(true);
  };

  const executeSettleTransfers = () => {
    // 1. Target updates status in local ledgers for current records
    const referenceId = `REF-SETTLE-${Math.floor(Math.random() * 89999 + 10000)}`;
    const nowLocalDate = new Date().toISOString().substring(0, 10);
    let totalTransfersProcessed = 0;

    if (batchTargetType === "Restaurants" || batchTargetType === "All Pending") {
      setRestaurantsLedger(prev => prev.map(rest => {
        if (rest.status === "Pending") {
          totalTransfersProcessed += rest.pendingAmount;
          // Append history record
          setPayoutHistory(old => [
            {
              id: `TXN-${Math.floor(Math.random() * 89999 + 10000)}`,
              beneficiaryName: rest.name,
              beneficiaryType: "Restaurant",
              amount: rest.pendingAmount,
              paymentMethod: bankMethod,
              settlementDate: nowLocalDate,
              status: "Completed",
              referenceNumber: referenceId
            },
            ...old
          ]);
          return { ...rest, pendingAmount: 0, status: "Completed", lastSettlementDate: nowLocalDate };
        }
        return rest;
      }));
    }

    if (batchTargetType === "Riders" || batchTargetType === "All Pending") {
      setRidersLedger(prev => prev.map(rider => {
        if (rider.status === "Pending") {
          totalTransfersProcessed += rider.pendingAmount;
          // Convert to historical record
          setPayoutHistory(old => [
            {
              id: `TXN-${Math.floor(Math.random() * 89999 + 10000)}`,
              beneficiaryName: rider.name,
              beneficiaryType: "Rider",
              amount: rider.pendingAmount,
              paymentMethod: bankMethod,
              settlementDate: nowLocalDate,
              status: "Completed",
              referenceNumber: referenceId
            },
            ...old
          ]);
          return { ...rider, pendingAmount: 0, status: "Completed", lastPayoutDate: nowLocalDate };
        }
        return rider;
      }));
    }

    setShowBatchSettleModal(false);
    triggerToast("Settlement Cleared Successfully", `Disbursed automated batch payouts of ₹${totalTransfersProcessed} via ${bankMethod}. Reference: ${referenceId}`, "success");
  };

  // Individual instant payouts
  const handleInstantPayoutSingle = (item: any, type: "restaurant" | "rider") => {
    const amount = item.pendingAmount;
    if (amount <= 0) {
      triggerToast("No pending dues found", "Ledger balance for this entry is currently ₹0.", "info");
      return;
    }

    // Process
    if (type === "restaurant") {
      setRestaurantsLedger(prev => prev.map(r => r.id === item.id ? { ...r, pendingAmount: 0, status: "Completed", lastSettlementDate: new Date().toISOString().substring(0, 10) } : r));
    } else {
      setRidersLedger(prev => prev.map(r => r.id === item.id ? { ...r, pendingAmount: 0, status: "Completed", lastPayoutDate: new Date().toISOString().substring(0, 10) } : r));
    }

    // Add to logs
    setPayoutHistory(old => [
      {
        id: `TXN-INS-${Math.floor(Math.random() * 89999 + 10000)}`,
        beneficiaryName: item.name,
        beneficiaryType: type === "restaurant" ? "Restaurant" : "Rider",
        amount,
        paymentMethod: "Instant IMPS Bank Node",
        settlementDate: new Date().toISOString().substring(0, 10),
        status: "Completed",
        referenceNumber: `REF-INS-${Math.floor(Math.random() * 899999 + 100000)}`
      },
      ...old
    ]);

    triggerToast("Instant Settlement Authorized", `Credits of ₹${amount} sent to account routing of ${item.name}`, "success");
  };

  // Mock Statements reports downloads
  const triggerStatementMock = (name: string, amtType: string) => {
    triggerToast("Ledger Statement Compiled", `Generated fiscal statement receipt for ${name}. Download started successfully.`, "success");
  };

  // Export PDF or Excel triggers
  const handleTriggerReportDownload = (reportName: string) => {
    triggerToast("Financial Report Ready", `PDF Document: [${reportName}] compiled with SHA-256 digital signature and transmitted. Check browser folder.`, "success");
  };

  // Payout History logic matching the filters
  const filteredPayoutHistoryList = useMemo(() => {
    return payoutHistory.filter(item => {
      // Search
      if (historySearch.trim()) {
        const query = historySearch.toLowerCase();
        const searchName = item.beneficiaryName.toLowerCase().includes(query);
        const searchId = item.id.toLowerCase().includes(query);
        const searchRef = item.referenceNumber.toLowerCase().includes(query);
        if (!searchName && !searchId && !searchRef) return false;
      }

      // Status
      if (historyStatusFilter !== "All" && item.status !== historyStatusFilter) return false;

      // Type
      if (historyTypeFilter !== "All" && item.beneficiaryType !== historyTypeFilter) return false;

      // Range amount
      if (item.amount < historyMinAmount || item.amount > historyMaxAmount) return false;

      return true;
    });
  }, [payoutHistory, historySearch, historyStatusFilter, historyTypeFilter, historyMinAmount, historyMaxAmount]);

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans leading-relaxed">
      
      {/* 1. TOP HEADER SUMMARY GRID */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-stone-900 border border-stone-800 rounded-2xl gap-4">
        <div className="text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-900/40 border border-emerald-900/30 text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-wider">
            Enterprise Ledger Active
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Payouts & Commission Engine</h2>
          <p className="text-xs text-stone-400">Manage global transaction commissions, configure rider delivery fee splits, execute settlements, and review financial journals.</p>
        </div>

        {/* Dynamic Filters Selector */}
        <div className="flex flex-wrap gap-2">
          {["today", "7days", "30days"].map((range) => (
            <button
              key={range}
              onClick={() => { setDateRange(range as any); setIsCustomDate(false); }}
              className={`p-1.5 px-3 rounded-lg text-xs font-black transition-all uppercase tracking-wide cursor-pointer ${
                dateRange === range && !isCustomDate
                  ? "bg-[#E23744] text-white" 
                  : "bg-stone-800 text-stone-300 hover:bg-stone-700"
              }`}
            >
              {range === "today" ? "Today" : range === "7days" ? "Last 7 Days" : "Last 30 Days"}
            </button>
          ))}
          <button
            onClick={() => { setIsCustomDate(true); setDateRange("30days"); }}
            className={`p-1.5 px-3 rounded-lg text-xs font-black transition-all uppercase tracking-wide cursor-pointer ${
              isCustomDate ? "bg-[#E23744] text-white" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Custom Date Picker Fields overlay if requested */}
      {isCustomDate && (
        <div className="p-4 rounded-xl border border-dashed border-zinc-200 bg-slate-50 flex flex-wrap gap-4 items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-stone-500 block font-bold">START DATE</span>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="p-1.5 text-xs bg-white border rounded" 
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-stone-500 block font-bold">END DATE</span>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="p-1.5 text-xs bg-white border rounded" 
            />
          </div>
          <button 
            onClick={() => {
              if (customStartDate && customEndDate) {
                triggerToast("Date Range Filtered", `Ledger adjusted between ${customStartDate} and ${customEndDate}`, "info");
              }
            }}
            className="p-2 py-1 bg-slate-900 text-white rounded text-xs font-bold mt-4"
          >
            Apply Date Range Filter
          </button>
        </div>
      )}

      {/* 2. REAL-TIME FINTECH STATUS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Total Revenue</span>
            <strong className="text-base font-black text-stone-900 dark:text-white mt-1 block">₹{statistics.revenue.toLocaleString()}</strong>
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-2">
            <TrendingUp className="w-3 h-3" /> +14.2% MoM
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Commission Revenue</span>
            <strong className="text-base font-black text-[#E23744] mt-1 block">₹{statistics.commission.toLocaleString()}</strong>
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-2">
            <TrendingUp className="w-3 h-3" /> +18.5% scale
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Owed to Restaurants</span>
            <strong className="text-base font-black text-rose-600 mt-1 block">₹{statistics.owedRestaurants.toLocaleString()}</strong>
          </div>
          <span className="text-[9px] text-zinc-400 font-medium block mt-2">
            7 partner locations
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Owed to Riders</span>
            <strong className="text-base font-black text-sky-600 mt-1 block">₹{statistics.owedRiders.toLocaleString()}</strong>
          </div>
          <span className="text-[9px] text-zinc-400 font-medium block mt-2">
            6 transport captains
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Completed Payouts</span>
            <strong className="text-base font-black text-emerald-600 mt-1 block">₹{statistics.completed.toLocaleString()}</strong>
          </div>
          <span className="text-[9px] text-[#E23744] font-medium block mt-2">
            Automated settling logs active
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Pending Escrows</span>
            <strong className="text-base font-black text-amber-600 mt-1 block">₹{statistics.pending.toLocaleString()}</strong>
          </div>
          <span className="text-[9px] text-zinc-400 font-medium block mt-2">
            Cycle terminates weekly
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider block">Failed Handshakes</span>
            <strong className="text-base font-black text-red-700 mt-1 block">₹{statistics.failed.toLocaleString()}</strong>
          </div>
          {statistics.failed > 0 ? (
            <span className="text-[8.5px] px-1 py-0.5 bg-red-100 text-red-700 font-bold rounded-sm animate-pulse block mt-2">
              Action Required (2 alerts)
            </span>
          ) : (
            <span className="text-[9px] text-emerald-600 font-semibold block mt-2">
              Clean queue
            </span>
          )}
        </div>
      </div>

      {/* 3. CORE ADAPTIVE RECHARTS FINTECH INSIGHTS FLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 text-left shadow-3xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs uppercase font-black text-[#E23744]">Financial Movement Indices</h3>
              <p className="text-[10px] text-stone-400">Platform earnings, gross merchant values, and settlement compliance trends</p>
            </div>
            <span className="text-[10px] bg-slate-50 border p-1 rounded font-mono font-bold">Dynamic Handoff Ledger</span>
          </div>

          <div className="h-64" style={{ minHeight: "256px", minWidth: 0 }}>
            <SafeResponsiveContainer minHeight={256} minWidth={0}>
              <AreaChart data={financialChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E23744" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#E23744" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.15} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1e1e1e", color: "#fff", fontSize: "11px", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="OrdersRevenue" stroke="#E23744" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Order GMV Sum" />
                <Area type="monotone" dataKey="DisbursedPayouts" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorPayouts)" name="Disbursed Payouts" />
              </AreaChart>
            </SafeResponsiveContainer>
          </div>
        </div>

        {/* 3B: REAL TIME ALERTS PANEL & STATS OVERVIEW */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 text-left shadow-3xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-[10px] uppercase font-black text-rose-500 tracking-wider flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" /> High Risk Alerts & Queue Security
              </span>
              <span className="text-[9px] font-bold text-stone-400">Level Index</span>
            </div>

            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="p-3 bg-red-100 border border-red-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-red-800 uppercase text-[9px] flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-700" /> Bank Transfer Failed
                  </span>
                  <span className="text-[8px] font-mono font-bold text-red-600">TXN-88125</span>
                </div>
                <p className="text-stone-700 text-[10px]">Recipient "Waffle Wonders" bank system rejected credit node. Cause: invalid IFSC code configuration.</p>
                <div className="block pt-1">
                  <button 
                    onClick={() => triggerToast("Rerouting Account", "Dispatched account setting correction SMS to partner merchant.", "info")}
                    className="text-[9px] underline font-black text-[#E23744]"
                  >
                    Resolve IFSC Configuration
                  </button>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-amber-800 uppercase text-[9px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> Pending Multi-Sig Auth
                  </span>
                  <span className="text-[8px] font-mono font-bold text-amber-600">LIMIT LIMIT_INR</span>
                </div>
                <p className="text-stone-700 text-[10px]">Rider "Suresh Mukherjee" pending balance exceeds normal cycle limits (₹4,300). Audit review verified.</p>
                <div className="block pt-1">
                  <button 
                    onClick={() => triggerToast("Audit Success", "Suresh Mukherjee payout authenticated. Ready for settlement.", "success")}
                    className="text-[9px] underline font-black text-emerald-800"
                  >
                    Bypass Audit Threshold
                  </button>
                </div>
              </div>

              {/* Alert 3 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-extrabold text-slate-700 uppercase text-[9px] block">
                  🛡️ Commission Scheme Audit Log
                </span>
                <p className="text-stone-600 text-[10px]">Global policy is strictly compliant with Central Service Tax GST 5% thresholds.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between text-[10px] text-stone-400">
            <span>Server Clock: <strong className="font-mono">{new Date().toLocaleTimeString()}</strong></span>
            <span className="font-bold text-emerald-600">Status Node: Secured</span>
          </div>
        </div>
      </div>

      {/* 4. MASTER COMMISSION CONFIGURATOR (WITH CRITICAL ACTION) */}
      <div className="bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 text-left shadow-3xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Commission configuration & Fee Sharing Model</h3>
            <p className="text-xs text-stone-400">Alter platform multi-tier percentages, delivery fee overrides, and specify merchant discounts.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleResetCommissionSettings}
              className="p-1.5 px-3 rounded-lg border text-xs font-bold flex items-center gap-1 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
            <button 
              id="save-commission-btn"
              onClick={handleVerifyAndSaveCommission}
              className="p-1.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes & Audits
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-black text-stone-400">Rule Parameters</span>

            {/* Model type selection */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-600 block">Commission Split Model</label>
              <div className="grid grid-cols-3 gap-1.5">
                {["Fixed Percentage", "Fixed Amount", "Hybrid Commission Model"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setCommissionModel(mode as any);
                      triggerToast("Model Toggled", `Switched pricing paradigm selector to ${mode}`, "info");
                    }}
                    className={`p-1.5 border rounded-lg text-[9px] font-black uppercase text-center transition-all ${
                      commissionModel === mode 
                        ? "bg-[#E23744]/10 border-[#E23744] text-[#E23744]" 
                        : "bg-white hover:bg-slate-50 text-stone-600 border-zinc-200"
                    }`}
                  >
                    {mode.replace(" Commission Model", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter slider based on paradigm */}
            {commissionModel === "Fixed Percentage" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="font-bold text-stone-700">Global Base Commission Charged</span>
                  <span className="font-mono font-black text-[#E23744]">{globalCommissionPct}% per order</span>
                </div>
                <input 
                  type="range"
                  min={5}
                  max={35}
                  value={globalCommissionPct}
                  onChange={(e) => setGlobalCommissionPct(Number(e.target.value))}
                  className="w-full accent-[#E23744]" 
                />
                <span className="text-[9px] text-stone-400 block italic leading-snug">
                  Adjusting this slider updates calculations on checkout totals on standard merchant receipts.
                </span>
              </div>
            )}

            {commissionModel === "Fixed Amount" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10.5px]">
                  <span className="font-bold text-stone-700">Flat Amount Paid Per Settlement Order</span>
                  <span className="font-mono font-black text-[#E23744]">₹{fixedAmountValue} flat rate</span>
                </div>
                <input 
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={fixedAmountValue}
                  onChange={(e) => setFixedAmountValue(Number(e.target.value))}
                  className="w-full accent-[#E23744]" 
                />
              </div>
            )}

            {commissionModel === "Hybrid Commission Model" && (
              <div className="p-3 bg-stone-50 rounded-xl space-y-3.5 border text-xs">
                <div className="flex justify-between">
                  <strong>Combined Equation Matrix</strong>
                  <span className="font-black text-rose-600">Hybrid Formula</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Base Flat Cut:</span>
                    <span>₹30 per transaction</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Variable surcharge:</span>
                    <span>5.5% variable gross</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 border-l border-r border-dotted px-4 border-zinc-200">
            <span className="text-[10px] uppercase font-black text-stone-400">Rider & Logistics Settings</span>

            <div className="space-y-3">
              {/* Rider delivery base */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-stone-600">Rider Base Flat Pay</span>
                  <span className="font-mono font-black text-sky-600">₹{riderCommissionBase} / delivery</span>
                </div>
                <input 
                  type="range"
                  min={30}
                  max={150}
                  step={5}
                  value={riderCommissionBase}
                  onChange={(e) => setRiderCommissionBase(Number(e.target.value))}
                  className="w-full accent-sky-500" 
                />
              </div>

              {/* Delivery fee split */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-stone-600">Rider Delivery Fee Share</span>
                  <span className="font-mono font-black text-indigo-600">{deliveryFeeSharing}% shared split</span>
                </div>
                <input 
                  type="range"
                  min={50}
                  max={100}
                  value={deliveryFeeSharing}
                  onChange={(e) => setDeliveryFeeSharing(Number(e.target.value))}
                  className="w-full accent-indigo-500" 
                />
                <span className="text-[9px] text-stone-400 block">Rest of {100 - deliveryFeeSharing}% represents platform operations index.</span>
              </div>

              {/* Tax & Service setting */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-600 block">Surcharge Regulatory Tax Percentage (%)</label>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    step={0.5}
                    value={taxAndServiceFeePct}
                    onChange={(e) => setTaxAndServiceFeePct(Number(e.target.value))}
                    className="p-1.5 text-xs bg-slate-50 border rounded-lg flex-1 font-mono font-black border-zinc-200 focus:outline-[#E23744]" 
                  />
                  <span className="p-2 text-stone-400 text-xs font-mono font-bold">% GST</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-black text-stone-400">Restaurant-Specific Override Rules</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            </div>

            {/* Overrides Table / Adder */}
            <form onSubmit={handleAddOverride} className="flex gap-1.5 items-center">
              <input 
                type="text"
                placeholder="Restaurant name..."
                required
                value={newOverrideRest}
                onChange={(e) => setNewOverrideRest(e.target.value)}
                className="p-1.5 text-[10.5px] bg-slate-50 border rounded-lg flex-1 border-zinc-200" 
              />
              <input 
                type="number"
                min={5}
                max={30}
                value={newOverrideVal}
                onChange={(e) => setNewOverrideVal(Number(e.target.value))}
                className="p-1.5 text-[10.5px] bg-slate-50 border rounded-lg w-12 font-mono border-zinc-200" 
              />
              <button 
                type="submit"
                className="p-1.5 bg-[#E23744] hover:bg-red-700 text-white font-bold rounded-lg text-[10px]"
              >
                Apply
              </button>
            </form>

            <div className="space-y-1.5 max-h-36 overflow-y-auto text-[10px]">
              {restaurantOverrides.map((item, index) => (
                <div key={index} className="p-1.5 px-2 bg-stone-50 rounded-lg flex justify-between items-center border">
                  <span>
                    <strong className="text-gray-900 block">{item.name}</strong>
                    <span className="text-stone-400">Custom LevelOverride: {item.overridePct}%</span>
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveOverride(item.name)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded font-black uppercase text-[8px]"
                  >
                    Revoke Override
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log list */}
        <div className="mt-5 pt-4 border-t border-dashed border-gray-100">
          <span className="text-[10px] uppercase font-black text-semibold text-stone-400 block mb-2">Audit History Ledger Trails</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-2">
            {auditLogs.map((log, index) => (
              <div key={index} className="p-2 bg-slate-50/50 rounded-lg text-[11px] leading-snug border space-y-0.5">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold text-stone-400">
                  <span>{log.timestamp}</span>
                  <span className="text-[#E23744]">{log.action}</span>
                </div>
                <strong className="text-gray-800 font-bold block">{log.author}</strong>
                <p className="text-stone-500 text-[10px]">{log.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. BATCH SETTLEMENT & MASS DISBURSAL CONTROL PANEL */}
      <div className="p-5 bg-gradient-to-r from-red-50 to-[#E23744]/5 border border-[#E23744]/25 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <span className="px-2 py-0.5 bg-[#E23744] text-white rounded text-[9.5px] font-black uppercase inline-block mb-1">
            Settlement Workspace Controller
          </span>
          <h3 className="text-base font-black text-stone-900 tracking-tight">Consolidated Batch Payments Settlement</h3>
          <p className="text-xs text-stone-500 max-w-2xl">
            Settle out all outstanding balances simultaneously. This initiates real-time IMPS bank server transactions and generates individual GST invoices for partner compliance accounts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            id="settle-all-restaurants-btn"
            onClick={() => handleOpenSettleModal("Restaurants")}
            className="p-2 px-3.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Settle Restaurant Batch
          </button>
          <button
            id="settle-all-riders-btn"
            onClick={() => handleOpenSettleModal("Riders")}
            className="p-2 px-3.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Settle Rider Batch
          </button>
          <button
            id="settle-all-pending-btn"
            onClick={() => handleOpenSettleModal("All Pending")}
            className="p-2 px-4.5 bg-[#E23744] text-white rounded-xl text-xs font-black shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
          >
            Settle All Pending Dues
          </button>
        </div>
      </div>

      {/* 6. RED DIRECTIVE RESTAURANT PAYOUT LEDGER */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-zinc-150 dark:border-gray-900 text-left overflow-hidden shadow-3xs">
        <div className="p-4 bg-slate-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-stone-800 dark:text-white text-xs uppercase tracking-wider">Restaurant Payout Ledger</h3>
            <p className="text-[10px] text-stone-400 dark:text-gray-400">Total settlement parameters, commission platform cuts, and pending payouts balance</p>
          </div>
          <button 
            onClick={() => handleTriggerReportDownload("Monthly Restaurant Payout Report")}
            className="p-1 px-2 border-zinc-200 dark:border-gray-700 border text-[10px] font-bold rounded hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Ledger CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-800 border-b border-zinc-200/60 dark:border-gray-700 font-black text-[10px] uppercase text-stone-400 dark:text-gray-400">
                <th colSpan={1} className="p-3 pl-4">Restaurant Partner</th>
                <th colSpan={1} className="p-3">Restaurant ID</th>
                <th colSpan={1} className="p-3">Total Orders</th>
                <th colSpan={1} className="p-3">Gross Revenue</th>
                <th colSpan={1} className="p-3">Platform Comm.</th>
                <th colSpan={1} className="p-3">Regulatory Taxes</th>
                <th colSpan={1} className="p-3 font-bold text-gray-900 dark:text-white">Net Earnings</th>
                <th colSpan={1} className="p-3">Outstanding Dues</th>
                <th colSpan={1} className="p-3">Payment Status</th>
                <th colSpan={1} className="p-3 text-center">Handshake Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-gray-800 font-semibold text-stone-700 dark:text-gray-300">
              {restaurantsLedger.map((rest) => {
                const statusBadgeBg = {
                  Pending: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30",
                  Processing: "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
                  Completed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900/30",
                  Failed: "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-900/30",
                  "On Hold": "bg-slate-100 dark:bg-gray-800 text-stone-600 dark:text-gray-400 border-zinc-250 dark:border-gray-700"
                }[rest.status] || "bg-zinc-100 dark:bg-gray-800";

                return (
                  <tr key={rest.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 pl-4 font-extrabold text-stone-900 dark:text-white">{rest.name}</td>
                    <td className="p-3 font-mono text-[10.5px] text-stone-400 dark:text-gray-400">{rest.id}</td>
                    <td className="p-3">{rest.totalOrders} orders</td>
                    <td className="p-3">₹{rest.grossRevenue.toLocaleString()}</td>
                    <td className="p-3 text-rose-600 dark:text-rose-400">₹{rest.platformCommission.toLocaleString()}</td>
                    <td className="p-3 text-stone-400 dark:text-gray-400">₹{rest.taxes.toLocaleString()}</td>
                    <td className="p-3 font-extrabold text-stone-900 dark:text-white">₹{rest.netEarnings.toLocaleString()}</td>
                    <td className="p-3 text-[#E23744] font-black">
                      {rest.pendingAmount > 0 ? `₹${rest.pendingAmount.toLocaleString()}` : "—"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 border text-[9.5px] font-black uppercase rounded ${statusBadgeBg}`}>
                        {rest.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => setSelectedLedgerDetails({ type: "restaurant", data: rest })}
                          className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 rounded text-[#E23744] font-bold text-[10.5px] flex items-center gap-0.5"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                        <button
                          onClick={() => triggerStatementMock(rest.name, "Restaurant Outstanding")}
                          className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-gray-800 rounded text-stone-600 dark:text-gray-400"
                          title="Download Invoice Statement"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {rest.pendingAmount > 0 && (
                          <button
                            onClick={() => handleInstantPayoutSingle(rest, "restaurant")}
                            className="p-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9.5px] font-extrabold uppercase ml-1"
                          >
                            Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. SKY COURIER RIDER EARNINGS LEDGER */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-zinc-150 dark:border-gray-900 text-left overflow-hidden shadow-3xs">
        <div className="p-4 bg-slate-50/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-stone-800 dark:text-white text-xs uppercase tracking-wider">Rider Earnings Ledger</h3>
            <p className="text-[10px] text-stone-400 dark:text-gray-400">Total completed deliveries, base earnings, bonuses, penalties, and payout status</p>
          </div>
          <button 
            onClick={() => handleTriggerReportDownload("Monthly Riders Settlement Report")}
            className="p-1 px-2 border-zinc-200 dark:border-gray-700 border text-[10px] font-bold rounded hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Ledger CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-800 border-b border-zinc-200/60 dark:border-gray-700 font-black text-[10px] uppercase text-stone-400 dark:text-gray-400">
                <th colSpan={1} className="p-3 pl-4">Transport Captain</th>
                <th colSpan={1} className="p-3">Rider ID</th>
                <th colSpan={1} className="p-3">Deliveries</th>
                <th colSpan={1} className="p-3">Base Earnings</th>
                <th colSpan={1} className="p-3">Incentives</th>
                <th colSpan={1} className="p-3 text-emerald-600 dark:text-emerald-400">Bonuses</th>
                <th colSpan={1} className="p-3 text-red-500 dark:text-red-400">Penalties</th>
                <th colSpan={1} className="p-3 font-bold text-gray-900 dark:text-white">Total Net Pay</th>
                <th colSpan={1} className="p-3">Outstanding Dues</th>
                <th colSpan={1} className="p-3">Payment Status</th>
                <th colSpan={1} className="p-3 text-center">Handshake Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-gray-800 font-semibold text-stone-700 dark:text-gray-300">
              {ridersLedger.map((rider) => {
                const statusBadgeBg = {
                  Pending: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/30",
                  Processing: "bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
                  Completed: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-300 dark:border-emerald-900/30",
                  Failed: "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border-rose-300 dark:border-rose-900/30",
                  "On Hold": "bg-slate-100 dark:bg-gray-800 text-stone-600 dark:text-gray-400 border-zinc-250 dark:border-gray-700"
                }[rider.status] || "bg-zinc-100 dark:bg-gray-800";

                return (
                  <tr key={rider.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-3 pl-4 font-extrabold text-stone-900 dark:text-white">{rider.name}</td>
                    <td className="p-3 font-mono text-[10.5px] text-stone-400 dark:text-gray-400">{rider.id}</td>
                    <td className="p-3">{rider.completedDeliveries} trips</td>
                    <td className="p-3">₹{rider.baseEarnings.toLocaleString()}</td>
                    <td className="p-3">₹{rider.incentives.toLocaleString()}</td>
                    <td className="p-3 text-emerald-700 dark:text-emerald-400">₹{rider.bonuses.toLocaleString()}</td>
                    <td className="p-3 text-red-700 dark:text-red-400">₹{rider.penalties.toLocaleString()}</td>
                    <td className="p-3 font-extrabold text-stone-900 dark:text-white">₹{rider.netEarnings.toLocaleString()}</td>
                    <td className="p-3 text-[#E23744] font-black">
                      {rider.pendingAmount > 0 ? `₹${rider.pendingAmount.toLocaleString()}` : "—"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 border text-[9.5px] font-black uppercase rounded ${statusBadgeBg}`}>
                        {rider.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => setSelectedLedgerDetails({ type: "rider", data: rider })}
                          className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 text-[#E23744] font-bold text-[10.5px] rounded flex items-center gap-0.5"
                          title="View Earnings Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                        <button
                          onClick={() => triggerStatementMock(rider.name, "Rider Logistics Outstanding")}
                          className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded text-stone-600 dark:text-gray-400"
                          title="Download Statement"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {rider.pendingAmount > 0 && (
                          <button
                            onClick={() => handleInstantPayoutSingle(rider, "rider")}
                            className="p-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9.5px] font-extrabold uppercase ml-1"
                          >
                            Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. COMPLETE HISTORICAL ARCHIVE TRANSACTION JOURNAL */}
      <div className="bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 text-left shadow-3xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#E23744]" /> Payout Historical Audit Trail Journal
            </h3>
            <p className="text-xs text-stone-400">Verifiable corporate IMPS/NEFT transfers ledger archive list</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => handleTriggerReportDownload("Global Settlement Summary PDF")}
              className="p-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#E23744]" /> Download PDF Report
            </button>
            <button 
              onClick={() => handleTriggerReportDownload("Tax Settlements Master Excel")}
              className="p-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-indigo-900 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Export Excel Report
            </button>
            <button 
              onClick={() => handleTriggerReportDownload("Quarterly GST Invoicing Audits")}
              className="p-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-stone-700 rounded-lg text-[10px] font-black uppercase tracking-wide cursor-pointer"
            >
              Quarterly Tax Checks
            </button>
          </div>
        </div>

        {/* Dynamic Interactive multi-filter search options */}
        <div className="p-3 bg-slate-50 dark:bg-gray-900/30 rounded-xl border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-stone-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input 
              type="text"
              placeholder="Search beneficiary or Txn ID..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border rounded-lg focus:ring-[#E23744] focus:outline-hidden" 
            />
          </div>

          <div>
            <select
              value={historyStatusFilter}
              onChange={(e) => setHistoryStatusFilter(e.target.value)}
              className="w-full p-2 py-1.5 text-xs bg-white dark:bg-gray-800 border rounded-lg focus:outline-hidden"
            >
              <option value="All">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
              <option value="Schedule-Pending">Schedule-Pending</option>
            </select>
          </div>

          <div>
            <select
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value)}
              className="w-full p-2 py-1.5 text-xs bg-white dark:bg-gray-800 border rounded-lg focus:outline-hidden"
            >
              <option value="All">All types</option>
              <option value="Restaurant">Restaurants Only</option>
              <option value="Rider">Riders Only</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-stone-400 font-bold">
              <span>MIN RATE: ₹{historyMinAmount}</span>
              <span>MAX: ₹{historyMaxAmount}</span>
            </div>
            <input 
              type="range"
              min={0}
              max={50000}
              step={100}
              value={historyMaxAmount}
              onChange={(e) => setHistoryMaxAmount(Number(e.target.value))}
              className="w-full accent-[#E23744]" 
            />
          </div>
        </div>

        {/* Transaction History rows */}
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-extrabold text-[10px] uppercase text-stone-400 dark:text-gray-400">
                <th colSpan={1} className="p-3 pl-4">Transaction ID</th>
                <th colSpan={1} className="p-3">Recipient Name</th>
                <th colSpan={1} className="p-3">Type</th>
                <th colSpan={1} className="p-3">Amount Charged</th>
                <th colSpan={1} className="p-3 font-mono">Payment Channel</th>
                <th colSpan={1} className="p-3">Settlement Date</th>
                <th colSpan={1} className="p-3">System State</th>
                <th colSpan={1} className="p-3 text-right pr-4">Reference Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-gray-800 font-semibold text-stone-700 dark:text-gray-300">
              {filteredPayoutHistoryList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-stone-400 dark:text-gray-500 italic">
                    No corresponding matching audit records found in database limits.
                  </td>
                </tr>
              ) : (
                filteredPayoutHistoryList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-all">
                    <td className="p-3 pl-4 font-mono font-black text-[#E23744] dark:text-red-400">{item.id}</td>
                    <td className="p-3 font-extrabold text-stone-900 dark:text-white">{item.beneficiaryName}</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                        item.beneficiaryType === "Restaurant" ? "bg-red-50 dark:bg-red-900/30 text-[#E23744] dark:text-red-400" : "bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400"
                      }`}>
                        {item.beneficiaryType}
                      </span>
                    </td>
                    <td className="p-3 font-black text-stone-800 dark:text-white">₹{item.amount.toLocaleString()}</td>
                    <td className="p-3 font-mono text-[10px] text-stone-400 dark:text-gray-400">{item.paymentMethod}</td>
                    <td className="p-3">{item.settlementDate}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase ${
                        item.status === "Completed" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" :
                        item.status === "Failed" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right pr-4 font-mono text-[10.5px] text-stone-400 dark:text-gray-400">{item.referenceNumber}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: MASS BATCH SETTLEMENTS CONFIRMATION MODAL */}
      {showBatchSettleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E24] w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up text-left border">
            
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Confirm Mass Settlement Batch</h3>
              </div>
              <button onClick={() => setShowBatchSettleModal(false)}>
                <XCircle className="w-5 h-5 text-stone-400 hover:text-stone-600 cursor-pointer" />
              </button>
            </div>

            <p className="text-xs text-stone-400">
              Verify outstanding disbursal parameters prior to submitting direct transfer requests to our partnered banking systems.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Restaurant summary */}
              {(batchTargetType === "Restaurants" || batchTargetType === "All Pending") && (
                <div className="p-3.5 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-zinc-150 text-xs text-left">
                  <span className="font-extrabold uppercase text-[9px] text-[#E23744] block mb-1">Restaurant Batch Summary</span>
                  <div className="space-y-1 text-stone-700">
                    <div className="flex justify-between">
                      <span>Count Partners:</span>
                      <strong>2 Merchants</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed">
                      <span>Total Owed Amount:</span>
                      <strong className="text-stone-900">₹6,070</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission Deducted:</span>
                      <strong className="text-[#E23744]">₹1,092.60</strong>
                    </div>
                    <div className="flex justify-between font-black pt-1 border-t">
                      <span>Net Settled sum:</span>
                      <strong className="text-[#E23744]">₹4,977.40</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Rider summary */}
              {(batchTargetType === "Riders" || batchTargetType === "All Pending") && (
                <div className="p-3.5 bg-slate-50 dark:bg-gray-900/40 rounded-xl border border-zinc-150 text-xs text-left">
                  <span className="font-extrabold uppercase text-[9px] text-sky-600 block mb-1">Rider Fleet Batch Summary</span>
                  <div className="space-y-1 text-stone-700">
                    <div className="flex justify-between">
                      <span>Active Riders to pay:</span>
                      <strong>2 captains</strong>
                    </div>
                    <div className="flex justify-between font-black pt-1 border-t">
                      <span>Total Owed amount:</span>
                      <strong className="text-sky-600">₹1,670</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bank details and references */}
            <div className="p-3 bg-stone-50 dark:bg-gray-900/60 rounded-xl space-y-2 border text-[11px] leading-relaxed">
              <strong className="text-stone-900 block">Bank Transfer Information</strong>
              <div className="grid grid-cols-2 gap-3 font-mono text-stone-500">
                <div>
                  <span>Batch Ref:</span>
                  <strong className="text-stone-700 block">SETTLE-REF-{Date.now().toString().substring(8)}</strong>
                </div>
                <div>
                  <span>Debit Source:</span>
                  <strong className="text-stone-700 block">Googly Delivery HDFC Corporate</strong>
                </div>
                <div>
                  <span>Estimated Time:</span>
                  <strong className="text-emerald-600 block">Instant (Within 3 Minutes)</strong>
                </div>
                <div>
                  <span>Method Channel:</span>
                  <select 
                    value={bankMethod} 
                    onChange={(e) => setBankMethod(e.target.value)}
                    className="p-1 px-1.5 bg-white text-[10.5px] border rounded"
                  >
                    <option value="Direct NEFT / Corporate Handshake">Corporate NEFT</option>
                    <option value="Instant IMPS Bank Node">Instant IMPS</option>
                    <option value="UPI Batch Disbursal">UPI Batch Payout</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Schedule type */}
            <div className="space-y-2 text-xs">
              <strong className="text-stone-700 block">Settlement Schedule</strong>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="schedule" 
                    checked={payoutScheduleType === "instant"} 
                    onChange={() => setPayoutScheduleType("instant")} 
                  />
                  <span>Process Right Now</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input 
                    type="radio" 
                    name="schedule" 
                    checked={payoutScheduleType === "later"} 
                    onChange={() => setPayoutScheduleType("later")} 
                  />
                  <span>Schedule for Later</span>
                </label>
              </div>
              {payoutScheduleType === "later" && (
                <input 
                  type="datetime-local" 
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="p-1.5 bg-slate-50 border rounded w-full" 
                />
              )}
            </div>

            {/* Final Action tools */}
            <div className="flex gap-2 justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowBatchSettleModal(false)}
                className="px-4 py-2 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold"
              >
                Cancel out
              </button>
              {payoutScheduleType === "later" ? (
                <button
                  type="button"
                  onClick={() => {
                    triggerToast("Settlement Scheduled", `Payout scheduled successfully for ${scheduledTime}`, "success");
                    setShowBatchSettleModal(false);
                  }}
                  className="px-4 py-2 bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Scheduled Disbursal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={executeSettleTransfers}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Authenticate & Disburse Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: COMMISSION ALTERATION CRITICAL WARNING MODAL */}
      {showCommissionWarning && pendingCommissionModelChange && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E24] w-full max-w-sm rounded-xl p-5 shadow-2xl space-y-4 text-left border">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-black uppercase">Critical Commission Recalibration</h3>
            </div>

            <p className="text-xs text-stone-400">
              WARNING: Modifying global fee splits triggers real-time contract revisions on Googly Co. database nodes. This will recalculate platform earnings for all upcoming delivery checkout transactions.
            </p>

            <div className="p-3 bg-red-100 border border-red-200 rounded-lg text-xs font-semibold space-y-2">
              <div className="flex justify-between">
                <span>Proposed Model:</span>
                <strong className="text-red-800">{pendingCommissionModelChange.model}</strong>
              </div>
              <div className="flex justify-between">
                <span>Base Commission:</span>
                <strong className="text-red-800">
                  {pendingCommissionModelChange.model === "Fixed Percentage" 
                    ? `${pendingCommissionModelChange.globalPct}%` 
                    : `₹${pendingCommissionModelChange.fixedAmount}`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Rider logistics sharing:</span>
                <strong className="text-red-800">{pendingCommissionModelChange.sharing}% split</strong>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowCommissionWarning(false); setPendingCommissionModelChange(null); }}
                className="px-3.5 py-1.5 bg-gray-100 text-stone-600 font-bold rounded-lg text-xs"
              >
                Decline Changes
              </button>
              <button
                type="button"
                onClick={confirmCommissionChanges}
                className="px-4 py-1.5 bg-[#E23744] hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
              >
                Authenticate & Propagate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LEDGER DETAILS DRILLDOWN DRAWER/MODAL Overlay */}
      {selectedLedgerDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E24] w-full max-w-sm rounded-xl p-5 shadow-2xl relative space-y-4 text-left border animate-scale-up">
            <button 
              onClick={() => setSelectedLedgerDetails(null)}
              className="absolute right-4 top-4 p-1 bg-slate-100 rounded-full hover:bg-slate-200"
            >
              <XCircle className="w-4 h-4 text-stone-400" />
            </button>
            
            <div className="border-b pb-2 border-gray-200 dark:border-gray-800">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#E23744] block">Account Breakdown Details</span>
              <h3 className="text-sm font-black text-stone-900 dark:text-white mt-1">{selectedLedgerDetails.data.name}</h3>
              <span className="text-[9.5px] font-mono text-stone-400 dark:text-gray-400">{selectedLedgerDetails.data.id}</span>
            </div>

            <div className="space-y-2 text-xs font-semibold leading-relaxed text-gray-800 dark:text-gray-200">
              {selectedLedgerDetails.type === "restaurant" ? (
                <>
                  <div className="flex justify-between">
                    <span>Gross Transacted Orders:</span>
                    <span>{selectedLedgerDetails.data.totalOrders} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base GMV Total:</span>
                    <strong className="text-stone-900 dark:text-white">₹{selectedLedgerDetails.data.grossRevenue}</strong>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-gray-200 dark:border-gray-700 pt-1.5 label text-rose-600 dark:text-rose-400">
                    <span>Platform Commission Cut:</span>
                    <span>- ₹{selectedLedgerDetails.data.platformCommission}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Regulatory Taxes deducted:</span>
                    <span>- ₹{selectedLedgerDetails.data.taxes}</span>
                  </div>
                  <div className="flex justify-between border-t border-double border-gray-200 dark:border-gray-700 pt-1.5 text-emerald-700 dark:text-emerald-400 font-black">
                    <span>Net Disbursable Balance:</span>
                    <span>₹{selectedLedgerDetails.data.netEarnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cycle Outstanding:</span>
                    <span className="text-[#E23744] font-black">₹{selectedLedgerDetails.data.pendingAmount}</span>
                  </div>
                  <p className="text-[9.5px] text-stone-500 pt-2 border-t">
                    Settlements generated under billing ledger compliant with CGST laws. Next run window schedules weekly.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>Completed logistics trips:</span>
                    <span>{selectedLedgerDetails.data.completedDeliveries} shifts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Deliveries Revenue:</span>
                    <span>₹{selectedLedgerDetails.data.baseEarnings}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Incentives / Rain Bonuses:</span>
                    <span>+ ₹{selectedLedgerDetails.data.incentives}</span>
                  </div>
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>Special Rewards:</span>
                    <span>+ ₹{selectedLedgerDetails.data.bonuses}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 dark:text-rose-400">
                    <span>Violation Penalties:</span>
                    <span>- ₹{selectedLedgerDetails.data.penalties}</span>
                  </div>
                  <div className="flex justify-between border-t border-double border-gray-200 dark:border-gray-700 pt-1.5 text-sky-600 dark:text-sky-400 font-black">
                    <span>Total Net Earnings:</span>
                    <span>₹{selectedLedgerDetails.data.netEarnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outstanding Due Balance:</span>
                    <strong className="text-[#E23744]">₹{selectedLedgerDetails.data.pendingAmount}</strong>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setSelectedLedgerDetails(null)}
                className="p-1 px-4 text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
