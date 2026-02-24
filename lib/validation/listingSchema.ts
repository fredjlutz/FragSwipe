import { z } from 'zod';

export const listingCategories = [
    'coral_sps',
    'coral_lps',
    'coral_soft',
    'zoanthid',
    'anemone',
    'fish',
    'invert',
    'macro_algae',
    'hardscape',
    'hardware',
] as const;

export const listingSchema = z.object({
    title: z
        .string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title must not exceed 100 characters')
        .transform(val => val.replace(/<[^>]*>?/gm, '')), // Strip HTML tags
    description: z
        .string()
        .min(10, 'Description should be at least 10 characters')
        .max(1000, 'Description must not exceed 1000 characters')
        .transform(val => val.replace(/<[^>]*>?/gm, '')), // Strip HTML tags
    price: z
        .number()
        .min(0, 'Price must be 0 or greater'),
    category: z.enum(listingCategories, {
        errorMap: () => ({ message: 'Please select a valid category' }),
    }),
    tags: z
        .array(z.string())
        .max(5, 'Maximum of 5 tags allowed')
        .optional()
        .default([]),
});

export type ListingFormValues = z.infer<typeof listingSchema>;
