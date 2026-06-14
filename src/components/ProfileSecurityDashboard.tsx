import React, { useState, useEffect, useMemo, useRef } from "react";
import { ProfileSecurity } from "../types";
import { 
  User, Check, Shield, Key, Smartphone, Monitor, Clock, Lock, 
  Unlock, Eye, EyeOff, CheckCircle2, AlertTriangle, AlertCircle, Trash2, 
  MapPin, LogOut, Upload, RefreshCw, EyeIcon, Save, X, Phone, Mail, 
  Sliders, Bell, RefreshCcw, Download, Info, ShieldCheck, Cpu
} from "lucide-react";
import { auth } from "../lib/firebase";
import { updateProfile } from "firebase/auth";
import { uploadFile } from "../lib/storage";

interface ProfileSecurityDashboardProps {
  profile: ProfileSecurity;
  setProfile: React.Dispatch<React.SetStateAction<ProfileSecurity>>;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
  onLogout: () => void;
}

// Model for security events
interface SecurityEvent {
  id: string;
  eventType: string;
  device: string;
  browser: string;
  ipAddress: string;
  location: string;
  dateTime: string;
}

// Model for active sessions
interface LoginSession {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  loginTime: string;
  lastActivity: string;
  status: "Current Session" | "Active" | "Expired";
}

export default function ProfileSecurityDashboard({
  profile,
  setProfile,
  triggerToast,
  onLogout
}: ProfileSecurityDashboardProps) {

  // Theme states
  const [isLocalDark, setIsLocalDark] = useState(false);

  // Editable Profile Form States
  const [fullName, setFullName] = useState(profile.name || "");
  const [userEmail, setUserEmail] = useState(profile.email || "");
  const [jobTitle, setJobTitle] = useState("Chief Operations Administrator");
  const [phoneNum, setPhoneNum] = useState("+91 98765 43210");
  const [department, setDepartment] = useState("System Infrastructure & Logistics");
  const [prefLang, setPrefLang] = useState("English (US)");
  const [timeZone, setTimeZone] = useState("Kolkata, India (GMT+5:30)");
  const [employeeId, setEmployeeId] = useState("EMP-2026-X8914");
    
  useEffect(() => {
    try {
      const user = auth().currentUser;
      if (user) {
        setFullName(user.displayName || profile.name || "Ruhandhar Purkayastha");
        setUserEmail(user.email || profile.email || "ruhandharpurkayastha@gmail.com");
      }
    } catch (e) {
      console.warn("Firebase Auth unavailable:", e);
    }
  }, []);
  
  // Custom interactive avatar support
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200");
  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
  ];

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // 2FA Setup Flow State
  const [show2FAsetupModal, setShow2FAsetupModal] = useState(false);
  const [googleAuthCode, setGoogleAuthCode] = useState("");
  const [temp2FASecret, setTemp2FASecret] = useState("GGLY-SECU-2FA-78X9-4P12-WZ5G");
  const [backupCodes, setBackupCodes] = useState<string[]>([
    "8314-9025", "4412-1089", "7891-3444", "2015-8891", "6703-4921", "1103-8824"
  ]);
  const [hasDownloadedBackup, setHasDownloadedBackup] = useState(false);

  // Recovery values
  const [recoveryEmail, setRecoveryEmail] = useState("ruhan.recovery@authnode.org");
  const [recoveryPhone, setRecoveryPhone] = useState("+91 93214 00099");

  // Edit / Saved Mode states
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Privacy Options states
  const [privacyShowProfile, setPrivacyShowProfile] = useState(true);
  const [privacyShowContact, setPrivacyShowContact] = useState(false);
  const [privacyActivityVisible, setPrivacyActivityVisible] = useState(true);
  const [prefEmailNotif, setPrefEmailNotif] = useState(true);
  const [prefSmsNotif, setPrefSmsNotif] = useState(true);
  const [prefPushNotif, setPrefPushNotif] = useState(false);

  // Logout options config
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutScopeType, setLogoutScopeType] = useState<"current" | "all" | "clear">("current");

  // Sessions list
  const [sessions, setSessions] = useState<LoginSession[]>([
    {
      id: "sess-1",
      deviceName: "Apple MacBook Pro 16",
      browser: "Chrome v124.0",
      os: "macOS Sonoma",
      ipAddress: "192.168.1.155",
      location: "Kolkata, India",
      loginTime: "2026-06-12 10:14:22",
      lastActivity: "Just Now",
      status: "Current Session"
    },
    {
      id: "sess-2",
      deviceName: "iPad Pro 11-inch",
      browser: "Safari Mobile",
      os: "iOS 17.4",
      ipAddress: "192.168.1.189",
      location: "Kolkata, India",
      loginTime: "2026-06-11 18:22:15",
      lastActivity: "14 hours ago",
      status: "Active"
    },
    {
      id: "sess-3",
      deviceName: "OnePlus 12 Core Engine",
      browser: "Firefox Android",
      os: "Android 14",
      ipAddress: "103.44.112.92",
      location: "Salt Lake Sector 5",
      loginTime: "2026-06-10 12:05:40",
      lastActivity: "2 days ago",
      status: "Active"
    },
    {
      id: "sess-4",
      deviceName: "Windows Terminal Workstation",
      browser: "Edge Engine",
      os: "Windows 11",
      ipAddress: "172.56.22.10",
      location: "Unknown Location",
      loginTime: "2026-05-30 09:12:00",
      lastActivity: "Expired Session",
      status: "Expired"
    }
  ]);

  // Security Events Audit History Logs (Reactive list)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([
    {
      id: "evt-1",
      eventType: "Login Successful",
      device: "MacBook Pro 16",
      browser: "Chrome",
      ipAddress: "192.168.1.155",
      location: "Kolkata, India",
      dateTime: "2026-06-12 10:14:22"
    },
    {
      id: "evt-2",
      eventType: "Two-Factor (2FA) Code Validated",
      device: "MacBook Pro 16",
      browser: "Chrome",
      ipAddress: "192.168.1.155",
      location: "Kolkata, India",
      dateTime: "2026-06-12 10:14:25"
    },
    {
      id: "evt-3",
      eventType: "Password Verified & Accepted",
      device: "MacBook Pro 16",
      browser: "Chrome",
      ipAddress: "103.44.112.92",
      location: "Kolkata Mobile Cell",
      dateTime: "2026-06-10 12:01:10"
    },
    {
      id: "evt-4",
      eventType: "Failed Login Attempt (Bypass Warn)",
      device: "Unknown Terminal",
      browser: "Headless Chromium API",
      ipAddress: "45.18.239.11",
      location: "Frankfurt, EU (Proxy Core)",
      dateTime: "2026-06-05 23:44:11"
    }
  ]);

  // Handle Event Detail pop-up helper
  const [viewEventDetail, setViewEventDetail] = useState<SecurityEvent | null>(null);

  // Dynamic Password Validation Checklist indicators
  const passwordValidator = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword)
    };
  }, [newPassword]);

  // Dynamic Password Score meter logic (0 to 5)
  const passwordScore = useMemo(() => {
    let score = 0;
    if (passwordValidator.minLength) score++;
    if (passwordValidator.hasUpper) score++;
    if (passwordValidator.hasLower) score++;
    if (passwordValidator.hasNumber) score++;
    if (passwordValidator.hasSpecial) score++;
    return score;
  }, [passwordValidator]);

  // Multi-tier Security Score: calculates dynamic rating index (Excellent / Strong / Moderate / Weak)
  const calculatedSecurityHealth = useMemo(() => {
    let scoreValue = 20; // baseline password presence
    if (profile.twoFactorEnabled) scoreValue += 40;
    if (recoveryEmail && recoveryPhone) scoreValue += 20;
    
    // Active sessions factor
    const activeUnexpiredCount = sessions.filter(s => s.status !== "Expired").length;
    if (activeUnexpiredCount <= 2) scoreValue += 20;
    else if (activeUnexpiredCount <= 4) scoreValue += 10;

    let grade: "Weak" | "Moderate" | "Strong" | "Excellent" = "Weak";
    let colorText = "text-rose-500 fill-rose-500";
    let colorBg = "bg-rose-500/10 border-rose-500/25";
    let progressPercent = 30;

    if (scoreValue >= 90) {
      grade = "Excellent";
      colorText = "text-emerald-500 fill-emerald-500";
      colorBg = "bg-emerald-500/10 border-emerald-500/25";
      progressPercent = 100;
    } else if (scoreValue >= 70) {
      grade = "Strong";
      colorText = "text-sky-500 fill-sky-500";
      colorBg = "bg-sky-500/10 border-sky-400/25";
      progressPercent = 80;
    } else if (scoreValue >= 50) {
      grade = "Moderate";
      colorText = "text-amber-500 fill-amber-500";
      colorBg = "bg-amber-500/10 border-amber-500/25";
      progressPercent = 55;
    }

    return { grade, colorText, colorBg, scorePercent: progressPercent, numScore: scoreValue };
  }, [profile.twoFactorEnabled, sessions, recoveryEmail, recoveryPhone]);

  const avatarFileRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerToast("Syncing S3...", "Uploading custom identity payload to Googly Storage", "info");
      const result = await uploadFile(file);
      if (result.success && result.url) {
        setAvatarUrl(result.url);
        triggerToast("Profile Image Secured", "Identity asset synchronized successfully.", "success");
      } else {
        triggerToast("Storage Failed", result.error || "Could not bridge to CDN network", "error");
      }
    }
  };

  // Save General details changes
  const handleSaveGeneralInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !userEmail) {
      triggerToast("Preconditions Invalid", "Check validation fields are populated.", "error");
      return;
    }
    
    // Update Firebase Profile
    let user = null;
    try {
      user = auth().currentUser;
    } catch (e) {
      console.warn("Firebase Auth unavailable:", e);
    }
    
    if (user) {
        try {
            await updateProfile(user, { displayName: fullName });
        } catch (error) {
            console.error("Failed to update profile:", error);
            triggerToast("Sync Error", "Failed to sync profile change to cloud.", "error");
            return;
        }
    }

    // Commit back to centralized App state
    setProfile(prev => ({
      ...prev,
      name: fullName,
      email: userEmail
    }));
    setIsEditingInfo(false);
    triggerToast("Identity Confirmed", "Personal data lake vectors synchronized.", "success");


    // Prepend to audit log
    const newLogEntry: SecurityEvent = {
      id: `evt-${Date.now()}`,
      eventType: "Profile Meta Altered",
      device: "Primary Dashboard Panel",
      browser: "React CRM",
      ipAddress: "127.0.0.1 (LocalHost)",
      location: "System Memory Local",
      dateTime: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setSecurityEvents(prev => [newLogEntry, ...prev]);
  };

  // Change avatar logic
  const handleAvatarFile = () => {
    // Cycles in presets
    const nextIndex = (avatarPresets.indexOf(avatarUrl) + 1) % avatarPresets.length;
    setAvatarUrl(avatarPresets[nextIndex]);
    triggerToast("Profile Image Configured", "Avatar image changed successfully.", "info");
  };

  // Remove Avatar
  const handleRemovePhoto = () => {
    setAvatarUrl("https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200");
    triggerToast("Profile Image Reset", "Corporate preset identity replaced.", "info");
  };

  // Manage dynamic password submission
  const handleUpdatePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      triggerToast("Missing security block", "Please provide current authenticator secret first.", "error");
      return;
    }
    if (passwordScore < 4) {
      triggerToast("Insecure Password Complexity", "Satisfy required entropy checks before rotating keys.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast("Key mismatch", "New confirmation entries do not correspond.", "error");
      return;
    }

    setProfile(prev => ({
      ...prev,
      passwordChangedAt: new Date().toISOString().split("T")[0]
    }));

    // Inject history entry
    const newHistoryAudit: SecurityEvent = {
      id: `evt-${Date.now()}`,
      eventType: "Password Rotation Confirmed",
      device: "Secure Workspace Node",
      browser: "Chrome (Rotative)",
      ipAddress: "192.168.1.155",
      location: "Kolkata Hub",
      dateTime: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setSecurityEvents(prev => [newHistoryAudit, ...prev]);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    
    triggerToast("Password Rotation Executed", "Master pass rotated across distributed system nodes. Sessions preserved.", "success");
  };

  // 2FA Activate verification sequence
  const handleVerifyAndActivate2FA = () => {
    if (googleAuthCode.length !== 6 || !/^\d+$/.test(googleAuthCode)) {
      triggerToast("Precondition Check Fail", "Provide complete 6-digit numeric verification sequence.", "error");
      return;
    }

    // Activate
    setProfile(prev => ({
      ...prev,
      twoFactorEnabled: true,
      twoFactorSecret: temp2FASecret
    }));

    setShow2FAsetupModal(false);
    triggerToast("Two-Factor (2FA) Activated", "Authentication policy tightened with dynamic passkey token validation.", "success");

    const codeAudit: SecurityEvent = {
      id: `evt-${Date.now()}`,
      eventType: "2FA Policy Deployed",
      device: "MacBook Pro Auth Token",
      browser: "Google Authenticator Engine",
      ipAddress: "192.168.1.155",
      location: "Active IP Grid",
      dateTime: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setSecurityEvents(prev => [codeAudit, ...prev]);
  };

  const handleDeactivate2FA = () => {
    setProfile(prev => ({
      ...prev,
      twoFactorEnabled: false
    }));
    triggerToast("2FA Disabled", "Deactivated authenticator tokens. Account fallback to standard password.", "info");
    
    const codeAudit: SecurityEvent = {
      id: `evt-${Date.now()}`,
      eventType: "2FA Policy Teardown",
      device: "Master Panel Controls",
      browser: "Internal CLI",
      ipAddress: "127.0.0.1",
      location: "System Override",
      dateTime: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setSecurityEvents(prev => [codeAudit, ...prev]);
  };

  // Log Out Session
  const handleKillSession = (sessId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessId));
    triggerToast("Credentials Terminated", "Login ticket invalidated instantly from dynamic memory.", "info");

    const killAudit: SecurityEvent = {
      id: `evt-${Date.now()}`,
      eventType: "Login Ticket Revoked",
      device: "Master Panel Controls",
      browser: "Session Purge",
      ipAddress: "127.0.0.1",
      location: "Manual Revocation",
      dateTime: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setSecurityEvents(prev => [killAudit, ...prev]);
  };

  // Log Out All Other Sessions
  const handleKillAllOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.status === "Current Session"));
    triggerToast("Enterprise Core Flushed", "Invalidated all other access tokens instantly.", "success");

    const clearOtherAudit: SecurityEvent = {
      id: `evt-${Date.now()}`,
      eventType: "Bulk Session Revocation",
      device: "Enterprise Control Command",
      browser: "Memory Flush",
      ipAddress: "Local Session",
      location: "Central Domain",
      dateTime: new Date().toISOString().replace("T", " ").substring(0, 19)
    };
    setSecurityEvents(prev => [clearOtherAudit, ...prev]);
  };

  const downloadBackupCodes = () => {
    setHasDownloadedBackup(true);
    const textData = `GOOGLY RESTAURANT LOGISTICS AUTH BACKUP CODES\nGenerated: ${new Date().toLocaleString()}\nProfile: ${userEmail}\n\nCodes:\n${backupCodes.join("\n")}\n\nKeep safe. These bypass authentication sequence keys on emergencies.`;
    const element = document.createElement("a");
    const file = new Blob([textData], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "googly-security-backup-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    triggerToast("Backup Download Complete", "Keystore file exported safely.", "success");
  };

  // Perform Final Logouts
  const handleExecuteLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    triggerToast("Purging operational states", "Terminating core network session...", "info");
    onLogout();
  };

  return (
    <div id="profile-security-system" className={`space-y-6 ${isLocalDark ? "bg-slate-900 text-slate-100 p-6 rounded-3xl" : "text-slate-800"}`}>
      
      {/* 1. TOP HEADER & INSTANT CONTROLS */}
      <div className={`p-6 rounded-3xl border flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-xs ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={`text-2xl font-black tracking-tight ${isLocalDark ? "text-white" : "text-gray-900"}`}>
              Profile & Security
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-[#E23744]/10 text-[#E23744] uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3" /> Core Security Node
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Review login vectors, active credentials, password rotation parameters, and multifactor authenticity constraints.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 select-none self-stretch sm:self-auto">
          {/* Theme custom toggler */}
          <button
            onClick={() => {
              setIsLocalDark(!isLocalDark);
              triggerToast("Visual Theme Updated", `Interface shifted to ${!isLocalDark ? "Charcoal Dark" : "Corporate Light"} Mode.`, "info");
            }}
            className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isLocalDark ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-800" : "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"}`}
            title="Switch palette style"
          >
            {isLocalDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          <button
            onClick={() => {
              setIsEditingInfo(true);
              triggerToast("General Edit Mode Active", "Inputs ready for updates.", "info");
            }}
            className="px-3 py-2.5 bg-[#E23744]/10 text-[#E23744] hover:bg-[#E23744]/20 text-xs font-bold rounded-xl border border-[#E23744]/20 flex items-center gap-1 cursor-pointer transition-all"
          >
            <Sliders className="w-3.5 h-3.5" /> Quick Settings
          </button>

          <button
            onClick={() => {
              // Scroll to activity section
              const element = document.getElementById("auth-activity-logs-section");
              element?.scrollIntoView({ behavior: "smooth" });
              triggerToast("Focus Log View", "Displaying historical access audit logs.", "info");
            }}
            className="px-3.5 py-2.5 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" /> View Activity Logs
          </button>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 2. SECURITY HEALTH OVERVIEW CONTAINER */}
        <div className={`p-6 rounded-3xl border space-y-6 flex flex-col justify-between ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="space-y-4">
            <h3 className={`text-sm font-black uppercase text-gray-400 flex items-center gap-2`}>
              <Shield className="w-4 h-4 text-emerald-500" /> Security Score Card
            </h3>

            {/* Health visualizer circular representation */}
            <div className="flex flex-col items-center py-4 bg-gray-50/50 dark:bg-slate-900/20 rounded-2xl relative border border-gray-50 dark:border-slate-900">
              <div className="text-4xl font-black text-slate-900 dark:text-white font-mono flex items-baseline">
                {calculatedSecurityHealth.numScore} <span className="text-xs text-gray-400 font-bold">/100</span>
              </div>
              <div className={`mt-2 text-xs font-black uppercase inline-block px-3 py-1 rounded-full ${calculatedSecurityHealth.colorBg}`}>
                🛡️ Status: {calculatedSecurityHealth.grade}
              </div>

              {/* Progress gauge index indicator */}
              <div className="w-full max-w-[180px] bg-gray-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    calculatedSecurityHealth.grade === "Excellent" ? "bg-emerald-500" :
                    calculatedSecurityHealth.grade === "Strong" ? "bg-sky-500" :
                    calculatedSecurityHealth.grade === "Moderate" ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${calculatedSecurityHealth.scorePercent}%` }}
                ></div>
              </div>
            </div>

            {/* Diagnostic score lists */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center font-bold">
                <span className="flex items-center gap-1.5 font-semibold text-gray-500">🛡️ Password Presence</span>
                <span className="text-emerald-500">Secured</span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="flex items-center gap-1.5 font-semibold text-gray-500">🛡️ Multi-Factor 2FA Layer</span>
                {profile.twoFactorEnabled ? (
                  <span className="text-emerald-500 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Set Up</span>
                ) : (
                  <span className="text-rose-500 font-extrabold">Not Configured</span>
                )}
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="flex items-center gap-1.5 font-semibold text-gray-500">🛡️ Mobile Recovery Phone</span>
                <span className={recoveryPhone ? "text-emerald-500" : "text-rose-500"}>{recoveryPhone ? "Configured" : "None"}</span>
              </div>
              <div className="flex justify-between items-center font-bold">
                <span className="flex items-center gap-1.5 font-semibold text-gray-500">🛡️ Concurrent Sessions</span>
                <span className="text-sky-500 font-extrabold">{sessions.filter(s => s.status !== "Expired").length} Active nodes</span>
              </div>
            </div>
          </div>

          {/* Core recommendation widget audit panel */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
            <h4 className="text-xs font-black text-amber-600 flex items-center gap-1.5 uppercase">
              <AlertTriangle className="w-4 h-4" /> System Audit Warning
            </h4>
            <ul className="text-[11px] space-y-1.5 text-gray-500 dark:text-gray-400 list-none leading-relaxed">
              {!profile.twoFactorEnabled && (
                <li className="flex items-start gap-1">
                  <span>⚠️</span>
                  <span><strong>Critically High:</strong> Activate Google Authenticator (2FA) immediately to safeguard transactional ledgers.</span>
                </li>
              )}
              {sessions.filter(s => s.status !== "Expired").length > 3 && (
                <li className="flex items-start gap-1">
                  <span>⚠️</span>
                  <span><strong>Routine:</strong> Over 3 administrative login slots detected. Terminate redundant nodes.</span>
                </li>
              )}
              {(!recoveryEmail || !recoveryPhone) && (
                <li className="flex items-start gap-1">
                  <span>⚠️</span>
                  <span><strong>Medium Risk:</strong> Provide backup parameters now to avoid lockout penalties.</span>
                </li>
              )}
              {profile.twoFactorEnabled && sessions.length <= 3 && (
                <li className="text-emerald-600 font-extrabold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> All security matrices validated as fully hardened.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* 3. PROFESSIONAL PROFILE OVERVIEW CONTAINER */}
        <div className={`p-6 rounded-3xl border space-y-6 lg:col-span-2 ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex items-start justify-between flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img 
                  src={avatarUrl} 
                  alt="admin-avatar" 
                  className="w-16 h-16 rounded-full border-2 border-[#E23744] object-cover"
                />
                <input 
                  type="file" 
                  className="hidden" 
                  ref={avatarFileRef} 
                  accept="image/*" 
                  onChange={handleAvatarFileUpload}
                />
                <button 
                  onClick={() => avatarFileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 bg-[#E23744] hover:bg-[#c12632] text-white rounded-full cursor-pointer shadow-md transition-transform duration-150 hover:scale-110"
                  title="Upload custom photo"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h3 className={`text-base font-black ${isLocalDark ? "text-white" : "text-gray-900"}`}>{fullName}</h3>
                <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider block">{employeeId}</span>
                <span className="p-1 px-2.5 bg-[#E23744]/10 text-[#E23744] font-black rounded-lg text-[10px] uppercase mt-1 inline-block">
                  {department} • Admin Host
                </span>
              </div>
            </div>

            {/* Avatar Preset List Selector Grid */}
            <div className="space-y-1.5 border-t sm:border-t-0 pt-3 sm:pt-0">
              <label className="block text-[9px] font-extrabold uppercase text-gray-400">Select identity preset</label>
              <div className="flex items-center gap-1.5 select-none">
                {avatarPresets.map((av, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setAvatarUrl(av);
                      triggerToast(`Avatar Modified`, `Assigned preset slot ${idx+1}`, "success");
                    }}
                    className={`w-7 h-7 rounded-full overflow-hidden border cursor-pointer transition-all ${avatarUrl === av ? "border-[#E23744] scale-110" : "border-gray-200"}`}
                  >
                    <img src={av} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
                <button
                  onClick={handleRemovePhoto}
                  className="text-[10px] font-black text-rose-500 hover:underline cursor-pointer px-1"
                >
                  Clear Photo
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100/10 pt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold leading-normal text-slate-500">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Internal Security Node ID</span>
              <span className="text-slate-800 dark:text-white font-mono">{employeeId}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Platform Role Mapping</span>
              <span className="text-[#E23744] font-bold">{jobTitle}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Account Node Lifecycle</span>
              <span className="text-emerald-600">Active Authorized</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Creation Date</span>
              <span className="text-slate-800 dark:text-white">January 15, 2026</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Last Authentication Block</span>
              <span className="text-indigo-600 font-mono">Today, 10:14 AM</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">Preferred Context Timezone</span>
              <span className="text-slate-800 dark:text-white">GMT+5:30 Grid</span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 4. EDIT PERSONAL ADM INFORMATION FORM */}
        <div id="general-personal-info-settings" className={`p-6 rounded-3xl border space-y-4 lg:col-span-2 ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex justify-between items-center border-b border-gray-100/10 pb-3">
            <div>
              <h3 className={`text-base font-black ${isLocalDark ? "text-white" : "text-gray-900"}`}>
                Personal Information Settings
              </h3>
              <p className="text-xs text-gray-400">Update root administrative keys and contact variables.</p>
            </div>
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {isEditingInfo ? "Lock Editor" : "Unlock to Edit"}
            </button>
          </div>

          <form onSubmit={handleSaveGeneralInfo} className="space-y-4 text-xs font-bold text-gray-700 dark:text-slate-400">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-gray-500 uppercase text-[10px]">Full Name Reference *</label>
                <input
                  type="text"
                  required
                  disabled={!isEditingInfo}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"} ${!isEditingInfo && "opacity-60 cursor-not-allowed"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 uppercase text-[10px]">System Administrative Email *</label>
                <input
                  type="email"
                  required
                  disabled={!isEditingInfo}
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"} ${!isEditingInfo && "opacity-60 cursor-not-allowed"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 uppercase text-[10px]">Mobile Contact Vector</label>
                <input
                  type="text"
                  disabled={!isEditingInfo}
                  value={phoneNum}
                  onChange={(e) => setPhoneNum(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"} ${!isEditingInfo && "opacity-60 cursor-not-allowed"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 uppercase text-[10px]">Job Title Prefix</label>
                <input
                  type="text"
                  disabled={!isEditingInfo}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"} ${!isEditingInfo && "opacity-60 cursor-not-allowed"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 uppercase text-[10px]">Functional Department</label>
                <input
                  type="text"
                  disabled={!isEditingInfo}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"} ${!isEditingInfo && "opacity-60 cursor-not-allowed"}`}
                />
              </div>

              <div className="space-y-1 font-semibold">
                <label className="block text-gray-500 uppercase text-[10px]">Preferred Language Spec</label>
                <select
                  disabled={!isEditingInfo}
                  value={prefLang}
                  onChange={(e) => setPrefLang(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"} ${!isEditingInfo && "opacity-60 cursor-not-allowed"}`}
                >
                  <option value="English (US)">English (US)</option>
                  <option value="English (UK)">English (UK)</option>
                  <option value="Bengali (India)">Bengali (India)</option>
                  <option value="Hindi (India)">Hindi (India)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-500 uppercase text-[10px]">Operation Timezone Parameter</label>
              <select
                disabled={!isEditingInfo}
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"} ${!isEditingInfo && "opacity-60 cursor-not-allowed"}`}
              >
                <option value="Kolkata, India (GMT+5:30)">Kolkata, India (GMT+5:30)</option>
                <option value="London, UK (GMT+0:00)">London, UK (GMT+0:00)</option>
                <option value="New York, US (EST)">New York, US (EST)</option>
                <option value="Singapore Hub (SGT)">Singapore Hub (SGT)</option>
              </select>
            </div>

            {isEditingInfo && (
              <div className="flex justify-end gap-2 pt-2 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingInfo(false);
                    triggerToast("Adjustments Aborted", "Edits returned to pristine initial states.", "info");
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white rounded-xl transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold font-mono transition-all cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        {/* 5. PRIVACY PREFERENCES PANEL */}
        <div id="account-privacy-settings" className={`p-6 rounded-3xl border space-y-4 ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <h3 className={`text-base font-black ${isLocalDark ? "text-white" : "text-gray-900"} border-b border-gray-100/10 pb-2`}>
            Privacy Settings
          </h3>

          <div className="space-y-3.5 text-xs">
            
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">Profile Information visibility</span>
                <span className="text-[11px] text-gray-400 block font-medium">Render staff profile reference parameters in public registry.</span>
              </div>
              <input
                type="checkbox"
                checked={privacyShowProfile}
                onChange={() => setPrivacyShowProfile(!privacyShowProfile)}
                className="mt-1 rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
              />
            </div>

            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">Display Contact Info</span>
                <span className="text-[11px] text-gray-400 block font-medium">Expose mobile vectors to registered couriers on live deliveries.</span>
              </div>
              <input
                type="checkbox"
                checked={privacyShowContact}
                onChange={() => setPrivacyShowContact(!privacyShowContact)}
                className="mt-1 rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
              />
            </div>

            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">Activity Logs Visibility</span>
                <span className="text-[11px] text-gray-400 block font-medium">Save all telemetry login details dynamically.</span>
              </div>
              <input
                type="checkbox"
                checked={privacyActivityVisible}
                onChange={() => setPrivacyActivityVisible(!privacyActivityVisible)}
                className="mt-1 rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
              />
            </div>

            <div className="border-t border-gray-100/10 pt-3">
              <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wide display block mb-2">Security Channels</span>
              
              <div className="space-y-2.5 font-semibold text-gray-600 dark:text-slate-400">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefEmailNotif}
                    onChange={() => setPrefEmailNotif(!prefEmailNotif)}
                    className="rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
                  />
                  <span>Email Channel Alert Verification</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefSmsNotif}
                    onChange={() => setPrefSmsNotif(!prefSmsNotif)}
                    className="rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
                  />
                  <span>SMS Push Telemetry Vectors</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefPushNotif}
                    onChange={() => setPrefPushNotif(!prefPushNotif)}
                    className="rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
                  />
                  <span>Real-time In-App Push Warnings</span>
                </label>
              </div>
            </div>

          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 6. CHANGE PASSWORD ROTATION MODULE WITH COMPLEX CHECKS */}
        <div id="password-rotation-card" className={`p-6 rounded-3xl border space-y-4 ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <h3 className={`text-base font-black ${isLocalDark ? "text-white" : "text-gray-900"} border-b border-gray-100/10 pb-2`}>
            Rotate Account Keys
          </h3>

          <form onSubmit={handleUpdatePasswordSubmit} className="space-y-3.5 text-xs font-bold text-gray-700 dark:text-slate-400">
            
            <div className="space-y-1">
              <label className="block text-gray-500">Current Access Key *</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full p-2.5 pr-10 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-55 border-gray-200 text-slate-800"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-2.5 p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-500">New Password Sequence *</label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full p-2.5 pr-10 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-55 border-gray-200 text-slate-800"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-2.5 p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* REAL-TIME ENTROPY CHECKLIST STAGE */}
            {newPassword.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-slate-900/40 rounded-xl border border-gray-100 dark:border-slate-900 space-y-2">
                
                {/* Visual Entropy score bar */}
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                  <span>Entropy Health Factor:</span>
                  <span className={
                    passwordScore >= 4 ? "text-emerald-500" :
                    passwordScore >= 2 ? "text-amber-500" : "text-rose-500"
                  }>
                    {passwordScore >= 4 ? "Harden Complex" : "Low Entropy Indicator"}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 dark:bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-full flex-1 transition-colors ${
                        i < passwordScore 
                          ? passwordScore >= 4 ? "bg-emerald-500" : "bg-amber-400"
                          : "bg-gray-300 dark:bg-slate-800"
                      }`}
                    ></div>
                  ))}
                </div>

                {/* Validation checklist elements */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className={`flex items-center gap-1.5 ${passwordValidator.minLength ? "text-emerald-500" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> At least 8 digits
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordValidator.hasUpper ? "text-emerald-500" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uppercase alpha
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordValidator.hasLower ? "text-emerald-500" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lowercase elements
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordValidator.hasNumber ? "text-emerald-500" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Number included
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordValidator.hasSpecial ? "text-emerald-500" : "text-gray-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Special character
                  </div>
                </div>

              </div>
            )}

            <div className="space-y-1">
              <label className="block text-gray-500">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full p-2.5 pr-10 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-55 border-gray-200 text-slate-800"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-2.5 p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 text-white font-extrabold rounded-xl text-center text-xs transition-colors cursor-pointer"
            >
              Rotate Secret Matrix Keys
            </button>

          </form>
        </div>

        {/* 7. TWO-FACTOR AUTHENTICATION COMPLEMENT INTEGRATIONS */}
        <div id="two-factor-auth-panel" className={`p-6 rounded-3xl border space-y-4 ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className={`text-base font-black ${isLocalDark ? "text-white" : "text-gray-900"}`}>
                Multi-Factor Shield (2FA)
              </h3>
              <p className="text-xs text-gray-400">Enhance identity proofing protocols using software tokens.</p>
            </div>
            {profile.twoFactorEnabled ? (
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">
                Strict Guard On
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-500 uppercase tracking-wide">
                Vulnerable
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-3.5 bg-gray-50/50 dark:bg-slate-900/20 border border-gray-100 dark:border-slate-900 rounded-2xl flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-800 dark:text-white block">Authenticator Token 2FA</span>
                <span className="text-[11px] text-gray-400 block leading-tight">Requests unique 6-digit pin from Google Authenticator App on each authentication attempt.</span>
              </div>
              
              <button
                id="toggle-2fa-status-switch"
                onClick={() => {
                  if (profile.twoFactorEnabled) {
                    handleDeactivate2FA();
                  } else {
                    setShow2FAsetupModal(true);
                  }
                }}
                className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  profile.twoFactorEnabled ? "bg-emerald-600 justify-end" : "bg-gray-200 dark:bg-slate-800 justify-start"
                }`}
                title="Toggle 2FA Integration Protection Override"
              >
                <span className="bg-white w-4 h-4 rounded-full shadow-md"></span>
              </button>
            </div>

            {/* If 2FA index active details display */}
            {profile.twoFactorEnabled && (
              <div className="space-y-3.5 p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl animate-fade-in text-[11px] font-bold">
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Policy: Hardened Active</span>
                  <span className="text-[10px] font-mono select-all">Secret Seed Registered</span>
                </div>
                
                <div className="space-y-1 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-200/10 text-xs">
                  <span className="text-[9px] text-gray-400 block uppercase">Auth Seed Seed Vector</span>
                  <span className="font-mono text-gray-600 dark:text-gray-300 font-extrabold">{temp2FASecret}</span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-emerald-600/10 text-slate-500">
                  <span>Emergency Recovery Option:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button 
                      onClick={downloadBackupCodes}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Backup Codes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!profile.twoFactorEnabled && (
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-[11px] text-rose-600 font-bold space-y-1 leading-normal flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Critical Warning:</strong> Two-factor credentials deactivated. Relational databases are susceptible to brute-force identity thefts. Deploy 2FA policy now.
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 8. ACCOUNT BACKUP RECOVERY SETTINGS CONTAINER */}
        <div id="account-recovery-settings-panel" className={`p-6 rounded-3xl border space-y-4 ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
          <h3 className={`text-base font-black ${isLocalDark ? "text-white" : "text-gray-900"} border-b border-gray-100/10 pb-2`}>
            Recovery Channels
          </h3>

          <div className="space-y-4 text-xs font-bold leading-normal">
            
            <div className="space-y-1">
              <label className="block text-gray-400 uppercase text-[10px]">Backup Recovery Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-55 border-gray-200 text-slate-800"}`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-400 uppercase text-[10px]">Backup Recovery Mobile Phone</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${isLocalDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-55 border-gray-200 text-slate-800"}`}
                />
              </div>
            </div>

            <div className="p-3 bg-gray-50/50 dark:bg-slate-900/20 border border-gray-100 dark:border-slate-900 rounded-2xl flex justify-between items-center gap-4">
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">Emergency Backup Keys</span>
                <span className="text-[10px] text-gray-400 block font-normal">Generate a collection of 6 fallback decryption codes.</span>
              </div>
              <button
                onClick={() => {
                  setBackupCodes([
                    Math.floor(Math.random() * 8999 + 1000) + "-" + Math.floor(Math.random() * 8999 + 1000),
                    Math.floor(Math.random() * 8999 + 1000) + "-" + Math.floor(Math.random() * 8999 + 1000),
                    Math.floor(Math.random() * 8999 + 1000) + "-" + Math.floor(Math.random() * 8999 + 1000),
                    Math.floor(Math.random() * 8999 + 1000) + "-" + Math.floor(Math.random() * 8999 + 1000),
                    Math.floor(Math.random() * 8999 + 1000) + "-" + Math.floor(Math.random() * 8999 + 1000),
                    Math.floor(Math.random() * 8999 + 1000) + "-" + Math.floor(Math.random() * 8999 + 1000)
                  ]);
                  setHasDownloadedBackup(false);
                  triggerToast("New keys configured", "Generated 6 temporary recovery keystores. Download immediately.", "success");
                }}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Regenerate
              </button>
            </div>

            {backupCodes.length > 0 && (
              <div className="p-3 bg-gray-50/50 dark:bg-slate-900/20 rounded-xl space-y-1">
                <span className="text-[10px] text-gray-400 block uppercase">Backup recovery codes stack</span>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono font-black text-slate-900 dark:text-gray-100">
                  {backupCodes.map((bc, index) => (
                    <span key={index} className="bg-white dark:bg-slate-900 border border-gray-200/10 p-1.5 rounded-lg select-all">{bc}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                triggerToast("Recovery channels saved", "Recovery variables updated on administration parameters.", "success");
              }}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl mt-3 transition-colors cursor-pointer"
            >
              Update Recovery Constants
            </button>

          </div>
        </div>

      </div>

      {/* 9. LOGIN SESSION MANAGEMENT LISTS */}
      <div id="auth-active-sessions-section" className={`p-6 rounded-3xl border space-y-4 ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className={`text-base font-black ${isLocalDark ? "text-white" : "text-gray-900"}`}>
              Login Session Management
            </h3>
            <p className="text-xs text-gray-400">Examine registered login slots and invalidate entries immediately.</p>
          </div>
          <button
            onClick={handleKillAllOtherSessions}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
          >
            Flush & Log Out Other Devices
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-100 dark:border-slate-900 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/40 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-900">
                <th className="p-4">Interactive Device / OS</th>
                <th className="p-4">Agent Router / Browser</th>
                <th className="p-4">Context IP Address</th>
                <th className="p-4">Approximate Location</th>
                <th className="p-4">Authentication Stamp</th>
                <th className="p-4 text-center">Security Status</th>
                <th className="p-4 text-right">Interrupt Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-850 text-xs">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-[#E23744]" />
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white block">{s.deviceName}</span>
                        <span className="text-[10px] text-gray-400 block font-bold leading-none">{s.os}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold text-gray-700 dark:text-gray-300">{s.browser}</td>
                  <td className="p-4 font-mono text-[11px] text-gray-400">{s.ipAddress}</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 font-semibold">{s.location}</td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-600 dark:text-gray-300">{s.loginTime}</div>
                    <div className="text-[10px] text-gray-400 font-bold">Activity: {s.lastActivity}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      s.status === "Current Session" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400" :
                      s.status === "Active" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-400" :
                      "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {s.status !== "Current Session" ? (
                      <button
                        onClick={() => handleKillSession(s.id)}
                        className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-lg text-[11px] font-black cursor-pointer transition-colors"
                        title="Invalidate session token"
                      >
                        Revoke Access
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-bold italic">Primary Channel</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 10. RECENT SECURITY LOGS AUDIT */}
      <div id="auth-activity-logs-section" className={`p-6 rounded-3xl border space-y-4 ${isLocalDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
        <div>
          <h3 className={`text-base font-black ${isLocalDark ? "text-white" : "text-gray-900"}`}>
            Recent Security Activity Log
          </h3>
          <p className="text-xs text-gray-400">Historically tracked diagnostic logs encompassing access and key updates.</p>
        </div>

        <div className="overflow-x-auto border border-gray-100 dark:border-slate-900 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/40 text-[10px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-900">
                <th className="p-4">Assigned Event Type</th>
                <th className="p-4">Source Device Channel</th>
                <th className="p-4">IP Address Mapping</th>
                <th className="p-4">Estimated Location</th>
                <th className="p-4">Telemetry Date & Time</th>
                <th className="p-4 text-right">Inspection Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-850 text-xs">
              {securityEvents.map(e => (
                <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-4 font-extrabold text-[#E23744]">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      {e.eventType}
                    </div>
                  </td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 font-bold">{e.device} • <span className="text-[10px] text-gray-400 font-mono">{e.browser}</span></td>
                  <td className="p-4 font-mono text-[11px] text-gray-400">{e.ipAddress}</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">{e.location}</td>
                  <td className="p-4 font-semibold text-gray-400">{e.dateTime}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setViewEventDetail(e);
                        triggerToast("Diagnostic details loaded", "Loaded complete identity payload.", "info");
                      }}
                      className="p-1 px-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-white rounded-lg text-[11px] font-bold cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: GOOGLE AUTHENTICATOR QR FLOW OVERLAY */}
      {show2FAsetupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden p-6 shadow-2xl relative space-y-4 border dark:border-slate-800">
            <button 
              onClick={() => setShow2FAsetupModal(false)}
              className="absolute right-4 top-4 p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-[#E23744]" />
              <h3 className="text-base font-black text-gray-900 dark:text-white">Configure Google Authenticator (2FA)</h3>
            </div>

            <div className="space-y-4 text-xs text-gray-700 dark:text-slate-400 leading-relaxed font-semibold">
              <p>Scan the custom identity QR code or key vectors on your Authenticator App to sync tokens.</p>
              
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-slate-900/20 rounded-2xl border border-gray-200/10">
                {/* Crisp SVG representations of complex Auth QR code */}
                <svg className="w-32 h-32 fill-none stroke-current text-slate-900 dark:text-white" viewBox="0 0 100 100" strokeWidth={2}>
                  {/* Fake QR barcode grid markers */}
                  <rect x={10} y={10} width={25} height={25} strokeWidth={4} />
                  <rect x={15} y={15} width={15} height={15} fill="currentColor" />
                  <rect x={65} y={10} width={25} height={25} strokeWidth={4} />
                  <rect x={70} y={15} width={15} height={15} fill="currentColor" />
                  <rect x={10} y={65} width={25} height={25} strokeWidth={4} />
                  <rect x={15} y={70} width={15} height={15} fill="currentColor" />
                  {/* QR details grids */}
                  <path d="M45,10 H55 V20 H45 Z M45,30 H50 V35 H45 Z M45,45 H55 V55 H45 Z M60,30 H65 V45 H60 Z M10,45 H25 V55 H10 Z M65,65 H80 V80 H65 Z M35,65 H45 V75 H35 Z H35 V90 Z M80,45 H90 V55 H80 Z" fill="currentColor" />
                </svg>
                
                <span className="text-[10px] text-gray-400 font-bold block pt-2">Manual Secret Key Seed ID</span>
                <div className="flex items-center gap-2 mt-1 select-all font-mono text-[11px] font-black bg-white dark:bg-slate-900 p-2 rounded-xl border border-gray-200/10 text-slate-800 dark:text-white">
                  <span>{temp2FASecret}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(temp2FASecret);
                      triggerToast("Seed Copied", "Authenticator registration token cached.", "success");
                    }}
                    className="p-1 bg-gray-50 hover:bg-gray-100 dark:bg-slate-900 rounded text-[10px] text-[#E23744]"
                  >
                    Copy Key
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-gray-400 font-bold text-[10px]">6-Digit Google Verification Pin</label>
                <input
                  type="text"
                  maxLength={6}
                  value={googleAuthCode}
                  onChange={(e) => setGoogleAuthCode(e.target.value)}
                  placeholder="000000"
                  className="w-full text-center tracking-[4px] font-mono font-black text-sm p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] bg-gray-50 text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShow2FAsetupModal(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-white text-xs font-black rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyAndActivate2FA}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl text-center cursor-pointer"
                >
                  Verify and Activate 2FA
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LOGOUT OPTIONS CONFIRMATION OVERLAY */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl relative space-y-4 border dark:border-slate-800">
            <button 
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute right-4 top-4 p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <LogOut className="w-6 h-6 text-rose-600" />
              <h3 className="text-base font-black text-gray-900 dark:text-white">Logout Confirmation</h3>
            </div>

            <div className="space-y-4 text-xs font-semibold text-gray-700 dark:text-slate-400">
              <p className="leading-relaxed">Select security parameters before terminating current administrative login block.</p>
              
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 bg-gray-50/50 dark:bg-slate-900/20 p-2.5 rounded-xl border border-gray-200/10 cursor-pointer">
                  <input
                    type="radio"
                    name="logoutScope"
                    checked={logoutScopeType === "current"}
                    onChange={() => setLogoutScopeType("current")}
                    className="mt-0.5 text-[#E23744] focus:ring-[#E23744]"
                  />
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">Log Out Current Device</span>
                    <span className="text-[10px] text-gray-400 block font-normal">Terminates only active chrome session. Backup codes preserved.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 bg-gray-50/50 dark:bg-slate-900/20 p-2.5 rounded-xl border border-gray-200/10 cursor-pointer">
                  <input
                    type="radio"
                    name="logoutScope"
                    checked={logoutScopeType === "all"}
                    onChange={() => setLogoutScopeType("all")}
                    className="mt-0.5 text-[#E23744] focus:ring-[#E23744]"
                  />
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block">Log Out All Admin Devices</span>
                    <span className="text-[10px] text-gray-400 block font-normal">Broad security flush. Invalidates all active session tokens.</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 bg-gray-50/50 dark:bg-slate-900/20 p-2.5 rounded-xl border border-gray-200/10 cursor-pointer">
                  <input
                    type="radio"
                    name="logoutScope"
                    checked={logoutScopeType === "clear"}
                    onChange={() => setLogoutScopeType("clear")}
                    className="mt-0.5 text-[#E23744] focus:ring-[#E23744]"
                  />
                  <div>
                    <span className="font-extrabold text-rose-600 block">Clear Sessions & Purged State</span>
                    <span className="text-[10px] text-gray-400 block font-normal">Forfeit credentials and flush recovery mailings. Default parameters.</span>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-white text-xs font-black rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteLogoutConfirm}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl text-center cursor-pointer"
                >
                  Terminate Session
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ACTIVITY DETAIL DETAILED DIALOG PANEL */}
      {viewEventDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden p-6 shadow-2xl relative space-y-4 border dark:border-slate-800">
            <button 
              onClick={() => setViewEventDetail(null)}
              className="absolute right-4 top-4 p-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-gray-100/10 pb-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white">Security Inspection Payload</h3>
            </div>

            <div className="space-y-3.5 text-xs font-semibold leading-normal text-slate-600 dark:text-slate-400">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">Event Log Description</span>
                <span className="text-slate-900 dark:text-white font-extrabold text-sm">{viewEventDetail.eventType}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Registry Location</span>
                  <span className="text-slate-800 dark:text-white">{viewEventDetail.location}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Network Reference IP</span>
                  <span className="text-slate-800 dark:text-white font-mono">{viewEventDetail.ipAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Device Slot</span>
                  <span className="text-slate-800 dark:text-white">{viewEventDetail.device}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase font-bold">Browser Agent</span>
                  <span className="text-slate-800 dark:text-white">{viewEventDetail.browser}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase font-bold">SLA Timestamp</span>
                <span className="text-indigo-600 font-mono font-extrabold">{viewEventDetail.dateTime}</span>
              </div>

              <div className="p-3 bg-gray-50/50 dark:bg-slate-900/20 rounded-xl text-[10px] text-gray-400 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>This payload is sealed and cryptographically locked on platform write-once storage rules.</span>
              </div>

              <button
                onClick={() => setViewEventDetail(null)}
                className="w-full py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-extrabold rounded-xl text-center cursor-pointer"
              >
                Close Payload Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
