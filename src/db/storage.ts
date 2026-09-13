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

const STORAGE_KEY = 'smartbiz_pocket_data_v1';

export const INITIAL_STATE: SmartBizState = {
  business: {
    id: 'biz-01',
    name: 'Matopos Corner Tuckshop',
    ownerName: 'Tariro Moyo',
    phone: '+263 77 245 8912',
    location: 'Shop 4, Market Square, Harare',
    currency: 'USD',
    businessType: 'tuckshop',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  products: [
    {
      id: 'prod-01',
      name: 'Mazoe Orange Crush 2L',
      category: 'Drinks',
      costPrice: 2.8,
      sellingPrice: 3.5,
      quantity: 14,
      supplier: 'Schweppes Depot',
      minStock: 5,
      unit: 'bottle',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-02',
      name: 'Cooking Oil Pure Drop 2L',
      category: 'Groceries',
      costPrice: 3.2,
      sellingPrice: 4.2,
      quantity: 8,
      supplier: 'National Foods',
      minStock: 6,
      unit: 'bottle',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-03',
      name: 'Huletts White Sugar 2kg',
      category: 'Groceries',
      costPrice: 2.1,
      sellingPrice: 2.8,
      quantity: 3, // low stock!
      supplier: 'Tongaat Hulett',
      minStock: 8,
      unit: 'pack',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-04',
      name: 'Probrands Brown Rice 2kg',
      category: 'Groceries',
      costPrice: 1.9,
      sellingPrice: 2.6,
      quantity: 12,
      supplier: 'Probrands',
      minStock: 5,
      unit: 'pack',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-05',
      name: 'Lobels Fresh White Bread',
      category: 'Bakery',
      costPrice: 0.85,
      sellingPrice: 1.1,
      quantity: 18,
      supplier: 'Lobels Bread',
      minStock: 10,
      unit: 'loaf',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-06',
      name: 'Farm Fresh Large Eggs (Crate 30)',
      category: 'Fresh',
      costPrice: 3.8,
      sellingPrice: 4.8,
      quantity: 2, // low stock!
      supplier: 'Irvines Day Old',
      minStock: 4,
      unit: 'crate',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-07',
      name: 'Econet Airtime $1 USD PIN',
      category: 'Airtime',
      costPrice: 0.9,
      sellingPrice: 1.0,
      quantity: 45,
      supplier: 'Econet Dealer',
      minStock: 15,
      unit: 'pin',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-08',
      name: 'Gloria Self Raising Flour 2kg',
      itemType: 'product',
      category: 'Groceries',
      costPrice: 2.0,
      sellingPrice: 2.7,
      quantity: 9,
      supplier: 'National Foods',
      minStock: 5,
      unit: 'pack',
      createdAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'prod-09',
      name: 'Website Development & Maintenance',
      itemType: 'service',
      servicePeriod: 'per stage',
      category: 'Services',
      costPrice: 50.0,
      sellingPrice: 250.0,
      quantity: 0,
      supplier: 'In-House Tech',
      minStock: 0,
      unit: 'per stage',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  movements: [
    {
      id: 'mov-01',
      productId: 'prod-03',
      productName: 'Huletts White Sugar 2kg',
      type: 'sale',
      quantityDelta: -2,
      newQuantity: 3,
      reason: 'Sale #RCP-1002',
      date: new Date().toISOString(),
    },
    {
      id: 'mov-02',
      productId: 'prod-06',
      productName: 'Farm Fresh Large Eggs (Crate 30)',
      type: 'sale',
      quantityDelta: -1,
      newQuantity: 2,
      reason: 'Sale #RCP-1001',
      date: new Date().toISOString(),
    },
  ],
  sales: [
    {
      id: 'sale-01',
      date: new Date().toISOString(),
      items: [
        {
          id: 'item-01',
          productId: 'prod-06',
          productName: 'Farm Fresh Large Eggs (Crate 30)',
          quantity: 1,
          unitCostPrice: 3.8,
          unitSellingPrice: 4.8,
          totalSale: 4.8,
          profit: 1.0,
        },
        {
          id: 'item-02',
          productId: 'prod-05',
          productName: 'Lobels Fresh White Bread',
          quantity: 2,
          unitCostPrice: 0.85,
          unitSellingPrice: 1.1,
          totalSale: 2.2,
          profit: 0.5,
        },
      ],
      totalSale: 7.0,
      totalCost: 5.5,
      profit: 1.5,
      customerId: 'cust-01',
      customerName: 'Mai Panashe',
      paymentMethod: 'Cash USD',
      notes: 'Morning groceries',
      receiptNumber: 'RCP-1001',
      isCreditSale: false,
    },
    {
      id: 'sale-02',
      date: new Date().toISOString(),
      items: [
        {
          id: 'item-03',
          productId: 'prod-03',
          productName: 'Huletts White Sugar 2kg',
          quantity: 2,
          unitCostPrice: 2.1,
          unitSellingPrice: 2.8,
          totalSale: 5.6,
          profit: 1.4,
        },
        {
          id: 'item-04',
          productId: 'prod-01',
          productName: 'Mazoe Orange Crush 2L',
          quantity: 1,
          unitCostPrice: 2.8,
          unitSellingPrice: 3.5,
          totalSale: 3.5,
          profit: 0.7,
        },
      ],
      totalSale: 9.1,
      totalCost: 7.0,
      profit: 2.1,
      customerId: 'cust-02',
      customerName: 'Baba Tinashe',
      paymentMethod: 'EcoCash',
      notes: 'EcoCash ref: EC984218',
      receiptNumber: 'RCP-1002',
      isCreditSale: false,
    },
    {
      id: 'sale-03',
      date: new Date(Date.now() - 86400000).toISOString(),
      items: [
        {
          id: 'item-05',
          productId: 'prod-02',
          productName: 'Cooking Oil Pure Drop 2L',
          quantity: 2,
          unitCostPrice: 3.2,
          unitSellingPrice: 4.2,
          totalSale: 8.4,
          profit: 2.0,
        },
        {
          id: 'item-06',
          productId: 'prod-07',
          productName: 'Econet Airtime $1 USD PIN',
          quantity: 5,
          unitCostPrice: 0.9,
          unitSellingPrice: 1.0,
          totalSale: 5.0,
          profit: 0.5,
        },
      ],
      totalSale: 13.4,
      totalCost: 10.9,
      profit: 2.5,
      customerId: 'cust-03',
      customerName: 'Tendai Mutasa',
      paymentMethod: 'Cash USD',
      notes: 'Yesterday afternoon sale',
      receiptNumber: 'RCP-1000',
      isCreditSale: false,
    },
  ],
  expenses: [
    {
      id: 'exp-01',
      date: new Date().toISOString(),
      category: 'Transport',
      amount: 2.5,
      description: 'Kombi fare to Mbare Musika for fresh stock pick up',
      paymentMethod: 'Cash USD',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'exp-02',
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      category: 'ZESA',
      amount: 15.0,
      description: 'ZESA Electricity prepaid token for shop fridge',
      paymentMethod: 'EcoCash',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 'exp-03',
      date: new Date(Date.now() - 5 * 86400000).toISOString(),
      category: 'Packaging',
      amount: 3.0,
      description: 'Khaki bread bags & plastic carriers (100 pack)',
      paymentMethod: 'Cash USD',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
  ],
  customers: [
    {
      id: 'cust-01',
      name: 'Mai Panashe',
      phone: '+263 77 123 4567',
      address: 'House 42, Ward 3, Highfield',
      notes: 'Buys bread and eggs every morning. Very reliable.',
      totalPurchases: 48.5,
      outstandingDebt: 12.0,
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    },
    {
      id: 'cust-02',
      name: 'Baba Tinashe',
      phone: '+263 71 987 6543',
      address: 'Block 6B, Old Market, Harare',
      notes: 'Local mechanic shop owner. Takes Mazoe & cooking oil.',
      totalPurchases: 94.0,
      outstandingDebt: 25.0,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      id: 'cust-03',
      name: 'Tendai Mutasa',
      phone: '+263 73 456 7890',
      address: 'Stand 110, Glen View 1',
      notes: 'Airtime wholesale and weekend supplies.',
      totalPurchases: 62.0,
      outstandingDebt: 0.0,
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
  ],
  debtors: [
    {
      id: 'deb-01',
      customerId: 'cust-01',
      customerName: 'Mai Panashe',
      phoneNumber: '+263 77 123 4567',
      originalAmount: 15.0,
      balanceOwed: 12.0,
      date: new Date(Date.now() - 4 * 86400000).toISOString(),
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
      notes: 'Groceries on credit. Paid $3 on Wednesday.',
      status: 'Partial',
    },
    {
      id: 'deb-02',
      customerId: 'cust-02',
      customerName: 'Baba Tinashe',
      phoneNumber: '+263 71 987 6543',
      originalAmount: 25.0,
      balanceOwed: 25.0,
      date: new Date(Date.now() - 10 * 86400000).toISOString(),
      dueDate: new Date(Date.now() + 1 * 86400000).toISOString(),
      notes: 'Mazoe crate + 2x Cooking oil. Promised Friday pay.',
      status: 'Unpaid',
    },
  ],
  payments: [
    {
      id: 'pay-01',
      debtorId: 'deb-01',
      customerName: 'Mai Panashe',
      amount: 3.0,
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
      notes: 'Part payment cash USD',
      paymentMethod: 'Cash USD',
      previousBalance: 15.0,
      remainingBalance: 12.0,
    },
  ],
  backups: [
    {
      id: 'bak-01',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      filename: 'smartbiz_backup_2026_09_12.json',
      sizeBytes: 14280,
      itemCounts: {
        products: 8,
        sales: 3,
        expenses: 3,
        debtors: 2,
        customers: 3,
      },
    },
  ],
  settings: {
    pinLockEnabled: false,
    pinCode: '1234',
    isLocked: false,
    theme: 'light',
    currency: 'USD',
    currencySymbol: '$',
    lowStockThreshold: 5,
    isPremium: false,
    language: 'en',
    notificationsEnabled: true,
    autoBackupInterval: 'daily',
    lastBackupDate: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
};

export function loadSmartBizState(): SmartBizState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveSmartBizState(INITIAL_STATE);
      return INITIAL_STATE;
    }
    const parsed = JSON.parse(raw);
    return {
      ...INITIAL_STATE,
      ...parsed,
      settings: {
        ...INITIAL_STATE.settings,
        ...(parsed.settings || {}),
        isLocked: parsed.settings?.pinLockEnabled ? true : false,
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
