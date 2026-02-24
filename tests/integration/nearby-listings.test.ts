import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/discover/route';
import { NextResponse } from 'next/server';

// Mock Next Server
vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({
            status: options?.status || 200,
            json: async () => data,
        }))
    }
}));

// Mock Supabase Server Client
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));
import { createClient } from '@/lib/supabase/server';

// Mock Geolib
vi.mock('geolib', () => ({
    getDistance: vi.fn().mockReturnValue(5000), // Always return 5km (5000 meters)
}));

describe('GET /api/discover (Nearby Listings)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockRequest = (url: string) => {
        return {
            url: `http://localhost${url}`
        } as Request;
    };

    it('returns 401 Unauthorized if missing session', async () => {
        const mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: null } })
            }
        };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = createMockRequest('/api/discover?lat=12&lng=34');
        const response: any = await GET(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
        expect(response.status).toBe(401);
    });

    it('returns 400 if lat/lng are missing', async () => {
        const mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test' } } } })
            }
        };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = createMockRequest('/api/discover');
        const response: any = await GET(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Latitude and longitude are required' }, { status: 400 });
        expect(response.status).toBe(400);
    });

    it('calls RPC successfully, queries images, and maps distances successfully', async () => {
        // Setup Complex Subabase Mocks
        const mockRawRpcData = [
            {
                id: 'listing-1',
                seller_id: 'seller-1',
                title: 'Coral Test',
                price: 50,
                location: { coordinates: [18.423300, -33.924869] }
            },
            {
                id: 'listing-2',
                seller_id: 'seller-2',
                title: 'Fish Test',
                price: 150,
                // Test string parsing fallback just in case Postgis cast falls back
                location: 'POINT(18.5 -33.9)'
            }
        ];

        const mockImagesData = [
            { listing_id: 'listing-1', storage_path: 'path1.jpg' }
        ];

        const mockProfilesData = [
            { id: 'seller-1', whatsapp_number: '27820000000' }
        ];

        const mockRpc = vi.fn().mockResolvedValue({ data: mockRawRpcData, error: null });

        const mockFrom = vi.fn().mockImplementation((table) => {
            if (table === 'listing_images') {
                return {
                    select: vi.fn().mockReturnValue({
                        in: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({ data: mockImagesData })
                        })
                    })
                };
            }
            if (table === 'profiles') {
                return {
                    select: vi.fn().mockReturnValue({
                        in: vi.fn().mockResolvedValue({ data: mockProfilesData })
                    })
                };
            }
            return {};
        });

        const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: 'http://cdn/image.jpg' } });

        const mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'buyer-1' } } } })
            },
            rpc: mockRpc,
            from: mockFrom,
            storage: {
                from: vi.fn().mockReturnValue({ getPublicUrl: mockGetPublicUrl })
            }
        };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = createMockRequest('/api/discover?lat=-33.9&lng=18.4&radius=25');
        const response: any = await GET(req);

        // Core Assertions
        expect(mockRpc).toHaveBeenCalledWith('nearby_listings', {
            user_lat: -33.9,
            user_lng: 18.4,
            radius_km: 25,
            filter_category: null
        });

        // Ensure Response is bundled properly with distance calculation attached natively
        const responseData = await response.json();

        expect(NextResponse.json).toHaveBeenCalled();
        expect(response.status).toBe(200);

        // Assert grouping and structural mapping logic
        expect(responseData.data).toHaveLength(2);

        // Assert listing-1 properties
        const l1 = responseData.data.find((l: any) => l.id === 'listing-1');
        expect(l1.images).toEqual(['http://cdn/image.jpg']);
        expect(l1.seller_whatsapp).toBe('27820000000');
        expect(l1.distance_km).toBe(5); // Simulated by our geolib mock

        // Assert listing-2 properties (Missing fields are handled correctly)
        const l2 = responseData.data.find((l: any) => l.id === 'listing-2');
        expect(l2.images).toEqual([]); // Fallback
        expect(l2.seller_whatsapp).toBe(''); // Fallback empty
        expect(l2.distance_km).toBe(5); // Simulated
    });
});
