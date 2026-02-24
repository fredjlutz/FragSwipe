import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, DELETE } from '@/app/api/listings/[id]/route';
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

describe('PATCH & DELETE /api/listings/[id]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const createParams = (id: string) => ({ params: { id } });

    describe('PATCH', () => {
        it('returns 401 Unauthorized if session is missing', async () => {
            const mockSupabase = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } };
            (createClient as any).mockReturnValue(mockSupabase);

            const req = { json: vi.fn() } as unknown as Request;
            await PATCH(req, createParams('123'));

            expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
        });

        it('returns 400 for unknown status updates', async () => {
            const mockSupabase = {
                auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) }
            };
            (createClient as any).mockReturnValue(mockSupabase);

            const req = { json: vi.fn().mockResolvedValue({ status: 'destroyed' }) } as unknown as Request;
            const res: any = await PATCH(req, createParams('123'));

            expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Invalid status' }, { status: 400 });
        });

        it('successfully updates recognized status gracefully', async () => {
            const mockUpdate = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        select: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: { id: '123', status: 'paused' }, error: null })
                        })
                    })
                })
            });

            const mockSupabase = {
                auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) },
                from: vi.fn().mockReturnValue({ update: mockUpdate })
            };
            (createClient as any).mockReturnValue(mockSupabase);

            const req = { json: vi.fn().mockResolvedValue({ status: 'paused' }) } as unknown as Request;
            const res: any = await PATCH(req, createParams('123'));

            expect(mockUpdate).toHaveBeenCalledWith({ status: 'paused' });
            expect(res.status).toBe(200);
        });

        it('throws formatting error for invalid payload edits', async () => {
            const mockSupabase = {
                auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } } }) }
            };
            (createClient as any).mockReturnValue(mockSupabase);

            // Payload is missing structurally required zod inputs
            const req = { json: vi.fn().mockResolvedValue({ title: 'New edit' }) } as unknown as Request;
            await PATCH(req, createParams('123'));

            // Expect a Zod object structurally mapped via Next Error handle
            expect(NextResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: expect.any(Array) }),
                { status: 400 }
            );
        });
    });

    describe('DELETE', () => {
        it('returns 401 Unauthorized if session is missing', async () => {
            const mockSupabase = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) } };
            (createClient as any).mockReturnValue(mockSupabase);

            const req = {} as unknown as Request;
            await DELETE(req, createParams('123'));

            expect(NextResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' }, { status: 401 });
        });

        it('successfully soft deletes listing marking removed securely mapped by user ID', async () => {
            const mockEqUser = vi.fn().mockResolvedValue({ error: null });
            const mockEqId = vi.fn().mockReturnValue({ eq: mockEqUser });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqId });

            const mockSupabase = {
                auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'my-user' } } } }) },
                from: vi.fn().mockReturnValue({ update: mockUpdate })
            };
            (createClient as any).mockReturnValue(mockSupabase);

            const req = {} as unknown as Request;
            const res: any = await DELETE(req, createParams('123'));

            // Core assert
            expect(mockUpdate).toHaveBeenCalledWith({ status: 'removed' });
            expect(mockEqId).toHaveBeenCalledWith('id', '123');
            expect(mockEqUser).toHaveBeenCalledWith('seller_id', 'my-user');

            expect(res.status).toBe(200);
        });
    });
});
