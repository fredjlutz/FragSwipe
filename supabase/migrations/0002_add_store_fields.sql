-- Add specific fields for the 'store' subscription tier to the profiles table
-- This allows stores to have public pages (e.g., fragswipe.co.za/stores/my-store-handle)

ALTER TABLE profiles
ADD COLUMN handle TEXT UNIQUE, -- e.g. "coral-kings"
ADD COLUMN store_logo TEXT,
ADD COLUMN store_banner TEXT,
ADD COLUMN store_description TEXT;

-- Index on handle for fast public routing
CREATE INDEX IF NOT EXISTS profiles_handle_idx ON profiles (handle);

-- Security Note:
-- The existing RLS policy "Users can update own profile" on `profiles` 
-- inherently allows the user to update these new columns when managing their store dashboard.
