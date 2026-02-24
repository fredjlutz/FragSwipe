import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

// Regex to catch URL patterns http://, https://, www.
const URL_REGEX = /https?:\/\/|www\./i;

serve(async (req) => {
    try {
        // We only accept POST requests from Database Webhooks
        if (req.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        const payload = await req.json();

        // The webhook sends the new/updated row record inside `record`
        const record = payload.record;
        if (!record || !record.id) {
            return new Response('Invalid payload', { status: 400 });
        }

        const listingId = record.id;
        const title = record.title || '';
        const description = record.description || '';
        const textToCheck = `${title} ${description}`.toLowerCase();

        // Initialise Supabase client using Service Role to bypass RLS and read blocklist
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        let isFlagged = false;
        let flaggedReason = '';

        // 1. Regex check for URLs
        if (URL_REGEX.test(textToCheck)) {
            isFlagged = true;
            flaggedReason = 'Contains URL patterns';
        }

        // 2. Database Blocklist check
        if (!isFlagged) {
            const { data: blocklist, error } = await supabaseClient
                .from('moderation_blocklist')
                .select('term')

            if (error) {
                console.error('Error fetching blocklist:', error);
            } else if (blocklist) {
                // Check if any blocked term is included in the title/description
                for (const item of blocklist) {
                    // We use simple includes for speed here, could be enhanced with boundary checking \b
                    if (textToCheck.includes(item.term.toLowerCase())) {
                        isFlagged = true;
                        flaggedReason = `Matched blocklist term: ${item.term}`;
                        break;
                    }
                }
            }
        }

        // 3. Take Action if Flagged
        if (isFlagged) {
            console.log(`Shadow-banning listing ${listingId}. Reason: ${flaggedReason}`);

            // Update the listing status
            await supabaseClient
                .from('listings')
                .update({
                    status: 'shadow_banned',
                    moderation_flag: true
                })
                .eq('id', listingId);

            // Log the moderation event securely
            await supabaseClient
                .from('moderation_log')
                .insert({
                    listing_id: listingId,
                    flagged_reason: flaggedReason,
                    action_taken: 'Auto shadow_banned',
                });
        } else {
            console.log(`Setting listing ${listingId} to active.`);
            await supabaseClient
                .from('listings')
                .update({
                    status: 'active',
                    moderation_flag: false
                })
                .eq('id', listingId);
        }

        return new Response(JSON.stringify({
            listingId,
            flagged: isFlagged
        }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (err) {
        console.error('Moderation Function Error:', err);
        return new Response(String(err?.message || err), { status: 500 });
    }
})
