/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Restaurant,
  MenuItem,
  Rider,
  User,
  Order,
  Coupon,
  SupportTicket,
  RefundRequest,
  GeofencingZone,
  ReviewRating,
  CMSBanner,
  LoyaltyConfig,
  PenaltyLogic,
  TaxSettings,
  StaffMember,
  GlobalSettings,
  TrafficWeatherWidget,
  ProfileSecurity
} from "../types";

export const INITIAL_RESTAURANTS: Restaurant[] = [
  {
    id: "rest-1",
    name: "Biryani Express",
    city: "Kolkata",
    cuisine: "North Indian, Mughlai",
    rating: 4.8,
    active: true,
    ownerName: "Akram Sheikh",
    email: "owner@biryaniexpress.com",
    phone: "+91 98321 04422",
    fssaiNumber: "12822002000456",
    commissionPercent: 18,
    bankDetails: {
      accountNumber: "405622108873",
      ifscCode: "HDFC0001202",
      bankName: "HDFC Bank",
      branchName: "Park Street, Kolkata"
    },
    kycDocumentUrl: "/kyc/fssai_rest1.pdf",
    blocked: false
  },
  {
    id: "rest-2",
    name: "Cheesy Crust Parlor",
    city: "Howrah",
    cuisine: "Italian, Pizza & Pasta",
    rating: 4.5,
    active: true,
    ownerName: "Maria D'Souza",
    email: "maria@cheesycrust.com",
    phone: "+91 90882 11334",
    fssaiNumber: "12821003445892",
    commissionPercent: 15,
    bankDetails: {
      accountNumber: "9120100454322",
      ifscCode: "UTIB0000010",
      bankName: "Axis Bank",
      branchName: "Salt Lake Sec 5"
    },
    kycDocumentUrl: "/kyc/fssai_rest2.pdf",
    blocked: false
  },
  {
    id: "rest-3",
    name: "Burgers & Co.",
    city: "New Town",
    cuisine: "American, Fast Food",
    rating: 4.2,
    active: false,
    ownerName: "Sunny Bhatia",
    email: "sunny@burgersco.in",
    phone: "+91 97722 05541",
    fssaiNumber: "12823001889410",
    commissionPercent: 20,
    bankDetails: {
      accountNumber: "10022304892",
      ifscCode: "SBIN054210",
      bankName: "State Bank of India",
      branchName: "Bidhannagar"
    },
    kycDocumentUrl: "/kyc/fssai_rest3.pdf",
    blocked: false
  },
  {
    id: "rest-4",
    name: "Sweet Indulgence Bakery",
    city: "Udaipur",
    cuisine: "Desserts, Bakery",
    rating: 4.9,
    active: true,
    ownerName: "Ritu Kapoor",
    email: "ritu@sweetindulgence.com",
    phone: "+91 82239 12345",
    fssaiNumber: "12822001000213",
    commissionPercent: 12,
    bankDetails: {
      accountNumber: "5010023491823",
      ifscCode: "HDFC0000412",
      bankName: "HDFC Bank",
      branchName: "Gariahat"
    },
    kycDocumentUrl: "/kyc/fssai_rest4.pdf",
    blocked: false
  }
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  {
    id: "menu-1",
    restaurantId: "rest-1",
    name: "Royal Mutton Biryani",
    description: "Slow-cooked saffron basmati rice layered with tender chunks of mutton and Kolkata boiled potato.",
    price: 380,
    isVeg: false,
    category: "Main Course",
    addOns: ["Extra Gravy (Rs 20)", "Boiled Egg (Rs 15)", "Raita Combo (Rs 45)"]
  },
  {
    id: "menu-2",
    restaurantId: "rest-1",
    name: "Special Chicken Tikka",
    description: "6 pieces of charcoal grilled chicken marinated in gourmet secret spices and organic yogurt.",
    price: 240,
    isVeg: false,
    category: "Starters",
    addOns: ["Mint Chutney Sauce (Rs 10)", "Butter Garlic Naan Addition (Rs 50)"]
  },
  {
    id: "menu-3",
    restaurantId: "rest-2",
    name: "Double Cheese Margherita Pizza",
    description: "Sourdough crust baked in 450 degree oven topped with fresh San Marzano tomato puree and layered mozzarella.",
    price: 320,
    isVeg: true,
    category: "Main Course",
    addOns: ["Extra Jalapeno (Rs 30)", "Cheese Burst Crust (Rs 80)", "Truffle Oil Drizzle (Rs 90)"]
  },
  {
    id: "menu-4",
    restaurantId: "rest-2",
    name: "Garlic Breadsticks with Dip",
    description: "Freshly baked herb breadsticks brushed with compound butter, served with cheddar dipping cheese.",
    price: 150,
    isVeg: true,
    category: "Starters",
    addOns: ["Extra Jalapeno Dip (Rs 25)"]
  },
  {
    id: "menu-5",
    restaurantId: "rest-3",
    name: "Crunchy Double Patty Veg Burger",
    description: "Crispy chickpea-infused legume potato steak, dynamic liquid cheese, lettuce, and brioche bun.",
    price: 180,
    isVeg: true,
    category: "Main Course",
    addOns: ["Double Fried Crust (Rs 20)", "Vegan Cheese Transition (Rs 35)"]
  },
  {
    id: "menu-6",
    restaurantId: "rest-4",
    name: "Belgian Red-Velvet Cupcake",
    description: "Silky crumb cocoa red cake topped with organic lemon cream cheese whipped frosting.",
    price: 95,
    isVeg: true,
    category: "Desserts",
    addOns: ["Dark Chocolate Flakes (Rs 10)", "Vanilla Gelato Scoop (Rs 60)"]
  }
];

export const INITIAL_RIDERS: Rider[] = [
  {
    id: "V8K3A2",
    city: "Kolkata",
    name: "Vikram Das",
    phone: "+91 91233 44558",
    vehicleNumber: "WB-02-AK-4451",
    status: "Online",
    walletBalance: 420,
    active: true,
    rating: 4.7,
    kycApproved: true,
    x: 42,
    y: 35
  },
  {
    id: "M9X4R1",
    city: "Howrah",
    name: "Amit Kumar Shaw",
    phone: "+91 88921 55092",
    vehicleNumber: "WB-04-P-9921",
    status: "On-Delivery",
    walletBalance: 1250,
    active: true,
    rating: 4.9,
    kycApproved: true,
    x: 58,
    y: 62
  },
  {
    id: "P2Q7L8",
    city: "New Town",
    name: "Prakash Soren",
    phone: "+91 97721 00351",
    vehicleNumber: "WB-20-C-3829",
    status: "Offline",
    walletBalance: 180,
    active: false,
    rating: 4.1,
    kycApproved: true,
    x: 25,
    y: 80
  },
  {
    id: "392817",
    city: "Udaipur",
    name: "Sujit Mandal",
    phone: "+91 93256 71830",
    vehicleNumber: "WB-12-Z-7712",
    status: "Online",
    walletBalance: 0,
    active: true,
    rating: 4.4,
    kycApproved: false, // New registration for KYC approval
    x: 75,
    y: 20
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: "1234567",
    city: "Kolkata",
    name: "Rohan Purkayastha",
    email: "ruhandharpurkayastha@gmail.com",
    phone: "+91 98311 22334",
    walletBalance: 550,
    status: "Active",
    savedAddresses: [
      "45B, Gariahat Road, Flat 3A, Near Gariahat Crossing, Kolkata - 700029",
      "Sector V Tech Hub, Salt Lake, Plot 12, Block EP"
    ],
    ordersCount: 24
  },
  {
    id: "2345678",
    city: "Howrah",
    name: "Devlina Sen",
    email: "devlina.sen@yahoo.com",
    phone: "+91 90511 88922",
    walletBalance: 25,
    status: "Active",
    savedAddresses: ["7/1, Southern Avenue, Opp. Lake Stadium, Kolkata - 700045"],
    ordersCount: 12
  },
  {
    id: "3456789",
    city: "New Town",
    name: "Siddharth Goenka",
    email: "sidgoenka@gmail.com",
    phone: "+91 84201 02912",
    walletBalance: 0,
    status: "Blocked",
    savedAddresses: ["Diamond Harbour Rd, Behala Tram Depot, Kolkata - 700034"],
    ordersCount: 8
  },
  {
    id: "4567890",
    city: "Udaipur",
    name: "Anjali Mehta",
    email: "anjali.m@outlook.com",
    phone: "+91 94330 22001",
    walletBalance: 1200,
    status: "Active",
    savedAddresses: ["DLF Galleria, Newtown, Phase 4, Tower B"],
    ordersCount: 19
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "#134821",
    city: "Kolkata",
    userId: "1234567",
    userName: "Rohan Purkayastha",
    restaurantId: "rest-1",
    restaurantName: "Biryani Express",
    items: [
      { id: "menu-1", name: "Royal Mutton Biryani", price: 380, count: 2, isVeg: false },
      { id: "menu-2", name: "Special Chicken Tikka", price: 240, count: 1, isVeg: false }
    ],
    billDetail: {
      subtotal: 1000,
      gst: 50,
      delivery: 40,
      discount: 100, // Coupon "WELCOME100" applied
      total: 990
    },
    status: "Preparing",
    riderId: "V8K3A2",
    riderName: "Vikram Das",
    address: "45B, Gariahat Road, Flat 3A, Near Gariahat Crossing, Kolkata - 700029",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    deliveryType: "Standard Delivery",
    currentTrackerIndex: 2,
    orderTime: "2026-06-11T14:15:00-07:00",
    x: 45,
    y: 38
  },
  {
    id: "#134822",
    city: "Howrah",
    userId: "2345678",
    userName: "Devlina Sen",
    restaurantId: "rest-2",
    restaurantName: "Cheesy Crust Parlor",
    items: [
      { id: "menu-3", name: "Double Cheese Margherita Pizza", price: 320, count: 1, isVeg: true },
      { id: "menu-4", name: "Garlic Breadsticks with Dip", price: 150, count: 1, isVeg: true }
    ],
    billDetail: {
      subtotal: 470,
      gst: 23.5,
      delivery: 30,
      discount: 0,
      total: 523.5
    },
    status: "Out for Delivery",
    riderId: "M9X4R1",
    riderName: "Amit Kumar Shaw",
    address: "7/1, Southern Avenue, Opp. Lake Stadium, Kolkata - 700045",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    deliveryType: "Standard Delivery",
    currentTrackerIndex: 2,
    orderTime: "2026-06-11T13:45:00-07:00",
    x: 55,
    y: 58
  },
  {
    id: "#134823",
    city: "New Town",
    userId: "4567890",
    userName: "Anjali Mehta",
    restaurantId: "rest-4",
    restaurantName: "Sweet Indulgence Bakery",
    items: [
      { id: "menu-6", name: "Belgian Red-Velvet Cupcake", price: 95, count: 4, isVeg: true }
    ],
    billDetail: {
      subtotal: 380,
      gst: 19,
      delivery: 20,
      discount: 50,
      total: 369
    },
    status: "Pending", // Unassigned! Perfect for map visual route optimizations
    address: "DLF Galleria, Newtown, Phase 4, Tower B",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    deliveryType: "Standard Delivery",
    currentTrackerIndex: 2,
    orderTime: "2026-06-11T14:48:32-07:00",
    x: 72,
    y: 25
  },
  {
    id: "#134819",
    city: "Udaipur",
    userId: "1234567",
    userName: "Rohan Purkayastha",
    restaurantId: "rest-1",
    restaurantName: "Biryani Express",
    items: [
      { id: "menu-1", name: "Royal Mutton Biryani", price: 380, count: 1, isVeg: false }
    ],
    billDetail: {
      subtotal: 380,
      gst: 19,
      delivery: 40,
      discount: 0,
      total: 439
    },
    status: "Delivered",
    riderId: "V8K3A2",
    riderName: "Vikram Das",
    address: "Sector V Tech Hub, Salt Lake, Plot 12, Block EP",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    deliveryType: "Standard Delivery",
    currentTrackerIndex: 2,
    orderTime: "2026-06-11T11:30:00-07:00",
    x: 42,
    y: 35
  },
  {
    id: "#134818",
    city: "Kolkata",
    userId: "3456789",
    userName: "Siddharth Goenka",
    restaurantId: "rest-3",
    restaurantName: "Burgers & Co.",
    items: [
      { id: "menu-5", name: "Crunchy Double Patty Veg Burger", price: 180, count: 2, isVeg: true }
    ],
    billDetail: {
      subtotal: 360,
      gst: 18,
      delivery: 50,
      discount: 0,
      total: 428
    },
    status: "Cancelled",
    cancelReason: "Late preparation: Restaurant unable to fulfill at this hour",
    address: "Diamond Harbour Rd, Behala Tram Depot, Kolkata - 700034",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    deliveryType: "Standard Delivery",
    currentTrackerIndex: 2,
    orderTime: "2026-06-11T09:12:00-07:00",
    x: 25,
    y: 80
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: "WELCOME100",
    title: "Flat Rs 100 on First Orders",
    type: "flat",
    value: 100,
    minOrderValue: 400,
    maxDiscount: 100,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    applicableRestaurants: [],
    active: true
  },
  {
    code: "ZOMATOPARTY",
    title: "30% off Gourmet Selections",
    type: "percentage",
    value: 30,
    minOrderValue: 500,
    maxDiscount: 150,
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    applicableRestaurants: ["rest-1", "rest-2"],
    active: true
  },
  {
    code: "SWEETFREE",
    title: "15% discount up to Rs 60",
    type: "percentage",
    value: 15,
    minOrderValue: 200,
    maxDiscount: 60,
    startDate: "2026-05-15",
    endDate: "2026-07-15",
    applicableRestaurants: ["rest-4"],
    active: false
  }
];

export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "CR-101",
    userId: "1234567",
    userName: "Rohan Purkayastha",
    userPhone: "+91 98311 22334",
    title: "Mutton pieces are raw/undercooked",
    category: "Food Quality Dispute",
    status: "Open",
    createdAt: "2026-06-11T14:35:00-07:00",
    chatHistory: [
      { sender: "customer", message: "Hi support, my order #134821 just got delivered but the mutton pieces in the biryani are raw and extremely hard. I cannot eat this.", time: "14:35 PM" },
      { sender: "system", message: "Ticket opened automatically. Connected to Super Admin Console.", time: "14:35 PM" },
      { sender: "admin", message: "Hello Rohan. Extremely sorry to hear about your experience. I have flagged this to Biryani Express. Let me verify the details.", time: "14:37 PM" },
      { sender: "customer", message: "Thanks, please do fast. Either issue a refund or ask them to send a fresh plate immediately.", time: "14:38 PM" }
    ]
  },
  {
    id: "CR-102",
    userId: "2345678",
    userName: "Devlina Sen",
    userPhone: "+91 90511 88922",
    title: "Rider moving in opposite direction",
    category: "Delivery Delayed",
    status: "Open",
    createdAt: "2026-06-11T14:45:00-07:00",
    chatHistory: [
      { sender: "customer", message: "Hey, my pizza is getting cold. The driver is standing at one point or moving away from my address on the map! Why?", time: "14:45 PM" }
    ]
  },
  {
    id: "CR-100",
    userId: "4567890",
    userName: "Anjali Mehta",
    userPhone: "+91 94330 22001",
    title: "Wrong item delivered previous week",
    category: "Refund Request",
    status: "Resolved",
    createdAt: "2026-06-09T18:10:00-07:00",
    chatHistory: [
      { sender: "customer", message: "I ordered cupcakes and received plain donuts last Tuesday.", time: "18:10 PM" },
      { sender: "admin", message: "We have processed Rs 250 wallet refund for your order.", time: "18:15 PM" },
      { sender: "system", message: "Issue was resolved. Feedback score: 5/5 Stars.", time: "18:16 PM" }
    ]
  }
];

export const INITIAL_REFUNDS: RefundRequest[] = [
  {
    id: "REF-201",
    orderId: "#134818",
    userName: "Siddharth Goenka",
    amount: 428,
    reason: "Late cancellation - applied auto penalty but client insists restaurant didn't pick up phone.",
    status: "Pending",
    requestedAt: "2026-06-11T10:05:00-07:00"
  },
  {
    id: "REF-202",
    orderId: "#134819",
    userName: "Rohan Purkayastha",
    amount: 150,
    reason: "Soggy food quality complaint - resolved via Support Desk",
    status: "Approved",
    requestedAt: "2026-06-11T12:00:00-07:00"
  }
];

export const INITIAL_ZONES: GeofencingZone[] = [
  {
    id: "zone-1",
    name: "Park Street & Central Core",
    active: true,
    ordersCount: 145,
    surgeEnabled: false,
    surgeMultiplier: 1.0,
    polygon: [
      { x: 30, y: 20 },
      { x: 60, y: 15 },
      { x: 70, y: 45 },
      { x: 45, y: 60 },
      { x: 25, y: 45 }
    ]
  },
  {
    id: "zone-2",
    name: "Salt Lake & Newtown Sector V",
    active: true,
    ordersCount: 220,
    surgeEnabled: true,
    surgeMultiplier: 1.5,
    polygon: [
      { x: 62, y: 10 },
      { x: 95, y: 15 },
      { x: 90, y: 55 },
      { x: 58, y: 50 }
    ]
  },
  {
    id: "zone-3",
    name: "South Kolkata Gariahat Hub",
    active: true,
    ordersCount: 98,
    surgeEnabled: false,
    surgeMultiplier: 1.2,
    polygon: [
      { x: 10, y: 50 },
      { x: 50, y: 55 },
      { x: 40, y: 90 },
      { x: 15, y: 85 }
    ]
  }
];

export const INITIAL_REVIEWS: ReviewRating[] = [
  {
    id: "rev-1",
    targetId: "rest-1",
    targetType: "restaurant",
    targetName: "Biryani Express",
    userName: "Sourav Mookherjee",
    rating: 5,
    comment: "Excellent, authentic aroma! Best biryani in the central corridor, soft potatoes.",
    date: "2026-06-11",
    hidden: false
  },
  {
    id: "rev-2",
    targetId: "729104",
    targetType: "rider",
    targetName: "Vikram Das",
    userName: "Devlina Sen",
    rating: 4,
    comment: "Rider was polite but was delayed a bit by construction on the main connector.",
    date: "2026-06-11",
    hidden: false
  },
  {
    id: "rev-3",
    targetId: "rest-2",
    targetType: "restaurant",
    targetName: "Cheesy Crust Parlor",
    userName: "Abhinav Patel",
    rating: 1,
    comment: "Completely burnt crust! They are useless and lazy chefs *Abusive Word Deleted*",
    date: "2026-06-10",
    hidden: false
  }
];

export const INITIAL_BANNERS: CMSBanner[] = [
  {
    id: "banner-1",
    title: "Monsoon Biryani Feast - Flat 20% Off",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop",
    linkToRestaurantId: "rest-1",
    active: true,
    publishDate: "2026-06-01"
  },
  {
    id: "banner-2",
    title: "Mid-week Italian Pizzas - Buy 1 Get 1",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop",
    linkToRestaurantId: "rest-2",
    active: true,
    publishDate: "2026-06-05"
  },
  {
    id: "banner-3",
    title: "Craving Sweetness? Dessert Carnivals",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600&auto=format&fit=crop",
    linkToRestaurantId: "rest-4",
    active: false,
    publishDate: "2026-05-20"
  }
];

export const INITIAL_LOYALTY: LoyaltyConfig = {
  coinsPerHundredRs: 10,
  coinRedemptionValue: 1.0 // 1 Coin = 1 Rs
};

export const INITIAL_PENALTIES: PenaltyLogic[] = [
  { id: "pen-1", afterMinutes: 10, penaltyPercent: 20, appliesTo: "restaurant" },
  { id: "pen-2", afterMinutes: 5, penaltyPercent: 15, appliesTo: "rider" },
  { id: "pen-3", afterMinutes: 8, penaltyPercent: 25, appliesTo: "customer" }
];

export const INITIAL_TAX: TaxSettings = {
  gstPercent: 5.0,
  serviceTaxPercent: 2.5,
  deliveryTaxPercent: 1.5
};

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: "staff-1",
    name: "Shyam Sundar",
    email: "shyam.support@googly.com",
    role: "Support Specialist",
    permissions: {
      dashboard: true,
      orders: true,
      restaurants: false,
      riders: true,
      pricing: false,
      crm: true,
      finances: false,
      settings: false
    },
    active: true
  },
  {
    id: "staff-2",
    name: "Reema Sen",
    email: "reema.ops@googly.com",
    role: "Operations Manager",
    permissions: {
      dashboard: true,
      orders: true,
      restaurants: true,
      riders: true,
      pricing: true,
      crm: false,
      finances: true,
      settings: false
    },
    active: true
  }
];

export const INITIAL_GLOBAL_SETTINGS: GlobalSettings = {
  forceAppUpdate: false,
  maintenanceMode: false,
  enableCOD: true,
  minOrderValue: 99
};

export const INITIAL_TRAFFIC_WEATHER: TrafficWeatherWidget = {
  location: "Kolkata Hub (Gariahat / Park Street)",
  weather: "Heavy Rain", // Prompts Surge automatic warning tooltip
  trafficDensity: "High",
  temperature: 28
};

export const INITIAL_PROFILE: ProfileSecurity = {
  name: "Googly Head Admin",
  email: "admin@googlydelivery.in",
  twoFactorEnabled: false,
  passwordChangedAt: "2026-05-15"
};

// Local storage management helpers to ensure high fidelity interactions!
export function getStoredData<T>(key: string, initial: T): T {
  try {
    const val = localStorage.getItem(`googly_admin_${key}`);
    if (val) {
      return JSON.parse(val);
    }
  } catch (e) {
    console.error("Local storage read speed limits or errors:", e);
  }
  return initial;
}

export function saveStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`googly_admin_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage write speed limits or errors:", e);
  }
}
