import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { env } from '@/lib/env';
import { generatePayFastSignature } from '@/lib/payfast';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { session }, error: authError } = await supabase.auth.getSession();

        if (authError || !session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { tier } = await request.json();
        if (!['pro', 'store'].includes(tier)) {
            return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
        }

        // Check if PayFast is configured
        if (!env.PAYFAST_MERCHANT_ID || !env.PAYFAST_MERCHANT_KEY) {
            return NextResponse.json({ error: 'Subscriptions are coming soon!' }, { status: 503 });
        }

        // Determine pricing based on tier choice
        const amount = tier === 'pro' ? '29.00' : '99.00';
        const itemName = tier === 'pro' ? 'FragSwipe PRO Monthly' : 'FragSwipe STORE Monthly';

        // We generate a unique transaction ID linked to this user's attempt
        const paymentId = `sub_${session.user.id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

        const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const payload: Record<string, string | number> = {
            merchant_id: env.PAYFAST_MERCHANT_ID || '',
            merchant_key: env.PAYFAST_MERCHANT_KEY || '',
            return_url: `${appUrl}/my-listings?upgrade=success`,
            cancel_url: `${appUrl}/subscribe?upgrade=cancelled`,
            notify_url: `${appUrl}/api/payfast/itn`,
            m_payment_id: paymentId,
            amount,
            item_name: itemName,
            // Pass custom variables for our ITN webhook to securely parse and grant privileges
            custom_str1: session.user.id, // The User ID who bought it
            custom_str2: tier,            // The Tier they bought ('pro' or 'store')

            // Subscriptions specifics
            subscription_type: 1, // 1 = subscription
            billing_date: new Date().toISOString().split('T')[0], // Starts today
            recurring_amount: amount,
            frequency: 3, // Monthly
            cycles: 0, // Indefinite until cancelled
        };

        // We fetch the user's name to pass to PayFast if available
        const { data: profile } = await supabase.from('profiles').select('full_name, whatsapp_number').eq('id', session.user.id).single();
        if (profile) {
            if (profile.full_name) {
                const names = profile.full_name.split(' ');
                payload.name_first = names[0];
                if (names.length > 1) payload.name_last = names.slice(1).join(' ');
            }
            if (profile.whatsapp_number) {
                payload.custom_str3 = profile.whatsapp_number; // pass it through for record mapping if necessary
            }
        }
        if (session.user.email) {
            payload.email_address = session.user.email;
        }

        // Securely generate MD5 hash from the backend only
        const signature = generatePayFastSignature(payload);

        return NextResponse.json({
            data: {
                ...payload,
                signature
            }
        });

    } catch (error: unknown) {
        console.error('Subscription API Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Server error' }, { status: 500 });
    }
}
