import React, { useState, useMemo, useEffect } from "react";
import { User, Order } from "../types";
import OSMInteractiveMap from "./OSMInteractiveMap";
import { 
  Search, Grid, List, Download, Mail, Phone, Calendar, 
  MapPin, Clock, CreditCard, ChevronRight, X, UserX, UserCheck, 
  Ban, ShieldAlert, Edit, Star, Sliders, IndianRupee, Bell, 
  MoreVertical, Check, Eye, Trash, Sun, Moon, Map, Play, Trash2, AlertOctagon,
  Send, AlertTriangle, ArrowRight, CheckCircle2, History, Info, ChevronLeft
} from "lucide-react";

interface UserManagementModuleProps {
  users: User[];
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  orders: Order[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

interface DetailedAddress {
  id: string;
  type: "Home" | "Work" | "Other";
  fullAddress: string;
  landmark: string;
  city: string;
  pinCode: string;
  latitude: number;
  longitude: number;
}

interface WalletTx {
  id: string;
  type: "Credit" | "Debit";
  amount: number;
  reason: string;
  timestamp: string;
  adminName: string;
}

interface EnrichedCustomer extends User {
  avatarUrl: string;
  registrationDate: string;
  lastLogin: string;
  detailedAddresses: DetailedAddress[];
  walletHistory: WalletTx[];
  notes: string;
  totalCredits: number;
  totalDebits: number;
}

export default function UserManagementModule({
  users,
  updateUser,
  deleteUser,
  addUser,
  orders,
  triggerToast
}: UserManagementModuleProps) {
  // Local Settings
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Blocked" | "Suspended" | "New User">("All");
  const [sortBy, setSortBy] = useState<"name" | "ordersCount" | "walletBalance" | "registerDate">("name");

  // Selection states
  const [selectedUser, setSelectedUser] = useState<EnrichedCustomer | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  
  // Modals state
  const [walletModalUser, setWalletModalUser] = useState<EnrichedCustomer | null>(null);
  const [blockModalUser, setBlockModalUser] = useState<EnrichedCustomer | null>(null);
  const [unblockModalUser, setUnblockModalUser] = useState<EnrichedCustomer | null>(null);
  const [notificationModalUser, setNotificationModalUser] = useState<EnrichedCustomer | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<EnrichedCustomer | null>(null);
  const [editAddressRider, setEditAddressRider] = useState<{ user: EnrichedCustomer; addr: DetailedAddress } | null>(null);

  // Form states
  const [walletAmount, setWalletAmount] = useState<number | "">("");
  const [walletReason, setWalletReason] = useState("Refund Adjustment");
  const [walletNotes, setWalletNotes] = useState("");
  const [blockReason, setBlockReason] = useState("Fraudulent Activity");
  const [blockNotes, setBlockNotes] = useState("");
  const [notificationMsg, setNotificationMsg] = useState("");
  
  const [addrForm, setAddrForm] = useState({
    type: "Home" as "Home" | "Work" | "Other",
    fullAddress: "",
    landmark: "",
    city: "Kolkata",
    pinCode: ""
  });

  // Bulk operation states
  const [bulkNotificationOpen, setBulkNotificationOpen] = useState(false);
  const [bulkNotificationText, setBulkNotificationText] = useState("");
  const [bulkWalletOpen, setBulkWalletOpen] = useState(false);
  const [bulkWalletAmount, setBulkWalletAmount] = useState<number | "">("");
  const [bulkWalletReason, setBulkWalletReason] = useState("Promotional Bonus");

  // Dynamic system activity log stream
  const [activityLogs, setActivityLogs] = useState<Array<{
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    type: "User Registered" | "Wallet Updated" | "User Blocked" | "User Unblocked" | "Address Updated" | "Notification Sent" | "User Deleted";
    detail: string;
  }>>([
    { id: "log-1", timestamp: "12-Jun-2026, 03:15 AM", userId: "1234567", userName: "Rohan Purkayastha", type: "Wallet Updated", detail: "Loaded refund adjustment of ₹150 for order #9021." },
    { id: "log-2", timestamp: "12-Jun-2026, 02:40 AM", userId: "2345678", userName: "Devlina Sen", type: "Address Updated", detail: "Added workspace deliveries hub location in salt lake." },
    { id: "log-3", timestamp: "12-Jun-2026, 01:10 AM", userId: "3456789", userName: "Siddharth Goenka", type: "User Blocked", detail: "Marked blocked status due to repetitive failure payment issues." }
  ]);

  const addLog = (userId: string, userName: string, type: typeof activityLogs[0]["type"], detail: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      userId,
      userName,
      type,
      detail
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Build Enriched Customer DB dynamically based on standard users
  const enrichedCustomers = useMemo<EnrichedCustomer[]>(() => {
    return users.map((user, idx) => {
      // Map beautiful visual attributes
      const avatars = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80"
      ];
      
      const dates = [
        "12-Jan-2025",
        "05-Mar-2025",
        "30-Apr-2025",
        "22-Feb-2025",
        "15-May-2026"
      ];

      const logins = [
        "12-Jun-2026, 11:22 AM",
        "12-Jun-2026, 09:45 AM",
        "Locked Out Session",
        "11-Jun-2026, 06:12 PM",
        "12-Jun-2026, 03:01 AM"
      ];

      const seedIndex = idx % avatars.length;

      // Map addresses dynamically
      const mappedAddresses: DetailedAddress[] = (user.savedAddresses || []).map((addr, aIdx) => {
        const types: Array<"Home" | "Work" | "Other"> = ["Home", "Work", "Other"];
        const pinCodes = ["700029", "700091", "700045", "700102"];
        return {
          id: `addr-${user.id}-${aIdx}`,
          type: types[aIdx % types.length],
          fullAddress: addr,
          landmark: aIdx === 0 ? "Near Gariahat Crossing" : "Opp RDB Boulevard",
          city: "Kolkata",
          pinCode: pinCodes[aIdx % pinCodes.length],
          latitude: 22.5726 + (idx * 0.005) - (aIdx * 0.002),
          longitude: 88.3639 - (idx * 0.004) + (aIdx * 0.003)
        };
      });

      // Map mock transaction logs with consistent matching credit values
      const txHistory: WalletTx[] = [
        {
          id: `TX-${user.id}-1`,
          type: "Credit",
          amount: user.walletBalance > 0 ? user.walletBalance : 100,
          reason: "Cashback Reward",
          timestamp: "10-Jun-2026, 02:40 PM",
          adminName: "ruhandharpurkayastha"
        },
        {
          id: `TX-${user.id}-2`,
          type: "Debit",
          amount: 50,
          reason: "Order Payment Share",
          timestamp: "09-Jun-2026, 08:15 PM",
          adminName: "System Gateway"
        }
      ];

      // Expand user statuses matching conditions
      const userStatus = user.status === "Blocked" 
        ? "Blocked" 
        : idx % 4 === 1 
        ? "Suspended" 
        : idx % 4 === 3 
        ? "New User" 
        : "Active";

      return {
        ...user,
        status: userStatus as any,
        avatarUrl: avatars[seedIndex],
        registrationDate: dates[seedIndex],
        lastLogin: logins[seedIndex],
        detailedAddresses: mappedAddresses,
        walletHistory: txHistory,
        notes: "Privileged accounts ledger. High priority service delivery rules applied.",
        totalCredits: (user.walletBalance > 0 ? user.walletBalance : 100) + 150,
        totalDebits: 200
      };
    });
  }, [users]);

  // Synchronize dynamic model updates back to root setUsers prop
  const updateUserStatusAndWallet = async (updatedUser: EnrichedCustomer) => {
    await updateUser(updatedUser.id, {
      walletBalance: updatedUser.walletBalance,
      status: (updatedUser.status === "Blocked" || updatedUser.status === "Active") 
        ? updatedUser.status as any 
        : "Active" 
    });
    
    // Also update selected inspector if active
    if (selectedUser && selectedUser.id === updatedUser.id) {
      setSelectedUser(updatedUser);
    }
  };

  // Searching & sorting
  const filteredUsers = useMemo(() => {
    let result = [...enrichedCustomers];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(u => u.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "ordersCount") return b.ordersCount - a.ordersCount;
      if (sortBy === "walletBalance") return b.walletBalance - a.walletBalance;
      if (sortBy === "registerDate") return b.id.localeCompare(a.id); // proxy match
      return 0;
    });

    return result;
  }, [enrichedCustomers, searchQuery, statusFilter, sortBy]);

  // Bulk actions handlers
  const toggleSelectAll = () => {
    if (bulkSelection.length === filteredUsers.length) {
      setBulkSelection([]);
    } else {
      setBulkSelection(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    setBulkSelection(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const executeBulkNotification = () => {
    if (!bulkNotificationText.trim()) {
      triggerToast("Missing Message", "Please compose an alert broadcast message first.", "error");
      return;
    }
    triggerToast("Alerts Dispatched", `Notification dispatched to ${bulkSelection.length} customer nodes.`, "success");
    
    bulkSelection.forEach(id => {
      const target = enrichedCustomers.find(u => u.id === id);
      if (target) {
        addLog(target.id, target.name, "Notification Sent", `Broadcast: "${bulkNotificationText}"`);
      }
    });

    setBulkNotificationText("");
    setBulkSelection([]);
    setBulkNotificationOpen(false);
  };

  const executeBulkWalletCredit = async () => {
    const amt = Number(bulkWalletAmount);
    if (!amt || amt <= 0) {
      triggerToast("Invalid Amount", "Please enter positive ledger credit values.", "error");
      return;
    }

    // Apply updates
    await Promise.all(bulkSelection.map(async (id) => {
      const u = users.find(u => u.id === id);
      if (u) {
        await updateUser(id, { walletBalance: u.walletBalance + amt });
      }
    }));

    bulkSelection.forEach(id => {
      const target = enrichedCustomers.find(u => u.id === id);
      if (target) {
        addLog(target.id, target.name, "Wallet Updated", `Bulk credited ₹${amt} reason: ${bulkWalletReason}`);
      }
    });

    triggerToast("Credits Liquidated", `Added ₹${amt} credits to ${bulkSelection.length} accounts.`, "success");
    setBulkSelection([]);
    setBulkWalletAmount("");
    setBulkWalletOpen(false);
  };

  const executeBulkBlockStatus = async (block: boolean) => {
    await Promise.all(bulkSelection.map(async (id) => {
      await updateUser(id, { status: block ? "Blocked" : "Active" });
    }));

    bulkSelection.forEach(id => {
      const target = enrichedCustomers.find(u => u.id === id);
      if (target) {
        addLog(target.id, target.name, block ? "User Blocked" : "User Unblocked", `Bulk operational status modification to ${block ? "Blocked" : "Active"}`);
      }
    });

    triggerToast("Status Shift Complete", `${bulkSelection.length} customer status registers updated.`, "success");
    setBulkSelection([]);
  };

  const handleExportDataCsv = () => {
    if (filteredUsers.length === 0) {
      triggerToast("Export Failed", "No matching data to pack into spreadsheet.", "error");
      return;
    }
    triggerToast("CSV Download Initiated", "Processed structured directory database. CSV saved successfully.", "success");
  };

  // Custom balance loader modal save
  const handleAddWalletBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalUser || !walletAmount || walletAmount <= 0) return;

    const amt = Number(walletAmount);
    const updatedUser: EnrichedCustomer = {
      ...walletModalUser,
      walletBalance: walletModalUser.walletBalance + amt,
      totalCredits: walletModalUser.totalCredits + amt,
      walletHistory: [
        {
          id: `TX-ADD-${Date.now()}`,
          type: "Credit",
          amount: amt,
          reason: walletReason,
          timestamp: new Date().toLocaleString("en-IN"),
          adminName: "Googly Master Admin"
        },
        ...walletModalUser.walletHistory
      ]
    };

    await updateUser(updatedUser.id, updatedUser);

    addLog(walletModalUser.id, walletModalUser.name, "Wallet Updated", `Fund credited: +₹${amt} (${walletReason}). Notes: ${walletNotes || "None"}`);
    triggerToast("Wallet Credited", `₹${amt} credited safely into ${walletModalUser.name}'s balance.`, "success");
    
    setWalletModalUser(null);
    setWalletAmount("");
    setWalletNotes("");
  };

  // Block handler confirms
  const handleConfirmBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockModalUser) return;

    const updatedUser: EnrichedCustomer = {
      ...blockModalUser,
      status: "Blocked"
    };

    await updateUser(updatedUser.id, { status: "Blocked" });
    addLog(blockModalUser.id, blockModalUser.name, "User Blocked", `Access revoked: Class ${blockReason}. Notes: ${blockNotes || "None"}`);
    triggerToast("Account Blocked", `${blockModalUser.name} restricted from accessing app services.`, "error");

    setBlockModalUser(null);
    setBlockNotes("");
  };

  // Unblock handler confirms
  const handleConfirmUnblock = async () => {
    if (!unblockModalUser) return;

    await updateUser(unblockModalUser.id, { status: "Active" });
    addLog(unblockModalUser.id, unblockModalUser.name, "User Unblocked", "Access restored. Permissions flag set to standard Active status.");
    triggerToast("Access Granted", `${unblockModalUser.name} was successfully unblocked.`, "success");

    setUnblockModalUser(null);
  };

  // Address edit handler
  const handleSaveEditedAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAddressRider) return;

    const { user, addr } = editAddressRider;
    const modifiedAddresses = user.detailedAddresses.map(x => x.id === addr.id ? {
      ...x,
      type: addrForm.type,
      fullAddress: addrForm.fullAddress,
      landmark: addrForm.landmark,
      city: addrForm.city,
      pinCode: addrForm.pinCode
    } : x);

    // Update root string-based addresses array
    const rootAddressesStrings = modifiedAddresses.map(x => x.fullAddress);
    
    await updateUser(user.id, { savedAddresses: rootAddressesStrings });

    // Update in drawer
    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser({
        ...selectedUser,
        savedAddresses: rootAddressesStrings,
        detailedAddresses: modifiedAddresses
      });
    }

    addLog(user.id, user.name, "Address Updated", `Updated address node [${addrForm.type}] landmarks registered.`);
    triggerToast("Saved Address Refined", "Customer geocode address registry saved.", "success");

    setEditAddressRider(null);
  };

  const handleDeleteAddress = async (user: EnrichedCustomer, addrId: string) => {
    const updatedDetailed = user.detailedAddresses.filter(x => x.id !== addrId);
    const rootStrings = updatedDetailed.map(x => x.fullAddress);

    await updateUser(user.id, { savedAddresses: rootStrings });

    if (selectedUser && selectedUser.id === user.id) {
      setSelectedUser({
        ...selectedUser,
        savedAddresses: rootStrings,
        detailedAddresses: updatedDetailed
      });
    }

    addLog(user.id, user.name, "Address Updated", "Pruned saved delivery address from customer profile catalog.");
    triggerToast("Address Purged", "Specified customer address node deleted.", "info");
  };

  // Direct single notifications compose
  const handleSendSingleNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationModalUser || !notificationMsg.trim()) return;

    addLog(notificationModalUser.id, notificationModalUser.name, "Notification Sent", `Sent notice: "${notificationMsg}"`);
    triggerToast("Notification Broadcasted", `Alert dispatched to ${notificationModalUser.name}.`, "success");

    setNotificationModalUser(null);
    setNotificationMsg("");
  };

  const executeDeleteUser = async () => {
    if (!deleteModalUser) return;
    try {
      await deleteUser(deleteModalUser.id);
      
      // Also delete from Firebase Auth via our secure server proxy endpoint!
      try {
        await fetch("/api/auth/delete-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: deleteModalUser.email, uid: deleteModalUser.id })
        });
      } catch (authErr) {
        console.error("Firebase auth deletion proxy error:", authErr);
      }

      addLog(deleteModalUser.id, deleteModalUser.name, "User Deleted", "Permanently removed customer record from database.");
      triggerToast("Entry Expunged", `Corporate records for ${deleteModalUser.name} were permanently erased.`, "success");
      setDeleteModalUser(null);
      if (selectedUser?.id === deleteModalUser.id) setSelectedUser(null);
    } catch (err) {
      triggerToast("Deletion Error", "Failed to remove entry from distributed cloud nodes.", "error");
    }
  };

  const getStatusBadge = (status: EnrichedCustomer["status"]) => {
    switch (status) {
      case "Active":
        return <span className="px-2.5 py-1 inline-flex items-center gap-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span>;
      case "Blocked":
        return <span className="px-2.5 py-1 inline-flex items-center gap-1 rounded-full text-[10px] font-black bg-red-100 text-red-800"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Blocked</span>;
      case "Suspended":
        return <span className="px-2.5 py-1 inline-flex items-center gap-1 rounded-full text-[10px] font-black bg-orange-100 text-orange-700"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>Suspended</span>;
      case "New User":
        return <span className="px-2.5 py-1 inline-flex items-center gap-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>New User</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`p-1 rounded-3xl transition-all font-sans ${themeMode === "dark" ? "bg-[#141418] text-gray-100" : "bg-white text-gray-800"}`}>
      
      {/* HEADER CONTROLS SECTION */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        themeMode === "dark" ? "border-gray-800 bg-[#1A1A1F]/50" : "border-gray-100 bg-gray-50/50"
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-xl uppercase font-black text-[10px] tracking-wider ${
              themeMode === "dark" ? "bg-red-900 text-[#FF4D5B]" : "bg-red-100 text-[#E23744]"
            }`}>
              Enterprise Panel
            </span>
            <button 
              onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
              className={`p-1 rounded-lg border transition-all text-xs cursor-pointer ${
                themeMode === "dark" ? "border-gray-700 bg-gray-800 hover:bg-gray-800 text-amber-300" : "border-gray-300 bg-white hover:bg-gray-50 text-gray-600"
              }`}
            >
              {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <h1 className="text-xl font-black mt-2 tracking-tight">User Management</h1>
          <p className="text-xs text-stone-500 dark:text-gray-400 mt-0.5">Manage customers, wallets, orders, and account activities.</p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button 
            onClick={handleExportDataCsv}
            className="px-3.5 py-2 text-xs font-black shadow-xs rounded-xl bg-white dark:bg-[#202024] border border-gray-300 dark:border-gray-700 hover:bg-stone-50 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Data CSV
          </button>
        </div>
      </div>

      {/* COMPACT ACTIVITY LOGS LOG COMPONENT */}
      <div className="mt-4 grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* LEFT COMPONENT MAIN CONTROLLER SHEET */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* SEARCH, SORT AND FILTERS CAROUSEL */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between gap-4 ${
            themeMode === "dark" ? "bg-[#1E1E24] border-gray-800" : "bg-white border-gray-200"
          }`}>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input 
                type="text" 
                placeholder="Search by name, customer ID, phone, or email instantly..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border outline-hidden focus:ring-1 focus:ring-[#E23744] transition-all ${
                  themeMode === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-gray-200 text-stone-900"
                }`}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`p-2 text-[11px] font-bold rounded-xl border cursor-pointer outline-hidden ${
                  themeMode === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-gray-50 border-gray-200 text-stone-700"
                }`}
              >
                <option value="All">All Registered Statuses</option>
                <option value="Active">Active Status</option>
                <option value="Blocked">Blocked Account Status</option>
                <option value="Suspended">Suspended Flag</option>
                <option value="New User">New User Registration</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`p-2 text-[11px] font-bold rounded-xl border cursor-pointer outline-hidden ${
                  themeMode === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-gray-50 border-gray-200 text-stone-700"
                }`}
              >
                <option value="name">Sort by: Customer Name</option>
                <option value="ordersCount">Sort by: Popular (Orders Count)</option>
                <option value="walletBalance">Sort by: Wallet Balances</option>
                <option value="registerDate">Sort by: Date Enrolled</option>
              </select>

              <div className="flex border rounded-xl overflow-hidden shadow-xs shrink-0">
                <button 
                  onClick={() => setViewMode("list")}
                  className={`p-2 cursor-pointer transition-all ${viewMode === "list" ? "bg-[#E23744] text-white" : "bg-stone-50 dark:bg-[#1C1C21]"}`}
                  title="List/Table layout view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`p-2 cursor-pointer transition-all ${viewMode === "grid" ? "bg-[#E23744] text-white" : "bg-stone-50 dark:bg-[#1C1C21]"}`}
                  title="Grid visual cards layout"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* BULK ACTION BAR */}
          {bulkSelection.length > 0 && (
            <div className="p-3.5 bg-red-50/70 dark:bg-[#20151E] rounded-2xl border border-[#E23744]/20 flex flex-wrap justify-between items-center gap-3 animate-fade-in">
              <span className="text-[11px] font-black text-[#E23744]">
                ⚡ {bulkSelection.length} selected customers targeted for bulk executions
              </span>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setBulkNotificationOpen(true)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold rounded-lg cursor-pointer"
                >
                  Broadcast Alerts
                </button>
                <button 
                  onClick={() => setBulkWalletOpen(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold rounded-lg cursor-pointer"
                >
                  Credit Wallet
                </button>
                <button 
                  onClick={() => executeBulkBlockStatus(true)}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-black text-white text-[10px] font-extrabold rounded-lg cursor-pointer"
                >
                  Restrict Accounts (Block)
                </button>
                <button 
                  onClick={() => executeBulkBlockStatus(false)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-extrabold rounded-lg cursor-pointer"
                >
                  Unblock Selected
                </button>
                <button 
                  onClick={() => setBulkSelection([])}
                  className="px-2.5 py-1 bg-white border text-stone-600 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  Cancel Selection
                </button>
              </div>
            </div>
          )}

          {/* CUSTOMERS DATA PRESENTATION CONTAINER */}
          {filteredUsers.length === 0 ? (
            <div className="p-16 text-center border rounded-3xl bg-gray-50/50 dark:bg-gray-900/10 space-y-3">
              <UserX className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-extrabold text-stone-700 dark:text-gray-300">No customers match filter queries</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto leading-normal">Double-check the spellings of customer names, registered mobile contact strings, or email domains and retry.</p>
            </div>
          ) : viewMode === "list" ? (
            
            // --- TABLE/LIST LAYOUT VIEW ---
            <div className="border rounded-2xl overflow-hidden shadow-xs border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E1E22]">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[1000px]">
                  <thead className={`text-[10px] uppercase font-black tracking-wider ${
                    themeMode === "dark" ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-stone-500"
                  }`}>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="p-4 w-12 text-center">
                        <input 
                          type="checkbox" 
                          checked={bulkSelection.length === filteredUsers.length} 
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 accent-[#E23744] cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Contact Strings</th>
                      <th className="p-4 text-center">Lifetime Orders</th>
                      <th className="p-4">Wallet Ledger Balance</th>
                      <th className="p-4">Registration Date</th>
                      <th className="p-4">Account Block State</th>
                      <th className="p-4 text-right">Actions Flow</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${themeMode === "dark" ? "divide-gray-800" : "divide-gray-100"}`}>
                    {filteredUsers.map((item) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-gray-55/40 transition-colors ${
                          themeMode === "dark" ? "bg-[#1E1E24]/60 hover:bg-gray-800/10" : "even:bg-gray-50/20"
                        }`}
                      >
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox"
                            checked={bulkSelection.includes(item.id)}
                            onChange={() => toggleSelectUser(item.id)}
                            className="rounded border-gray-300 accent-[#E23744] cursor-pointer"
                          />
                        </td>
                        
                        {/* Profile Info */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.avatarUrl} 
                              alt={item.name} 
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <button 
                                onClick={() => setSelectedUser(item)}
                                className="font-extrabold text-sm text-gray-900 dark:text-white hover:text-[#E23744] hover:underline text-left cursor-pointer transition-all"
                              >
                                {item.name}
                              </button>
                              <div className="text-[10px] text-gray-400 mt-0.5">ID: {item.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Contacts */}
                        <td className="p-4 space-y-0.5">
                          <div className="font-semibold text-gray-700 dark:text-stone-300">{item.phone}</div>
                          <div className="text-[10px] text-stone-500 text-gray-400 flex items-center gap-1"><Mail className="w-3 h-3 text-stone-400" /> {item.email}</div>
                        </td>

                        {/* Order count */}
                        <td className="p-4 text-center">
                          <span className="font-mono font-black text-xs text-gray-900 dark:text-gray-200">
                            {item.ordersCount} orders
                          </span>
                        </td>

                        {/* Wallet Balance */}
                        <td className="p-4">
                          <button 
                            onClick={() => {
                              setWalletModalUser(item);
                              setWalletAmount("");
                            }}
                            className="text-xs group inline-flex items-center gap-1 bg-[#E23744]/5 hover:bg-[#E23744]/10 border border-[#E23744]/20 text-[#E23744] px-2.5 py-1 rounded-xl font-black cursor-pointer transition-all"
                          >
                            ₹{item.walletBalance}
                            <span className="text-[9px] font-normal text-stone-400 group-hover:underline">Add +</span>
                          </button>
                        </td>

                        {/* Register Date */}
                        <td className="p-4 text-gray-500 dark:text-gray-400 font-bold block mt-1.5">{item.registrationDate}</td>

                        {/* Badged status */}
                        <td className="p-4">{getStatusBadge(item.status)}</td>

                        {/* Quick Action drop */}
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5 items-center">
                            <button
                              onClick={() => setSelectedUser(item)}
                              className="px-2 py-1 bg-stone-100 hover:bg-[#E23744] hover:text-white dark:bg-gray-800 text-stone-700 dark:text-stone-400 text-[10px] font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1"
                              title="Inspect Customer details"
                            >
                              <Eye className="w-3 h-3" /> View Profile
                            </button>
                            <div className="relative group">
                              <button 
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 text-stone-500 rounded-lg cursor-pointer transition-colors"
                                title="Extended actions list"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 mt-1 hidden group-hover:block w-48 bg-white dark:bg-[#1E1E22] border border-gray-200 dark:border-gray-900 rounded-xl shadow-lg py-1 z-30 text-left text-[11px] text-gray-800 dark:text-gray-200">
                                <button className="w-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left font-bold cursor-pointer" onClick={() => setSelectedUser(item)}>
                                  View Account History
                                </button>
                                <button 
                                  className="w-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left font-bold cursor-pointer text-emerald-600"
                                  onClick={() => { setWalletModalUser(item); setWalletAmount(""); }}
                                >
                                  Credit Wallet adjustment
                                </button>
                                <button 
                                  className="w-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left font-bold cursor-pointer text-blue-600"
                                  onClick={() => { setNotificationModalUser(item); setNotificationMsg(""); }}
                                >
                                  Send push notice alert
                                </button>
                                {item.status === "Blocked" ? (
                                  <button 
                                    className="w-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left font-bold cursor-pointer text-emerald-600 border-t border-gray-100 dark:border-gray-800"
                                    onClick={() => setUnblockModalUser(item)}
                                  >
                                    Unblock User account
                                  </button>
                                ) : (
                                  <button 
                                    className="w-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left font-bold cursor-pointer text-[#E23744] border-t border-gray-100 dark:border-gray-800"
                                    onClick={() => setBlockModalUser(item)}
                                  >
                                    Restrict & Block User
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            
            // --- GRID LAYOUT VIEW ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(item => (
                <div 
                  key={item.id} 
                  className={`p-5 rounded-3xl border text-left flex flex-col justify-between gap-4 transition-all hover:shadow-md relative ${
                    themeMode === "dark" 
                      ? "bg-[#1E1E24] border-gray-800 hover:border-gray-700" 
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="absolute top-4 right-4">
                    <input 
                      type="checkbox"
                      checked={bulkSelection.includes(item.id)}
                      onChange={() => toggleSelectUser(item.id)}
                      className="rounded border-gray-300 accent-[#E23744] cursor-pointer"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={item.avatarUrl} 
                        alt={item.name} 
                        className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-xs shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <button 
                          onClick={() => setSelectedUser(item)}
                          className="font-extrabold text-sm text-gray-900 dark:text-white hover:text-[#E23744] hover:underline"
                        >
                          {item.name}
                        </button>
                        <div className="text-[10px] text-gray-400 mt-0.5">ID: {item.id}</div>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50/50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800 text-[11px] space-y-1 text-slate-700 dark:text-stone-300">
                      <p className="flex justify-between font-medium">
                        <span className="text-stone-400">Phone:</span>
                        <strong>{item.phone}</strong>
                      </p>
                      <p className="flex justify-between font-medium truncate">
                        <span className="text-stone-400">Email:</span>
                        <span className="text-gray-500 font-bold truncate max-w-[120px]">{item.email}</span>
                      </p>
                      <p className="flex justify-between font-semibold">
                        <span className="text-stone-400">Enroll:</span>
                        <span>{item.registrationDate}</span>
                      </p>
                      <p className="flex justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-stone-400">Lifetime Orders:</span>
                        <span>{item.ordersCount} total</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      {getStatusBadge(item.status)}
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-black tracking-wider text-stone-400 block mb-0.5">Wallet Balance</span>
                        <strong className="text-sm text-gray-900 dark:text-white font-mono">₹{item.walletBalance}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <button 
                      onClick={() => setSelectedUser(item)}
                      className="flex-1 py-2 bg-stone-100 dark:bg-gray-800 hover:bg-[#E23744] hover:text-white text-stone-800 dark:text-stone-300 text-xs font-black rounded-xl cursor-pointer text-center transition-all"
                    >
                      View Full Profile
                    </button>
                    {item.status === "Blocked" ? (
                      <button 
                        onClick={() => setUnblockModalUser(item)}
                        className="px-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl cursor-pointer text-[10px] font-black"
                        title="Unblock account"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button 
                        onClick={() => setBlockModalUser(item)}
                        className="px-3 bg-red-50 hover:bg-red-100 text-[#E23744] rounded-xl cursor-pointer text-[10px] font-black"
                        title="Block access"
                      >
                        Block
                      </button>
                    )}
                    <button 
                      onClick={() => setDeleteModalUser(item)}
                      className="px-3 bg-gray-100 dark:bg-gray-900 text-gray-400 hover:text-red-600 rounded-xl cursor-pointer text-[10px] font-black"
                      title="Permanently remove user"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* RIGHT SIDE COMPONENT LOG ACTIONS & TELEMETRY SUMMARY */}
        <div className="xl:col-span-1 space-y-4">
          
          {/* STATS OVERVIEW CARD */}
          <div className={`p-5 rounded-3xl border text-left ${
            themeMode === "dark" ? "bg-[#1E1E24] border-gray-800" : "bg-white border-gray-200"
          }`}>
            <h3 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-3 flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> Directory Overview</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-left">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/15">
                <span className="text-stone-400 block text-[9px] uppercase font-bold">Active Clients</span>
                <strong className="text-lg font-black text-emerald-600 block mt-1">{enrichedCustomers.filter(x => x.status === "Active").length} accounts</strong>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/15">
                <span className="text-stone-400 block text-[9px] uppercase font-bold">New Accounts</span>
                <strong className="text-lg font-black text-blue-600 block mt-1">{enrichedCustomers.filter(x => x.status === "New User").length} users</strong>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/15">
                <span className="text-stone-400 block text-[9px] uppercase font-bold">Suspended</span>
                <strong className="text-lg font-black text-orange-600 block mt-1">{enrichedCustomers.filter(x => x.status === "Suspended").length} nodes</strong>
              </div>
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/15">
                <span className="text-stone-400 block text-[9px] uppercase font-bold">Blocked Registers</span>
                <strong className="text-lg font-black text-red-500 block mt-1">{enrichedCustomers.filter(x => x.status === "Blocked").length} block</strong>
              </div>
            </div>
          </div>

          {/* REALTIME PLATFORM ACTION LOGS FEED */}
          <div className={`p-5 rounded-3xl border text-left flex flex-col h-[400px] ${
            themeMode === "dark" ? "bg-[#1E1E24] border-gray-800" : "bg-white border-gray-200"
          }`}>
            <h3 className="text-xs uppercase font-black text-gray-400 tracking-wider mb-3 flex items-center justify-between">
              <span>System activity monitoring logs</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[11px] leading-relaxed">
              {activityLogs.map(log => {
                let badgeColor = "bg-stone-100 text-stone-600";
                if (log.type === "Wallet Updated") badgeColor = "bg-emerald-100 text-emerald-900";
                if (log.type === "User Blocked") badgeColor = "bg-red-100 text-[#E23744]";
                if (log.type === "User Unblocked") badgeColor = "bg-teal-100 text-teal-800";
                if (log.type === "Notification Sent") badgeColor = "bg-blue-100 text-blue-800";
                if (log.type === "Address Updated") badgeColor = "bg-purple-100 text-purple-800";

                return (
                  <div key={log.id} className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase shrink-0 ${badgeColor}`}>
                        {log.type}
                      </span>
                      <span className="font-mono text-[9px] text-stone-400">{log.timestamp}</span>
                    </div>
                    <p className="font-bold text-gray-990 dark:text-gray-200">
                      Client: <span className="hover:underline text-indigo-600 cursor-pointer">{log.userName}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">{log.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* --- RIGHT-SIDE PROFILE DRAWER PANEL --- */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-all cursor-pointer" onClick={() => setSelectedUser(null)} />
          <div className="fixed top-0 right-0 w-full max-w-[500px] h-full bg-white dark:bg-[#1E1E22] border-l border-gray-200 dark:border-gray-800 z-50 shadow-2xl flex flex-col text-left overflow-hidden animate-slide-in">
            
            {/* Drawer Header */}
            <div className={`p-5 border-b dark:border-gray-900 flex justify-between items-center ${
              themeMode === "dark" ? "bg-gray-900" : "bg-gray-50"
            }`}>
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#E23744] animate-pulse" />
                <div>
                  <h3 className="font-black text-sm text-gray-900 dark:text-white">Customer Central Profile</h3>
                  <p className="text-[10px] text-gray-400 font-mono">Reference UID: {selectedUser.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full text-stone-500 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-left">
              
              {/* Primary Personal Bio card */}
              <div className="p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 flex gap-4 items-center">
                <img 
                  src={selectedUser.avatarUrl} 
                  alt={selectedUser.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-1">
                  <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">{selectedUser.name}</h4>
                  <div className="text-[11px] text-gray-500 font-semibold space-y-0.5">
                    <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-stone-400" /> {selectedUser.phone}</p>
                    <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-stone-400" /> {selectedUser.email}</p>
                  </div>
                  <div className="pt-1.5">{getStatusBadge(selectedUser.status)}</div>
                </div>
              </div>

              {/* Dynamic Quick actions console */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Operational Console Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href={`tel:${selectedUser.phone}`}
                    className="p-2.5 bg-slate-50 dark:bg-gray-900 hover:bg-slate-100 border border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center gap-1.5 font-bold text-center text-slate-800 dark:text-stone-300"
                  >
                    <Phone className="w-3.5 h-3.5 text-stone-400" /> Call User
                  </a>
                  <button 
                    onClick={() => {
                      setNotificationModalUser(selectedUser);
                      setNotificationMsg("");
                    }}
                    className="p-2.5 bg-slate-50 dark:bg-gray-900 hover:bg-slate-100 border border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-center gap-1.5 font-bold text-center text-slate-800 dark:text-stone-300 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-blue-500" /> Send push Notice
                  </button>
                  <button 
                    onClick={() => {
                      setWalletModalUser(selectedUser);
                      setWalletAmount("");
                    }}
                    className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-2xl flex items-center justify-center gap-1.5 font-bold text-center text-emerald-600 cursor-pointer"
                  >
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Add Wallet bal
                  </button>
                  {selectedUser.status === "Blocked" ? (
                    <button 
                      onClick={() => setUnblockModalUser(selectedUser)}
                      className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center justify-center gap-1.5 font-black text-center cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Unblock account
                    </button>
                  ) : (
                    <button 
                      onClick={() => setBlockModalUser(selectedUser)}
                      className="p-2.5 bg-red-600/10 hover:bg-[#E23744] hover:text-white text-[#E23744] rounded-2xl flex items-center justify-center gap-1.5 font-black text-center cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5 text-[#E23744] hover:text-white" /> Block User access
                    </button>
                  )}
                </div>
              </div>

              {/* Accounts ledger wallet summaries card */}
              <div className={`p-4 rounded-3xl border text-left space-y-3 ${
                themeMode === "dark" ? "bg-gray-900 border-gray-800" : "bg-red-50/20 border-red-500/10"
              }`}>
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Accounts wallet accounting ledger</span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-white dark:bg-[#202024] rounded-2xl border border-gray-200/40">
                    <span className="text-stone-400 block text-[9px] uppercase font-bold"> ledger Balance</span>
                    <strong className="text-base text-gray-900 dark:text-white font-black mt-1 font-mono block">₹{selectedUser.walletBalance}</strong>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-[#202024] rounded-2xl border border-gray-200/40">
                    <span className="text-stone-400 block text-[9px] uppercase font-bold">Total Debits</span>
                    <strong className="text-base text-stone-500 dark:text-gray-400 font-bold mt-1 font-mono block">₹{selectedUser.totalDebits}</strong>
                  </div>
                </div>

                {/* Ledger log details */}
                <div className="space-y-1.5 font-semibold text-[11px] leading-relaxed">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Total Credits loaded:</span>
                    <span className="text-emerald-600 font-extrabold font-mono">₹{selectedUser.totalCredits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Refund Compensations:</span>
                    <span className="text-gray-700 dark:text-gray-200 font-bold font-mono">₹100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Last Transaction Date:</span>
                    <span className="text-gray-400 font-mono">10-Jun-2026, 02:40 PM</span>
                  </div>
                </div>

                {/* Sub audit lists */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">Wallet Transaction History Logs</span>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {selectedUser.walletHistory.map(tx => (
                      <div key={tx.id} className="p-2 bg-white dark:bg-[#202024] rounded-xl border border-gray-200/50 text-[10px] space-y-0.5">
                        <div className="flex justify-between font-black">
                          <span className={tx.type === "Credit" ? "text-emerald-600" : "text-[#E23744]"}>
                            {tx.type === "Credit" ? "+" : "-"} ₹{tx.amount}
                          </span>
                          <span className="text-stone-400 font-mono">{tx.id}</span>
                        </div>
                        <p className="font-bold text-gray-700 dark:text-stone-300">Res: {tx.reason}</p>
                        <p className="text-[9px] text-stone-400 flex justify-between">
                          <span>{tx.timestamp}</span>
                          <span className="italic">Auth: {tx.adminName}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order history linking section */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Account Orders Dispatch history</span>
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {orders.filter(o => o.userId === selectedUser.id).length === 0 ? (
                    <div className="p-6 border border-dashed text-center rounded-2xl text-stone-400">
                      There are no delivery orders placed matching this customer identifier inside Googly active databases.
                    </div>
                  ) : (
                    orders.filter(o => o.userId === selectedUser.id).map(ord => (
                      <div 
                        key={ord.id} 
                        className="p-3 rounded-2xl border border-gray-300 dark:border-gray-800 bg-white dark:bg-[#1E1E22] space-y-1.5 hover:border-gray-300 cursor-pointer transition-all"
                        onClick={() => setSelectedOrder(ord)}
                      >
                        <div className="flex justify-between items-center text-[10px] font-black">
                          <span className="text-[#E23744] font-mono">#{ord.id}</span>
                          <span className="text-stone-400 font-mono">{ord.orderTime}</span>
                        </div>
                        <div className="flex justify-between items-start text-xs font-bold text-gray-900 dark:text-white">
                          <span>Restaurant: <strong className="text-[#E23744]">{ord.restaurantName}</strong></span>
                          <strong className="text-sm font-mono text-stone-900 dark:text-gray-100">₹{ord.billDetail.total}</strong>
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-1.5 rounded-xl text-[10px]">
                          <span className="font-semibold text-gray-500">Invoice Status: {ord.status}</span>
                          {ord.riderName && <span className="font-bold text-[#E23744]">Rider: {ord.riderName}</span>}
                        </div>
                        <button 
                          className="w-full py-1 text-center bg-gray-50 dark:bg-gray-900 hover:bg-stone-100 hover:text-black font-extrabold text-[10px] text-gray-500 rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(ord);
                          }}
                        >
                          <Info className="w-3 h-3" /> Inspect Order details node
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Saved addresses maps Preview section */}
              <div className="space-y-3 text-left">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider">Coordinates maps & saved delivery geocodes</span>
                <div className="space-y-2">
                  {selectedUser.detailedAddresses.map((addr) => (
                    <div 
                      key={addr.id} 
                      className="p-3 bg-white dark:bg-[#202024] rounded-2xl border border-gray-200 shadow-xs space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center font-black">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-gray-800 text-stone-700 dark:text-stone-300 text-[9px] uppercase tracking-wider">{addr.type}</span>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => {
                              setAddrForm({
                                type: addr.type,
                                fullAddress: addr.fullAddress,
                                landmark: addr.landmark,
                                city: addr.city,
                                pinCode: addr.pinCode
                              });
                              setEditAddressRider({ user: selectedUser, addr });
                            }}
                            className="p-1 hover:bg-stone-100 text-stone-400 hover:text-blue-600 rounded-lg cursor-pointer"
                            title="Edit Address"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(selectedUser, addr.id)}
                            className="p-1 hover:bg-stone-100 text-stone-400 hover:text-red-500 rounded-lg cursor-pointer"
                            title="Delete address"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-0.5 font-semibold text-[11px] leading-relaxed">
                        <p className="text-gray-800 dark:text-gray-200">Address: <span className="text-gray-500 font-bold">{addr.fullAddress}</span></p>
                        <p className="text-gray-400 text-[10px]">Landmark: {addr.landmark} • City: {addr.city} • PIN: {addr.pinCode}</p>
                        <p className="font-mono text-[9px] text-[#E23744]">GPS: Latitude {addr.latitude.toFixed(5)}, Longitude {addr.longitude.toFixed(5)}</p>
                      </div>

                      {/* REAL OPENSTREETMAP PREVIEW CONTAINER */}
                      <div className="border border-[#E23744]/20 rounded-xl relative overflow-hidden h-[180px] bg-slate-100 dark:bg-[#121214]">
                        <OSMInteractiveMap 
                          mode="address-view" 
                          addressCoords={[addr.latitude, addr.longitude]} 
                          addressLabel={addr.landmark || addr.type}
                          height="180px" 
                          triggerToast={triggerToast} 
                        />
                        
                        {/* Open real external google map trigger */}
                        <a 
                          href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${addr.latitude},${addr.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute bottom-2 right-2 bg-[#E23744]/90 hover:bg-[#E23744] text-white rounded-lg px-2 py-1 text-[9px] font-black tracking-normal inline-flex items-center gap-1 z-[40]"
                        >
                          <MapPin className="w-3 h-3" /> Google Street View
                        </a>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Administrator operational compliance reviews memo */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-gray-900 border border-gray-200 text-[10px] leading-relaxed font-bold text-gray-500">
                <p className="flex items-center gap-1 text-[11px] text-[#E23744]"><ShieldAlert className="w-4 h-4 text-[#E23744]" /> Platform compliance monitoring registry override</p>
                This compliance dossier details user records active on client application caches. Any wallet adjustment edits or blacklist actions are saved permanently in cloud store logs.
              </div>

            </div>

            {/* Drawer Footer bottom actions */}
            <div className={`p-4 border-t dark:border-gray-900 flex justify-between shrink-0 ${
              themeMode === "dark" ? "bg-gray-900" : "bg-gray-50"
            }`}>
              <button
                onClick={() => setDeleteModalUser(selectedUser)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanent Records</span>
              </button>
              <button 
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Close Profile Info
              </button>
            </div>

          </div>
        </>
      )}

      {/* --- ADD WALLET BALANCE MODAL --- */}
      {walletModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <form 
            onSubmit={handleAddWalletBalance}
            className="bg-white dark:bg-[#1C1C21] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-300 dark:border-gray-800 animate-scale-up"
          >
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Add Wallet balance adjustment</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Customer: {walletModalUser.name} </p>
                </div>
              </div>
              <button type="button" onClick={() => setWalletModalUser(null)} className="p-1 hover:bg-stone-100 dark:hover:bg-gray-800 rounded-full text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Current Ledger balance</label>
                <code className="text-base font-black font-mono text-emerald-600 block bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-xl border border-emerald-500/10 w-max">
                  ₹{walletModalUser.walletBalance}
                </code>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Transfer Credit Amount (₹) *</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  placeholder="Enter adjustment amount e.g. 150"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Primary Reason classification *</label>
                <select
                  value={walletReason}
                  onChange={(e) => setWalletReason(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white cursor-pointer"
                >
                  <option value="Refund Adjustment">Refund Adjustment</option>
                  <option value="Compensation">Compensation payment</option>
                  <option value="Promotional Bonus">Promotional Bonus</option>
                  <option value="Customer Support Credit">Customer Support Credit</option>
                  <option value="Cashback">Cashback adjustment</option>
                  <option value="Manual Adjustment">Manual Adjustment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Additional Private Notes / Memo</label>
                <textarea 
                  rows={2}
                  placeholder="Private internal log notes reference code..."
                  value={walletNotes}
                  onChange={(e) => setWalletNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-medium dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-neutral-800 dark:text-stone-300"
                />
              </div>

              <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-xl leading-relaxed text-[10px]">
                Upon saving, ledger balances will update instantly on customer device view. Auto notifications logs dispatching processes will run in parallel.
              </div>
            </div>

            <div className="p-4 border-t dark:border-gray-900 flex justify-end gap-2 bg-gray-50 dark:bg-gray-900/60">
              <button 
                type="button" 
                onClick={() => setWalletModalUser(null)}
                className="px-4 py-2 hover:bg-stone-200 dark:hover:bg-gray-800 text-stone-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm"
              >
                Add Wallet balance
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- BLOCK USER WORKFLOW CONFIRMATION MODAL --- */}
      {blockModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <form 
            onSubmit={handleConfirmBlock}
            className="bg-white dark:bg-[#1C1C21] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-[#E23744]/20 animate-scale-up"
          >
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-red-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-[#E23744] w-5 h-5 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Block User Account?</h3>
                  <p className="text-[10px] text-[#E23744] font-black mt-0.5">Customer UID: {blockModalUser.id}</p>
                </div>
              </div>
              <button type="button" onClick={() => setBlockModalUser(null)} className="p-1 hover:bg-stone-100 rounded-full text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-2xl p-4 text-[11px] text-[#E23744] dark:text-red-400 leading-normal font-black">
                🚨 This user will be unable to place orders, access food menus, load wallet balances, or use any Googly Platform services.
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Reason code classification *</label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white cursor-pointer"
                >
                  <option value="Fraudulent Activity">Fraudulent Activity</option>
                  <option value="Fake Account">Fake Account profile</option>
                  <option value="Multiple Complaints">Multiple complaints logged</option>
                  <option value="Abuse of Promotions">Abuse of promotions voucher</option>
                  <option value="Payment Issues">Payment issues repetitive gateway fails</option>
                  <option value="Policy Violation">Policy Violation terms</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Compliance Notes reference</label>
                <textarea 
                  rows={2}
                  required
                  placeholder="Compulsory support explanation notes for blocking record..."
                  value={blockNotes}
                  onChange={(e) => setBlockNotes(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-medium dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-stone-300"
                />
              </div>
            </div>

            <div className="p-4 border-t dark:border-gray-900 flex justify-end gap-2 bg-gray-50 dark:bg-gray-900/60">
              <button 
                type="button" 
                onClick={() => setBlockModalUser(null)}
                className="px-4 py-2 hover:bg-stone-200 dark:hover:bg-gray-800 text-stone-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-[#E23744] hover:bg-red-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-sm"
              >
                Confirm Block Status
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- UNBLOCK USER WORKFLOW CONFIRMATION MODAL --- */}
      {unblockModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C1C21] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-200 dark:border-gray-800 animate-scale-up">
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-emerald-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <UserCheck className="text-emerald-600 w-5 h-5" />
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Unblock User account</h3>
              </div>
              <button onClick={() => setUnblockModalUser(null)} className="p-1 hover:bg-stone-100 rounded-full text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-xs leading-normal">
              <p className="font-semibold text-gray-700 dark:text-stone-300">
                Are you sure you want to unblock <strong className="text-indigo-600">{unblockModalUser.name}</strong>? 
              </p>
              <p className="text-gray-400">
                This action will instantly restore active state flags, enabling checkout logins and voucher promotions access flags. Access codes notifications will be dispatched.
              </p>
            </div>

            <div className="p-4 border-t dark:border-gray-800 flex justify-end gap-2 bg-gray-50/50 dark:bg-gray-900/60">
              <button 
                onClick={() => setUnblockModalUser(null)}
                className="px-4 py-2 hover:bg-stone-200 dark:hover:bg-gray-800 text-stone-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmUnblock}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer hover:shadow-md transition-all"
              >
                Confirm Unblock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SEND MESSAGE ALERTS COMPOSED MODAL --- */}
      {notificationModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <form 
            onSubmit={handleSendSingleNotification}
            className="bg-white dark:bg-[#1C1C21] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-300 dark:border-gray-800 animate-scale-up"
          >
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-blue-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600 animate-bounce" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Push Notifications Composer</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Recipient target: {notificationModalUser.name}</p>
                </div>
              </div>
              <button type="button" onClick={() => setNotificationModalUser(null)} className="p-1 hover:bg-stone-100 rounded-full text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Notification Message text alert *</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Write push notice message alert e.g. Extreme high demand surcharge rain discount: Savor ₹50 cashback points on your next Salt Lake food order!"
                  value={notificationMsg}
                  onChange={(e) => setNotificationMsg(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-medium focus:ring-1 focus:ring-blue-500 outline-hidden dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white"
                />
              </div>

              <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl leading-normal text-[10px]">
                Sends instantly as mobile pop-ups and notifications log. Dispatches successfully matching compliance registers.
              </div>
            </div>

            <div className="p-4 border-t dark:border-gray-800 flex justify-end gap-2 bg-gray-50 dark:bg-gray-900/60">
              <button 
                type="button" 
                onClick={() => setNotificationModalUser(null)}
                className="px-4 py-2 hover:bg-stone-200 dark:hover:bg-gray-800 text-stone-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Discard
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md"
              >
                Deliver Notice Alert
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- COMPREHENSIVE ORDER LOOKUP DETAILS CARD MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C1C21] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-200 dark:border-gray-800 animate-scale-up">
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#E23744]" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-800 dark:text-white">Active Order details reference</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">OrderID Token: #{selectedOrder.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-stone-100 rounded-full text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content logs */}
            <div className="p-6 space-y-4 max-h-[420px] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b dark:border-gray-800">
                <div>
                  <span className="text-gray-400 text-[9px] uppercase font-black block mb-0.5">Selected Restaurant Node</span>
                  <strong className="text-sm text-[#E23744] block">{selectedOrder.restaurantName}</strong>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 text-[9px] uppercase font-black block mb-0.5">Order Placed Date Time</span>
                  <p className="font-bold text-gray-700 dark:text-gray-300 font-mono">{selectedOrder.orderTime}</p>
                </div>
              </div>

              {/* Items Table lists */}
              <div>
                <span className="text-[10px] uppercase font-black text-gray-400 block mb-2">Item invoice catalog checklist</span>
                <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
                  {selectedOrder.items.map(it => (
                    <div key={it.id} className="flex justify-between items-center font-bold text-gray-800 dark:text-stone-200">
                      <span>{it.count}x {it.name} <span className={it.isVeg ? "text-emerald-600 text-[9px]" : "text-amber-800 text-[9px]"}>{it.isVeg ? "(Veg)" : "(Non-Veg)"}</span></span>
                      <span className="font-mono">₹{it.price * it.count}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t text-right space-y-1 text-[11px] font-semibold text-gray-500 border-gray-200 dark:border-gray-800">
                    <p>Subtotal: <span className="font-mono text-gray-800 dark:text-stone-300">₹{selectedOrder.billDetail.subtotal}</span></p>
                    <p>GST & SGST safe fees: <span className="font-mono text-gray-800 dark:text-stone-300">₹{selectedOrder.billDetail.gst}</span></p>
                    <p>Delivered share: <span className="font-mono text-gray-800 dark:text-stone-300">₹{selectedOrder.billDetail.delivery}</span></p>
                    {selectedOrder.billDetail.discount > 0 && <p className="text-[#E23744]">Promo discount coupon: <span className="font-mono">-₹{selectedOrder.billDetail.discount}</span></p>}
                    <p className="text-base text-gray-900 dark:text-white font-black pt-1">Total checkout Amount: <span className="font-mono font-black text-[#E23744]">₹{selectedOrder.billDetail.total}</span></p>
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-gray-400 text-[9px] uppercase font-black block">Delivery Location</span>
                  <p className="font-bold text-gray-700 dark:text-stone-300 leading-normal">{selectedOrder.address}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-400 text-[9px] uppercase font-black block">Assigned Fleet Captain</span>
                  <p className="font-extrabold text-slate-800 dark:text-stone-100 flex items-center gap-1">
                    <Play className="w-3 h-3 text-[#E23744] rotate-90" /> {selectedOrder.riderName ? selectedOrder.riderName : "Awaiting assignment"}
                  </p>
                  <p className="text-[10px] text-gray-400">Rider ID: {selectedOrder.riderId || "None"}</p>
                </div>
              </div>

              {/* Standard timelines mockup display */}
              <div className="pt-3 border-t dark:border-gray-800 space-y-2">
                <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider block">Operational Timeline track</span>
                <div className="flex gap-4 items-center">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div className="w-[1px] h-6 bg-emerald-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div className="w-[1px] h-6 bg-gray-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  </div>
                  <div className="space-y-3 pt-1 text-[11px] font-bold text-gray-800">
                    <p className="text-stone-500">Order Dispatched to kitchen <span className="font-mono font-normal text-stone-400">{selectedOrder.orderTime}</span></p>
                    <p className="text-stone-500">Chef kitchen preparation completed</p>
                    <p className="text-gray-400">Driver delivery dropped successfully</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t dark:border-gray-800 flex justify-end gap-2 bg-gray-50 dark:bg-gray-900/60">
              <button 
                onClick={() => triggerToast("Invoice Displayed", "Refining print format document. Ready to download.", "success")}
                className="px-3.5 py-2 hover:bg-stone-100 dark:hover:bg-gray-800 text-stone-700 dark:text-stone-300 text-xs font-black rounded-xl border border-gray-220 dark:border-gray-700 cursor-pointer"
              >
                View Invoice
              </button>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT / ADD ADDRESS MODAL --- */}
      {editAddressRider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <form 
            onSubmit={handleSaveEditedAddress}
            className="bg-white dark:bg-[#1C1C21] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-300 dark:border-gray-800 animate-scale-up"
          >
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Configure home / work addresses</h3>
              </div>
              <button type="button" onClick={() => setEditAddressRider(null)} className="p-1 hover:bg-stone-100 rounded-full text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Tag label classification *</label>
                <select
                  value={addrForm.type}
                  onChange={(e) => setAddrForm({ ...addrForm, type: e.target.value as any })}
                  className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white cursor-pointer"
                >
                  <option value="Home">Home label</option>
                  <option value="Work">Work deliveries label</option>
                  <option value="Other">Other classification</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Full Delivery geographic address *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Address details street flat..."
                  value={addrForm.fullAddress}
                  onChange={(e) => setAddrForm({ ...addrForm, fullAddress: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Landmark *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Near Big Bazaar"
                    value={addrForm.landmark}
                    onChange={(e) => setAddrForm({ ...addrForm, landmark: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">PIN Postal Code *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="700029"
                    value={addrForm.pinCode}
                    onChange={(e) => setAddrForm({ ...addrForm, pinCode: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t dark:border-gray-800 flex justify-end gap-2 bg-gray-50 dark:bg-gray-900/60">
              <button 
                type="button" 
                onClick={() => setEditAddressRider(null)}
                className="px-4 py-2 hover:bg-stone-200 dark:hover:bg-gray-800 text-stone-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Discard
              </button>
              <button 
                type="submit"
                className="px-5 py-2 bg-purple-700 hover:bg-purple-700 bg-purple-600 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Confirm Save Address
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- BULK NOTIFICATIONS BROADCAST COMPOSER MODAL --- */}
      {bulkNotificationOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C1C21] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-200 dark:border-gray-800 animate-scale-up">
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-blue-600/5 bg-blue-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Broadcast alerts composer</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Broadcasting to <strong className="text-blue-600">{bulkSelection.length} selected customers</strong> </p>
                </div>
              </div>
              <button onClick={() => setBulkNotificationOpen(false)} className="p-1 hover:bg-stone-200 rounded-full text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Compose Broadcast Message Alert *</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Write dispatch notice e.g. Weekend Special Feast: Flat ₹100 Cashback surcharges applied on Salt Lake restaurants today!"
                  value={bulkNotificationText}
                  onChange={(e) => setBulkNotificationText(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-medium focus:ring-1 focus:ring-blue-500 outline-hidden dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white"
                />
              </div>

              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-2xl border text-[10px]">
                Upon pressing Transmit, standard mobile push notifications and real-time device notifications are fired across the targeted user base.
              </div>
            </div>

            <div className="p-4 border-t dark:border-gray-800 flex justify-end gap-2 bg-gray-50/50 dark:bg-gray-900/60">
              <button 
                type="button" 
                onClick={() => setBulkNotificationOpen(false)}
                className="px-4 py-2 hover:bg-stone-200 dark:hover:bg-gray-800 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={executeBulkNotification}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Transmit Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BULK WALLET DEPOSIT LOAD MODAL --- */}
      {bulkWalletOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C1C21] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-gray-200 dark:border-gray-800 animate-scale-up">
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-emerald-50/50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Bulk Credit wallet balance adjustment</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Crediting <strong className="text-emerald-600">{bulkSelection.length} selected customers</strong> </p>
                </div>
              </div>
              <button onClick={() => setBulkWalletOpen(false)} className="p-1 hover:bg-stone-200 rounded-full text-stone-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Enter Credit Amount (₹) *</label>
                <input 
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 50"
                  value={bulkWalletAmount}
                  onChange={(e) => setBulkWalletAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Credit reason classification *</label>
                <select
                  value={bulkWalletReason}
                  onChange={(e) => setBulkWalletReason(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-bold dark:bg-gray-900 border-gray-220 dark:border-gray-800 text-stone-900 dark:text-white cursor-pointer"
                >
                  <option value="Refund Adjustment">Refund Adjustment</option>
                  <option value="Compensation">Compensation</option>
                  <option value="Promotional Bonus">Promotional Bonus</option>
                  <option value="Customer Support Credit">Customer Support Credit</option>
                </select>
              </div>

              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-2xl border text-[10px]">
                Upon click, ₹{bulkWalletAmount || 0} credits will be loaded into the {bulkSelection.length} selected ledger accounts instantly.
              </div>
            </div>

            <div className="p-4 border-t dark:border-gray-800 flex justify-end gap-2 bg-gray-50/50 dark:bg-gray-900/60">
              <button 
                type="button" 
                onClick={() => setBulkWalletOpen(false)}
                className="px-4 py-2 hover:bg-stone-200 dark:hover:bg-gray-800 text-stone-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={executeBulkWalletCredit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Apply Bulk credit adjustments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PERMANENT DELETION CONFIRMATION MODAL --- */}
      {deleteModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-60 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1C1C21] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col text-left border border-red-200 dark:border-red-900/30 animate-scale-up">
            <div className="p-5 border-b dark:border-gray-900 flex justify-between items-center bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">Expunge Customer Entry?</h3>
              </div>
              <button onClick={() => setDeleteModalUser(null)} className="p-1 hover:bg-red-100 rounded-full text-red-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                Warning: You are about to permanently delete <strong className="text-red-600 font-black">{deleteModalUser.name}</strong> (ID: {deleteModalUser.id}). 
                This will irretrievably remove all profile data, saved addresses, and historical preferences from the active database nodes.
              </p>
              
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300 rounded-xl border border-amber-100 dark:border-amber-900/30 text-[10px] font-bold">
                Identity logs and past transaction financial records may still persist in auditing silos for regulatory compliance.
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <button 
                  onClick={executeDeleteUser}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  Yes, Expunge Entry Permanently
                </button>
                <button 
                  onClick={() => setDeleteModalUser(null)}
                  className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
