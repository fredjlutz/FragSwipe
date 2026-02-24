import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/listings/create/route';
import { NextResponse } from 'next/server';

// Let's mock the Next/Server module manually
vi.mock('next/server', () => {
    return {
        NextResponse: {
            json: vi.fn((data, options) => ({
                status: options?.status || 200,
                json: async () => data,
            }))
        }
    };
});

// We need to mock the Supabase client creation
vi.mock('@/lib/supabase/server', () => {
    return {
        createClient: vi.fn(),
    };
});

import { createClient } from '@/lib/supabase/server';

describe('POST /api/listings/create', () => {
    const mockSession = { user: { id: 'user-123' } };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 Unauthorized if missing session', async () => {
        const mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: null } })
            }
        };
        (createClient as any).mockReturnValue(mockSupabase);

        const mockRequest = { json: vi.fn() } as any;
        const response: any = await POST(mockRequest);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
        expect(response.status).toBe(401);
    });

    it('returns 400 for structural payload validation failure via Zod', async () => {
        const mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
            }
        };
        (createClient as any).mockReturnValue(mockSupabase);

        const mockRequest = {
            json: vi.fn().mockResolvedValue({
                // Missing required fields like 'title', 'price'
                category: 'invalid_cat'
            })
        } as any;
        const response: any = await POST(mockRequest);

        // Expect Zod issues list to be caught and returned as status 400
        expect(NextResponse.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.any(Array) }),
            { status: 400 }
        );
    });

    it('returns 403 when user subscription limit is exceeded', async () => {
        // Construct the chained supabase calls
        const mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
            },
            from: vi.fn()
        };
        (createClient as any).mockReturnValue(mockSupabase);

        // First DB call: Select profile (mock user is free tier)
        const mockSelectSingle = vi.fn().mockResolvedValue({
            data: { subscription_tier: 'free', neighbourhood: 'Cape Town' }
        });

        // Second DB call: Select active listings count (mock user currently has 10 active)
        const mockSelectCount = vi.fn().mockResolvedValue({
            count: 10, error: null
        });

        const profilesChain = { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSelectSingle }) }) };
        const listingsChain = {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: mockSelectCount
                })
            })
        };

        mockSupabase.from.mockImplementation((table) => {
            if (table === 'profiles') return profilesChain;
            if (table === 'listings') return listingsChain;
            return {};
        });

        const mockBody = {
            title: 'Sample Listing',
            description: 'My description is long enough to pass zod validation.',
            price: 500,
            category: 'fish'
        };
        const mockRequest = { json: vi.fn().mockResolvedValue(mockBody) } as any;

        const response: any = await POST(mockRequest);

        expect(NextResponse.json).toHaveBeenCalledWith(
            { error: 'Upgrade your plan to add more listings' },
            { status: 403 }
        );
    });

    it('returns 200 with new listing ID on successful insertion', async () => {
        // Construct the chained supabase calls
        const mockSupabase = {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } })
            },
            from: vi.fn()
        };
        (createClient as any).mockReturnValue(mockSupabase);

        // First DB call: Select profile (mock user is free tier)
        const mockSelectSingle = vi.fn().mockResolvedValue({
            data: { subscription_tier: 'pro', neighbourhood: 'Cape Town', location: 'test-point' }
        });

        // Second DB call: Select active listings count (mock user currently has 1 active)
        const mockSelectCount = vi.fn().mockResolvedValue({
            count: 1, error: null
        });

        // Third DB call: Insert
        const mockInsertSingle = vi.fn().mockResolvedValue({
            data: { id: 'new-listing-uuid' }, error: null
        });

        const profilesChain = { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSelectSingle }) }) };

        // Ensure listings chain behaves correctly whether queried for SELECT count or INSERT creation
        const listingsChain = {
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: mockSelectCount
                })
            }),
            insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: mockInsertSingle
                })
            })
        };

        mockSupabase.from.mockImplementation((table) => {
            if (table === 'profiles') return profilesChain;
            if (table === 'listings') return listingsChain;
            return {};
        });

        const mockBody = {
            title: 'Valid New Listing',
            description: 'My description is long enough to pass zod validation nicely.',
            price: 1500,
            category: 'coral_lps',
            tags: ['lps']
        };
        const mockRequest = { json: vi.fn().mockResolvedValue(mockBody) } as any;

        const response: any = await POST(mockRequest);

        const json = await response.json();
        expect(response.status).toBe(200);
        expect(json).toEqual({ data: { id: 'new-listing-uuid' } });

        // Verify insert payload grabs the profile's geographical locations
        expect(listingsChain.insert).toHaveBeenCalledWith(expect.objectContaining({
            seller_id: 'user-123',
            status: 'active',
            location: 'test-point',
            neighbourhood: 'Cape Town'
        }));
    });
});
