import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');

    // Also support the next parameter for redirecting after login
    const next = searchParams.get('next') ?? '/discover';

    if (code) {
        const supabase = createClient();
        const { error, data } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            // Check if user has completed onboarding by checking profiles table
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', data.user.id)
                .single();

            // Fast path: if profile exists or we're on a password reset flow, send them to the intended next path
            if (profile || next === '/reset-password') {
                return NextResponse.redirect(`${origin}${next}`);
            }

            // If no profile, force them to onboarding
            return NextResponse.redirect(`${origin}/onboarding`);
        }
    }

    // Fallback to login with error parameter if something fails
    return NextResponse.redirect(`${origin}/login?error=Invalid+magic+link`);
}
