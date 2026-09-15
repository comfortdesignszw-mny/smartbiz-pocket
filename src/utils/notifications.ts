import { SmartBizState, AppSettings, AppNotification } from '../types';

/**
 * Returns ISO week string for weekly reminder deduplication (e.g. "2026-W38")
 */
export function getIsoWeekString(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Computes subscription countdown days left for ACTIVE PRO subscribers.
 * ONLY triggers when the active Pro subscriber has 10 days, 2 days, or on the day of expiry (0 days left).
 * Free plan users do not receive this countdown.
 */
export function getSubscriptionCountdownStatus(settings: AppSettings): {
  isPro: boolean;
  daysRemaining: number;
  isTriggerDay: boolean; // True ONLY for 10, 2, or 0 days left for active Pro subscribers
  triggerDay: 10 | 2 | 0 | null;
  message: string;
  isExpired: boolean;
  expiryDateStr: string;
} {
  // Only evaluate active Pro subscribers
  if (!settings.isPremium || !settings.subscriptionExpiryDate) {
    return {
      isPro: false,
      daysRemaining: 0,
      isTriggerDay: false,
      triggerDay: null,
      message: '',
      isExpired: false,
      expiryDateStr: '',
    };
  }

  const expiryTime = new Date(settings.subscriptionExpiryDate).getTime();
  const now = new Date();

  // Compare calendar days at local midnight
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const expiryDate = new Date(expiryTime);
  const expiryMidnight = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate()).getTime();

  const calendarDaysRemaining = Math.round((expiryMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
  const msRemaining = expiryTime - now.getTime();
  const isExpired = msRemaining <= 0;

  let triggerDay: 10 | 2 | 0 | null = null;
  let isTriggerDay = false;
  let message = '';

  if (calendarDaysRemaining === 10) {
    triggerDay = 10;
    isTriggerDay = true;
    message = 'Your SmartBiz Pro subscription is left with 10 days to expire, renew.';
  } else if (calendarDaysRemaining === 2) {
    triggerDay = 2;
    isTriggerDay = true;
    message = 'Your SmartBiz Pro subscription is left with 2 days to expire, renew now to avoid service interruption.';
  } else if (calendarDaysRemaining === 0 || isExpired) {
    triggerDay = 0;
    isTriggerDay = true;
    message = isExpired
      ? 'Your SmartBiz Pro subscription has expired, renew now.'
      : 'Your SmartBiz Pro subscription expires today, renew now.';
  }

  const expiryDateStr = expiryDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return {
    isPro: true,
    daysRemaining: Math.max(0, calendarDaysRemaining),
    isTriggerDay,
    triggerDay,
    message,
    isExpired,
    expiryDateStr,
  };
}

/**
 * Downloads a complete JSON backup file of the user's business data
 */
export function downloadJsonBackup(state: SmartBizState): { filename: string; sizeBytes: number } {
  const nowStr = new Date().toISOString().slice(0, 10);
  const filename = `smartbiz_backup_${nowStr}_${Date.now().toString().slice(-4)}.json`;
  const jsonString = JSON.stringify(state, null, 2);
  const sizeBytes = new Blob([jsonString]).size;

  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { filename, sizeBytes };
}

/**
 * Generates and downloads a Monthly Stores Report CSV file
 */
export function downloadMonthlyReportCsv(state: SmartBizState): string {
  const sales = state.sales || [];
  const expenses = state.expenses || [];
  const products = state.products || [];
  const debtors = state.debtors || [];
  const business = state.business || { name: 'SmartBiz Merchant' };
  const currency = state.settings?.currencySymbol || '$';

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  const filteredSales = sales.filter(s => s && s.date && new Date(s.date) >= oneMonthAgo);
  const filteredExpenses = expenses.filter(e => e && e.date && new Date(e.date) >= oneMonthAgo);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.totalSale || 0), 0);
  const totalCost = filteredSales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  const grossProfit = totalRevenue - totalCost;
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const totalStockRetail = products.reduce((sum, p) => sum + (p.sellingPrice || 0) * (p.quantity || 0), 0);
  const totalDebtors = debtors.filter(d => d && (d.balanceOwed || 0) > 0).reduce((sum, d) => sum + (d.balanceOwed || 0), 0);

  const lines = [
    `"SmartBiz Pocket - Official Monthly Stores Performance Report"`,
    `"Business Name","${business.name}"`,
    `"Period","MONTHLY (Last 30 Days)"`,
    `"Generated At","${new Date().toLocaleString()}"`,
    '',
    `"FINANCIAL METRIC","AMOUNT (${currency})"`,
    `"Total Store Revenue (Sales In)","${totalRevenue.toFixed(2)}"`,
    `"Cost of Goods Sold (COGS)","${totalCost.toFixed(2)}"`,
    `"Gross Profit","${grossProfit.toFixed(2)}"`,
    `"Operating Expenses","${totalExpenses.toFixed(2)}"`,
    `"Net Profit","${netProfit.toFixed(2)}"`,
    `"Profit Margin","${profitMargin}%"`,
    `"Current Inventory Retail Valuation","${totalStockRetail.toFixed(2)}"`,
    `"Customer Credit Outstanding (Debtors)","${totalDebtors.toFixed(2)}"`,
    '',
    `"TOTAL TRANSACTIONS LOGGED"`,
    `"Sales Transactions","${filteredSales.length}"`,
    `"Expense Vouchers","${filteredExpenses.length}"`,
    `"Total Product Types in Stock","${products.length}"`,
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const filename = `smartbiz_monthly_stores_report_${new Date().toISOString().slice(0, 7)}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Checks and returns active system notifications based on current time,
 * date of the month, and subscription status.
 */
export function evaluateSystemNotifications(
  state: SmartBizState,
  options?: {
    forceSimulate?: 'end_of_day' | 'monthly_report' | 'backup' | 'countdown_10' | 'countdown_2' | 'countdown_0';
  }
): AppNotification[] {
  const notifications: AppNotification[] = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentDayOfMonth = now.getDate();
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysUntilMonthEnd = lastDayOfMonth - currentDayOfMonth;

  // 1. End of Day Sales Records Notification
  // Triggered in late afternoon/evening (>= 16:00 / 4 PM) or when forced
  const isEndOfDayTime = currentHour >= 16 || options?.forceSimulate === 'end_of_day';
  if (isEndOfDayTime) {
    const todayStr = now.toISOString().slice(0, 10);
    const salesList = state.sales || [];
    const todaySales = salesList.filter(s => s && s.date && s.date.startsWith(todayStr));
    const todayTotal = todaySales.reduce((sum, s) => sum + (s.totalSale || 0), 0);
    const currencySym = state.settings?.currencySymbol || '$';

    notifications.push({
      id: `eod-sales-${todayStr}`,
      type: 'end_of_day_sales',
      title: 'End of Day Sales Records',
      message:
        todaySales.length > 0
          ? `You have recorded ${todaySales.length} sale${todaySales.length === 1 ? '' : 's'} (${currencySym}${todayTotal.toFixed(2)}) today. Check your end of day sales records or enter any pending sales before closing shop.`
          : 'Check your end of day sales records or enter your sales records for the end of the day before closing trade.',
      createdAt: now.toISOString(),
      priority: 'normal',
      actionLabel: 'Record Sales',
      actionTab: 'sales',
    });
  }

  // 2. Monthly Records & Reports Notification
  // Triggered within 5 days of end of month or on month end or when forced
  const isEndOfMonth = daysUntilMonthEnd <= 5 || currentDayOfMonth === 1 || options?.forceSimulate === 'monthly_report';
  if (isEndOfMonth) {
    notifications.push({
      id: `monthly-report-${now.getFullYear()}-${now.getMonth() + 1}`,
      type: 'monthly_reports',
      title: 'Monthly Stores Records & Reports',
      message:
        'It is the end of the month! Create your Monthly Stores Report now, download the records, and keep them for business performance tracking and auditing.',
      createdAt: now.toISOString(),
      priority: 'high',
      actionLabel: 'Download Monthly Report',
      actionTab: 'reports',
    });
  }

  // 3. Subscription Expiry Renewal Notifications (ONLY for active Pro subscribers with 10 days, 2 days, or 0 days / today left)
  const isForcedCountdown = Boolean(options?.forceSimulate?.startsWith('countdown_'));

  if (state.settings.isPremium || isForcedCountdown) {
    let countdown = getSubscriptionCountdownStatus(state.settings);

    // If testing/simulating via options
    if (options?.forceSimulate === 'countdown_10') {
      countdown = {
        isPro: true,
        daysRemaining: 10,
        isTriggerDay: true,
        triggerDay: 10,
        message: 'Your SmartBiz Pro subscription is left with 10 days to expire, renew.',
        isExpired: false,
        expiryDateStr: '10 Days from today',
      };
    } else if (options?.forceSimulate === 'countdown_2') {
      countdown = {
        isPro: true,
        daysRemaining: 2,
        isTriggerDay: true,
        triggerDay: 2,
        message: 'Your SmartBiz Pro subscription is left with 2 days to expire, renew now to avoid service interruption.',
        isExpired: false,
        expiryDateStr: '2 Days from today',
      };
    } else if (options?.forceSimulate === 'countdown_0') {
      countdown = {
        isPro: true,
        daysRemaining: 0,
        isTriggerDay: true,
        triggerDay: 0,
        message: 'Your SmartBiz Pro subscription expires today, renew now.',
        isExpired: false,
        expiryDateStr: 'Expires Today',
      };
    }

    // Only fire notification if specifically on 10, 2, or 0 days left
    if (countdown.isTriggerDay) {
      const priority = countdown.daysRemaining <= 2 ? 'critical' : 'normal';

      notifications.push({
        id: `pro-sub-renewal-${countdown.daysRemaining}d-${now.toISOString().slice(0, 10)}`,
        type: 'subscription_countdown',
        title:
          countdown.daysRemaining === 0
            ? 'Pro Subscription: Expires Today!'
            : `Pro Subscription Notice: ${countdown.daysRemaining} Days Left`,
        message: countdown.message,
        createdAt: now.toISOString(),
        priority,
        actionLabel: 'Renew Pro ($2)',
        actionTab: 'settings',
        actionPayload: String(countdown.daysRemaining),
      });
    }
  }

  // 4. End of Month Backup Reminder Notification
  // Reminds user at the end of each month to backup data in Settings backup
  const isBackupTime = daysUntilMonthEnd <= 5 || options?.forceSimulate === 'backup';
  if (isBackupTime) {
    notifications.push({
      id: `eom-backup-${now.getFullYear()}-${now.getMonth() + 1}`,
      type: 'end_of_month_backup',
      title: 'End of Month Data Backup',
      message:
        'End of month safety reminder: Backup your store records in Settings Backup. Download your JSON backup file now for secure offline record keeping.',
      createdAt: now.toISOString(),
      priority: 'high',
      actionLabel: 'Download JSON Backup',
      actionTab: 'backup',
    });
  }

  return notifications;
}

/**
 * Requests browser Web Push / Notification permission gracefully
 */
export async function requestPushNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Sends a native browser push notification (if supported & permitted)
 */
export function sendPushNotification(title: string, body: string, icon = '/icon-192.png') {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
      });
    } catch (err) {
      console.warn('Browser notification failed:', err);
    }
  }
}
