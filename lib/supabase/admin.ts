import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Admin client bypassing RLS.
 * WARNING: Never use this on the client or expose it to standard users.
 */
export function createAdminClient() {
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Admin client will be non-functional.');
    }

    return createSupabaseClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey || '',
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
