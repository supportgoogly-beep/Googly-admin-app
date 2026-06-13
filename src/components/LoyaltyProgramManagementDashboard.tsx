import React, { useState, useMemo, useEffect } from "react";
import { 
  Coins, Sparkles, TrendingUp, Users, Calendar, ShieldCheck, 
  HelpCircle, Settings, RefreshCw, Layers, Bell, ArrowRight, 
  Search, ArrowDownRight, Award, ChevronRight, Check, X, 
  CheckCircle, Plus, Info, ExternalLink, Download, FileText, 
  Edit3, Trash2, Sliders, ToggleLeft, ToggleRight, DollarSign,
  AlertTriangle, ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Cell, PieChart, Pie, LineChart, Line, AreaChart, Area, Legend
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { LoyaltyConfig } from "../types";

// Extended Loyalty model locally to represent rich Starbucks/Gold traits
interface FineLoyaltyConfig {
  coinsPerHundredRs: number;
  coinRedemptionValue: number; // Coins Per 1 Rs Discount (e.g. 10 coins = 1 Rs)
  minOrderValEarn: number;
  maxCoinsPerOrder: number;
  dailyEarningLimit: number;
  monthlyEarningLimit: number;

  // Bonus
  enableReferral: boolean;
  enableBirthday: boolean;
  enablePromotionalCampaign: boolean;
  firstOrderBonus: number;
  referralBonus: number;
  birthdayBonus: number;
  festivalBonus: number;

  // Redemption settings
  minCoinsRedeemRequired: number;
  maxRedemptionPerOrder: number;
  maxDiscountPercentAllowed: number;

  // Expiry
  expiryRule: "Never" | "FixedDays" | "FixedMonths" | "Custom";
  expiryValue: number; // e.g. 12 months/days
  reminderDaysBefore: number;
}

interface TransactionLedger {
  id: string;
  customerName: string;
  orderId: string;
  coinsEarned: number;
  coinsRedeemed: number;
  balanceAfter: number;
  type: "Earned" | "Redeemed" | "Bonus" | "Expired" | "Adjustment";
  dateTime: string;
}

interface LoyaltyCampaign {
  id: string;
  name: string;
  multiplier: number;
  eligibleUsers: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Upcoming" | "Completed";
}

interface LoyaltyProgramManagementDashboardProps {
  loyalty: LoyaltyConfig;
  setLoyalty: React.Dispatch<React.SetStateAction<LoyaltyConfig>>;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function LoyaltyProgramManagementDashboard({
  loyalty,
  setLoyalty,
  triggerToast
}: LoyaltyProgramManagementDashboardProps) {

  // -------------------------------------------------------------------------
  // Local Config state initialized from prop models
  // -------------------------------------------------------------------------
  const [config, setConfig] = useState<FineLoyaltyConfig>({
    coinsPerHundredRs: loyalty.coinsPerHundredRs || 10,
    coinRedemptionValue: 10, // Default 10 coins = ₹1 Discount
    minOrderValEarn: 200,
    maxCoinsPerOrder: 150,
    dailyEarningLimit: 500,
    monthlyEarningLimit: 3000,

    // Bonus settings
    enableReferral: true,
    enableBirthday: true,
    enablePromotionalCampaign: true,
    firstOrderBonus: 50,
    referralBonus: 30,
    birthdayBonus: 100,
    festivalBonus: 150,

    // Redemption Settings
    minCoinsRedeemRequired: 100,
    maxRedemptionPerOrder: 500,
    maxDiscountPercentAllowed: 30,

    // Expiry
    expiryRule: "FixedMonths",
    expiryValue: 12,
    reminderDaysBefore: 7
  });

  // Setup local control states when props change
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      coinsPerHundredRs: loyalty.coinsPerHundredRs || 10
    }));
  }, [loyalty]);

  // Filters & Tabs state
  const [activeTab, setActiveTab] = useState<"Config" | "Tiers" | "Campaigns" | "Notifications" | "Analytics">("Config");
  const [dateRangeFilter, setDateRangeFilter] = useState<"Today" | "Last 7 Days" | "Last 30 Days" | "Custom">("Last 30 Days");

  // Interactive Live Calculation Calculators States
  const [calcOrderSpendInput, setCalcOrderSpendInput] = useState<number>(500);
  const [calcCoinsRedeemInput, setCalcCoinsRedeemInput] = useState<number>(350);

  // Search Filter for Transaction list
  const [txSearchQuery, setTxSearchQuery] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("All");

  // Save Settings Modal state
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Adjust Coins Modal Dialog State
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustCustomerName, setAdjustCustomerName] = useState("");
  const [adjustActionType, setAdjustActionType] = useState<"Add" | "Remove">("Add");
  const [adjustAmountCoins, setAdjustAmountCoins] = useState<number>(50);
  const [adjustReasonText, setAdjustReasonText] = useState("");

  // Preview Reward Logic Popup Drawer
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);

  // -------------------------------------------------------------------------
  // Seed Mock Campaigns and Transaction Ledgers
  // -------------------------------------------------------------------------
  const [campaigns, setCampaigns] = useState<LoyaltyCampaign[]>([
    { id: "camp-1", name: "Double Coins Weekend", multiplier: 2, eligibleUsers: "All Users", startDate: "2026-06-13", endDate: "2026-06-14", status: "Upcoming" },
    { id: "camp-2", name: "Monsoon Bites Fest rewards", multiplier: 1.5, eligibleUsers: "Premium Tier", startDate: "2026-06-01", endDate: "2026-06-15", status: "Active" },
    { id: "camp-3", name: "New User Welcome Bonus Campaign", multiplier: 1.2, eligibleUsers: "New Users", startDate: "2026-05-01", endDate: "2026-05-31", status: "Completed" }
  ]);

  const [transactions, setTransactions] = useState<TransactionLedger[]>([
    { id: "TX-9905", customerName: "Aiswarya Sen", orderId: "ORD-8812", coinsEarned: 50, coinsRedeemed: 0, balanceAfter: 350, type: "Earned", dateTime: "2026-06-12 09:12" },
    { id: "TX-9904", customerName: "Rajdeep Banerjee", orderId: "ORD-8799", coinsEarned: 0, coinsRedeemed: 200, balanceAfter: 120, type: "Redeemed", dateTime: "2026-06-12 08:35" },
    { id: "TX-9903", customerName: "Siddharth Roy", orderId: "SYSTEM-REF", coinsEarned: 30, coinsRedeemed: 0, balanceAfter: 180, type: "Bonus", dateTime: "2026-06-11 21:05" },
    { id: "TX-9902", customerName: "Ananya Maity", orderId: "ORD-8720", coinsEarned: 45, coinsRedeemed: 0, balanceAfter: 430, type: "Earned", dateTime: "2026-06-11 19:40" },
    { id: "TX-9901", customerName: "Subhojit Dhar", orderId: "SYS-EXPIRY", coinsEarned: 0, coinsRedeemed: 120, balanceAfter: 0, type: "Expired", dateTime: "2026-06-10 00:01" },
    { id: "TX-9900", customerName: "Kabir Mehta", orderId: "SUPPORT-ADJ", coinsEarned: 100, coinsRedeemed: 0, balanceAfter: 750, type: "Adjustment", dateTime: "2026-06-09 14:15" }
  ]);

  // Brand-new Campaign Wizards State
  const [newCampName, setNewCampName] = useState("");
  const [newCampMultiplier, setNewCampMultiplier] = useState(2);
  const [newCampUserType, setNewCampUserType] = useState("All Users");
  const [newCampStartDate, setNewCampStartDate] = useState("2026-06-15");
  const [newCampEndDate, setNewCampEndDate] = useState("2026-06-20");

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) {
      triggerToast("Invalid Campaign", "Please provide a valid descriptive campaign name.", "error");
      return;
    }

    const created: LoyaltyCampaign = {
      id: `camp-${Math.round(100+Math.random()*899)}`,
      name: newCampName,
      multiplier: Number(newCampMultiplier),
      eligibleUsers: newCampUserType,
      startDate: newCampStartDate,
      endDate: newCampEndDate,
      status: "Upcoming"
    };

    setCampaigns(prev => [created, ...prev]);
    setNewCampName("");
    setNewCampMultiplier(2);
    triggerToast("Campaign Appended", `Successfully scheduled: "${created.name}"`, "success");
  };

  const handleAdjustCoinsSubmit = () => {
    if (!adjustCustomerName.trim() || adjustAmountCoins <= 0) {
      triggerToast("Missing Parameters", "Assign a valid name and coin volume.", "error");
      return;
    }

    const valueEarn = adjustActionType === "Add" ? adjustAmountCoins : 0;
    const valueRedeem = adjustActionType === "Remove" ? adjustAmountCoins : 0;

    const auditLedger: TransactionLedger = {
      id: `TX-${Math.round(9000 + Math.random() * 900)}`,
      customerName: adjustCustomerName,
      orderId: "MANUAL-ADJUST",
      coinsEarned: valueEarn,
      coinsRedeemed: valueRedeem,
      balanceAfter: adjustActionType === "Add" ? 500 + adjustAmountCoins : 150 - adjustAmountCoins,
      type: "Adjustment",
      dateTime: "2026-06-12 09:22"
    };

    setTransactions(prev => [auditLedger, ...prev]);
    setShowAdjustmentModal(false);
    setAdjustCustomerName("");
    setAdjustReasonText("");
    triggerToast("Ledger Balance Adjusted", `Modified coins balance for ${adjustCustomerName} by ${adjustActionType === "Add" ? "+" : "-"}${adjustAmountCoins} coins.`, "success");
  };

  // -------------------------------------------------------------------------
  // Filters Ledger Calculations
  // -------------------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (txSearchQuery) {
        const query = txSearchQuery.toLowerCase();
        const matchesQuery = t.customerName.toLowerCase().includes(query) || 
                             t.id.toLowerCase().includes(query) || 
                             t.orderId.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      if (txTypeFilter !== "All" && t.type !== txTypeFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, txSearchQuery, txTypeFilter]);

  // 1 Googly Coin discount math
  const calculatedDiscountValue = useMemo(() => {
    // Math: Coins / coinRedemptionValue = Rs discount
    if (calcCoinsRedeemInput <= 0) return 0;
    return parseFloat((calcCoinsRedeemInput / config.coinRedemptionValue).toFixed(2));
  }, [calcCoinsRedeemInput, config.coinRedemptionValue]);

  // Earn Math spends
  const calculatedEarnValue = useMemo(() => {
    // Spend amount / 100 * config.coinsPerHundredRs
    if (calcOrderSpendInput < config.minOrderValEarn) return 0;
    const computedAmt = Math.round((calcOrderSpendInput / 100) * config.coinsPerHundredRs);
    return Math.min(computedAmt, config.maxCoinsPerOrder);
  }, [calcOrderSpendInput, config.coinsPerHundredRs, config.minOrderValEarn, config.maxCoinsPerOrder]);

  // -------------------------------------------------------------------------
  // Save Settings Modal Actions
  // -------------------------------------------------------------------------
  const handleFinalApplyChanges = () => {
    // Commit back to system prop level
    setLoyalty({
      coinsPerHundredRs: Number(config.coinsPerHundredRs),
      coinRedemptionValue: Number(config.coinRedemptionValue)
    });

    setShowSaveConfirmModal(false);
    triggerToast(
      "Engine Saved!", 
      `Saved changes successfully: 100 INR spent = ${config.coinsPerHundredRs} coins. Coin Redemption threshold = 10:${config.coinRedemptionValue}.`, 
      "success"
    );
  };

  // -------------------------------------------------------------------------
  // Analytical mock graphs
  // -------------------------------------------------------------------------
  const coinDistributionData = [
    { name: "First Order Bonus", value: 35 },
    { name: "Order checkout earnings", value: 45 },
    { name: "Referral milestones", value: 12 },
    { name: "Birthday surprises", value: 8 }
  ];

  const monthlyGrowthData = [
    { month: "Jan", issued: 12000, redeemed: 8000 },
    { month: "Feb", issued: 15400, redeemed: 9100 },
    { month: "Mar", issued: 19800, redeemed: 12000 },
    { month: "Apr", issued: 22000, redeemed: 14500 },
    { month: "May", issued: 29000, redeemed: 19800 },
    { month: "Jun", issued: 36000, redeemed: 24500 }
  ];

  const tierDistributionData = [
    { name: "Bronze Member", value: 5400, fill: "#b45309" },
    { name: "Silver Member", value: 3400, fill: "#94a3b8" },
    { name: "Gold Member", value: 1900, fill: "#f59e0b" },
    { name: "Platinum Member", value: 850, fill: "#3b82f6" },
    { name: "VIP Elite", value: 300, fill: "#8b5cf6" }
  ];

  const colorsPalette = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];

  return (
    <div className="space-y-6" id="cms-loyalty-coins-program">

      {/* -------------------- MAIN PAGE HEADER -------------------- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 rounded-2xl border border-stone-100 shadow-sm gap-4">
        <div>
          <span className="text-[10px] bg-red-50 text-[#E23744] font-black px-2.5 py-1 rounded-full uppercase tracking-widest block mb-1">AUTOMATED LOYALTY COINS</span>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#E23744]" /> Googly Coins Loyalty Program
          </h1>
          <p className="text-xs text-stone-500 max-w-xl">
            Configure customer cash back values, award multipliers via custom campaigns, configure tier-based multipliers, and inspect financial metrics.
          </p>
        </div>

        {/* Action Header controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => {
              setShowSaveConfirmModal(true);
            }}
            className="p-2.5 px-3.5 bg-[#E23744] hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" /> Save Settings
          </button>

          <button
            onClick={() => {
              setShowPreviewDrawer(true);
            }}
            className="p-2.5 px-3 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Preview Reward Logic
          </button>

          <button
            onClick={() => {
              setActiveTab("Analytics");
              triggerToast("Switched Tab", "Directing to structural engagement trends", "info");
            }}
            className="p-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4" /> View Analytics
          </button>

          <button
            onClick={() => {
              setConfig({
                coinsPerHundredRs: 10,
                coinRedemptionValue: 10,
                minOrderValEarn: 200,
                maxCoinsPerOrder: 150,
                dailyEarningLimit: 500,
                monthlyEarningLimit: 3000,
                enableReferral: true,
                enableBirthday: true,
                enablePromotionalCampaign: true,
                firstOrderBonus: 50,
                referralBonus: 30,
                birthdayBonus: 100,
                festivalBonus: 150,
                minCoinsRedeemRequired: 100,
                maxRedemptionPerOrder: 500,
                maxDiscountPercentAllowed: 30,
                expiryRule: "FixedMonths",
                expiryValue: 12,
                reminderDaysBefore: 7
              });
              triggerToast("Restored Defaults", "Loyalty parameters reverted to global delivery presets.", "info");
            }}
            className="p-2.5 px-3 bg-white hover:bg-stone-100 text-stone-500 font-bold text-xs rounded-xl cursor-pointer border border-stone-200 transition-all"
          >
            Reset Default
          </button>

        </div>
      </div>

      {/* ----------------- SUB-TABS NAVIGATION BAR ----------------- */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1 border border-stone-200 text-xs font-black">
        <button
          onClick={() => setActiveTab("Config")}
          className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeTab === "Config" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"}`}
        >
          ⚙️ Earning & Redemption Config
        </button>
        <button
          onClick={() => setActiveTab("Tiers")}
          className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeTab === "Tiers" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"}`}
        >
          🏆 Loyalty Membership Tiers
        </button>
        <button
          onClick={() => setActiveTab("Campaigns")}
          className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeTab === "Campaigns" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"}`}
        >
          📢 Multiplying Campaigns
        </button>
        <button
          onClick={() => setActiveTab("Notifications")}
          className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeTab === "Notifications" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"}`}
        >
          🔔 Notification Rules
        </button>
        <button
          onClick={() => setActiveTab("Analytics")}
          className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeTab === "Analytics" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"}`}
        >
          📊 Customer Activity Data
        </button>
      </div>

      {/* -------------------- METRIC SUMMARIES OVERVIEW CARDS -------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4" id="cms-loyalty-overview-cards">
        
        {/* Metric 1 */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Total Coins Issued</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-stone-900 font-mono">2.4M</span>
            <span className="text-[10px] bg-red-50 text-[#E23744] font-black px-1 rounded">Issued</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Total Redeemed</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-stone-900 font-mono">1.8M</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1 rounded">75% rate</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Active Members</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-stone-900 font-mono">18,520</span>
            <span className="text-[10px] text-slate-500">Gold/Elite</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Pending Claims</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-[#E23744] font-mono">42.1k</span>
            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1 rounded">Queue</span>
          </div>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Expiring 30d</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-amber-500 font-mono">14,250</span>
            <span className="text-[10px] bg-stone-100 text-stone-500 font-black px-1 rounded">Alert</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Revenue Impact</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-stone-900 font-mono">₹4.8L</span>
            <span className="text-[9px] text-emerald-600 font-bold">+18% repeat</span>
          </div>
        </div>

      </div>

      {/* -------------------- TAB CONTENT 1: CONFIGURATION -------------------- */}
      {activeTab === "Config" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in" id="loyalty-configuration-view">

          {/* Left panel inputs of configs (8 columns) */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Earning regulations */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
                <span className="p-2 bg-red-50 text-[#E23744] rounded-lg">
                  <Coins className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase">Coin Earning Rules</h3>
                  <p className="text-[11px] text-stone-400">Configure core conversion multipliers based on order spend parameters</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-stone-700 font-semibold">
                
                {/* 1 */}
                <div>
                  <label className="block text-stone-600 font-bold mb-1.5">Coins Issued per ₹100 order amount *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={config.coinsPerHundredRs}
                      onChange={(e) => setConfig(prev => ({ ...prev, coinsPerHundredRs: Number(e.target.value) }))}
                      className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:ring-[#E23744] bg-stone-50"
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-mono text-[10px]">COINS</span>
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-1">Example: ₹500 spent gives {Math.round(500/100 * config.coinsPerHundredRs)} coins.</span>
                </div>

                {/* 2 */}
                <div>
                  <label className="block text-stone-600 font-bold mb-1.5">Minimum Order Value Required for Earnings *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={config.minOrderValEarn}
                      onChange={(e) => setConfig(prev => ({ ...prev, minOrderValEarn: Number(e.target.value) }))}
                      className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:ring-[#E23744] bg-stone-50"
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-mono text-[10px]">INR</span>
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-1">Checkout values below this won't get coins.</span>
                </div>

                {/* 3 */}
                <div>
                  <label className="block text-stone-600 font-bold mb-1.5">Maximum Coins obtainable per Order *</label>
                  <input
                    type="number"
                    value={config.maxCoinsPerOrder}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxCoinsPerOrder: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:ring-[#E23744] bg-stone-50"
                  />
                  <span className="text-[10px] text-stone-400 block mt-1">Prevents system exploitation on bulk party orders.</span>
                </div>

                {/* 4 */}
                <div>
                  <label className="block text-stone-600 font-bold mb-1.5">Daily Coin Earning Limit *</label>
                  <input
                    type="number"
                    value={config.dailyEarningLimit}
                    onChange={(e) => setConfig(prev => ({ ...prev, dailyEarningLimit: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:ring-[#E23744] bg-stone-50"
                  />
                  <span className="text-[10px] text-stone-400 block mt-1">Cap of coins a user can collect within 24 hours.</span>
                </div>

              </div>
            </div>

            {/* Bonus rule sets */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Award className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase">Bonus Point Allocations</h3>
                    <p className="text-[11px] text-stone-400">Trigger special bonus coins on signup, birthday, or referrals</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-stone-700 font-semibold">
                
                {/* Rule First Order Bonus */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-stone-900 block">First Order Bonus Coins</span>
                    <span className="text-[10px] bg-stone-200 text-stone-600 font-bold px-1.5 py-0.5 rounded">Enabled</span>
                  </div>
                  <input
                    type="number"
                    value={config.firstOrderBonus}
                    onChange={(e) => setConfig(prev => ({ ...prev, firstOrderBonus: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-lg p-2 font-bold focus:ring-[rgb(226,55,68)] bg-white"
                  />
                  <p className="text-[10px] text-stone-400">Credited on successful signup conversion checkout.</p>
                </div>

                {/* Rule Referral */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-stone-900 block">Referral Invite Coins</span>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, enableReferral: !prev.enableReferral }))}
                      className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer ${config.enableReferral ? "bg-emerald-50 text-emerald-800":"bg-stone-200 text-stone-500"}`}
                    >
                      {config.enableReferral ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={config.referralBonus}
                    onChange={(e) => setConfig(prev => ({ ...prev, referralBonus: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-lg p-2 font-bold focus:ring-[rgb(226,55,68)] bg-white"
                    disabled={!config.enableReferral}
                  />
                  <p className="text-[10px] text-stone-400">Awarded to host when referee orders above model threshold.</p>
                </div>

                {/* Birthday rewards */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-stone-900 block">Birthday Bonus Coins</span>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, enableBirthday: !prev.enableBirthday }))}
                      className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer ${config.enableBirthday ? "bg-emerald-50 text-emerald-800":"bg-stone-200 text-stone-500"}`}
                    >
                      {config.enableBirthday ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={config.birthdayBonus}
                    onChange={(e) => setConfig(prev => ({ ...prev, birthdayBonus: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-lg p-2 font-bold focus:ring-[rgb(226,55,68)] bg-white"
                    disabled={!config.enableBirthday}
                  />
                  <p className="text-[10px] text-stone-400">Automatically credited on user's calendar date match.</p>
                </div>

                {/* Festival bonus */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-stone-900 block">Campaign Festival Overlap Multiplier</span>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, enablePromotionalCampaign: !prev.enablePromotionalCampaign }))}
                      className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer ${config.enablePromotionalCampaign ? "bg-emerald-50 text-emerald-800":"bg-stone-200 text-stone-500"}`}
                    >
                      {config.enablePromotionalCampaign ? "Active" : "Halted"}
                    </button>
                  </div>
                  <input
                    type="number"
                    value={config.festivalBonus}
                    onChange={(e) => setConfig(prev => ({ ...prev, festivalBonus: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-lg p-2 font-bold focus:ring-[rgb(226,55,68)] bg-white"
                    disabled={!config.enablePromotionalCampaign}
                  />
                  <p className="text-[10px] text-stone-400">Extra credit bonus for nationwide festival calendars.</p>
                </div>

              </div>
            </div>

            {/* Coin redemption settings */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase">Coin Redemption Parameters</h3>
                  <p className="text-[11px] text-stone-400">Set discount conversion thresholds and check out limits</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-stone-700 font-semibold">
                
                <div>
                  <label className="block text-stone-600 font-bold mb-1.5">Coins required per ₹1 discount *</label>
                  <input
                    type="number"
                    value={config.coinRedemptionValue}
                    onChange={(e) => setConfig(prev => ({ ...prev, coinRedemptionValue: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:ring-[#E23744] bg-stone-50"
                  />
                  <span className="text-[10px] text-stone-400 block mt-1">Example: 10 Coins = ₹1 Discount (Thus 500 coins = ₹50 discount).</span>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1.5">Minimum Coins required for redemption eligibility *</label>
                  <input
                    type="number"
                    value={config.minCoinsRedeemRequired}
                    onChange={(e) => setConfig(prev => ({ ...prev, minCoinsRedeemRequired: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:ring-[#E23744] bg-stone-50"
                  />
                  <span className="text-[10px] text-stone-400 block mt-1">Ensures customers build threshold buffers before usage.</span>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1.5">Maximum Coins redeemable per single order checkout *</label>
                  <input
                    type="number"
                    value={config.maxRedemptionPerOrder}
                    onChange={(e) => setConfig(prev => ({ ...prev, maxRedemptionPerOrder: Number(e.target.value) }))}
                    className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:ring-[#E23744] bg-stone-50"
                  />
                  <span className="text-[10px] text-stone-400 block mt-1">Limits liability cap limits upon individual merchant checkouts.</span>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1.5 font-semibold">Maximum Discount percentage allowed per ticket *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={config.maxDiscountPercentAllowed}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxDiscountPercentAllowed: Number(e.target.value) }))}
                      className="w-full border border-stone-200 rounded-xl p-2.5 font-bold focus:ring-[#E23744] bg-stone-50"
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-stone-400 block mt-1">Example: Cart values limit coin discount up to {config.maxDiscountPercentAllowed}% of subtotal.</span>
                </div>

              </div>
            </div>

            {/* Expiry config card */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-4">
                <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase">Coin Validity & Expiry Lifespan</h3>
                  <p className="text-[11px] text-stone-400">Establish the legal validity limits and decay logic of coin reserves</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-stone-700 font-semibold">
                
                <div>
                  <label className="block text-stone-600 font-bold mb-1.5">Expiry Policy Option</label>
                  <select
                    value={config.expiryRule}
                    onChange={(e) => setConfig(prev => ({ ...prev, expiryRule: e.target.value as any }))}
                    className="w-full border border-stone-200 rounded-xl p-2.5 focus:ring-[#E23744] bg-stone-50 font-extrabold"
                  >
                    <option value="Never">Coins Never Expire</option>
                    <option value="FixedDays">Expire After Fixed Days</option>
                    <option value="FixedMonths">Expire After Fixed Months</option>
                    <option value="Custom">Custom Expiry Rules</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1.5">Validity Duration value *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={config.expiryValue}
                      onChange={(e) => setConfig(prev => ({ ...prev, expiryValue: Number(e.target.value) }))}
                      className="w-2/3 border border-stone-200 rounded-xl p-2.5 font-bold focus:ring-[#E23744] bg-stone-50"
                      disabled={config.expiryRule === "Never"}
                    />
                    <span className="w-1/3 p-2.5 bg-stone-100 rounded-xl font-bold flex items-center justify-center border text-stone-500">
                      {config.expiryRule === "FixedDays" ? "Days" : "Months"}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-stone-100 pt-3">
                  <div className="flex justify-between items-center bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                    <div>
                      <span className="text-amber-900 font-black text-xs block">Automated Expiry Push reminder alert</span>
                      <p className="text-[10.5px] text-stone-500 font-semibold">Prompt users via push alerts and SMS a few days before expiry cycle launches.</p>
                    </div>

                    <div className="relative w-28">
                      <input
                        type="number"
                        value={config.reminderDaysBefore}
                        onChange={(e) => setConfig(prev => ({ ...prev, reminderDaysBefore: Number(e.target.value) }))}
                        className="w-full border border-stone-200 rounded-xl p-2 font-black focus:ring-[#E23744] bg-white text-center"
                      />
                      <span className="text-[9px] text-stone-400 block text-center mt-1 uppercase font-bold">Days prior</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Right panel live calculations & quick updates (4 columns) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Live calculators card spent earn */}
            <div className="bg-[#1e293b] text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E23744]/13 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-[#E23744] rounded text-white text-[9.5px] font-black uppercase font-mono tracking-widest">REAL-TIME SANDBOX</span>
                <span className="text-[10px] text-zinc-400 font-bold">Simulator v1.2</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-white tracking-tight uppercase">Reward Earning Calculator</h3>
                <p className="text-[10.5px] text-zinc-400 leading-relaxed font-semibold">Verify the coin multiplier output given your customized parameters.</p>
              </div>

              {/* Slider order amount spent */}
              <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-900 space-y-3 text-xs">
                <div className="flex justify-between font-black">
                  <span className="text-zinc-400">Simulate Order Value:</span>
                  <span className="text-white font-mono text-xs">₹{calcOrderSpendInput}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={calcOrderSpendInput}
                  onChange={(e) => setCalcOrderSpendInput(Number(e.target.value))}
                  className="w-full accent-[#E23744] cursor-pointer"
                />
                
                <div className="flex justify-between items-center pt-2.5 border-t border-stone-800/60">
                  <span className="text-zinc-400 font-bold block text-[10.5px]">RESULTANT EARNING</span>
                  <div className="text-right">
                    <span className="text-emerald-400 font-mono text-base font-black block">
                      {calculatedEarnValue} Googly Coins
                    </span>
                    <span className="text-[9px] text-stone-500">
                      {calcOrderSpendInput < config.minOrderValEarn ? `Blocked: Order is below Min ₹${config.minOrderValEarn}` : `Math: Spent amount x loyalty base`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Slider coins required redeem discount */}
              <div className="bg-stone-900/60 p-4 rounded-xl border border-stone-900 space-y-3 text-xs">
                <div className="flex justify-between font-black">
                  <span className="text-zinc-400">Simulate Coin Balance:</span>
                  <span className="text-white font-mono text-xs">{calcCoinsRedeemInput} Coins</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={calcCoinsRedeemInput}
                  onChange={(e) => setCalcCoinsRedeemInput(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />

                <div className="flex justify-between items-center pt-2.5 border-t border-stone-800/60">
                  <span className="text-zinc-400 font-bold block text-[10.5px]">CONVERTED CASH VALUE</span>
                  <div className="text-right">
                    <span className="text-amber-400 font-mono text-base font-black block">
                      - ₹{calculatedDiscountValue} Off
                    </span>
                    <span className="text-[9px] text-stone-500">
                      {calcCoinsRedeemInput < config.minCoinsRedeemRequired ? `Blocked: Requires min ${config.minCoinsRedeemRequired} coins` : `Rate: ${config.coinRedemptionValue} Coins = ₹1`}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Action Manual Adjust */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black text-stone-900 uppercase">Emergency Balance adjustment</h4>
                <p className="text-[10.5px] text-stone-400 font-semibold">Manually adjust loyalty balances for customer service resolution queries.</p>
              </div>

              <button
                onClick={() => {
                  setAdjustCustomerName("");
                  setAdjustAmountCoins(50);
                  setShowAdjustmentModal(true);
                }}
                className="w-full p-2.5 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs rounded-xl cursor-pointer text-center block"
              >
                Launch Coin Adjustment tool
              </button>
            </div>

          </div>

          {/* Bottom Table: COMPLETE TRANSACTION HISTORY LEDGER */}
          <div className="xl:col-span-12 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-stone-200 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="text-sm font-black text-stone-900 uppercase">Interactive Ledger & Audit Trail</h3>
                <p className="text-[11px] text-stone-400">Verify historical coin checkouts, refunds, and promotional awards processed daily</p>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                
                {/* Search query input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search name, txn..."
                    value={txSearchQuery}
                    onChange={(e) => setTxSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E23744] text-xs font-semibold w-48"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                </div>

                {/* Filter Selector */}
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl py-1.5 px-3 font-semibold focus:outline-none"
                >
                  <option value="All">All Transactions</option>
                  <option value="Earned">Earned Checkout</option>
                  <option value="Redeemed">Redeemed Discount</option>
                  <option value="Bonus">Bonus Boosts</option>
                  <option value="Expired">Validity Expired</option>
                  <option value="Adjustment">Admin Manual Logs</option>
                </select>

                <button
                  onClick={() => {
                    triggerToast("Audit Spreadsheet exported", "Historical transaction ledgers saved cleanly.", "success");
                  }}
                  className="p-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Export CSV
                </button>

              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-stone-50 text-stone-400 text-[9.5px] font-black uppercase border-b border-stone-200">
                    <th className="p-4">Transaction ID</th>
                    <th className="p-4">Customer Segment</th>
                    <th className="p-4">Reference ID</th>
                    <th className="p-4 text-center">Coins Earned</th>
                    <th className="p-4 text-center">Coins Redeemed</th>
                    <th className="p-4 text-center">Balance After</th>
                    <th className="p-4">Type</th>
                    <th className="p-4 text-right">Processed DateTime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700 font-semibold">
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-stone-50/50">
                      <td className="p-4 font-mono text-[10.5px] text-zinc-900">{tx.id}</td>
                      <td className="p-4">
                        <span className="font-extrabold text-stone-900 block">{tx.customerName}</span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-[10px]">{tx.orderId}</td>
                      
                      <td className="p-4 text-center text-emerald-600 font-mono font-bold">
                        {tx.coinsEarned > 0 ? `+${tx.coinsEarned}` : "-"}
                      </td>

                      <td className="p-4 text-center text-rose-600 font-mono font-bold">
                        {tx.coinsRedeemed > 0 ? `-${tx.coinsRedeemed}` : "-"}
                      </td>

                      <td className="p-4 text-center font-mono font-black text-stone-900">
                        {tx.balanceAfter}
                      </td>

                      <td className="p-4">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          tx.type === "Earned" ? "bg-emerald-50 text-emerald-800" :
                          tx.type === "Redeemed" ? "bg-rose-50 text-rose-800" :
                          tx.type === "Bonus" ? "bg-indigo-50 text-indigo-800" :
                          tx.type === "Expired" ? "bg-stone-100 text-stone-500" : "bg-purple-50 text-purple-800"
                        }`}>
                          {tx.type}
                        </span>
                      </td>

                      <td className="p-4 font-mono text-stone-400 text-right">{tx.dateTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- TAB CONTENT 2: TIERS MEMBERSHIP -------------------- */}
      {activeTab === "Tiers" && (
        <div className="space-y-6 animate-fade-in" id="cms-loyalty-tier-levels">
          
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] text-[#E23744] font-black uppercase tracking-wider block">TIER SYSTEM (STARBUCKS STYLE)</span>
              <h3 className="text-sm font-black text-stone-900 uppercase">Membership Level Multipliers</h3>
              <p className="text-xs text-stone-500">
                Grant users passive reward boosters, free deliveries, and exclusive cashback ratios automatically as their order totals milestone.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              
              {/* Bronze */}
              <div className="bg-amber-900/5 p-5 rounded-2xl border border-amber-900/10 text-center space-y-3">
                <div className="w-10 h-10 bg-amber-700/10 rounded-full flex items-center justify-center text-amber-900 font-bold mx-auto">
                  🥉
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">Bronze Grade</h4>
                  <span className="text-[10px] text-stone-400 font-semibold block uppercase">0 - 1,000 Milestone Spend</span>
                </div>
                <div className="p-2 bg-white rounded-xl border font-mono text-xs font-black text-stone-900">
                  1.0x Coin Rate
                </div>
                <p className="text-[10px] text-stone-500 leading-snug">Base earning multipliers upon all regular checkouts.</p>
              </div>

              {/* Silver */}
              <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-slate-800 font-bold mx-auto">
                  🥈
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-sm">Silver Grade</h4>
                  <span className="text-[10px] text-stone-400 font-semibold block uppercase">1,001 - 3,000 Milestones</span>
                </div>
                <div className="p-2 bg-white rounded-xl border font-mono text-xs font-black text-[#E23744]">
                  1.2x Coin Booster
                </div>
                <p className="text-[10px] text-stone-500 leading-snug">Passive cashback increments and exclusive monthly coupons.</p>
              </div>

              {/* Gold */}
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 text-center space-y-3">
                <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-amber-900 font-bold mx-auto">
                  ⭐
                </div>
                <div>
                  <h4 className="font-extrabold text-[#f59e0b] text-sm">Gold Premium</h4>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">3,001 - 8,000 Milestones</span>
                </div>
                <div className="p-2 bg-white rounded-xl border font-mono text-xs font-black text-[#f59e0b]">
                   1.5x Coin Booster
                </div>
                <p className="text-[10px] text-stone-500 leading-snug">Free delivery options for restaurants within 3km radii.</p>
              </div>

              {/* Platinum */}
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 text-center space-y-3">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-white font-bold mx-auto">
                  👑
                </div>
                <div>
                  <h4 className="font-extrabold text-blue-900 text-sm">Platinum Elite</h4>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">8,001 - 15,000 Milestone</span>
                </div>
                <div className="p-2 bg-white rounded-xl border font-mono text-xs font-black text-blue-600">
                  2.0x Coin Booster
                </div>
                <p className="text-[10px] text-stone-500 leading-snug">Instant grievance resolutions and free VIP platform access keys.</p>
              </div>

              {/* VIP Member */}
              <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200 text-center space-y-3">
                <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-white font-bold mx-auto">
                  💎
                </div>
                <div>
                  <h4 className="font-extrabold text-purple-900 text-sm">VIP Elite Legend</h4>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase">₹15,000+ Lifetime Spent</span>
                </div>
                <div className="p-2 bg-white rounded-xl border font-mono text-xs font-black text-purple-700">
                   3.0x Ultimate Boost
                </div>
                <p className="text-[10px] text-stone-500 leading-snug">Personal relationship manager & curated chef menu entries.</p>
              </div>

            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase text-stone-900">Passive Tier Promotion threshold rules config</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-stone-800 font-semibold">
              <div>
                <label className="block text-stone-500 font-bold mb-1.5">Gold Tier Entry ticket (INR) *</label>
                <input type="number" defaultValue="3000" className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 font-bold" />
              </div>
              <div>
                <label className="block text-stone-500 font-bold mb-1.5">Free Delivery Perk Distance (km) *</label>
                <input type="number" defaultValue="3" className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 font-bold" />
              </div>
              <div>
                <label className="block text-stone-500 font-bold mb-1.5">VIP customer coin decay duration (months) *</label>
                <input type="number" defaultValue="24" className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 font-bold" />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* -------------------- TAB CONTENT 3: CAMPAIGNS -------------------- */}
      {activeTab === "Campaigns" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in" id="cms-campaign-management">
          
          {/* Create campaign form wizard (5 cols) */}
          <div className="xl:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 uppercase">Schedule New Coins Campaign</h3>
              <p className="text-[11px] text-stone-400">Launch double rewards promotions globally or target precise consumer groups</p>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs font-semibold text-stone-700">
              
              <div>
                <label className="block text-stone-500 font-bold mb-1">Campaign Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Double Coins Christmas Bash"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-2.5 focus:ring-[#E23744] bg-stone-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-500 font-bold mb-1">Coin Multiplier *</label>
                  <select
                    value={newCampMultiplier}
                    onChange={(e) => setNewCampMultiplier(Number(e.target.value))}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 font-bold focus:ring-[#E23744]"
                  >
                    <option value="1.2">1.2x Boost</option>
                    <option value="1.5">1.5x Boost</option>
                    <option value="2.0">2.0x Boost (Double)</option>
                    <option value="3.0">3.0x Boost (Triple)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-500 font-bold mb-1">Eligible Users</label>
                  <select
                    value={newCampUserType}
                    onChange={(e) => setNewCampUserType(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 font-bold focus:ring-[#E23744]"
                  >
                    <option value="All Users">All Customers</option>
                    <option value="New Users">New Signups only</option>
                    <option value="Premium Tier">Gold & Platinum Tier Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-500 font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newCampStartDate}
                    onChange={(e) => setNewCampStartDate(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    value={newCampEndDate}
                    onChange={(e) => setNewCampEndDate(e.target.value)}
                    className="w-full border border-stone-200 rounded-xl p-2.5 bg-stone-50 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full p-2.5 bg-[#E23744] hover:bg-red-700 text-white font-black rounded-xl cursor-pointer text-center text-xs shadow-sm transition-all"
              >
                Schedule Rewards Campaign
              </button>

            </form>
          </div>

          {/* Campaign Schedule Pipeline Grid (7 cols) */}
          <div className="xl:col-span-7 space-y-4">
            <h3 className="text-xs font-black text-stone-900 uppercase">Active & Scheduled Campaign Pipelines</h3>

            <div className="space-y-4">
              {campaigns.map(camp => (
                <div key={camp.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex justify-between items-start gap-4 hover:shadow-md transition-all">
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-stone-900 text-sm">{camp.name}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase leading-relaxed ${
                        camp.status === "Active" ? "bg-emerald-50 text-emerald-800" :
                        camp.status === "Upcoming" ? "bg-indigo-50 text-indigo-800" : "bg-stone-100 text-stone-500"
                      }`}>
                        {camp.status}
                      </span>
                    </div>

                    <div className="text-stone-400 text-xs font-semibold flex items-center gap-3">
                      <span>Targets: <strong className="text-stone-800">{camp.eligibleUsers}</strong></span>
                      <span>•</span>
                      <span>Timeline: {camp.startDate} to {camp.endDate}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-right">
                    <span className="text-xs bg-[#E23744] text-white px-3 py-1 font-black rounded-md font-mono">
                      {camp.multiplier}x Multiplier Boost
                    </span>

                    <button
                      onClick={() => {
                        setCampaigns(prev => prev.filter(c => c.id !== camp.id));
                        triggerToast("Campaign Revoked", "Promotion deleted from upcoming checkouts timeline.", "error");
                      }}
                      className="text-[10px] text-stone-400 hover:text-stone-800 font-bold underline"
                    >
                      Purge
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* -------------------- TAB CONTENT 4: NOTIFICATIONS -------------------- */}
      {activeTab === "Notifications" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in" id="cms-notification-settings">
          
          <div className="xl:col-span-8 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 uppercase">Automated Coins Notifications Rules</h3>
              <p className="text-xs text-stone-500">Enable or suppress auto trigger push notifications on specific actions:</p>
            </div>

            <div className="space-y-5 text-xs text-stone-700 font-semibold">
              
              {/* Notif 1 */}
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border">
                <div>
                  <span className="font-extrabold text-[#E23744] text-xs block">Coins Earned alert</span>
                  <p className="text-[11px] text-stone-400 font-semibold">"Super! You've successfully added 30 Googly coins on order ORD-391."</p>
                </div>

                <div className="flex gap-2">
                  <span className="bg-red-50 text-[#E23744] px-2 py-1 rounded font-bold">Push</span>
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded font-bold">In-App</span>
                  <span className="bg-stone-200 text-stone-400 px-2 py-1 rounded font-bold">SMS</span>
                </div>
              </div>

              {/* Notif 2 */}
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border">
                <div>
                  <span className="font-extrabold text-[#E23744] text-xs block">Coins Redeemed checkout confirmation</span>
                  <p className="text-[11px] text-stone-400 font-semibold">"Success! Redeemed 200 Googly coins. You saved ₹20 discount."</p>
                </div>

                <div className="flex gap-2">
                  <span className="bg-red-50 text-[#E23744] px-2 py-1 rounded font-bold">Push</span>
                  <span className="bg-stone-200 text-stone-400 px-2 py-1 rounded font-bold">SMS</span>
                </div>
              </div>

              {/* Notif 3 */}
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border">
                <div>
                  <span className="font-extrabold text-[#E23744] text-xs block">Coins Expiring Soon urgency alarm</span>
                  <p className="text-[11px] text-stone-400 font-semibold">"Oops! Your 150 Googly coins are expiring in 7 days. Eat yummy pizza now!"</p>
                </div>

                <div className="flex gap-2">
                  <span className="bg-red-50 text-[#E23744] px-2 py-1 rounded font-bold">Push</span>
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded font-bold">SMS</span>
                  <span className="bg-amber-50 text-amber-800 px-2 py-1 rounded font-bold">Email</span>
                </div>
              </div>

              {/* Notif 4 */}
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border">
                <div>
                  <span className="font-extrabold text-[#E23744] text-xs block">Bonus Coins Awarded welcome</span>
                  <p className="text-[11px] text-stone-400 font-semibold">"First order completed! We've added 50 Googly Welcome coins inside your chest!"</p>
                </div>

                <div className="flex gap-2">
                  <span className="bg-red-50 text-[#E23744] px-2 py-1 rounded font-bold">Push</span>
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded font-bold">In-App</span>
                </div>
              </div>

              {/* Notif 5 */}
              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border">
                <div>
                  <span className="font-extrabold text-[#E23744] text-xs block">Tier Upgrade Level celebration</span>
                  <p className="text-[11px] text-stone-400 font-semibold">"Incredible! You've achieved GOLD Member tier. Enjoy 1.5x coin multipliers."</p>
                </div>

                <div className="flex gap-2">
                  <span className="bg-rose-500 text-white px-2 py-1 rounded font-bold">All Channels</span>
                </div>
              </div>

            </div>
          </div>

          <div className="xl:col-span-4 bg-[#1e293b] text-stone-200 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">Broadcast custom coins news</h4>
            <textarea
              placeholder="e.g. Festival double coins active globally for Kolkata!"
              className="w-full bg-stone-900 border border-stone-800 p-3 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-500"
              rows={4}
            />
            <button
              onClick={() => {
                triggerToast("Broadcast queued", "En-route to all active client devices successfully.", "success");
              }}
              className="w-full p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs cursor-pointer block text-center"
            >
              Push Broadcast Message
            </button>
          </div>

        </div>
      )}

      {/* -------------------- TAB CONTENT 5: ANALYTICS -------------------- */}
      {activeTab === "Analytics" && (
        <div className="space-y-6 animate-fade-in" id="cms-loyalty-analytics-report">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Growth Area */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black text-stone-900 uppercase">Monthly loyalty program growth</h4>
                <p className="text-[10px] text-stone-400 font-semibold">Trajectory of total monthly coins issued vs checkout redemptions</p>
              </div>

              <div className="h-64 text-xs font-mono" style={{ minHeight: "256px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={256} minWidth={0}>
                  <AreaChart data={monthlyGrowthData} margin={{ left: -20 }}>
                    <defs>
                      <linearGradient id="issuedG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="redeemedG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" name="Coins Issued" dataKey="issued" stroke="#ef4444" fill="url(#issuedG)" strokeWidth={2.5} />
                    <Area type="monotone" name="Coins Redeemed" dataKey="redeemed" stroke="#10b981" fill="url(#redeemedG)" strokeWidth={2} />
                  </AreaChart>
                </SafeResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Tiers Members */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-black text-stone-900 uppercase">Customer Tier Distribution</h4>
                <p className="text-[10px] text-stone-400 font-semibold">User volumes segment distribution categorized by checkout milestones</p>
              </div>

              <div className="h-64 text-xs" style={{ minHeight: "256px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={256} minWidth={0}>
                  <BarChart data={tierDistributionData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" name="Customers count" fill="#E23744" radius={[0, 4, 4, 0]}>
                      {tierDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </SafeResponsiveContainer>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Box 1 */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-[9px] text-[#E23744] font-black uppercase">Loyalty Engagement Metrics</span>
              <h5 className="text-xl font-black text-stone-900 font-mono">82.3%</h5>
              <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                Percentage of active consumers using coins to reduce ticket prices this quarter.
              </p>
            </div>

            {/* Box 2 */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-[9px] text-emerald-800 font-black uppercase">Repeat Order Rate (Loyalists)</span>
              <h5 className="text-xl font-black text-stone-900 font-mono">+31.5%</h5>
              <p className="text-xs text-stone-600 leading-relaxed font-semibold">
                Increment in order velocity noted upon customers crossing Gold membership thresholds.
              </p>
            </div>

            {/* Box 3 */}
            <div className="bg-stone-900 text-stone-200 p-5 rounded-2xl space-y-2">
              <span className="text-[9px] text-amber-400 font-black uppercase">Platform Liability Reserves</span>
              <h5 className="text-xl font-black text-stone-100 font-mono">₹1.4L</h5>
              <p className="text-xs text-stone-400 leading-relaxed">
                 Financial reserves set aside to reconcile coin expirations and cashback promotions.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* -------------------- CONFIRM ACTION SAVE SETTINGS MODAL -------------------- */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full animate-fade-in space-y-4">
            
            <div className="flex gap-3 items-start">
              <span className="p-2.5 bg-amber-50 rounded-xl text-amber-600 block">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-black text-stone-900">Confirm Rewarded Logic Changes</h3>
                <p className="text-xs text-stone-500">Updating settings will affect future client orders and loyalty payouts.</p>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs text-stone-700 font-semibold">
              <span className="text-[9px] text-[#E23744] font-black block uppercase tracking-wider">CONFIG SUMMARY STATS</span>
              <div className="flex justify-between">
                <span>Earning conversion rates:</span>
                <span className="text-stone-900 font-extrabold font-mono">₹100 spend = {config.coinsPerHundredRs} Googly coins</span>
              </div>
              <div className="flex justify-between">
                <span>Redemption discount:</span>
                <span className="text-stone-900 font-extrabold font-mono">{config.coinRedemptionValue} Coins = ₹1 Discount</span>
              </div>
              <div className="flex justify-between">
                <span>Validity Validity:</span>
                <span className="text-stone-900 font-extrabold font-mono">{config.expiryRule === "Never" ? "Never Expire" : `${config.expiryValue} Months`}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#E23744] bg-red-50 p-3 rounded-lg font-black border border-red-100">
               «Updating these settings will affect future customer rewards calculations and loyalty program behavior.»
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveConfirmModal(false)}
                className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  triggerToast("Draft settings stored", "Loyalty algorithm configuration backed up to memory slots.", "info");
                  setShowSaveConfirmModal(false);
                }}
                className="flex-1 py-1.5 bg-stone-900 hover:bg-stone-900 text-stone-200 font-bold rounded-lg text-xs cursor-pointer"
              >
                Save Draft
              </button>

              <button
                onClick={handleFinalApplyChanges}
                className="flex-1 py-2 bg-[#E23744] hover:bg-red-700 text-white font-black rounded-lg text-xs cursor-pointer"
              >
                Apply Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- MANUAL BALANCE EMERGENCY ADJUSTMENT MODAL -------------------- */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full space-y-4">
            
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="text-xs font-black text-stone-900 uppercase">Emergency Coin Adjustment</span>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-stone-700">
              
              <div>
                <label className="block text-stone-500 font-bold mb-1">Customer Identifier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Subho Maity"
                  value={adjustCustomerName}
                  onChange={(e) => setAdjustCustomerName(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 font-bold"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-bold mb-1">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setAdjustActionType("Add")}
                    className={`p-2 rounded-xl text-center cursor-pointer ${adjustActionType === "Add" ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-700"}`}
                  >
                    Add Balance (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustActionType("Remove")}
                    className={`p-2 rounded-xl text-center cursor-pointer ${adjustActionType === "Remove" ? "bg-rose-600 text-white" : "bg-stone-100 text-stone-700"}`}
                  >
                    Deduct Balance (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">Amount in Googly Coins *</label>
                <input
                  type="number"
                  value={adjustAmountCoins}
                  onChange={(e) => setAdjustAmountCoins(Number(e.target.value))}
                  className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50 font-bold text-center"
                />
              </div>

              <div>
                <label className="block text-stone-600 font-bold mb-1">Audit Reason/Ticket ID *</label>
                <textarea
                  placeholder="e.g. Compensation for long delivery delay ORD-390"
                  value={adjustReasonText}
                  onChange={(e) => setAdjustReasonText(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl p-2 bg-stone-50"
                  rows={2.5}
                />
              </div>

            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustCoinsSubmit}
                className="flex-1 py-1.5 bg-[#E23744] hover:bg-red-700 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Reconcile Coins
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ----------------- PREVIEW DRAWER PORTAL (APP PREVIEW OVERLAY) ----------------- */}
      {showPreviewDrawer && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto flex flex-col p-6 space-y-6 relative border-l animate-slide-in">
            
            <button
              onClick={() => setShowPreviewDrawer(false)}
              className="absolute top-5 right-5 p-1 bg-stone-100 hover:bg-stone-200 text-stone-500 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b pb-2">
              <span className="text-[10px] text-[#E23744] font-black uppercase tracking-wider block">PREVIEW PORTAL</span>
              <h3 className="text-base font-black text-stone-900">Consumer App View simulation</h3>
              <p className="text-xs text-stone-600 font-medium">Verify how Googly Coins rules look on the live consumer interface.</p>
            </div>

            {/* Simulated Smartphone Shell */}
            <div className="border-8 border-stone-900 rounded-[40px] bg-stone-50 w-72 h-[480px] mx-auto overflow-hidden shadow-2xl relative flex flex-col justify-between">
              
              {/* Top Notch notch */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-stone-900 rounded-full z-20 flex justify-center items-center">
                <span className="w-1.5 h-1.5 bg-stone-900 rounded-full mr-2"></span>
                <span className="w-1 h-1 bg-stone-900 rounded-full"></span>
              </div>

              {/* simulated app screen */}
              <div className="p-3 pt-8 overflow-y-auto h-full space-y-4 text-stone-800 text-[11px] font-semibold select-none flex-1">
                
                {/* Screen Header mock */}
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-stone-400 block text-[9px] font-bold">DELIVERING TO</span>
                    <span className="text-stone-900 font-black block">Central Kolkata 📍</span>
                  </div>
                  
                  {/* Coin Badge indicator preview */}
                  <div className="bg-amber-500 text-white p-1 px-2.5 rounded-full flex items-center gap-1 font-bold text-[9px] border border-amber-400 animate-pulse">
                     🪙 250 Coins
                  </div>
                </div>

                {/* Starbucks rewards wallet style inside customer's app */}
                <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-3.5 rounded-2xl border border-stone-700 text-center space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#ef4444]/15 rounded-full blur-xl"></div>
                  <span className="text-[9px] text-[#ef4444] font-black block uppercase tracking-widest">LOYALTY STATUS</span>
                  <div>
                    <span className="text-xs text-stone-300">Your Membership Level:</span>
                    <span className="text-sm font-black text-amber-400 block">⭐ Gold Level multiplier</span>
                  </div>

                  <div className="w-full bg-stone-800 rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: "65%" }}></div>
                  </div>
                  <div className="flex justify-between text-[8px] text-zinc-400">
                    <span>Active balance: 250</span>
                    <span>Next Level: 500</span>
                  </div>
                </div>

                {/* Earning Rules Notification Box */}
                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/50 space-y-1">
                  <span className="text-amber-900 font-extrabold text-[10px] block">📢 Order & Gain Cashback bonus</span>
                  <p className="text-[9.5px] text-zinc-600 font-medium">
                     Spend ₹200 on tasty bites to earn and bank {config.coinsPerHundredRs} Googly coins per ₹100 spent right away!
                  </p>
                </div>

                {/* Simulated Menu Listing */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] text-stone-400 font-black uppercase tracking-wider block text-left">Gourmet Pizza Menu</span>
                  
                  {/* Pizza Card */}
                  <div className="bg-white p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-xs">
                    <div className="space-y-1">
                      <span className="font-extrabold text-stone-900 text-[10.5px] block">Double Cheese Margherita</span>
                      <span className="text-slate-500 text-[9px] block font-semibold">Loaded with fresh premium mozzarella</span>
                      <span className="text-stone-900 font-black font-mono block">₹350</span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="text-[8.5px] bg-[#E23744]/10 text-[#E23744] py-0.5 px-1.5 rounded block">
                        + {Math.round(350/100 * config.coinsPerHundredRs)} coins
                      </span>
                      <button className="bg-[#E23744] text-white p-1 px-3 rounded text-[9.5px] font-bold">Add</button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bot menu tab bars */}
              <div className="bg-white border-t p-2 px-6 flex justify-between items-center text-[10px] text-stone-400 z-10 pointer-events-none">
                <span className="text-[#E23744] font-black">🍟 Home</span>
                <span>🛒 Cart</span>
                <span>👤 Profile</span>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
