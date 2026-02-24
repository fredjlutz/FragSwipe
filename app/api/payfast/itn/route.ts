import { NextResponse } from 'next/server';
import { verifyITNSignature, validPayFastIPs } from '@/lib/payfast';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        // 1. Authenticate Request Origin via Proxy headers / Request IP
        // In Vercel or Next.js behind proxies, x-forwarded-for contains the origin IP
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('host');

        // NOTE: In strict production mode, we enforce PayFast IP whitelisting.
        if (process.env.NODE_ENV === 'production' && !validPayFastIPs.includes(ip || '')) {
            console.error('Forced rejection: Untrusted Origin IP:', ip);
            return NextResponse.json({ error: 'Untrusted Origin' }, { status: 403 });
        }

        // 2. Parse payload. PayFast sends url-encoded form data.
        const formData = await request.formData();
        const payload: Record<string, string> = {};
        formData.forEach((value, key) => {
            payload[key] = value.toString();
        });

        // 3. Verify Signature using our Backend Key to prevent forgery
        const isValid = verifyITNSignature(payload);
        if (!isValid) {
            console.error('Invalid ITN Signature from IP:', ip);
            return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
        }

        // 4. Verify Payment Status & Expected Values
        // Prevent Payment Mismatch Attack: They sent R1 for a R99 item
        const paymentStatus = payload.payment_status;
        const userId = payload.custom_str1;
        const tier = payload.custom_str2;
        const amountGross = parseFloat(payload.amount_gross || '0');

        if (paymentStatus !== 'COMPLETE') {
            // Just acknowledge non-complete hooks quietly
            return new Response('OK', { status: 200 });
        }

        if (tier === 'pro' && amountGross < 29.00) return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
        if (tier === 'store' && amountGross < 99.00) return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });

        if (!userId || !tier) {
            return NextResponse.json({ error: 'Missing mapping identities' }, { status: 400 });
        }

        // 5. Upgrade the User securely using the Backend Admin Client (bypassing RLS)
        const supabaseAdmin = createAdminClient();

        const { error: upgradeError } = await supabaseAdmin
            .from('profiles')
            .update({ subscription_tier: tier as 'pro' | 'store' })
            .eq('id', userId);

        if (upgradeError) {
            console.error('Failed to upgrade user in DB:', upgradeError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // 6. Optionally Record the exact subscription logic and tokens in our subscriptions table
        // For now, the tier change on profile unlocks features. 
        // We would insert payload.token here for canceling logic.
        await supabaseAdmin.from('subscriptions').insert({
            profile_id: userId,
            tier,
            payfast_token: payload.token || null,
            status: 'active',
            starts_at: new Date().toISOString()
        });

        // Valid PayFast ITNs MUST respond with generic HTTP 200 OK
        return new Response('OK', { status: 200 });

    } catch (err: unknown) {
        console.error('ITN Critical Error:', err);
        return new Response('Server Error', { status: 500 });
    }
}
