import React, { useState, useMemo } from "react";
import { 
  AlertTriangle, Play, RefreshCw, Plus, Trash2, ArrowRight, Save, 
  History, Download, Layers, ShieldCheck, ToggleLeft, ToggleRight, 
  HelpCircle, Sparkles, Filter, ChevronRight, CheckCircle2, Sliders, 
  Info, Users, Store, Bike, FileSpreadsheet, Undo2, Check, X,
  AlertCircle, CloudLightning, ShieldAlert, Cpu
} from "lucide-react";

// --- Types ---
export interface RuleCondition {
  id: string;
  eventType: "customer_cancel" | "rider_cancel" | "restaurant_cancel" | "auto_cancel" | "payment_fail";
  orderStatus: "placed" | "accepted" | "preparing" | "ready" | "picked_up" | "delivery";
  timeCondition: "any" | "after_x_min" | "before_prep" | "during_prep" | "after_pickup" | "during_delivery";
  timeValueMinutes: number;
  orderValueOperator: "any" | "gt" | "lt" | "between";
  orderValue1: number;
  orderValue2: number;
}

export interface RuleAction {
  penaltyType: "percentage" | "fixed" | "none" | "full_refund" | "partial_refund" | "wallet_credit" | "warning";
  penaltyPercent: number;
  penaltyFixedAmount: number;
  refundPercent: number;
  walletCreditAmount: number;
  additionalActions: {
    restrictAccount: boolean;
    suspendUser: boolean;
    ratingImpact: boolean;
    loyaltyDeduction: number;
  };
}

export interface PolicyWorkflow {
  id: string;
  name: string;
  category: "customer" | "restaurant" | "rider" | "system";
  isActive: boolean;
  conditions: RuleCondition;
  action: RuleAction;
}

interface AuditLog {
  id: string;
  policyName: string;
  version: string;
  updatedBy: string;
  previousRule: string;
  newRule: string;
  dateTime: string;
}

interface CancellationPenaltyDashboardProps {
  onSave?: (policies: PolicyWorkflow[]) => void;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function CancellationPenaltyDashboard({
  onSave,
  triggerToast
}: CancellationPenaltyDashboardProps) {

  // -------------------------------------------------------------------------
  // Preset Mock Policy Workflows (Inspired by Shopify Flow & Stripe engine)
  // -------------------------------------------------------------------------
  const [policies, setPolicies] = useState<PolicyWorkflow[]>([
    {
      id: "policy-1",
      name: "Immediate Graceful Cancellation Window",
      category: "customer",
      isActive: true,
      conditions: {
        id: "cond-1",
        eventType: "customer_cancel",
        orderStatus: "placed",
        timeCondition: "before_prep",
        timeValueMinutes: 5,
        orderValueOperator: "any",
        orderValue1: 0,
        orderValue2: 0
      },
      action: {
        penaltyType: "full_refund",
        penaltyPercent: 0,
        penaltyFixedAmount: 0,
        refundPercent: 100,
        walletCreditAmount: 0,
        additionalActions: { restrictAccount: false, suspendUser: false, ratingImpact: false, loyaltyDeduction: 0 }
      }
    },
    {
      id: "policy-2",
      name: "Standard Active Prep Cancellation Fee",
      category: "customer",
      isActive: true,
      conditions: {
        id: "cond-2",
        eventType: "customer_cancel",
        orderStatus: "preparing",
        timeCondition: "during_prep",
        timeValueMinutes: 15,
        orderValueOperator: "any",
        orderValue1: 0,
        orderValue2: 0
      },
      action: {
        penaltyType: "percentage",
        penaltyPercent: 50,
        penaltyFixedAmount: 0,
        refundPercent: 50,
        walletCreditAmount: 0,
        additionalActions: { restrictAccount: false, suspendUser: false, ratingImpact: false, loyaltyDeduction: 50 }
      }
    },
    {
      id: "policy-3",
      name: "Restaurant Late Outbound Decline Penalty",
      category: "restaurant",
      isActive: true,
      conditions: {
        id: "cond-3",
        eventType: "restaurant_cancel",
        orderStatus: "accepted",
        timeCondition: "after_x_min",
        timeValueMinutes: 10,
        orderValueOperator: "gt",
        orderValue1: 500,
        orderValue2: 0
      },
      action: {
        penaltyType: "fixed",
        penaltyPercent: 0,
        penaltyFixedAmount: 150,
        refundPercent: 100,
        walletCreditAmount: 100, // Customer compensation credit
        additionalActions: { restrictAccount: false, suspendUser: false, ratingImpact: true, loyaltyDeduction: 0 }
      }
    },
    {
      id: "policy-4",
      name: "Rider Late Pickup Order Rejection",
      category: "rider",
      isActive: true,
      conditions: {
        id: "cond-4",
        eventType: "rider_cancel",
        orderStatus: "ready",
        timeCondition: "after_pickup",
        timeValueMinutes: 20,
        orderValueOperator: "any",
        orderValue1: 0,
        orderValue2: 0
      },
      action: {
        penaltyType: "fixed",
        penaltyPercent: 0,
        penaltyFixedAmount: 200,
        refundPercent: 100,
        walletCreditAmount: 0,
        additionalActions: { restrictAccount: true, suspendUser: false, ratingImpact: true, loyaltyDeduction: 100 }
      }
    }
  ]);

  // Selected Policy for Visual rule builder target Focus
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("policy-2");

  // Dashboard filter
  const [timeFilter, setTimeFilter] = useState<"Today" | "Last 7 Days" | "Last 30 Days" | "Custom">("Last 30 Days");

  // Visual Theme support for simulation workspace
  const [darkModeWorkspace, setDarkModeWorkspace] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // Policy Specific Master Controls State (For customers, restaurants, riders)
  // -------------------------------------------------------------------------
  const [customerSettings, setCustomerSettings] = useState({
    maxFreeCancellations: 3,
    walletDeductionEnabled: true,
    abuseDetectionSensitivity: "High" as "Low" | "Medium" | "High",
    tempRestrictOnViolations: true,
    loyaltyDeductionMultiplier: 1.5
  });

  const [restaurantSettings, setRestaurantSettings] = useState({
    baseDeclinePenalty: 120,
    customerAutoCompensation: true,
    warningLimitCount: 5,
    warningLookbackDays: 1, // e.g., 5 orders cancels in 24 hours
    tempSuspensionDays: 7,
    suspensionDeclineCount: 15
  });

  const [riderSettings, setRiderSettings] = useState({
    baseRefusalPenalty: 150,
    incentiveDeductionPct: 10,
    ratingReductionValue: 0.5,
    consecutiveRefusalLimit: 3,
    riderSuspensionHours: 48
  });

  // Exception waiver Rules
  const [exceptions, setExceptions] = useState({
    technicalFailures: { waivePenalty: true, fullRefund: true, compCredit: false },
    gatewayIssues: { waivePenalty: true, fullRefund: true, compCredit: false },
    weatherDisasters: { waivePenalty: true, fullRefund: true, compCredit: true },
    closureForceMajeure: { waivePenalty: true, fullRefund: true, compCredit: false }
  });

  // -------------------------------------------------------------------------
  // Simulation Engine State
  // -------------------------------------------------------------------------
  const [simOrderValue, setSimOrderValue] = useState<number>(650);
  const [simOrderStatus, setSimOrderStatus] = useState<RuleCondition["orderStatus"]>("preparing");
  const [simCancelMinutes, setSimCancelMinutes] = useState<number>(12);
  const [simUserType, setSimUserType] = useState<"customer" | "restaurant" | "rider">("customer");
  const [simResult, setSimResult] = useState<{
    computed: boolean;
    policyMatched: PolicyWorkflow | null;
    penaltyResult: string;
    refundAmount: number;
    actionsTaken: string[];
    summary: string;
  } | null>({
    computed: true,
    policyMatched: policies[1],
    penaltyResult: "₹325.00 (50% applied)",
    refundAmount: 325,
    actionsTaken: ["Deduct 50 Loyalty Coins", "No Wallet Warning Restriction triggered"],
    summary: "Matches standard active prep rule tier 2 because order was cancelled during active chef work."
  });

  // -------------------------------------------------------------------------
  // Audit Logs State
  // -------------------------------------------------------------------------
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "VER-4019",
      policyName: "Standard Active Prep Cancellation Fee",
      version: "v3.2",
      updatedBy: "Subhojit Dhar (Admin)",
      previousRule: "If preparing cancel -> charge 40% fee",
      newRule: "If preparing cancel -> charge 50% fee + 50 Loyalty Deduction",
      dateTime: "2026-06-12 09:15"
    },
    {
      id: "VER-4018",
      policyName: "Rider Late Pickup Order Rejection",
      version: "v2.1",
      updatedBy: "Rajdeep Banerjee (Ops Manager)",
      previousRule: "No fixed rider penalty",
      newRule: "If rider late checkout after 20 mins -> Charge Flat ₹200 fee",
      dateTime: "2026-06-11 14:02"
    },
    {
      id: "VER-4017",
      policyName: "Immediate Graceful Cancellation Window",
      version: "v1.9",
      updatedBy: "Siddharth Roy (Product Owner)",
      previousRule: "Waiver within 3 minutes only",
      newRule: "Graceful cancellation threshold promoted up to 5 minutes",
      dateTime: "2026-06-09 11:32"
    }
  ]);

  // Modal Control flags
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSavingInProgress, setIsSavingInProgress] = useState(false);
  const [createPolicyModal, setCreatePolicyModal] = useState(false);

  // New policy builder state
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyCategory, setNewPolicyCategory] = useState<"customer" | "restaurant" | "rider">("customer");

  // Drag-and-drop workflow simulation mock trigger
  const [isDraggingOverTarget, setIsDraggingOverTarget] = useState(false);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName.trim()) {
      triggerToast("Missing Name", "Specify a recognizable policy rule descriptor.", "error");
      return;
    }

    const created: PolicyWorkflow = {
      id: `policy-${Math.round(100 + Math.random() * 899)}`,
      name: newPolicyName,
      category: newPolicyCategory,
      isActive: true,
      conditions: {
        id: `cond-${Math.round(100 + Math.random() * 899)}`,
        eventType: newPolicyCategory === "customer" ? "customer_cancel" : newPolicyCategory === "restaurant" ? "restaurant_cancel" : "rider_cancel",
        orderStatus: "placed",
        timeCondition: "after_x_min",
        timeValueMinutes: 10,
        orderValueOperator: "any",
        orderValue1: 0,
        orderValue2: 0
      },
      action: {
        penaltyType: "percentage",
        penaltyPercent: 20,
        penaltyFixedAmount: 0,
        refundPercent: 80,
        walletCreditAmount: 0,
        additionalActions: { restrictAccount: false, suspendUser: false, ratingImpact: false, loyaltyDeduction: 0 }
      }
    };

    setPolicies(prev => [...prev, created]);
    setSelectedPolicyId(created.id);
    setCreatePolicyModal(false);
    setNewPolicyName("");
    triggerToast("Workflow Block Rendered", `"${created.name}" appended to the visual flow designer.`, "success");
  };

  const activePolicyObj = useMemo(() => {
    return policies.find(p => p.id === selectedPolicyId) || policies[0];
  }, [policies, selectedPolicyId]);

  const updateSelectedPolicyCondition = (updatedCond: Partial<RuleCondition>) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === selectedPolicyId) {
        return {
          ...p,
          conditions: { ...p.conditions, ...updatedCond }
        };
      }
      return p;
    }));
  };

  const updateSelectedPolicyAction = (updatedAction: Partial<RuleAction>) => {
    setPolicies(prev => prev.map(p => {
      if (p.id === selectedPolicyId) {
        return {
          ...p,
          action: { ...p.action, ...updatedAction }
        };
      }
      return p;
    }));
  };

  const handleRunSimulation = () => {
    // Determine applicable rule
    // Matches candidate policy based on Category (userType matched) & condition triggers
    const candidate = policies.find(p => p.isActive && p.category === simUserType);

    if (!candidate) {
      setSimResult({
        computed: true,
        policyMatched: null,
        penaltyResult: "₹0.00 (No Policy Triggered)",
        refundAmount: simOrderValue,
        actionsTaken: ["Standard Processing"],
        summary: "No specified manual penalty rules matched. Falling back to default system full-reimbursement path."
      });
      triggerToast("System Default Applied", "No penalty restrictions matched. Normal processing logic enforced.", "info");
      return;
    }

    // Evaluate Math according to active conditions
    let penalty = 0;
    let refund = simOrderValue;
    const notes: string[] = [];

    const { penaltyType, penaltyPercent, penaltyFixedAmount, refundPercent, walletCreditAmount, additionalActions } = candidate.action;

    if (penaltyType === "percentage") {
      penalty = (simOrderValue * penaltyPercent) / 100;
      refund = Math.max(0, simOrderValue - penalty);
    } else if (penaltyType === "fixed") {
      penalty = penaltyFixedAmount;
      refund = Math.max(0, simOrderValue - penalty);
    } else if (penaltyType === "full_refund") {
      penalty = 0;
      refund = simOrderValue;
    } else if (penaltyType === "partial_refund") {
      refund = (simOrderValue * refundPercent) / 100;
      penalty = simOrderValue - refund;
    } else if (penaltyType === "warning") {
      penalty = 0;
      refund = simOrderValue;
      notes.push("Trigger administrative warning system alert!");
    }

    if (walletCreditAmount > 0) {
      notes.push(`Credit ₹${walletCreditAmount} compensation into customer wallet`);
    }

    if (additionalActions.loyaltyDeduction > 0) {
      notes.push(`Deduct ${additionalActions.loyaltyDeduction} loyalty points/coins`);
    }

    if (additionalActions.suspendUser) {
      notes.push(`Flag member for administrative review suspension`);
    }

    setSimResult({
      computed: true,
      policyMatched: candidate,
      penaltyResult: `₹${penalty.toFixed(2)} (${penaltyType === "percentage" ? `${penaltyPercent}%` : "flat rate"})`,
      refundAmount: refund,
      actionsTaken: notes.length > 0 ? notes : ["Waive penalties", "Allow standard release"],
      summary: `Satisfied criteria of pattern "${candidate.name}". Auto-evaluated cancellation after ${simCancelMinutes} minutes during ${simOrderStatus.toUpperCase()} phase.`
    });

    triggerToast("Simulation Evaluated", `Applicable Flow Rule match: ${candidate.name}`, "success");
  };

  const handleExportSpreadsheet = () => {
    triggerToast("Policy Blueprint Exported", "Exported automated rule matrix configurations as JSON & CSV payload successfully.", "success");
  };

  const handleRestoreAuditVersion = (log: AuditLog) => {
    triggerToast("Version Rollback Initiated", `Reverting rule configuration matrix to version of ${log.dateTime} (${log.version})`, "info");
  };

  const handleProcessPublish = () => {
    setIsSavingInProgress(true);
    setTimeout(() => {
      setIsSavingInProgress(false);
      setShowSaveModal(false);
      if (onSave) {
        onSave(policies);
      }
      triggerToast("Policy Blueprints Deployed", "All IF-THEN workflow rules are compiled and active on future checkout triggers.", "success");
    }, 1200);
  };

  return (
    <div className="space-y-6" id="policy-workflow-manager-dashboard">

      {/* -------------------- 1. PAGE HEADER -------------------- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 rounded-2xl border border-stone-200 shadow-sm gap-4">
        <div>
          <span className="text-[10px] bg-red-50 text-[#E23744] font-black px-2.5 py-1 rounded-full uppercase tracking-widest block mb-1">
            STRIPE & SHOPIFY FLOW PARADIGM
          </span>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#E23744]" /> Cancellation & Penalty Policies
          </h1>
          <p className="text-xs text-stone-500 max-w-xl">
            Configure automated policy flows using reactive IF / THEN logic chains. Control multi-tiered penalties for customers, merchants, and riders seamlessly.
          </p>
        </div>

        {/* Global Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => setCreatePolicyModal(true)}
            className="p-2.5 px-3.5 bg-stone-900 hover:bg-stone-800 text-stone-100 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Create New Policy
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            className="p-2.5 px-4 bg-[#E23744] hover:bg-red-800 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> Save Policies
          </button>

          <button
            onClick={() => {
              const element = document.getElementById("simulate-playground-anchor");
              element?.scrollIntoView({ behavior: "smooth" });
              triggerToast("Simulator Focused", "Inspect penalty calculation payouts dynamically in sandbox context below.", "info");
            }}
            className="p-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Play className="w-4 h-4" /> Test Rules
          </button>

          <button
            onClick={() => {
              const element = document.getElementById("audit-logs-trail-anchor");
              element?.scrollIntoView({ behavior: "smooth" });
              triggerToast("Historical Audits Focused", "Trace previous policy commits.", "info");
            }}
            className="p-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <History className="w-4 h-4" /> View Policy History
          </button>

          <button
            onClick={handleExportSpreadsheet}
            className="p-2.5 px-3 bg-white hover:bg-stone-50 text-stone-500 font-bold border border-stone-200 text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export Policies
          </button>

        </div>
      </div>

      {/* -------------------- 2. DASHBOARD OVERVIEW (METRIC CARDS) -------------------- */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-stone-100 rounded text-[10px] text-stone-600 font-black">
              REAL-TIME INSIGHTS
            </span>
            <span className="text-xs text-stone-500 font-semibold">Track automated penalty resolution efficacy</span>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex bg-stone-100 rounded-lg p-0.5 gap-0.5 text-[11px] font-bold">
            {(["Today", "Last 7 Days", "Last 30 Days", "Custom"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => {
                  setTimeFilter(tab);
                  triggerToast("Telemetry Filtered", `Updated summaries for timeline: ${tab}`, "info");
                }}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${timeFilter === tab ? "bg-white text-stone-900 shadow-xs font-black" : "text-stone-500 hover:text-stone-800"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Summary grid cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          
          <div className="bg-gradient-to-tr from-stone-50 to-stone-50/20 p-4 rounded-xl border border-stone-100 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Active Policies</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black text-stone-900 font-mono">
                {policies.filter(p => p.isActive).length}
              </span>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">ONLINE</span>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-stone-50 to-stone-50/20 p-4 rounded-xl border border-stone-100 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Draft Policies</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black text-stone-600 font-mono">2</span>
              <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1 py-0.5 rounded">STAGED</span>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-stone-50 to-stone-50/20 p-4 rounded-xl border border-stone-100 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Penalties Collected</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black text-stone-900 font-mono">₹48.9k</span>
              <span className="text-[9px] text-[#E23744] font-bold">+12% vs last mth</span>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-stone-50 to-stone-50/20 p-4 rounded-xl border border-stone-100 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Cancellation Rate</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black text-stone-900 font-mono">2.41%</span>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">-0.8% drop</span>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-stone-50 to-stone-50/20 p-4 rounded-xl border border-stone-100 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Auto-Processed</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black text-blue-600 font-mono">98.2%</span>
              <span className="text-[9.5px] text-stone-500 font-semibold">Zero-Ops Manual</span>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-stone-50 to-stone-50/20 p-4 rounded-xl border border-stone-100 shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-1">Policy Violations</span>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-black text-[#E23744] font-mono">14</span>
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded">Flagged</span>
            </div>
          </div>

        </div>
      </div>

      {/* -------------------- 3. VISUAL RULE BUILDER & INTERACTIVE CANVAS -------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="rule-builder-drag-nest">

        {/* Left Side: Policy Select Outline List Sidebar (4 columns) */}
        <div className="xl:col-span-4 bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col shadow-xs">
          
          {/* List header */}
          <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex justify-between items-center text-xs">
            <div>
              <span className="font-extrabold text-stone-900 uppercase">Interactive Rulesets</span>
              <p className="text-[11px] text-stone-400">Click a policy block to open in visually layered editor</p>
            </div>
            <span className="text-[10px] bg-stone-100 border text-stone-600 px-1.5 py-0.5 rounded font-bold font-mono">
              {policies.length} Total
            </span>
          </div>

          {/* Preset list */}
          <div className="divide-y divide-stone-100 overflow-y-auto max-h-[580px] p-2 space-y-1">
            {policies.map(p => {
              const cond = p.conditions;
              const act = p.action;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPolicyId(p.id);
                    triggerToast("Loaded Policy Flow", `Visual designer opened: ${p.name}`, "info");
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer text-xs transition-all border ${
                    selectedPolicyId === p.id 
                      ? "bg-[#E23744]/7 border-[#E23744] shadow-xs scale-[0.99]" 
                      : "bg-white hover:bg-stone-50 border-stone-100 hover:border-stone-200"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-1.5 rounded-lg text-xs ${
                        p.category === "customer" ? "bg-red-50 text-[#E23744]" :
                        p.category === "restaurant" ? "bg-orange-50 text-orange-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>
                        {p.category === "customer" ? <Users className="w-4 h-4" /> :
                         p.category === "restaurant" ? <Store className="w-4 h-4" /> :
                         <Bike className="w-4 h-4" />}
                      </span>
                      <div>
                        <h4 className="font-black text-stone-900 leading-tight">{p.name}</h4>
                        <span className="text-[9.5px] uppercase font-bold text-stone-400 tracking-wider">
                          Role: {p.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Turn off/on toggle status
                        setPolicies(prev => prev.map(item => item.id === p.id ? { ...item, isActive: !item.isActive } : item));
                        triggerToast("Status Switched", `${p.name} status converted cleanly.`, "success");
                      }}
                      className="cursor-pointer"
                    >
                      {p.isActive ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-md">ACTIVE</span>
                      ) : (
                        <span className="bg-stone-100 text-stone-600 text-[9px] font-bold px-1.5 py-0.5 rounded-md">DISABLED</span>
                      )}
                    </button>
                  </div>

                  {/* Micro Summary Bubble */}
                  <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-1.5 text-[10.5px] font-medium leading-relaxed text-stone-500">
                    <div>
                      <span className="text-zinc-400 font-bold block uppercase text-[8px] tracking-wide">Flow Trigger:</span>
                     IF cancel event during <strong className="text-stone-700 uppercase">{cond.orderStatus}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 font-bold block uppercase text-[8px] tracking-wide">Result action:</span>
                     THEN apply <strong className="text-[#E23744]">{act.penaltyType === "percentage" ? `${act.penaltyPercent}% fee` : act.penaltyType === "fixed" ? `₹${act.penaltyFixedAmount} fee` : act.penaltyType === "full_refund" ? "Full Refund":"Partial Refund"}</strong>
                    </div>
                  </div>

                  {/* Option to delete Policy trigger row */}
                  {policies.length > 2 && (
                    <div className="flex justify-end pt-2 pb-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPolicies(prev => prev.filter(item => item.id !== p.id));
                          if (selectedPolicyId === p.id) {
                            setSelectedPolicyId(policies[0].id);
                          }
                          triggerToast("Policy Blueprint Removed", `Policy "${p.name}" has been deleted.`, "error");
                        }}
                        className="text-[9px] font-bold text-stone-400 hover:text-red-700 flex items-center gap-0.5 cursor-pointer pb-1 self-end transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Purge Workflow Block
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Quick Info footer */}
          <div className="p-3.5 bg-stone-50 border-t border-stone-100 space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-stone-500">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <p className="leading-snug font-semibold text-[10.5px]">Policies are assessed in order from top to bottom. Drag & Drop items to prioritize matches.</p>
            </div>
          </div>

        </div>

        {/* Right Side: The visual drag-and-drop rule flow editor canvas (8 columns) */}
        <div className={`xl:col-span-8 rounded-2xl border overflow-hidden flex flex-col shadow-xs transition-colors duration-300 ${
          darkModeWorkspace 
            ? "bg-[#0b1329] border-slate-800 text-slate-100" 
            : "bg-stone-50 border-stone-200 text-stone-900"
        }`}>
          
          {/* Flow Workspace Header controls */}
          <div className={`p-4 border-b flex flex-wrap justify-between items-center gap-2 text-xs ${
            darkModeWorkspace ? "bg-[#111c44] border-slate-800" : "bg-white border-stone-200"
          }`}>
            <div className="flex items-center gap-2">
              <span className={`p-1 rounded font-bold uppercase ${
                darkModeWorkspace ? "bg-stone-800 text-amber-400":"bg-[#E23744]/13 text-[#E23744]"
              }`}>
                IF/THEN STACK ENGINE
              </span>
              <span className="font-extrabold tracking-tight">
                {activePolicyObj.name}
              </span>
            </div>

            {/* Sandbox visual config triggers */}
            <div className="flex items-center gap-2 font-bold text-stone-600">
              <button
                onClick={() => setDarkModeWorkspace(!darkModeWorkspace)}
                className={`p-1.5 px-3 rounded-lg text-[10px] cursor-pointer transition-all ${
                  darkModeWorkspace 
                    ? "bg-slate-800 text-white" 
                    : "bg-stone-200 text-stone-700"
                }`}
              >
                {darkModeWorkspace ? "🌙 Dark Canvas Work" : "☀️ Light Canvas Work"}
              </button>

              <button
                onClick={() => {
                  setPolicies(prev => prev.map(p => p.id === selectedPolicyId ? {
                    ...p,
                    conditions: {
                      id: `cond-${p.id}`,
                      eventType: "customer_cancel",
                      orderStatus: "placed",
                      timeCondition: "any",
                      timeValueMinutes: 0,
                      orderValueOperator: "any",
                      orderValue1: 0,
                      orderValue2: 0
                    },
                    action: {
                      penaltyType: "none",
                      penaltyPercent: 0,
                      penaltyFixedAmount: 0,
                      refundPercent: 100,
                      walletCreditAmount: 0,
                      additionalActions: { restrictAccount: false, suspendUser: false, ratingImpact: false, loyaltyDeduction: 0 }
                    }
                  } : p));
                  triggerToast("Flow Reset Completed", "Workflow block logic re-zeroed.", "info");
                }}
                className={`p-1.5 bg-stone-100 text-stone-600 hover:bg-stone-200 py-1 rounded-lg text-[10px]`}
              >
                Clear Node Values
              </button>
            </div>
          </div>

          {/* DRAG-AND-DROP FLOW WORKSPACE LAYER */}
          <div className="p-6 space-y-6 relative flex-1 min-h-[420px]">
            
            {/* Visual background grid pattern to simulate modular rule engine (Shopify/Zapier) */}
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>

            {/* Simulating Draggable Palette blocks */}
            <div className={`p-3 rounded-xl border flex flex-wrap gap-4 items-center justify-between text-xs font-semibold ${
              darkModeWorkspace ? "bg-[#111c44] border-slate-800":"bg-white border-stone-200"
            }`}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#E23744] rounded-full animate-pulse"></span>
                <span className="text-[11px] text-stone-400 font-extrabold uppercase">Logical Blueprint Elements to drag into Flow:</span>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div 
                  draggable
                  onDragStart={() => {
                    setIsDraggingOverTarget(true);
                    triggerToast("Dragging Block", "Drop block onto flow editor trigger to inject parameters.", "info");
                  }}
                  onDragEnd={() => setIsDraggingOverTarget(false)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded text-rose-800 text-[10px] cursor-grab active:cursor-grabbing font-black flex items-center gap-1"
                >
                  🧩 IF Event Match
                </div>

                <div 
                  draggable
                  onDragStart={() => {
                    setIsDraggingOverTarget(true);
                    triggerToast("Dragging Block", "Drop block onto flow action block to inject custom outcomes.", "info");
                  }}
                  onDragEnd={() => setIsDraggingOverTarget(false)}
                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-emerald-800 text-[10px] cursor-grab active:cursor-grabbing font-black flex items-center gap-1"
                >
                  ⚡ THEN Penalty Action
                </div>

                <div 
                  draggable
                  onDragStart={() => {
                    setIsDraggingOverTarget(true);
                    triggerToast("Dragging Block1", "Drop block onto waiver constraints.", "info");
                  }}
                  onDragEnd={() => setIsDraggingOverTarget(false)}
                  className="p-1.5 bg-yellow-50 hover:bg-yellow-105 border border-yellow-200 rounded text-yellow-850 text-[10px] cursor-grab active:cursor-grabbing font-black flex items-center gap-1"
                >
                  🛡️ EXCEPTION waiver filter
                </div>
              </div>
            </div>

            {/* Draggable Drop Target Sandbox Overlay */}
            {isDraggingOverTarget && (
              <div className="absolute inset-6 bg-[#E23744]/7 border-2 border-dashed border-[#E23744] flex items-center justify-center rounded-2xl z-10 font-black text-xs text-[#E23744] animate-pulse">
                📥 Drop Anywhere here to Auto-Configure Block Settings
              </div>
            )}

            {/* FLOW COMPONENT NODE A: IF-TRIGGER */}
            <div className={`p-5 rounded-2xl border-l-4 shadow-md space-y-4 relative ${
              darkModeWorkspace 
                ? "bg-[#131d45] border-[#E23744] border-t border-r border-b border-t-slate-800 border-r-slate-800 border-b-slate-800" 
                : "bg-white border-[#E23744] border-t border-r border-b border-stone-200"
            }`}>
              <div className="flex justify-between items-center text-xs border-b border-stone-100/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 text-[10px] bg-[#E23744]/15 rounded text-[#E23744] font-black uppercase font-mono">
                    EVENT NODE [IF]
                  </span>
                  <span className="text-stone-400 font-bold">Configure Event Criteria & Thresholds</span>
                </div>
                <HelpCircle className="w-4 h-4 text-stone-400 cursor-help" title="Rules auto-execute when cancellation event details match these inputs." />
              </div>

              {/* Form Controls - Condition builder */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                
                {/* Event options dropdown */}
                <div className="space-y-1">
                  <label className="text-stone-500 block text-[10.5px] font-bold">1. Event Trigger Source Type</label>
                  <select
                    value={activePolicyObj.conditions.eventType}
                    onChange={(e) => updateSelectedPolicyCondition({ eventType: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-bold focus:outline-none focus:ring-1 focus:ring-[#E23744] text-zinc-900"
                  >
                    <option value="customer_cancel">Customer Initiated Cancellation</option>
                    <option value="restaurant_cancel">Restaurant Partner Rejection</option>
                    <option value="rider_cancel">Rider Refused Delivery Assignment</option>
                    <option value="auto_cancel">System Automated Time-out Cancellation</option>
                    <option value="payment_fail">Payment gateway checkout failure</option>
                  </select>
                </div>

                {/* Status dropdown */}
                <div className="space-y-1">
                  <label className="text-stone-500 block text-[10.5px] font-bold">2. Current Order Checkout Stage</label>
                  <select
                    value={activePolicyObj.conditions.orderStatus}
                    onChange={(e) => updateSelectedPolicyCondition({ orderStatus: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-bold focus:outline-none focus:ring-1 focus:ring-[#E23744] text-zinc-900"
                  >
                    <option value="placed">Order Placed (Pending Merchant Acceptance)</option>
                    <option value="accepted">Order Accepted by Kitchen</option>
                    <option value="preparing">Active Food Preparation Started</option>
                    <option value="ready">Ready & Waiting for Rider Pickup</option>
                    <option value="picked_up">Picked Up by Dispatcher</option>
                    <option value="delivery">En Route (Out For Delivery)</option>
                  </select>
                </div>

                {/* Time Based selector */}
                <div className="space-y-1">
                  <label className="text-stone-500 block text-[10.5px] font-bold">3. Logical Time Elapsed Filter</label>
                  <select
                    value={activePolicyObj.conditions.timeCondition}
                    onChange={(e) => updateSelectedPolicyCondition({ timeCondition: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-bold focus:outline-none focus:ring-1 focus:ring-[#E23744] text-zinc-900"
                  >
                    <option value="any">Any Time Interval (Decline anytime)</option>
                    <option value="after_x_min">Cancelled After custom limit (X Minutes)</option>
                    <option value="before_prep">Cancelled before active chef preparation begins</option>
                    <option value="during_prep">Cancelled while food preparation is currently underway</option>
                    <option value="after_pickup">Cancelled after Rider already accepted & picked up order</option>
                    <option value="during_delivery">Decayed / Cancelled during live delivery routing</option>
                  </select>
                </div>

                {/* Config numeric input for limit minutes */}
                <div className="space-y-1">
                  <label className="text-stone-500 block text-[10.5px] font-bold">4. Threshold Limit (In Minutes)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={activePolicyObj.conditions.timeValueMinutes}
                      onChange={(e) => updateSelectedPolicyCondition({ timeValueMinutes: Number(e.target.value) })}
                      disabled={activePolicyObj.conditions.timeCondition === "any"}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-extrabold focus:outline-none text-zinc-900"
                    />
                    <span className="absolute right-3 top-2.5 text-stone-400 text-[10px] font-mono">MINUTES</span>
                  </div>
                </div>

                {/* Order Value condition operators */}
                <div className="space-y-1">
                  <label className="text-stone-500 block text-[10.5px] block font-bold">5. Ticket Cart Value Constraint</label>
                  <select
                    value={activePolicyObj.conditions.orderValueOperator}
                    onChange={(e) => updateSelectedPolicyCondition({ orderValueOperator: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-bold focus:outline-none focus:ring-1 focus:ring-[#E23744] text-zinc-900"
                  >
                    <option value="any">No Value Restriction (All order values)</option>
                    <option value="gt">Ticket value exceeds (Greater Than)</option>
                    <option value="lt">Ticket value is below (Less Than)</option>
                    <option value="between">Ticket value sits within specific zone (Between)</option>
                  </select>
                </div>

                {/* Ticket constraint value */}
                <div className="space-y-1">
                  <label className="text-stone-500 block text-[10.5px] block font-bold">6. Evaluative Cart Target Value(s)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        placeholder="₹ min"
                        value={activePolicyObj.conditions.orderValue1}
                        onChange={(e) => updateSelectedPolicyCondition({ orderValue1: Number(e.target.value) })}
                        disabled={activePolicyObj.conditions.orderValueOperator === "any"}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-black focus:outline-none text-zinc-900 text-center"
                      />
                    </div>
                    {activePolicyObj.conditions.orderValueOperator === "between" && (
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder="₹ max"
                          value={activePolicyObj.conditions.orderValue2}
                          onChange={(e) => updateSelectedPolicyCondition({ orderValue2: Number(e.target.value) })}
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-black text-zinc-900 text-center focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* FLOW INDICATOR PATH VECTOR ARROW */}
            <div className="flex justify-center py-2 relative">
              <div className="w-0.5 h-10 bg-gradient-to-b from-[#E23744] to-emerald-500 absolute left-1/2 -top-2 transform -translate-x-1/2"></div>
              <span className="z-1 text-[11px] bg-emerald-50 text-emerald-800 font-extrabold px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 rotate-90" /> CONNECTED LOGIC STREAM
              </span>
            </div>

            {/* FLOW COMPONENT NODE B: THEN-ACTION */}
            <div className={`p-5 rounded-2xl border-l-4 shadow-md space-y-4 relative ${
              darkModeWorkspace 
                ? "bg-[#131d45] border-emerald-500 border-t border-r border-b border-t-slate-800 border-r-slate-800 border-b-slate-800" 
                : "bg-white border-emerald-500 border-t border-r border-b border-stone-200"
            }`}>
              
              <div className="flex justify-between items-center text-xs border-b border-stone-100/50 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 text-[10px] bg-emerald-500/15 rounded text-emerald-600 font-black uppercase font-mono">
                    ACTION BLOCK [THEN]
                  </span>
                  <span className="text-stone-400 font-bold">Configure Penalties & Refunds</span>
                </div>
                <Info className="w-4 h-4 text-stone-400" />
              </div>

              {/* Action layout fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                
                {/* Penalty options selector */}
                <div className="space-y-1">
                  <label className="text-stone-500 block text-[10.5px] font-bold">1. Primary Resolution Action</label>
                  <select
                    value={activePolicyObj.action.penaltyType}
                    onChange={(e) => updateSelectedPolicyAction({ penaltyType: e.target.value as any })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-bold focus:outline-none text-zinc-900"
                  >
                    <option value="percentage">Apply Percentage Penalty Fee</option>
                    <option value="fixed">Apply Flat Fixed Amount Penalty</option>
                    <option value="none">No Penalty (Waive completely)</option>
                    <option value="full_refund">Full Reimbursement Refund to source</option>
                    <option value="partial_refund">Grant Partial Refund to wallet</option>
                    <option value="wallet_credit">Award wallet credit only</option>
                    <option value="warning">Account Flag Warning System warning</option>
                  </select>
                </div>

                {/* Action input dynamic numeric depending on type */}
                {activePolicyObj.action.penaltyType === "percentage" && (
                  <div className="space-y-1">
                    <label className="text-stone-500 block text-[10.5px] font-bold">2. Penalty Percentage (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activePolicyObj.action.penaltyPercent}
                        onChange={(e) => updateSelectedPolicyAction({ penaltyPercent: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-black focus:outline-none text-zinc-900"
                      />
                      <span className="absolute right-3 top-2.5 text-stone-400 font-bold">%</span>
                    </div>
                  </div>
                )}

                {activePolicyObj.action.penaltyType === "fixed" && (
                  <div className="space-y-1">
                    <label className="text-stone-500 block text-[10.5px] font-bold">2. Flat Fine Penalty Amount</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={activePolicyObj.action.penaltyFixedAmount}
                        onChange={(e) => updateSelectedPolicyAction({ penaltyFixedAmount: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-black text-zinc-900 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-stone-400 font-bold">INR (₹)</span>
                    </div>
                  </div>
                )}

                {activePolicyObj.action.penaltyType === "partial_refund" && (
                  <div className="space-y-1">
                    <label className="text-stone-500 block text-[10.5px] font-bold">2. Refund Allowance percentage</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activePolicyObj.action.refundPercent}
                        onChange={(e) => updateSelectedPolicyAction({ refundPercent: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-black text-zinc-900 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-stone-400 font-bold">%</span>
                    </div>
                  </div>
                )}

                {activePolicyObj.action.penaltyType === "wallet_credit" && (
                  <div className="space-y-1">
                    <label className="text-stone-500 block text-[10.5px] font-bold">2. Wallet Compensation Credit</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={activePolicyObj.action.walletCreditAmount}
                        onChange={(e) => updateSelectedPolicyAction({ walletCreditAmount: Number(e.target.value) })}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-black text-zinc-900 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2.5 text-stone-400 font-bold">₹</span>
                    </div>
                  </div>
                )}

                {/* Additional multi actions toggles */}
                <div className="md:col-span-2 border-t border-stone-100/50 pt-3.5 mt-2.5 space-y-3">
                  <span className="text-stone-500 block text-[9.5px] font-extrabold uppercase tracking-widest block">
                    ⚡ MULTI-TIER WORKFLOW SUBSYTEM AUTOMATIONS
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    
                    <button
                      onClick={() => updateSelectedPolicyAction({
                        additionalActions: {
                          ...activePolicyObj.action.additionalActions,
                          restrictAccount: !activePolicyObj.action.additionalActions.restrictAccount
                        }
                      })}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        activePolicyObj.action.additionalActions.restrictAccount
                          ? "bg-red-50/70 border-rose-400 text-[#E23744]" 
                          : "bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      <span>🚫 Flag Abuse Limit</span>
                      {activePolicyObj.action.additionalActions.restrictAccount ? "ON" : "OFF"}
                    </button>

                    <button
                      onClick={() => updateSelectedPolicyAction({
                        additionalActions: {
                          ...activePolicyObj.action.additionalActions,
                          suspendUser: !activePolicyObj.action.additionalActions.suspendUser
                        }
                      })}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        activePolicyObj.action.additionalActions.suspendUser
                          ? "bg-red-50/70 border-rose-400 text-[#E23744]" 
                          : "bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      <span>🔒 Auto Suspend Node</span>
                      {activePolicyObj.action.additionalActions.suspendUser ? "ON" : "OFF"}
                    </button>

                    <button
                      onClick={() => updateSelectedPolicyAction({
                        additionalActions: {
                          ...activePolicyObj.action.additionalActions,
                          ratingImpact: !activePolicyObj.action.additionalActions.ratingImpact
                        }
                      })}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        activePolicyObj.action.additionalActions.ratingImpact
                          ? "bg-amber-50/60 border-amber-300 text-amber-700" 
                          : "bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-700"
                      }`}
                    >
                      <span>📉 Reduce Trust Rating</span>
                      {activePolicyObj.action.additionalActions.ratingImpact ? "ON" : "OFF"}
                    </button>

                    {/* Deduct loyalty rewards */}
                    <div className="bg-stone-50/50 p-1.5 px-2.5 border border-stone-200 rounded-xl flex items-center gap-1.5 justify-between">
                      <span className="text-[10px] text-stone-500 block leading-tight">Deduct Loyalty:</span>
                      <input
                        type="number"
                        value={activePolicyObj.action.additionalActions.loyaltyDeduction}
                        onChange={(e) => updateSelectedPolicyAction({
                          additionalActions: {
                            ...activePolicyObj.action.additionalActions,
                            loyaltyDeduction: Number(e.target.value)
                          }
                        })}
                        className="w-14 p-1 rounded border bg-white focus:outline-none font-bold text-center text-stone-900"
                      />
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Quick action preview save row */}
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => {
                  triggerToast("Draft Saved Locally", `Rule parameters for "${activePolicyObj.name}" cached successfully.`, "success");
                }}
                className="px-4 py-2 bg-stone-900 border text-stone-100 hover:bg-stone-800 text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Save This Rule Workflow
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* -------------------- 4. THREE CONCRETE USER TARGET SPECIFICS WIDGETS -------------------- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* CUSTOMER PROFILE POLICY PARAMETERS */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
            <span className="p-2 bg-red-50 text-[#E23744] rounded-xl"><Users className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="text-xs font-black text-stone-900 uppercase">Customer Profile Constraints</h3>
              <p className="text-[10px] text-stone-400">Apply safety limits on consumer cancellation abuses</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs text-stone-600 font-semibold">
            
            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Max Free Cancellations per Month</span>
                <p className="text-[10px] text-stone-400">Resets on 1st calendar date globally</p>
              </div>
              <input
                type="number"
                value={customerSettings.maxFreeCancellations}
                onChange={(e) => setCustomerSettings(prev => ({ ...prev, maxFreeCancellations: Number(e.target.value) }))}
                className="w-16 p-1 bg-stone-50 border rounded text-center font-bold text-stone-900"
              />
            </div>

            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Allow Direct Wallet Debit Fee Deductions</span>
                <p className="text-[10px] text-stone-400">Withdraw penalty fines directly from active wallets</p>
              </div>
              <button
                onClick={() => setCustomerSettings(prev => ({ ...prev, walletDeductionEnabled: !prev.walletDeductionEnabled }))}
                className="cursor-pointer"
              >
                {customerSettings.walletDeductionEnabled ? (
                  <ToggleRight className="w-8 h-8 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-stone-400" />
                )}
              </button>
            </div>

            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Abuse Intelligence Scan Sensitivity</span>
                <p className="text-[10px] text-stone-400">Block profiles flag thresholds</p>
              </div>
              <select
                value={customerSettings.abuseDetectionSensitivity}
                onChange={(e) => setCustomerSettings(prev => ({ ...prev, abuseDetectionSensitivity: e.target.value as any }))}
                className="p-1 px-1.5 bg-stone-50 border rounded font-black text-stone-900 text-[10px]"
              >
                <option value="Low">Low Accuracy</option>
                <option value="Medium">Medium Shield</option>
                <option value="High">High AI Shield</option>
              </select>
            </div>

            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Restrict Account on Frequent Infractions</span>
                <p className="text-[10px] text-stone-400">Cool down periods after warning</p>
              </div>
              <button
                onClick={() => setCustomerSettings(prev => ({ ...prev, tempRestrictOnViolations: !prev.tempRestrictOnViolations }))}
                className="cursor-pointer"
              >
                {customerSettings.tempRestrictOnViolations ? (
                  <ToggleRight className="w-8 h-8 text-[#E23744]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-stone-400" />
                )}
              </button>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-250 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[9.5px] text-stone-600 leading-relaxed font-semibold">Customers with active restrictions are routed directly to visual support bots before any checkout approvals are authorized.</p>
            </div>

          </div>
        </div>

        {/* RESTAURANT POLICY PROFILE COMPULSARY CHECKLIST */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
            <span className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Store className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="text-xs font-black text-stone-900 uppercase">Restaurant Penalty Constraints</h3>
              <p className="text-[10px] text-stone-400">Define SLA metrics for restaurant rejection penalties</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs text-stone-600 font-semibold">
            
            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Base Decline Penalty Fine</span>
                <p className="text-[10px] text-stone-400">Charged on cancels after kitchen acceptance</p>
              </div>
              <input
                type="number"
                value={restaurantSettings.baseDeclinePenalty}
                onChange={(e) => setRestaurantSettings(prev => ({ ...prev, baseDeclinePenalty: Number(e.target.value) }))}
                className="w-16 p-1 bg-stone-50 border rounded text-center font-bold text-stone-900"
              />
            </div>

            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Auto Compensation to Customers</span>
                <p className="text-[10px] text-stone-400">Automatically assign voucher credit on cancellation</p>
              </div>
              <button
                onClick={() => setRestaurantSettings(prev => ({ ...prev, customerAutoCompensation: !prev.customerAutoCompensation }))}
                className="cursor-pointer"
              >
                {restaurantSettings.customerAutoCompensation ? (
                  <ToggleRight className="w-8 h-8 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-stone-400" />
                )}
              </button>
            </div>

            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Declines Count for Auto warning</span>
                <p className="text-[10px] text-stone-400">Limits inside lookback timeline</p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={restaurantSettings.warningLimitCount}
                  onChange={(e) => setRestaurantSettings(prev => ({ ...prev, warningLimitCount: Number(e.target.value) }))}
                  className="w-10 p-0.5 bg-stone-50 border rounded text-center font-bold text-[10px]"
                />
                <span className="text-[9px] text-stone-500 uppercase">cancels / 24h</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Temporary Suspension threshold</span>
                <p className="text-[10px] text-stone-400">Auto suspend outlet for 7 days on high declines</p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={restaurantSettings.suspensionDeclineCount}
                  onChange={(e) => setRestaurantSettings(prev => ({ ...prev, suspensionDeclineCount: Number(e.target.value) }))}
                  className="w-10 p-0.5 bg-stone-50 border rounded text-center font-bold text-[10px]"
                />
                <span className="text-[9px] text-stone-500 uppercase">cancels / 7d</span>
              </div>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-[9.5px] text-stone-600 leading-relaxed font-semibold">
              🚨 Suspended restaurant listings are hidden from client GPS feeds immediately. Requires manual admin clearance before re-activating profiles.
            </div>

          </div>
        </div>

        {/* RIDER POLICY PROFILE CONFIG FILE */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-stone-100">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Bike className="w-4.5 h-4.5" /></span>
            <div>
              <h3 className="text-xs font-black text-stone-900 uppercase">Rider Action Penalties</h3>
              <p className="text-[10px] text-stone-400">Establish SLA criteria for dispatcher cancellations</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs text-stone-600 font-semibold">
            
            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Late Pickup Rider Penalty</span>
                <p className="text-[10px] text-stone-400">Fines deducted from next payout period</p>
              </div>
              <input
                type="number"
                value={riderSettings.baseRefusalPenalty}
                onChange={(e) => setRiderSettings(prev => ({ ...prev, baseRefusalPenalty: Number(e.target.value) }))}
                className="w-16 p-1 bg-stone-50 border rounded text-center font-bold text-stone-900"
              />
            </div>

            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Incentive Commission Deduct (%)</span>
                <p className="text-[10px] text-stone-400">Deduct weekly bonus payouts on violations</p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={riderSettings.incentiveDeductionPct}
                  onChange={(e) => setRiderSettings(prev => ({ ...prev, incentiveDeductionPct: Number(e.target.value) }))}
                  className="w-12 p-1 bg-stone-50 border rounded text-center font-bold"
                />
                <span className="text-[10px] text-stone-400">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Trust Rating impact factor (Friction)</span>
                <p className="text-[10px] text-stone-400">Rating decay multiplier on dropouts</p>
              </div>
              <input
                type="number"
                step="0.1"
                value={riderSettings.ratingReductionValue}
                onChange={(e) => setRiderSettings(prev => ({ ...prev, ratingReductionValue: Number(e.target.value) }))}
                className="w-16 p-1 bg-stone-50 border rounded text-center font-bold text-stone-900"
              />
            </div>

            <div className="flex justify-between items-center text-[10.5px]">
              <div>
                <span className="text-stone-800 font-extrabold block">Consecutive Rejections suspension Limit</span>
                <p className="text-[10px] text-stone-400">Locks terminal dispatch for 48 hours</p>
              </div>
              <input
                type="number"
                value={riderSettings.consecutiveRefusalLimit}
                onChange={(e) => setRiderSettings(prev => ({ ...prev, consecutiveRefusalLimit: Number(e.target.value) }))}
                className="w-16 p-1 bg-stone-50 border rounded text-center font-bold"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-[9.5px] text-stone-600 leading-relaxed font-semibold">
              ⚡ Riders violating the rejections limit automatically undergo dynamic dispatch routing locks and lose delivery priorities.
            </div>

          </div>
        </div>

      </div>

      {/* -------------------- 5. EXCEPTION WAIVER RULES MODULE -------------------- */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
          <span className="p-2 bg-[#E23744]/11 text-[#E23744] rounded-xl"><CloudLightning className="w-5 h-5 animate-bounce" /></span>
          <div>
            <h3 className="text-sm font-black text-stone-900 uppercase">Automated Force Majeure Exemption Rules</h3>
            <p className="text-xs text-stone-400">Define rule exceptions waiver system when checkout nodes experience external friction events</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
          
          {/* Wave 1 */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-900 font-extrabold block text-[11px]">⚙️ System Technical Failures</span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">Active Exception</span>
            </div>
            
            <div className="space-y-1.5 text-[10.5px] text-stone-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exceptions.technicalFailures.waivePenalty}
                  onChange={(e) => setExceptions(prev => ({ ...prev, technicalFailures: { ...prev.technicalFailures, waivePenalty: e.target.checked } }))}
                  className="rounded text-[#E23744] accent-[#E23744]"
                />
                Auto Waive Penalty
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exceptions.technicalFailures.fullRefund}
                  onChange={(e) => setExceptions(prev => ({ ...prev, technicalFailures: { ...prev.technicalFailures, fullRefund: e.target.checked } }))}
                  className="rounded text-[#E23744] accent-[#E23744]"
                />
                Trigger Full Refund
              </label>
            </div>
          </div>

          {/* Wave 2 */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-900 font-extrabold block text-[11px]">💳 Payment Gateway Down</span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">Active Exception</span>
            </div>
            
            <div className="space-y-1.5 text-[10.5px] text-stone-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exceptions.gatewayIssues.waivePenalty}
                  onChange={(e) => setExceptions(prev => ({ ...prev, gatewayIssues: { ...prev.gatewayIssues, waivePenalty: e.target.checked } }))}
                  className="rounded text-[#E23744] accent-[#E23744]"
                />
                Auto Waive Penalty
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exceptions.gatewayIssues.fullRefund}
                  onChange={(e) => setExceptions(prev => ({ ...prev, gatewayIssues: { ...prev.gatewayIssues, fullRefund: e.target.checked } }))}
                  className="rounded text-[#E23744] accent-[#E23744]"
                />
                Trigger Full Refund
              </label>
            </div>
          </div>

          {/* Wave 3 */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-900 font-extrabold block text-[11px]">⛈️ Extreme Weather Alert</span>
              <span className="text-[10px] bg-[#E23744] text-white font-bold px-1.5 py-0.5 rounded">Weather Grid</span>
            </div>
            
            <div className="space-y-1.5 text-[10.5px] text-stone-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exceptions.weatherDisasters.waivePenalty}
                  onChange={(e) => setExceptions(prev => ({ ...prev, weatherDisasters: { ...prev.weatherDisasters, waivePenalty: e.target.checked } }))}
                  className="rounded text-[#E23744] accent-[#E23744]"
                />
                Auto Waive Penalty
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exceptions.weatherDisasters.fullRefund}
                  onChange={(e) => setExceptions(prev => ({ ...prev, weatherDisasters: { ...prev.weatherDisasters, fullRefund: e.target.checked } }))}
                  className="rounded text-[#E23744] accent-[#E23744]"
                />
                Trigger Full Refund
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exceptions.weatherDisasters.compCredit}
                  onChange={(e) => setExceptions(prev => ({ ...prev, weatherDisasters: { ...prev.weatherDisasters, compCredit: e.target.checked } }))}
                  className="rounded text-[#E23744] accent-[#E23744]"
                />
                Credit Compensation (₹100)
              </label>
            </div>
          </div>

          {/* Wave 4 */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-stone-900 font-extrabold block text-[11px]">🚪 Merchant Closure Alert</span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded">Active Exception</span>
            </div>
            
            <div className="space-y-1.5 text-[10.5px] text-stone-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exceptions.closureForceMajeure.waivePenalty}
                  onChange={(e) => setExceptions(prev => ({ ...prev, closureForceMajeure: { ...prev.closureForceMajeure, waivePenalty: e.target.checked } }))}
                  className="rounded text-[#E23744] accent-[#E23744]"
                />
                Auto Waive Penalty
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exceptions.closureForceMajeure.fullRefund}
                  onChange={(e) => setExceptions(prev => ({ ...prev, closureForceMajeure: { ...prev.closureForceMajeure, fullRefund: e.target.checked } }))}
                  className="rounded text-[#E23744] accent-[#E23744]"
                />
                Trigger Full Refund
              </label>
            </div>
          </div>

        </div>
      </div>

      {/* -------------------- 6. RULE TESTING SIMULATOR PLAYGROUND -------------------- */}
      <div className="bg-[#111c44] text-[#eceff1] p-6 rounded-2xl border border-slate-900 shadow-xl" id="simulate-playground-anchor">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 gap-3">
          <div>
            <span className="text-[9.5px] bg-[#E23744] text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider block mb-1">
              AUTOMATION SANDBOX WORKSPACE
            </span>
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#E23744]" /> Rule Testing Simulation Playground
            </h3>
            <p className="text-xs text-slate-400">Validate final refund payouts & penalty actions safely before production publishing.</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-400 text-xs font-semibold">Ready status:</span>
            <span className="bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10.5px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span> ONLINE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
          
          {/* Sim params inputs (5 cols) */}
          <div className="xl:col-span-5 space-y-4 text-xs font-semibold">
            
            {/* Input 1 */}
            <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 block pb-1 text-[10.5px]">Simulation Order Amount Cart Value</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="50"
                  value={simOrderValue}
                  onChange={(e) => setSimOrderValue(Number(e.target.value))}
                  className="flex-1 accent-[#E23744] cursor-pointer"
                />
                <span className="text-white font-mono font-black border border-slate-800 bg-slate-900 p-1.5 px-3 rounded-lg w-20 text-center">
                  ₹{simOrderValue}
                </span>
              </div>
            </div>

            {/* Input 2 */}
            <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <label className="text-[#90a4ae] block text-[10.5px]">Trigger Actor Type</label>
              <select
                value={simUserType}
                onChange={(e) => setSimUserType(e.target.value as any)}
                className="w-full bg-[#1c2a5c] border border-slate-800 rounded-lg p-2 font-bold text-white focus:outline-none"
              >
                <option value="customer">Customer Profile</option>
                <option value="restaurant">Partner Restaurant</option>
                <option value="rider">Rider Delivery Node</option>
              </select>
            </div>

            {/* Input 3 */}
            <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <label className="text-[#90a4ae] block text-[10.5px]">Simulation Order Status Stage</label>
              <select
                value={simOrderStatus}
                onChange={(e) => setSimOrderStatus(e.target.value as any)}
                className="w-full bg-[#1c2a5c] border border-slate-800 rounded-lg p-2 font-bold text-white focus:outline-none"
              >
                <option value="placed">Order Just Placed</option>
                <option value="accepted">Accepted by Merchant</option>
                <option value="preparing">Active Food Preparation Started</option>
                <option value="ready">Ready & Waiting for Dispatch</option>
                <option value="picked_up">Picked Up by Rider</option>
                <option value="delivery">Out For Delivery (Routed)</option>
              </select>
            </div>

            {/* Input 4 */}
            <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 block pb-1 text-[10.5px]">Time Passed since Event Lock (Minutes)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={simCancelMinutes}
                  onChange={(e) => setSimCancelMinutes(Number(e.target.value))}
                  className="flex-1 accent-[#E23744] cursor-pointer"
                />
                <span className="text-white font-mono font-black border border-slate-800 bg-slate-900 p-1.5 px-3 rounded-lg w-20 text-center">
                  {simCancelMinutes} Min
                </span>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              className="w-full p-3 bg-[#E23744] hover:bg-red-700 text-white font-black rounded-xl cursor-pointer text-center block text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-white" /> Compute Scenario Resolution logic
            </button>

          </div>

          {/* Sim math results panel (7 cols) */}
          <div className="xl:col-span-7 bg-slate-900 p-5 rounded-2xl border border-slate-900 space-y-4">
            <span className="text-[10px] text-zinc-550 block font-black uppercase tracking-widest">
              RESULTING SIMULATION RESOLUTION MATRIX
            </span>

            {simResult && simResult.computed ? (
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Result Card 1 */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[9.5px] text-slate-500 uppercase font-black block">Applicable Policy Match</span>
                    <p className="text-xs font-black text-rose-400 leading-tight">
                      {simResult.policyMatched ? simResult.policyMatched.name : "Default Global Policy"}
                    </p>
                  </div>

                  {/* Result Card 2 */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[9.5px] text-slate-500 uppercase font-black block">Calculated Fine Penalty</span>
                    <p className="text-xs font-bold font-mono text-white text-base">
                      {simResult.penaltyResult}
                    </p>
                  </div>

                  {/* Result Card 3 */}
                  <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-900 space-y-1">
                    <span className="text-[9.5px] text-slate-500 uppercase font-black block">Net Customer Refund payout</span>
                    <p className="text-xs font-bold font-mono text-emerald-400 text-base">
                      ₹{simResult.refundAmount.toFixed(2)}
                    </p>
                  </div>

                </div>

                {/* Automation triggers list */}
                <div className="space-y-2 bg-slate-900/40 p-3.5 rounded-xl border border-slate-900">
                  <span className="text-[9px] text-[#90a4ae] block font-black uppercase">Automated Action Node Triggers</span>
                  <div className="space-y-1.5 text-xs text-stone-300">
                    {simResult.actionsTaken.map((act, i) => (
                      <div key={i} className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analytical recap summary */}
                <div className="p-3 bg-indigo-900/40 rounded-xl border border-indigo-900 text-indigo-200 text-xs">
                  <div className="flex gap-2">
                    <span className="p-1 px-1.5 bg-indigo-900 rounded font-black text-[9px] uppercase self-start">EXPLANATORY LOGIC</span>
                    <p className="leading-relaxed font-semibold">{simResult.summary}</p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-2">
                <Sliders className="w-8 h-8 text-slate-600 animate-bounce" />
                <p className="text-xs">Adjust checkout metrics on the left panel and click Run to calculate.</p>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* -------------------- 7. AUDIT LOGS & POLICY HISTORY -------------------- */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs" id="audit-logs-trail-anchor">
        <div className="p-5 border-b border-stone-200 bg-stone-50/40 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="text-sm font-black text-stone-900 uppercase">Policy Versioning Audit Logs</h3>
            <p className="text-[11px] text-stone-400">Track and roll back historic rule calibrations updated by team managers</p>
          </div>

          <button
            onClick={() => {
              triggerToast("Historical Audits Exported", "Spreadsheet downloaded cleanly.", "success");
            }}
            className="p-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Export Logs Spreadsheet
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50 text-stone-400 text-[9.5px] font-black uppercase tracking-wider border-b border-stone-200">
                <th className="p-4">Version Ref</th>
                <th className="p-4">Policy Impacted</th>
                <th className="p-4">Updated By</th>
                <th className="p-4">Previous Rule Schema</th>
                <th className="p-4">New Deployed Schema</th>
                <th className="p-4 text-right">Commit DateTime</th>
                <th className="p-4 text-right">Action Rollback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700 font-semibold font-semibold">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-stone-50/50">
                  <td className="p-4 font-mono font-black text-zinc-900">{log.id}</td>
                  <td className="p-4 text-stone-900 font-extrabold">{log.policyName}</td>
                  <td className="p-4 font-semibold text-stone-500">{log.updatedBy}</td>
                  <td className="p-4 font-mono text-[10px] text-rose-600">{log.previousRule}</td>
                  <td className="p-4 font-mono text-[10px] text-emerald-600">{log.newRule}</td>
                  <td className="p-4 text-right font-mono text-stone-500 text-[10.5px]">{log.dateTime}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleRestoreAuditVersion(log)}
                      className="text-[#E23744] hover:text-red-800 font-black cursor-pointer text-[10.5px] flex items-center gap-1 ml-auto"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> Restore This
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* -------------------- 8. SAVE POLICY CONFIRMATION WORKFLOW MODAL -------------------- */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 bg-stone-50 flex justify-between items-center">
              <span className="font-extrabold text-stone-900 text-sm uppercase tracking-tight flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-[#E23744]" /> Deploy Rule Engine updates
              </span>
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-1.5 hover:bg-stone-200 text-stone-500 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal content summary details */}
            <div className="p-6 space-y-4 text-xs font-semibold">
              
              <p className="text-[12.5px] text-stone-600 leading-relaxed font-semibold">You are publishing the candidate policy rules block list. Please review the operational metric aggregates below safely before executing deploy commands:</p>

              {/* Aggregations list */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2 text-stone-600">
                <div className="flex justify-between">
                  <span>Count of Rules compiled:</span>
                  <strong className="text-stone-900 font-mono text-xs">{policies.length} Live Rules</strong>
                </div>
                <div className="flex justify-between">
                  <span>Active condition nodes:</span>
                  <strong className="text-zinc-900 font-bold">12 Criteria Matches</strong>
                </div>
                <div className="flex justify-between">
                  <span>Fine Penalty types evaluated:</span>
                  <strong className="text-stone-900 font-bold">Flat values / Percentage Fees</strong>
                </div>
                <div className="flex justify-between">
                  <span>Affected User Profiles:</span>
                  <strong className="text-[#E23744] block">Consumers, Rider Dispatchers, Cook outlets</strong>
                </div>
              </div>

              {/* Warning warning warning text */}
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-red-900 font-extrabold block text-[11px]">Deploy Warning alert:</span>
                  <p className="text-[10px] text-red-800 leading-relaxed font-medium">«Changes will immediately affect future order cancellations, refunds, penalties, and automated policy enforcement.»</p>
                </div>
              </div>

            </div>

            {/* Modal actions buttons lock */}
            <div className="p-4 border-t border-stone-100 bg-stone-50 flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setShowSaveModal(false)}
                className="p-2 py-2 px-3 bg-stone-200 hover:bg-stone-200 text-stone-800 font-black rounded-lg cursor-pointer"
              >
                Cancel Process
              </button>

              <button
                onClick={() => {
                  triggerToast("Draft Saved Successfully", "Policy rules cached inside staging database.", "success");
                  setShowSaveModal(false);
                }}
                className="p-2 py-2 px-3 bg-stone-900 text-white rounded-lg cursor-pointer"
              >
                Save Draft
              </button>

              <button
                onClick={handleProcessPublish}
                disabled={isSavingInProgress}
                className="p-2 py-2 px-4.5 bg-[#E23744] hover:bg-red-700 text-white rounded-lg cursor-pointer font-black flex items-center gap-1.5"
              >
                {isSavingInProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling flows...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> DeploY & Publish changes
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- 9. CREATE NEW POLICY WORKFLOW DIALOG MODAL -------------------- */}
      {createPolicyModal && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-xl max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="p-4 border-b bg-stone-50 flex justify-between items-center text-xs">
              <span className="font-extrabold text-stone-900 uppercase">Initialize Policy Flow Block</span>
              <button onClick={() => setCreatePolicyModal(false)} className="cursor-pointer text-stone-500"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleCreatePolicy} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-stone-500 font-bold">Workflow Rule Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Premium Member Cancellation Fee Exception"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  className="w-full border p-2 rounded-lg font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-500 font-bold">Target Actor Role Category</label>
                <select
                  value={newPolicyCategory}
                  onChange={(e) => setNewPolicyCategory(e.target.value as any)}
                  className="w-full border p-2 rounded-lg font-extrabold"
                >
                  <option value="customer">Consumer (Wallet Credit / Reductions)</option>
                  <option value="restaurant">Merchant (Kitchen Infraction fee)</option>
                  <option value="rider">Rider (Weekly incentive penalty)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 font-bold">
                <button
                  type="button"
                  onClick={() => setCreatePolicyModal(false)}
                  className="p-1.5 px-3 bg-stone-100 rounded text-stone-600 cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="p-1.5 px-4 bg-[#E23744] hover:bg-slate-900 text-white rounded cursor-pointer"
                >
                  Create Block
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
