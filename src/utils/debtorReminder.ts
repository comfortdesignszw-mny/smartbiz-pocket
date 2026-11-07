import { Debtor } from '../types';

/**
 * Cleans phone numbers to ensure a valid international format for WhatsApp wa.me links
 * Automatically formats local Zimbabwean numbers (07X -> 2637X, 7X -> 2637X)
 */
export function cleanPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return '';

  // If local Zimbabwe format starting with 07... (10 digits)
  if (digits.startsWith('07') && digits.length === 10) {
    return '263' + digits.slice(1);
  }
  // If starts with 7... (9 digits)
  if (digits.startsWith('7') && digits.length === 9) {
    return '263' + digits;
  }
  // If starts with 00, replace with nothing
  if (digits.startsWith('00')) {
    return digits.slice(2);
  }

  return digits;
}

/**
 * Calculates payback schedule metrics relative to a target reference date (default: today)
 */
export function getDebtorPaybackStatus(
  debtor: Debtor,
  refDate: Date = new Date()
): {
  hasDueDate: boolean;
  daysRemaining: number;
  isDueTomorrow: boolean;
  isDueToday: boolean;
  isOverdue: boolean;
  formattedDueDate: string;
  statusBadgeText: string;
  urgency: 'none' | 'due_soon' | 'due_tomorrow' | 'due_today' | 'overdue';
} {
  if (!debtor.dueDate) {
    return {
      hasDueDate: false,
      daysRemaining: 999,
      isDueTomorrow: false,
      isDueToday: false,
      isOverdue: false,
      formattedDueDate: 'No due date set',
      statusBadgeText: 'No payback date',
      urgency: 'none',
    };
  }

  const due = new Date(debtor.dueDate);
  // Normalize both dates to start of day in local time
  const todayMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();

  const daysRemaining = Math.round((dueMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

  const formattedDueDate = due.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isDueTomorrow = daysRemaining === 1;
  const isDueToday = daysRemaining === 0;
  const isOverdue = daysRemaining < 0;

  let statusBadgeText = `Due in ${daysRemaining} days`;
  let urgency: 'none' | 'due_soon' | 'due_tomorrow' | 'due_today' | 'overdue' = 'none';

  if (isOverdue) {
    const overdueDays = Math.abs(daysRemaining);
    statusBadgeText = `Overdue by ${overdueDays} day${overdueDays === 1 ? '' : 's'}`;
    urgency = 'overdue';
  } else if (isDueToday) {
    statusBadgeText = '🚨 Due Today (Payback Date)';
    urgency = 'due_today';
  } else if (isDueTomorrow) {
    statusBadgeText = '⏰ Due Tomorrow (24h Reminder)';
    urgency = 'due_tomorrow';
  } else if (daysRemaining <= 3) {
    statusBadgeText = `Due in ${daysRemaining} days`;
    urgency = 'due_soon';
  }

  return {
    hasDueDate: true,
    daysRemaining,
    isDueTomorrow,
    isDueToday,
    isOverdue,
    formattedDueDate,
    statusBadgeText,
    urgency,
  };
}

/**
 * Generates a courteous, professional WhatsApp reminder message in English or ChiShona
 */
export function generateDebtorReminderText(
  debtor: Debtor,
  businessName: string,
  currencySymbol: string = '$',
  language: 'en' | 'sn' = 'en'
): string {
  const shopName = businessName?.trim() || 'SmartBiz Store';
  const balanceStr = `${currencySymbol}${debtor.balanceOwed.toFixed(2)}`;
  const status = getDebtorPaybackStatus(debtor);

  let dateContextEn = '';
  let dateContextSn = '';

  if (status.hasDueDate) {
    if (status.isDueTomorrow) {
      dateContextEn = ` scheduled for payback tomorrow (${status.formattedDueDate})`;
      dateContextSn = ` inotarisirwa kubhadharwa mangwana (${status.formattedDueDate})`;
    } else if (status.isDueToday) {
      dateContextEn = ` scheduled for payback today (${status.formattedDueDate})`;
      dateContextSn = ` inotarisirwa kubhadharwa nhasi (${status.formattedDueDate})`;
    } else if (status.isOverdue) {
      dateContextEn = ` which was due on ${status.formattedDueDate}`;
      dateContextSn = ` yakange yakatarisirwa nemusi wa ${status.formattedDueDate}`;
    } else {
      dateContextEn = ` scheduled for payback on ${status.formattedDueDate}`;
      dateContextSn = ` inotarisirwa kubhadharwa nemusi wa ${status.formattedDueDate}`;
    }
  }

  if (language === 'sn') {
    return (
      `Makadii ${debtor.customerName},\n\n` +
      `Ichi chiyeuchidzo chine ushamwari kubva ku *${shopName}* maererano nechikwereti chenyu che *${balanceStr}*${dateContextSn}.\n\n` +
      `Tinokukumbirawo kubhadhara mari iyi nemari yemumaoko (Cash) kana EcoCash.\n\n` +
      `Tinotenda zvikuru nekutsigira bhizimisi redu!`
    );
  }

  return (
    `Hello ${debtor.customerName},\n\n` +
    `This is a friendly payment reminder from *${shopName}* regarding your credit balance of *${balanceStr}*${dateContextEn}.\n\n` +
    `Kindly settle your account via Cash or EcoCash at your earliest convenience.\n\n` +
    `Thank you for your continued support and business!`
  );
}

/**
 * Returns a direct WhatsApp URL (wa.me) for 1-tap messaging
 */
export function getDebtorWhatsAppUrl(
  debtor: Debtor,
  businessName: string,
  currencySymbol: string = '$',
  language: 'en' | 'sn' = 'en'
): string {
  const cleanPhone = cleanPhoneNumberForWhatsApp(debtor.phoneNumber);
  const message = generateDebtorReminderText(debtor, businessName, currencySymbol, language);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Checks if the current time is morning (from 08:00 hrs / 8 AM onwards)
 */
export function isMorningReminderWindow(now: Date = new Date()): boolean {
  return now.getHours() >= 8;
}
