import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { listingSchema } from '@/lib/validation/listingSchema';
import { ZodError } from 'zod';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();

        // Status update logic (pause, sold, active) bypasses strict listing data validation
        if (body.status) {
            const validStatuses = ['active', 'paused', 'sold', 'removed'];
            if (!validStatuses.includes(body.status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }

            // If they are trying to activate a listing, check their tier limits
            if (body.status === 'active') {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('subscription_tier')
                    .eq('id', session.user.id)
                    .single();

                const tier = profile?.subscription_tier || 'free';

                const { count, error: countError } = await supabase
                    .from('listings')
                    .select('*', { count: 'exact', head: true })
                    .eq('seller_id', session.user.id)
                    .eq('status', 'active');

                if (countError) {
                    throw countError;
                }

                const { isListingCreationAllowed, TIER_LIMITS } = await import('@/lib/limits');
                if (!isListingCreationAllowed(count || 0, tier)) {
                    const limit = TIER_LIMITS[tier] || TIER_LIMITS.free;
                    return NextResponse.json(
                        { error: `Tier limit reached. Your plan allows up to ${limit} active listings. Please upgrade to activate this listing.` },
                        { status: 403 }
                    );
                }
            }

            const { data, error } = await supabase
                .from('listings')
                .update({ status: body.status })
                .eq('id', id)
                .eq('seller_id', session.user.id) // Enforced logically alongside RLS
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ data });
        }

        // Full update logic
        const parsedData = listingSchema.parse(body);

        const { data, error } = await supabase
            .from('listings')
            .update({
                title: parsedData.title,
                description: parsedData.description,
                price: parsedData.price,
                category: parsedData.category,
                tags: parsedData.tags,
                pickup_available: parsedData.pickup_available,
                delivery_available: parsedData.delivery_available,
            })
            .eq('id', id)
            .eq('seller_id', session.user.id)
            .select()
            .single();

        if (error) {
            throw new Error(`Update failed: ${error.message}`);
        }

        return NextResponse.json({ data });
    } catch (error: unknown) {
        console.error('Update listing error:', error);
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Set status to removed rather than hard-delete for referential integrity
        const { error } = await supabase
            .from('listings')
            .update({ status: 'removed' })
            .eq('id', params.id)
            .eq('seller_id', session.user.id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Delete listing error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
