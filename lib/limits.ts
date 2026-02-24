export const TIER_LIMITS: Record<string, number> = {
    free: 10,
    pro: 50,
    store: 100,
};

export type SubscriptionTier = 'free' | 'pro' | 'store';

/**
 * Validates whether a user can create a new listing based on their subscription tier.
 */
export function isListingCreationAllowed(currentActiveCount: number, tier: SubscriptionTier | string): boolean {
    const limit = TIER_LIMITS[tier] || TIER_LIMITS.free;
    return currentActiveCount < limit;
}
