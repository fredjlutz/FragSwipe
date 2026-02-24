import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/swipe/route';
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

import { createClient } from '@/lib/supabase/server';

describe('POST /api/swipe', () => {
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

    it('returns 400 for structural invalid payload', async () => {
        const mockSupabase = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) } };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = { json: vi.fn().mockResolvedValue({ listing_id: '123', direction: 'up' }) } as unknown as Request;
        await POST(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid payload' }, { status: 400 });
    });

    it('logs swipe left history ignoring favourites', async () => {
        const mockInsertSwipe = vi.fn().mockResolvedValue({ error: null });
        const mockInsertFav = vi.fn();

        const mockFrom = vi.fn().mockImplementation((table) => {
            if (table === 'swipe_history') return { insert: mockInsertSwipe };
            if (table === 'favourites') return { insert: mockInsertFav };
            return {};
        });

        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) },
            from: mockFrom
        };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = { json: vi.fn().mockResolvedValue({ listing_id: 'item1', direction: 'left', is_favourite: false }) } as unknown as Request;
        const res: any = await POST(req);

        expect(mockInsertSwipe).toHaveBeenCalledWith({ user_id: 'u1', listing_id: 'item1', direction: 'left' });
        expect(mockInsertFav).not.toHaveBeenCalled();
        expect(res.status).toBe(200);
    });

    it('logs swipe right and automatically triggers favourite', async () => {
        const mockInsertSwipe = vi.fn().mockResolvedValue({ error: null });
        const mockInsertFav = vi.fn().mockResolvedValue({ error: null });

        const mockFrom = vi.fn().mockImplementation((table) => {
            if (table === 'swipe_history') return { insert: mockInsertSwipe };
            if (table === 'favourites') return { insert: mockInsertFav };
            return {};
        });

        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) },
            from: mockFrom
        };
        (createClient as any).mockReturnValue(mockSupabase);

        const req = { json: vi.fn().mockResolvedValue({ listing_id: 'item2', direction: 'right' }) } as unknown as Request;
        await POST(req);

        expect(mockInsertSwipe).toHaveBeenCalledWith({ user_id: 'u1', listing_id: 'item2', direction: 'right' });
        expect(mockInsertFav).toHaveBeenCalledWith({ user_id: 'u1', listing_id: 'item2' });
    });

    it('safely catches errors natively and responds with 500', async () => {
        const mockSupabase = {
            auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) }
        };
        (createClient as any).mockReturnValue(mockSupabase);

        // Intentionally throw inside request parser
        const req = { json: vi.fn().mockRejectedValue(new Error('Syntax Error Payload')) } as unknown as Request;
        await POST(req);

        expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Syntax Error Payload' }, { status: 500 });
    });
});
