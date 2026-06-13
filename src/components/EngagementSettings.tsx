/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import CouponManagementModule from "./CouponManagementModule";
import ReviewsManagementSystem from "./ReviewsManagementSystem";
import CmsBannerManagementSystem from "./CmsBannerManagementSystem";
import LoyaltyProgramManagementDashboard from "./LoyaltyProgramManagementDashboard";
import CancellationPenaltyDashboard from "./CancellationPenaltyDashboard";
import ProfileSecurityDashboard from "./ProfileSecurityDashboard";
import NotificationsSoundsManagement from "./NotificationsSoundsManagement";
import { 
  Coupon, ReviewRating, CMSBanner, LoyaltyConfig, PenaltyLogic, 
  GlobalSettings, ProfileSecurity, Restaurant 
} from "../types";
import { 
  Percent, Bell, Star, Image, Coins, AlertOctagon, Settings, 
  ShieldAlert, ShieldCheck, X, Plus, Calendar, Tag, AlertTriangle, 
  TrendingUp, Check, Save, Lock, EyeOff, Radio, Power, Upload, Trash2, MapPin
} from "lucide-react";
import { useCityContext } from "../context/CityContext";

interface EngagementSettingsProps {
  currentTab: string;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  reviews: ReviewRating[];
  setReviews: React.Dispatch<React.SetStateAction<ReviewRating[]>>;
  banners: CMSBanner[];
  setBanners: React.Dispatch<React.SetStateAction<CMSBanner[]>>;
  loyalty: LoyaltyConfig;
  setLoyalty: React.Dispatch<React.SetStateAction<LoyaltyConfig>>;
  penalties: PenaltyLogic[];
  setPenalties: React.Dispatch<React.SetStateAction<PenaltyLogic[]>>;
  globalSettings: GlobalSettings;
  setGlobalSettings: React.Dispatch<React.SetStateAction<GlobalSettings>>;
  profile: ProfileSecurity;
  setProfile: React.Dispatch<React.SetStateAction<ProfileSecurity>>;
  restaurants: Restaurant[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
  onLogout: () => void;
}

export default function EngagementSettings({
  currentTab,
  coupons,
  setCoupons,
  reviews,
  setReviews,
  banners,
  setBanners,
  loyalty,
  setLoyalty,
  penalties,
  setPenalties,
  globalSettings,
  setGlobalSettings,
  profile,
  setProfile,
  restaurants,
  triggerToast,
  onLogout
}: EngagementSettingsProps) {

  // --- Coupon State ---
  const { cities, addCity, deleteCity, globalCity } = useCityContext();
  const [newCityInput, setNewCityInput] = useState("");

  const handleAddCity = () => {
    const trimmed = newCityInput.trim();
    if (!trimmed) return;
    addCity(trimmed);
    triggerToast("City Node Added", `Successfully registered "${trimmed}" in global region directories.`, "success");
    setNewCityInput("");
  };

  const handleDeleteCity = (cityName: string) => {
    deleteCity(cityName);
    triggerToast("City Node Deleted", `Successfully purged "${cityName}" from regional indexes.`, "success");
  };

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "", title: "", type: "percentage" as Coupon["type"], value: 15,
    minOrderValue: 200, maxDiscount: 100, startDate: "", endDate: "", restaurantId: ""
  });

  // --- Push Notifications State ---
  const [notifTarget, setNotifTarget] = useState("All Users");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifImage, setNotifImage] = useState<string | null>(null);
  const [showComposeSuccess, setShowComposeSuccess] = useState(false);

  // --- Content CMS state ---
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [cropSimulated, setCropSimulated] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerTargetRest, setBannerTargetRest] = useState("rest-1");
  const [bannerAttachedImage, setBannerAttachedImage] = useState<string>("");

  // --- Loyalty Configuration State ---
  const [loyaltyCoinRate, setLoyaltyCoinRate] = useState(loyalty.coinsPerHundredRs);
  const [loyaltyRedeemVal, setLoyaltyRedeemVal] = useState(loyalty.coinRedemptionValue);

  // --- Penalties State ---
  const [newRuleMin, setNewRuleMin] = useState(5);
  const [newRulePercent, setNewRulePercent] = useState(10);
  const [newRuleActor, setNewRuleActor] = useState<"restaurant" | "customer" | "rider">("restaurant");

  // --- Global App Settings State ---
  const [appForceUpdate, setAppForceUpdate] = useState(globalSettings.forceAppUpdate);
  const [appMaintenance, setAppMaintenance] = useState(globalSettings.maintenanceMode);
  const [appEnableCOD, setAppEnableCOD] = useState(globalSettings.enableCOD);
  const [appMinOrderVal, setAppMinOrderVal] = useState(globalSettings.minOrderValue);

  // --- Profile Security State ---
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old: "", next: "", confirm: "" });

  // --- Handlers ---

  // Compile new coupon
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;

    const couponRow: Coupon = {
      code: newCoupon.code.toUpperCase(),
      title: newCoupon.title,
      type: newCoupon.type,
      value: Number(newCoupon.value) || 20,
      minOrderValue: Number(newCoupon.minOrderValue) || 150,
      maxDiscount: Number(newCoupon.maxDiscount) || 120,
      startDate: newCoupon.startDate || new Date().toISOString().split('T')[0],
      endDate: newCoupon.endDate || "2026-12-31",
      applicableRestaurants: newCoupon.restaurantId ? [newCoupon.restaurantId] : [],
      active: true
    };

    setCoupons(prev => [couponRow, ...prev]);
    triggerToast("Promo Created", `Coupon code ${couponRow.code} added to available marketing pools.`, "success");
    setShowCouponModal(false);
    setNewCoupon({ code: "", title: "", type: "percentage", value: 15, minOrderValue: 200, maxDiscount: 100, startDate: "", endDate: "", restaurantId: "" });
  };

  // Launch push notification dispatch trigger
  const handleSendPushNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) {
      triggerToast("Form Incomplete", "Please specify a notification title and message body.", "error");
      return;
    }
    setShowComposeSuccess(true);
  };

  // Publish banner element
  const handlePublishBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle) return;

    const banner: CMSBanner = {
      id: `banner-${Date.now()}`,
      title: bannerTitle,
      imageUrl: bannerAttachedImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
      linkToRestaurantId: bannerTargetRest,
      active: true,
      publishDate: new Date().toISOString().split("T")[0]
    };

    setBanners(prev => [banner, ...prev]);
    triggerToast("Banner Published", `${banner.title} is now active on the consumer home screen layout!`, "success");
    setShowBannerModal(false);
    setBannerTitle("");
    setBannerAttachedImage("");
    setCropSimulated(false);
  };

  // Persist reward configuration
  const handleSaveLoyalty = () => {
    setLoyalty({
      coinsPerHundredRs: Number(loyaltyCoinRate),
      coinRedemptionValue: Number(loyaltyRedeemVal)
    });
    triggerToast("Loyalty Updated", `Saved reward: ₹100 = ${loyaltyCoinRate} coins.`, "success");
  };

  // Add rule builder row
  const handleAddPolicyRule = () => {
    const nextRule: PenaltyLogic = {
      id: `pen-${Date.now()}`,
      afterMinutes: Number(newRuleMin),
      penaltyPercent: Number(newRulePercent),
      appliesTo: newRuleActor
    };
    setPenalties(prev => [...prev, nextRule]);
    triggerToast("Inbound policy registered", `Cancellation rule added for ${newRuleActor}`, "success");
  };

  // App settings save
  const handleSaveAppGlobal = () => {
    setGlobalSettings({
      forceAppUpdate: appForceUpdate,
      maintenanceMode: appMaintenance,
      enableCOD: appEnableCOD,
      minOrderValue: Number(appMinOrderVal) || 99
    });
    triggerToast("App settings updated", "Global platform flags persisted globally.", "success");
  };

  // Password update simulation
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.old || !passwordForm.next || !passwordForm.confirm) {
      triggerToast("Field incomplete", "Please fill in all security elements.", "error");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      triggerToast("Passwords do not match", "The confirmation pass does not align.", "error");
      return;
    }
    setProfile(prev => ({ ...prev, passwordChangedAt: new Date().toISOString().split("T")[0] }));
    triggerToast("Security key rotation completed", "Profile master password changed successfully across root database.", "success");
    setPasswordForm({ old: "", next: "", confirm: "" });
  };

  return (
    <div id="engagement-settings" className="space-y-6">

      {/* --- FEATURE 9: COUPON & PROMO CODE MANAGEMENT --- */}
      {currentTab === "coupons" && (
        <CouponManagementModule 
          currentTab={currentTab}
          coupons={coupons}
          setCoupons={setCoupons}
          restaurants={restaurants}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 10: NOTIFICATION & MESSAGING & SOUNS HUB --- */}
      {currentTab === "notifications" && (
        <NotificationsSoundsManagement triggerToast={triggerToast} />
      )}

      {/* --- FEATURE 16: REVIEWS & RATINGS MANAGEMENT --- */}
      {currentTab === "reviews" && (
        <ReviewsManagementSystem
          reviews={reviews}
          setReviews={setReviews}
          restaurants={restaurants}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 17: CONTENT MANAGEMENT SYSTEM (CMS) & BANNERS --- */}
      {currentTab === "cms" && (
        <CmsBannerManagementSystem
          banners={banners}
          setBanners={setBanners}
          restaurants={restaurants}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 18: LOYALTY PROGRAM (GOOGLY COINS) --- */}
      {currentTab === "loyalty" && (
        <LoyaltyProgramManagementDashboard
          loyalty={loyalty}
          setLoyalty={setLoyalty}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 19: CANCELLATION & PENALTY POLICIES --- */}
      {currentTab === "policies" && (
        <CancellationPenaltyDashboard
          triggerToast={triggerToast}
          onSave={(updatedPolicies) => {
            const mappedPenalties: PenaltyLogic[] = updatedPolicies.map(p => ({
              id: p.id,
              afterMinutes: p.conditions.timeValueMinutes,
              penaltyPercent: p.action.penaltyType === "percentage" ? p.action.penaltyPercent : 0,
              appliesTo: p.category === "system" ? "customer" : p.category
            }));
            setPenalties(mappedPenalties);
          }}
        />
      )}

      {/* --- FEATURE 22: APP SETTINGS (GLOBAL) --- */}
      {currentTab === "settings" && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#E23744]" />
              Global Configuration Command
            </h2>
            <p className="text-xs text-gray-500">Configure global parameters, control maintenance modes, and minimum checkout conditions.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-5 text-xs font-semibold text-gray-700">
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="font-bold text-gray-800">Force Consumer Application Upgrade</span>
                <p className="text-xs text-gray-400">If checked, prompts and blocks older clients requesting API connectivity downstream.</p>
              </div>
              <button
                id="toggle-force-update"
                onClick={() => setAppForceUpdate(!appForceUpdate)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  appForceUpdate ? "bg-red-600 justify-end" : "bg-gray-200 justify-start"
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
              </button>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-5">
              <div>
                <span className="font-bold text-gray-800 text-red-600 flex items-center gap-1"><AlertTriangle className="w-4.5 h-4.5" /> Platform Maintenance Mode (Global Shut-off)</span>
                <p className="text-xs text-gray-400">Halts and disconnects whole consumer ordering interfaces. (Admins bypass active).</p>
              </div>
              <button
                id="toggle-maintenance-mode"
                onClick={() => setAppMaintenance(!appMaintenance)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  appMaintenance ? "bg-red-700 justify-end" : "bg-gray-200 justify-start"
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
              </button>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-gray-50 pt-5">
              <div>
                <span className="font-bold text-gray-800">Enable Cash on Delivery (COD) Checkout Options</span>
                <p className="text-xs text-gray-400 font-semibold">Allows consumers to finalize bills using cash. (Riders collect checks).</p>
              </div>
              <button
                id="toggle-enable-cod"
                onClick={() => setAppEnableCOD(!appEnableCOD)}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all ${
                  appEnableCOD ? "bg-red-600 justify-end" : "bg-gray-200 justify-start"
                }`}
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
              </button>
            </div>

            <div className="border-t border-gray-50 pt-5">
              <label className="block text-gray-500 font-bold mb-1.5">Minimum Order Value required for Checkout (INR)</label>
              <input
                id="settings-min-order-val"
                type="number"
                value={appMinOrderVal}
                onChange={(e) => setAppMinOrderVal(Number(e.target.value))}
                placeholder="99"
                className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-hidden font-semibold focus:ring-1 focus:ring-[#E23744]"
              />
            </div>

            <div className="pt-4">
              <button
                id="save-global-settings"
                onClick={handleSaveAppGlobal}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Persist Global Settings
              </button>
            </div>
          </div>

          {/* --- CITY DIRECTORY MANAGEMENT --- */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
              <MapPin className="w-5 h-5 text-[#E23744]" />
              <div>
                <h3 className="text-sm font-black text-gray-950">Active City & Region Directories</h3>
                <p className="text-[10px] text-gray-400 font-semibold mb-1">Register new corporate delivery hubs or purge retired operational regions.</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  id="new-city-name-input"
                  type="text"
                  placeholder="Enter new city name (e.g. Mumbai)"
                  value={newCityInput}
                  onChange={(e) => setNewCityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCity();
                    }
                  }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-[#E23744]"
                />
                <button
                  id="add-city-button"
                  onClick={handleAddCity}
                  className="px-4 py-2 bg-[#E23744] hover:bg-[#c92f3b] text-white font-extrabold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add City
                </button>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50">
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 font-bold">
                  {cities.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400 font-bold">No active cities registered in directory.</div>
                  ) : (
                    cities.map(city => (
                      <div key={city} id={`city-item-${city.toLowerCase().replace(/\s+/g, '-')}`} className="flex justify-between items-center p-3 bg-white hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          <span className="text-xs font-extrabold text-gray-800">{city}</span>
                          {globalCity === city && (
                            <span className="bg-red-50 text-[#E23744] text-[9px] font-black px-1.5 py-0.5 rounded-full border border-red-100">Active Selection</span>
                          )}
                        </div>
                        <button
                          id={`delete-city-${city.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => handleDeleteCity(city)}
                          className="p-1.5 text-gray-450 hover:text-red-650 hover:bg-red-50/50 rounded-lg cursor-pointer transition-all border border-transparent hover:border-red-100/50"
                          title={`Permanently delete city ${city}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FEATURE 25: PROFILE & MASTER SECURITY --- */}
      {currentTab === "profile" && (
        <div className="animate-fade-in">
          <ProfileSecurityDashboard
            profile={profile}
            setProfile={setProfile}
            triggerToast={triggerToast}
            onLogout={onLogout}
          />
        </div>
      )}

      {/* --- ADD NEW PROMO COUPON VAULT MODAL --- */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden p-6 shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowCouponModal(false)}
              className="absolute right-4 top-4 p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-black text-gray-900">Define Promo Discount Coupon</h3>
            <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs font-semibold text-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Promo Code Name *</label>
                  <input
                    id="coupon-code-input"
                    type="text"
                    required
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    placeholder="e.g. MONSOON30"
                    className="w-full border border-gray-200 rounded-lg p-2 focus:ring-[#E23744] font-black font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Promo Type</label>
                  <select
                    value={newCoupon.type}
                    onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-lg p-2 bg-white"
                  >
                    <option value="percentage">Percentage Discount</option>
                    <option value="flat">Flat Cash Value discount</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Promo Title Heading *</label>
                <input
                  id="coupon-title-input"
                  type="text"
                  required
                  value={newCoupon.title}
                  onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
                  placeholder="e.g. Flat ₹50 on all orders above ₹200"
                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-[#E23744]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Discount Value *</label>
                  <input
                    id="coupon-value"
                    type="number"
                    required
                    value={newCoupon.value || ""}
                    onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    placeholder="30"
                    className="w-full border border-gray-200 rounded-lg p-2 focus:ring-[#E23744]"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Min Order *</label>
                  <input
                    id="coupon-min-val"
                    type="number"
                    required
                    value={newCoupon.minOrderValue || ""}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minOrderValue: Number(e.target.value) })}
                    placeholder="250"
                    className="w-full border border-gray-200 rounded-lg p-2 focus:ring-[#E23744]"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Max Disc (₹)</label>
                  <input
                    id="coupon-max-disc"
                    type="number"
                    value={newCoupon.maxDiscount || ""}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxDiscount: Number(e.target.value) })}
                    placeholder="120"
                    className="w-full border border-gray-200 rounded-lg p-2 focus:ring-[#E23744]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Applicable restaurant</label>
                <select
                  value={newCoupon.restaurantId}
                  onChange={(e) => setNewCoupon({ ...newCoupon, restaurantId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 bg-white"
                >
                  <option value="">All Partner Outlets (Universal)</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#E23744] hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  Publish Promo Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- NOTIFICATION CAMPAIGN DISPATCH MODAL --- */}
      {showComposeSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-xl text-center space-y-4 animate-scale-up">
            <Bell className="w-12 h-12 text-[#E23744] mx-auto animate-bounce" />
            <h3 className="text-sm font-extrabold text-gray-900">Broadcast Transmitted Successfully!</h3>
            <p className="text-xs text-gray-400">Push notification signals have queued in dispatch modules for segment: <strong className="text-gray-800 font-bold">{notifTarget}</strong></p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-1">
              <div className="font-extrabold text-gray-800 text-left">{notifTitle}</div>
              <p className="text-left text-gray-500 leading-relaxed text-[11px]">{notifMessage}</p>
            </div>
            <div>
              <button
                onClick={() => {
                  setShowComposeSuccess(false);
                  setNotifTitle("");
                  setNotifMessage("");
                  setNotifImage(null);
                }}
                className="px-4 py-2 bg-gray-900 text-white hover:bg-slate-900 font-bold text-xs rounded-lg cursor-pointer"
              >
                Return to Broadcast Terminal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD NEW HOME-SCREEN BANNER MODAL --- */}
      {showBannerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowBannerModal(false)}
              className="absolute right-4 top-4 p-1 rounded-full bg-gray-200 hover:bg-gray-200 text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5"><Image className="w-5 h-5 text-red-500" /> Upload Home Banner</h3>
            <form onSubmit={handlePublishBanner} className="space-y-4 text-xs font-semibold text-gray-700">
              <div>
                <label className="block text-gray-500 mb-1">Banner Title Description *</label>
                <input
                  id="banner-title"
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Premium Bakeries - Flat 25% Off"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-[#E23744]"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Redirection target restaurant link</label>
                <select
                  value={bannerTargetRest}
                  onChange={(e) => setBannerTargetRest(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 bg-white focus:ring-[#E23744]"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Banner Cropper Panel Demonstration (Landscape Aspect Ratio)</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden p-3 bg-slate-50 relative h-36 flex items-center justify-center">
                  {bannerAttachedImage ? (
                    <div className="relative w-full h-full">
                      <img referrerPolicy="no-referrer" src={bannerAttachedImage} alt="Attach preview" className="w-full h-full object-cover" />
                      {!cropSimulated ? (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col justify-center items-center text-center">
                          <span className="text-white text-[10px] font-bold mb-1.5">Cropper tool initialized securely</span>
                          <button
                            type="button"
                            onClick={() => {
                              setCropSimulated(true);
                              triggerToast("Cropped Successfully", "Hero aspect ratio cropped 3.8:1.", "success");
                            }}
                            className="bg-[#E23744] hover:bg-red-700 text-white font-bold text-[9px] px-2 py-1 rounded"
                          >
                            Crop Image Area & Save
                          </button>
                        </div>
                      ) : (
                        <div className="absolute right-2 top-2 bg-emerald-600 text-white p-1 rounded-full"><Check className="w-3.5 h-3.5" /></div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400">Loading banner asset preview...</div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={!cropSimulated}
                  className="px-3.5 py-1.5 bg-[#E23744] disabled:opacity-50 hover:bg-red-700 text-white font-bold rounded-lg"
                >
                  Publish CRM Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- GOOGLE AUTHENTICATOR SETUP QR MODAL --- */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl text-center space-y-4 animate-scale-up">
            <Lock className="w-12 h-12 text-[#E23744] mx-auto animate-bounce" />
            <h3 className="text-sm font-black text-gray-900">Setup Two-Factor Authenticator (2FA)</h3>
            <p className="text-xs text-gray-400">Scan this QR code inside Google Authenticator keypads to generate temporary secure passcode keys.</p>
            
            <div className="w-36 h-36 bg-gray-100 border border-gray-200 rounded-lg mx-auto flex items-center justify-center p-2">
              {/* Beautiful Simulated Vector QR code illustration */}
              <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                <rect x="0" y="0" width="20" height="20" />
                <rect x="5" y="5" width="10" height="10" fill="white" />
                <rect x="7" y="7" width="6" height="6" />

                <rect x="80" y="0" width="20" height="20" />
                <rect x="85" y="5" width="10" height="10" fill="white" />
                <rect x="87" y="7" width="6" height="6" />

                <rect x="0" y="80" width="20" height="20" />
                <rect x="5" y="85" width="10" height="10" fill="white" />
                <rect x="7" y="87" width="6" height="6" />

                <rect x="30" y="0" width="10" height="10" />
                <rect x="50" y="10" width="15" height="15" />
                <rect x="40" y="30" width="10" height="20" />
                <rect x="10" y="40" width="15" height="15" />
                <rect x="70" y="40" width="20" height="15" />
                <rect x="80" y="80" width="20" height="20" />
                <rect x="40" y="70" width="15" height="20" />
              </svg>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-mono text-gray-500">
              Manual Config Secret Code Key: <strong className="text-gray-800">GOOGLY ADMIN MASTER B229X</strong>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setShow2FAModal(false);
                  triggerToast("2FA Activated", "Google Authenticator settings linked securely to Head Admin account.", "success");
                }}
                className="w-full py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-lg"
              >
                Confirm Setup Active
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
