import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/subscriptions/create/route';
import { NextResponse } from 'next/server';

vi.mock('next/server', () => ({
    NextResponse: {
        json: vi.fn((data, options) => ({
            status: options?.status || 200,
            json: async () => data,
        }))
    }
}));

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
    env: {
        PAYFAST_MERCHANT_ID: '12345',
        PAYFAST_MERCHANT_KEY: 'test-key',
    }
}));

vi.mock('@/lib/payfast', () => ({
    generatePayFastSignature: vi.fn().mockReturnValue('mock-secure-hash'),
}));

import { createClient } from '@/lib/supabase/server';

describe('POST /api/subscriptions/create', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 Unauthorized if session is missing', async () => {
        const mockSupabase = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = { json: vi.fn() } as unknown as Request;
        await POST(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
    });

    it('returns 400 for structural invalid tier request (non store or pro)', async () => {
        const mockSupabase = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) } };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = { json: vi.fn().mockResolvedValue({ tier: 'enterprise' }) } as unknown as Request;
        await POST(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid subscription tier' }, { status: 400 });
    });

    it('generates correct payload parameters for PRO tier plan securely', async () => {
        const mockProfileSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { full_name: 'John Doe', whatsapp_number: '27821234567' } })
            })
        });

        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1', email: 'john@example.com' } } } }) },
            from: vi.fn().mockReturnValue({ select: mockProfileSelect })
        };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = { json: vi.fn().mockResolvedValue({ tier: 'pro' }) } as unknown as Request;
        const res: any = await POST(req);

        const jsonArgs = (NextResponse.json as any).mock.calls[0][0];

        expect(res.status).toBe(200);
        expect(jsonArgs.data.merchant_id).toBe('12345');
        expect(jsonArgs.data.amount).toBe('29.00');
        expect(jsonArgs.data.item_name).toBe('FragSwipe PRO Monthly');
        expect(jsonArgs.data.custom_str1).toBe('u1'); // Critical for ID mapping inside ITNs
        expect(jsonArgs.data.name_first).toBe('John');
        expect(jsonArgs.data.name_last).toBe('Doe');
        expect(jsonArgs.data.email_address).toBe('john@example.com');
        expect(jsonArgs.data.signature).toBe('mock-secure-hash');
    });

    it('generates correct payload parameters for STORE tier plan securely', async () => {
        const mockProfileSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { full_name: 'StoreOwner' } })
            })
        });

        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u2' } } } }) },
            from: vi.fn().mockReturnValue({ select: mockProfileSelect })
        };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = { json: vi.fn().mockResolvedValue({ tier: 'store' }) } as unknown as Request;
        const res: any = await POST(req);

        const jsonArgs = (NextResponse.json as any).mock.calls[0][0];

        expect(res.status).toBe(200);
        expect(jsonArgs.data.amount).toBe('99.00');
        expect(jsonArgs.data.item_name).toBe('FragSwipe STORE Monthly');
        expect(jsonArgs.data.custom_str2).toBe('store');
        expect(jsonArgs.data.name_first).toBe('StoreOwner');
        expect(jsonArgs.data.name_last).toBeUndefined(); // Splitting logic falls back cleanly
    });
});
