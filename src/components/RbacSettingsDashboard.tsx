import React, { useState, useMemo, useEffect } from "react";
import { useCityContext } from "../context/CityContext";
import { getApiUrl } from "../lib/api";
import {
  Shield, ShieldAlert, ShieldCheck, Key, Lock, Users, UserPlus, Search, Filter,
  Edit, Edit3, Trash2, Check, X, Info, AlertTriangle, AlertCircle, Copy, HelpCircle,
  ChevronDown, ChevronUp, Download, Eye, FileText, Settings, Activity, Mail, Phone,
  Clock, Monitor, Fingerprint, FileSpreadsheet, Plus, ExternalLink, RefreshCw,
  MoreVertical, CheckSquare, Square, UserCheck, UserX, UserMinus, Sliders, Globe,
  Briefcase, Hash, Send, Server, EyeOff, Save, CheckCircle2, AlertOctagon, Terminal, CopyCheck, Unlock
} from "lucide-react";

// Types
export interface PermissionValue {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
  manageSettings: boolean;
}

export type ModuleKey =
  | "Dashboard Access"
  | "Orders Management"
  | "Restaurant Management"
  | "Rider Management"
  | "Customer Management"
  | "CRM & Support"
  | "Reviews Management"
  | "Refund Management"
  | "Coupon Management"
  | "Banner Management"
  | "Analytics & Reports"
  | "Finance & Payouts"
  | "Tax & Invoice Settings"
  | "RBAC Management"
  | "Global Settings";

export type AccessKey = keyof PermissionValue;

export interface RbacRole {
  name: string;
  assignedUsers: number;
  lastModified: string;
  isDefault: boolean;
  description: string;
  permissions: Record<ModuleKey, PermissionValue>;
}

export interface RbacStaff {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  department: "Management" | "Operations" | "Finance" | "Support" | "Marketing" | "Engineering";
  designation: string;
  role: string;
  assignedCity: string;
  assignedZones: string[]; // Kolkata, Howrah, Salt Lake, New Town, South Kolkata
  status: "Active" | "Pending Activation" | "Suspended" | "Disabled";
  lastLogin: string;
  createdDate: string;
  avatar: string;
  address?: string;
  security?: {
    forcePasswordChange: boolean;
    enable2fa: boolean;
    restrictIp: string;
    restrictDevice: string;
  };
  permissionsOverride?: Record<ModuleKey, PermissionValue>;
}

export interface AuditLog {
  id: string;
  staffName: string;
  action: string;
  roleChanged: string;
  permissionsUpdated: string;
  modifiedBy: string;
  dateTime: string;
}

// Default standard module list mapping
const MODULE_LIST: ModuleKey[] = [
  "Dashboard Access",
  "Orders Management",
  "Restaurant Management",
  "Rider Management",
  "Customer Management",
  "CRM & Support",
  "Reviews Management",
  "Refund Management",
  "Coupon Management",
  "Banner Management",
  "Analytics & Reports",
  "Finance & Payouts",
  "Tax & Invoice Settings",
  "RBAC Management",
  "Global Settings"
];

// Helper to create empty or preset permissions
const createPermissionsSet = (defaultValue = false): Record<ModuleKey, PermissionValue> => {
  const dataset: Partial<Record<ModuleKey, PermissionValue>> = {};
  MODULE_LIST.forEach(mod => {
    dataset[mod] = {
      view: defaultValue,
      create: defaultValue,
      edit: defaultValue,
      delete: false, // delete is highly sensitive
      approve: defaultValue,
      export: defaultValue,
      manageSettings: defaultValue
    };
  });
  return dataset as Record<ModuleKey, PermissionValue>;
};

// Seed roles
const INITIAL_ROLES: RbacRole[] = [
  {
    name: "Super Admin",
    assignedUsers: 2,
    lastModified: "2026-06-12 09:15 AM",
    isDefault: true,
    description: "Complete unmitigated control. Full write, delete, and settings permissions across all operational zones.",
    permissions: createPermissionsSet(true)
  },
  {
    name: "City-Level Admin",
    assignedUsers: 3,
    lastModified: "2026-06-11 04:30 PM",
    isDefault: true,
    description: "Can manage restaurants, riders, orders, and customer logs strictly within their assigned city and municipalities.",
    permissions: {
      ...createPermissionsSet(false),
      "Dashboard Access": { view: true, create: false, edit: false, delete: false, approve: false, export: true, manageSettings: false },
      "Orders Management": { view: true, create: true, edit: true, delete: false, approve: true, export: true, manageSettings: false },
      "Restaurant Management": { view: true, create: true, edit: true, delete: false, approve: true, export: true, manageSettings: false },
      "Rider Management": { view: true, create: true, edit: true, delete: false, approve: true, export: true, manageSettings: false },
      "Customer Management": { view: true, create: false, edit: true, delete: false, approve: false, export: true, manageSettings: false },
    }
  },
  {
    name: "Local Area Manager",
    assignedUsers: 2,
    lastModified: "2026-06-10 11:12 AM",
    isDefault: true,
    description: "Operates order routing and logistics within hyper-local sectors. Oversees courier shifts directly.",
    permissions: {
      ...createPermissionsSet(false),
      "Dashboard Access": { view: true, create: false, edit: false, delete: false, approve: false, export: false, manageSettings: false },
      "Orders Management": { view: true, create: false, edit: true, delete: false, approve: true, export: false, manageSettings: false },
      "Rider Management": { view: true, create: false, edit: true, delete: false, approve: false, export: false, manageSettings: false },
    }
  },
  {
    name: "Support Staff",
    assignedUsers: 4,
    lastModified: "2026-06-08 22:15 PM",
    isDefault: true,
    description: "Handles CRM support tickets, customer conversations, courier logs, and feedback management.",
    permissions: {
      ...createPermissionsSet(false),
      "Dashboard Access": { view: true, create: false, edit: false, delete: false, approve: false, export: false, manageSettings: false },
      "CRM & Support": { view: true, create: true, edit: true, delete: false, approve: true, export: false, manageSettings: false },
      "Reviews Management": { view: true, create: false, edit: true, delete: false, approve: false, export: false, manageSettings: false },
    }
  },
  {
    name: "Finance Manager",
    assignedUsers: 1,
    lastModified: "2026-06-05 10:11 AM",
    isDefault: true,
    description: "Oversees commissions, payout sheets, refunds processing, and tax validation algorithms.",
    permissions: {
      ...createPermissionsSet(false),
      "Dashboard Access": { view: true, create: false, edit: false, delete: false, approve: false, export: true, manageSettings: false },
      "Refund Management": { view: true, create: true, edit: true, delete: false, approve: true, export: true, manageSettings: false },
      "Finance & Payouts": { view: true, create: true, edit: true, delete: false, approve: true, export: true, manageSettings: true },
    }
  }
];

// Seed list of real-world staff accounts
const INITIAL_STAFF_ACCOUNTS: RbacStaff[] = [
  {
    id: "STF-9901",
    name: "Apurba Pal",
    employeeId: "EMP-2026-Y892",
    email: "apurba.pal@feastflow.co",
    phone: "+91 98301-22441",
    department: "Management",
    designation: "Principal Operations & Safety Director",
    role: "Super Admin",
    assignedCity: "Kolkata",
    assignedZones: ["Kolkata", "Salt Lake", "New Town"],
    status: "Active",
    lastLogin: "2026-06-12 09:55 AM",
    createdDate: "2026-01-15",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    address: "Metropolitan Building, Esplanade, Kolkata"
  },
  {
    id: "STF-9902",
    name: "Sneha Sen",
    employeeId: "EMP-2026-F102",
    email: "sneha.sen@feastflow.co",
    phone: "+91 91630-88776",
    department: "Finance",
    designation: "Senior Lead Auditor & Compliance",
    role: "Finance Manager",
    assignedCity: "Kolkata",
    assignedZones: ["Kolkata", "South Kolkata Zone"],
    status: "Active",
    lastLogin: "2026-06-12 08:31 AM",
    createdDate: "2026-01-20",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    address: "22 Rawdon Street, Kolkata"
  },
  {
    id: "STF-9903",
    name: "Rahul Banik",
    employeeId: "EMP-2026-O255",
    email: "rahul.b@feastflow.co",
    phone: "+91 94330-11223",
    department: "Operations",
    designation: "Zone Dispatch Supervisor",
    role: "Local Area Manager",
    assignedCity: "Howrah",
    assignedZones: ["Howrah", "South Kolkata Zone"],
    status: "Active",
    lastLogin: "2026-06-11 05:20 PM",
    createdDate: "2026-02-05",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    address: "Shalimar GT Road, Howrah"
  },
  {
    id: "STF-9904",
    name: "Nandini Shaw",
    employeeId: "EMP-2026-S401",
    email: "nandini.s@feastflow.co",
    phone: "+91 80172-33445",
    department: "Support",
    designation: "Senior Escalations Executive",
    role: "Support Staff",
    assignedCity: "Kolkata",
    assignedZones: ["Salt Lake", "New Town"],
    status: "Active",
    lastLogin: "2026-06-12 10:04 AM",
    createdDate: "2026-02-12",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    address: "AE Block, Sector 1, Salt Lake, Kolkata"
  },
  {
    id: "STF-9905",
    name: "Debottam Das",
    employeeId: "EMP-2026-M991",
    email: "debottam.d@feastflow.co",
    phone: "+91 98305-66778",
    department: "Marketing",
    designation: "Campaign Growth Orchestrator",
    role: "Marketing Manager",
    assignedCity: "Kolkata",
    assignedZones: ["Kolkata", "New Town"],
    status: "Disabled",
    lastLogin: "2026-06-10 11:15 AM",
    createdDate: "2026-03-01",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    address: "Vip Road, Kestopur, Kolkata"
  },
  {
    id: "STF-9906",
    name: "Amit Chatterji",
    employeeId: "EMP-2026-S409",
    email: "amit.ch@feastflow.co",
    phone: "+91 90511-22334",
    department: "Support",
    designation: "L1 Phone agent",
    role: "Support Staff",
    assignedCity: "Howrah",
    assignedZones: ["Howrah"],
    status: "Suspended",
    lastLogin: "2026-06-05 06:12 PM",
    createdDate: "2026-03-15",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80"
  },
  {
    id: "STF-9907",
    name: "Sanya Roy",
    employeeId: "EMP-2026-E082",
    email: "sanya.r@feastflow.co",
    phone: "+91 98311-55443",
    department: "Engineering",
    designation: "Infra DevSecOps Engineer",
    role: "Super Admin",
    assignedCity: "Kolkata",
    assignedZones: ["Salt Lake", "New Town", "Kolkata"],
    status: "Pending Activation",
    lastLogin: "Never",
    createdDate: "2026-06-01",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80"
  }
];

// Seed Audit Trail Logs
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "ADT-9901",
    staffName: "Apurba Pal",
    action: "Staff Invitation Sent",
    roleChanged: "Super Admin Assigned",
    permissionsUpdated: "All Access Permitted",
    modifiedBy: "ruhandharpurkayastha (Owner)",
    dateTime: "2026-06-12 10:14 AM"
  },
  {
    id: "ADT-9902",
    staffName: "Debottam Das",
    action: "Account Status Changed",
    roleChanged: "None",
    permissionsUpdated: "Inherit: Marketing Manager (Revoked Access)",
    modifiedBy: "Apurba Pal (Super Admin)",
    dateTime: "2026-06-11 04:30 PM"
  },
  {
    id: "ADT-9903",
    staffName: "Amit Chatterji",
    action: "Account Suspended",
    roleChanged: "None",
    permissionsUpdated: "Access Blocked",
    modifiedBy: "System Guard Service",
    dateTime: "2026-06-08 02:15 PM"
  },
  {
    id: "ADT-9904",
    staffName: "Rahul Banik",
    action: "Assigned City Update",
    roleChanged: "Local Area Manager Assigned",
    permissionsUpdated: "Zones: Howrah & South Kolkata Zone Enabled",
    modifiedBy: "Apurba Pal (Super Admin)",
    dateTime: "2026-06-05 11:22 AM"
  }
];

import { StaffMember } from "../types";

interface RbacSettingsDashboardProps {
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
  staff?: StaffMember[];
  addStaff?: (item: Omit<StaffMember, "id">) => Promise<any>;
  updateStaff?: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff?: (id: string) => Promise<void>;
  currentUserEmail?: string;
}

export default function RbacSettingsDashboard({ 
  triggerToast,
  staff: externalStaff,
  addStaff: externalAddStaff,
  updateStaff: externalUpdateStaff,
  deleteStaff: externalDeleteStaff,
  currentUserEmail
}: RbacSettingsDashboardProps) {
  const { cities } = useCityContext();

  // Cities & Regions available
  const AVAILABLE_CITIES = useMemo(() => {
    return cities && cities.length > 0 ? cities : ["Kolkata", "Howrah", "Salt Lake", "New Town", "South Kolkata Zone"];
  }, [cities]);

  // Theme Toggle: Support dark/light visual style inside the container beautifully
  const [localDark, setLocalDark] = useState(false);

  // Core State Managers
  const [staffList, setStaffList] = useState<RbacStaff[]>([]);

  // Sync external staff collection from Supabase
  useEffect(() => {
    if (externalStaff && externalStaff.length > 0) {
      const mapped: RbacStaff[] = externalStaff.map(s => ({
        id: s.id,
        name: s.name,
        employeeId: s.employeeId || `EMP-${s.id.substring(0, 4)}`,
        email: s.email,
        phone: s.phone || "",
        department: (s.department as any) || "Operations",
        designation: s.designation || s.role || "Specialist",
        role: s.role,
        assignedCity: s.city || "Kolkata",
        assignedZones: [s.city || "Kolkata"],
        status: s.active ? "Active" : "Pending Activation",
        lastLogin: "Never",
        createdDate: new Date().toISOString().split("T")[0],
        avatar: s.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
        security: s.security,
        permissionsOverride: s.permissionsOverride
      }));
      setStaffList(mapped);
    }
  }, [externalStaff]);

  const [roles, setRoles] = useState<RbacRole[]>(() => {
    const saved = localStorage.getItem("googly_rbac_roles");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_ROLES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem("googly_rbac_auditLogs");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return []; // Empty by default
  });

  useEffect(() => {
    localStorage.setItem("googly_rbac_staffList", JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem("googly_rbac_roles", JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem("googly_rbac_auditLogs", JSON.stringify(auditLogs));
  }, [auditLogs]);

  const [activeTab, setActiveTab] = useState<"directory" | "roles" | "audit" | "authorized">("directory");

  // Whitelisted Admin Access Control list state
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
  const [newAuthEmail, setNewAuthEmail] = useState("");
  const [whitelistLoading, setWhitelistLoading] = useState(false);

  // Fetch the whitelisted emails from our API
  const fetchWhitelist = async () => {
    try {
      setWhitelistLoading(true);
      const res = await fetch(getApiUrl("/api/auth/whitelist"));
      if (res.ok) {
        const data = await res.json();
        setAuthorizedEmails(data);
      }
    } catch (err: any) {
      console.error("Failed to load whitelist:", err);
    } finally {
      setWhitelistLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const handleAddAuthEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthEmail) return;
    const email = newAuthEmail.toLowerCase().trim();
    if (authorizedEmails.includes(email)) {
      triggerToast("Invalid Registration", "Email coordinate already authorized.", "error");
      return;
    }
    try {
      const res = await fetch(getApiUrl("/api/auth/whitelist"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("Access Granted", data.message, "success");
        setNewAuthEmail("");
        fetchWhitelist();
      } else {
        triggerToast("Registration Error", data.error || "Failed to register.", "error");
      }
    } catch (err: any) {
      triggerToast("Request Error", err.message, "error");
    }
  };

  const handleRemoveAuthEmail = async (email: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/auth/whitelist?email=${encodeURIComponent(email)}`), {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        triggerToast("Access Revoked", data.message, "success");
        fetchWhitelist();
      } else {
        triggerToast("Revocation Error", data.error || "Failed to revoke access.", "error");
      }
    } catch (err: any) {
      triggerToast("Request Error", err.message, "error");
    }
  };

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterCity, setFilterCity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Selection states
  const [selectedStaff, setSelectedStaff] = useState<RbacStaff | null>(null);
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>("City-Level Admin");

  // "Add Staff" Slide-over / Modal state
  const [showAddStaffPanel, setShowAddStaffPanel] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  // Add/Edit Staff Form State
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "Operations" as RbacStaff["department"],
    designation: "",
    role: "City-Level Admin",
    assignedCity: "Kolkata",
    assignedZones: ["Kolkata"] as string[],
    status: "Pending Activation" as RbacStaff["status"],
    address: "",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    
    // Security configs
    generateTempPw: true,
    forcePwChange: true,
    enable2fa: false,
    restrictIp: "",
    restrictDevice: ""
  });

  // Automatically update the default assigned city and zone as soon as AVAILABLE_CITIES loader resolves
  useEffect(() => {
    if (AVAILABLE_CITIES.length > 0 && !isEditingStaff) {
      const defaultCity = AVAILABLE_CITIES[0];
      setStaffForm(prev => {
        if (!AVAILABLE_CITIES.includes(prev.assignedCity)) {
          return {
            ...prev,
            assignedCity: defaultCity,
            assignedZones: [defaultCity]
          };
        }
        return prev;
      });
    }
  }, [AVAILABLE_CITIES, isEditingStaff]);

  // Custom permission matrix in add staff form
  const [customPermissions, setCustomPermissions] = useState<Record<ModuleKey, PermissionValue>>(createPermissionsSet(false));
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);

  // Confirmation Activator Workflow Modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  
  // Deletion Confirmation Modal
  const [staffToDelete, setStaffToDelete] = useState<RbacStaff | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  // Simulated Email Sent Invite Modal
  const [showWelcomeEmailModal, setShowWelcomeEmailModal] = useState(false);
  const [latestEmailPayload, setLatestEmailPayload] = useState<{
    staffName: string;
    email: string;
    tempPw: string;
    role: string;
    assignedCity: string;
    assignedZones: string[];
    permissionsText: string[];
  } | null>(null);

  // New Role Form popup
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    cloneFrom: "None"
  });

  // Derived Statistics for Summary Row
  const statsOverview = useMemo(() => {
    return {
      total: staffList.length,
      active: staffList.filter(s => s.status === "Active").length,
      pending: staffList.filter(s => s.status === "Pending Activation").length,
      cityAdmins: staffList.filter(s => s.role === "City-Level Admin").length,
      areaManagers: staffList.filter(s => s.role === "Local Area Manager").length,
      support: staffList.filter(s => s.role === "Support Staff").length,
      suspended: staffList.filter(s => s.status === "Suspended" || s.status === "Disabled").length
    };
  }, [staffList]);

  // Filter and Search Evaluation
  const filteredStaffList = useMemo(() => {
    return staffList.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.designation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = filterRole === "All" || item.role === filterRole;
      const matchStatus = filterStatus === "All" || item.status === filterStatus;
      
      const matchCity = filterCity === "All" || 
        item.assignedCity === filterCity || 
        item.assignedZones.includes(filterCity);

      return matchSearch && matchRole && matchStatus && matchCity;
    });
  }, [staffList, searchQuery, filterRole, filterCity, filterStatus]);

  // Handle role selection inheritance in form
  const handleFormRoleChange = (roleName: string) => {
    const selectedRoleData = roles.find(r => r.name === roleName);
    if (selectedRoleData) {
      setCustomPermissions(JSON.parse(JSON.stringify(selectedRoleData.permissions)));
    }
    setStaffForm(prev => ({ ...prev, role: roleName }));
  };

  // Toggle single cell in the permission editing matrix
  const handlePermissionCellToggle = (mod: ModuleKey, level: AccessKey) => {
    setCustomPermissions(prev => {
      const updatedMod = { ...prev[mod], [level]: !prev[mod][level] };
      return { ...prev, [mod]: updatedMod };
    });
  };

  // Safe checks for warning indicators (Warning on sensitive grants)
  const isGrantingSensitivePermission = useMemo(() => {
    // Check if system settings, delete levels, or RBAC settings are turned on
    let hasSensitive = false;
    MODULE_LIST.forEach(m => {
      if (customPermissions[m]?.delete) hasSensitive = true;
    });
    if (customPermissions["RBAC Management"]?.edit || customPermissions["RBAC Management"]?.manageSettings) {
      hasSensitive = true;
    }
    if (customPermissions["Tax & Invoice Settings"]?.manageSettings || customPermissions["Global Settings"]?.manageSettings) {
      hasSensitive = true;
    }
    return hasSensitive;
  }, [customPermissions]);

  // Generate unique employee ID sequence
  const generateNewEmployeeId = () => {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `EMP-2026-X${suffix}`;
  };

  // Triggered Add Staff - Proceed to verification summary
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email || !staffForm.phone) {
      triggerToast("Missing Critical Data", "Please occupy basic name, email and phone coordinates.", "error");
      return;
    }
    // Proceed to Step 5: Confirmation Modal
    setShowConfirmationModal(true);
  };

  // Execute Final Creation & Activation
  const handleConfirmActivation = async (statusOverride?: RbacStaff["status"]) => {
    // Security check: Only the owner in registry can perform this
    const ownerEmail = "ruhandharpurkayastha@gmail.com";
    if (currentUserEmail?.toLowerCase() !== ownerEmail) {
      triggerToast("Permission Blocked", "Your credentials do not permit modifying the master organizational registry.", "error");
      setShowConfirmationModal(false);
      return;
    }

    setShowConfirmationModal(false);
    setShowAddStaffPanel(false);

    const generatedEmpId = isEditingStaff && editingStaffId 
      ? (staffList.find(s => s.id === editingStaffId)?.employeeId || generateNewEmployeeId())
      : generateNewEmployeeId();

    const tempGeneratedPw = `FeastFlow#2026!${Math.floor(10 + Math.random() * 90)}`;
    const finalStatus = statusOverride || (staffForm.status === "Pending Activation" ? "Pending Activation" : "Active");

    const newStaffItem: RbacStaff = {
      id: isEditingStaff && editingStaffId ? editingStaffId : `STF-${Math.floor(1000 + Math.random() * 9000)}`,
      name: staffForm.name,
      employeeId: generatedEmpId,
      email: staffForm.email,
      phone: staffForm.phone,
      department: staffForm.department,
      designation: staffForm.designation || `${staffForm.role} Specialist`,
      role: staffForm.role,
      assignedCity: staffForm.assignedCity,
      assignedZones: staffForm.assignedZones.length > 0 ? staffForm.assignedZones : [staffForm.assignedCity],
      status: finalStatus,
      lastLogin: isEditingStaff ? "2026-06-12 10:14 AM" : "Never",
      createdDate: new Date().toISOString().split("T")[0],
      avatar: staffForm.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
      address: staffForm.address,
      security: {
        forcePasswordChange: staffForm.forcePwChange,
        enable2fa: staffForm.enable2fa,
        restrictIp: staffForm.restrictIp,
        restrictDevice: staffForm.restrictDevice
      },
      permissionsOverride: useCustomPermissions ? customPermissions : undefined
    };

    // Prepare Supabase StaffMember object
    const supabaseStaff: Omit<StaffMember, "id"> = {
      name: newStaffItem.name,
      email: newStaffItem.email,
      role: newStaffItem.role,
      permissions: {
        dashboard: true,
        orders: true,
        restaurants: true,
        riders: true,
        pricing: true,
        crm: true,
        finances: true,
        settings: true
      },
      active: newStaffItem.status === "Active",
      city: newStaffItem.assignedCity,
      phone: newStaffItem.phone,
      department: newStaffItem.department,
      designation: newStaffItem.designation,
      avatar: newStaffItem.avatar,
      employeeId: newStaffItem.employeeId,
      security: newStaffItem.security,
      permissionsOverride: newStaffItem.permissionsOverride
    };

    try {
      if (isEditingStaff && editingStaffId) {
        // Edit mode
        if (externalUpdateStaff) {
          await externalUpdateStaff(editingStaffId, supabaseStaff);
        } else {
          setStaffList(prev => prev.map(s => s.id === editingStaffId ? newStaffItem : s));
        }
        triggerToast("Staff Credentials Updated", `Altered operational bounds of ${staffForm.name}.`, "success");
      } else {
        // Add mode
        if (externalAddStaff) {
          await externalAddStaff(supabaseStaff);
        } else {
          setStaffList(prev => [newStaffItem, ...prev]);
        }
        triggerToast("Staff Account Instantiated", `Successfully registered ${staffForm.name} operational catalog.`, "success");
      }
    } catch (err: any) {
      triggerToast("Persistence Error", err.message, "error");
    }

    // Set Welcome Email data
    const activeGrantedText: string[] = [];
    const permissionsMap = useCustomPermissions ? customPermissions : (roles.find(r => r.name === staffForm.role)?.permissions || createPermissionsSet(false));
    MODULE_LIST.forEach(m => {
      const p = permissionsMap[m];
      if (p?.view) {
        const levels = [
          p.view ? "View" : "",
          p.create ? "Create" : "",
          p.edit ? "Edit" : "",
          p.delete ? "Delete" : "",
          p.approve ? "Approve" : "",
          p.export ? "Export" : "",
          p.manageSettings ? "ManageSettings" : ""
        ].filter(Boolean).join(", ");
        activeGrantedText.push(`${m} (${levels})`);
      }
    });

    setLatestEmailPayload({
      staffName: staffForm.name,
      email: staffForm.email,
      tempPw: tempGeneratedPw,
      role: staffForm.role,
      assignedCity: staffForm.assignedCity,
      assignedZones: staffForm.assignedZones,
      permissionsText: activeGrantedText
    });

    // Show welcome automated invite step
    if (staffForm.sendInvitationEmail) {
      setTimeout(() => {
        setShowWelcomeEmailModal(true);
      }, 300);
    }

    // Reset Form
    setIsEditingStaff(false);
    setEditingStaffId(null);
  };

  // Trigger Edit staff workflow
  const triggerEditStaff = (staff: RbacStaff) => {
    setIsEditingStaff(true);
    setEditingStaffId(staff.id);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      department: staff.department,
      designation: staff.designation,
      role: staff.role,
      assignedCity: staff.assignedCity || "Kolkata",
      assignedZones: staff.assignedZones || ["Kolkata"],
      status: staff.status,
      address: staff.address || "",
      avatar: staff.avatar,
      generateTempPw: false,
      forcePwChange: staff.security?.forcePasswordChange ?? true,
      enable2fa: staff.security?.enable2fa ?? false,
      restrictIp: staff.security?.restrictIp || "",
      restrictDevice: staff.security?.restrictDevice || ""
    });

    if (staff.permissionsOverride) {
      setCustomPermissions(JSON.parse(JSON.stringify(staff.permissionsOverride)));
      setUseCustomPermissions(true);
    } else {
      const parentRoleData = roles.find(r => r.name === staff.role);
      if (parentRoleData) {
        setCustomPermissions(JSON.parse(JSON.stringify(parentRoleData.permissions)));
      } else {
        setCustomPermissions(createPermissionsSet(false));
      }
      setUseCustomPermissions(false);
    }

    setShowAddStaffPanel(true);
    triggerToast("Loading credentials layout", `Now revising structural params of ${staff.name}`, "info");
  };

  // Change staff status directly
  const handleToggleStaffStatus = (staffId: string, nextStatus: RbacStaff["status"]) => {
    const targetStaff = staffList.find(s => s.id === staffId);
    if (!targetStaff) return;

    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, status: nextStatus } : s));
    triggerToast("Operational Lock Altered", `Status of ${targetStaff.name} transitioned to ${nextStatus}.`, "info");

    const appendAudit: AuditLog = {
      id: `ADT-${Math.floor(1000 + Math.random() * 9000)}`,
      staffName: targetStaff.name,
      action: "Account State Altered",
      roleChanged: "None",
      permissionsUpdated: `State set to: ${nextStatus}`,
      modifiedBy: "ruhandharpurkayastha (Owner)",
      dateTime: "2026-06-12 10:54 AM"
    };
    setAuditLogs(prev => [appendAudit, ...prev]);
  };

  // Revoke/Delete Staff
  const handleDeleteStaff = async (staffId: string) => {
    const targetStaff = staffList.find(s => s.id === staffId);
    if (!targetStaff) return;

    try {
      if (externalDeleteStaff) {
        await externalDeleteStaff(staffId);
        triggerToast("Access Revoked", "Account credentials invalidated from real-time nodes.", "success");
      } else {
        setStaffList(prev => prev.filter(s => s.id !== staffId));
        triggerToast("Access Revoked", "Account credentials invalidated from local cache pool.", "info");
      }
    } catch (err: any) {
      triggerToast("Deletion Failed", err.message, "error");
    }

    const appendAudit: AuditLog = {
      id: `ADT-${Math.floor(1000 + Math.random() * 9000)}`,
      staffName: targetStaff.name,
      action: "Staff Account Terminated",
      roleChanged: "N/A",
      permissionsUpdated: "Revoked all micro credentials mapping",
      modifiedBy: "ruhandharpurkayastha (Owner)",
      dateTime: "2026-06-12 10:54 AM"
    };
    setAuditLogs(prev => [appendAudit, ...prev]);
    setShowDeleteConfirmation(false);
    setStaffToDelete(null);
  };

  // CSV List Export Download
  const handleExportCSV = () => {
    const headers = ["Employee ID", "Full Name", "Email Address", "Phone Vector", "Designation", "Assigned City", "Assigned Zones", "Assigned Role", "Status", "Last Login"];
    const rows = filteredStaffList.map(s => [
      s.employeeId,
      s.name,
      s.email,
      s.phone,
      s.designation,
      s.assignedCity,
      s.assignedZones.join(" | "),
      s.role,
      s.status,
      s.lastLogin
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `googly-delivery-staff-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Corporate Payload Exported", "Exported the verified staff ledger file successfully.", "success");
  };

  // Custom Role Creator Trigger
  const handleCreateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) {
      triggerToast("Invalid Params", "Specify a unique alpha descriptor of the role.", "error");
      return;
    }

    let clonedPerms = createPermissionsSet(false);
    if (roleForm.cloneFrom !== "None") {
      const source = roles.find(r => r.name === roleForm.cloneFrom);
      if (source) {
        clonedPerms = JSON.parse(JSON.stringify(source.permissions));
      }
    }

    const newRoleObj: RbacRole = {
      name: roleForm.name,
      assignedUsers: 0,
      lastModified: "2026-06-12 10:54 AM",
      isDefault: false,
      description: roleForm.description || `Custom tailored security scope for administrative department.`,
      permissions: clonedPerms
    };

    setRoles(prev => [...prev, newRoleObj]);
    setShowCreateRoleModal(false);
    triggerToast("Custom Auth Scope Created", `Tailored "${roleForm.name}" matrix container.`, "success");

    // Clear form
    setRoleForm({ name: "", description: "", cloneFrom: "None" });
  };

  // Quick reset password simulation
  const handleSimulateResetPassword = (staff: RbacStaff) => {
    const dummyNew = `SecureTemp#${Math.floor(1000 + Math.random() * 9000)}`;
    triggerToast("Password Reset Action", `Instantiated key reset link pipeline for ${staff.name}.`, "success");
    alert(`AUTOMATED SYSTEM LOGIC:\nA key change link was generated programmatically for ${staff.name}.\nTemporary authentication string: ${dummyNew}`);
  };

  // Multi-cities check toggles helper
  const handleZoneChoiceToggle = (zone: string) => {
    setStaffForm(prev => {
      const current = prev.assignedZones;
      if (current.includes(zone)) {
        return { ...prev, assignedZones: current.filter(z => z !== zone) };
      } else {
        return { ...prev, assignedZones: [...current, zone] };
      }
    });
  };

  return (
    <div id="staff-rbac-workspace-container" className={`space-y-6 ${localDark ? "bg-slate-900 text-slate-100 p-6 rounded-3xl" : "text-slate-800"}`}>
      
      {/* -------------------- SECTION 1: SYSTEM MONITORING HEADER -------------------- */}
      <div className={`p-6 rounded-3xl border flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-sm transition-all duration-300 ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-[#E23744]" /> Staff Management & RBAC
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500/10 text-rose-500 uppercase tracking-widest flex items-center gap-1">
              <Server className="w-3 h-3 animate-pulse" /> AWS Core-IAM Emulation
            </span>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            Grant granular permissions, provision secure temporary keys, restrict IP gateways, trace audit logs, and assign operational zones.
          </p>
        </div>

        {/* Global actions row */}
        <div className="flex flex-wrap items-center gap-2 select-none self-stretch sm:self-auto">
          <button
            onClick={() => setLocalDark(!localDark)}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${localDark ? "bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-800" : "bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200"}`}
            title="Switch palette layout"
          >
            {localDark ? "☀️ Light UI" : "🌙 Dark UI"}
          </button>

          <button
            onClick={() => {
              setIsEditingStaff(false);
              setEditingStaffId(null);
              setStaffForm({
                name: "",
                email: "",
                phone: "",
                department: "Operations",
                designation: "",
                role: "City-Level Admin",
                assignedCity: AVAILABLE_CITIES[0] || "Kolkata",
                assignedZones: [AVAILABLE_CITIES[0] || "Kolkata"],
                status: "Pending Activation",
                address: "",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
                generateTempPw: true,
                forcePwChange: true,
                enable2fa: false,
                restrictIp: "",
                restrictDevice: ""
              });
              setUseCustomPermissions(false);
              setCustomPermissions(createPermissionsSet(false));
              setShowAddStaffPanel(true);
              triggerToast("Provision Panel Opened", "Awaiting personal parameters input.", "info");
            }}
            className="px-4 py-2.5 bg-[#E23744] hover:bg-red-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" /> Add New Staff
          </button>

          <button
            onClick={() => {
              setShowCreateRoleModal(true);
              triggerToast("Role Composer Displayed", "Configure unique designation policies", "info");
            }}
            className="px-3.5 py-2.5 bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Key className="w-4 h-4" /> Create Custom Role
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Staff List
          </button>

          <button
            onClick={() => {
              setActiveTab("audit");
              triggerToast("Historical Audit Focus", "Rendering system change events.", "info");
            }}
            className="px-3.5 py-2.5 bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-gray-200 text-xs font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-4 h-4" /> View Audit Logs
          </button>
        </div>
      </div>

      {/* -------------------- SECTION 2: METRICS SUMMARY CARDS -------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        
        <div className={`p-4 rounded-2xl border transition-all ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Staff</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-gray-900 dark:text-white font-mono">{statsOverview.total}</span>
            <Users className="w-4 h-4 text-[#E23744]" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block font-semibold">Active Staff</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">{statsOverview.active}</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Pending Invitation</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-500 font-mono">{statsOverview.pending}</span>
            <Send className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">City Admins</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-500 font-mono">{statsOverview.cityAdmins}</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Area Managers</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-indigo-500 font-mono">{statsOverview.areaManagers}</span>
            <Sliders className="w-4 h-4 text-indigo-500" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Support Staff</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-[#E23744] font-mono">{statsOverview.support}</span>
            <Briefcase className="w-4 h-4 text-[#E23744]" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Suspended</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-red-700 font-mono">{statsOverview.suspended}</span>
            <UserX className="w-4 h-4 text-red-500" />
          </div>
        </div>

      </div>

      {/* -------------------- SECTION 3: TAB NAVIGATION -------------------- */}
      <div className="flex border-b border-gray-200/80 overflow-x-auto whitespace-nowrap select-none">
        
        <button
          onClick={() => {
            setActiveTab("directory");
            triggerToast("Employee Registry Active", "Review active staff metadata.", "info");
          }}
          className={`px-5 py-3 text-xs font-black cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "directory" ? "border-[#E23744] text-[#E23744]" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Users className="w-4.5 h-4.5" /> Staff Directory ({filteredStaffList.length})
        </button>

        <button
          onClick={() => {
            setActiveTab("roles");
            triggerToast("Roles Structuring Focus", "Edit core role templates and hierarchical permissions.", "info");
          }}
          className={`px-5 py-3 text-xs font-black cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "roles" ? "border-[#E23744] text-[#E23744]" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Key className="w-4.5 h-4.5" /> Roles Matrix ({roles.length})
        </button>

        <button
          onClick={() => {
            setActiveTab("audit");
            triggerToast("Audit Trails Opened", "Examine historical configuration and credential logs.", "info");
          }}
          className={`px-5 py-3 text-xs font-black cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "audit" ? "border-[#E23744] text-[#E23744]" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Activity className="w-4.5 h-4.5" /> Security Audit Log & Trails
        </button>

        <button
          onClick={() => {
            setActiveTab("authorized");
            triggerToast("Access Control Panel", "Pre-verify authorized administrator emails.", "info");
          }}
          className={`px-5 py-3 text-xs font-black cursor-pointer border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "authorized" ? "border-[#E23744] text-[#E23744]" : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Lock className="w-4.5 h-4.5" /> Whitelisted Admins ({authorizedEmails.length})
        </button>

      </div>

      {/* -------------------- SECTION 4: RELEVANT PANEL VIEWS -------------------- */}

      {/* VIEW A: STAFF DIRECTORY VIEW */}
      {activeTab === "directory" && (
        <div className="space-y-4 animate-fade-in">
          
          {/* SEARCH, SORT & FILTER BAR */}
          <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row gap-4 justify-between items-center text-xs font-bold leading-normal ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-xs"}`}>
            
            <div className="relative w-full lg:w-96">
              <input
                type="text"
                placeholder="Search staff by Employee Name, ID, or Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full p-2.5 pl-9 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500" : "bg-gray-50 border-gray-200 text-slate-900"}`}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              {/* Role filter dropdown */}
              <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
                <span className="text-gray-400 text-[10px] font-black uppercase">Role:</span>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className={`p-2 rounded-xl border text-xs focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-900 border-slate-800 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                >
                  <option value="All">All Roles</option>
                  {roles.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                  <option value="Custom Role">Custom Role</option>
                </select>
              </div>

              {/* City assignment filter dropdown */}
              <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
                <span className="text-gray-400 text-[10px] font-black uppercase">City/Zone:</span>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className={`p-2 rounded-xl border text-xs focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-900 border-slate-800 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                >
                  <option value="All">All Regions</option>
                  {AVAILABLE_CITIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status filter dropdown */}
              <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
                <span className="text-gray-400 text-[10px] font-black uppercase">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`p-2 rounded-xl border text-xs focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-900 border-slate-800 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Pending Activation">Pending Activation</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              {/* Clear filters Button */}
              {(searchQuery || filterRole !== "All" || filterCity !== "All" || filterStatus !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterRole("All");
                    setFilterCity("All");
                    setFilterStatus("All");
                    triggerToast("Filters Truncated", "All sorting segments cleared.", "info");
                  }}
                  className="px-3 py-2 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* TABLE LOGIC ROW */}
          <div className={`border rounded-2xl overflow-hidden shadow-xs ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-extrabold text-[10px] tracking-wider uppercase text-gray-400 ${localDark ? "bg-slate-900/40 border-slate-800" : "bg-gray-50/70 border-gray-200"}`}>
                    <th className="p-4 pl-6">Staff Profile Name (Badge ID)</th>
                    <th className="p-4">Administrative Email</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4">Assigned City & Zone Scope</th>
                    <th className="p-4">Role Designation</th>
                    <th className="p-4 text-center">Security Status</th>
                    <th className="p-4">Last Activity</th>
                    <th className="p-4 text-right pr-6">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/10">
                  {filteredStaffList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-500 font-medium">
                        <AlertCircle className="w-8 h-8 text-[#E23744] mx-auto mb-2 animate-bounce" />
                        No staff profile matches current filter segments.
                      </td>
                    </tr>
                  ) : (
                    filteredStaffList.map(staff => (
                      <tr key={staff.id} className={`hover:bg-gray-50/50 dark:hover:bg-slate-900/50 transition-colors ${selectedStaff?.id === staff.id ? "bg-rose-500/5" : ""}`}>
                        {/* Title profile column */}
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <img 
                              src={staff.avatar} 
                              alt="staff-avatar" 
                              className="w-9 h-9 rounded-full object-cover border-2 border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className={`font-extrabold flex items-center gap-1.5 ${localDark ? "text-slate-100" : "text-slate-900"}`}>
                                {staff.name}
                                {staff.permissionsOverride && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-500 uppercase tracking-widest font-black" title=" Granular custom rights override are configured.">
                                    Override Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-gray-500 block font-bold">{staff.employeeId}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`font-semibold ${localDark ? "text-gray-400" : "text-gray-600"}`}>{staff.email}</span>
                        </td>

                        <td className="p-4">
                          <span className="font-mono text-gray-500 font-bold">{staff.phone}</span>
                        </td>

                        <td className="p-4 font-bold">
                          <div className="space-y-1">
                            <span className={`block ${localDark ? "text-white" : "text-gray-800"}`}>{staff.assignedCity}</span>
                            <div className="flex flex-wrap gap-1">
                              {staff.assignedZones.map(zone => (
                                <span key={zone} className="px-1.5 py-0.2 bg-gray-100 dark:bg-slate-800 text-gray-400 text-[9px] rounded font-bold">
                                  {zone}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>

                        <td className={`p-4 font-black uppercase text-[10.5px] ${localDark ? "text-white" : "text-slate-800"}`}>
                          <span className={`px-2 py-1 rounded-lg ${
                            staff.role === "Super Admin" ? "bg-rose-700/10 text-rose-500" :
                            staff.role === "City-Level Admin" ? "bg-blue-600/10 text-blue-500" :
                            staff.role === "Local Area Manager" ? "bg-indigo-600/10 text-indigo-500" : "bg-gray-100 dark:bg-slate-800 text-gray-400"
                          }`}>
                            {staff.role}
                          </span>
                        </td>

                        {/* Status badging */}
                        <td className="p-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            staff.status === "Active" ? "bg-emerald-500/10 text-emerald-500" :
                            staff.status === "Pending Activation" ? "bg-amber-500/10 text-amber-500 animate-pulse" :
                            staff.status === "Suspended" ? "bg-rose-600/10 text-rose-500" : "bg-gray-200 text-gray-500"
                          }`}>
                            {staff.status}
                          </span>
                        </td>

                        <td className="p-4 text-xs font-medium text-gray-400">
                          <span className="font-mono">{staff.lastLogin}</span>
                        </td>

                        {/* Interactive actions */}
                        <td className="p-4 text-right pr-6">
                          <div className="flex justify-end items-center gap-1.5">
                            
                            <button
                              onClick={() => {
                                setSelectedStaff(staff);
                                triggerToast("Loaded Admin Scope Details", `Highlighting meta schema for ${staff.name}`, "info");
                              }}
                              className="p-2 hover:bg-[#E23744]/10 rounded-lg text-gray-400 hover:text-[#E23744] cursor-pointer"
                              title="Inspect credentials meta & granted permissions"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => triggerEditStaff(staff)}
                              className="p-2 hover:bg-blue-500/10 rounded-lg text-slate-400 hover:text-blue-500 cursor-pointer"
                              title="Edit user profile & permission overrides"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Reset Key simulation */}
                            <button
                              onClick={() => handleSimulateResetPassword(staff)}
                              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
                              title="Perform key rotation/reset"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            {staff.status === "Active" ? (
                              <button
                                onClick={() => handleToggleStaffStatus(staff.id, "Suspended")}
                                className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                                title="Force immediate lockout suspension"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStaffStatus(staff.id, "Active")}
                                className="p-2 hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-500 cursor-pointer"
                                title="Approve & activate account access"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setStaffToDelete(staff);
                                setShowDeleteConfirmation(true);
                              }}
                              className="p-2 hover:bg-red-700/10 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Permanently remove staff entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* GRANULAR PERMISSION INSPECTOR BOX (WHEN ROW HIGHLIGHTED) */}
          {selectedStaff && (
            <div className={`p-6 rounded-3xl border animate-scale-up space-y-4 ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-full bg-slate-100 text-[#E23744]">
                    <Shield className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Effective Access Bounds Map: <strong className="text-[#E23744]">{selectedStaff.name}</strong>
                    </h4>
                    <p className="text-[11px] text-gray-400 font-semibold font-mono">
                      Inheriting permissions from role: {selectedStaff.role} {selectedStaff.permissionsOverride ? "(with dynamic override checks)" : "(pristine preset configuration)"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-400 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid summarizing permissions */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 text-[11px] leading-relaxed font-semibold">
                {MODULE_LIST.map(m => {
                  const pSet = selectedStaff.permissionsOverride || 
                    (roles.find(r => r.name === selectedStaff.role)?.permissions || createPermissionsSet(false));
                  
                  const modPerms = pSet[m];
                  const hasView = modPerms?.view;
                  const hasEdit = modPerms?.edit;
                  const hasCreate = modPerms?.create;
                  const hasDelete = modPerms?.delete;
                  const hasApprove = modPerms?.approve;
                  const hasExport = modPerms?.export;
                  const hasSettings = modPerms?.manageSettings;

                  const isAuthorizedAny = hasView || hasEdit || hasCreate || hasDelete || hasApprove || hasExport || hasSettings;

                  return (
                    <div 
                      key={m} 
                      className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 ${
                        isAuthorizedAny 
                          ? localDark ? "bg-slate-900/40 border-slate-800" : "bg-rose-500/5 border-rose-500/10" 
                          : "opacity-45 bg-gray-50 dark:bg-slate-900 border-gray-100 dark:border-slate-900"
                      }`}
                    >
                      <span className="font-extrabold text-slate-900 dark:text-white">{m}</span>
                      <div className="space-y-1 text-[9.5px]">
                        {hasView && <div className="text-emerald-600 flex items-center gap-1">✓ Read (View) Access</div>}
                        {hasCreate && <div className="text-emerald-600 flex items-center gap-1">✓ Create Rights</div>}
                        {hasEdit && <div className="text-emerald-600 flex items-center gap-1">✓ Edit/Modify Bounds</div>}
                        {hasDelete && <div className="text-rose-600 font-bold flex items-center gap-1">🛑 High privilege: DELETE</div>}
                        {hasApprove && <div className="text-purple-600 flex items-center gap-1">⚡ Approve Credentials</div>}
                        {hasExport && <div className="text-blue-600 flex items-center gap-1">💾 Export Payload Data</div>}
                        {hasSettings && <div className="text-orange-600 flex items-center gap-1">⚙️ Global Settings Lock</div>}
                        {!isAuthorizedAny && <div className="text-gray-400">Strictly Blocked</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* VIEW B: CLASSIC AWS-STYLE ROLES MATRICES */}
      {activeTab === "roles" && (
        <div className="space-y-5 animate-fade-in text-xs font-semibold text-slate-700">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LHS: Available Roles selector */}
            <div className={`p-6 rounded-3xl border space-y-4 ${localDark ? "bg-slate-900 border-slate-900" : "bg-white border-gray-200 shadow-xs"}`}>
              <div className="space-y-1 select-none">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Active Corporate Identity Roles</h3>
                <p className="text-[11px] text-gray-400">Select standard group schemas to review effective permissions matrix grids.</p>
              </div>

              <div className="space-y-2 select-none">
                {roles.map(r => (
                  <button
                    key={r.name}
                    onClick={() => {
                      setSelectedRoleForMatrix(r.name);
                      triggerToast("Role Canvas Updated", `Now analyzing permission schemas for "${r.name}"`, "info");
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                      selectedRoleForMatrix === r.name 
                        ? "border-[#E23744] bg-[#E23744]/10" 
                        : "border-gray-200 dark:border-slate-800 hover:bg-gray-200/40"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-extrabold text-[#E23744] uppercase tracking-wide">{r.name}</span>
                      {r.isDefault && (
                        <span className="px-1.5 py-0.2 bg-slate-900 text-white rounded font-mono text-[8px] uppercase tracking-wide">
                          Factory Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-gray-400 leading-relaxed truncate-2-lines">{r.description}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono font-bold mt-2 pt-2 border-t border-gray-100/10 w-full">
                      <span>Assigned slots: {r.assignedUsers} Admins</span>
                      <span>Modified: {r.lastModified}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* RHS: Entire Permission Grid Layout for selected Role */}
            <div className={`p-6 rounded-3xl border lg:col-span-2 space-y-4 ${localDark ? "bg-slate-900 border-slate-900" : "bg-white border-gray-200 shadow-sm"}`}>
              
              <div className="flex justify-between items-start border-b border-gray-100/10 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Corporate Matrix: <strong className="text-[#E23744] uppercase">{selectedRoleForMatrix}</strong>
                  </h3>
                  <p className="text-[11px] text-gray-400">Configure checkboxes below to toggle permissions universally for this group model.</p>
                </div>
                <button
                  onClick={() => {
                    triggerToast("Permissions Saved", `Global system matrices updated for ${selectedRoleForMatrix}.`, "success");
                    // Prepend audit log
                    const trace: AuditLog = {
                      id: `ADT-${Math.floor(1000 + Math.random() * 90002)}`,
                      staffName: "ruhandharpurkayastha (Owner)",
                      action: `Updated access rights matrix for group '${selectedRoleForMatrix}'`,
                      roleChanged: "None",
                      permissionsUpdated: "Re-calibrated modular matrix locks",
                      modifiedBy: "ruhandharpurkayastha (Owner)",
                      dateTime: "2026-06-12 10:54 AM"
                    };
                    setAuditLogs(prev => [trace, ...prev]);
                  }}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white hover:bg-slate-800 text-xs font-black rounded-xl cursor-pointer"
                >
                  Confirm Matrix Lock
                </button>
              </div>

              {/* Matrix view table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-semibold text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100/10 text-gray-400 text-[10px] uppercase font-bold text-center">
                      <th className="p-3 text-left">Module Segment</th>
                      <th className="p-1">View (Read)</th>
                      <th className="p-1">Create</th>
                      <th className="p-1">Edit</th>
                      <th className="p-1 text-rose-500 font-bold">Delete</th>
                      <th className="p-1">Approve</th>
                      <th className="p-1">Export</th>
                      <th className="p-1">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/10">
                    {MODULE_LIST.map(modKey => {
                      const activeRoleData = roles.find(r => r.name === selectedRoleForMatrix);
                      if (!activeRoleData) return null;

                      const val = activeRoleData.permissions[modKey] || {
                        view: false, create: false, edit: false, delete: false, approve: false, export: false, manageSettings: false
                      };

                      // Helper to write toggler logic inside active state
                      const handleCellClick = (key: AccessKey) => {
                        setRoles(prev => prev.map(r => {
                          if (r.name === selectedRoleForMatrix) {
                            const updatedPerms = { ...r.permissions };
                            updatedPerms[modKey] = {
                              ...updatedPerms[modKey],
                              [key]: !updatedPerms[modKey][key]
                            };
                            return { ...r, permissions: updatedPerms };
                          }
                          return r;
                        }));
                      };

                      return (
                        <tr key={modKey} className="hover:bg-slate-500/5 text-center">
                          <td className="p-3 text-left font-extrabold text-slate-900 dark:text-slate-200">
                            {modKey}
                          </td>
                          <td className="p-1.5">
                            <button onClick={() => handleCellClick("view")} className="mx-auto block text-slate-400 p-1 hover:bg-gray-100 rounded">
                              {val.view ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="p-1.5">
                            <button onClick={() => handleCellClick("create")} className="mx-auto block text-slate-400 p-1 hover:bg-gray-100 rounded">
                              {val.create ? <CheckSquare className="w-4 h-4 text-[#E23744]" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="p-1.5">
                            <button onClick={() => handleCellClick("edit")} className="mx-auto block text-slate-400 p-1 hover:bg-gray-100 rounded">
                              {val.edit ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="p-1.5">
                            <button onClick={() => handleCellClick("delete")} className="mx-auto block text-slate-400 p-1 hover:bg-red-50 rounded">
                              {val.delete ? <CheckSquare className="w-4 h-4 text-red-600" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="p-1.5">
                            <button onClick={() => handleCellClick("approve")} className="mx-auto block text-slate-400 p-1 hover:bg-gray-100 rounded">
                              {val.approve ? <CheckSquare className="w-4 h-4 text-purple-600" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="p-1.5">
                            <button onClick={() => handleCellClick("export")} className="mx-auto block text-slate-400 p-1 hover:bg-gray-100 rounded">
                              {val.export ? <CheckSquare className="w-4 h-4 text-yellow-600" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="p-1.5">
                            <button onClick={() => handleCellClick("manageSettings")} className="mx-auto block text-slate-400 p-1 hover:bg-gray-100 rounded">
                              {val.manageSettings ? <CheckSquare className="w-4 h-4 text-orange-600" /> : <Square className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* VIEW C: HISTORICAL SECURITY AUDIT TRAILS */}
      {activeTab === "audit" && (
        <div className="space-y-4 animate-fade-in text-xs font-semibold text-slate-700">
          
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Terminal className="w-4.5 h-4.5 text-[#E23744]" /> Enterprise Configuration Ledger
              </h3>
              <p className="text-[11px] text-gray-400">Chronological list tracing RBAC role assignments, status blocks and security mutations.</p>
            </div>
            
            <button
              onClick={() => {
                const header = ["Log ID", "Staff Name", "Action Performed", "Role Modified", "Permissions Override Detail", "Performed By", "Timestamp"];
                const rows = auditLogs.map(l => [l.id, l.staffName, l.action, l.roleChanged, l.permissionsUpdated, l.modifiedBy, l.dateTime]);
                const content = "data:text/csv;charset=utf-8," + [header.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                const encodedUri = encodeURI(content);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `googly-delivery-audit-logs-${new Date().toISOString().split("T")[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                triggerToast("Logs Extracted", "CSV audit history exported.", "success");
              }}
              className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-900 rounded-xl transition-all font-black"
            >
              Export System Audit File
            </button>
          </div>

          <div className={`border rounded-2xl overflow-hidden shadow-xs ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"}`}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b font-extrabold text-[10px] tracking-wider uppercase text-gray-400 ${localDark ? "bg-slate-900/40 border-slate-800" : "bg-gray-50/70 border-gray-200"}`}>
                  <th className="p-4 pl-6">ID Code</th>
                  <th className="p-4">Staff Member Target</th>
                  <th className="p-4">Action Performed</th>
                  <th className="p-4">Identity Allocation Changed</th>
                  <th className="p-4">Permission Matrix Re-Calibration</th>
                  <th className="p-4">Performed By Admin</th>
                  <th className="p-4 text-right pr-6">Data/Time Vector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/10">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-500/5 font-semibold text-slate-700 dark:text-slate-300">
                    <td className="p-4 pl-6 text-indigo-500 font-bold font-mono text-[11px]">{log.id}</td>
                    <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100">{log.staffName}</td>
                    <td className="p-4 text-[#E23744] font-bold uppercase text-[10px]">{log.action}</td>
                    <td className="p-4">{log.roleChanged}</td>
                    <td className="p-4 text-gray-400 font-medium">{log.permissionsUpdated}</td>
                    <td className="p-4 font-mono text-gray-500 font-bold">{log.modifiedBy}</td>
                    <td className="p-4 text-right pr-6 text-gray-400 font-mono font-bold">{log.dateTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}


      {/* VIEW D: WHITELISTED ADMINS ACCESS CONTROL */}
      {activeTab === "authorized" && (
        <div className="space-y-4 animate-fade-in text-xs font-semibold text-slate-700">
          
          {/* Header Description */}
          <div className={`p-6 rounded-2xl border ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-xs"} space-y-2`}>
            <div className="flex items-center gap-2 text-[#E23744] font-bold">
              <ShieldCheck className="w-5 h-5 text-[#E23744]" />
              <h3 className="text-sm font-black dark:text-white">Authorized Admins-Only Access Control</h3>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed max-w-3xl font-medium">
              Strict pre-registration access control is active. Direct sign-ups, OTP triggers, and password reset procedures are validated on the backend before completing. Only email coordinates listed below are authorized to authenticate or request tokens.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add New Authorized Email Card */}
            <div className={`lg:col-span-1 p-6 rounded-2xl border h-fit space-y-4 ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"}`}>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Register New Admin Email</h4>
              
              <form onSubmit={handleAddAuthEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-gray-500 dark:text-gray-400">Admin Email Coordinate</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@googly.com"
                      value={newAuthEmail}
                      onChange={(e) => setNewAuthEmail(e.target.value)}
                      className={`w-full p-2.5 pl-9 text-xs font-semibold rounded-xl border focus:ring-1 focus:ring-[#E23744] outline-none ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-900"}`}
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={whitelistLoading}
                  className="w-full py-2.5 px-4 bg-[#E23744] hover:bg-[#c12531] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 hover:shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Save Authorized Admin
                </button>
              </form>
            </div>

            {/* Whitelisted Emails Table & List */}
            <div className={`lg:col-span-2 p-6 rounded-2xl border ${localDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200 shadow-sm"} space-y-4`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Whitelist Access Control List</h4>
                <button 
                  onClick={fetchWhitelist} 
                  type="button"
                  className="p-1 px-2 text-[10px] font-bold text-gray-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1 rounded border border-gray-100 hover:border-gray-200 dark:border-slate-800 transition cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Reload Base
                </button>
              </div>

              {whitelistLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 text-xs font-bold gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#E23744]" />
                  <span>Loading whitelist credentials...</span>
                </div>
              ) : authorizedEmails.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-xs font-bold border border-dashed rounded-xl border-gray-200 max-w-sm mx-auto bg-gray-50">
                  No whitelisted admin emails located.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100/10 shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`${localDark ? "bg-slate-850 text-slate-400" : "bg-slate-50 text-slate-500"} font-black`}>
                        <th className="p-3">Rank / Identity</th>
                        <th className="p-3">Email Access Key</th>
                        <th className="p-3 text-right">Revoke Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100/15 font-medium">
                      {authorizedEmails.map((emailAddr, idx) => {
                        const isMainOwner = emailAddr === "ruhandharpurkayastha@gmail.com";
                        return (
                          <tr key={emailAddr} className={`hover:bg-gray-50/5 transition ${localDark ? "text-white" : "text-slate-700"}`}>
                            <td className="p-3 font-mono text-[10px] text-gray-400 uppercase">
                              {isMainOwner ? (
                                <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/30 text-rose-500 font-bold text-[9px] border border-rose-100/20">
                                  Primary Owner
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-[9px]">
                                  Admin ID: {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-xs font-black select-all text-slate-900 dark:text-slate-100">
                              {emailAddr}
                            </td>
                            <td className="p-3 text-right">
                              {isMainOwner ? (
                                <span className="text-[10px] text-gray-400 italic">Protected</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAuthEmail(emailAddr)}
                                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-gray-400 hover:text-rose-500 transition cursor-pointer"
                                  title="Revoke Permission Keys"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* -------------------- STEP 4: ADD / EDIT STAFF SLIDE-OVER PANEL / MODAL -------------------- */}
      {showAddStaffPanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50 p-2 animate-fade-in select-none">
          <div className={`w-full max-w-4xl h-full rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-in relative ${localDark ? "bg-slate-900 text-white" : "bg-white text-slate-800"}`}>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100/10 pb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5.5 h-5.5 text-[#E23744]" />
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {isEditingStaff ? "Revise Profile Coordinates" : "Provision New Identity Account Client"}
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold uppercase font-mono">
                      {isEditingStaff ? `Editing Staff Block ID: ${editingStaffId}` : "Generates clean workplace routing credentials"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddStaffPanel(false)}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-400 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Form container */}
              <form onSubmit={handleAddStaffSubmit} className="space-y-6 text-xs font-bold text-gray-700 dark:text-slate-400">
                
                {/* 1. PERSONAL INFORMATION CARD */}
                <div className="space-y-3.5">
                  <h4 className="text-[11px] font-black text-[#E23744] uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> 1. Personal Information Section
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-gray-500 uppercase text-[9.5px]">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ruhandhar Purkayastha"
                        value={staffForm.name}
                        onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-855"}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-gray-500 uppercase text-[9.5px]">Employee ID (System Assigned)</label>
                      <input
                        type="text"
                        disabled
                        value={isEditingStaff && editingStaffId ? (staffList.find(s => s.id === editingStaffId)?.employeeId || "GENERATING...") : "System Auto Assignment"}
                        className="w-full p-2.5 rounded-xl border bg-gray-100 dark:bg-slate-800 text-gray-400 cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-gray-500 uppercase text-[9.5px]">Administrative Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="username@feastflow.co"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-855"}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-gray-500 uppercase text-[9.5px]">Administrative Phone vector *</label>
                      <input
                        type="text"
                        required
                        placeholder="+91 XXXXX XXXXX"
                        value={staffForm.phone}
                        onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-855"}`}
                      />
                    </div>

                    <div className="space-y-1 font-semibold">
                      <label className="block text-gray-500 uppercase text-[9.5px]">Department Hub Group</label>
                      <select
                        value={staffForm.department}
                        onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value as RbacStaff["department"] })}
                        className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                      >
                        <option value="Management">Management Core</option>
                        <option value="Operations">Operations Delivery</option>
                        <option value="Finance">Finance compliance</option>
                        <option value="Support">CRM support escalation</option>
                        <option value="Marketing">Marketing campaigns</option>
                        <option value="Engineering">System Infrastructure</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-gray-500 uppercase text-[9.5px]">Designation details (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Shift Coordinator"
                        value={staffForm.designation}
                        onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                        className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-855"}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-gray-500 uppercase text-[9.5px]">Operational physical street Address (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Street location details..."
                      value={staffForm.address}
                      onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                      className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-55 border-gray-200 text-slate-855"}`}
                    />
                  </div>

                  {/* Avatar preset selector grid */}
                  <div className="space-y-1.5 border-t border-gray-100/10 pt-3">
                    <label className="block text-[9.5px] uppercase text-gray-500">Administrative face profile avatar</label>
                    <div className="flex items-center gap-2 select-none">
                      <img src={staffForm.avatar} className="w-11 h-11 rounded-full object-cover border-2 border-[#E23744]" alt="" />
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
                          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100",
                          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100",
                          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
                          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
                          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100"
                        ].map((source, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setStaffForm({ ...staffForm, avatar: source })}
                            className={`w-8 h-8 rounded-full overflow-hidden border cursor-pointer transition-transform hover:scale-110 ${staffForm.avatar === source ? "border-[#E23744] scale-105" : "border-gray-200"}`}
                          >
                            <img src={source} className="w-full h-full object-cover" alt="" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. ROLE & CITY ASSIGNMENT SECTION */}
                <div className="p-4 bg-gray-50/50 dark:bg-slate-900/45 rounded-2xl border border-gray-100 dark:border-slate-900 space-y-4">
                  <h4 className="text-[11px] font-black text-[#E23744] uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> 2. Role Assignment & Active Regional Boundaries
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Role allocation */}
                    <div className="space-y-1.5 font-semibold">
                      <label className="block text-gray-500 uppercase text-[9.5px]">Identity Access Role *</label>
                      <select
                        value={staffForm.role}
                        onChange={(e) => handleFormRoleChange(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-slate-800"}`}
                      >
                        {roles.map(r => (
                          <option key={r.name} value={r.name}>{r.name}</option>
                        ))}
                        <option value="Custom Role">Custom Role</option>
                      </select>
                      
                      {/* Interactive block showing role description */}
                      <div className="p-2.5 bg-rose-500/5 dark:bg-slate-900 border border-[#E23744]/15 rounded-xl text-[10px] leading-relaxed text-gray-400 mt-1">
                        <strong className="text-slate-900 dark:text-white block uppercase mb-0.5">Role Characteristics:</strong>
                        {roles.find(r => r.name === staffForm.role)?.description || "Custom role with manual overrides configured on cell matrix grid levels below."}
                      </div>
                    </div>

                    {/* Regional boundaries select */}
                    <div className="space-y-2">
                      <label className="block text-gray-500 uppercase text-[9.5px]">Assigned City Location *</label>
                      <select
                        value={staffForm.assignedCity}
                        onChange={(e) => setStaffForm(prev => ({ ...prev, assignedCity: e.target.value, assignedZones: [e.target.value] }))}
                        className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-slate-800"}`}
                      >
                        {AVAILABLE_CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>

                      <div className="space-y-1 pt-1.5">
                        <span className="block text-gray-500 uppercase text-[9px]">Assign Active Delivery Zones (Multi-selection)</span>
                        <div className="flex flex-wrap gap-1.5 select-none pt-1">
                          {AVAILABLE_CITIES.map(zone => {
                            const selected = staffForm.assignedZones.includes(zone);
                            return (
                              <button
                                key={zone}
                                type="button"
                                onClick={() => handleZoneChoiceToggle(zone)}
                                className={`px-2.5 py-1.5 text-[9px] rounded-lg border font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                  selected 
                                    ? "bg-emerald-700 text-white border-emerald-600" 
                                    : "bg-white dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-800"
                                }`}
                              >
                                {selected ? "✓" : "+"} {zone}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. GRANULAR SYSTEM PERMISSIONS MATRIX ASSIGNMENT */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100/10 pb-2">
                    <h4 className="text-[11px] font-black text-[#E23744] uppercase tracking-wider flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5" /> 3. Granular Action Permissions override Settings
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer text-[10.5px]">
                      <input
                        type="checkbox"
                        checked={useCustomPermissions}
                        onChange={() => setUseCustomPermissions(!useCustomPermissions)}
                        className="rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
                      />
                      <span>Instantiate Manual Access Levels Override Matrix</span>
                    </label>
                  </div>

                  {useCustomPermissions ? (
                    <div className="space-y-3.5 border border-[#E23744]/20 p-4 rounded-3xl bg-rose-500/5 animate-fade-in relative">
                      
                      {/* Visual warning on sensitive modifications */}
                      {isGrantingSensitivePermission && (
                        <div className="p-3 bg-red-700/15 border border-red-500/25 rounded-2xl flex items-start gap-2 text-[10px] text-red-500 font-extrabold animate-pulse">
                          <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
                          <div>
                            Warning: Granting sensitive administrator privileges. Delete levels or RBAC matrix mutations allow deleting critical records or altering auth logs.
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto select-none">
                        <table className="w-full text-center text-[10.5px] font-bold border-collapse">
                          <thead>
                            <tr className="border-b border-gray-100 uppercase text-gray-400">
                              <th className="p-2 text-left">Administrative Module</th>
                              <th className="p-1">View</th>
                              <th className="p-1">Create</th>
                              <th className="p-1">Edit</th>
                              <th className="p-1 text-red-600">Delete</th>
                              <th className="p-1">Approve</th>
                              <th className="p-1">Export</th>
                              <th className="p-1">Settings</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100/10">
                            {MODULE_LIST.map(m => {
                              const moduleRow = customPermissions[m] || {
                                view: false, create: false, edit: false, delete: false, approve: false, export: false, manageSettings: false
                              };
                              return (
                                <tr key={m} className="hover:bg-slate-500/5">
                                  <td className={`p-2 text-left font-extrabold ${localDark ? "text-slate-100" : "text-slate-800"}`}>{m}</td>
                                  <td className="p-1">
                                    <input 
                                      type="checkbox" 
                                      checked={moduleRow.view} 
                                      onChange={() => handlePermissionCellToggle(m, "view")} 
                                      className="rounded accent-[#E23744] text-[#E23744] w-4 h-4 cursor-pointer" 
                                    />
                                  </td>
                                  <td className="p-1">
                                    <input 
                                      type="checkbox" 
                                      checked={moduleRow.create} 
                                      onChange={() => handlePermissionCellToggle(m, "create")} 
                                      className="rounded accent-[#E23744] text-[#E23744] w-4 h-4 cursor-pointer" 
                                    />
                                  </td>
                                  <td className="p-1">
                                    <input 
                                      type="checkbox" 
                                      checked={moduleRow.edit} 
                                      onChange={() => handlePermissionCellToggle(m, "edit")} 
                                      className="rounded accent-[#E23744] text-[#E23744] w-4 h-4 cursor-pointer" 
                                    />
                                  </td>
                                  <td className="p-1">
                                    <input 
                                      type="checkbox" 
                                      checked={moduleRow.delete} 
                                      onChange={() => handlePermissionCellToggle(m, "delete")} 
                                      className="rounded accent-[#E23744] text-[#E23744] w-4 h-4 cursor-pointer" 
                                    />
                                  </td>
                                  <td className="p-1">
                                    <input 
                                      type="checkbox" 
                                      checked={moduleRow.approve} 
                                      onChange={() => handlePermissionCellToggle(m, "approve")} 
                                      className="rounded accent-[#E23744] text-[#E23744] w-4 h-4 cursor-pointer" 
                                    />
                                  </td>
                                  <td className="p-1">
                                    <input 
                                      type="checkbox" 
                                      checked={moduleRow.export} 
                                      onChange={() => handlePermissionCellToggle(m, "export")} 
                                      className="rounded accent-[#E23744] text-[#E23744] w-4 h-4 cursor-pointer" 
                                    />
                                  </td>
                                  <td className="p-1">
                                    <input 
                                      type="checkbox" 
                                      checked={moduleRow.manageSettings} 
                                      onChange={() => handlePermissionCellToggle(m, "manageSettings")} 
                                      className="rounded accent-[#E23744] text-[#E23744] w-4 h-4 cursor-pointer" 
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-[11.5px] text-gray-400 font-semibold leading-relaxed">
                      💡 Standard permission inheritance model active. Toggling this core logic off inherit all access privileges from the main parent role (<strong>{staffForm.role}</strong>). Check the selector above to apply.
                    </div>
                  )}
                </div>

                {/* 4. SECURITY SETTINGS SCHEMES CARD */}
                <div className="p-4 bg-gray-55/10 dark:bg-slate-900/20 rounded-2xl border border-gray-200 dark:border-slate-900 space-y-4">
                  <h4 className="text-[11px] font-black text-[#E23744] uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> 4. IAM Gate & Security Access Constraints
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 font-semibold">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffForm.generateTempPw}
                          onChange={() => setStaffForm(prev => ({ ...prev, generateTempPw: !prev.generateTempPw }))}
                          className="rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
                        />
                        <span>Generate Secure Temporary Password Automatically</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffForm.forcePwChange}
                          onChange={() => setStaffForm(prev => ({ ...prev, forcePwChange: !prev.forcePwChange }))}
                          className="rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
                        />
                        <span>Force Key Rotation On First Workspace Login</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={staffForm.enable2fa}
                          onChange={() => setStaffForm(prev => ({ ...prev, enable2fa: !prev.enable2fa }))}
                          className="rounded text-[#E23744] focus:ring-[#E23744] w-4.5 h-4.5"
                        />
                        <span>Enable Google Authenticator Multi-Factor (2FA) By Default</span>
                      </label>
                    </div>

                    <div className="space-y-3 font-semibold">
                      <div className="space-y-1">
                        <label className="block text-gray-500 uppercase text-[9px]">Restrict Gateway Access by IP Ranges (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. 192.168.1.1/24, 103.44.11.*"
                          value={staffForm.restrictIp}
                          onChange={(e) => setStaffForm({ ...staffForm, restrictIp: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-xs ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-slate-800"}`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-gray-500 uppercase text-[9px]">Restrict Account Access by Hardware ID / Device (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Registered Apple MacBook, Workstation IPAD"
                          value={staffForm.restrictDevice}
                          onChange={(e) => setStaffForm({ ...staffForm, restrictDevice: e.target.value })}
                          className={`w-full p-2 rounded-lg border text-xs ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-slate-800"}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer buttons Inside sheet */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100/10">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffPanel(false)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-white rounded-xl transition-all cursor-pointer text-xs"
                  >
                    Cancel Workspace Addition
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" /> Save & Inspect Credentials
                  </button>
                </div>

              </form>
            </div>

          </div>
        </div>
      )}


      {/* -------------------- STEP 5: ACTIVATION CONFIRMATION DIALOG MODAL -------------------- */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up ${localDark ? "bg-slate-900 border border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            
            <div className="flex items-center gap-3 border-b border-gray-100/10 pb-3">
              <span className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  Account Activation Verification
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold font-mono">
                  Final security authorization handshake summary
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-900 space-y-3.5 text-xs font-bold leading-normal text-slate-655 dark:text-slate-400">
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-100/10">
                <span className="text-gray-500 uppercase text-[9.5px]">Staff Name Reference</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{staffForm.name}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-gray-100/10">
                <span className="text-gray-500 uppercase text-[9.5px]">Workspace Email / User</span>
                <span className="font-mono text-indigo-500 font-bold">{staffForm.email}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-gray-100/10">
                <span className="text-gray-500 uppercase text-[9.5px]">Allocated Group Role</span>
                <span className="text-[#E23744] font-black uppercase text-[10px]">{staffForm.role}</span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-gray-100/10">
                <span className="text-gray-500 uppercase text-[9.5px]">Assigned City & Regions</span>
                <span>{staffForm.assignedCity} ({staffForm.assignedZones.join(", ")})</span>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500 uppercase text-[9.5px] block">Permissions Summary Granted</span>
                <div className="max-h-24 overflow-y-auto p-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg text-[10px] space-y-1">
                  {useCustomPermissions ? (
                    Object.keys(customPermissions).map(mod => {
                      const row = customPermissions[mod as ModuleKey];
                      if (row.view) {
                        return (
                          <div key={mod} className="text-emerald-600">
                            • {mod}: {row.delete ? "Full Access + Delete" : "Standard Read + Write"}
                          </div>
                        );
                      }
                      return null;
                    })
                  ) : (
                    <div className="text-slate-500">
                      • Inherit all pristine parameters belonging to primary role: <strong>{staffForm.role}</strong>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2 select-none text-xs">
              <button
                onClick={() => setShowConfirmationModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
              >
                Go Back & Revise
              </button>

              <button
                onClick={() => handleConfirmActivation("Pending Activation")}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl cursor-pointer transition-all"
              >
                Save as Draft Invitation
              </button>

              <button
                onClick={() => handleConfirmActivation("Active")}
                className="px-4 py-2 bg-[#E23744] hover:bg-red-700 text-white font-extrabold rounded-xl cursor-pointer transition-all shadow-sm"
              >
                Create & Activate Account ⚡
              </button>
            </div>

          </div>
        </div>
      )}


      {/* -------------------- STEP 6: welcome automated email invitation modal -------------------- */}
      {showWelcomeEmailModal && latestEmailPayload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className="w-full max-w-2xl rounded-3xl p-6 bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-5 animate-scale-up">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5.5 h-5.5 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wide">
                    Automated Email Invitation Dispatched
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold font-mono">
                    To: <span className="text-emerald-500">{latestEmailPayload.email}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWelcomeEmailModal(false)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Email Envelope Card */}
            <div className="p-5 rounded-2xl bg-white text-slate-800 space-y-4 shadow-inner text-xs leading-relaxed font-semibold">
              <div className="border-b border-gray-100 pb-2.5 font-bold space-y-1">
                <div><span className="text-gray-400 font-normal">From:</span> auto-invite@feastflow.co</div>
                <div><span className="text-gray-400 font-normal">To:</span> {latestEmailPayload.email}</div>
                <div><span className="text-gray-400 font-normal">Subject:</span> Welcome to Googly Logistics Platform - Your Administrative Workspace is Active!</div>
              </div>

              <div className="space-y-3 font-normal text-slate-600">
                <p className="font-bold text-slate-900 text-sm">Hello {latestEmailPayload.staffName},</p>
                <p>
                  You have been registered as an administrative operational member on the <strong>Googly Restaurant & Delivery Dispatch Platform</strong>.
                </p>
                <p>
                  Your corporate gateway is fully provisioned. Use the temporal credentials below to complete your initial authentication.
                </p>

                {/* Secret credentials */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 font-mono text-xs text-slate-800">
                  <div><strong>Portal URL:</strong> <span className="text-[#E23744] hover:underline cursor-pointer">https://feastflow.co/admin/auth-node</span></div>
                  <div><strong>Username/Email:</strong> <span className="text-blue-600">{latestEmailPayload.email}</span></div>
                  <div><strong>Temporary Password:</strong> <span className="text-emerald-600 font-extrabold">{latestEmailPayload.tempPw}</span></div>
                </div>

                <div className="p-3.5 bg-rose-500/5 rounded-xl border border-[#E23744]/10 space-y-1">
                  <span className="font-bold text-slate-900 uppercase text-[9.5px] block">Assigned Scope Assignment:</span>
                  <div className="text-[10px] text-gray-500 leading-normal">
                    <strong>Operational City:</strong> {latestEmailPayload.assignedCity}<br />
                    <strong>Allocated Regional Sectors:</strong> {latestEmailPayload.assignedZones.join(", ")}<br />
                    <strong>IAM Group Role inherited:</strong> {latestEmailPayload.role}
                  </div>
                </div>

                <div className="text-[10.5px] text-gray-400 leading-normal pb-1">
                  ⚠️ <strong>Security Advisory:</strong> You will be programmatically forced to change this temporary password during your initial workspace login cycle. Do not share these coordinates.
                </div>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-xl border flex justify-between items-center text-[10.5px] select-all">
                <span className="text-gray-500 font-mono">Invite Code: FF-SEC-{Math.floor(100 + Math.random() * 899)}-INVT</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Email: ${latestEmailPayload.email}\nTemp Pass: ${latestEmailPayload.tempPw}\nRole: ${latestEmailPayload.role}`);
                    triggerToast("Credentials Copied to clipboard", "Workspace parameters copied safely.", "success");
                  }}
                  className="px-2.5 py-1 bg-[#E23744] text-white rounded text-[9.5px] font-black cursor-pointer uppercase flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy Logins
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 select-none pt-2 text-xs">
              <button
                onClick={() => setShowWelcomeEmailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl cursor-pointer"
              >
                Close Invitation Review
              </button>
            </div>

          </div>
        </div>
      )}


      {/* -------------------- DELETION CONFIRMATION DIALOG MODAL -------------------- */}
      {showDeleteConfirmation && staffToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up ${localDark ? "bg-slate-900 border border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <h3 className="text-sm font-black uppercase tracking-wide">Permanently Terminating Staff Access</h3>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Are you sure you want to permanently erase <strong className="text-slate-900 dark:text-slate-100">{staffToDelete.name}</strong> ({staffToDelete.employeeId}) and all their operational rights? This action <strong>cannot be undone</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setStaffToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                    handleDeleteStaff(staffToDelete.id);
                    setShowDeleteConfirmation(false);
                    setStaffToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer transition-all"
              >
                Permanently Terminate
              </button>
            </div>
          </div>
        </div>
      )}


      {/* -------------------- STEP 7: CREATE CUSTOM ROLE POPUP DIALOG -------------------- */}
      {showCreateRoleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
          <form onSubmit={handleCreateRoleSubmit} className={`w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up ${localDark ? "bg-slate-900 border border-slate-800 text-white" : "bg-white text-slate-800"}`}>
            
            <div className="flex items-center gap-3 border-b border-gray-100/10 pb-3">
              <span className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[#E23744]">
                <Key className="w-5.5 h-5.5" />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Create Custom Role
                </h3>
                <p className="text-[11px] text-gray-400 font-semibold font-mono">
                  Synthesize unique security parameters module mapping
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-bold text-gray-700 dark:text-slate-400">
              
              <div className="space-y-1">
                <label className="block text-gray-500 uppercase text-[9px]">Custom Role Alpha Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Guest Support Auditor"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-slate-800"}`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-gray-500 uppercase text-[9px]">Characteristics / Scope Description</label>
                <textarea
                  rows={2}
                  placeholder="Can view operations strictly and download audit logs..."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-gray-55 border-gray-200 text-slate-800"}`}
                />
              </div>

              <div className="space-y-1 font-semibold">
                <label className="block text-gray-445 uppercase text-[9px]">Clone Initial Permissions From Preset</label>
                <select
                  value={roleForm.cloneFrom}
                  onChange={(e) => setRoleForm({ ...roleForm, cloneFrom: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#E23744] ${localDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-slate-800"}`}
                >
                  <option value="None">None (All Blocked Baseline)</option>
                  {roles.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs select-none">
              <button
                type="button"
                onClick={() => setShowCreateRoleModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-white rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#E23744] hover:bg-red-700 text-white font-extrabold rounded-xl cursor-pointer shadow-sm"
              >
                Synthesize Role Matrix ⚡
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
