import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { getDistance } from 'geolib';

export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const latStr = searchParams.get('lat');
        const lngStr = searchParams.get('lng');
        const radiusStr = searchParams.get('radius') || '10';
        const categoryStr = searchParams.get('category');

        const userLatDevice = latStr ? parseFloat(latStr) : null;
        const userLngDevice = lngStr ? parseFloat(lngStr) : null;

        // Fetch user profile location as primary source of truth
        const { data: profile } = await supabase
            .from('profiles')
            .select('location')
            .eq('id', session.user.id)
            .single();

        let userLat = userLatDevice;
        let userLng = userLngDevice;

        // If profile has a location registered, prefer it over device GPS to prevent work/travel discrepancies
        if (profile?.location && typeof profile.location === 'string') {
            try {
                const buf = Buffer.from(profile.location, 'hex');
                if (buf.length === 25) {
                    userLng = buf.readDoubleLE(9);
                    userLat = buf.readDoubleLE(17);
                }
            } catch (e) {
                console.error("Failed to parse profile EWKB location", e);
            }
        }

        if (userLat === null || userLng === null) {
            return NextResponse.json({ error: 'Location required to discover listings' }, { status: 400 });
        }

        const radiusKm = parseInt(radiusStr, 10);

        // 1. Execute PostGIS RPC to fetch listings
        const { data: rawListings, error: rpcError } = await supabase.rpc('nearby_listings', {
            user_lat: userLat,
            user_lng: userLng,
            radius_km: radiusKm,
            filter_category: categoryStr || null
        });

        if (rpcError) {
            console.error('RPC Error:', rpcError);
            throw new Error('Failed to fetch listings');
        }

        if (!rawListings || rawListings.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // 2. Fetch images and seller WhatsApp numbers
        const listingIds = rawListings.map((l: { id: string }) => l.id);
        const sellerIds = [...new Set(rawListings.map((l: { seller_id: string }) => l.seller_id))];

        const [imagesRes, profilesRes] = await Promise.all([
            supabase
                .from('listing_images')
                .select('listing_id, storage_path')
                .in('listing_id', listingIds)
                .order('display_order', { ascending: true }),
            supabase
                .from('profiles')
                .select('id, whatsapp_number, full_name')
                .in('id', sellerIds)
        ]);

        const imagesData = imagesRes.data;
        const profilesData = profilesRes.data || [];

        // Group images by listing ID
        const imagesMap: Record<string, string[]> = {};
        if (imagesData) {
            imagesData.forEach((img: { listing_id: string; storage_path: string }) => {
                if (!imagesMap[img.listing_id]) imagesMap[img.listing_id] = [];
                if (img.storage_path.startsWith('http')) {
                    imagesMap[img.listing_id].push(img.storage_path);
                } else {
                    const { data } = supabase.storage.from('listing_images').getPublicUrl(img.storage_path);
                    imagesMap[img.listing_id].push(data.publicUrl);
                }
            });
        }

        const whatsappMap: Record<string, string> = {};
        const nameMap: Record<string, string> = {};
        profilesData.forEach((p: { id: string; whatsapp_number: string; full_name: string }) => {
            whatsappMap[p.id] = p.whatsapp_number;
            nameMap[p.id] = p.full_name;
        });

        // 3. SECURE MAPPING
        const mappedListings = rawListings.map((listing: { id: string; seller_id: string; title: string; description: string; price: number; category: string; tags: string[]; neighbourhood: string; location: string | { coordinates: [number, number] } | null; pickup_available: boolean; delivery_available: boolean; created_at: string; }) => {
            let calcDistance = 0;
            let targetLat = 0;
            let targetLng = 0;
            let coordinatesAvailable = false;

            if (listing.location) {
                if (typeof listing.location === 'string') {
                    // Correctly decode PostGIS EWKB (Extended Well-Known Binary)
                    try {
                        const buf = Buffer.from(listing.location, 'hex');
                        // Byte length for a standard 2D Point in PostGIS is 25 bytes
                        if (buf.length >= 25) {
                            targetLng = buf.readDoubleLE(9);
                            targetLat = buf.readDoubleLE(17);
                            coordinatesAvailable = true;
                        }
                    } catch (e) {
                        console.error("Failed to parse geography location", e);
                    }
                } else if (listing.location.coordinates) {
                    targetLng = listing.location.coordinates[0];
                    targetLat = listing.location.coordinates[1];
                    coordinatesAvailable = true;
                }
            }

            if (coordinatesAvailable && userLat !== null && userLng !== null) {
                const distanceMeters = getDistance(
                    { latitude: userLat, longitude: userLng },
                    { latitude: targetLat, longitude: targetLng }
                );
                calcDistance = Math.round(distanceMeters / 1000 * 10) / 10;
            }

            // Only return whitelisted safe fields
            return {
                id: listing.id,
                seller_id: listing.seller_id,
                title: listing.title,
                description: listing.description,
                price: listing.price,
                category: listing.category,
                tags: listing.tags,
                neighbourhood: listing.neighbourhood,
                distance_km: calcDistance,
                images: imagesMap[listing.id] || [],
                seller_whatsapp: whatsappMap[listing.seller_id] || '',
                seller_name: nameMap[listing.seller_id] || 'Unknown Seller',
                pickup_available: listing.pickup_available ?? true,
                delivery_available: listing.delivery_available ?? false,
                created_at: listing.created_at
            };
        });

        return NextResponse.json({ data: mappedListings });

    } catch (error: unknown) {
        console.error('Discover API error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
