import { z } from 'zod';

export const whatsappRegex = /^\+[1-9]\d{1,14}$/;

export const profileSchema = z.object({
    full_name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name cannot exceed 100 characters'),
    whatsapp_number: z
        .string()
        .regex(
            whatsappRegex,
            'WhatsApp number must be in E.164 format (e.g., +27821234567)'
        ),
    raw_address: z
        .string()
        .min(5, 'Please provide a more detailed address')
        .max(250, 'Address is too long'),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
