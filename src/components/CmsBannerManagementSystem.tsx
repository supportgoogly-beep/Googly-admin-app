import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, Calendar, Eye, Activity, Image as ImageIcon, Sliders, 
  Trash2, Copy, Play, Pause, ChevronRight, CheckCircle, 
  Search, Smartphone, Tablet, Monitor, Info, Sparkles, 
  FileText, ExternalLink, Download, Layers, Users, MapPin, 
  Compass, ArrowUpRight, TrendingUp, X, Upload, Check, 
  RotateCw, RefreshCw, Scissors, MoreVertical, AlertCircle
} from "lucide-react";
import { uploadFile } from "../lib/storage";
import { useRef } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, Legend, Cell, LineChart, Line
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { CMSBanner, Restaurant } from "../types";

// Extended interactive banner type supporting deep SaaS traits
interface EnhancedBanner extends CMSBanner {
  subtitle?: string;
  promoCode?: string;
  discountLabel?: string;
  placementLocations: string[]; // Customer Home, Rider App, Category, Website, etc.
  redirectType: "Specific Restaurant" | "Specific Category" | "Offer Page" | "Coupon Page" | "External URL" | "No Redirect";
  redirectValue?: string; // e.g. Restaurant ID or Name
  status: "Published" | "Scheduled" | "Draft" | "Expired" | "Paused";
  endDate?: string;
  audienceType: string; // All Users, New Users, Premium, Custom
  targetLocations: string[]; // All Cities, Specific Zones
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // Click-through rate %
}

interface CmsBannerManagementSystemProps {
  banners: CMSBanner[];
  setBanners: React.Dispatch<React.SetStateAction<CMSBanner[]>>;
  restaurants?: Restaurant[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function CmsBannerManagementSystem({
  banners,
  setBanners,
  restaurants = [],
  triggerToast
}: CmsBannerManagementSystemProps) {

  // -------------------------------------------------------------------------
  // Core Alignment of Local Enhanced State
  // -------------------------------------------------------------------------
  const [enhancedBanners, setEnhancedBanners] = useState<EnhancedBanner[]>([]);

  // Synchronize local enriched model on component mount or prop update elements
  useEffect(() => {
    const initialEnriched = banners.map((b, index) => {
      const seedVal = parseInt(b.id.replace(/\D/g, "") || "3") + index;

      // Click analytics mock triggers
      const impressionsValue = 5000 + (seedVal * 1357) % 8000;
      const clicksValue = 250 + (seedVal * 411) % 600;
      const conversionsValue = Math.round(clicksValue * (0.15 + (seedVal % 10) / 100));
      const calculatedCtr = parseFloat(((clicksValue / impressionsValue) * 100).toFixed(2));

      // Resolve redirect values optionally if restaurant ID is linked
      let rType: EnhancedBanner["redirectType"] = "Specific Restaurant";
      let rVal = b.linkToRestaurantId;
      if (!b.linkToRestaurantId) {
        rType = "Offer Page";
        rVal = "OFFER-WEEKEND";
      } else {
        const resolvedRest = restaurants.find(r => r.id === b.linkToRestaurantId);
        if (resolvedRest) {
          rVal = resolvedRest.name;
        }
      }

      // Determine starting statuses
      let bannerStatus: EnhancedBanner["status"] = b.active ? "Published" : "Draft";
      if (b.publishDate && new Date(b.publishDate) > new Date()) {
        bannerStatus = "Scheduled";
      }

      const locationPlacements = [
        "Customer App Home Screen",
        index % 2 === 0 ? "Restaurant Detail Page" : "Website Homepage"
      ];

      return {
        ...b,
        subtitle: index % 2 === 0 ? "Delicious treats at up to 40% OFF" : "Quick delivery right to your step",
        promoCode: seedVal % 2 === 0 ? `GOOGLY${seedVal * 10}` : undefined,
        discountLabel: seedVal % 2 === 0 ? "40% OFF" : "Free Delivery",
        placementLocations: locationPlacements,
        redirectType: rType,
        redirectValue: rVal,
        status: bannerStatus,
        endDate: "2026-07-31",
        audienceType: seedVal % 3 === 0 ? "New Users" : "All Users",
        targetLocations: ["All Cities"],
        impressions: impressionsValue,
        clicks: clicksValue,
        conversions: conversionsValue,
        ctr: calculatedCtr
      };
    });

    setEnhancedBanners(initialEnriched);
  }, [banners, restaurants]);

  // -------------------------------------------------------------------------
  // Filters and Interactive State Elements
  // -------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<"Gallery" | "Performance" | "GridTable">("Gallery");
  const [selectedRange, setSelectedRange] = useState<"Today" | "Last 7 Days" | "Last 30 Days" | "Custom">("Last 30 Days");
  
  // Advanced Filter Configurations
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // "All", "Published", "Scheduled", "Draft", "Expired", "Paused"
  const [placementFilter, setPlacementFilter] = useState("All"); // Matches place options

  // Modal display states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [activePreviewBanner, setActivePreviewBanner] = useState<EnhancedBanner | null>(null);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<"mobile" | "tablet" | "desktop">("mobile");

  // -------------------------------------------------------------------------
  // Creation Wizard Form Values State (Multi-step upload workflow)
  // -------------------------------------------------------------------------
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1); // 1: Image & Crop, 2: Details & Config, 3: Confirmation Preview
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [formBannerTitle, setFormBannerTitle] = useState("");
  const [formBannerSubtitle, setFormBannerSubtitle] = useState("");
  const [formPromoCode, setFormPromoCode] = useState("");
  const [formDiscountLabel, setFormDiscountLabel] = useState("");
  const [formPlacements, setFormPlacements] = useState<string[]>(["Customer App Home Screen"]);
  const [formRedirectType, setFormRedirectType] = useState<EnhancedBanner["redirectType"]>("Specific Restaurant");
  const [formRedirectValue, setFormRedirectValue] = useState("");
  const [formAudienceTarget, setFormAudienceTarget] = useState("All Users");
  const [formPublishImmediate, setFormPublishImmediate] = useState(true);
  const [formStartDate, setFormStartDate] = useState("2026-06-12");
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndDate, setFormEndDate] = useState("2026-07-12");
  const [formEndTime, setFormEndTime] = useState("22:00");
  const [formTimezone, setFormTimezone] = useState("GMT+05:30 (Kolkata Standard Time)");

  // Live cropping rotation/zoom settings details
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropFlippedH, setCropFlippedH] = useState(false);
  const [cropFlippedV, setCropFlippedV] = useState(false);

  // Search filter for restaurants dropdown in redirect
  const [restSearchQuery, setRestSearchQuery] = useState("");

  const filteredRestaurants = useMemo(() => {
    if (!restSearchQuery) return restaurants;
    return restaurants.filter(r => 
      r.name.toLowerCase().includes(restSearchQuery.toLowerCase()) || 
      r.id.toLowerCase().includes(restSearchQuery.toLowerCase())
    );
  }, [restaurants, restSearchQuery]);

  // -------------------------------------------------------------------------
  // Filtering Logic
  // -------------------------------------------------------------------------
  const filteredBanners = useMemo(() => {
    return enhancedBanners.filter(b => {
      // 1. Keyword search match
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const scoreMatch = b.title.toLowerCase().includes(query) || 
                           (b.subtitle || "").toLowerCase().includes(query) ||
                           b.id.toLowerCase().includes(query);
        if (!scoreMatch) return false;
      }

      // 2. Status Match
      if (statusFilter !== "All" && b.status !== statusFilter) return false;

      // 3. Placement Placements Filter Match
      if (placementFilter !== "All") {
        const hasPlacement = b.placementLocations.some(p => p.includes(placementFilter));
        if (!hasPlacement) return false;
      }

      return true;
    });
  }, [enhancedBanners, searchQuery, statusFilter, placementFilter]);

  // -------------------------------------------------------------------------
  // Analytical Overview Aggregators
  // -------------------------------------------------------------------------
  const overviewMetrics = useMemo(() => {
    const total = enhancedBanners.length;
    const active = enhancedBanners.filter(b => b.status === "Published").length;
    const scheduled = enhancedBanners.filter(b => b.status === "Scheduled").length;
    const draft = enhancedBanners.filter(b => b.status === "Draft").length;
    const paused = enhancedBanners.filter(b => b.status === "Paused").length;
    const expired = enhancedBanners.filter(b => b.status === "Expired").length;

    const clicksTotal = enhancedBanners.reduce((sum, b) => sum + b.clicks, 0);
    const impressionsTotal = enhancedBanners.reduce((sum, b) => sum + b.impressions, 0);
    const avgConversionRate = total > 0 
      ? parseFloat((enhancedBanners.reduce((sum, b) => sum + (b.conversions / (b.clicks || 1)) * 100, 0) / total).toFixed(2))
      : 0;

    return {
      total,
      active,
      scheduled,
      draft,
      paused,
      expired,
      clicksTotal,
      impressionsTotal,
      avgConversionRate
    };
  }, [enhancedBanners]);

  // -------------------------------------------------------------------------
  // Event & Workflow Handlers
  // -------------------------------------------------------------------------
  const handleTogglePause = (bannerId: string) => {
    setEnhancedBanners(prev => prev.map(b => {
      if (b.id === bannerId) {
        const nextStatus = b.status === "Published" ? "Paused" : "Published";
        triggerToast(
          nextStatus === "Paused" ? "Campaign Paused" : "Campaign Resumed",
          `Status shifted successfully to ${nextStatus}. Display metrics updated.`,
          "info"
        );
        return { 
          ...b, 
          status: nextStatus,
          active: nextStatus === "Published"
        };
      }
      return b;
    }));

    // Update parent global applet layer state
    setBanners(prev => prev.map(b => {
      if (b.id === bannerId) {
        return { ...b, active: !b.active };
      }
      return b;
    }));
  };

  const handleDeleteBanner = (bannerId: string) => {
    setEnhancedBanners(prev => prev.filter(b => b.id !== bannerId));
    setBanners(prev => prev.filter(b => b.id !== bannerId));
    triggerToast("Campaign Expunged", "Promotional media asset has been removed from cloud distribution channels.", "error");
  };

  const handleDuplicateBanner = (ban: EnhancedBanner) => {
    const duplicated: EnhancedBanner = {
      ...ban,
      id: `ban-${Math.round(100 + Math.random() * 899)}`,
      title: `${ban.title} (Copy)`,
      status: "Draft",
      active: false,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0
    };

    setEnhancedBanners(prev => [duplicated, ...prev]);
    setBanners(prev => [
      {
        id: duplicated.id,
        title: duplicated.title,
        imageUrl: duplicated.imageUrl,
        linkToRestaurantId: duplicated.linkToRestaurantId,
        active: false,
        publishDate: duplicated.publishDate
      },
      ...prev
    ]);

    triggerToast("Campaign Cloned", `Created replica draft: "${duplicated.title}"`, "success");
  };

  const handleSelectMockImage = (src: string) => {
    setUploadedImageSrc(src);
    triggerToast("Image Authenticated", "Stock asset selected successfully.", "success");
    setWizardStep(1); 
  };

  const bannerFileRef = useRef<HTMLInputElement>(null);

  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerToast("Uploading Banner...", "Synchronizing with Googly S3 High-Availability Bucket", "info");
      const result = await uploadFile(file);
      if (result.success && result.url) {
        setUploadedImageSrc(result.url);
        triggerToast("Banner Secured", "Visual asset synchronized successfully.", "success");
        setWizardStep(1);
      } else {
        triggerToast("Storage Failed", result.error || "Could not bridge to CDN network", "error");
      }
    }
  };

  const handleCreateNewBannerSubmit = () => {
    if (!formBannerTitle.trim()) {
      triggerToast("Title Required", "Please assign a clear title descriptor.", "error");
      return;
    }

    const matchingRest = restaurants.find(r => r.name === formRedirectValue);
    const resolvedRestId = matchingRest ? matchingRest.id : "";

    const finalNewBanner: EnhancedBanner = {
      id: `ban-${Math.round(200 + Math.random() * 799)}`,
      title: formBannerTitle,
      subtitle: formBannerSubtitle || "Exclusive promotion",
      imageUrl: uploadedImageSrc || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop",
      linkToRestaurantId: resolvedRestId,
      active: formPublishImmediate,
      publishDate: formStartDate,
      promoCode: formPromoCode || undefined,
      discountLabel: formDiscountLabel || undefined,
      placementLocations: formPlacements,
      redirectType: formRedirectType,
      redirectValue: formRedirectValue || "Corporate Link",
      status: formPublishImmediate ? "Published" : "Scheduled",
      endDate: formEndDate,
      audienceType: formAudienceTarget,
      targetLocations: ["All Cities"],
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0
    };

    setEnhancedBanners(prev => [finalNewBanner, ...prev]);
    setBanners(prev => [
      {
        id: finalNewBanner.id,
        title: finalNewBanner.title,
        imageUrl: finalNewBanner.imageUrl,
        linkToRestaurantId: finalNewBanner.linkToRestaurantId,
        active: finalNewBanner.active,
        publishDate: finalNewBanner.publishDate
      },
      ...prev
    ]);

    // Cleanup form states
    setFormBannerTitle("");
    setFormBannerSubtitle("");
    setFormPromoCode("");
    setFormDiscountLabel("");
    setUploadedImageSrc(null);
    setShowUploadModal(false);
    setWizardStep(1);

    triggerToast("Promotion Launched!", `"${finalNewBanner.title}" configured and dispatched live.`, "success");
  };

  // Preset demo stock images that the owner can choice in lieu of manual upload
  const demoBannerPresents = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=800&auto=format&fit=crop"
  ];

  // Performance simulation metrics
  const performanceTrendData = [
    { label: "06/06", views: 24000, clicks: 1200, conversions: 240 },
    { label: "06/07", views: 28500, clicks: 1540, conversions: 310 },
    { label: "06/08", views: 27000, clicks: 1420, conversions: 280 },
    { label: "06/09", views: 32000, clicks: 2100, conversions: 490 },
    { label: "06/10", views: 34500, clicks: 2350, conversions: 512 },
    { label: "06/11", views: 39100, clicks: 2890, conversions: 618 },
    { label: "06/12", views: 42000, clicks: 3100, conversions: 720 }
  ];

  const placementChartData = [
    { name: "Customer App Home", clicks: 4200, revenue: 12800 },
    { name: "Restaurant Detailed List", clicks: 2100, revenue: 6400 },
    { name: "Rider Dashboard Screen", clicks: 450, revenue: 900 },
    { name: "Corporate Web Main", clicks: 1800, revenue: 4700 }
  ];

  // -------------------------------------------------------------------------
  // Render Output
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6" id="cms-banner-management-workspace">
      
      {/* -------------------- HEADER BLOCK -------------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-stone-100 shadow-sm gap-4">
        <div>
          <span className="text-[10px] bg-red-50 text-[#E23744] font-black px-2.5 py-1 rounded-full uppercase tracking-widest block mb-1">PROMOTIONAL CMS</span>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-1.5">
             CMS & Banner Management
          </h1>
          <p className="text-xs text-stone-500 max-w-xl">
             Schedule hero sliders, configure target geo-audience rules, align dining redirect destinations, and execute live campaign split evaluations.
          </p>
        </div>

        {/* Global Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            id="gfs-banner-wizard-trigger"
            onClick={() => {
              setUploadedImageSrc(null);
              setWizardStep(1);
              setShowUploadModal(true);
            }}
            className="p-2 px-3.5 bg-[#E23744] hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Upload Banner
          </button>

          <button
            onClick={() => {
              triggerToast("App-Home Live Preview Active", "Loaded Customer Home template simulating Kolkata metropolitan grid layout.", "info");
              if (enhancedBanners.length > 0) {
                setActivePreviewBanner(enhancedBanners[0]);
                setShowPreviewDrawer(true);
              }
            }}
            className="p-2 px-3 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border border-stone-800"
          >
            <Eye className="w-4 h-4 text-emerald-400" /> Preview App Home
          </button>

          <button
            onClick={() => {
              triggerToast("Analytical Ledger Pulled", "Full campaign metrics exported to CSV safely.", "success");
            }}
            className="p-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>

        </div>
      </div>

      {/* -------------------- OVERVIEW ANALYTICAL SUMMARY -------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4" id="cms-dashboard-overview-cards">
        
        {/* Total Active Card */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Active Sliders</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-stone-900 font-mono">{overviewMetrics.active}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Live Now</span>
          </div>
        </div>

        {/* Scheduled Banners */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Scheduled</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-stone-900 font-mono">{overviewMetrics.scheduled}</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-1.5 py-0.5 rounded">Queue</span>
          </div>
        </div>

        {/* Drafts */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Draft Banners</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-stone-900 font-mono">{overviewMetrics.draft}</span>
            <span className="text-[10px] bg-amber-50 text-amber-900 font-bold px-1.5 py-0.5 rounded">Paused</span>
          </div>
        </div>

        {/* Expired count */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Expired Archives</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-stone-900 font-mono">{overviewMetrics.expired}</span>
            <span className="text-[10px] bg-stone-100 text-stone-500 font-bold px-1.5 py-0.5 rounded">Inactive</span>
          </div>
        </div>

        {/* Metrics summary: clicks */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Total Click Counts</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-stone-900 font-mono">{(overviewMetrics.clicksTotal / 1000).toFixed(1)}k</span>
            <div className="flex items-center gap-0.5 text-[9px] text-emerald-600 font-bold">
              <TrendingUp className="w-3 h-3" /> +12%
            </div>
          </div>
        </div>

        {/* Conversion rate */}
        <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs space-y-1">
          <span className="text-[9px] text-stone-400 font-extrabold uppercase tracking-wider block">Avg Conversion Ratio</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-stone-900 font-mono">{overviewMetrics.avgConversionRate}%</span>
            <span className="text-[10px] text-zinc-400">Clicks to item</span>
          </div>
        </div>

      </div>

      {/* -------------------- SUB NAVIGATION BAR -------------------- */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1 border border-stone-200 text-xs font-black">
        <button
          onClick={() => setActiveTab("Gallery")}
          className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeTab === "Gallery" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"}`}
        >
          🖼️ Promotional Banner Gallery Layout ({filteredBanners.length})
        </button>
        <button
          onClick={() => setActiveTab("Performance")}
          className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeTab === "Performance" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"}`}
        >
          📊 Campaign Performance Intelligence
        </button>
        <button
          onClick={() => setActiveTab("GridTable")}
          className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeTab === "GridTable" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"}`}
        >
          🗂️ Managed Data Spreadsheets
        </button>
      </div>

      {/* ----------------- SUBTAB 1: GALLERY GRID LAYOUT ----------------- */}
      {activeTab === "Gallery" && (
        <div className="space-y-6 animate-fade-in" id="cms-banner-gallery-panel">
          
          {/* Grid Inner Filter tools */}
          <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#E23744]" />
              <span className="text-xs font-black uppercase text-stone-900">Quick Filters</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              
              {/* Keyword Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Review promo, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#E23744] text-xs font-medium w-48"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
              </div>

              {/* Status Selector */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl py-1.5 px-3 font-semibold focus:outline-none"
              >
                <option value="All">All Campaign States</option>
                <option value="Published">Published Live</option>
                <option value="Scheduled">Scheduled Later</option>
                <option value="Draft">Draft Incomplete</option>
                <option value="Paused">Paused / Halted</option>
              </select>

              {/* Placement Selector */}
              <select
                value={placementFilter}
                onChange={(e) => setPlacementFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-xl py-1.5 px-3 font-semibold focus:outline-none"
              >
                <option value="All">All Placements</option>
                <option value="Customer App Home">App Home Screen</option>
                <option value="Rider App">Rider Dashboard</option>
                <option value="Website Homepage">Web Main</option>
              </select>

            </div>
          </div>

          {filteredBanners.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-stone-100 shadow-xs space-y-3">
              <div className="inline-flex p-3 bg-stone-50 rounded-full text-stone-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-stone-900">No promo campaigns found</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No custom records matched the search or active filters. Clear text inputs to restore the full marketing slider timeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBanners.map((ban) => {
                const isSelected = activePreviewBanner?.id === ban.id;

                return (
                  <div 
                    key={ban.id} 
                    id={`banner-card-${ban.id}`}
                    className={`bg-white rounded-2xl border overflow-hidden shadow-xs relative flex flex-col justify-between transition-all duration-200 group ${
                      isSelected ? "border-[#E23744] ring-1 ring-[#E23744]/20" : "border-stone-200 hover:shadow-md"
                    }`}
                  >
                    
                    {/* Media placement */}
                    <div className="relative h-44 bg-stone-900 overflow-hidden">
                      <img 
                        referrerPolicy="no-referrer"
                        src={ban.imageUrl} 
                        alt={ban.title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop";
                        }}
                      />
                      
                      {/* Placement chips row & status badge overlay */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase text-white shadow-sm leading-relaxed ${
                          ban.status === "Published" ? "bg-emerald-600" :
                          ban.status === "Scheduled" ? "bg-indigo-600" :
                          ban.status === "Paused" ? "bg-amber-600" : "bg-stone-500"
                        }`}>
                          {ban.status}
                        </span>

                        {ban.discountLabel && (
                          <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-md shadow-sm">
                            🏷️ {ban.discountLabel}
                          </span>
                        )}
                      </div>

                      {/* Code overlay details */}
                      {ban.promoCode && (
                        <div className="absolute bottom-3 right-3 bg-stone-900/95 backdrop-blur-xs text-stone-100 p-1 px-2.5 rounded-lg text-[10px] font-bold font-mono border border-stone-800">
                          CODE: {ban.promoCode}
                        </div>
                      )}
                    </div>

                    {/* Meta section details */}
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="font-extrabold text-stone-900 text-sm leading-tight leading-snug">
                            {ban.title}
                          </h3>
                          <span className="text-[9px] text-zinc-400 font-mono tracking-tighter">#{ban.id}</span>
                        </div>
                        {ban.subtitle && (
                          <p className="text-xs text-stone-500">
                            {ban.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Display Location settings links */}
                      <div className="bg-stone-50 rounded-xl p-3 space-y-2 border border-stone-100 text-xs text-stone-700 font-semibold shadow-inner">
                        <div className="flex justify-between">
                          <span className="text-stone-400 text-[10px] font-extrabold block">PLACEMENT RANGE</span>
                          <span className="text-stone-600 block text-right max-w-[150px] truncate">
                            {ban.placementLocations.join(", ")}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-stone-200/60 pt-1.5">
                          <span className="text-stone-400 text-[10px] font-extrabold block">REDIRECTION FLOW</span>
                          <span className="text-[#E23744] font-bold block truncate max-w-[150px]">
                            {ban.redirectType === "Specific Restaurant" ? `🍔 ${ban.redirectValue}` : `🔗 ${ban.redirectType}`}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-stone-200/60 pt-1.5">
                          <span className="text-stone-400 text-[10px] font-extrabold block">AUDIENCE TARGET</span>
                          <span className="text-stone-600 block">{ban.audienceType}</span>
                        </div>
                      </div>

                      {/* Micro Impressions analytics stats rows */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-t border-stone-100 pt-3">
                        <div>
                          <span className="text-stone-400 font-extrabold uppercase text-[8.5px] block">Views</span>
                          <span className="font-extrabold text-[#E23744] font-mono">{(ban.impressions / 1000).toFixed(1)}k</span>
                        </div>
                        <div>
                          <span className="text-stone-400 font-extrabold uppercase text-[8.5px] block">Clicks</span>
                          <span className="font-bold text-stone-900 font-mono">{ban.clicks}</span>
                        </div>
                        <div>
                          <span className="text-stone-400 font-extrabold uppercase text-[8.5px] block">Conversions</span>
                          <span className="font-bold text-emerald-600 font-mono">{ban.conversions}</span>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Action bar */}
                    <div className="bg-stone-50 px-5 py-3.5 border-t border-stone-100 flex items-center justify-between gap-2.5">
                      
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setActivePreviewBanner(ban);
                            setShowPreviewDrawer(true);
                            triggerToast("Device Mock Opened", `Inspecting real-time render calculations for "${ban.title}"`, "info");
                          }}
                          className="p-1.5 bg-white hover:bg-stone-100 text-stone-600 rounded-lg border border-stone-200 cursor-pointer"
                          title="Preview device viewport aspect"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleDuplicateBanner(ban)}
                          className="p-1.5 bg-white hover:bg-stone-100 text-stone-600 rounded-lg border border-stone-200 cursor-pointer"
                          title="Clone marketing draft"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteBanner(ban.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 cursor-pointer"
                          title="Purge promo banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Toggle status trigger widget button */}
                      <button
                        onClick={() => handleTogglePause(ban.id)}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                          ban.status === "Published" 
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300"
                        }`}
                      >
                        {ban.status === "Published" ? (
                          <><Pause className="w-3 h-3 fill-amber-700" /> Pause</>
                        ) : (
                          <><Play className="w-3 h-3 fill-emerald-800" /> Publish</>
                        )}
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ----------------- SUBTAB 2: ANALYTICAL INTELLIGENCE ----------------- */}
      {activeTab === "Performance" && (
        <div className="space-y-6 animate-fade-in" id="cms-campaign-performance-charts">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Main timeline trend line chart (8 columns) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight">Timeline engagement logs</h3>
                  <p className="text-[11px] text-stone-400 font-semibold">Live views overlaying total dining conversion metrics</p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Clicks</span>
                  <span className="flex items-center gap-1 pl-2"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Conv.</span>
                </div>
              </div>

              {/* Chart container */}
              <div className="h-72 w-full text-xs" id="cms-main-clicks-area-chart" style={{ minHeight: "288px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={288} minWidth={0}>
                  <AreaChart data={performanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="clicksGrad" cx="0" cy="0" r="1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="convGrad" cx="0" cy="0" r="1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9" }} />
                    <Area type="monotone" dataKey="clicks" name="Total Click events" stroke="#ef4444" fillOpacity={1} fill="url(#clicksGrad)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="conversions" name="Completed Convs" stroke="#10b981" fillOpacity={1} fill="url(#convGrad)" strokeWidth={2} />
                  </AreaChart>
                </SafeResponsiveContainer>
              </div>
            </div>

            {/* Placement Distribution Revenue values (4 columns) */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight">Channel allocation splits</h3>
                <p className="text-[11px] text-stone-400 font-semibold">Total click distributions of user segments mapped to location</p>
              </div>

              <div className="h-44 w-full text-xs" style={{ minHeight: "176px", minWidth: 0 }}>
                <SafeResponsiveContainer minHeight={176} minWidth={0}>
                  <BarChart data={placementChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" tickFormatter={(v) => v.split(" ").slice(0, 2).join(" ")} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#ffffff", borderRadius: "12px" }} />
                    <Bar dataKey="clicks" name="Target Clicks" fill="#1e293b" radius={[4, 4, 0, 0]}>
                      {placementChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#E23744" : "#1e293b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </SafeResponsiveContainer>
              </div>

              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-100 text-xs text-stone-700 font-semibold space-y-1.5">
                <span className="text-[9px] text-[#E23744] font-black uppercase tracking-wider block">Campaign Optimizer Recommendation</span>
                <p className="text-[10.5px] text-stone-500 font-medium leading-relaxed">
                   The "Customer App Home" placement is currently driving <strong>84% more micro-conversions</strong>. We advise redirecting additional target budget towards high-spending user segments this weekend.
                </p>
              </div>
            </div>

          </div>

          {/* Interactive Heatmap Segment Display */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-1.5">
                🔥 Hotzone Heatmaps Simulator 
              </h3>
              <p className="text-xs text-stone-500">
                Visualizing device viewport layout tracking grid indices to verify banner density efficiency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Home Carousel */}
              <div className="bg-stone-50 rounded-xl p-4.5 border border-stone-200 text-center space-y-3 shadow-inner">
                <span className="text-[10px] bg-red-50 text-[#E23744] font-black px-2 py-0.5 rounded font-mono uppercase">Zone Carousel Slider (Home)</span>
                <div className="relative h-28 bg-stone-900 rounded-lg flex items-center justify-center overflow-hidden border">
                  
                  {/* Heat gradient visualization circles */}
                  <div className="absolute w-20 h-20 bg-rose-500/35 rounded-full blur-xl animate-pulse"></div>
                  <div className="absolute left-1/3 w-12 h-12 bg-amber-400/40 rounded-full blur-lg animate-pulse"></div>

                  <span className="text-xs font-bold text-white relative z-10 font-mono">
                    94.2% Focus Heat Index
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Scroll position: Top Hero</span>
                  <span>Exit Bounce: 4.8%</span>
                </div>
              </div>

              {/* Category Page */}
              <div className="bg-stone-50 rounded-xl p-4.5 border border-stone-200 text-center space-y-3 shadow-inner">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-black px-2 py-0.5 rounded font-mono uppercase">Category Top Banners</span>
                <div className="relative h-28 bg-stone-900 rounded-lg flex items-center justify-center overflow-hidden border">
                  
                  {/* Heat gradient visualization circles */}
                  <div className="absolute right-10 w-16 h-16 bg-blue-500/30 rounded-full blur-lg"></div>

                  <span className="text-xs font-bold text-white relative z-10 font-mono">
                    51.5% Focus Heat Index
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Scroll position: Mid scroll</span>
                  <span>Exit Bounce: 19.3%</span>
                </div>
              </div>

              {/* Restaurant details */}
              <div className="bg-stone-50 rounded-xl p-4.5 border border-stone-200 text-center space-y-3 shadow-inner">
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-black px-2 py-0.5 rounded font-mono uppercase">Merchant Details Outlet slider</span>
                <div className="relative h-28 bg-stone-900 rounded-lg flex items-center justify-center overflow-hidden border">
                  
                  {/* Heat gradient visualization circles */}
                  <div className="absolute w-14 h-14 bg-emerald-500/25 rounded-full blur-md"></div>

                  <span className="text-xs font-bold text-white relative z-10 font-mono">
                     38.1% Focus Heat Index
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>Scroll position: Footer rail</span>
                  <span>Exit Bounce: 42.1%</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ---------------- SUBTAB 3: DATA MASTER SPREADSHEETS ---------------- */}
      {activeTab === "GridTable" && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs animate-fade-in" id="cms-banner-management-table-view">
          
          <div className="p-5 border-b border-stone-200 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-stone-900 uppercase">Banner management data ledger</h3>
              <p className="text-[11px] text-stone-400 font-semibold">Inline control configuration for dispatchers</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400">Matched count: <strong>{filteredBanners.length} records</strong></span>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 text-stone-400 text-[10px] font-black uppercase border-b border-stone-200">
                  <th className="p-4">Campaign ID</th>
                  <th className="p-4">Name & Title</th>
                  <th className="p-4">Target Channel</th>
                  <th className="p-4">Redirection Dest</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ctr (%)</th>
                  <th className="p-4">Start State</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                {filteredBanners.map((ban) => {
                  return (
                    <tr key={ban.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="p-4 font-mono text-[10px]">{ban.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img 
                            referrerPolicy="no-referrer"
                            src={ban.imageUrl} 
                            alt={ban.title} 
                            className="w-10 h-7 rounded object-cover border"
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=350&auto=format&fit=crop";
                            }}
                          />
                          <div>
                            <span className="font-extrabold text-stone-900 block">{ban.title}</span>
                            <span className="text-[10px] text-stone-400 block">{ban.subtitle}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-stone-600">
                        {ban.placementLocations[0]}
                      </td>
                      <td className="p-4 text-indigo-700">
                        {ban.redirectType === "Specific Restaurant" ? `🍔 ${ban.redirectValue}` : ban.redirectType}
                      </td>
                      <td className="p-4">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase leading-relaxed ${
                          ban.status === "Published" ? "bg-emerald-50 text-emerald-800" :
                          ban.status === "Scheduled" ? "bg-indigo-50 text-indigo-800" :
                          ban.status === "Paused" ? "bg-amber-50 text-amber-800" : "bg-stone-100 text-stone-500"
                        }`}>
                          {ban.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-center font-bold text-stone-900">{ban.ctr}%</td>
                      <td className="p-4 font-mono text-stone-400">{ban.publishDate || "2026-06-12"}</td>
                      <td className="p-4 font-mono text-stone-400">{ban.endDate || "2026-07-31"}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5Packed font-bold">
                          
                          <button
                            onClick={() => handleTogglePause(ban.id)}
                            className="p-1 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded cursor-pointer text-[10px]"
                          >
                            {ban.status === "Published" ? "Pause" : "Resume"}
                          </button>

                          <button
                            onClick={() => {
                              setActivePreviewBanner(ban);
                              setShowPreviewDrawer(true);
                            }}
                            className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteBanner(ban.id)}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

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

      {/* -------------------------------------------------------------------------
          CMS MODAL: UP-LOAD BANNER WIZARD FLOW
         ------------------------------------------------------------------------- */}
      {showUploadModal && (
        <div id="upload-banner-modal-glass" className="fixed inset-0 bg-stone-900/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto animate-zoom-in">
            
            {/* Modal header */}
            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50 rounded-t-2xl">
              <div>
                <span className="text-[9px] text-[#E23744] font-black uppercase block tracking-wider">Multi-step visual publisher</span>
                <h3 className="text-base font-black text-stone-900">Configuring Promotional Marketing Sliders</h3>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setWizardStep(1);
                  setUploadedImageSrc(null);
                }}
                className="text-stone-400 hover:text-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress bar indicators */}
            <div className="px-6 py-4.5 bg-stone-100/50 border-b border-stone-100 grid grid-cols-3 gap-2.5 text-xs text-center font-black">
              <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${wizardStep === 1 ? "bg-stone-900 text-white" : "text-stone-400 bg-stone-100"}`}>
                <span className="w-4.5 h-4.5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
                Image Crop & Assets
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${wizardStep === 2 ? "bg-stone-900 text-white" : "text-stone-400 bg-stone-100"}`}>
                <span className="w-4.5 h-4.5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
                Details & Targets
              </div>
              <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${wizardStep === 3 ? "bg-stone-900 text-white" : "text-stone-400 bg-stone-100"}`}>
                <span className="w-4.5 h-4.5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
                Publish Verification
              </div>
            </div>

            <div className="p-6 space-y-5">
              
              {/* ------------ STEP 1: IMAGE SELECTION & LIVE CROPPER ------------ */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  
                  {/* Drag drop mock zone */}
                  {!uploadedImageSrc ? (
                    <div id="cms-mock-drag-drop-zone" className="border-2 border-dashed border-stone-300 rounded-xl p-8 text-center hover:bg-stone-50/50 transition-colors space-y-3">
                      <div className="inline-flex p-3 bg-red-50 text-[#E23744] rounded-full">
                        <Upload className="w-6 h-6 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-stone-900 block">Drag & Drop marketing banner assets here</span>
                        <span className="text-[10px] text-zinc-400 block font-semibold">Multiple Format Support: WEBP, PNG, JPG accepted. Recommend 1200 x 480 px (5:2 ratio)</span>
                      </div>
                      
                      <div className="flex justify-center gap-2 pt-1">
                        <input 
                          type="file" 
                          className="hidden" 
                          ref={bannerFileRef} 
                          accept="image/*" 
                          onChange={handleRealFileUpload}
                        />
                        <button
                          onClick={() => bannerFileRef.current?.click()}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-[10px] font-bold rounded-lg cursor-pointer"
                        >
                          Browse local assets
                        </button>
                      </div>

                      {/* Stock Presents Selection list */}
                      <div className="space-y-1 pt-4">
                        <span className="text-[9px] text-stone-500 uppercase font-extrabold tracking-widest block">Alternatively, select stock dynamic demo food items</span>
                        <div className="flex justify-center gap-2.5 pt-1">
                          {demoBannerPresents.map((p, idx) => (
                            <img 
                              key={idx} 
                              referrerPolicy="no-referrer"
                              src={p} 
                              alt="Stock preview" 
                              onClick={() => handleSelectMockImage(p)}
                              className="w-14 h-10 rounded-lg object-cover cursor-pointer hover:border-[#E23744] border-2 border-stone-200 transition-all shadow-xs"
                            />
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in" id="cms-advanced-image-cropper">
                      
                      {/* Live Crop Stage Wrapper */}
                      <div className="text-xs font-black text-stone-400 mb-1 flex justify-between items-center">
                        <span>LIVE PREVIEW CROP EDITOR</span>
                        <button onClick={() => setUploadedImageSrc(null)} className="text-xs text-rose-600 hover:underline">Change image</button>
                      </div>

                      <div className="relative h-60 bg-stone-900 rounded-xl overflow-hidden border flex items-center justify-center">
                        
                        {/* Live transforming element simulating real-time canvas crop */}
                        <img 
                          referrerPolicy="no-referrer"
                          src={uploadedImageSrc} 
                          alt="Crop Target" 
                          style={{
                            transform: `scale(${cropZoom}) rotate(${cropRotation}deg) scaleX(${cropFlippedH ? -1 : 1}) scaleY(${cropFlippedV ? -1 : 1})`,
                            transition: "all 0.15s ease"
                          }}
                          className="max-h-full object-contain"
                        />
                        
                        {/* Crop crop grid helper lines overlay */}
                        <div className="absolute inset-8 border border-white/40 border-dashed pointer-events-none flex justify-between divide-x divide-white/20">
                          <div className="w-1/3 h-full divide-y divide-white/20 flex flex-col justify-between">
                            <span className="h-1/3"></span><span className="h-1/3"></span>
                          </div>
                          <div className="w-1/3 h-full divide-y divide-white/20 flex flex-col justify-between">
                            <span className="h-1/3"></span><span className="h-1/3"></span>
                          </div>
                          <div className="w-1/3 h-full divide-y divide-white/20 flex flex-col justify-between">
                            <span className="h-1/3"></span><span className="h-1/3"></span>
                          </div>
                        </div>

                      </div>

                      {/* Controls Row */}
                      <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 flex flex-wrap gap-4 items-center justify-between text-xs font-black">
                        
                        {/* Crop zoom range */}
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500 uppercase">Zoom:</span>
                          <input 
                            type="range" 
                            min="1" 
                            max="3" 
                            step="0.1" 
                            value={cropZoom} 
                            onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                            className="w-24 cursor-pointer focus:outline-none" 
                          />
                        </div>

                        {/* Rotation & Flipping widgets */}
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <button
                            onClick={() => setCropRotation(p => (p + 90) % 360)}
                            className="p-1.5 bg-white hover:bg-stone-200 text-stone-700 rounded-lg flex items-center gap-1 border border-stone-200 cursor-pointer"
                          >
                            <RotateCw className="w-3.5 h-3.5" /> Rotate 90°
                          </button>
                          
                          <button
                            onClick={() => setCropFlippedH(p => !p)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${cropFlippedH ? "bg-[#E23744] text-white border-red-500" : "bg-white text-stone-700 hover:bg-stone-200 border-stone-200"}`}
                          >
                            Flip H
                          </button>

                          <button
                            onClick={() => setCropFlippedV(p => !p)}
                            className={`p-1.5 rounded-lg border cursor-pointer ${cropFlippedV ? "bg-[#E23744] text-white border-red-500" : "bg-white text-stone-700 hover:bg-stone-200 border-[#dbdbdb]"}`}
                          >
                            Flip V
                          </button>
                        </div>

                        {/* Recommended Dimensions values */}
                        <div className="text-[10px] text-stone-400">
                          Recommended ratio: <strong>2.5 : 1 (Desktop slider)</strong>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* Move to next button */}
                  <div className="flex justify-end pt-2">
                    <button
                      disabled={!uploadedImageSrc}
                      onClick={() => setWizardStep(2)}
                      className={`p-2.5 px-6 font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                        uploadedImageSrc ? "bg-stone-900 text-white hover:bg-stone-800" : "bg-stone-200 text-stone-400 cursor-not-allowed"
                      }`}
                    >
                      Configure Placement Settings <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}

              {/* ------------ STEP 2: DETAILS & REDIRECT CONFIG ------------ */}
              {wizardStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold text-stone-700 animate-fade-in" id="cms-wizard-details-form">
                  
                  {/* Title & subtitle details */}
                  <div className="space-y-3">
                    
                    <div>
                      <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Banner Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. 50% Flat Off Sunday Special Kitchen"
                        value={formBannerTitle}
                        onChange={(e) => setFormBannerTitle(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#E23744] text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Subtitle Banner text description</label>
                      <input
                        type="text"
                        placeholder="e.g. Valid on all Biryani orders above Rs. 299"
                        value={formBannerSubtitle}
                        onChange={(e) => setFormBannerSubtitle(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#E23744] text-xs font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Promo Coupon Code</label>
                        <input
                          type="text"
                          placeholder="e.g. SUNDAYFEAST"
                          value={formPromoCode}
                          onChange={(e) => setFormPromoCode(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#E23744] text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Discount Tag Label</label>
                        <input
                          type="text"
                          placeholder="e.g. Flat Rs.150 Off"
                          value={formDiscountLabel}
                          onChange={(e) => setFormDiscountLabel(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#E23744] text-xs font-medium"
                        />
                      </div>
                    </div>

                    {/* Placements checklists */}
                    <div>
                      <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Deployment Placement Channels *</label>
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 grid grid-cols-1 gap-2">
                        {[
                          "Customer App Home Screen",
                          "Customer App Category Page",
                          "Rider App Dashboard",
                          "Website Homepage"
                        ].map((place) => {
                          const hasPlace = formPlacements.includes(place);
                          return (
                            <label key={place} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hasPlace}
                                onChange={() => {
                                  if (hasPlace) {
                                    setFormPlacements(p => p.filter(x => x !== place));
                                  } else {
                                    setFormPlacements(p => [...p, place]);
                                  }
                                }}
                                className="rounded border-zinc-300 text-[#E23744] focus:ring-[#E23744]"
                              />
                              <span className="text-stone-700 font-bold">{place}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Redirections, Targets & Scheduling values */}
                  <div className="space-y-3">
                    
                    {/* Redirection destinations config */}
                    <div>
                      <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Redirection To Action *</label>
                      <select
                        value={formRedirectType}
                        onChange={(e) => setFormRedirectType(e.target.value as any)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#E23744] font-semibold cursor-pointer"
                      >
                        <option value="Specific Restaurant">🍔 Targeted Specific Kitchen Outlet ID</option>
                        <option value="Specific Category">🍛 Food Category Segment page</option>
                        <option value="Offer Page">🎁 Global Offer Landing Page</option>
                        <option value="No Redirect">No Redirection Link (Static Visual)</option>
                      </select>
                    </div>

                    {/* Show live search block if Specific Restaurant is locked */}
                    {formRedirectType === "Specific Restaurant" && (
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2 animate-slide-in-right">
                        <label className="block text-[9px] text-[#E23744] font-black uppercase">Search verified food partner matching Kolkata grid</label>
                        
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type KFC, Domino's, Burger..."
                            value={formRedirectValue}
                            onChange={(e) => setFormRedirectValue(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-lg p-1.5 pl-7 text-[10.5px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                          />
                          <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-stone-400" />
                        </div>

                        {/* Small Preview selector chips */}
                        {filteredRestaurants.length > 0 && (
                          <div className="max-h-24 overflow-y-auto divide-y font-bold text-[10px] border rounded bg-white">
                            {filteredRestaurants.slice(0, 5).map(r => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() => {
                                  setFormRedirectValue(r.name);
                                  triggerToast("Destination Restaurant Bound", `Successfully linked node: ${r.name}`, "success");
                                }}
                                className="w-full text-left p-1.5 px-2 hover:bg-stone-100 flex justify-between items-center text-stone-700"
                              >
                                <span>{r.name}</span>
                                <span className="text-[9px] bg-stone-200 text-stone-500 px-1 rounded font-mono">#{r.id}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Start & End pickers scheduling */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] text-stone-400 font-extrabold uppercase">Campaign timeline scope</label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[10px]">
                          <input
                            type="checkbox"
                            checked={formPublishImmediate}
                            onChange={() => setFormPublishImmediate(p => !p)}
                            className="rounded text-[#E23744] focus:ring-[#E23744]"
                          />
                          <span className="text-stone-900 font-black">Publish Immediately</span>
                        </label>
                      </div>

                      {!formPublishImmediate && (
                        <div className="bg-stone-55 border border-stone-200 rounded-xl p-3 grid grid-cols-2 gap-2 animate-slide-in-right">
                          <div>
                            <span className="text-[9px] text-zinc-400 uppercase font-bold block mb-0.5">Start Date</span>
                            <input 
                              type="date" 
                              value={formStartDate} 
                              onChange={(e) => setFormStartDate(e.target.value)}
                              className="w-full bg-white border rounded p-1 text-[10.5px] font-mono focus:outline-none" 
                            />
                          </div>
                          <div>
                            <span className="text-[9px] text-zinc-400 uppercase font-bold block mb-0.5">End Expiry Date</span>
                            <input 
                              type="date" 
                              value={formEndDate} 
                              onChange={(e) => setFormEndDate(e.target.value)}
                              className="w-full bg-white border rounded p-1 text-[10.5px] font-mono focus:outline-none" 
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Location targeting segments */}
                    <div>
                      <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Target Customer Segments</label>
                      <select
                        value={formAudienceTarget}
                        onChange={(e) => setFormAudienceTarget(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-[#E23744] font-semibold cursor-pointer"
                      >
                        <option value="All Users">All Registered Users</option>
                        <option value="New Users">New Customers Only (First weeks)</option>
                        <option value="Premium Users">Premium Elite Gold Tier Partners</option>
                        <option value="High-Spending Customers">High-Value Food lovers / active orders</option>
                      </select>
                    </div>

                  </div>

                  {/* Wizard control buttons block */}
                  <div className="col-span-1 md:col-span-2 border-t border-stone-200 pt-4 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="text-stone-500 hover:text-stone-900 font-bold"
                    >
                      ← Back to Crop Phase
                    </button>

                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="p-2.5 px-6 bg-stone-900 hover:bg-stone-800 text-white font-black rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                    >
                      Verify Final Summary <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              )}

              {/* ------------ STEP 3: PRE-PUBLISH VERIFICATION SUMMARY ------------ */}
              {wizardStep === 3 && (
                <div className="space-y-4 animate-fade-in" id="cms-pre-publish-summary-card">
                  
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-300/70 space-y-3">
                    <span className="text-[9px] bg-indigo-600 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider block w-max">Campaign Summary Verification</span>
                    <h3 className="text-sm font-extrabold text-indigo-900 leading-tight">Please review linked attributes before committing slider live:</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-stone-700 pt-2">
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-stone-400">CAMPAIGN HEADER TITLE</span>
                          <span className="block font-extrabold text-[#E23744]">{formBannerTitle}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400">SUBTITLE ATTACHMENT</span>
                          <span className="block">{formBannerSubtitle || "Exclusive weekend treat options."}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400">CHANNELS DEPLOYED</span>
                          <span className="block text-indigo-900 font-bold">{formPlacements.join(", ")}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-stone-400">REDIRECTION SINK DESTINATION</span>
                          <span className="block font-extrabold">🍔 {formRedirectValue || "No Specific Restaurant Redirect Option Binding"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400">AUDIENCE SCOPE</span>
                          <span className="block">{formAudienceTarget}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-400">LAUNCH TIMELINE</span>
                          <span className="block">{formPublishImmediate ? "Published Immediately Live" : `Scheduled for ${formStartDate}`}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Render simulated responsive layout cards */}
                  <div className="border border-dashed p-4 rounded-xl bg-stone-50 space-y-1">
                    <span className="text-[10px] font-black text-stone-400">BANNER BRAND PREVIEW MOCK</span>
                    <div className="bg-stone-900 rounded-lg overflow-hidden h-28 relative">
                      <img 
                        referrerPolicy="no-referrer"
                        src={uploadedImageSrc || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=350&auto=format&fit=crop"} 
                        alt="Final summary preview" 
                        className="w-full h-full object-cover opacity-75"
                        onError={(e) => {
                          (e.target as any).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=350&auto=format&fit=crop";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 flex flex-col justify-end">
                        <h4 className="text-white text-xs font-black">{formBannerTitle || "Sunday Special Delights"}</h4>
                        <p className="text-stone-300 text-[10px] font-bold">{formBannerSubtitle || "Flat delivery promotions available."}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions final row */}
                  <div className="border-t border-stone-200 pt-4 flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="text-stone-500 hover:text-stone-900 font-bold"
                    >
                      ← Back to Details Configure
                    </button>

                    <button
                      type="button"
                      onClick={handleCreateNewBannerSubmit}
                      className="p-3 px-6 bg-[#E23744] hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <CheckCircle className="w-4.5 h-4.5 text-amber-300" /> Save & Launch Campaign Now
                    </button>
                  </div>

                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
          CMS DEVICE PREVIEW DRAWER (RIGHT PANEL SLIDE-OUT)
         ------------------------------------------------------------------------- */}
      {showPreviewDrawer && activePreviewBanner && (
        <div id="cms-mock-device-drawer-backdrop" className="fixed inset-0 bg-stone-900/45 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl overflow-y-auto p-6 flex flex-col justify-between animate-slide-in-right">
            
            <div className="space-y-4">
              
              {/* Header drawer controls */}
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <span className="text-[10px] text-[#E23744] font-black uppercase">Device Slider Preview Mock</span>
                  <h4 className="text-sm font-black text-stone-900 font-sans tracking-tight">Inspecting: {activePreviewBanner.title}</h4>
                </div>
                <button
                  onClick={() => {
                    setShowPreviewDrawer(false);
                    setActivePreviewBanner(null);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-900"
                >
                  ✕ Close
                </button>
              </div>

              {/* Selector for Mobile vs Tablet vs Desktop */}
              <div className="flex rounded-xl p-0.5 bg-stone-100 border border-stone-200 text-xs font-black">
                <button
                  onClick={() => setPreviewDeviceMode("mobile")}
                  className={`flex-1 p-1.5 rounded-lg text-center cursor-pointer flex items-center justify-center gap-1 ${
                    previewDeviceMode === "mobile" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile App
                </button>
                <button
                  onClick={() => setPreviewDeviceMode("tablet")}
                  className={`flex-1 p-1.5 rounded-lg text-center cursor-pointer flex items-center justify-center gap-1 ${
                    previewDeviceMode === "tablet" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" /> Tablet App
                </button>
                <button
                  onClick={() => setPreviewDeviceMode("desktop")}
                  className={`flex-1 p-1.5 rounded-lg text-center cursor-pointer flex items-center justify-center gap-1 ${
                    previewDeviceMode === "desktop" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Web Desktop
                </button>
              </div>

              {/* Device rendering frame stage with custom aspect scales */}
              <div className="flex justify-center py-6 bg-stone-50 border rounded-2xl shadow-inner relative">
                
                {previewDeviceMode === "mobile" && (
                  <div className="w-56 h-[380px] bg-white rounded-[2rem] border-4 border-stone-800 shadow-lg overflow-hidden relative flex flex-col">
                    {/* Speaker notch */}
                    <div className="w-20 h-4 bg-stone-800 rounded-b-xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-20"></div>
                    
                    <div className="p-3 pt-6 flex justify-between items-center border-b text-[10px] font-bold text-stone-800">
                      <span>Googly Delivery App</span>
                      <span className="text-[#E23744]">● LIVE</span>
                    </div>

                    <div className="p-3 space-y-3.5 overflow-y-auto flex-1 text-[10px] font-semibold text-stone-700">
                      <span className="text-[8px] text-zinc-400 block uppercase font-extrabold pb-0.5 border-b">Today's Featured Carousel</span>
                      
                      {/* Carousel item */}
                      <div className="rounded-xl overflow-hidden shadow-xs relative h-28 bg-stone-900 border">
                        <img 
                          referrerPolicy="no-referrer"
                          src={activePreviewBanner.imageUrl} 
                          alt="Mobile render slider" 
                          className="w-full h-full object-cover opacity-80"
                          onError={(e) => {
                            (e.target as any).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=350&auto=format&fit=crop";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                          <span className="text-white font-extrabold block text-[9.5px] leading-tight leading-snug">{activePreviewBanner.title}</span>
                          <span className="text-stone-300 text-[8px] block">{activePreviewBanner.subtitle}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-[8px] text-zinc-400 font-extrabold">
                        <div className="bg-stone-100 p-2 rounded-lg border">🍔 Fast Food</div>
                        <div className="bg-stone-100 p-2 rounded-lg border">🍲 Biryani Corner</div>
                      </div>
                    </div>
                  </div>
                )}

                {previewDeviceMode === "tablet" && (
                  <div className="w-72 h-[340px] bg-white rounded-2xl border-4 border-stone-800 shadow-lg overflow-hidden relative flex flex-col">
                    <div className="p-4.5 border-b text-xs font-bold text-stone-800">
                      <span>Googly Tablet Merchant Center</span>
                    </div>

                    <div className="p-4 space-y-4 flex-1 text-xs">
                      
                      {/* Tablet layout grid */}
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-8 space-y-2">
                          <span className="text-[9px] text-stone-400 block font-extrabold uppercase">COUPON HERO SLIDES</span>
                          <div className="rounded-xl overflow-hidden shadow-sm relative h-32 bg-stone-900 border">
                            <img 
                              referrerPolicy="no-referrer"
                              src={activePreviewBanner.imageUrl} 
                              alt="Tablet slider item" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as any).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=350&auto=format&fit=crop";
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 p-3 flex flex-col justify-end">
                              <span className="text-white font-black block text-xs leading-snug">{activePreviewBanner.title}</span>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-4 bg-stone-100 rounded-lg p-2.5 space-y-1.5 text-[10px]">
                          <span className="font-bold text-stone-900">Linked Outlet:</span>
                          <span className="text-[#E23744] font-black block">{activePreviewBanner.redirectValue || "Corporate Link"}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {previewDeviceMode === "desktop" && (
                  <div className="w-80 h-[280px] bg-white rounded-lg border-2 border-stone-400 shadow-lg overflow-hidden relative flex flex-col">
                    <div className="p-2 border-b bg-stone-100 text-[10px] text-stone-500 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                      <span className="w-2 h-2 rounded-full bg-green-400"></span>
                      <span className="pl-2 font-mono text-[8px] text-zinc-400 block truncate">https://www.googlydelivery.com/homepage</span>
                    </div>

                    <div className="p-4 space-y-3.5 overflow-y-auto flex-1 font-semibold text-stone-700">
                      <div className="rounded-xl overflow-hidden relative h-28 bg-stone-900">
                        <img 
                          referrerPolicy="no-referrer"
                          src={activePreviewBanner.imageUrl} 
                          alt="Web slider item" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=350&auto=format&fit=crop";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/35 p-4 flex flex-col justify-center max-w-xs">
                          <span className="text-stone-100 text-xs font-black">{activePreviewBanner.title}</span>
                          <span className="text-stone-300 text-[10px] leading-relaxed block pt-1">{activePreviewBanner.subtitle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Target properties and redirection summaries inside preview device drawer */}
              <div className="bg-stone-50 rounded-xl p-4.5 border text-xs font-semibold text-stone-700 space-y-2.5">
                <span className="text-[10px] text-[#E23744] font-black uppercase tracking-wider block border-b pb-1">Targeting compliance</span>
                <div>
                  <span className="text-stone-400 text-[10px] block">REDIRECTION FLOW ACTION</span>
                  <span className="block font-black text-stone-900">{activePreviewBanner.redirectType}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] block">AUDIENCE RULE</span>
                  <span className="block font-black text-stone-900">{activePreviewBanner.audienceType}</span>
                </div>
              </div>

            </div>

            {/* Bottom button */}
            <button
              onClick={() => {
                setShowPreviewDrawer(false);
                setActivePreviewBanner(null);
              }}
              className="w-full p-2.5 bg-stone-900 hover:bg-stone-900 text-white font-bold rounded-xl text-xs cursor-pointer text-center"
            >
              Verify & Approve Preview Aspect
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
