'use server';

import { createClient } from '@/lib/supabase/server';
import { profileSchema, type ProfileFormValues } from '@/lib/validation/profileSchema';
import { geocodeAddress } from '@/lib/geocoding';

export async function createProfile(data: ProfileFormValues) {
    try {
        // 1. Validate data to make sure no junk gets processed
        const parsedData = profileSchema.parse(data);

        // 2. Obtain current session
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
            throw new Error('You must be logged in to create a profile.');
        }

        // 3. Geocode the address using our server-side Google Maps utility
        // This will securely extract lat/lng and neighbourhood without exposing the API key
        const geoResult = await geocodeAddress(parsedData.raw_address);

        // 4. Construct PostGIS POINT correctly formatted for raw SQL insert
        // Format: ST_Point(longitude, latitude)
        const locationPoint = `POINT(${geoResult.longitude} ${geoResult.latitude})`;

        // 5. Insert profile
        // Note: We bypass strict ORM inserts for 'location' because it requires Postgres PostGIS casting
        const { error: insertError } = await supabase.rpc('create_profile_with_location', {
            p_id: session.user.id,
            p_full_name: parsedData.full_name,
            p_whatsapp: parsedData.whatsapp_number,
            p_raw_address: parsedData.raw_address,
            p_neighbourhood: geoResult.neighbourhood,
            p_lon: geoResult.longitude,
            p_lat: geoResult.latitude
        });

        if (insertError) {
            // Fallback if RPC doesn't exist yet, we can do a raw string interpolation for PostgREST
            const { error: fallbackError } = await supabase
                .from('profiles')
                .insert({
                    id: session.user.id,
                    full_name: parsedData.full_name,
                    whatsapp_number: parsedData.whatsapp_number,
                    raw_address: parsedData.raw_address,
                    neighbourhood: geoResult.neighbourhood,
                    location: locationPoint, // Supabase maps GeoJSON/WKT automatically in recent versions
                });

            if (fallbackError) {
                throw new Error(`Profile creation failed: ${fallbackError.message}`);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('Profile creation error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}
