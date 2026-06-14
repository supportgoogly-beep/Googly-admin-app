/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface City {
  id: string;
  name: string;
  pincode_prefix: string;
  created_at?: string;
}

export interface Area {
  id: string;
  city_id: string;
  name: string;
  pincode: string;
  state?: string;
  country?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  full_address?: string;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  count: number;
  isVeg: boolean;
}

export interface BillDetail {
  subtotal: number;
  gst: number;
  delivery: number;
  discount: number;
  total: number;
}

export type OrderStatus = "Pending" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";

export interface Order {
  id: string;
  userId: string;
  userName: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  billDetail: BillDetail;
  status: OrderStatus;
  riderId?: string;
  riderName?: string;
  cancelReason?: string;
  address: string;
  city?: string;
  orderTime: string;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryType?: string;
  currentTrackerIndex?: number;
  x: number; // For live-tracking visualization (percentage coordinates on map)
  y: number;
}

export interface BankDetails {
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  active: boolean;
  ownerName: string;
  email: string;
  phone: string;
  fssaiNumber: string;
  commissionPercent: number;
  bankDetails: BankDetails;
  kycDocumentUrl?: string;
  blocked: boolean;

  // New onboarding properties (optional to keep mock data stable)
  logoUrl?: string;
  bannerUrl?: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
  deliveryRadius?: number;
  registrationDate?: string;
  fssaiStatus?: "Verified" | "Pending" | "Rejected" | "Suspended";
  fssaiExpiryDate?: string;

  // Owner info
  ownerAltPhone?: string;
  ownerDob?: string;
  ownerGender?: string;
  ownerAddress?: string;
  ownerAadhaar?: string;
  ownerPan?: string;
  ownerPhotoUrl?: string;

  // KYC details
  kycDetails?: {
    aadhaarFrontUrl?: string;
    aadhaarBackUrl?: string;
    panCardUrl?: string;
    businessRegUrl?: string;
    gstUrl?: string;
    addressProofUrl?: string;
  };

  upiId?: string;
  cancelledChequeUrl?: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  isVeg: boolean;
  category: string;
  addOns: string[];
  image?: string;
  
  // Extended premium fields for advanced Menu Management
  shortDescription?: string;
  sku?: string;
  discountPrice?: number;
  taxPercent?: number;
  packagingCharge?: number;
  foodType?: "Veg" | "Non-Veg" | "Egg";
  addOnsConfig?: any[];
  availability?: "Available" | "Out of Stock" | "Hidden";
  rating?: number;
  lastUpdated?: string;
  createdAt?: string;
}

export type RiderStatus = "Online" | "Offline" | "On-Delivery" | "Suspended" | "Pending Verification";

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  status: RiderStatus;
  walletBalance: number;
  active: boolean;
  rating: number;
  kycApproved: boolean;
  city?: string;
  x: number; // Percent on map
  y: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  status: "Active" | "Blocked" | "Suspended" | "New User";
  city?: string;
  savedAddresses: string[];
  ordersCount: number;
}

export type CouponType = "percentage" | "flat";

export interface Coupon {
  id: string;
  code: string;
  title: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  applicableRestaurants: string[]; // empty fits "All"
  active: boolean;
  city?: string;
}

export interface ChatMessage {
  sender: "customer" | "admin" | "system";
  message: string;
  time: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  title: string;
  category: string;
  status: "Open" | "Resolved";
  chatHistory: ChatMessage[];
  createdAt: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  userName: string;
  amount: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectReason?: string;
  requestedAt: string;
}

export interface MapPoint {
  x: number;
  y: number;
}

export interface GeofencingZone {
  id: string;
  name: string;
  polygon: MapPoint[]; // List of coordinates that form delivery perimeter
  active: boolean;
  ordersCount: number;
  surgeEnabled: boolean;
  surgeMultiplier: number;
  city?: string;
}

export interface ReviewRating {
  id: string;
  targetId: string; // restaurant ID or rider ID
  targetType: "restaurant" | "rider";
  targetName: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  hidden: boolean;
}

export interface CMSBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkToRestaurantId: string;
  active: boolean;
  publishDate: string;
  city?: string;
}

export interface LoyaltyConfig {
  coinsPerHundredRs: number;
  coinRedemptionValue: number; // e.g. 1 coin = 0.5 Rs
}

export interface PenaltyLogic {
  id: string;
  afterMinutes: number;
  penaltyPercent: number;
  appliesTo: "restaurant" | "customer" | "rider";
}

export interface TaxSettings {
  gstPercent: number;
  serviceTaxPercent: number;
  deliveryTaxPercent: number;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: {
    dashboard: boolean;
    orders: boolean;
    restaurants: boolean;
    riders: boolean;
    pricing: boolean;
    crm: boolean;
    finances: boolean;
    settings: boolean;
  };
  active: boolean;
  city?: string;
  phone?: string;
  department?: string;
  designation?: string;
  avatar?: string;
  employeeId?: string;
  security?: {
    forcePasswordChange: boolean;
    enable2fa: boolean;
    restrictIp: string;
    restrictDevice: string;
  };
  permissionsOverride?: any;
}

export interface GlobalSettings {
  forceAppUpdate: boolean;
  maintenanceMode: boolean;
  enableCOD: boolean;
  minOrderValue: number;
}

export interface TrafficWeatherWidget {
  location: string;
  weather: "Sunny" | "Heavy Rain" | "Waterlogged" | "Normal";
  trafficDensity: "Low" | "Medium" | "High" | "Extreme Jam";
  temperature: number;
}

export interface ProfileSecurity {
  name: string;
  email: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  passwordChangedAt?: string;
}
