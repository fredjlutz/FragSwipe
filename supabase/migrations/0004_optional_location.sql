-- Update nearby_listings to handle NULL coordinates for global feed fallback
CREATE OR REPLACE FUNCTION nearby_listings(
  user_lat float DEFAULT NULL, 
  user_lng float DEFAULT NULL, 
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
    -- Only apply distance filter if coordinates are provided
    AND (
      (user_lat IS NULL OR user_lng IS NULL) 
      OR 
      ST_DWithin(
        l.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
        radius_km * 1000
      )
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
  -- Order by distance if coords exist, otherwise by recency
  ORDER BY 
    CASE WHEN user_lat IS NOT NULL AND user_lng IS NOT NULL 
      THEN ST_Distance(
        l.location,
        ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
      ) 
      ELSE NULL 
    END ASC,
    l.created_at DESC
  LIMIT 50;
END;
$$;
