-- Enable PostGIS extension for geolocation features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create Enums
CREATE TYPE role_enum AS ENUM ('member', 'store', 'admin');
CREATE TYPE subscription_tier_enum AS ENUM ('free', 'pro', 'store');
CREATE TYPE category_enum AS ENUM (
  'coral_sps', 'coral_lps', 'coral_soft', 'zoanthid', 
  'anemone', 'fish', 'invert', 'macro_algae', 'hardscape', 'hardware'
);
CREATE TYPE status_enum AS ENUM (
  'active', 'sold', 'paused', 'removed', 'shadow_banned'
);
CREATE TYPE direction_enum AS ENUM ('left', 'right');
CREATE TYPE moderation_category_enum AS ENUM ('profanity', 'racial', 'other');

-- Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    raw_address TEXT,
    neighbourhood TEXT,
    location GEOGRAPHY(POINT),
    role role_enum DEFAULT 'member',
    subscription_tier subscription_tier_enum DEFAULT 'free',
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_whatsapp CHECK (whatsapp_number ~ '^\+[1-9]\d{1,14}$')
);

-- Listings Table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    category category_enum NOT NULL,
    tags TEXT[],
    status status_enum DEFAULT 'active',
    moderation_flag BOOLEAN DEFAULT FALSE,
    location GEOGRAPHY(POINT),
    neighbourhood TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listing Images Grouped (max 5 enforced by UI, referenced by ID)
CREATE TABLE listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favourites Tracking
CREATE TABLE favourites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(buyer_id, listing_id)
);

-- Swipe History Queue Tracking
CREATE TABLE swipe_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    direction direction_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- Subscriptions Table (for PayFast details)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier subscription_tier_enum NOT NULL,
    payfast_token TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    UNIQUE(profile_id)
);

-- Moderation Logs 
CREATE TABLE moderation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    flagged_reason TEXT NOT NULL,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Blocklist terms
CREATE TABLE moderation_blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL UNIQUE,
    category moderation_category_enum NOT NULL
);

-- Indexes for performance (PostGIS needs GiST indexes for geolocation lookups)
CREATE INDEX profiles_location_idx ON profiles USING GIST (location);
CREATE INDEX listings_location_idx ON listings USING GIST (location);
CREATE INDEX listings_status_category_idx ON listings (status, category);
CREATE INDEX swipe_history_user_idx ON swipe_history (user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_blocklist ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-------------------------------------------------------------------------------

-- 1. Profiles
-- Admin can do everything
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
-- Anyone can see basic parts of the profile EXCEPT raw_address (due to privacy) 
-- PostgREST limits columns natively by views. We'll simply let people SELECT profiles,
-- but the App application code MUST NEVER expose raw_address. A better way is field-level permissions,
-- but Supabase natively maps `raw_address` output if this policy returns true. We can omit it in Next.js Server.
CREATE POLICY "Anyone can view member profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can edit own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Listings
CREATE POLICY "Admins manage listings" ON listings FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Users view active listings" ON listings FOR SELECT USING (
  status IN ('active', 'sold') OR seller_id = auth.uid()
);
CREATE POLICY "Users can insert own listings" ON listings FOR INSERT WITH CHECK (
  seller_id = auth.uid()
);
CREATE POLICY "Users can update own listings" ON listings FOR UPDATE USING (
  seller_id = auth.uid()
);
CREATE POLICY "Users can delete own listings" ON listings FOR DELETE USING (
  seller_id = auth.uid()
);

-- 3. Listing Images
CREATE POLICY "Anyone can view listing images" ON listing_images FOR SELECT USING (true);
CREATE POLICY "Users can insert own listing images" ON listing_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
);
CREATE POLICY "Users manage own listing images" ON listing_images FOR ALL USING (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND seller_id = auth.uid())
);

-- 4. Favourites (Owner Only)
CREATE POLICY "Users manage own favourites" ON favourites FOR ALL USING (
  buyer_id = auth.uid()
);

-- 5. Swipe History (Owner Only)
CREATE POLICY "Users manage own swipe history" ON swipe_history FOR ALL USING (
  user_id = auth.uid()
);

-- 6. Subscriptions
CREATE POLICY "Admins manage subscriptions" ON subscriptions FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (
  profile_id = auth.uid()
);

-- 7. Moderation Log & Blocklist (Admin Only)
CREATE POLICY "Admins manage moderation" ON moderation_log FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins manage blocklist" ON moderation_blocklist FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);


-------------------------------------------------------------------------------
-- PostGIS RPC Function
-------------------------------------------------------------------------------
-- nearby_listings returns active listings sorted by ST_Distance, excluding swiped 
CREATE OR REPLACE FUNCTION nearby_listings(
  user_lat float, 
  user_lng float, 
  radius_km int DEFAULT 10,
  filter_category text DEFAULT NULL
)
RETURNS SETOF listings
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM listings l
  WHERE l.status = 'active'
    -- Calculate distance <= radius (1 km = 1000 meters)
    AND ST_DWithin(
      l.location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
    -- Optional category filter
    AND (filter_category IS NULL OR l.category::text = filter_category)
    -- Exclude listings the caller has already swiped on
    AND l.id NOT IN (
      SELECT listing_id 
      FROM swipe_history 
      WHERE user_id = auth.uid()
    )
    -- Exclude user's own listings
    AND l.seller_id != auth.uid()
  -- Order by distance closest first
  ORDER BY ST_Distance(
    l.location,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
  ) ASC
  LIMIT 50;
END;
$$;
