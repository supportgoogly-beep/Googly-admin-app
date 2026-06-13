import React, { useState, useMemo } from "react";
import {
  Shield, Percent, Building, Receipt, FileText, FileSpreadsheet, Plus, Trash2,
  ArrowRight, Save, History, Download, Sparkles, Filter, ChevronRight, CheckCircle2,
  Sliders, Info, Users, Store, Bike, Undo2, Check, X, AlertCircle, CloudLightning,
  ShieldAlert, Cpu, Eye, Printer, Mail, MessageSquare, Send, Globe, Award, Palette,
  Settings, Calendar, FileDown, CheckCircle, RefreshCw, ArrowUpRight
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, LineChart, Line
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";

// --- Types ---
export interface TaxRule {
  id: string;
  name: string;
  triggerType: "location" | "restaurant" | "category" | "zone";
  triggerValue: string;
  applyTaxType: "GST" | "ServiceTax" | "PackagingTax" | "Custom";
  taxRate: number;
  isActive: boolean;
}

export interface BusinessInfo {
  companyName: string;
  businessAddress: string;
  gstin: string;
  pan: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
}

export interface InvoiceTemplateConfig {
  showLogo: boolean;
  showQrCode: boolean;
  showTerms: boolean;
  showSupport: boolean;
  logoUrl: string;
  bannerUrl: string;
  footerText: string;
  prefix: string;
  suffix: string;
  autoIncrementStart: number;
  financialYearFormat: string;
}

export interface PrintableTemplateField {
  id: string;
  label: string;
  enabled: boolean;
}

interface AuditLog {
  id: string;
  settingName: string;
  previousValue: string;
  newValue: string;
  modifiedBy: string;
  dateTime: string;
}

interface TaxAndInvoiceDashboardProps {
  initialTaxGst?: number;
  initialTaxDelivery?: number;
  onSaveSettings?: (gst: number, delivery: number) => void;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function TaxAndInvoiceDashboard({
  initialTaxGst = 18,
  initialTaxDelivery = 5,
  onSaveSettings,
  triggerToast
}: TaxAndInvoiceDashboardProps) {

  // -------------------------------------------------------------------------
  // State 1: Active Tabs
  // -------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<"tax_gst" | "invoice_builder" | "reports" | "audit_logs">("tax_gst");
  const [dashboardTimefilter, setDashboardTimefilter] = useState<"Today" | "Last 7 Days" | "Last 30 Days" | "Custom">("Last 30 Days");
  
  // Theme state specifically for the preview sections & builder workspace
  const [workspaceDarkMode, setWorkspaceDarkMode] = useState<boolean>(false);

  // -------------------------------------------------------------------------
  // State 2: GST % and Registration Settings
  // -------------------------------------------------------------------------
  const [gstEnabled, setGstEnabled] = useState<boolean>(true);
  const [taxPricingMode, setTaxPricingMode] = useState<"inclusive" | "exclusive">("exclusive");
  const [gstPercent, setGstPercent] = useState<number>(initialTaxGst);
  const [cgstPercent, setCgstPercent] = useState<number>(initialTaxGst / 2);
  const [sgstPercent, setSgstPercent] = useState<number>(initialTaxGst / 2);
  const [igstPercent, setIgstPercent] = useState<number>(0);
  const [gstin, setGstin] = useState<string>("19AABCU9612D1Z0");

  // Live calculator calculation input
  const [calculatorOrderValue, setCalculatorOrderValue] = useState<number>(500);

  // -------------------------------------------------------------------------
  // State 3: Delivery Tax, Service, Packaging, Platform Tax Settings
  // -------------------------------------------------------------------------
  const [deliveryTaxPercent, setDeliveryTaxPercent] = useState<number>(initialTaxDelivery);
  const [serviceTaxPercent, setServiceTaxPercent] = useState<number>(2.5);
  const [packagingTaxPercent, setPackagingTaxPercent] = useState<number>(1.8);
  const [platformServiceFeePercent, setPlatformServiceFeePercent] = useState<number>(4.0);
  const [deliveryTaxScope, setDeliveryTaxScope] = useState<"all" | "zone" | "restaurant">("all");

  // -------------------------------------------------------------------------
  // State 4: Invoice Configuration - Business Info & Branding
  // -------------------------------------------------------------------------
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    companyName: "FeastFlow Delivery Solutions Pvt Ltd",
    businessAddress: "E-Block, 4th Floor, Sector-V, Salt Lake City, Kolkata - 700091",
    gstin: "19AABCU9612D1Z0",
    pan: "ABCDE1234F",
    supportEmail: "billing@feastflow.co",
    supportPhone: "+91 800-345-6789",
    websiteUrl: "https://www.feastflow.co"
  });

  const [invoiceTemplate, setInvoiceTemplate] = useState<InvoiceTemplateConfig>({
    showLogo: true,
    showQrCode: true,
    showTerms: true,
    showSupport: true,
    logoUrl: "https://images.unsplash.com/photo-1516876437184-593fda40c7cf?w=100&auto=format&fit=crop&q=80",
    bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
    footerText: "Thank you for ordering with FeastFlow! For support queries, please reach us out at support@feastflow.co. Generative QR receipt contains real cryptographically secure validation tags.",
    prefix: "INV-2026",
    suffix: "KOL",
    autoIncrementStart: 12450,
    financialYearFormat: "FY26"
  });

  // -------------------------------------------------------------------------
  // State 5: Invoice Field Customization & Re-ordering
  // -------------------------------------------------------------------------
  const [invoiceFields, setInvoiceFields] = useState<PrintableTemplateField[]>([
    { id: "order_num", label: "Order & Reference ID", enabled: true },
    { id: "invoice_num", label: "Invoice Number String", enabled: true },
    { id: "customer_info", label: "Customer Full Profile", enabled: true },
    { id: "restaurant_info", label: "Restaurant Address & GSTIN", enabled: true },
    { id: "rider_info", label: "Rider Payout & Badge Details", enabled: true },
    { id: "payment_details", label: "Payment Method / Transaction Hash", enabled: true },
    { id: "tax_breakdown", label: "Detailed SGST/CGST/IGST breakdown", enabled: true },
    { id: "delivery_charges", label: "Rider Delivery Service Fee", enabled: true },
    { id: "discount_details", label: "Discount / Campaign coupon used", enabled: true },
    { id: "coin_redeemed", label: "Loyalty coins value redeemed", enabled: true },
    { id: "prompts_and_discounts", label: "Platform promotional discounts", enabled: true }
  ]);

  const moveField = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= invoiceFields.length) return;
    const reordered = [...invoiceFields];
    const temp = reordered[index];
    reordered[index] = reordered[nextIndex];
    reordered[nextIndex] = temp;
    setInvoiceFields(reordered);
    triggerToast("Template Order Adjusted", `Visual alignment hierarchy recalculated successfully.`, "info");
  };

  const toggleField = (id: string) => {
    setInvoiceFields(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  // -------------------------------------------------------------------------
  // State 6: Declarative Rules Engine
  // -------------------------------------------------------------------------
  const [taxRules, setTaxRules] = useState<TaxRule[]>([
    {
      id: "rule_1",
      name: "West Bengal Restaurant GST Surcharge",
      triggerType: "location",
      triggerValue: "Kolkata, West Bengal",
      applyTaxType: "GST",
      taxRate: 18,
      isActive: true
    },
    {
      id: "rule_2",
      name: "Premium Segment Delivery Zone Charge",
      triggerType: "zone",
      triggerValue: "Premium Sector-V High-Frequency",
      applyTaxType: "ServiceTax",
      taxRate: 2.0,
      isActive: true
    },
    {
      id: "rule_3",
      name: "Dessert & Baking Standard Surcharge",
      triggerType: "category",
      triggerValue: "Desserts & Cakes",
      applyTaxType: "PackagingTax",
      taxRate: 5.0,
      isActive: false
    }
  ]);

  const [newRuleForm, setNewRuleForm] = useState<Omit<TaxRule, "id">>({
    name: "",
    triggerType: "location",
    triggerValue: "",
    applyTaxType: "GST",
    taxRate: 18,
    isActive: true
  });

  const handleCreateTaxRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleForm.name.trim()) {
      triggerToast("Invalid Rule", "Provide a recognizable descriptor name for the tax rule.", "error");
      return;
    }
    const createdRule: TaxRule = {
      ...newRuleForm,
      id: `rule_${Math.round(100 + Math.random() * 899)}`
    };
    setTaxRules(prev => [...prev, createdRule]);
    setNewRuleForm({
      name: "",
      triggerType: "location",
      triggerValue: "",
      applyTaxType: "GST",
      taxRate: 18,
      isActive: true
    });
    triggerToast("Tax Rule Appended", `"${createdRule.name}" loaded dynamically into logic pipeline.`, "success");
  };

  const handleToggleTaxRule = (id: string) => {
    setTaxRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    triggerToast("Rule Toggled", "Active pipeline status updated.", "info");
  };

  const handleDeleteTaxRule = (id: string) => {
    setTaxRules(prev => prev.filter(r => r.id !== id));
    triggerToast("Rule Pruned", "Tax rule removed from checkout logic.", "error");
  };

  // -------------------------------------------------------------------------
  // State 7: Delivery & Message Settings
  // -------------------------------------------------------------------------
  const [sendEmailInvoice, setSendEmailInvoice] = useState(true);
  const [sendSmsLink, setSendSmsLink] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [allowCustomerDownload, setAllowCustomerDownload] = useState(true);

  const [notifyOnOrderComplete, setNotifyOnOrderComplete] = useState(true);
  const [notifyOnPaymentSuccess, setNotifyOnPaymentSuccess] = useState(true);
  const [notifyOnRefund, setNotifyOnRefund] = useState(true);

  // -------------------------------------------------------------------------
  // State 8: Modal controls & Saving Confirmations
  // -------------------------------------------------------------------------
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [isSavingInProgress, setIsSavingInProgress] = useState(false);

  // -------------------------------------------------------------------------
  // State 9: Audit Trail Log history
  // -------------------------------------------------------------------------
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "TX-VER-1290",
      settingName: "State GST Percent Matrix",
      previousValue: "12% Total",
      newValue: "18% GST (9% CGST + 9% SGST)",
      modifiedBy: "Sneha Sen (Senior Financial Auditor)",
      dateTime: "2026-06-11 11:24"
    },
    {
      id: "TX-VER-1289",
      settingName: "Invoice Layout: Service Fee display",
      previousValue: "Hidden field",
      newValue: "Visible at Delivery Breakdown Node",
      modifiedBy: "Amit Roy (Operations Director)",
      dateTime: "2026-06-10 16:45"
    },
    {
      id: "TX-VER-1288",
      settingName: "Corporate GSTIN ID Update",
      previousValue: "Not set",
      newValue: "19AABCU9612D1Z0 Active",
      modifiedBy: "Priyanka Roy (Compliance Counsel)",
      dateTime: "2026-06-08 09:12"
    }
  ]);

  const handleRestoreAudit = (log: AuditLog) => {
    triggerToast("Settings Rollback Engaged", `Reinstating setting "${log.settingName}" back to "${log.previousValue}".`, "info");
    // Append a new log trail representing the rollback itself
    const compensationLog: AuditLog = {
      id: `TX-VER-${Math.round(1300 + Math.random() * 100)}`,
      settingName: log.settingName,
      previousValue: log.newValue,
      newValue: log.previousValue,
      modifiedBy: "System (Reversion Trigger)",
      dateTime: "2026-06-12 09:56"
    };
    setAuditLogs(prev => [compensationLog, ...prev]);
  };

  // -------------------------------------------------------------------------
  // Live Mathematical calculations
  // -------------------------------------------------------------------------
  const liveCalculationPreview = useMemo(() => {
    const rawVal = Number(calculatorOrderValue) || 100;
    const rateGst = gstEnabled ? Number(gstPercent) : 0;
    
    // Delivery configuration calculations
    const deliveryChargeRaw = 40; // Flat test base delivery amount
    const packagingChargeRaw = 15; // Flat packaging
    
    const deliveryTaxVal = (deliveryChargeRaw * Number(deliveryTaxPercent)) / 100;
    const serviceFeeVal = (rawVal * Number(serviceTaxPercent)) / 100;
    const packagingTaxVal = (packagingChargeRaw * Number(packagingTaxPercent)) / 100;
    const platformServiceFeeRaw = (rawVal * Number(platformServiceFeePercent)) / 100;

    let subtotalFood = rawVal;
    let computedGst = 0;
    let finalTotal = 0;

    if (taxPricingMode === "exclusive") {
      computedGst = (rawVal * rateGst) / 100;
      finalTotal = rawVal + computedGst + deliveryChargeRaw + deliveryTaxVal + serviceFeeVal + packagingChargeRaw + packagingTaxVal + platformServiceFeeRaw;
    } else {
      // Inclusive Tax Calculation: item amount already has tax
      computedGst = rawVal - (rawVal / (1 + rateGst / 100));
      subtotalFood = rawVal - computedGst;
      finalTotal = rawVal + deliveryChargeRaw + deliveryTaxVal + serviceFeeVal + packagingChargeRaw + packagingTaxVal + platformServiceFeeRaw;
    }

    const appliedDiscountCoupon = 50; // default test discount
    const coinsRedeemedVal = 30; // test loyalty discount

    const grandFinal = Math.max(0, finalTotal - appliedDiscountCoupon - coinsRedeemedVal);

    return {
      subtotalFood: Number(subtotalFood.toFixed(2)),
      gstAmount: Number(computedGst.toFixed(2)),
      deliveryTaxAmount: Number(deliveryTaxVal.toFixed(2)),
      serviceFeeAmount: Number(serviceFeeVal.toFixed(2)),
      packagingTaxAmount: Number(packagingTaxVal.toFixed(2)),
      platformServiceFeeAmount: Number(platformServiceFeeRaw.toFixed(2)),
      appliedDiscountCoupon,
      coinsRedeemedVal,
      grandFinal: Number(grandFinal.toFixed(2)),
      deliveryBase: deliveryChargeRaw,
      packagingBase: packagingChargeRaw,
    };
  }, [
    calculatorOrderValue, gstPercent, gstEnabled, taxPricingMode,
    deliveryTaxPercent, serviceTaxPercent, packagingTaxPercent, platformServiceFeePercent
  ]);

  // -------------------------------------------------------------------------
  // Save Action Workflow Trigger
  // -------------------------------------------------------------------------
  const handleTriggerSave = () => {
    setShowSaveConfirmModal(true);
  };

  const handleApplyChanges = () => {
    setIsSavingInProgress(true);
    setTimeout(() => {
      setIsSavingInProgress(false);
      setShowSaveConfirmModal(false);
      
      // Call global save callback if supplied
      if (onSaveSettings) {
        onSaveSettings(gstPercent, deliveryTaxPercent);
      }

      // Add audit log
      const newLog: AuditLog = {
        id: `TX-VER-${Math.round(1300 + Math.random() * 100)}`,
        settingName: "Comprehensive Tax & Invoice settings deployment",
        previousValue: `GST: ${initialTaxGst}%, DelTax: ${initialTaxDelivery}%`,
        newValue: `GST: ${gstPercent}%, DelTax: ${deliveryTaxPercent}%, GSTIN: ${gstin}`,
        modifiedBy: "ruhandharpurkayastha (Admin)",
        dateTime: "2026-06-12 09:56"
      };
      setAuditLogs(prev => [newLog, ...prev]);

      triggerToast(
        "Financial Configurations Active",
        "GST, tax regulations, customized invoice templates, and delivery settings loaded into production API endpoints.",
        "success"
      );
    }, 1500);
  };

  const handleDownloadSample = () => {
    triggerToast(
      "Sample PDF Rendered",
      `Tax compliance invoice sample ${invoiceTemplate.prefix}-XXXXX downloaded successfully to system directories.`,
      "success"
    );
  };

  // -------------------------------------------------------------------------
  // Mock Telemetry Data according to selected Filter (Last 30 Days, Last 7 Days, Today, Custom)
  // -------------------------------------------------------------------------
  const telemetryData = useMemo(() => {
    switch (dashboardTimefilter) {
      case "Today":
        return {
          gstCollected: "₹18,450",
          totalInvoices: "264",
          pendingInvoices: "18",
          taxRevenue: "₹24,110",
          successRate: "99.2%",
          activeRulesCount: taxRules.filter(r => r.isActive).length + 2,
          chartData: [
            { name: "08:00", collected: 1200, revenue: 1540 },
            { name: "10:00", collected: 2400, revenue: 3100 },
            { name: "12:00", collected: 4500, revenue: 5800 },
            { name: "14:00", collected: 3100, revenue: 4200 },
            { name: "16:00", collected: 2800, revenue: 3500 },
            { name: "18:00", collected: 5600, revenue: 7200 },
            { name: "20:00", collected: 6200, revenue: 8100 },
          ]
        };
      case "Last 7 Days":
        return {
          gstCollected: "₹1,24,900",
          totalInvoices: "1,842",
          pendingInvoices: "42",
          taxRevenue: "₹1,64,200",
          successRate: "98.8%",
          activeRulesCount: taxRules.filter(r => r.isActive).length + 2,
          chartData: [
            { name: "Mon", collected: 12500, revenue: 16400 },
            { name: "Tue", collected: 14300, revenue: 18105 },
            { name: "Wed", collected: 13900, revenue: 17200 },
            { name: "Thu", collected: 15800, revenue: 19400 },
            { name: "Fri", collected: 21100, revenue: 26500 },
            { name: "Sat", collected: 25400, revenue: 32000 },
            { name: "Sun", collected: 22800, revenue: 29012 },
          ]
        };
      case "Last 30 Days":
      default:
        return {
          gstCollected: "₹5,41,800",
          totalInvoices: "8,915",
          pendingInvoices: "126",
          taxRevenue: "₹7,11,400",
          successRate: "99.4%",
          activeRulesCount: taxRules.filter(r => r.isActive).length + 2,
          chartData: [
            { name: "Week 1", collected: 124000, revenue: 161000 },
            { name: "Week 2", collected: 139000, revenue: 182000 },
            { name: "Week 3", collected: 142000, revenue: 178500 },
            { name: "Week 4", collected: 168000, revenue: 212400 },
            { name: "Week 5", collected: 178200, revenue: 223500 },
          ]
        };
    }
  }, [dashboardTimefilter, taxRules]);

  return (
    <div className="space-y-6" id="tax-invoice-settings-management-dashboard">

      {/* -------------------- 1. PAGE HEADER -------------------- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-6 rounded-2xl border border-stone-200 shadow-sm gap-4">
        <div>
          <span className="text-[10px] bg-red-50 text-[#E23744] font-black px-2.5 py-1 rounded-full uppercase tracking-widest block mb-1">
            STRIPE & ZOho COMPLIANCE LOGIC
          </span>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Building className="w-6 h-6 text-[#E23744]" /> Tax & Invoice Settings
          </h1>
          <p className="text-xs text-stone-500 max-w-xl">
            Configure automated regulatory taxes, multi-tiered Indian state GST, customized business metadata, invoice templates, and delivery channels.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2 bg-stone-50 p-2 rounded-xl">
          <button
            onClick={() => setActiveTab("invoice_builder")}
            className="p-2 px-3.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Palette className="w-4 h-4 text-[#E23744]" /> Template Settings
          </button>

          <button
            onClick={() => {
              setActiveTab("reports");
              
            }}
            className="p-2 px-3.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Tax Reports
          </button>

          <button
            onClick={handleDownloadSample}
            className="p-2 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download Sample
          </button>

          <button
            onClick={() => setShowInvoiceModal(true)}
            className="p-2 px-3.5 bg-black hover:bg-stone-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-amber-400" /> Preview Invoice
          </button>

          <button
            onClick={handleTriggerSave}
            className="p-2.5 px-5 bg-[#E23744] hover:bg-red-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4 text-white" /> Save Settings
          </button>
        </div>
      </div>

      {/* -------------------- 2. TELEMETRY OVERVIEW CARDS & FILTERS -------------------- */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-stone-100 rounded text-[10px] text-stone-600 font-black">
              COMPLIANCE INSIGHTS
            </span>
            <span className="text-xs text-stone-400 font-semibold">Live tax tracking and successful invoice rates</span>
          </div>

          {/* Timeframe selector tab */}
          <div className="flex bg-stone-100 rounded-lg p-0.5 gap-0.5 text-[11px] font-semibold text-stone-500">
            {(["Today", "Last 7 Days", "Last 30 Days", "CustomDate"] as const).map(tab => {
              const displayLabel = tab === "CustomDate" ? "Custom Range" : tab;
              const matchingFilter = tab === "CustomDate" ? "Custom" : tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setDashboardTimefilter(matchingFilter as any);
                    triggerToast("Timeline Filtered", `Invoice telemetry updated for ${displayLabel}`, "info");
                  }}
                  className={`px-3 py-1 rounded-md cursor-pointer transition-all ${
                    dashboardTimefilter === matchingFilter 
                      ? "bg-white text-stone-900 shadow-xs font-black" 
                      : "hover:text-stone-800"
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview metric grids */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          
          <div className="p-4 bg-stone-50 hover:bg-stone-100/50 rounded-xl border border-stone-100 shadow-xs transition-colors">
            <span className="text-[9.5px] text-stone-400 font-black uppercase tracking-wider block mb-1">Active Tax Rules</span>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-stone-900 font-mono">
                {telemetryData.activeRulesCount}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded-sm">ACTIVE</span>
            </div>
          </div>

          <div className="p-4 bg-stone-50 hover:bg-stone-100/50 rounded-xl border border-stone-100 shadow-xs transition-colors">
            <span className="text-[9.5px] text-stone-400 font-black uppercase tracking-wider block mb-1">GST Collected</span>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-[#E23744] font-mono">
                {telemetryData.gstCollected}
              </span>
              <span className="text-[9px] text-[#E23744] font-bold">+8.1% vs prev</span>
            </div>
          </div>

          <div className="p-4 bg-stone-50 hover:bg-stone-100/50 rounded-xl border border-stone-100 shadow-xs transition-colors">
            <span className="text-[9.5px] text-stone-400 font-black uppercase tracking-wider block mb-1">Invoices Generated</span>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-stone-900 font-mono">
                {telemetryData.totalInvoices}
              </span>
              <span className="text-[10px] text-stone-500 font-semibold bg-stone-200/50 px-1 py-0.5 rounded-sm">COMPLETED</span>
            </div>
          </div>

          <div className="p-4 bg-stone-50 hover:bg-stone-100/50 rounded-xl border border-stone-100 shadow-xs transition-colors">
            <span className="text-[9.5px] text-stone-400 font-black uppercase tracking-wider block mb-1">Pending Invoices</span>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-stone-900 font-mono">
                {telemetryData.pendingInvoices}
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded-sm">IN QUEUE</span>
            </div>
          </div>

          <div className="p-4 bg-stone-50 hover:bg-stone-100/50 rounded-xl border border-stone-100 shadow-xs transition-colors">
            <span className="text-[9.5px] text-stone-400 font-black uppercase tracking-wider block mb-1">Total Tax Revenue</span>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-indigo-700 font-mono">
                {telemetryData.taxRevenue}
              </span>
              <span className="text-[9.5px] text-emerald-600 font-extrabold">92.4% net</span>
            </div>
          </div>

          <div className="p-4 bg-stone-50 hover:bg-stone-100/50 rounded-xl border border-stone-100 shadow-xs transition-colors">
            <span className="text-[9.5px] text-stone-400 font-black uppercase tracking-wider block mb-1">Invoice Success Rate</span>
            <div className="flex items-end justify-between">
              <span className="text-xl font-black text-emerald-600 font-mono">
                {telemetryData.successRate}
              </span>
              <span className="text-[10px] text-stone-500 font-bold">100% SMTP</span>
            </div>
          </div>

        </div>
      </div>

      {/* -------------------- 3. WORKSPACE PORTAL (NAVIGATION SEGMENT TABS) -------------------- */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => {
            setActiveTab("tax_gst");
            
          }}
          className={`px-5 py-3 text-xs font-black cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "tax_gst" 
              ? "border-[#E23744] text-[#E23744]" 
              : "border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300"
          }`}
        >
          <Percent className="w-4 h-4" /> Tax & GST Settings Config
        </button>

        <button
          onClick={() => {
            setActiveTab("invoice_builder");
            
          }}
          className={`px-5 py-3 text-xs font-black cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "invoice_builder" 
              ? "border-[#E23744] text-[#E23744]" 
              : "border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300"
          }`}
        >
          <FileText className="w-4 h-4" /> Invoice Branding & Template Builder
        </button>

        <button
          onClick={() => {
            setActiveTab("reports");
            
          }}
          className={`px-5 py-3 text-xs font-black cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "reports" 
              ? "border-[#E23744] text-[#E23744]" 
              : "border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Tax Analytics & Reports
        </button>

        <button
          onClick={() => {
            setActiveTab("audit_logs");
            
          }}
          className={`px-5 py-3 text-xs font-black cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "audit_logs" 
              ? "border-[#E23744] text-[#E23744]" 
              : "border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300"
          }`}
        >
          <History className="w-4 h-4" /> Activity Audit Logs
        </button>
      </div>

      {/* -------------------- 4. ACTIVE VIEWPORTS -------------------- */}

      {/* VIEWPORT 1: TAX CONFIGURATION SECTION */}
      {activeTab === "tax_gst" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Left panel is GST Config and Delivery fees (7 cols) */}
          <div className="xl:col-span-7 space-y-6">
            
            {/* CARD 1A: GST Settings */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-red-50 text-[#E23744] rounded-lg">
                    <Building className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900">National Goods & Services Tax (GST) Compliance</h3>
                    <p className="text-[11px] text-stone-400">Manage GSTIN status guidelines, rates split, and inclusive/exclusive options</p>
                  </div>
                </div>

                {/* Switch for GST active */}
                <button
                  onClick={() => {
                    setGstEnabled(!gstEnabled);
                    triggerToast("GST Status Altered", `GST calculations ${!gstEnabled ? "activated":"suspended"}.`, "info");
                  }}
                  className={`p-1 px-2.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    gstEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {gstEnabled ? "● ENABLED" : "○ DISABLED"}
                </button>
              </div>

              {/* GST configuration inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                
                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Tax Registration Identification (GSTIN)</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                    placeholder="e.g. 19AABCU9612D1Z0"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Tax Pricing Method Rule</label>
                  <div className="grid grid-cols-2 bg-stone-100 p-1 rounded-xl text-center">
                    <button
                      onClick={() => {
                        setTaxPricingMode("inclusive");
                        triggerToast("Tax Pricing Switched", "Prices configured as Tax-Inclusive", "info");
                      }}
                      className={`py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all ${
                        taxPricingMode === "inclusive" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      Inclusive Tax Pricing
                    </button>
                    <button
                      onClick={() => {
                        setTaxPricingMode("exclusive");
                        triggerToast("Tax Pricing Switched", "Prices configured as Tax-Exclusive", "info");
                      }}
                      className={`py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all ${
                        taxPricingMode === "exclusive" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"
                      }`}
                    >
                      Exclusive Tax Pricing
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Consolidated GST Percentage (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={gstPercent}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setGstPercent(val);
                        setCgstPercent(val / 2);
                        setSgstPercent(val / 2);
                      }}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-black text-stone-900 focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Central GST (CGST) Ratio Split (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={cgstPercent}
                      onChange={(e) => setCgstPercent(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200/50 rounded-xl p-2.5 font-semibold text-stone-400 bg-stone-100"
                      disabled
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">State GST (SGST) Ratio Split (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={sgstPercent}
                      onChange={(e) => setSgstPercent(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200/50 rounded-xl p-2.5 font-semibold text-stone-400 bg-stone-100"
                      disabled
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Interstate GST (IGST) Ratio (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={igstPercent}
                      onChange={(e) => setIgstPercent(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
                  </div>
                </div>

              </div>

            </div>

            {/* CARD 1B: Delivery, Service & Packaging Tax settings */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <span className="p-1.5 bg-[#E23744]/10 text-[#E23744] rounded-lg">
                  <Bike className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-stone-900">Delivery Logistics & Surcharge Slices</h3>
                  <p className="text-[11px] text-stone-400">Calibrate specific service fees, packaging, and platform tax rates</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                
                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Delivery Tax Segment (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={deliveryTaxPercent}
                      onChange={(e) => setDeliveryTaxPercent(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-black text-stone-900 focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Corporate Service Tax (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={serviceTaxPercent}
                      onChange={(e) => setServiceTaxPercent(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-black text-stone-900 focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Partner Packaging Tax (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={packagingTaxPercent}
                      onChange={(e) => setPackagingTaxPercent(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-black text-stone-900 focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Our Platform Surcharge Fee (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={platformServiceFeePercent}
                      onChange={(e) => setPlatformServiceFeePercent(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-black text-stone-900 focus:outline-none"
                    />
                    <span className="absolute right-3 top-3 text-stone-400 font-bold">%</span>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-stone-500 text-[10.5px] font-bold block">Surcharge Scope Applicability Mapping</label>
                  <div className="grid grid-cols-3 bg-stone-100 p-1 rounded-xl text-center">
                    <button
                      onClick={() => {
                        setDeliveryTaxScope("all");
                        triggerToast("Tax Scope Adjusted", "Applied tax rates universally to all orders", "info");
                      }}
                      className={`py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all ${
                        deliveryTaxScope === "all" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                      }`}
                    >
                      Apply To All Orders
                    </button>
                    <button
                      onClick={() => {
                        setDeliveryTaxScope("zone");
                        triggerToast("Tax Scope Adjusted", "Rates filter maps based on delivery zones", "info");
                      }}
                      className={`py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all ${
                        deliveryTaxScope === "zone" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                      }`}
                    >
                      Apply Based On Zone
                    </button>
                    <button
                      onClick={() => {
                        setDeliveryTaxScope("restaurant");
                        triggerToast("Tax Scope Adjusted", "Rates filter maps corresponding to individual restaurants", "info");
                      }}
                      className={`py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all ${
                        deliveryTaxScope === "restaurant" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                      }`}
                    >
                      Apply Based On Restaurant
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* CARD 1C: Live Rules Engine */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                    <Sliders className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900">Custom Tax Rules Engine</h3>
                    <p className="text-[11px] text-stone-400">Configure situational routing triggers based on location, zones, and categories</p>
                  </div>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-2">
                {taxRules.map(rule => (
                  <div 
                    key={rule.id}
                    className={`p-3.5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3 ${
                      rule.isActive 
                        ? "bg-stone-50 border-stone-200" 
                        : "bg-stone-100 text-stone-400 border-dashed border-stone-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-black ${
                          rule.isActive ? "bg-[#E23744]/10 text-[#E23744]" : "bg-stone-200 text-stone-500"
                        }`}>
                          IF {rule.triggerType.toUpperCase()}
                        </span>
                        <strong className="text-stone-800 font-black">{rule.name}</strong>
                      </div>
                      <p className="text-[11px] mt-1 text-stone-500">
                        When matching value <strong className="text-stone-700">"{rule.triggerValue}"</strong>, then apply additional <strong className="text-red-500 font-black">{rule.applyTaxType} = {rule.taxRate}%</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleToggleTaxRule(rule.id)}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-lg cursor-pointer ${
                          rule.isActive ? "bg-emerald-50 text-emerald-700" : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {rule.isActive ? "ACTIVE" : "DISABLED"}
                      </button>

                      <button
                        onClick={() => handleDeleteTaxRule(rule.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rules creator form inline */}
              <form onSubmit={handleCreateTaxRule} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-4 text-xs font-semibold">
                <h4 className="font-extrabold text-stone-900 text-[11px] uppercase tracking-wider">⚡ Create Dynamic Rule Row</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-stone-500 text-[10px] uppercase">Rule Name / Descriptor</label>
                    <input
                      type="text"
                      value={newRuleForm.name}
                      onChange={(e) => setNewRuleForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2 text-stone-900"
                      placeholder="e.g. South Kolkata Fastfood Penalty"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-stone-500 text-[10px] uppercase">Trigger Node</label>
                      <select
                        value={newRuleForm.triggerType}
                        onChange={(e) => setNewRuleForm(prev => ({ ...prev, triggerType: e.target.value as any }))}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2 text-stone-900 font-bold"
                      >
                        <option value="location">Location-Based</option>
                        <option value="zone">Zone-Based</option>
                        <option value="restaurant">Restaurant-Based</option>
                        <option value="category">Category-Based</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-stone-500 text-[10px] uppercase">Tax Type Impact</label>
                      <select
                        value={newRuleForm.applyTaxType}
                        onChange={(e) => setNewRuleForm(prev => ({ ...prev, applyTaxType: e.target.value as any }))}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2 text-stone-900 font-bold"
                      >
                        <option value="GST">GST Rate (%)</option>
                        <option value="ServiceTax">Service Tax (%)</option>
                        <option value="PackagingTax">Packaging Tax (%)</option>
                        <option value="Custom">Custom Surcharge (%)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-stone-500 text-[10px] uppercase">Trigger Matching value (e.g. Premium Zone / Dessert)</label>
                    <input
                      type="text"
                      value={newRuleForm.triggerValue}
                      onChange={(e) => setNewRuleForm(prev => ({ ...prev, triggerValue: e.target.value }))}
                      className="w-full bg-white border border-stone-200 rounded-xl p-2 text-stone-900"
                      placeholder="e.g. Salt Lake Sector III"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-end">
                    <div className="space-y-1">
                      <label className="text-stone-500 text-[10px] uppercase">Applied Surcharge Rate (%)</label>
                      <input
                        type="number"
                        value={newRuleForm.taxRate}
                        onChange={(e) => setNewRuleForm(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                        className="w-full bg-white border border-stone-200 rounded-xl p-2 text-stone-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="p-2 py-2.5 bg-stone-900 hover:bg-stone-900 text-white font-extrabold rounded-xl text-center cursor-pointer transition-colors"
                    >
                      Append Rule Block
                    </button>
                  </div>

                </div>
              </form>

            </div>

          </div>

          {/* Right panel is Live Calculation Preview & Dashboard Tools (5 cols) */}
          <div className="xl:col-span-5 space-y-6">
            
            {/* LIVE TAX CALCULATION WORKSPACE */}
            <div className={`p-6 rounded-2xl border flex flex-col shadow-md transition-all duration-300 relative overflow-hidden ${
              workspaceDarkMode 
                ? "bg-[#0c1224] border-slate-800 text-slate-100" 
                : "bg-stone-900 border-stone-800 text-stone-100 shadow-xl"
            }`}>
              
              {/* Backlight effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full"></div>

              {/* Header */}
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 z-10">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#E23744]/20 text-[#E23744] rounded-lg">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#E23744]">PROTOTYPE SIMULATOR</h4>
                    <span className="text-xs font-semibold text-stone-400">Live calculator mapping real-time values</span>
                  </div>
                </div>

                <button
                  onClick={() => setWorkspaceDarkMode(!workspaceDarkMode)}
                  className="p-1 px-2 text-[9px] font-bold border border-white/20 hover:bg-white/5 rounded-md cursor-pointer transition-colors"
                >
                  {workspaceDarkMode ? "Light Mockup" : "Vibrant Dark Mockup"}
                </button>
              </div>

              {/* Workspace slider controller */}
              <div className="space-y-4 mb-5 text-stone-300 font-semibold text-xs py-2">
                <div className="flex justify-between items-center">
                  <span>Simulated Food Order Cart Amount:</span>
                  <span className="text-amber-400 font-black font-mono">₹{calculatorOrderValue}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2500"
                  step="25"
                  value={calculatorOrderValue}
                  onChange={(e) => setCalculatorOrderValue(Number(e.target.value))}
                  className="w-full accent-[#E23744]"
                />
                <div className="flex justify-between text-[10px] text-stone-500 font-mono">
                  <span>₹50 (Single Snack)</span>
                  <span>₹1,250 (Family Combo)</span>
                  <span>₹2,500 (Party Banquet)</span>
                </div>
              </div>

              {/* Tax Invoice Payout card representation */}
              <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-3 z-10 text-xs">
                
                <h5 className="font-extrabold text-white uppercase text-[10px] tracking-wider text-stone-400 border-b border-white/5 pb-2">
                  Tax & Invoice Invoice Receipt Statement
                </h5>

                <div className="space-y-2 font-semibold">
                  
                  <div className="flex justify-between items-center">
                    <span className="text-stone-400">Subtotal (Food Cart Amount)</span>
                    <span className="font-mono text-stone-200">₹{liveCalculationPreview.subtotalFood}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-stone-400 flex items-center gap-1">
                      GST Calculation ({gstPercent}%)
                      {taxPricingMode === "inclusive" && <em className="text-[10px] text-green-400 font-normal">(Incl)</em>}
                    </span>
                    <span className="font-mono text-stone-200">₹{liveCalculationPreview.gstAmount}</span>
                  </div>

                  <div className="pl-3 border-l border-white/10 space-y-1.5 text-[11px] text-stone-400">
                    <div className="flex justify-between">
                      <span>Central CGST Component ({(gstPercent/2).toFixed(1)}%)</span>
                      <span className="font-mono">₹{(liveCalculationPreview.gstAmount / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>State SGST Component ({(gstPercent/2).toFixed(1)}%)</span>
                      <span className="font-mono">₹{(liveCalculationPreview.gstAmount / 2).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Surcharges list */}
                  <div className="border-t border-white/5 pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Delivery Service Charge Surcharges ({deliveryTaxPercent}%)</span>
                      <span className="font-mono text-stone-200">₹{liveCalculationPreview.deliveryTaxAmount}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Platform Convenience Surcharge ({platformServiceFeePercent}%)</span>
                      <span className="font-mono text-stone-200">₹{liveCalculationPreview.platformServiceFeeAmount}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Restaurant Surcharges / Packaging ({packagingTaxPercent}%)</span>
                      <span className="font-mono text-stone-200">₹{liveCalculationPreview.packagingTaxAmount}</span>
                    </div>
                  </div>

                  {/* Campaign Discout segments */}
                  <div className="border-t border-white/5 pt-2 space-y-1 text-[#E23744]">
                    <div className="flex justify-between items-center">
                      <span>Coupon Discount (FEAST50 Claimed)</span>
                      <span className="font-mono">- ₹{liveCalculationPreview.appliedDiscountCoupon}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Loyalty Gold Coin Redeemed</span>
                      <span className="font-mono">- ₹{liveCalculationPreview.coinsRedeemedVal}</span>
                    </div>
                  </div>

                  {/* Calculated Payout Statement */}
                  <div className="border-t border-white/10 pt-3 flex justify-between items-end">
                    <div>
                      <span className="text-stone-400 block text-[9.5px]">CONSUMER GRAND PAYOUT</span>
                      <span className="text-[9.5px] uppercase font-bold text-emerald-400 font-sans tracking-wide">
                        {taxPricingMode === "exclusive" ? "Exclusive tax methodology":"Inclusive pricing scheme"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-amber-300">
                        ₹{liveCalculationPreview.grandFinal}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Informative advice foot */}
              <div className="mt-4 flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/5 text-[11px] text-stone-300 leading-normal">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-white block">Stripe-Aligned Compliant Ledgering</span>
                  Rates evaluated against mock location criteria. Live transactions are serialized instantly and matched with dynamic database triggers.
                </div>
              </div>

            </div>

            {/* QUICK EMAIL DELIVERY CHANNELS */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-xs font-semibold">
              <h5 className="font-black text-stone-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider border-b border-stone-100 pb-2">
                <Send className="w-4 h-4 text-[#E23744]" /> Delivery Settings & Automated Dispatch
              </h5>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-stone-800 block font-bold">SMTP Consolidated Email Invoice Dispatch</span>
                    <p className="text-[10px] text-stone-400">Mail legal compliance invoice directly upon delivery checkout completion</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendEmailInvoice}
                    onChange={(e) => setSendEmailInvoice(e.target.checked)}
                    className="w-4 h-4 text-[#E23744] accent-[#E23744]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-stone-800 block font-bold">SMS Carrier Direct Invoice Link</span>
                    <p className="text-[10px] text-stone-400">Shoot a secure, shortened, tiny hyperlink invoice to customer mobile numbers</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendSmsLink}
                    onChange={(e) => setSendSmsLink(e.target.checked)}
                    className="w-4 h-4 text-[#E23744] accent-[#E23744]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-stone-800 block font-bold">WhatsApp Business Invoice Dispatch</span>
                    <p className="text-[10px] text-stone-400">Trigger customer notification on WhatsApp with high fidelity formatted receipt cards</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendWhatsApp}
                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                    className="w-4 h-4 text-[#E23744] accent-[#E23744]"
                  />
                </div>

                <div className="flex justify-between items-center border-t border-stone-100 pt-3">
                  <div>
                    <span className="text-stone-800 block font-bold">In-App PDF Download Action</span>
                    <p className="text-[10px] text-stone-400">Permit customer mobile apps to store historical tax records locally</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowCustomerDownload}
                    onChange={(e) => setAllowCustomerDownload(e.target.checked)}
                    className="w-4 h-4 text-[#E23744] accent-[#E23744]"
                  />
                </div>
              </div>

              {/* Event triggers alerts */}
              <div className="p-3.5 bg-stone-50 rounded-xl space-y-2.5 border border-stone-200">
                <span className="text-[10px] uppercase font-black text-stone-400 block">Trigger Dispatch Milestones:</span>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10.5px]">
                  <label className="flex items-center gap-1.5 text-zinc-700">
                    <input 
                      type="checkbox" 
                      checked={notifyOnOrderComplete} 
                      onChange={(e) => setNotifyOnOrderComplete(e.target.checked)}
                      className="accent-[#E23744]"
                    />
                    Order Completed
                  </label>
                  <label className="flex items-center gap-1.5 text-zinc-700">
                    <input 
                      type="checkbox" 
                      checked={notifyOnPaymentSuccess} 
                      onChange={(e) => setNotifyOnPaymentSuccess(e.target.checked)}
                      className="accent-[#E23744]"
                    />
                    Payment Succeeded
                  </label>
                  <label className="flex items-center gap-1.5 text-zinc-700">
                    <input 
                      type="checkbox" 
                      checked={notifyOnRefund} 
                      onChange={(e) => setNotifyOnRefund(e.target.checked)}
                      className="accent-[#E23744]"
                    />
                    Refund Processed
                  </label>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEWPORT 2: INVOICE CUSTOMIZATION & BUILDER */}
      {activeTab === "invoice_builder" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Business details inputs (7 cols) */}
          <div className="xl:col-span-7 space-y-6">
            
            {/* Card 2A: Business legal details */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-red-50 text-[#E23744] rounded-lg">
                    <Building className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-stone-900">Legal Business Metadata Profile</h3>
                    <p className="text-[11px] text-stone-400">Incorporate verified GST & PAN structures displayed on customer tax receipts</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                
                <div className="space-y-1 md:col-span-2">
                  <label className="text-stone-500 text-[10.5px] block font-bold">Registered Legal Corporation Name (Company Name)</label>
                  <input
                    type="text"
                    value={businessInfo.companyName}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, companyName: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-stone-500 text-[10.5px] block font-bold">Corporate Headquarters Physical Address</label>
                  <input
                    type="text"
                    value={businessInfo.businessAddress}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, businessAddress: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] block font-bold">GST registration GSTIN Identifier</label>
                  <input
                    type="text"
                    value={businessInfo.gstin}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, gstin: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] block font-bold">Permanent Account Number (PAN card)</label>
                  <input
                    type="text"
                    value={businessInfo.pan}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, pan: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] block font-bold">Support Billing Email ID</label>
                  <input
                    type="email"
                    value={businessInfo.supportEmail}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, supportEmail: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10.5px] block font-bold">Billing Help Line Phone</label>
                  <input
                    type="text"
                    value={businessInfo.supportPhone}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, supportPhone: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-stone-500 text-[10.5px] block font-bold">Corporate Portal Website URL</label>
                  <input
                    type="text"
                    value={businessInfo.websiteUrl}
                    onChange={(e) => setBusinessInfo(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none"
                  />
                </div>

              </div>

            </div>

            {/* Card 2B: Branding Settings */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5 text-xs font-semibold">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Palette className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-stone-900">Visual Branding & Assets Integration</h3>
                  <p className="text-[11px] text-stone-400">Incorporate customizable logos, top design banner files, and verify layout rules</p>
                </div>
              </div>

              {/* Branding selections */}
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-stone-400 font-bold block mb-1 text-[9px] uppercase">Corporate App Logo</span>
                    <div className="flex items-center gap-2">
                      <img 
                        src={invoiceTemplate.logoUrl} 
                        alt="Logo" 
                        className="w-10 h-10 object-cover rounded-lg border border-stone-300"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={() => {
                          const newUrl = prompt("Enter Image URL for corporate logo:", invoiceTemplate.logoUrl);
                          if (newUrl) setInvoiceTemplate(prev => ({ ...prev, logoUrl: newUrl }));
                        }}
                        className="text-[10px] bg-white border p-1 rounded font-black hover:bg-stone-50 text-gray-700 cursor-pointer"
                      >
                        Change Logo
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 md:col-span-2">
                    <span className="text-stone-400 font-bold block mb-1 text-[9px] uppercase">Header Receipt Banner Landscape Picture</span>
                    <div className="flex items-center gap-2">
                      <img 
                        src={invoiceTemplate.bannerUrl} 
                        alt="Banner" 
                        className="w-20 h-8 object-cover rounded-lg border border-stone-300"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={() => {
                          const newUrl = prompt("Enter Image URL for Invoice Banner Landscape:", invoiceTemplate.bannerUrl);
                          if (newUrl) setInvoiceTemplate(prev => ({ ...prev, bannerUrl: newUrl }));
                        }}
                        className="text-[10px] bg-white border p-1 rounded font-black hover:bg-stone-50 text-gray-700 cursor-pointer text-center"
                      >
                        Change Banner Landscape URL
                      </button>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100 p-2.5 rounded-xl border transition-colors">
                    <input
                      type="checkbox"
                      checked={invoiceTemplate.showLogo}
                      onChange={(e) => setInvoiceTemplate(p => ({ ...p, showLogo: e.target.checked }))}
                      className="accent-[#E23744] w-4.5 h-4.5"
                    />
                    <div>
                      <span className="text-stone-800 text-[11px] block text-stone-700 font-black">Display Logo</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100 p-2.5 rounded-xl border transition-colors">
                    <input
                      type="checkbox"
                      checked={invoiceTemplate.showQrCode}
                      onChange={(e) => setInvoiceTemplate(p => ({ ...p, showQrCode: e.target.checked }))}
                      className="accent-[#E23744] w-4.5 h-4.5"
                    />
                    <div>
                      <span className="text-stone-800 text-[11px] block text-stone-700 font-black">Scan QR Receipt</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100 p-2.5 rounded-xl border transition-colors">
                    <input
                      type="checkbox"
                      checked={invoiceTemplate.showTerms}
                      onChange={(e) => setInvoiceTemplate(p => ({ ...p, showTerms: e.target.checked }))}
                      className="accent-[#E23744] w-4.5 h-4.5"
                    />
                    <div>
                      <span className="text-stone-800 text-[11px] block text-[#434b5a] font-black">Show Terms</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-stone-50 hover:bg-stone-100 p-2.5 rounded-xl border transition-colors">
                    <input
                      type="checkbox"
                      checked={invoiceTemplate.showSupport}
                      onChange={(e) => setInvoiceTemplate(p => ({ ...p, showSupport: e.target.checked }))}
                      className="accent-[#E23744] w-4.5 h-4.5"
                    />
                    <div>
                      <span className="text-stone-800 text-[11px] block text-stone-700 font-black">Support Info URL</span>
                    </div>
                  </label>
                </div>

                <div className="space-y-1 pt-2">
                  <label className="text-stone-500 text-[10.5px] block font-bold">Invoice Bottom Custom legally-required Footer declaration note</label>
                  <textarea
                    rows={2}
                    value={invoiceTemplate.footerText}
                    onChange={(e) => setInvoiceTemplate(p => ({ ...p, footerText: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2.5 font-bold text-stone-900 focus:outline-none"
                    placeholder="Footer terms & conditions description..."
                  />
                </div>

              </div>

            </div>

            {/* Card 2C: Invoice numbering configuration */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 text-xs font-semibold">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <span className="p-1.5 bg-[#E23744]/15 rounded-lg text-[#E23744]">
                  <Sliders className="w-4.5 h-4.5" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-stone-900">Custom Invoice Numbering Serializer Settings</h3>
                  <p className="text-[11px] text-stone-400">Regulate specific sequences, year layouts, and financial prefixes</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="space-y-1">
                  <label className="text-stone-500 text-[10px] uppercase">Invoice Prefix Code</label>
                  <input
                    type="text"
                    value={invoiceTemplate.prefix}
                    onChange={(e) => setInvoiceTemplate(p => ({ ...p, prefix: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-black text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10px] uppercase">Invoice Suffix Code</label>
                  <input
                    type="text"
                    value={invoiceTemplate.suffix}
                    onChange={(e) => setInvoiceTemplate(p => ({ ...p, suffix: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-black text-stone-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10px] uppercase">Auto-Increment Start</label>
                  <input
                    type="number"
                    value={invoiceTemplate.autoIncrementStart}
                    onChange={(e) => setInvoiceTemplate(p => ({ ...p, autoIncrementStart: Number(e.target.value) }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-black text-stone-900 focus:outline-none text-center"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-stone-500 text-[10px] uppercase">Financial Year String</label>
                  <select
                    value={invoiceTemplate.financialYearFormat}
                    onChange={(e) => setInvoiceTemplate(p => ({ ...p, financialYearFormat: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 font-bold text-stone-900 focus:outline-none"
                  >
                    <option value="FY25">FY 2024-2025 (FY25)</option>
                    <option value="FY26">FY 2025-2026 (FY26)</option>
                    <option value="FY27">FY 2026-2027 (FY27)</option>
                  </select>
                </div>

              </div>

              {/* Sample output notification */}
              <div className="bg-[#E23744]/7 text-[#E23744] p-3 rounded-xl border border-[#E23744]/15 flex items-center justify-between text-xs font-semibold">
                <span>Output Format Invoice String Preview:</span>
                <strong className="font-mono text-zinc-900 bg-white/80 p-1 px-3 rounded-lg border">
                  {invoiceTemplate.prefix}-{invoiceTemplate.financialYearFormat}-{invoiceTemplate.autoIncrementStart}
                  {invoiceTemplate.suffix ? `-${invoiceTemplate.suffix}` : ""}
                </strong>
              </div>

            </div>

          </div>

          {/* DRAG AND DROP TEMPLATE LAYOUT BUILDER SCREEN (5 cols) */}
          <div className="xl:col-span-5 space-y-6">
            
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.2 py-1 rounded-sm uppercase mb-1 block w-fit">
                  VISUAL LAYOUT SEQUENCER
                </span>
                <h4 className="text-stone-900 text-sm font-black">Interactive Fields Drag & Drop Setup</h4>
                <p className="text-[11.5px] text-stone-500 leading-relaxed font-semibold mt-1">
                  Adjust active data displays on printable compliance receipts. Toggle individual switches and adjust visual vertical hierarchy by clicking ordering buttons.
                </p>
              </div>

              {/* Fields List layout */}
              <div className="space-y-2 text-xs font-semibold">
                {invoiceFields.map((field, index) => (
                  <div
                    key={field.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                      field.enabled 
                        ? "bg-stone-50 border-stone-200 font-bold" 
                        : "bg-stone-100/50 border-stone-200/50 text-stone-400"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-stone-300 font-mono text-[10px] bg-stone-200 border p-1 rounded-md block w-6 text-center shadow-xs">
                        {index + 1}
                      </span>
                      <span className={field.enabled ? "text-stone-800":"text-stone-400"}>{field.label}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      
                      {/* Active toggler */}
                      <button
                        onClick={() => toggleField(field.id)}
                        className={`text-[9.5px] p-1 px-2.2 rounded font-black cursor-pointer transition-colors ${
                          field.enabled 
                            ? "bg-emerald-50 text-emerald-800" 
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {field.enabled ? "VISIBLE" : "HIDDEN"}
                      </button>

                      {/* Moving Controls */}
                      <div className="flex border rounded bg-white">
                        <button
                          disabled={index === 0}
                          onClick={() => moveField(index, "up")}
                          className={`p-1 hover:bg-stone-50 text-stone-500 disabled:opacity-30 cursor-pointer p-1 border-r`}
                          title="Move Item Up"
                        >
                          ▲
                        </button>
                        <button
                          disabled={index === invoiceFields.length - 1}
                          onClick={() => moveField(index, "down")}
                          className={`p-1 hover:bg-stone-50 text-stone-500 disabled:opacity-30 cursor-pointer p-1`}
                          title="Move Item Down"
                        >
                          ▼
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Info advice tip */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[10.5px] text-stone-500 leading-normal font-semibold">
                <strong>💡 Quick Tip on Layout Customization:</strong>
                Changing order here rearranges printable segments inside the tax invoice preview pdf dynamically. Hidden elements are omitted from tax receipt layouts.
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEWPORT 3: TAX & INVOICE ANALYTICS */}
      {activeTab === "reports" && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-6 animate-fade-in text-xs font-semibold shadow-xs">
          
          <div className="border-b border-stone-100 pb-3 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h3 className="text-zinc-900 font-black text-sm">Automated Billing Tax Revenue Trends & Invoice Telemetry</h3>
              <p className="text-[11px] text-stone-400">Evaluate GSTIN transactions volume, PDF download ratios, and delivery statistics</p>
            </div>
            
            <button
              onClick={() => {
                triggerToast("Syncing Database", "Connecting with live cloud nodes to grab updated invoice payloads...", "info");
              }}
              className="p-1 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync Live Data
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 3A: Cumulative GST Collected Over Timeline */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
                📈 Monthly Tax Collection Trends (₹ Revenue)
              </span>

              <div className="h-64" style={{ minHeight: "256px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={256} minWidth={0}>
                  <AreaChart data={telemetryData.chartData}>
                    <defs>
                      <linearGradient id="gstGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E23744" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#E23744" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#a0a0a0" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a0a0a0" fontSize={11} tickFormatter={(val) => `₹${val}`} strokeWidth={0.5} />
                    <Tooltip formatter={(value) => [`₹${value}`, "Surcharge Tax"]} />
                    <Area type="monotone" dataKey="collected" stroke="#E23744" strokeWidth={2.5} fillOpacity={1} fill="url(#gstGrad)" />
                  </AreaChart>
                </SafeResponsiveContainer>
              </div>

              <p className="text-[10px] text-stone-400 text-center">
                Visual display matches active parameters for timeframe: <strong className="text-stone-700 font-bold">{dashboardTimefilter}</strong>
              </p>
            </div>

            {/* Chart 3B: Tax Revenue Distribution Split */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-black text-stone-400 tracking-wider">
                📊 Tax Collections Slabs Split by Trigger Zone
              </span>

              <div className="h-64" style={{ minHeight: "256px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={256} minWidth={0}>
                  <BarChart data={telemetryData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" stroke="#a0a0a0" fontSize={11} tickLine={false} />
                    <YAxis stroke="#a0a0a0" fontSize={11} tickFormatter={(val) => `₹${val}`} strokeWidth={0.5} />
                    <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                    <Legend verticalAlign="top" height={36} iconSize={10} style={{ fontSize: 11 }} />
                    <Bar dataKey="collected" name="GST Slabs" fill="#312e81" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" name="Logistics & Delivery Tax" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </SafeResponsiveContainer>
              </div>

              <p className="text-[10px] text-stone-400 text-center">
                Evaluated against <strong className="text-stone-700 font-bold">{taxRules.length} dynamic zones rules and corporate GSTIN splits</strong>
              </p>
            </div>

          </div>

          {/* Quick grid of secondary metrics analytics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-stone-100 pt-6">
            
            <div className="p-3 bg-stone-50 border rounded-xl space-y-1">
              <span className="text-stone-400 text-[9px] uppercase tracking-wider block">Completed GSTIN Invoices</span>
              <strong className="text-stone-900 font-black text-base block">₹2,84,102.50</strong>
              <span className="text-[10px] text-stone-400">99.4% calculated accurately</span>
            </div>

            <div className="p-3 bg-stone-50 border rounded-xl space-y-1">
              <span className="text-stone-400 text-[9px] uppercase tracking-wider block">Customer PDF Download Rate</span>
              <strong className="text-indigo-700 font-black text-base block">64.21%</strong>
              <span className="text-[10px] text-indigo-500 font-bold">5,720 active requests</span>
            </div>

            <div className="p-3 bg-stone-50 border rounded-xl space-y-1">
              <span className="text-stone-400 text-[9px] uppercase tracking-wider block">Consolidated Email SMTP Sent</span>
              <strong className="text-emerald-600 font-black text-base block">98.15%</strong>
              <span className="text-[10px] text-emerald-500">Mailed within 1.2s delay</span>
            </div>

            <div className="p-3 bg-stone-50 border rounded-xl space-y-1">
              <span className="text-stone-400 text-[9px] uppercase tracking-wider block font-black text-[#E23744]">Failed Dispatch Notifications</span>
              <strong className="text-[#E23744] font-black text-base block">0.14%</strong>
              <span className="text-[10px] text-stone-400 bg-red-50 p-0.5 rounded">Check bounce logs</span>
            </div>

          </div>

        </div>
      )}

      {/* VIEWPORT 4: AUDIT LOGS TRAIL */}
      {activeTab === "audit_logs" && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 animate-fade-in text-xs font-semibold">
          
          <div className="flex justify-between items-center border-b border-stone-100 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-stone-900 font-black text-sm">Compliance Activity Audit Trail</h3>
              <p className="text-[11px] text-stone-400">Track structural alterations inside global tax values and restore historical states</p>
            </div>
            
            <button
              onClick={() => {
                triggerToast("Logs Exported", "Exported legal activity audit logs trail CSV file successfully.", "success");
              }}
              className="p-1.5 px-3 bg-white border hover:bg-stone-50 text-stone-820 font-black rounded-lg flex items-center gap-1 cursor-pointer transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export Logs List
            </button>
          </div>

          <div className="divide-y divide-stone-100 select-none">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:bg-stone-50 rounded-xl transition-all gap-3 border border-transparent hover:border-stone-100">
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-stone-100 border text-stone-600 p-0.5 rounded">
                      {log.id}
                    </span>
                    <strong className="text-zinc-900 font-black">{log.settingName}</strong>
                  </div>

                  <p className="text-[11.5px] text-stone-500">
                    Previous: <strong className="text-stone-400 italic font-mono">{log.previousValue}</strong> 
                    <span className="mx-2">➔</span> 
                    Active Next: <strong className="text-emerald-700 font-mono">{log.newValue}</strong>
                  </p>

                  <div className="flex gap-4 text-[10.5px] text-stone-400 mt-1">
                    <span>Modified by: <strong className="text-stone-600 font-bold">{log.modifiedBy}</strong></span>
                    <span>•</span>
                    <span>{log.dateTime}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRestoreAudit(log)}
                  className="p-1 px-3 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/50 hover:border-amber-300 font-black text-[10.5px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <Undo2 className="w-3.5 h-3.5" /> Restore This State
                </button>

              </div>
            ))}
          </div>

        </div>
      )}


      {/* -------------------- 5. INVOICE PREVIEW REALISTIC MODAL (PDF) -------------------- */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up">
            
            {/* Modal Title Banner Control */}
            <div className="bg-stone-900 text-white p-4 justify-between items-center flex shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="text-[#E23744] w-5 h-5 block animate-bounce" />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wide">Legal Invoice Compliant Output Document</h4>
                  <span className="text-[11px] text-stone-400">PDF standard mock rendering strictly visible to clients upon delivery</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    window.print();
                    triggerToast("Printer Initiated", "Printing pipeline connected successfully.", "success");
                  }}
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice Document
                </button>

                <button
                  onClick={handleDownloadSample}
                  className="p-2 bg-[#E23744] hover:bg-[#c22d37] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Export PDF Format
                </button>

                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>
            </div>

            {/* REALISTIC HIGH-FIDELITY PRINTABLE INVOICE GRID LAYER */}
            <div className="p-8 space-y-6 overflow-y-auto flex-1 select-text text-stone-900 font-semibold text-xs" id="pdf-printable-invoice-canvas">
              
              {/* BRANDING HEADER BANNER SPLASH */}
              <div className="relative h-20 bg-cover bg-center rounded-xl overflow-hidden shadow-inner flex items-center p-6 border border-stone-200-inset" style={{ backgroundImage: `url(${invoiceTemplate.bannerUrl})` }}>
                <div className="absolute inset-0 bg-black/30 backdrop-blur-xs"></div>
                
                {invoiceTemplate.showLogo && (
                  <div className="relative bg-white p-1 rounded-lg shadow-md z-10 mr-4">
                    <img 
                      src={invoiceTemplate.logoUrl} 
                      alt="FeastFlow Logo" 
                      className="w-12 h-12 object-cover rounded" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="relative text-white z-10">
                  <h1 className="text-lg font-black tracking-tight">{businessInfo.companyName}</h1>
                  <span className="text-[10px] text-stone-200 uppercase tracking-widest block font-bold">FEASTFLOW DELIVERIES INVOICE DOCUMENT</span>
                </div>
              </div>

              {/* THREE COLUMN GRID: FROM, TO, METADATA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-b border-stone-200 pb-6 text-[11px] leading-relaxed">
                
                {/* 1. Legal Sender info */}
                <div className="space-y-1 bg-stone-50 p-4 rounded-xl border">
                  <span className="text-stone-400 uppercase font-black tracking-wider block text-[9px]">ISSUED BY (MERCHANT ORIGIN)</span>
                  <strong className="text-stone-900 block font-black text-[12px]">{businessInfo.companyName}</strong>
                  <p className="text-stone-500">{businessInfo.businessAddress}</p>
                  <p className="text-stone-600 font-bold mt-1">GSTIN: <span className="font-mono">{businessInfo.gstin}</span></p>
                  <p className="text-stone-600 font-bold">PAN Code: <span className="font-mono">{businessInfo.pan}</span></p>
                </div>

                {/* 2. Customer recipient info */}
                <div className="space-y-1 bg-stone-50 p-4 rounded-xl border">
                  <span className="text-stone-400 uppercase font-black tracking-wider block text-[9px]">BILLED TO (CONSUMER RECIPIENT)</span>
                  <strong className="text-stone-900 block font-black text-[12.5px]">Arijit Ray (Premium Corporate Member)</strong>
                  <p className="text-stone-500">22A, Southern Avenue, Lake Gardens, Block-C, 2nd Floor, Kolkata - 700029</p>
                  <p className="text-stone-600 mt-1">Phone Number: <strong className="font-mono">+91 98305-61245</strong></p>
                  <p className="text-stone-600">Email: <span className="font-mono text-stone-500">arijit.ray@gmail.com</span></p>
                </div>

                {/* 3. Transaction metadata parameters */}
                <div className="space-y-1.5 bg-stone-50 p-4 rounded-xl border font-semibold text-stone-600">
                  <span className="text-stone-400 uppercase font-black tracking-wider block text-[9px]">DOCUMENT METADATA</span>
                  
                  <div className="flex justify-between">
                    <span>Invoice Serial No.</span>
                    <strong className="text-stone-900 font-mono">
                      {invoiceTemplate.prefix}-{invoiceTemplate.financialYearFormat}-{invoiceTemplate.autoIncrementStart}
                      {invoiceTemplate.suffix ? `-${invoiceTemplate.suffix}` : ""}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Order Reference Code</span>
                    <strong className="text-stone-900 font-mono">#ORD-67120-KOL</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Transaction Date Time</span>
                    <strong className="text-stone-900">12th June, 2026 - 03:14 PM</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Payment Gateway Scheme</span>
                    <strong className="text-indigo-700 uppercase">Razorpay UPI NetBanking</strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Document Settlement</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 rounded">PAID</span>
                  </div>
                </div>

              </div>

              {/* ITEM IZED RECEIPT TABLE LIST */}
              <div className="space-y-4">
                <span className="text-stone-400 uppercase font-black tracking-wider block text-[9.5px]">ITEMIZED FOOD COMPONENT CHARGES LIST</span>
                
                <table className="w-full text-left text-xs text-stone-800 font-semibold border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-600 text-[10px] uppercase font-black">
                      <th className="pb-2">Sl.</th>
                      <th className="pb-2">Description / Food item specification</th>
                      <th className="pb-2 text-center text-stone-700">Quantity</th>
                      <th className="pb-2 text-right text-stone-700">Unit Price</th>
                      <th className="pb-2 text-right">Subtotal Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    
                    <tr>
                      <td className="py-3">1</td>
                      <td className="py-3">
                        <strong className="text-stone-900 block">Kolkata Special Mutton Biryani (Double Potato Extra Royal Classic)</strong>
                        <span className="text-[10px] text-stone-400 font-medium">Prepared by Royal Shiraz Kitchen Partner Standard Pack</span>
                      </td>
                      <td className="py-3 text-center">1</td>
                      <td className="py-3 text-right font-mono">₹380.00</td>
                      <td className="py-3 text-right font-mono text-stone-900 font-bold">₹380.00</td>
                    </tr>

                    <tr>
                      <td className="py-3">2</td>
                      <td className="py-3">
                        <strong className="text-stone-900 block">Crispy Chicken Reshmi Butter Kebab Skewers</strong>
                        <span className="text-[10px] text-stone-400 font-medium">Includes fresh mint yogurt chutney sauce & green salad</span>
                      </td>
                      <td className="py-3 text-center">2</td>
                      <td className="py-3 text-right font-mono">₹120.00</td>
                      <td className="py-3 text-right font-mono text-stone-900 font-bold">₹240.00</td>
                    </tr>

                  </tbody>
                </table>
              </div>

              {/* CHARGES BREAKDOWN AND TAX COMPUTATIONS SPLIT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-300">
                
                {/* Terms and conditions block footer sender */}
                <div className="space-y-3 leading-normal">
                  
                  {invoiceTemplate.showTerms && (
                    <div className="bg-stone-50 p-4 rounded-xl border space-y-2">
                      <strong className="text-stone-900 uppercase tracking-wider text-[9px] block">TERMS AND CONDITIONS AGREEMENTS:</strong>
                      <p className="text-[10.5px] text-stone-500">
                        1. All payment sums computed represents final settlement including necessary GST splits computed legally.<br />
                        2. This ledger represents digitally generated proof which does not require raw physical signature vectors.<br />
                        3. Returns or refund actions propagate backward according to specified Feastflow policies guidelines.
                      </p>
                    </div>
                  )}

                  {/* QR code recipient */}
                  {invoiceTemplate.showQrCode && (
                    <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl border w-fit">
                      <div className="w-16 h-16 bg-stone-200 rounded border border-stone-300 flex items-center justify-center text-[10px] font-mono select-none">
                        [ QR CODE ]
                      </div>
                      <div className="max-w-xs text-[10px] text-stone-400 leading-normal">
                        <strong>Cryptographic Security Validation</strong>
                        Scan code using FeastFlow Customer Companion App to immediately log transaction hashes directly in verification systems.
                      </div>
                    </div>
                  )}

                </div>

                {/* Right side has explicit math block */}
                <div className="space-y-2.5 bg-stone-50 p-5 rounded-2xl border text-stone-600">
                  
                  <div className="flex justify-between">
                    <span>Food Cart Subtotal (Calculated)</span>
                    <strong className="font-mono text-stone-900">₹{calculatorOrderValue}.00</strong>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1.5">
                      State Goods & Services Tax (GST {gstPercent}%)
                    </span>
                    <strong className="font-mono text-stone-900">₹{liveCalculationPreview.gstAmount}</strong>
                  </div>

                  {/* Surcharges breakdown */}
                  <div className="pl-3 border-l border-stone-200 text-[11px] space-y-1 mt-1 text-stone-500 font-mono">
                    <div className="flex justify-between">
                      <span>Central Corporate CGST ({(gstPercent/2).toFixed(1)}%)</span>
                      <span>₹{(liveCalculationPreview.gstAmount / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>West Bengal SGST State tax ({(gstPercent/2).toFixed(1)}%)</span>
                      <span>₹{(liveCalculationPreview.gstAmount / 2).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Logistics charges */}
                  <div className="border-t pt-2 space-y-2">
                    
                    <div className="flex justify-between">
                      <span>Delivery Logistic Service Charge ({deliveryTaxPercent}%)</span>
                      <strong className="font-mono text-stone-900">
                        ₹{(liveCalculationPreview.deliveryBase + liveCalculationPreview.deliveryTaxAmount).toFixed(2)}
                      </strong>
                    </div>

                    <div className="flex justify-between text-[11px] font-normal text-stone-400">
                      <span>(Base Delivery Fee: ₹{liveCalculationPreview.deliveryBase}.00 + Tax: ₹{liveCalculationPreview.deliveryTaxAmount})</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Platform Convenience Surcharge ({platformServiceFeePercent}%)</span>
                      <strong className="font-mono text-stone-900">₹{liveCalculationPreview.platformServiceFeeAmount}</strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Partner Packaging & Box Surcharge ({packagingTaxPercent}%)</span>
                      <strong className="font-mono text-stone-900">
                        ₹{(liveCalculationPreview.packagingBase + liveCalculationPreview.packagingTaxAmount).toFixed(2)}
                      </strong>
                    </div>

                  </div>

                  {/* Discount options */}
                  <div className="border-t pt-2 text-[#E23744] space-y-1">
                    <div className="flex justify-between">
                      <span>Active Coupon Discount (FEAST50)</span>
                      <strong className="font-mono">- ₹{liveCalculationPreview.appliedDiscountCoupon}.00</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Loyalty Gold Coins Value Recomputed</span>
                      <strong className="font-mono">- ₹{liveCalculationPreview.coinsRedeemedVal}.00</strong>
                    </div>
                  </div>

                  {/* GRAND TOTAL */}
                  <div className="border-t border-stone-300 pt-3 flex justify-between items-end">
                    <div>
                      <span className="text-stone-500 uppercase font-black block text-[9px] tracking-wider mb-0.5">GRAND TOTAL (ROUNDED)</span>
                      <span className="text-[10px] text-stone-400 block leading-tight font-medium">All relevant surcharges consolidated</span>
                    </div>
                    <strong className="font-mono text-stone-900 text-xl font-black">
                      ₹{liveCalculationPreview.grandFinal}
                    </strong>
                  </div>

                </div>

              </div>

              {/* Legal footer */}
              <div className="pt-6 border-t border-stone-200 text-center text-[10px] text-stone-400 font-medium leading-relaxed">
                <p>{invoiceTemplate.footerText}</p>
                <p className="mt-1 font-bold text-stone-500">Website: {businessInfo.websiteUrl} | Support Billing Helpdesk: {businessInfo.supportPhone}</p>
              </div>

            </div>

            {/* Close footer button options */}
            <div className="p-4 bg-stone-50 border-t justify-end flex gap-2 shrink-0">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="p-2 px-6 bg-stone-900 text-white font-extrabold text-xs rounded-xl cursor-pointer hover:bg-stone-900"
              >
                Close Compliance Preview
              </button>
            </div>

          </div>

        </div>
      )}


      {/* -------------------- 6. CONFIRM SAVE SETTINGS OVERLAY MODAL -------------------- */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xl w-full max-w-lg space-y-5 animate-scale-up">
            
            <div className="flex items-center gap-3">
              <span className="p-2 bg-rose-50 rounded-xl text-rose-600 block shrink-0 animate-bounce">
                <ShieldAlert className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-black text-stone-900 text-sm">Save Corporate Compliance Settings Changes?</h3>
                <span className="text-[11px] text-stone-400 block uppercase font-bold">FEASTFLOW AUDITING SAFETY PROTOCOLS</span>
              </div>
            </div>

            {/* Warning card description */}
            <div className="text-stone-500 text-xs leading-relaxed space-y-2 border-y border-stone-200 py-4 font-semibold">
              <span className="font-extrabold text-[#E23744] uppercase tracking-wider text-[10px] block">⚠️ CRITICAL DIRECTIVE ALERT WARNING:</span>
              <p className="italic text-stone-600">
                "Updating tax settings immediately affects future invoices, billing calculations, tax reports, and client-facing digital receipts. Ensure active CGST + SGST parameters split matches compliance guidelines."
              </p>

              {/* Config delta lists */}
              <div className="bg-stone-50 p-3 rounded-xl border space-y-2.5 mt-3 text-stone-600">
                <span className="text-[10px] text-stone-400 uppercase font-black tracking-wide block">PROPOSED CONDUIT PARAMETERS IN THE DELTA:</span>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  <div>• Active GST Standard Rate:</div>
                  <strong className="text-stone-900">{gstPercent}%</strong>
                  
                  <div>• Deliveries Tax Segment:</div>
                  <strong className="text-zinc-900">{deliveryTaxPercent}%</strong>

                  <div>• Invoice layout status:</div>
                  <strong className="text-emerald-700">Sequence aligned ({invoiceFields.filter(f=>f.enabled).length} details active)</strong>

                  <div>• Surcharges Mode schema:</div>
                  <strong className="text-stone-900 uppercase font-mono">{deliveryTaxScope} Orders scope</strong>
                </div>
              </div>
            </div>

            {/* Row actions */}
            <div className="flex justify-end gap-2.5 text-xs font-semibold">
              <button
                onClick={() => setShowSaveConfirmModal(false)}
                className="p-2 py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-500 px-4 rounded-xl cursor-pointer transition-colors"
                disabled={isSavingInProgress}
              >
                Cancel Re-write
              </button>

              <button
                onClick={() => {
                  triggerToast("Draft settings stored", "Local changes saved into temporary session draft. Not pushed live to production.", "info");
                  setShowSaveConfirmModal(false);
                }}
                className="p-2 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-stone-700 px-4 rounded-xl cursor-pointer transition-colors"
                disabled={isSavingInProgress}
              >
                Save Draft Only
              </button>

              <button
                onClick={handleApplyChanges}
                className="p-2 py-2.5 bg-[#E23744] hover:bg-red-800 text-white font-black px-5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                disabled={isSavingInProgress}
              >
                {isSavingInProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deploying live...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-white" />
                    Apply Changes Live
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
