import { describe, it, expect } from 'vitest';
import { TIER_LIMITS, SubscriptionTier, isListingCreationAllowed } from '@/lib/limits';

describe('Tier Limits Validation', () => {
    describe('isListingCreationAllowed()', () => {
        it('allows free tier to create under limit', () => {
            const allowed = isListingCreationAllowed(9, 'free');
            expect(allowed).toBe(true);
        });

        it('denies free tier at limit', () => {
            const allowed = isListingCreationAllowed(10, 'free');
            expect(allowed).toBe(false);
        });

        it('denies free tier over limit', () => {
            const allowed = isListingCreationAllowed(11, 'free');
            expect(allowed).toBe(false);
        });

        it('allows pro tier under limit', () => {
            const allowed = isListingCreationAllowed(49, 'pro');
            expect(allowed).toBe(true);
        });

        it('denies pro tier at limit', () => {
            const allowed = isListingCreationAllowed(50, 'pro');
            expect(allowed).toBe(false);
        });

        it('allows store tier under limit', () => {
            const allowed = isListingCreationAllowed(99, 'store');
            expect(allowed).toBe(true);
        });

        it('denies store tier at limit', () => {
            const allowed = isListingCreationAllowed(100, 'store');
            expect(allowed).toBe(false);
        });

        it('falls back to free tier limit for unknown tiers', () => {
            const allowedUnder = isListingCreationAllowed(9, 'unknown_tier' as SubscriptionTier);
            expect(allowedUnder).toBe(true);

            const allowedAt = isListingCreationAllowed(10, 'unknown_tier' as SubscriptionTier);
            expect(allowedAt).toBe(false);
        });
    });

    describe('TIER_LIMITS constant', () => {
        it('has correct predefined values', () => {
            expect(TIER_LIMITS.free).toBe(10);
            expect(TIER_LIMITS.pro).toBe(50);
            expect(TIER_LIMITS.store).toBe(100);
        });
    });
});
