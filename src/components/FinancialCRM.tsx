/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, SupportTicket, RefundRequest, StaffMember, TaxSettings, Order } from "../types";
import { 
  Users, MessageSquare, Ticket, Percent, DollarSign, Scale, 
  HelpCircle, Check, Shield, Search, Lock, Plus, Trash2, 
  ArrowUpRight, AlertTriangle, AlertCircle, FileText, Send, X, RefreshCw 
} from "lucide-react";
import UserManagementModule from "./UserManagementModule";
import CustomerSupportCRM from "./CustomerSupportCRM";
import PayoutsManagementCRM from "./PayoutsManagementCRM";
import RefundManagementCRM from "./RefundManagementCRM";
import TaxAndInvoiceDashboard from "./TaxAndInvoiceDashboard";
import RbacSettingsDashboard from "./RbacSettingsDashboard";

interface FinancialCRMProps {
  currentTab: string;
  users: User[];
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<any>;
  orders: Order[];
  tickets: SupportTicket[];
  addTicket: (item: Omit<SupportTicket, 'id'>) => Promise<any>;
  updateTicket: (id: string, updates: Partial<SupportTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  refunds: RefundRequest[];
  setRefunds: React.Dispatch<React.SetStateAction<RefundRequest[]>>;
  addRefund: (item: Omit<RefundRequest, 'id'>) => Promise<any>;
  updateRefund: (id: string, updates: Partial<RefundRequest>) => Promise<void>;
  deleteRefund: (id: string) => Promise<void>;
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  addStaff: (item: Omit<StaffMember, 'id'>) => Promise<any>;
  updateStaff: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  setTickets: React.Dispatch<React.SetStateAction<SupportTicket[]>>;
  taxSettings: TaxSettings;
  setTaxSettings: React.Dispatch<React.SetStateAction<TaxSettings>>;
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function FinancialCRM({
  currentTab,
  users,
  updateUser,
  deleteUser,
  addUser,
  orders,
  tickets,
  addTicket,
  updateTicket,
  deleteTicket,
  refunds,
  setRefunds,
  addRefund,
  updateRefund,
  deleteRefund,
  staff,
  setStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  setTickets,
  taxSettings,
  setTaxSettings,
  triggerToast
}: FinancialCRMProps) {

  // --- User Management State ---
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addWalletUser, setAddWalletUser] = useState<User | null>(null);
  const [addWalletAmount, setAddWalletAmount] = useState<number>(0);
  const [addWalletReason, setAddWalletReason] = useState("Corporate loyalty compensation");
  const [userQuery, setUserQuery] = useState("");

  // --- Payout State ---
  const [globalCommission, setGlobalCommission] = useState(18);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // --- Refund Queue State ---
  const [rejectRefundItem, setRejectRefundItem] = useState<RefundRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // --- Tax/Invoice State ---
  const [gstField, setGstField] = useState(taxSettings.gstPercent);
  const [deliveryTaxField, setDeliveryTaxField] = useState(taxSettings.deliveryTaxPercent);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  // --- RBAC Staff Member state ---
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: "", email: "", role: "Sub-Admin" as StaffMember["role"]
  });

  // --- Core Handlers ---

  // Add wallet balance to user
  const handleAddWalletBalance = async () => {
    if (!addWalletUser) return;
    await updateUser(addWalletUser.id, { walletBalance: addWalletUser.walletBalance + addWalletAmount });
    triggerToast("Wallet Credited", `Added ₹${addWalletAmount} to ${addWalletUser.name}'s wallet. Reason: ${addWalletReason}`, "success");
    setAddWalletUser(null);
    setAddWalletAmount(0);
    setAddWalletReason("Corporate loyalty compensation");
  };

  // Toggle blocking state on users
  const toggleUserBlock = async (user: User) => {
    const nextStatus = user.status === "Active" ? "Blocked" as const : "Active" as const;
    await updateUser(user.id, { status: nextStatus });
    triggerToast("User Status Swapped", `${user.name} is now ${nextStatus}`, "info");
  };

  // Refund approvals/rejections
  const handleApproveRefund = (ref: RefundRequest) => {
    setRefunds(prev => prev.map(r => r.id === ref.id ? { ...r, status: "Approved" } : r));
    triggerToast("Refund Safe-approved", `₹${ref.amount} credited back to user bank nodes.`, "success");
  };

  const executeRejectRefund = () => {
    if (!rejectRefundItem) return;
    setRefunds(prev => prev.map(r => r.id === rejectRefundItem.id ? { ...r, status: "Rejected" as const, rejectReason } : r));
    triggerToast("Refund Declined", `Refund request ${rejectRefundItem.id} marked as Rejected. Reason: ${rejectReason}`, "error");
    setRejectRefundItem(null);
    setRejectReason("");
  };

  // Update Tax configs
  const handleSaveTaxes = () => {
    setTaxSettings({
      gstPercent: Number(gstField),
      serviceTaxPercent: 2.5,
      deliveryTaxPercent: Number(deliveryTaxField)
    });
    triggerToast("Tax configuration modified", "New parameters applied onto downstream checkout invoicing pipelines.", "success");
  };

  // Toggle staff permissions
  const togglePermission = (staffId: string, permName: keyof StaffMember["permissions"]) => {
    setStaff(prev => prev.map(st => {
      if (st.id === staffId) {
        const nextPerms = { ...st.permissions, [permName]: !st.permissions[permName] };
        return { ...st, permissions: nextPerms };
      }
      return st;
    }));
    triggerToast("Permissions Updated", "Staff security profiles updated immediately.", "success");
  };

  // Add staff trigger
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaffForm.name || "Operations Representative",
      email: newStaffForm.email || "ops@googly.in",
      role: newStaffForm.role,
      permissions: {
        dashboard: true,
        orders: newStaffForm.role === "Operations Manager" || newStaffForm.role === "Sub-Admin",
        restaurants: newStaffForm.role === "Operations Manager" || newStaffForm.role === "Sub-Admin",
        riders: true,
        pricing: newStaffForm.role === "Operations Manager" || newStaffForm.role === "Sub-Admin",
        crm: newStaffForm.role === "Support Specialist" || newStaffForm.role === "Sub-Admin",
        finances: newStaffForm.role === "Financial Auditor" || newStaffForm.role === "Sub-Admin",
        settings: newStaffForm.role === "Sub-Admin"
      },
      active: true
    };

    setStaff(prev => [...prev, cleanStaff]);
    setShowAddStaffModal(false);
    setNewStaffForm({ name: "", email: "", role: "Sub-Admin" });
    triggerToast("Staff Member Appointed", `${cleanStaff.name} has been given role credentials!`, "success");
  };

  return (
    <div id="financial-crm" className="space-y-6">

      {/* --- FEATURE 6: USER (CUSTOMER) MANAGEMENT --- */}
      {currentTab === "users" && (
        <UserManagementModule
          users={users}
          updateUser={updateUser}
          deleteUser={deleteUser}
          addUser={addUser}
          orders={orders}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 11: CUSTOMER SUPPORT (CRM / TICKETING) --- */}
      {currentTab === "crm" && (
        <CustomerSupportCRM
          tickets={tickets}
          setTickets={setTickets}
          users={users}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 12: PAYOUTS & COMMISSION MANAGEMENT --- */}
      {currentTab === "payouts" && (
        <PayoutsManagementCRM triggerToast={triggerToast} />
      )}

      {/* --- FEATURE 13: REFUND MANAGEMENT --- */}
      {currentTab === "refunds" && (
        <RefundManagementCRM
          refunds={refunds}
          setRefunds={setRefunds}
          orders={orders}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 20: TAX & INVOICE SETTINGS --- */}
      {currentTab === "tax" && (
        <TaxAndInvoiceDashboard
          initialTaxGst={taxSettings.gstPercent}
          initialTaxDelivery={taxSettings.deliveryTaxPercent}
          onSaveSettings={(gst, delivery) => {
            setTaxSettings({
              gstPercent: gst,
              serviceTaxPercent: 2.5,
              deliveryTaxPercent: delivery
            });
            setGstField(gst);
            setDeliveryTaxField(delivery);
          }}
          triggerToast={triggerToast}
        />
      )}

      {/* --- FEATURE 21: ROLE-BASED ACCESS CONTROL (RBAC) --- */}
      {currentTab === "rbac" && (
        <RbacSettingsDashboard triggerToast={triggerToast} />
      )}

      {/* --- PAYOUT BATCH BANK CONFIRMATION MODAL --- */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <h3 className="text-sm font-bold text-gray-900">Initiate Corporate Batch Payment Settlement?</h3>
            <p className="text-xs text-gray-400">This operates bank handshakes on outstanding vendor totals for current routing accounts.</p>
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between font-bold text-gray-600">
                <span>Total Restaurant payouts (2 partners):</span>
                <span>₹6,070</span>
              </div>
              <div className="flex justify-between font-bold text-gray-600">
                <span>Total Delivery fleet payouts (2 riders):</span>
                <span>₹1,670</span>
              </div>
              <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-dashed border-gray-200">
                <span>Sum Settlement Batch:</span>
                <span className="text-emerald-600">₹7,740</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowPayoutModal(false)} 
                className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg text-xs"
              >
                Dismiss
              </button>
              <button 
                id="confirm-settle-payouts"
                onClick={() => {
                  triggerToast("Batch transfers success", "Settle logs processed. Ledger reset for the next cycle.", "success");
                  setShowPayoutModal(false);
                }} 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
              >
                Transfers Authenticate & Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REFUND REJECTION MANDATORY SPECIFICATION MODAL --- */}
      {rejectRefundItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Decline processing dispute: {rejectRefundItem.id}</h3>
            <p className="text-xs text-gray-400">Specifying corporate reasons for refund rejection is required prior to denial triggers.</p>
            <div>
              <label className="block text-xs text-gray-500 font-semibold mb-1">Rejection Reason Code *</label>
              <input
                id="reject-reason-input"
                type="text"
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Items fully delivered according to courier GPS trail."
                className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-[#E23744]"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setRejectRefundItem(null)} 
                className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg text-xs"
              >
                Dismiss
              </button>
              <button 
                id="confirm-reject-refund"
                disabled={!rejectReason}
                onClick={executeRejectRefund} 
                className="px-3.5 py-1.5 bg-red-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs"
              >
                Save Denial Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD NEW STAFF CREDENTIALS MODAL --- */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <h3 className="text-sm font-bold text-gray-900">Appoint Administrator Staff</h3>
              <button onClick={() => setShowAddStaffModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 font-bold mb-1">Staff Member Full Name *</label>
                <input
                  id="staff-name-input"
                  type="text"
                  required
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  placeholder="e.g. Partha Sarthi Bose"
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-[#E23744]"
                />
              </div>

              <div>
                <label className="block text-[#1C1C1C] text-xs font-semibold mb-1">Assigned Corporate Role</label>
                <select
                  required
                  value={newStaffForm.role}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value as StaffMember["role"] })}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs bg-white focus:ring-[#E23744]"
                >
                  <option value="Sub-Admin">Sub-Admin (Master permissions)</option>
                  <option value="Support Specialist">Support Specialist (Inbound tickets only)</option>
                  <option value="Operations Manager">Operations Manager (Vendors & Fleet control)</option>
                  <option value="Financial Auditor">Financial Auditor (Payouts, Ledger & Refunds)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 font-bold mb-1">Work Email Inbox *</label>
                <input
                  id="staff-email-input"
                  type="email"
                  required
                  value={newStaffForm.email}
                  placeholder="partha@googlydelivery.in"
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-[#E23744]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 bg-gray-100 font-bold text-gray-600 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E23744] text-white font-bold rounded-lg text-xs hover:bg-red-600"
                >
                  Confirm Appoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SHOW INVOICE PREVIEW POPUP --- */}
      {showInvoicePreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-2xl relative space-y-4">
            <button 
              onClick={() => setShowInvoicePreview(false)}
              className="absolute right-4 top-4 p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center font-mono space-y-1">
              <div className="font-extrabold text-lg text-gray-800 tracking-wider">GOOGLY CO. DELIVERIES</div>
              <div className="text-[10px] text-gray-400">GST Registration No: 19AAACG0921M1Z1</div>
              <div className="text-xs font-bold pt-2 border-b border-gray-200 pb-2">PREVIEW CUSTOMER TRANSACTION INVOICE</div>
            </div>

            <div className="font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span>Invoice Node:</span>
                <span>INV-34220</span>
              </div>
              <div className="flex justify-between">
                <span>Date stamp:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Bill To:</span>
                <span>Rohan Purkayastha</span>
              </div>
              
              <div className="border-t border-b border-dashed border-gray-200 py-2 space-y-1">
                <div className="flex justify-between">
                  <span>1x Royal Mutton Biryani</span>
                  <span>₹380.00</span>
                </div>
                <div className="flex justify-between">
                  <span>1x Double Cheese Margherita Pizza</span>
                  <span>₹320.00</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal sum:</span>
                  <span>₹700.00</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({gstField}%):</span>
                  <span>₹{(700 * gstField / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span>₹40.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Downstream Tax ({deliveryTaxField}%):</span>
                  <span>₹{(40 * deliveryTaxField / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm border-t border-dashed border-gray-200 pt-2 text-gray-800">
                  <span>Total sum in receipt:</span>
                  <span>₹{(740 + (700 * gstField / 105) + (40 * deliveryTaxField / 100)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100 text-[10px] text-center text-amber-800 font-semibold italic">
              This represents a dynamic invoice generated by tax settings. Click the close button top.
            </div>
          </div>
        </div>
      )}

      {/* --- ADD WALLET BALANCE TO CUSTOMERS DIRECTIVE DIALOG --- */}
      {addWalletUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Add Wallet Balance to: {addWalletUser.name}</h3>
            <p className="text-xs text-gray-400">This balance is immediately usable for checking out on customer downstreams.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 font-bold mb-1">Sum to Add (INR) *</label>
                <input
                  id="user-wallet-amount"
                  type="number"
                  required
                  value={addWalletAmount || ""}
                  onChange={(e) => setAddWalletAmount(Number(e.target.value))}
                  placeholder="e.g. 250"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-[#E23744]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 font-semibold mb-1">Corporate Reason for allocation *</label>
                <input
                  id="user-wallet-reason"
                  type="text"
                  required
                  value={addWalletReason}
                  onChange={(e) => setAddWalletReason(e.target.value)}
                  placeholder="Reimbursement, coupon compensation..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-xs focus:ring-[#E23744]"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setAddWalletUser(null)} 
                className="px-3.5 py-1.5 bg-gray-100 text-gray-600 font-bold rounded-lg text-xs hover:bg-gray-200 cursor-pointer"
              >
                Dismiss
              </button>
              <button 
                id="execute-user-wallet-add"
                disabled={!addWalletAmount}
                onClick={handleAddWalletBalance} 
                className="px-3.5 py-1.5 bg-[#E23744] hover:bg-red-600 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Credit Wallet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
