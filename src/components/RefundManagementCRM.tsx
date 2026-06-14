import React, { useState, useMemo } from "react";
import { 
  DollarSign, RefreshCw, CheckCircle, XCircle, AlertTriangle, 
  Search, ShieldAlert, ArrowRight, User, Phone, Mail, Calendar, 
  Download, FileSpreadsheet, FileText, ChevronRight, Filter, Info, 
  MessageSquare, Radio, Check, ChevronDown, Clock, ShieldCheck, 
  Send, ExternalLink, RefreshCw as LoopIcon, HelpCircle, Trash2
} from "lucide-react";
import { RefundRequest, Order, User as UserType } from "../types";

// Enhanced rich refund item definition
interface RichRefundRequest extends RefundRequest {
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  customerTotalOrders: number;
  previousRefundHistory: string;
  restaurantName: string;
  orderAmount: number;
  refundType: "Full" | "Partial";
  paymentMethod: string;
  assignedAdmin: string;
  riskScore: "Low" | "Medium" | "High";
  riskReasons: string[];
  comments: string;
  evidenceImage: string;
  timeline: { title: string; subtitle: string; time: string; current: boolean }[];
}

// Audit log entry for refund actions
interface RefundAuditLog {
  id: string;
  refundId: string;
  orderId: string;
  customerName: string;
  actionTaken: "Approved" | "Rejected" | "Status Change" | "Document Scan";
  adminName: string;
  timestamp: string;
  notes: string;
}

interface RefundManagementCRMProps {
  refunds: RefundRequest[];
  setRefunds: React.Dispatch<React.SetStateAction<RefundRequest[]>>;
  orders: Order[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function RefundManagementCRM({
  refunds,
  setRefunds,
  orders,
  triggerToast
}: RefundManagementCRMProps) {
  
  // Date range state
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days">("7days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [isCustomDate, setIsCustomDate] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected" | "Under Review">("All");
  const [refundTypeFilter, setRefundTypeFilter] = useState<"All" | "Full" | "Partial">("All");
  const [riskFilter, setRiskFilter] = useState<"All" | "Low" | "Medium" | "High">("All");
  const [minAmount, setMinAmount] = useState<number>(0);
  const [maxAmount, setMaxAmount] = useState<number>(3000);

  // Focus Drawer state
  const [selectedRequest, setSelectedRequest] = useState<RichRefundRequest | null>(null);

  // Approval workspace state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approveRefundType, setApproveRefundType] = useState<"Full" | "Partial">("Full");
  const [approveAmount, setApproveAmount] = useState<number>(0);
  const [approveDestination, setApproveDestination] = useState<"Original Payment Method" | "Wallet Credit">("Wallet Credit");

  // Rejection workspace state
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReasonCode, setRejectionReasonCode] = useState("Insufficient Evidence");
  const [customRejectionText, setCustomRejectionText] = useState("");

  // Notification Simulation Sandbox state
  const [lastNotificationStatus, setLastNotificationStatus] = useState<any>(null);
  const [selectedTemplateTab, setSelectedTemplateTab] = useState<"email" | "sms" | "push">("email");

  // Local editable template configurations
  const [notificationTemplates, setNotificationTemplates] = useState({
    approved: {
      emailSubject: "Refund Approved - Order {orderId}",
      emailBody: "Hello {customerName},\n\nWe are pleased to inform you that your refund request of ₹{amount} for Order #{orderId} has been successfully approved.\nThe amount will be credited to your {destination} within 24-48 hours.",
      smsBody: "Good news! Your refund of ₹{amount} for Order #{orderId} has been approved. Transferred to {destination}. - Team Googly",
      pushBody: "💸 Refund of ₹{amount} Approved - Credited to your {destination}."
    },
    rejected: {
      emailSubject: "Update regarding your refund request - Order {orderId}",
      emailBody: "Hello {customerName},\n\nOur complaints team has reviewed your request for Order #{orderId}.\nUnfortunately, we are unable to approve this refund due to: {reasonCode}.\n\nAdditional feedback from auditor:\n{customMessage}",
      smsBody: "Your refund request for Order #{orderId} could not be approved: {reasonCode}. Details sent to email.",
      pushBody: "⚠️ Refund Request Update - Please check your email for details regarding order #{orderId}."
    }
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<RefundAuditLog[]>([
    {
      id: "LOG-5511",
      refundId: "REF-202",
      orderId: "OO-34819",
      customerName: "Rohan Purkayastha",
      actionTaken: "Approved",
      adminName: "Abhishek S. (Auditor)",
      timestamp: "2026-06-11 12:00 PM",
      notes: "Auto-debit processed. Hair strand verified, refund amount ₹150 matches actual items cost."
    },
    {
      id: "LOG-5510",
      refundId: "REF-299",
      orderId: "OO-34701",
      customerName: "Ananya Roy",
      actionTaken: "Rejected",
      adminName: "Rohan P. (Admin)",
      timestamp: "2026-06-10 04:30 PM",
      notes: "Duplicate claims registered in consecutive orders. System blocked auto-approve."
    },
    {
      id: "LOG-5509",
      refundId: "REF-201",
      orderId: "OO-34818",
      customerName: "Siddharth Goenka",
      actionTaken: "Status Change",
      adminName: "System AI Guard",
      timestamp: "2026-06-11 10:15 AM",
      notes: "Flagged high fraud risk score (72%) due to multiple recent disputes."
    }
  ]);

  // Merge parent prop 'refunds' with rich meta-fields dynamically
  const richRefundRequests: RichRefundRequest[] = useMemo(() => {
    // Standard lookups
    const fallbackRichData: Record<string, Partial<RichRefundRequest>> = {
      "REF-201": {
        customerId: "CUST-40291",
        customerEmail: "siddharth.goe@gmail.com",
        customerPhone: "+91 98301 22819",
        customerTotalOrders: 42,
        previousRefundHistory: "1 prior refund (Approved for ₹120)",
        restaurantName: "Grand Biryani Darbar",
        orderAmount: 650,
        refundType: "Partial",
        paymentMethod: "UPI (Paytm)",
        assignedAdmin: "Ruhandh P. (Senior)",
        riskScore: "Medium",
        riskReasons: ["Multiple refund claims in past 14 days", "Assigned location discrepancy"],
        comments: "Food arrived 55 minutes cold and box was leaking. Driver didn't deliver directly to 4th floor.",
        evidenceImage: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80",
        timeline: [
          { title: "Refund Request Created", subtitle: "Registered by client Siddharth", time: "2026-06-11 10:05 AM", current: false },
          { title: "Under Review", subtitle: "AI safety score allocated: Medium (62%)", time: "2026-06-11 10:15 AM", current: true },
          { title: "Decision Taken", subtitle: "Pending Auditor Verification", time: "Waiting", current: false },
          { title: "Refund Processed", subtitle: "Instant bank settlement dispatch", time: "Waiting", current: false }
        ]
      },
      "REF-202": {
        customerId: "CUST-99210",
        customerEmail: "rohan.purk@outlook.com",
        customerPhone: "+91 91230 44556",
        customerTotalOrders: 19,
        previousRefundHistory: "0 prior refunds",
        restaurantName: "Swadh Bengal Restaurant",
        orderAmount: 180,
        refundType: "Full",
        paymentMethod: "NetBanking (HDFC)",
        assignedAdmin: "Abhishek S. (Auditor)",
        riskScore: "Low",
        riskReasons: [],
        comments: "Found hair strands in the dessert cup. Unhygienic preparation process from merchant.",
        evidenceImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
        timeline: [
          { title: "Refund Request Created", subtitle: "Soggy quality dispute recorded", time: "2026-06-11 11:45 AM", current: false },
          { title: "Approved & Logged", subtitle: "Wallet credited successfully", time: "2026-06-11 12:00 PM", current: true },
          { title: "Notification Dispatched", subtitle: "Push & Email verified status", time: "2026-06-11 12:01 PM", current: false }
        ]
      }
    };

    return refunds.map((ref, idx) => {
      const match = fallbackRichData[ref.id];
      if (match) {
        return {
          ...ref,
          ...match,
          // Sync current status and reject reason from raw state props
          status: ref.status as any,
          rejectReason: ref.rejectReason
        } as RichRefundRequest;
      }

      // Generate realistic mock fields for other dynamic items in case database expands
      const calculatedRisk: "Low" | "Medium" | "High" = idx % 3 === 0 ? "High" : idx % 2 === 0 ? "Medium" : "Low";
      return {
        ...ref,
        customerId: `CUST-883${12 + idx}`,
        customerEmail: `consumer_${idx + 1}@gmail.com`,
        customerPhone: `+91 91100 8820${idx}`,
        customerTotalOrders: 12 + idx * 5,
        previousRefundHistory: idx % 4 === 0 ? "2 requests (1 Rejected, 1 Approved)" : "0 prior requests",
        restaurantName: "Cheesy Crust Parlor",
        orderAmount: ref.amount + 120,
        refundType: idx % 2 === 0 ? "Full" : "Partial",
        paymentMethod: "UPI (GooglePay)",
        assignedAdmin: "Rohan P. (Admin)",
        riskScore: calculatedRisk,
        riskReasons: calculatedRisk === "High" ? ["Suspicious refund rate percentage", "High financial dispute size"] : [],
        comments: ref.reason || "Courier misplaced parts of the combo meal during transit.",
        evidenceImage: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80",
        timeline: [
          { title: "Refund Request Created", subtitle: "Disputed from App portal", time: ref.requestedAt.substring(0, 16).replace("T", " "), current: false },
          { title: "Under Review", subtitle: "Checking evidence files", time: "Active", current: true }
        ],
        status: ref.status as any,
        rejectReason: ref.rejectReason
      } as RichRefundRequest;
    });
  }, [refunds]);

  // Main filtered query calculations
  const filteredRequests = useMemo(() => {
    return richRefundRequests.filter(req => {
      // Search Box match
      const query = searchTerm.toLowerCase();
      if (query.trim() !== "") {
        const matchesId = req.id.toLowerCase().includes(query);
        const matchesOrderId = req.orderId.toLowerCase().includes(query);
        const matchesName = req.userName.toLowerCase().includes(query);
        const matchesRest = req.restaurantName.toLowerCase().includes(query);
        if (!matchesId && !matchesOrderId && !matchesName && !matchesRest) return false;
      }

      // Status Filter
      if (statusFilter !== "All" && req.status !== statusFilter) return false;

      // Type Filter
      if (refundTypeFilter !== "All" && req.refundType !== refundTypeFilter) return false;

      // Risk score
      if (riskFilter !== "All" && req.riskScore !== riskFilter) return false;

      // Amount ranges
      if (req.amount < minAmount || req.amount > maxAmount) return false;

      return true;
    });
  }, [richRefundRequests, searchTerm, statusFilter, refundTypeFilter, riskFilter, minAmount, maxAmount]);

  // Dashboard Overview Metrics values
  const metrics = useMemo(() => {
    const totalCount = richRefundRequests.length;
    const pendingCount = richRefundRequests.filter(r => r.status === "Pending").length;
    const approvedCount = richRefundRequests.filter(r => r.status === "Approved").length;
    const rejectedCount = richRefundRequests.filter(r => r.status === "Rejected").length;
    
    const approvedSum = richRefundRequests
      .filter(r => r.status === "Approved")
      .reduce((sum, current) => sum + current.amount, 0);

    const ratePct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

    return {
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      totalRefundedAmount: approvedSum,
      refundRate: ratePct
    };
  }, [richRefundRequests]);

  // Handle Opening Detail panel
  const handleOpenRequestDetails = (req: RichRefundRequest) => {
    setSelectedRequest(req);
  };

  // Launch Approval dialog
  const handleLaunchApprove = () => {
    if (!selectedRequest) return;
    setApproveAmount(selectedRequest.amount);
    setApproveRefundType(selectedRequest.refundType);
    setShowApprovalModal(true);
  };

  // Safe Approved Submission
  const handleConfirmApproval = () => {
    if (!selectedRequest) return;

    // Trigger update in main parent state
    setRefunds(prev => prev.map(item => {
      if (item.id === selectedRequest.id) {
        return {
          ...item,
          status: "Approved"
        };
      }
      return item;
    }));

    // Generate simulated notification templates text
    const destinationText = approveDestination === "Wallet Credit" ? "Googly Pay Wallet" : `original card / ${selectedRequest.paymentMethod}`;
    const emailSubjectParsed = notificationTemplates.approved.emailSubject
      .replace("{orderId}", selectedRequest.orderId);
    
    const emailBodyParsed = notificationTemplates.approved.emailBody
      .replace("{customerName}", selectedRequest.userName)
      .replace("{amount}", approveAmount.toString())
      .replace("{orderId}", selectedRequest.orderId)
      .replace("{destination}", destinationText);

    const smsText = notificationTemplates.approved.smsBody
      .replace("{amount}", approveAmount.toString())
      .replace("{orderId}", selectedRequest.orderId)
      .replace("{destination}", destinationText);

    const pushText = notificationTemplates.approved.pushBody
      .replace("{amount}", approveAmount.toString())
      .replace("{destination}", destinationText);

    setLastNotificationStatus({
      type: "Approved",
      customer: selectedRequest.userName,
      emailSubject: emailSubjectParsed,
      emailBody: emailBodyParsed,
      sms: smsText,
      push: pushText,
      destination: destinationText
    });

    // Write to local audit ledger
    const logId = `LOG-${Math.floor(Math.random() * 8999 + 1000)}`;
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    setAuditLogs(prev => [
      {
        id: logId,
        refundId: selectedRequest.id,
        orderId: selectedRequest.orderId,
        customerName: selectedRequest.userName,
        actionTaken: "Approved",
        adminName: "Senior FinTech Admin",
        timestamp: nowStr,
        notes: `Approved for ₹${approveAmount}. Transferred via ${approveDestination}.`
      },
      ...prev
    ]);

    // UI feedback
    triggerToast(
      "Refund Approved Successfully",
      `₹${approveAmount} will be returned to ${selectedRequest.userName} via ${approveDestination}. All notifications dispatched.`,
      "success"
    );

    // Update focused selectedRequest local rendering
    setSelectedRequest(prev => prev ? {
      ...prev,
      status: "Approved",
      timeline: [
        { title: "Refund Request Created", subtitle: "Disputed record", time: "Registered", current: false },
        { title: "Decision Taken - Approved", subtitle: `₹${approveAmount} to ${approveDestination}`, time: "Just Now", current: true }
      ]
    } : null);

    setShowApprovalModal(false);
  };

  // Launch Rejection dialog
  const handleLaunchReject = () => {
    if (!selectedRequest) return;
    setRejectionReasonCode("Insufficient Evidence");
    setCustomRejectionText("We were unable to verify this claim because the submitted photo does not clearly display food defects and delivery GPS metrics match the correct dropping coordinates.");
    setShowRejectionModal(true);
  };

  // Confirm Rejection
  const handleConfirmRejection = () => {
    if (!selectedRequest) return;

    // parent update
    setRefunds(prev => prev.map(item => {
      if (item.id === selectedRequest.id) {
        return {
          ...item,
          status: "Rejected",
          rejectReason: rejectionReasonCode
        };
      }
      return item;
    }));

    // Trigger parsed templates simulation state
    const emailSubjectParsed = notificationTemplates.rejected.emailSubject
      .replace("{orderId}", selectedRequest.orderId);

    const emailBodyParsed = notificationTemplates.rejected.emailBody
      .replace("{customerName}", selectedRequest.userName)
      .replace("{orderId}", selectedRequest.orderId)
      .replace("{reasonCode}", rejectionReasonCode)
      .replace("{customMessage}", customRejectionText);

    const smsText = notificationTemplates.rejected.smsBody
      .replace("{orderId}", selectedRequest.orderId)
      .replace("{reasonCode}", rejectionReasonCode);

    const pushText = notificationTemplates.rejected.pushBody
      .replace("{orderId}", selectedRequest.orderId);

    setLastNotificationStatus({
      type: "Rejected",
      customer: selectedRequest.userName,
      emailSubject: emailSubjectParsed,
      emailBody: emailBodyParsed,
      sms: smsText,
      push: pushText,
      reason: rejectionReasonCode
    });

    // Write to audit trail
    const logId = `LOG-${Math.floor(Math.random() * 8999 + 1000)}`;
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    setAuditLogs(prev => [
      {
        id: logId,
        refundId: selectedRequest.id,
        orderId: selectedRequest.orderId,
        customerName: selectedRequest.userName,
        actionTaken: "Rejected",
        adminName: "Senior FinTech Admin",
        timestamp: nowStr,
        notes: `Rejected due to: ${rejectionReasonCode}. Auditor feedback: "${customRejectionText.substring(0, 40)}..."`
      },
      ...prev
    ]);

    triggerToast(
      "Dispute Terminated & Rejected",
      `Refund ${selectedRequest.id} marked as Rejected. Reason: ${rejectionReasonCode}`,
      "error"
    );

    // update details drawer view state too
    setSelectedRequest(prev => prev ? {
      ...prev,
      status: "Rejected",
      rejectReason: rejectionReasonCode,
      timeline: [
        { title: "Refund Request Created", subtitle: "Disputed record", time: "Registered", current: false },
        { title: "Decision Taken - Rejected", subtitle: `Reason: ${rejectionReasonCode}`, time: "Just Now", current: true }
      ]
    } : null);

    setShowRejectionModal(false);
  };

  // Export spreadsheet visual click feedback
  const handleExportSpreadsheet = (format: "Excel" | "PDF") => {
    triggerToast(
      `${format} Export Dispatched`,
      `Compiled ${filteredRequests.length} refund ledger records into official ${format} format. Downloading...`,
      "success"
    );
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans leading-relaxed">
      
      {/* HEADER COMPONENT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl gap-4 shadow-sm">
        <div className="text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-750 text-gray-700 dark:text-gray-300 rounded-md text-[10px] font-black uppercase tracking-wider">
            🛡️ Fraud Prevention Active
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Disputes & Refund Management Central
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Audit customer food claims, examine photo evidence, verify fraud patterns, and safely trigger wallet compensations.
          </p>
        </div>

        {/* Date Filters pre-sets */}
        <div className="flex flex-wrap gap-2">
          {["today", "7days", "30days"].map((range) => (
            <button
              key={range}
              onClick={() => { setDateRange(range as any); setIsCustomDate(false); }}
              className={`p-1.5 px-3 rounded-lg text-[11px] font-black uppercase tracking-wide cursor-pointer transition-all ${
                dateRange === range && !isCustomDate
                  ? "bg-stone-900 text-white" 
                  : "bg-white border border-gray-250 text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-stone-300"
              }`}
            >
              {range === "today" ? "Today" : range === "7days" ? "Last 7 Days" : "Last 30 Days"}
            </button>
          ))}
          <button
            onClick={() => { setIsCustomDate(true); }}
            className={`p-1.5 px-3 rounded-lg text-[11px] font-black uppercase tracking-wide cursor-pointer transition-all ${
              isCustomDate 
                ? "bg-stone-900 text-white" 
                : "bg-white border border-gray-250 text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-stone-300"
            }`}
          >
            Custom Range
          </button>
        </div>
      </div>

      {/* Custom Picker layout if active */}
      {isCustomDate && (
        <div className="p-4 bg-white border border-dashed rounded-xl flex flex-wrap gap-4 items-end animate-fade-in text-xs">
          <div>
            <label className="block text-[10px] font-extrabold text-stone-500 mb-1">CLAIM DISPUTED START</label>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="p-1 border text-xs text-stone-700 rounded focus:outline-[#E23744]" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-stone-500 mb-1">CLAIM DISPUTED END</label>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="p-1 border text-xs text-stone-700 rounded focus:outline-[#E23744]" 
            />
          </div>
          <button
            onClick={() => {
              if (customStartDate && customEndDate) {
                triggerToast(
                  "Calendar Constraints Spliced", 
                  `Parsing refund requests made between ${customStartDate} and ${customEndDate}`, 
                  "info"
                );
              }
            }}
            className="p-2 py-1 bg-stone-900 font-extrabold text-white text-[11px] rounded"
          >
            Settle Date Range Filter
          </button>
        </div>
      )}

      {/* METRIC SUMMARIES */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Metric 1 */}
        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wide">Total Disputes</span>
            <strong className="text-xl font-black text-stone-900 dark:text-white mt-1 block">
              {metrics.total}
            </strong>
          </div>
          <span className="text-[9px] text-[#E23744] font-bold block mt-2">
            Dispatched via App
          </span>
        </div>

        {/* Metric 2 */}
        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wide">Pending Claims</span>
            <strong className="text-xl font-black text-amber-600 mt-1 block animate-pulse">
              {metrics.pending}
            </strong>
          </div>
          <span className="text-[9px] text-zinc-400 font-medium block mt-2">
            Requires intervention
          </span>
        </div>

        {/* Metric 3 */}
        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wide">Approved Refunds</span>
            <strong className="text-xl font-black text-emerald-600 mt-1 block">
              {metrics.approved}
            </strong>
          </div>
          <span className="text-[9px] text-emerald-600 font-bold block mt-2">
            Wallet credits dispatched
          </span>
        </div>

        {/* Metric 4 */}
        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wide">Rejected Claims</span>
            <strong className="text-xl font-black text-stone-700 dark:text-stone-300 mt-1 block">
              {metrics.rejected}
            </strong>
          </div>
          <span className="text-[9px] text-[#E23744] font-medium block mt-2">
            Flagged/Declined
          </span>
        </div>

        {/* Metric 5 */}
        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wide">Total Refunded Amount</span>
            <strong className="text-xl font-black text-rose-700 mt-1 block">
              ₹{metrics.totalRefundedAmount.toLocaleString()}
            </strong>
          </div>
          <span className="text-[9px] text-zinc-500 font-medium block mt-2">
            Direct reverse payment
          </span>
        </div>

        {/* Metric 6 */}
        <div className="p-4 bg-white dark:bg-[#1E1E24] border border-zinc-150 dark:border-gray-900 rounded-2xl text-left shadow-3xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wide">Refund Rate</span>
            <strong className="text-xl font-black text-indigo-600 mt-1 block">
              {metrics.refundRate}%
            </strong>
          </div>
          <span className="text-[9px] text-stone-400 block mt-2">
            Platform norm: &lt; 5%
          </span>
        </div>
      </div>

      {/* CENTRAL DISPUTE ROW: TABLE & DETAILED PROCESS DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFTSIDE: SEARCH FILTERS & DISPUTE QUEUE TABLE */}
        <div className={`space-y-4 transition-all duration-300 ${selectedRequest ? "lg:col-span-7" : "lg:col-span-12"}`}>
          
          <div className="bg-white dark:bg-[#1E1E24] p-4 rounded-xl border border-zinc-150 dark:border-gray-900 shadow-3xs">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
              
              {/* Left query match */}
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search Refund ID, Order, customer or merchant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 p-2 text-xs w-full bg-slate-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E23744]"
                />
              </div>

              {/* Quick Preset status toggles */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-zinc-400 font-bold">STATE:</span>
                {(["All", "Pending", "Approved", "Rejected"] as any[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer ${
                      statusFilter === st 
                        ? "bg-slate-900 text-white" 
                        : "bg-slate-100 text-stone-600 hover:bg-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters Expandable Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-dashed border-gray-100 text-xs">
              <div>
                <label className="block text-[10px] text-stone-400 font-extrabold mb-1">TYPE</label>
                <select
                  value={refundTypeFilter}
                  onChange={(e: any) => setRefundTypeFilter(e.target.value)}
                  className="p-1.5 w-full bg-slate-50 border border-zinc-200 rounded text-[11px]"
                >
                  <option value="All">All Types</option>
                  <option value="Full">Full Refund</option>
                  <option value="Partial">Partial Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-extrabold mb-1">SYSTEM FRAUD RISK</label>
                <select
                  value={riskFilter}
                  onChange={(e: any) => setRiskFilter(e.target.value)}
                  className="p-1.5 w-full bg-slate-50 border border-zinc-200 rounded text-[11px]"
                >
                  <option value="All">All Risks</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-extrabold mb-1">MIN AMOUNT (₹)</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(Number(e.target.value))}
                  className="p-1.5 w-full bg-slate-50 border border-zinc-200 rounded text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-stone-400 font-extrabold mb-1">MAX AMOUNT (₹)</label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(Number(e.target.value))}
                  className="p-1.5 w-full bg-slate-50 border border-zinc-200 rounded text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* TABLE */}
            <div className="bg-white dark:bg-[#1E1E24] rounded-xl border border-zinc-150 dark:border-gray-900 shadow-3xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-gray-800 border-b border-zinc-200 dark:border-gray-700 font-black text-[9.5px] uppercase text-stone-400 dark:text-gray-400">
                      <th className="p-3 pl-4">Refund ID</th>
                      <th className="p-3">Order Specs</th>
                      <th className="p-3">Customer Profile</th>
                      <th className="p-3">Disputed Merchant</th>
                      <th className="p-3">Requested Amount</th>
                      <th className="p-3">Claims Type</th>
                      <th className="p-3">Assigned Agent</th>
                      <th className="p-3 text-center">Safety Risk</th>
                      <th className="p-3">Status Badges</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-gray-800">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-stone-400 dark:text-gray-500">
                          <Info className="w-6 h-6 mx-auto mb-2 text-stone-300 dark:text-stone-600" />
                          No dispute claims match the current filter metrics. Try resetting.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((req) => (
                        <tr 
                          key={req.id} 
                          className={`hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                            selectedRequest?.id === req.id ? "bg-red-50/20 dark:bg-red-900/10" : ""
                          }`}
                          onClick={() => handleOpenRequestDetails(req)}
                        >
                          <td className="p-3 pl-4 font-mono font-black text-stone-900 dark:text-white border-l-2 border-transparent hover:border-red-500">
                            {req.id}
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-stone-500 dark:text-gray-400 font-bold block">{req.orderId}</span>
                            <span className="text-[10px] text-stone-400 block">{req.requestedAt.substring(0, 10)}</span>
                          </td>
                          <td className="p-3">
                            <strong className="text-stone-900 dark:text-white font-bold block">{req.userName}</strong>
                            <span className="text-[10px] font-mono text-stone-400 dark:text-gray-400">{req.customerId}</span>
                          </td>
                          <td className="p-3 text-stone-600 dark:text-gray-400 font-semibold">
                            {req.restaurantName || "Standard Merchant"}
                          </td>
                          <td className="p-3">
                            <strong className="text-gray-900 dark:text-white block">₹{req.amount}</strong>
                            <span className="text-[9.5px] text-zinc-400 dark:text-gray-500 block line-through">₹{req.orderAmount || req.amount}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                              req.refundType === "Full" ? "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-400" : "bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-400"
                            }`}>
                              {req.refundType} Refund
                            </span>
                          </td>
                          <td className="p-3 text-stone-500 dark:text-gray-400 text-[10px]">
                            {req.assignedAdmin || "Automated Platform Queue"}
                          </td>
                          <td className="p-3 text-center">
                            {req.riskScore === "High" && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-[9px] font-black rounded-lg uppercase animate-pulse">
                                ⚠️ {req.riskScore}
                              </span>
                            )}
                            {req.riskScore === "Medium" && (
                              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-[9px] font-black rounded-lg uppercase">
                                {req.riskScore}
                              </span>
                            )}
                            {req.riskScore === "Low" && (
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[9px] font-black rounded-lg uppercase">
                                {req.riskScore}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              req.status === "Approved" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" :
                              req.status === "Rejected" ? "bg-stone-200 dark:bg-gray-700 text-stone-800 dark:text-gray-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400"
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenRequestDetails(req)}
                                className="p-1 px-2 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded font-bold text-[10.5px] flex items-center justify-center gap-1 cursor-pointer"
                              >
                                Audit <ChevronRight className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Do you want to permanently delete refund dispute request ${req.id}? This cannot be undone.`)) {
                                    setRefunds(prev => prev.filter(r => r.id !== req.id));
                                    if (selectedRequest?.id === req.id) setSelectedRequest(null);
                                    triggerToast("Dispute Record Purged", `Refund request ${req.id} has been permanently deleted.`, "success");
                                  }
                                }}
                                className="p-1 px-1.5 hover:bg-rose-50 text-stone-400 hover:text-red-650 rounded-lg cursor-pointer transition-colors"
                                title="Delete refund request permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-3 bg-slate-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-[10px] text-stone-400 dark:text-gray-400">
                <span>Showing <strong>{filteredRequests.length}</strong> dispute tickets.</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">Financial Year 2026</span>
              </div>
          </div>
        </div>

        {/* RIGHTSIDE: DRAWER/DETAIL PANEL FOR ACTIVE CLAIM */}
        {selectedRequest && (
          <div className="lg:col-span-5 bg-white dark:bg-[#1E1E24] rounded-2xl border-2 border-[#E23744]/20 p-5 space-y-5 text-left shadow-lg relative animate-fade-in">
            
            {/* Close button Drawer view */}
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute right-4 top-4 p-1 rounded-full bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              <XCircle className="w-5 h-5 text-stone-600" />
            </button>

            {/* Top Identity of claim */}
            <div>
              <span className="text-[10px] font-black bg-stone-100 text-stone-800 px-2 py-0.5 rounded uppercase font-mono">
                CLAIM AUDIT FILE: {selectedRequest.id}
              </span>
              <h3 className="text-sm font-black text-stone-900 dark:text-white mt-1">Dispute Filed by Indian Consumer</h3>
              <p className="text-[10px] text-stone-400">Claims registered on platform {selectedRequest.requestedAt.substring(0, 16).replace("T", " ")}</p>
            </div>

            {/* FRAUD RISK SYSTEM ANALYSIS */}
            <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
              selectedRequest.riskScore === "High" ? "bg-red-50/50 border-red-200" :
              selectedRequest.riskScore === "Medium" ? "bg-amber-50/50 border-amber-200" : "bg-emerald-50/40 border-emerald-200"
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-[11px] flex items-center gap-1.5 text-stone-800 uppercase">
                  {selectedRequest.riskScore === "High" ? <ShieldAlert className="w-4 h-4 text-red-700" /> : <ShieldCheck className="w-4 h-4 text-emerald-600" />}
                  System Fraud Risk Assessment: {selectedRequest.riskScore} Risk
                </span>
                <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded">
                  {selectedRequest.riskScore === "High" ? "Score: 84/100" : selectedRequest.riskScore === "Medium" ? "Score: 48/100" : "Score: 12/100"}
                </span>
              </div>

              {selectedRequest.riskReasons && selectedRequest.riskReasons.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-[10px] text-stone-500 font-extrabold">RISK TRIGGERS FOUND:</p>
                  <ul className="list-disc list-inside text-stone-700 text-[10px] space-y-0.5 ml-1">
                    {selectedRequest.riskReasons.map((reason, rIdx) => (
                      <li key={rIdx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-[10px] text-emerald-800 font-medium">Clean record. No flags triggered on consumer address or checkout behaviors.</p>
              )}
            </div>

            {/* ORDER DETAILS PANEL */}
            <div className="p-3 bg-slate-50 dark:bg-stone-900 border rounded-xl space-y-2 text-xs">
              <strong className="text-stone-800 dark:text-white text-[11px] block border-b border-gray-200 pb-1 uppercase tracking-wider">
                🛒 Order Specs & Delivery Nodes
              </strong>
              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div>
                  <span className="text-stone-400 block text-[9.5px]">ORDER INDEX REFERENCE</span>
                  <strong className="text-stone-800 dark:text-white font-mono">{selectedRequest.orderId}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[9.5px]">MERCHANT PARTNER</span>
                  <strong className="text-stone-800 dark:text-white">{selectedRequest.restaurantName}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[9.5px]">ORDER TOTAL TRANSACTION</span>
                  <strong className="text-stone-800 dark:text-white">₹{selectedRequest.orderAmount}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[9.5px]">PAYMENT PIPELINE</span>
                  <strong className="text-stone-800 dark:text-white">{selectedRequest.paymentMethod}</strong>
                </div>
              </div>
            </div>

            {/* CUSTOMER PROFILE DETAIL PANEL */}
            <div className="p-3 bg-slate-50 dark:bg-stone-900 border rounded-xl space-y-2 text-xs">
              <strong className="text-stone-800 dark:text-white text-[11px] block border-b border-gray-200 pb-1 uppercase tracking-wider">
                👤 Consumer Background Meta
              </strong>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-400">Customer Name:</span>
                  <strong className="text-stone-900 dark:text-white">{selectedRequest.userName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Email Destination:</span>
                  <span className="text-stone-700 font-mono font-bold dark:text-stone-300">{selectedRequest.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Contact Number:</span>
                  <span className="text-stone-700 dark:text-stone-300 font-mono">{selectedRequest.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Historical Orders count:</span>
                  <span className="text-stone-900 dark:text-white font-bold">{selectedRequest.customerTotalOrders} orders delivered</span>
                </div>
                <div className="pt-1.5 mt-1 border-t border-dashed border-gray-200 flex justify-between items-center text-[10px]">
                  <span className="text-stone-500">Dispute Trailing logs:</span>
                  <strong className="text-amber-800 px-1 py-0.5 rounded bg-amber-50">
                    {selectedRequest.previousRefundHistory}
                  </strong>
                </div>
              </div>
            </div>

            {/* DISPUTE EXAM COMMENTS & PHOTOS */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-black text-stone-400 block uppercase">
                📝 Dispute Evidence & Comments
              </span>
              <div className="p-3 bg-red-100/30 border border-red-200/50 rounded-xl space-y-2">
                <p className="text-stone-700 italic">
                  "{selectedRequest.comments}"
                </p>
                {selectedRequest.evidenceImage && (
                  <div>
                    <span className="text-[9px] text-stone-400 font-extrabold block mb-1">UPLOADED PROOF DOCUMENT</span>
                    <div className="relative group border rounded-lg overflow-hidden h-28 bg-stone-100 flex items-center justify-center">
                      <img 
                        src={selectedRequest.evidenceImage} 
                        alt="Auditor proof" 
                        referrerPolicy="no-referrer"
                        className="object-cover h-full w-full"
                      />
                      <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold flex items-center gap-1 bg-black/60 p-1 px-2 rounded">
                          Click to expand photo <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TIMELINE DISPLAY */}
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-black text-stone-400 block uppercase">
                ⏳ Claims Handoff Timeline Traces
              </span>
              <div className="space-y-3 pl-3 border-l-2 border-stone-200 relative">
                {selectedRequest.timeline && selectedRequest.timeline.map((point, pIdx) => (
                  <div key={pIdx} className="relative text-[11px]">
                    <div className={`absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full ${
                      point.current ? "bg-[#E23744] ring-4 ring-red-100 animate-pulse" : "bg-stone-300"
                    }`} />
                    <div className="text-[10.5px]">
                      <strong className={`block ${point.current ? "text-stone-900 font-black" : "text-stone-500 font-semibold"}`}>
                        {point.title}
                      </strong>
                      <span className="text-[9.5px] text-stone-400 block">{point.subtitle} ({point.time})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION DISPATCH BUTTONS FOR PENDING STATUS */}
            <div className="pt-2 border-t border-dashed border-gray-100">
              {selectedRequest.status === "Pending" ? (
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    id="reject-refund-drawer-btn"
                    onClick={handleLaunchReject}
                    className="p-2.5 bg-red-700 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <XCircle className="w-4 h-4" /> Reject refund request
                  </button>
                  
                  <button
                    id="approve-refund-drawer-btn"
                    onClick={handleLaunchApprove}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve & process payout
                  </button>
                </div>
              ) : selectedRequest.status === "Rejected" ? (
                <div className="p-3 bg-stone-100 border rounded-xl text-center text-xs">
                  <span className="text-stone-500 font-bold">This request was Rejected</span>
                  {selectedRequest.rejectReason && (
                    <p className="text-red-600 font-bold mt-1">Reason: {selectedRequest.rejectReason}</p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-800 font-bold flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Refund Approved & Dispensed back to Original Pipeline
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* REGION: TEMPLATE & NOTIFICATION AUTOMATION MANAGEMENT WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Real-time preview of sandbox message dispatch */}
        <div className="lg:col-span-12 xl:col-span-8 bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 text-left shadow-3xs">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <div>
              <h3 className="text-xs uppercase font-black text-[#E23744]">Consumer Push & Notification Automation Templates</h3>
              <p className="text-[10px] text-stone-400">Alter auto-dispatch templates that alert users on WhatsApp, Email and App notifications.</p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(["email", "sms", "push"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTemplateTab(tab)}
                  className={`p-1 px-2 text-[10px] uppercase font-black rounded-md transition-all cursor-pointer ${
                    selectedTemplateTab === tab ? "bg-white text-stone-900 shadow-3xs" : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {tab} Channel
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Approved Template Edit Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-3.5 text-xs text-left">
              <span className="p-1 px-2.2 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded uppercase">
                Approved state automatic trigger
              </span>

              {selectedTemplateTab === "email" && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-bold text-stone-500 block">EMAIL SUBJECT LINE</span>
                    <input 
                      type="text" 
                      value={notificationTemplates.approved.emailSubject}
                      onChange={(e) => setNotificationTemplates(prev => ({
                        ...prev, approved: { ...prev.approved, emailSubject: e.target.value }
                      }))}
                      className="p-1.5 w-full bg-white border rounded text-xs focus:ring-[#E23744]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-bold text-stone-500 block">EMAIL CUSTOM BODY</span>
                    <textarea 
                      rows={4}
                      value={notificationTemplates.approved.emailBody}
                      onChange={(e) => setNotificationTemplates(prev => ({
                        ...prev, approved: { ...prev.approved, emailBody: e.target.value }
                      }))}
                      className="p-1.5 w-full bg-white border rounded text-xs font-mono text-[10.5px]" 
                    />
                  </div>
                </div>
              )}

              {selectedTemplateTab === "sms" && (
                <div className="space-y-1">
                  <span className="text-[9.5px] font-bold text-stone-500 block">SMS GSM TEXT LIMIT (160 characters)</span>
                  <textarea 
                    rows={4}
                    value={notificationTemplates.approved.smsBody}
                    onChange={(e) => setNotificationTemplates(prev => ({
                      ...prev, approved: { ...prev.approved, smsBody: e.target.value }
                    }))}
                    className="p-1.5 w-full bg-white border rounded text-xs font-mono text-[10.5px]" 
                  />
                </div>
              )}

              {selectedTemplateTab === "push" && (
                <div className="space-y-1">
                  <span className="text-[9.5px] font-bold text-stone-500 block">APP PUSH BANNER</span>
                  <textarea 
                    rows={4}
                    value={notificationTemplates.approved.pushBody}
                    onChange={(e) => setNotificationTemplates(prev => ({
                      ...prev, approved: { ...prev.approved, pushBody: e.target.value }
                    }))}
                    className="p-1.5 w-full bg-white border rounded text-xs font-mono text-[10.5px]" 
                  />
                </div>
              )}
            </div>

            {/* Rejected Template Edit Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-3.5 text-xs text-left">
              <span className="p-1 px-2.2 bg-red-100 text-red-800 text-[9px] font-black rounded uppercase">
                Rejected state automatic trigger
              </span>

              {selectedTemplateTab === "email" && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-bold text-stone-500 block">EMAIL SUBJECT LINE</span>
                    <input 
                      type="text" 
                      value={notificationTemplates.rejected.emailSubject}
                      onChange={(e) => setNotificationTemplates(prev => ({
                        ...prev, rejected: { ...prev.rejected, emailSubject: e.target.value }
                      }))}
                      className="p-1.5 w-full bg-white border rounded text-xs focus:ring-[#E23744]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-bold text-stone-500 block">EMAIL CUSTOM REJECTION BODY</span>
                    <textarea 
                      rows={4}
                      value={notificationTemplates.rejected.emailBody}
                      onChange={(e) => setNotificationTemplates(prev => ({
                        ...prev, rejected: { ...prev.rejected, emailBody: e.target.value }
                      }))}
                      className="p-1.5 w-full bg-white border rounded text-xs font-mono text-[10.5px]" 
                    />
                  </div>
                </div>
              )}

              {selectedTemplateTab === "sms" && (
                <div className="space-y-1">
                  <span className="text-[9.5px] font-bold text-stone-500 block">SMS BULK TEXT</span>
                  <textarea 
                    rows={4}
                    value={notificationTemplates.rejected.smsBody}
                    onChange={(e) => setNotificationTemplates(prev => ({
                      ...prev, rejected: { ...prev.rejected, smsBody: e.target.value }
                    }))}
                    className="p-1.5 w-full bg-white border rounded text-xs font-mono text-[10.5px]" 
                  />
                </div>
              )}

              {selectedTemplateTab === "push" && (
                <div className="space-y-1">
                  <span className="text-[9.5px] font-bold text-stone-500 block">PUSH NOTIFICATION OVERLAY</span>
                  <textarea 
                    rows={4}
                    value={notificationTemplates.rejected.pushBody}
                    onChange={(e) => setNotificationTemplates(prev => ({
                      ...prev, rejected: { ...prev.rejected, pushBody: e.target.value }
                    }))}
                    className="p-1.5 w-full bg-white border rounded text-xs font-mono text-[10.5px]" 
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-[10px] text-stone-400 block border-t pt-3 flex items-center justify-between">
            <span>Macro variables allowed: <strong className="font-mono text-[#E23744] font-bold">{`{customerName}`}, {`{amount}`}, {`{orderId}`}, {`{reasonCode}`}, {`{destination}`}</strong></span>
            <button 
              onClick={() => triggerToast("Templates Synchronized", "Platform automatic hooks calibrated successfully for downstream users.", "success")}
              className="px-2.5 py-1 bg-stone-900 border text-white rounded font-bold hover:bg-stone-800"
            >
              Sync Template Scripts
            </button>
          </div>
        </div>

        {/* Right Side: Log of actual alerts dispatched or sandbox messages received */}
        <div className="lg:col-span-12 xl:col-span-4 bg-white dark:bg-[#1E1E24] p-5 rounded-2xl border border-zinc-150 dark:border-gray-900 text-left shadow-3xs flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1 border-b pb-2">
              <Send className="w-3.5 h-3.5" /> Outgoing Dispatch Sandbox Preview (Live)
            </span>

            {lastNotificationStatus ? (
              <div className="space-y-3.5 text-xs animate-fade-in">
                <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-extrabold text-indigo-700 uppercase">
                      ✉️ Simulated Email (Sent to client)
                    </span>
                    <span className="text-[8px] bg-indigo-600 text-white font-black px-1.5 py-0.5 rounded">
                      DELIVERED
                    </span>
                  </div>
                  <strong className="text-gray-800 font-bold block">Subject: {lastNotificationStatus.emailSubject}</strong>
                  <p className="text-stone-600 text-[10.5px] font-mono leading-relaxed bg-white border p-2 rounded whitespace-pre-line text-[9.5px]">
                    {lastNotificationStatus.emailBody}
                  </p>
                </div>

                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs space-y-1">
                  <span className="text-[9.5px] font-extrabold text-sky-700 uppercase block">
                    💬 WhatsApp/SMS text preview
                  </span>
                  <p className="text-stone-700 text-[10px] font-serif bg-white p-2 rounded border">
                    "{lastNotificationStatus.sms}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-stone-400 text-xs">
                <Radio className="w-8 h-8 text-stone-300 mx-auto mb-2 animate-pulse" />
                <span>No approval/rejection actions taken in this cycle. Complete an action to preview simulated outgoing customer alerts.</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between text-[10px] text-stone-400">
            <span>Automation Hub Gateway</span>
            <span className="text-emerald-600 font-bold">API Online</span>
          </div>
        </div>
      </div>

      {/* REGION: AUDIT LEDGER TRAILS HISTORY OF COMPLAINTS */}
      <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-zinc-150 dark:border-gray-900 p-5 text-left shadow-3xs space-y-4">
        <div className="flex justify-between items-center border-b pb-3 flex-wrap gap-2">
          <div>
            <h3 className="text-xs uppercase font-black text-rose-500">Refund History & Administrative Audit Logs</h3>
            <p className="text-[10px] text-stone-400 font-semibold">Every action executed on disputes is digitally documented and irreversible</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleExportSpreadsheet("Excel")}
              className="p-1 px-3 border border-zinc-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold rounded-lg hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export Excel Sheet
            </button>
            <button 
              onClick={() => handleExportSpreadsheet("PDF")}
              className="p-1 px-3 border border-zinc-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[10px] font-bold rounded-lg hover:bg-white dark:hover:bg-slate-700 flex items-center gap-1 text-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-red-700" /> Export PDF Ledger
            </button>
          </div>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left font-serif text-slate-700 dark:text-slate-300">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/40 border-b dark:border-slate-800 text-[10px] uppercase font-mono font-bold text-stone-400">
                <th colSpan={1} className="p-2.5 pl-3">Audit Reference</th>
                <th colSpan={1} className="p-2.5">Refund ID</th>
                <th colSpan={1} className="p-2.5">Order</th>
                <th colSpan={1} className="p-2.5">Customer Name</th>
                <th colSpan={1} className="p-2.5">Action Executed</th>
                <th colSpan={1} className="p-2.5">Authorized By</th>
                <th colSpan={1} className="p-2.5">Audit Timestamp</th>
                <th colSpan={1} className="p-2.5">Detailed notes & logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-sans text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-2.5 pl-3 font-mono text-stone-500 dark:text-stone-400 font-bold">{log.id}</td>
                  <td className="p-2.5 font-mono text-stone-900 dark:text-stone-100 font-extrabold">{log.refundId}</td>
                  <td className="p-2.5 font-mono text-stone-400 dark:text-stone-500">{log.orderId}</td>
                  <td className="p-2.5 font-bold text-stone-800 dark:text-stone-200">{log.customerName}</td>
                  <td className="p-2.5">
                    <span className={`px-1.5 py-0.2 ml-0.5 rounded text-[9px] font-black uppercase ${
                      log.actionTaken === "Approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" :
                      log.actionTaken === "Rejected" ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}>
                      {log.actionTaken}
                    </span>
                  </td>
                  <td className="p-2.5 text-stone-600 dark:text-stone-300 font-semibold">{log.adminName}</td>
                  <td className="p-2.5 font-mono text-stone-400 dark:text-stone-500">{log.timestamp}</td>
                  <td className="p-2.5 text-stone-500 dark:text-stone-400 text-[10.5px] italic font-medium">{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION WORKSPACE MODAL: APPROVAL FLOW */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-[#000000]/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-slate-200 text-left w-full max-w-lg p-6 space-y-4 animate-fade-in shadow-xl">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-b pb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Settle Authorized Refund Apporval
            </h3>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs space-y-1.5 text-[11.5px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Refund Reference ID</span>
                <strong className="text-zinc-900 font-mono">{selectedRequest.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Order Token</span>
                <strong className="text-zinc-900 font-mono">{selectedRequest.orderId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Customer Beneficiary</span>
                <strong className="text-zinc-900 font-bold">{selectedRequest.userName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Checkout Amount paid</span>
                <span>₹{selectedRequest.orderAmount} ({selectedRequest.paymentMethod})</span>
              </div>
            </div>

            {/* Refund range selection */}
            <div className="space-y-2 text-xs">
              <label className="block font-extrabold text-stone-500 uppercase text-[10px]">Select Refund Scope Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setApproveRefundType("Full"); setApproveAmount(selectedRequest.amount); }}
                  className={`p-2 border rounded-xl font-bold uppercase text-[11px] ${
                    approveRefundType === "Full" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-55 hover:bg-slate-100"
                  }`}
                >
                  Full Refund (₹{selectedRequest.amount})
                </button>
                <button
                  type="button"
                  onClick={() => { setApproveRefundType("Partial"); }}
                  className={`p-2 border rounded-xl font-bold uppercase text-[11px] ${
                    approveRefundType === "Partial" ? "bg-emerald-700 text-white border-emerald-700" : "bg-slate-55 hover:bg-slate-100"
                  }`}
                >
                  Partial Refund
                </button>
              </div>

              {approveRefundType === "Partial" && (
                <div className="p-3 bg-stone-50 border rounded-xl space-y-1.5 animate-fade-in">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold text-stone-700">Adjust Partial Refund Amount:</span>
                    <strong className="font-mono text-[#E23744]">₹{approveAmount}</strong>
                  </div>
                  <input 
                    type="range"
                    min={10}
                    max={selectedRequest.amount}
                    step={10}
                    value={approveAmount}
                    onChange={(e) => setApproveAmount(Number(e.target.value))}
                    className="w-full accent-emerald-600" 
                  />
                  <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-zinc-400">Manual Amount entry:</span>
                    <input 
                      type="number"
                      max={selectedRequest.amount}
                      value={approveAmount}
                      onChange={(e) => setApproveAmount(Math.min(selectedRequest.amount, Number(e.target.value)))}
                      className="p-1 px-2 border w-20 text-[10px] rounded" 
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment Destination Override */}
            <div className="space-y-2 text-xs">
              <label className="block font-extrabold text-stone-500 uppercase text-[10px]">Refund Destination Pathway</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setApproveDestination("Wallet Credit")}
                  className={`p-2 border rounded-xl text-left text-[11px] font-bold ${
                    approveDestination === "Wallet Credit" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  ⚡ Wallet Credit (Instant)
                  <span className="block text-[9px] text-zinc-400 font-normal">Credits the customer Googly Pay wallet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApproveDestination("Original Payment Method")}
                  className={`p-2 border rounded-xl text-left text-[11px] font-bold ${
                    approveDestination === "Original Payment Method" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  💳 Original Method
                  <span className="block text-[9px] text-zinc-400 font-normal">Reverses card authorization (2-4 banking days)</span>
                </button>
              </div>
            </div>

            <p className="text-[10px] text-stone-400 leading-snug">
              Confirming this will debit the platform's escrow holding, credit {selectedRequest.userName}'s requested destination, auto-resolve the dispute, and dispatch the alert templates immediately.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
              <button 
                onClick={() => setShowApprovalModal(false)}
                className="p-2 px-4 rounded-xl border hover:bg-slate-50 cursor-pointer"
              >
                Cancel Action
              </button>
              <button 
                onClick={handleConfirmApproval}
                className="p-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
              >
                Confirm Refund Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION WORKSPACE MODAL: REJECTION FLOW */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-[#000000]/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1E1E24] rounded-2xl border border-slate-200 text-left w-full max-w-lg p-6 space-y-4 animate-fade-in shadow-xl">
            <h3 className="text-base font-black text-slate-900 dark:text-white border-b pb-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-700" /> Reject Refund Claim
            </h3>

            <div className="p-3 bg-red-50 text-red-900 rounded-xl text-xs space-y-1 text-[11.5px] border border-red-200">
              <span>This ends the consumer dispute record with status <strong>Rejected</strong>.</span>
              <p className="text-[10.5px]">Beneficiary Name: <strong>{selectedRequest.userName}</strong>. Claims claim size of ₹{selectedRequest.amount}.</p>
            </div>

            {/* Dropdown Options */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-[10px] font-extrabold text-stone-500 uppercase">Select Rejection Reason Clause</label>
              <select
                value={rejectionReasonCode}
                onChange={(e) => setRejectionReasonCode(e.target.value)}
                className="p-2 w-full bg-slate-50 border border-zinc-200 rounded-xl text-xs font-bold focus:ring-[#E23744]"
              >
                <option value="Insufficient Evidence">Insufficient Evidence (Unclear Photo/Incomplete Box)</option>
                <option value="Refund Policy Violation">Refund Policy Violation (Propertly sealed / hygiene checks)</option>
                <option value="Order Successfully Delivered">Order Successfully Delivered (Verified by Drop Photo & GPS logs)</option>
                <option value="Duplicate Refund Request">Duplicate Refund Request (Already compensated in ticket queue)</option>
                <option value="Outside Refund Window">Outside Refund Window (Limit &gt; 12 hours check)</option>
                <option value="Other">Other Reasons</option>
              </select>
            </div>

            {/* Custom Explanation to User */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-[10px] font-extrabold text-stone-500 uppercase">Auditor Custom explanation to User</label>
              <textarea 
                rows={4}
                required
                value={customRejectionText}
                onChange={(e) => setCustomRejectionText(e.target.value)}
                className="p-2 w-full border text-xs focus:ring-[#E23744]"
                placeholder="Give a professional, humble explanation..."
              />
            </div>

            <p className="text-[10px] text-stone-400">
              Once rejected, the claim status is instantly logged as Declined, and the customer notification preview will be generated to reflect these exact rejection clauses.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t text-xs font-bold">
              <button 
                onClick={() => setShowRejectionModal(false)}
                className="p-2 px-4 rounded-xl border hover:bg-slate-50 cursor-pointer"
              >
                Cancel Action
              </button>
              <button 
                onClick={handleConfirmRejection}
                className="p-2 px-5 bg-red-700 hover:bg-red-800 text-white rounded-xl cursor-pointer"
              >
                Confirm Decline & Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
