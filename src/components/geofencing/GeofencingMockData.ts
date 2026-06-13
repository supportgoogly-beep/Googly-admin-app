import { DeliveryHub, LocalManager, AreaZoneConfig, AreaAnalyticsTrend } from "./GeofencingTypes";

export const MOCK_HUBS: DeliveryHub[] = [
  {
    id: "hub-central",
    name: "Central Logistics Hub",
    code: "HUB-CEN-01",
    manager: "Anirudh Bose",
    contactNumber: "+91 98300-88112",
    address: "12 Park Street, Chowringhee, Kolkata, 700016",
    maxCapacity: 1200,
    stats: {
      activeOrders: 42,
      availableRiders: 18,
      assignedRestaurants: 34
    }
  },
  {
    id: "hub-north",
    name: "North Salt Lake Hub",
    code: "HUB-NOR-02",
    manager: "Subhashis Roy",
    contactNumber: "+91 91632-11445",
    address: "Block EP & GP, Sector V, Salt Lake City, Kolkata, 700091",
    maxCapacity: 1800,
    stats: {
      activeOrders: 89,
      availableRiders: 25,
      assignedRestaurants: 56
    }
  },
  {
    id: "hub-south",
    name: "South Kolkata Hub",
    code: "HUB-SOU-03",
    manager: "Rituparna Sen",
    contactNumber: "+91 94331-55667",
    address: "55 Gariahat Road, Ballygunge, Kolkata, 700019",
    maxCapacity: 1500,
    stats: {
      activeOrders: 65,
      availableRiders: 22,
      assignedRestaurants: 48
    }
  },
  {
    id: "hub-east",
    name: "East Kolkata Express Hub",
    code: "HUB-EAS-04",
    manager: "Dwaipayan Das",
    contactNumber: "+91 90510-77889",
    address: "Major Arterial Road, Action Area I, New Town, Kolkata, 700156",
    maxCapacity: 1000,
    stats: {
      activeOrders: 31,
      availableRiders: 15,
      assignedRestaurants: 28
    }
  },
  {
    id: "hub-west",
    name: "West Howrah Hub",
    code: "HUB-WES-05",
    manager: "Sourav Ganguly",
    contactNumber: "+91 80170-22448",
    address: "Foreshore Road, Shalimar, Howrah, 711103",
    maxCapacity: 800,
    stats: {
      activeOrders: 18,
      availableRiders: 9,
      assignedRestaurants: 15
    }
  }
];

export const MOCK_MANAGERS: LocalManager[] = [
  {
    id: "mgr-01",
    name: "Vikramjit Banerjee",
    employeeId: "EMP-MGR-2026-01",
    contactNumber: "+91 98305-11001",
    role: "City-Level Admin",
    assignedAreasCount: 2,
    email: "v.banerjee@feastflow.co"
  },
  {
    id: "mgr-02",
    name: "Arindam Chakraborty",
    employeeId: "EMP-MGR-2026-02",
    contactNumber: "+91 91634-88990",
    role: "Area Manager",
    assignedAreasCount: 1,
    email: "arindam.c@feastflow.co"
  },
  {
    id: "mgr-03",
    name: "Priyanka Mitra",
    employeeId: "EMP-MGR-2026-03",
    contactNumber: "+91 94332-66554",
    role: "Operations Manager",
    assignedAreasCount: 1,
    email: "p.mitra@feastflow.co"
  },
  {
    id: "mgr-04",
    name: "Siddharth Chatterji",
    employeeId: "EMP-MGR-2026-04",
    contactNumber: "+91 90513-44221",
    role: "Area Manager",
    assignedAreasCount: 0,
    email: "s.chatterji@feastflow.co"
  }
];

export const INITIAL_AREAS: AreaZoneConfig[] = [
  {
    id: "area-1",
    name: "Salt Lake Sector V",
    code: "EZ-KOL-700091",
    description: "Primary corporate technology park and commercial food hub. Heavy lunchtime density spikes.",
    status: "Active",
    color: "#6366f1",
    primaryPinCode: "700091",
    city: "Kolkata",
    state: "West Bengal",
    additionalPinCodes: ["700098", "700106", "700064"],
    boundaryType: "Polygon",
    points: [
      { x: 65, y: 25 },
      { x: 88, y: 22 },
      { x: 92, y: 48 },
      { x: 70, y: 55 },
      { x: 60, y: 40 }
    ],
    coverageSqKm: 12.8,
    populationEstimate: 145000,
    restaurantsCount: 56,
    ridersCount: 25,
    assignedHubId: "hub-north",
    assignedManagerId: "mgr-01",
    baseDeliveryFee: 39,
    perKmCharge: 10,
    maxDeliveryRadius: 8,
    minOrderValue: 150,
    avgDeliveryTime: 35,
    freeDeliveryThreshold: 499,
    surgePricingEnabled: true,
    peakHourMultiplier: 1.25,
    createdDate: "2026-01-10"
  },
  {
    id: "area-2",
    name: "Ballygunge & South Kolkata",
    code: "EZ-KOL-700019",
    description: "High-density premium residential zone comprising Ballygunge, Jadavpur, and Gariahat retail hubs.",
    status: "Active",
    color: "#3b82f6",
    primaryPinCode: "700019",
    city: "Kolkata",
    state: "West Bengal",
    additionalPinCodes: ["700029", "700032", "700045"],
    boundaryType: "Polygon",
    points: [
      { x: 25, y: 55 },
      { x: 50, y: 52 },
      { x: 55, y: 88 },
      { x: 30, y: 92 },
      { x: 18, y: 75 }
    ],
    coverageSqKm: 18.5,
    populationEstimate: 320000,
    restaurantsCount: 84,
    ridersCount: 38,
    assignedHubId: "hub-south",
    assignedManagerId: "mgr-02",
    baseDeliveryFee: 49,
    perKmCharge: 12,
    maxDeliveryRadius: 10,
    minOrderValue: 200,
    avgDeliveryTime: 40,
    freeDeliveryThreshold: 599,
    surgePricingEnabled: true,
    peakHourMultiplier: 1.5,
    createdDate: "2026-02-15"
  },
  {
    id: "area-3",
    name: "New Town Express Corridor",
    code: "EZ-KOL-700156",
    description: "Rapidly expanding smart residential and logistics zone. Open wide lanes supporting swift courier dispatch.",
    status: "Draft",
    color: "#10b981",
    primaryPinCode: "700156",
    city: "Kolkata",
    state: "West Bengal",
    additionalPinCodes: ["700135", "700160"],
    boundaryType: "Circle",
    circleRadius: 60,
    points: [
      { x: 78, y: 65 }
    ],
    coverageSqKm: 24.2,
    populationEstimate: 180000,
    restaurantsCount: 28,
    ridersCount: 15,
    assignedHubId: "hub-east",
    assignedManagerId: "mgr-03",
    baseDeliveryFee: 45,
    perKmCharge: 9,
    maxDeliveryRadius: 12,
    minOrderValue: 180,
    avgDeliveryTime: 30,
    freeDeliveryThreshold: 699,
    surgePricingEnabled: false,
    peakHourMultiplier: 1.0,
    createdDate: "2026-05-20"
  },
  {
    id: "area-4",
    name: "Howrah Central G.T. Road",
    code: "EZ-HOW-711101",
    description: "Chaotic heritage logistics zone comprising Shalimar stations, Kadamtala junctions, and river line crossings.",
    status: "Inactive",
    color: "#f59e0b",
    primaryPinCode: "711101",
    city: "Howrah",
    state: "West Bengal",
    additionalPinCodes: ["711102", "711103"],
    boundaryType: "Rectangle",
    points: [
      { x: 5, y: 15 },
      { x: 28, y: 15 },
      { x: 28, y: 48 },
      { x: 5, y: 48 }
    ],
    coverageSqKm: 15.1,
    populationEstimate: 290000,
    restaurantsCount: 15,
    ridersCount: 9,
    assignedHubId: "hub-west",
    assignedManagerId: "mgr-01",
    baseDeliveryFee: 59,
    perKmCharge: 15,
    maxDeliveryRadius: 6,
    minOrderValue: 250,
    avgDeliveryTime: 45,
    freeDeliveryThreshold: 799,
    surgePricingEnabled: true,
    peakHourMultiplier: 1.6,
    createdDate: "2026-03-01"
  }
];

export const MOCK_TRENDS: AreaAnalyticsTrend[] = [
  {
    id: "t-1",
    areaName: "Salt Lake Sector V",
    orders: 1450,
    revenue: 410500,
    successRate: 98.4,
    cancellationRate: 1.2,
    densityScore: 92
  },
  {
    id: "t-2",
    areaName: "Ballygunge & South Kolkata",
    orders: 2120,
    revenue: 689000,
    successRate: 97.2,
    cancellationRate: 1.8,
    densityScore: 88
  },
  {
    id: "t-3",
    areaName: "New Town Express Corridor",
    orders: 860,
    revenue: 258000,
    successRate: 99.1,
    cancellationRate: 0.6,
    densityScore: 64
  },
  {
    id: "t-4",
    areaName: "Howrah Central G.T. Road",
    orders: 450,
    revenue: 139500,
    successRate: 91.5,
    cancellationRate: 6.2,
    densityScore: 78
  }
];
