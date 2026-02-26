import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocoding';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(profile);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

interface ProfileUpdate {
    full_name?: string;
    whatsapp_number?: string;
    raw_address?: string;
    neighbourhood?: string;
    location?: string;
    updated_at: string;
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { full_name, whatsapp_number, raw_address } = body;

        const updates: ProfileUpdate = {
            updated_at: new Date().toISOString()
        };

        if (full_name) updates.full_name = full_name;
        if (whatsapp_number) updates.whatsapp_number = whatsapp_number;

        if (raw_address) {
            try {
                const geoResult = await geocodeAddress(raw_address);
                updates.raw_address = raw_address;
                updates.neighbourhood = geoResult.neighbourhood;
                updates.location = `POINT(${geoResult.longitude} ${geoResult.latitude})`;
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Unknown geocoding error';
                return NextResponse.json({ error: `Geocoding failed: ${msg}` }, { status: 400 });
            }
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', session.user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(profile);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
