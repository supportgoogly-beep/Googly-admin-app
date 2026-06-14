-- ==========================================
-- 0. CLEANUP & EXTENSIONS SETUP
-- ==========================================
-- पुराने सभी टेबल्स को डिलीट करने के लिए (ताकि कोई पुराना कॉन्फ्लिक्ट न रहे)
DROP TABLE IF EXISTS public.app_settings, public.admin_logs, public.staff_permissions, public.city_staff, public.loyalty_ledger, public.loyalty_settings, public.penalty_policies, public.cms_banners, public.reviews, public.refund_requests, public.payout_settlements, public.payouts_ledger, public.global_commissions, public.tickets_chat, public.support_tickets, public.push_notifications, public.coupons_restaurants, public.coupons, public.surge_zones, public.surge_settings, public.orders, public.order_status_logs, public.rider_locations, public.rider_documents, public.riders, public.menu_items, public.menu_categories, public.restaurant_documents, public.restaurants, public.zones, public.areas, public.cities, public.profiles, public.user_addresses CASCADE;

-- UUID और Geospatial (Map) सपोर्ट के लिए Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA public;

-- ==========================================
-- 1. LOCATION & CITIES MANAGEMENT
-- ==========================================
-- 1. Cities Table (आपका ओरिजिनल टेबल + सिटी प्रीफिक्स)
CREATE TABLE public.cities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  pincode_prefix TEXT NOT NULL DEFAULT '', -- आपके शहर-वार फिल्टर के लिए
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Areas Table (आपका ओरिजिनल टेबल - सिटी से कनेक्टेड)
CREATE TABLE public.areas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pincode TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_pincode_in_area UNIQUE (pincode)
);
CREATE INDEX idx_areas_city_id ON public.areas(city_id);

-- 3. Operational Delivery Zones (OSM Geofencing के लिए)
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  boundary GEOMETRY(Polygon, 4326), -- OpenStreetMap बाउंड्री स्टोर करने के लिए
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. USER PROFILES & ROLES SYSTEM
-- ==========================================
-- 4. User Profiles (आपका ओरिजिनल टेबल + रोल और वॉलेट सपोर्ट)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID, -- For linking with Supabase auth OR Firebase UID mappings
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'customer', -- 'owner', 'staff', 'rider', 'customer', 'merchant'
  wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_type TEXT DEFAULT 'Home', 
  address_text TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,  -- OSM Map Coordinates
  longitude DOUBLE PRECISION NOT NULL
);

-- ==========================================
-- 3. RESTAURANT & DOCUMENT MANAGEMENT
-- ==========================================
CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Merchant User
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- KDS Settings (Feature 14)
  auto_accept_orders BOOLEAN DEFAULT FALSE,
  voice_alerts_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- रेस्टोरेंट डाक्यूमेंट्स और बैंक डिटेल्स (Feature 3 Step 3 & 4)
CREATE TABLE public.restaurant_documents (
  restaurant_id UUID PRIMARY KEY REFERENCES public.restaurants(id) ON DELETE CASCADE,
  fssai_number TEXT,
  fssai_doc_url TEXT, -- Supabase Storage Link
  gst_number TEXT,
  pan_card_url TEXT,
  kyc_doc_url TEXT,
  bank_name TEXT,
  bank_account_no TEXT,
  bank_ifsc TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  is_veg BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  addons_config JSONB DEFAULT '[]'::jsonb, -- Add-ons Configuration (Feature 4)
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. DELIVERY PARTNER (RIDER) & LIVE LOCATION
-- ==========================================
CREATE TABLE public.riders (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  vehicle_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL, 
  current_status TEXT DEFAULT 'Offline', -- 'Online', 'Offline', 'On-Delivery'
  wallet_balance NUMERIC(10, 2) DEFAULT 0.00,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- राइडर के सारे डाक्यूमेंट्स (KYC Verification)
CREATE TABLE public.rider_documents (
  rider_id UUID PRIMARY KEY REFERENCES public.riders(id) ON DELETE CASCADE,
  driving_license_no TEXT,
  dl_image_url TEXT,
  aadhaar_number TEXT,
  aadhaar_front_url TEXT,
  aadhaar_back_url TEXT,
  pan_number TEXT,
  pan_card_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Riders Live Location tracking for OSM Map (Feature 5, 7)
CREATE TABLE public.rider_locations (
  rider_id UUID PRIMARY KEY REFERENCES public.riders(id) ON DELETE CASCADE,
  location GEOMETRY(Point, 4326), 
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. CITY-WISE STAFF & ROLE ACCESS CONTROL (RBAC)
-- ==========================================
CREATE TABLE public.city_staff (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE, -- सिटी वाइज एंप्लॉयी
  designation TEXT NOT NULL, -- 'City Manager', 'Support Staff', 'Sub-Admin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- स्टाफ को मॉड्यूल के हिसाब से विशिष्ट परमिशन (Feature 21)
CREATE TABLE public.staff_permissions (
  staff_id UUID REFERENCES public.city_staff(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL, -- 'Dashboard', 'Orders', 'Payouts', 'CRM', etc.
  can_view BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (staff_id, module_name)
);

-- ==========================================
-- 6. ORDERS, SURGE & DISPATCH SYSTEM
-- ==========================================
CREATE TABLE public.surge_settings (
  id INT PRIMARY KEY DEFAULT 1,
  is_surge_enabled BOOLEAN DEFAULT FALSE,
  surge_multiplier NUMERIC(3, 2) DEFAULT 1.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.surge_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE
);

-- 5. Orders Table (आपका ओरिजिनल टेबल + राइडर, रेस्टोरेंट और बिल ब्रेकअप के साथ अपग्रेड किया हुआ)
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  area_id UUID REFERENCES public.areas(id),
  restaurant_id UUID REFERENCES public.restaurants(id),
  rider_id UUID REFERENCES public.riders(id),
  zone_id UUID REFERENCES public.zones(id),
  city_id UUID REFERENCES public.cities(id),
  
  status TEXT DEFAULT 'pending', -- 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
  order_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  sub_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  delivery_charge NUMERIC(10,2) DEFAULT 0.00,
  surge_charge NUMERIC(10,2) DEFAULT 0.00,
  coupon_discount NUMERIC(10,2) DEFAULT 0.00,
  tax_amount NUMERIC(10,2) DEFAULT 0.00,
  grand_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  
  payment_mode TEXT DEFAULT 'COD', 
  payment_status TEXT DEFAULT 'Unpaid',
  cancel_reason TEXT, -- कैंसिलेशन का कारण (Feature 2)
  
  dest_latitude DOUBLE PRECISION,
  dest_longitude DOUBLE PRECISION,
  
  auto_assign_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_area_id ON public.orders(area_id);

CREATE TABLE public.order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. COUPONS, PAYOUTS, EARNINGS & REFUNDS
-- ==========================================
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  discount_type TEXT NOT NULL, 
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_value NUMERIC(10, 2) DEFAULT 0.00,
  max_discount NUMERIC(10, 2),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.coupons_restaurants (
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, restaurant_id)
);

CREATE TABLE public.global_commissions (
  id INT PRIMARY KEY DEFAULT 1,
  restaurant_commission_pct NUMERIC(5, 2) DEFAULT 10.00,
  rider_commission_pct NUMERIC(5, 2) DEFAULT 10.00
);

CREATE TABLE public.payouts_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'restaurant' or 'rider'
  entity_id UUID NOT NULL, 
  order_id UUID REFERENCES public.orders(id),
  amount_owed NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'credit' (earning) or 'debit' (payout)
  status TEXT DEFAULT 'Pending', 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payout_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, 
  batch_amount NUMERIC(12, 2) NOT NULL,
  status TEXT DEFAULT 'Initiated', 
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'Pending', 
  reject_reason TEXT, 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. CRM, REVIEWS, CMS & NOTIFICATIONS
-- ==========================================
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'Open', 
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tickets_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  restaurant_rating INT CHECK (restaurant_rating BETWEEN 1 AND 5),
  rider_rating INT CHECK (rider_rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_hidden_frontend BOOLEAN DEFAULT FALSE, -- Feature 16
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Push Notifications Table (आपका ओरिजिनल टेबल अपग्रेड किया हुआ)
CREATE TABLE public.push_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL, -- आपका body कॉलम
  image_url TEXT, -- रिच नोटिफिकेशन के लिए इमेज यूआरएल
  type TEXT CHECK (type IN ('gmail', 'sms', 'push')), 
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_id ON public.push_notifications(user_id);

CREATE TABLE public.cms_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  redirection_link TEXT, 
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. REWARDS, POLICIES & GLOBAL SETTINGS
-- ==========================================
CREATE TABLE public.loyalty_settings (
  id INT PRIMARY KEY DEFAULT 1,
  rupees_per_coin NUMERIC(10, 2) DEFAULT 100.00,
  coins_rewarded INT DEFAULT 10
);

CREATE TABLE public.loyalty_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coins INT NOT NULL, 
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.penalty_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cancel_after_minutes INT NOT NULL,
  penalty_percentage NUMERIC(5, 2) NOT NULL,
  applicable_to TEXT NOT NULL 
);

CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  force_app_update BOOLEAN DEFAULT FALSE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  enable_cod BOOLEAN DEFAULT TRUE,
  gst_percentage NUMERIC(5, 2) DEFAULT 5.00,
  delivery_tax_percentage NUMERIC(5, 2) DEFAULT 2.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.profiles(id),
  action_performed TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 10. ROW LEVEL SECURITY (RLS) ENABLE & POLICIES
-- ==========================================
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
-- बाकी रिक्वायर्ड एडवांस्ड टेबल्स पर भी RLS ऑन करने के लिए:
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

-- 10.1 Policies for Cities
DROP POLICY IF EXISTS "Allow public read access to cities" ON public.cities;
DROP POLICY IF EXISTS "Allow public insert access to cities" ON public.cities;
DROP POLICY IF EXISTS "Allow public update access to cities" ON public.cities;
DROP POLICY IF EXISTS "Allow public delete access to cities" ON public.cities;

CREATE POLICY "Allow public read access to cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to cities" ON public.cities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to cities" ON public.cities FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to cities" ON public.cities FOR DELETE USING (true);

-- 10.2 Policies for Areas
DROP POLICY IF EXISTS "Allow public read access to areas" ON public.areas;
DROP POLICY IF EXISTS "Allow public insert access to areas" ON public.areas;
DROP POLICY IF EXISTS "Allow public update access to areas" ON public.areas;
DROP POLICY IF EXISTS "Allow public delete access to areas" ON public.areas;

CREATE POLICY "Allow public read access to areas" ON public.areas FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to areas" ON public.areas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to areas" ON public.areas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to areas" ON public.areas FOR DELETE USING (true);

-- 10.3 Policies for Profiles
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public delete access to profiles" ON public.profiles;

CREATE POLICY "Allow public read access to profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to profiles" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to profiles" ON public.profiles FOR DELETE USING (true);

-- 10.4 Policies for Orders
DROP POLICY IF EXISTS "Allow public read access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public delete access to orders" ON public.orders;

CREATE POLICY "Allow public read access to orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to orders" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to orders" ON public.orders FOR DELETE USING (true);

-- 10.5 Policies for Push Notifications
DROP POLICY IF EXISTS "Allow public read access to push_notifications" ON public.push_notifications;
DROP POLICY IF EXISTS "Allow public insert access to push_notifications" ON public.push_notifications;
DROP POLICY IF EXISTS "Allow public update access to push_notifications" ON public.push_notifications;
DROP POLICY IF EXISTS "Allow public delete access to push_notifications" ON public.push_notifications;

CREATE POLICY "Allow public read access to push_notifications" ON public.push_notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to push_notifications" ON public.push_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to push_notifications" ON public.push_notifications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to push_notifications" ON public.push_notifications FOR DELETE USING (true);

-- 10.6 Policies for Restaurants
DROP POLICY IF EXISTS "Allow public read access to restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow public insert access to restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow public update access to restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow public delete access to restaurants" ON public.restaurants;

CREATE POLICY "Allow public read access to restaurants" ON public.restaurants FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to restaurants" ON public.restaurants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to restaurants" ON public.restaurants FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to restaurants" ON public.restaurants FOR DELETE USING (true);

-- 10.7 Policies for Riders
DROP POLICY IF EXISTS "Allow public read access to riders" ON public.riders;
DROP POLICY IF EXISTS "Allow public insert access to riders" ON public.riders;
DROP POLICY IF EXISTS "Allow public update access to riders" ON public.riders;
DROP POLICY IF EXISTS "Allow public delete access to riders" ON public.riders;

CREATE POLICY "Allow public read access to riders" ON public.riders FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to riders" ON public.riders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to riders" ON public.riders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access to riders" ON public.riders FOR DELETE USING (true);

-- ==========================================
-- 11. ENABLE SUPABASE REAL-TIME REPLICATION
-- ==========================================
-- Added core operational tables to real-time publication for live dashboard updates
DO $$
BEGIN
  -- We just try to add the tables to the publication. If they are already there, we catch the exception and do nothing
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cities;
EXCEPTION WHEN OTHERS THEN END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.areas; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.zones; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurants; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.riders; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets_chat; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items; EXCEPTION WHEN OTHERS THEN END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN OTHERS THEN END $$;
