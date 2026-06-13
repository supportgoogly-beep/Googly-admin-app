import React, { useState, useMemo, useEffect } from "react";
import { 
  Star, Search, ArrowUpRight, ShieldCheck, ShieldAlert, Sliders, 
  Trash2, Mail, ExternalLink, Filter, HelpCircle, User, 
  MessageSquare, AlertCircle, Sparkles, CheckCircle, Clock, 
  ChevronRight, ArrowDownLeft, Send, EyeOff, X, Eye, 
  Reply, MoreVertical, FileDown, TrendingUp, ThumbsUp, ThumbsDown, 
  Flag, Archive, RefreshCw, Layers, Award, ShieldBan
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, Legend, Cell 
} from "recharts";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { ReviewRating, Restaurant, Rider } from "../types";

// Extended interactive status parameters for reviews inside the dashboard UI state
interface EnhancedReview extends ReviewRating {
  orderId: string;
  orderDate: string;
  reviewTitle: string;
  customerAvatar?: string;
  customerVerifiedBadge: boolean;
  attachedImages: string[];
  attachedVideos: string[];
  
  // Rating breakdown details
  foodQualityRating: number;
  packagingRating: number;
  deliverySpeedRating: number;
  accuracyRating: number;
  
  riderProfRating: number;
  riderTimeRating: number;
  riderCommRating: number;
  riderFriendlyRating: number;

  // AI Moderation parameters
  sentiment: "Positive" | "Neutral" | "Negative";
  toxicScore: number; // 0 to 100
  isSpam: boolean;
  isFake: boolean;
  aiRecommendation: string;

  // Moderation and Response Management
  moderationStatus: "Published" | "Hidden" | "Flagged" | "Pending Progress";
  moderationReasonCode?: string;
  moderatorNotes?: string;
  replies: Array<{
    id: string;
    author: string;
    role: "admin" | "restaurant" | "system";
    text: string;
    date: string;
  }>;
}

// Audit record structure
interface ModerationAuditLog {
  id: string;
  reviewId: string;
  actionTaken: string;
  moderatorName: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  dateTime: string;
}

interface ReviewsManagementSystemProps {
  reviews: ReviewRating[];
  setReviews: React.Dispatch<React.SetStateAction<ReviewRating[]>>;
  restaurants?: Restaurant[];
  riders?: Rider[];
  triggerToast: (title: string, message: string, type: "success" | "error" | "info") => void;
}

export default function ReviewsManagementSystem({
  reviews,
  setReviews,
  restaurants = [],
  riders = [],
  triggerToast
}: ReviewsManagementSystemProps) {
  
  // ----------------------------------------------------
  // Local Enhancements State & State Alignment
  // ----------------------------------------------------
  const [enhancedReviews, setEnhancedReviews] = useState<EnhancedReview[]>([]);

  // Initialize enhanced properties once on mount or when parent reviews change
  useEffect(() => {
    // To protect parent schema but support detailed analytics, map every review into an Extended SaaS format
    const initialEnhanced = reviews.map((r, index) => {
      // Seed deterministic variations based on ID or index
      const seedVal = parseInt(r.id.replace(/\D/g, "") || "3") + index;
      const isRider = r.targetType === "rider";
      const rating = r.rating;

      // Deterministic ratings detail
      const starOffset = rating >= 4 ? 0 : rating <= 2 ? -1.5 : -0.5;
      const foodScore = Math.min(5, Math.max(1, Math.round(rating + starOffset + (seedVal % 2 ? 0.5 : 0))));
      const wrapScore = Math.min(5, Math.max(1, Math.round(rating + starOffset - (seedVal % 3 ? 0.3 : 0))));
      const deliveryScore = Math.min(5, Math.max(1, Math.round(rating + starOffset + (seedVal % 4 ? 0.2 : 0))));
      const accuracyScore = Math.min(5, Math.max(1, Math.round(rating + starOffset)));

      const riderProf = Math.min(5, Math.max(1, Math.round(rating + starOffset + (seedVal % 2 ? 0.4 : 0))));
      const riderTime = Math.min(5, Math.max(1, Math.round(rating + starOffset - (seedVal % 3 ? 0.2 : 0))));
      const riderComm = Math.min(5, Math.max(1, Math.round(rating + starOffset + (seedVal % 4 ? 0.5 : 0))));
      const riderFriend = Math.min(5, Math.max(1, Math.round(rating + starOffset)));

      // Sentiment
      let parsedSentiment: "Positive" | "Neutral" | "Negative" = "Positive";
      if (rating <= 2) parsedSentiment = "Negative";
      else if (rating === 3) parsedSentiment = "Neutral";

      const isSpamCheck = seedVal % 11 === 0;
      const isFakeCheck = seedVal % 13 === 0;
      const isToxicCheck = rating === 1 && seedVal % 2 === 0;
      const calculatedToxic = isToxicCheck ? Math.round(75 + (seedVal % 20)) : Math.round(2 + (seedVal % 8));

      // Preset attached visual assets
      const samplePhotos = [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=350&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=350&auto=format&fit=crop"
      ];
      const hasImages = rating >= 4 && seedVal % 3 === 0;

      const reviewTitles = [
        "Absolutely Exceptional!",
        "Could be improved speed-wise",
        "Very poor packaging experience",
        "Tasty meals, rider friendly",
        "Decent fallback options",
        "Simply superb taste",
        "Worst experience ever!",
      ];

      return {
        ...r,
        orderId: `ODR-1026-${8890 + seedVal}`,
        orderDate: "2026-06-11",
        reviewTitle: reviewTitles[seedVal % reviewTitles.length],
        customerAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
        customerVerifiedBadge: r.rating >= 2, // verified genuine tag
        attachedImages: hasImages ? [samplePhotos[seedVal % samplePhotos.length]] : [],
        attachedVideos: [],
        
        foodQualityRating: foodScore,
        packagingRating: wrapScore,
        deliverySpeedRating: deliveryScore,
        accuracyRating: accuracyScore,
        
        riderProfRating: riderProf,
        riderTimeRating: riderTime,
        riderCommRating: riderComm,
        riderFriendlyRating: riderFriend,

        sentiment: parsedSentiment,
        toxicScore: calculatedToxic,
        isSpam: isSpamCheck,
        isFake: isFakeCheck,
        aiRecommendation: isToxicCheck 
          ? "⚠️ Flag for Abusive content check." 
          : isSpamCheck 
            ? "⚠️ High structural match with spam trends." 
            : "✓ Auto-approved: Meets safe community standards.",

        moderationStatus: r.hidden ? "Hidden" : r.rating === 1 ? "Pending Progress" : "Published",
        replies: seedVal % 3 === 0 ? [
          {
            id: `rep-${seedVal}-1`,
            author: "Googly Support Head",
            role: "admin",
            text: "Thank you for the detailed feedback. We are sharing these scores with our training team directly.",
            date: "24 hours ago"
          }
        ] : []
      };
    });

    setEnhancedReviews(initialEnhanced);
  }, [reviews]);

  // ----------------------------------------------------
  // States & Filter Configuration
  // ----------------------------------------------------
  const [selectedRange, setSelectedRange] = useState<"Today" | "Last 7 Days" | "Last 30 Days" | "Custom">("Last 30 Days");
  const [starFilter, setStarFilter] = useState<string>("All"); // "All", "5", "4", "3", "2", "1"
  const [typeFilter, setTypeFilter] = useState<string>("All"); // "All", "Restaurant Reviews", "Rider Reviews", "Customer Experience Reviews"
  const [statusFilter, setStatusFilter] = useState<string>("All"); // "All", "Published", "Hidden", "Flagged", "Pending Progress"
  const [restaurantSelection, setRestaurantSelection] = useState<string>("All");
  const [riderSelection, setRiderSelection] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModTab, setActiveModTab] = useState<"All" | "Pending Queue" | "Negative Alerts" | "AI Flags">("All");

  // Moderation Hide Modal state
  const [showHideModal, setShowHideModal] = useState(false);
  const [activeHideReview, setActiveHideReview] = useState<EnhancedReview | null>(null);
  const [moderationReason, setModerationReason] = useState("Irrelevant Content");
  const [moderatorNoteText, setModeratorNoteText] = useState("");

  // Reply Draft States
  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyDraftRole, setReplyDraftRole] = useState<"admin" | "restaurant">("admin");
  const [replyDraftText, setReplyDraftText] = useState("");

  // Dynamic Suggestive AI Replies presets
  const aiSuggestedAnswers = {
    positive: [
      "Thank you so much! We are thrilled that you loved the food and prompt service. Looking forward to serving you again!",
      "Spectacular support feedback like yours motivates our entire cooking crew and fleet partners. Cheers from team Googly!",
    ],
    neutral: [
      "Thank you for sharing your thoughts. We regret that the taste/delivery speed wasn't exactly perfect, but we are optimizing this corridor.",
      "We appreciate your notes on the packaging. We will share these observations back with our regional delivery dispatcher.",
    ],
    negative: [
      "We sincerely apologize for this distressing experience. Your order did not meet our standard. Please connect with our support line OD-102 so we can credit a refund.",
      "This is definitely not the standard we strive for. We are flagging this outlet's kitchen and the delivery team to audit the delay.",
    ]
  };

  // Detailed local state audit logs
  const [auditLogs, setAuditLogs] = useState<ModerationAuditLog[]>([
    {
      id: "LOG-5521",
      reviewId: "rev-3",
      actionTaken: "Hide Review",
      moderatorName: "Sarah Connor (Operations Lead)",
      previousStatus: "Published",
      newStatus: "Hidden",
      reason: "Abusive Language",
      dateTime: "2026-06-12 05:40 AM"
    },
    {
      id: "LOG-5519",
      reviewId: "rev-5",
      actionTaken: "Flag Resolved",
      moderatorName: "David Roy (SLA Auditor)",
      previousStatus: "Flagged",
      newStatus: "Published",
      reason: "Irrelevant Content - Re-reviewed and cleared",
      dateTime: "2026-06-12 04:12 AM"
    }
  ]);

  // ----------------------------------------------------
  // Computations & Filter Logic
  // ----------------------------------------------------
  const filteredReviews = useMemo(() => {
    return enhancedReviews.filter(r => {
      // 1. Star Rating match
      if (starFilter !== "All" && r.rating !== parseInt(starFilter)) return false;

      // 2. Type Filter match
      if (typeFilter === "Restaurant Reviews" && r.targetType !== "restaurant") return false;
      if (typeFilter === "Rider Reviews" && r.targetType !== "rider") return false;

      // 3. Status Filter Match
      if (statusFilter === "Published" && r.moderationStatus !== "Published") return false;
      if (statusFilter === "Hidden" && r.moderationStatus !== "Hidden") return false;
      if (statusFilter === "Flagged" && r.toxicScore < 40) return false; // Simulated threshold flag
      if (statusFilter === "Pending Progress" && r.moderationStatus !== "Pending Progress") return false;

      // 4. Restaurant selection match
      if (restaurantSelection !== "All" && r.targetType === "restaurant" && r.targetName !== restaurantSelection) return false;

      // 5. Rider selection match
      if (riderSelection !== "All" && r.targetType === "rider" && r.targetName !== riderSelection) return false;

      // 6. Global Search
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const bodyContent = (r.comment || "").toLowerCase();
        const author = (r.userName || "").toLowerCase();
        const target = (r.targetName || "").toLowerCase();
        const idStr = (r.id || "").toLowerCase();
        const orderIdStr = (r.orderId || "").toLowerCase();
        if (!bodyContent.includes(query) && !author.includes(query) && !target.includes(query) && !idStr.includes(query) && !orderIdStr.includes(query)) {
          return false;
        }
      }

      // 7. Mod Queue Quick Sub-Tabs
      if (activeModTab === "Pending Queue" && r.rating <= 2 && r.moderationStatus !== "Hidden") return true; 
      if (activeModTab === "Negative Alerts" && r.rating <= 2) return true;
      if (activeModTab === "AI Flags" && (r.toxicScore > 35 || r.isSpam || r.isFake)) return true;

      return true;
    });
  }, [enhancedReviews, starFilter, typeFilter, statusFilter, restaurantSelection, riderSelection, searchQuery, activeModTab]);

  // Dynamic calculations for the Dashboard Overview Summary metrics
  const summaryMetrics = useMemo(() => {
    const total = enhancedReviews.length;
    
    // Average rating
    const sumRatings = enhancedReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = total > 0 ? (sumRatings / total).toFixed(2) : "0.00";

    const restReviewsCount = enhancedReviews.filter(r => r.targetType === "restaurant").length;
    const riderReviewsCount = enhancedReviews.filter(r => r.targetType === "rider").length;
    const hiddenCount = enhancedReviews.filter(r => r.moderationStatus === "Hidden").length;
    const pendingCount = enhancedReviews.filter(r => r.rating <= 2 && r.moderationStatus !== "Hidden").length;
    const positiveCount = enhancedReviews.filter(r => r.rating >= 4).length;
    const negativeCount = enhancedReviews.filter(r => r.rating <= 2).length;

    return {
      total,
      avg,
      restReviewsCount,
      riderReviewsCount,
      hiddenCount,
      pendingCount,
      positiveCount,
      negativeCount
    };
  }, [enhancedReviews]);

  // ----------------------------------------------------
  // Action Handlers
  // ----------------------------------------------------
  const handleTriggerHideReviewFlow = (rev: EnhancedReview) => {
    setActiveHideReview(rev);
    setModerationReason("Abusive Language");
    setModeratorNoteText("");
    setShowHideModal(true);
  };

  const handleConfirmHideReview = () => {
    if (!activeHideReview) return;

    // Mutate state locally
    setEnhancedReviews(prev => prev.map(r => {
      if (r.id === activeHideReview.id) {
        return {
          ...r,
          moderationStatus: "Hidden",
          comment: `[Hidden by Moderation team on ${new Date().toISOString().substring(0, 10)}]`, // Text hidden but keeps rating
          moderationReasonCode: moderationReason,
          moderatorNotes: moderatorNoteText
        };
      }
      return r;
    }));

    // Update parent list to align database settings sync
    setReviews(prev => prev.map(r => r.id === activeHideReview.id ? { ...r, hidden: true } : r));

    // Append to audit logs
    const newAuditLog: ModerationAuditLog = {
      id: `LOG-${Math.round(5000 + Math.random() * 4999)}`,
      reviewId: activeHideReview.id,
      actionTaken: "Hide Review Text",
      moderatorName: "Corporate Moderator (Live Session)",
      previousStatus: activeHideReview.moderationStatus,
      newStatus: "Hidden",
      reason: `${moderationReason} Notes: ${moderatorNoteText || "N/A"}`,
      dateTime: "Just Now"
    };
    setAuditLogs(prev => [newAuditLog, ...prev]);

    setShowHideModal(false);
    setActiveHideReview(null);
    triggerToast("Comment Terminated", "Customer text locked. Rating index is preserved calculation-side.", "success");
  };

  const handleUnhideReview = (rev: EnhancedReview) => {
    setEnhancedReviews(prev => prev.map(r => {
      if (r.id === rev.id) {
        return {
          ...r,
          moderationStatus: "Published",
          comment: "Decent delivery, polite fleet partner recommended! Best experience again.", // Restore a placeholder
        };
      }
      return r;
    }));

    setReviews(prev => prev.map(r => r.id === rev.id ? { ...r, hidden: false } : r));

    // Audit action
    const newAuditLog: ModerationAuditLog = {
      id: `LOG-${Math.round(5000 + Math.random() * 4999)}`,
      reviewId: rev.id,
      actionTaken: "Unhide Review Text",
      moderatorName: "Corporate Moderator (Live Session)",
      previousStatus: "Hidden",
      newStatus: "Published",
      reason: "Restored to public visibility feed.",
      dateTime: "Just Now"
    };
    setAuditLogs(prev => [newAuditLog, ...prev]);

    triggerToast("Review Restored", "Visibility index reassigned. Public timeline showing values now.", "info");
  };

  const handleResolveFlag = (rev: EnhancedReview) => {
    setEnhancedReviews(prev => prev.map(r => r.id === rev.id ? { ...r, toxicScore: 0, moderationStatus: "Published" } : r));
    triggerToast("Flag Resolved", `Operational alerts cleared for review: ${rev.id}`, "success");
  };

  const handleSaveReply = (reviewId: string) => {
    if (!replyDraftText.trim()) {
      triggerToast("Entry Empty", "Please input response message first.", "error");
      return;
    }

    setEnhancedReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const newReply = {
          id: `rep-manual-${Date.now()}`,
          author: replyDraftRole === "admin" ? "Corporate Support Partner" : `${r.targetName} Manager`,
          role: replyDraftRole,
          text: replyDraftText,
          date: "Just Now"
        };
        return {
          ...r,
          replies: [...r.replies, newReply]
        };
      }
      return r;
    }));

    setReplyReviewId(null);
    setReplyDraftText("");
    triggerToast("Reply Published", "Response registered in feed and broadcast to consumer endpoints.", "success");
  };

  const handleDeleteReply = (reviewId: string, replyId: string) => {
    setEnhancedReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          replies: r.replies.filter(rep => rep.id !== replyId)
        };
      }
      return r;
    }));
    triggerToast("Reply Deleted", "The specific response has been removed from public index.", "info");
  };

  // Preset chart simulation datasets
  const ratingTrendData = [
    { label: "Jun 06", avgRating: 4.1, reviews: 12 },
    { label: "Jun 07", avgRating: 4.15, reviews: 18 },
    { label: "Jun 08", avgRating: 4.25, reviews: 15 },
    { label: "Jun 09", avgRating: 4.05, reviews: 26 },
    { label: "Jun 10", avgRating: 4.35, reviews: 19 },
    { label: "Jun 11", avgRating: 4.41, reviews: 31 },
    { label: "Jun 12", avgRating: 4.45, reviews: 22 }
  ];

  const sentimentData = [
    { name: "Positive Sentiment Score", value: 72, fill: "#10b981" },
    { name: "Neutral Feedback Ratio", value: 16, fill: "#f59e0b" },
    { name: "Negative Alerts", value: 12, fill: "#ef4444" }
  ];

  const cSatisfactionRating = 88.5; // Overall CSAT score

  // ----------------------------------------------------
  // UI Rendering Core
  // ----------------------------------------------------
  return (
    <div className="space-y-6" id="reviews-management-dashboard-viewport">
      
      {/* ----------------- SUB HEADER ACTION ROW ----------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-stone-100 shadow-sm gap-4">
        <div>
          <span className="text-[10px] bg-[#E23744]/10 text-[#E23744] font-black px-2.5 py-1 rounded-full uppercase tracking-widest block mb-1">Moderation Command</span>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
             Reviews & Ratings Management
          </h1>
          <p className="text-xs text-stone-500 max-w-xl">
            Audit sentiment compliance, verify original dining metrics, execute regulatory masks, and generate strategic AI replies across restaurants, riders, and service lines.
          </p>
        </div>

        {/* Global Action items */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="gfs-reviews-analyis-btn"
            onClick={() => {
              triggerToast("AI Analysis Suite Running", "Parsing semantic compliance logs and spam scores. Safe standards validated for 48 incoming reviews.", "info");
            }}
            className="p-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" /> AI Analysis
          </button>

          <button
            id="gfs-reviews-reports-download"
            onClick={() => {
              triggerToast("Feedback Reports Assembled", "Your PDF rating delivery ledger is compiled and saved safely in downloads.", "success");
            }}
            className="p-2 px-3 bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border border-stone-800"
          >
            <FileDown className="w-4 h-4" /> Reports
          </button>

          <button
            id="gfs-reviews-logs-export"
            onClick={() => {
              triggerToast("Export Configured", "Master spreadsheet export including 58 reviews has been triggered.", "success");
            }}
            className="p-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* ----------------- DASHBOARD SUMMARY KPI BLOCKS ----------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="reviews-overview-kpis">
        
        {/* Total Reviews Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-100 shadow-xs flex justify-between items-start space-y-1">
          <div>
            <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider block">Total Reviews</span>
            <span className="text-2xl font-black text-stone-900 block font-mono">
              {summaryMetrics.total}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold pt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% today</span>
            </div>
          </div>
          <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Average Rating Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-100 shadow-xs flex justify-between items-start space-y-1">
          <div>
            <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider block">Average Rating</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-stone-900 font-mono">
                {summaryMetrics.avg}
              </span>
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <Star 
                    key={s} 
                    className={`w-3.5 h-3.5 ${s <= Math.round(parseFloat(summaryMetrics.avg)) ? "text-amber-400 fill-amber-400" : "text-stone-200"}`} 
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] text-zinc-400 block pt-1.5">Goal average minimum 4.2</span>
          </div>
          <div className="p-2 bg-amber-50 rounded-xl text-amber-500">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
        </div>

        {/* Positive Sentiment CSAT Card */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-100 shadow-xs flex justify-between items-start space-y-1">
          <div>
            <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider block">Positive Sentiment</span>
            <span className="text-2xl font-black text-emerald-600 block font-mono">
              {summaryMetrics.positiveCount} <span className="text-xs text-stone-400">({Math.round((summaryMetrics.positiveCount / (summaryMetrics.total || 1)) * 100)}%)</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] text-stone-400 pt-1">
              <span>Verified genuine users</span>
            </div>
          </div>
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Moderation Pending Flags */}
        <div className="bg-white p-4.5 rounded-2xl border border-stone-100 shadow-xs flex justify-between items-start space-y-1">
          <div>
            <span className="text-stone-400 text-[10px] font-black uppercase tracking-wider block">Moderation Pending</span>
            <span className={`text-2xl font-black block font-mono ${summaryMetrics.pendingCount > 0 ? "text-rose-600 animate-pulse" : "text-stone-900"}`}>
              {summaryMetrics.pendingCount}
            </span>
            <span className="text-[10px] text-zinc-400 block pt-1.5">
              🛡️ {summaryMetrics.hiddenCount} Hidden logs stored
            </span>
          </div>
          <div className={`p-2 rounded-xl ${summaryMetrics.pendingCount > 0 ? "bg-amber-50 text-amber-600" : "bg-stone-50 text-stone-400"}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ----------------- COMPREHENSIVE FILTER ENGINE ROW ----------------- */}
      <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-xs space-y-4" id="reviews-filters-control-panel">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#E23744]" />
            <span className="text-xs font-black text-stone-900 uppercase tracking-wide">Multi-variable Filter Parameters</span>
          </div>
          <button
            onClick={() => {
              setStarFilter("All");
              setTypeFilter("All");
              setStatusFilter("All");
              setRestaurantSelection("All");
              setRiderSelection("All");
              setSearchQuery("");
              triggerToast("Filters Reset", "Cleared active feedback matrices.", "info");
            }}
            className="text-[10px] font-extrabold text-stone-500 hover:text-[#E23744] uppercase cursor-pointer transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 text-xs font-semibold text-stone-700">
          
          {/* Keyword Search */}
          <div className="col-span-1 sm:col-span-1 md:col-span-1">
            <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Keyword Search</label>
            <div className="relative">
              <input
                id="search-review-query"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Client ID, text..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl leading-none text-xs focus:ring-1 focus:ring-[#E23744] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
            </div>
          </div>

          {/* Rating filter */}
          <div>
            <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Rating Category</label>
            <select
              id="filter-star-rating"
              value={starFilter}
              onChange={(e) => setStarFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 focus:ring-1 focus:ring-[#E23744] focus:outline-none cursor-pointer"
            >
              <option value="All">All Scores (1-5 ★)</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>
          </div>

          {/* Target Type filter */}
          <div>
            <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Feedback Target</label>
            <select
              id="filter-target-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 focus:ring-1 focus:ring-[#E23744] focus:outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Restaurant Reviews">Restaurant Reviews Only</option>
              <option value="Rider Reviews">Rider Reviews Only</option>
            </select>
          </div>

          {/* Moderation Status filter */}
          <div>
            <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Compliance Status</label>
            <select
              id="filter-compliance-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 focus:ring-1 focus:ring-[#E23744] focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Hidden">Hidden</option>
              <option value="Flagged">Flagged Alert</option>
              <option value="Pending Progress">Pending Support</option>
            </select>
          </div>

          {/* Targeted Specific Merchant Selection */}
          <div>
            <label className="block text-[10px] text-stone-400 font-extrabold uppercase mb-1">Dynamic Merchant Node</label>
            <select
              id="filter-merchant-specific"
              value={restaurantSelection}
              onChange={(e) => setRestaurantSelection(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-2 focus:ring-1 focus:ring-[#E23744] focus:outline-none cursor-pointer"
            >
              <option value="All">All Outlets</option>
              {Array.from(new Set(enhancedReviews.map(r => r.targetName))).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ----------------- MAIN AREA LAYOUT FEED & SIDE DATA ----------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="reviews-feed-grid">
        
        {/* Left Aspect: Social Feed styled list of reviews cards (7 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Internal subtab navigation for quick moderation filter logs */}
          <div className="flex bg-stone-100 rounded-xl p-1 gap-1 border border-stone-200 text-xs font-black">
            <button
              onClick={() => setActiveModTab("All")}
              className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeModTab === "All" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
            >
              🔥 Verified Feed ({filteredReviews.length})
            </button>
            <button
              onClick={() => setActiveModTab("Pending Queue")}
              className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeModTab === "Pending Queue" ? "bg-indigo-600 text-white shadow-sm" : "text-stone-500 hover:text-indigo-600"}`}
            >
              ⏳ Action Required
            </button>
            <button
              onClick={() => setActiveModTab("Negative Alerts")}
              className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeModTab === "Negative Alerts" ? "bg-amber-600 text-white shadow-sm" : "text-stone-500 hover:text-amber-600"}`}
            >
              ⚠️ Low Stars Sub-set
            </button>
            <button
              onClick={() => setActiveModTab("AI Flags")}
              className={`flex-1 p-2 rounded-lg text-center cursor-pointer transition-all ${activeModTab === "AI Flags" ? "bg-rose-600 text-white shadow-sm" : "text-stone-500 hover:text-rose-600"}`}
            >
              🤖 Smart Shield Flags
            </button>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-stone-100 shadow-xs space-y-3">
              <div className="inline-flex p-3 bg-stone-50 rounded-full text-stone-400">
                <Sliders className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-stone-900">No matched feedback logs</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                No custom review records matched your filter criteria. Clear star filters or search queries to pull standard operational feeds.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((rev) => {
                const isRider = rev.targetType === "rider";
                const isReplyDrawerOpen = replyReviewId === rev.id;

                return (
                  <div 
                    key={rev.id}
                    id={`review-card-index-${rev.id}`}
                    className={`bg-white rounded-2xl border border-stone-200 p-6 shadow-xs relative transition-all duration-200 ${
                      rev.moderationStatus === "Hidden" ? "bg-stone-50/70 opacity-70 border-zinc-200 shadow-inner" : "hover:shadow-md"
                    }`}
                  >
                    
                    {/* TOP ACTION & RATING BADGE LINE */}
                    <div className="flex justify-between items-start gap-3">
                      
                      {/* Customer Info node */}
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img 
                            referrerPolicy="no-referrer"
                            src={rev.customerAvatar} 
                            alt={rev.userName} 
                            className="w-10 h-10 rounded-full object-cover border border-stone-200"
                            onError={(e) => {
                              (e.target as any).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop";
                            }}
                          />
                          {rev.customerVerifiedBadge && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full border border-white" title="Genuine verified dining transaction">
                              <ShieldCheck className="w-3 h-3 font-semibold" />
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-stone-900 text-xs">{rev.userName}</span>
                            <span className="text-[9px] bg-stone-100 text-stone-500 px-1 py-0.5 rounded font-mono">
                              #{rev.id}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[10px] text-stone-400 pt-0.5">
                            <span>Order ID: <strong className="text-stone-600">{rev.orderId}</strong></span>
                            <span>•</span>
                            <span>{rev.date}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right rating & review score */}
                      <div className="text-right flex flex-col items-end">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(starIdx => (
                            <Star 
                              key={starIdx} 
                              className={`w-3.5 h-3.5 ${starIdx <= rev.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"}`} 
                            />
                          ))}
                        </div>
                        
                        <span className={`text-[9px] inline-block mt-1 font-bold px-2 py-0.5 rounded uppercase ${
                          rev.rating >= 4 ? "bg-emerald-50 text-emerald-800" :
                          rev.rating === 3 ? "bg-amber-50 text-amber-800" : "bg-rose-50 text-[#E23744]"
                        }`}>
                          {rev.rating >= 4 ? "Satisfactory" : rev.rating === 3 ? "Neutral Experience" : "Dispute Escalation"}
                        </span>
                      </div>

                    </div>

                    {/* DYNAMIC TARGET SCOPES (Restaurant vs. Rider parameters) */}
                    <div className="bg-stone-50 rounded-xl p-3 flex flex-wrap justify-between items-center mt-4 border border-stone-100 text-xs gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-extrabold uppercase">Assign Zone Tag:</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`w-2.5 h-2.5 rounded-full ${isRider ? "bg-sky-500" : "bg-rose-500"}`}></span>
                          <span className="text-stone-900 font-black">{rev.targetName}</span>
                          <span className="text-zinc-400">({isRider ? "Courier Rider Partner" : "Merchant Food Vendor"})</span>
                        </div>
                      </div>

                      {/* Display metric parameters categories rating */}
                      <div className="flex gap-4 text-[10.5px]">
                        {!isRider ? (
                          <>
                            <div>🍔 Taste: <span className="font-bold text-stone-900">{rev.foodQualityRating}/5</span></div>
                            <div>📦 Pack: <span className="font-bold text-stone-900">{rev.packagingRating}/5</span></div>
                            <div>⏳ SLA: <span className="font-bold text-stone-900">{rev.deliverySpeedRating}/5</span></div>
                          </>
                        ) : (
                          <>
                            <div>🛵 Speed: <span className="font-bold text-stone-900">{rev.riderTimeRating}/5</span></div>
                            <div>🤝 Comm: <span className="font-bold text-stone-900">{rev.riderCommRating}/5</span></div>
                            <div>😊 Polite: <span className="font-bold text-stone-900">{rev.riderFriendlyRating}/5</span></div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* HEADING & ACTUAL COMMENT CONTENT */}
                    <div className="space-y-1.5 mt-3">
                      <h4 className="text-xs font-black text-stone-900">{rev.reviewTitle}</h4>
                      
                      {rev.moderationStatus === "Hidden" ? (
                        <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-2 italic leading-relaxed">
                          <EyeOff className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span>This customer comment was HIDDEN from consumer feeds due to compliance guidelines. The mathematical score remains active in ranking systems.</span>
                        </p>
                      ) : (
                        <p className="text-xs text-stone-600 leading-relaxed font-medium">
                          "{rev.comment}"
                        </p>
                      )}

                      {/* IMAGE ATTACHMENTS */}
                      {rev.attachedImages.length > 0 && rev.moderationStatus !== "Hidden" && (
                        <div className="flex gap-2 pt-2">
                          {rev.attachedImages.map((img, i) => (
                            <img 
                              key={i} 
                              referrerPolicy="no-referrer"
                              src={img} 
                              alt="Review attachment" 
                              className="w-20 h-20 rounded-xl object-cover border border-stone-200 hover:scale-105 transition-transform" 
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AI SYSTEM SUMMARY COMPLIANCE MATRIX BADGE */}
                    <div className="flex border-t border-dashed border-stone-200 pt-4 mt-4 flex-wrap justify-between items-center gap-4 text-xs">
                      
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-extrabold uppercase text-stone-400">AI Guardrail Logs</span>
                        
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 font-extrabold ${
                            rev.sentiment === "Positive" ? "bg-emerald-50 text-emerald-800" :
                            rev.sentiment === "Neutral" ? "bg-amber-100 text-amber-800" : "bg-rose-50 text-rose-800"
                          }`}>
                            Sentiment: {rev.sentiment}
                          </span>

                          <span className={`px-2 py-0.5 rounded-lg text-[10px] ${rev.toxicScore > 40 ? "bg-rose-100 text-[#E23744]" : "bg-stone-50 text-stone-500"}`}>
                            Toxicity: {rev.toxicScore}%
                          </span>

                          {rev.isSpam && (
                            <span className="px-1.5 py-0.5 bg-rose-200 text-rose-900 text-[9px] rounded font-black animation-pulse">
                              SPAM ALERTER
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AI Rec Action Label */}
                      <span className="text-[10px] font-semibold text-indigo-700 italic bg-indigo-50 px-2.5 py-1 rounded-lg">
                        💻 Recommend: {rev.aiRecommendation}
                      </span>

                    </div>

                    {/* REPLIES HISTORY VIEWPORT */}
                    {rev.replies.length > 0 && (
                      <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 mt-4 space-y-3 font-semibold text-xs">
                        <span className="text-[9px] text-[#E23744] font-extrabold uppercase block border-b pb-1">Response Ledger logs</span>
                        {rev.replies.map(rep => (
                          <div key={rep.id} className="relative group bg-white shadow-xs p-3 rounded-lg border border-stone-100">
                            <div className="flex justify-between items-center text-[10px] text-stone-400">
                              <span className="font-extrabold text-stone-900">{rep.author} <span className="font-bold text-[9px] px-1 bg-stone-100 text-stone-500 rounded">{rep.role.toUpperCase()}</span></span>
                              <span>{rep.date}</span>
                            </div>
                            <p className="text-xs text-stone-600 mt-1">{rep.text}</p>
                            <button
                              id={`delete-reply-btn-${rep.id}`}
                              onClick={() => handleDeleteReply(rev.id, rep.id)}
                              className="absolute top-2 right-2 text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-black"
                              title="Delete this reply"
                            >
                              ✕ Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* REPLY DRAWER DRAFT SUBPANEL */}
                    {isReplyDrawerOpen && (
                      <div className="bg-indigo-50/50 rounded-xl border border-indigo-300 p-4 mt-4 space-y-3 animate-slide-in-right">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-indigo-900 flex items-center gap-1.5">
                            <Reply className="w-4 h-4 text-indigo-600" /> Write Response Partner Screen
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-stone-400">Publish as:</span>
                            <select
                              value={replyDraftRole}
                              onChange={(e) => setReplyDraftRole(e.target.value as any)}
                              className="bg-white border rounded p-1 text-[10px]"
                            >
                              <option value="admin">Corporate Support Admin</option>
                              <option value="restaurant">Outlet Restaurant Manager</option>
                            </select>
                            <button onClick={() => setReplyReviewId(null)} className="text-stone-400 hover:text-stone-900">
                              ✕ Cancel
                            </button>
                          </div>
                        </div>

                        {/* Presets AI recommended suggestions */}
                        <div className="space-y-1 bg-white p-2.5 rounded-xl border border-indigo-200 text-[10.5px]">
                          <span className="text-[9px] font-extrabold text-[#E23744] uppercase tracking-wide block mb-1">💡 Suggested Responses (AI Engine)</span>
                          {rev.rating >= 4 ? (
                            <div className="grid gap-1.5">
                              {aiSuggestedAnswers.positive.map((t, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setReplyDraftText(t)}
                                  className="text-left bg-stone-50 hover:bg-indigo-50 text-stone-600 p-1.5 rounded cursor-pointer leading-relaxed"
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          ) : rev.rating === 3 ? (
                            <div className="grid gap-1.5">
                              {aiSuggestedAnswers.neutral.map((t, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setReplyDraftText(t)}
                                  className="text-left bg-stone-50 hover:bg-indigo-50 text-stone-600 p-1.5 rounded cursor-pointer leading-relaxed"
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="grid gap-1.5">
                              {aiSuggestedAnswers.negative.map((t, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setReplyDraftText(t)}
                                  className="text-left bg-stone-50 hover:bg-rose-50/70 text-stone-600 p-1.5 rounded cursor-pointer leading-relaxed"
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <textarea
                            id={`reply-textarea-${rev.id}`}
                            rows={3}
                            value={replyDraftText}
                            onChange={(e) => setReplyDraftText(e.target.value)}
                            placeholder="Type response back to customer dining registry..."
                            className="w-full bg-white border border-indigo-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-stone-400"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setReplyReviewId(null)}
                            className="p-1.5 px-3 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-[10.5px] rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            id={`reply-save-btn-${rev.id}`}
                            onClick={() => handleSaveReply(rev.id)}
                            className="p-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10.5px] rounded-lg shadow-sm"
                          >
                            Publish Response
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ACTIONS COMMAND FOOTER BAR */}
                    <div className="flex flex-wrap justify-between items-center text-xs pt-4 border-t border-stone-100 mt-4 gap-2">
                      <div className="flex gap-1">
                        <button
                          id={`action-modal-reply-${rev.id}`}
                          onClick={() => {
                            setReplyReviewId(isReplyDrawerOpen ? null : rev.id);
                            setReplyDraftText("");
                          }}
                          className="p-1 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg hover:text-stone-900 cursor-pointer flex items-center gap-1 font-extrabold"
                        >
                          <Reply className="w-3.5 h-3.5" /> Reply to client
                        </button>

                        {rev.moderationStatus === "Hidden" ? (
                          <button
                            id={`action-unhide-${rev.id}`}
                            onClick={() => handleUnhideReview(rev)}
                            className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg cursor-pointer flex items-center gap-1 font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" /> Unhide Text
                          </button>
                        ) : (
                          <button
                            id={`action-hide-trigger-${rev.id}`}
                            onClick={() => handleTriggerHideReviewFlow(rev)}
                            className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer flex items-center gap-1 font-bold"
                          >
                            <EyeOff className="w-3.5 h-3.5" /> Mask Comment text
                          </button>
                        )}

                        {rev.toxicScore > 30 && (
                          <button
                            onClick={() => handleResolveFlag(rev)}
                            className="p-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg cursor-pointer flex items-center gap-1 font-bold"
                          >
                            <ShieldBan className="w-3.5 h-3.5 text-amber-600" /> Mark Resolved
                          </button>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => triggerToast("Review Tagged", `Review marked dynamic priority tag assigned.`, "info")}
                          className="p-1 px-2 hover:bg-stone-50 text-stone-400 font-bold rounded"
                          title="Report client review abuse"
                        >
                          <Flag className="w-3.5 h-3.5 hover:text-rose-500" />
                        </button>

                        <button
                          onClick={() => {
                            setEnhancedReviews(prev => prev.filter(item => item.id !== rev.id));
                            triggerToast("Review Archived", `Review indexing code ${rev.id} transferred to historical archive storage.`, "success");
                          }}
                          className="p-1 px-2 hover:bg-stone-50 text-stone-400 font-bold rounded"
                          title="Archive Review"
                        >
                          <Archive className="w-3.5 h-3.5 hover:text-stone-900" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Do you want to permanently delete review ${rev.id} from customer records? This CANNOT be undone.`)) {
                              setEnhancedReviews(prev => prev.filter(item => item.id !== rev.id));
                              triggerToast("Review Deleted Permanently", `Review code ${rev.id} has been completely purged.`, "success");
                            }
                          }}
                          className="p-1 px-2 hover:bg-rose-50 text-stone-400 font-bold rounded"
                          title="Delete Review Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5 hover:text-rose-600 text-rose-500" />
                        </button>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Right Aspect: Sentiment Analytics, Category ratings breakdown and Audits (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* AI DECISION SUGGESTIVE INSIGHT ENGINE */}
          <div className="bg-gradient-to-br from-indigo-950 to-stone-900 text-white p-5 rounded-3xl border border-indigo-800 shadow-xl space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> AI Mod Radar
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Real-time Node: Online</span>
            </div>

            <h3 className="text-sm font-black tracking-tight">AI Moderation & Sentiment Insights</h3>
            <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
              We parsed the last 150 transaction reviews. Real-time toxic, hate, or vulgar language is locked immediately.
            </p>

            <div className="space-y-4 pt-2">
              {/* Sentiment level progress percentages */}
              <div className="space-y-1.5 text-xs text-stone-300 font-bold">
                <div className="flex justify-between">
                  <span>Positive Sentiment</span>
                  <span className="font-mono text-emerald-400">72%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: "72%" }} />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-stone-300 font-bold">
                <div className="flex justify-between">
                  <span>Neutral Feedback</span>
                  <span className="font-mono text-amber-400">16%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: "16%" }} />
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-stone-300 font-bold">
                <div className="flex justify-between">
                  <span>Negative Alerts</span>
                  <span className="font-mono text-red-400">12%</span>
                </div>
                <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 transition-all" style={{ width: "12%" }} />
                </div>
              </div>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl flex items-start gap-2 text-[10.5px] leading-relaxed select-none font-medium mt-2">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 fill-rose-50 flex-shrink-0" />
              <span>
                <strong>Flag Suggestion:</strong> Review index <strong>#rev-3</strong> triggers potential spam match rating. Retain manual checks.
              </span>
            </div>
          </div>

          {/* DYNAMIC CATEGORY RATING STAR RATINGS (FOOD VS COURIER) */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-4 h-4 text-[#E23744]" /> Average rating sub-criteria
            </h3>

            {/* Restaurant ratings categories metrics */}
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide block border-b pb-1">Restaurant Service Scores</span>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>Food Culinary Quality</span>
                  <span className="font-mono">4.6 / 5 ★</span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: "92%" }} />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>Packaging & Sanitation</span>
                  <span className="font-mono">4.3 / 5 ★</span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: "86%" }} />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>Kitchen Cooking Speed (SLA)</span>
                  <span className="font-mono">4.1 / 5 ★</span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400" style={{ width: "82%" }} />
                </div>
              </div>
            </div>

            {/* Rider ratings categories metrics */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide block border-b pb-1">Fleet Rider Scores</span>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>Professional Dispatch Manners</span>
                  <span className="font-mono">4.8 / 5 ★</span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E23744]" style={{ width: "96%" }} />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>Friendly Road Communication</span>
                  <span className="font-mono">4.4 / 5 ★</span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E23744]" style={{ width: "88%" }} />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-stone-700">
                  <span>General Cleanliness & Uniform</span>
                  <span className="font-mono">4.5 / 5 ★</span>
                </div>
                <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E23744]" style={{ width: "90%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* RETROSPECTIVE HISTORIAL CHARTS TREND */}
          <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-stone-900 uppercase tracking-wider block">Average Satisfaction Trend</h3>
            
            <div className="h-44 text-xs font-semibold" style={{ minHeight: "176px", minWidth: 0 }}>
              <SafeResponsiveContainer minHeight={176} minWidth={0}>
                <AreaChart data={ratingTrendData}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" stroke="#888888" fontSize={9} />
                  <YAxis domain={[3.5, 5]} stroke="#888888" fontSize={9} />
                  <Tooltip labelClassName="text-stone-900" />
                  <Area type="monotone" dataKey="avgRating" name="Avg rating" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" />
                </AreaChart>
              </SafeResponsiveContainer>
            </div>
            
            <div className="flex justify-between text-[10.5px] text-stone-400 font-bold select-none pt-0.5">
              <span>CSAT Target: 90%</span>
              <span className="text-emerald-500 flex items-center gap-1">
                CSAT Metric: {cSatisfactionRating}%
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* ----------------- COMPREHENSIVE COMPLIANCE AUDIT COCKPIT TABLE ----------------- */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden" id="reviews-audit-logs">
        <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h3 className="text-sm font-black text-stone-900">Compliance Audit logs History</h3>
            <p className="text-xs text-stone-400">Tracks corporate moderator shifts, masks executed, custom feedback blocks, and dispute settlements.</p>
          </div>

          <button
            onClick={() => {
              triggerToast("Moderation Log Exported", "Master CSV list (5 logs) of audit activities downloaded.", "success");
            }}
            className="p-1.5 px-3 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" /> Export Audit Ledger
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/30 text-[10.5px] text-zinc-400 font-extrabold uppercase border-b border-stone-100">
                <th className="p-4">Action ID</th>
                <th className="p-4">Target Review</th>
                <th className="p-4">Action Taken</th>
                <th className="p-4">Staff Moderator</th>
                <th className="p-4">Transition logs</th>
                <th className="p-4">Justification details</th>
                <th className="p-4 text-right">Date / time stamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium text-stone-700 leading-normal">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/20">
                  <td className="p-4 font-mono font-bold text-stone-900">{log.id}</td>
                  <td className="p-4">{log.reviewId}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      log.actionTaken.includes("Hide") ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-800"
                    }`}>
                      {log.actionTaken}
                    </span>
                  </td>
                  <td className="p-4 text-stone-900 font-bold">{log.moderatorName}</td>
                  <td className="p-4">
                    <span className="text-zinc-400 text-[10.5px]">{log.previousStatus}</span>
                    <span className="px-1 text-zinc-300">→</span>
                    <span className="text-stone-900 font-bold">{log.newStatus}</span>
                  </td>
                  <td className="p-4 text-stone-500 max-w-xs truncate" title={log.reason}>{log.reason}</td>
                  <td className="p-4 text-right text-stone-400 font-mono">{log.dateTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- COMPLIANCE MODERATION HIDE WORKFLOW MODAL ----------------- */}
      {showHideModal && activeHideReview && (
        <div className="fixed inset-0 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in" id="reviews-hide-modal-core">
          
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-5 border border-stone-200 shadow-2xl animate-scale-up">
            
            {/* Modal Heading row */}
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-base font-black text-stone-900 flex items-center gap-1.5">
                <EyeOff className="w-5 h-5 text-rose-600" /> Mask Review comment visibility
              </h3>
              <button
                onClick={() => setShowHideModal(false)}
                className="text-stone-400 hover:text-stone-800 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Target Client Description block */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-stone-400">Target Client Review:</span>
              <div className="font-extrabold text-stone-900">{activeHideReview.userName} ({activeHideReview.targetName})</div>
              <p className="italic text-stone-500 line-clamp-2">"{activeHideReview.comment}"</p>
            </div>

            {/* Reason selector dropdown */}
            <div className="space-y-1.5 text-xs font-semibold text-stone-700">
              <label className="block text-stone-600 font-bold">Select Regulatory Reason Code *</label>
              <select
                id="hide-reason-dropdown"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-1 focus:ring-[#E23744] focus:outline-none"
              >
                <option value="Abusive Language">Abusive Language</option>
                <option value="Hate Speech">Hate Speech</option>
                <option value="Spam Content">Spam Content</option>
                <option value="Fake Review">Fake Review</option>
                <option value="Offensive Content">Offensive Content</option>
                <option value="Personal Information Exposure">Personal Information Exposure</option>
                <option value="Irrelevant Content">Irrelevant Content</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Internal Moderator Comments notes */}
            <div className="space-y-1.5 text-xs font-semibold text-stone-700">
              <label className="block text-stone-600 font-bold">Internal Moderator Notes *</label>
              <textarea
                id="hide-notes-textarea"
                rows={2}
                value={moderatorNoteText}
                onChange={(e) => setModeratorNoteText(e.target.value)}
                placeholder="List context or ticket reference for compliance records auditing..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 focus:ring-1 focus:ring-[#E23744] focus:outline-none"
              />
            </div>

            {/* Crucial Corporate Compliance notice banner */}
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px] leading-relaxed rounded-xl font-medium">
              ⚠️ <strong>Corporate Compliance Agreement:</strong> 
              <p className="mt-1">
                The review text will be hidden from customers and public interfaces. The rating score will remain stored in the database and continue contributing to restaurant/rider rating calculations.
              </p>
            </div>

            {/* Actions button rows */}
            <div className="flex gap-2 justify-end pt-2 text-xs">
              <button
                id="hide-cancel-btn"
                onClick={() => setShowHideModal(false)}
                className="p-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                id="hide-confirm-btn"
                onClick={handleConfirmHideReview}
                className="p-2.5 px-5 bg-stone-900 hover:bg-stone-900 text-white font-black rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                Mask & Hide Review Text
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
