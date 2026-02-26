import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const supabase = createClient();
    await supabase.auth.signOut();

    // Redirect to home page after signout
    return NextResponse.redirect(new URL('/', request.url));
}
