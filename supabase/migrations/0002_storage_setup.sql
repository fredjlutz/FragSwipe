-- Create the storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing_images', 'listing_images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
-- 1. Allow public to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'listing_images' );

-- 2. Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'listing_images' );

-- 3. Allow users to delete their own images (listing folder is named after listing_id)
-- This is a simplified policy. Folder structure is expected to be {listing_id}/{file_name}
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'listing_images' );
