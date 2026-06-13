/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import OrderManagementModule from "./OrderManagementModule";
import MenuManagementModule from "./MenuManagementModule";
import RiderManagementModule from "./RiderManagementModule";
import DeliveryDispatchModule from "./DeliveryDispatchModule";
import KitchenDisplaySystemCRM from "./KitchenDisplaySystemCRM";
import { 
  Order, Restaurant, MenuItem, Rider, OrderStatus, 
  RiderStatus, BankDetails 
} from "../types";
import { 
  MapPin, X, Clock, HelpCircle, Phone, User, CheckCircle2, 
  XCircle, Sliders, Play, Settings2, ShieldCheck, Check, MoreVertical, 
  Plus, Upload, Trash2, Edit, AlertCircle, RefreshCw, Layers, Search,
  Eye, ChevronDown, Download, FileText, CheckCircle, ShieldAlert,
  CheckSquare, Square, ChevronLeft, ChevronRight, Lock, Sparkles,
  Building, Landmark, Trash
} from "lucide-react";

interface CoreOperationsProps {
  currentTab: string;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  restaurants: Restaurant[];
  setRestaurants: React.Dispatch<React.SetStateAction<Restaurant[]>>;
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  riders: Rider[];
  setRiders: React.Dispatch<React.SetStateAction<Rider[]>>;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function CoreOperations({
  currentTab,
  orders,
  setOrders,
  restaurants,
  setRestaurants,
  menuItems,
  setMenuItems,
  riders,
  setRiders,
  triggerToast
}: CoreOperationsProps) {

  // --- Order Management State ---
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "All">("All");

  // --- Restaurant Management State ---
  const [showAddRestModal, setShowAddRestModal] = useState(false);
  const [restWizardStep, setRestWizardStep] = useState(1); // Steps: 1, 2, 3, 4, 5 (Review), 6 (Success)
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [generatedRestId, setGeneratedRestId] = useState("");

  const initialFormState = {
    name: "",
    description: "",
    category: "QSR (Quick Service)",
    cuisine: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    latitude: 22.5726,
    longitude: 88.3639,
    operatingHours: "09:00 AM - 11:00 PM",
    deliveryRadius: 5,
    logoUrl: "",
    bannerUrl: "",

    // Step 2
    ownerName: "",
    phone: "",
    ownerAltPhone: "",
    email: "",
    ownerDob: "",
    ownerGender: "Male",
    ownerAddress: "",
    ownerAadhaar: "",
    ownerPan: "",
    ownerPhotoUrl: "",

    // Step 3
    fssaiNumber: "",
    fssaiExpiryDate: "",
    kycDocumentUrl: "", // License
    aadhaarFrontUrl: "",
    aadhaarBackUrl: "",
    panCardUrl: "",
    businessRegUrl: "",
    gstUrl: "",
    addressProofUrl: "",

    // Step 4
    accountNumber: "",
    confirmAccountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    upiId: "",
    cancelledChequeUrl: "",
    commissionPercent: 15
  };

  const [restForm, setRestForm] = useState(initialFormState);

  // OTP simulated state
  const [phoneOtpState, setPhoneOtpState] = useState<"not_sent" | "sending" | "sent" | "verified">("not_sent");
  const [emailOtpState, setEmailOtpState] = useState<"not_sent" | "sending" | "sent" | "verified">("not_sent");
  const [phoneOtpDigits, setPhoneOtpDigits] = useState("");
  const [emailOtpDigits, setEmailOtpDigits] = useState("");

  // Table parameters
  const [restFilter, setRestFilter] = useState<"All" | "Active" | "Inactive" | "Pending" | "Blocked">("All");
  const [restSort, setRestSort] = useState<"Newest" | "Oldest" | "AZ" | "ZA">("Newest");
  const [restSearchQuery, setRestSearchQuery] = useState("");
  const [restPage, setRestPage] = useState(1);
  const restPageSize = 5;

  const [selectedRestIds, setSelectedRestIds] = useState<string[]>([]);
  const [activeRest3Dots, setActiveRest3Dots] = useState<string | null>(null);

  // Action states & modals
  const [viewingDetailsRest, setViewingDetailsRest] = useState<Restaurant | null>(null);
  const [selectedRestDocs, setSelectedRestDocs] = useState<Restaurant | null>(null); // View Documents
  const [verifyingDocsRest, setVerifyingDocsRest] = useState<Restaurant | null>(null); // Verify documents
  const [viewingBankRest, setViewingBankRest] = useState<Restaurant | null>(null); // Bank details modal
  const [revealBankNo, setRevealBankNo] = useState(false);
  const [deletingRest, setDeletingRest] = useState<Restaurant | null>(null); // Delete modal
  const [editingRestId, setEditingRestId] = useState<string | null>(null);

  // --- Menu Management State ---
  const [selectedRestIdMenu, setSelectedRestIdMenu] = useState<string>("rest-1");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: "", description: "", price: 0, isVeg: true, category: "Main Course", addOnsInput: ""
  });

  // --- Rider Management State ---
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [showRiderMap, setShowRiderMap] = useState<Rider | null>(null);
  const [adjustRiderWallet, setAdjustRiderWallet] = useState<Rider | null>(null);
  const [walletAmount, setWalletAmount] = useState<number>(0);
  const [walletReason, setWalletReason] = useState("Bonus incentive reward");

  // --- Dispatch & Route Management State ---
  const [autoAssign, setAutoAssign] = useState(false);
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);

  // --- KDS settings State ---
  const [kdsAutoAccept, setKdsAutoAccept] = useState(true);
  const [kdsVoiceAlerts, setKdsVoiceAlerts] = useState(true);

  // --- Quick Helpers ---
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "00:00";
    }
  };

  // Onboarding wizard handler
  const handleCreateRestaurant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Step navigation is handled directly by form triggers, or review submission
    if (restWizardStep < 5) {
      // Validate mandatory fields for the current step
      if (restWizardStep === 1) {
        if (!restForm.name || !restForm.cuisine || !restForm.address) {
          triggerToast("Validation Alert", "Please fill in Restaurant Name, Cuisines, and Address.", "error");
          return;
        }
      } else if (restWizardStep === 2) {
        if (!restForm.ownerName || !restForm.email || !restForm.phone) {
          triggerToast("Validation Alert", "Please fill in Owner Name, Email, and Phone number.", "error");
          return;
        }
        if (phoneOtpState !== "verified" || emailOtpState !== "verified") {
          triggerToast("OTP Verification Mandatory", "Please perform mobile and email OTP verifications before continuing.", "error");
          return;
        }
      } else if (restWizardStep === 3) {
        if (!restForm.fssaiNumber || !restForm.fssaiExpiryDate) {
          triggerToast("Validation Alert", "FSSAI License Number and Expiry Date are mandatory.", "error");
          return;
        }
        if (!restForm.kycDocumentUrl) {
          triggerToast("Verification Required", "FSSAI License Certificate document upload is mandatory.", "error");
          return;
        }
      } else if (restWizardStep === 4) {
        if (!restForm.accountNumber || !restForm.ifscCode || !restForm.bankName) {
          triggerToast("Validation Alert", "Bank Account Number, IFSC, and Bank Name are required.", "error");
          return;
        }
        if (restForm.accountNumber !== restForm.confirmAccountNumber) {
          triggerToast("Account Match Error", "Account Number and Confirmation do not match.", "error");
          return;
        }
      }
      setRestWizardStep(prev => prev + 1);
      return;
    }

    // Step 5 represents "Final Review & Submit", which transitions to Step 6 (Success)
    const newId = editingRestId || `rest-${Date.now()}`;
    const generatedRegDate = new Date().toISOString().substring(0, 10);

    if (editingRestId) {
      setRestaurants(prev => prev.map(r => {
        if (r.id === editingRestId) {
          return {
            ...r,
            name: restForm.name || r.name,
            cuisine: restForm.cuisine || r.cuisine,
            rating: r.rating || 5.0,
            active: r.active,
            ownerName: restForm.ownerName,
            email: restForm.email,
            phone: restForm.phone,
            fssaiNumber: restForm.fssaiNumber,
            commissionPercent: Number(restForm.commissionPercent) || r.commissionPercent,
            bankDetails: {
              accountNumber: restForm.accountNumber,
              ifscCode: restForm.ifscCode,
              bankName: restForm.bankName,
              branchName: restForm.branchName || "Main Branch"
            },
            kycDocumentUrl: restForm.kycDocumentUrl || r.kycDocumentUrl,
            blocked: r.blocked,

            // New onboarding properties
            logoUrl: restForm.logoUrl || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80",
            bannerUrl: restForm.bannerUrl || "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80",
            description: restForm.description,
            category: restForm.category,
            address: restForm.address,
            city: restForm.city,
            state: restForm.state,
            pinCode: restForm.pinCode,
            latitude: restForm.latitude,
            longitude: restForm.longitude,
            operatingHours: restForm.operatingHours,
            deliveryRadius: Number(restForm.deliveryRadius) || 5,
            fssaiStatus: restForm.fssaiStatus || "Verified",
            fssaiExpiryDate: restForm.fssaiExpiryDate,
            ownerAltPhone: restForm.ownerAltPhone,
            ownerDob: restForm.ownerDob,
            ownerGender: restForm.ownerGender,
            ownerAddress: restForm.ownerAddress,
            ownerAadhaar: restForm.ownerAadhaar,
            ownerPan: restForm.ownerPan,
            ownerPhotoUrl: restForm.ownerPhotoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
            upiId: restForm.upiId,
            cancelledChequeUrl: restForm.cancelledChequeUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
            kycDetails: {
              aadhaarFrontUrl: restForm.aadhaarFrontUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
              aadhaarBackUrl: restForm.aadhaarBackUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
              panCardUrl: restForm.panCardUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
              businessRegUrl: restForm.businessRegUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
              gstUrl: restForm.gstUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
              addressProofUrl: restForm.addressProofUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80"
            }
          };
        }
        return r;
      }));
      setGeneratedRestId(newId);
      triggerToast("Update Finalized", `${restForm.name} updated successfully!`, "success");
      setRestWizardStep(6); // Success step
    } else {
      const newRest: Restaurant = {
        id: newId,
        name: restForm.name || "Unnamed Bistro",
        cuisine: restForm.cuisine || "Multi-cuisine",
        rating: 4.9,
        active: true,
        ownerName: restForm.ownerName,
        email: restForm.email,
        phone: restForm.phone,
        fssaiNumber: restForm.fssaiNumber,
        commissionPercent: Number(restForm.commissionPercent) || 15,
        bankDetails: {
          accountNumber: restForm.accountNumber,
          ifscCode: restForm.ifscCode,
          bankName: restForm.bankName,
          branchName: restForm.branchName || "Park Street Branch"
        },
        kycDocumentUrl: restForm.kycDocumentUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
        blocked: false,

        // Optional custom parameters
        logoUrl: restForm.logoUrl || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80",
        bannerUrl: restForm.bannerUrl || "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80",
        description: restForm.description || "Fresh food prepared daily with organic components.",
        category: restForm.category || "QSR (Quick Service)",
        address: restForm.address || "12B Camac Street",
        city: restForm.city || "Kolkata",
        state: restForm.state || "West Bengal",
        pinCode: restForm.pinCode || "700017",
        latitude: restForm.latitude || 22.5726,
        longitude: restForm.longitude || 88.3639,
        operatingHours: restForm.operatingHours || "09:00 AM - 11:00 PM",
        deliveryRadius: Number(restForm.deliveryRadius) || 5,
        registrationDate: generatedRegDate,
        fssaiStatus: "Pending", // Needs manual document verification in our platform
        fssaiExpiryDate: restForm.fssaiExpiryDate || "2030-12-31",
        ownerAltPhone: restForm.ownerAltPhone,
        ownerDob: restForm.ownerDob || "1988-05-15",
        ownerGender: restForm.ownerGender || "Male",
        ownerAddress: restForm.ownerAddress || "Salt Lake, Sector-1",
        ownerAadhaar: restForm.ownerAadhaar || "4455-8899-2211",
        ownerPan: restForm.ownerPan || "ABCPE8892A",
        ownerPhotoUrl: restForm.ownerPhotoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
        upiId: restForm.upiId || "owner@ybl",
        cancelledChequeUrl: restForm.cancelledChequeUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
        kycDetails: {
          aadhaarFrontUrl: restForm.aadhaarFrontUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
          aadhaarBackUrl: restForm.aadhaarBackUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
          panCardUrl: restForm.panCardUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
          businessRegUrl: restForm.businessRegUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
          gstUrl: restForm.gstUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
          addressProofUrl: restForm.addressProofUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80"
        }
      };

      setRestaurants(prev => [newRest, ...prev]);
      setGeneratedRestId(newId);
      triggerToast("Onboarding Queued", `${newRest.name} onboarding setup is ready! FSSAI is queued daily for audits.`, "success");
      setRestWizardStep(6); // Success screen
    }
  };

  // Cancel order execution
  const executeCancelOrder = () => {
    if (!cancelOrderId) return;
    setOrders(prev => prev.map(o => {
      if (o.id === cancelOrderId) {
        return { ...o, status: "Cancelled", cancelReason: cancelReason || "Cancelled by corporate admin" };
      }
      return o;
    }));
    triggerToast("Order Cancelled", `Order ${cancelOrderId} cancelled safely.`, "error");
    setCancelOrderId(null);
    setCancelReason("");
    if (selectedOrder?.id === cancelOrderId) {
      setSelectedOrder(null);
    }
  };

  // Add Menu Item execution
  const handleAddMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    const addOns = newMenuItem.addOnsInput
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

    const item: MenuItem = {
      id: `menu-${Date.now()}`,
      restaurantId: selectedRestIdMenu,
      name: newMenuItem.name || "Gourmet Platters",
      description: newMenuItem.description,
      price: Number(newMenuItem.price) || 120,
      isVeg: newMenuItem.isVeg,
      category: newMenuItem.category,
      addOns: addOns
    };

    setMenuItems(prev => [...prev, item]);
    triggerToast("Menu Item Added", `${item.name} is now live in ${restaurants.find(r => r.id === selectedRestIdMenu)?.name}`, "success");
    setShowAddItemModal(false);
    setNewMenuItem({ name: "", description: "", price: 0, isVeg: true, category: "Main Course", addOnsInput: "" });
  };

  // Auto assign switch simulation
  useEffect(() => {
    if (autoAssign) {
      // Find all pending orders and assign to any online rider
      const pendingOrders = orders.filter(o => o.status === "Pending");
      const onlineRiders = riders.filter(r => r.status === "Online");

      if (pendingOrders.length > 0 && onlineRiders.length > 0) {
        let assignedCount = 0;
        const updatedOrders = orders.map(o => {
          if (o.status === "Pending" && onlineRiders.length > assignedCount) {
            const assignedRider = onlineRiders[assignedCount];
            assignedCount++;
            return {
              ...o,
              status: "Preparing" as OrderStatus,
              riderId: assignedRider.id,
              riderName: assignedRider.name
            };
          }
          return o;
        });

        const updatedRiders = riders.map(r => {
          const riderAssignedIndex = onlineRiders.findIndex(or => or.id === r.id);
          if (riderAssignedIndex !== -1 && riderAssignedIndex < assignedCount) {
            return { ...r, status: "On-Delivery" as RiderStatus };
          }
          return r;
        });

        setOrders(prev => prev.map(o => {
          const uo = updatedOrders.find(u => u.id === o.id);
          return uo || o;
        }));
        setRiders(prev => prev.map(r => {
          const ur = updatedRiders.find(u => u.id === r.id);
          return ur || r;
        }));
        triggerToast("Auto-Dispatch Engine", `Route optimizer allocated ${assignedCount} orders to idle riders!`, "success");
      }
    }
  }, [autoAssign, orders, riders, setOrders, setRiders, triggerToast]);

  return (
    <div id="core-operations" className="space-y-6">

      {/* --- FEATURE 2 & 7: ORDER MANAGEMENT & TRACKING --- */}
      {currentTab === "orders" && (
        <OrderManagementModule
          orders={orders}
          setOrders={setOrders}
          restaurants={restaurants}
          riders={riders}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 3: RESTAURANT MANAGEMENT --- */}
      {currentTab === "restaurants" && (() => {
        let processed = [...restaurants];

        // 1. Filter
        if (restFilter === "Active") {
          processed = processed.filter(r => r.active && !r.blocked);
        } else if (restFilter === "Inactive") {
          processed = processed.filter(r => !r.active && !r.blocked);
        } else if (restFilter === "Pending") {
          processed = processed.filter(r => !r.blocked && (r.fssaiStatus === "Pending" || r.id === "rest-3"));
        } else if (restFilter === "Blocked") {
          processed = processed.filter(r => r.blocked);
        }

        // 2. Search
        const q = restSearchQuery.trim().toLowerCase();
        if (q) {
          processed = processed.filter(r => 
            r.name.toLowerCase().includes(q) ||
            r.cuisine.toLowerCase().includes(q) ||
            (r.ownerName && r.ownerName.toLowerCase().includes(q)) ||
            (r.fssaiNumber && r.fssaiNumber.toLowerCase().includes(q)) ||
            (r.email && r.email.toLowerCase().includes(q)) ||
            (r.city && r.city.toLowerCase().includes(q)) ||
            (r.phone && r.phone.toLowerCase().includes(q))
          );
        }

        // 3. Sort
        if (restSort === "Newest") {
          processed.sort((a, b) => b.id.localeCompare(a.id));
        } else if (restSort === "Oldest") {
          processed.sort((a, b) => a.id.localeCompare(b.id));
        } else if (restSort === "AZ") {
          processed.sort((a, b) => a.name.localeCompare(b.name));
        } else if (restSort === "ZA") {
          processed.sort((a, b) => b.name.localeCompare(a.name));
        }

        // 4. Pagination
        const totalItems = processed.length;
        const totalPages = Math.ceil(totalItems / restPageSize) || 1;
        
        // Reset page if bounds exceeded
        const currentPage = Math.min(restPage, totalPages);
        const startIndex = (currentPage - 1) * restPageSize;
        const paginatedItems = processed.slice(startIndex, startIndex + restPageSize);

        const allPaginatedIds = paginatedItems.map(r => r.id);
        const isAllSelected = allPaginatedIds.length > 0 && allPaginatedIds.every(id => selectedRestIds.includes(id));
        
        const toggleAll = () => {
          if (isAllSelected) {
            setSelectedRestIds(prev => prev.filter(id => !allPaginatedIds.includes(id)));
          } else {
            setSelectedRestIds(prev => Array.from(new Set([...prev, ...allPaginatedIds])));
          }
        };

        const toggleOne = (id: string) => {
          if (selectedRestIds.includes(id)) {
            setSelectedRestIds(prev => prev.filter(item => item !== id));
          } else {
            setSelectedRestIds(prev => [...prev, id]);
          }
        };

        const handleBulkActivate = () => {
          if (selectedRestIds.length === 0) return;
          setRestaurants(prev => prev.map(r => selectedRestIds.includes(r.id) ? { ...r, active: true, blocked: false } : r));
          triggerToast("Bulk Action Succeed", `Activated details for ${selectedRestIds.length} partners!`, "success");
          setSelectedRestIds([]);
        };

        const handleBulkDeactivate = () => {
          if (selectedRestIds.length === 0) return;
          setRestaurants(prev => prev.map(r => selectedRestIds.includes(r.id) ? { ...r, active: false } : r));
          triggerToast("Bulk Action Succeed", `Deactivated details for ${selectedRestIds.length} partners.`, "info");
          setSelectedRestIds([]);
        };

        const handleExportDataDirectly = (format: "CSV" | "PDF") => {
          triggerToast("Generating Export Report", `Bundling records to ${format} download format...`, "info");
          setTimeout(() => {
            let fileContent = "";
            let fileName = `googly_restaurants_report_${new Date().toISOString().slice(0, 10)}`;
            let mimeType = "text/csv;charset=utf-8;";

            if (format === "CSV") {
              fileContent = "Restaurant ID,Restaurant Name,Cuisine,Rating,Active,Owner,Email,Phone,FSSAI,Commission Percent,Location,Registration Date\n" +
                restaurants.map(r => {
                  const cityLoc = r.city || r.bankDetails?.branchName?.split(",")[1]?.trim() || "Kolkata";
                  const regDate = r.registrationDate || "2026-05-10";
                  return `"${r.id}","${r.name}","${r.cuisine}",${r.rating},${r.active},"${r.ownerName}","${r.email}","${r.phone}","${r.fssaiNumber}",${r.commissionPercent},"${cityLoc}","${regDate}"`;
                }).join("\n");
              fileName += ".csv";
            } else {
              fileContent = "========================================================\n" +
                "     GOOGLY ENTERPRISE RESTAURANT AUDIT COMPLIANCE      \n" +
                "========================================================\n" +
                `Generated At: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n` +
                `Total Onboarded Partners: ${restaurants.length}\n\n` +
                restaurants.map((r, idx) => {
                  const cityLoc = r.city || r.bankDetails?.branchName?.split(",")[1]?.trim() || "Kolkata";
                  const regDate = r.registrationDate || "2026-05-10";
                  return `${idx + 1}. [${r.id}] ${r.name}\n` +
                    `   Category: ${r.category || "Fine Dining"} | Cuisine: ${r.cuisine}\n` +
                    `   Owner: ${r.ownerName} | Email: ${r.email} | Phone: ${r.phone}\n` +
                    `   Location: ${cityLoc} | Registered: ${regDate}\n` +
                    `   FSSAI License: ${r.fssaiNumber} | Expiry: ${r.fssaiExpiryDate || "2030-12-31"} | Status: ${r.fssaiStatus || "Verified"}\n` +
                    `   Commission Charge: ${r.commissionPercent}% | Active Status: ${r.active ? "ONLINE" : "OFFLINE"} | Blocked State: ${r.blocked ? "BLOCKED" : "UNBLOCKED"}\n` +
                    `   Bank: ${r.bankDetails?.bankName} (IFSC: ${r.bankDetails?.ifscCode}) Acct: ${r.bankDetails?.accountNumber}`;
                }).join("\n\n--------------------------------------------------------\n\n");
              fileName += ".pdf.txt";
              mimeType = "text/plain;charset=utf-8;";
            }

            const blob = new Blob([fileContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            triggerToast("Report Downloaded", `Export downloaded successfully: ${fileName}`, "success");
          }, 1000);
        };

        return (
          <div className="space-y-6 animate-fade-in pb-12">
            {/* Enterprise Quick Stats Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-red-50 text-[#E23744] rounded-xl">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Onboarded</div>
                  <div className="text-2xl font-black text-gray-800">{restaurants.length}</div>
                  <div className="text-[10px] text-gray-500 font-medium">All registered partners</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Partners</div>
                  <div className="text-2xl font-black text-gray-800">
                    {restaurants.filter(r => r.active && !r.blocked).length}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">● Online & Receiving Orders</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending Verification</div>
                  <div className="text-2xl font-black text-gray-800">
                    {restaurants.filter(r => r.fssaiStatus === "Pending" || r.id === "rest-3").length}
                  </div>
                  <div className="text-[10px] text-amber-600 font-semibold">Compliances Queued</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
                <div className="p-3 bg-[#1C1C1C] text-white rounded-xl">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Suspended/Blocked</div>
                  <div className="text-2xl font-black text-gray-800">
                    {restaurants.filter(r => r.blocked).length}
                  </div>
                  <div className="text-[10px] text-red-500 font-semibold">Strict Violations</div>
                </div>
              </div>
            </div>

            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1C1C1C] text-white p-6 rounded-2xl shadow-sm gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  Restaurant Management <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Enterprise Hub</span>
                </h2>
                <p className="text-xs text-gray-300 mt-1">Manage, onboard, verify compliances, and monitor all restaurant partners globally.</p>
              </div>
              <button
                id="add-restaurant-btn"
                onClick={() => {
                  setEditingRestId(null);
                  setRestWizardStep(1);
                  setRestForm(initialFormState);
                  setPhoneOtpState("not_sent");
                  setEmailOtpState("not_sent");
                  setPhoneOtpDigits("");
                  setEmailOtpDigits("");
                  setShowAddRestModal(true);
                }}
                className="px-5 py-2.5 bg-[#E23744] hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md select-none hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4 text-white" /> Add New Restaurant
              </button>
            </div>

            {/* Filters, search, bulk action and exports container */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                
                {/* Search */}
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="restaurant-search-input"
                    type="text"
                    value={restSearchQuery}
                    onChange={(e) => {
                      setRestSearchQuery(e.target.value);
                      setRestPage(1);
                    }}
                    placeholder="Search restaurant, cuisine, FSSAI badge, owner, city..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-xs border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#E23744] focus:border-[#E23744] focus:outline-hidden text-gray-800 placeholder-gray-400"
                  />
                </div>

                {/* Sorting and Exports */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2 border border-gray-200 rounded-xl">
                    <Sliders className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] text-gray-400 font-bold">Sort:</span>
                    <select
                      value={restSort}
                      onChange={(e) => {
                        setRestSort(e.target.value as any);
                        setRestPage(1);
                      }}
                      className="bg-transparent text-[11px] font-bold text-gray-700 focus:outline-hidden cursor-pointer"
                    >
                      <option value="Newest">Newest First</option>
                      <option value="Oldest">Oldest First</option>
                      <option value="AZ">Name A-Z</option>
                      <option value="ZA">Name Z-A</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleExportDataDirectly("CSV")}
                    className="px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Export all database to CSV"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>

                  <button
                    onClick={() => handleExportDataDirectly("PDF")}
                    className="px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Print PDF audit report"
                  >
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </div>

              {/* Advanced Filter options tab selectors */}
              <div className="flex items-center overflow-x-auto border-b border-gray-100 pb-2.5 gap-2 scrollbar-none">
                {[
                  { key: "All", label: "All Restaurants", count: restaurants.length },
                  { key: "Active", label: "Active Restaurants", count: restaurants.filter(r => r.active && !r.blocked).length },
                  { key: "Inactive", label: "Inactive Restaurants", count: restaurants.filter(r => !r.active && !r.blocked).length },
                  { key: "Pending", label: "Pending Verification", count: restaurants.filter(r => !r.blocked && (r.fssaiStatus === "Pending" || r.id === "rest-3")).length },
                  { key: "Blocked", label: "Blocked Restaurants", count: restaurants.filter(r => r.blocked).length }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setRestFilter(item.key as any);
                      setRestPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      restFilter === item.key
                        ? "bg-[#E23744]/10 text-[#E23744]"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                      restFilter === item.key ? "bg-[#E23744] text-white" : "bg-gray-100 text-gray-400"
                    }`}>{item.count}</span>
                  </button>
                ))}
              </div>

              {/* Bulk actions status panel */}
              {selectedRestIds.length > 0 && (
                <div className="bg-red-50/50 border border-red-100 p-3.5 rounded-xl flex items-center justify-between animate-fade-in">
                  <div className="text-xs text-gray-700 font-semibold">
                    <span className="font-bold text-[#E23744]">{selectedRestIds.length}</span> restaurants selected for bulk action
                  </div>
                  <div className="flex gap-2.5">
                    <button
                      onClick={handleBulkActivate}
                      className="px-3.5 py-1.5 bg-[#E23744] text-white hover:bg-red-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle className="w-3 h-3" /> Bulk Activate
                    </button>
                    <button
                      onClick={handleBulkDeactivate}
                      className="px-3.5 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3" /> Bulk Deactivate
                    </button>
                    <button
                      onClick={() => setSelectedRestIds([])}
                      className="text-xs text-gray-400 hover:text-gray-600 font-bold px-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dashboard List Table view card component */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                {paginatedItems.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-100 text-xs text-gray-400 font-bold uppercase tracking-wider">
                        <th scope="col" className="p-4 w-12 text-center">
                          <button
                            onClick={toggleAll}
                            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-hidden"
                          >
                            {isAllSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#E23744]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th scope="col" className="p-4">Restaurant</th>
                        <th scope="col" className="p-4">Owner Profile</th>
                        <th scope="col" className="p-4">City/Location</th>
                        <th scope="col" className="p-4">Verification Compliance</th>
                        <th scope="col" className="p-4">Status & Action State</th>
                        <th scope="col" className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                      {paginatedItems.map(rest => {
                        const verifiedLogo = rest.logoUrl || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80";
                        const cityVal = rest.city || rest.bankDetails?.branchName?.split(",")[1]?.trim() || "Kolkata";
                        const registerDateStr = rest.registrationDate || "2026-05-10";
                        const complianceStatus: "Verified" | "Pending" | "Rejected" | "Suspended" = 
                          rest.fssaiStatus || (rest.id === "rest-3" ? "Pending" : "Verified");

                        // Colors indicating verification compliance status
                        const getComplianceBadge = (status: typeof complianceStatus) => {
                          switch (status) {
                            case "Verified":
                              return <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold rounded-lg uppercase text-[9px]">✔ Verified</span>;
                            case "Pending":
                              return <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 font-bold rounded-lg uppercase text-[9px] animate-pulse">⏰ Pending Audits</span>;
                            case "Rejected":
                              return <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-100 font-bold rounded-lg uppercase text-[9px]">❌ Audits Failed</span>;
                            case "Suspended":
                            default:
                              return <span className="px-2 py-1 bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-lg uppercase text-[9px]">🚫 Suspended</span>;
                          }
                        };

                        // Colors indicating system status badge (Active (green), Pending check (yellow), Blocked (red/yellow))
                        const isMainActiveState = rest.active && !rest.blocked && complianceStatus !== "Pending";

                        return (
                          <tr key={rest.id} className="hover:bg-gray-50/75 transition-colors">
                            <td className="p-4 text-center">
                              <button
                                onClick={() => toggleOne(rest.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-hidden"
                              >
                                {selectedRestIds.includes(rest.id) ? (
                                  <CheckSquare className="w-4 h-4 text-[#E23744]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            {/* Logo + Name */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={verifiedLogo}
                                  alt={rest.name}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-xl object-cover border border-gray-200 bg-gray-50"
                                />
                                <div>
                                  <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                    {rest.name}
                                    {rest.blocked && (
                                      <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-black uppercase">Blocked</span>
                                    )}
                                  </div>
                                  <div className="text-gray-500 text-xs font-semibold">{rest.cuisine}</div>
                                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-medium">
                                    <span className="text-amber-500 font-bold">★ {rest.rating}</span>
                                    <span>•</span>
                                    <span>Category: <span className="font-semibold text-gray-500">{rest.category || "QSR"}</span></span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Owner */}
                            <td className="p-4">
                              <div className="font-bold text-gray-800">{rest.ownerName}</div>
                              <div className="text-gray-500 text-[10px]">{rest.email}</div>
                              <div className="text-gray-400 font-mono text-[10px] mt-0.5">{rest.phone}</div>
                            </td>

                            {/* City/Location */}
                            <td className="p-4">
                              <div className="font-bold text-gray-800">{cityVal}</div>
                              <div className="text-[10px] text-gray-400 mt-1">
                                Reg Date: <span className="font-bold text-gray-500">{registerDateStr}</span>
                              </div>
                            </td>

                            {/* Compliance */}
                            <td className="p-4">
                              <div className="space-y-1">
                                <div>{getComplianceBadge(complianceStatus)}</div>
                                <div className="text-[9px] font-mono text-gray-400">FSSAI: {rest.fssaiNumber}</div>
                              </div>
                            </td>

                            {/* Status and Active/Inactive Toggle */}
                            <td className="p-4">
                              <div className="flex items-center gap-4">
                                <div className="space-y-1">
                                  {/* Color Badges based on specific status indicators: Green (Active), Yellow (Pending), Red (Blocked/Inactive) */}
                                  {rest.blocked ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-600" /> Blocked
                                    </span>
                                  ) : complianceStatus === "Pending" ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> Pending
                                    </span>
                                  ) : rest.active ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Inactive
                                    </span>
                                  )}
                                  <div className="text-[9px] text-[#E23744] font-bold bg-red-50/40 px-1 border border-red-50/50 rounded w-max">
                                    {rest.commissionPercent}% charge
                                  </div>
                                </div>

                                <button
                                  id={`toggle-rest-active-${rest.id}`}
                                  onClick={() => {
                                    if (rest.blocked) {
                                      triggerToast("Vendor Suspended", "This merchant is currently suspended. Lift the block from the actions menu first.", "error");
                                      return;
                                    }
                                    setRestaurants(prev => prev.map(r => r.id === rest.id ? { ...r, active: !r.active } : r));
                                    triggerToast("State Changed", `${rest.name} is now ${!rest.active ? "ONLINE" : "OFFLINE"}`, "info");
                                  }}
                                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                                    rest.active && !rest.blocked ? "bg-[#E23744] justify-end" : "bg-gray-200 justify-start"
                                  }`}
                                  title="Toggle active status"
                                >
                                  <span className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                                </button>
                              </div>
                            </td>

                            {/* Actions menu */}
                            <td className="p-4 text-center">
                              <div className="relative inline-block text-left">
                                <button
                                  id={`dots-menu-rest-${rest.id}`}
                                  onClick={() => setActiveRest3Dots(activeRest3Dots === rest.id ? null : rest.id)}
                                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 focus:outline-hidden"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                
                                {activeRest3Dots === rest.id && (
                                  <div className="origin-top-right absolute right-0 mt-1.5 w-52 rounded-xl shadow-lg bg-white border border-gray-100 ring-1 ring-black/5 z-50 py-1.5">
                                    <div className="text-[10px] text-gray-400 px-3 py-1 border-b border-gray-50 font-bold uppercase tracking-wider mb-1">
                                      Compliance Console
                                    </div>

                                    {/* Action items */}
                                    <button
                                      onClick={() => {
                                        setActiveRest3Dots(null);
                                        setViewingDetailsRest(rest);
                                      }}
                                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-500" /> View Restaurant Details
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveRest3Dots(null);
                                        setEditingRestId(rest.id);
                                        setRestWizardStep(1);
                                        
                                        const cityValue = rest.city || rest.bankDetails?.branchName?.split(",")[1]?.trim() || "Kolkata";
                                        const regDStr = rest.registrationDate || "2026-05-10";

                                        setRestForm({
                                          name: rest.name,
                                          description: rest.description || "Fresh food prepared daily with organic components.",
                                          category: rest.category || "QSR (Quick Service)",
                                          cuisine: rest.cuisine,
                                          address: rest.address || "12B Camac Street",
                                          city: cityValue,
                                          state: rest.state || "West Bengal",
                                          pinCode: rest.pinCode || "700017",
                                          latitude: rest.latitude || 22.5726,
                                          longitude: rest.longitude || 88.3639,
                                          operatingHours: rest.operatingHours || "09:00 AM - 11:00 PM",
                                          deliveryRadius: rest.deliveryRadius || 5,
                                          logoUrl: rest.logoUrl || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80",
                                          bannerUrl: rest.bannerUrl || "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80",
                                          ownerName: rest.ownerName || "",
                                          phone: rest.phone || "",
                                          ownerAltPhone: rest.ownerAltPhone || "+91 98834 22001",
                                          email: rest.email || "",
                                          ownerDob: rest.ownerDob || "1988-05-15",
                                          ownerGender: rest.ownerGender || "Male",
                                          ownerAddress: rest.ownerAddress || "Salt Lake, Sector-1",
                                          ownerAadhaar: rest.ownerAadhaar || "4455-8899-2211",
                                          ownerPan: rest.ownerPan || "ABCPE8892A",
                                          ownerPhotoUrl: rest.ownerPhotoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
                                          fssaiNumber: rest.fssaiNumber || "",
                                          fssaiExpiryDate: rest.fssaiExpiryDate || "2030-12-31",
                                          kycDocumentUrl: rest.kycDocumentUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
                                          aadhaarFrontUrl: rest.kycDetails?.aadhaarFrontUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
                                          aadhaarBackUrl: rest.kycDetails?.aadhaarBackUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
                                          panCardUrl: rest.kycDetails?.panCardUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
                                          businessRegUrl: rest.kycDetails?.businessRegUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
                                          gstUrl: rest.kycDetails?.gstUrl || "",
                                          addressProofUrl: rest.kycDetails?.addressProofUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
                                          accountNumber: rest.bankDetails?.accountNumber || "",
                                          confirmAccountNumber: rest.bankDetails?.accountNumber || "",
                                          ifscCode: rest.bankDetails?.ifscCode || "",
                                          bankName: rest.bankDetails?.bankName || "",
                                          branchName: rest.bankDetails?.branchName || "",
                                          upiId: rest.upiId || "owner@ybl",
                                          cancelledChequeUrl: rest.cancelledChequeUrl || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&q=80",
                                          commissionPercent: rest.commissionPercent
                                        });

                                        setPhoneOtpState("verified");
                                        setEmailOtpState("verified");
                                        setShowAddRestModal(true);
                                        triggerToast("Edit Mode", `Preparing configuration wizard for ${rest.name}`, "info");
                                      }}
                                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-[#E23744]" /> Edit Restaurant
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveRest3Dots(null);
                                        setSelectedRestDocs(rest);
                                      }}
                                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-purple-500" /> View Documents
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveRest3Dots(null);
                                        setVerifyingDocsRest(rest);
                                      }}
                                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Verify Documents
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveRest3Dots(null);
                                        setViewingBankRest(rest);
                                      }}
                                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer font-bold"
                                    >
                                      <Landmark className="w-3.5 h-3.5 text-emerald-500" /> View Bank Details
                                    </button>

                                    <div className="border-t border-gray-50 my-1"></div>

                                    {rest.blocked ? (
                                      <button
                                        onClick={() => {
                                          setActiveRest3Dots(null);
                                          setRestaurants(prev => prev.map(r => r.id === rest.id ? { ...r, blocked: false, active: true } : r));
                                          triggerToast("Active Restored", `${rest.name} suspension has been successfully lifted.`, "success");
                                        }}
                                        className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-emerald-600 flex items-center gap-2 cursor-pointer font-bold"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" /> Activate Restaurant
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setActiveRest3Dots(null);
                                          setRestaurants(prev => prev.map(r => r.id === rest.id ? { ...r, blocked: true, active: false } : r));
                                          triggerToast("Vendor Suspended", `${rest.name} has been suspended indefinitely.`, "error");
                                        }}
                                        className="w-full text-left px-3 py-2 text-[11px] hover:bg-gray-50 text-amber-600 flex items-center gap-2 cursor-pointer font-bold"
                                      >
                                        <AlertCircle className="w-3.5 h-3.5" /> Suspend/Block Restaurant
                                      </button>
                                    )}

                                    {/* Delete Button */}
                                    <button
                                      onClick={() => {
                                        setActiveRest3Dots(null);
                                        setDeletingRest(rest);
                                      }}
                                      className="w-full text-left px-3 py-2 text-[11px] hover:bg-red-50 text-red-700 flex items-center gap-2 cursor-pointer font-bold"
                                    >
                                      <Trash className="w-3.5 h-3.5" /> Delete Restaurant
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-20 text-gray-400 space-y-3 bg-white">
                    <Search className="w-12 h-12 mx-auto text-gray-200" />
                    <p className="text-sm font-bold text-gray-800">No matching restaurants found</p>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">No registry matches "{restSearchQuery}" within "${restFilter}" filters. Try broadening your query parameters.</p>
                    <button
                      onClick={() => { setRestSearchQuery(""); setRestFilter("All"); }}
                      className="px-4 py-2 mt-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Dynamic Interactive Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                  <div className="text-gray-500 font-medium">
                    Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to{" "}
                    <span className="font-bold text-gray-800">
                      {Math.min(startIndex + restPageSize, totalItems)}
                    </span>{" "}
                    of <span className="font-bold text-gray-800">{totalItems}</span> compliance profiles
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setRestPage(prev => Math.max(prev - 1, 1))}
                      className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-50 text-gray-600 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setRestPage(pageNum)}
                        className={`w-8 h-8 rounded-lg font-bold transition-all border flex items-center justify-center cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-[#E23744] text-white border-[#E23744]"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setRestPage(prev => Math.min(prev + 1, totalPages))}
                      className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-50 text-gray-600 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* --- FEATURE 4: MENU MANAGEMENT --- */}
      {currentTab === "menu" && (
        <MenuManagementModule
          restaurants={restaurants}
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 5: DELIVERY PARTNER MANAGEMENT --- */}
      {currentTab === "riders" && (
        <RiderManagementModule
          riders={riders}
          setRiders={setRiders}
          orders={orders}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 7: DELIVERY ROUTE DISPATCH MAP --- */}
      {currentTab === "dispatch" && (
        <DeliveryDispatchModule
          orders={orders}
          setOrders={setOrders}
          riders={riders}
          setRiders={setRiders}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 14: KITCHEN DISPLAY SYSTEM (KDS) INTEGRATION SETTINGS --- */}
      {currentTab === "kds" && (
        <KitchenDisplaySystemCRM
          restaurants={restaurants}
          triggerToast={triggerToast}
        />
      )}

      {/* --- ADD NEW RESTAURANT MODAL --- */}
      {showAddRestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl my-8 overflow-hidden animate-slide-in flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[#1C1C1C] text-white p-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#E23744] text-white rounded-xl">
                  <Building className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight flex items-center gap-1.5 font-sans">
                    {editingRestId ? "Secure Profile Update" : "Merchant Onboarding Wizard"}
                    <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-sm">COMPLIANT V2</span>
                  </h3>
                  <p className="text-[11px] text-gray-300 font-sans">
                    {restWizardStep === 6 
                      ? "Process Completed Successfully" 
                      : `Step ${restWizardStep} of 5 - ${
                          restWizardStep === 1 ? "Establish Trade Profile" :
                          restWizardStep === 2 ? "Merchant Identity Verification" :
                          restWizardStep === 3 ? "Government KYC Compliances" :
                          restWizardStep === 4 ? "Payout Ledger Configuration" :
                          "Aesthetic Verification Audit"
                        }`
                    }
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddRestModal(false)}
                className="text-gray-400 hover:text-white p-1.5 bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Micro Tracker Step Progress */}
            {restWizardStep <= 5 && (
              <div className="bg-gray-50 border-b border-gray-100 p-4 shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Audit Pipeline Progress</span>
                  <span className="text-xs font-black text-[#E23744]">
                    {Math.round((restWizardStep / 5) * 100)}% Complete
                  </span>
                </div>
                <div className="flex gap-2 h-1.5">
                  {[1, 2, 3, 4, 5].map(step => (
                    <div 
                      key={step}
                      onClick={() => {
                        if (step < restWizardStep) setRestWizardStep(step);
                      }}
                      className={`flex-1 rounded-full transition-all duration-300 cursor-pointer ${
                        restWizardStep >= step 
                          ? "bg-[#E23744]" 
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      title={`Navigate to Step ${step}`}
                    ></div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Form Scrolling Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <form onSubmit={handleCreateRestaurant} className="space-y-6">
                
                {/* STEP 1: BASIC TRADE DETAILS */}
                
                    <input 
                      type="file" 
                      id="global-file-upload" 
                      className="hidden" 
                      onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                            // Find which field we are uploading to based on (window as any).uploadTarget
                            const target = (window as any).uploadTarget || "kycDocumentUrl";
                            const url = URL.createObjectURL(file);
                            setRestForm(prev => ({ ...prev, [target]: url }));
                            triggerToast("File Added", file.name + " securely attached.", "success");
                         }
                      }} 
                    />

                {restWizardStep === 1 && (
                  <div className="space-y-5 animate-fade-in text-xs text-gray-700">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Sparkles className="w-4 h-4 text-[#E23744]" />
                      <span className="text-sm font-bold text-gray-800">Trade Configuration & Brand Assets</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Restaurant Trade Name *</label>
                        <input
                          type="text"
                          required
                          value={restForm.name}
                          onChange={(e) => setRestForm({ ...restForm, name: e.target.value })}
                          placeholder="e.g. Swadh Bengal Gourmet"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:border-[#E23744] focus:outline-hidden text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Cuisines Offered (Commas) *</label>
                        <input
                          type="text"
                          required
                          value={restForm.cuisine}
                          onChange={(e) => setRestForm({ ...restForm, cuisine: e.target.value })}
                          placeholder="e.g. Bengali, Seafood, Desserts"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:border-[#E23744] focus:outline-hidden text-gray-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 font-bold mb-1">Merchant Public Description</label>
                      <textarea
                        rows={2}
                        value={restForm.description}
                        onChange={(e) => setRestForm({ ...restForm, description: e.target.value })}
                        placeholder="Provide details about culinary style, history, ambient context..."
                        className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:border-[#E23744] focus:outline-hidden text-gray-800"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Establishment Category</label>
                        <select
                          value={restForm.category}
                          onChange={(e) => setRestForm({ ...restForm, category: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden bg-white text-gray-800"
                        >
                          <option value="Fine Dining">Fine Dining (Gold Badge)</option>
                          <option value="QSR (Quick Service)">QSR (Fast Food Cafe)</option>
                          <option value="Family Restaurant">Casual Dining / Bistro</option>
                          <option value="Bakery & Desserts">Patisserie & Bakery</option>
                          <option value="Cloud Kitchen">Cloud Kitchen Hub</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Operating Hours Schedule *</label>
                        <input
                          type="text"
                          required
                          value={restForm.operatingHours}
                          onChange={(e) => setRestForm({ ...restForm, operatingHours: e.target.value })}
                          placeholder="09:00 AM - 11:30 PM"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:border-[#E23744] focus:outline-hidden text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Service Delivery Radius (km) *</label>
                        <div className="flex items-center gap-2.5 mt-2">
                          <input
                            type="range"
                            min="1"
                            max="15"
                            value={restForm.deliveryRadius}
                            onChange={(e) => setRestForm({ ...restForm, deliveryRadius: Number(e.target.value) })}
                            className="flex-1 accent-[#E23744]"
                          />
                          <span className="font-bold text-[#E23744] border border-red-100 bg-red-50/50 px-2 py-0.5 rounded text-[11px] shrink-0">
                            {restForm.deliveryRadius} km
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Geolocation Map simulation */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                      <div className="font-bold text-gray-800 text-xs flex justify-between items-center">
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#E23744]" /> Geographic Fleet Delivery Bounds</span>
                        <span className="text-[10px] text-gray-400">Map coordinate simulator enabled</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-gray-800">
                        <div className="sm:col-span-2">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="block text-[10px] text-gray-400 font-bold">Physical Store Address *</label>
                            <button 
                              type="button" 
                              onClick={() => {
                                triggerToast("Fetching GPS Coordinates...", "Connecting to OpenStreetMap Location Services", "info");
                                setTimeout(() => {
                                   setRestForm(prev => ({ 
                                      ...prev, 
                                      address: "Global Infotech Park, Tower C, Kolkata",
                                      city: "Kolkata",
                                      state: "West Bengal",
                                      pinCode: "700091" 
                                   }));
                                   triggerToast("Location Detected", "Coordinates successfully established via Browser API.", "success");
                                }, 1500);
                              }}
                              className="text-[9px] font-black text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" /> Auto-Fetch Location
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            value={restForm.address}
                            onChange={(e) => setRestForm({ ...restForm, address: e.target.value })}
                            placeholder="e.g. 12B Camac Street, Circular Plaza"
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#E23744]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-0.5">City Location *</label>
                          <input
                            type="text"
                            required
                            value={restForm.city}
                            onChange={(e) => setRestForm({ ...restForm, city: e.target.value })}
                            placeholder="Kolkata"
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#E23744]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold mb-0.5">ZIP Code *</label>
                          <input
                            type="text"
                            required
                            value={restForm.pinCode}
                            onChange={(e) => setRestForm({ ...restForm, pinCode: e.target.value })}
                            placeholder="700017"
                            className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#E23744]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-gray-200 text-[10px]">
                        <div>
                          <span className="text-gray-400 font-bold">Latitude Coordinate Pin:</span>
                          <input 
                            type="number" 
                            step="0.0001" 
                            value={restForm.latitude} 
                            onChange={(e) => setRestForm({ ...restForm, latitude: Number(e.target.value) })}
                            className="w-full mt-0.5 font-mono text-gray-600 bg-gray-50 border-0 p-1 rounded focus:ring-0" 
                          />
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold">Longitude Coordinate Pin:</span>
                          <input 
                            type="number" 
                            step="0.0001" 
                            value={restForm.longitude} 
                            onChange={(e) => setRestForm({ ...restForm, longitude: Number(e.target.value) })}
                            className="w-full mt-0.5 font-mono text-gray-600 bg-gray-50 border-0 p-1 rounded focus:ring-0" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo and Banner upload zones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800">
                      {/* Logo Zone */}
                      <div className="border border-gray-200 p-4 rounded-2xl bg-white space-y-3">
                        <span className="font-bold text-gray-800 text-xs block">Brand Launcher Icon (Logo)</span>
                        <div 
                          onClick={() => { (window as any).uploadTarget = "logoUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, logoUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80" }));
                            triggerToast("Asset Injected", "Merchant brand launcher logo successfully mapped!", "info");
                          }}
                          className="border-2 border-dashed border-gray-200 hover:border-[#E23744] hover:bg-red-50/10 p-5 rounded-xl text-center cursor-pointer transition-all"
                        >
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                          <span className="text-[10px] font-black text-[#E23744]">Drop Square Logo Icon</span>
                          <p className="text-[9px] text-gray-400 mt-0.5">Click to mock upload standard dimensions</p>
                        </div>
                        {restForm.logoUrl && (
                          <div className="flex items-center justify-between gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-[10px] font-semibold border border-emerald-100 font-sans">
    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 shrink-0" />
   <div className="flex items-center gap-2">
     <img src={restForm.logoUrl} alt="Logo" className="w-6 h-6 object-cover rounded shadow-sm bg-white" />
     <span>Selected Logo Active</span>
   </div></div>
    <button type="button" onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({...prev, logoUrl: ""})); triggerToast("Deleted", "Logo image removed", "info"); }} className="text-rose-500 hover:text-rose-700 px-2 py-0.5 border border-rose-300 rounded cursor-pointer">Delete</button>
  </div>
                        )}
                      </div>

                      {/* Banner Zone */}
                      <div className="border border-gray-200 p-4 rounded-2xl bg-white space-y-3">
                        <span className="font-bold text-gray-800 text-xs block">Public Splash Banner</span>
                        <div 
                          onClick={() => { (window as any).uploadTarget = "bannerUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, bannerUrl: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80" }));
                            triggerToast("Asset Injected", "Restaurant promo marketing banner successfully mapped!", "info");
                          }}
                          className="border-2 border-dashed border-gray-200 hover:border-[#E23744] hover:bg-red-50/10 p-5 rounded-xl text-center cursor-pointer transition-all"
                        >
                          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                          <span className="text-[10px] font-black text-[#E23744]">Drop Landscape Wide Aspect Banner</span>
                          <p className="text-[9px] text-gray-400 mt-0.5">Click to mock upload high-resolution cover</p>
                        </div>
                        {restForm.bannerUrl && (
                          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-[10px] font-semibold border border-emerald-100 font-sans">
                            <Check className="w-3.5 h-3.5 shrink-0" /> Wide Banner Active Mock
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: MERCHANT IDENTITY & OTP VALIDATIONS */}
                {restWizardStep === 2 && (
                  <div className="space-y-4 animate-fade-in text-xs text-gray-700">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <User className="w-4 h-4 text-[#E23744]" />
                      <span className="text-sm font-bold text-gray-800">Merchant Ownership Identity & Verification</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Corporate Owner Full Name *</label>
                        <input
                          type="text"
                          required
                          value={restForm.ownerName}
                          onChange={(e) => setRestForm({ ...restForm, ownerName: e.target.value })}
                          placeholder="e.g. Joydeep Sen"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Residential Address *</label>
                        <input
                          type="text"
                          required
                          value={restForm.ownerAddress}
                          onChange={(e) => setRestForm({ ...restForm, ownerAddress: e.target.value })}
                          placeholder="State Circle Road, Block D, Kolkata"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden text-gray-800"
                        />
                      </div>
                    </div>

                    {/* DOB & Gender */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Date of Birth *</label>
                        <input
                          type="date"
                          required
                          value={restForm.ownerDob}
                          onChange={(e) => setRestForm({ ...restForm, ownerDob: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden bg-white text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Gender *</label>
                        <select
                          value={restForm.ownerGender}
                          onChange={(e) => setRestForm({ ...restForm, ownerGender: e.target.value })}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden bg-white text-gray-800"
                        >
                          <option value="Male bg-white">Male</option>
                          <option value="Female bg-white">Female</option>
                          <option value="Other bg-white">Other / Non-Binary</option>
                        </select>
                      </div>
                    </div>

                    {/* Identification Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Aadhaar Card Number *</label>
                        <input
                          type="text"
                          required
                          value={restForm.ownerAadhaar}
                          onChange={(e) => setRestForm({ ...restForm, ownerAadhaar: e.target.value })}
                          placeholder="e.g. 4455-8899-2211"
                          maxLength={14}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden font-mono text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Permanent Account (PAN) Number *</label>
                        <input
                          type="text"
                          required
                          value={restForm.ownerPan}
                          onChange={(e) => setRestForm({ ...restForm, ownerPan: e.target.value })}
                          placeholder="ABCPE8892A"
                          maxLength={10}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden font-mono uppercase text-gray-800"
                        />
                      </div>
                    </div>

                    {/* Interactive OTP Simulator Console for Mobile & Emails */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-4">
                      <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5 border-b border-gray-200 pb-2">
                        <Lock className="w-4 h-4 text-[#E23744]" /> Enterprise Real-time Verification Checks (OTP)
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* PHONE OTP */}
                        <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-3">
                          <label className="block text-xs text-gray-500 font-bold">Contact Mobile Phone *</label>
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              value={restForm.phone}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRestForm(prev => ({ ...prev, phone: val }));
                              }}
                              placeholder="+91 90050 49193"
                              disabled={phoneOtpState === "verified"}
                              className="flex-1 border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#E23744] text-gray-800"
                            />
                            {phoneOtpState === "not_sent" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!restForm.phone) {
                                    triggerToast("Mobile Required", "Specify mobile prior to verification.", "error");
                                    return;
                                  }
                                  setPhoneOtpState("sent");
                                  triggerToast("OTP Transmitted", "Corporate OTP sent to mobile: 5821", "info");
                                }}
                                className="px-3 py-2 bg-[#E23744] text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-[10px] cursor-pointer"
                              >
                                Send Code
                              </button>
                            )}
                          </div>

                          {phoneOtpState === "sent" && (
                            <div className="space-y-2 animate-fade-in">
                              <span className="text-[10px] text-amber-600 font-bold block">Enter Code (Demo Token: 5821)</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={phoneOtpDigits}
                                  onChange={(e) => setPhoneOtpDigits(e.target.value)}
                                  placeholder="Type 5821"
                                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-mono text-center text-xs tracking-widest focus:ring-1 text-gray-800 focus:ring-[#E23744]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (phoneOtpDigits.trim() === "5821") {
                                      setPhoneOtpState("verified");
                                      triggerToast("Mobile Approved", "Phone verification compliance check has successfully passed!", "success");
                                    } else {
                                      triggerToast("Invalid OTP", "The entered token does not match active security parameters.", "error");
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors text-[10px] cursor-pointer"
                                >
                                  Verify
                                </button>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setPhoneOtpDigits("5821")}
                                className="text-[10px] text-gray-400 hover:text-gray-600 underline font-semibold cursor-pointer"
                              >
                                Rapid Autofill (5821)
                              </button>
                            </div>
                          )}

                          {phoneOtpState === "verified" && (
                            <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-bold text-[10px] flex items-center justify-between font-sans">
                              <span>✔ Mobile Verified & Audited</span>
                              <button 
                                type="button" 
                                onClick={() => setPhoneOtpState("not_sent")}
                                className="text-[9px] hover:underline text-emerald-700 font-bold cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>
                          )}
                        </div>

                        {/* EMAIL OTP */}
                        <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-3">
                          <label className="block text-xs text-gray-500 font-bold">Authenticated Email *</label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={restForm.email}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRestForm(prev => ({ ...prev, email: val }));
                              }}
                              placeholder="joydeep@gmail.com"
                              disabled={emailOtpState === "verified"}
                              className="flex-1 border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#E23744] text-gray-800"
                            />
                            {emailOtpState === "not_sent" && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!restForm.email) {
                                    triggerToast("Email Required", "Specify owner email address first.", "error");
                                    return;
                                  }
                                  setEmailOtpState("sent");
                                  triggerToast("OTP In Transit", "Compliance verification code sent to inbox: 9214", "info");
                                }}
                                className="px-3 py-2 bg-[#E23744] text-white font-bold rounded-lg hover:bg-red-600 transition-colors text-[10px] cursor-pointer"
                              >
                                Send Code
                              </button>
                            )}
                          </div>

                          {emailOtpState === "sent" && (
                            <div className="space-y-2 animate-fade-in">
                              <span className="text-[10px] text-amber-600 font-bold block">Enter Code (Demo Token: 9214)</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={emailOtpDigits}
                                  onChange={(e) => setEmailOtpDigits(e.target.value)}
                                  placeholder="Type 9214"
                                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-1.5 font-mono text-center text-xs tracking-widest focus:ring-1 text-gray-800 focus:ring-[#E23744]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (emailOtpDigits.trim() === "9214") {
                                      setEmailOtpState("verified");
                                      triggerToast("Inbox Verified", "Email identity check approved seamlessly!", "success");
                                    } else {
                                      triggerToast("Invalid OTP", "Mismatch. Re-verify entered digits.", "error");
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors text-[10px] cursor-pointer"
                                >
                                  Verify
                                </button>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setEmailOtpDigits("9214")}
                                className="text-[10px] text-gray-400 hover:text-gray-600 underline font-semibold cursor-pointer"
                              >
                                Rapid Autofill (9214)
                              </button>
                            </div>
                          )}

                          {emailOtpState === "verified" && (
                            <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg font-bold text-[10px] flex items-center justify-between font-sans">
                              <span>✔ Email Verified & Audited</span>
                              <button 
                                type="button" 
                                onClick={() => setEmailOtpState("not_sent")}
                                className="text-[9px] hover:underline text-emerald-700 font-bold cursor-pointer"
                              >
                                Reset
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Owner Photo */}
                    <div className="border border-gray-200 p-4 rounded-xl space-y-2 bg-white">
                      <span className="font-bold text-gray-800 text-xs block">Owner KYC Profile Photo</span>
                      <div 
                        onClick={() => { (window as any).uploadTarget = "ownerPhotoUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, ownerPhotoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80" }));
                          triggerToast("Asset Injected", "Owner profile photograph verified!", "info");
                        }}
                        className="border bg-gray-50 border-dashed border-gray-200 hover:border-[#E23744] hover:bg-red-50/10 p-5 rounded-xl text-center cursor-pointer transition-all"
                      >
                        <User className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <span className="text-[10px] font-bold text-[#E23744]">Upload Owner Photo</span>
                        <p className="text-[9px] text-gray-400">Accepts JPG, JPEG up to 5MB</p>
                      </div>
                      {restForm.ownerPhotoUrl && (
                        <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold flex items-center gap-1 font-sans">
                          <Check className="w-3.5 h-3.5 shrink-0" /> Profile photograph validated
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: FSSAI & KYC VERIFICATIONS */}
                {restWizardStep === 3 && (
                  <div className="space-y-4 animate-fade-in text-xs text-gray-700">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <ShieldCheck className="w-4 h-4 text-[#E23744]" />
                      <span className="text-sm font-bold text-gray-800">FSSAI Registration & KYC Compliance Audit</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">FSSAI 14-Digit Registration Number *</label>
                        <input
                          type="text"
                          required
                          value={restForm.fssaiNumber}
                          onChange={(e) => setRestForm({ ...restForm, fssaiNumber: e.target.value })}
                          placeholder="e.g. 14323091000388"
                          maxLength={14}
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden font-mono text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">FSSAI Expiry Date Check *</label>
                        <input
                          type="date"
                          required
                          value={restForm.fssaiExpiryDate}
                          onChange={(e) => setRestForm({ ...restForm, fssaiExpiryDate: e.target.value })}
                          className="w-full border border-gray-200 text-xs rounded-xl p-2.5 focus:ring-1 focus:ring-[#E23744] bg-white text-gray-800"
                        />
                      </div>
                    </div>

                    {/* Drag and drop grid layout */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      
                      
{/* FSSAI License PDF */}
<div className="border border-gray-200 p-3 rounded-2xl bg-white space-y-2">
  <div className="flex justify-between items-center">
    <span className="font-bold text-gray-800 text-[11px] block">FSSAI License PDF *</span>
    {restForm.kycDocumentUrl && (
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({ ...prev, kycDocumentUrl: "" })); }}
        className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded border border-red-100 bg-red-50"
      >Delete</button>
    )}
  </div>
  {restForm.kycDocumentUrl ? (
    <div className="relative border border-gray-100 rounded-xl overflow-hidden h-24 flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center justify-center text-gray-500"><FileText className="w-8 h-8 mb-1" /><span className="text-[10px] font-bold">Document Uploaded</span><span className="text-[9px] truncate max-w-[120px]">{restForm.kycDocumentUrl}</span></div>
    </div>
  ) : (
    <div 
      onClick={() => { (window as any).uploadTarget = "kycDocumentUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, kycDocumentUrl: "/kyc/kycDocumentUrl_verified.png" }));
        triggerToast("FSSAI License PDF Added", "Document attached successfully", "success");
      }}
      className="border border-dashed border-gray-200 hover:border-[#E23744] p-4 text-center rounded-xl cursor-pointer bg-gray-50 hover:bg-red-50/10 transition-colors h-24 flex flex-col justify-center"
    >
      <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
      <span className="text-[10px] text-gray-500 font-semibold block">Click to Browse</span>
      <span className="text-[8.5px] text-gray-400 leading-tight block mt-0.5 font-mono">Max: 10MB</span>
    </div>
  )}
</div>

{/* Aadhaar Front Image */}
<div className="border border-gray-200 p-3 rounded-2xl bg-white space-y-2">
  <div className="flex justify-between items-center">
    <span className="font-bold text-gray-800 text-[11px] block">Aadhaar Front Image *</span>
    {restForm.aadhaarFrontUrl && (
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({ ...prev, aadhaarFrontUrl: "" })); }}
        className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded border border-red-100 bg-red-50"
      >Delete</button>
    )}
  </div>
  {restForm.aadhaarFrontUrl ? (
    <div className="relative border border-gray-100 rounded-xl overflow-hidden h-24 flex items-center justify-center bg-gray-50">
      <img src={restForm.aadhaarFrontUrl.startsWith('/') || restForm.aadhaarFrontUrl.startsWith('http') ? restForm.aadhaarFrontUrl : 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80'} alt="Aadhaar Front Image *" className="h-full object-cover" />
    </div>
  ) : (
    <div 
      onClick={() => { (window as any).uploadTarget = "aadhaarFrontUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, aadhaarFrontUrl: "/kyc/aadhaarFrontUrl_verified.png" }));
        triggerToast("Aadhaar Front Image Added", "Document attached successfully", "success");
      }}
      className="border border-dashed border-gray-200 hover:border-[#E23744] p-4 text-center rounded-xl cursor-pointer bg-gray-50 hover:bg-red-50/10 transition-colors h-24 flex flex-col justify-center"
    >
      <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
      <span className="text-[10px] text-gray-500 font-semibold block">Click to Browse</span>
      <span className="text-[8.5px] text-gray-400 leading-tight block mt-0.5 font-mono">Max: 10MB</span>
    </div>
  )}
</div>

{/* Aadhaar Back Image */}
<div className="border border-gray-200 p-3 rounded-2xl bg-white space-y-2">
  <div className="flex justify-between items-center">
    <span className="font-bold text-gray-800 text-[11px] block">Aadhaar Back Image *</span>
    {restForm.aadhaarBackUrl && (
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({ ...prev, aadhaarBackUrl: "" })); }}
        className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded border border-red-100 bg-red-50"
      >Delete</button>
    )}
  </div>
  {restForm.aadhaarBackUrl ? (
    <div className="relative border border-gray-100 rounded-xl overflow-hidden h-24 flex items-center justify-center bg-gray-50">
      <img src={restForm.aadhaarBackUrl.startsWith('/') || restForm.aadhaarBackUrl.startsWith('http') ? restForm.aadhaarBackUrl : 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80'} alt="Aadhaar Back Image *" className="h-full object-cover" />
    </div>
  ) : (
    <div 
      onClick={() => { (window as any).uploadTarget = "aadhaarBackUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, aadhaarBackUrl: "/kyc/aadhaarBackUrl_verified.png" }));
        triggerToast("Aadhaar Back Image Added", "Document attached successfully", "success");
      }}
      className="border border-dashed border-gray-200 hover:border-[#E23744] p-4 text-center rounded-xl cursor-pointer bg-gray-50 hover:bg-red-50/10 transition-colors h-24 flex flex-col justify-center"
    >
      <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
      <span className="text-[10px] text-gray-500 font-semibold block">Click to Browse</span>
      <span className="text-[8.5px] text-gray-400 leading-tight block mt-0.5 font-mono">Max: 10MB</span>
    </div>
  )}
</div>

{/* PAN Card Attachment */}
<div className="border border-gray-200 p-3 rounded-2xl bg-white space-y-2">
  <div className="flex justify-between items-center">
    <span className="font-bold text-gray-800 text-[11px] block">PAN Card Attachment *</span>
    {restForm.panCardUrl && (
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({ ...prev, panCardUrl: "" })); }}
        className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded border border-red-100 bg-red-50"
      >Delete</button>
    )}
  </div>
  {restForm.panCardUrl ? (
    <div className="relative border border-gray-100 rounded-xl overflow-hidden h-24 flex items-center justify-center bg-gray-50">
      <img src={restForm.panCardUrl.startsWith('/') || restForm.panCardUrl.startsWith('http') ? restForm.panCardUrl : 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80'} alt="PAN Card Attachment *" className="h-full object-cover" />
    </div>
  ) : (
    <div 
      onClick={() => { (window as any).uploadTarget = "panCardUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, panCardUrl: "/kyc/panCardUrl_verified.png" }));
        triggerToast("PAN Card Attachment Added", "Document attached successfully", "success");
      }}
      className="border border-dashed border-gray-200 hover:border-[#E23744] p-4 text-center rounded-xl cursor-pointer bg-gray-50 hover:bg-red-50/10 transition-colors h-24 flex flex-col justify-center"
    >
      <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
      <span className="text-[10px] text-gray-500 font-semibold block">Click to Browse</span>
      <span className="text-[8.5px] text-gray-400 leading-tight block mt-0.5 font-mono">Max: 10MB</span>
    </div>
  )}
</div>
{/* Business Registration */}
                      <div className="border border-gray-200 p-3 rounded-2xl bg-white space-y-2">
                        <span className="font-bold text-gray-800 text-[11px] block">Business Registration Certificate</span>
                        <div 
                          onClick={() => { (window as any).uploadTarget = "businessRegUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, businessRegUrl: "/kyc/business_cert_89221.pdf" }));
                            triggerToast("Business Cert Added", "Business Registration document attached successfully", "info");
                          }}
                          className="border border-dashed border-gray-200 hover:border-[#E23744] p-4 text-center rounded-xl cursor-pointer bg-gray-50 hover:bg-red-50/10 transition-colors"
                        >
                          <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                          <span className="text-[9px] font-black text-[#E23744]">Business registration</span>
                        </div>
                        {restForm.businessRegUrl ? (
                          <div className="p-1.5 bg-emerald-50 text-emerald-900 text-[9px] font-semibold rounded-lg truncate text-center">
                            Attach: business_cert_89221.pdf
                          </div>
                        ) : (
                          <div className="text-[9px] text-gray-400 text-center font-medium">PNG, JPEG, PDF up to 10MB</div>
                        )}
                      </div>

                      {/* GST */}
                      <div className="border border-gray-200 p-3 rounded-2xl bg-white space-y-2 relative">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 text-[11px] block text-left">GST Certificate (Optional)</span>
                          {restForm.gstUrl && (
                            <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Ready</span>
                          )}
                        </div>
                        <div 
                          onClick={() => { (window as any).uploadTarget = "gstUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, gstUrl: "/kyc/gst_number_verified.pdf" }));
                            triggerToast("GST Cert Uploaded", "Optional GST document attached", "success");
                          }}
                          className={`border border-dashed rounded-xl cursor-pointer p-4 text-center transition-all ${
                            restForm.gstUrl 
                              ? "border-emerald-200 bg-emerald-50/5 hover:bg-emerald-50/10" 
                              : "border-gray-200 bg-gray-50 hover:bg-red-50/10 hover:border-[#E23744]"
                          }`}
                        >
                          <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                          <span className="text-[9px] font-black text-[#E23744]">GST Document</span>
                        </div>
                        {restForm.gstUrl ? (
                          <div className="space-y-1.5">
                            <div className="p-1.5 bg-emerald-50 text-emerald-900 text-[9px] font-semibold rounded-lg truncate text-center flex items-center justify-between gap-1">
                              <span className="truncate">gst_number_verified.pdf</span>
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRestForm(prev => ({ ...prev, gstUrl: "" }));
                                }} 
                                className="text-red-500 font-extrabold text-[9px] hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-[8px] text-gray-400 font-bold px-1">
                              <span>Upload Progress:</span>
                              <span className="text-emerald-600">100%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                              <div className="bg-emerald-500 h-full w-full transition-all duration-500"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[9px] text-gray-400 text-center font-medium">PNG, JPEG, PDF up to 10MB</div>
                        )}
                      </div>

                      {/* Address Proof */}
                      <div className="border border-gray-200 p-3 rounded-2xl bg-white space-y-2 relative">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 text-[11px] block text-left">Utility/Address Proof *</span>
                          {restForm.addressProofUrl ? (
                            <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Ready</span>
                          ) : (
                            <span className="text-[8px] bg-amber-50 text-amber-800 font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-sans">Required</span>
                          )}
                        </div>
                        <div 
                          onClick={() => { (window as any).uploadTarget = "addressProofUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, addressProofUrl: "/kyc/address_proof_utility_verified.pdf" }));
                            triggerToast("Address Proof Uploaded", "Merchant Trade Address Proof successfully attached!", "success");
                          }}
                          className={`border border-dashed rounded-xl cursor-pointer p-4 text-center transition-all ${
                            restForm.addressProofUrl 
                              ? "border-emerald-200 bg-emerald-50/5 hover:bg-emerald-50/10" 
                              : "border-gray-200 bg-gray-50 hover:bg-red-50/10 hover:border-[#E23744]"
                          }`}
                        >
                          <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                          <span className="text-[9px] font-black text-[#E23744]">Attach Address Proof</span>
                        </div>
                        {restForm.addressProofUrl ? (
                          <div className="space-y-1.5">
                            <div className="p-1.5 bg-emerald-50 text-emerald-900 text-[9px] font-semibold rounded-lg truncate text-center flex items-center justify-between gap-1">
                              <span className="truncate">address_proof_utility_verified.pdf</span>
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRestForm(prev => ({ ...prev, addressProofUrl: "" }));
                                }} 
                                className="text-red-500 font-extrabold text-[9px] hover:underline"
                              >
                                Clear
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-[8px] text-gray-400 font-bold px-1">
                              <span>Upload Progress:</span>
                              <span className="text-emerald-600">100%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                              <div className="bg-emerald-500 h-full w-full transition-all duration-500"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[9px] text-gray-400 text-center font-medium">Electricity/Lease Deed up to 10MB</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: BANK DETAILS */}
                {restWizardStep === 4 && (
                  <div className="space-y-4 animate-fade-in text-xs text-gray-700">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Landmark className="w-4 h-4 text-[#E23744]" />
                      <span className="text-sm font-bold text-gray-800">Payout Ledger Configuration & Bank Routing Verification</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Bank Name *</label>
                        <input
                          type="text"
                          required
                          value={restForm.bankName}
                          onChange={(e) => setRestForm({ ...restForm, bankName: e.target.value })}
                          placeholder="e.g. HDFC Bank Ltd"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Branch Name</label>
                        <input
                          type="text"
                          value={restForm.branchName}
                          onChange={(e) => setRestForm({ ...restForm, branchName: e.target.value })}
                          placeholder="Camac Street Corporate Branch"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Bank Account Number *</label>
                        <input
                          type="text"
                          required
                          value={restForm.accountNumber}
                          onChange={(e) => setRestForm({ ...restForm, accountNumber: e.target.value })}
                          placeholder="502010889211"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">Confirm Account Number *</label>
                        <input
                          type="text"
                          required
                          value={restForm.confirmAccountNumber}
                          onChange={(e) => setRestForm({ ...restForm, confirmAccountNumber: e.target.value })}
                          placeholder="Re-enter Account Number"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">IFSC Code Route *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={restForm.ifscCode}
                            onChange={(e) => setRestForm({ ...restForm, ifscCode: e.target.value.toUpperCase() })}
                            placeholder="e.g. HDFC0000008"
                            className="flex-1 border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden font-mono uppercase"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!restForm.ifscCode) {
                                triggerToast("IFSC Required", "Enter an IFSC code first.", "error");
                                return;
                              }
                              triggerToast("IFSC Resolved", `Valid HDFC Bank Branch matched at ${restForm.branchName || "Park Street Branch"}! Ready for payouts.`, "success");
                            }}
                            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Resolve IFSC
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 font-bold mb-1">UPI ID (Optional)</label>
                        <input
                          type="text"
                          value={restForm.upiId}
                          onChange={(e) => setRestForm({ ...restForm, upiId: e.target.value })}
                          placeholder="e.g. joydeep@hdfcbank"
                          className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>

                    {/* Cancelled cheque upload */}
                    <div className="border border-gray-200 p-4 rounded-xl space-y-2 bg-white text-gray-800">
                      <span className="font-bold text-gray-800 text-xs block">Cancelled Cheque Photo Document *</span>
                      <div 
                        onClick={() => { (window as any).uploadTarget = "cancelledChequeUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, cancelledChequeUrl: "/kyc/cheque_verified_9011.png" }));
                          triggerToast("Asset Injected", "Cancelled Cheque Document verified & registered successfully!", "success");
                        }}
                        className="border bg-gray-50 border-dashed border-gray-200 hover:border-[#E23744] hover:bg-red-50/10 p-5 rounded-xl text-center cursor-pointer transition-all"
                      >
                        <Landmark className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <span className="text-[10px] font-bold text-[#E23744]">Upload Cancelled Cheque</span>
                        <p className="text-[9px] text-gray-400">Acceptable size up to 10MB</p>
                      </div>
                      {restForm.cancelledChequeUrl && (
                        <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[10px] font-bold flex items-center justify-between font-sans">
                          <span>✔ Cheque Document attached</span>
                          <button type="button" onClick={() => setRestForm(p => ({ ...p, cancelledChequeUrl: "" }))} className="text-emerald-700 font-black hover:underline cursor-pointer">Remove</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 5: COMPREHENSIVE REVIEWS & SUBMIT */}
                {restWizardStep === 5 && (
                  <div className="space-y-4 animate-fade-in text-xs text-gray-700">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Sparkles className="w-4 h-4 text-[#E23744]" />
                      <span className="text-sm font-bold text-gray-800">Final Verification Audit Review</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Brand Info */}
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                          <span className="font-bold text-gray-800 font-sans">1. Trade & Outlet Profile</span>
                          <button type="button" onClick={() => setRestWizardStep(1)} className="text-[#E23744] font-bold hover:underline text-[10px] cursor-pointer">Edit</button>
                        </div>
                        <div className="space-y-1 text-gray-600">
                          <div>Name: <span className="font-bold text-gray-800">{restForm.name}</span></div>
                          <div>Cuisines: <span className="font-bold text-gray-800">{restForm.cuisine}</span></div>
                          <div>Category: <span className="font-bold text-gray-800">{restForm.category}</span></div>
                          <div>Operating Hours: <span className="font-bold text-gray-800">{restForm.operatingHours}</span></div>
                          <div>Radius: <span className="font-bold text-gray-800">{restForm.deliveryRadius} km</span></div>
                          <div>Address: <span className="font-bold text-gray-800">{restForm.address}, {restForm.city}</span></div>
                        </div>
                      </div>

                      {/* Owner Identity */}
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                          <span className="font-bold text-gray-800 font-sans">2. Owner Identity</span>
                          <button type="button" onClick={() => setRestWizardStep(2)} className="text-[#E23744] font-bold hover:underline text-[10px] cursor-pointer">Edit</button>
                        </div>
                        <div className="space-y-1 text-gray-600">
                          <div>Name: <span className="font-bold text-gray-800">{restForm.ownerName}</span></div>
                          <div>Email: <span className="font-semibold text-gray-800">{restForm.email}</span></div>
                          <div>Phone: <span className="font-mono text-gray-800">{restForm.phone}</span></div>
                          <div>Aadhaar: <span className="font-mono text-gray-800">{restForm.ownerAadhaar}</span></div>
                          <div>PAN: <span className="font-mono text-gray-800 uppercase">{restForm.ownerPan}</span></div>
                        </div>
                      </div>

                      {/* Compliance documents */}
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                          <span className="font-bold text-gray-800 font-sans">3. Compliance Certificates</span>
                          <button type="button" onClick={() => setRestWizardStep(3)} className="text-[#E23744] font-bold hover:underline text-[10px] cursor-pointer">Edit</button>
                        </div>
                        <div className="space-y-1 text-gray-600">
                          <div>FSSAI Number: <span className="font-bold text-gray-800">{restForm.fssaiNumber}</span></div>
                          <div>FSSAI Expiry: <span className="font-bold text-gray-800">{restForm.fssaiExpiryDate}</span></div>
                          <div>FSSAI File: <span className="text-emerald-700 font-bold">{restForm.kycDocumentUrl ? "Attached" : "Missing*"}</span></div>
                          <div>Aadhaar Files: <span className="text-emerald-700 font-bold">Attached</span></div>
                          <div>PAN Card: <span className="text-emerald-700 font-bold">Attached</span></div>
                        </div>
                      </div>

                      {/* Ledger Payout */}
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                          <span className="font-bold text-gray-800 font-sans">4. Settlement Bank Details</span>
                          <button type="button" onClick={() => setRestWizardStep(4)} className="text-[#E23744] font-bold hover:underline text-[10px] cursor-pointer">Edit</button>
                        </div>
                        <div className="space-y-1 text-gray-600">
                          <div>Bank: <span className="font-bold text-gray-800">{restForm.bankName}</span></div>
                          <div>Branch: <span className="font-semibold text-gray-800">{restForm.branchName}</span></div>
                          <div>Account #: <span className="font-mono font-bold text-gray-800">{restForm.accountNumber}</span></div>
                          <div>IFSC Routing: <span className="font-mono text-gray-800">{restForm.ifscCode}</span></div>
                          <div>UPI: <span className="font-mono text-gray-800">{restForm.upiId || "None"}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-3.5 rounded-2xl text-yellow-800 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block text-yellow-900 font-sans">Platform Legal Disclaimer Authorization</span>
                        <p className="text-[10px] text-yellow-700 mt-0.5">By clicking "Complete Audit Submission", you authorize audit regulators to verify government KYC registry files. Mismatching bank IFSC data, inactive FSSAI, or fraudulent PAN data will trigger indefinite merchant blocks.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6: IMMERSIVE SUCCESS SCREEN */}
                {restWizardStep === 6 && (
                  <div className="text-center py-8 space-y-6 animate-fade-in text-xs text-gray-700">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-md border border-emerald-200 animate-bounce">
                      ✔
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-gray-800 font-sans">Compliance Onboarding Initiated!</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        Merchant <span className="font-black text-gray-700">"{restForm.name}"</span> has been locked and recorded into the core administrative state ledger.
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 max-w-md mx-auto space-y-2">
                      <div className="flex justify-between items-center text-[11px] border-b border-gray-200 pb-2">
                        <span className="text-gray-400 font-bold uppercase tracking-wider">Generated Restaurant ID</span>
                        <span className="font-mono font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-xs">{generatedRestId}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] border-b border-gray-200 pb-2">
                        <span className="text-gray-400 font-bold uppercase tracking-wider">Verification Audit Code</span>
                        <span className="font-mono font-bold text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-xs uppercase">Pending FSSAI Scan</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-400 font-bold uppercase tracking-wider">Initial Service Commission Rate</span>
                        <span className="font-bold text-[#E23744] bg-red-50 px-2 py-0.5 rounded border border-red-100">{restForm.commissionPercent}% charge</span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3.5 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddRestModal(false);
                          setRestWizardStep(1);
                        }}
                        className="px-5 py-2.5 bg-gray-900 hover:bg-[#1C1C1C] text-white font-bold rounded-xl transition-colors cursor-pointer text-xs"
                      >
                        Navigate to Dashboard List
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRestWizardStep(1);
                          setRestForm(initialFormState);
                          setPhoneOtpState("not_sent");
                          setEmailOtpState("not_sent");
                          setPhoneOtpDigits("");
                          setEmailOtpDigits("");
                        }}
                        className="px-5 py-2.5 bg-[#E23744] hover:bg-red-600 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs font-sans"
                      >
                        Onboard Another Partner
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer Navigation bar */}
                {restWizardStep <= 5 && (
                  <div className="flex justify-between items-center pt-5 border-t border-gray-100 shrink-0">
                    <button
                      type="button"
                      disabled={restWizardStep === 1}
                      onClick={() => setRestWizardStep(prev => prev - 1)}
                      className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-55 text-gray-600 text-xs font-bold rounded-xl transition-all cursor-pointer font-sans"
                    >
                      Back
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddRestModal(false)}
                        className="px-4.5 py-2.5 text-gray-500 hover:text-gray-700 text-xs font-bold transition-all cursor-pointer font-sans"
                      >
                        Cancel Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Quick trigger form submit
                          handleCreateRestaurant();
                        }}
                        className="px-5 py-2.5 bg-[#E23744] hover:bg-[#c22d38] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 font-sans"
                      >
                        {restWizardStep === 5 ? "Complete Audit Submission" : "Next Step"}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD MENU ITEM MODAL --- */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-[#E23744] text-white p-4 flex justify-between items-center">
              <h3 className="text-sm font-bold">Configure New Menu Item</h3>
              <button onClick={() => setShowAddItemModal(false)}><X className="w-5 h-5 text-white" /></button>
            </div>
            <form onSubmit={handleAddMenuItem} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-bold mb-1">Item Title *</label>
                <input
                  id="menu-item-name"
                  type="text"
                  required
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                  placeholder="e.g. Butter Garlic Wings"
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 font-bold mb-1">Item Category</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white"
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, category: e.target.value })}
                  >
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 font-bold mb-1">Price (INR) *</label>
                  <input
                    id="menu-item-price"
                    type="number"
                    required
                    value={newMenuItem.price || ""}
                    onChange={(e) => setNewMenuItem({ ...newMenuItem, price: Number(e.target.value) })}
                    placeholder="250"
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">Classification State</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="classification"
                      value="veg"
                      checked={newMenuItem.isVeg}
                      onChange={() => setNewMenuItem({ ...newMenuItem, isVeg: true })}
                      className="text-[#E23744] focus:ring-[#E23744]"
                    />
                    Pure Vegetarian
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="classification"
                      value="nonveg"
                      checked={!newMenuItem.isVeg}
                      onChange={() => setNewMenuItem({ ...newMenuItem, isVeg: false })}
                      className="text-[#E23744] focus:ring-[#E23744]"
                    />
                    Contains Meat/Chicken
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-bold mb-1">Item Description</label>
                <textarea
                  id="menu-item-description"
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                  placeholder="Tell clients about recipe elements, garnishes, and serving plates..."
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs h-16 focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-bold mb-1">Available Add-ons (Comma separated list)</label>
                <input
                  type="text"
                  value={newMenuItem.addOnsInput}
                  onChange={(e) => setNewMenuItem({ ...newMenuItem, addOnsInput: e.target.value })}
                  placeholder="e.g. Fried Egg Combo (Rs 30), Extra Tandoori Mayo (Rs 15)"
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#E23744] text-white rounded-lg text-xs font-bold hover:bg-red-600"
                >
                  Publish Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- CANCELLATION EXPLANATORY REASON MODAL --- */}
      {cancelOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl overflow-hidden p-5 space-y-4 animate-scale-up">
            <h3 className="text-sm font-bold text-gray-900">Cancel Order {cancelOrderId}?</h3>
            <p className="text-xs text-gray-400">Specifying cancellation codes prevents dispute triggers for vendors or delivery staff.</p>
            <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1">Primary Cancellation Reason Code *</label>
              <select 
                id="cancel-reason-select"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-xs bg-white focus:ring-1 focus:ring-[#E23744]"
              >
                <option value="">-- Choose Corporate Code --</option>
                <option value="Customer requested cancellation prior to prep">Customer requested cancellation prior to prep</option>
                <option value="Out of stock - Restaurant rejected request">Out of stock - Restaurant rejected request</option>
                <option value="Extreme weather hazard - delivery partner shortage">Extreme weather hazard - delivery partner shortage</option>
                <option value="Address unreachable / Fraud alert">Address unreachable / Fraud alert</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setCancelOrderId(null)} 
                className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg text-xs hover:bg-gray-200 cursor-pointer"
              >
                Dismiss
              </button>
              <button 
                id="confirm-cancel-order"
                disabled={!cancelReason}
                onClick={executeCancelOrder} 
                className="px-3.5 py-1.5 bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs hover:bg-red-700 cursor-pointer"
              >
                Force Terminate Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- VIEW DOCUMENTS MODAL --- */}
      {selectedRestDocs && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">{selectedRestDocs.name} KYC Assets</h3>
              <button onClick={() => setSelectedRestDocs(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-50/50 rounded-lg space-y-1">
                <span className="font-bold text-gray-400 block uppercase text-[10px]">FSSAI License</span>
                <span className="text-gray-800 font-mono font-bold block">{selectedRestDocs.fssaiNumber}</span>
                <span className="text-emerald-700 italic flex items-center gap-1 text-[10px]"><CheckCircle2 className="w-3.5 h-3.5" /> FSSAI Active in GOV database</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-lg space-y-2">
                <span className="font-bold text-gray-400 block uppercase text-[10px]">Bank Verification</span>
                <div className="text-gray-800">
                  <div>Bank: <span className="font-bold">{selectedRestDocs.bankDetails.bankName}</span></div>
                  <div>Account: <span className="font-mono">{selectedRestDocs.bankDetails.accountNumber}</span></div>
                  <div>IFSC: <span className="font-mono font-bold text-[#E23744]">{selectedRestDocs.bankDetails.ifscCode}</span></div>
                  <div>Branch: <span className="font-semibold">{selectedRestDocs.bankDetails.branchName}</span></div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setSelectedRestDocs(null)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-lg hover:bg-gray-200 text-xs text-gray-600"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FEATURE: VIEW RESTAURANT DETAILS MODAL --- */}
      {viewingDetailsRest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white text-gray-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-slide-in my-8 max-h-[90vh] flex flex-col">
            {/* Cover Banner */}
            <div className="h-40 bg-slate-100 relative shrink-0">
              {viewingDetailsRest.bannerUrl ? (
                <img src={viewingDetailsRest.bannerUrl} alt={viewingDetailsRest.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-red-550 to-rose-600 opacity-90"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
              
              {/* Back button */}
              <button 
                onClick={() => setViewingDetailsRest(null)}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                {/* Logo */}
                <div className="w-16 h-16 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
                  <img 
                    src={viewingDetailsRest.logoUrl || "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80"} 
                    alt={viewingDetailsRest.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-white">
                  <span className="text-[9px] bg-[#E23744] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1">
                    {viewingDetailsRest.category || "Standard Partner"}
                  </span>
                  <h3 className="text-lg font-black tracking-tight">{viewingDetailsRest.name}</h3>
                  <p className="text-[10px] text-gray-300 font-medium">ID: {viewingDetailsRest.id} | Registered: {viewingDetailsRest.registrationDate || "2026-05-10"}</p>
                </div>
              </div>
            </div>

            {/* Scrolling Body content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-gray-700">
              
              {/* Business overview */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E23744] block">Culinary Brand Profile</span>
                <p className="text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {viewingDetailsRest.description || "Classic restaurant partner onboarded under Googly compliance guidelines."}
                </p>
              </div>

              {/* Grid 1: Franchise Operating Bounds */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="border border-gray-100 p-4 rounded-2xl bg-white space-y-3">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-1.5">
                    <Clock className="w-4 h-4 text-emerald-500" /> Operational Parameters
                  </span>
                  <div className="space-y-1.5 text-gray-600">
                    <div className="flex justify-between"><span>Cuisines:</span><strong className="text-gray-800">{viewingDetailsRest.cuisine}</strong></div>
                    <div className="flex justify-between"><span>Operating Hours:</span><strong className="text-gray-800">{viewingDetailsRest.operatingHours || "09:00 AM - 11:00 PM"}</strong></div>
                    <div className="flex justify-between"><span>Delivery Radius:</span><strong className="text-gray-800">{viewingDetailsRest.deliveryRadius || 5} km bounds</strong></div>
                    <div className="flex justify-between"><span>Service Fee Rate:</span><strong className="text-[#E23744]">{viewingDetailsRest.commissionPercent}% Commission</strong></div>
                  </div>
                </div>

                <div className="border border-gray-100 p-4 rounded-2xl bg-white space-y-3">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-1.5">
                    <MapPin className="w-4 h-4 text-rose-500" /> Geolocation Boundary
                  </span>
                  <div className="space-y-1.5 text-gray-600">
                    <div className="flex justify-between"><span>Location City:</span><strong className="text-gray-800">{viewingDetailsRest.city || "Kolkata"}</strong></div>
                    <div className="flex justify-between"><span>ZIP Pin-Code:</span><strong className="text-gray-800">{viewingDetailsRest.pinCode || "700017"}</strong></div>
                    <div className="flex justify-between"><span>Coordinates:</span><strong className="text-gray-800 font-mono text-[10px]">{viewingDetailsRest.latitude || "22.5726"}, {viewingDetailsRest.longitude || "88.3639"}</strong></div>
                    <div className="flex justify-between"><span>Address:</span><strong className="text-gray-800 text-right font-medium max-w-[130px] truncate">{viewingDetailsRest.address || "12B Camac Street"}</strong></div>
                  </div>
                </div>
              </div>

              {/* Owner details */}
              <div className="border border-gray-100 p-4 rounded-2xl space-y-3 bg-gray-50/50 text-left">
                <span className="font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
                  <User className="w-4 h-4 text-sky-500" /> Corporate Owner Metadata
                </span>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Photo Profile */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 border border-gray-300 shrink-0">
                    <img 
                      src={viewingDetailsRest.ownerPhotoUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80"} 
                      alt={viewingDetailsRest.ownerName}
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    <div>Owner Name: <strong className="text-gray-800">{viewingDetailsRest.ownerName || "Swadh Executive"}</strong></div>
                    <div>Aadhaar Identity: <strong className="text-gray-800 font-mono">{viewingDetailsRest.ownerAadhaar || "4455-8899-2211"}</strong></div>
                    <div>Email Address: <strong className="text-gray-855 font-semibold text-gray-800">{viewingDetailsRest.email}</strong></div>
                    <div>Permanent PAN: <strong className="text-gray-800 font-mono uppercase">{viewingDetailsRest.ownerPan || "ABCPE8892A"}</strong></div>
                    <div>Contact Mobile: <strong className="text-gray-800 font-mono">{viewingDetailsRest.phone}</strong></div>
                    <div>Birth Registry Date: <strong className="text-gray-800 font-mono">{viewingDetailsRest.ownerDob || "1988-05-15"}</strong></div>
                  </div>
                </div>
              </div>

              {/* FSSAI Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-emerald-50/45 border border-emerald-100 rounded-2xl space-y-2">
                  <span className="font-extrabold text-[#E23744] uppercase tracking-wider text-[10px]">FSSAI Certificate Compliance</span>
                  <div className="space-y-1 text-[#1C1C1C] font-medium">
                    <div>License #: <span className="font-mono font-bold text-slate-800">{viewingDetailsRest.fssaiNumber}</span></div>
                    <div>Expiration Date: <span className="font-mono font-bold text-slate-800">{viewingDetailsRest.fssaiExpiryDate || "2030-12-31"}</span></div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Status: <span className="p-0.5 px-2 rounded-sm bg-emerald-100 text-emerald-800 font-bold text-[9px]">{viewingDetailsRest.fssaiStatus || "Verified"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-rose-50/25 border border-red-100 rounded-2xl space-y-2">
                  <span className="font-extrabold text-[#E23744] uppercase tracking-wider text-[10px]">Settlement Ledger Bank Routing</span>
                  <div className="space-y-1 text-slate-900 font-medium font-sans">
                    <div>Bank Name: <span className="font-bold text-slate-800">{viewingDetailsRest.bankDetails.bankName}</span></div>
                    <div>IFSC Clearing Code: <span className="font-mono font-bold text-[#E23744]">{viewingDetailsRest.bankDetails.ifscCode}</span></div>
                    <div>Clearing Status: <span className="bg-emerald-100 text-emerald-800 font-bold text-[9px] px-1.5 py-0.5 rounded">Penny Test OK</span></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Controls footer */}
            <div className="shrink-0 p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3.5">
              <button
                onClick={() => setViewingDetailsRest(null)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm font-sans"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FEATURE: VERIFY DOCUMENTS MODAL --- */}
      {verifyingDocsRest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up border-t-8 border-[#E23744]">
            
            <div className="space-y-1 text-left">
              <div className="text-[9px] text-[#E23744] font-black tracking-widest uppercase">Googly Regulatory KYC Clearing</div>
              <h3 className="text-base font-black text-gray-900">Verify: {verifyingDocsRest.name}</h3>
              <p className="text-[10px] text-gray-400">Review government uploads against merchant registry indices.</p>
            </div>

            {/* Document Verification Steps Tracker */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 select-none">
              
              {/* Aadhaar Verification */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-200/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-gray-700">Aadhaar Identity Cards</span>
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">AUTO MATCHED</span>
              </div>

              {/* PAN Tax Verification */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-200/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-gray-700">Owner PAN Tax Record</span>
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">VERIFIED PIN</span>
              </div>

              {/* FSSAI Register Check */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-200/60 font-sans">
                <div className="flex items-center gap-2 text-left">
                  <Building className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="font-bold text-gray-700">FSSAI Status</span>
                </div>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                  verifyingDocsRest.fssaiStatus === "Verified" 
                    ? "text-emerald-600 bg-emerald-50" 
                    : "text-amber-600 bg-amber-50"
                }`}>
                  {verifyingDocsRest.fssaiStatus || "Pending Verification"}
                </span>
              </div>

              {/* Bank accounts clearing verification */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-gray-700">Beneficiary Ledger Test</span>
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">PENNY DROP OK</span>
              </div>

            </div>

            {/* Decision CTAs */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setRestaurants(prev => prev.map(r => r.id === verifyingDocsRest.id ? { ...r, fssaiStatus: "Verified", active: true } : r));
                  triggerToast("Merchant Compliance Verified", `Approved all corporate documents for "${verifyingDocsRest.name}". Active orders can now be received.`, "success");
                  setVerifyingDocsRest(null);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm font-sans"
              >
                <Check className="w-4 h-4" /> Approve & Activate Merchant
              </button>

              <button
                type="button"
                onClick={() => {
                  setRestaurants(prev => prev.map(r => r.id === verifyingDocsRest.id ? { ...r, fssaiStatus: "Rejected", active: false } : r));
                  triggerToast("Compliance Rejected", `Document verification for "${verifyingDocsRest.name}" has been marked Rejected. Requested merchant updates.`, "info");
                  setVerifyingDocsRest(null);
                }}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm font-sans"
              >
                <XCircle className="w-4 h-4" /> Reject & Request Re-upload
              </button>

              <button
                type="button"
                onClick={() => setVerifyingDocsRest(null)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer font-sans"
              >
                Cancel Evaluation
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- FEATURE: VIEW BANK DETAILS MODAL WITH SECURE ACC OBFUSCATION --- */}
      {viewingBankRest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up border-t-8 border-emerald-500">
            
            <div className="space-y-1 text-left">
              <span className="text-[9px] uppercase font-black tracking-widest text-emerald-600">Settlement Account Configuration</span>
              <h3 className="text-base font-black text-gray-900">Payout Ledger</h3>
              <p className="text-[10px] text-gray-400">Beneficiary bank coordinate matching and penny deposit audits.</p>
            </div>

            {/* Account Info Sheet */}
            <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200/60 text-xs">
              
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 font-bold block text-left">Beneficiary Proprietor:</span>
                <strong className="text-gray-800">{viewingBankRest.ownerName || "Swadh Executive"}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-200">
                <span className="text-gray-400 font-bold block text-left">Bank Name:</span>
                <strong className="text-gray-800 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-emerald-500" />
                  {viewingBankRest.bankDetails.bankName || "HDFC Bank"}
                </strong>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-200">
                <span className="text-gray-400 font-bold block text-left">Branch Locality:</span>
                <strong className="text-gray-800 text-right">{viewingBankRest.bankDetails.branchName || "Main Corporate Branch"}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-200">
                <span className="text-gray-400 font-bold block text-left">IFSC Clearing Code:</span>
                <strong className="text-[#E23744] font-mono tracking-wider">{viewingBankRest.bankDetails.ifscCode}</strong>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-200">
                <span className="text-gray-400 font-bold block text-left">Settlement Account:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-gray-800">
                    {revealBankNo 
                      ? (viewingBankRest.bankDetails.accountNumber) 
                      : `•••• •••• ${viewingBankRest.bankDetails.accountNumber.slice(-4) || "8821"}`
                    }
                  </span>
                  <button 
                    type="button"
                    onClick={() => setRevealBankNo(!revealBankNo)}
                    className="p-1 hover:bg-gray-200 rounded text-[#E23744] cursor-pointer text-[9px] uppercase font-black"
                  >
                    {revealBankNo ? "Hide" : "Reveal"}
                  </button>
                </div>
              </div>

              {viewingBankRest.upiId && (
                <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-200 font-sans">
                  <span className="text-gray-400 font-bold block text-left">Associated UPI Handle:</span>
                  <strong className="text-[#E23744] font-mono">{viewingBankRest.upiId}</strong>
                </div>
              )}

            </div>

            {/* Quick Penny Drop simulation button */}
            <div className="bg-[#1C1C1C] text-white p-3.5 rounded-2xl flex items-center justify-between text-[11px] text-left">
              <div>
                <span className="font-bold text-gray-400 uppercase tracking-widest text-[8px] block">Penny Drop Validation Node</span>
                <span className="text-gray-300 leading-none">Simulate micro payout test</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerToast("Initializing Penny Payout Test", "Submitting clearing command to RBI settlement gateway node...", "info");
                  setTimeout(() => {
                    triggerToast("Settlement Node Cleared!", `Transmitted ₹1 test credit to ${viewingBankRest.bankDetails.bankName}. Host approved account owner match!`, "success");
                  }, 1200);
                }}
                className="px-3 py-1.5 bg-[#E23744] hover:bg-red-700 text-white font-extrabold rounded-md shadow transition-colors text-[9px] cursor-pointer"
              >
                Test Connection
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setRevealBankNo(false);
                setViewingBankRest(null);
              }}
              className="w-full py-2 bg-slate-900 bg-gray-900 text-white hover:bg-black font-bold text-xs rounded-xl transition-all cursor-pointer font-sans"
            >
              Dismiss Ledger
            </button>

          </div>
        </div>
      )}

      {/* --- FEATURE: CONFIRM DELETION MODAL --- */}
      {deletingRest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up border-t-8 border-red-600">
            
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl animate-pulse">
                ⚠
              </div>
              <h3 className="text-sm font-black text-gray-800">Delete compliance profile?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                You are about to permanently erase the merchant record for <strong className="text-gray-900">"{deletingRest.name}"</strong> from compliance matrices. This is irreversible.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setDeletingRest(null)} 
                className="flex-grow py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Abandon / Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setRestaurants(prev => prev.filter(r => r.id !== deletingRest.id));
                  triggerToast("Compliance Profile Erased", `Purged ${deletingRest.name} compliance logs permanently.`, "success");
                  setSelectedRestIds(prev => prev.filter(id => id !== deletingRest.id));
                  setDeletingRest(null);
                }} 
                className="flex-grow py-2 bg-red-700 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Yes, Purge Record!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- ADJUST WALLET BALANCE MODAL --- */}
      {adjustRiderWallet && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Adjust wallet balance: {adjustRiderWallet.name}</h3>
            <p className="text-xs text-gray-400">Add or deduct rewards. Changes commit immediately to their profile.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 font-bold mb-1">Adjustment Value (INR) *</label>
                <input
                  id="wallet-adjust-input"
                  type="number"
                  value={walletAmount || ""}
                  onChange={(e) => setWalletAmount(Number(e.target.value))}
                  placeholder="e.g. 500 or -200"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#E23744]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">Audit Log Reason *</label>
                <input
                  id="wallet-reason-input"
                  type="text"
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  placeholder="Bonus reward index..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#E23744]"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setAdjustRiderWallet(null)} 
                className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg text-xs"
              >
                Dismiss
              </button>
              <button 
                id="execute-wallet-adjust"
                onClick={() => {
                  setRiders(prev => prev.map(r => {
                    if (r.id === adjustRiderWallet.id) {
                      return { ...r, walletBalance: r.walletBalance + walletAmount };
                    }
                    return r;
                  }));
                  triggerToast("Wallet Adjusted", `Shifted wallet balances by ₹${walletAmount} for auditing reasons: ${walletReason}`, "success");
                  setAdjustRiderWallet(null);
                }} 
                className="px-3.5 py-1.5 bg-[#E23744] hover:bg-red-600 text-white font-bold rounded-lg text-xs"
              >
                Update Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SHOW RIDER MAP LOCATION MODAL --- */}
      {showRiderMap && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-[#E23744] text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold">Rider GPS Hotspot</h3>
                <p className="text-[10px] text-red-100">Live coordinates: {showRiderMap.name}</p>
              </div>
              <button onClick={() => setShowRiderMap(null)} className="p-1 bg-red-800/20 text-white rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="h-64 bg-slate-100 relative overflow-hidden flex flex-col justify-between p-3">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#E23744_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              {/* Rider coordinates visualization */}
              <div 
                style={{ left: `${showRiderMap.x}%`, top: `${showRiderMap.y}%` }}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 bg-slate-900 border border-emerald-500 rounded p-1 text-[9px] text-white flex items-center gap-1 animate-bounce shadow-md"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></div>
                <span className="font-bold">{showRiderMap.name}</span>
              </div>

              {/* Central Core coordinate marker */}
              <div 
                style={{ left: `50%`, top: `50%` }}
                className="absolute z-0 -translate-x-1/2 -translate-y-1/2 text-[10px] text-gray-400 flex flex-col items-center"
              >
                <MapPin className="w-4 h-4 text-gray-300" />
                <span>Central Hub</span>
              </div>

              <div></div>
              <div className="z-10 bg-white/95 p-2 rounded border border-gray-100 text-[10px] text-gray-500 flex justify-between items-center">
                <span>Vehicle: <strong className="text-gray-800">{showRiderMap.vehicleNumber}</strong></span>
                <span>Active Status: <strong className="text-emerald-600">{showRiderMap.status}</strong></span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button 
                onClick={() => setShowRiderMap(null)}
                className="px-4 py-1.5 bg-gray-900 text-white hover:bg-slate-800 text-xs font-bold rounded-lg"
              >
                Close Location
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
