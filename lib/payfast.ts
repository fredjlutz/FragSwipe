import crypto from 'crypto';
import { env } from './env';

/**
 * PayFast Threat Model & Security Implementation
 * ============================================
 * 
 * 1. Signature Spoofing (Integrity)
 *    Threat: An attacker crafts a fake ITN request claiming payment success.
 *    Mitigation: Every payload from PayFast includes a generated MD5 `signature`.
 *    We recalculate the MD5 string identically on our backend using the secret `PAYFAST_PASSPHRASE`.
 *    If signatures mismatch, the request is definitively fake and discarded.
 * 
 * 2. Origin Spoofing (Authentication)
 *    Threat: An attacker runs a server pretending to be PayFast and fires valid-looking payloads.
 *    Mitigation: Before processing, we lookup the request's originating IP against an array of
 *    whitelisted, definitively known PayFast IPs/Domains.
 * 
 * 3. Price Tampering (Value Manipulation)
 *    Threat: Attacker uses a valid PayFast account to pay R1 instead of R99, getting a valid signature.
 *    Mitigation: In `itn/route.ts`, even with a valid signature, we strictly compare `amount_gross` 
 *    against our hardcoded exact pricing expectations (e.g., Pro=R29.00, Store=R99.00).
 * 
 * 4. Replay Attacks
 *    Threat: Attacker re-submits an old, valid ITN payload to get double credited.
 *    Mitigation: `pf_payment_id` is unique per transaction. In our DB (future or logs), we should ensure
 *    idempotency by declining duplicate `pf_payment_id` ingestions. For Subscriptions, we just
 *    bump the tier, which is inherently idempotent.
 */

export interface PayFastPayload {
    merchant_id: string;
    merchant_key: string;
    return_url: string;
    cancel_url: string;
    notify_url: string;
    name_first?: string;
    name_last?: string;
    email_address?: string;
    m_payment_id: string;
    amount: string;
    item_name: string;
    item_description?: string;
    custom_int1?: string;
    custom_str1?: string;
    // Subscriptions specific
    subscription_type?: number; // 1 for subscription
    billing_date?: string;
    recurring_amount?: string;
    frequency?: number; // 3 for monthly, 6 for annual
    cycles?: number; // 0 for indefinite
}

/**
 * Generates an MD5 signature according to PayFast specification.
 * It strings together all non-empty payload attributes in alphabetical order,
 * encodes it into a URL query string, appends the passphrase, and hashes it.
 */
export function generatePayFastSignature(payload: Record<string, string | number>): string {
    let pfOutput = '';

    // Create an array and sort keys alphabetically, skipping 'signature' if present
    const keys = Object.keys(payload)
        .filter(key => key !== 'signature' && payload[key] !== '' && payload[key] !== null)
        .sort();

    for (const key of keys) {
        const val = payload[key];
        if (val !== undefined && val !== null) {
            pfOutput += `${key}=${encodeURIComponent(val.toString().trim()).replace(/%20/g, '+')}&`;
        }
    }

    // Append passphrase
    const passphrase = env.PAYFAST_PASSPHRASE;
    if (passphrase) {
        pfOutput += `passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
    } else {
        // If no passphrase configured, strip the exact trailing '&'
        pfOutput = pfOutput.slice(0, -1);
    }

    return crypto.createHash('md5').update(pfOutput).digest('hex');
}

/**
 * Validates an incoming ITN signature.
 */
export function verifyITNSignature(incomingPayload: Record<string, string>): boolean {
    const { signature, ...rest } = incomingPayload;
    if (!signature) return false;

    const generatedSignature = generatePayFastSignature(rest);
    return signature === generatedSignature;
}

/**
 * Known PayFast IP whitelist for ITN validation.
 * https://developers.payfast.co.za/docs#step_4_itn
 */
export const validPayFastIPs = [
    '197.97.145.144',
    '197.97.145.145',
    '197.97.145.146',
    '197.97.145.147',
    '197.97.145.148',
    '197.97.145.149',
    '197.97.145.150',
    '197.97.145.151',
    '197.97.145.152',
    '197.97.145.153',
    '197.97.145.154',
    '197.97.145.155',
    '197.97.145.156',
    '197.97.145.157',
    '197.97.145.158',
    '197.97.145.159'
];
