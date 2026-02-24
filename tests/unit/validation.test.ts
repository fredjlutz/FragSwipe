import { describe, it, expect } from 'vitest';
import { profileSchema, whatsappRegex } from '@/lib/validation/profileSchema';
import { listingSchema } from '@/lib/validation/listingSchema';

describe('Zod Validation Schemas', () => {

    describe('profileSchema', () => {
        it('accepts a valid profile', () => {
            const validProfile = {
                full_name: 'John Doe',
                whatsapp_number: '+27821234567',
                raw_address: '123 Main St, Cape Town',
            };
            const result = profileSchema.safeParse(validProfile);
            expect(result.success).toBe(true);
        });

        it('rejects short names', () => {
            const result = profileSchema.safeParse({
                full_name: 'J',
                whatsapp_number: '+27821234567',
                raw_address: '123 Main St, Cape Town',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('at least 2 characters');
            }
        });

        it('rejects invalid WhatsApp numbers', () => {
            const invalidNumbers = [
                '0821234567', // Missing + country code
                '+27 82 123 4567', // Contains spaces
                '++2782', // Double plus
                '+', // Only plus
                'words', // Letters
            ];

            for (const num of invalidNumbers) {
                const result = profileSchema.safeParse({
                    full_name: 'John Doe',
                    whatsapp_number: num,
                    raw_address: '123 Main St, Cape Town',
                });
                expect(result.success).toBe(false);
            }
        });

        it('rejects short addresses', () => {
            const result = profileSchema.safeParse({
                full_name: 'John Doe',
                whatsapp_number: '+27821234567',
                raw_address: '123', // Too short
            });
            expect(result.success).toBe(false);
        });
    });

    describe('listingSchema', () => {
        it('accepts a valid listing', () => {
            const validListing = {
                title: 'Beautiful Torch Coral',
                description: 'Healthy and growing nicely. Size is about 2 inches.',
                price: 500,
                category: 'coral_lps',
                tags: ['torch', 'euphyllia'],
            };
            const result = listingSchema.safeParse(validListing);
            expect(result.success).toBe(true);
        });

        it('strips HTML tags from title and description', () => {
            const listingWithHtml = {
                title: '<h1>Bad Title</h1>',
                description: '<script>alert("xss")</script> Good Description <p>really</p>',
                price: 100,
                category: 'coral_soft',
            };

            const result = listingSchema.safeParse(listingWithHtml);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.title).toBe('Bad Title');
                expect(result.data.description).toBe('alert("xss") Good Description really');
            }
        });

        it('rejects negative prices', () => {
            const result = listingSchema.safeParse({
                title: 'Valid Title',
                description: 'Valid Description that is long enough',
                price: -10,
                category: 'fish',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('0 or greater');
            }
        });

        it('rejects invalid categories', () => {
            const result = listingSchema.safeParse({
                title: 'Valid Title',
                description: 'Valid Description that is long enough',
                price: 100,
                category: 'not_a_real_category',
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('valid category');
            }
        });

        it('rejects more than 5 tags', () => {
            const result = listingSchema.safeParse({
                title: 'Valid Title',
                description: 'Valid Description that is long enough',
                price: 100,
                category: 'invert',
                tags: ['1', '2', '3', '4', '5', '6'], // 6 tags
            });
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Maximum of 5 tags');
            }
        });
    });
});
