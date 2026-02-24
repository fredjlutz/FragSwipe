import { describe, it, expect } from 'vitest';
import { isListingCreationAllowed } from '@/lib/limits';

describe('Tier Limit Enforcement Logic', () => {

    describe('Free Tier', () => {
        it('allows creation when count is under limit', () => {
            expect(isListingCreationAllowed(9, 'free')).toBe(true);
            expect(isListingCreationAllowed(0, 'free')).toBe(true);
        });

        it('denies creation when count equals limit', () => {
            expect(isListingCreationAllowed(10, 'free')).toBe(false);
        });

        it('denies creation when count exceeds limit', () => {
            expect(isListingCreationAllowed(15, 'free')).toBe(false);
        });
    });

    describe('Pro Tier', () => {
        it('allows creation when count is under limit', () => {
            expect(isListingCreationAllowed(49, 'pro')).toBe(true);
            expect(isListingCreationAllowed(11, 'pro')).toBe(true);
        });

        it('denies creation when count equals limit', () => {
            expect(isListingCreationAllowed(50, 'pro')).toBe(false);
        });
    });

    describe('Store Tier', () => {
        it('allows creation when count is under limit', () => {
            expect(isListingCreationAllowed(99, 'store')).toBe(true);
        });

        it('denies creation when count equals limit', () => {
            expect(isListingCreationAllowed(100, 'store')).toBe(false);
        });
    });

});
