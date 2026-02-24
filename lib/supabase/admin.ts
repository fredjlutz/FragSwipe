import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Admin client bypassing RLS.
 * WARNING: Never use this on the client or expose it to standard users.
 */
export function createAdminClient() {
    return createSupabaseClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
