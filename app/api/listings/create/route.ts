import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listingSchema } from '@/lib/validation/listingSchema';
import { isListingCreationAllowed } from '@/lib/limits';

export async function POST(request: Request) {
    try {
        const supabase = createClient();

        // 1. Authenticate User
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;

        // 2. Validate Request Body
        const body = await request.json();
        const parsedData = listingSchema.parse(body);

        // 3. Check Subscription Tier Limits
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, neighbourhood, location')
            .eq('id', userId)
            .single();

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found. Please complete onboarding.' }, { status: 400 });
        }

        const tier = profile.subscription_tier || 'free';

        // Count active listings strictly
        const { count, error: countError } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', userId)
            .eq('status', 'active');

        if (countError) {
            throw new Error(`Failed to count listings: ${countError.message}`);
        }

        if (!isListingCreationAllowed(count || 0, tier)) {
            return NextResponse.json(
                { error: 'Upgrade your plan to add more listings' },
                { status: 403 }
            );
        }

        // 4. Insert Listing
        // We clone the location and neighbourhood from the user's profile to freeze it for this listing
        const { data: listing, error: insertError } = await supabase
            .from('listings')
            .insert({
                seller_id: userId,
                title: parsedData.title,
                description: parsedData.description,
                price: parsedData.price,
                category: parsedData.category,
                tags: parsedData.tags,
                status: 'active', // Moderation edge function will pick this up
                location: profile.location,
                neighbourhood: profile.neighbourhood,
            })
            .select('id')
            .single();

        if (insertError) {
            throw new Error(`Failed to insert listing: ${insertError.message}`);
        }

        return NextResponse.json({ data: listing });
    } catch (error: any) {
        console.error('Create listing error:', error);
        if (error.name === 'ZodError') {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
