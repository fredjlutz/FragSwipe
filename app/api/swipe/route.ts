import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { listing_id, direction, is_favourite } = await request.json();

        if (!listing_id || !direction || !['left', 'right'].includes(direction)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // 1. Log the swipe to remove it from future queues
        const { error: swipeError } = await supabase
            .from('swipe_history')
            .insert({
                user_id: session.user.id,
                listing_id,
                direction,
            });

        // Ignore unique constraint errors (already swiped)
        if (swipeError && swipeError.code !== '23505') {
            console.error('Failed to log swipe:', swipeError);
            // We still continue to attempt setting favourite if requested
        }

        // 2. Add to Favourites if triggered
        if (is_favourite || direction === 'right') {
            const { error: favError } = await supabase
                .from('favourites')
                .insert({
                    user_id: session.user.id,
                    listing_id,
                });

            if (favError && favError.code !== '23505') {
                console.error('Failed to add favourite:', favError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Swipe API error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
