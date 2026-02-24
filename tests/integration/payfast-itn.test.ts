import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/payfast/itn/route';
import { NextResponse } from 'next/server';

// Mock verifyITNSignature
vi.mock('@/lib/payfast', () => ({
    verifyITNSignature: vi.fn(),
}));

// Mock createAdminClient
vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn(),
}));

import { verifyITNSignature } from '@/lib/payfast';
import { createAdminClient } from '@/lib/supabase/admin';

// Re-mock NextResponse
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

describe('POST /api/payfast/itn', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createMockFormDataRequest = (data: Record<string, string>, headers: Record<string, string> = {}) => {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => formData.append(key, value));

        return {
            formData: vi.fn().mockResolvedValue(formData),
            headers: {
                get: (key: string) => headers[key] || null,
            }
        } as unknown as Request;
    };

    it('returns 400 for structural signature mismatch', async () => {
        (verifyITNSignature as any).mockReturnValue(false);

        const req = createMockFormDataRequest({ payment_status: 'COMPLETE' });
        const response: any = await POST(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Signature mismatch' }, { status: 400 });
        expect(response.status).toBe(400);
    });

    it('returns 200 OK quietly for non-COMPLETE payment statuses', async () => {
        (verifyITNSignature as any).mockReturnValue(true);

        const req = createMockFormDataRequest({ payment_status: 'PENDING' });
        const response: any = await POST(req);

        expect(response.status).toBe(200);
        // Supabase should not have been called
        expect(createAdminClient).not.toHaveBeenCalled();
    });

    it('returns 400 for amount mismatch (Pro tier requires >= 29)', async () => {
        (verifyITNSignature as any).mockReturnValue(true);

        const req = createMockFormDataRequest({
            payment_status: 'COMPLETE',
            custom_str1: 'user-123',
            custom_str2: 'pro',
            amount_gross: '28.00' // Too low (fraud attempt)
        });

        const response: any = await POST(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Amount mismatch' }, { status: 400 });
    });

    it('returns 400 for amount mismatch (Store tier requires >= 99)', async () => {
        (verifyITNSignature as any).mockReturnValue(true);

        const req = createMockFormDataRequest({
            payment_status: 'COMPLETE',
            custom_str1: 'user-123',
            custom_str2: 'store',
            amount_gross: '98.99' // Too low
        });

        const response: any = await POST(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Amount mismatch' }, { status: 400 });
    });

    it('returns 400 if user or tier identifiers are missing', async () => {
        (verifyITNSignature as any).mockReturnValue(true);

        const req = createMockFormDataRequest({
            payment_status: 'COMPLETE',
            custom_str2: 'pro',
            amount_gross: '30.00'
            // Missing custom_str1 (userId)
        });

        const response: any = await POST(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Missing mapping identities' }, { status: 400 });
    });

    it('upgrades user profile and logs subscription upon successful ITN', async () => {
        (verifyITNSignature as any).mockReturnValue(true);

        // Supabase DB chaining mocks
        const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
        const mockInsert = vi.fn().mockResolvedValue({ error: null });

        const mockSupabase = {
            from: vi.fn().mockImplementation((table) => {
                if (table === 'profiles') return { update: mockUpdate };
                if (table === 'subscriptions') return { insert: mockInsert };
                return {};
            })
        };

        (createAdminClient as any).mockReturnValue(mockSupabase);

        const req = createMockFormDataRequest({
            payment_status: 'COMPLETE',
            custom_str1: 'user-123-uuid',
            custom_str2: 'store',
            amount_gross: '150.00',
            token: 'payfast-billing-token-xyz'
        });

        const response: any = await POST(req);

        // Should return generic 200 OK string
        expect(response.status).toBe(200);

        // Profile update called for 'store'
        expect(mockUpdate).toHaveBeenCalledWith({ subscription_tier: 'store' });

        // Insert subscription log explicitly checks token parsing correctly
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            profile_id: 'user-123-uuid',
            tier: 'store',
            payfast_token: 'payfast-billing-token-xyz',
            status: 'active'
        }));
    });
});
