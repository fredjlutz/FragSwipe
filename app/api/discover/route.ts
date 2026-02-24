import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

        if (!latStr || !lngStr) {
            return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
        }

        const userLat = parseFloat(latStr);
        const userLng = parseFloat(lngStr);
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
            throw new Error('Failed to fetch nearby listings');
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
                .select('id, whatsapp_number')
                .in('id', sellerIds)
        ]);

        const imagesData = imagesRes.data;
        const profilesData = profilesRes.data || [];

        // Group images by listing ID
        const imagesMap: Record<string, string[]> = {};
        if (imagesData) {
            imagesData.forEach((img: { listing_id: string; storage_path: string }) => {
                if (!imagesMap[img.listing_id]) imagesMap[img.listing_id] = [];
                const { data } = supabase.storage.from('listing_images').getPublicUrl(img.storage_path);
                imagesMap[img.listing_id].push(data.publicUrl);
            });
        }

        const whatsappMap: Record<string, string> = {};
        profilesData.forEach((p: { id: string; whatsapp_number: string }) => {
            whatsappMap[p.id] = p.whatsapp_number;
        });

        // 3. SECURE MAPPING
        const mappedListings = rawListings.map((listing: { id: string; seller_id: string; title: string; description: string; price: number; category: string; tags: string[]; neighbourhood: string; location: string | { coordinates: [number, number] } | null; created_at: string; }) => {
            let calcDistance = 0;
            let targetLat = userLat;
            let targetLng = userLng;

            if (listing.location) {
                if (typeof listing.location === 'string') {
                    const match = listing.location.match(/[-\d\.]+/g);
                    if (match && match.length >= 2) {
                        targetLng = parseFloat(match[0]);
                        targetLat = parseFloat(match[1]);
                    }
                } else if (listing.location.coordinates) {
                    targetLng = listing.location.coordinates[0];
                    targetLat = listing.location.coordinates[1];
                }
            }

            const distanceMeters = getDistance(
                { latitude: userLat, longitude: userLng },
                { latitude: targetLat, longitude: targetLng }
            );
            calcDistance = Math.round(distanceMeters / 1000 * 10) / 10;

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
                created_at: listing.created_at
            };
        });

        return NextResponse.json({ data: mappedListings });

    } catch (error: unknown) {
        console.error('Discover API error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
