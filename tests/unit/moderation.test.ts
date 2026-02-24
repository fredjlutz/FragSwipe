import { describe, it, expect } from 'vitest';

/**
 * Local extraction of the logic running on the Supabase Edge Function `moderate-listing`.
 * AGENTS.md rule: Shadow-ban if title/description contains URLs or blocked words.
 */
function evaluateModerationFlags(title: string, description: string, blocklist: string[]): boolean {
    const urlRegex = /https?:\/\/|www\./i;
    const content = `${title} ${description}`.toLowerCase();

    // Rule 1: No URLs allowed
    if (urlRegex.test(content)) return true;

    // Rule 2: Basic Blocklist checking
    for (const blockWord of blocklist) {
        // Basic word boundary check to avoid accidental trigger on substrings
        const wordRegex = new RegExp(`\\b${blockWord}\\b`, 'i');
        if (wordRegex.test(content)) {
            return true;
        }
    }

    return false;
}

const mockBlocklist = ['scam', 'fake', 'paypal only', 'slur'];

describe('Shadow Ban Moderation Logic', () => {
    it('passes clean, normal marine listing content', () => {
        const isFlagged = evaluateModerationFlags('Green Star Polyps', 'Healthy fast growing frag fully encrusted.', mockBlocklist);
        expect(isFlagged).toBe(false);
    });

    it('flags content containing standard http URLs', () => {
        const isFlagged = evaluateModerationFlags('Buy my coral', 'Click here: http://sketchy-site.com/reef', mockBlocklist);
        expect(isFlagged).toBe(true);
    });

    it('flags content containing secure https URLs', () => {
        const isFlagged = evaluateModerationFlags('Torch frag', 'Check my other listings https://my-store.co.za', mockBlocklist);
        expect(isFlagged).toBe(true);
    });

    it('flags content containing www domains', () => {
        const isFlagged = evaluateModerationFlags('www.buycorals.com', 'We restocked today!', mockBlocklist);
        expect(isFlagged).toBe(true);
    });

    it('flags content containing explicitly blocked words', () => {
        const isFlagged = evaluateModerationFlags('Cheap Frags', 'Contact me directly do not use paypal only.', mockBlocklist);
        expect(isFlagged).toBe(true);
    });

    it('does not falsely flag substrings of blocked words', () => {
        // e.g., 'scam' is blocked, but 'scamp' should not be.
        // Assuming blocklist implementation maps word boundaries properly.
        const isFlagged = evaluateModerationFlags('Scamp the dog', 'Not a fish listing.', mockBlocklist);
        expect(isFlagged).toBe(false);
    });
});
