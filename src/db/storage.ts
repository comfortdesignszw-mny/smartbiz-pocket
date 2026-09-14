import {
  SmartBizState,
  Business,
  Product,
  Sale,
  Expense,
  Customer,
  Debtor,
  PaymentRecord,
  InventoryMovement,
  BackupMetadata,
  AppSettings,
  BusinessHealthInsight,
} from '../types';

const STORAGE_KEY = 'smartbiz_pocket_data_v2';

// 100% Clean Empty State for all new devices
export const INITIAL_STATE: SmartBizState = {
  business: {
    id: 'biz-01',
    name: '',
    ownerName: '',
    phone: '',
    location: '',
    currency: 'USD',
    businessType: 'retail',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  products: [],
  movements: [],
  sales: [],
  expenses: [],
  customers: [],
  debtors: [],
  payments: [],
  backups: [],
  settings: {
    pinLockEnabled: false,
    pinCode: '1234',
    isLocked: false,
    theme: 'light',
    currency: 'USD',
    currencySymbol: '$',
    lowStockThreshold: 5,
    isPremium: false,
    adminPin: '1234',
    language: 'en',
    notificationsEnabled: true,
    autoBackupInterval: 'daily',
    lastBackupDate: new Date().toISOString(),
  },
  subscriptionRecords: [],
};

export function loadSmartBizState(): SmartBizState {
  try {
    // If previous v1 sample database is still present, clear it to start clean on empty state
    if (localStorage.getItem('smartbiz_pocket_data_v1')) {
      localStorage.removeItem('smartbiz_pocket_data_v1');
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveSmartBizState(INITIAL_STATE);
      return INITIAL_STATE;
    }
    const parsed = JSON.parse(raw);
    const storedSettings = parsed.settings || {};

    // Check if subscription has expired (past 30 days)
    let isPremiumActive = storedSettings.isPremium || false;
    if (isPremiumActive && storedSettings.subscriptionExpiryDate) {
      const expiryTime = new Date(storedSettings.subscriptionExpiryDate).getTime();
      if (expiryTime <= Date.now()) {
        isPremiumActive = false;
      }
    }

    return {
      ...INITIAL_STATE,
      ...parsed,
      settings: {
        ...INITIAL_STATE.settings,
        ...storedSettings,
        isPremium: isPremiumActive,
        isLocked: storedSettings.pinLockEnabled ? true : false,
      },
    };
  } catch (err) {
    console.error('Failed to load local SmartBiz state, restoring defaults:', err);
    return INITIAL_STATE;
  }
}

export function saveSmartBizState(state: SmartBizState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

// Rule-based business health insight engine
export function generateHealthInsights(state: SmartBizState): BusinessHealthInsight[] {
  const insights: BusinessHealthInsight[] = [];
  const now = new Date();
  const todayStr = now.toDateString();

  // Subscription Expiry Alerts (5 Days and 2 Days)
  if (state.settings.isPremium && state.settings.subscriptionExpiryDate) {
    const msRemaining = new Date(state.settings.subscriptionExpiryDate).getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    if (msRemaining <= 0) {
      insights.push({
        id: 'ins-sub-expired',
        type: 'alert',
        title: 'Pro Subscription Expired',
        message: 'Your 30-day Pro plan has expired. Reactivate for $2.00 via EcoCash to restore unlimited sales.',
        actionLabel: 'Reactivate Pro',
        actionTab: 'settings',
      });
    } else if (daysRemaining <= 2) {
      insights.push({
        id: 'ins-sub-2d-alert',
        type: 'alert',
        title: `🚨 Urgent: Pro Expires in ${daysRemaining === 1 ? '1 Day' : '2 Days'}!`,
        message: `Your 30-day SmartBiz Pro subscription will expire in ${daysRemaining} days. Dial *151*1*1*0772824132*2# ($2.00) to renew uninterrupted.`,
        metric: `${daysRemaining}d left`,
        actionLabel: 'Renew Subscription',
        actionTab: 'settings',
      });
    } else if (daysRemaining <= 5) {
      insights.push({
        id: 'ins-sub-5d-alert',
        type: 'warning',
        title: `⚠️ Pro Renewal Notice: ${daysRemaining} Days Left`,
        message: `Your 30-day SmartBiz Pro plan expires in ${daysRemaining} days. Get your renewal key from Comfort Designs in advance.`,
        metric: `${daysRemaining}d left`,
        actionLabel: 'Renew Subscription',
        actionTab: 'settings',
      });
    }
  }

  // 0. Catalog Onboarding check
  if (state.products.length === 0) {
    insights.push({
      id: 'ins-empty-catalog',
      type: 'tip',
      title: 'Ready for Business Setup',
      message: 'Add your first product or service to start tracking stock, recording sales, and seeing profit margins.',
      actionLabel: 'Add First Item',
      actionTab: 'stock',
    });
  }

  // 1. Debtors check
  const activeDebtors = state.debtors.filter(d => d.balanceOwed > 0);
  const totalOwed = activeDebtors.reduce((sum, d) => sum + d.balanceOwed, 0);
  if (totalOwed > 0) {
    const topDebtor = [...activeDebtors].sort((a, b) => b.balanceOwed - a.balanceOwed)[0];
    insights.push({
      id: 'ins-debt',
      type: 'warning',
      title: 'Money on the Street',
      message: `${activeDebtors.length} people owe you $${totalOwed.toFixed(2)}. ${topDebtor.customerName} owes the most ($${topDebtor.balanceOwed.toFixed(2)}). Send a WhatsApp reminder with 1 tap.`,
      metric: `$${totalOwed.toFixed(2)}`,
      actionLabel: 'View Debtors',
      actionTab: 'debtors',
    });
  }

  // 2. Low stock alert (physical products only)
  const lowStockItems = state.products.filter(p => p.itemType !== 'service' && p.quantity <= p.minStock);
  if (lowStockItems.length > 0) {
    const itemNames = lowStockItems.slice(0, 2).map(p => p.name).join(', ');
    insights.push({
      id: 'ins-stock',
      type: 'alert',
      title: 'Low Stock Alert',
      message: `${lowStockItems.length} product(s) are running out soon (${itemNames}${lowStockItems.length > 2 ? ` and ${lowStockItems.length - 2} more` : ''}). Restock now to avoid missed sales.`,
      metric: `${lowStockItems.length} items`,
      actionLabel: 'Restock Inventory',
      actionTab: 'stock',
    });
  }

  // 3. Today's Profit vs Sales
  const todaySales = state.sales.filter(s => new Date(s.date).toDateString() === todayStr);
  const todayTotalSales = todaySales.reduce((acc, s) => acc + s.totalSale, 0);
  const todayProfit = todaySales.reduce((acc, s) => acc + s.profit, 0);
  const todayExpenses = state.expenses
    .filter(e => new Date(e.date).toDateString() === todayStr)
    .reduce((acc, e) => acc + e.amount, 0);

  const netToday = todayProfit - todayExpenses;
  if (todayTotalSales > 0) {
    const margin = Math.round((todayProfit / todayTotalSales) * 100);
    insights.push({
      id: 'ins-sales-today',
      type: netToday >= 0 ? 'positive' : 'warning',
      title: netToday >= 0 ? 'Profitable Day So Far' : 'Expenses Exceeding Profit Today',
      message: `You made $${todayTotalSales.toFixed(2)} across ${todaySales.length} sale(s) today with a gross margin of ${margin}%. Net earnings after today's expenses is $${netToday.toFixed(2)}.`,
      metric: `$${netToday.toFixed(2)} net`,
      actionLabel: 'View Performance',
      actionTab: 'reports',
    });
  } else {
    insights.push({
      id: 'ins-no-sales',
      type: 'tip',
      title: 'Ready for Today\'s Trade',
      message: 'No sales recorded yet today. Tap "+ Sale" to record cash or EcoCash transactions in seconds.',
      actionLabel: 'Record First Sale',
      actionTab: 'sales',
    });
  }

  // 4. Expense concentration (e.g., ZESA or Transport)
  const totalExp = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  if (totalExp > 0) {
    const zesaTotal = state.expenses.filter(e => e.category === 'ZESA').reduce((sum, e) => sum + e.amount, 0);
    const transportTotal = state.expenses.filter(e => e.category === 'Transport').reduce((sum, e) => sum + e.amount, 0);
    
    if (zesaTotal / totalExp > 0.35) {
      insights.push({
        id: 'ins-zesa',
        type: 'warning',
        title: 'Electricity (ZESA) is Your Highest Expense',
        message: `ZESA tokens took $${zesaTotal.toFixed(2)} (${Math.round((zesaTotal / totalExp) * 100)}% of all expenses). Ensure deep freezers are energy-efficient.`,
        metric: `${Math.round((zesaTotal / totalExp) * 100)}% of costs`,
      });
    } else if (transportTotal / totalExp > 0.3) {
      insights.push({
        id: 'ins-transport',
        type: 'tip',
        title: 'Stock Travel Costs Notice',
        message: `Kombi & transport trips to market totaled $${transportTotal.toFixed(2)}. Bulk-buying trips twice a week saves up to $15/month in fares.`,
        metric: `$${transportTotal.toFixed(2)}`,
      });
    }
  }

  // 5. Best Selling item
  const productSalesMap = new Map<string, { name: string; count: number; rev: number }>();
  state.sales.forEach(sale => {
    sale.items.forEach(item => {
      const current = productSalesMap.get(item.productId) || { name: item.productName, count: 0, rev: 0 };
      current.count += item.quantity;
      current.rev += item.totalSale;
      productSalesMap.set(item.productId, current);
    });
  });

  const bestSeller = Array.from(productSalesMap.values()).sort((a, b) => b.count - a.count)[0];
  if (bestSeller) {
    insights.push({
      id: 'ins-bestseller',
      type: 'positive',
      title: 'Top Fast Mover',
      message: `${bestSeller.name} is your #1 popular product with ${bestSeller.count} units sold bringing $${bestSeller.rev.toFixed(2)} in revenue!`,
      metric: `${bestSeller.count} sold`,
      actionLabel: 'Check Stock',
      actionTab: 'stock',
    });
  }

  return insights;
}
