import React, { useState, useMemo, useEffect } from "react";
import { 
  Search, Calendar, Filter, Send, Circle, User, Users, Shield, 
  Clock, CheckCircle, AlertTriangle, AlertOctagon, MoreVertical, 
  MessageSquare, ChevronRight, Check, X, Paperclip, Image, 
  Smile, UserPlus, Flame, FolderPlus, HelpCircle, CornerDownRight, 
  Star, ThumbsUp, Layers, RefreshCw, BarChart2, ShieldAlert,
  Phone, Mail, ArrowUpRight, ChevronDown, Award, Trash2
} from "lucide-react";
import { SupportTicket, User as CRMUser } from "../types";

interface CustomerSupportCRMProps {
  tickets: SupportTicket[];
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  users: CRMUser[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

// Support metadata state map for advanced Zendesk props
interface TicketMetadata {
  priority: "Low" | "Medium" | "High" | "Urgent";
  customerType: "Customer" | "Rider" | "Restaurant";
  assignedAgent: string;
  unreadCount: number;
  subStatus: "Open" | "Pending" | "In Progress" | "Resolved" | "Escalated";
  internalNotes: string[];
  department: string;
  attachments: { name: string; url: string; size: string; type: "image" | "file" }[];
  resolutionNotes?: string;
  resolutionCategory?: string;
  feedbackRating?: number;
  feedbackFormClicked?: boolean;
}

export default function CustomerSupportCRM({
  tickets,
  setTickets,
  users,
  triggerToast
}: CustomerSupportCRMProps) {
  // Theme state check from parent element
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || 
                   document.body.classList.contains("dark") ||
                   localStorage.getItem("theme") === "dark";
    setThemeMode(isDark ? "dark" : "light");
  }, []);

  // Quick reply snippets
  const quickReplies = [
    "Apologize for delay: We are checking with the delivery captain immediately.",
    "Order Refund: Your amount is initiated for full reimbursement. Expect it in 2-3 days.",
    "Food Safety: This has been escalated to our senior audit kitchen expert team.",
    "Rider Misbehavior: Warning dispatched to terminal transport coordinator."
  ];

  // Map ticket IDs to extra CRM parameters
  const [ticketMeta, setTicketMeta] = useState<Record<string, TicketMetadata>>(() => {
    return {
      "CR-101": {
        priority: "High",
        customerType: "Customer",
        assignedAgent: "Sonia G. (Senior Support)",
        unreadCount: 2,
        subStatus: "In Progress",
        internalNotes: ["Checked with Biryani Express chef. They confirmed raw batches might have gone in error."],
        department: "Food Safety",
        attachments: [
          { name: "undercooked_mutton.jpg", url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300", size: "340 KB", type: "image" }
        ]
      },
      "CR-102": {
        priority: "Urgent",
        customerType: "Customer",
        assignedAgent: "Abhishek S.",
        unreadCount: 0,
        subStatus: "Open",
        internalNotes: ["Rider's GPS shows stuck in waterlogged subway near Salt Lake."],
        department: "Logistics",
        attachments: []
      },
      "CR-100": {
        priority: "Medium",
        customerType: "Customer",
        assignedAgent: "Sonia G. (Senior Support)",
        unreadCount: 0,
        subStatus: "Resolved",
        internalNotes: ["Refunded previous Monday order amount ₹350."],
        department: "Refunds/Billing",
        attachments: [],
        resolutionNotes: "Disbursed full refund compensation and sent apology SMS.",
        resolutionCategory: "Refund Disbursed",
        feedbackRating: 5
      }
    };
  });

  // Get ticket's priority
  const getPriorityMap = (tid: string): "Low" | "Medium" | "High" | "Urgent" => {
    return ticketMeta[tid]?.priority || (tid === "CR-100" ? "Medium" : "Low");
  };

  // Get ticket customer type
  const getCustomerTypeMap = (tid: string): "Customer" | "Rider" | "Restaurant" => {
    if (ticketMeta[tid]) return ticketMeta[tid].customerType;
    if (tid.includes("RIDER") || tid.endsWith("R")) return "Rider";
    if (tid.includes("REST") || tid.endsWith("B")) return "Restaurant";
    return "Customer";
  };

  // Safe accessor for metadata
  const getMeta = (tid: string): TicketMetadata => {
    if (ticketMeta[tid]) return ticketMeta[tid];
    return {
      priority: "Medium",
      customerType: "Customer",
      assignedAgent: "Unassigned Agent",
      unreadCount: 0,
      subStatus: "Open",
      internalNotes: [],
      department: "General Inquiries",
      attachments: []
    };
  };

  // State Management
  const [activeTicketId, setActiveTicketId] = useState<string>(tickets[0]?.id || "");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("All"); // Category tabs
  const [searchText, setSearchText] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [filterCustomerType, setFilterCustomerType] = useState<string>("All");
  const [filterDate, setFilterDate] = useState<string>("");

  // Input states
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [typedNote, setTypedNote] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [composerAttachments, setComposerAttachments] = useState<{ id: string; name: string; type: "image" | "file"; size: string }[]>([]);

  // Right Side Collapsible Customer view
  const [showCustomerSidebar, setShowCustomerSidebar] = useState(true);

  // Workflow / Action state overlays
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingNotes, setResolvingNotes] = useState("");
  const [resolutionCategory, setResolutionCategory] = useState("Refund Disbursed");
  const [resolveWorkflowType, setResolveWorkflowType] = useState<"close" | "feedback">("feedback");

  // CRM action overlays
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [changeAgentModal, setChangeAgentModal] = useState(false);
  const [changePriorityModal, setChangePriorityModal] = useState(false);
  const [changeStatusModal, setChangeStatusModal] = useState(false);
  const [escalateModal, setEscalateModal] = useState(false);
  const [transferDeptModal, setTransferDeptModal] = useState(false);

  // Simulated activity reports
  const [activityFeed, setActivityFeed] = useState<Array<{ id: string; text: string; time: string; author: string }>>([
    { id: "1", text: "Ticket assigned to Sonia G. (Senior Support)", time: "11:15 AM", author: "System Router" },
    { id: "2", text: "Checked database transaction ledger for billing code OO-8812", time: "11:20 AM", author: "Sonia G." },
    { id: "3", text: "Internal warning dispatched to primary merchant", time: "11:42 AM", author: "Super Admin Override" }
  ]);

  // Sync ticket metadata on change or load
  const selectedTicketObj = useMemo(() => {
    return tickets.find(t => t.id === activeTicketId) || null;
  }, [tickets, activeTicketId]);

  // Customer binding
  const alliedUserInfo = useMemo(() => {
    if (!selectedTicketObj) return null;
    // Attempt match in users array received
    const match = users.find(u => u.id === selectedTicketObj.userId || u.name.toLowerCase() === selectedTicketObj.userName.toLowerCase());
    if (match) return match;
    
    // Fallback Mock Details
    return {
      id: selectedTicketObj.userId || "user-99",
      name: selectedTicketObj.userName,
      email: `${selectedTicketObj.userName.replaceAll(" ", ".").toLowerCase()}@mail.com`,
      phone: selectedTicketObj.userPhone || "+91 98831 22311",
      walletBalance: 240,
      status: "Active" as const,
      savedAddresses: ["Primary Flat 3B, Astral Residency, Kolkata"],
      ordersCount: 14
    };
  }, [selectedTicketObj, users]);

  // Left sidebar counters calculations
  const categoryCount = useMemo(() => {
    const list = {
      All: tickets.length,
      Open: 0,
      Pending: 0,
      InProgress: 0,
      Resolved: 0,
      High: 0,
      Escalated: 0
    };

    tickets.forEach(t => {
      const meta = getMeta(t.id);
      
      // Open / Pending sub-status counter
      if (t.status === "Open") {
        list.Open += 1;
        if (meta.subStatus === "Pending") list.Pending += 1;
        if (meta.subStatus === "In Progress") list.InProgress += 1;
        if (meta.subStatus === "Escalated") list.Escalated += 1;
      } else {
        list.Resolved += 1;
      }

      // Priority counter
      if (meta.priority === "High" || meta.priority === "Urgent") {
        list.High += 1;
      }
    });

    return list;
  }, [tickets, ticketMeta]);

  // Filter calculation algorithm
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const meta = getMeta(t.id);

      // Search bar matches Search Text (ID, Name, Subject/Title, Message body)
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const searchId = t.id.toLowerCase().includes(query);
        const searchName = t.userName.toLowerCase().includes(query);
        const searchSubject = t.title.toLowerCase().includes(query);
        const searchMsg = t.chatHistory.some(c => c.message.toLowerCase().includes(query));

        if (!searchId && !searchName && !searchSubject && !searchMsg) return false;
      }

      // Sidebar category tabs filter
      if (selectedCategoryFilter === "Open" && t.status !== "Open") return false;
      if (selectedCategoryFilter === "Pending" && (t.status !== "Open" || meta.subStatus !== "Pending")) return false;
      if (selectedCategoryFilter === "InProgress" && (t.status !== "Open" || meta.subStatus !== "In Progress")) return false;
      if (selectedCategoryFilter === "Resolved" && t.status !== "Resolved") return false;
      if (selectedCategoryFilter === "High" && (meta.priority !== "High" && meta.priority !== "Urgent")) return false;
      if (selectedCategoryFilter === "Escalated" && (t.status !== "Open" || meta.subStatus !== "Escalated")) return false;

      // Dropdown Priority Filter
      if (filterPriority !== "All" && meta.priority !== filterPriority) return false;

      // Dropdown Status Filter
      if (filterStatus !== "All") {
        if (filterStatus === "Resolved" && t.status !== "Resolved") return false;
        if (filterStatus !== "Resolved" && (t.status !== "Open" || meta.subStatus !== filterStatus)) return false;
      }

      // Dropdown Customer Type Filter
      if (filterCustomerType !== "All" && meta.customerType !== filterCustomerType) return false;

      // Dropdown Date Filter (starts with)
      if (filterDate && !t.createdAt.startsWith(filterDate)) return false;

      return true;
    });
  }, [tickets, ticketMeta, selectedCategoryFilter, searchText, filterPriority, filterStatus, filterCustomerType, filterDate]);

  // Quick statistics calculated automatically
  const crmAnalytics = useMemo(() => {
    const openSize = tickets.filter(t => t.status === "Open").length;
    const resolvedSize = tickets.filter(t => t.status === "Resolved").length;
    const computedCSAT = resolvedSize > 0 ? "96.4%" : "94.2%";
    return {
      openCount: openSize,
      avgResponse: "1.2 Mins",
      avgResolve: "14.8 Mins",
      csat: computedCSAT
    };
  }, [tickets]);

  // Handlers
  const handleSelectTicket = (id: string) => {
    setActiveTicketId(id);
    // Mark as read immediately/Reset unread count
    if (ticketMeta[id]?.unreadCount > 0) {
      setTicketMeta(prev => ({
        ...prev,
        [id]: { ...prev[id], unreadCount: 0 }
      }));
    }
  };

  const handleSendResponse = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() && composerAttachments.length === 0) return;

    if (!selectedTicketObj) {
      triggerToast("No Conversation selected", "Please pick a live chat ticket first", "error");
      return;
    }

    const payloadText = replyText.trim();
    // timestamp formatting
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (isInternalNote) {
      // Append message as private internal orange note
      setTicketMeta(prev => {
        const ticketConf = prev[selectedTicketObj.id] || getMeta(selectedTicketObj.id);
        const nextNotes = [...(ticketConf.internalNotes || [])];
        nextNotes.push(`[Private Note] ${payloadText}`);
        return {
          ...prev,
          [selectedTicketObj.id]: {
            ...ticketConf,
            internalNotes: nextNotes
          }
        };
      });

      setActivityFeed(prev => [
        { id: Date.now().toString(), text: `Private internal note posted: "${payloadText.substring(0, 30)}..."`, time: formattedTime, author: "Agent Account" },
        ...prev
      ]);
      triggerToast("Private Note Added", "This entry is strictly locked to staff-eyes only.", "info");
    } else {
      // Client facing chat record
      const updatedChatHistory = [
        ...selectedTicketObj.chatHistory,
        {
          sender: "admin" as const,
          message: payloadText || `Transmitted attachment files: ${composerAttachments.map(f => f.name).join(", ")}`,
          time: formattedTime
        }
      ];

      // Update parent tickets list
      setTickets(prev => prev.map(t => {
        if (t.id === selectedTicketObj.id) {
          return {
            ...t,
            chatHistory: updatedChatHistory
          };
        }
        return t;
      }));

      // Reset states
      triggerToast("Message Dispatched", "Customer has received translation callback", "success");
    }

    setReplyText("");
    setComposerAttachments([]);
    setShowEmojiPicker(false);
  };

  // Quick Reply templating click handler
  const handleInsertQuickReply = (text: string) => {
    setReplyText(text);
    triggerToast("Snippet Inserted", "Quick template response mapped to text composer", "info");
  };

  // Simulate picking attachment files
  const handleAttachMockItem = (type: "image" | "file") => {
    const randomId = Math.random().toString();
    const mockFile = type === "image" 
      ? { id: randomId, name: `escalated_invoice_${Math.floor(Math.random() * 89 + 10)}.jpg`, type: "image" as const, size: "290 KB" }
      : { id: randomId, name: `delivery_manifest_batch_7.pdf`, type: "file" as const, size: "1.4 MB" };

    setComposerAttachments(prev => [...prev, mockFile]);
    triggerToast("Attachment Added", `Armed file ${mockFile.name} for transmission.`, "success");
  };

  // Ticket status updates
  const handleUpdateTicketMeta = (tid: string, key: keyof TicketMetadata, value: any) => {
    setTicketMeta(prev => {
      const conf = prev[tid] || getMeta(tid);
      return {
        ...prev,
        [tid]: { ...conf, [key]: value }
      };
    });
  };

  // Action Executions CRM Workspace
  const handleAssignAgentAction = (agentName: string) => {
    if (!activeTicketId) return;
    handleUpdateTicketMeta(activeTicketId, "assignedAgent", agentName);
    setChangeAgentModal(false);
    triggerToast("Staff Selected", `Assigned care agent ${agentName} to ticket ${activeTicketId}`, "success");
  };

  const handleChangePriorityAction = (prio: "Low" | "Medium" | "High" | "Urgent") => {
    if (!activeTicketId) return;
    handleUpdateTicketMeta(activeTicketId, "priority", prio);
    setChangePriorityModal(false);
    triggerToast("Priority Altered", `Adjusted urgency status to ${prio}`, "info");
  };

  const handleChangeStatusAction = (subStat: "Open" | "Pending" | "In Progress" | "Resolved" | "Escalated") => {
    if (!activeTicketId) return;
    handleUpdateTicketMeta(activeTicketId, "subStatus", subStat);
    
    // Synchronize to parent status flag too
    if (subStat === "Resolved") {
      setTickets(prev => prev.map(t => t.id === activeTicketId ? { ...t, status: "Resolved" } : t));
    } else {
      setTickets(prev => prev.map(t => t.id === activeTicketId ? { ...t, status: "Open" } : t));
    }

    setChangeStatusModal(false);
    triggerToast("Status Update Map", `Shifted CRM routing node status to ${subStat}`, "success");
  };

  const handleEscalateAction = () => {
    if (!activeTicketId) return;
    handleUpdateTicketMeta(activeTicketId, "subStatus", "Escalated");
    handleUpdateTicketMeta(activeTicketId, "priority", "Urgent");
    setEscalateModal(false);
    triggerToast("Ticket Escalated", `ALERT: CRM ticket ${activeTicketId} shifted to executive queue.`, "error");
  };

  const handleTransferDepartment = (dept: string) => {
    if (!activeTicketId) return;
    handleUpdateTicketMeta(activeTicketId, "department", dept);
    setTransferDeptModal(false);
    triggerToast("Department Transferred", `Routing to staff cohort: [${dept}]`, "info");
  };

  // Reopen ticket
  const handleReopenTicket = () => {
    if (!activeTicketId) return;
    setTickets(prev => prev.map(t => t.id === activeTicketId ? { ...t, status: "Open" } : t));
    handleUpdateTicketMeta(activeTicketId, "subStatus", "Open");
    triggerToast("Ticket Reopened", "This customer service thread is now unlocked to conversation responses.", "info");
  };

  // Merge ticket dummy simulation
  const handleMergeDuplicateTicket = () => {
    triggerToast("Duplicate Merged", "Combined matching records. Redundant ticket resolved.", "success");
  };

  // Confirm resolving ticket
  const handleResolveOpen = () => {
    if (!selectedTicketObj) return;
    setResolvingNotes(getMeta(selectedTicketObj.id).resolutionNotes || "");
    setShowResolveModal(true);
  };

  const handleExecuteResolve = () => {
    if (!selectedTicketObj) return;

    // 1. Mark status as resolved
    setTickets(prev => prev.map(t => t.id === selectedTicketObj.id ? { ...t, status: "Resolved" } : t));
    
    // 2. Set metadata notes & rating container
    handleUpdateTicketMeta(selectedTicketObj.id, "subStatus", "Resolved");
    handleUpdateTicketMeta(selectedTicketObj.id, "resolutionNotes", resolvingNotes || "Customer issue resolved successfully.");
    handleUpdateTicketMeta(selectedTicketObj.id, "resolutionCategory", resolutionCategory);
    
    // Close modal
    setShowResolveModal(false);
    triggerToast("Workflow Finalized", `Ticket ${selectedTicketObj.id} switched to Resolved. Feedback dispatched.`, "success");

    // Push automated rating request dummy layout
    const updatedHistory = [
      ...selectedTicketObj.chatHistory,
      {
        sender: "system" as const,
        message: `✓ Ticket resolved by staff. Resolution Notes: "${resolvingNotes || 'Issue addressed.'}". Category: ${resolutionCategory}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];

    if (resolveWorkflowType === "feedback") {
      updatedHistory.push({
        sender: "system" as const,
        message: `✦ Customer satisfaction feedback request dispatched automatically via Push & SMS SMS/Email link. Wait rating response...`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });
    }

    setTickets(prev => prev.map(t => t.id === selectedTicketObj.id ? { ...t, chatHistory: updatedHistory } : t));
  };

  // Customer triggers simulated feedback click
  const handleSelectFeedbackRatingInChat = (rating: number) => {
    if (!selectedTicketObj) return;
    handleUpdateTicketMeta(selectedTicketObj.id, "feedbackRating", rating);
    handleUpdateTicketMeta(selectedTicketObj.id, "feedbackFormClicked", true);
    triggerToast("CSAT Rating Received", `Customer gave ${rating} stars for ticket ${selectedTicketObj.id}`, "success");
    
    // Inject review rating into chat log system confirmation
    const updatedHistory = [
      ...selectedTicketObj.chatHistory,
      {
        sender: "system" as const,
        message: `★ Customer Rating Accepted: ${"★".repeat(rating)}${"☆".repeat(5-rating)} (${rating}/5). Client comment: 'Apprehensive service addressed properly. Thanks staff.'`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ];

    setTickets(prev => prev.map(t => t.id === selectedTicketObj.id ? { ...t, chatHistory: updatedHistory } : t));
  };

  // Filter counters layout list helper
  const sidebarFiltersList = [
    { label: "All Tickets", value: "All", count: categoryCount.All, color: "text-gray-400" },
    { label: "Open Tickets", value: "Open", count: categoryCount.Open, color: "text-emerald-500" },
    { label: "Pending Tracker", value: "Pending", count: categoryCount.Pending, color: "text-amber-500" },
    { label: "In Progress", value: "InProgress", count: categoryCount.InProgress, color: "text-blue-500" },
    { label: "Resolved Tickets", value: "Resolved", count: categoryCount.Resolved, color: "text-zinc-400" },
    { label: "High Urgency", value: "High", count: categoryCount.High, color: "text-rose-500" },
    { label: "Escalated Thread", value: "Escalated", count: categoryCount.Escalated, color: "text-purple-600 font-extrabold" },
  ];

  return (
    <div className={`p-1 select-none font-sans leading-relaxed ${themeMode === "dark" ? "text-gray-100" : "text-gray-800"}`}>
      
      {/* HEADER PERFORMANCE METRICS BAR */}
      <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        themeMode === "dark" ? "bg-[#1B1B1F] border-gray-800" : "bg-white border-gray-200"
      }`}>
        <div className="text-left space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-250 dark:border-slate-755 text-gray-700 dark:text-gray-300 text-[9px] font-black uppercase tracking-wider rounded-md">
              Zendesk Integration Active
            </span>
          </div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Customer Support & Live CRM</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Streamline ticket management, assign delegates, handle refunds, and measure agent resolution elasticity index.</p>
        </div>

        {/* Live CSAT Counters Widget */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto">
          <div className={`p-2.5 px-4 rounded-xl border text-left ${themeMode === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-zinc-150"}`}>
            <span className="text-[9px] text-stone-400 font-bold block uppercase">Unresolved Case</span>
            <strong className="text-sm font-black text-[#E23744] block mt-0.5">{crmAnalytics.openCount} Cases</strong>
          </div>
          <div className={`p-2.5 px-4 rounded-xl border text-left ${themeMode === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-zinc-150"}`}>
            <span className="text-[9px] text-stone-400 font-bold block uppercase">Avg Response Time</span>
            <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">{crmAnalytics.avgResponse}</strong>
          </div>
          <div className={`p-2.5 px-4 rounded-xl border text-left ${themeMode === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-zinc-150"}`}>
            <span className="text-[9px] text-stone-400 font-bold block uppercase">Avg Resolution Time</span>
            <strong className="text-sm font-black text-purple-600 dark:text-purple-400 block mt-0.5">{crmAnalytics.avgResolve}</strong>
          </div>
          <div className={`p-2.5 px-4 rounded-xl border text-left ${themeMode === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-zinc-150"}`}>
            <span className="text-[9px] text-stone-400 font-bold block uppercase">User CSAT Ratio</span>
            <strong className="text-sm font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">{crmAnalytics.csat}</strong>
          </div>
        </div>
      </div>

      {/* CORE 3-PANEL CRM INBOX SCREEN */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 h-[720px] items-stretch">
        
        {/* PANEL 1: LEFT SIDEBAR TICKET CATEGORIES & COMPLEX FILTERS */}
        <div className={`md:col-span-1 lg:col-span-3 rounded-2xl border p-4 flex flex-col justify-between overflow-y-auto text-left ${
          themeMode === "dark" ? "bg-[#18181B] border-gray-800" : "bg-white border-zinc-200"
        }`}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-black text-stone-400 tracking-wider">TICKET CLASSIFICATIONS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {/* Quick Search inside Inbox Category view */}
            <div className="relative">
              <input 
                type="text"
                placeholder="Search ticket text or ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-hidden focus:ring-1 focus:ring-[#E23744] ${
                  themeMode === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-gray-50 border-zinc-200 text-stone-800"
                }`}
              />
              <span className="absolute left-2.5 top-2.5 text-stone-400">
                <Search className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Counters categories list */}
            <div className="space-y-1">
              {sidebarFiltersList.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedCategoryFilter(filter.value)}
                  className={`w-full text-left p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    selectedCategoryFilter === filter.value 
                      ? "bg-[#E23744]/15 border border-[#E23744]/20 text-[#E23744]" 
                      : `hover:bg-slate-50 dark:hover:bg-gray-800 text-zinc-600 dark:text-gray-300 border border-transparent`
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Circle className={`w-2 h-2 fill-current ${filter.color}`} />
                    {filter.label}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                    selectedCategoryFilter === filter.value ? "bg-[#E23744] text-white" : "bg-stone-100 dark:bg-gray-800 text-stone-500"
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Multi Options Filter block */}
            <div className="space-y-2 text-left">
              <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3" /> COMPLEX ATTRIBUTE FILTERING
              </span>

              {/* Priority Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#E23744]">Priority Urgency</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className={`w-full p-1.5 text-xs font-bold rounded-lg border focus:outline-hidden ${
                    themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200 text-stone-700"
                  }`}
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#E23744]">Status Node</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full p-1.5 text-xs font-bold rounded-lg border focus:outline-hidden ${
                    themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200 text-stone-700"
                  }`}
                >
                  <option value="All">All statuses</option>
                  <option value="Open">Open</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Escalated">Escalated</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Customer Type Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#E23744]">Sender User Bracket</label>
                <select
                  value={filterCustomerType}
                  onChange={(e) => setFilterCustomerType(e.target.value)}
                  className={`w-full p-1.5 text-xs font-bold rounded-lg border focus:outline-hidden ${
                    themeMode === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-zinc-200 text-stone-700"
                  }`}
                >
                  <option value="All">All customer types</option>
                  <option value="Customer">Regular Customer</option>
                  <option value="Rider">Rider Captain</option>
                  <option value="Restaurant">Restaurant Vendor</option>
                </select>
              </div>

              {/* Date selection filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-[#E23744]">Creation Date</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={`w-full p-1.5 text-xs font-bold rounded-lg border focus:outline-hidden ${
                      themeMode === "dark" ? "bg-gray-900 border-gray-800 text-white" : "bg-white border-zinc-200 text-stone-700"
                    }`}
                  />
                  {filterDate && (
                    <button 
                      onClick={() => setFilterDate("")}
                      className="absolute right-6 top-1 text-[10px] text-red-500 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-gray-900 p-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-gray-800 mt-4 text-[10px] space-y-1">
            <span className="font-bold flex items-center gap-1 text-emerald-600"><Award className="w-3 h-3" /> SLA Performance</span>
            <p className="text-stone-400">Response queue compliance stands active. All escalated nodes routes to priority support queue within 4 minutes.</p>
          </div>
        </div>

        {/* PANEL 2: MIDDLE PANEL - TICKET INBOX LIST */}
        <div className={`md:col-span-1 lg:col-span-3 rounded-2xl border flex flex-col text-left ${
          themeMode === "dark" ? "bg-[#16161A] border-gray-800" : "bg-white border-zinc-200"
        }`}>
          <div className="p-3 border-b border-gray-100 dark:border-gray-900 bg-slate-50/50 dark:bg-gray-900/45 flex justify-between items-center rounded-t-2xl">
            <span className="text-[10px] tracking-wider uppercase font-black text-stone-400">
              INBOX ({filteredTickets.length})
            </span>
            <span className="text-[10px] text-[#E23744] font-black">
              Filtered streams
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-850 overflow-y-auto flex-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center m-auto space-y-1">
                <MessageSquare className="w-6 h-6 text-stone-300 mx-auto" />
                <strong className="text-xs font-extrabold text-stone-500 block">No support tickets found</strong>
                <p className="text-[10px] text-stone-400">Adjust the filters, search parameters or categories state.</p>
              </div>
            ) : (
              filteredTickets.map(tick => {
                const isSelected = tick.id === activeTicketId;
                const meta = getMeta(tick.id);
                
                // Color badges for priorities: Low, Medium, High, Urgent
                const badgeColor = {
                  Urgent: "bg-rose-100 text-rose-800 border-rose-200",
                  High: "bg-orange-100 text-orange-850 border-orange-205",
                  Medium: "bg-blue-100 text-blue-800 border-blue-200",
                  Low: "bg-gray-100 text-gray-700 border-zinc-150"
                }[meta.priority] || "bg-zinc-100 text-stone-700";

                const latestMsg = tick.chatHistory.length > 0 
                  ? tick.chatHistory[tick.chatHistory.length - 1].message
                  : "No messages in thread";

                return (
                  <div
                    key={tick.id}
                    id={`ticket-select-${tick.id}`}
                    onClick={() => handleSelectTicket(tick.id)}
                    className={`p-3 cursor-pointer transition-all border-l-4 relative ${
                      isSelected 
                        ? "bg-[#E23744]/5 border-[#E23744]" 
                        : "border-transparent bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-gray-900/40"
                    }`}
                  >
                    {/* Urgency indicator strip and Unread count badge */}
                    {meta.unreadCount > 0 && (
                      <span className="absolute top-3.5 right-3 w-5 h-5 bg-[#E23744] text-white rounded-full flex items-center justify-center font-black !text-[8px] animate-pulse">
                        {meta.unreadCount}
                      </span>
                    )}

                    <div className="flex justify-between items-center gap-1.5">
                      <span className="font-mono text-[10px] font-black text-[#E23744]">
                        {tick.id}
                      </span>
                      <span className={`text-[8px] font-black uppercase p-0.5 px-1.5 rounded-md border ${badgeColor}`}>
                        {meta.priority}
                      </span>
                    </div>

                    <div className="font-bold text-gray-900 dark:text-white text-xs mt-1 truncate">
                      {tick.title}
                    </div>

                    <div className="text-[10px] text-stone-400 mt-1 line-clamp-1 italic">
                      “{latestMsg}”
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[8px] text-stone-400 font-mono">
                      <span className="flex items-center gap-1 font-bold text-stone-600 dark:text-stone-300">
                        <User className="w-2.5 h-2.5 stroke-2" /> {tick.userName}
                      </span>
                      <span>
                        {new Date(tick.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Status badges */}
                    <div className="mt-1 flex gap-1 items-center">
                      <span className={`px-1 rounded text-[8px] font-black ${
                        tick.status === "Open" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"
                      }`}>
                        {tick.status}
                      </span>
                      <span className="p-0.5 px-1 bg-stone-100 dark:bg-gray-800 rounded text-[8px] text-stone-400 font-bold">
                        {meta.department}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANEL 3 & 4 Combined: RIGHT PANEL & COLLAPSIBLE CUSTOMER PANELS */}
        <div className={`md:col-span-2 lg:col-span-6 rounded-2xl border flex flex-col overflow-hidden text-left ${
          themeMode === "dark" ? "bg-[#1A1A1E] border-gray-800" : "bg-white border-zinc-200"
        }`}>
          {selectedTicketObj ? (
            <div className="flex flex-row h-full items-stretch">
              
              {/* CORE DISCUSSION PANEL */}
              <div className="flex-1 flex flex-col justify-between border-r border-gray-100 dark:border-gray-900 overflow-hidden h-full">
                
                {/* 3A: RIGHT CHANNEL HEADER WORKSPACE */}
                <div className="p-3.5 border-b border-gray-100 dark:border-gray-900 bg-slate-50/50 dark:bg-gray-900/30 flex justify-between items-center">
                  <div className="text-left">
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-bold">
                      <strong className="text-[#E23744] font-mono">{selectedTicketObj.id}</strong>
                      <span>•</span>
                      <span className="p-0.5 px-1.5 bg-[#E23744]/15 rounded text-[#E23744] text-[8.5px] uppercase font-black tracking-wider">
                        {selectedTicketObj.category}
                      </span>
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-white text-xs mt-0.5 truncate max-w-[280px]">
                      {selectedTicketObj.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Collapsible details layout toggler */}
                    <button 
                      onClick={() => setShowCustomerSidebar(!showCustomerSidebar)}
                      className={`p-1.5 rounded-lg border text-xs font-bold whitespace-nowrap flex items-center gap-1 ${
                        showCustomerSidebar ? "bg-[#E23744] text-white border-red-400" : "bg-white dark:bg-gray-800 text-stone-600 border-zinc-200"
                      }`}
                    >
                      <User className="w-3 h-3" /> Profile
                    </button>

                    {/* Quick Resolve trigger buttons */}
                    {selectedTicketObj.status === "Open" ? (
                      <button
                        id={`resolve-ticket-btn-${selectedTicketObj.id}`}
                        onClick={handleResolveOpen}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Check className="w-3.5 h-3.5" /> Resolve
                      </button>
                    ) : (
                      <button
                        onClick={handleReopenTicket}
                        className="bg-stone-200 text-stone-800 dark:bg-gray-800 dark:text-gray-100 hover:bg-stone-300 font-black text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Re-Open
                      </button>
                    )}

                    {/* ACTIONS DROPDOWN ANCHOR */}
                    <div className="relative">
                      <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-gray-800 border.zinc-200 border rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4 text-stone-400" />
                      </button>

                      {dropdownOpen && (
                        <div className="absolute right-0 top-10 w-44 bg-white dark:bg-gray-900 border border-zinc-200 dark:border-gray-900 rounded-xl shadow-lg z-30 p-1 divide-y divide-gray-100 dark:divide-gray-800">
                          <div className="py-1">
                            {/* Delegate assignment */}
                            <button 
                              onClick={() => { setChangeAgentModal(true); setDropdownOpen(false); }}
                              className="w-full text-left p-1.5 px-3 text-[11px] font-bold text-stone-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-800 rounded flex items-center gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" /> Assign Agent
                            </button>
                            {/* Priority selection changer */}
                            <button 
                              onClick={() => { setChangePriorityModal(true); setDropdownOpen(false); }}
                              className="w-full text-left p-1.5 px-3 text-[11px] font-bold text-stone-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-800 rounded flex items-center gap-1.5"
                            >
                              <Flame className="w-3.5 h-3.5" /> Urgency Level
                            </button>
                            {/* Sub stability status selector */}
                            <button 
                              onClick={() => { setChangeStatusModal(true); setDropdownOpen(false); }}
                              className="w-full text-left p-1.5 px-3 text-[11px] font-bold text-stone-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-800 rounded flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Change Status
                            </button>
                          </div>
                          <div className="py-1">
                            {/* Department dispatch transfer */}
                            <button 
                              onClick={() => { setTransferDeptModal(true); setDropdownOpen(false); }}
                              className="w-full text-left p-1.5 px-3 text-[11px] font-bold text-stone-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-800 rounded flex items-center gap-1.5"
                            >
                              <FolderPlus className="w-3.5 h-3.5" /> Transfer Cohort
                            </button>
                            {/* Escalated level */}
                            <button 
                              onClick={() => { setEscalateModal(true); setDropdownOpen(false); }}
                              className="w-full text-left p-1.5 px-3 text-[11px] font-bold text-stone-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-800 hover:text-red-700 rounded flex items-center gap-1.5"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" /> Escalate Queue
                            </button>
                            {/* Mergers */}
                            <button 
                              onClick={() => { handleMergeDuplicateTicket(); setDropdownOpen(false); }}
                              className="w-full text-left p-1.5 px-3 text-[11px] font-bold text-stone-700 dark:text-gray-200 hover:bg-stone-50 dark:hover:bg-gray-800 rounded flex items-center gap-1.5"
                            >
                              <Layers className="w-3.5 h-3.5" /> Merge Ticket
                            </button>
                          </div>
                          <div className="py-1">
                            {/* Permanent delete option */}
                            <button 
                              onClick={() => {
                                if (confirm(`Do you want to permanently delete support ticket ${activeTicketId}? This cannot be undone.`)) {
                                  setTickets(prev => prev.filter(t => t.id !== activeTicketId));
                                  const remaining = tickets.filter(t => t.id !== activeTicketId);
                                  setActiveTicketId(remaining[0]?.id || "");
                                  triggerToast("Ticket Permadeleted", `Support ticket ${activeTicketId} was permanently deleted.`, "success");
                                }
                                setDropdownOpen(false);
                              }}
                              className="w-full text-left p-1.5 px-3 text-[11px] font-black text-rose-700 hover:bg-rose-50 rounded flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Permanently
                            </button>
                            {/* Cancel out dropdown display */}
                            <button 
                              onClick={() => setDropdownOpen(false)}
                              className="w-full text-left p-1.5 px-3 text-[11px] hover:bg-red-50 text-red-700 rounded font-black flex items-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" /> Close Menu
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3B: TICKET CHAT SCROLL STREAM AREA */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-[#1E1E24]/30">
                  {/* Metadata context header notes inside chat */}
                  <div className="bg-slate-100 dark:bg-gray-900 p-3 rounded-xl border text-[11px] flex items-center justify-between gap-1.5">
                    <span className="text-stone-500 font-medium">
                      Assigned Delegate: <strong className="text-gray-800 dark:text-gray-100">{getMeta(selectedTicketObj.id).assignedAgent}</strong> | Category group: <strong className="text-gray-800 dark:text-gray-100">{getMeta(selectedTicketObj.id).department}</strong>
                    </span>
                    <span className="text-[#E23744] font-mono font-bold uppercase text-[9px]">SLA compliant</span>
                  </div>

                  {/* Private Internal Note section (if any found) */}
                  {getMeta(selectedTicketObj.id).internalNotes.map((note, nIdx) => (
                    <div key={nIdx} className="bg-amber-50 dark:bg-orange-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 text-xs text-left animate-fade-in text-amber-900">
                      <span className="font-extrabold uppercase text-[9px] block text-amber-700 mb-1">
                        🔒 PRIVATE INTERNAL STAFF NOTE
                      </span>
                      {note}
                    </div>
                  ))}

                  {/* Attachment thumbnails already uploaded */}
                  {getMeta(selectedTicketObj.id).attachments.map((file, fIdx) => (
                    <div key={fIdx} className="p-3 bg-white dark:bg-gray-800 rounded-xl border max-w-xs space-y-1.5 text-left border-zinc-150 animate-fade-in shadow-3xs">
                      <div>
                        <span className="font-bold text-[10px] uppercase text-[#E23744] block">Attached Complaint Image</span>
                        <span className="text-[9px] text-stone-400 font-mono italic">{file.name} ({file.size})</span>
                      </div>
                      <img 
                        src={file.url} 
                        alt="customer submission visual content preview" 
                        referrerPolicy="no-referrer"
                        className="w-full h-24 object-cover rounded-lg border border-zinc-200 shadow-inner" 
                      />
                    </div>
                  ))}

                  {/* Dynamic messaging rows */}
                  {selectedTicketObj.chatHistory.map((chat, index) => {
                    const isSys = chat.sender === "system";
                    const isAdmin = chat.sender === "admin";
                    
                    if (isSys) {
                      return (
                        <div key={index} className="flex gap-2 p-2 px-3 rounded-lg bg-orange-100/10 border border-orange-200/20 text-[10px] text-stone-500 font-mono italic items-center justify-center max-w-[90%] mx-auto text-center">
                          <CheckCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span>{chat.message}</span>
                          <span className="text-[8px] opacity-75 whitespace-nowrap">{chat.time}</span>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={index}
                        className={`flex flex-col max-w-[80%] ${
                          isAdmin ? "ml-auto items-end" : "mr-auto items-start"
                        }`}
                      >
                        <span className="text-[9px] text-stone-400 mb-0.5 font-bold">
                          {isAdmin ? "Super Support Delegate" : selectedTicketObj.userName}
                        </span>
                        <div className={`p-3 rounded-xl text-xs font-semibold ${
                          isAdmin 
                            ? "bg-[#E23744] text-white rounded-tr-none shadow-xs" 
                            : "bg-white dark:bg-[#202025] text-stone-900 dark:text-gray-100 rounded-tl-none border border-zinc-250 dark:border-gray-800 shadow-3xs"
                        }`}>
                          {chat.message}
                        </div>
                        <span className="text-[8px] text-stone-400 mt-1 font-mono">
                          {chat.time}
                        </span>
                      </div>
                    );
                  })}

                  {/* Customer feedback stars rendering (If ticket resolved / user submitted check) */}
                  {selectedTicketObj.status === "Resolved" && (
                    <div className="bg-sky-50 dark:bg-slate-900/40 p-4 rounded-xl border border-sky-100 dark:border-zinc-800 max-w-sm mx-auto text-center space-y-2 text-xs">
                      <div>
                        <strong>How would you rate our resolving support service?</strong>
                        <p className="text-[10px] text-stone-400">Rating request triggers satisfaction score analysis dashboards</p>
                      </div>

                      {/* Interactive Ratings Picker */}
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(st => {
                          const userRating = getMeta(selectedTicketObj.id).feedbackRating || 0;
                          return (
                            <button
                              key={st}
                              disabled={!!userRating}
                              onClick={() => handleSelectFeedbackRatingInChat(st)}
                              className="focus:outline-hidden transition-all text-lg hover:scale-110"
                            >
                              <Star className={`w-6 h-6 ${
                                st <= userRating ? "fill-amber-400 text-amber-400" : "text-stone-300"
                              }`} />
                            </button>
                          );
                        })}
                      </div>

                      {getMeta(selectedTicketObj.id).feedbackRating && (
                        <p className="text-[10px] text-sky-600 font-extrabold flex items-center justify-center gap-1 animate-fade-in">
                          <ThumbsUp className="w-3.5 h-3.5" /> Rating recorded: {getMeta(selectedTicketObj.id).feedbackRating} Stars CSAT!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* 3C: TICKET CHAT WORKSPACE COMPOSER */}
                {selectedTicketObj.status === "Open" ? (
                  <div className="p-3 border-t border-gray-100 dark:border-gray-900 bg-white dark:bg-[#1A1A1E] space-y-3">
                    
                    {/* Snippets / Quickreply helper strip */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1.5 md:max-w-2xl text-left">
                      <span className="text-[8.5px] font-black uppercase text-stone-400 whitespace-nowrap shrink-0">
                        Quick Snippets:
                      </span>
                      {quickReplies.map((qr, qrIdx) => (
                        <button
                          key={qrIdx}
                          onClick={() => handleInsertQuickReply(qr)}
                          className="p-1 px-2.5 rounded-lg border bg-stone-50 dark:bg-gray-800 hover:bg-[#E23744]/10 hover:text-[#E23744] hover:border-[#E23744]/20 text-[9px] text-stone-500 font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                        >
                          {qr.split(":")[0]}
                        </button>
                      ))}
                    </div>

                    {/* Composer input field lines */}
                    <form onSubmit={handleSendResponse} className="space-y-2">
                      <div className="flex items-start gap-2">
                        {/* Composer file attachment badges preview */}
                        {composerAttachments.map(file => (
                          <div key={file.id} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-[9px] flex items-center gap-1 border">
                            {file.type === "image" ? <Image className="w-3 h-3 text-rose-500" /> : <Paperclip className="w-3 h-3 text-blue-500" />}
                            <span>{file.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setComposerAttachments(prev => prev.filter(f => f.id !== file.id))}
                              className="text-red-500 font-bold hover:opacity-75"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className={`rounded-xl border flex flex-col justify-between p-2 ${
                        isInternalNote ? "bg-amber-500/10 border-amber-300" : "bg-gray-50 dark:bg-[#222226] border-zinc-200 dark:border-gray-800"
                      }`}>
                        <div className="flex justify-between items-center text-[10px] pb-1 border-b dark:border-gray-800 mb-1.5">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold select-none text-stone-500 dark:text-gray-300">
                            <input 
                              type="checkbox"
                              checked={isInternalNote}
                              onChange={(e) => setIsInternalNote(e.target.checked)}
                              className="rounded accent-amber-500 cursor-pointer h-3.5 w-3.5"
                            />
                            🔒 POST AS PRIVATE INTERNAL Note
                          </label>
                          <span className={`px-1 py-0.5 rounded text-[8px] font-black ${
                            isInternalNote ? "bg-amber-100 text-amber-800" : "bg-neutral-200 text-neutral-700"
                          }`}>
                            {isInternalNote ? "STAFF SECURED" : "USER VISIBLE OUTBOX"}
                          </span>
                        </div>

                        <textarea
                          placeholder={isInternalNote ? "Enter locked staff summary notes that the customer won't see..." : "Formulate customer reply callback details here..."}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          className="w-full bg-transparent border-0 ring-0 outline-hidden focus:ring-0 text-xs font-semibold resize-none text-gray-900 dark:text-white"
                        />

                        {/* Interactive Buttons footer for composer */}
                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-2 mt-1">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAttachMockItem("image")}
                              className="p-1 px-2 text-stone-500 hover:text-stone-900 dark:text-gray-400 bg-white dark:bg-gray-800 border.zinc-250 border rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-1 text-[10px] font-bold"
                              title="Attach visual complain receipt image"
                            >
                              <Image className="w-3.5 h-3.5 text-rose-500" /> +Image
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAttachMockItem("file")}
                              className="p-1 px-2 text-stone-500 hover:text-stone-900 dark:text-gray-400 bg-white dark:bg-gray-800 border.zinc-250 border rounded-lg hover:bg-stone-50 transition-colors flex items-center gap-1 text-[10px] font-bold"
                              title="Attach delivery receipt PDF or log export pack"
                            >
                              <Paperclip className="w-3.5 h-3.5 text-sky-500" /> +File
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-1.5 rounded-lg border hover:bg-stone-50 ${showEmojiPicker ? "bg-amber-100" : ""}`}
                              >
                                <Smile className="w-4 h-4 text-amber-500" />
                              </button>
                              
                              {showEmojiPicker && (
                                <div className="absolute bottom-10 left-0 bg-white dark:bg-gray-800 border p-2 rounded-xl shadow-lg z-30 grid grid-cols-4 gap-1.5">
                                  {["😊", "👍", "🍕", "🙏", "⚠️", "🛵", "❌", "💯"].map(emo => (
                                    <button
                                      key={emo}
                                      type="button"
                                      onClick={() => { setReplyText(prev => prev + emo); setShowEmojiPicker(false); }}
                                      className="p-1 text-sm hover:scale-125 focus:outline-hidden"
                                    >
                                      {emo}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="submit"
                            className={`p-2 px-5 text-white font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all ${
                              isInternalNote 
                                ? "bg-amber-600 hover:bg-amber-700" 
                                : "bg-[#E23744] hover:bg-rose-700 shadow-sm"
                            }`}
                          >
                            Send Message <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="p-4 border-t border-gray-100 bg-sky-50 dark:bg-gray-900/60 dark:border-gray-900 text-center text-xs text-sky-600 font-bold rounded-b-2xl flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-sky-500" /> Closed ticket thread is read-only. Clicking "Re-Open" releases lock constraints.
                  </div>
                )}
              </div>

              {/* 3D: INTERCOM SIDEBAR COLLAPSIBLE: CUSTOMER INFORMATION SYSTEM AND ACTIVITY REVENUE IMPACT */}
              {showCustomerSidebar && alliedUserInfo && (
                <div className="w-64 bg-slate-50/50 dark:bg-gray-900/40 border-l border-gray-100 dark:border-gray-900 overflow-y-auto p-4 space-y-4 text-left animate-fade-in shrink-0 hidden lg:block">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider">
                      Client Profile Intel
                    </span>
                    <button 
                      onClick={() => setShowCustomerSidebar(false)}
                      className="text-stone-400 hover:text-stone-700 text-[10px] font-bold"
                    >
                      Hide
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-rose-100 text-[#E23744] flex items-center justify-center font-black text-sm border-2 border-white dark:border-gray-800 shadow-3xs">
                        {alliedUserInfo.name.charAt(0)}
                      </div>
                      <div className="text-left font-sans">
                        <strong className="text-gray-900 dark:text-gray-100 text-xs block font-bold truncate max-w-[140px]">{alliedUserInfo.name}</strong>
                        <span className={`p-0.5 px-1.5 rounded text-[8px] font-extrabold uppercase mt-0.5 inline-block ${
                          alliedUserInfo.status === "Active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}>
                          {alliedUserInfo.status} Client
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-b border-dashed border-zinc-200 dark:border-gray-800 py-3 text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block font-bold uppercase">Customer ID</span>
                        <strong className="text-gray-800 dark:text-gray-200 font-mono text-[11px] block">{alliedUserInfo.id}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block font-bold uppercase">Email Account</span>
                        <span className="text-gray-800 dark:text-gray-200 block truncate font-medium text-[11px]"><Mail className="w-3.5 h-3.5 text-stone-400 inline" /> {alliedUserInfo.email || "ruhan@delivery.in"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block font-bold uppercase">Phone Contact</span>
                        <span className="text-gray-800 dark:text-gray-200 block truncate font-medium text-[11px]"><Phone className="w-3.5 h-3.5 text-stone-400 inline" /> {alliedUserInfo.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block font-bold uppercase">System Member Since</span>
                        <span className="text-gray-800 dark:text-gray-400 block font-mono text-[10px]">14-June-2024 (2 years ago)</span>
                      </div>
                    </div>

                    {/* Customer financial impact charts info */}
                    <div className="space-y-2 py-1 text-xs">
                      <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider block">SUPPORT ACCOUNTABILITY INDEX</span>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-400">Total Delivery Orders</span>
                        <strong className="text-gray-900 dark:text-gray-100">{alliedUserInfo.ordersCount || 10} Orders</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-400">Historical Complaints</span>
                        <strong className="text-red-500">3 Tickets</strong>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-400">Total Lifetime Spend</span>
                        <strong className="text-emerald-500">₹{(alliedUserInfo.ordersCount || 10)*340}</strong>
                      </div>
                    </div>

                    <hr className="border-gray-100 dark:border-gray-800" />

                    {/* Live Ticket activity logging stream */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-black text-emerald-600 tracking-wider block">
                        LIVE CRM DIARY LOGS
                      </span>
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {activityFeed.map(feed => (
                          <div key={feed.id} className="p-1.5 bg-white dark:bg-gray-800 text-[9px] rounded-lg border space-y-0.5 text-left">
                            <p className="text-stone-700 dark:text-gray-300 font-semibold">{feed.text}</p>
                            <span className="text-stone-400 block text-[8px] font-mono">{feed.time} by {feed.author}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="m-auto text-center p-12 space-y-3">
              <MessageSquare className="w-12 h-12 text-[#E23744]/15 mx-auto" />
              <strong className="text-sm font-black text-gray-800 dark:text-white block">No chat thread parsed</strong>
              <p className="text-xs text-stone-400">Please choose a support query from the active inbox streams to initialize the zendesk panels.</p>
            </div>
          )}
        </div>
      </div>

      {/* RESOLVE WORKFLOW DIALOG MODAL */}
      {showResolveModal && selectedTicketObj && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1A1A1E] rounded-2xl max-w-md w-full border border-zinc-200 dark:border-gray-800 p-6 space-y-4 shadow-2xl text-left">
            <div className="flex justify-between items-center border-b pb-3 dark:border-gray-800">
              <h2 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle className="w-5 h-5 text-emerald-600" /> CUSTOM SUPPORT RESOLUTION WORKFLOW
              </h2>
              <button 
                onClick={() => setShowResolveModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ticket Summary details card */}
            <div className="bg-slate-50 dark:bg-gray-900 p-3 rounded-xl border space-y-1.5 text-xs text-left">
              <span className="text-[10px] uppercase font-black text-[#E23744] block">Case Summary Draft</span>
              <p className="font-bold text-gray-900 dark:text-white">ID: {selectedTicketObj.id} • {selectedTicketObj.category}</p>
              <p className="text-stone-400">Subject: {selectedTicketObj.title}</p>
              <p className="text-stone-400">Original Creator: {selectedTicketObj.userName} ({selectedTicketObj.userPhone})</p>
            </div>

            {/* Resolution category selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#E23744] uppercase tracking-wider block">CRM Resolution Category</label>
              <select
                value={resolutionCategory}
                onChange={(e) => setResolutionCategory(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border focus:outline-hidden bg-white dark:bg-gray-900 dark:border-gray-700 text-stone-800 dark:text-white"
              >
                <option value="Refund Disbursed">Refund Compensation Disbursed</option>
                <option value="Delivery Delayed Fix">Delayed Courier/Rider Callback Fixed</option>
                <option value="Merchant reprimand">Restaurant Warning / Merchant reprimand</option>
                <option value="Spam Abuse Handled">Promotion Spam Abuse Investigated</option>
                <option value="Technical Bug Patched">Technical App Bug Handled</option>
                <option value="General Query Answered">General Guidance/Inquiry Answered</option>
              </select>
            </div>

            {/* Resolution explanatory notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#E23744] uppercase tracking-wider block">Manager Resolution Notes</label>
              <textarea
                rows={3}
                placeholder="Formulate exactly how the issue was resolved (e.g., Initiated cashback worth ₹350 and warned merchant regarding bad packaging...)"
                value={resolvingNotes}
                onChange={(e) => setResolvingNotes(e.target.value)}
                className="w-full p-2.5 text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-hidden font-semibold bg-white dark:bg-gray-900 dark:text-white border border-zinc-200 dark:border-gray-700 rounded-xl"
              />
            </div>

            <hr className="border-gray-100 dark:border-gray-900" />

            {/* Workflow behavior pickers */}
            <div className="space-y-2 text-left">
              <span className="text-[10px] uppercase font-black text-stone-400 tracking-wider block">POST-RESOLUTION ACTIONS</span>
              
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-xs text-stone-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="resolveType"
                    checked={resolveWorkflowType === "feedback"}
                    onChange={() => setResolveWorkflowType("feedback")}
                    className="accent-[#E23744] h-4 w-4"
                  />
                  Resolve & Push SMS/Email Rating Request
                </label>
                <p className="text-[10px] text-stone-400 ml-6">Sends automated satisfaction review form (1-5 stars widget) instantly inside their client delivery app notification drawer.</p>

                <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-xs text-stone-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="resolveType"
                    checked={resolveWorkflowType === "close"}
                    onChange={() => setResolveWorkflowType("close")}
                    className="accent-[#E23744] h-4 w-4"
                  />
                  Resolve & Close Immediately (Silent mode)
                </label>
                <p className="text-[10px] text-stone-400 ml-6">Mutes downstream automatic feedback notifications. Marked instantly. Read-only lockout.</p>
              </div>
            </div>

            {/* Modal foot actions */}
            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 border rounded-xl font-bold bg-white text-stone-600 hover:bg-stone-50"
              >
                Close Back
              </button>
              <button
                onClick={handleExecuteResolve}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl"
              >
                ✓ Terminate & Resolve Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPANION SMALL UTILITIES MODALS FOR CRM ACTIONS */}
      
      {/* 1. Delegate modal */}
      {changeAgentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border max-w-sm w-full p-5 rounded-2xl shadow-xl text-left space-y-4">
            <h3 className="font-black text-gray-900 dark:text-white text-sm">Assign Support Staff Delegate</h3>
            <p className="text-xs text-stone-400">Reroute customer query CRS thread to a dedicated executive agent.</p>
            <div className="space-y-1.5">
              {["Sonia G. (Senior Support)", "Abhishek S. (Merchant Lead)", "Pratham Y. (Rider Relations)", "Automatic AI Bot"].map(name => (
                <button
                  key={name}
                  onClick={() => handleAssignAgentAction(name)}
                  className="w-full text-left p-2 hover:bg-[#E23744]/10 hover:text-[#E23744] rounded-lg font-bold text-xs"
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setChangeAgentModal(false)} className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Priority modal */}
      {changePriorityModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border max-w-sm w-full p-5 rounded-2xl shadow-xl text-left space-y-4">
            <h3 className="font-black text-gray-900 dark:text-white text-sm">Adjust Urgency Priority</h3>
            <p className="text-xs text-stone-400">Configure ticket response priority matrix parameters.</p>
            <div className="grid grid-cols-2 gap-2">
              {(["Low", "Medium", "High", "Urgent"] as const).map(prio => (
                <button
                  key={prio}
                  onClick={() => handleChangePriorityAction(prio)}
                  className="p-2.5 hover:bg-stone-50 text-xs font-black border rounded-xl"
                >
                  {prio}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setChangePriorityModal(false)} className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Status modal */}
      {changeStatusModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border max-w-sm w-full p-5 rounded-2xl shadow-xl text-left space-y-4">
            <h3 className="font-black text-[#E23744] text-sm">Transfer sub-status workflow</h3>
            <p className="text-xs text-stone-400 font-mono">Shift target tracking index block:</p>
            <div className="space-y-1.5">
              {(["Open", "Pending", "In Progress", "Resolved", "Escalated"] as const).map(subStat => (
                <button
                  key={subStat}
                  onClick={() => handleChangeStatusAction(subStat)}
                  className="w-full text-left p-2 rounded-lg font-bold hover:bg-[#E23744]/15 hover:text-[#E23744] text-xs"
                >
                  Configure: {subStat}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setChangeStatusModal(false)} className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Escalate Modal */}
      {escalateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border max-w-sm w-full p-5 rounded-2xl shadow-xl text-left space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertOctagon className="w-6 h-6 stroke-2 animate-pulse" />
              <h3 className="font-black text-sm">Escalate ticket block?</h3>
            </div>
            <p className="text-xs text-stone-400">This instantly shifts priority rating index to URGENT and moves case block to Executive Manager Support desk queue.</p>
            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button onClick={() => setEscalateModal(false)} className="px-3 py-1.5 hover:bg-slate-50 text-stone-500 rounded">Cancel</button>
              <button onClick={handleEscalateAction} className="px-4 py-1.5 bg-[#E23744] hover:bg-rose-700 text-white font-black rounded-lg">✓ Escalate Thread</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Transfer Department Modal */}
      {transferDeptModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border max-w-sm w-full p-5 rounded-2xl shadow-xl text-left space-y-4">
            <h3 className="font-extrabold text-sm">Transfer Support Department</h3>
            <p className="text-xs text-stone-400">Route client thread query to specialized customer care cohorts:</p>
            <div className="space-y-1.5">
              {["Logistics", "Refunds/Billing", "Food Safety", "Merchant Operations", "General Inquiries"].map(deptName => (
                <button
                  key={deptName}
                  onClick={() => handleTransferDepartment(deptName)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-100 font-semibold text-xs text-stone-700 dark:text-gray-100"
                >
                  Cohort: {deptName}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setTransferDeptModal(false)} className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-50 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
