import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listingSchema } from '@/lib/validation/listingSchema';

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
            })
            .eq('id', id)
            .eq('seller_id', session.user.id)
            .select()
            .single();

        if (error) {
            throw new Error(`Update failed: ${error.message}`);
        }

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Update listing error:', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
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
    } catch (error: any) {
        console.error('Delete listing error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
