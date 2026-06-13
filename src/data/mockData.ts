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

export const INITIAL_RESTAURANTS: Restaurant[] = [];
export const INITIAL_MENU_ITEMS: MenuItem[] = [];
export const INITIAL_RIDERS: Rider[] = [];
export const INITIAL_USERS: User[] = [];
export const INITIAL_ORDERS: Order[] = [];
export const INITIAL_COUPONS: Coupon[] = [];
export const INITIAL_TICKETS: SupportTicket[] = [];
export const INITIAL_REFUNDS: RefundRequest[] = [];
export const INITIAL_ZONES: GeofencingZone[] = [];
export const INITIAL_REVIEWS: ReviewRating[] = [];
export const INITIAL_BANNERS: CMSBanner[] = [];
export const INITIAL_LOYALTY: LoyaltyConfig = {
  coinsPerHundredRs: 0,
  coinRedemptionValue: 0
};
export const INITIAL_PENALTIES: PenaltyLogic[] = [];
export const INITIAL_TAX: TaxSettings = {
  gstPercent: 0,
  serviceTaxPercent: 0,
  deliveryTaxPercent: 0
};
export const INITIAL_STAFF: StaffMember[] = [];
export const INITIAL_GLOBAL_SETTINGS: GlobalSettings = {
  forceAppUpdate: false,
  maintenanceMode: false,
  enableCOD: true,
  minOrderValue: 0
};
export const INITIAL_TRAFFIC_WEATHER: TrafficWeatherWidget = {
  location: "None",
  weather: "Sunny",
  trafficDensity: "Medium",
  temperature: 0
};
export const INITIAL_PROFILE: ProfileSecurity = {
  name: "Admin",
  email: "admin@googlydelivery.in",
  twoFactorEnabled: false,
  passwordChangedAt: new Date().toISOString()
};
