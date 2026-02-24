import { z } from 'zod';

export const payfastItnPayloadSchema = z.object({
    m_payment_id: z.string().optional(),
    pf_payment_id: z.string(),
    payment_status: z.string(),
    item_name: z.string(),
    item_description: z.string().optional(),
    amount_gross: z.string(),
    amount_fee: z.string(),
    amount_net: z.string(),
    custom_str1: z.string().optional(),
    custom_str2: z.string().optional(),
    custom_str3: z.string().optional(),
    custom_str4: z.string().optional(),
    custom_str5: z.string().optional(),
    custom_int1: z.string().optional(),
    custom_int2: z.string().optional(),
    custom_int3: z.string().optional(),
    custom_int4: z.string().optional(),
    custom_int5: z.string().optional(),
    name_first: z.string().optional(),
    name_last: z.string().optional(),
    email_address: z.string().optional(),
    merchant_id: z.string(),
    signature: z.string(),
}).catchall(z.unknown()); // Allow other fields that PayFast might send that we don't strictly require

export type PayfastItnPayload = z.infer<typeof payfastItnPayloadSchema>;
