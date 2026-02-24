export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string
                    whatsapp_number: string
                    raw_address: string
                    neighbourhood: string
                    location: unknown
                    role: 'member' | 'store' | 'admin'
                    subscription_tier: 'free' | 'pro' | 'store'
                    is_banned: boolean
                    handle: string | null
                    store_logo: string | null
                    store_banner: string | null
                    store_description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name: string
                    whatsapp_number: string
                    raw_address: string
                    neighbourhood: string
                    location: unknown
                    role?: 'member' | 'store' | 'admin'
                    subscription_tier?: 'free' | 'pro' | 'store'
                    is_banned?: boolean
                    handle?: string | null
                    store_logo?: string | null
                    store_banner?: string | null
                    store_description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    whatsapp_number?: string
                    raw_address?: string
                    neighbourhood?: string
                    location?: unknown
                    role?: 'member' | 'store' | 'admin'
                    subscription_tier?: 'free' | 'pro' | 'store'
                    is_banned?: boolean
                    handle?: string | null
                    store_logo?: string | null
                    store_banner?: string | null
                    store_description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            listings: {
                Row: {
                    id: string
                    seller_id: string
                    title: string
                    description: string
                    price: number
                    category: 'coral_sps' | 'coral_lps' | 'coral_soft' | 'zoanthid' | 'anemone' | 'fish' | 'invert' | 'macro_algae' | 'hardscape' | 'hardware'
                    tags: string[] | null
                    status: 'active' | 'sold' | 'paused' | 'removed' | 'shadow_banned'
                    moderation_flag: boolean
                    location: unknown
                    neighbourhood: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    seller_id: string
                    title: string
                    description: string
                    price: number
                    category: 'coral_sps' | 'coral_lps' | 'coral_soft' | 'zoanthid' | 'anemone' | 'fish' | 'invert' | 'macro_algae' | 'hardscape' | 'hardware'
                    tags?: string[] | null
                    status?: 'active' | 'sold' | 'paused' | 'removed' | 'shadow_banned'
                    moderation_flag?: boolean
                    location: unknown
                    neighbourhood: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    seller_id?: string
                    title?: string
                    description?: string
                    price?: number
                    category?: 'coral_sps' | 'coral_lps' | 'coral_soft' | 'zoanthid' | 'anemone' | 'fish' | 'invert' | 'macro_algae' | 'hardscape' | 'hardware'
                    tags?: string[] | null
                    status?: 'active' | 'sold' | 'paused' | 'removed' | 'shadow_banned'
                    moderation_flag?: boolean
                    location?: unknown
                    neighbourhood?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            listing_images: {
                Row: {
                    id: string
                    listing_id: string
                    storage_path: string
                    display_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    listing_id: string
                    storage_path: string
                    display_order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    listing_id?: string
                    storage_path?: string
                    display_order?: number
                    created_at?: string
                }
            }
            favourites: {
                Row: {
                    id: string
                    buyer_id: string
                    listing_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    buyer_id: string
                    listing_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    buyer_id?: string
                    listing_id?: string
                    created_at?: string
                }
            }
            swipe_history: {
                Row: {
                    id: string
                    user_id: string
                    listing_id: string
                    direction: 'left' | 'right'
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    listing_id: string
                    direction: 'left' | 'right'
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    listing_id?: string
                    direction?: 'left' | 'right'
                    created_at?: string
                }
            }
            subscriptions: {
                Row: {
                    id: string
                    profile_id: string
                    tier: 'free' | 'pro' | 'store'
                    payfast_token: string | null
                    status: string
                    starts_at: string
                    ends_at: string | null
                }
                Insert: {
                    id?: string
                    profile_id: string
                    tier: 'free' | 'pro' | 'store'
                    payfast_token?: string | null
                    status?: string
                    starts_at?: string
                    ends_at?: string | null
                }
                Update: {
                    id?: string
                    profile_id?: string
                    tier?: 'free' | 'pro' | 'store'
                    payfast_token?: string | null
                    status?: string
                    starts_at?: string
                    ends_at?: string | null
                }
            }
            moderation_log: {
                Row: {
                    id: string
                    listing_id: string
                    flagged_reason: string
                    reviewed_by: string | null
                    reviewed_at: string | null
                    action_taken: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    listing_id: string
                    flagged_reason: string
                    reviewed_by?: string | null
                    reviewed_at?: string | null
                    action_taken?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    listing_id?: string
                    flagged_reason?: string
                    reviewed_by?: string | null
                    reviewed_at?: string | null
                    action_taken?: string | null
                    created_at?: string
                }
            }
            moderation_blocklist: {
                Row: {
                    id: string
                    term: string
                    category: 'profanity' | 'racial' | 'other'
                }
                Insert: {
                    id?: string
                    term: string
                    category: 'profanity' | 'racial' | 'other'
                }
                Update: {
                    id?: string
                    term?: string
                    category?: 'profanity' | 'racial' | 'other'
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            nearby_listings: {
                Args: {
                    user_lat: number
                    user_lng: number
                    radius_km?: number
                    filter_category?: string
                }
                Returns: Database['public']['Tables']['listings']['Row'][]
            }
        }
        Enums: {
            role_enum: 'member' | 'store' | 'admin'
            subscription_tier_enum: 'free' | 'pro' | 'store'
            category_enum: 'coral_sps' | 'coral_lps' | 'coral_soft' | 'zoanthid' | 'anemone' | 'fish' | 'invert' | 'macro_algae' | 'hardscape' | 'hardware'
            status_enum: 'active' | 'sold' | 'paused' | 'removed' | 'shadow_banned'
            direction_enum: 'left' | 'right'
            moderation_category_enum: 'profanity' | 'racial' | 'other'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
