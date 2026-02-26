-- Add delivery options to listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS pickup_available BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS delivery_available BOOLEAN DEFAULT FALSE;
