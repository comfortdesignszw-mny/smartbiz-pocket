export type CurrencyCode = 'USD' | 'ZiG' | 'ZAR';

export interface Business {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  location: string;
  currency: CurrencyCode;
  businessType: 'tuckshop' | 'vendor' | 'salon' | 'mechanic' | 'retail' | 'general';
  createdAt: string;
  updatedAt: string;
}

export type InventoryItemType = 'product' | 'service';

export interface Product {
  id: string;
  name: string;
  itemType?: InventoryItemType; // 'product' (default) or 'service'
  servicePeriod?: string; // e.g. 'per session', 'per hour', 'per week', 'per month', 'per year', 'per stage', 'per project', 'flat fee'
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  supplier: string;
  minStock: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'sale' | 'restock' | 'adjustment' | 'return';
  quantityDelta: number;
  newQuantity: number;
  reason: string;
  date: string;
}

export type PaymentMethod = 'Cash USD' | 'EcoCash' | 'ZiG Cash' | 'Bank Card' | 'On Credit';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  itemType?: InventoryItemType;
  servicePeriod?: string;
  quantity: number;
  unitCostPrice: number;
  unitSellingPrice: number;
  totalSale: number;
  profit: number;
}

export interface Sale {
  id: string;
  date: string;
  items: SaleItem[];
  totalSale: number;
  totalCost: number;
  profit: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptNumber: string;
  isCreditSale: boolean;
}

export type ExpenseCategory =
  | 'Transport'
  | 'Rent'
  | 'ZESA'
  | 'Water'
  | 'Salary'
  | 'Internet'
  | 'Fuel'
  | 'Maintenance'
  | 'Packaging'
  | 'Other';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receiptPhoto?: string; // base64 or photo URL
  paymentMethod: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  totalPurchases: number;
  outstandingDebt: number;
  createdAt: string;
}

export interface Debtor {
  id: string;
  customerId?: string;
  customerName: string;
  phoneNumber: string;
  originalAmount: number;
  balanceOwed: number;
  date: string;
  dueDate?: string;
  notes?: string;
  status: 'Unpaid' | 'Partial' | 'Cleared';
  relatedSaleId?: string;
}

export interface PaymentRecord {
  id: string;
  debtorId: string;
  customerName: string;
  amount: number;
  date: string;
  notes?: string;
  paymentMethod: string;
  previousBalance: number;
  remainingBalance: number;
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  filename: string;
  sizeBytes: number;
  itemCounts: {
    products: number;
    sales: number;
    expenses: number;
    debtors: number;
    customers: number;
  };
}

export interface BusinessHealthInsight {
  id: string;
  type: 'positive' | 'warning' | 'alert' | 'tip';
  title: string;
  message: string;
  metric?: string;
  actionLabel?: string;
  actionTab?: string;
}

export interface AppSettings {
  pinLockEnabled: boolean;
  pinCode: string;
  isLocked: boolean;
  theme: 'light' | 'dark';
  currency: CurrencyCode;
  currencySymbol: string;
  lowStockThreshold: number;
  isPremium: boolean;
  subscriptionKey?: string;
  subscriptionExpiryDate?: string; // ISO timestamp when Pro expires (30 days from activation)
  subscriptionActivatedAt?: string;
  subscriptionPaymentMethod?: 'ecocash_ussd' | 'revenuecat' | 'admin_key';
  language: 'en' | 'sn' | 'nd'; // English, Shona, Ndebele
  notificationsEnabled: boolean;
  autoBackupInterval: 'daily' | 'weekly' | 'manual';
  lastBackupDate?: string;
}

export interface SmartBizState {
  business: Business;
  products: Product[];
  movements: InventoryMovement[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  debtors: Debtor[];
  payments: PaymentRecord[];
  backups: BackupMetadata[];
  settings: AppSettings;
}
