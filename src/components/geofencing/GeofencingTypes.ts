import { MapPoint } from "../../types";

export interface DeliveryHub {
  id: string;
  name: string;
  code: string;
  manager: string;
  contactNumber: string;
  address: string;
  maxCapacity: number;
  stats: {
    activeOrders: number;
    availableRiders: number;
    assignedRestaurants: number;
  };
}

export interface LocalManager {
  id: string;
  name: string;
  employeeId: string;
  contactNumber: string;
  role: "City-Level Admin" | "Area Manager" | "Operations Manager";
  assignedAreasCount: number;
  email: string;
}

export interface AreaZoneConfig {
  id: string;
  name: string;
  code: string;
  description: string;
  status: "Active" | "Inactive" | "Draft";
  color: string;
  
  // Pin code mappings
  primaryPinCode: string;
  city: string;
  state: string;
  additionalPinCodes: string[];

  // Geofence specs
  boundaryType: "Polygon" | "Circle" | "Rectangle" | "Restricted" | "No-Service";
  points: MapPoint[]; // relative percent on map grid
  circleRadius?: number; // for circle boundary
  
  // Real-time parsed metrics
  coverageSqKm: number;
  populationEstimate: number;
  restaurantsCount: number;
  ridersCount: number;

  // Assignment links
  assignedHubId: string;
  assignedManagerId: string;

  // Pricing & service settings
  baseDeliveryFee: number;
  perKmCharge: number;
  maxDeliveryRadius: number;
  minOrderValue: number;
  avgDeliveryTime: number; // in mins
  freeDeliveryThreshold: number;
  surgePricingEnabled: boolean;
  peakHourMultiplier: number; // e.g. 1.2x, 1.5x
  
  createdDate: string;
}

export interface AreaAnalyticsTrend {
  id: string;
  areaName: string;
  orders: number;
  revenue: number;
  successRate: number; // percent
  cancellationRate: number; // percent
  densityScore: number; // scale 1-100
}
