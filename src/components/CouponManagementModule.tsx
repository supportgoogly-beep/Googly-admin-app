import React, { useState, useMemo, useEffect } from "react";
import { 
  Tag, Plus, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight, 
  MoreVertical, Edit3, Copy, Trash2, Eye, Ban, CheckCircle2, 
  TrendingUp, HelpCircle, Download, Calendar, Users, Percent, 
  AlertCircle, DollarSign, X, Check, Building, CreditCard, 
  Briefcase, Activity, Clock, Bell, Info, Sun, Moon
} from "lucide-react";
import { Coupon, Restaurant } from "../types";

interface CouponManagementModuleProps {
  currentTab: string;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  restaurants: Restaurant[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

// Support types for metadata fields that represent coupon campaign detail details
interface CouponExtendedMeta {
  description: string;
  maxUsagePerUser: number;
  totalUsageLimit: number;
  startTime: string;
  endTime: string;
  targetCustomers: "All" | "New" | "Existing" | "Premium";
  applicableOn: "Entire Order" | "Food Items" | "Delivery Charges";
  paymentRestrictions: string[];
  usageCount: number;
  revenueGenerated: number;
  conversionRate: number;
}

export default function CouponManagementModule({
  currentTab,
  coupons,
  setCoupons,
  restaurants,
  triggerToast
}: CouponManagementModuleProps) {
  // Theme state
  const [themeMode, setThemeMode] = useState<"light" | "dark" | null>(null);

  // Load parent styles if dark is active, defaults to light
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || 
                   document.body.classList.contains("dark") ||
                   localStorage.getItem("theme") === "dark";
    setThemeMode(isDark ? "dark" : "light");
  }, []);

  // Sync state changes back
  const handleToggleTheme = () => {
    const nextMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(nextMode);
    triggerToast("Theme Updated", `Switched design view to ${nextMode} mode.`, "info");
  };

  // Search and general filtering state
  const [searchText, setSearchText] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | "percentage" | "flat">("all");
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"Active" | "Upcoming" | "Expired" | "Disabled">("Active");

  // Selection states for bulk actions
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  
  // Sort states
  const [sortField, setSortField] = useState<keyof Coupon | "usageCount" | "revenueGenerated">("code");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active view states
  const [selectedDetailCoupon, setSelectedDetailCoupon] = useState<Coupon | null>(null);
  const [selectedDetailMeta, setSelectedDetailMeta] = useState<CouponExtendedMeta | null>(null);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTargetCode, setEditTargetCode] = useState<string | null>(null);

  // Confirmation trigger states
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    actionType: "delete" | "disable" | "activate" | "bulk_delete" | "bulk_disable" | "bulk_activate";
    targetCode?: string;
  } | null>(null);

  // New Coupon / Editing form fields state
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"percentage" | "flat">("percentage");
  const [formValue, setFormValue] = useState<number>(20);
  const [formMinOrder, setFormMinOrder] = useState<number>(299);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number>(100);
  const [formMaxUsagePerUser, setFormMaxUsagePerUser] = useState<number>(3);
  const [formTotalUsageLimit, setFormTotalUsageLimit] = useState<number>(1000);
  const [formStartDate, setFormStartDate] = useState("2026-06-15");
  const [formEndDate, setFormEndDate] = useState("2026-06-30");
  const [formStartTime, setFormStartTime] = useState("10:00");
  const [formEndTime, setFormEndTime] = useState("23:59");
  const [formEligibleCustomers, setFormEligibleCustomers] = useState<"All" | "New" | "Existing" | "Premium">("All");
  const [formApplicableOn, setFormApplicableOn] = useState<"Entire Order" | "Food Items" | "Delivery Charges">("Entire Order");
  const [formPaymentRestrictions, setFormPaymentRestrictions] = useState<string[]>(["UPI", "Credit Card", "Debit Card", "Wallet"]);
  const [formRestaurants, setFormRestaurants] = useState<string[]>([]); // empty -> all
  const [searchRestaurantInput, setSearchRestaurantInput] = useState("");

  // Store metadata offline to persist details for standard coupon entries
  const [extendedMetaMap, setExtendedMetaMap] = useState<Record<string, CouponExtendedMeta>>(() => {
    return {
      "WELCOME100": {
        description: "Special onboarding voucher designed to delight first-time platform users.",
        maxUsagePerUser: 1,
        totalUsageLimit: 5000,
        startTime: "00:00",
        endTime: "23:59",
        targetCustomers: "New",
        applicableOn: "Entire Order",
        paymentRestrictions: ["UPI", "Credit Card", "Debit Card", "Wallet"],
        usageCount: 1420,
        revenueGenerated: 568300,
        conversionRate: 24.5
      },
      "ZOMATOPARTY": {
        description: "Platform wide weekend gourmet selections discount campaign.",
        maxUsagePerUser: 3,
        totalUsageLimit: 25000,
        startTime: "12:00",
        endTime: "23:30",
        targetCustomers: "All",
        applicableOn: "Food Items",
        paymentRestrictions: ["UPI", "Credit Card", "Debit Card"],
        usageCount: 8900,
        revenueGenerated: 4452000,
        conversionRate: 18.2
      },
      "SWEETFREE": {
        description: "Monsoon dessert and sweet helper coupon on chosen local bakeries.",
        maxUsagePerUser: 2,
        totalUsageLimit: 12000,
        startTime: "16:00",
        endTime: "21:00",
        targetCustomers: "Premium",
        applicableOn: "Entire Order",
        paymentRestrictions: ["UPI", "Wallet", "Cash On Delivery"],
        usageCount: 412,
        revenueGenerated: 98120,
        conversionRate: 11.8
      }
    };
  });

  // Unique Code validator: alerts as user edits Code field
  const isCodeDuplicate = useMemo(() => {
    if (isEditing) return false;
    return coupons.some(c => c.code.trim().toUpperCase() === formCode.trim().toUpperCase());
  }, [formCode, coupons, isEditing]);

  // Activity logs feed specific for promo operations
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; user: string; text: string; time: string }>>([
    { id: "1", user: "Ruhan D.", text: "Created promo code WELCOME100 for global first orders", time: "2026-06-12 11:04 AM" },
    { id: "2", user: "Sonia G.", text: "Deactivated SWEETFREE sweet coupon for audit review", time: "2026-06-11 04:30 PM" },
    { id: "3", user: "Automation Bot", text: "Scheduled coupon ZOMATOPARTY entered global listing pipeline", time: "2026-06-10 10:00 AM" }
  ]);

  const pushActivityLog = (text: string) => {
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
    setActivityLogs(prev => [
      { id: Date.now().toString(), user: "Ruhan D. (Director)", text, time: timestamp },
      ...prev
    ]);
  };

  // Status computation for unified tabs filter
  const getCouponStatus = (c: Coupon): "Active" | "Upcoming" | "Expired" | "Disabled" => {
    if (!c.active) return "Disabled";
    const today = "2026-06-12";
    if (c.endDate < today) return "Expired";
    if (c.startDate > today) return "Upcoming";
    return "Active";
  };

  // Safe accessor for metadata
  const getMeta = (code: string): CouponExtendedMeta => {
    if (extendedMetaMap[code]) return extendedMetaMap[code];
    return {
      description: "Custom discount promotion campaign designed to scale platform metrics.",
      maxUsagePerUser: 3,
      totalUsageLimit: 1000,
      startTime: "10:00",
      endTime: "23:59",
      targetCustomers: "All",
      applicableOn: "Entire Order",
      paymentRestrictions: ["UPI", "Credit Card", "Debit Card", "Wallet"],
      usageCount: 0,
      revenueGenerated: 0,
      conversionRate: 0
    };
  };

  // Counts for each tab
  const tabCounts = useMemo(() => {
    const counts = { Active: 0, Upcoming: 0, Expired: 0, Disabled: 0 };
    coupons.forEach(c => {
      const status = getCouponStatus(c);
      counts[status] += 1;
    });
    return counts;
  }, [coupons]);

  // Restaurant search inside dropdown list
  const filteredFormRestaurants = useMemo(() => {
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(searchRestaurantInput.toLowerCase())
    );
  }, [restaurants, searchRestaurantInput]);

  // Main filter pipeline: searches Code, Title, Restaurant applicable or meta campaign name
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      // 1. Tab status match
      const cStatus = getCouponStatus(c);
      if (cStatus !== activeTab) return false;

      // 2. Search Text match
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const codeMatch = c.code.toLowerCase().includes(query);
        const titleMatch = c.title.toLowerCase().includes(query);
        const descMatch = getMeta(c.code).description.toLowerCase().includes(query);
        
        // Match applicable restaurant names
        const restaurantMatch = c.applicableRestaurants.some(rId => {
          const rObj = restaurants.find(r => r.id === rId);
          return rObj ? rObj.name.toLowerCase().includes(query) : false;
        });

        if (!codeMatch && !titleMatch && !descMatch && !restaurantMatch) return false;
      }

      // 3. Discount Type filter
      if (selectedTypeFilter !== "all" && c.type !== selectedTypeFilter) return false;

      // 4. Restaurant applicable filter
      if (selectedRestaurantFilter !== "all") {
        if (c.applicableRestaurants.length > 0 && !c.applicableRestaurants.includes(selectedRestaurantFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [coupons, activeTab, searchText, selectedTypeFilter, selectedRestaurantFilter, restaurants]);

  // Multi-column Sorting
  const sortedCoupons = useMemo(() => {
    const sorted = [...filteredCoupons];
    sorted.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === "usageCount" || sortField === "revenueGenerated") {
        valA = getMeta(a.code)[sortField];
        valB = getMeta(b.code)[sortField];
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredCoupons, sortField, sortDirection]);

  // Paginated visible list
  const paginatedCoupons = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedCoupons.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedCoupons, currentPage]);

  const totalPages = Math.ceil(sortedCoupons.length / itemsPerPage) || 1;

  // Real-time calculated overall performance metrics
  const analyticsMetrics = useMemo(() => {
    let totalCount = coupons.length;
    let activeCount = coupons.filter(c => getCouponStatus(c) === "Active").length;
    let totalRedemptions = 0;
    let totalRev = 0;
    let conversionSum = 0;

    coupons.forEach(c => {
      const meta = getMeta(c.code);
      totalRedemptions += meta.usageCount;
      totalRev += meta.revenueGenerated;
      conversionSum += meta.conversionRate;
    });

    const averageDiscountGiven = totalRedemptions > 0 ? Math.round(totalRev * 0.15 / totalRedemptions) : 45;
    const avgConversion = totalCount > 0 ? Number((conversionSum / totalCount).toFixed(1)) : 16.4;

    return {
      totalCount,
      activeCount,
      totalRedemptions,
      totalRev,
      averageDiscountGiven,
      avgConversion
    };
  }, [coupons, extendedMetaMap]);

  // Reset page value if filter/tab shifts
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCodes([]);
  }, [activeTab, searchText, selectedTypeFilter, selectedRestaurantFilter]);

  // Form actions handlers
  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setEditTargetCode(null);
    setFormCode("");
    setFormTitle("");
    setFormDescription("");
    setFormType("percentage");
    setFormValue(20);
    setFormMinOrder(299);
    setFormMaxDiscount(100);
    setFormMaxUsagePerUser(3);
    setFormTotalUsageLimit(500);
    setFormStartDate("2026-06-15");
    setFormEndDate("2026-06-30");
    setFormStartTime("09:00");
    setFormEndTime("23:59");
    setFormEligibleCustomers("All");
    setFormApplicableOn("Entire Order");
    setFormPaymentRestrictions(["UPI", "Credit Card", "Debit Card", "Wallet"]);
    setFormRestaurants([]);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    const meta = getMeta(coupon.code);
    setIsEditing(true);
    setEditTargetCode(coupon.code);
    setFormCode(coupon.code);
    setFormTitle(coupon.title);
    setFormDescription(meta.description);
    setFormType(coupon.type);
    setFormValue(coupon.value);
    setFormMinOrder(coupon.minOrderValue);
    setFormMaxDiscount(coupon.maxDiscount);
    setFormMaxUsagePerUser(meta.maxUsagePerUser);
    setFormTotalUsageLimit(meta.totalUsageLimit);
    setFormStartDate(coupon.startDate);
    setFormEndDate(coupon.endDate);
    setFormStartTime(meta.startTime);
    setFormEndTime(meta.endTime);
    setFormEligibleCustomers(meta.targetCustomers);
    setFormApplicableOn(meta.applicableOn);
    setFormPaymentRestrictions(meta.paymentRestrictions);
    setFormRestaurants(coupon.applicableRestaurants);
    setShowCreateModal(true);
  };

  const handleCreateOrSaveCoupon = (e: React.FormEvent, forceStatus?: "draft" | "active" | "schedule") => {
    e.preventDefault();

    if (!formCode.trim()) {
      triggerToast("Missing Code", "Coupon code is a mandatory field.", "error");
      return;
    }

    if (isCodeDuplicate) {
      triggerToast("Duplicate Code Conflict", "This promo code already exists in active records.", "error");
      return;
    }

    if (formStartDate > formEndDate) {
      triggerToast("Invalid Dates", "End Date must be greater than or equal to Start Date.", "error");
      return;
    }

    const uppercaseCode = formCode.trim().toUpperCase();
    
    // Status flag logic
    let isCouponActive = true;
    if (forceStatus === "draft") {
      isCouponActive = false;
    } else if (forceStatus === "schedule") {
      isCouponActive = true;
    }

    const updatedCoupon: Coupon = {
      code: uppercaseCode,
      title: formTitle || `${formType === "flat" ? "₹" + formValue : formValue + "%"} Off Promo Campaign`,
      type: formType,
      value: formValue,
      minOrderValue: formMinOrder,
      maxDiscount: formMaxDiscount,
      startDate: formStartDate,
      endDate: formEndDate,
      applicableRestaurants: formRestaurants,
      active: isCouponActive
    };

    const updatedMeta: CouponExtendedMeta = {
      description: formDescription || "Standard campaign coupon created.",
      maxUsagePerUser: formMaxUsagePerUser,
      totalUsageLimit: formTotalUsageLimit,
      startTime: formStartTime,
      endTime: formEndTime,
      targetCustomers: formEligibleCustomers,
      applicableOn: formApplicableOn,
      paymentRestrictions: formPaymentRestrictions,
      usageCount: isEditing ? (extendedMetaMap[uppercaseCode]?.usageCount || 0) : 0,
      revenueGenerated: isEditing ? (extendedMetaMap[uppercaseCode]?.revenueGenerated || 0) : 0,
      conversionRate: isEditing ? (extendedMetaMap[uppercaseCode]?.conversionRate || 0) : 15.0
    };

    // Update main state
    if (isEditing && editTargetCode) {
      setCoupons(prev => prev.map(c => c.code === editTargetCode ? updatedCoupon : c));
      setExtendedMetaMap(prev => ({ ...prev, [uppercaseCode]: updatedMeta }));
      pushActivityLog(`Modified coupon configuration for ${uppercaseCode}`);
      triggerToast("Campaign Updated", `Promo code ${uppercaseCode} updated successfully.`, "success");
    } else {
      setCoupons(prev => [updatedCoupon, ...prev]);
      setExtendedMetaMap(prev => ({ ...prev, [uppercaseCode]: updatedMeta }));
      pushActivityLog(`Generated custom promotional code ${uppercaseCode}`);
      triggerToast("Campaign Registered", `Promo code ${uppercaseCode} is now live and queued.`, "success");
    }

    setShowCreateModal(false);
  };

  // Duplicate Coupon
  const handleDuplicateCoupon = (coupon: Coupon) => {
    const sourceMeta = getMeta(coupon.code);
    const duplicatedCode = `${coupon.code}_DUP_${Math.floor(Math.random() * 899 + 100)}`;
    
    const duplicatedCoupon: Coupon = {
      ...coupon,
      code: duplicatedCode,
      title: `${coupon.title} (Clone)`,
      active: false // Saved as draft/disabled originally
    };

    const duplicatedMeta: CouponExtendedMeta = {
      ...sourceMeta,
      usageCount: 0,
      revenueGenerated: 0,
      conversionRate: 0,
      description: `Cloned copy of ${coupon.code}. ${sourceMeta.description}`
    };

    setCoupons(prev => [duplicatedCoupon, ...prev]);
    setExtendedMetaMap(prev => ({ ...prev, [duplicatedCode]: duplicatedMeta }));
    pushActivityLog(`Duplicated promotional coupon ${coupon.code} to ${duplicatedCode}`);
    triggerToast("Coupon Cloned", `Successfully duplicated to ${duplicatedCode} as disabled.`, "success");
  };

  // Confirm Modal configuration trigger helper
  const triggerConfirmation = (
    title: string, 
    message: string, 
    actionType: typeof confirmModalConfig.actionType, 
    targetCode?: string
  ) => {
    setConfirmModalConfig({
      show: true,
      title,
      message,
      actionType,
      targetCode
    });
  };

  // Execute confirmation action
  const executeConfirmedAction = () => {
    if (!confirmModalConfig) return;

    const { actionType, targetCode } = confirmModalConfig;

    if (actionType === "delete" && targetCode) {
      setCoupons(prev => prev.filter(c => c.code !== targetCode));
      // remove meta
      const copyMeta = { ...extendedMetaMap };
      delete copyMeta[targetCode];
      setExtendedMetaMap(copyMeta);
      pushActivityLog(`Deleted voucher campaign ${targetCode}`);
      triggerToast("Coupon Terminated", `Promo code ${targetCode} completely removed from databases.`, "info");
    } 
    else if (actionType === "disable" && targetCode) {
      setCoupons(prev => prev.map(c => c.code === targetCode ? { ...c, active: false } : c));
      pushActivityLog(`Manually disabled campaign code ${targetCode}`);
      triggerToast("Promo Switched Off", `Coupon code ${targetCode} is now inactive.`, "info");
    } 
    else if (actionType === "activate" && targetCode) {
      setCoupons(prev => prev.map(c => c.code === targetCode ? { ...c, active: true } : c));
      pushActivityLog(`Manually re-enabled campaign code ${targetCode}`);
      triggerToast("Promo Switched On", `Coupon code ${targetCode} is now active.`, "success");
    }
    else if (actionType === "bulk_delete") {
      setCoupons(prev => prev.filter(c => !selectedCodes.includes(c.code)));
      pushActivityLog(`Bulk deleted ${selectedCodes.length} vouchers`);
      triggerToast("Bulk Deletes Met", `Terminated ${selectedCodes.length} selected promos.`, "success");
      setSelectedCodes([]);
    }
    else if (actionType === "bulk_disable") {
      setCoupons(prev => prev.map(c => selectedCodes.includes(c.code) ? { ...c, active: false } : c));
      pushActivityLog(`Bulk disabled ${selectedCodes.length} active coupons`);
      triggerToast("Bulk Disables Met", `Switched off ${selectedCodes.length} voucher tags.`, "info");
      setSelectedCodes([]);
    }
    else if (actionType === "bulk_activate") {
      setCoupons(prev => prev.map(c => selectedCodes.includes(c.code) ? { ...c, active: true } : c));
      pushActivityLog(`Bulk activated ${selectedCodes.length} coupons`);
      triggerToast("Bulk Activations Met", `Enabled ${selectedCodes.length} promo categories.`, "success");
      setSelectedCodes([]);
    }

    setConfirmModalConfig(null);
  };

  // Open detailing view drawer
  const handleOpenDetailsDrawer = (coupon: Coupon) => {
    setSelectedDetailCoupon(coupon);
    setSelectedDetailMeta(getMeta(coupon.code));
  };

  // Export selected / all coupons
  const executeExportCoupons = (selectedOnly: boolean) => {
    const listToExport = selectedOnly 
      ? coupons.filter(c => selectedCodes.includes(c.code))
      : coupons;

    if (listToExport.length === 0) {
      triggerToast("Export Failed", "No coupons targeted for export output.", "error");
      return;
    }

    const dataReport = listToExport.map(c => ({
      ...c,
      meta: getMeta(c.code)
    }));

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataReport, null, 2))}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `Promo_Campaign_Report_${selectedOnly ? "Selected" : "Full"}_2026.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    triggerToast("Data Export Complete", `${listToExport.length} Promo campaigns parsed and downloaded.`, "success");
    pushActivityLog(`Exported ${listToExport.length} coupon data objects to JSON document`);
  };

  // Sorting helper
  const handleRequestSort = (field: keyof Coupon | "usageCount" | "revenueGenerated") => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  // Selected row checkers
  const handleToggleRowSelection = (code: string) => {
    setSelectedCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleToggleSelectAll = () => {
    const currentPageCodes = paginatedCoupons.map(c => c.code);
    const allSelectedOnPage = currentPageCodes.every(code => selectedCodes.includes(code));

    if (allSelectedOnPage) {
      // remove all current page keys
      setSelectedCodes(prev => prev.filter(code => !currentPageCodes.includes(code)));
    } else {
      // accumulate missing page keys
      setSelectedCodes(prev => {
        const next = [...prev];
        currentPageCodes.forEach(code => {
          if (!next.includes(code)) next.push(code);
        });
        return next;
      });
    }
  };

  // Dynamic live calculations for previews
  const previewSummary = useMemo(() => {
    return {
      formattedDiscount: formType === "flat" ? `₹${formValue} FLAT` : `${formValue}% OFF`,
      formattedExpiry: new Date(formEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      targetedStatus: formEligibleCustomers === "All" ? "All Customers" : formEligibleCustomers === "New" ? "New Accounts Only" : `${formEligibleCustomers} Tier`
    };
  }, [formType, formValue, formEndDate, formEligibleCustomers]);

  return (
    <div className={`p-1 rounded-3xl transition-all ${themeMode === "dark" ? "bg-[#121214] text-gray-100" : "bg-white text-gray-800"}`}>
      
      {/* HEADER SECTION PANEL */}
      <div className={`p-6 rounded-2xl border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        themeMode === "dark" ? "border-gray-800 bg-[#1A1A1E]" : "border-gray-200 bg-gray-50/60"
      }`}>
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
              themeMode === "dark" ? "bg-amber-900 text-amber-400" : "bg-[#E23744]/10 text-[#E23744]"
            }`}>
              CAMPAIGN CODES PIPELINE
            </span>
            <button 
              onClick={handleToggleTheme}
              className={`p-1 rounded-lg border hover:opacity-85 ${
                themeMode === "dark" ? "border-gray-700 bg-gray-800 text-amber-300" : "border-gray-300 bg-white text-gray-500"
              }`}
            >
              {themeMode === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Coupon & Promo Code Management</h1>
          <p className="text-xs text-stone-500 dark:text-gray-400">Create, manage, schedule, activate, and optimize marketing promotional campaigns in real time.</p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={() => executeExportCoupons(false)}
            className={`p-2 px-3 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all outline-hidden cursor-pointer ${
              themeMode === "dark" ? "bg-gray-900 border-gray-800 text-white hover:bg-gray-800" : "bg-white border-zinc-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Download className="w-3.5 h-3.5 text-stone-400" /> Export List
          </button>

          <button 
            onClick={handleOpenCreateModal}
            className="p-2 px-4 bg-[#E23744] hover:bg-rose-700 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>
      </div>

      {/* CORE PERFORMANCE ANALYTICS CARD GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-zinc-150 shadow-3xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Total Promos</span>
            <Tag className="w-4 h-4 text-sky-500" />
          </div>
          <strong className="text-2xl font-black text-gray-900 dark:text-white mt-2">{analyticsMetrics.totalCount}</strong>
          <span className="text-[9px] text-stone-400 mt-1">Global catalog size</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-zinc-150 shadow-3xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Active Pools</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{analyticsMetrics.activeCount}</strong>
          <span className="text-[9px] text-emerald-500 font-bold mt-1">● Redeemable checkout</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-zinc-150 shadow-3xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Total Redemptions</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <strong className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">{(analyticsMetrics.totalRedemptions / 1000).toFixed(1)}k Times</strong>
          <span className="text-[9px] text-stone-400 mt-1">Redeemed index</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-zinc-150 shadow-3xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Gross Impact Revenue</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <strong className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">₹{(analyticsMetrics.totalRev / 100000).toFixed(1)}L</strong>
          <span className="text-[9px] text-rose-500 font-bold mt-1">▲ Induced food spend</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-white border-zinc-150 shadow-3xs"}`}>
          <div className="flex justify-between items-center text-stone-400">
            <span className="text-[10px] uppercase font-black">Avg Disbursed value</span>
            <span className="text-stone-400 font-bold text-xs">₹</span>
          </div>
          <strong className="text-2xl font-black text-gray-900 dark:text-white mt-2">₹{analyticsMetrics.averageDiscountGiven}</strong>
          <span className="text-[9px] text-stone-400 mt-1">Per specific payment</span>
        </div>

        <div className={`p-4 rounded-xl border text-left flex flex-col justify-between ${themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-emerald-50/50 border-emerald-100 shadow-3xs"}`}>
          <div className="flex justify-between items-center text-[#E23744]">
            <span className="text-[10px] uppercase font-black">Redeem Elasticity</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{analyticsMetrics.avgConversion}%</strong>
          <span className="text-[9px] text-emerald-600 font-bold mt-1">Conversion metric</span>
        </div>
      </div>

      {/* SEARCH AND COMPLEX FILTERS TOOLBAR */}
      <div className={`p-4 rounded-xl border mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between text-left ${
        themeMode === "dark" ? "bg-[#17171A] border-gray-800" : "bg-slate-50/75 border-zinc-150"
      }`}>
        <div className="relative w-full lg:max-w-sm">
          <input 
            type="text"
            placeholder="Search coupon name, promo tag, campaign details, or outlet..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] ${
              themeMode === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-zinc-200 text-stone-800"
            }`}
          />
          <span className="absolute left-3 top-2.5 text-stone-400">
            <Search className="w-4 h-4" />
          </span>
          {searchText && (
            <button 
              onClick={() => setSearchText("")} 
              className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs text-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Discount Type filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-400 font-bold whitespace-nowrap">Promo Class:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
              className={`p-1.5 text-xs font-bold rounded-xl border focus:outline-hidden ${
                themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200 text-stone-700"
              }`}
            >
              <option value="all">Unspecified Disbursal</option>
              <option value="percentage"> % Percentage Off</option>
              <option value="flat"> ₹ Flat Off</option>
            </select>
          </div>

          {/* Restaurant filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-400 font-bold whitespace-nowrap">Outlet:</span>
            <select
              value={selectedRestaurantFilter}
              onChange={(e) => setSelectedRestaurantFilter(e.target.value)}
              className={`p-1.5 text-xs font-bold rounded-xl border focus:outline-hidden max-w-[160px] ${
                themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200 text-stone-700"
              }`}
            >
              <option value="all">Universal (All Outlets)</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="h-6 w-px bg-stone-300 dark:bg-gray-700 hidden sm:block"></div>

          {/* BULK SELECTION ACTION BUTTONS */}
          {selectedCodes.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#E23744]/10 p-1.5 px-3 rounded-xl border border-[#E23744]/20 animate-fade-in">
              <span className="text-[10px] text-red-700 font-black whitespace-nowrap">
                {selectedCodes.length} checked:
              </span>
              <button 
                onClick={() => triggerConfirmation("Activate Bulk Coupons?", `Are you sure you want to deploy ${selectedCodes.length} checked voucher codes concurrently?`, "bulk_activate")}
                className="p-1 px-2 hover:bg-stone-100 rounded text-[9px] font-black uppercase text-[#E23744] hover:text-rose-700 transition-colors"
              >
                On
              </button>
              <button 
                onClick={() => triggerConfirmation("Disable Bulk Coupons?", `Confirm deactivating ${selectedCodes.length} checked promotions?`, "bulk_disable")}
                className="p-1 px-2 hover:bg-stone-100 rounded text-[9px] font-black uppercase text-stone-600 transition-colors"
              >
                Off
              </button>
              <button 
                onClick={() => triggerConfirmation("Delete Bulk Coupons?", `Extreme caution: You want to completely remove ${selectedCodes.length} promotions from databases?`, "bulk_delete")}
                className="p-1 px-2 bg-[#E23744] text-white hover:bg-rose-700 rounded text-[9px] font-black uppercase transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={() => executeExportCoupons(true)}
                className="p-1 px-2 hover:bg-stone-100 text-stone-700 rounded text-[9px] font-black uppercase transition-colors"
              >
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* COUPON WORKFLOW STATUS TABS */}
      <div className="flex border-b border-gray-200 dark:border-gray-900 mb-6 font-semibold scrollbar-none overflow-x-auto">
        <button 
          onClick={() => setActiveTab("Active")}
          className={`pb-3 px-5 text-xs flex items-center gap-2 border-b-2 font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "Active" 
              ? "border-[#E23744] text-[#E23744]" 
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          Active Promotions
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
            activeTab === "Active" ? "bg-[#E23744] text-white" : "bg-stone-100 text-stone-500 dark:bg-gray-800"
          }`}>
            {tabCounts.Active}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab("Upcoming")}
          className={`pb-3 px-5 text-xs flex items-center gap-2 border-b-2 font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "Upcoming" 
              ? "border-[#E23744] text-[#E23744]" 
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          Upcoming (Scheduled)
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
            activeTab === "Upcoming" ? "bg-[#E23744] text-white" : "bg-stone-100 text-stone-500 dark:bg-gray-800"
          }`}>
            {tabCounts.Upcoming}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab("Expired")}
          className={`pb-3 px-5 text-xs flex items-center gap-2 border-b-2 font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "Expired" 
              ? "border-[#E23744] text-[#E23744]" 
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          Completed / Expired
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
            activeTab === "Expired" ? "bg-[#E23744] text-white" : "bg-stone-100 text-stone-500 dark:bg-gray-800"
          }`}>
            {tabCounts.Expired}
          </span>
        </button>

        <button 
          onClick={() => setActiveTab("Disabled")}
          className={`pb-3 px-5 text-xs flex items-center gap-2 border-b-2 font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "Disabled" 
              ? "border-[#E23744] text-[#E23744]" 
              : "border-transparent text-stone-400 hover:text-stone-600"
          }`}
        >
          Manually Disabled
          <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
            activeTab === "Disabled" ? "bg-[#E23744] text-white" : "bg-stone-100 text-stone-500 dark:bg-gray-800"
          }`}>
            {tabCounts.Disabled}
          </span>
        </button>
      </div>

      {/* CORE DATA TABLE */}
      <div className={`overflow-x-auto rounded-2xl border ${
        themeMode === "dark" ? "border-gray-800 bg-[#16161A]" : "border-zinc-200 bg-white"
      }`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b text-[10px] uppercase font-black text-stone-400 tracking-wider ${
              themeMode === "dark" ? "bg-[#1E1E24] border-gray-900" : "bg-slate-50/50 border-gray-200"
            }`}>
              <th className="p-4 w-10">
                <input 
                  type="checkbox"
                  checked={paginatedCoupons.length > 0 && paginatedCoupons.every(c => selectedCodes.includes(c.code))}
                  onChange={handleToggleSelectAll}
                  className="rounded accent-[#E23744] h-4 w-4 cursor-pointer"
                />
              </th>
              <th className="p-4 cursor-pointer" onClick={() => handleRequestSort("title")}>
                <div className="flex items-center gap-1">Promo Title & Description <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-4 cursor-pointer" onClick={() => handleRequestSort("code")}>
                <div className="flex items-center gap-1">Voucher Code <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-4 cursor-pointer" onClick={() => handleRequestSort("type")}>
                <div className="flex items-center gap-1">Discount Class <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-4 text-center">Minimum spend</th>
              <th className="p-4 text-center">Max Benefit</th>
              <th className="p-4">Applicable restaurants</th>
              <th className="p-4 font-mono text-center">Redemption stats</th>
              <th className="p-4 text-center" onClick={() => handleRequestSort("endDate")}>
                <div className="flex items-center justify-center gap-1">Expiry Timeline <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
            {paginatedCoupons.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-12 text-center">
                  <div className="max-w-sm mx-auto space-y-2">
                    <Tag className="w-8 h-8 text-stone-300 mx-auto" />
                    <strong className="text-sm font-black block text-gray-900 dark:text-gray-300">No promo coupons match criteria</strong>
                    <p className="text-xs text-stone-400">Try loosening your search terms, filter checkboxes, or add a newly created coupon.</p>
                    <button 
                      onClick={handleOpenCreateModal}
                      className="mt-3 px-4 py-1.5 bg-[#E23744] hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Define Coupon Now
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedCoupons.map(cop => {
                const isSelected = selectedCodes.includes(cop.code);
                const meta = getMeta(cop.code);
                
                // Restaurant list helper
                let restaurantLabel = "Universal (All)";
                if (cop.applicableRestaurants.length > 0) {
                  const firstId = cop.applicableRestaurants[0];
                  const firstRest = restaurants.find(r => r.id === firstId);
                  if (firstRest) {
                    restaurantLabel = cop.applicableRestaurants.length === 1 
                      ? firstRest.name
                      : `${firstRest.name} +${cop.applicableRestaurants.length - 1} outlets`;
                  }
                }

                return (
                  <tr 
                    key={cop.code}
                    className={`hover:bg-slate-50/50 dark:hover:bg-gray-900/40 transition-colors text-xs text-left ${
                      isSelected ? "bg-rose-500/5 dark:bg-[#201516]" : ""
                    }`}
                  >
                    <td className="p-4">
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRowSelection(cop.code)}
                        className="rounded accent-[#E23744] h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 max-w-xs md:max-w-[240px]">
                      <div className="space-y-0.5 text-left">
                        <span 
                          onClick={() => handleOpenDetailsDrawer(cop)}
                          className="font-bold text-gray-900 dark:text-white hover:text-[#E23744] hover:underline cursor-pointer block truncate"
                        >
                          {cop.title}
                        </span>
                        <p className="text-[10px] text-stone-400 line-clamp-1">{meta.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="p-1 px-2.5 font-mono font-black rounded-lg bg-stone-100 dark:bg-gray-900 dark:text-white text-stone-800 text-[11px] tracking-wide border dark:border-gray-800">
                        {cop.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-1 rounded-md ${cop.type === "flat" ? "bg-purple-100 text-purple-800" : "bg-indigo-100 text-indigo-800"}`}>
                          {cop.type === "flat" ? "₹ Cash Back" : "% Percentage"}
                        </span>
                        <strong className="text-gray-900 dark:text-white">{cop.type === "flat" ? `₹${cop.value}` : `${cop.value}%`} off</strong>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-stone-600 dark:text-stone-300">
                      ₹{cop.minOrderValue}
                    </td>
                    <td className="p-4 text-center font-mono font-bold text-[#E23744]">
                      ₹{cop.maxDiscount}
                    </td>
                    <td className="p-4 font-semibold text-stone-500 dark:text-stone-400 max-w-[140px] truncate">
                      <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> {restaurantLabel}</span>
                    </td>
                    <td className="p-4 text-center font-mono">
                      <div className="space-y-0.5">
                        <strong className="text-gray-900 dark:text-white block">{meta.usageCount} Redeemed</strong>
                        <span className="text-[10px] text-[#E23744] font-medium">Induced: ₹{meta.revenueGenerated.toLocaleString("en-IN")}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="block">{cop.startDate}</span>
                        <span className="text-[10px] opacity-75">until {cop.endDate}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => handleOpenDetailsDrawer(cop)}
                          className="p-1 text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 rounded"
                          title="View analytics charts report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEditModal(cop)}
                          className="p-1 text-[#E23744] hover:bg-rose-50 dark:hover:bg-slate-800 rounded"
                          title="Edit promotion setup parameters"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDuplicateCoupon(cop)}
                          className="p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 rounded"
                          title="Duplicate/Clone coupon ruleset"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (cop.active) {
                              triggerConfirmation(`Disable Promo ${cop.code}?`, `If confirmed, customers won't be able to apply ${cop.code} at checkout.`, "disable", cop.code);
                            } else {
                              triggerConfirmation(`Activate Promo ${cop.code}?`, `If confirmed, ${cop.code} becomes live and functional instantly.`, "activate", cop.code);
                            }
                          }}
                          className={`p-1 rounded ${cop.active ? "text-amber-600 hover:bg-amber-100" : "text-emerald-600 hover:bg-emerald-100"}`}
                          title={cop.active ? "Pause promotion" : "Activate promotion"}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => triggerConfirmation("Terminate Promo?", `Extreme caution: You want to completely delete ${cop.code}? This cannot be undone.`, "delete", cop.code)}
                          className="p-1 text-slate-400 hover:text-red-700 hover:bg-rose-50 dark:hover:bg-slate-800 rounded"
                          title="Delete promotion"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* FOOTER PAGINATION CONTROL */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-stone-500 font-semibold px-2">
        <span>Showing {paginatedCoupons.length} of {sortedCoupons.length} filters match records</span>
        <div className="flex items-center gap-1.5">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-1.5 px-3 bg-stone-100 dark:bg-gray-800 disabled:opacity-40 rounded-lg hover:bg-stone-200 cursor-pointer text-[10px]"
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-1.5 px-3 bg-stone-100 dark:bg-gray-800 disabled:opacity-40 rounded-lg hover:bg-stone-200 cursor-pointer text-[10px]"
          >
            Next
          </button>
        </div>
      </div>

      {/* LIVE AUDIT LOGGING & ACTIVITY TIMELINE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        
        {/* ACTION TIMELINE LOGS */}
        <div className={`p-5 rounded-2xl border ${
          themeMode === "dark" ? "bg-[#1A1A1E] border-gray-900" : "bg-white border-zinc-150 shadow-3xs"
        }`}>
          <div className="flex justify-between items-center mb-4 text-left">
            <div>
              <h3 className="text-xs uppercase font-black text-gray-500">Live Marketing Action Logs</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">Auditing of administrative promotional activity logs.</p>
            </div>
            <Activity className="w-4 h-4 text-[#E23744] animate-pulse" />
          </div>

          <div className="space-y-3 max-h-[190px] overflow-y-auto text-left pr-1">
            {activityLogs.map(log => (
              <div key={log.id} className="p-2.5 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 border border-transparent dark:border-gray-900 flex justify-between gap-4 text-xs font-semibold">
                <div>
                  <strong className="text-gray-900 dark:text-white block font-black">{log.user}</strong>
                  <p className="text-[11px] text-stone-500 dark:text-gray-400 mt-0.5">{log.text}</p>
                </div>
                <span className="text-[10px] text-stone-400 font-mono self-start whitespace-nowrap">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM BULLETINS / ALERTS PIPELINE */}
        <div className={`p-5 rounded-2xl border ${
          themeMode === "dark" ? "bg-[#1A1A1E] border-gray-900" : "bg-white border-zinc-150 shadow-3xs"
        }`}>
          <div className="flex justify-between items-center mb-4 text-left">
            <div>
              <h3 className="text-xs uppercase font-black text-gray-500">Promotions Diagnostic Center</h3>
              <p className="text-[10px] text-stone-400 mt-0.5">System status indicators and active telemetry alerts.</p>
            </div>
            <Bell className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="space-y-2.5 text-left text-xs font-semibold">
            <div className="p-3 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 rounded-xl flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <strong>Global Promo checkout validator online</strong>
                <p className="text-[11px] opacity-80 mt-0.5">Voucher code application engine verified healthy with average millisecond checkout lookup response speed of 18ms.</p>
              </div>
            </div>

            <div className="p-3 bg-[#E23744]/10 text-red-800 dark:text-red-400 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-[#E23744] shrink-0" />
              <div>
                <strong>Check duplicate triggers warnings active</strong>
                <p className="text-[11px] opacity-80 mt-0.5">Rules safeguard blocked 2 duplicate requests for WELCOME100 in database storage layers yesterday.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CREATE / EDIT SLIDING DRAWER MODAL OVERLAY */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-[100] text-left">
          <div className={`w-full max-w-2xl h-full flex flex-col justify-between overflow-y-auto animate-slide-in shadow-2xl relative ${
            themeMode === "dark" ? "bg-[#17171A] text-white" : "bg-white text-stone-800"
          }`}>
            
            {/* Drawer Header */}
            <div>
              <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-gray-900 dark:text-white">
                    {isEditing ? `Modify Promotion parameters [${editTargetCode}]` : "Establish New Promo Campaign"}
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">Configure discounts, applicable restaurants groups, timeline metrics and limits.</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-gray-800 dark:text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                >
                  Close
                </button>
              </div>

              {/* Form Grid Area */}
              <form onSubmit={(e) => handleCreateOrSaveCoupon(e, "active")} className="p-6 space-y-5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                
                {/* PART 1: COUPON BASIC INFORMATION */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Part 1: Basic Campaign Identifiers</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-stone-500 mb-1">Coupon Promo Code (Must be unique)*</label>
                      <input 
                        type="text"
                        required
                        disabled={isEditing}
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        placeholder="e.g. MONSOON150"
                        className={`w-full p-2.5 rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] font-black font-mono tracking-wide ${
                          themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200 text-stone-800"
                        }`}
                      />
                      {isCodeDuplicate && (
                        <p className="text-red-500 text-[10px] font-bold mt-1">⚠️ A coupon with this exact code tag already exists!</p>
                      )}
                      {!isEditing && formCode && !isCodeDuplicate && (
                        <p className="text-emerald-600 text-[10px] font-bold mt-1">✔ Target voucher promo tag is unique and available.</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-stone-500 mb-1">Coupon Display Title Heading *</label>
                      <input 
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="e.g. 20% OFF on gourmet meals"
                        className={`w-full p-2.5 rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] ${
                          themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200 text-stone-800"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-500 mb-1">Promo Campaign Detailed Description *</label>
                    <textarea 
                      required
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Detail who is valid, where discounts apply or details of maximum delivery caps..."
                      className={`w-full p-2.5 rounded-xl border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] h-16 ${
                        themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200 text-stone-800"
                      }`}
                    />
                  </div>
                </div>

                {/* PART 2: BENEFITS AND LIMIT CONDITIONS */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-3">
                  <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Part 2: Discounts & Order Threshold Limits</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${
                      themeMode === "dark" ? "bg-[#1E1E24] border-gray-800" : "bg-stone-50/50 border-gray-200"
                    }`}>
                      <label className="block text-stone-500 mb-2">Benefit Disbursal Type</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                          <input 
                            type="radio" 
                            name="benefit_type" 
                            checked={formType === "percentage"}
                            onChange={() => { setFormType("percentage"); setFormValue(20); }}
                            className="accent-[#E23744] h-4 w-4"
                          />
                          Percentage Discount (%)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                          <input 
                            type="radio" 
                            name="benefit_type" 
                            checked={formType === "flat"}
                            onChange={() => { setFormType("flat"); setFormValue(150); }}
                            className="accent-[#E23744] h-4 w-4"
                          />
                          Flat Cash Discount (₹)
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-stone-400 mb-1">
                            {formType === "percentage" ? "Discount Ratio (%)" : "Flat Amount (₹)"}
                          </label>
                          <input 
                            type="number"
                            required
                            min="1"
                            value={formValue}
                            onChange={(e) => setFormValue(Number(e.target.value))}
                            className={`w-full p-2 rounded-lg border ${
                              themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200"
                            }`}
                          />
                        </div>

                        {formType === "percentage" && (
                          <div>
                            <label className="block text-stone-400 mb-1">Maximum Discount (₹)</label>
                            <input 
                              type="number"
                              required
                              min="1"
                              value={formMaxDiscount}
                              onChange={(e) => setFormMaxDiscount(Number(e.target.value))}
                              className={`w-full p-2 rounded-lg border ${
                                themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${
                      themeMode === "dark" ? "bg-[#1E1E24] border-gray-800" : "bg-stone-50/50 border-gray-200"
                    }`}>
                      <label className="block text-stone-500 mb-2">Usage Limits & Minimum Value</label>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-stone-400 text-[10px] mb-1">Min Spends (₹)</label>
                          <input 
                            type="number"
                            required
                            value={formMinOrder}
                            onChange={(e) => setFormMinOrder(Number(e.target.value))}
                            className={`w-full p-1.5 rounded-lg border ${
                              themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-stone-400 text-[10px] mb-1">User Limit (redemptions)</label>
                          <input 
                            type="number"
                            required
                            value={formMaxUsagePerUser}
                            onChange={(e) => setFormMaxUsagePerUser(Number(e.target.value))}
                            className={`w-full p-1.5 rounded-lg border ${
                              themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200"
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-stone-400 text-[10px] mb-1">Total Limit</label>
                          <input 
                            type="number"
                            required
                            value={formTotalUsageLimit}
                            onChange={(e) => setFormTotalUsageLimit(Number(e.target.value))}
                            className={`w-full p-1.5 rounded-lg border ${
                              themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PART 3: SCHEDULING CALENDARS */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-3">
                  <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Part 3: Campaign Date & Time Scheduling</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-stone-500 mb-1">Start Date</label>
                      <input 
                        type="date"
                        required
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className={`w-full p-2 rounded-xl border font-mono text-[11px] ${
                          themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-stone-500 mb-1">Start Time</label>
                      <input 
                        type="time"
                        required
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className={`w-full p-2 rounded-xl border font-mono text-[11px] ${
                          themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-stone-500 mb-1">Expiry Date</label>
                      <input 
                        type="date"
                        required
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className={`w-full p-2 rounded-xl border font-mono text-[11px] ${
                          themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-stone-500 mb-1">Expiry Time</label>
                      <input 
                        type="time"
                        required
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className={`w-full p-2 rounded-xl border font-mono text-[11px] ${
                          themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* PART 4: APPLICABILITY GROUP SECTORS */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-4">
                  <h3 className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Part 4: Targeted Restaurants & Eligibility Rules</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Restaurants Multi list selection */}
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between items-center">
                        <label className="block text-stone-500">Applicable Culinary Restaurants</label>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={() => setFormRestaurants(restaurants.map(r => r.id))}
                            className="p-1 px-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-gray-800 text-stone-700 dark:text-white rounded text-[9px] font-black"
                          >
                            All Outlets
                          </button>
                          <button 
                            type="button"
                            onClick={() => setFormRestaurants([])}
                            className="p-1 px-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-gray-800 text-stone-700 dark:text-white rounded text-[9px] font-black"
                          >
                            Clear Selection
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Search partner outlets inside dropdown..."
                          value={searchRestaurantInput}
                          onChange={(e) => setSearchRestaurantInput(e.target.value)}
                          className={`w-full p-2 pl-8 text-[11px] rounded-lg border ${
                            themeMode === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
                          }`}
                        />
                        <span className="absolute left-2.5 top-2.5 text-stone-400">&#128270;</span>
                      </div>

                      <div className="h-32 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-lg p-2.5 space-y-1.5">
                        {filteredFormRestaurants.map(rest => {
                          const isChecked = formRestaurants.includes(rest.id);
                          return (
                            <label key={rest.id} className="flex justify-between items-center text-[11px] cursor-pointer hover:bg-stone-50 dark:hover:bg-gray-800 p-1.5 rounded transition-colors text-left">
                              <span className="text-gray-800 dark:text-gray-200 font-bold">{rest.name} ({rest.cuisine})</span>
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setFormRestaurants(prev => prev.filter(id => id !== rest.id));
                                  } else {
                                    setFormRestaurants(prev => [...prev, rest.id]);
                                  }
                                }}
                                className="rounded accent-[#E23744] h-3.5 w-3.5 cursor-pointer"
                              />
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-stone-400">Selected {formRestaurants.length === 0 ? "Universal (All Restaurants)" : `${formRestaurants.length} restaurants applicable`}.</p>
                    </div>

                    {/* Customer Eligibility & Payment Conditions */}
                    <div className="space-y-3 text-left">
                      <div>
                        <label className="block text-stone-400 mb-1">Target Customer Eligibility</label>
                        <select 
                          value={formEligibleCustomers}
                          onChange={(e) => setFormEligibleCustomers(e.target.value as any)}
                          className={`w-full p-2 rounded-lg border bg-white dark:bg-gray-900 ${
                            themeMode === "dark" ? "border-gray-700 text-white" : "border-zinc-200"
                          }`}
                        >
                          <option value="All">All Registered Customers</option>
                          <option value="New">First Order / New Users Only</option>
                          <option value="Existing">Special Existing Churn users</option>
                          <option value="Premium">Club Members / Premium Segment</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-stone-400 mb-1">Applicable Order Segment</label>
                        <div className="flex flex-wrap gap-2">
                          {["Entire Order", "Food Items", "Delivery Charges"].map((it: any) => (
                            <button 
                              key={it}
                              type="button"
                              onClick={() => setFormApplicableOn(it)}
                              className={`p-1.5 px-3 rounded-lg text-[10px] font-bold cursor-pointer border ${
                                formApplicableOn === it 
                                  ? "bg-[#E23744] border-[#E23744] text-white" 
                                  : "bg-white dark:bg-gray-900 text-stone-500 border-zinc-200 dark:border-gray-800 hover:bg-stone-50"
                              }`}
                            >
                              {it}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-stone-400 mb-1">Required Payment Methods</label>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {["UPI", "Credit Card", "Debit Card", "Wallet", "Cash On Delivery"].map(method => {
                            const isChecked = formPaymentRestrictions.includes(method);
                            return (
                              <label key={method} className="flex items-center gap-1.5 cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setFormPaymentRestrictions(prev => prev.filter(m => m !== method));
                                    } else {
                                      setFormPaymentRestrictions(prev => [...prev, method]);
                                    }
                                  }}
                                  className="accent-[#E23744] h-3.5 w-3.5"
                                />
                                {method}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VISUAL REAL TIME INTERACTIVE PREVIEW PANEL */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider flex items-center gap-1.5">
                    Live Dynamic Coupon Preview Card
                  </span>

                  <div className={`p-5 rounded-2xl border-2 border-dashed relative overflow-hidden transition-all text-left ${
                    themeMode === "dark" 
                      ? "bg-[#251012] border-red-900/50" 
                      : "bg-[#fff8f8] border-red-100"
                  }`}>
                    <div className="absolute right-4 top-4 bg-[#E23744]/25 text-[#E23744] p-1 px-3 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#E23744]/20 font-mono">
                      {formCode || "SUMMER50"}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-2 text-[9px] bg-[#E23744] text-white rounded font-bold font-mono">🎉 TICKET POOL</span>
                        <span className="text-[10px] text-zinc-400 font-bold">{previewSummary.targetedStatus} Only</span>
                      </div>
                      
                      <strong className="text-lg font-black text-gray-900 dark:text-white block tracking-tight">
                        {formTitle || "Get Instant benefit discounts across our catalog"}
                      </strong>

                      <p className="text-xs text-stone-500 leading-normal max-w-lg">
                        {formDescription || "Voucher is applicable on items. Min spend rules must be validated during checkout sequence."}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-dashed border-[#E23744]/20 text-[11px] text-stone-400">
                        <span>Disbursal: <b className="text-red-600 dark:text-rose-400 font-mono">{previewSummary.formattedDiscount}</b></span>
                        <span>Min Orders: <b className="text-stone-800 dark:text-white font-mono">₹{formMinOrder}</b></span>
                        {formType === "percentage" && (
                          <span>Max Caps: <b className="text-stone-800 dark:text-white font-mono">₹{formMaxDiscount}</b></span>
                        )}
                        <span>Expires: <b className="text-stone-800 dark:text-white font-mono">{previewSummary.formattedExpiry}</b></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submitting Actions footer */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center flex-wrap gap-4">
                  <div className="text-stone-400 text-[11px]">
                    ※ Changes are pushed into food delivery checkouts immediately upon activation.
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowCreateModal(false)}
                      className="p-2.5 px-4 rounded-xl text-stone-500 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-gray-800 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    
                    <button 
                      type="submit"
                      onClick={(e) => handleCreateOrSaveCoupon(e, "draft")}
                      className={`p-2.5 px-4 border rounded-xl text-xs font-black cursor-pointer bg-transparent hover:bg-stone-50 dark:hover:bg-gray-800 ${
                        themeMode === "dark" ? "border-gray-700 text-white" : "border-zinc-200 text-stone-800"
                      }`}
                    >
                      Save Draft
                    </button>

                    <button 
                      type="submit"
                      className="p-2.5 px-6 bg-[#E23744] hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer"
                    >
                      {isEditing ? "Apply Changes" : "Publish & Activate"}
                    </button>
                  </div>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}

      {/* CORE REDEMPTIONS DETAILS AND ANALYTICS DRAWER VIEW */}
      {selectedDetailCoupon && selectedDetailMeta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-[100] text-left">
          <div className={`w-full max-w-md h-full flex flex-col justify-between overflow-y-auto animate-slide-in shadow-2xl relative ${
            themeMode === "dark" ? "bg-[#18181C] text-white" : "bg-white text-stone-800"
          }`}>
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <div>
                <span className="p-1 px-2.5 text-[9px] bg-[#E23744]/10 text-[#E23744] rounded-full font-mono font-black uppercase text-left inline-block">
                  {selectedDetailCoupon.code}
                </span>
                <h2 className="text-base font-black text-gray-900 dark:text-white mt-1">Redemptions Analytics</h2>
              </div>
              
              <button 
                onClick={() => setSelectedDetailCoupon(null)}
                className="p-1 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-gray-900 rounded-lg text-xs font-black cursor-pointer"
              >
                Close View
              </button>
            </div>

            {/* Content segment */}
            <div className="p-6 space-y-6 text-xs text-stone-500 leading-normal max-h-[80vh] overflow-y-auto font-semibold">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black text-stone-400 block">Voucher Headline Heading:</span>
                <strong className="text-sm font-black text-gray-900 dark:text-white block">{selectedDetailCoupon.title}</strong>
                <p className="text-xs text-stone-500 mt-1">{selectedDetailMeta.description}</p>
              </div>

              {/* STATS PERFORMANCE GRID OF THE COUPONS */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-dashed border-gray-200/50">
                <div className="p-3 bg-stone-50/50 dark:bg-gray-900/50 rounded-xl space-y-1 text-left border dark:border-gray-900">
                  <span className="text-[10px] text-stone-400 block uppercase">Conversion rate</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">{selectedDetailMeta.conversionRate}%</span>
                  <span className="text-[9px] text-[#E23744] font-bold block">▲ High response metrics</span>
                </div>

                <div className="p-3 bg-stone-50/50 dark:bg-gray-900/50 rounded-xl space-y-1 text-left border dark:border-gray-900">
                  <span className="text-[10px] text-stone-400 block uppercase">Spurred volume</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 block">₹{selectedDetailMeta.revenueGenerated.toLocaleString("en-IN")}</span>
                  <span className="text-[9px] text-stone-400 block">Revenue index total</span>
                </div>
              </div>

              {/* REDEMPTION TIMELINE LOGS */}
              <div className="space-y-3 pt-4 border-t border-dashed border-gray-200/50">
                <span className="text-[10px] uppercase font-black text-stone-400 block">Voucher metadata fields:</span>
                
                <div className="space-y-2">
                  <div className="flex justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-gray-900">
                    <span>Applicability category:</span>
                    <strong className="text-stone-900 dark:text-white capitalize">{selectedDetailMeta.applicableOn}</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-gray-900">
                    <span>Valid hours:</span>
                    <strong className="text-stone-900 dark:text-white">{selectedDetailMeta.startTime} to {selectedDetailMeta.endTime} hrs</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-gray-900">
                    <span>Total Redemptions Limit:</span>
                    <strong className="text-stone-900 dark:text-white font-mono">{selectedDetailMeta.totalUsageLimit} times max</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-gray-900">
                    <span>User Limit quota:</span>
                    <strong className="text-stone-900 dark:text-white font-mono">{selectedDetailMeta.maxUsagePerUser} per user</strong>
                  </div>
                </div>
              </div>

              {/* REDEEMERS SATELLITE HISTORY PREVIEW LOGS */}
              <div className="space-y-2 pt-4 border-t border-dashed border-gray-200/50">
                <span className="text-[10px] uppercase font-black text-stone-400 block">Redemptions history log tracker:</span>
                
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg border border-dashed text-xs text-left">
                    <div className="flex justify-between text-[11px] font-bold text-gray-900 dark:text-white">
                      <span>Anish Patel (User #71a)</span>
                      <span className="text-[#E23744] font-mono font-black">-₹{selectedDetailCoupon.value} off</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Order ID: #ORD_8911 • Bengal Spice Kitchen • 3 mins ago</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-dashed text-xs text-left">
                    <div className="flex justify-between text-[11px] font-bold text-gray-900 dark:text-white">
                      <span>Priya Sen (Premium User)</span>
                      <span className="text-[#E23744] font-mono font-black">-₹{selectedDetailCoupon.maxDiscount} max</span>
                    </div>
                    <span className="text-[10px] text-stone-400">Order ID: #ORD_7182 • Royal Biryani Suite • 2 hrs ago</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60">
              <button 
                onClick={() => {
                  setSelectedDetailCoupon(null);
                  triggerToast("Report Generated", `Voucher performance metrics audit logs downloaded successfully.`, "success");
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-gray-800 hover:dark:bg-gray-800 font-bold text-center rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Performance Audit Report (PDF/CSV)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP DIAL SYSTEM */}
      {confirmModalConfig?.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-[110] p-4 text-left">
          <div className={`p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl ${
            themeMode === "dark" ? "bg-[#1E1E24] text-white border border-gray-900" : "bg-white text-stone-800"
          }`}>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-rose-500/10 rounded-full text-red-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
              </span>
              <h3 className="font-black text-gray-900 dark:text-white text-sm">{confirmModalConfig.title}</h3>
            </div>
            
            <p className="text-xs text-stone-500 dark:text-gray-400 leading-normal font-semibold">
              {confirmModalConfig.message}
            </p>

            <div className="flex gap-2 justify-end pt-2 text-xs">
              <button 
                onClick={() => setConfirmModalConfig(null)}
                className="p-2 px-4 rounded-lg bg-stone-100 hover:bg-stone-300 dark:bg-gray-80 w-auto hover:opacity-90 font-bold cursor-pointer"
              >
                Cancel
              </button>
              
              <button 
                onClick={executeConfirmedAction}
                className="p-2 px-5 bg-[#E23744] hover:bg-rose-700 text-white rounded-lg font-black cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
