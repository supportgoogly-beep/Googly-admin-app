/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Order, Restaurant, MenuItem, Rider, User, Coupon, 
  SupportTicket, RefundRequest, GeofencingZone, ReviewRating, 
  CMSBanner, LoyaltyConfig, PenaltyLogic, TaxSettings, 
  StaffMember, GlobalSettings, TrafficWeatherWidget, ProfileSecurity 
} from "./types";
import { 
  INITIAL_RESTAURANTS, INITIAL_MENU_ITEMS, INITIAL_RIDERS, 
  INITIAL_USERS, INITIAL_ORDERS, INITIAL_COUPONS, INITIAL_TICKETS, 
  INITIAL_REFUNDS, INITIAL_ZONES, INITIAL_REVIEWS, INITIAL_BANNERS, 
  INITIAL_LOYALTY, INITIAL_PENALTIES, INITIAL_TAX, INITIAL_STAFF, 
  INITIAL_GLOBAL_SETTINGS, INITIAL_TRAFFIC_WEATHER, INITIAL_PROFILE,
  getStoredData, saveStoredData 
} from "./data/mockData";
import CoreOperations from "./components/CoreOperations";
import FinancialCRM from "./components/FinancialCRM";
import EngagementSettings from "./components/EngagementSettings";
import AnalyticsMaps from "./components/AnalyticsMaps";
import AuthContainer from "./components/auth/AuthContainer";
import WorkspaceDashboard from "./components/WorkspaceDashboard";
import { 
  Compass, ShoppingBag, Clock, Users, ArrowUpRight, ShieldCheck, 
  Settings, Percent, Bell, Search, DollarSign, LogOut, ChevronRight, 
  Ticket, Radio, HelpCircle, Layers, ShieldAlert, Star, Image, 
  Coins, AlertOctagon, FileText, Lock, Check, Menu, X, ArrowRight, UserCheck,
  Cloud
} from "lucide-react";
import { login, register, logout, resetPassword, syncUserWithSupabase, getUserProfileFromSupabase } from "./lib/auth";
import { auth } from "./lib/firebase";
import { CityProvider, useCityContext } from "./context/CityContext";
import { useSupabaseCollection } from "./hooks/useSupabase";

interface Toast {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  return (
    <CityProvider>
      <AppContent />
    </CityProvider>
  );
}

function AppContent() {
  const { globalCity, setGlobalCity } = useCityContext();
  
  // --- Persistent State Initializes ---
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => getStoredData("restaurants", INITIAL_RESTAURANTS));
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => getStoredData("menuItems", INITIAL_MENU_ITEMS));
  const [riders, setRiders] = useState<Rider[]>(() => getStoredData("riders_v3", INITIAL_RIDERS));
  const { data: users, updateItem: updateUser, deleteItem: deleteUser, addItem: addUser } = useSupabaseCollection<User>("users");
  
  // Adapted addUser to match the expected interface in child components
  const adaptedAddUser = async (user: Omit<User, 'id'>) => {
    await addUser(user);
  };
  const [orders, setOrders] = useState<Order[]>(() => getStoredData("orders_v3", INITIAL_ORDERS));
  const [coupons, setCoupons] = useState<Coupon[]>(() => getStoredData("coupons", INITIAL_COUPONS));
  const [tickets, setTickets] = useState<SupportTicket[]>(() => getStoredData("tickets", INITIAL_TICKETS));
  const [refunds, setRefunds] = useState<RefundRequest[]>(() => getStoredData("refunds", INITIAL_REFUNDS));
  const [zones, setZones] = useState<GeofencingZone[]>(() => getStoredData("zones", INITIAL_ZONES));
  const [reviews, setReviews] = useState<ReviewRating[]>(() => getStoredData("reviews", INITIAL_REVIEWS));
  const [banners, setBanners] = useState<CMSBanner[]>(() => getStoredData("banners", INITIAL_BANNERS));
  const [loyalty, setLoyalty] = useState<LoyaltyConfig>(() => getStoredData("loyalty", INITIAL_LOYALTY));
  const [penalties, setPenalties] = useState<PenaltyLogic[]>(() => getStoredData("penalties", INITIAL_PENALTIES));
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(() => getStoredData("taxSettings", INITIAL_TAX));
  const [staff, setStaff] = useState<StaffMember[]>(() => getStoredData("staff", INITIAL_STAFF));
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => getStoredData("globalSettings", INITIAL_GLOBAL_SETTINGS));
  const [weatherWidget, setWeatherWidget] = useState<TrafficWeatherWidget>(() => getStoredData("weatherWidget", INITIAL_TRAFFIC_WEATHER));
  const [profile, setProfile] = useState<ProfileSecurity>(() => getStoredData("profile", INITIAL_PROFILE));

  // --- Auth & Navigation State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [currentTab, setCurrentTab] = useState("dashboard");

  useEffect(() => {
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      const unsubscribe = onAuthStateChanged(auth(), async (user) => {
        setIsLoggedIn(!!user);
        if (user) {
          setProfile(p => ({ 
            ...p, 
            name: user.displayName || p.name || "", 
            email: user.email || p.email || "" 
          }));
          const profileData = await getUserProfileFromSupabase(user.uid);
          if (profileData) {
            setProfile(p => ({ ...p, name: profileData.name || p.name, email: profileData.email || p.email }));
          }
        }
        setIsLoading(false);
      });
      return unsubscribe;
    });
  }, []);

  const handleLogin = async (e: React.FormEvent, name: string) => {
    e.preventDefault();
    try {
        // Enforce the "Admins Only" pre-authentication whitelist check
        const checkRes = await fetch("/api/auth/check-authorized", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail })
        });

        if (!checkRes.ok) {
          const checkData = await checkRes.json().catch(() => ({}));
          throw new Error(checkData.error || "Not Registered");
        }

        let userCredential;
        try {
            userCredential = await login(authEmail, authPass);
        } catch (err: any) {
             if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                 userCredential = await register(authEmail, authPass, name);
             } else {
                 throw err;
             }
        }
        await syncUserWithSupabase(userCredential.user, name);
        triggerToast("Identity Verified", `Admin nodes active for ${name}.`, "success");
    } catch (err: any) {
        const displayMsg = err.message === "Not Registered" ? "Not Registered" : err.message;
        triggerToast("Auth Failure", displayMsg, "error");
        throw err;
    }
  }

  const handleSendOTP = async (email: string) => {
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to transmit OTP signal.");
      }
      triggerToast("Signal Transmitted", "Identity verification code sent to inbox.", "info");
    } catch (err: any) {
      const displayMsg = err.message === "Not Registered" ? "Not Registered" : err.message;
      triggerToast("Signal Error", displayMsg, "error");
      throw err;
    }
  }

  const handleVerifyOTP = async (email: string, otp: string) => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification mismatch.");
      triggerToast("Identity Verified", "Biological verification successful.", "success");
      return true;
    } catch (err: any) {
      const displayMsg = err.message === "Not Registered" ? "Not Registered" : err.message;
      triggerToast("Verification Error", displayMsg, "error");
      throw err;
    }
  }

  const handleResetPassword = async (email: string, newPass: string, otp: string) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: newPass, otp })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update security parameters.");
      }
      triggerToast("Parameters Finalized", "New encryption key active.", "success");
    } catch (err: any) {
      const displayMsg = err.message === "Not Registered" ? "Not Registered" : err.message;
      triggerToast("Update Error", displayMsg, "error");
      throw err;
    }
  }

  // --- UI Elements State ---
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  // --- Filtering based on global city ---
  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => globalCity === "All Cities" || o.city === globalCity || o.address?.includes(globalCity));
  }, [orders, globalCity]);

  const filteredRestaurants = React.useMemo(() => {
    return restaurants.filter(r => globalCity === "All Cities" || r.city === globalCity || r.address?.includes(globalCity) || r.bankDetails?.branchName?.includes(globalCity));
  }, [restaurants, globalCity]);

  const filteredRiders = React.useMemo(() => {
    return riders.filter(r => globalCity === "All Cities" || r.city === globalCity);
  }, [riders, globalCity]);

  const filteredUsers = React.useMemo(() => {
    return users.filter(u => globalCity === "All Cities" || u.city === globalCity || u.savedAddresses?.some(a => a.includes(globalCity)));
  }, [users, globalCity]);

  const filteredTickets = React.useMemo(() => {
    return tickets.filter(t => {
      if (globalCity === "All Cities") return true;
      const user = users.find(u => u.id === t.userId);
      return user && (user.city === globalCity || user.savedAddresses?.some(a => a.includes(globalCity)));
    });
  }, [tickets, users, globalCity]);

  const filteredRefunds = React.useMemo(() => {
    return refunds.filter(r => {
      if (globalCity === "All Cities") return true;
      const order = orders.find(o => o.id === r.orderId);
      return order && (order.city === globalCity || order.address?.includes(globalCity));
    });
  }, [refunds, orders, globalCity]);

  const filteredReviews = React.useMemo(() => {
    return reviews.filter(r => {
      if (globalCity === "All Cities") return true;
      const restaurant = restaurants.find(rest => rest.id === r.restaurantId);
      return restaurant && (restaurant.city === globalCity || restaurant.address?.includes(globalCity));
    });
  }, [reviews, restaurants, globalCity]);

  // --- Sync to Local Storage ---
  useEffect(() => { saveStoredData("restaurants", restaurants); }, [restaurants]);
  useEffect(() => { saveStoredData("menuItems", menuItems); }, [menuItems]);
  useEffect(() => { saveStoredData("riders_v3", riders); }, [riders]);
  useEffect(() => { saveStoredData("users_v2", users); }, [users]);
  useEffect(() => { saveStoredData("orders_v3", orders); }, [orders]);
  useEffect(() => { saveStoredData("coupons", coupons); }, [coupons]);
  useEffect(() => { saveStoredData("tickets", tickets); }, [tickets]);
  useEffect(() => { saveStoredData("refunds", refunds); }, [refunds]);
  useEffect(() => { saveStoredData("zones", zones); }, [zones]);
  useEffect(() => { saveStoredData("reviews", reviews); }, [reviews]);
  useEffect(() => { saveStoredData("banners", banners); }, [banners]);
  useEffect(() => { saveStoredData("loyalty", loyalty); }, [loyalty]);
  useEffect(() => { saveStoredData("penalties", penalties); }, [penalties]);
  useEffect(() => { saveStoredData("taxSettings", taxSettings); }, [taxSettings]);
  useEffect(() => { saveStoredData("staff", staff); }, [staff]);
  useEffect(() => { saveStoredData("globalSettings", globalSettings); }, [globalSettings]);
  useEffect(() => { saveStoredData("weatherWidget", weatherWidget); }, [weatherWidget]);
  useEffect(() => { saveStoredData("profile", profile); }, [profile]);

  // --- Toast Trigger helper ---
  const triggerToast = (title: string, message: string, type: Toast["type"]) => {
    // Suppress general navigation notifications
    const navWords = ["Opened", "Focused", "Filtered", "Loaded", "View", "Switched", "Navigated", "Displayed", "Screen"];
    if (navWords.some(w => title.toLowerCase().includes(w.toLowerCase()))) {
      // allow exports
      if (!title.toLowerCase().includes("export")) return;
    }
    
    // Suppress simple "info" toasts for clicks, unless they are document uploads/updates
    if (type === "info") {
      const allowedInfo = ["upload", "attach", "inject", "detect", "sync", "save", "log"];
      if (!allowedInfo.some(w => title.toLowerCase().includes(w) || message.toLowerCase().includes(w))) {
        return;
      }
    }

    const nextToast = { id: `toast-${Date.now()}`, title, message, type };
    setToasts(prev => [nextToast, ...prev]);
    // Dismiss toast after 4s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== nextToast.id));
    }, 4000);
  };

  // --- Auth Logins ---
  const handleLogout = async () => {
    try {
        await logout();
    } catch (err) {
        alert("Logout failed: " + err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative select-none">
        {/* Abstract futuristic background dots */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="flex flex-col items-center space-y-6 z-10 text-center">
          {/* Pulsing high-fidelity loading circle */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-orange-500/10 rounded-full" />
            <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-2 bg-slate-950 rounded-full flex items-center justify-center shadow-lg border border-slate-800">
              <span className="text-orange-500 text-xl font-extrabold select-none animate-pulse">G</span>
            </div>
          </div>
          
          <div className="space-y-1.5 animate-pulse">
            <h2 className="text-sm font-black tracking-widest text-[#E23744] uppercase">GOOGLY SECURE PORTAL</h2>
            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 justify-center">
              Authorizing administrative credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1C1C1C] font-sans antialiased flex flex-col selection:bg-[#E23744]/20 selection:text-[#E23744]">
      
      {/* Toast Render stack */}
      <div className="fixed top-4 right-4 z-55 space-y-2 pointer-events-none w-full max-w-[280px]">
        {toasts.map(t => (
          <div 
            key={t.id}
            id={t.id}
            className={`p-2 rounded-lg shadow-md border pointer-events-auto flex justify-between gap-1.5 bg-white animate-slide-in-right transition-all max-w-[280px]`}
          >
            <div className="space-y-0.5">
              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-widest ${
                t.type === "success" ? "bg-emerald-100 text-emerald-800" :
                t.type === "error" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
              }`}>
                {t.type === "success" ? "SUCCESS" : t.type === "error" ? "ERROR" : "INFO"}
              </span>
              <h4 className="text-xs font-black text-gray-900 leading-tight">{t.title}</h4>
              <p className="text-[10px] text-gray-500 leading-tight">{t.message}</p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
              className="text-gray-400 hover:text-gray-600 self-start p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {!isLoggedIn ? (
        <AuthContainer 
          onLogin={handleLogin} 
          email={authEmail} 
          setEmail={setAuthEmail} 
          pass={authPass} 
          setPass={setAuthPass} 
          onResetPassword={handleResetPassword}
          onSendOTP={handleSendOTP}
          onVerifyOTP={handleVerifyOTP}
        />
      ) : (
        /* --- MAIN SUPER COCKPIT VIEW --- */
        <div className="flex flex-1 overflow-hidden relative">

          {/* Left Sticky Sidebar navigation containing all 22 components grouped cleanly */}
          <aside className={`w-[180px] overflow-y-auto border-r border-[#E5E7EB] bg-white fixed inset-y-0 left-0 z-30 transform lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col justify-between ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
            <div className="flex flex-col h-full overflow-y-auto">
              
              {/* BRAND HEADER LINE */}
              <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2 select-none">
                  <img src="https://api.dicebear.com/7.x/initials/svg?seed=G&backgroundColor=f97316&textColor=ffffff&fontWeight=900" alt="Logo" className="w-7 h-7 rounded-lg shadow-sm" referrerPolicy="no-referrer" />
                  <div className="font-extrabold text-[#E23744] text-sm tracking-tight">googly</div>
                </div>
                <button 
                  onClick={() => setMobileSidebarOpen(false)}
                  className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* NAVIGATION ROUTING DIRECTORY */}
              <nav className="p-3 space-y-4 flex-1 text-[11px]">
                
                {/* 1. Operational Command Group */}
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block mb-2 px-1">Operational Command</span>
                  
                  <button 
                    id="nav-dashboard"
                    onClick={() => { setCurrentTab("dashboard"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "dashboard" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Compass className="w-3.5 h-3.5" /> Dashboard Home
                  </button>

                  <button 
                    id="nav-orders"
                    onClick={() => { setCurrentTab("orders"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "orders" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Order Operations
                  </button>

                  <button 
                    id="nav-restaurants"
                    onClick={() => { setCurrentTab("restaurants"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "restaurants" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Restaurant Onboard
                  </button>

                  <button 
                    id="nav-menu"
                    onClick={() => { setCurrentTab("menu"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "menu" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Menu Configurations
                  </button>

                  <button 
                    id="nav-riders"
                    onClick={() => { setCurrentTab("riders"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "riders" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Users className="w-3.5 h-3.5" /> Fleet Partners (Riders)
                  </button>

                  <button 
                    id="nav-dispatch"
                    onClick={() => { setCurrentTab("dispatch"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "dispatch" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Radio className="w-3.5 h-3.5" /> Interactive Dispatch
                  </button>

                  <button 
                    id="nav-kds"
                    onClick={() => { setCurrentTab("kds"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "kds" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Settings className="w-3.5 h-3.5" /> Kitchen Display Settings
                  </button>
                </div>

                {/* 2. Marketing & Content Group */}
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block mb-2 px-1">Engagement & Marketing</span>
                  
                  <button 
                    id="nav-coupons"
                    onClick={() => { setCurrentTab("coupons"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "coupons" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Percent className="w-3.5 h-3.5" /> Promo Coupon Vault
                  </button>

                  <button 
                    id="nav-notifications"
                    onClick={() => { setCurrentTab("notifications"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "notifications" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Bell className="w-3.5 h-3.5" /> Push Campaigns
                  </button>

                  <button 
                    id="nav-reviews"
                    onClick={() => { setCurrentTab("reviews"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "reviews" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Star className="w-3.5 h-3.5" /> Reviews & Ratings Feed
                  </button>

                  <button 
                    id="nav-cms"
                    onClick={() => { setCurrentTab("cms"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "cms" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Image className="w-3.5 h-3.5" /> Host Hero Banners (CMS)
                  </button>
                </div>

                {/* 3. Finance & CRM Group */}
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block mb-2 px-1">CRM, Payouts & Taxes</span>

                  <button 
                    id="nav-users"
                    onClick={() => { setCurrentTab("users"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "users" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Users className="w-3.5 h-3.5" /> Customer Care Register
                  </button>

                  <button 
                    id="nav-payouts"
                    onClick={() => { setCurrentTab("payouts"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "payouts" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Payment Settlements
                  </button>

                  <button 
                    id="nav-refunds"
                    onClick={() => { setCurrentTab("refunds"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "refunds" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <AlertOctagon className="w-3.5 h-3.5" /> Refund Dispute Queue
                  </button>

                  <button 
                    id="nav-crm"
                    onClick={() => { setCurrentTab("crm"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "crm" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Support CRM Care Desk
                  </button>

                  <button 
                    id="nav-tax"
                    onClick={() => { setCurrentTab("tax"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "tax" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Regulation Invoice & Tax
                  </button>
                </div>

                {/* 4. Settings & Security Policies */}
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest block mb-2 px-1">Policies & System Control</span>

                  <button 
                    id="nav-pricing"
                    onClick={() => { setCurrentTab("pricing"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "pricing" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Dynamic Surge Control
                  </button>

                  <button 
                    id="nav-geofence"
                    onClick={() => { setCurrentTab("geofence"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "geofence" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <CompartmentsIcon className="w-3.5 h-3.5" /> Geofencing Bound Maps
                  </button>

                  <button 
                    id="nav-loyalty"
                    onClick={() => { setCurrentTab("loyalty"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "loyalty" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Coins className="w-3.5 h-3.5" /> Googly Reward Coins
                  </button>

                  <button 
                    id="nav-policies"
                    onClick={() => { setCurrentTab("policies"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "policies" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Cancellation Penalties
                  </button>

                  <button 
                    id="nav-rbac"
                    onClick={() => { setCurrentTab("rbac"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "rbac" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin Permissions (RBAC)
                  </button>

                  <button 
                    id="nav-settings"
                    onClick={() => { setCurrentTab("settings"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "settings" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Settings className="w-3.5 h-3.5" /> Global System Settings
                  </button>

                  <button 
                    id="nav-workspace"
                    onClick={() => { setCurrentTab("workspace"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "workspace" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Cloud className="w-3.5 h-3.5" /> Google Workspace
                  </button>

                  <button 
                    id="nav-analytics"
                    onClick={() => { setCurrentTab("analytics"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "analytics" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Performance Auditing CSV
                  </button>

                  <button 
                    id="nav-profile"
                    onClick={() => { setCurrentTab("profile"); setMobileSidebarOpen(false); }}
                    className={`nav-btn w-full text-left p-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${currentTab === "profile" ? "bg-red-50 text-[#E23744]" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Lock className="w-3.5 h-3.5" /> master Profile Settings
                  </button>
                </div>
              </nav>

              {/* LOGOUT SECURE BOTTOM */}
              <div className="p-3 flex justify-center border-t border-gray-100 bg-gray-50/50">
                <button
                  id="nav-logout"
                  onClick={handleLogout}
                  className="w-full py-1.5 text-[11px] bg-[#E23744]/10 hover:bg-[#E23744]/20 text-[#E23744] font-black rounded-lg text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" /> Terminate Session
                </button>
              </div>

            </div>
          </aside>

          {/* Core main wrapper containing top navbar header and dynamic scrollable screen area */}
          <div className="flex-1 lg:pl-[180px] flex flex-col min-w-0">
            
            {/* TOP NAVIGATION HEADER BAR */}
            <header className="sticky top-0 bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 z-20 shadow-xs">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Global elements filtering query */}
                <div className="relative w-64 md:w-80 hidden sm:block">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                  <input
                    id="global-header-search"
                    type="text"
                    placeholder="Global tracking (Order ID search, support...)"
                    value={globalSearch}
                    onChange={(e) => {
                      const q = e.target.value;
                      setGlobalSearch(q);
                      // Automatic search redirection helper!
                      if (q.startsWith("OO-")) {
                        setCurrentTab("orders");
                        triggerToast("Orders Filtered", `Located Order node matching ${q}.`, "info");
                      } else if (q.startsWith("CR-")) {
                        setCurrentTab("crm");
                        triggerToast("Disputes Filtered", `Located support transits for ticket ID: ${q}`, "info");
                      }
                    }}
                    className="w-full pl-8.5 pr-4 py-2 bg-[#F8F9FA] border border-gray-100 rounded-xl text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden font-bold"
                  />
                </div>
                
                {/* Global City Selector */}
                <div className="hidden sm:flex items-center gap-2">
                   <select 
                     id="global-city-selector"
                     value={globalCity}
                     onChange={(e) => {
                       setGlobalCity(e.target.value);
                       triggerToast("Region Shifted", `Operational grid locked to ${e.target.value}.`, "info");
                     }}
                     className="bg-gray-100 border-none font-extrabold text-[#E23744] text-xs px-2 py-1.5 rounded-lg cursor-pointer focus:ring-1 focus:ring-[#E23744]"
                   >
                     {["All Cities", "Kolkata", "Howrah", "New Town", "Udaipur"].map(city => (
                       <option key={city} value={city}>{city}</option>
                     ))}
                   </select>
                </div>
              </div>

              {/* Admin configuration nodes */}
              <div className="flex items-center gap-4 relative">
                
                {/* 1. Global Meteo Status warning if Heavy Rain */}
                {weatherWidget.weather === "Heavy Rain" && (
                  <div 
                    onClick={() => setCurrentTab("pricing")}
                    className="bg-amber-100 text-amber-800 p-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer animate-pulse border border-amber-200"
                  >
                    <AlertOctagon className="w-4 h-4 text-amber-700" /> Storm surge warning
                  </div>
                )}

                {/* 2. Notification Bell Popover */}
                <div className="relative">
                  <button 
                    id="notif-popover-trigger"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-full relative"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600"></span>
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 text-xs overflow-hidden">
                      <div className="p-3 bg-slate-50 border-b border-gray-100 font-extrabold flex justify-between items-center text-slate-800">
                        <span>Corporate Signals Hub</span>
                        <span className="text-[10px] bg-red-100 text-[#E23744] px-1.5 py-0.5 rounded font-black uppercase">2 alerts</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        <div className="p-3 hover:bg-gray-50 flex gap-2.5 items-start">
                          <span className="w-2 h-2 bg-red-600 rounded-full block mt-1.5 shrink-0"></span>
                          <div>
                            <p className="font-bold text-gray-800">Inbound Support Ticket CR-101 opened</p>
                            <span className="text-[10px] text-gray-400">Rohan: Raw mutton pieces dispute.</span>
                          </div>
                        </div>
                        <div className="p-3 hover:bg-gray-50 flex gap-2.5 items-start">
                          <span className="w-2 h-2 bg-amber-500 rounded-full block mt-1.5 shrink-0"></span>
                          <div>
                            <p className="font-bold text-gray-800">Storm Warning Surge advisory</p>
                            <span className="text-[10px] text-gray-400">Atmospheric pressure drops: heavy rainfalls.</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 border-t border-gray-100 text-center bg-gray-50">
                        <button onClick={() => setShowNotifications(false)} className="text-[10px] text-[#E23744] hover:underline font-bold">Close Popover</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Section */}
                <div className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full mr-4 capitalize">
                  {currentTab}
                </div>

                {/* 3. Account Profile Dropdown */}
                <div className="relative">
                  <button 
                    id="profile-dropdown-trigger"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <div className="w-7 h-7 bg-slate-900 text-white font-extrabold text-xs flex justify-center items-center rounded-full">
                      {profile.name ? profile.name.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-800 hidden sm:block">
                      {profile.name || "User"} {profile.email === "ruhandharpurkayastha@gmail.com" && "(Admin)"}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 text-xs">
                      <div className="p-3 border-b border-gray-100 bg-slate-50 rounded-t-xl">
                        <div className="font-bold text-slate-900 flex justify-between items-center">
                            <span className="truncate pr-2">{profile.name || "User"}</span>
                            {profile.email === "ruhandharpurkayastha@gmail.com" ? (
                                <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold shrink-0">Admin</span>
                            ) : (
                                <span className="bg-slate-200 text-slate-600 text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-bold shrink-0">Employee</span>
                            )}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 w-full truncate" title={profile.email}>{profile.email || "No Email"}</div>
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Working in: <span className="font-medium text-slate-600 capitalize truncate">{currentTab} Section</span>
                        </div>
                      </div>
                      <div className="py-1">
                        <button 
                          onClick={() => { setCurrentTab("profile"); setShowProfileMenu(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-bold flex items-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" /> Security 2FA Config
                        </button>
                        <button 
                          onClick={() => { setCurrentTab("settings"); setShowProfileMenu(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 font-bold flex items-center gap-1.5"
                        >
                          <Settings className="w-3.5 h-3.5" /> Global Settings
                        </button>
                        <button 
                          onClick={() => { handleLogout(); setShowProfileMenu(false); }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-red-700 font-black border-t border-gray-100 flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </header>

            {/* DYNAMIC SCROLLABLE CONTENT VIEWPORT */}
            <main className="flex-1 p-6 overflow-y-auto max-w-[1600px] w-full mx-auto">
              {/* Load appropriate module subset matching current tab */}
              {["dashboard", "pricing", "geofence", "analytics"].includes(currentTab) && (
                <AnalyticsMaps
                  currentTab={currentTab}
                  setCurrentTab={setCurrentTab}
                  orders={filteredOrders}
                  restaurants={filteredRestaurants}
                  riders={filteredRiders}
                  users={filteredUsers}
                  zones={zones}
                  setZones={setZones}
                  weatherWidget={weatherWidget}
                  setWeatherWidget={setWeatherWidget}
                  triggerToast={triggerToast}
                />
              )}

              {["orders", "restaurants", "menu", "riders", "dispatch", "kds"].includes(currentTab) && (
                <CoreOperations
                  currentTab={currentTab}
                  orders={filteredOrders}
                  setOrders={setOrders}
                  restaurants={filteredRestaurants}
                  setRestaurants={setRestaurants}
                  menuItems={menuItems}
                  setMenuItems={setMenuItems}
                  riders={filteredRiders}
                  setRiders={setRiders}
                  triggerToast={triggerToast}
                />
              )}

              {["users", "crm", "payouts", "refunds", "tax", "rbac"].includes(currentTab) && (
                <FinancialCRM
                  currentTab={currentTab}
                  users={users}
                  updateUser={updateUser}
                  deleteUser={deleteUser}
                  addUser={adaptedAddUser}
                  orders={filteredOrders}
                  tickets={filteredTickets}
                  setTickets={setTickets}
                  refunds={filteredRefunds}
                  setRefunds={setRefunds}
                  staff={staff}
                  setStaff={setStaff}
                  taxSettings={taxSettings}
                  setTaxSettings={setTaxSettings}
                  triggerToast={triggerToast}
                />
              )}

              {["coupons", "notifications", "reviews", "cms", "loyalty", "policies", "settings", "profile"].includes(currentTab) && (
                <EngagementSettings
                  currentTab={currentTab}
                  coupons={coupons}
                  setCoupons={setCoupons}
                  reviews={filteredReviews}
                  setReviews={setReviews}
                  banners={banners}
                  setBanners={setBanners}
                  loyalty={loyalty}
                  setLoyalty={setLoyalty}
                  penalties={penalties}
                  setPenalties={setPenalties}
                  globalSettings={globalSettings}
                  setGlobalSettings={setGlobalSettings}
                  profile={profile}
                  setProfile={setProfile}
                  restaurants={filteredRestaurants}
                  triggerToast={triggerToast}
                  onLogout={handleLogout}
                />
              )}

              {currentTab === "workspace" && (
                <WorkspaceDashboard
                  orders={filteredOrders}
                  restaurants={filteredRestaurants}
                  menuItems={menuItems}
                  users={users}
                  triggerToast={triggerToast}
                />
              )}
            </main>

          </div>

          {/* Mobile navigation sidebar overlay */}
          {mobileSidebarOpen && (
            <div 
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-xs"
            ></div>
          )}

        </div>
      )}

    </div>
  );
}

// Quick custom vector map components helper to satisfy map compartments icons
function CompartmentsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
