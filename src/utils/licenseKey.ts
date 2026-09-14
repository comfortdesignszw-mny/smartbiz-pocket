/**
 * SmartBiz Pocket – Subscription License Key Engine & EcoCash USSD Constants
 * Manages 30-day Pro licenses, EcoCash direct transfer verification, and Comfort Designs key generator.
 */

import { AppSettings } from '../types';

export const ECOCASH_USSD_CODE = '*151*1*1*0772824132*2#';
// Encoded tel: URL for mobile dialers (%23 represents #)
export const ECOCASH_USSD_TEL = 'tel:*151*1*1*0772824132*2%23';
export const COMFORT_DESIGNS_PHONE = '+263772824132';
export const COMFORT_DESIGNS_LOCAL_PHONE = '0772824132';
export const PRO_PLAN_PRICE_USD = 2.0;
export const PRO_PLAN_DURATION_DAYS = 30;

// Master emergency/support keys for Comfort Designs
const MASTER_KEYS = [
  'SBP-PRO-COMFORT-2026',
  'COMFORT-PRO-30D',
  'SMARTBIZ-PRO-2026',
  'PRO-263-0772824132',
];

/**
 * Generates an authentic 30-day Pro license key
 * Format: SBP-PRO-30D-[RANDOM4]-[CHECKSUM4]
 * Can generate unlimited unique keys for unlimited users.
 */
export function generateSubscriptionKey(days: number = 30, clientHint: string = ''): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  let salt = '';
  for (let i = 0; i < 4; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Calculate simple deterministic checksum
  let sum = 0;
  for (let i = 0; i < salt.length; i++) {
    sum = (sum * 31 + salt.charCodeAt(i) + days) % 9999;
  }
  const checksum = sum.toString(36).toUpperCase().padStart(4, 'X').slice(-4);
  const durationTag = `${days}D`;

  return `SBP-PRO-${durationTag}-${salt}-${checksum}`;
}

/**
 * Creates a pre-formatted WhatsApp share link for Comfort Designs to send the key to a client
 */
export function createCustomerKeyWhatsAppUrl(clientPhone: string, key: string, clientName: string = ''): string {
  const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
  const target = cleanPhone.startsWith('0')
    ? `263${cleanPhone.slice(1)}`
    : cleanPhone.startsWith('263')
    ? cleanPhone
    : cleanPhone ? `263${cleanPhone}` : '';

  const text = `Hello ${clientName || 'Merchant'}! 👋\n\nThank you for your $2.00 EcoCash payment.\n\nHere is your official 30-Day SmartBiz Pocket Pro License Key:\n🔑 ${key}\n\nTo activate:\n1. Open SmartBiz Pocket\n2. Tap the Pro Paywall / Crown icon\n3. Paste your key in Step 3 and tap "Activate 30-Day Pro Plan"\n\nEnjoy unlimited sales, catalog & backup alerts!\n— Comfort Designs (+263772824132)`;

  if (target) {
    return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Validates a user-entered license key and returns number of active days granted
 */
export function validateSubscriptionKey(rawKey: string): {
  isValid: boolean;
  days: number;
  message: string;
} {
  if (!rawKey || typeof rawKey !== 'string') {
    return { isValid: false, days: 0, message: 'Please enter a valid subscription key.' };
  }

  const cleanKey = rawKey.trim().toUpperCase();

  // 1. Check master keys
  if (MASTER_KEYS.includes(cleanKey)) {
    return { isValid: true, days: 30, message: 'Master Key Accepted: 30 Days Pro Unlocked!' };
  }

  // 2. Format check: SBP-PRO-{days}D-{salt}-{checksum} or PRO-XXXX-XXXX
  const sbpRegex = /^SBP-PRO-(\d+)D-([A-Z0-9]{4})-([A-Z0-9]{4})$/;
  const match = cleanKey.match(sbpRegex);

  if (match) {
    const days = parseInt(match[1], 10) || 30;
    const salt = match[2];
    const providedChecksum = match[3];

    let sum = 0;
    for (let i = 0; i < salt.length; i++) {
      sum = (sum * 31 + salt.charCodeAt(i) + days) % 9999;
    }
    const expectedChecksum = sum.toString(36).toUpperCase().padStart(4, 'X').slice(-4);

    if (providedChecksum === expectedChecksum) {
      return {
        isValid: true,
        days: days,
        message: `Valid License Key: ${days} Days Pro Plan Activated!`,
      };
    }
  }

  // 3. Fallback permissive check for custom issued keys from Comfort Designs
  // Matches any key that starts with SBP or PRO and has at least 10 characters
  if ((cleanKey.startsWith('SBP-') || cleanKey.startsWith('PRO-')) && cleanKey.length >= 10) {
    return {
      isValid: true,
      days: 30,
      message: 'License Key Verified: 30 Days Pro Plan Activated!',
    };
  }

  return {
    isValid: false,
    days: 0,
    message: 'Invalid or unrecognized license key. Please check the code sent via WhatsApp by Comfort Designs (+263772824132).',
  };
}

/**
 * Computes subscription status and remaining days
 */
export function getSubscriptionStatus(settings: AppSettings): {
  isPro: boolean;
  daysRemaining: number;
  isExpired: boolean;
  expiryDateStr: string;
  hasKey: boolean;
} {
  if (!settings.isPremium) {
    return {
      isPro: false,
      daysRemaining: 0,
      isExpired: false,
      expiryDateStr: '',
      hasKey: !!settings.subscriptionKey,
    };
  }

  // If no expiry date is set, default to 30 days from now
  if (!settings.subscriptionExpiryDate) {
    return {
      isPro: true,
      daysRemaining: 30,
      isExpired: false,
      expiryDateStr: 'Active (30 days default)',
      hasKey: !!settings.subscriptionKey,
    };
  }

  const expiryTime = new Date(settings.subscriptionExpiryDate).getTime();
  const now = Date.now();
  const msRemaining = expiryTime - now;

  if (msRemaining <= 0) {
    return {
      isPro: false,
      daysRemaining: 0,
      isExpired: true,
      expiryDateStr: new Date(expiryTime).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      hasKey: !!settings.subscriptionKey,
    };
  }

  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
  const expiryDateStr = new Date(expiryTime).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return {
    isPro: true,
    daysRemaining,
    isExpired: false,
    expiryDateStr,
    hasKey: !!settings.subscriptionKey,
  };
}

/**
 * Formats WhatsApp message for the merchant to send proof of payment to Comfort Designs
 */
export function createWhatsAppProofUrl(businessName: string, ownerPhone: string): string {
  const text = `Hello Comfort Designs! 👋\n\nI have sent my $2.00 EcoCash payment for SmartBiz Pocket Pro via USSD *151*1*1*0772824132*2#.\n\n• Business Name: ${businessName || 'My Store'}\n• My Phone: ${ownerPhone || 'N/A'}\n• EcoCash Approval Ref: \n\nPlease generate and send my 30-Day Pro Subscription Key.\n\nThank you!`;
  return `https://wa.me/263772824132?text=${encodeURIComponent(text)}`;
}

/**
 * Formats WhatsApp message for the merchant to request a renewal key from Comfort Designs
 */
export function createRenewalWhatsAppUrl(businessName: string, daysRemaining: number): string {
  const urgency = daysRemaining <= 1 ? (daysRemaining === 0 ? 'today' : 'in 1 day') : `in ${daysRemaining} days`;
  const text = `Hello Comfort Designs! 👋\n\nMy SmartBiz Pocket Pro subscription is expiring ${urgency}.\n\n• Business Name: ${businessName || 'My Store'}\n\nI am paying $2.00 via EcoCash (*151*1*1*0772824132*2#). Please generate and send my new 30-Day Pro subscription renewal key.\n\nThank you!`;
  return `https://wa.me/263772824132?text=${encodeURIComponent(text)}`;
}

/**
 * Determines alert level for subscription keys (5-day notice, 2-day urgent alert, expired)
 */
export function getSubscriptionAlertLevel(daysRemaining: number, isExpired: boolean): 'active' | 'alert_5_days' | 'alert_2_days' | 'expired' {
  if (isExpired) return 'expired';
  if (daysRemaining <= 2) return 'alert_2_days';
  if (daysRemaining <= 5) return 'alert_5_days';
  return 'active';
}

/**
 * Creates a pre-formatted WhatsApp renewal reminder link from Comfort Designs to the client
 */
export function createAdminRenewalReminderWhatsAppUrl(
  clientPhone: string,
  clientName: string,
  daysRemaining: number,
  expiryDateStr: string
): string {
  const cleanPhone = (clientPhone || '').replace(/[^0-9]/g, '');
  const target = cleanPhone.startsWith('0')
    ? `263${cleanPhone.slice(1)}`
    : cleanPhone.startsWith('263')
    ? cleanPhone
    : cleanPhone ? `263${cleanPhone}` : '';

  const urgencyText = daysRemaining <= 1
    ? (daysRemaining <= 0 ? 'today' : 'in 1 day')
    : `in ${daysRemaining} days`;

  const text = `Hello ${clientName || 'Merchant'}! 👋\n\nFriendly reminder from Comfort Designs: Your SmartBiz Pocket Pro subscription will expire ${urgencyText} on ${expiryDateStr}.\n\nTo ensure continuous uninterrupted access (unlimited sales recording & stock catalog):\n1. Pay $2.00 via EcoCash USSD: *151*1*1*0772824132*2#\n2. Send us the confirmation to receive your fresh 30-Day Pro key.\n\nThank you for choosing SmartBiz Pocket!\n— Comfort Designs (+263772824132)`;

  if (target) {
    return `https://wa.me/${target}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Formats SMS message for the merchant to send proof of payment
 */
export function createSmsProofUrl(businessName: string): string {
  const text = `SmartBiz Pocket Pro: I paid $2 via EcoCash for ${businessName || 'my business'}. Please send my 30-day activation key.`;
  return `sms:+263772824132?body=${encodeURIComponent(text)}`;
}
