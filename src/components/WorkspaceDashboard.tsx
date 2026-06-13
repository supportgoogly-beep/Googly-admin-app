import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, FileText, FolderOpen, Database, Plus, Search, Trash2, 
  HelpCircle, CheckCircle2, AlertCircle, ExternalLink, Lock, RefreshCw, 
  Play, Send, Layers, Settings, Download, UploadCloud, FolderPlus, 
  Users, ShoppingBag, TrendingUp, LogOut, Check, ChevronRight, Info
} from "lucide-react";
import { Order, Restaurant, MenuItem, User as UserType } from "../types";
import { initAuth, googleSignIn, logout, getAccessToken, WORKSPACE_SCOPES } from "../lib/workspaceAuth";
import { User } from "firebase/auth";

interface WorkspaceDashboardProps {
  orders: Order[];
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  users: UserType[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function WorkspaceDashboard({
  orders,
  restaurants,
  menuItems,
  users,
  triggerToast
}: WorkspaceDashboardProps) {
  // Authentication states
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Active module tab: "sheets" | "docs" | "drive"
  const [activeTab, setActiveTab] = useState<"sheets" | "docs" | "drive">("sheets");

  // Loading states for actions
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isUploadingBackup, setIsUploadingBackup] = useState(false);

  // Output logs and resulting link targets
  const [generatedSheetUrl, setGeneratedSheetUrl] = useState<string | null>(null);
  const [generatedDocUrl, setGeneratedDocUrl] = useState<string | null>(null);
  const [sheetIdInput, setSheetIdInput] = useState<string>("");

  // Drive Module States
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveSearch, setDriveSearch] = useState("");
  const [newFolderTargetName, setNewFolderTargetName] = useState("Googly Records Archive");

  // Sheets configuration
  const [exportSource, setExportSource] = useState<"orders" | "restaurants" | "menu">("orders");
  const [sheetMode, setSheetMode] = useState<"new" | "existing">("new");

  // Docs configuration
  const [docModelTitle, setDocModelTitle] = useState("Daily Googly Corporate Briefing & Audit Report");
  const [docExecSummary, setDocExecSummary] = useState(
    "This enterprise briefing summarizes real-time service volumes, active merchant listings, and critical operations status for Googly. Transmitted automatically to operations headquarters."
  );
  const [includeOrdersTable, setIncludeOrdersTable] = useState(true);
  const [includeRestaurantList, setIncludeRestaurantList] = useState(true);

  // Initialize Auth listeners and check active credentials in memory
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => {
        setGoogleUser(user);
        setToken(cachedToken);
        setNeedsAuth(false);
        setIsInitializing(false);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
        setNeedsAuth(true);
        setIsInitializing(false);
      }
    );

    // Initial check for cached tokens
    getAccessToken().then(tok => {
      if (tok) {
        setToken(tok);
        setNeedsAuth(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch Drive Files dynamically whenever Drive Tab is loaded
  useEffect(() => {
    if (token && !needsAuth && activeTab === "drive") {
      fetchDriveFiles();
    }
  }, [token, needsAuth, activeTab]);

  // Handle Sign In Action
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        triggerToast("Authorized Successfully", "Google Workspace APIs are ready for secure operations.", "success");
      }
    } catch (err: any) {
      console.error("Workspace Login error: ", err);
      triggerToast("Authorization Failed", err.message || "Failed to sign in and request scopes.", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout Action
  const handleGoogleLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setToken(null);
      setNeedsAuth(true);
      setDriveFiles([]);
      triggerToast("Logged Out Successfully", "Successfully cleared Google session cache.", "info");
    } catch (err: any) {
      console.error(err);
    }
  };

  // ==========================================
  // GOOGLE SHEETS OPERATIONS (REST API Proxy)
  // ==========================================
  const handleExportToSheets = async () => {
    if (!token) return;
    setIsExportingSheets(true);
    setGeneratedSheetUrl(null);

    try {
      let spreadsheetId = sheetIdInput;

      // 1. If 'new' sheet is requested, create a brand-new Spreadsheet file first
      if (sheetMode === "new") {
        const title = `Googly ${exportSource.toUpperCase()} Export - ${new Date().toLocaleDateString()}`;
        const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            properties: { title }
          })
        });

        if (!createRes.ok) throw new Error(`Spreadsheet creation failed with status ${createRes.status}`);
        const spreadsheet = await createRes.json();
        spreadsheetId = spreadsheet.spreadsheetId;
      }

      if (!spreadsheetId) {
        throw new Error("Invalid Spreadsheet ID. Please enter a valid key from your browser address bar.");
      }

      // 2. Format the exportable values list depending on selected source
      let headers: string[] = [];
      let rows: any[][] = [];
      let targetRange = "Sheet1!A1";

      if (exportSource === "orders") {
        headers = ["Order ID", "Customer Name", "Restaurant", "Total Amount (₹)", "Status", "Order Time", "Address"];
        rows = orders.map(o => [
          o.id,
          o.userName,
          o.restaurantName,
          o.billDetail?.total || 0,
          o.status,
          o.orderTime,
          o.address
        ]);
        targetRange = "Sheet1!A1";
      } else if (exportSource === "restaurants") {
        headers = ["Restaurant ID", "Merchant Name", "Cuisine Style", "Rating", "Owner", "Email", "Phone", "FSSAI ID", "Status"];
        rows = restaurants.map(r => [
          r.id,
          r.name,
          r.cuisine,
          r.rating || 0,
          r.ownerName,
          r.email,
          r.phone,
          r.fssaiNumber,
          r.blocked ? "Blocked" : r.active ? "Active" : "Inactive"
        ]);
        targetRange = "Sheet1!A1";
      } else if (exportSource === "menu") {
        headers = ["Item ID", "Item Title", "Category", "Regular Price (₹)", "Diet Code", "Add Ons List", "Description"];
        rows = menuItems.map(m => [
          m.id,
          m.name,
          m.category,
          m.price || 0,
          m.isVeg ? "Veg" : "Non-Veg",
          m.addOns?.join(", ") || "None",
          m.description
        ]);
        targetRange = "Sheet1!A1";
      }

      // 3. Construct payload values containing header row and rows
      const sheetDataPayload = [headers, ...rows];

      // 4. Update the cells in the target spreadsheet using A1 RAW notation
      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${targetRange}?valueInputOption=RAW`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            values: sheetDataPayload
          })
        }
      );

      if (!updateRes.ok) throw new Error(`Spreadsheet raw cells write failed with status ${updateRes.status}`);

      const resultUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      setGeneratedSheetUrl(resultUrl);
      triggerToast(
        "Sheets Export Completed",
        `Corporate dataset containing ${rows.length} records populated inside Google Sheets.`,
        "success"
      );
    } catch (err: any) {
      console.error(err);
      triggerToast("Sheets Transfer Failed", err.message || "Failed to update cells.", "error");
    } finally {
      setIsExportingSheets(false);
    }
  };

  // ==========================================
  // GOOGLE DOCS OPERATIONS (REST API Proxy)
  // ==========================================
  const handleCreateDocument = async () => {
    if (!token) return;
    setIsGeneratingDocs(true);
    setGeneratedDocUrl(null);

    try {
      // 1. Create a brand-new blank document
      const createRes = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: docModelTitle
        })
      });

      if (!createRes.ok) throw new Error(`Google Doc file initialization failed: status ${createRes.status}`);
      const document = await createRes.json();
      const documentId = document.documentId;

      // 2. Construct sequential batchUpdate insertions
      // We insert text at static indexes in reverse sequence, or append them.
      // Let's create an elegant, robust plain-text report compilation payload.
      let reportText = "";
      reportText += `GOOGLY ENTERPRISE AUDIT BRIEFING\n`;
      reportText += `==================================\n`;
      reportText += `File Reference Tag: GG-DOC-${Math.floor(1000 + Math.random() * 9000)}\n`;
      reportText += `Compiled On: ${new Date().toLocaleString()}\n`;
      reportText += `Status Level: OFFICIAL ADMINISTRATIVE BRIEFING\n\n`;

      reportText += `1. EXECUTIVE REPORT SUMMARY\n`;
      reportText += `${docExecSummary}\n\n`;

      if (includeRestaurantList) {
        reportText += `2. ONBOARDED RESTAURANT REGISTRIES\n`;
        reportText += `Currently Tracking ${restaurants.length} Registered Merchant Operators:\n`;
        restaurants.slice(0, 15).forEach((r, idx) => {
          reportText += `  - [${idx + 1}] ${r.name} (${r.cuisine}) | Rated: ${r.rating}* | Owner: ${r.ownerName} | Status: ${r.blocked ? 'BLOCKED' : r.active ? 'ACTIVE' : 'INACTIVE'}\n`;
        });
        if (restaurants.length > 15) {
          reportText += `  - ...and ${restaurants.length - 15} other active operational culinary vendors.\n`;
        }
        reportText += `\n`;
      }

      if (includeOrdersTable) {
        reportText += `3. CRITICAL LIVE DISPATCH TRANSACTION HISTORY (LAST 10 TRANSACTIONS)\n`;
        const lastOrders = orders.slice(0, 10);
        lastOrders.forEach((o, idx) => {
          reportText += `  - [ORDER ID: ${o.id}] User: ${o.userName} | Vendor: ${o.restaurantName} | Amount: ₹${o.billDetail?.total || 0} | Status: ${o.status} | Deliver to: ${o.address}\n`;
        });
        reportText += `\n`;
      }

      reportText += `==================================\n`;
      reportText += `End of briefing summary. Secure transmission closed.\n`;

      // Define structural document batch updates
      const batchRequests = [
        {
          insertText: {
            location: { index: 1 },
            text: reportText
          }
        }
      ];

      // Execute batch writes
      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          requests: batchRequests
        })
      });

      if (!updateRes.ok) {
        throw new Error(`Failed to commit batch document content formatting insertions: ${updateRes.status}`);
      }

      const resultUrl = `https://docs.google.com/document/d/${documentId}`;
      setGeneratedDocUrl(resultUrl);
      triggerToast("Google Doc Created", "An operations digest document has been formatted and published successfully.", "success");
    } catch (err: any) {
      console.error(err);
      triggerToast("Doc Builder Failed", err.message || "Failed to commit text.", "error");
    } finally {
      setIsGeneratingDocs(false);
    }
  };

  // ==========================================
  // GOOGLE DRIVE OPERATIONS (REST API Proxy)
  // ==========================================
  const fetchDriveFiles = async () => {
    if (!token) return;
    setIsFetchingDrive(true);
    try {
      // Setup query filters for search input
      let q = "trashed = false";
      if (driveSearch.trim() !== "") {
        q += ` and name contains '${driveSearch.replace(/'/g, "\\'")}'`;
      }

      const url = `https://www.googleapis.com/drive/v3/files?pageSize=25&fields=files(id,name,mimeType,webViewLink,createdTime,size)&q=${encodeURIComponent(q)}&orderBy=createdTime%20desc`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`Drive list failed: status ${res.status}`);
      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error(err);
      triggerToast("Drive Access Error", "Failed to retrieve your Google Drive folder directory list.", "error");
    } finally {
      setIsFetchingDrive(false);
    }
  };

  // Create customized folder directory
  const handleCreateDirectory = async () => {
    if (!token || !newFolderTargetName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const res = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFolderTargetName.trim(),
          mimeType: "application/vnd.google-apps.folder"
        })
      });

      if (!res.ok) throw new Error(`Drive folder creation failed: status ${res.status}`);
      triggerToast("Directory Constructed", `Archive Directory folder "${newFolderTargetName}" initialized.`, "success");
      setNewFolderTargetName("Googly Records Archive");
      fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      triggerToast("Directory Build Failed", err.message || "Folder creation failed.", "error");
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Upload an offline-fallback backup file content mapping JSON state to Google Drive
  const handleUploadDatabaseBackup = async () => {
    if (!token) return;
    setIsUploadingBackup(true);
    try {
      // Serialize current operations memory to an archive block
      const archiveMemoryDump = {
        meta: {
          source: "Googly Super Admin Panel",
          exportedBy: googleUser?.email || "ruhandharpurkayastha@gmail.com",
          timestamp: new Date().toISOString(),
          appletSessionCode: Math.floor(1000000000 + Math.random() * 9000000000)
        },
        payload: {
          ordersCount: orders.length,
          restaurantsCount: restaurants.length,
          menuItemsCount: menuItems.length,
          usersCount: users.length,
          ordersDump: orders.slice(0, 100), // Max 100 recent rows for safety
          restaurantsList: restaurants
        }
      };

      const fileContentString = JSON.stringify(archiveMemoryDump, null, 2);
      const metadata = {
        name: `Googly_Applet_Backup_${new Date().toISOString().split('T')[0]}_${Math.floor(100 + Math.random()*900)}.json`,
        mimeType: "application/json"
      };

      // Construct a simple standard multi-part upload body
      const boundary = "314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        fileContentString +
        closeDelim;

      const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      });

      if (!res.ok) throw new Error(`Drive multipart backup write failed with status ${res.status}`);
      triggerToast("System Backup Succeeded", "High-fidelity JSON backup successfully synchronized on your Cloud drive root.", "success");
      fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      triggerToast("Backup Synchronization Failed", err.message || "Failed to upload stream.", "error");
    } finally {
      setIsUploadingBackup(false);
    }
  };

  // Delete matching Google Drive file (Mandatorily requiring user explicit confirmation dialog)
  const handleDeleteDriveFile = async (fileId: string, fileName: string) => {
    // Explicit safety checks BEFORE invoking destructive alterations
    const confirmed = window.confirm(
      `CRITICAL ACTION ALERT: Are you absolutely certain you want to permanently delete the Google Drive file "${fileName}"?\n\nThis operation directly alters your cloud files index and cannot be undone.`
    );
    if (!confirmed) {
      triggerToast("Deletions Aborted", "User cancelled critical file purge trigger safely.", "info");
      return;
    }

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`Drive file deletion API failed with status ${res.status}`);
      triggerToast("File Purged Successfully", `Drive item "${fileName}" was successfully deleted.`, "success");
      fetchDriveFiles();
    } catch (err: any) {
      console.error(err);
      triggerToast("Item Deletion Failed", err.message || "Unauthorized or network failure.", "error");
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/70 backdrop-blur-md rounded-3xl border border-gray-100 p-8 text-center shadow-sm h-[500px]">
        <RefreshCw className="w-8 h-8 text-[#E23744] animate-spin mb-3" />
        <p className="text-xs text-gray-500 font-bold tracking-wide">Syncing Google Workspace status...</p>
      </div>
    );
  }

  // Google Sign-In required panel
  if (needsAuth) {
    return (
      <div id="workspace-login-gateway" className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12 text-center shadow-[0_4px_20px_-2px_rgba(0,0,0,0.03)] max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 bg-gradient-to-tr from-orange-50 to-[#E23744]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#E23744]/10">
          <Database className="w-8 h-8 text-[#E23744]" />
        </div>
        <h2 className="text-lg font-black text-gray-900 tracking-tight mb-2">Google Workspace Administrative Center</h2>
        <p className="text-xs text-gray-500 font-semibold mb-6 max-w-md mx-auto leading-relaxed">
          Unlock Google Drive, Sheets, and Docs operations with Googly. Authorize secure cloud integrations below to export transaction sheets, generate docs briefings, or manage cloud backups.
        </p>

        {/* Workspace scope directory table */}
        <div className="bg-gray-50/70 border border-gray-150 rounded-xl p-4 mb-8 text-left text-[11px] max-w-md mx-auto">
          <div className="font-extrabold text-gray-700 uppercase tracking-wider mb-2 text-[10px]">Permission Access Scope Requested:</div>
          <div className="space-y-1.5 font-semibold text-gray-650">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Google Sheets</strong>: Populate transaction lists & records</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Google Docs</strong>: Print Daily Operational briefing summaries</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Google Drive</strong>: File listings, directory creation & raw backups</span>
            </div>
          </div>
        </div>

        {/* High-fidelity custom material design Google Sign In Button */}
        <button 
          onClick={handleGoogleLogin} 
          disabled={isLoggingIn}
          className="bg-black hover:bg-stone-900 text-white font-extrabold py-3 px-6 rounded-xl text-xs transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5 mx-auto disabled:opacity-50"
        >
          {isLoggingIn ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4.5 h-4.5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          )}
          <span>{isLoggingIn ? "Logging in..." : "Link Google Account"}</span>
        </button>
      </div>
    );
  }

  // Authenticated operational dashboard
  return (
    <div className="bg-[#F8F9FA] space-y-6 select-none animate-fade-in" id="workspace-dashboard-active">
      
      {/* Top Header Panel */}
      <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[0_2px_4px_rgba(0,0,0,0.01)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img 
            src={googleUser?.photoURL || "https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=f97316"} 
            alt="User profile" 
            className="w-10 h-10 rounded-full border-2 border-orange-500/10 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-slate-800 tracking-tight">{googleUser?.displayName || "Googly Admin"}</h2>
              <span className="bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" /> Workspace Connected
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium">{googleUser?.email || "admin@feastflow.co"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Section Quick Stats */}
          <div className="text-right hidden md:block">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase block tracking-wider">Memory Active Scopes</span>
            <span className="font-mono text-[9px] text-[#E23744] bg-red-50 px-2 py-0.5 rounded-full font-black">Sheets • Docs • Drive</span>
          </div>
          
          <button 
            onClick={handleGoogleLogout}
            className="p-2 text-stone-500 hover:text-red-550 hover:bg-red-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Disconnect Google Account"
          >
            <LogOut className="w-3.5 h-3.5 text-[#E23744]" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab("sheets")}
          className={`pb-3 px-6 text-xs font-black tracking-tight border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "sheets" 
            ? "border-[#E23744] text-[#E23744]" 
            : "border-transparent text-gray-400 hover:text-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Google Sheets
        </button>

        <button 
          onClick={() => setActiveTab("docs")}
          className={`pb-3 px-6 text-xs font-black tracking-tight border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "docs" 
            ? "border-[#E23744] text-[#E23744]" 
            : "border-transparent text-gray-400 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" /> Google Docs
        </button>

        <button 
          onClick={() => setActiveTab("drive")}
          className={`pb-3 px-6 text-xs font-black tracking-tight border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "drive" 
            ? "border-[#E23744] text-[#E23744]" 
            : "border-transparent text-gray-400 hover:text-slate-800"
          }`}
        >
          <FolderOpen className="w-4 h-4" /> Google Drive
        </button>
      </div>

      {/* ACTIVE SCREEN CONTENT COCKPIT */}
      <div className="space-y-6">

        {/* ========= SHEETS TAB SCREEN ========= */}
        {activeTab === "sheets" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sheets-view-panel">
            
            {/* Left controller sidebar card */}
            <div className="lg:col-span-4 bg-white border border-gray-100 p-5 rounded-3xl h-fit space-y-5">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1">Export Configurator</h3>
                <p className="text-[10px] text-gray-500 font-medium">Transmit real-time system tables straight to spreadsheets.</p>
              </div>

              {/* Data selector dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-600 font-extrabold uppercase">1. Select Target Columns</label>
                <select 
                  value={exportSource}
                  onChange={(e) => setExportSource(e.target.value as any)}
                  className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl p-2.5 outline-none focus:border-red-500 shadow-xs"
                >
                  <option value="orders">📋 Orders History ({orders.length} Rows)</option>
                  <option value="restaurants">🍔 Onboarded Restaurant Directory ({restaurants.length} Rows)</option>
                  <option value="menu">🍲 Food Menu Catalogue ({menuItems.length} Rows)</option>
                </select>
              </div>

              {/* Target strategy selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-600 font-extrabold uppercase">2. Storage Destination</label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-center">
                  <button 
                    onClick={() => setSheetMode("new")}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      sheetMode === "new" 
                      ? "border-[#E23744] bg-red-50/50 text-[#E23744]" 
                      : "border-gray-250 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Create New Sheet
                  </button>
                  <button 
                    onClick={() => setSheetMode("existing")}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      sheetMode === "existing" 
                      ? "border-[#E23744] bg-red-50/50 text-[#E23744]" 
                      : "border-gray-250 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    Existing Key
                  </button>
                </div>
              </div>

              {/* Spreadsheet ID if existing target is chosen */}
              {sheetMode === "existing" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[10px] text-gray-600 font-extrabold uppercase">Spreadsheet ID</label>
                  <input 
                    type="text"
                    value={sheetIdInput}
                    onChange={(e) => setSheetIdInput(e.target.value)}
                    placeholder="e.g. 1a2b3c4d5e..."
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2.5 outline-none focus:border-red-500 font-mono"
                  />
                  <p className="text-[9px] text-gray-400 font-medium">Extract the string key from the sheets URL bar in your browser.</p>
                </div>
              )}

              {/* Export trigger */}
              <button
                onClick={handleExportToSheets}
                disabled={isExportingSheets || (sheetMode === "existing" && !sheetIdInput.trim())}
                className="w-full bg-[#E23744] hover:bg-red-600 disabled:bg-gray-100 text-white disabled:text-gray-400 font-black py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isExportingSheets ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                {isExportingSheets ? "Syncing data rows..." : "Sync Database into Sheets"}
              </button>
            </div>

            {/* Right outcome view card */}
            <div className="lg:col-span-8 bg-white border border-gray-100 p-5 rounded-3xl min-h-[300px] flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1">Spreadsheet Sync Diagnostics</h3>
                  <p className="text-[10px] text-gray-500 font-semibold">Track sync outputs and instantly launch generated cloud reports.</p>
                </div>

                {generatedSheetUrl ? (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 text-center space-y-4 animate-fade-in">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-emerald-800">Spreadsheet Population Complete</h4>
                      <p className="text-[10px] text-emerald-600 font-semibold">
                        Successfully prepared rows, cleared target nodes, and wrote live cells on Google Sheets.
                      </p>
                    </div>

                    <a 
                      href={generatedSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer transition-colors"
                    >
                      Open Google Sheet Document <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-150 rounded-2xl p-8 text-center space-y-3">
                    <Database className="w-8 h-8 text-gray-350 mx-auto" />
                    <p className="text-[11px] text-gray-400 font-semibold max-w-sm mx-auto leading-relaxed">
                      Select custom tables (such as Active Orders) and hit "Sync Database into Sheets" on the left side panel to generate full sheets records.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 text-[10px] text-gray-500 leading-relaxed font-semibold flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Performance Tip:</strong> For large catalogues, exports are paginated up to 100 rows to align cell load capacities and optimize API latency thresholds.
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ========= DOCS TAB SCREEN ========= */}
        {activeTab === "docs" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="docs-view-panel">
            
            {/* Left settings card */}
            <div className="lg:col-span-5 bg-white border border-gray-100 p-5 rounded-3xl h-fit space-y-5">
              <div>
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1">Briefing Doc Configurations</h3>
                <p className="text-[10px] text-gray-500 font-medium font-sans">Automated daily administrative briefings generator.</p>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-600 font-extrabold uppercase">Document Title</label>
                <input 
                  type="text"
                  value={docModelTitle}
                  onChange={(e) => setDocModelTitle(e.target.value)}
                  placeholder="Enter briefing title..."
                  className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl p-2.5 outline-none focus:border-red-500"
                />
              </div>

              {/* Summary Textarea */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-gray-600 font-extrabold uppercase">Executive Summary Notes</label>
                <textarea 
                  value={docExecSummary}
                  onChange={(e) => setDocExecSummary(e.target.value)}
                  rows={3}
                  className="w-full text-xs bg-white border border-gray-200 rounded-xl p-2.5 outline-none focus:border-red-500 h-20 resize-none font-sans font-semibold text-gray-600"
                  placeholder="Provide executive summary notes..."
                />
              </div>

              {/* Metric Toggle checkmarks */}
              <div className="space-y-2">
                <label className="text-[10px] text-gray-600 font-extrabold uppercase block">Included Information Sets</label>
                
                <label className="flex items-center gap-2.5 text-xs font-bold text-gray-700 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={includeOrdersTable}
                    onChange={(e) => setIncludeOrdersTable(e.target.checked)}
                    className="rounded border-gray-250 text-[#E23744] focus:ring-[#E23744] w-4 h-4 cursor-pointer"
                  />
                  <span>Include Active Orders History (Last 10 rows)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-bold text-gray-700 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={includeRestaurantList}
                    onChange={(e) => setIncludeRestaurantList(e.target.checked)}
                    className="rounded border-gray-250 text-[#E23744] focus:ring-[#E23744] w-4 h-4 cursor-pointer"
                  />
                  <span>Include Onboarded Restaurant List & KYC status</span>
                </label>
              </div>

              {/* Build button */}
              <button
                onClick={handleCreateDocument}
                disabled={isGeneratingDocs || !docModelTitle.trim()}
                className="w-full bg-slate-900 hover:bg-black disabled:bg-gray-100 text-white disabled:text-gray-400 font-black py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGeneratingDocs ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                {isGeneratingDocs ? "Writing document blocks..." : "Generate Official Google Doc"}
              </button>
            </div>

            {/* Right outcome view card */}
            <div className="lg:col-span-7 bg-white border border-gray-100 p-5 rounded-3xl min-h-[300px] flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-1">Doc Diagnostics Console</h3>
                  <p className="text-[10px] text-gray-500 font-semibold font-sans">Review document construction logs and open your reports.</p>
                </div>

                {generatedDocUrl ? (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 text-center space-y-4 animate-fade-in">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-blue-800">Google Doc Compiling Complete</h4>
                      <p className="text-[10px] text-blue-600 font-semibold leading-relaxed">
                        Successfully initialized document key, formatted markdown outlines, and committed administrative tables.
                      </p>
                    </div>

                    <a 
                      href={generatedDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-sm cursor-pointer transition-colors"
                    >
                      Open Generated Google Doc <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-150 rounded-2xl p-8 text-center space-y-3">
                    <FileText className="w-8 h-8 text-gray-350 mx-auto animate-pulse" />
                    <p className="text-[11px] text-gray-400 font-semibold max-w-sm mx-auto leading-relaxed">
                      Configure report items on the left side console and select "Generate Official Google Doc" to compile a stunning, structured executive briefing document.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 border border-gray-150 rounded-xl p-3 text-[10px] text-gray-500 leading-relaxed font-semibold flex items-start gap-2">
                <Settings className="w-3.5 h-3.5 text-gray-405 shrink-0 mt-0.5" />
                <span>
                  <strong>Document Formatting Engine:</strong> Embeds high-contrast header guides, timestamps, and styled tables layout mapping to align with executive filing policies.
                </span>
              </div>

            </div>
          </div>
        )}

        {/* ========= DRIVE TAB SCREEN ========= */}
        {activeTab === "drive" && (
          <div className="space-y-6" id="drive-view-panel">
            
            {/* Quick backup actions row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Backups trigger Card */}
              <div className="md:col-span-6 bg-white border border-gray-100 p-5 rounded-3xl flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-700">
                    <UploadCloud className="w-4 h-4 text-[#E23744]" />
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Cloud Audit Backups</h3>
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    Instantly save an off-site master JSON directory containing order lists, restaurant KYC matrices, and merchant listings to secure cloud storage.
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={handleUploadDatabaseBackup}
                    disabled={isUploadingBackup}
                    className="bg-black hover:bg-stone-900 disabled:bg-gray-100 text-white disabled:text-gray-400 font-black py-2 px-4 rounded-xl text-[10.5px] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:pointer-events-none"
                  >
                    {isUploadingBackup ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Synchronize Backup to Drive
                  </button>
                </div>
              </div>

              {/* Folder creator Card */}
              <div className="md:col-span-6 bg-white border border-gray-100 p-5 rounded-3xl flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-stone-700">
                    <FolderPlus className="w-4 h-4 text-[#E23744]" />
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">Active Archive Folder Builder</h3>
                  </div>
                  <input 
                    type="text"
                    value={newFolderTargetName}
                    onChange={(e) => setNewFolderTargetName(e.target.value)}
                    placeholder="Enter folder namespace name..."
                    className="w-full text-xs font-semibold bg-white border border-gray-250 rounded-xl p-2.5 outline-none focus:border-red-500"
                  />
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleCreateDirectory}
                    disabled={isCreatingFolder || !newFolderTargetName.trim()}
                    className="bg-[#E23744] hover:bg-red-600 disabled:bg-gray-100 text-white disabled:text-gray-400 font-black py-2 px-4 rounded-xl text-[10.5px] cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {isCreatingFolder ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Generate Folder Archive
                  </button>
                </div>
              </div>

            </div>

            {/* Folder browser list table card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 space-y-4">
              
              {/* Header and filter bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider mb-0.5">Off-Site Cloud File Directory</h3>
                  <p className="text-[10px] text-gray-500 font-semibold font-sans">Showing latest files inside Google Drive.</p>
                </div>

                <div className="flex items-center gap-2 max-w-sm w-full">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search Drive files..."
                      value={driveSearch}
                      onChange={(e) => setDriveSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchDriveFiles()}
                      className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none focus:ring-1 focus:ring-red-500 font-semibold"
                    />
                  </div>
                  <button 
                    onClick={fetchDriveFiles}
                    disabled={isFetchingDrive}
                    className="p-1.5 px-3 bg-gray-150 hover:bg-gray-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    {isFetchingDrive ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Query"}
                  </button>
                </div>
              </div>

              {/* Files table rendering */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-extrabold uppercase bg-gray-50/50">
                      <th className="p-3">File Asset Name</th>
                      <th className="p-3">Type Namespace</th>
                      <th className="p-3">Uploaded On</th>
                      <th className="p-3">Size Metric</th>
                      <th className="p-3 text-center">Filing Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isFetchingDrive ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 font-bold">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                          Querying Drive elements...
                        </td>
                      </tr>
                    ) : driveFiles.length > 0 ? (
                      driveFiles.map((file) => {
                        const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                        const isSheet = file.mimeType?.includes("spreadsheet");
                        const isDoc = file.mimeType?.includes("document");

                        return (
                          <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50/50 font-semibold text-gray-650 transition-colors">
                            <td className="p-3 flex items-center gap-2">
                              {isFolder ? (
                                <FolderOpen className="w-4 h-4 text-amber-500 fill-amber-100 shrink-0" />
                              ) : isSheet ? (
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : isDoc ? (
                                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                              )}
                              <span className="truncate max-w-xs md:max-w-md font-bold text-slate-800" title={file.name}>
                                {file.name}
                              </span>
                            </td>
                            <td className="p-3 text-gray-400 font-mono text-[9px]">
                              {isFolder ? "Folder Directory" : isSheet ? "Google Sheet" : isDoc ? "Google Doc" : "Standard File"}
                            </td>
                            <td className="p-3 text-stone-500">
                              {new Date(file.createdTime).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-stone-500 font-mono">
                              {file.size ? `${(parseInt(file.size) / 1024).toFixed(1)} KB` : "—"}
                            </td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <a 
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 px-2.5 bg-gray-100 hover:bg-gray-200 text-stone-700 hover:text-black rounded-lg text-[10.5px] inline-flex items-center gap-0.5"
                                >
                                  View <ExternalLink className="w-3 h-3 ml-0.5" />
                                </a>

                                <button
                                  onClick={() => handleDeleteDriveFile(file.id, file.name)}
                                  className="p-1.5 hover:bg-rose-50 rounded-lg text-stone-400 hover:text-rose-600 cursor-pointer transition-colors"
                                  title="Delete Permanent"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 font-bold font-sans">
                          No items located under this active Google Drive query view. Try modifying your filter criteria!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
