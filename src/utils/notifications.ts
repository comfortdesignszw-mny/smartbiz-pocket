import { SmartBizState, AppSettings, AppNotification } from '../types';

/**
 * Computes subscription countdown days left for Free plan / trial or Pro plan.
 * Detects explicitly if 10 days, 2 days, 1 day, or same day (0 days left).
 */
export function getSubscriptionCountdownStatus(settings: AppSettings): {
  daysRemaining: number;
  isTriggerDay: boolean; // True specifically for 10, 2, 1, or 0 days
  triggerDay: 10 | 2 | 1 | 0 | null;
  message: string;
  isExpired: boolean;
  expiryDateStr: string;
} {
  // Target expiry timestamp: check subscriptionExpiryDate, then freeTrialExpiryDate
  let targetDateStr = settings.subscriptionExpiryDate || settings.freeTrialExpiryDate;

  if (!targetDateStr) {
    // If none set, assume 10 days trial from first run
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 10);
    targetDateStr = defaultDate.toISOString();
  }

  const expiryTime = new Date(targetDateStr).getTime();
  const now = Date.now();
  const msRemaining = expiryTime - now;

  const daysRemaining = msRemaining <= 0 ? 0 : Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const isExpired = msRemaining <= 0;

  let triggerDay: 10 | 2 | 1 | 0 | null = null;
  let isTriggerDay = false;

  if (daysRemaining === 10) {
    triggerDay = 10;
    isTriggerDay = true;
  } else if (daysRemaining === 2) {
    triggerDay = 2;
    isTriggerDay = true;
  } else if (daysRemaining === 1) {
    triggerDay = 1;
    isTriggerDay = true;
  } else if (daysRemaining <= 0) {
    triggerDay = 0;
    isTriggerDay = true;
  }

  const expiryDateStr = new Date(expiryTime).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const message = `Your subscription is left with ${daysRemaining} days to expire, renew.`;

  return {
    daysRemaining,
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
  const { sales, expenses, products, debtors, settings, business } = state;
  const currency = settings.currencySymbol;

  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

  const filteredSales = sales.filter(s => new Date(s.date) >= oneMonthAgo);
  const filteredExpenses = expenses.filter(e => new Date(e.date) >= oneMonthAgo);

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalSale, 0);
  const totalCost = filteredSales.reduce((acc, s) => acc + s.totalCost, 0);
  const grossProfit = totalRevenue - totalCost;
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const totalStockRetail = products.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const totalDebtors = debtors.filter(d => d.balanceOwed > 0).reduce((sum, d) => sum + d.balanceOwed, 0);

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
    forceSimulate?: 'end_of_day' | 'monthly_report' | 'backup' | 'countdown_10' | 'countdown_2' | 'countdown_1' | 'countdown_0';
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
    const todaySales = state.sales.filter(s => s.date.startsWith(todayStr));
    const todayTotal = todaySales.reduce((sum, s) => sum + s.totalSale, 0);

    notifications.push({
      id: `eod-sales-${todayStr}`,
      type: 'end_of_day_sales',
      title: 'End of Day Sales Records',
      message:
        todaySales.length > 0
          ? `You have recorded ${todaySales.length} sale${todaySales.length === 1 ? '' : 's'} (${state.settings.currencySymbol}${todayTotal.toFixed(2)}) today. Check your end of day sales records or enter any pending sales before closing shop.`
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

  // 3. Subscription Expiry Countdown Notifications
  // Detects if 10 days, 2 days, 1 day, or same day (0 days) left
  let countdown = getSubscriptionCountdownStatus(state.settings);

  // If testing/simulating via options
  if (options?.forceSimulate?.startsWith('countdown_')) {
    const forcedDay = parseInt(options.forceSimulate.replace('countdown_', ''), 10);
    countdown = {
      daysRemaining: forcedDay,
      isTriggerDay: true,
      triggerDay: forcedDay as 10 | 2 | 1 | 0,
      message: `Your subscription is left with ${forcedDay} days to expire, renew.`,
      isExpired: forcedDay === 0,
      expiryDateStr: 'Simulated Target',
    };
  }

  if (countdown.isTriggerDay || !state.settings.isPremium) {
    const priority =
      countdown.daysRemaining <= 0
        ? 'critical'
        : countdown.daysRemaining <= 2
        ? 'critical'
        : countdown.daysRemaining <= 5
        ? 'high'
        : 'normal';

    notifications.push({
      id: `sub-countdown-${countdown.daysRemaining}d`,
      type: 'subscription_countdown',
      title:
        countdown.daysRemaining <= 0
          ? 'Subscription Expired'
          : `Subscription Notice: ${countdown.daysRemaining} Day${countdown.daysRemaining === 1 ? '' : 's'} Left`,
      message: countdown.message,
      createdAt: now.toISOString(),
      priority,
      actionLabel: 'Renew Pro ($2)',
      actionTab: 'settings',
      actionPayload: String(countdown.daysRemaining),
    });
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
